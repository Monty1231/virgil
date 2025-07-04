import { NextResponse } from "next/server"
import { openai } from "@ai-sdk/openai"
import { generateObject } from "ai"
import { z } from "zod"

// Define the schema for AI analysis response
const analysisSchema = z.object({
  fitScore: z.number().min(0).max(100).describe("Overall SAP fit score as a percentage"),
  overallFit: z.enum(["Low", "Medium", "High", "Excellent"]).describe("Overall fit rating"),
  keySuccessFactors: z.array(z.string()).describe("Key factors that make this company a good fit for SAP"),
  businessChallenges: z.array(z.string()).describe("Main business challenges this company likely faces"),
  recommendedSolutions: z.array(
    z.object({
      module: z.string().describe("SAP module name (e.g., S/4HANA, Ariba, SuccessFactors)"),
      fit: z.enum(["Low", "Medium", "High", "Excellent"]).describe("How well this module fits the company"),
      priority: z.number().min(1).max(5).describe("Implementation priority (1=highest, 5=lowest)"),
      estimatedROI: z.number().min(100).max(500).describe("Estimated ROI percentage"),
      timeToValue: z.string().describe("Time to see value (e.g., '6-9 months')"),
      estimatedCostMin: z.number().describe("Minimum estimated cost in USD"),
      estimatedCostMax: z.number().describe("Maximum estimated cost in USD"),
      keyBenefits: z.array(z.string()).describe("Key business benefits of this solution"),
      implementationComplexity: z.enum(["Low", "Medium", "High"]).describe("Implementation complexity"),
    }),
  ),
  nextSteps: z.array(z.string()).describe("Recommended next steps for this prospect"),
  riskFactors: z.array(z.string()).describe("Potential risks or challenges for implementation"),
})

