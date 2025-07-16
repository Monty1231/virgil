import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { knowledgeBase } from "@/lib/knowledge-base";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId: rawId } = await context.params;
    const companyId = Number.parseInt(rawId, 10);

    console.log(`🔄 RAG Company: Adding company ${companyId} to knowledge base...`);

    const chunksAdded = await knowledgeBase.addCompanyToKnowledgeBase(companyId);

    return NextResponse.json({
      success: true,
      message: `Added ${chunksAdded} chunks for company ${companyId} to knowledge base`,
      chunksAdded,
    });
  } catch (error: any) {
    console.error(`❌ RAG Company: Error adding company to knowledge base:`, error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId: rawId } = await context.params;
    const companyId = Number.parseInt(rawId, 10);

    console.log(`🗑️ RAG Company: Removing company ${companyId} from knowledge base...`);

    const chunksRemoved = await knowledgeBase.removeCompanyFromKnowledgeBase(companyId);

    return NextResponse.json({
      success: true,
      message: `Removed ${chunksRemoved} chunks for company ${companyId} from knowledge base`,
      chunksRemoved,
    });
  } catch (error: any) {
    console.error(`❌ RAG Company: Error removing company from knowledge base:`, error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId: rawId } = await context.params;
    const companyId = Number.parseInt(rawId, 10);

    console.log(`🔍 RAG Company: Finding similar companies for ${companyId}...`);

    const similarCompanies = await knowledgeBase.getSimilarCompanies(companyId, 5);

    return NextResponse.json({
      success: true,
      similarCompanies: similarCompanies.map(company => ({
        id: company.metadata.company_id,
        name: company.metadata.company_name,
        industry: company.metadata.industry,
        company_size: company.metadata.company_size,
        region: company.metadata.region,
        similarity_score: company.score,
        content: company.content.substring(0, 200) + "...",
      })),
    });
  } catch (error: any) {
    console.error(`❌ RAG Company: Error finding similar companies:`, error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
} 