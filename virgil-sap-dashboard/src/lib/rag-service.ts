import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { knowledgeBase } from "./knowledge-base";
import { VectorSearchResult } from "./vector-db";
import { embeddingService } from "./embeddings";

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

export interface RAGContext {
  company: CompanyContext;
  relevantProducts: VectorSearchResult[];
  industryInsights: VectorSearchResult[];
  implementationGuidance: VectorSearchResult[];
  companyProfiles: VectorSearchResult[];
  relevantFiles: VectorSearchResult[];
  fileContent?: string;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
}

export class RAGService {
  private readonly GPT4O_INPUT_COST_PER_1M = 5.0;
  private readonly GPT4O_OUTPUT_COST_PER_1M = 15.0;

  async generateAnalysis(companyContext: CompanyContext): Promise<any> {
    try {
      console.log("🔍 RAG Service: Starting analysis for", companyContext.name);

      // Step 1: Retrieve relevant context
      const ragContext = await this.retrieveRelevantContext(companyContext);

      // Step 2: Generate analysis using RAG
      const analysis = await this.generateAnalysisWithRAG(ragContext);

      return analysis;
    } catch (error) {
      console.error("RAG Service: Error generating analysis:", error);
      throw error;
    }
  }

  private async retrieveRelevantContext(
    company: CompanyContext
  ): Promise<RAGContext> {
    console.log("🔍 RAG Service: Retrieving relevant context...");

    // Get company challenges for better retrieval
    const challenges = company.business_challenges
      ? [company.business_challenges]
      : this.getDefaultChallenges(company.industry);

    // Retrieve relevant SAP products
    const relevantProducts = await knowledgeBase.getSAPProductRecommendations(
      company.industry,
      challenges
    );

    // Retrieve industry insights
    const industryInsights = await knowledgeBase.getIndustryInsights(
      company.industry
    );

    // Retrieve implementation guidance for top products
    const topProducts = relevantProducts
      .filter((result) => result.metadata.type === "sap_product")
      .slice(0, 3);

    const implementationGuidance: VectorSearchResult[] = [];
    for (const product of topProducts) {
      const guidance = await knowledgeBase.getImplementationGuidance(
        product.metadata.product_name
      );
      implementationGuidance.push(...guidance);
    }

    // Retrieve similar company profiles and their solutions
    const similarCompanies = await knowledgeBase.searchRelevantContext(
      `Company profile: ${company.industry} industry, ${
        company.company_size
      } company, ${company.business_challenges || "business challenges"}`,
      company.industry,
      5
    );

    const companyProfiles = similarCompanies.filter(
      (result) => result.metadata.type === "company_profile"
    );

    // Always include the current company's profile chunk directly
    let currentCompanyProfileChunk: VectorSearchResult[] = [];
    if ((company as any).id) {
      currentCompanyProfileChunk = await knowledgeBase.searchRelevantContext(
        `company profile ${company.name} ${company.industry}`,
        company.industry,
        1
      );
    }
    // Merge, avoiding duplicates
    const allCompanyProfiles = [
      ...currentCompanyProfileChunk,
      ...companyProfiles.filter(
        (profile) =>
          !currentCompanyProfileChunk.some((curr) => curr.id === profile.id)
      ),
    ];

    // Retrieve relevant file content from similar companies
    const relevantFiles = await knowledgeBase.searchRelevantContext(
      `File content related to ${company.industry} industry, ${
        company.business_challenges || "business challenges"
      }`,
      company.industry,
      3
    );

    const fileContent = relevantFiles.filter(
      (result) => result.metadata.type === "company_file"
    );

    // Process uploaded files if available
    let currentFileContent: string | undefined;
    if (company.uploaded_files && company.uploaded_files.length > 0) {
      const filesWithContent = company.uploaded_files.filter(
        (file) => file.content
      );
      if (filesWithContent.length > 0) {
        currentFileContent = filesWithContent
          .map(
            (file) => `File: ${file.name} (${file.category})\n${file.content}`
          )
          .join("\n\n---\n\n");
      }
    }

    console.log("🔍 RAG Service: Retrieved context:", {
      products: relevantProducts.length,
      insights: industryInsights.length,
      guidance: implementationGuidance.length,
      similarCompanies: allCompanyProfiles.length,
      relevantFiles: fileContent.length,
      hasCurrentFileContent: !!currentFileContent,
    });

    return {
      company,
      relevantProducts,
      industryInsights,
      implementationGuidance,
      companyProfiles: allCompanyProfiles,
      relevantFiles: fileContent,
      fileContent: currentFileContent,
    };
  }

