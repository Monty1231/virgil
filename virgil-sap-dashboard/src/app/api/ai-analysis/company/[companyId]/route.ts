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
- moduleAnalysisContext (5+ sentences, data-driven)

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
      maxTokens: 2000,
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
        sol.moduleAnalysisContext.length < 100
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

    // STEP 2: Generate the rest of the analysis, referencing the validated solutions
    const restPrompt = `# CRITICAL: Return ONLY a valid JSON object. Do NOT include any explanation, markdown, or extra text. Do NOT use markdown code blocks.

# BUSINESS CASE REQUIREMENTS:
The businessCase object MUST include ALL of the following fields, with these types:
- totalInvestment: number (not string, not null, not zero)
- projectedSavings: number (not string, not null, not zero)
- netPresentValue: number (not string, not null, not zero)
- riskAdjustedROI: number (not string, not null, not zero)
- paybackPeriod: string (not null, not empty, e.g., "3.3 years")

If you cannot estimate a value, use industry logic and the provided data to make a realistic projection. Do NOT return the analysis unless ALL businessCase fields are present and valid.

# CONTEXT
You have already generated the following recommendedSolutions for this company (do NOT change them):
${JSON.stringify(solutions, null, 2)}

Now generate the rest of the analysis (businessCase, financialAnalysis, implementationRoadmap, competitiveAnalysis, riskFactors, executiveSummary, etc.) as before, referencing the modules and projections above. Do NOT repeat or change any numbers in recommendedSolutions. All top-level projections (businessCase, etc.) must be consistent with the module projections above.

Return the full analysis as a JSON object, including the provided recommendedSolutions array.`;

    const { text: restTextRaw } = await generateText({
      model: openai("gpt-4o"),
      prompt: restPrompt,
      temperature: 0.2,
      maxTokens: 4000,
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
      return NextResponse.json(
        { error: "Failed to parse full analysis JSON", details: restTextRaw },
        { status: 422 }
      );
    }
    // Validate businessCase summary fields as before
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
        },
        { status: 422 }
      );
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
          prompt_version: "advanced_analytical_v2",
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
        "🤖 Advanced AI Analysis: ✅ Analysis stored with ID:",
        insertResult.rows[0]?.id
      );
    } catch (dbError) {
      console.error(
        "🤖 Advanced AI Analysis: ❌ Database storage failed:",
        dbError
      );
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
  // Only provide structure, not numbers
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
  // Only ensure structure, not numbers
  if (!analysis) analysis = {};
  if (!analysis.financialAnalysis) {
    analysis.financialAnalysis = {
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
    };
  }
  if (!analysis.executiveSummary) {
    analysis.executiveSummary = null;
  }
  if (!analysis.keyFindings || !Array.isArray(analysis.keyFindings)) {
    analysis.keyFindings = [];
  }
  if (
    !analysis.businessChallenges ||
    !Array.isArray(analysis.businessChallenges)
  ) {
    analysis.businessChallenges = [];
  }
  if (
    !analysis.recommendedSolutions ||
    !Array.isArray(analysis.recommendedSolutions)
  ) {
    analysis.recommendedSolutions = [];
  }
  if (
    !analysis.implementationRoadmap ||
    !Array.isArray(analysis.implementationRoadmap)
  ) {
    analysis.implementationRoadmap = [];
  }
  if (!analysis.competitiveAnalysis) {
    analysis.competitiveAnalysis = {};
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
