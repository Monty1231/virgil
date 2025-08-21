"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DealsByStage {
  stage: string;
  count: number;
  total_value: number;
}
interface PipelineByMonth {
  month: string;
  count: number;
  total_value: number;
}
interface TopIndustry {
  industry: string;
  total_value: number;
}
interface WinMetrics {
  winRate: number;
  dealsClosedWon: number;
  dealsClosedLost: number;
  avgDealSize: number;
}

interface ProductRow {
  module: string;
  companies_recommended: number;
  avg_fit_score: number;
}
interface ByIndustryRow {
  industry: string;
  module: string;
  count: number;
}
interface TrendRow {
  week: string;
  module: string;
  count: number;
}
interface LatestAnalysisRow {
  id: number;
  created_at: string;
  company_name: string;
  modules: string[];
}

interface AnalysesByWeekRow {
  week: string;
  analyses: number;
}
interface FitScoreBucketRow {
  bucket: number;
  count: number;
}
interface CooccurrenceRow {
  module_a: string;
  module_b: string;
  count: number;
}

interface FitByModuleRow {
  module: string;
  companies: number;
  avg_fit: number;
  p25: number;
  p50: number;
  p75: number;
}
interface FitBucketsByModuleRow {
  module: string;
  bucket: number;
  count: number;
}

interface CompanySummaryRow {
  id: number;
  name: string;
  industry: string;
  company_size: string;
  region: string;
  analyses_count: number;
  last_analyzed_at: string | null;
  files_count: number;
  deals_count: number;
  has_challenges: boolean;
  has_current_systems: boolean;
}

interface CompaniesCompleteness {
  companies_total: number;
  companies_with_analyses: number;
  companies_with_files: number;
  companies_with_deals: number;
  avg_files_per_company: number;
  avg_deals_per_company: number;
  avg_analyses_per_company: number;
}

interface AnalyticsData {
  dealsByStage: DealsByStage[];
  pipelineByMonth: PipelineByMonth[];
  topIndustries: TopIndustry[];
  winMetrics: WinMetrics;
  productAnalytics?: {
    topRecommendedProducts: ProductRow[];
    recommendationsByIndustry: ByIndustryRow[];
    recommendationTrends: TrendRow[];
    latestAnalyses: LatestAnalysisRow[];
    moduleCooccurrence: CooccurrenceRow[];
    fitByModuleStats: FitByModuleRow[];
    fitBucketsByModule: FitBucketsByModuleRow[];
  };
  trends?: {
    analysesByWeek: AnalysesByWeekRow[];
    fitScoreBuckets: FitScoreBucketRow[];
    fitScoreBuckets20: FitScoreBucketRow[];
  };
  companies?: {
    summaries: CompanySummaryRow[];
    completeness: CompaniesCompleteness | null;
  };
}

type TrendSeriesRow = { week: string } & Record<string, number | string>;