  private getDefaultChallenges(industry: string): string[] {
    const defaultChallenges: Record<string, string[]> = {
      "Financial Services": [
        "Regulatory compliance and reporting",
        "Risk management and fraud detection",
        "Legacy system integration",
      ],
      Manufacturing: [
        "Supply chain complexity",
        "Quality control and compliance",
        "Production planning and scheduling",
      ],
      Healthcare: [
        "Patient data security and HIPAA compliance",
        "Interoperability between systems",
        "Revenue cycle management",
      ],
      Technology: [
        "Scalability and performance",
        "Data integration and analytics",
        "Customer experience optimization",
      ],
      Retail: [
        "Inventory management",
        "Customer experience",
        "Omnichannel operations",
      ],
    };

    return (
      defaultChallenges[industry] || [
        "Operational efficiency",
        "Data integration",
        "Process optimization",
      ]
    );
  }

  private calculateTokenCost(usage: TokenUsage): number {
    const inputCost =
      (usage.promptTokens / 1000000) * this.GPT4O_INPUT_COST_PER_1M;
    const outputCost =
      (usage.completionTokens / 1000000) * this.GPT4O_OUTPUT_COST_PER_1M;
    return inputCost + outputCost;
  }

  private logTokenUsage(usage: TokenUsage, step: string): void {
    const cost = this.calculateTokenCost(usage);
    console.log(`💰 ${step} Token Usage:`, {
      prompt: usage.promptTokens,
      completion: usage.completionTokens,
      total: usage.totalTokens,
      cost: `$${cost.toFixed(4)}`,
    });
  }

  private async generateAnalysisWithRAG(ragContext: RAGContext): Promise<any> {
    console.log(
      "🤖 RAG Service: Generating analysis with retrieved context..."
    );

    // Log the full RAG context for debugging
    console.log("🔍 FULL RAG CONTEXT:", JSON.stringify(ragContext, null, 2));

    // Prepare context for the AI model
    const contextPrompt = this.buildContextPrompt(ragContext);

    // Generate solutions with RAG context
    const solutions = await this.generateSolutionsWithRAG(
      ragContext,
      contextPrompt
    );

    // Log the raw LLM output for solutions
    if (typeof solutions === "string") {
      console.log("🤖 LLM RAW OUTPUT (solutions):", solutions);
    }

    // Generate business challenges
    const businessChallenges = await this.generateBusinessChallengesWithRAG(
      ragContext,
      contextPrompt
    );

    // Log the raw LLM output for business challenges
    if (typeof businessChallenges === "string") {
      console.log(
        "🤖 LLM RAW OUTPUT (businessChallenges):",
        businessChallenges
      );
    }

    // Generate comprehensive analysis
    const analysis = await this.generateComprehensiveAnalysisWithRAG(
      ragContext,
      solutions,
      businessChallenges,
      contextPrompt
    );

    // Log the raw LLM output for analysis if available
    if (typeof analysis === "string") {
      console.log("🤖 LLM RAW OUTPUT (analysis):", analysis);
    }

    // Flatten the structure to match frontend expectations
    const flattenedAnalysis = {
      // Core fields expected by frontend
      recommendedSolutions:
        analysis?.coreAnalysisFields?.recommendedSolutions || solutions || [],
      businessChallenges: (() => {
        // Ensure businessChallenges are always strings
        const challenges =
          analysis?.coreAnalysisFields?.businessChallenges ||
          businessChallenges ||
          [];
        return challenges.map((challenge: any) => {
          if (typeof challenge === "string") {
            return challenge;
          } else if (typeof challenge === "object" && challenge !== null) {
            // Convert object to string format
            return `${challenge.business_process || "Business Process"}: ${
              challenge.pain_points || "Pain points"
            } - ${challenge.impact || "Impact"} - ${
              challenge.sap_alignment || "SAP alignment"
            } - ${challenge.industry_context || "Industry context"}`;
          } else {
            return "Business challenge requiring SAP solution implementation";
          }
        });
      })(),
      fitScore: this.calculateFitScore(
        ragContext.company,
        ragContext.relevantProducts.length
      ),
      overallFit: (() => {
        const score = this.calculateFitScore(
          ragContext.company,
          ragContext.relevantProducts.length
        );
        if (score >= 80) return "Excellent";
        if (score >= 60) return "High";
        if (score >= 40) return "Medium";
        return "Low";
      })(),

      // Additional detailed sections
      companyProfileAnalysis:
        analysis?.detailedAnalysisSections?.companyProfileAnalysis || "",
      businessContextAnalysis:
        analysis?.detailedAnalysisSections?.businessContextAnalysis || "",
      aiAnalysisMethodology:
        analysis?.detailedAnalysisSections?.aiAnalysisMethodology || "",

      // Financial analysis
      businessCase: this.fillBusinessCaseFallbacks(
        analysis?.financialAnalysis?.businessCase || {}
      ),
      financialAnalysis: analysis?.financialAnalysis?.financialAnalysis || {},

      // Implementation strategy
      implementationRoadmap:
        analysis?.implementationStrategy?.implementationRoadmap || [],
      competitiveAnalysis:
        analysis?.implementationStrategy?.competitiveAnalysis || {},
      riskFactors: analysis?.implementationStrategy?.riskFactors || [],
      nextSteps: analysis?.implementationStrategy?.nextSteps || [],

      // Executive summary
      executiveSummary: analysis?.executiveSummary || "",

      // Additional fields for compatibility
      estimatedROI:
        analysis?.financialAnalysis?.businessCase?.riskAdjustedROI || 25,
      implementationTime:
        analysis?.implementationStrategy?.implementationRoadmap?.[0]
          ?.duration || "12-18 months",
      recommendations: (
        analysis?.coreAnalysisFields?.recommendedSolutions ||
        solutions ||
        []
      ).map((s: any) => s.module || s.product_name || "SAP Module"),
    };

    return flattenedAnalysis;
  }

