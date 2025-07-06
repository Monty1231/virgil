import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import sql from "@/lib/db"; // pg.Pool instance

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyIdParam = searchParams.get("companyId");
    console.log("📊 AI Analyses API: Fetching analyses, companyId:", companyIdParam);

    // Build the SQL + parameters
    let queryText: string;
    let queryParams: (string | number)[] = [];

    if (companyIdParam) {
      const companyId = Number.parseInt(companyIdParam, 10);
      queryText = `
        SELECT
          a.id,
          a.company_id,
          a.analysis_type,
          a.analysis_results,
          a.confidence_score,
          a.created_at,
          a.model_version,
          a.generated_by,
          a.input_data,
          c.name        AS company_name,
          c.industry,
          c.company_size,
          c.region
        FROM ai_analyses a
        JOIN companies c ON a.company_id = c.id
        WHERE a.company_id = $1
        ORDER BY a.created_at DESC
        LIMIT 20
      `;
      queryParams = [companyId];
    } else {
      queryText = `
        SELECT
          a.id,
          a.company_id,
          a.analysis_type,
          a.analysis_results,
          a.confidence_score,
          a.created_at,
          a.model_version,
          a.generated_by,
          a.input_data,
          c.name        AS company_name,
          c.industry,
          c.company_size,
          c.region
        FROM ai_analyses a
        JOIN companies c ON a.company_id = c.id
        ORDER BY a.created_at DESC
        LIMIT 50
      `;
      // no params
    }

    // Execute the query
    const { rows: analyses } = await sql.query(queryText, queryParams);
    console.log("📊 AI Analyses API: Found", analyses.length, "analyses");

    // Parse JSON fields and filter out invalid entries
    const processed = analyses.map((row: any) => {
      let results = row.analysis_results;
      let input   = row.input_data;

      if (typeof results === "string") {
        try { results = JSON.parse(results); }
        catch (e) {
          console.error("📊 Failed to parse analysis_results for ID", row.id, e);
          results = null;
        }
      }

      if (typeof input === "string") {
        try { input = JSON.parse(input); }
        catch (e) {
          console.error("📊 Failed to parse input_data for ID", row.id, e);
          input = null;
        }
      }

      return {
        id:               row.id,
        company_id:       row.company_id,
        company_name:     row.company_name,
        industry:         row.industry,
        company_size:     row.company_size,
        region:           row.region,
        analysis_type:    row.analysis_type,
        analysis_results: results,
        input_data:       input,
        confidence_score: row.confidence_score,
        created_at:       row.created_at,
        model_version:    row.model_version,
        generated_by:     row.generated_by,
      };
    });

    const validAnalyses = processed.filter((a) => a.analysis_results !== null);
    console.log("📊 AI Analyses API: Returning", validAnalyses.length, "valid analyses");

    return NextResponse.json(validAnalyses);
  } catch (error: any) {
    console.error("📊 AI Analyses API: Error:", error);
    return NextResponse.json(
      {
        error:   "Failed to fetch AI analyses",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
