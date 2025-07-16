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

    console.log(`🔄 RAG Update: Updating company ${companyId} in knowledge base...`);

    // First, remove existing company data
    await knowledgeBase.removeCompanyFromKnowledgeBase(companyId);
    
    // Then, add updated company data
    const chunksAdded = await knowledgeBase.addCompanyToKnowledgeBase(companyId);

    return NextResponse.json({
      success: true,
      message: `Updated company ${companyId} in knowledge base with ${chunksAdded} chunks`,
      chunksAdded,
    });
  } catch (error: any) {
    console.error(`❌ RAG Update: Error updating company in knowledge base:`, error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
} 