import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import sql from "@/lib/db";
import { ragServiceFast } from "@/lib/rag-service-fast";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ companyId: string }> }
) {
  try {
    const startTime = Date.now();
    const { companyId: rawId } = await context.params;
    const companyId = Number.parseInt(rawId, 10);

    console.log("🚀 Fast RAG Analysis: Starting for company ID:", companyId);

    // Fetch the company record
    const companyResult = await sql.query(
      `SELECT 
        id, name, industry, company_size, region, website,
        business_challenges, current_systems, budget, timeline, priority,
        primary_contact, secondary_contact, notes, tags, created_at
      FROM companies 
      WHERE id = $1`,
      [companyId]
    );

    const companyRows = companyResult.rows;
    if (companyRows.length === 0) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const company = companyRows[0];
    console.log("🚀 Fast RAG Analysis: Company data retrieved:", {
      name: company.name,
      industry: company.industry,
      size: company.company_size,
    });

    // Fetch uploaded files (limited to first 2 for speed)
    const filesResult = await sql.query(
      `SELECT 
        id, filename, original_name, file_size, file_type, category,
        file_path, file_content, content_extracted, uploaded_at
       FROM company_files 
       WHERE company_id = $1 AND content_extracted = true
       ORDER BY uploaded_at DESC
       LIMIT 2`,
      [companyId]
    );
    const uploadedFiles = filesResult.rows;

    // Fetch existing deals (limited to first 3 for speed)
    const dealResult = await sql.query(
      `SELECT deal_name, deal_value, stage, probability, notes, created_at
       FROM deals 
       WHERE company_id = $1
       ORDER BY created_at DESC
       LIMIT 3`,
      [companyId]
    );
    const dealRows = dealResult.rows;

    // Prepare company context for fast RAG
    const companyContext = {
      name: company.name,
      industry: company.industry,
      company_size: company.company_size,
      region: company.region,
      business_challenges: company.business_challenges,
      current_systems: company.current_systems,
      budget: company.budget,
      timeline: company.timeline,
      uploaded_files: uploadedFiles.map((file) => ({
        name: file.original_name,
        category: file.category,
        content: file.content_extracted ? file.file_content : undefined,
      })),
      deals: dealRows.map((deal) => ({
        deal_name: deal.deal_name,
        deal_value: Number(deal.deal_value) || 0,
        stage: deal.stage,
        probability: Number(deal.probability) || 0,
      })),
    };

    // Generate analysis using fast RAG
    console.log("🚀 Fast RAG Analysis: Generating analysis...");
    const analysis = await ragServiceFast.generateAnalysis(companyContext);

    // Store the analysis in database
    try {
      const insertResult = await sql.query(
        `INSERT INTO ai_analyses (
          company_id, 
          analysis_type, 
          input_data, 
          analysis_results, 
          confidence_score, 
          generated_by, 
          model_version
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, created_at`,
        [
          companyId,
          "fast_rag",
          JSON.stringify(companyContext),
          JSON.stringify(analysis),
          0.85,
          "fast_rag_service",
          "fast_v1",
        ]
      );

      console.log("🚀 Fast RAG Analysis: Analysis stored with ID:", insertResult.rows[0].id);
    } catch (dbError) {
      console.error("🚀 Fast RAG Analysis: Failed to store analysis:", dbError);
      // Continue without storing if there's a DB error
    }

    const totalTime = Date.now() - startTime;
    console.log(`🚀 Fast RAG Analysis: Total time: ${totalTime}ms (${(totalTime/1000).toFixed(1)}s)`);

    return NextResponse.json({
      success: true,
      analysis,
      timing: {
        totalTimeMs: totalTime,
        totalTimeSeconds: (totalTime/1000).toFixed(1),
      },
    });
  } catch (error) {
    console.error("🚀 Fast RAG Analysis: Error:", error);
    return NextResponse.json(
      {
        error: "Fast RAG analysis failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
} 