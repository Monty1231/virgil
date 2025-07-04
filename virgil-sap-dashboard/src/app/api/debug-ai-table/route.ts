import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("🔍 Debug AI Table: Starting table check...")

    // Test database connection and check if ai_analyses table exists
    let tableStatus = "not checked"
    let recordCount = 0
    let tableStructure = null

    try {
      const sql = (await import("@/lib/db")).default

      // Check if table exists
      const tableCheckResult = await sql.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'ai_analyses'
        ) as table_exists
      `)

      const tableExists = tableCheckResult.rows[0]?.table_exists

      if (tableExists) {
        // Get record count
        const countResult = await sql.query(`SELECT COUNT(*) as count FROM ai_analyses`)
        recordCount = Number.parseInt(countResult.rows[0]?.count || "0")

        // Get table structure
        const structureResult = await sql.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns
          WHERE table_name = 'ai_analyses'
          ORDER BY ordinal_position
        `)
        tableStructure = structureResult.rows

        tableStatus = "exists"
      } else {
        tableStatus = "does not exist"
      }

      console.log("🔍 Debug AI Table: Check complete", { tableExists, recordCount })
    } catch (dbError) {
      tableStatus = `error: ${dbError instanceof Error ? dbError.message : "unknown error"}`
      console.error("🔍 Debug AI Table: Database error:", dbError)
    }

    const debugInfo = {
      timestamp: new Date().toISOString(),
      table: {
        status: tableStatus,
        recordCount,
        structure: tableStructure,
      },
      database: {
        hasUrl: !!process.env.DATABASE_URL,
      },
    }

    console.log("🔍 Debug AI Table: Debug info:", debugInfo)

    return NextResponse.json(debugInfo)
  } catch (error) {
    console.error("🔍 Debug AI Table: Unexpected error:", error)
    return NextResponse.json(
      {
        error: "Debug table check failed",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
