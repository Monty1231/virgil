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
          // Get analyses for specific company - simplified query to avoid column issues
          query = `
            SELECT 
              a.id,
              a.company_id,
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
            LIMIT 10
          `
          params = [Number.parseInt(companyId)]
        } else {
          // Get recent analyses for all companies
          query = `
            SELECT 
              a.id,
              a.company_id,
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
            LIMIT 10
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

      // Process the results to ensure analysis_results is properly parsed
      const processedAnalyses = analyses.map((analysis: any) => {
        let analysisResults = analysis.analysis_results

        // If analysis_results is a string, parse it
        if (typeof analysisResults === "string") {
          try {
            analysisResults = JSON.parse(analysisResults)
          } catch (parseError) {
            console.error("📊 Failed to parse analysis_results for ID", analysis.id, ":", parseError)
            analysisResults = null
          }
        }

        return {
          id: analysis.id,
          company_id: analysis.company_id,
          company_name: analysis.company_name,
          industry: analysis.industry,
          company_size: analysis.company_size,
          analysis_results: analysisResults,
          confidence_score: analysis.confidence_score,
          created_at: analysis.created_at,
        }
      })

      // Filter out analyses with invalid results
      const validAnalyses = processedAnalyses.filter((analysis: any) => analysis.analysis_results !== null)

      console.log("📊 AI Analyses API: Returning", validAnalyses.length, "valid analyses")
      return NextResponse.json(validAnalyses)
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
