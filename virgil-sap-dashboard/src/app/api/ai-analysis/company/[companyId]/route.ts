import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import sql from "@/lib/db";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ companyId: string }> }
) {
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
    const solutionsPrompt = `# CRITICAL: Return ONLY a valid JSON array. Do NOT include any explanation, markdown, or extra text. Do NOT use markdown code blocks.
Generate ONLY the recommendedSolutions array for this company. For each SAP module, provide:
- module (string, must match a real SAP product)
- fitJustification (5+ sentences, data-driven, reference company data and uploaded files)
- priority (number)
- estimatedROI (realistic, nonzero number, e.g., 18.5)
- timeToValue (realistic string, e.g., "9-15 months")
- estimatedCostMin (realistic, nonzero number, e.g., 250000)
- estimatedCostMax (realistic, nonzero number, e.g., 400000)
- keyBenefits (array)
- implementationComplexity (string)
- technicalRequirements (array)
- businessImpact (string)
- riskMitigation (array)
- successMetrics (array)
- moduleAnalysisContext (MUST be 500+ characters, 4+ paragraphs with comprehensive analysis covering: strategic alignment with company goals, detailed implementation roadmap, competitive positioning vs alternatives, risk assessment and mitigation strategies, expected business outcomes and ROI drivers, integration challenges and solutions, change management considerations, and long-term strategic value. Reference specific company data, industry benchmarks, uploaded documents, and business challenges. Format with clear paragraph breaks using double line breaks.)

All numeric projections (estimatedROI, estimatedCostMin, estimatedCostMax, etc.) must be uniquely calculated for this company, using the provided company profile, uploaded files, and deal pipeline data. Do NOT use default, placeholder, or repeated values. Each number must be justified by the data and context provided above.

Do NOT include a module unless you can provide ALL required fields with real, nonzero, non-null values and detailed justifications. Do NOT include any projections as null, zero, or placeholder. If you cannot estimate a value, use industry logic and the provided data to make a realistic projection.

Return ONLY the array, no extra text. Example:
[
  {
    "module": "S/4HANA",
    "fitJustification": "...",
    "priority": 1,
    "estimatedROI": 22.5,
    "timeToValue": "12-18 months",
    "estimatedCostMin": 500000,
    "estimatedCostMax": 2000000,
    ...
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
    const { text: solutionsTextRaw } = await generateText({
      model: openai("gpt-4o"),
      prompt: solutionsPrompt,
      temperature: 0.2,
      maxTokens: 12000,
    });
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
    // Try to parse JSON
    let solutions;
    try {
      solutions = JSON.parse(solutionsText);
    } catch (e) {
      return NextResponse.json(
        { error: "Failed to parse solutions JSON", details: solutionsTextRaw },
        { status: 422 }
      );
    }
    // Validate all required projections for each solution
    let incomplete = false;
    if (!Array.isArray(solutions) || solutions.length === 0) incomplete = true;
    for (const sol of solutions) {
      if (!sol.module || typeof sol.module !== "string") incomplete = true;
      if (
        !sol.estimatedROI ||
        typeof sol.estimatedROI !== "number" ||
        sol.estimatedROI === 0
      )
        incomplete = true;
      if (
        !sol.timeToValue ||
        typeof sol.timeToValue !== "string" ||
        sol.timeToValue.trim() === ""
      )
        incomplete = true;
      if (
        !sol.estimatedCostMin ||
        typeof sol.estimatedCostMin !== "number" ||
        sol.estimatedCostMin === 0
      )
        incomplete = true;
      if (
        !sol.estimatedCostMax ||
        typeof sol.estimatedCostMax !== "number" ||
        sol.estimatedCostMax === 0
      )
        incomplete = true;
      if (
        !sol.fitJustification ||
        typeof sol.fitJustification !== "string" ||
        sol.fitJustification.length < 100
      )
        incomplete = true;
      if (
        !sol.moduleAnalysisContext ||
        typeof sol.moduleAnalysisContext !== "string" ||
        sol.moduleAnalysisContext.length < 500
      )
        incomplete = true;
    }
    if (incomplete) {
      return NextResponse.json(
        {
          error:
            "AI failed to generate complete projections for all modules. Please try again.",
          solutions,
        },
        { status: 422 }
      );
    }

    // STEP 1: Generate businessChallenges array with a dedicated prompt
    const businessChallengesPrompt = `# CRITICAL: BUSINESS CHALLENGES (DO NOT OMIT)
Generate ONLY a businessChallenges array with exactly 1 item. The item must be at least 100 characters and reference company data or industry context. Provide a specific, actionable challenge.

# Example:
"businessChallenges": [
  "The company faces significant integration issues between its legacy ERP and new cloud-based CRM systems, leading to data silos and process inefficiencies across finance and sales departments."
]

COMPANY PROFILE:
Name: ${company.name}
Industry: ${company.industry}
Size: ${company.company_size}
Region: ${company.region}
Business Challenges: ${company.business_challenges || "N/A"}
Current Systems: ${company.current_systems || "N/A"}
Budget: ${company.budget || "N/A"}
Timeline: ${company.timeline || "N/A"}

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

    const { text: businessChallengesRaw } = await generateText({
      model: openai("gpt-4o"),
      prompt: businessChallengesPrompt,
      temperature: 0.2,
      maxTokens: 12000,
    });
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
      // Try to extract the first valid JSON array from the response
      const match = businessChallengesText.match(/\[[\s\S]*\]/);
      if (match) {
        try {
          businessChallenges = JSON.parse(match[0]);
        } catch (e2) {
          return NextResponse.json(
            {
              error:
                "Failed to parse businessChallenges JSON (after extraction)",
              details: businessChallengesRaw,
            },
            { status: 422 }
          );
        }
      } else {
        return NextResponse.json(
          {
            error: "Failed to parse businessChallenges JSON",
            details: businessChallengesRaw,
          },
          { status: 422 }
        );
      }
    }
    // Validate businessChallenges
    if (
      !Array.isArray(businessChallenges) ||
      businessChallenges.length !== 1 ||
      !businessChallenges.every(
        (c: string) => typeof c === "string" && c.length >= 100
      )
    ) {
      return NextResponse.json(
        {
          error:
            "AI failed to generate 1 business challenge (step 1). Please try again.",
          businessChallenges,
          raw: businessChallengesText,
        },
        { status: 422 }
      );
    }

    // STEP 2: Generate the rest of the analysis with enhanced prompts
    const restPrompt = `# CRITICAL: IN-DEPTH ANALYSIS REQUIRED

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

# CONTEXT
You have already generated the following recommendedSolutions for this company (do NOT change them):
${JSON.stringify(solutions, null, 2)}

You have already generated the following businessChallenges for this company (do NOT change them):
${JSON.stringify(businessChallenges, null, 2)}

Now generate the rest of the analysis (companyProfileAnalysis, businessContextAnalysis, aiAnalysisMethodology, businessCase, financialAnalysis, implementationRoadmap, competitiveAnalysis, riskFactors, executiveSummary, etc.) as before, referencing the modules, projections, and businessChallenges above. Do NOT repeat or change any numbers in recommendedSolutions or businessChallenges. All top-level projections (businessCase, etc.) must be consistent with the module projections above.

# CRITICAL: You MUST include the businessChallenges array in your response
The final analysis object MUST include the businessChallenges array exactly as provided above. Do NOT omit this field.

# REQUIRED FIELDS IN FINAL ANALYSIS:
- businessChallenges (array from step 1 - DO NOT CHANGE)
- recommendedSolutions (array from step 1 - DO NOT CHANGE)
- companyProfileAnalysis (string - detailed multi-paragraph)
- businessContextAnalysis (string - detailed multi-paragraph)
- aiAnalysisMethodology (string - detailed multi-paragraph)
- businessCase (object with numeric fields)
- financialAnalysis (object)
- implementationRoadmap (array)
- competitiveAnalysis (object)
- riskFactors (array)
- executiveSummary (string)

# BUSINESS CASE REQUIREMENTS (CRITICAL)
The businessCase object MUST include ALL of the following fields with these EXACT names and types:
- totalInvestment: number (not string, not null, not zero)
- projectedSavings: number (not string, not null, not zero)  
- netPresentValue: number (not string, not null, not zero)
- riskAdjustedROI: number (not string, not null, not zero)
- paybackPeriod: string (not null, not empty, e.g., "3.3 years")

Do NOT use field names like "estimatedROI", "timeToValue", "estimatedCostMin", or "estimatedCostMax". Use ONLY the exact field names listed above.

All numeric projections must be uniquely calculated for this company, using the provided company profile, uploaded files, and deal pipeline data. Do NOT use default, placeholder, or repeated values. Each number must be justified by the data and context provided above.

If you cannot estimate a value, use industry logic and the provided data to make a realistic projection. Do NOT return the analysis unless ALL businessCase fields are present and valid.

Return the full analysis as a JSON object, including the provided recommendedSolutions array, businessChallenges array, companyProfileAnalysis, and businessContextAnalysis fields.`;

    // STEP 2: Call OpenAI for the rest of the analysis
    const { text: restTextRaw } = await generateText({
      model: openai("gpt-4o"),
      prompt: restPrompt,
      temperature: 0.2,
      maxTokens: 15000,
    });
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

    // Validate businessCase summary fields
    if (
      !analysis.businessCase ||
      typeof analysis.businessCase.totalInvestment !== "number" ||
      analysis.businessCase.totalInvestment === 0 ||
      typeof analysis.businessCase.projectedSavings !== "number" ||
      analysis.businessCase.projectedSavings === 0 ||
      typeof analysis.businessCase.netPresentValue !== "number" ||
      analysis.businessCase.netPresentValue === 0 ||
      typeof analysis.businessCase.riskAdjustedROI !== "number" ||
      analysis.businessCase.riskAdjustedROI === 0 ||
      !analysis.businessCase.paybackPeriod ||
      typeof analysis.businessCase.paybackPeriod !== "string" ||
      analysis.businessCase.paybackPeriod.trim() === ""
    ) {
      return NextResponse.json(
        {
          error:
            "AI failed to generate complete business case projections. Please try again.",
          analysis,
          businessCase: analysis.businessCase,
          raw: restTextRaw,
        },
        { status: 422 }
      );
    }

    // Validate businessChallenges (from step 1)
    if (
      !Array.isArray(analysis.businessChallenges) ||
      analysis.businessChallenges.length !== 1 ||
      !analysis.businessChallenges.every(
        (c: string) => typeof c === "string" && c.length >= 100
      )
    ) {
      return NextResponse.json(
        {
          error:
            "AI failed to generate 1 business challenge (step 2 validation). Please try again.",
          analysis,
          expectedBusinessChallenges: businessChallenges,
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
            minRequired: minLen,
          },
          { status: 422 }
        );
      }
    }

    // Validate riskFactors
    if (
      !analysis.riskFactors ||
      !Array.isArray(analysis.riskFactors) ||
      analysis.riskFactors.length < 5
    ) {
      return NextResponse.json(
        {
          error: "Risk factors array must have at least 5 items",
          riskFactors: analysis.riskFactors,
          count: analysis.riskFactors?.length || 0,
        },
        { status: 422 }
      );
    }

    for (const [index, risk] of analysis.riskFactors.entries()) {
      if (
        !risk.riskCategory ||
        !risk.riskDescription ||
        !["High", "Medium", "Low"].includes(risk.probabilityRating) ||
        !["High", "Medium", "Low"].includes(risk.potentialImpact) ||
        !Array.isArray(risk.mitigationStrategies) ||
        risk.mitigationStrategies.length < 3 ||
        !Array.isArray(risk.monitoringMetrics) ||
        risk.monitoringMetrics.length < 1
      ) {
        return NextResponse.json(
          {
            error: `Risk factor #${index + 1} is incomplete or invalid`,
            riskFactor: risk,
            required: {
              riskCategory: "string",
              riskDescription: "string (5+ sentences)",
              probabilityRating: "High/Medium/Low",
              potentialImpact: "High/Medium/Low",
              mitigationStrategies: "array (min 3 items)",
              monitoringMetrics: "array (min 1 item)",
            },
          },
          { status: 422 }
        );
      }
    }

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

      console.log("🤖 Advanced AI Analysis: About to insert analysis for company ID:", companyId);

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

      const insertedId = insertResult.rows[0]?.id;
      console.log(
        "🤖 Advanced AI Analysis: ✅ Analysis stored with ID:",
        insertedId
      );

      // Verify the insert worked by doing a quick check
      const verifyResult = await sql.query(
        `SELECT id FROM ai_analyses WHERE id = $1`,
        [insertedId]
      );

      if (verifyResult.rows.length === 0) {
        console.error("🤖 Advanced AI Analysis: ❌ Insert verification failed - record not found");
      } else {
        console.log("🤖 Advanced AI Analysis: ✅ Insert verification successful");
      }

    } catch (dbError: any) {
      console.error(
        "🤖 Advanced AI Analysis: ❌ Database storage failed:",
        dbError
      );
      console.error("🤖 Advanced AI Analysis: ❌ Database error details:", {
        message: dbError.message,
        code: dbError.code,
        detail: dbError.detail,
      });
      // Don't fail the entire request if database storage fails
      // But log it for debugging
    }

    return NextResponse.json({
      company,
      analysis,
      pipelineMetrics: {
        totalValue: totalPipelineValue,
        averageDealValue: avgDealValue,
        dealCount: dealRows.length,
        highProbabilityDeals: highProbabilityDeals.length,
      },
      generatedAt: new Date().toISOString(),
      note: `Advanced AI analysis with calculated projections for ${
        company.name
      } based on comprehensive company profile and ${
        dealRows.length
      } pipeline deals worth $${totalPipelineValue.toLocaleString()}`,
    });
  } catch (error: any) {
    console.error("🤖 Advanced AI Analysis: Error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate advanced AI analysis",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

function createAdvancedFallbackAnalysis(
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
    keySuccessFactors: [],
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
    implementationRoadmap: [],
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

  if (!analysis.aiAnalysisMethodology) {
    analysis.aiAnalysisMethodology = `No AI analysis methodology details available for ${company.name}.`;
  }

  if (!analysis.riskFactors || !Array.isArray(analysis.riskFactors)) {
    analysis.riskFactors = [];
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
