import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { companyName, industry, size, challenges, currentSystems, budget } = body

    console.log("🤖 Generating SAP recommendations for:", companyName)

    // Create a comprehensive prompt for OpenAI with all SAP modules
    const prompt = `You are a SAP solutions expert with comprehensive knowledge of ALL SAP modules and products. Analyze the following company information and recommend the most suitable SAP modules.

Company Information:
- Company Name: ${companyName}
- Industry: ${industry}
- Company Size: ${size}
- Business Challenges: ${challenges || "Not specified"}
- Current Systems: ${currentSystems || "Not specified"}
- Budget Range: ${budget || "Not specified"}

Available SAP Modules to Consider:

CORE ERP:
- S/4HANA (Core ERP suite)
- S/4HANA Cloud (Cloud ERP)

INDUSTRY-SPECIFIC:
- SAP for Banking (Financial services)
- SAP for Retail (Retail operations)
- SAP for Healthcare (Healthcare providers)
- SAP for Manufacturing (Manufacturing operations)
- SAP for Utilities (Energy & utilities)
- SAP for Public Sector (Government)

FUNCTIONAL MODULES:
- SuccessFactors (Human Capital Management)
- Ariba (Procurement & supply chain)
- Concur (Travel & expense management)
- Fieldglass (Vendor management)
- Analytics Cloud (Business intelligence)
- Commerce Cloud (E-commerce)
- Customer Experience (CX - Sales, service, marketing)
- Integration Suite (System integration)

TECHNICAL PLATFORMS:
- Business Technology Platform (BTP)
- HANA Database

Based on the company profile, select the top 4 most relevant modules and provide realistic confidence scores based on:
1. Industry alignment
2. Company size appropriateness
3. Addressing stated business challenges
4. Integration with current systems
5. Budget considerations

Respond in JSON format:

{
  "modules": [
    {
      "product_name": "[Most relevant SAP module name]",
      "product_category": "[Category like ERP, Analytics, HR, etc.]",
      "description": "[2-3 sentence description of what this module does and why it fits]",
      "confidence_score": [realistic score 1-100 based on company fit],
      "reasoning": "[Specific explanation of why this module is recommended for this company's industry, size, and challenges]"
    },
    {
      "product_name": "[Second most relevant module]",
      "product_category": "[Category]",
      "description": "[Description]",
      "confidence_score": [score],
      "reasoning": "[Reasoning]"
    },
    {
      "product_name": "[Third most relevant module]",
      "product_category": "[Category]",
      "description": "[Description]",
      "confidence_score": [score],
      "reasoning": "[Reasoning]"
    },
    {
      "product_name": "[Fourth most relevant module]",
      "product_category": "[Category]",
      "description": "[Description]",
      "confidence_score": [score],
      "reasoning": "[Reasoning]"
    }
  ],
  "summary": "[Overall recommendation summary explaining the strategic approach]"
}`

    // Generate recommendations using OpenAI
    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt: prompt,
      temperature: 0.3, // Lower temperature for more consistent recommendations
    })

    console.log("🤖 OpenAI response received")

    // Parse the JSON response
    let recommendations
    try {
      recommendations = JSON.parse(text)
      console.log("🤖 Successfully parsed recommendations:", recommendations.modules?.length, "modules")
    } catch (parseError) {
      console.error("Failed to parse OpenAI response as JSON:", parseError)
      console.log("Raw response:", text.substring(0, 500))
      // Fallback recommendations based on industry
      recommendations = getIntelligentFallbackRecommendations(industry, size, challenges)
    }

    return NextResponse.json(recommendations)
  } catch (error) {
    console.error("SAP recommendations error:", error)

    // Return fallback recommendations on error
    const fallback = getIntelligentFallbackRecommendations("Technology", "Medium", "")
    return NextResponse.json(fallback)
  }
}