const COLORS = [
  "#1f2937",
  "#2563eb",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#f97316",
  "#22c55e",
];

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/analytics", { cache: "no-store" });
        if (!res.ok) {
          const e = await res.json().catch(() => ({}));
          throw new Error(
            e.error || `Failed to fetch analytics (${res.status})`
          );
        }
        const json = (await res.json()) as AnalyticsData;
        if (mounted) setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const trendSeries = useMemo<{
    series: TrendSeriesRow[];
    moduleList: string[];
  }>(() => {
    const trends = data?.productAnalytics?.recommendationTrends || [];
    const byWeek: Record<string, Record<string, number>> = {};
    const modules = new Set<string>();
    trends.forEach((t) => {
      modules.add(t.module);
      byWeek[t.week] = byWeek[t.week] || {};
      byWeek[t.week][t.module] = (byWeek[t.week][t.module] || 0) + t.count;
    });
    const weeks = Object.keys(byWeek).sort();
    const moduleList = Array.from(modules);
    const series: TrendSeriesRow[] = weeks.map((w) => {
      const values = moduleList.reduce<Record<string, number>>((acc, m) => {
        acc[m] = byWeek[w][m] || 0;
        return acc;
      }, {});
      return { week: w, ...values } as TrendSeriesRow;
    });
    return { series, moduleList };
  }, [data?.productAnalytics?.recommendationTrends]);

  const derivedInsights = useMemo(() => {
    const top = data?.productAnalytics?.topRecommendedProducts || [];
    const topModule = top[0]?.module;
    const topCompanies = top[0]?.companies_recommended || 0;
    const fitAvg = top[0]?.avg_fit_score || 0;
    const weekly = data?.trends?.analysesByWeek || [];
    const weeklyGrowth =
      weekly.length >= 2
        ? Math.round(
            ((weekly[weekly.length - 1].analyses -
              weekly[weekly.length - 2].analyses) /
              Math.max(1, weekly[weekly.length - 2].analyses)) *
              100
          )
        : 0;
    return { topModule, topCompanies, fitAvg, weeklyGrowth };
  }, [data]);

  // Ensure hooks order is stable: compute per-module series before any early returns
  const fitBucketsByModuleEarly =
    data?.productAnalytics?.fitBucketsByModule || [];
  const perModuleSeries = useMemo(() => {
    const map: Record<string, { bucketLabel: string; count: number }[]> = {};
    fitBucketsByModuleEarly.forEach((row) => {
      const label = `${(row.bucket - 1) * 10}-${row.bucket * 10}`;
      if (!map[row.module]) map[row.module] = [];
      map[row.module].push({ bucketLabel: label, count: row.count });
    });
    Object.values(map).forEach((arr) =>
      arr.sort((a, b) => parseInt(a.bucketLabel) - parseInt(b.bucketLabel))
    );
    return map;
  }, [fitBucketsByModuleEarly]);

  const getModuleValue = (row: TrendSeriesRow, key: string): number => {
    const value = row[key];
    return typeof value === "number" ? value : 0;
  };

  // Build clearer, stacked weekly trend: last 8 weeks, top 5 modules with non-zero totals
  const stackedTrends = useMemo(() => {
    const series = trendSeries.series || [];
    const modules = trendSeries.moduleList || [];
    if (series.length === 0 || modules.length === 0) {
      return { data: [], modules: [] as string[] };
    }

    // Totals per module
    const totals: Record<string, number> = {};
    modules.forEach((m) => {
      totals[m] = series.reduce((sum, row) => sum + getModuleValue(row, m), 0);
    });

    const topModules = modules
      .filter((m) => (totals[m] || 0) > 0)
      .sort((a, b) => (totals[b] || 0) - (totals[a] || 0))
      .slice(0, 5);

    const chosen = topModules.length > 0 ? topModules : modules.slice(0, 5);

    // Last 8 weeks only
    const lastWeeks = series.slice(Math.max(0, series.length - 8));
    const dataPoints = lastWeeks.map((row) => {
      const out: any = { week: row.week };
      chosen.forEach((m) => {
        out[m] = getModuleValue(row, m);
      });
      return out;
    });

    return { data: dataPoints, modules: chosen };
  }, [trendSeries]);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-80 rounded-lg bg-muted animate-pulse" />
          <div className="h-80 rounded-lg bg-muted animate-pulse" />
        </div>
        <div className="h-96 rounded-lg bg-muted animate-pulse" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const dealsByStage = data?.dealsByStage || [];
  const pipelineByMonth = data?.pipelineByMonth || [];
  const topIndustries = data?.topIndustries || [];
  const win = data?.winMetrics || {
    winRate: 0,
    dealsClosedWon: 0,
    dealsClosedLost: 0,
    avgDealSize: 0,
  };
  const topRecommended = data?.productAnalytics?.topRecommendedProducts || [];
  const recsByIndustry =
    data?.productAnalytics?.recommendationsByIndustry || [];
  const latestAnalyses = data?.productAnalytics?.latestAnalyses || [];
  const cooccurrence = data?.productAnalytics?.moduleCooccurrence || [];
  const analysesByWeek = data?.trends?.analysesByWeek || [];
  const fitBuckets5 = (data?.trends?.fitScoreBuckets || []).map((b) => ({
    bucketLabel: `${(b.bucket - 1) * 20}-${b.bucket * 20}`,
    count: b.count,
  }));
  const fitBuckets20 = (data?.trends?.fitScoreBuckets20 || []).map((b) => ({
    bucketLabel: `${(b.bucket - 1) * 5}-${b.bucket * 5}`,
    count: b.count,
  }));
  const fitByModule = data?.productAnalytics?.fitByModuleStats || [];
  const companySummaries = data?.companies?.summaries || [];
  const completeness = data?.companies?.completeness || null;

  return (
    <div className="p-6 space-y-6">
      {/* Executive insights */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Top SAP Module</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">
              {derivedInsights.topModule || "—"}
            </div>
            <div className="text-xs text-muted-foreground">
              Used by {derivedInsights.topCompanies} companies • Avg fit {""}
              {derivedInsights.fitAvg?.toFixed?.(1) || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              Analyses (Last Week Change)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">
              {analysesByWeek.at(-1)?.analyses ?? 0}
            </div>
            <div className="text-xs text-muted-foreground">
              WoW {derivedInsights.weeklyGrowth}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Win Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{win.winRate}%</div>
            <div className="text-xs text-muted-foreground">
              Won {win.dealsClosedWon} / Lost {win.dealsClosedLost}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Avg Won Deal Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">
              ${Math.round(win.avgDealSize).toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">
              Average for Closed Won
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trend and Fit Distribution */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="h-96">
          <CardHeader>
            <CardTitle>Analyses Over Time (Weekly)</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analysesByWeek}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="analyses"
                  stroke="#2563eb"
                  fill="#93c5fd"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="h-96">
          <CardHeader>
            <CardTitle>Fit Score Distribution (20 bins)</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fitBuckets20}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="bucketLabel" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="h-96">
          <CardHeader>
            <CardTitle>Deals by Stage</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dealsByStage}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="stage"
                  tick={{ fontSize: 12 }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                  height={50}
                />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip
                  formatter={(value: any, name: string) =>
                    name === "total_value"
                      ? [Number(value).toLocaleString(), "Total Value"]
                      : [value, "Count"]
                  }
                />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="count"
                  name="Count"
                  fill="#2563eb"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  yAxisId="right"
                  dataKey="total_value"
                  name="Total Value"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="h-96">
          <CardHeader>
            <CardTitle>Pipeline by Month</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={pipelineByMonth}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1f2937" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#1f2937" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(v: any) =>
                    `$${Math.round(Number(v)).toLocaleString()}`
                  }
                />
                <Area
                  type="monotone"
                  dataKey="total_value"
                  stroke="#1f2937"
                  fillOpacity={1}
                  fill="url(#colorValue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Product Analytics Row */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="h-96">
          <CardHeader>
            <CardTitle>
              Top Recommended SAP Products (Distinct Companies)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topRecommended}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="module"
                  tick={{ fontSize: 12 }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                  height={60}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="companies_recommended"
                  name="# Companies"
                  fill="#2563eb"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="avg_fit_score"
                  name="Avg Fit"
                  fill="#f59e0b"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="h-96">
          <CardHeader>
            <CardTitle>Recommendation Trends (Weekly)</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stackedTrends.data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="week"
                  label={{
                    value: "Week",
                    position: "insideBottom",
                    offset: -5,
                  }}
                />
                <YAxis
                  label={{
                    value: "Companies",
                    angle: -90,
                    position: "insideLeft",
                  }}
                />
                <Tooltip />
                <Legend />
                {stackedTrends.modules.map((m, i) => (
                  <Bar
                    key={m}
                    dataKey={m}
                    stackId="a"
                    fill={COLORS[i % COLORS.length]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Co-occurrence and Industry/Product Cross-Tab */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="h-96">
          <CardHeader>
            <CardTitle>Common Module Pairs (Across Companies)</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <div className="overflow-x-auto h-full">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th className="py-2 pr-4">Module A</th>
                    <th className="py-2 pr-4">Module B</th>
                    <th className="py-2 pr-4"># Companies</th>
                  </tr>
                </thead>
                <tbody>
                  {cooccurrence.slice(0, 15).map((row, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="py-2 pr-4">{row.module_a}</td>
                      <td className="py-2 pr-4">{row.module_b}</td>
                      <td className="py-2 pr-4">{row.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recommendations by Industry</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th className="py-2 pr-4">Industry</th>
                    <th className="py-2 pr-4">Module</th>
                    <th className="py-2 pr-4"># Companies</th>
                  </tr>
                </thead>
                <tbody>
                  {recsByIndustry.slice(0, 12).map((row, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="py-2 pr-4">{row.industry}</td>
                      <td className="py-2 pr-4">{row.module}</td>
                      <td className="py-2 pr-4">{row.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deep Fit Analytics */}
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Fit by Module: Avg and Quartiles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th className="py-2 pr-4">Module</th>
                    <th className="py-2 pr-4"># Companies</th>
                    <th className="py-2 pr-4">Avg Fit</th>
                    <th className="py-2 pr-4">P25</th>
                    <th className="py-2 pr-4">Median</th>
                    <th className="py-2 pr-4">P75</th>
                  </tr>
                </thead>
                <tbody>
                  {fitByModule.slice(0, 15).map((r) => (
                    <tr key={r.module} className="border-t">
                      <td className="py-2 pr-4">{r.module}</td>
                      <td className="py-2 pr-4">{r.companies}</td>
                      <td className="py-2 pr-4">{r.avg_fit.toFixed(1)}</td>
                      <td className="py-2 pr-4">{r.p25.toFixed(1)}</td>
                      <td className="py-2 pr-4">{r.p50.toFixed(1)}</td>
                      <td className="py-2 pr-4">{r.p75.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Per-Module Fit Distributions (Top 5)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              {Object.entries(perModuleSeries).map(([module, series]) => (
                <div key={module} className="h-64">
                  <div className="text-sm font-medium mb-2">{module}</div>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={series}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="bucketLabel" />
                      <YAxis />
                      <Tooltip />
                      <Bar
                        dataKey="count"
                        fill="#6366f1"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Analyses and Company Summaries */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Analyses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2 pr-4">Company</th>
                    <th className="py-2 pr-4">Top Modules</th>
                  </tr>
                </thead>
                <tbody>
                  {latestAnalyses.map((row) => (
                    <tr key={row.id} className="border-t">
                      <td className="py-2 pr-4">
                        {new Date(row.created_at).toLocaleString()}
                      </td>
                      <td className="py-2 pr-4">{row.company_name}</td>
                      <td className="py-2 pr-4">
                        {(row.modules || []).join(", ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Company Coverage & Completeness</CardTitle>
          </CardHeader>
          <CardContent>
            {completeness && (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Companies Tracked</div>
                  <div className="font-semibold">
                    {completeness.companies_total}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">
                    Companies w/ Analyses
                  </div>
                  <div className="font-semibold">
                    {completeness.companies_with_analyses}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">
                    Companies w/ Files
                  </div>
                  <div className="font-semibold">
                    {completeness.companies_with_files}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">
                    Companies w/ Deals
                  </div>
                  <div className="font-semibold">
                    {completeness.companies_with_deals}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">
                    Avg Files / Company
                  </div>
                  <div className="font-semibold">
                    {(completeness.avg_files_per_company ?? 0).toFixed(1)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">
                    Avg Deals / Company
                  </div>
                  <div className="font-semibold">
                    {(completeness.avg_deals_per_company ?? 0).toFixed(1)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">
                    Avg Analyses / Company
                  </div>
                  <div className="font-semibold">
                    {(completeness.avg_analyses_per_company ?? 0).toFixed(1)}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Company Table */}
      <Card>
        <CardHeader>
          <CardTitle>Companies Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="py-2 pr-4">Company</th>
                  <th className="py-2 pr-4">Industry</th>
                  <th className="py-2 pr-4">Size</th>
                  <th className="py-2 pr-4">Region</th>
                  <th className="py-2 pr-4">Analyses</th>
                  <th className="py-2 pr-4">Files</th>
                  <th className="py-2 pr-4">Deals</th>
                  <th className="py-2 pr-4">Has Challenges</th>
                  <th className="py-2 pr-4">Has Current Systems</th>
                  <th className="py-2 pr-4">Last Analyzed</th>
                </tr>
              </thead>
              <tbody>
                {companySummaries.slice(0, 25).map((c) => (
                  <tr key={c.id} className="border-t">
                    <td className="py-2 pr-4">{c.name}</td>
                    <td className="py-2 pr-4">{c.industry}</td>
                    <td className="py-2 pr-4">{c.company_size}</td>
                    <td className="py-2 pr-4">{c.region}</td>
                    <td className="py-2 pr-4">{c.analyses_count}</td>
                    <td className="py-2 pr-4">{c.files_count}</td>
                    <td className="py-2 pr-4">{c.deals_count}</td>
                    <td className="py-2 pr-4">
                      {c.has_challenges ? "Yes" : "No"}
                    </td>
                    <td className="py-2 pr-4">
                      {c.has_current_systems ? "Yes" : "No"}
                    </td>
                    <td className="py-2 pr-4">
                      {c.last_analyzed_at
                        ? new Date(c.last_analyzed_at).toLocaleString()
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
