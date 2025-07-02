import sql from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const industry = searchParams.get("industry")

    let query
    if (industry) {
      // Get products that target this industry
      query = sql.query(`
        SELECT * FROM sap_products 
        WHERE $1 = ANY(target_industries)
        ORDER BY product_name
      `, [industry])
    } else {
      // Get all products
      query = sql.query(`
        SELECT * FROM sap_products 
        ORDER BY product_name
      `)
    }

    const { rows: products } = await query
    return NextResponse.json(products)
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to fetch SAP products" }, { status: 500 })
  }
}
