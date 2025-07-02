import  sql  from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const companies = await sql.query(`
      SELECT 
        c.*,
        COUNT(d.id) as deal_count,
        COALESCE(SUM(d.deal_value), 0) as total_opportunity_value
      FROM companies c
      LEFT JOIN deals d ON c.id = d.company_id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `)

    return NextResponse.json(companies)
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to fetch companies" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, industry, company_size, region, business_challenges } = body

    // Validate required fields
    if (!name || !industry || !company_size || !region) {
      return NextResponse.json(
        { error: "Missing required fields: name, industry, company_size, region" },
        { status: 400 },
      )
    }

    // Insert new company
    const result = await sql.query(
      `
      INSERT INTO companies (name, industry, company_size, region, business_challenges, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
      [name, industry, company_size, region, business_challenges, 1]
    )

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.error("Database error:", error)

    // Handle duplicate company name
    if ((error as any).code === "23505") {
      return NextResponse.json({ error: "A company with this name already exists" }, { status: 409 })
    }

    return NextResponse.json({ error: "Failed to create company" }, { status: 500 })
  }
}
