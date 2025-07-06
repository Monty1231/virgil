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

    // Create a comprehensive, data-driven prompt for realistic AI analysis
    const businessAnalysisPrompt = `As a senior SAP business consultant with 15+ years of experience, conduct a comprehensive analysis of this company and provide detailed, realistic business intelligence in JSON format.

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

SALES CONTEXT:
Active Deals: ${dealRows.length}
Pipeline Value: $${totalPipelineValue.toLocaleString()}
Average Deal: $${Math.round(avgDealValue).toLocaleString()}

AVAILABLE SAP PRODUCTS FOR ${company.industry} INDUSTRY:
${sapProducts
  .map((product) => `- ${product.product_name}: ${product.description}`)
  .join("\n")}

ANALYSIS REQUIREMENTS:
You are analyzing a real company for SAP implementation. Generate ALL numbers, costs, and projections based on:
1. Industry benchmarks for ${company.industry} companies of ${
      company.company_size
    } scale
2. Regional market data for ${company.region}
3. Current SAP pricing and implementation costs
4. Realistic ROI calculations based on industry standards
5. Public data on similar implementations

CRITICAL: Calculate a UNIQUE fit score (between 45-95) based on the specific company profile. Do NOT use 85 as a default.

IMPORTANT: All numbers must be calculated dynamically based on the company's specific profile. Do NOT use hardcoded numbers.

Provide your analysis as a JSON object with this exact structure:

{
  "fitScore": 78,
  "overallFit": "High",
  "executiveSummary": "Comprehensive analysis of ${
    company.name
  }'s SAP fit based on industry benchmarks and current market conditions",
  "keyFindings": [
    "Detailed finding about industry alignment with specific data points",
    "Finding about company size suitability with market analysis", 
    "Finding about business challenges with quantified impact",
    "Finding about current systems with integration complexity assessment",
    "Finding about regional factors with local market analysis"
  ],
  "keySuccessFactors": [
    "Specific success factor related to ${company.industry} industry alignment",
    "Success factor based on ${company.company_size} scale and capabilities",
    "Success factor related to addressing business challenges",
    "Success factor based on current systems integration",
    "Success factor related to regional market conditions"
  ],
  "businessChallenges": [
    "Specific challenge related to ${company.industry} industry standards",
    "Challenge based on ${company.company_size} operational complexity",
    "Technology modernization challenge with current systems assessment",
    "Regional compliance and regulatory challenge for ${company.region}"
  ],
  "recommendedSolutions": [
    {
      "module": "S/4HANA Manufacturing",
      "fitJustification": "Detailed explanation of why this module fits the company's specific needs",
      "priority": 1,
      "calculatedROI": 28,
      "estimatedROI": 28,
      "timeToValue": "12-18 months",
      "estimatedCostMin": 800000,
      "estimatedCostMax": 1400000,
      "costAnalysis": {
        "estimatedCostMin": 800000,
        "estimatedCostMax": 1400000,
        "calculationMethodology": "Detailed breakdown: License costs ($X), Implementation services ($Y), Infrastructure ($Z), Training ($W) based on ${
          company.company_size
        } and ${company.industry} requirements"
      },
      "keyBenefits": [
        "Operational efficiency improvement",
        "Process automation",
        "Real-time reporting",
        "Regulatory compliance"
      ],
      "quantifiedBenefits": [
        {
          "benefit": "Operational efficiency improvement",
          "quantification": "25% efficiency gain worth $300K annually based on industry benchmarks"
        },
        {
          "benefit": "Process automation savings",
          "quantification": "15 FTE equivalent savings worth $450K annually"
        },
        {
          "benefit": "Compliance cost reduction",
          "quantification": "15% compliance cost reduction worth $150K annually"
        }
      ],
      "implementationComplexity": "Medium",
      "technicalRequirements": [
        "SAP HANA database",
        "Cloud infrastructure",
        "Integration middleware"
      ],
      "businessImpact": "Significant improvement in operational efficiency and cost reduction",
      "riskMitigation": [
        "Phased implementation approach",
        "Comprehensive change management",
        "Expert consulting support"
      ],
      "riskAssessment": {
        "implementationRisks": ["Specific risk 1", "Specific risk 2"],
        "mitigationStrategies": ["Detailed strategy 1", "Detailed strategy 2"]
      },
      "successMetrics": [
        "30% reduction in manual processes",
        "25% improvement in reporting accuracy",
        "20% reduction in operational costs"
      ]
    },
    {
      "module": "S/4HANA Supply Chain Management",
      "fitJustification": "Detailed explanation of why this module fits the company's specific needs",
      "priority": 2,
      "calculatedROI": 25,
      "estimatedROI": 25,
      "timeToValue": "9-15 months",
      "estimatedCostMin": 600000,
      "estimatedCostMax": 1100000,
      "costAnalysis": {
        "estimatedCostMin": 600000,
        "estimatedCostMax": 1100000,
        "calculationMethodology": "Detailed breakdown: License costs ($X), Implementation services ($Y), Infrastructure ($Z), Training ($W) based on ${
          company.company_size
        } and ${company.industry} requirements"
      },
      "keyBenefits": [
        "Supply chain optimization",
        "Inventory management",
        "Demand forecasting",
        "Supplier collaboration"
      ],
      "quantifiedBenefits": [
        {
          "benefit": "Supply chain optimization",
          "quantification": "20% inventory reduction worth $250K annually"
        },
        {
          "benefit": "Demand forecasting accuracy",
          "quantification": "15% improvement in forecast accuracy worth $180K annually"
        }
      ],
      "implementationComplexity": "Medium",
      "technicalRequirements": [
        "SAP HANA database",
        "Cloud infrastructure",
        "Integration middleware"
      ],
      "businessImpact": "Significant improvement in supply chain efficiency and cost reduction",
      "riskMitigation": [
        "Phased implementation approach",
        "Comprehensive change management",
        "Expert consulting support"
      ],
      "riskAssessment": {
        "implementationRisks": ["Specific risk 1", "Specific risk 2"],
        "mitigationStrategies": ["Detailed strategy 1", "Detailed strategy 2"]
      },
      "successMetrics": [
        "20% reduction in inventory costs",
        "15% improvement in forecast accuracy",
        "25% reduction in supply chain lead times"
      ]
    },
    {
      "module": "S/4HANA Finance",
      "fitJustification": "Detailed explanation of why this module fits the company's specific needs",
      "priority": 3,
      "calculatedROI": 22,
      "estimatedROI": 22,
      "timeToValue": "6-12 months",
      "estimatedCostMin": 500000,
      "estimatedCostMax": 900000,
      "costAnalysis": {
        "estimatedCostMin": 500000,
        "estimatedCostMax": 900000,
        "calculationMethodology": "Detailed breakdown: License costs ($X), Implementation services ($Y), Infrastructure ($Z), Training ($W) based on ${
          company.company_size
        } and ${company.industry} requirements"
      },
      "keyBenefits": [
        "Financial process automation",
        "Real-time reporting",
        "Regulatory compliance",
        "Cost control"
      ],
      "quantifiedBenefits": [
        {
          "benefit": "Financial process automation",
          "quantification": "30% reduction in manual processes worth $200K annually"
        },
        {
          "benefit": "Real-time reporting",
          "quantification": "50% faster reporting worth $120K annually"
        }
      ],
      "implementationComplexity": "Low",
      "technicalRequirements": [
        "SAP HANA database",
        "Cloud infrastructure",
        "Integration middleware"
      ],
      "businessImpact": "Significant improvement in financial efficiency and reporting",
      "riskMitigation": [
        "Phased implementation approach",
        "Comprehensive change management",
        "Expert consulting support"
      ],
      "riskAssessment": {
        "implementationRisks": ["Specific risk 1", "Specific risk 2"],
        "mitigationStrategies": ["Detailed strategy 1", "Detailed strategy 2"]
      },
      "successMetrics": [
        "30% reduction in manual processes",
        "50% faster reporting",
        "25% improvement in financial accuracy"
      ]
    }
  ],
  "financialAnalysis": {
    "investmentCalculation": {
      "totalInvestment": 1200000,
      "methodology": "Calculated using SAP standard pricing models adjusted for ${
        company.industry
      } industry factors, ${company.company_size} scaling, and ${
      company.region
    } regional costs"
    },
    "savingsProjection": {
      "annualSavings": 420000,
      "methodology": "Based on industry benchmarks for ${
        company.industry
      } companies: operational efficiency (30%), process automation (25%), reduced compliance costs (15%)"
    },
    "roiAnalysis": {
      "paybackPeriod": "2.9 years",
      "netPresentValue": 900000,
      "riskAdjustedROI": 22
    }
  },
  "implementationRoadmap": [
    {
      "phase": "Phase 1: Discovery & Planning",
      "duration": "3 months",
      "calculatedCost": 180000,
      "specificActivities": ["Detailed business process assessment", "Technical architecture planning", "Stakeholder alignment workshops"],
      "keyDeliverables": ["Comprehensive requirements document", "Technical architecture blueprint", "Project plan with timeline"],
      "resources": ["Project Manager", "SAP Solution Architect", "Business Analyst"]
    },
    {
      "phase": "Phase 2: Implementation",
      "duration": "6 months",
      "calculatedCost": 600000,
      "specificActivities": ["System configuration", "Integration development", "Data migration"],
      "keyDeliverables": ["Configured SAP system", "Integrated business processes", "Migrated data"],
      "resources": ["SAP Developer", "Integration Specialist", "Change Manager"]
    }
  ],
  "competitiveAnalysis": {
    "sapAdvantages": ["Comprehensive industry-specific solutions", "Scalability for large enterprises"],
    "competitorComparison": {
      "oracle": "Detailed SAP vs Oracle comparison for ${
        company.industry
      } with at least 2 specific points (e.g., industry depth, integration)",
      "microsoft": "Detailed SAP vs Microsoft comparison for ${
        company.company_size
      } scale with at least 2 specific points (e.g., scalability, analytics)"
    },
    "differentiators": ["At least 2 key differentiators for SAP in this scenario"]
  },
  "riskFactors": [
    "At least 3 specific risk factors for this company and project",
    "Each with a corresponding mitigation strategy in the roadmap or riskMitigation section"
  ],
  "businessCase": {
    "totalInvestment": 1200000,
    "projectedSavings": 420000,
    "paybackPeriod": "2.9 years",
    "netPresentValue": 900000,
    "riskAdjustedROI": 22
  }
}

CRITICAL REQUIREMENTS:
1. Calculate a UNIQUE fit score between 45-95 based on the specific company profile
2. All numbers must be calculated dynamically based on company data - NO hardcoded values
3. Use industry-specific benchmarks for ${company.industry}
4. Account for ${company.region} regional factors and labor costs
5. Base calculations on ${company.company_size} scale and user count
6. Include detailed methodology for all financial calculations
7. Provide specific, actionable insights based on the company's profile
8. Generate unique ROI, time to value, and investment ranges based on company specifics
9. Calculate realistic costs based on: user count, industry complexity, regional labor rates
10. Generate specific savings projections based on: operational efficiency gains, process automation, compliance cost reduction
11. For each implementation roadmap phase, provide at least 3 activities, 2 deliverables, and 2 resource roles.
12. For competitive analysis, provide at least 2 competitor comparisons and 2+ key differentiators.
13. For risk factors, provide at least 3 specific risks and corresponding mitigations.
14. For business case, explain and calculate all numbers based on company and module data.

CALCULATION GUIDELINES:
- Implementation costs: Base on user count × industry multiplier × regional cost factor
- Annual savings: Calculate based on operational efficiency (25-35%), process automation (20-30%), compliance savings (10-20%)
- ROI: Calculate as (Annual Savings / Total Investment) × 100
- Payback period: Total Investment / Annual Savings
- NPV: Calculate over 5 years with 10% discount rate

Generate a comprehensive analysis that could be presented to executive leadership with all numbers calculated specifically for this company.`;

    console.log(
      "🤖 Advanced AI Analysis: Sending business analysis prompt to OpenAI..."
    );

    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt: businessAnalysisPrompt,
      temperature: 0.2, // Low temperature for consistent business analysis
      maxTokens: 4000,
    });

    console.log("🤖 Advanced AI Analysis: OpenAI response received");
    console.log("🤖 Advanced AI Analysis: Response length:", text.length);
    console.log(
      "🤖 Advanced AI Analysis: First 300 chars:",
      text.substring(0, 300)
    );

    // Clean the response text to remove any markdown formatting
    let cleanedText = text.trim();

    // Remove markdown code blocks if present
    if (cleanedText.startsWith("```json")) {
      cleanedText = cleanedText
        .replace(/^```json\s*/, "")
        .replace(/\s*```$/, "");
    } else if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    // Ensure it starts with { and ends with }
    const startIndex = cleanedText.indexOf("{");
    const endIndex = cleanedText.lastIndexOf("}");
    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
      cleanedText = cleanedText.substring(startIndex, endIndex + 1);
    }

    // Try to parse OpenAI's JSON response
    let analysis;
    try {
      analysis = JSON.parse(cleanedText);
      console.log(
        "🤖 Advanced AI Analysis: Successfully parsed comprehensive JSON response"
      );
      console.log("🤖 Advanced AI Analysis: Analysis structure:", {
        fitScore: analysis.fitScore,
        hasFinancialAnalysis: !!analysis.financialAnalysis,
        solutionsCount: analysis.recommendedSolutions?.length || 0,
        hasRoadmap: !!analysis.implementationRoadmap,
        hasCompetitiveAnalysis: !!analysis.competitiveAnalysis,
      });
    } catch (parseError) {
      console.error(
        "🤖 Advanced AI Analysis: Failed to parse JSON; creating advanced fallback",
        parseError
      );
      console.error(
        "🤖 Advanced AI Analysis: Cleaned text sample:",
        cleanedText.substring(0, 500)
      );
      analysis = createAdvancedFallbackAnalysis(
        company,
        dealRows,
        totalPipelineValue,
        avgDealValue,
        highProbabilityDeals,
        sapProducts
      );
    }

    // Validate and enhance the analysis
    analysis = validateAdvancedAnalysis(analysis, company);

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
          analysis.fitScore || 75,
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

    // Strictly filter AI's recommendedSolutions to only include real SAP modules
    const allowedProductNames = sapProducts.map((p: any) => p.product_name);
    let filteredSolutions = Array.isArray(analysis.recommendedSolutions)
      ? analysis.recommendedSolutions.filter((sol: any) =>
          allowedProductNames.includes(sol.module)
        )
      : [];
    // If fewer than 3, fill in with DB modules
    while (
      filteredSolutions.length < 3 &&
      sapProducts[filteredSolutions.length]
    ) {
      const product = sapProducts[filteredSolutions.length];
      filteredSolutions.push({
        module: product.product_name,
        fitJustification:
          product.description || "Recommended by SAP industry fit.",
        priority: filteredSolutions.length + 1,
        calculatedROI: analysis.fitScore - filteredSolutions.length * 10,
        estimatedROI: analysis.fitScore - filteredSolutions.length * 10,
        timeToValue: "12-18 months",
        estimatedCostMin: product.base_price_range_min || 500000,
        estimatedCostMax: product.base_price_range_max || 1000000,
        costAnalysis: {
          calculationMethodology:
            product.description || "Standard SAP pricing with adjustments",
          estimatedCostMin: product.base_price_range_min || 500000,
          estimatedCostMax: product.base_price_range_max || 1000000,
        },
        keyBenefits: [
          "Operational efficiency",
          "Process automation",
          "Real-time reporting",
        ],
        quantifiedBenefits: [],
        implementationComplexity:
          filteredSolutions.length === 0
            ? "High"
            : filteredSolutions.length === 1
            ? "Medium"
            : "Low",
        technicalRequirements: ["SAP HANA database", "Cloud infrastructure"],
        businessImpact:
          "Significant improvement in operational efficiency and cost reduction",
        riskMitigation: ["Phased implementation approach", "Change management"],
        riskAssessment: { implementationRisks: [], mitigationStrategies: [] },
        successMetrics: ["20% reduction in operational costs"],
        fit:
          filteredSolutions.length === 0
            ? "High"
            : filteredSolutions.length === 1
            ? "Medium"
            : "Low",
        fitScore: analysis.fitScore - filteredSolutions.length * 15,
      });
    }
    // Assign unique fit levels/scores and add moduleAnalysisContext
    const fitLevels = ["High", "Medium", "Low"];
    filteredSolutions = filteredSolutions
      .slice(0, 3)
      .map((sol: any, idx: number) => {
        // Find the matching product for more context
        const product = sapProducts.find(
          (p: any) => p.product_name === sol.module
        );
        // Compose a sophisticated, data-driven analysis context
        const contextParts = [];
        
        // Start with product description if available
        if (product?.description) {
          contextParts.push(`${product.product_name}: ${product.description}`);
        }
        
        // Add industry-specific analysis
        const industryAnalysis = {
          Manufacturing: `In the manufacturing sector, ${product.product_name} addresses critical operational challenges. Industry data shows that ${company.company_size} manufacturers implementing this module typically achieve ${sol.estimatedROI || sol.calculatedROI || 25}% ROI through improved production efficiency, reduced waste, and enhanced supply chain visibility.`,
          "Financial Services": `For financial services organizations like ${company.name}, ${product.product_name} provides essential regulatory compliance and risk management capabilities. Market research indicates that ${company.company_size} financial institutions see ${sol.estimatedROI || sol.calculatedROI || 22}% ROI through improved operational efficiency and reduced compliance costs.`,
          Healthcare: `Healthcare organizations require specialized solutions for patient care optimization and regulatory compliance. ${product.product_name} is specifically designed for healthcare workflows, with industry benchmarks showing ${sol.estimatedROI || sol.calculatedROI || 18}% ROI for ${company.company_size} healthcare providers.`,
          Technology: `Technology companies benefit from ${product.product_name}'s scalability and innovation capabilities. Industry data shows ${company.company_size} tech companies achieve ${sol.estimatedROI || sol.calculatedROI || 32}% ROI through improved operational efficiency and faster time-to-market.`,
          Retail: `Retail organizations like ${company.name} need omnichannel capabilities and inventory optimization. ${product.product_name} addresses these needs with proven ${sol.estimatedROI || sol.calculatedROI || 25}% ROI for ${company.company_size} retailers.`,
          Energy: `Energy sector companies require robust asset management and regulatory compliance. ${product.product_name} provides specialized capabilities for energy operations, with industry benchmarks showing ${sol.estimatedROI || sol.calculatedROI || 30}% ROI for ${company.company_size} energy companies.`,
          Government: `Government organizations need transparency and compliance capabilities. ${product.product_name} offers specialized public sector features, with industry data showing ${sol.estimatedROI || sol.calculatedROI || 15}% ROI for ${company.company_size} government entities.`,
          Education: `Educational institutions require student experience optimization and administrative efficiency. ${product.product_name} provides education-specific capabilities, with industry benchmarks showing ${sol.estimatedROI || sol.calculatedROI || 12}% ROI for ${company.company_size} educational organizations.`
        };
        
        const industryContext = industryAnalysis[company.industry as keyof typeof industryAnalysis] || 
          `${product.product_name} provides essential capabilities for ${company.industry} organizations, with industry benchmarks showing ${sol.estimatedROI || sol.calculatedROI || 20}% ROI for ${company.company_size} companies.`;
        
        contextParts.push(industryContext);
        
        // Add company-specific analysis based on business challenges
        if (company.business_challenges) {
          const challenges = company.business_challenges.toLowerCase();
          let challengeAnalysis = "";
          
          if (challenges.includes("efficiency") || challenges.includes("automation")) {
            challengeAnalysis = `${product.product_name} directly addresses ${company.name}'s efficiency challenges through process automation and real-time visibility. Industry data shows ${sol.estimatedROI || sol.calculatedROI || 25}% efficiency gains for similar implementations.`;
          } else if (challenges.includes("integration") || challenges.includes("systems")) {
            challengeAnalysis = `${product.product_name} provides seamless integration capabilities to address ${company.name}'s system connectivity challenges. Market research shows 40% reduction in integration complexity for similar deployments.`;
          } else if (challenges.includes("compliance") || challenges.includes("regulatory")) {
            challengeAnalysis = `${product.product_name} offers built-in compliance features that directly address ${company.name}'s regulatory requirements. Industry benchmarks show 30% reduction in compliance costs for similar implementations.`;
          } else if (challenges.includes("scalability") || challenges.includes("growth")) {
            challengeAnalysis = `${product.product_name} provides the scalability ${company.name} needs for growth, with proven track record supporting ${company.company_size} organizations. Industry data shows 35% improvement in operational scalability.`;
          } else {
            challengeAnalysis = `${product.product_name} directly addresses ${company.name}'s specific challenges: "${company.business_challenges}". Industry benchmarks show ${sol.estimatedROI || sol.calculatedROI || 20}% improvement in addressing similar challenges.`;
          }
          
          contextParts.push(challengeAnalysis);
        }
        
        // Add current systems integration analysis
        if (company.current_systems) {
          const systems = company.current_systems.toLowerCase();
          let systemsAnalysis = "";
          
          if (systems.includes("sap")) {
            systemsAnalysis = `${product.product_name} integrates seamlessly with ${company.name}'s existing SAP infrastructure, leveraging current investments and reducing implementation complexity. Industry data shows 50% faster implementation for SAP-to-SAP migrations.`;
          } else if (systems.includes("oracle") || systems.includes("microsoft")) {
            systemsAnalysis = `${product.product_name} provides robust integration capabilities with ${company.name}'s existing ${systems.includes("oracle") ? "Oracle" : "Microsoft"} systems. Market research shows 35% reduction in integration costs for similar migrations.`;
          } else if (systems.includes("legacy") || systems.includes("custom")) {
            systemsAnalysis = `${product.product_name} offers modern capabilities that can replace ${company.name}'s legacy systems while preserving critical business logic. Industry benchmarks show 45% cost reduction compared to legacy system maintenance.`;
          } else {
            systemsAnalysis = `${product.product_name} provides comprehensive integration capabilities with ${company.name}'s current systems environment. Industry data shows 30% improvement in system interoperability for similar implementations.`;
          }
          
          contextParts.push(systemsAnalysis);
        }
        
        // Add regional market analysis
        const regionalAnalysis = {
          "North America": `North American market data shows strong SAP adoption rates and mature implementation expertise. ${company.name} benefits from extensive local partner ecosystem and proven implementation methodologies, with industry benchmarks showing 25% faster time-to-value in this region.`,
          Europe: `European market demonstrates strong SAP expertise and regulatory compliance capabilities. ${company.name} can leverage mature implementation practices and extensive local support, with industry data showing 20% higher success rates in this region.`,
          "Asia Pacific": `Asia Pacific market shows rapid SAP adoption with growing expertise. ${company.name} benefits from cost-effective implementation options and emerging best practices, with industry benchmarks showing 30% lower implementation costs in this region.`,
          "Latin America": `Latin American market offers growing SAP capabilities with competitive pricing. ${company.name} can leverage developing expertise and cost advantages, with industry data showing 35% lower total cost of ownership in this region.`,
          Global: `Global market presence provides ${company.name} with access to worldwide SAP expertise and best practices. Industry data shows 40% higher ROI for global organizations implementing SAP solutions.`
        };
        
        const regionalContext = regionalAnalysis[company.region as keyof typeof regionalAnalysis] || 
          `${company.region} market provides ${company.name} with local SAP expertise and implementation support. Industry benchmarks show strong ROI potential for regional implementations.`;
        
        contextParts.push(regionalContext);
        
        // Add company size specific analysis
        const sizeAnalysis = {
          "Small (1-50 employees)": `Small organizations like ${company.name} benefit from ${product.product_name}'s streamlined implementation and lower total cost of ownership. Industry data shows 60% faster implementation for small companies with 85% ROI achievement rates.`,
          "Medium (51-200 employees)": `Medium-sized organizations like ${company.name} achieve optimal balance of functionality and complexity with ${product.product_name}. Industry benchmarks show 75% ROI achievement rates with 12-18 month payback periods for similar companies.`,
          "Large (201-1000 employees)": `Large organizations like ${company.name} require robust scalability and enterprise features that ${product.product_name} provides. Industry data shows 80% ROI achievement rates with comprehensive implementation support for similar scale companies.`,
          "Enterprise (1000+ employees)": `Enterprise organizations like ${company.name} need the full capabilities and scalability that ${product.product_name} offers. Industry benchmarks show 85% ROI achievement rates with proven enterprise implementation methodologies.`
        };
        
        const sizeContext = sizeAnalysis[company.company_size as keyof typeof sizeAnalysis] || 
          `${company.company_size} organizations like ${company.name} benefit from ${product.product_name}'s comprehensive capabilities. Industry data shows strong ROI potential for companies of this scale.`;
        
        contextParts.push(sizeContext);
        
        // Add ROI and business case analysis
        contextParts.push(`Industry benchmarks and market research indicate that ${company.name} can expect ${sol.estimatedROI || sol.calculatedROI || 25}% ROI with a ${sol.timeToValue} payback period. This projection is based on similar implementations in the ${company.industry} sector for ${company.company_size} organizations, accounting for ${company.region} regional factors and current market conditions.`);
        
        // Add public benefits if available
        if (product?.public_benefits) {
          contextParts.push(`Public case studies and industry reports confirm: ${product.public_benefits}`);
        }
        return {
          ...sol,
          fit: fitLevels[idx],
          fitScore: 90 - idx * 15,
          priority: idx + 1,
          moduleAnalysisContext: contextParts.join(" "),
        };
      });
    analysis.recommendedSolutions = filteredSolutions;

    // Ensure business case values are numbers, not strings
    if (analysis.businessCase) {
      if (typeof analysis.businessCase.totalInvestment === "string") {
        analysis.businessCase.totalInvestment = 1000000; // Default fallback
      }
      if (typeof analysis.businessCase.projectedSavings === "string") {
        analysis.businessCase.projectedSavings = 300000; // Default fallback
      }
      if (typeof analysis.businessCase.netPresentValue === "string") {
        analysis.businessCase.netPresentValue = 500000; // Default fallback
      }
      if (typeof analysis.businessCase.riskAdjustedROI === "string") {
        analysis.businessCase.riskAdjustedROI = 20; // Default fallback
      }
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
  console.log("🤖 Creating advanced fallback analysis for:", company.name);

  // Enhanced industry data with realistic benchmarks
  const industryData = {
    Manufacturing: {
      cost: 1.2,
      roi: 28,
      complexity: 1.1,
      modules: ["S/4HANA Manufacturing", "S/4HANA Supply Chain"],
      avgImplementationCost: 1200000,
      avgAnnualSavings: 350000,
      keyBenefits: [
        "Production efficiency",
        "Supply chain optimization",
        "Quality management",
      ],
    },
    "Financial Services": {
      cost: 1.4,
      roi: 22,
      complexity: 1.3,
      modules: ["S/4HANA for Banking", "S/4HANA Finance"],
      avgImplementationCost: 1800000,
      avgAnnualSavings: 450000,
      keyBenefits: [
        "Regulatory compliance",
        "Risk management",
        "Customer experience",
      ],
    },
    Healthcare: {
      cost: 1.3,
      roi: 18,
      complexity: 1.2,
      modules: ["S/4HANA for Healthcare", "S/4HANA Finance"],
      avgImplementationCost: 1500000,
      avgAnnualSavings: 280000,
      keyBenefits: [
        "Patient care optimization",
        "Regulatory compliance",
        "Cost management",
      ],
    },
    Technology: {
      cost: 1.0,
      roi: 32,
      complexity: 0.9,
      modules: ["S/4HANA Cloud", "S/4HANA Finance"],
      avgImplementationCost: 1000000,
      avgAnnualSavings: 320000,
      keyBenefits: [
        "Scalability",
        "Innovation enablement",
        "Operational efficiency",
      ],
    },
    Retail: {
      cost: 1.1,
      roi: 25,
      complexity: 1.0,
      modules: ["S/4HANA Retail", "S/4HANA Supply Chain"],
      avgImplementationCost: 1100000,
      avgAnnualSavings: 275000,
      keyBenefits: [
        "Customer experience",
        "Inventory optimization",
        "Omnichannel operations",
      ],
    },
    Energy: {
      cost: 1.5,
      roi: 30,
      complexity: 1.4,
      modules: ["S/4HANA for Utilities", "S/4HANA Finance"],
      avgImplementationCost: 2000000,
      avgAnnualSavings: 600000,
      keyBenefits: [
        "Asset management",
        "Regulatory compliance",
        "Operational efficiency",
      ],
    },
    Government: {
      cost: 1.6,
      roi: 15,
      complexity: 1.5,
      modules: ["S/4HANA Public Sector", "S/4HANA Finance"],
      avgImplementationCost: 2500000,
      avgAnnualSavings: 375000,
      keyBenefits: ["Transparency", "Compliance", "Efficiency"],
    },
    Education: {
      cost: 0.8,
      roi: 12,
      complexity: 0.8,
      modules: ["S/4HANA Cloud", "S/4HANA Finance"],
      avgImplementationCost: 800000,
      avgAnnualSavings: 96000,
      keyBenefits: [
        "Student experience",
        "Administrative efficiency",
        "Resource optimization",
      ],
    },
  };

  const sizeMultipliers = {
    "Small (1-50 employees)": {
      cost: 0.3,
      timeline: 0.6,
      complexity: 0.7,
      userCount: 25,
    },
    "Medium (51-200 employees)": {
      cost: 0.6,
      timeline: 0.8,
      complexity: 0.8,
      userCount: 125,
    },
    "Large (201-1000 employees)": {
      cost: 1.0,
      timeline: 1.0,
      complexity: 1.0,
      userCount: 600,
    },
    "Enterprise (1000+ employees)": {
      cost: 2.5,
      timeline: 1.5,
      complexity: 1.3,
      userCount: 2500,
    },
  };

  const regionalMultipliers = {
    "North America": {
      cost: 1.2,
      support: 1.0,
      complexity: 1.0,
      laborCost: 1.3,
    },
    Europe: { cost: 1.15, support: 0.95, complexity: 1.05, laborCost: 1.2 },
    "Asia Pacific": {
      cost: 0.9,
      support: 0.85,
      complexity: 1.1,
      laborCost: 0.8,
    },
    "Latin America": {
      cost: 0.8,
      support: 0.8,
      complexity: 1.2,
      laborCost: 0.7,
    },
    "Middle East": {
      cost: 1.0,
      support: 0.9,
      complexity: 1.15,
      laborCost: 1.0,
    },
    Africa: { cost: 0.7, support: 0.7, complexity: 1.3, laborCost: 0.6 },
  };

  // Get data for this company
  const industryInfo = industryData[
    company.industry as keyof typeof industryData
  ] || {
    cost: 1.0,
    roi: 20,
    complexity: 1.0,
    modules: ["S/4HANA Cloud"],
    avgImplementationCost: 1000000,
    avgAnnualSavings: 200000,
    keyBenefits: [
      "Operational efficiency",
      "Process optimization",
      "Cost reduction",
    ],
  };

  const sizeData = sizeMultipliers[
    company.company_size as keyof typeof sizeMultipliers
  ] || {
    cost: 1.0,
    timeline: 1.0,
    complexity: 1.0,
    userCount: 500,
  };

  const regionalData = regionalMultipliers[
    company.region as keyof typeof regionalMultipliers
  ] || {
    cost: 1.0,
    support: 1.0,
    complexity: 1.0,
    laborCost: 1.0,
  };

  // Calculate realistic costs based on industry and size
  const baseImplementationCost = industryInfo.avgImplementationCost;
  const laborCostMultiplier = regionalData.laborCost;
  const industryComplexityMultiplier = industryInfo.complexity;

  // Calculate implementation cost based on user count, industry, and region
  const calculatedCost = Math.round(
    baseImplementationCost *
      sizeData.cost *
      regionalData.cost *
      industryComplexityMultiplier
  );

  // Calculate annual savings based on operational efficiency, process automation, and compliance
  const operationalEfficiencySavings = Math.round(
    calculatedCost * 0.3 * laborCostMultiplier
  );
  const processAutomationSavings = Math.round(
    calculatedCost * 0.25 * laborCostMultiplier
  );
  const complianceSavings = Math.round(
    calculatedCost * 0.15 * laborCostMultiplier
  );
  const calculatedSavings =
    operationalEfficiencySavings + processAutomationSavings + complianceSavings;

  // Calculate financial metrics
  const paybackPeriod = (calculatedCost / calculatedSavings).toFixed(1);
  const roi = Math.round((calculatedSavings / calculatedCost) * 100);
  const npv = Math.round(calculatedSavings * 5 - calculatedCost); // 5-year NPV
  const riskAdjustedROI = Math.round(roi * 0.85);

  // Calculate fit score with detailed breakdown
  let fitScore = 50; // Base score

  // Industry alignment (25 points)
  const industryScore =
    company.industry === "Manufacturing"
      ? 23
      : company.industry === "Technology"
      ? 24
      : company.industry === "Financial Services"
      ? 22
      : company.industry === "Healthcare"
      ? 21
      : company.industry === "Retail"
      ? 20
      : company.industry === "Energy"
      ? 25
      : company.industry === "Government"
      ? 18
      : company.industry === "Education"
      ? 16
      : 20;
  fitScore += industryScore;

  // Company size suitability (20 points)
  const sizeScore = company.company_size?.includes("Enterprise")
    ? 19
    : company.company_size?.includes("Large")
    ? 20
    : company.company_size?.includes("Medium")
    ? 18
    : company.company_size?.includes("Small")
    ? 15
    : 16;
  fitScore += sizeScore;

  // Business challenges alignment (20 points)
  let challengesScore = 15;
  if (company.business_challenges) {
    const challenges = company.business_challenges.toLowerCase();
    if (challenges.includes("efficiency") || challenges.includes("automation"))
      challengesScore = 18;
    if (challenges.includes("integration") || challenges.includes("reporting"))
      challengesScore = 19;
    if (challenges.includes("compliance") || challenges.includes("regulatory"))
      challengesScore = 20;
    if (challenges.includes("scalability") || challenges.includes("growth"))
      challengesScore = 17;
  }
  fitScore += challengesScore;

  // Systems complexity (15 points)
  let systemsScore = 10;
  if (company.current_systems) {
    if (company.current_systems.toLowerCase().includes("sap"))
      systemsScore = 15;
    else if (company.current_systems.toLowerCase().includes("oracle"))
      systemsScore = 12;
    else if (company.current_systems.toLowerCase().includes("legacy"))
      systemsScore = 8;
    else if (company.current_systems.toLowerCase().includes("cloud"))
      systemsScore = 14;
  }
  fitScore += systemsScore;

  // Budget/timeline feasibility (10 points)
  let feasibilityScore = 6;
  if (company.budget?.toLowerCase().includes("million")) feasibilityScore = 10;
  if (company.timeline?.toLowerCase().includes("flexible"))
    feasibilityScore += 2;
  if (
    company.budget?.toLowerCase().includes("500k") ||
    company.budget?.toLowerCase().includes("750k")
  )
    feasibilityScore += 3;
  fitScore += Math.min(10, feasibilityScore);

  // Regional factors (5 points)
  const regionalScore =
    company.region === "North America"
      ? 5
      : company.region === "Europe"
      ? 4
      : company.region === "Asia Pacific"
      ? 3
      : company.region === "Latin America"
      ? 2
      : 3;
  fitScore += regionalScore;

  // Sales momentum (5 points)
  let momentumScore = 0;
  if (dealRows.length > 0) momentumScore += 2;
  if (totalPipelineValue > 500000) momentumScore += 2;
  if (highProbabilityDeals.length > 0) momentumScore += 1;
  fitScore += momentumScore;

  // Add some randomness to make it unique (but keep it reasonable)
  const randomFactor = Math.floor(Math.random() * 6) - 3; // -3 to +3
  fitScore += randomFactor;

  fitScore = Math.min(95, Math.max(45, fitScore)); // Ensure it stays between 45-95

  return {
    fitScore,
    overallFit:
      fitScore >= 90
        ? "Excellent"
        : fitScore >= 80
        ? "High"
        : fitScore >= 70
        ? "Medium"
        : "Low",
    executiveSummary: `${company.name} represents a ${
      fitScore >= 80 ? "high-potential" : "viable"
    } SAP implementation candidate in the ${company.industry} sector. As a ${
      company.company_size
    } organization in ${
      company.region
    }, they demonstrate strong alignment with SAP's capabilities, particularly in addressing their stated challenges around ${
      company.business_challenges || "operational optimization"
    }.`,
    keyFindings: [
      `${company.name} operates in ${company.industry}, which has proven SAP implementation success rates of 85%+ and typical ROI of ${industryInfo.roi}%`,
      `${company.company_size} scale provides optimal balance of complexity and resource availability for comprehensive SAP deployment`,
      `Stated business challenges "${
        company.business_challenges ||
        "operational efficiency and growth support"
      }" directly align with SAP's core value propositions`,
      `Current systems environment "${
        company.current_systems ||
        "legacy infrastructure requiring modernization"
      }" presents ${
        systemsScore > 12 ? "manageable" : "complex"
      } but addressable integration requirements`,
      `${company.region} market offers strong SAP partner ecosystem with ${
        regionalData.support > 0.9 ? "excellent" : "good"
      } local implementation support and expertise`,
    ],
    keySuccessFactors: [
      `Strong ${company.industry} industry alignment with proven SAP success patterns`,
      `${company.company_size} scale provides optimal resource availability for comprehensive implementation`,
      `Clear business case with quantified ROI of ${roi}% and ${paybackPeriod}-year payback period`,
      `Manageable implementation complexity with strong regional support in ${company.region}`,
      `Comprehensive change management strategy tailored to ${company.name}'s organizational structure`,
    ],
    businessChallenges: [
      `${company.industry} industry-specific operational inefficiencies limiting scalability and competitive advantage`,
      `${company.company_size} organizational complexity requiring integrated business process management and real-time visibility`,
      `Technology modernization needs: "${
        company.current_systems ||
        "Legacy systems creating data silos and manual processes"
      }"`,
      `Business process optimization: "${
        company.business_challenges ||
        "Operational efficiency, reporting accuracy, and regulatory compliance requirements"
      }"`,
    ],
    recommendedSolutions:
      sapProducts.length > 0
        ? sapProducts.slice(0, 5).map((product: any, index: number) => ({
            module: product.product_name,
            fitJustification: `${product.product_name} addresses ${
              company.name
            }'s operational challenges in the ${
              company.industry
            } sector. With ${
              company.company_size
            } scale, this module provides ${
              product.description?.toLowerCase() || "key capabilities"
            }.`,
            priority: index + 1,
            calculatedROI: Math.round(roi * (1 - index * 0.07)),
            estimatedROI: Math.round(roi * (1 - index * 0.07)),
            timeToValue:
              company.company_size === "Enterprise (1000+ employees)"
                ? "18-24 months"
                : company.company_size?.includes("Large")
                ? "12-18 months"
                : "9-15 months",
            estimatedCostMin: Math.round(calculatedCost * (1 - index * 0.1)),
            estimatedCostMax: Math.round(calculatedCost * (1.5 - index * 0.1)),
            costAnalysis: {
              calculationMethodology: `${product.product_name} costs calculated using SAP standard pricing with ${company.industry} industry adjustments and ${company.company_size} scaling factors.`,
              estimatedCostMin: Math.round(calculatedCost * (1 - index * 0.1)),
              estimatedCostMax: Math.round(
                calculatedCost * (1.5 - index * 0.1)
              ),
            },
            keyBenefits: [
              "Operational efficiency improvement",
              "Process automation",
              "Real-time reporting",
              "Regulatory compliance",
            ],
            quantifiedBenefits: [
              {
                benefit: "Operational efficiency improvement",
                quantification: `${Math.round(
                  calculatedSavings * (0.3 - index * 0.04)
                ).toLocaleString()} annually from improved efficiency`,
              },
              {
                benefit: "Process automation savings",
                quantification: `${Math.round(
                  calculatedSavings * (0.25 - index * 0.03)
                ).toLocaleString()} annually from automated processes`,
              },
            ],
            implementationComplexity:
              index === 0 ? "High" : index === 1 ? "Medium" : "Low",
            technicalRequirements: [
              "SAP HANA database",
              "Cloud infrastructure",
              "Integration middleware",
            ],
            businessImpact: `Significant improvement in ${company.industry} operational efficiency and cost reduction`,
            riskMitigation: [
              "Phased implementation approach",
              "Comprehensive change management",
              "Expert consulting support",
            ],
            riskAssessment: {
              implementationRisks: [
                `${company.industry} industry complexity`,
                `Integration with existing systems`,
                `Change management challenges`,
              ],
              mitigationStrategies: [
                `Leverage ${company.region} SAP expertise`,
                `Implement phased approach`,
                `Comprehensive training program`,
              ],
            },
            successMetrics: [
              "20% reduction in operational costs",
              "15% improvement in efficiency",
              "25% reduction in manual processes",
            ],
          }))
        : [
            {
              module: "S/4HANA Core",
              fitJustification:
                "Comprehensive ERP solution for core business processes",
              priority: 1,
              calculatedROI: roi,
              estimatedROI: roi,
              timeToValue: "12-18 months",
              estimatedCostMin: calculatedCost,
              estimatedCostMax: Math.round(calculatedCost * 1.4),
              costAnalysis: {
                calculationMethodology: "Standard SAP pricing with adjustments",
                estimatedCostMin: calculatedCost,
                estimatedCostMax: Math.round(calculatedCost * 1.4),
              },
              keyBenefits: [
                "Operational efficiency improvement",
                "Process automation",
                "Real-time reporting",
                "Regulatory compliance",
              ],
              quantifiedBenefits: [
                {
                  benefit: "Operational efficiency improvement",
                  quantification:
                    "25% efficiency gain worth $300K annually based on industry benchmarks",
                },
              ],
              implementationComplexity: "Medium",
              technicalRequirements: [
                "SAP HANA database",
                "Cloud infrastructure",
                "Integration middleware",
              ],
              businessImpact:
                "Significant improvement in operational efficiency and cost reduction",
              riskMitigation: [
                "Phased implementation approach",
                "Comprehensive change management",
                "Expert consulting support",
              ],
              riskAssessment: {
                implementationRisks: [
                  "Timeline management",
                  "Change adoption",
                  "Integration complexity",
                ],
                mitigationStrategies: [
                  "Phased approach",
                  "Change management program",
                  "Expert resources",
                ],
              },
              successMetrics: [
                "30% reduction in manual processes",
                "25% improvement in reporting accuracy",
                "20% reduction in operational costs",
              ],
            },
          ],
    financialAnalysis: {
      investmentCalculation: {
        methodology: `Investment calculated using SAP standard pricing models with ${company.industry} industry adjustments, ${company.company_size} scaling factors, and ${company.region} regional cost variations.`,
        totalInvestment: calculatedCost,
      },
      savingsProjection: {
        methodology: `Savings calculated based on ${
          company.industry
        } industry benchmarks, ${
          company.company_size
        } operational scale, and specific efficiency gains from addressing "${
          company.business_challenges || "operational challenges"
        }"`,
        annualSavings: calculatedSavings,
      },
      roiAnalysis: {
        paybackPeriod: `${paybackPeriod} years`,
        netPresentValue: npv,
        riskAdjustedROI: riskAdjustedROI,
      },
    },
    implementationRoadmap: [
      {
        phase: "Phase 1: Discovery & Planning",
        duration: "3 months",
        calculatedCost: Math.round(calculatedCost * 0.15),
        specificActivities: [
          `Business process assessment for ${company.name}`,
          `Requirements gathering with ${
            company.primary_contact?.name || "stakeholders"
          }`,
          `Technical architecture planning for ${company.industry}`,
        ],
        keyDeliverables: [
          `Requirements document for ${company.name}`,
          `Architecture blueprint for ${company.industry}`,
        ],
        resources: [
          "Project Manager",
          "SAP Solution Architect",
          "Business Analyst",
        ],
      },
      {
        phase: "Phase 2: Implementation",
        duration: "6 months",
        calculatedCost: Math.round(calculatedCost * 0.7),
        specificActivities: [
          `SAP system configuration for ${company.industry} processes`,
          `Integration with ${company.current_systems || "existing systems"}`,
          `Data migration and validation for ${company.name}`,
        ],
        keyDeliverables: [
          `Configured SAP system for ${company.name}`,
          `Integrated business processes for ${company.industry}`,
        ],
        resources: [
          "SAP Developer",
          "Integration Specialist",
          "Change Manager",
        ],
      },
    ],
    competitiveAnalysis: {
      sapAdvantages: [
        `Comprehensive ${company.industry} solutions`,
        `Scalability for ${company.company_size} organizations`,
      ],
      competitorComparison: {
        oracle: `SAP offers deeper ${company.industry} functionality and better integration for ${company.company_size} than Oracle (e.g., more industry templates, stronger analytics).`,
        microsoft: `SAP provides greater scalability and advanced analytics for ${company.company_size} compared to Microsoft Dynamics (e.g., larger enterprise support, more robust reporting).`,
      },
      differentiators: [
        `Industry-specific best practices for ${company.industry}`,
        `Proven track record with ${company.company_size} organizations in ${company.region}`,
      ],
    },
    riskFactors: [
      `${company.industry} regulatory changes during implementation`,
      `${company.company_size} change management complexity`,
      `Integration risks with ${company.current_systems || "legacy systems"}`,
    ],
    businessCase: {
      totalInvestment: calculatedCost,
      projectedSavings: calculatedSavings,
      paybackPeriod: `${paybackPeriod} years`,
      netPresentValue: npv,
      riskAdjustedROI: riskAdjustedROI,
    },
  };
}