  private buildContextPrompt(ragContext: RAGContext): string {
    const {
      company,
      relevantProducts,
      industryInsights,
      implementationGuidance,
      companyProfiles,
      relevantFiles,
      fileContent,
    } = ragContext;

    let context = `# COMPANY PROFILE
Name: ${company.name}
Industry: ${company.industry}
Size: ${company.company_size}
Region: ${company.region}
Business Challenges: ${company.business_challenges || "To be determined"}
Current Systems: ${company.current_systems || "Legacy systems"}
Budget: ${company.budget || "To be determined"}
Timeline: ${company.timeline || "Flexible"}

# RELEVANT SAP PRODUCTS (Retrieved from Knowledge Base)
${relevantProducts
  .filter((result) => result.metadata.type === "sap_product")
  .map((result) => `- ${result.metadata.product_name}: ${result.content}`)
  .join("\n")}

# INDUSTRY INSIGHTS (Retrieved from Knowledge Base)
${industryInsights
  .filter((result) => result.metadata.type === "industry_context")
  .map((result) => `- ${result.metadata.category}: ${result.content}`)
  .join("\n")}

# IMPLEMENTATION GUIDANCE (Retrieved from Knowledge Base)
${implementationGuidance
  .filter((result) => result.metadata.type === "best_practice")
  .map((result) => `- ${result.content}`)
  .join("\n")}

# SIMILAR COMPANY PROFILES (Retrieved from Knowledge Base)
${companyProfiles
  .map(
    (result) =>
      `- ${result.metadata.company_name} (${result.metadata.industry}): ${result.content}`
  )
  .join("\n")}

# RELEVANT FILE CONTENT (Retrieved from Knowledge Base)
${relevantFiles
  .map((result) => `- ${result.metadata.file_name}: ${result.content}`)
  .join("\n")}`;

    if (fileContent) {
      context += `\n\n# UPLOADED DOCUMENTS
${fileContent}`;
    }

    if (company.deals && company.deals.length > 0) {
      const totalValue = company.deals.reduce(
        (sum, deal) => sum + deal.deal_value,
        0
      );
      const avgValue = totalValue / company.deals.length;
      context += `\n\n# DEAL PIPELINE CONTEXT
Total Pipeline Value: $${totalValue.toLocaleString()}
Average Deal Value: $${avgValue.toLocaleString()}
Number of Deals: ${company.deals.length}`;
    }

    return context;
  }

