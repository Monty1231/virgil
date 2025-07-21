import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ragService } from "@/lib/rag-service";

export async function POST(request: NextRequest) {
  try {
    const startTime = Date.now();
    console.log("🔍 Multi-Module RAG Test: Starting...");

    // Test with a sample company context
    const testCompanyContext = {
      name: "JPMorgan Chase",
      industry: "Financial Services",
      company_size: "Enterprise",
      region: "North America",
      business_challenges:
        "Regulatory compliance, legacy system modernization, customer experience optimization",
      current_systems: "Legacy banking systems",
      budget: "$5M",
      timeline: "18-24 months",
      uploaded_files: [],
      deals: [
        {
          deal_name: "Digital Transformation",
          deal_value: 5000000,
          stage: "Discovery",
          probability: 80,
        },
      ],
    };

    console.log("🔍 Multi-Module RAG Test: Running analysis...");
    const analysis = await ragService.generateAnalysis(testCompanyContext);

    const totalTime = Date.now() - startTime;
    console.log(
      `⏱️ Multi-Module RAG Test: Total time: ${totalTime}ms (${(
        totalTime / 1000
      ).toFixed(1)}s)`
    );

    // Check if we got multiple solutions
    const solutions = analysis.recommendedSolutions || [];
    const uniqueModules = [...new Set(solutions.map((s) => s.module))];

    console.log(
      `🔍 Multi-Module RAG Test: Generated ${solutions.length} solutions with ${uniqueModules.length} unique modules`
    );

    return NextResponse.json({
      success: true,
      timing: {
        totalTimeMs: totalTime,
        totalTimeSeconds: (totalTime / 1000).toFixed(1),
      },
      analysis: {
        solutionsCount: solutions.length,
        uniqueModulesCount: uniqueModules.length,
        modules: solutions.map((s) => ({
          module: s.module,
          priority: s.priority,
          roi: s.estimatedROI,
          fit: s.fitJustification?.substring(0, 100) + "...",
        })),
        hasMultipleSolutions: solutions.length >= 3,
        hasUniqueModules: uniqueModules.length >= 3,
      },
    });
  } catch (error) {
    console.error("❌ Multi-Module RAG Test: Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
