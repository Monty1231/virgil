import sql from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("🏢 API: Fetching companies from database...")

    // Simple, direct query to get all companies
    const { rows: companies } = await sql.query(`
      SELECT 
        id,
        name,
        industry,
        company_size,
        region,
        created_at
      FROM companies
      ORDER BY name ASC
    `)

    console.log("🏢 API: Raw database result:", companies)
    console.log("🏢 API: Result type:", typeof companies, "Is array:", Array.isArray(companies))
    console.log("🏢 API: Number of companies:", companies?.length || 0)

    // Log each company for debugging
    if (Array.isArray(companies) && companies.length > 0) {
      console.log("🏢 API: Company details:")
      companies.forEach((company, index) => {
        console.log(`  ${index + 1}. ID: ${company.id}, Name: "${company.name}", Industry: "${company.industry}"`)
      })
    }

    // Always return an array, even if empty
    const result = Array.isArray(companies) ? companies : []

    console.log("🏢 API: Returning", result.length, "companies")
    return NextResponse.json(result)
  } catch (error) {
    console.error("🏢 API: Database error:", error)
    console.error("🏢 API: Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      code: typeof error === "object" && error !== null && "code" in error ? (error as any).code : undefined,
      stack: error instanceof Error ? error.stack?.substring(0, 500) : undefined,
    })

    // Return empty array on error so the UI doesn't break
    return NextResponse.json([], { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, industry, company_size, region, business_challenges } = body

    console.log("🏢 API: Creating new company:", { name, industry, company_size, region })

    // Validate required fields
    if (!name || !industry || !company_size || !region) {
      return NextResponse.json(
        { error: "Missing required fields: name, industry, company_size, region" },
        { status: 400 },
      )
    }

    // Insert new company
    const { rows: result } = await sql.query(
      `INSERT INTO companies (name, industry, company_size, region, business_challenges, created_by)
       VALUES ($1, $2, $3, $4, $5, 1)
       RETURNING *`,
      [name, industry, company_size, region, business_challenges || ""]
    )

    console.log("🏢 API: Company created successfully:", result[0])
    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("🏢 API: Error creating company:", error)

    // Handle duplicate company name
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "23505"
    ) {
      return NextResponse.json({ error: "A company with this name already exists" }, { status: 409 })
    }

    return NextResponse.json(
      {
        error: "Failed to create company",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
