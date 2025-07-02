import  sql  from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: { companyId: string } }) {
  try {
    const companyId = Number.parseInt(params.companyId)

    // Get company details
    const company = await sql.query(`
      SELECT * FROM companies WHERE id = $1
    `, [companyId])

    if (company.rows.length === 0) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 })
    }

    // Get SAP solutions for this company
    const solutions = await sql.query(`
      SELECT * FROM sap_solutions WHERE company_id = $1
      ORDER BY fit_score DESC
    `, [companyId])

    return NextResponse.json({
      company: company.rows[0],
      solutions: solutions,
    })
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to fetch analysis" }, { status: 500 })
  }
}
