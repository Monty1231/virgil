import sql from "@/lib/db";
import { NextResponse } from "next/server";
import { knowledgeBase } from "@/lib/knowledge-base";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and active
    if (!session?.user?.isActive || session?.user?.id === "0") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Fetching deals from database...");

    const deals = await sql.query(
      `
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
      WHERE d.ae_assigned = $1
      ORDER BY d.last_activity DESC
    `,
      [session.user.id]
    );

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
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and active
    if (!session?.user?.isActive || session?.user?.id === "0") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    // Look up company ID by name (only companies created by current user)
    let company_id;
    if (company_name) {
      const companyResult = await sql.query(
        "SELECT id FROM companies WHERE name = $1 AND created_by = $2",
        [company_name, session.user.id]
      );

      if (companyResult.rows.length === 0) {
        // Create the company if it doesn't exist
        const newCompanyResult = await sql.query(
          "INSERT INTO companies (name, industry, company_size, region, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING id",
          [company_name, "Unknown", "Unknown", "Unknown", session.user.id]
        );
        company_id = newCompanyResult.rows[0].id;
        console.log("Created new company with ID:", company_id);
      } else {
        company_id = companyResult.rows[0].id;
        console.log("Found existing company with ID:", company_id);
      }
    }

    // Use current user as the AE assigned
    const ae_assigned = session.user.id;

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

    // Update company data in RAG knowledge base
    try {
      console.log("🔄 Deals API: Updating company in RAG knowledge base...");
      await knowledgeBase.initialize(); // Ensure knowledge base is initialized

      // Remove existing company data and add updated data
      await knowledgeBase.removeCompanyFromKnowledgeBase(company_id);
      const chunksAdded = await knowledgeBase.addCompanyToKnowledgeBase(
        company_id
      );
      console.log(
        "🔄 Deals API: Updated company in RAG knowledge base with",
        chunksAdded,
        "chunks"
      );
    } catch (ragError) {
      console.error(
        "🔄 Deals API: Failed to update company in RAG knowledge base:",
        ragError
      );
      // Don't fail the request for RAG issues - deal is still created successfully
    }

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
