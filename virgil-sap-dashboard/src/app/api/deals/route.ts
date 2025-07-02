import  sql  from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const deals = await sql.query(`
      SELECT 
        d.id,
        d.deal_name,
        d.stage,
        d.value,
        d.notes,
        d.last_activity,
        c.name as company_name,
        u.name as ae_name
      FROM deals d
      LEFT JOIN companies c ON d.company_id = c.id
      LEFT JOIN users u ON d.ae_assigned = u.id
      ORDER BY d.last_activity DESC
    `)

    return NextResponse.json(deals)
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to fetch deals" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { company_id, deal_name, stage, value, ae_assigned, notes } = body

    const result: { rows: any[] } = await sql.query(`
      INSERT INTO deals (company_id, deal_name, stage, value, ae_assigned, notes)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [company_id, deal_name, stage, value, ae_assigned, notes])

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to create deal" }, { status: 500 })
  }
}
