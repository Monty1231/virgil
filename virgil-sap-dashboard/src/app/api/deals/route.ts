import sql from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    console.log("Fetching deals from database...");

    const deals = await sql.query(`
      SELECT 
        d.id,
        d.deal_name,
        d.stage,
        d.deal_value,
        d.notes,
        d.last_activity,
        d.expected_close_date,
        c.name as company_name,
        u.name as ae_name
      FROM deals d
      LEFT JOIN companies c ON d.company_id = c.id
      LEFT JOIN users u ON d.ae_assigned = u.id
      ORDER BY d.last_activity DESC
    `);

    console.log("Database query result:", deals);
    console.log("Number of deals found:", deals.rows.length);

    // Log the first few deals to see their structure
    if (deals.rows.length > 0) {
      console.log(
        "Sample deal data:",
        deals.rows.slice(0, 3).map((deal) => ({
          id: deal.id,
          deal_name: deal.deal_name,
          deal_value: deal.deal_value,
          deal_value_type: typeof deal.deal_value,
          stage: deal.stage,
        }))
      );
    }

    // Ensure we always return an array
    const dealsArray = Array.isArray(deals.rows) ? deals.rows : [];

    return NextResponse.json(dealsArray);
  } catch (error) {
    console.error("Database error in /api/deals:", error);

    // Return empty array with error info for debugging
    return NextResponse.json(
      {
        error: "Failed to fetch deals",
        details: error instanceof Error ? error.message : "Unknown error",
        deals: [], // Include empty deals array for fallback
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      company_name,
      ae_name,
      deal_name,
      stage,
      deal_value,
      notes,
      expected_close_date,
    } = body;

    console.log("Creating new deal:", body);

    // Validate required fields
    if (!company_name || !deal_name || !stage) {
      return NextResponse.json(
        { error: "Missing required fields: company_name, deal_name, stage" },
        { status: 400 }
      );
    }

    // Look up company ID by name
    let company_id;
    if (company_name) {
      const companyResult = await sql.query(
        "SELECT id FROM companies WHERE name = $1",
        [company_name]
      );

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
    }

    // Look up user ID by name
    let ae_assigned = 1; // Default to user ID 1 if no AE specified
    if (ae_name) {
      const userResult = await sql.query(
        "SELECT id FROM users WHERE name = $1",
        [ae_name]
      );

      if (userResult.rows.length > 0) {
        ae_assigned = userResult.rows[0].id;
        console.log("Found AE with ID:", ae_assigned);
      } else {
        console.log("AE not found, using default ID:", ae_assigned);
      }
    }

    const result = await sql.query(
      `
      INSERT INTO deals (company_id, deal_name, stage, deal_value, ae_assigned, notes, expected_close_date, last_activity)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING *
      `,
      [
        company_id,
        deal_name,
        stage,
        deal_value || 0,
        ae_assigned,
        notes || "",
        expected_close_date,
      ]
    );

    console.log("Deal created:", result.rows[0]);

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error("Database error creating deal:", error);
    return NextResponse.json(
      {
        error: "Failed to create deal",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
