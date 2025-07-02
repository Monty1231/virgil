import sql from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("Fetching deals from database...")

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
    `)

    console.log("Database query result:", deals)
    console.log("Number of deals found:", deals.rows.length)

    // Ensure we always return an array
    const dealsArray = Array.isArray(deals.rows) ? deals.rows : []

    return NextResponse.json(dealsArray)
  } catch (error) {
    console.error("Database error in /api/deals:", error)

    // Return empty array with error info for debugging
    return NextResponse.json(
      {
        error: "Failed to fetch deals",
        details: error instanceof Error ? error.message : "Unknown error",
        deals: [], // Include empty deals array for fallback
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { company_id, deal_name, stage, deal_value, ae_assigned, notes, expected_close_date } = body

    console.log("Creating new deal:", body)

    // Validate required fields
    if (!company_id || !deal_name || !stage) {
      return NextResponse.json({ error: "Missing required fields: company_id, deal_name, stage" }, { status: 400 })
    }

    const result = await sql.query(
      `
      INSERT INTO deals (company_id, deal_name, stage, deal_value, ae_assigned, notes, expected_close_date, last_activity)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING *
      `,
      [company_id, deal_name, stage, deal_value || 0, ae_assigned || 1, notes || "", expected_close_date]
    )

    console.log("Deal created:", result.rows[0])

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.error("Database error creating deal:", error)
    return NextResponse.json({ error: "Failed to create deal" }, { status: 500 })
  }
}
