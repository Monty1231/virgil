import { NextResponse } from "next/server";
import { knowledgeBase } from "@/lib/knowledge-base";
import { ragService, CompanyContext } from "@/lib/rag-service";
import sql from "@/lib/db";

export async function GET() {
  try {
    console.log("🔍 Debug RAG: Starting detailed debug...");

    // Step 1: Check database
    console.log("🔍 Debug RAG: Checking database...");
    const { rows: sapProducts } = await sql.query("SELECT * FROM sap_products");
    const { rows: companies } = await sql.query("SELECT * FROM companies LIMIT 3");
    console.log("🔍 Debug RAG: Found", sapProducts.length, "SAP products and", companies.length, "companies");

    // Step 2: Initialize knowledge base with detailed logging
    console.log("🔍 Debug RAG: Initializing knowledge base...");
    await knowledgeBase.initialize();
    console.log("🔍 Debug RAG: Knowledge base initialized");

    // Step 3: Test knowledge base population
    console.log("🔍 Debug RAG: Testing knowledge base population...");
    const sapProductsFromDB = await knowledgeBase.getSAPProductsFromDB();
    console.log("🔍 Debug RAG: SAP products from DB:", sapProductsFromDB.length);

    // Step 4: Test vector database search
    console.log("🔍 Debug RAG: Testing vector database search...");
    const searchResults = await knowledgeBase.searchRelevantContext("SAP ERP solutions", "Financial Services", 5);
    console.log("🔍 Debug RAG: Search results:", searchResults.length);

    // Step 5: Test specific retrievals
    console.log("🔍 Debug RAG: Testing specific retrievals...");
    const productRecommendations = await knowledgeBase.getSAPProductRecommendations("Financial Services", ["regulatory compliance"]);
    const industryInsights = await knowledgeBase.getIndustryInsights("Financial Services");
    console.log("🔍 Debug RAG: Product recommendations:", productRecommendations.length);
    console.log("🔍 Debug RAG: Industry insights:", industryInsights.length);

    // Step 6: Test RAG service with sample company
    console.log("🔍 Debug RAG: Testing RAG service...");
    const sampleCompany: CompanyContext = {
      name: "Test Financial Company",
      industry: "Financial Services",
      company_size: "Enterprise",
      region: "North America",
      business_challenges: "Regulatory compliance and risk management",
      current_systems: "Legacy systems",
      budget: "$1M-$2M",
      timeline: "12-18 months",
      uploaded_files: [],
      deals: [],
    };

    try {
      const analysis = await ragService.generateAnalysis(sampleCompany);
      console.log("🔍 Debug RAG: Analysis generated successfully");
      console.log("🔍 Debug RAG: Analysis structure:", {
        hasSolutions: !!analysis.recommendedSolutions,
        solutionsCount: analysis.recommendedSolutions?.length,
        hasChallenges: !!analysis.businessChallenges,
        challengesCount: analysis.businessChallenges?.length,
        hasFitScore: typeof analysis.fitScore === "number",
        fitScore: analysis.fitScore,
      });
    } catch (ragError) {
      console.error("🔍 Debug RAG: RAG analysis failed:", ragError);
    }

    return NextResponse.json({
      success: true,
      debug: {
        database: {
          sapProducts: sapProducts.length,
          companies: companies.length,
        },
        knowledgeBase: {
          sapProductsFromDB: sapProductsFromDB.length,
          searchResults: searchResults.length,
          productRecommendations: productRecommendations.length,
          industryInsights: industryInsights.length,
        },
        sampleData: {
          sapProducts: sapProducts.slice(0, 2).map(p => ({
            name: p.product_name,
            category: p.product_category,
            industries: p.target_industries,
          })),
          companies: companies.slice(0, 2).map(c => ({
            id: c.id,
            name: c.name,
            industry: c.industry,
            challenges: c.business_challenges,
          })),
          searchResults: searchResults.slice(0, 2).map(r => ({
            id: r.id,
            score: r.score,
            content: r.content.substring(0, 100) + "...",
            metadata: r.metadata,
          })),
        },
      },
    });
  } catch (error: any) {
    console.error("🔍 Debug RAG: Error during debug:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
} 