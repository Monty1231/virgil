import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { knowledgeBase } from "./knowledge-base";
import { VectorSearchResult } from "./vector-db";

export interface CompanyContext {
  name: string;
  industry: string;
  company_size: string;
  region: string;
  business_challenges?: string;
  current_systems?: string;
  budget?: string;
  timeline?: string;
  uploaded_files?: Array<{
    name: string;
    category: string;
    content?: string;
  }>;
  deals?: Array<{
    deal_name: string;
    deal_value: number;
    stage: string;
    probability: number;
  }>;
}

export class RAGServiceFast {
  async generateAnalysis(companyContext: CompanyContext): Promise<any> {
    const startTime = Date.now();
    console.log("🚀 Fast RAG: Starting analysis for", companyContext.name);

    try {
      // Step 1: Single vector search for SAP products (reduced from multiple searches)
      const vectorStart = Date.now();
      const challenges = companyContext.business_challenges
        ? [companyContext.business_challenges]
        : ["business optimization"];
      
      const relevantProducts = await knowledgeBase.getSAPProductRecommendations(
        companyContext.industry,
        challenges
      );
      const vectorEnd = Date.now();
      console.log(`⏱️ Fast RAG: Vector search took ${vectorEnd - vectorStart}ms`);

      // Step 2: Single LLM call for everything (instead of 3 separate calls)
      const llmStart = Date.now();
      const prompt = this.buildFastPrompt(companyContext, relevantProducts);
      
      const { text: analysisTextRaw } = await generateText({
        model: openai("gpt-4o"),
        prompt,
        temperature: 0.2,
        maxTokens: 4000, // Single call, moderate size
      });
      const llmEnd = Date.now();
      console.log(`⏱️ Fast RAG: LLM call took ${llmEnd - llmStart}ms`);

      // Step 3: Parse and format results
      let analysisText = analysisTextRaw.trim();
      if (analysisText.startsWith("```json")) {
        analysisText = analysisText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
      }

      const analysis = JSON.parse(analysisText);
      
      const totalTime = Date.now() - startTime;
      console.log(`⏱️ Fast RAG: Total time: ${totalTime}ms (${(totalTime/1000).toFixed(1)}s)`);

      return analysis;
    } catch (error) {
      console.error("Fast RAG: Error:", error);
      throw error;
    }
  }

  private buildFastPrompt(company: CompanyContext, products: VectorSearchResult[]): string {
    const productInfo = products
      .slice(0, 6) // Limit to top 6 products for faster processing
      .map(p => `- ${p.metadata.product_name}: ${p.content.substring(0, 120)}...`)
      .join('\n');

    return `Generate a complete SAP analysis for ${company.name} (${company.industry} industry, ${company.company_size}).

Company Context:
- Challenges: ${company.business_challenges || "Business optimization"}
- Current Systems: ${company.current_systems || "Legacy systems"}
- Budget: ${company.budget || "To be determined"}
- Timeline: ${company.timeline || "Flexible"}

Available SAP Products:
${productInfo}

Return ONLY a JSON object with:
{
  "recommendedSolutions": [
    {
      "module": "SAP Product Name",
      "fitJustification": "Why this fits (2-3 sentences)",
      "priority": 1,
      "addressedProblems": ["Problem 1", "Problem 2"],
      "requirements": ["Requirement 1", "Requirement 2"],
      "reasoning": "Short explanation of how this module meets the requirements and why it was recommended.",
      "estimatedROI": 20,
      "timeToValue": "6-12 months",
      "estimatedCostMin": 500000,
      "estimatedCostMax": 1500000,
      "keyBenefits": ["Benefit 1", "Benefit 2", "Benefit 3"],
      "businessImpact": "Brief business impact statement",
      "riskMitigation": ["Risk 1", "Risk 2", "Risk 3"],
      "successMetrics": ["Metric 1", "Metric 2", "Metric 3"]
    },
    {
      "module": "Different SAP Product",
      "fitJustification": "Why this fits (2-3 sentences)",
      "priority": 2,
      "estimatedROI": 18,
      "timeToValue": "9-15 months",
      "estimatedCostMin": 300000,
      "estimatedCostMax": 1000000,
      "keyBenefits": ["Benefit 1", "Benefit 2", "Benefit 3"],
      "businessImpact": "Brief business impact statement",
      "riskMitigation": ["Risk 1", "Risk 2", "Risk 3"],
      "successMetrics": ["Metric 1", "Metric 2", "Metric 3"]
    },
    {
      "module": "Another SAP Product",
      "fitJustification": "Why this fits (2-3 sentences)",
      "priority": 3,
      "estimatedROI": 16,
      "timeToValue": "12-18 months",
      "estimatedCostMin": 400000,
      "estimatedCostMax": 1200000,
      "keyBenefits": ["Benefit 1", "Benefit 2", "Benefit 3"],
      "businessImpact": "Brief business impact statement",
      "riskMitigation": ["Risk 1", "Risk 2", "Risk 3"],
      "successMetrics": ["Metric 1", "Metric 2", "Metric 3"]
    }
  ],
  "businessChallenges": [
    "Challenge 1 (2-3 sentences)",
    "Challenge 2 (2-3 sentences)",
    "Challenge 3 (2-3 sentences)"
  ],
  "fitScore": 75,
  "overallFit": "High",
  "keySuccessFactors": [
    "Factor 1 (2-3 sentences)",
    "Factor 2 (2-3 sentences)", 
    "Factor 3 (2-3 sentences)"
  ],
  "competitiveAnalysis": {
    "sapAdvantages": [
      "Advantage 1 (2-3 sentences)",
      "Advantage 2 (2-3 sentences)",
      "Advantage 3 (2-3 sentences)"
    ],
    "competitorComparison": {
      "oracle": "SAP advantage over Oracle (2-3 sentences)",
      "microsoft": "SAP advantage over Microsoft (2-3 sentences)"
    },
    "differentiators": [
      "Differentiator 1 (2-3 sentences)",
      "Differentiator 2 (2-3 sentences)"
    ]
  },
  "executiveSummary": "Brief summary (100-150 characters)"
}

Generate EXACTLY 3 different SAP modules with priorities 1, 2, 3. Use realistic numbers based on company size and industry. Keep responses concise but informative.

For each SAP module recommended, clearly show the traceability from customer problem → requirement → SAP product/module.
For each solution, provide a reasoning/explanation field that makes the model's logic visible to the user (explainable AI).`;
  }
}

export const ragServiceFast = new RAGServiceFast(); 