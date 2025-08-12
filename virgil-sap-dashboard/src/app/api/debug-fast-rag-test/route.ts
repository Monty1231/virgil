import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ragServiceFast } from "@/lib/rag-service-fast";

export async function POST(request: NextRequest) {
  try {
    const startTime = Date.now();
    console.log("🚀 Fast RAG Performance Test: Starting...");

    // Test with a sample company context
    const testCompanyContext = {
      name: "Test Manufacturing Company",
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

    console.log("🚀 Fast RAG Performance Test: Running analysis...");
    const analysis = await ragServiceFast.generateAnalysis(testCompanyContext);
    
    const totalTime = Date.now() - startTime;
    console.log(`⏱️ Fast RAG Performance Test: Total time: ${totalTime}ms (${(totalTime/1000).toFixed(1)}s)`);

    // Check results
    const solutions = analysis.recommendedSolutions || [];
    const uniqueModules = [...new Set(solutions.map((s: any) => s.module))];

    return NextResponse.json({
      success: true,
      timing: {
        totalTimeMs: totalTime,
        totalTimeSeconds: (totalTime/1000).toFixed(1),
        performance: totalTime < 30000 ? "Excellent (<30s)" : 
                    totalTime < 60000 ? "Good (<60s)" : 
                    totalTime < 120000 ? "Acceptable (<2min)" : "Slow (>2min)"
      },
      analysis: {
        solutionsCount: solutions.length,
        uniqueModulesCount: uniqueModules.length,
        modules: solutions.map((s: any) => ({
          module: s.module,
          priority: s.priority,
          roi: s.estimatedROI,
          fit: s.fitJustification?.substring(0, 80) + "..."
        })),
        hasMultipleSolutions: solutions.length >= 3,
        hasUniqueModules: uniqueModules.length >= 3,
        hasBusinessChallenges: analysis.businessChallenges?.length > 0,
        hasExecutiveSummary: !!analysis.executiveSummary,
      },
    });
  } catch (error) {
    console.error("❌ Fast RAG Performance Test: Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
} 