  private async generateSolutionsWithRAG(
    ragContext: RAGContext,
    contextPrompt: string
  ): Promise<any[]> {
    const solutionsPrompt = `# CRITICAL: SALES-FOCUSED ANALYSIS REQUIRED
# IMPORTANT: Write all content from a SALES PERSPECTIVE to convince the client to purchase SAP modules
# Focus on benefits, ROI, competitive advantages, and value proposition
# CRITICAL: DO NOT write generic analysis - be specific about each SAP module's unique features and capabilities
# CRITICAL: Mention the specific SAP module name multiple times in each analysis

# CONTEXT FROM KNOWLEDGE BASE:
${contextPrompt}

Return ONLY a valid JSON array. Do NOT include any explanation, markdown, or extra text. Do NOT use markdown code blocks.
Generate ONLY the recommendedSolutions array for this company. For each SAP module, provide:
- module (string, must match a real SAP product from the context)
- fitJustification (5+ sentences written from a SALES PERSPECTIVE, emphasizing why this specific SAP module is the best solution for this company's needs, highlighting unique benefits and competitive advantages, reference company data and retrieved context)
- priority (number)
- estimatedROI (realistic, nonzero number, e.g., 18.5)
- timeToValue (realistic string, e.g., "9-15 months")
- estimatedCostMin (realistic, nonzero number, e.g., 250000)
- estimatedCostMax (realistic, nonzero number, e.g., 400000)
- keyBenefits (array of 3+ specific benefits that make this SAP module compelling for this company, written from a SALES PERSPECTIVE)
- implementationComplexity (string)
- technicalRequirements (array)
- businessImpact (string written from a SALES PERSPECTIVE, emphasizing the transformative business impact and value this SAP module will deliver)
- riskMitigation (array of 3+ specific strategies to mitigate implementation risks, emphasizing how SAP's expertise and proven methodologies ensure successful delivery)
- successMetrics (array of 3+ measurable success metrics that demonstrate the value and ROI of this SAP module for this company)
- moduleAnalysisContext (MUST be 1200+ characters, structured as a formal business report written from a SALES PERSPECTIVE to convince the client to purchase this specific SAP module. CRITICAL: You MUST mention the specific SAP module name at least 5 times and describe its unique features and capabilities in detail. Structure the analysis as a formal report with the following sections: 1) EXECUTIVE SUMMARY - Comprehensive overview of the SAP module's strategic value, market positioning, and business transformation potential (minimum 150 characters), 2) BUSINESS CHALLENGES ADDRESSED - Detailed analysis of how this specific SAP module addresses the company's unique challenges, industry-specific issues, and competitive pressures (minimum 200 characters), 3) SOLUTION OVERVIEW - Comprehensive overview of the SAP module's features and capabilities (use 3-4 bullet points for key features), 4) BUSINESS IMPACT & ROI - Detailed discussion of tangible business outcomes and success metrics with specific projections and industry benchmarks (use 3-4 bullet points for key metrics), 5) IMPLEMENTATION STRATEGY - Comprehensive implementation approach with risk mitigation, timeline considerations, and change management strategies (use 3-4 bullet points for key steps), 6) COMPETITIVE ADVANTAGES - Strategic positioning and competitive differentiation with market analysis and industry comparisons (minimum 150 characters), 7) CONCLUSION - Strategic value and investment justification with long-term vision and growth potential (minimum 150 characters). Use formal business language with clear section headings in ALL CAPS. Reference specific company data, industry benchmarks, and business challenges from the retrieved context. Format with clear section breaks using double line breaks and use bullet points (•) for key lists. DO NOT write generic analysis - be specific about the module's features and benefits.)

All numeric projections (estimatedROI, estimatedCostMin, estimatedCostMax, etc.) must be uniquely calculated for this company, using the provided company profile, retrieved context, and deal pipeline data. Do NOT use default, placeholder, or repeated values. Each number must be justified by the data and context provided above.

# CRITICAL: Each moduleAnalysisContext MUST mention the specific SAP module name at least 5 times and describe its unique features and capabilities in detail. Do NOT write generic analysis that could apply to any module.

Do NOT include a module unless you can provide ALL required fields with real, nonzero, non-null values and detailed justifications. Do NOT include any projections as null, zero, or placeholder. If you cannot estimate a value, use industry logic and the provided data to make a realistic projection.

Return ONLY the array, no extra text. Example:
[
  {
    "module": "SAP Customer Experience",
    "fitJustification": "SAP Customer Experience is the ideal solution for your company's customer relationship challenges. With advanced analytics and personalized engagement capabilities, this module will transform your customer interactions and drive measurable revenue growth. The integrated approach ensures seamless data flow across all customer touchpoints, providing the competitive advantage you need in today's market.",
    "priority": 1,
    "estimatedROI": 22.5,
    "timeToValue": "12-18 months",
    "estimatedCostMin": 500000,
    "estimatedCostMax": 2000000,
    "keyBenefits": [
      "Advanced customer analytics and insights",
      "Personalized customer engagement",
      "Integrated omnichannel experience"
    ],
    "businessImpact": "Transform customer relationships and drive 25% revenue growth through personalized engagement and data-driven insights.",
    "riskMitigation": [
      "SAP's proven implementation methodology",
      "Comprehensive change management support",
      "Dedicated customer success team"
    ],
    "successMetrics": [
      "25% increase in customer retention",
      "30% reduction in sales cycle time",
      "40% improvement in customer satisfaction scores"
    ],
    "moduleAnalysisContext": "EXECUTIVE SUMMARY\n\nSAP Customer Experience represents a transformative strategic investment opportunity for your organization to revolutionize customer relationship management and drive unprecedented business growth in today's competitive digital landscape. This comprehensive SAP module addresses critical business challenges through advanced analytics, real-time engagement capabilities, and integrated omnichannel experiences that deliver significant ROI and competitive differentiation. The module's sophisticated AI-powered insights and predictive analytics capabilities position your organization to achieve market leadership while building sustainable customer relationships that drive long-term revenue growth and operational excellence.\n\nBUSINESS CHALLENGES ADDRESSED\n\nSAP Customer Experience directly addresses your company's unique business challenges through its sophisticated customer journey mapping and predictive analytics engine, which is specifically designed to overcome the complex obstacles faced by modern enterprises in delivering personalized, data-driven customer experiences. The module transforms customer interactions by enabling anticipation of customer needs and delivery of personalized experiences that significantly reduce sales cycle times and improve customer satisfaction across all touchpoints. SAP Customer Experience provides the competitive advantage your organization needs through its integrated omnichannel approach, ensuring seamless data flow across all customer touchpoints while addressing critical pain points such as data silos, inconsistent customer experiences, and inefficient marketing processes that currently limit your organization's growth potential and market competitiveness."
  }
]`;

    const { text: solutionsTextRaw, usage } = await generateText({
      model: openai("gpt-4o"),
      prompt: solutionsPrompt,
      temperature: 0.2,
      maxTokens: 15000,
    });

    // Log token usage
    if (usage) {
      this.logTokenUsage(
        {
          promptTokens: usage.promptTokens,
          completionTokens: usage.completionTokens,
          totalTokens: usage.totalTokens,
          cost: 0, // Will be calculated by logTokenUsage
        },
        "Solutions Generation"
      );
    }

    let solutionsText = solutionsTextRaw.trim();
    if (solutionsText.startsWith("```json")) {
      solutionsText = solutionsText
        .replace(/^```json\s*/, "")
        .replace(/\s*```$/, "");
    } else if (solutionsText.startsWith("```")) {
      solutionsText = solutionsText
        .replace(/^```\s*/, "")
        .replace(/\s*```$/, "");
    }

    try {
      return JSON.parse(solutionsText);
    } catch (e) {
      console.error("Failed to parse solutions JSON:", e);
      throw new Error("Failed to generate solutions");
    }
  }

