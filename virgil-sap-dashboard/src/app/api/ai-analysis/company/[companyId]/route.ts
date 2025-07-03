import { NextResponse } from 'next/server'
import sql from '@/lib/db'
import { openai } from '@ai-sdk/openai'
import { generateObject } from 'ai'
import { z } from 'zod'

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

export async function GET(
  request: Request,
  { params }: { params: { companyId: string } }
) {
  // Validate environment variables
  const { DB_HOST, DB_NAME, DB_USER, DB_PASSWORD, OPENAI_API_KEY } = process.env
  if (!DB_HOST || !DB_NAME || !DB_USER || !DB_PASSWORD) {
    return NextResponse.json(
      {
        error: 'Database not configured',
        details: 'Set DB_HOST, DB_NAME, DB_USER & DB_PASSWORD in .env.local',
      },
      { status: 500 }
    )
  }
  if (!OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
  }

  // Parse companyId
  const companyId = Number(params.companyId)
  if (isNaN(companyId)) {
    return NextResponse.json({ error: 'Invalid company ID' }, { status: 400 })
  }

  // Fetch company from database
  let company
  try {
    const { rows } = await sql.query(
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
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }
    company = rows[0]
  } catch (dbError) {
    return NextResponse.json(
      {
        error: 'Database query failed',
        details: dbError instanceof Error ? dbError.message : 'Unknown database error',
      },
      { status: 500 }
    )
  }

  // Build AI prompt
  const analysisPrompt = `
You are an expert SAP sales consultant analyzing a potential customer for SAP solutions.

Company Details:
- Name: ${company.name}
- Industry: ${company.industry}
- Size: ${company.company_size}
- Region: ${company.region}
- Annual Revenue: ${company.annual_revenue ? `$${company.annual_revenue.toLocaleString()}` : 'Not specified'}
- Employee Count: ${company.employee_count || 'Not specified'}
- Business Challenges: ${company.business_challenges || 'Not specified'}
- Current Systems: ${company.current_systems || 'Legacy systems (assumed)'}

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

Adjust based on company size and complexity.
`

  // Generate AI analysis
  let result
  try {
    result = await generateObject({
      model: openai('gpt-4o'),
      prompt: analysisPrompt,
      schema: analysisSchema,
    })
  } catch (aiError) {
    const msg = aiError instanceof Error ? aiError.message : 'Unknown AI error'
    const status = msg.includes('401') || msg.includes('API key') ? 500 : msg.includes('429') ? 500 : 500
    return NextResponse.json({ error: 'AI generation failed', details: msg }, { status })
  }

  // (Optional) Save analysis to DB
  try {
    await sql.query(
      `
      INSERT INTO ai_analyses (
        company_id,
        analysis_type,
        input_data,
        analysis_results,
        confidence_score,
        generated_by,
        model_version
      ) VALUES ($1,$2,$3,$4,$5,$6,$7)
      `,
      [
        company.id,
        'comprehensive_fit_assessment',
        JSON.stringify({ company: company.name, industry: company.industry, size: company.company_size, region: company.region }),
        JSON.stringify(result.object),
        result.object.fitScore,
        1,
        'gpt-4o',
      ]
    )
  } catch {
    // Ignore save errors
  }

  // Return response
  return NextResponse.json({ company, analysis: result.object, generatedAt: new Date().toISOString() })
}
