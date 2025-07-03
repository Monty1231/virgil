import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get("companyId")

    console.log("📊 AI Analyses API: Fetching analyses, companyId:", companyId)

    // Check environment variables
    const { DB_HOST, DB_NAME, DB_USER, DB_PASSWORD, DATABASE_URL } = process.env

    // Support both database configurations
    const hasCustomDB = DB_HOST && DB_NAME && DB_USER && DB_PASSWORD
    const hasNeonDB = DATABASE_URL

    if (!hasCustomDB && !hasNeonDB) {
      console.error("📊 AI Analyses API: No database configuration found")
      return NextResponse.json(
        {
          error: "Database not configured",
          details: "Set either DATABASE_URL or (DB_HOST, DB_NAME, DB_USER, DB_PASSWORD) in .env.local",
        },
        { status: 500 },
      )
    }

    let analyses
    try {
      if (hasCustomDB) {
        // Use your custom database setup
        const { Pool } = require("pg")
        const pool = new Pool({
          host: DB_HOST,
          database: DB_NAME,
          user: DB_USER,
          password: DB_PASSWORD,
          port: process.env.DB_PORT || 5432,
          ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
        })

        let query
        let params: any[] = []

        if (companyId) {
          // Get analyses for specific company
          query = `
            SELECT 
              a.id,
              a.company_id,
              a.analysis_type,
              a.analysis_results,
              a.confidence_score,
              a.created_at,
              c.name as company_name,
              c.industry,
              c.company_size
            FROM ai_analyses a
            JOIN companies c ON a.company_id = c.id
            WHERE a.company_id = $1
            ORDER BY a.created_at DESC
            LIMIT 5
          `
          params = [Number.parseInt(companyId)]
        } else {
          // Get recent analyses for all companies
          query = `
            SELECT 
              a.id,
              a.company_id,
              a.analysis_type,
              a.analysis_results,
              a.confidence_score,
              a.created_at,
              c.name as company_name,
              c.industry,
              c.company_size
            FROM ai_analyses a
            JOIN companies c ON a.company_id = c.id
            ORDER BY a.created_at DESC
            LIMIT 20
          `
        }

        const result = await pool.query(query, params)
        analyses = result.rows
        await pool.end()
      } else {
        // Use Neon database setup
        const sql = (await import("@/lib/db")).default

        if (companyId) {
          // Get analyses for specific company
          const result = await sql.query(
            `
            SELECT 
              a.id,
              a.company_id,
              a.analysis_type,
              a.analysis_results,
              a.confidence_score,
              a.created_at,
              c.name as company_name,
              c.industry,
              c.company_size
            FROM ai_analyses a
            JOIN companies c ON a.company_id = c.id
            WHERE a.company_id = $1
            ORDER BY a.created_at DESC
            LIMIT 5
            `,
            [Number.parseInt(companyId)]
          )
          analyses = result.rows
        } else {
          // Get recent analyses for all companies
          const result = await sql.query(
            `
            SELECT 
              a.id,
              a.company_id,
              a.analysis_type,
              a.analysis_results,
              a.confidence_score,
              a.created_at,
              c.name as company_name,
              c.industry,
              c.company_size
            FROM ai_analyses a
            JOIN companies c ON a.company_id = c.id
            ORDER BY a.created_at DESC
            LIMIT 20
            `
          )
          analyses = result.rows
        }
      }

      console.log("📊 AI Analyses API: Found", analyses.length, "analyses")
      return NextResponse.json(analyses)
    } catch (dbError) {
      console.error("📊 AI Analyses API: Database error:", dbError)

      // If table doesn't exist, return empty array instead of error
      if (dbError instanceof Error && dbError.message.includes('relation "ai_analyses" does not exist')) {
        console.log("📊 AI Analyses table doesn't exist yet, returning empty array")
        return NextResponse.json([])
      }

      return NextResponse.json(
        {
          error: "Database query failed",
          details: dbError instanceof Error ? dbError.message : "Unknown database error",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("📊 AI Analyses API: Error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch AI analyses",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
