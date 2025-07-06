import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import sql from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Debug Analyses: Starting database check...");

    // Check if ai_analyses table exists
    const { rows: tableExistsRows } = await sql.query(
      `SELECT EXISTS (
         SELECT FROM information_schema.tables 
         WHERE table_schema = 'public' 
           AND table_name   = 'ai_analyses'
       ) AS exists`
    );
    const tableExists = tableExistsRows[0]?.exists || false;
    console.log("🔍 Debug Analyses: Table exists:", tableExists);

    let tableInfo: { column_name: string; data_type: string; is_nullable: string; column_default: string | null }[] | null = null;
    let sampleData: any[] = [];
    let totalCount = 0;

    if (tableExists) {
      // Get table structure
      const { rows: infoRows } = await sql.query(
        `SELECT 
           column_name, 
           data_type, 
           is_nullable, 
           column_default
         FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name   = 'ai_analyses'
         ORDER BY ordinal_position`
      );
      tableInfo = infoRows;

      // Get total count
      const { rows: countRows } = await sql.query(
        `SELECT COUNT(*)::int AS total FROM ai_analyses`
      );
      totalCount = countRows[0]?.total || 0;

      // Get sample data
      if (totalCount > 0) {
        const { rows: sampleRows } = await sql.query(
          `SELECT 
             id, 
             company_id, 
             analysis_type, 
             confidence_score, 
             model_version,
             created_at,
             CASE 
               WHEN analysis_results IS NOT NULL THEN 'Has Data'
               ELSE 'No Data'
             END AS analysis_status,
             CASE 
               WHEN input_data IS NOT NULL THEN 'Has Input Data'
               ELSE 'No Input Data'
             END AS input_status
           FROM ai_analyses 
           ORDER BY created_at DESC 
           LIMIT 5`
        );
        sampleData = sampleRows;
      }
    }

    // Also check companies table
    const { rows: companiesCountRows } = await sql.query(
      `SELECT COUNT(*)::int AS total FROM companies`
    );
    const companiesTotal = companiesCountRows[0]?.total || 0;

    // Get recent companies for context
    const { rows: recentCompanies } = await sql.query(
      `SELECT id, name, industry, company_size, created_at
       FROM companies 
       ORDER BY created_at DESC 
       LIMIT 3`
    );

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      ai_analyses_table: {
        exists: tableExists,
        structure: tableInfo,
        total_records: totalCount,
        sample_data: sampleData,
      },
      companies_table: {
        total_records: companiesTotal,
        recent_companies: recentCompanies,
      },
      database_status: "Connected",
    });
  } catch (error: any) {
    console.error("🔍 Debug Analyses: Error:", error);
    return NextResponse.json(
      {
        error: "Database check failed",
        details: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