export async function GET(request: Request, context: { params: Promise<{ companyId: string }> }) {
  try {
    // Await params for Next.js 15 compatibility
    const params = await context.params
    console.log("🤖 AI Analysis: Route called with params:", params)

    const companyId = Number.parseInt(params.companyId)

    if (isNaN(companyId)) {
      console.error("🤖 AI Analysis: Invalid company ID:", params.companyId)
      return NextResponse.json({ error: "Invalid company ID" }, { status: 400 })
    }

    console.log("🤖 AI Analysis: Starting analysis for company ID:", companyId)

    // Check environment variables
    const { DB_HOST, DB_NAME, DB_USER, DB_PASSWORD, OPENAI_API_KEY, DATABASE_URL } = process.env

    // Support both database configurations
    const hasCustomDB = DB_HOST && DB_NAME && DB_USER && DB_PASSWORD
    const hasNeonDB = DATABASE_URL

    if (!hasCustomDB && !hasNeonDB) {
      console.error("🤖 AI Analysis: No database configuration found")
      return NextResponse.json(
        {
          error: "Database not configured",
          details: "Set either DATABASE_URL or (DB_HOST, DB_NAME, DB_USER, DB_PASSWORD) in .env.local",
        },
        { status: 500 },
      )
    }

    if (!OPENAI_API_KEY) {
      console.error("🤖 AI Analysis: OPENAI_API_KEY not found in environment")
      return NextResponse.json(
        {
          error: "OpenAI API key not configured",
          details: "Please set OPENAI_API_KEY environment variable in .env.local",
        },
        { status: 500 },
      )
    }

    console.log("🤖 AI Analysis: Environment variables OK")

    // Get company details from database
    let company
    try {
      console.log("🤖 AI Analysis: Querying database for company...")

      if (hasCustomDB) {
        // Use your custom database setup
        const { Pool } = require("pg")
        const pool = new Pool({
          host: DB_HOST,
          database: DB_NAME,
          user: DB_USER,
          password: DB_PASSWORD,
          port: process.env.DB_PORT || 5432,
          ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
        })

        const result = await pool.query(
          `
          SELECT 
            id,
            name,
            industry,
            company_size,
            region,
            annual_revenue,
            employee_count,
            business_challenges,
            current_systems
          FROM companies 
          WHERE id = $1
          `,
          [companyId],
        )

        if (result.rows.length === 0) {
          console.error("🤖 AI Analysis: Company not found with ID:", companyId)
          return NextResponse.json({ error: "Company not found" }, { status: 404 })
        }

        company = result.rows[0]
        await pool.end()
      } else {
        // Use Neon database setup (fallback to existing code)
        const sql = (await import("@/lib/db")).default
        const result = await sql.query(
          `
          SELECT 
            id,
            name,
            industry,
            company_size,
            region,
            annual_revenue,
            employee_count,
            business_challenges,
            current_systems
          FROM companies 
          WHERE id = $1
          `,
          [companyId]
        )

        if (result.rows.length === 0) {
          console.error("🤖 AI Analysis: Company not found with ID:", companyId)
          return NextResponse.json({ error: "Company not found" }, { status: 404 })
        }

        company = result.rows[0]
      }

      console.log("🤖 AI Analysis: Database query result:", company?.name || "No company found")
    } catch (dbError) {
      console.error("🤖 AI Analysis: Database error:", dbError)
      return NextResponse.json(
        {
          error: "Database query failed",
          details: dbError instanceof Error ? dbError.message : "Unknown database error",
        },
        { status: 500 },
      )
    }

    const companyData = company
    console.log("🤖 AI Analysis: Company data loaded:", companyData.name, companyData.industry)

    // Create a comprehensive prompt for OpenAI
    const analysisPrompt = `
You are an expert SAP sales consultant analyzing a potential customer for SAP solutions. 

Company Details:
- Name: ${companyData.name}
- Industry: ${companyData.industry}
- Size: ${companyData.company_size}
- Region: ${companyData.region}
- Annual Revenue: ${companyData.annual_revenue ? `$${companyData.annual_revenue.toLocaleString()}` : "Not specified"}
- Employee Count: ${companyData.employee_count || "Not specified"}
- Business Challenges: ${companyData.business_challenges || "Not specified"}
- Current Systems: ${companyData.current_systems || "Legacy systems (assumed)"}

Based on this company profile, provide a comprehensive SAP fit analysis including:

1. Overall fit score (0-100%) considering industry, size, complexity, and digital maturity
2. Key success factors that make them a good SAP candidate
3. Main business challenges they likely face
4. Recommended SAP solutions with detailed analysis
5. Implementation risks and mitigation strategies
6. Next steps for the sales process

Focus on realistic, industry-appropriate recommendations. Consider company size for solution complexity and cost estimates.

For cost estimates, use these general ranges:
- S/4HANA: $500K-$3M+ depending on company size
- Ariba: $100K-$800K
- SuccessFactors: $50K-$500K
- Concur: $25K-$200K
- Analytics Cloud: $75K-$600K
- Commerce Cloud: $200K-$1M

Adjust based on company size and complexity. Provide 2-4 solution recommendations prioritized by fit and business impact.
`

    console.log("🤖 AI Analysis: Generating analysis with OpenAI...")
    console.log("🤖 AI Analysis: Prompt length:", analysisPrompt.length, "characters")

    // Generate AI analysis using OpenAI
    let result
    try {
      result = await generateObject({
        model: openai("gpt-4o"),
        prompt: analysisPrompt,
        schema: analysisSchema,
      })
      console.log("🤖 AI Analysis: OpenAI generation successful")
    } catch (aiError) {
      console.error("🤖 AI Analysis: OpenAI generation error:", aiError)

      // Check if it's an API key issue
      if (
        aiError instanceof Error &&
        (aiError.message.includes("401") || aiError.message.includes("API key"))
      ) {
        return NextResponse.json(
          {
            error: "Invalid OpenAI API key",
            details: "Please check your OPENAI_API_KEY in .env.local",
          },
          { status: 500 },
        )
      }

      // Check if it's a quota/billing issue
      if (
        aiError instanceof Error &&
        (aiError.message.includes("429") || aiError.message.includes("quota"))
      ) {
        return NextResponse.json(
          {
            error: "OpenAI API quota exceeded",
            details: "Please check your OpenAI billing and usage limits",
          },
          { status: 500 },
        )
      }

      return NextResponse.json(
        {
          error: "AI generation failed",
          details: aiError instanceof Error ? aiError.message : "Unknown AI error",
        },
        { status: 500 },
      )
    }

    console.log("🤖 AI Analysis: Generated analysis for", companyData.name)
    console.log("🤖 AI Analysis: Fit score:", result.object.fitScore)
    console.log("🤖 AI Analysis: Solutions count:", result.object.recommendedSolutions.length)

    // Store the analysis in the database for future reference
    try {
      if (hasCustomDB) {
        // Use your custom database setup for saving
        const { Pool } = require("pg")
        const pool = new Pool({
          host: DB_HOST,
          database: DB_NAME,
          user: DB_USER,
          password: DB_PASSWORD,
          port: process.env.DB_PORT || 5432,
          ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
        })

        await pool.query(
          `
          INSERT INTO ai_analyses (
            company_id, 
            analysis_results, 
            confidence_score,
            created_at
          ) VALUES ($1, $2, $3, $4)
          `,
          [companyId, JSON.stringify(result.object), result.object.fitScore, new Date()],
        )

        await pool.end()
      } else {
        // Use Neon database setup
        const sql = (await import("@/lib/db")).default
        await sql.query(
          `
          INSERT INTO ai_analyses (
            company_id, 
            analysis_results, 
            confidence_score,
            created_at
          )
          VALUES ($1, $2, $3, $4)
          `,
          [companyId, JSON.stringify(result.object), result.object.fitScore, new Date()]
        )
      }

      console.log("🤖 AI Analysis: Saved to database successfully")
    } catch (dbError) {
      console.error("🤖 AI Analysis: Failed to save to database:", dbError)
      // Continue anyway - don't fail the request if we can't save
    }

    const response = {
      company: companyData,
      analysis: result.object,
      generatedAt: new Date().toISOString(),
    }

    console.log("🤖 AI Analysis: Returning successful response")
    return NextResponse.json(response)
  } catch (error) {
    console.error("🤖 AI Analysis: Unexpected error:", error)
    console.error("🤖 AI Analysis: Error stack:", error instanceof Error ? error.stack : "No stack trace")

    return NextResponse.json(
      {
        error: "Failed to generate AI analysis",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
