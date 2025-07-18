import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { knowledgeBase } from "@/lib/knowledge-base";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

export async function POST(request: NextRequest) {
  try {
    const startTime = Date.now();
    console.log("🚀 Fast RAG Test: Starting...");

    // Test with a sample company context
    const testCompanyContext = {
      name: "Test Company",
      industry: "Manufacturing",
      company_size: "Enterprise",
      region: "North America",
      business_challenges: "Supply chain optimization, quality control",
      current_systems: "Legacy ERP systems",
      budget: "$2M",
      timeline: "12-18 months",
    };

    // Step 1: Minimal vector search (only SAP products)
    const vectorSearchStart = Date.now();
    const relevantProducts = await knowledgeBase.getSAPProductRecommendations(
      testCompanyContext.industry,
      [testCompanyContext.business_challenges]
    );
    const vectorSearchEnd = Date.now();
    console.log(
      `⏱️ Fast RAG: Vector search took ${vectorSearchEnd - vectorSearchStart}ms`
    );

    // Step 2: Simple prompt with minimal context
    const llmStart = Date.now();
    const simplePrompt = `Generate 2 SAP product recommendations for a ${
      testCompanyContext.industry
    } company with challenges: ${testCompanyContext.business_challenges}.

Available SAP products:
${relevantProducts
  .slice(0, 5)
  .map((p) => `- ${p.metadata.product_name}: ${p.content.substring(0, 200)}...`)
  .join("\n")}

Return only a JSON array with 2 products, each having: module (string), fitJustification (string), priority (number), estimatedROI (number).`;

    const { text: solutionsTextRaw } = await generateText({
      model: openai("gpt-4o"),
      prompt: simplePrompt,
      temperature: 0.2,
      maxTokens: 2000, // Very short
    });

    const llmEnd = Date.now();
    console.log(`⏱️ Fast RAG: LLM call took ${llmEnd - llmStart}ms`);

    // Parse results
    let solutionsText = solutionsTextRaw.trim();
    if (solutionsText.startsWith("```json")) {
      solutionsText = solutionsText
        .replace(/^```json\s*/, "")
        .replace(/\s*```$/, "");
    }

    const solutions = JSON.parse(solutionsText);

    const totalTime = Date.now() - startTime;
    console.log(
      `⏱️ Fast RAG: Total time: ${totalTime}ms (${(totalTime / 1000).toFixed(
        1
      )}s)`
    );

    return NextResponse.json({
      success: true,
      timing: {
        totalTimeMs: totalTime,
        totalTimeSeconds: (totalTime / 1000).toFixed(1),
        vectorSearchMs: vectorSearchEnd - vectorSearchStart,
        llmMs: llmEnd - llmStart,
      },
      analysis: {
        solutionsCount: solutions.length,
        solutions: solutions,
      },
    });
  } catch (error) {
    console.error("❌ Fast RAG Test: Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