  private async generateBusinessChallengesWithRAG(
    ragContext: RAGContext,
    contextPrompt: string
  ): Promise<string[]> {
    const challengesPrompt = `# COMPREHENSIVE BUSINESS CHALLENGES ANALYSIS
# CRITICAL: Generate detailed, specific business challenges that align with SAP solutions
# Use the retrieved context to identify comprehensive business challenges

# CONTEXT FROM KNOWLEDGE BASE:
${contextPrompt}

# TASK:
Generate ONLY a valid JSON array with 3-5 comprehensive business challenges. Each challenge must:
- Be at least 150 characters with specific details
- Reference specific company data, industry context, or current systems from the retrieved information
- Be actionable and specific to this company's situation
- Align with SAP solution capabilities
- Include specific pain points, operational inefficiencies, or strategic gaps
- Reference industry-specific challenges and competitive pressures
- Mention specific business processes, systems, or workflows that need improvement

# CHALLENGE STRUCTURE:
Each challenge should include:
- Specific business process or operational area affected
- Current pain points or inefficiencies
- Impact on business performance or competitive position
- Alignment with SAP solution capabilities
- Industry-specific context and market pressures

# EXAMPLES OF GOOD CHALLENGES:
- "Company X faces the challenge of modernizing its legacy financial systems to compete with fintech startups while ensuring compliance with evolving global financial regulations. This requires balancing the integration of advanced digital solutions with existing SAP systems across treasury, payments, procurement, and supplier workflows, all within a 12-month timeline and a budget of $1M, to enhance customer experience and drive operational efficiency."
- "The manufacturing division struggles with disconnected supply chain systems that result in 25% inventory carrying costs and 15% production delays. Current manual processes for demand forecasting and supplier coordination lead to stockouts and excess inventory, impacting customer satisfaction and profitability."

Return ONLY the JSON array, no explanation or markdown.`;

    const { text: challengesTextRaw, usage } = await generateText({
      model: openai("gpt-4o"),
      prompt: challengesPrompt,
      temperature: 0.2,
      maxTokens: 2000,
    });

    // Log token usage
    if (usage) {
      this.logTokenUsage(
        {
          promptTokens: usage.promptTokens,
          completionTokens: usage.completionTokens,
          totalTokens: usage.totalTokens,
          cost: 0, // Will be calculated by logTokenUsage
        },
        "Business Challenges Generation"
      );
    }

    let challengesText = challengesTextRaw.trim();
    if (challengesText.startsWith("```json")) {
      challengesText = challengesText
        .replace(/^```json\s*/, "")
        .replace(/\s*```$/, "");
    } else if (challengesText.startsWith("```")) {
      challengesText = challengesText
        .replace(/^```\s*/, "")
        .replace(/\s*```$/, "");
    }

    try {
      return JSON.parse(challengesText);
    } catch (e) {
      console.error("Failed to parse challenges JSON:", e);
      throw new Error("Failed to generate business challenges");
    }
  }