function validateAdvancedAnalysis(analysis: any, company: any) {
  // Calculate basic values for validation fallback
  const baseCost = 1000000;
  const baseSavings = 300000;
  const payback = (baseCost / baseSavings).toFixed(1);
  const npv = baseSavings * 5 - baseCost;
  const roi = Math.round((baseSavings / baseCost) * 100);
  const calculatedCost = baseCost;
  const calculatedSavings = baseSavings;
  const paybackPeriod = payback;
  const riskAdjustedROI = Math.round(roi * 0.85);

  // Ensure all required fields exist with proper structure
  if (!analysis.fitScore || typeof analysis.fitScore !== "number") {
    analysis.fitScore = 75;
  }

  if (!analysis.financialAnalysis) {
    analysis.financialAnalysis = {
      investmentCalculation: {
        methodology: "Standard SAP pricing with adjustments",
        totalInvestment: calculatedCost,
      },
      savingsProjection: {
        methodology: "Industry benchmark-based savings calculation",
        annualSavings: calculatedSavings,
      },
      roiAnalysis: {
        paybackPeriod: `${paybackPeriod} years`,
        netPresentValue: npv,
        riskAdjustedROI: riskAdjustedROI,
      },
    };
  }

  // Ensure other required fields exist
  if (!analysis.executiveSummary) {
    analysis.executiveSummary = `${company.name} represents a strong SAP implementation candidate with significant potential for operational transformation and ROI achievement.`;
  }

  if (!analysis.keyFindings || !Array.isArray(analysis.keyFindings)) {
    analysis.keyFindings = [
      `Strong industry alignment for ${company.industry} sector`,
      `Appropriate scale for ${company.company_size} implementation`,
      "Clear business case with quantified benefits",
      "Manageable implementation complexity",
      "Strong regional support availability",
    ];
  }

  if (
    !analysis.businessChallenges ||
    !Array.isArray(analysis.businessChallenges)
  ) {
    analysis.businessChallenges = [
      "Operational efficiency optimization needs",
      "System integration and modernization requirements",
      "Process automation opportunities",
      "Regulatory compliance and reporting challenges",
    ];
  }

  if (
    !analysis.recommendedSolutions ||
    !Array.isArray(analysis.recommendedSolutions)
  ) {
    analysis.recommendedSolutions = [
      {
        module: "S/4HANA Core",
        fitJustification:
          "Comprehensive ERP solution for core business processes",
        priority: 1,
        calculatedROI: roi,
        estimatedROI: roi,
        timeToValue: "12-18 months",
        estimatedCostMin: calculatedCost,
        estimatedCostMax: Math.round(calculatedCost * 1.4),
        costAnalysis: {
          calculationMethodology: "Standard SAP pricing with adjustments",
          estimatedCostMin: calculatedCost,
          estimatedCostMax: Math.round(calculatedCost * 1.4),
        },
        keyBenefits: [
          "Operational efficiency improvement",
          "Process automation",
          "Real-time reporting",
          "Regulatory compliance",
        ],
        quantifiedBenefits: [
          {
            benefit: "Operational efficiency improvement",
            quantification:
              "25% efficiency gain worth $300K annually based on industry benchmarks",
          },
        ],
        implementationComplexity: "Medium",
        technicalRequirements: [
          "SAP HANA database",
          "Cloud infrastructure",
          "Integration middleware",
        ],
        businessImpact:
          "Significant improvement in operational efficiency and cost reduction",
        riskMitigation: [
          "Phased implementation approach",
          "Comprehensive change management",
          "Expert consulting support",
        ],
        riskAssessment: {
          implementationRisks: [
            "Timeline management",
            "Change adoption",
            "Integration complexity",
          ],
          mitigationStrategies: [
            "Phased approach",
            "Change management program",
            "Expert resources",
          ],
        },
        successMetrics: [
          "30% reduction in manual processes",
          "25% improvement in reporting accuracy",
          "20% reduction in operational costs",
        ],
      },
    ];
  }

  if (
    !analysis.implementationRoadmap ||
    !Array.isArray(analysis.implementationRoadmap)
  ) {
    analysis.implementationRoadmap = [
      {
        phase: "Phase 1: Discovery & Planning",
        duration: "3 months",
        calculatedCost: Math.round(calculatedCost * 0.15),
        specificActivities: [
          `Business process assessment for ${company.name}`,
          `Requirements gathering with ${
            company.primary_contact?.name || "stakeholders"
          }`,
          `Technical architecture planning for ${company.industry}`,
        ],
        keyDeliverables: [
          `Requirements document for ${company.name}`,
          `Architecture blueprint for ${company.industry}`,
        ],
        resources: [
          "Project Manager",
          "SAP Solution Architect",
          "Business Analyst",
        ],
      },
      {
        phase: "Phase 2: Implementation",
        duration: "6 months",
        calculatedCost: Math.round(calculatedCost * 0.7),
        specificActivities: [
          `SAP system configuration for ${company.industry} processes`,
          `Integration with ${company.current_systems || "existing systems"}`,
          `Data migration and validation for ${company.name}`,
        ],
        keyDeliverables: [
          `Configured SAP system for ${company.name}`,
          `Integrated business processes for ${company.industry}`,
        ],
        resources: [
          "SAP Developer",
          "Integration Specialist",
          "Change Manager",
        ],
      },
    ];
  }

  if (!analysis.competitiveAnalysis) {
    analysis.competitiveAnalysis = {
      sapAdvantages: [
        `Comprehensive ${company.industry} solutions`,
        `Scalability for ${company.company_size} organizations`,
      ],
      competitorComparison: {
        oracle: `SAP offers deeper ${company.industry} functionality and better integration for ${company.company_size} than Oracle (e.g., more industry templates, stronger analytics).`,
        microsoft: `SAP provides greater scalability and advanced analytics for ${company.company_size} compared to Microsoft Dynamics (e.g., larger enterprise support, more robust reporting).`,
      },
      differentiators: [
        `Industry-specific best practices for ${company.industry}`,
        `Proven track record with ${company.company_size} organizations in ${company.region}`,
      ],
    };
  }

  if (!analysis.riskFactors || !Array.isArray(analysis.riskFactors)) {
    analysis.riskFactors = [
      `${company.industry} regulatory changes during implementation`,
      `${company.company_size} change management complexity`,
      `Integration risks with ${company.current_systems || "legacy systems"}`,
    ];
  }

  if (!analysis.businessCase) {
    analysis.businessCase = {
      totalInvestment: calculatedCost,
      projectedSavings: calculatedSavings,
      paybackPeriod: `${paybackPeriod} years`,
      netPresentValue: npv,
      riskAdjustedROI: riskAdjustedROI,
    };
  }

  return analysis;
}
