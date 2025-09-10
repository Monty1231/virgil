import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { z } from "zod";
import { DiscoveryAnswers, DiscoveryResult, RecommendationItem, RoiSummary } from "@/types/discovery";

const DiscoverySchema = z.object({
  industry: z.string().min(1),
  pains: z.array(z.string()).min(1),
  currentSystems: z.array(z.string()).optional(),
  budgetRange: z.string().optional(),
  timelineMonths: z.number().int().positive().optional(),
  region: z.string().optional(),
  companySize: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) return NextResponse.json({ error: "Deal ID required" }, { status: 400 });

    const json = await request.json();
    const parsed = DiscoverySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.format() }, { status: 400 });
    }
    const answers: DiscoveryAnswers = parsed.data;

    // 1) Fetch SAP products (optionally filter by industry)
    const productQuery = answers.industry
      ? sql.query(
          `SELECT id, product_name, description, category, target_industries, key_features
           FROM sap_products WHERE $1 = ANY(target_industries) ORDER BY product_name`,
          [answers.industry]
        )
      : sql.query(
          `SELECT id, product_name, description, category, target_industries, key_features
           FROM sap_products ORDER BY product_name`
        );
    const { rows: products } = await productQuery;

    // 2) Very simple heuristic recommender: match pains to key_features words
    const normalizedPains = new Set(answers.pains.map((p) => p.toLowerCase()));
    const recommendations: RecommendationItem[] = products
      .map((p: any) => {
        const features: string[] = Array.isArray(p.key_features) ? p.key_features : [];
        const hits = features.reduce((acc, f) => {
          const tokens = String(f).toLowerCase().split(/[^a-z0-9]+/g);
          const score = tokens.some((t) => normalizedPains.has(t)) ? 1 : 0;
          return acc + score;
        }, 0);
        const fit = Math.min(100, Math.round((hits / Math.max(1, features.length)) * 100));
        return {
          productId: p.id,
          productName: p.product_name,
          description: p.description ?? undefined,
          category: p.category ?? undefined,
          fitScore: fit,
          implementationMonths: 3 + Math.floor(Math.random() * 6),
          businessBenefits: features.slice(0, 5),
        } satisfies RecommendationItem;
      })
      .filter((r) => r.fitScore >= 30)
      .sort((a, b) => b.fitScore - a.fitScore)
      .slice(0, 8);

    // 3) Compute quick ROI summary (toy model)
    const avgFit = recommendations.length
      ? Math.round(recommendations.reduce((s, r) => s + r.fitScore, 0) / recommendations.length)
      : 0;
    const roi: RoiSummary = {
      estimatedBenefitUsd: avgFit * 10000,
      estimatedCostUsd: 50000 + recommendations.length * 10000,
      roiPercentage: Math.round(((avgFit * 10000) / Math.max(1, 50000 + recommendations.length * 10000)) * 100),
      paybackMonths: recommendations.length ? Math.max(3, 12 - Math.floor(avgFit / 10)) : undefined,
      assumptions: [
        "Benefits scale with fit score and number of matched capabilities",
        "Costs approximate licenses and services for a mid-market deployment",
      ],
    };

    // 4) Persist AI analysis summary
    await sql.query(
      `INSERT INTO ai_analyses (company_id, analysis_type, input_data, analysis_results) 
       SELECT d.company_id, $1, $2::jsonb, $3::jsonb FROM deals d WHERE d.id = $4` ,
      [
        "discovery_recommendations",
        JSON.stringify(answers),
        JSON.stringify({ recommendations, roi } satisfies DiscoveryResult),
        id,
      ]
    );

    // 5) Upsert deal_products for top recommendations
    for (const rec of recommendations) {
      await sql.query(
        `INSERT INTO deal_products (deal_id, product_id, estimated_value, fit_score, implementation_months, business_benefits)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (deal_id, product_id) DO UPDATE SET 
           estimated_value = EXCLUDED.estimated_value,
           fit_score = EXCLUDED.fit_score,
           implementation_months = EXCLUDED.implementation_months,
           business_benefits = EXCLUDED.business_benefits`,
        [id, rec.productId, Math.round((rec.fitScore / 100) * 100000), rec.fitScore, rec.implementationMonths ?? 6, rec.businessBenefits ?? []]
      );
    }

    return NextResponse.json({ recommendations, roi } satisfies DiscoveryResult);
  } catch (error) {
    console.error("Analyze deal error:", error);
    return NextResponse.json({ error: "Failed to analyze deal" }, { status: 500 });
  }
} 