  private async generateComprehensiveAnalysisWithRAG(
    ragContext: RAGContext,
    solutions: any[],
    businessChallenges: string[],
    contextPrompt: string
  ): Promise<any> {
    const startTime = Date.now();
    const analysisPrompt = `# COMPREHENSIVE SAP ANALYSIS WITH DETAILED STRUCTURE
# CRITICAL: Generate a complete, detailed analysis matching the traditional approach quality
# Use the retrieved context to generate a comprehensive analysis with all required sections

# CONTEXT FROM KNOWLEDGE BASE:
${contextPrompt}

# ALREADY GENERATED:
Recommended Solutions: ${JSON.stringify(solutions, null, 2)}
Business Challenges: ${JSON.stringify(businessChallenges, null, 2)}

# TASK:
Generate a comprehensive analysis object with the following detailed structure:

## REQUIRED SECTIONS:

### 1. Core Analysis Fields:
- businessChallenges (use the provided array, ensure each challenge is 100+ characters)
- recommendedSolutions (use the provided array)
- overallFit (string: "Excellent", "High", "Medium", "Low")

### 2. Detailed Analysis Sections:
- companyProfileAnalysis (MUST be 800+ characters, structured with: Industry Analysis, Scale Assessment, Regional Factors)
- businessContextAnalysis (MUST be 800+ characters, structured with: Business Challenges, Current Systems, Budget Alignment, Timeline Assessment)
- aiAnalysisMethodology (MUST be 1200+ characters, structured with: Data Sources, Calculation Method, Business Case Summary)

### 3. Financial Analysis:
- businessCase (object with: totalInvestment, projectedSavings, paybackPeriod, netPresentValue, riskAdjustedROI - all as realistic numbers)
- financialAnalysis (object with: investmentCalculation, savingsProjection, roiAnalysis)

### 4. Implementation & Strategy:
- implementationRoadmap (array with 5-7 phases, each with: phase, duration, activities, deliverables, resources, calculatedCost)
- competitiveAnalysis (object with: sapAdvantages array, competitorComparison object, differentiators array)
- riskFactors (array of 4-6 specific risk factors)
- nextSteps (array of 3-5 actionable next steps)

### 5. Executive Summary:
- executiveSummary (compelling sales-focused summary, 200+ characters)

# CRITICAL REQUIREMENTS:
- Reference specific insights from the retrieved knowledge base
- Use industry benchmarks and best practices from the context
- Base all projections on the retrieved data and company profile
- Write from a sales perspective to convince the client
- Be specific and actionable with realistic numbers
- Ensure all numeric fields are calculated based on company size, industry, and retrieved context
- Structure implementation roadmap with realistic phases and timelines
- Include comprehensive competitive analysis with specific advantages
- Provide detailed risk factors with mitigation strategies

# FORMATTING REQUIREMENTS:
- Use clear section headings and structured content
- Include bullet points for lists where appropriate
- Ensure all text fields meet minimum character requirements
- Use realistic financial projections based on industry data
- Reference specific SAP products and features from the retrieved context

Return ONLY the JSON object, no explanation or markdown.`;

    const { text: analysisTextRaw, usage } = await generateText({
      model: openai("gpt-4o"),
      prompt: analysisPrompt,
      temperature: 0.2,
      maxTokens: 6000, // Reduced from 12000
    });

    const endTime = Date.now();
    console.log(
      `⏱️ RAG Service: Comprehensive analysis LLM call took ${
        endTime - startTime
      }ms`
    );

    // Log token usage
    if (usage) {
      this.logTokenUsage(
        {
          promptTokens: usage.promptTokens,
          completionTokens: usage.completionTokens,
          totalTokens: usage.totalTokens,
          cost: 0, // Will be calculated by logTokenUsage
        },
        "Comprehensive Analysis Generation"
      );
    }

    let analysisText = analysisTextRaw.trim();
    if (analysisText.startsWith("```json")) {
      analysisText = analysisText
        .replace(/^```json\s*/, "")
        .replace(/\s*```$/, "");
    } else if (analysisText.startsWith("```")) {
      analysisText = analysisText.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    try {
      return JSON.parse(analysisText);
    } catch (e) {
      console.error("Failed to parse analysis JSON:", e);
      throw new Error("Failed to generate comprehensive analysis");
    }
  }

  private calculateFitScore(
    company: CompanyContext,
    relevantProductsCount: number
  ): number {
    let score = 50; // Base score

    // Industry alignment
    const industryScores: Record<string, number> = {
      "Financial Services": 15,
      Manufacturing: 12,
      Healthcare: 10,
      Technology: 8,
      Retail: 6,
    };
    score += industryScores[company.industry] || 4;

    // Company size
    const sizeScores: Record<string, number> = {
      "Enterprise (5000+ employees)": 12,
      "Large (1000-4999 employees)": 10,
      "Medium (100-999 employees)": 8,
      "Small (1-99 employees)": 4,
    };
    score += sizeScores[company.company_size] || 6;

    // Business challenges complexity
    if (company.business_challenges) {
      const challenges = company.business_challenges.toLowerCase();
      if (
        challenges.includes("supply chain") ||
        challenges.includes("complex")
      ) {
        score += 10;
      } else if (
        challenges.includes("financial") ||
        challenges.includes("compliance")
      ) {
        score += 8;
      } else if (
        challenges.includes("integration") ||
        challenges.includes("data")
      ) {
        score += 6;
      } else if (
        challenges.includes("basic") ||
        challenges.includes("simple")
      ) {
        score += 4;
      } else {
        score += 2;
      }
    } else {
      score += 2;
    }

    // Budget and timeline alignment
    if (company.budget && company.timeline) {
      const budget = company.budget.toLowerCase();
      const timeline = company.timeline.toLowerCase();

      if (
        budget.includes("1m") ||
        budget.includes("1000000") ||
        budget.includes("million")
      ) {
        if (timeline.includes("12") || timeline.includes("year")) {
          score += 8;
        } else {
          score += 6;
        }
      } else if (budget.includes("500k") || budget.includes("500000")) {
        if (timeline.includes("6") || timeline.includes("12")) {
          score += 6;
        } else {
          score += 4;
        }
      } else if (budget.includes("100k") || budget.includes("100000")) {
        if (timeline.includes("3") || timeline.includes("6")) {
          score += 4;
        } else {
          score += 2;
        }
      } else {
        score += 3;
      }
    } else {
      score += 3;
    }

    // Risk factors (subtract points)
    if (
      company.current_systems &&
      company.current_systems.toLowerCase().includes("legacy")
    ) {
      score -= 2;
    }
    if (
      company.budget &&
      company.budget.includes("500k") &&
      company.timeline &&
      company.timeline.includes("12")
    ) {
      score -= 3; // Large budget with long timeline
    }
    if (
      company.budget &&
      company.budget.includes("100k") &&
      company.timeline &&
      company.timeline.includes("3")
    ) {
      score -= 5; // Small budget with short timeline
    }

    // Relevant products bonus
    score += Math.min(relevantProductsCount * 2, 10); // Up to 10 points for relevant products

    // Clamp to 0-100 and round
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private fillBusinessCaseFallbacks(businessCase: any): any {
    // Map AI-generated field names to expected field names
    if (businessCase.estimatedCostMin && businessCase.estimatedCostMax) {
      businessCase.totalInvestment = Math.round(
        (businessCase.estimatedCostMin + businessCase.estimatedCostMax) / 2
      );
    }
    if (businessCase.totalEstimatedCost) {
      businessCase.totalInvestment = businessCase.totalEstimatedCost;
    }
    if (businessCase.estimatedROI) {
      let roi = businessCase.estimatedROI;
      if (roi < 0) roi = 25;
      if (roi > 100) roi = 50;
      businessCase.riskAdjustedROI = Math.round(roi);
    }
    if (businessCase.totalEstimatedROI) {
      let roi = businessCase.totalEstimatedROI;
      if (roi < 0) roi = 25;
      if (roi > 100) roi = 50;
      businessCase.riskAdjustedROI = Math.round(roi);
    }
    if (businessCase.timeToValue) {
      businessCase.paybackPeriod = businessCase.timeToValue;
    }
    if (businessCase.totalTimeToValue) {
      businessCase.paybackPeriod = businessCase.totalTimeToValue;
    }
    // Provide fallback values for missing fields
    if (!businessCase.totalInvestment || businessCase.totalInvestment === 0) {
      businessCase.totalInvestment = 1500000;
    }
    if (!businessCase.projectedSavings || businessCase.projectedSavings === 0) {
      businessCase.projectedSavings = Math.round(
        businessCase.totalInvestment * 0.3
      );
    }
    if (!businessCase.netPresentValue || businessCase.netPresentValue === 0) {
      // Calculate NPV using a 5-year project with 8% discount rate
      const discountRate = 0.08;
      const projectYears = 5;
      const initialInvestment = -businessCase.totalInvestment;
      const annualSavings = businessCase.projectedSavings;
      let npv = initialInvestment;
      for (let year = 1; year <= projectYears; year++) {
        const discountedSavings =
          annualSavings / Math.pow(1 + discountRate, year);
        npv += discountedSavings;
      }
      businessCase.netPresentValue = Math.round(npv);
      if (businessCase.netPresentValue <= 0) {
        // Adjust savings to make NPV positive (at least 15% of investment)
        const minPositiveNPV = businessCase.totalInvestment * 0.15;
        const requiredAnnualSavings =
          (minPositiveNPV + businessCase.totalInvestment) /
          (1 / Math.pow(1 + discountRate, 1) +
            1 / Math.pow(1 + discountRate, 2) +
            1 / Math.pow(1 + discountRate, 3) +
            1 / Math.pow(1 + discountRate, 4) +
            1 / Math.pow(1 + discountRate, 5));
        businessCase.projectedSavings = Math.round(requiredAnnualSavings);
        // Recalculate NPV with adjusted savings
        npv = initialInvestment;
        for (let year = 1; year <= projectYears; year++) {
          const discountedSavings =
            businessCase.projectedSavings / Math.pow(1 + discountRate, year);
          npv += discountedSavings;
        }
        businessCase.netPresentValue = Math.round(npv);
      }
    }
    if (!businessCase.riskAdjustedROI || businessCase.riskAdjustedROI === 0) {
      const calculatedROI = Math.round(
        (businessCase.projectedSavings / businessCase.totalInvestment) * 100
      );
      businessCase.riskAdjustedROI = Math.max(calculatedROI, 15);
    }
    if (
      !businessCase.paybackPeriod ||
      String(businessCase.paybackPeriod).trim() === ""
    ) {
      const paybackYears =
        Math.round(
          (businessCase.totalInvestment / businessCase.projectedSavings) * 10
        ) / 10;
      const reasonablePaybackYears = Math.max(1, Math.min(5, paybackYears));
      businessCase.paybackPeriod = `${reasonablePaybackYears} years`;
    }
    return businessCase;
  }
}

export const ragService = new RAGService();
