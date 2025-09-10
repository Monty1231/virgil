import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import sql from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.isActive || session?.user?.id === "0") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Deals by stage (count and total value)
    const { rows: dealsByStage } = await sql.query(
      `
      WITH normalized AS (
        SELECT 
          INITCAP(regexp_replace(lower(stage), '[-_]+', ' ', 'g')) AS stage,
          deal_value
        FROM deals
        WHERE ae_assigned = $1
      )
      SELECT 
        stage,
        COUNT(*)::int AS count,
        COALESCE(SUM(deal_value), 0)::float AS total_value
      FROM normalized
      GROUP BY stage
      ORDER BY count DESC
      `,
      [userId]
    );

    // Pipeline by month
    const { rows: pipelineByMonth } = await sql.query(
      `
      WITH dated AS (
        SELECT 
          COALESCE(expected_close_date, created_at::date) AS date_for_bucket,
          deal_value
        FROM deals
        WHERE ae_assigned = $1
      )
      SELECT 
        to_char(date_trunc('month', date_for_bucket), 'YYYY-MM') AS month,
        COUNT(*)::int AS count,
        COALESCE(SUM(deal_value), 0)::float AS total_value
      FROM dated
      GROUP BY month
      ORDER BY month
      `,
      [userId]
    );

    // Top industries by pipeline value
    const { rows: topIndustries } = await sql.query(
      `
      SELECT 
        COALESCE(c.industry, 'Unknown') AS industry,
        COALESCE(SUM(d.deal_value), 0)::float AS total_value
      FROM deals d
      LEFT JOIN companies c ON d.company_id = c.id
      WHERE d.ae_assigned = $1
      GROUP BY COALESCE(c.industry, 'Unknown')
      ORDER BY total_value DESC
      LIMIT 6
      `,
      [userId]
    );

    // Win metrics (win rate, avg deal size)
    const { rows: winRows } = await sql.query(
      `
      WITH normalized AS (
        SELECT 
          INITCAP(regexp_replace(lower(stage), '[-_]+', ' ', 'g')) AS stage,
          deal_value
        FROM deals
        WHERE ae_assigned = $1
      )
      SELECT 
        SUM(CASE WHEN stage = 'Closed Won' THEN 1 ELSE 0 END)::int AS won,
        SUM(CASE WHEN stage = 'Closed Lost' THEN 1 ELSE 0 END)::int AS lost,
        AVG(CASE WHEN stage = 'Closed Won' THEN deal_value END)::float AS avg_won_value
      FROM normalized
      `,
      [userId]
    );

    const won = Number(winRows?.[0]?.won || 0);
    const lost = Number(winRows?.[0]?.lost || 0);
    const totalClosed = won + lost;
    const winRate = totalClosed > 0 ? Math.round((won / totalClosed) * 100) : 0;
    const avgDealSize = Number(winRows?.[0]?.avg_won_value || 0);

    // Product-level analytics from AI analyses (dedup per company)
    const { rows: topRecommendedProducts } = await sql.query(
      `
      WITH recs AS (
        SELECT 
          a.company_id,
          (rec->>'module') AS module,
          NULLIF(rec->>'module', '') IS NOT NULL AS has_module,
          NULLIF(rec->>'fitScore', '')::numeric AS fit
        FROM ai_analyses a
        JOIN companies c ON c.id = a.company_id
        CROSS JOIN LATERAL jsonb_array_elements(
          CASE 
            WHEN jsonb_typeof(a.analysis_results->'recommendedSolutions') = 'array' 
              THEN a.analysis_results->'recommendedSolutions' 
            ELSE '[]'::jsonb 
          END
        ) AS rec
        WHERE c.created_by = $1
      ),
      company_module AS (
        SELECT company_id, module, MAX(COALESCE(fit, 0)) AS fit
        FROM recs
        WHERE has_module AND module IS NOT NULL AND module <> ''
        GROUP BY company_id, module
      )
      SELECT module,
             COUNT(*)::int AS companies_recommended,
             ROUND(AVG(fit)::numeric, 2)::float AS avg_fit_score
      FROM company_module
      GROUP BY module
      ORDER BY companies_recommended DESC, avg_fit_score DESC
      LIMIT 10
      `,
      [userId]
    );

    const { rows: recommendationsByIndustry } = await sql.query(
      `
      WITH recs AS (
        SELECT 
          a.company_id,
          COALESCE(c.industry, 'Unknown') AS industry,
          (rec->>'module') AS module
        FROM ai_analyses a
        JOIN companies c ON c.id = a.company_id
        CROSS JOIN LATERAL jsonb_array_elements(
          CASE 
            WHEN jsonb_typeof(a.analysis_results->'recommendedSolutions') = 'array' 
              THEN a.analysis_results->'recommendedSolutions' 
            ELSE '[]'::jsonb 
          END
        ) AS rec
        WHERE c.created_by = $1 AND (rec->>'module') IS NOT NULL AND (rec->>'module') <> ''
      ),
      company_industry_module AS (
        SELECT DISTINCT company_id, industry, module
        FROM recs
      )
      SELECT industry, module, COUNT(*)::int AS count
      FROM company_industry_module
      GROUP BY industry, module
      ORDER BY count DESC
      LIMIT 30
      `,
      [userId]
    );

    const { rows: recommendationTrends } = await sql.query(
      `
      WITH recs AS (
        SELECT 
          a.company_id,
          to_char(date_trunc('week', a.created_at), 'YYYY-MM-DD') AS week,
          (rec->>'module') AS module
        FROM ai_analyses a
        JOIN companies c ON c.id = a.company_id
        CROSS JOIN LATERAL jsonb_array_elements(
          CASE 
            WHEN jsonb_typeof(a.analysis_results->'recommendedSolutions') = 'array' 
              THEN a.analysis_results->'recommendedSolutions' 
            ELSE '[]'::jsonb 
          END
        ) AS rec
        WHERE c.created_by = $1 AND (rec->>'module') IS NOT NULL AND (rec->>'module') <> ''
      ),
      company_week_module AS (
        SELECT DISTINCT week, company_id, module
        FROM recs
      )
      SELECT week, module, COUNT(*)::int AS count
      FROM company_week_module
      GROUP BY week, module
      ORDER BY week ASC
      `,
      [userId]
    );

    const { rows: latestAnalyses } = await sql.query(
      `
      SELECT 
        a.id,
        a.created_at,
        c.name AS company_name,
        ARRAY(
          SELECT rec->>'module'
          FROM jsonb_array_elements(
            CASE 
              WHEN jsonb_typeof(a.analysis_results->'recommendedSolutions') = 'array' 
                THEN a.analysis_results->'recommendedSolutions' 
              ELSE '[]'::jsonb 
            END
          ) AS rec
          LIMIT 5
        ) AS modules
      FROM ai_analyses a
      JOIN companies c ON c.id = a.company_id
      WHERE c.created_by = $1
      ORDER BY a.created_at DESC
      LIMIT 10
      `,
      [userId]
    );

    // Weekly analyses trend
    const { rows: analysesByWeek } = await sql.query(
      `
      SELECT to_char(date_trunc('week', a.created_at), 'YYYY-MM-DD') AS week,
             COUNT(*)::int AS analyses
      FROM ai_analyses a
      JOIN companies c ON c.id = a.company_id
      WHERE c.created_by = $1
      GROUP BY week
      ORDER BY week ASC
      `,
      [userId]
    );

    // Fit score distribution (5 buckets)
    const { rows: fitScoreBuckets } = await sql.query(
      `
      WITH scores AS (
        SELECT NULLIF(rec->>'fitScore','')::numeric AS fit
        FROM ai_analyses a
        JOIN companies c ON c.id = a.company_id
        CROSS JOIN LATERAL jsonb_array_elements(
          CASE 
            WHEN jsonb_typeof(a.analysis_results->'recommendedSolutions') = 'array' 
              THEN a.analysis_results->'recommendedSolutions' 
            ELSE '[]'::jsonb 
          END
        ) AS rec
        WHERE c.created_by = $1 AND NULLIF(rec->>'fitScore','') IS NOT NULL
      )
      SELECT width_bucket(fit, 0, 100, 5) AS bucket, COUNT(*)::int AS count
      FROM scores
      GROUP BY bucket
      ORDER BY bucket
      `,
      [userId]
    );

    // Fit score distribution (20 buckets)
    const { rows: fitScoreBuckets20 } = await sql.query(
      `
      WITH scores AS (
        SELECT NULLIF(rec->>'fitScore','')::numeric AS fit
        FROM ai_analyses a
        JOIN companies c ON c.id = a.company_id
        CROSS JOIN LATERAL jsonb_array_elements(
          CASE 
            WHEN jsonb_typeof(a.analysis_results->'recommendedSolutions') = 'array' 
              THEN a.analysis_results->'recommendedSolutions' 
            ELSE '[]'::jsonb 
          END
        ) AS rec
        WHERE c.created_by = $1 AND NULLIF(rec->>'fitScore','') IS NOT NULL
      )
      SELECT width_bucket(fit, 0, 100, 20) AS bucket, COUNT(*)::int AS count
      FROM scores
      GROUP BY bucket
      ORDER BY bucket
      `,
      [userId]
    );

    // Module co-occurrence across companies
    const { rows: moduleCooccurrence } = await sql.query(
      `
      WITH company_modules AS (
        SELECT a.company_id,
               ARRAY_AGG(DISTINCT rec->>'module') FILTER (WHERE (rec->>'module') IS NOT NULL AND rec->>'module' <> '') AS modules
        FROM ai_analyses a
        JOIN companies c ON c.id = a.company_id
        CROSS JOIN LATERAL jsonb_array_elements(
          CASE 
            WHEN jsonb_typeof(a.analysis_results->'recommendedSolutions') = 'array' 
              THEN a.analysis_results->'recommendedSolutions' 
            ELSE '[]'::jsonb 
          END
        ) AS rec
        WHERE c.created_by = $1
        GROUP BY a.company_id
      ),
      pairs AS (
        SELECT LEAST(m1, m2) AS module_a, GREATEST(m1, m2) AS module_b
        FROM company_modules,
             LATERAL UNNEST(modules) m1,
             LATERAL UNNEST(modules) m2
        WHERE m1 < m2
      )
      SELECT module_a, module_b, COUNT(*)::int AS count
      FROM pairs
      GROUP BY module_a, module_b
      ORDER BY count DESC
      LIMIT 15
      `,
      [userId]
    );

    // Per-module fit statistics (avg and quartiles, dedup per company)
    const { rows: fitByModuleStats } = await sql.query(
      `
      WITH recs AS (
        SELECT a.company_id, (rec->>'module') AS module, NULLIF(rec->>'fitScore','')::numeric AS fit
        FROM ai_analyses a
        JOIN companies c ON c.id = a.company_id
        CROSS JOIN LATERAL jsonb_array_elements(
          CASE 
            WHEN jsonb_typeof(a.analysis_results->'recommendedSolutions') = 'array' 
              THEN a.analysis_results->'recommendedSolutions' 
            ELSE '[]'::jsonb 
          END
        ) AS rec
        WHERE c.created_by = $1 AND (rec->>'module') IS NOT NULL AND (rec->>'module') <> '' AND NULLIF(rec->>'fitScore','') IS NOT NULL
      ),
      company_module AS (
        SELECT company_id, module, MAX(fit) AS fit
        FROM recs
        GROUP BY company_id, module
      )
      SELECT module,
             COUNT(*)::int AS companies,
             ROUND(AVG(fit)::numeric, 2)::float AS avg_fit,
             ROUND(percentile_cont(0.25) WITHIN GROUP (ORDER BY fit)::numeric, 2)::float AS p25,
             ROUND(percentile_cont(0.50) WITHIN GROUP (ORDER BY fit)::numeric, 2)::float AS p50,
             ROUND(percentile_cont(0.75) WITHIN GROUP (ORDER BY fit)::numeric, 2)::float AS p75
      FROM company_module
      GROUP BY module
      ORDER BY companies DESC, avg_fit DESC
      LIMIT 15
      `,
      [userId]
    );

    // Per-module histograms for top modules (10 buckets)
    const { rows: fitBucketsByModule } = await sql.query(
      `
      WITH recs AS (
        SELECT a.company_id, (rec->>'module') AS module, NULLIF(rec->>'fitScore','')::numeric AS fit
        FROM ai_analyses a
        JOIN companies c ON c.id = a.company_id
        CROSS JOIN LATERAL jsonb_array_elements(
          CASE 
            WHEN jsonb_typeof(a.analysis_results->'recommendedSolutions') = 'array' 
              THEN a.analysis_results->'recommendedSolutions' 
            ELSE '[]'::jsonb 
          END
        ) AS rec
        WHERE c.created_by = $1 AND (rec->>'module') IS NOT NULL AND (rec->>'module') <> '' AND NULLIF(rec->>'fitScore','') IS NOT NULL
      ),
      company_module AS (
        SELECT company_id, module, MAX(fit) AS fit
        FROM recs
        GROUP BY company_id, module
      ),
      top_modules AS (
        SELECT module, COUNT(*) AS companies
        FROM company_module
        GROUP BY module
        ORDER BY companies DESC
        LIMIT 5
      )
      SELECT cm.module,
             width_bucket(cm.fit, 0, 100, 10) AS bucket,
             COUNT(*)::int AS count
      FROM company_module cm
      JOIN top_modules t ON t.module = cm.module
      GROUP BY cm.module, bucket
      ORDER BY cm.module, bucket
      `,
      [userId]
    );

    // Company summaries and completeness
    const { rows: companySummaries } = await sql.query(
      `
      SELECT 
        c.id,
        c.name,
        COALESCE(c.industry, 'Unknown') AS industry,
        COALESCE(c.company_size, 'Unknown') AS company_size,
        COALESCE(c.region, 'Unknown') AS region,
        (SELECT COUNT(*) FROM ai_analyses a WHERE a.company_id = c.id)::int AS analyses_count,
        (SELECT MAX(a.created_at) FROM ai_analyses a WHERE a.company_id = c.id) AS last_analyzed_at,
        (SELECT COUNT(*) FROM company_files f WHERE f.company_id = c.id AND f.content_extracted = true)::int AS files_count,
        (SELECT COUNT(*) FROM deals d WHERE d.company_id = c.id)::int AS deals_count,
        (CASE WHEN c.business_challenges IS NOT NULL AND length(trim(c.business_challenges)) > 0 THEN true ELSE false END) AS has_challenges,
        (CASE WHEN c.current_systems IS NOT NULL AND length(trim(c.current_systems)) > 0 THEN true ELSE false END) AS has_current_systems
      FROM companies c
      WHERE c.created_by = $1
      ORDER BY analyses_count DESC, c.name ASC
      `,
      [userId]
    );

    const { rows: completenessAgg } = await sql.query(
      `
      SELECT 
        COUNT(*)::int AS companies_total,
        SUM(CASE WHEN EXISTS(SELECT 1 FROM ai_analyses a WHERE a.company_id = c.id) THEN 1 ELSE 0 END)::int AS companies_with_analyses,
        SUM(CASE WHEN EXISTS(SELECT 1 FROM company_files f WHERE f.company_id = c.id AND f.content_extracted = true) THEN 1 ELSE 0 END)::int AS companies_with_files,
        SUM(CASE WHEN EXISTS(SELECT 1 FROM deals d WHERE d.company_id = c.id) THEN 1 ELSE 0 END)::int AS companies_with_deals,
        AVG((SELECT COUNT(*) FROM company_files f WHERE f.company_id = c.id AND f.content_extracted = true))::float AS avg_files_per_company,
        AVG((SELECT COUNT(*) FROM deals d WHERE d.company_id = c.id))::float AS avg_deals_per_company,
        AVG((SELECT COUNT(*) FROM ai_analyses a WHERE a.company_id = c.id))::float AS avg_analyses_per_company
      FROM companies c
      WHERE c.created_by = $1
      `,
      [userId]
    );

    return NextResponse.json({
      dealsByStage,
      pipelineByMonth,
      topIndustries,
      winMetrics: {
        winRate,
        dealsClosedWon: won,
        dealsClosedLost: lost,
        avgDealSize,
      },
      productAnalytics: {
        topRecommendedProducts,
        recommendationsByIndustry,
        recommendationTrends,
        latestAnalyses,
        moduleCooccurrence,
        fitByModuleStats,
        fitBucketsByModule,
      },
      trends: {
        analysesByWeek,
        fitScoreBuckets,
        fitScoreBuckets20,
      },
      companies: {
        summaries: companySummaries,
        completeness: completenessAgg?.[0] || null,
      },
    });
  } catch (error) {
    console.error("/api/analytics error:", error);
    return NextResponse.json(
      {
        error: "Failed to load analytics",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
