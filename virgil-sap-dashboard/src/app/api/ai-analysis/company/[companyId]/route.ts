import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import sql from "@/lib/db";

interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
}

class TokenTracker {
  private readonly GPT4O_INPUT_COST_PER_1M = 5.0;
  private readonly GPT4O_OUTPUT_COST_PER_1M = 15.0;
  private totalCost = 0;
  private totalTokens = 0;

  logTokenUsage(usage: any, step: string): void {
    if (usage) {
      const cost = this.calculateTokenCost(usage);
      this.totalCost += cost;
      this.totalTokens += usage.totalTokens;

      console.log(`💰 ${step} Token Usage:`, {
        prompt: usage.promptTokens,
        completion: usage.completionTokens,
        total: usage.totalTokens,
        cost: `$${cost.toFixed(4)}`,
      });
    }
  }

  private calculateTokenCost(usage: any): number {
    const inputCost =
      (usage.promptTokens / 1000000) * this.GPT4O_INPUT_COST_PER_1M;
    const outputCost =
      (usage.completionTokens / 1000000) * this.GPT4O_OUTPUT_COST_PER_1M;
    return inputCost + outputCost;
  }

  getTotalCost(): number {
    return this.totalCost;
  }

  getTotalTokens(): number {
    return this.totalTokens;
  }

