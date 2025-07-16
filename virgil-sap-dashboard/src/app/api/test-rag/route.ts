import { NextResponse } from "next/server";
import { knowledgeBase } from "@/lib/knowledge-base";
import { ragService, CompanyContext } from "@/lib/rag-service";
import sql from "@/lib/db";

export async function GET() {
  try {
    console.log("🧪 Test RAG: Starting RAG system test...");

    // Test 1: Check database connection and SAP products
    console.log("🧪 Test RAG: Checking database connection...");
    const { rows: sapProducts } = await sql.query("SELECT * FROM sap_products");
    console.log("🧪 Test RAG: Found SAP products in DB:", sapProducts.length);

    // Test 2: Check for companies to add to knowledge base
    console.log("🧪 Test RAG: Checking for companies...");
    const { rows: companies } = await sql.query("SELECT * FROM companies LIMIT 3");
    console.log("🧪 Test RAG: Found companies in DB:", companies.length);

    // Test 3: Initialize knowledge base with detailed logging
    console.log("🧪 Test RAG: Initializing knowledge base...");
    await knowledgeBase.initialize();
    console.log("🧪 Test RAG: Knowledge base initialized");

    // Test 4: Add first company to knowledge base (if exists)
    let companyAdded = false;
    if (companies.length > 0) {
      console.log("🧪 Test RAG: Adding company to knowledge base...");
      const chunksAdded = await knowledgeBase.addCompanyToKnowledgeBase(companies[0].id);
      console.log("🧪 Test RAG: Added chunks for company:", chunksAdded);
      companyAdded = chunksAdded > 0;
    }

    // Test 5: Check knowledge base status
    console.log("🧪 Test RAG: Checking knowledge base status...");
    const stats = await knowledgeBase.getKnowledgeBaseStatus();
    console.log("🧪 Test RAG: Knowledge base stats:", stats);

    // Test 6: Test retrieval with sample company
    console.log("🧪 Test RAG: Testing retrieval with sample company...");
    const sampleCompany: CompanyContext = {
      name: "Test Company",
      industry: "Financial Services",
      company_size: "Enterprise",
      region: "North America",
      business_challenges: "Legacy system integration and regulatory compliance",
      current_systems: "Legacy ERP and CRM systems",
      budget: "$1M-$2M",
      timeline: "12-18 months",
      uploaded_files: [],
      deals: [],
    };

    // Test retrieval
    console.log("🧪 Test RAG: Testing product recommendations...");
    const relevantProducts = await knowledgeBase.getSAPProductRecommendations(
      sampleCompany.industry,
      [sampleCompany.business_challenges!]
    );
    console.log("🧪 Test RAG: Retrieved products:", relevantProducts.length);

    console.log("🧪 Test RAG: Testing industry insights...");
    const industryInsights = await knowledgeBase.getIndustryInsights(
      sampleCompany.industry
    );
    console.log("🧪 Test RAG: Retrieved insights:", industryInsights.length);

    // Test 7: Test full RAG analysis
    console.log("🧪 Test RAG: Testing full RAG analysis...");
    const analysis = await ragService.generateAnalysis(sampleCompany);
    console.log("🧪 Test RAG: Analysis generated:", {
      hasSolutions: !!analysis.recommendedSolutions,
      solutionsCount: analysis.recommendedSolutions?.length,
      hasChallenges: !!analysis.businessChallenges,
      challengesCount: analysis.businessChallenges?.length,
      hasFitScore: typeof analysis.fitScore === "number",
      fitScore: analysis.fitScore,
    });

    return NextResponse.json({
      success: true,
      testResults: {
        databaseConnection: true,
        sapProductsInDB: sapProducts.length,
        companiesInDB: companies.length,
        knowledgeBaseInitialized: true,
        knowledgeBaseStats: stats,
        companyAddedToKnowledgeBase: companyAdded,
        retrievedProducts: relevantProducts.length,
        retrievedInsights: industryInsights.length,
        analysisGenerated: !!analysis,
        analysisStructure: {
          hasSolutions: !!analysis.recommendedSolutions,
          solutionsCount: analysis.recommendedSolutions?.length,
          hasChallenges: !!analysis.businessChallenges,
          challengesCount: analysis.businessChallenges?.length,
          hasFitScore: typeof analysis.fitScore === "number",
          fitScore: analysis.fitScore,
        },
        sampleProducts: relevantProducts.slice(0, 3).map(p => ({
          id: p.id,
          score: p.score,
          content: p.content.substring(0, 100) + "...",
          metadata: p.metadata,
        })),
        sampleInsights: industryInsights.slice(0, 3).map(i => ({
          id: i.id,
          score: i.score,
          content: i.content.substring(0, 100) + "...",
          metadata: i.metadata,
        })),
        debug: {
          sapProducts: sapProducts.slice(0, 2).map(p => ({
            name: p.product_name,
            category: p.product_category,
            industries: p.target_industries,
          })),
          companies: companies.slice(0, 2).map(c => ({
            id: c.id,
            name: c.name,
            industry: c.industry,
            size: c.company_size,
          })),
        },
      },
    });
  } catch (error: any) {
    console.error("🧪 Test RAG: Error during testing:", error);
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
 