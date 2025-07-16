import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import sql from "@/lib/db";
import { ragService, CompanyContext } from "@/lib/rag-service";
import { knowledgeBase } from "@/lib/knowledge-base";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ companyId: string }> }
) {
  try {
    // Await params before using
    const { companyId: rawId } = await context.params;
    const companyId = Number.parseInt(rawId, 10);

    console.log(
      "🤖 RAG AI Analysis: Starting RAG-based analysis for company ID:",
      companyId
    );

    // Initialize knowledge base if needed (skip if already populated)
    try {
      await knowledgeBase.initialize();
    } catch (error: any) {
      console.log(
        "🤖 RAG AI Analysis: Knowledge base initialization failed, continuing with existing data:",
        error?.message || "Unknown error"
      );
      // Continue with existing knowledge base data
    }

    // Fetch the company record with all available data
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
    console.log("🤖 RAG AI Analysis: Company data retrieved:", {
      name: company.name,
      industry: company.industry,
      size: company.company_size,
      region: company.region,
    });

    // Fetch uploaded files for this company
    const filesResult = await sql.query(
      `SELECT 
        id, filename, original_name, file_size, file_type, category,
        file_path, file_content, content_extracted, uploaded_at
       FROM company_files 
       WHERE company_id = $1
       ORDER BY uploaded_at DESC`,
      [companyId]
    );
    const uploadedFiles = filesResult.rows;

    console.log(
      "🤖 RAG AI Analysis: Found",
      uploadedFiles.length,
      "uploaded files"
    );

    // Fetch existing deals for context
    const dealResult = await sql.query(
      `SELECT deal_name, deal_value, stage, probability, notes, created_at
       FROM deals 
       WHERE company_id = $1
       ORDER BY created_at DESC`,
      [companyId]
    );
    const dealRows = dealResult.rows;

    // Prepare company context for RAG
    const companyContext: CompanyContext = {
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

    // Generate analysis using RAG
    console.log("🤖 RAG AI Analysis: Generating analysis with RAG...");
    const analysis = await ragService.generateAnalysis(companyContext);

    // Improved fallback logic
    if (
      !analysis ||
      !analysis.recommendedSolutions ||
      !analysis.businessChallenges
    ) {
      // Import createAdvancedFallbackAnalysis dynamically from parent route
      const { createAdvancedFallbackAnalysis } = await import("../route");
      // Calculate pipeline metrics for fallback
      const totalPipelineValue = dealRows.reduce(
        (sum, deal) => sum + (Number(deal.deal_value) || 0),
        0
      );
      const avgDealValue =
        dealRows.length > 0 ? totalPipelineValue / dealRows.length : 0;
      const highProbabilityDeals = dealRows.filter(
        (deal) => (deal.probability || 0) > 70
      );
      // Fetch SAP products for this industry
      const sapProductsResult = await sql.query(
        `SELECT * FROM sap_products WHERE $1 = ANY(target_industries) ORDER BY product_name`,
        [company.industry]
      );
      const sapProducts = sapProductsResult.rows;
      const fallbackAnalysis = createAdvancedFallbackAnalysis(
        company,
        dealRows,
        totalPipelineValue,
        avgDealValue,
        highProbabilityDeals,
        sapProducts
      );
      return NextResponse.json({
        fallback: true,
        message:
          "Not enough data for a full RAG analysis. This is a fallback report. Please upload files or add more company information for a more detailed analysis.",
        analysis: fallbackAnalysis,
      });
    }

    // Validate the analysis
    if (
      !analysis ||
      !analysis.recommendedSolutions ||
      !analysis.businessChallenges
    ) {
      return NextResponse.json(
        {
          error: "RAG analysis failed to generate complete results",
          details: "Missing required analysis components",
        },
        { status: 422 }
      );
    }

    // Store the analysis in database
    try {
      console.log("🤖 RAG AI Analysis: Storing analysis in database...");

      // Prepare enhanced input data with RAG metadata
      const inputData = {
        company_data: company,
        deals_data: dealRows,
        rag_metadata: {
          analysis_method: "RAG",
          knowledge_base_used: true,
          retrieval_timestamp: new Date().toISOString(),
          context_sources: [
            "sap_products",
            "industry_insights",
            "best_practices",
          ],
        },
        analysis_metadata: {
          analysis_date: new Date().toISOString(),
          prompt_version: "rag_v1",
          calculation_methodology: "RAG-driven with knowledge base retrieval",
          data_completeness: {
            has_business_challenges: !!company.business_challenges,
            has_current_systems: !!company.current_systems,
            has_budget_info: !!company.budget,
            has_timeline: !!company.timeline,
            has_pipeline_data: dealRows.length > 0,
            has_uploaded_files: uploadedFiles.length > 0,
          },
        },
      };

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
          "fit_assessment",
          JSON.stringify(inputData),
          JSON.stringify(analysis),
          typeof analysis.fitScore === "number" ? analysis.fitScore : null,
          1,
          "gpt-4o-rag",
        ]
      );

      const insertedId = insertResult.rows[0]?.id;
      console.log(
        "🤖 RAG AI Analysis: ✅ Analysis stored with ID:",
        insertedId
      );

      // Return the analysis with metadata
      return NextResponse.json({
        success: true,
        analysis,
        metadata: {
          analysis_id: insertedId,
          method: "RAG",
          knowledge_base_used: true,
          generated_at: new Date().toISOString(),
          company_id: companyId,
          company_name: company.name,
        },
      });
    } catch (dbError) {
      console.error("🤖 RAG AI Analysis: Database error:", dbError);

      // Return analysis even if database storage fails
      return NextResponse.json({
        success: true,
        analysis,
        metadata: {
          method: "RAG",
          knowledge_base_used: true,
          generated_at: new Date().toISOString(),
          company_id: companyId,
          company_name: company.name,
          note: "Analysis generated but not stored in database",
        },
      });
    }
  } catch (error: any) {
    console.error("🤖 RAG AI Analysis: Error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate RAG analysis",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
