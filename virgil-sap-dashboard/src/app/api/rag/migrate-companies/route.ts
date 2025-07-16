import { NextResponse } from "next/server";
import { knowledgeBase } from "@/lib/knowledge-base";
import sql from "@/lib/db";

export async function POST() {
  try {
    console.log("🔄 RAG Migration: Starting company migration to Pinecone...");

    // Initialize knowledge base
    await knowledgeBase.initialize();

    // Get all companies from database
    const { rows: companies } = await sql.query(`
      SELECT 
        id, name, industry, company_size, region, website,
        business_challenges, current_systems, budget, timeline, priority,
        primary_contact, secondary_contact, notes, tags, created_at
      FROM companies 
      ORDER BY id
    `);

    console.log(
      `🔄 RAG Migration: Found ${companies.length} companies to migrate`
    );

    const migrationResults = [];
    let successCount = 0;
    let errorCount = 0;

    for (const company of companies) {
      try {
        console.log(
          `🔄 RAG Migration: Migrating company ${company.id} - ${company.name}`
        );

        // Remove existing data for this company (if any)
        await knowledgeBase.removeCompanyFromKnowledgeBase(company.id);

        // Add company data to knowledge base
        const chunksAdded = await knowledgeBase.addCompanyToKnowledgeBase(
          company.id
        );

        migrationResults.push({
          companyId: company.id,
          companyName: company.name,
          industry: company.industry,
          success: true,
          chunksAdded,
        });

        successCount++;
        console.log(
          `✅ RAG Migration: Successfully migrated ${company.name} with ${chunksAdded} chunks`
        );
      } catch (error) {
        console.error(
          `❌ RAG Migration: Failed to migrate company ${company.id} - ${company.name}:`,
          error
        );
        migrationResults.push({
          companyId: company.id,
          companyName: company.name,
          industry: company.industry,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
        errorCount++;
      }
    }

    console.log(
      `🔄 RAG Migration: Migration complete. Success: ${successCount}, Errors: ${errorCount}`
    );

    return NextResponse.json({
      success: true,
      summary: {
        totalCompanies: companies.length,
        successCount,
        errorCount,
      },
      results: migrationResults,
    });
  } catch (error: any) {
    console.error("🔄 RAG Migration: Error during migration:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    console.log("🔍 RAG Migration: Checking migration status...");

    // Get all companies from database
    const { rows: companies } = await sql.query(`
      SELECT id, name, industry, company_size, region, business_challenges
      FROM companies 
      ORDER BY id
    `);

    // Test retrieval for a few companies
    const testResults = [];
    for (let i = 0; i < Math.min(3, companies.length); i++) {
      const company = companies[i];
      try {
        const similarCompanies = await knowledgeBase.getSimilarCompanies(
          company.id,
          3
        );
        testResults.push({
          companyId: company.id,
          companyName: company.name,
          industry: company.industry,
          similarCompaniesFound: similarCompanies.length,
          hasDataInPinecone: similarCompanies.length > 0,
        });
      } catch (error) {
        testResults.push({
          companyId: company.id,
          companyName: company.name,
          industry: company.industry,
          similarCompaniesFound: 0,
          hasDataInPinecone: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      success: true,
      totalCompanies: companies.length,
      testResults,
      sampleCompanies: companies.slice(0, 5).map((c) => ({
        id: c.id,
        name: c.name,
        industry: c.industry,
        size: c.company_size,
        region: c.region,
        hasChallenges: !!c.business_challenges,
      })),
    });
  } catch (error: any) {
    console.error("🔍 RAG Migration: Error checking status:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
