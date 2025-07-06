import { type NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    console.log("🔄 PATCH /api/deals/[id] - Starting update...");

    const { id } = await context.params;
    console.log("📝 Deal ID:", id);

    if (!id) {
      console.error("❌ Deal ID is required");
      return NextResponse.json(
        { error: "Deal ID is required" },
        { status: 400 }
      );
    }

    let body;
    try {
      body = await request.json();
      console.log("📝 Request body:", body);
    } catch (parseError) {
      console.error("❌ Failed to parse request body:", parseError);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    // Check if this is a stage-only update (for drag and drop)
    if (body.stage && Object.keys(body).length === 1) {
      const { stage } = body;

      if (!stage) {
        console.error("❌ Stage is required in request body");
        return NextResponse.json(
          { error: "Stage is required" },
          { status: 400 }
        );
      }

      // Ensure exact case matching for all stages including "Closed"
      const validStages = [
        "Discovery",
        "Proposal",
        "Demo",
        "Negotiation",
        "Closed-Won",
      ];
      const normalizedStage = String(stage).trim(); // Ensure it's a string and remove whitespace

      console.log(
        "🔍 Validating stage:",
        normalizedStage,
        "against valid stages:",
        validStages
      );

      if (!validStages.includes(normalizedStage)) {
        console.error(
          "❌ Invalid stage:",
          normalizedStage,
          "Valid stages:",
          validStages
        );
        return NextResponse.json(
          {
            error: `Invalid stage: "${normalizedStage}". Valid stages are: ${validStages.join(
              ", "
            )}`,
            received: normalizedStage,
            receivedType: typeof stage,
            valid: validStages,
          },
          { status: 400 }
        );
      }

      console.log(
        "🔄 Executing UPDATE query for deal ID:",
        id,
        "to stage:",
        normalizedStage
      );

      // First check if the deal exists
      const existingDealResult = await sql.query(
        "SELECT id, stage FROM deals WHERE id = $1",
        [id]
      );
      const existingDeal = existingDealResult.rows;

      if (existingDeal.length === 0) {
        console.error("❌ Deal not found with ID:", id);
        return NextResponse.json(
          { error: `Deal with ID ${id} not found` },
          { status: 404 }
        );
      }

      console.log("✅ Found existing deal:", existingDeal[0]);
      const updateResult = await sql.query(
        "UPDATE deals SET stage = $1, last_activity = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
        [normalizedStage, id]
      );

      console.log("📊 Update query result:", updateResult.rows);

      if (updateResult.rows.length === 0) {
        console.error("❌ Update failed - no rows affected for ID:", id);
        return NextResponse.json(
          { error: "Update failed - deal not found" },
          { status: 404 }
        );
      }

      console.log(
        "✅ Deal updated successfully to stage:",
        updateResult.rows[0].stage
      );
      return NextResponse.json(updateResult.rows[0]);
    }

    // Handle full deal update (for edit dialog)
    const {
      deal_name,
      company_name,
      ae_name,
      deal_value,
      stage,
      notes,
      priority,
    } = body;

    console.log("🔄 Executing full UPDATE query for deal ID:", id);

    // First check if the deal exists
    const existingDealResult = await sql.query(
      "SELECT id FROM deals WHERE id = $1",
      [id]
    );

    if (existingDealResult.rows.length === 0) {
      console.error("❌ Deal not found with ID:", id);
      return NextResponse.json(
        { error: `Deal with ID ${id} not found` },
        { status: 404 }
      );
    }

    // Update company if company_name changed
    if (company_name) {
      const companyResult = await sql.query(
        "SELECT id FROM companies WHERE name = $1",
        [company_name]
      );

      let company_id;
      if (companyResult.rows.length === 0) {
        // Create the company if it doesn't exist
        const newCompanyResult = await sql.query(
          "INSERT INTO companies (name, industry, company_size, region) VALUES ($1, $2, $3, $4) RETURNING id",
          [company_name, "Unknown", "Unknown", "Unknown"]
        );
        company_id = newCompanyResult.rows[0].id;
        console.log("Created new company with ID:", company_id);
      } else {
        company_id = companyResult.rows[0].id;
        console.log("Found existing company with ID:", company_id);
      }

      // Update the deal's company_id
      await sql.query("UPDATE deals SET company_id = $1 WHERE id = $2", [
        company_id,
        id,
      ]);
    }

    // Update user if ae_name changed
    if (ae_name) {
      const userResult = await sql.query(
        "SELECT id FROM users WHERE name = $1",
        [ae_name]
      );

      let ae_assigned = 1; // Default to user ID 1 if no AE specified
      if (userResult.rows.length > 0) {
        ae_assigned = userResult.rows[0].id;
        console.log("Found AE with ID:", ae_assigned);
      } else {
        console.log("AE not found, using default ID:", ae_assigned);
      }

      // Update the deal's ae_assigned
      await sql.query("UPDATE deals SET ae_assigned = $1 WHERE id = $2", [
        ae_assigned,
        id,
      ]);
    }

    // Update the deal with all other fields
    const updateResult = await sql.query(
      `UPDATE deals SET 
        deal_name = COALESCE($1, deal_name),
        deal_value = COALESCE($2, deal_value),
        stage = COALESCE($3, stage),
        notes = COALESCE($4, notes),
        priority = COALESCE($5, priority),
        last_activity = CURRENT_TIMESTAMP
       WHERE id = $6 RETURNING *`,
      [deal_name, deal_value, stage, notes, priority, id]
    );

    console.log("📊 Full update query result:", updateResult.rows);

    if (updateResult.rows.length === 0) {
      console.error("❌ Update failed - no rows affected for ID:", id);
      return NextResponse.json(
        { error: "Update failed - deal not found" },
        { status: 404 }
      );
    }

    // Fetch the complete updated deal with company and user names
    const completeDealResult = await sql.query(
      `
      SELECT 
        d.id,
        d.deal_name,
        d.stage,
        d.deal_value,
        d.notes,
        d.last_activity,
        d.expected_close_date,
        d.priority,
        c.name as company_name,
        u.name as ae_name
      FROM deals d
      LEFT JOIN companies c ON d.company_id = c.id
      LEFT JOIN users u ON d.ae_assigned = u.id
      WHERE d.id = $1
    `,
      [id]
    );

    console.log("✅ Deal updated successfully:", completeDealResult.rows[0]);
    return NextResponse.json(completeDealResult.rows[0]);
  } catch (error) {
    console.error("❌ Error updating deal:", error);

    // Provide more detailed error information
    const errorDetails = {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : "UnknownError",
    };

    return NextResponse.json(
      {
        error: "Failed to update deal",
        details: errorDetails.message,
        debugInfo:
          process.env.NODE_ENV === "development" ? errorDetails : undefined,
      },
      { status: 500 }
    );
  }
}
