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
      console.log(
        `⏱️ Fast RAG: Vector search took ${vectorEnd - vectorStart}ms`
      );

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
        analysisText = analysisText
          .replace(/^```json\s*/, "")
          .replace(/\s*```$/, "");
      }

      const analysis = JSON.parse(analysisText);

      // Post-process: compute objective fitScore from vector similarity and basic alignment
      try {
        const relevant = relevantProducts || [];
        const normalize = (s: string) =>
          s.toLowerCase().replace(/\s+/g, " ").trim();
        const companyIndustry = companyContext.industry || "";
        const budgetStr = companyContext.budget || "";
        const parseBudgetRange = (
          text: string
        ): { min?: number; max?: number } => {
          if (!text) return {};
          const normalizedB = text
            .toLowerCase()
            .replace(/\$/g, "")
            .replace(/\s/g, "");
          const match = normalizedB.match(
            /(\d+(?:\.\d+)?\s*[km]?)\s*[-–to]+\s*(\d+(?:\.\d+)?\s*[km]?)/i
          );
          const single = normalizedB.match(/^(\d+(?:\.\d+)?)([km])?$/i);
          const toNumber = (s: string) => {
            const m = s.match(/(\d+(?:\.\d+)?)([km])?/i);
            if (!m) return undefined;
            const val = parseFloat(m[1]);
            const suf = (m[2] || "").toLowerCase();
            if (suf === "m") return val * 1_000_000;
            if (suf === "k") return val * 1_000;
            return val;
          };
          if (match)
            return { min: toNumber(match[1]), max: toNumber(match[2]) };
          if (single) {
            const v = toNumber(single[0]);
            return { min: v, max: v };
          }
          return {};
        };
        const budget = parseBudgetRange(budgetStr);

        const findVectorScore = (name: string): number | undefined => {
          const target = normalize(name).replace(/\s*\(.*?\)\s*$/, "");
          let best: number | undefined = undefined;
          for (const p of relevant) {
            const pname = normalize(
              String(p.metadata?.product_name || "")
            ).replace(/\s*\(.*?\)\s*$/, "");
            if (
              pname === target ||
              pname.includes(target) ||
              target.includes(pname)
            ) {
              best = Math.max(best ?? 0, Number(p.score) || 0);
            }
          }
          return best;
        };

        const industryAligned = (name: string): boolean => {
          for (const p of relevant) {
            const pname = normalize(String(p.metadata?.product_name || ""));
            if (pname.includes(normalize(name))) {
              const inds: string[] = Array.isArray(p.metadata?.industries)
                ? p.metadata.industries
                : [];
              if (inds.map(normalize).includes(normalize(companyIndustry)))
                return true;
            }
          }
          return false;
        };

        if (Array.isArray(analysis?.recommendedSolutions)) {
          analysis.recommendedSolutions = analysis.recommendedSolutions.map(
            (s: any) => {
              const vs = findVectorScore(s.module || s.product_name || "");
              let base =
                typeof vs === "number"
                  ? Number((Math.max(0, Math.min(1, vs)) * 100).toFixed(2))
                  : NaN;
              if (Number.isNaN(base)) {
                const raw = s.fitScore ?? s.fit_score ?? null;
                if (typeof raw === "number" && Number.isFinite(raw))
                  base = Number(raw.toFixed(2));
                else {
                  const fitStr = String(s.fit || "").toLowerCase();
                  if (fitStr.includes("high")) base = 85;
                  else if (fitStr.includes("medium")) base = 65;
                  else if (fitStr.includes("low")) base = 40;
                  else base = 60;
                }
              }
              return {
                ...s,
                fitScore: Number(Math.max(0, Math.min(100, base)).toFixed(2)),
                retrievalScore:
                  typeof vs === "number" ? Math.round(vs * 100) : undefined,
              };
            }
          );
          // Sort by fitScore descending and reassign priority 1..n
          analysis.recommendedSolutions.sort(
            (a: any, b: any) =>
              (b.fitScore ?? -Infinity) - (a.fitScore ?? -Infinity)
          );
          analysis.recommendedSolutions.forEach((m: any, idx: number) => {
            m.priority = idx + 1;
          });
        }
      } catch (e) {
        console.warn(
          "Fast RAG: fitScore post-process failed, keeping model values",
          e
        );
      }

      const totalTime = Date.now() - startTime;
      console.log(
        `⏱️ Fast RAG: Total time: ${totalTime}ms (${(totalTime / 1000).toFixed(
          1
        )}s)`
      );

      return analysis;
    } catch (error) {
      console.error("Fast RAG: Error:", error);
      throw error;
    }
  }

  private buildFastPrompt(
    company: CompanyContext,
    products: VectorSearchResult[]
  ): string {
    const productInfo = products
      .slice(0, 6) // Limit to top 6 products for faster processing
      .map(
        (p) => `- ${p.metadata.product_name}: ${p.content.substring(0, 120)}...`
      )
      .join("\n");

    return `Generate a complete SAP analysis for ${company.name} (${
      company.industry
    } industry, ${company.company_size}).

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
      "fitScore": 70,
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
      "fitScore": 65,
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
      "fitScore": 60,
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