  logFinalCosts(): void {
    console.log(`💰 Total Analysis Cost: $${this.totalCost.toFixed(4)}`);
    console.log(`💰 Total Tokens Used: ${this.totalTokens.toLocaleString()}`);
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ companyId: string }> }
) {
  const tokenTracker = new TokenTracker();

  try {
    // Await params before using
    const { companyId: rawId } = await context.params;
    const companyId = Number.parseInt(rawId, 10);

    console.log(
      "🤖 Advanced AI Analysis: Starting comprehensive analysis for company ID:",
      companyId
    );

    // Fetch the company record with all available data
    const companyResult = await sql.query(
      `SELECT 
        id, name, industry, company_size, region, website,
        business_challenges, current_systems, budget, timeline, priority,
        primary_contact, secondary_contact, notes, tags, created_at
      FROM companies 
      WHERE id = $1`,
      [companyId]
    );

    const companyRows = companyResult.rows;
    if (companyRows.length === 0) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const company = companyRows[0];
    console.log("🤖 Advanced AI Analysis: Company data retrieved:", {
      name: company.name,
      industry: company.industry,
      size: company.company_size,
      region: company.region,
      challenges: company.business_challenges,
      systems: company.current_systems,
      budget: company.budget,
      timeline: company.timeline,
    });

    // Fetch uploaded files for this company
    const filesResult = await sql.query(
      `SELECT 
        id, filename, original_name, file_size, file_type, category,
        file_path, file_content, content_extracted, uploaded_at
       FROM company_files 
       WHERE company_id = $1
       ORDER BY uploaded_at DESC`,
      [companyId]
    );
    const uploadedFiles = filesResult.rows;

    console.log(
      "🤖 Advanced AI Analysis: Found",
      uploadedFiles.length,
      "uploaded files"
    );

    // Fetch existing deals for context
    const dealResult = await sql.query(
      `SELECT deal_name, deal_value, stage, probability, notes, created_at
       FROM deals 
       WHERE company_id = $1
       ORDER BY created_at DESC`,
      [companyId]
    );
    const dealRows = dealResult.rows;

    // Fetch SAP products for this industry
    const sapProductsResult = await sql.query(
      `SELECT * FROM sap_products 
       WHERE $1 = ANY(target_industries)
       ORDER BY product_name`,
      [company.industry]
    );
    const sapProducts = sapProductsResult.rows;

    console.log(
      "🤖 Advanced AI Analysis: Found",
      sapProducts.length,
      "SAP products for",
      company.industry,
      "industry"
    );

    // Calculate deal pipeline metrics
    const totalPipelineValue = dealRows.reduce(
      (sum, deal) => sum + (Number(deal.deal_value) || 0),
      0
    );
    const avgDealValue =
      dealRows.length > 0 ? totalPipelineValue / dealRows.length : 0;
    const highProbabilityDeals = dealRows.filter(
      (deal) => (deal.probability || 0) > 70
    );

    console.log("🤖 Advanced AI Analysis: Pipeline metrics:", {
      totalValue: totalPipelineValue,
      avgValue: avgDealValue,
      dealCount: dealRows.length,
      highProbDeals: highProbabilityDeals.length,
    });

    // Prepare file content for AI analysis
    const fileAnalysis = uploadedFiles.map((file) => ({
      name: file.original_name,
      category: file.category,
      type: file.file_type,
      size: file.file_size,
      content: file.content_extracted ? file.file_content : null,
      extracted: file.content_extracted,
    }));

    const hasFileContent = fileAnalysis.some(
      (file) => file.extracted && file.content
    );

    const totalFileContent = fileAnalysis
      .filter((file) => file.extracted && file.content)
      .map((file) => file.content)
      .join("\n\n---\n\n");

    console.log("🤖 Advanced AI Analysis: File analysis prepared:", {
      totalFiles: uploadedFiles.length,
      filesWithContent: fileAnalysis.filter((f) => f.extracted && f.content)
        .length,
      totalContentLength: totalFileContent.length,
    });

    // STEP 1: Generate recommendedSolutions with all projections
    const solutionsPrompt = `# CRITICAL: SALES-FOCUSED ANALYSIS REQUIRED
# IMPORTANT: Write all content from a SALES PERSPECTIVE to convince the client to purchase SAP modules
# Focus on benefits, ROI, competitive advantages, and value proposition
# CRITICAL: DO NOT write generic analysis - be specific about each SAP module's unique features and capabilities
# CRITICAL: Mention the specific SAP module name multiple times in each analysis

Return ONLY a valid JSON array. Do NOT include any explanation, markdown, or extra text. Do NOT use markdown code blocks.
Generate ONLY the recommendedSolutions array for this company. For each SAP module, provide:
- module (string, must match a real SAP product)
- fitJustification (5+ sentences written from a SALES PERSPECTIVE, emphasizing why this specific SAP module is the best solution for this company's needs, highlighting unique benefits and competitive advantages, reference company data and uploaded files)
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
- moduleAnalysisContext (MUST be 1200+ characters, structured as a formal business report written from a SALES PERSPECTIVE to convince the client to purchase this specific SAP module. CRITICAL: You MUST mention the specific SAP module name at least 5 times and describe its unique features and capabilities in detail. Structure the analysis as a formal report with the following sections: 1) EXECUTIVE SUMMARY - Comprehensive overview of the SAP module's strategic value, market positioning, and business transformation potential (minimum 150 characters), 2) BUSINESS CHALLENGES ADDRESSED - Detailed analysis of how this specific SAP module addresses the company's unique challenges, industry-specific issues, and competitive pressures (minimum 200 characters), 3) SOLUTION OVERVIEW - Comprehensive overview of the SAP module's features and capabilities (use 3-4 bullet points for key features), 4) BUSINESS IMPACT & ROI - Detailed discussion of tangible business outcomes and success metrics with specific projections and industry benchmarks (use 3-4 bullet points for key metrics), 5) IMPLEMENTATION STRATEGY - Comprehensive implementation approach with risk mitigation, timeline considerations, and change management strategies (use 3-4 bullet points for key steps), 6) COMPETITIVE ADVANTAGES - Strategic positioning and competitive differentiation with market analysis and industry comparisons (minimum 150 characters), 7) CONCLUSION - Strategic value and investment justification with long-term vision and growth potential (minimum 150 characters). Use formal business language with clear section headings in ALL CAPS. Reference specific company data, industry benchmarks, and business challenges. Format with clear section breaks using double line breaks and use bullet points (•) for key lists. DO NOT write generic analysis - be specific about the module's features and benefits.)

All numeric projections (estimatedROI, estimatedCostMin, estimatedCostMax, etc.) must be uniquely calculated for this company, using the provided company profile, uploaded files, and deal pipeline data. Do NOT use default, placeholder, or repeated values. Each number must be justified by the data and context provided above.

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
]

COMPANY PROFILE:
Name: ${company.name}
Industry: ${company.industry}
Size: ${company.company_size}
Region: ${company.region}
Business Challenges: ${
      company.business_challenges || "Operational efficiency and growth"
    }
Current Systems: ${
      company.current_systems || "Legacy systems requiring modernization"
    }
Budget: ${company.budget || "To be determined based on ROI"}
Timeline: ${company.timeline || "Flexible based on business needs"}

# SALES CONTEXT: Use this company profile to craft compelling value propositions that address their specific challenges and demonstrate how SAP modules will deliver measurable business value and competitive advantages.

UPLOADED DOCUMENTS AND FILES:
${
  uploadedFiles.length > 0
    ? `The company has provided ${
        uploadedFiles.length
      } document(s) for analysis:\n${fileAnalysis
        .map(
          (file) =>
            `- ${file.name} (${file.category}, ${file.type}, ${Math.round(
              file.size / 1024
            )}KB)${
              file.extracted && file.content
                ? ": Content available for analysis"
                : ": Content extraction not available"
            }`
        )
        .join("\n")}`
    : ""
}

AVAILABLE SAP PRODUCTS FOR ${company.industry} INDUSTRY:
${sapProducts
  .map((product) => `- ${product.product_name}: ${product.description}`)
  .join("\n")}`;

    // STEP 1: Call OpenAI for recommendedSolutions
    const { text: solutionsTextRaw, usage: solutionsUsage } =
      await generateText({
        model: openai("gpt-4o"),
        prompt: solutionsPrompt,
        temperature: 0.2,
        maxTokens: 12000,
      });

    // Log token usage for solutions
    tokenTracker.logTokenUsage(solutionsUsage, "Solutions Generation");

    // Clean the response text to remove any markdown formatting
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

    let solutions;
    try {
      solutions = JSON.parse(solutionsText);
    } catch (e) {
      console.error("Failed to parse solutions JSON:", e);
      console.log("Raw solutions text:", solutionsTextRaw.substring(0, 500));
      throw new Error("Failed to generate solutions");
    }

    console.log(
      "🤖 Advanced AI Analysis: Solutions generated:",
      solutions.length
    );

    // STEP 2: Generate business challenges
    const businessChallengesPrompt = `# COMPREHENSIVE BUSINESS CHALLENGES ANALYSIS
# CRITICAL: Generate detailed, specific business challenges that align with SAP solutions
# Use the company profile and uploaded documents to identify comprehensive business challenges

# COMPANY PROFILE:
Name: ${company.name}
Industry: ${company.industry}
Size: ${company.company_size}
Region: ${company.region}
Business Challenges: ${
      company.business_challenges || "Operational efficiency and growth"
    }
Current Systems: ${
      company.current_systems || "Legacy systems requiring modernization"
    }
Budget: ${company.budget || "To be determined based on ROI"}
Timeline: ${company.timeline || "Flexible based on business needs"}

# TASK:
Generate ONLY a valid JSON array with 3-5 comprehensive business challenges. Each challenge must:
- Be at least 150 characters with specific details
- Reference specific company data, industry context, or current systems
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

UPLOADED DOCUMENTS AND FILES:
${
  uploadedFiles.length > 0
    ? `The company has provided ${
        uploadedFiles.length
      } document(s) for analysis:\n${fileAnalysis
        .map(
          (file) =>
            `- ${file.name} (${file.category}, ${file.type}, ${Math.round(
              file.size / 1024
            )}KB)${
              file.extracted && file.content
                ? ": Content available for analysis"
                : ": Content extraction not available"
            }`
        )
        .join("\n")}`
    : ""
}

# CRITICAL: Return ONLY a valid JSON array. Do NOT include any explanation, markdown, or extra text. Do NOT use markdown code blocks. If you include anything other than a valid JSON array, the analysis will be rejected.`;

    const { text: businessChallengesRaw, usage: challengesUsage } =
      await generateText({
        model: openai("gpt-4o"),
        prompt: businessChallengesPrompt,
        temperature: 0.2,
        maxTokens: 12000,
      });

    // Log token usage for business challenges
    tokenTracker.logTokenUsage(
      challengesUsage,
      "Business Challenges Generation"
    );

    let businessChallengesText = businessChallengesRaw.trim();
    if (businessChallengesText.startsWith("```json")) {
      businessChallengesText = businessChallengesText
        .replace(/^```json\s*/, "")
        .replace(/\s*```$/, "");
    } else if (businessChallengesText.startsWith("```")) {
      businessChallengesText = businessChallengesText
        .replace(/^```\s*/, "")
        .replace(/\s*```$/, "");
    }
    let businessChallenges;
    try {
      businessChallenges = JSON.parse(businessChallengesText);
    } catch (e) {
      console.error("Failed to parse business challenges JSON:", e);
      console.log(
        "Raw business challenges text:",
        businessChallengesRaw.substring(0, 500)
      );
      throw new Error("Failed to generate business challenges");
    }

    console.log(
      "🤖 Advanced AI Analysis: Business challenges generated:",
      businessChallenges.length
    );

    // STEP 2: Generate the rest of the analysis with enhanced prompts
    const restPrompt = `# CRITICAL: SALES-FOCUSED IN-DEPTH ANALYSIS REQUIRED
# IMPORTANT: Write all content from a SALES PERSPECTIVE to convince the client to purchase SAP solutions
# Focus on benefits, ROI, competitive advantages, and value proposition

# COMPANY PROFILE ANALYSIS (REQUIRED)
Generate a comprehensive company profile analysis that MUST:
- Be at least 800 characters (4+ paragraphs)
- Include detailed analysis of: 
  * Industry position and competitive landscape
  * Operational structure and business model
  * Technology stack maturity
  * Growth trajectory and strategic positioning
- Reference specific company data points
- Avoid generic statements
- Emphasize how SAP solutions address their specific challenges

# BUSINESS CONTEXT ANALYSIS (REQUIRED)
Generate a comprehensive business context analysis that MUST:
- Be at least 800 characters (4+ paragraphs)
- Cover:
  * Industry trends and market dynamics
  * Regulatory environment
  * Technological disruptions
  * Strategic opportunities
- Reference uploaded documents where applicable
- Include quantitative market data where possible
- Emphasize how SAP solutions provide competitive advantages in this context

# AI ANALYSIS METHODOLOGY (REQUIRED)
Generate a detailed AI analysis methodology that MUST:
- Be at least 1200 characters (5+ paragraphs)
- Explain:
  * Data integration framework
  * Industry-specific weighting factors
  * Risk assessment models
  * Implementation complexity scoring
  * Validation processes
- Specify confidence levels for projections

# RISK FACTORS (REQUIRED)
Generate a detailed riskFactors array with at least 5 items. Each item MUST include:
- riskCategory (string)
- riskDescription (5+ sentences)
- probabilityRating (High/Medium/Low)
- potentialImpact (High/Medium/Low)
- mitigationStrategies (array of 3+ strategies)
- monitoringMetrics (array of metrics)

# COMPETITIVE ANALYSIS REQUIREMENTS (CRITICAL)
The competitiveAnalysis object MUST include ALL of the following fields:
- sapAdvantages (array of 3+ specific advantages SAP has over competitors for this company, written from a SALES PERSPECTIVE)
- competitorComparison (array of 3+ comparisons with major competitors like Oracle, Microsoft, Salesforce, emphasizing why SAP is superior)
- keyDifferentiators (array of 3+ unique differentiators that make SAP the best choice for this company, focusing on value proposition)

Example competitiveAnalysis structure:
{
  "sapAdvantages": [
    "Industry-specific solutions for [company industry] with proven ROI",
    "Global support and implementation expertise ensuring successful delivery",
    "Integrated ecosystem reducing complexity and total cost of ownership"
  ],
  "competitorComparison": [
    "SAP vs Oracle: Better industry alignment for [company industry] with superior analytics",
    "SAP vs Microsoft: More comprehensive ERP capabilities with deeper integration",
    "SAP vs Salesforce: Deeper financial and operational integration with better scalability"
  ],
  "keyDifferentiators": [
    "End-to-end business process integration driving measurable business value",
    "Proven track record in [company industry] with documented success stories",
    "Scalability for future growth needs with flexible deployment options"
  ]
}

All competitive analysis must be specific to this company's industry, size, and business challenges, written to convince them to choose SAP.

# CONTEXT
You have already generated the following recommendedSolutions for this company (do NOT change them):
${JSON.stringify(solutions, null, 2)}

You have already generated the following businessChallenges for this company (do NOT change them):
${JSON.stringify(businessChallenges, null, 2)}

Now generate the rest of the analysis (companyProfileAnalysis, businessContextAnalysis, aiAnalysisMethodology, businessCase, financialAnalysis, implementationRoadmap, competitiveAnalysis, riskFactors, executiveSummary, etc.) from a SALES PERSPECTIVE, referencing the modules, projections, and businessChallenges above. Do NOT repeat or change any numbers in recommendedSolutions or businessChallenges. All top-level projections (businessCase, etc.) must be consistent with the module projections above.

# SALES FOCUS: Write all content to convince the client to purchase SAP solutions, emphasizing benefits, ROI, competitive advantages, and value proposition.

# CRITICAL: You MUST include the businessChallenges array in your response
The final analysis object MUST include the businessChallenges array exactly as provided above. Do NOT omit this field.

# REQUIRED FIELDS IN FINAL ANALYSIS:
- businessChallenges (array from step 1 - DO NOT CHANGE)
- recommendedSolutions (array from step 1 - DO NOT CHANGE)
- fitScore (number - percentage 0-100 representing overall SAP fit)
- overallFit (string - "Excellent", "High", "Medium", or "Low")
- companyProfileAnalysis (string - detailed multi-paragraph, minimum 800 characters)
- businessContextAnalysis (string - detailed multi-paragraph, minimum 800 characters)
- aiAnalysisMethodology (string - detailed multi-paragraph, minimum 1200 characters)
- businessCase (object with numeric fields)
- financialAnalysis (object)
- implementationRoadmap (array)
- competitiveAnalysis (object)
- riskFactors (array)
- executiveSummary (string written from a SALES PERSPECTIVE, compelling summary that convinces executives to invest in SAP solutions)

# CONTENT LENGTH REQUIREMENTS (CRITICAL)
- companyProfileAnalysis: Write at least 800 characters with detailed analysis of the company's profile, industry position, and business characteristics
- businessContextAnalysis: Write at least 800 characters with detailed analysis of the business context, market conditions, and competitive landscape
- aiAnalysisMethodology: Write at least 1200 characters with detailed explanation of the AI analysis methodology, data sources used, analytical approach, and how conclusions were derived

# FIT SCORE REQUIREMENTS (CRITICAL)
Generate a fitScore (number 0-100) that represents the overall SAP fit for this company. Use these factors:
- Industry alignment (Financial Services: +15, Manufacturing: +12, Healthcare: +10, Technology: +8, Retail: +6, Other: +4)
- Company size (Enterprise: +12, Large: +10, Medium: +8, Small: +4)
- Business challenges (Complex supply chain: +10, Financial: +8, Data integration: +6, Basic: +4, None: +2)
- Budget/timeline (>$1M+12mo: +8, $500K-1M+6-12mo: +6, $100K-500K+3-6mo: +4, <$100K/<3mo: +2, None: +3)
- Risk factors (subtract: small+large budget: -5, large+small budget: -3, no systems: -2)
Add all factors to a base of 50, subtract risk, clamp 0-100, round to nearest integer. The score must be unique for each company.

Also generate overallFit:
- 80-100: "Excellent"
- 60-79: "High"
- 40-59: "Medium"
- 0-39: "Low"

Return ONLY the final JSON object, with no explanation, markdown, or extra text.`;

    // STEP 2: Call OpenAI for the rest of the analysis
    const { text: restTextRaw, usage: restUsage } = await generateText({
      model: openai("gpt-4o"),
      prompt: restPrompt,
      temperature: 0.2,
      maxTokens: 15000,
    });

    // Log token usage for comprehensive analysis
    tokenTracker.logTokenUsage(restUsage, "Comprehensive Analysis Generation");

    // Log the raw LLM output for debugging
    console.log(
      "🤖 Advanced AI Analysis: Raw LLM output (restTextRaw):",
      restTextRaw
    );
    // Clean the response text to remove any markdown formatting
    let restText = restTextRaw.trim();
    if (restText.startsWith("```json")) {
      restText = restText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (restText.startsWith("```")) {
      restText = restText.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }
    let analysis;
    try {
      analysis = JSON.parse(restText);
    } catch (e) {
      // Try to extract the first valid JSON object from the response
      const match = restText.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          analysis = JSON.parse(match[0]);
        } catch (e2) {
          return NextResponse.json(
            {
              error: "Failed to parse full analysis JSON (after extraction)",
              details: restTextRaw,
            },
            { status: 422 }
          );
        }
      } else {
        return NextResponse.json(
          { error: "Failed to parse full analysis JSON", details: restTextRaw },
          { status: 422 }
        );
      }
    }

    // Debug: Log what the AI generated
    console.log(
      "🤖 Advanced AI Analysis: Generated analysis keys:",
      Object.keys(analysis)
    );
    console.log(
      "🤖 Advanced AI Analysis: keySuccessFactors:",
      analysis.keySuccessFactors
    );
    console.log(
      "🤖 Advanced AI Analysis: implementationRoadmap:",
      analysis.implementationRoadmap
    );
    console.log(
      "🤖 Advanced AI Analysis: businessCase:",
      analysis.businessCase
    );

    // Validate required fields
    if (
      !analysis.businessChallenges ||
      !Array.isArray(analysis.businessChallenges)
    ) {
      return NextResponse.json(
        {
          error: "AI failed to generate businessChallenges array",
          actualBusinessChallenges: analysis.businessChallenges,
          raw: restTextRaw,
        },
        { status: 422 }
      );
    }

    // Process and validate text content sections
    const textSections = [
      "companyProfileAnalysis",
      "businessContextAnalysis",
      "aiAnalysisMethodology",
    ] as const;

    for (const section of textSections) {
      let content = analysis[section];
      if (typeof content === "object" && content !== null) {
        // Handle nested structure where AI generates {section: {section: "content"}}
        if (content[section]) {
          content = content[section];
        } else if (content.content) {
          content = content.content;
        }
      }

      // Update analysis with processed content
      analysis[section] = content;

      // Validate content
      if (!content || typeof content !== "string" || content.length === 0) {
        return NextResponse.json(
          {
            error: `AI failed to generate ${section}. Please try again.`,
            analysis,
            [section]: analysis[section],
          },
          { status: 422 }
        );
      }
    }

    // Validate specific length requirements
    const minLengths = {
      companyProfileAnalysis: 800,
      businessContextAnalysis: 800,
      aiAnalysisMethodology: 1200,
    };

    for (const [section, minLen] of Object.entries(minLengths)) {
      const content = analysis[section];
      if (!content || content.length < minLen) {
        return NextResponse.json(
          {
            error: `${section} is too short (min ${minLen} chars required)`,
            length: content?.length || 0,
            section,
            content: content?.substring(0, 200) + "...",
          },
          { status: 422 }
        );
      }
    }

    // Log final token costs
    tokenTracker.logFinalCosts();

    // Store the comprehensive analysis in database
    try {
      console.log(
        "🤖 Advanced AI Analysis: Storing comprehensive analysis in database..."
      );

      // Prepare enhanced input data with all context
      const inputData = {
        company_data: company,
        deals_data: dealRows,
        pipeline_metrics: {
          total_value: totalPipelineValue,
          average_deal_value: avgDealValue,
          deal_count: dealRows.length,
          high_probability_deals: highProbabilityDeals.length,
        },
        analysis_metadata: {
          analysis_date: new Date().toISOString(),
          prompt_version: "advanced_analytical_v3",
          calculation_methodology: "AI-driven with company-specific data",
          data_completeness: {
            has_business_challenges: !!company.business_challenges,
            has_current_systems: !!company.current_systems,
            has_budget_info: !!company.budget,
            has_timeline: !!company.timeline,
            has_pipeline_data: dealRows.length > 0,
          },
        },
      };

      console.log(
        "🤖 Advanced AI Analysis: About to insert analysis for company ID:",
        companyId
      );

      const insertResult = await sql.query(
        `INSERT INTO ai_analyses (
          company_id, 
          analysis_type, 
          input_data, 
          analysis_results, 
          confidence_score, 
          generated_by, 
          model_version
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, created_at`,
        [
          companyId,
          "fit_assessment",
          JSON.stringify(inputData),
          JSON.stringify(analysis),
          typeof analysis.fitScore === "number" ? analysis.fitScore : null,
          1,
          "gpt-4o-advanced",
        ]
      );

      console.log(
        "🤖 Advanced AI Analysis: Analysis stored successfully with ID:",
        insertResult.rows[0].id
      );
    } catch (dbError) {
      console.error(
        "🤖 Advanced AI Analysis: Failed to store analysis in database:",
        dbError
      );
      // Don't fail the request for database issues - return the analysis anyway
    }

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("🤖 Advanced AI Analysis: Error:", error);

    // Log final token costs even on error
    tokenTracker.logFinalCosts();

    return NextResponse.json(
      {
        error: "Failed to generate analysis",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export function createAdvancedFallbackAnalysis(
  company: any,
  dealRows: any[],
  totalPipelineValue: number,
  avgDealValue: number,
  highProbabilityDeals: any[],
  sapProducts: any[]
) {
  return {
    fitScore: null,
    overallFit: null,
    executiveSummary: `No AI-generated summary available for ${company.name}.`,
    keyFindings: [],
    keySuccessFactors: [
      "Executive sponsorship and change management commitment",
      "Phased implementation approach with clear milestones",
      "Comprehensive user training and adoption strategy",
      "Data migration and integration planning",
      "Vendor partnership and support alignment",
    ],
    businessChallenges: [],
    recommendedSolutions: [],
    financialAnalysis: {
      investmentCalculation: {
        methodology: null,
        totalInvestment: null,
      },
      savingsProjection: {
        methodology: null,
        annualSavings: null,
      },
      roiAnalysis: {
        paybackPeriod: null,
        netPresentValue: null,
        riskAdjustedROI: null,
      },
    },
    implementationRoadmap: [
      {
        phase: "Foundation",
        duration: "6-9 months",
        activities: [
          "System design and architecture planning",
          "Data migration strategy development",
          "User training program design",
        ],
        deliverables: [
          "System architecture document",
          "Data migration strategy",
          "Training materials and curriculum",
        ],
        keyDeliverables: [
          "Core system implementation",
          "Initial user training completion",
        ],
        resources: [
          "Project manager",
          "Technical architect",
          "Change management specialist",
        ],
        calculatedCost: 500000,
      },
      {
        phase: "Optimization",
        duration: "3-6 months",
        activities: [
          "Process refinement and optimization",
          "Advanced feature rollout",
          "Performance monitoring and tuning",
        ],
        deliverables: [
          "Optimized process documentation",
          "Advanced feature implementation",
          "Performance optimization report",
        ],
        keyDeliverables: [
          "Process optimization completion",
          "Advanced features deployment",
        ],
        resources: [
          "Business analyst",
          "Technical specialist",
          "Training coordinator",
        ],
        calculatedCost: 300000,
      },
      {
        phase: "Innovation",
        duration: "3-6 months",
        activities: [
          "Advanced analytics implementation",
          "Integration with emerging technologies",
          "Continuous improvement processes",
        ],
        deliverables: [
          "Advanced analytics dashboard",
          "Technology integration report",
          "Continuous improvement framework",
        ],
        keyDeliverables: [
          "Advanced analytics deployment",
          "Technology integration completion",
        ],
        resources: [
          "Data analyst",
          "Integration specialist",
          "Innovation consultant",
        ],
        calculatedCost: 400000,
      },
    ],
    competitiveAnalysis: {},
    riskFactors: [],
    businessCase: {
      totalInvestment: null,
      projectedSavings: null,
      paybackPeriod: null,
      netPresentValue: null,
      riskAdjustedROI: null,
    },
  };
}

function validateAdvancedAnalysis(analysis: any, company: any) {
  if (!analysis) analysis = {};

  // Provide default values for missing sections
  if (!analysis.companyProfileAnalysis) {
    analysis.companyProfileAnalysis = `No detailed company profile analysis available for ${company.name}.`;
  }

  if (!analysis.businessContextAnalysis) {
    analysis.businessContextAnalysis = `No business context analysis available for ${company.name}.`;
  }

  if (
    !analysis.aiAnalysisMethodology ||
    analysis.aiAnalysisMethodology.length < 1200
  ) {
    analysis.aiAnalysisMethodology = `AI ANALYSIS METHODOLOGY

Our comprehensive AI analysis methodology for ${company.name} employs a sophisticated multi-layered approach that combines industry-specific data modeling, machine learning algorithms, and expert knowledge systems to deliver accurate and actionable SAP solution recommendations.

DATA INTEGRATION FRAMEWORK

The analysis leverages a comprehensive data integration framework that processes multiple data sources including company profile information, industry benchmarks, SAP product specifications, implementation case studies, and market intelligence. This framework ensures that all recommendations are grounded in real-world data and industry best practices, providing a solid foundation for decision-making.

INDUSTRY-SPECIFIC WEIGHTING FACTORS

Our AI system applies industry-specific weighting factors that account for the unique characteristics and challenges of the ${company.industry} sector. These factors include regulatory compliance requirements, competitive landscape dynamics, technology adoption patterns, and market maturity levels. The weighting system ensures that recommendations are tailored to the specific needs and constraints of companies operating in this industry.

RISK ASSESSMENT MODELS

The analysis incorporates advanced risk assessment models that evaluate implementation complexity, integration challenges, change management requirements, and potential operational disruptions. These models use historical data from similar implementations to predict potential risks and provide mitigation strategies, ensuring that all recommendations include comprehensive risk management considerations.

IMPLEMENTATION COMPLEXITY SCORING

Our implementation complexity scoring system evaluates multiple factors including system integration requirements, data migration complexity, user training needs, and organizational change management requirements. This scoring helps prioritize recommendations based on implementation feasibility and resource requirements, ensuring that companies can make informed decisions about their SAP investment strategy.

VALIDATION PROCESSES

All AI-generated recommendations undergo rigorous validation processes that include cross-referencing with industry benchmarks, verification against SAP best practices, and comparison with similar implementation case studies. This validation ensures that all recommendations are accurate, actionable, and aligned with industry standards and best practices.`;
  }

  if (!analysis.riskFactors || !Array.isArray(analysis.riskFactors)) {
    analysis.riskFactors = [];
  }

  if (
    !analysis.keySuccessFactors ||
    !Array.isArray(analysis.keySuccessFactors)
  ) {
    analysis.keySuccessFactors = [
      "Executive sponsorship and change management commitment",
      "Phased implementation approach with clear milestones",
      "Comprehensive user training and adoption strategy",
    ];
  }

  if (
    !analysis.implementationRoadmap ||
    !Array.isArray(analysis.implementationRoadmap)
  ) {
    analysis.implementationRoadmap = [
      {
        phase: "Foundation",
        duration: "6-9 months",
        activities: [
          "System design and architecture",
          "Data migration planning",
          "User training development",
        ],
        deliverables: [
          "System architecture document",
          "Data migration strategy",
          "Training materials",
        ],
        keyDeliverables: [
          "Core system implementation",
          "Initial user training",
        ],
        resources: [
          "Project manager",
          "Technical architect",
          "Change management specialist",
        ],
        calculatedCost: 500000,
      },
    ];
  }

  if (!analysis.businessCase) {
    analysis.businessCase = {
      totalInvestment: null,
      projectedSavings: null,
      paybackPeriod: null,
      netPresentValue: null,
      riskAdjustedROI: null,
    };
  }

  return analysis;
}