function getIntelligentFallbackRecommendations(industry: string, size: string, challenges: string) {
  // Industry-specific module mapping
  const industryModules: Record<string, any[]> = {
    Manufacturing: [
      {
        product_name: "S/4HANA",
        product_category: "ERP",
        description:
          "Comprehensive ERP solution for manufacturing operations, inventory management, and financial processes with real-time analytics.",
        confidence_score: 92,
        reasoning:
          "Essential for manufacturing companies to manage complex operations, supply chains, and production planning efficiently.",
      },
      {
        product_name: "Ariba",
        product_category: "Procurement",
        description:
          "Procurement and supply chain management solution for vendor management, sourcing, and purchasing optimization.",
        confidence_score: 88,
        reasoning:
          "Manufacturing companies benefit significantly from streamlined procurement processes and supplier relationship management.",
      },
      {
        product_name: "Analytics Cloud",
        product_category: "Analytics",
        description:
          "Business intelligence and analytics platform for data-driven decision making and operational insights.",
        confidence_score: 85,
        reasoning: "Critical for manufacturing analytics, production optimization, and supply chain visibility.",
      },
    ],
    "Financial Services": [
      {
        product_name: "S/4HANA for Banking",
        product_category: "Industry ERP",
        description:
          "Specialized ERP solution for banking and financial services with regulatory compliance and risk management features.",
        confidence_score: 95,
        reasoning:
          "Designed specifically for financial services industry requirements, regulatory compliance, and risk management.",
      },
      {
        product_name: "Analytics Cloud",
        product_category: "Analytics",
        description:
          "Advanced analytics and reporting platform for financial analysis, risk assessment, and regulatory reporting.",
        confidence_score: 90,
        reasoning:
          "Financial services rely heavily on data analytics for risk management, compliance reporting, and customer insights.",
      },
      {
        product_name: "Customer Experience",
        product_category: "CRM",
        description: "Customer relationship management suite for sales, service, and marketing in financial services.",
        confidence_score: 82,
        reasoning:
          "Essential for managing customer relationships, cross-selling opportunities, and service delivery in banking.",
      },
    ],
    Healthcare: [
      {
        product_name: "S/4HANA for Healthcare",
        product_category: "Industry ERP",
        description:
          "Healthcare-specific ERP solution for patient management, regulatory compliance, and operational efficiency.",
        confidence_score: 93,
        reasoning:
          "Tailored for healthcare providers with patient care workflows, regulatory requirements, and operational management.",
      },
      {
        product_name: "SuccessFactors",
        product_category: "HR",
        description:
          "Human capital management solution for healthcare workforce management, compliance, and talent development.",
        confidence_score: 87,
        reasoning:
          "Healthcare organizations require specialized HR management for clinical staff, compliance tracking, and workforce optimization.",
      },
      {
        product_name: "Analytics Cloud",
        product_category: "Analytics",
        description: "Healthcare analytics for patient outcomes, operational efficiency, and regulatory reporting.",
        confidence_score: 85,
        reasoning:
          "Critical for healthcare analytics, patient outcome tracking, and operational performance monitoring.",
      },
    ],
    Technology: [
      {
        product_name: "S/4HANA Cloud",
        product_category: "Cloud ERP",
        description:
          "Cloud-based ERP solution ideal for technology companies with rapid scaling and agile business models.",
        confidence_score: 89,
        reasoning:
          "Technology companies benefit from cloud-native ERP with rapid deployment and scalability for growth.",
      },
      {
        product_name: "SuccessFactors",
        product_category: "HR",
        description:
          "Human capital management for talent acquisition, performance management, and employee development.",
        confidence_score: 86,
        reasoning:
          "Tech companies require advanced HR capabilities for talent management, performance tracking, and employee engagement.",
      },
      {
        product_name: "Commerce Cloud",
        product_category: "E-commerce",
        description: "E-commerce platform for digital commerce, customer experience, and online business operations.",
        confidence_score: 83,
        reasoning:
          "Technology companies often need robust e-commerce capabilities for digital product sales and customer engagement.",
      },
    ],
    Retail: [
      {
        product_name: "S/4HANA for Retail",
        product_category: "Industry ERP",
        description:
          "Retail-specific ERP solution for inventory management, merchandising, and omnichannel operations.",
        confidence_score: 94,
        reasoning:
          "Designed specifically for retail operations with inventory optimization, merchandising, and customer experience features.",
      },
      {
        product_name: "Commerce Cloud",
        product_category: "E-commerce",
        description:
          "Comprehensive e-commerce platform for online sales, customer experience, and digital transformation.",
        confidence_score: 91,
        reasoning:
          "Essential for retail companies to manage omnichannel commerce, online sales, and customer digital experiences.",
      },
      {
        product_name: "Customer Experience",
        product_category: "CRM",
        description: "Customer relationship management for retail sales, service, and marketing across all channels.",
        confidence_score: 87,
        reasoning:
          "Critical for retail customer management, personalization, and cross-channel customer service delivery.",
      },
    ],
  }

  const modules = industryModules[industry] || industryModules["Technology"]

  return {
    modules: modules.slice(0, 4), // Return top 4 modules
    summary: `Recommended SAP modules for ${industry} industry focusing on core business processes, industry-specific requirements, and scalability for ${size} organizations.`,
  }
}
