import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ragService } from "@/lib/rag-service";

export async function POST(request: NextRequest) {
  try {
    const startTime = Date.now();
    console.log("🔍 Debug RAG Timing: Starting test...");

    // Test with a sample company context
    const testCompanyContext = {
      name: "Test Company",
      industry: "Manufacturing",
      company_size: "Enterprise",
      region: "North America",
      business_challenges: "Supply chain optimization, quality control, production planning",
      current_systems: "Legacy ERP systems",
      budget: "$2M",
      timeline: "12-18 months",
      uploaded_files: [],
      deals: [
        {
          deal_name: "SAP Implementation",
          deal_value: 1500000,
          stage: "Proposal",
          probability: 75,
        },
      ],
    };

    console.log("🔍 Debug RAG Timing: Running RAG analysis...");
    const analysis = await ragService.generateAnalysis(testCompanyContext);
    
    const totalTime = Date.now() - startTime;
    console.log(`⏱️ Debug RAG Timing: Total time: ${totalTime}ms (${(totalTime/1000).toFixed(1)}s)`);

    return NextResponse.json({
      success: true,
      timing: {
        totalTimeMs: totalTime,
        totalTimeSeconds: (totalTime/1000).toFixed(1),
      },
      analysis: {
        hasSolutions: !!analysis.recommendedSolutions,
        solutionsCount: analysis.recommendedSolutions?.length || 0,
        hasChallenges: !!analysis.businessChallenges,
        challengesCount: analysis.businessChallenges?.length || 0,
      },
    });
  } catch (error) {
    console.error("❌ Debug RAG Timing: Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
} 