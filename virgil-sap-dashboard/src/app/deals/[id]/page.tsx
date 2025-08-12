"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface DealDetail {
  id: number;
  deal_name: string;
  stage: string;
  deal_value?: number;
  notes?: string;
  last_activity?: string;
  expected_close_date?: string;
  priority?: string;
  company_id?: number;
  company_name?: string;
  company_industry?: string;
  company_size?: string;
  company_region?: string;
  ae_name?: string;
}

export default function DealDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [deal, setDeal] = useState<DealDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDeal = async () => {
      try {
        const res = await fetch(`/api/deals/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to fetch deal");
        setDeal(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchDeal();
  }, [id]);

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }
  if (error || !deal) {
    return (
      <div className="p-6">
        <p className="text-red-600 mb-3">{error || "Deal not found"}</p>
        <Link className="underline" href="/pipeline">
          Back to Pipeline
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{deal.deal_name}</h1>
          <p className="text-sm text-muted-foreground">
            {deal.company_name} • {deal.company_industry} • {deal.company_size}{" "}
            • {deal.company_region}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge>{deal.stage}</Badge>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Deal Value</div>
            <div className="text-lg font-medium">
              ${Number(deal.deal_value || 0).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="recs">Recommendations</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">AE:</span>{" "}
                {deal.ae_name || "Unassigned"}
              </div>
              <div>
                <span className="text-muted-foreground">Expected Close:</span>{" "}
                {deal.expected_close_date || "—"}
              </div>
              <div>
                <span className="text-muted-foreground">Last Activity:</span>{" "}
                {deal.last_activity || "—"}
              </div>
              <div>
                <span className="text-muted-foreground">Priority:</span>{" "}
                {deal.priority || "—"}
              </div>
              <div>
                <span className="text-muted-foreground">Notes:</span>{" "}
                {deal.notes || "—"}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recs">
          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <DealRecommendations
                companyId={deal.company_id}
                dealId={deal.id}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="files">
          <Card>
            <CardHeader>
              <CardTitle>Files</CardTitle>
            </CardHeader>
            <CardContent>
              <CompanyFiles companyId={deal.company_id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <DealActivity dealId={deal.id} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DealRecommendations({
  companyId,
  dealId,
}: {
  companyId?: number;
  dealId: number;
}) {
  const [loading, setLoading] = useState(true);
  const [recs, setRecs] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalyses = async () => {
      try {
        const res = await fetch(`/api/ai-analyses?companyId=${companyId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to fetch analyses");
        // flatten top recs if present
        const top = [] as any[];
        for (const a of data) {
          const results = a.analysis_results;
          if (results?.recommendations) {
            top.push(...results.recommendations);
          } else if (Array.isArray(results?.recommendedSolutions)) {
            top.push(
              ...results.recommendedSolutions.map((s: any) => ({
                productName: s.module,
                fitScore:
                  typeof s.fitScore === "number"
                    ? s.fitScore
                    : typeof s.estimatedROI === "number"
                    ? Math.round(Math.min(100, Math.max(1, s.estimatedROI)))
                    : 60,
                businessBenefits: s.keyBenefits,
              }))
            );
          }
        }
        top.sort(
          (a, b) => (b.fitScore ?? -Infinity) - (a.fitScore ?? -Infinity)
        );
        setRecs(top.slice(0, 8));
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    if (companyId) fetchAnalyses();
    else setLoading(false);
  }, [companyId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!recs.length)
    return (
      <div className="text-muted-foreground text-sm">
        No recommendations yet.
      </div>
    );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {recs.map((r, idx) => (
        <div key={idx} className="p-3 border rounded">
          <div className="font-medium">{r.productName || r.module}</div>
          {r.fitScore != null && (
            <div className="text-sm text-muted-foreground">
              Fit Score: {Number(r.fitScore).toFixed(2)}%
            </div>
          )}
          {Array.isArray(r.businessBenefits) &&
            r.businessBenefits.length > 0 && (
              <ul className="list-disc pl-5 text-sm mt-1">
                {r.businessBenefits.slice(0, 3).map((b: string, i: number) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            )}
        </div>
      ))}
    </div>
  );
}

function CompanyFiles({ companyId }: { companyId?: number }) {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const res = await fetch(`/api/companies?companyId=${companyId}`);
        const data = await res.json();
        // This assumes your companies endpoint can filter/return files; if not, stubbed UI for now
        setFiles([]);
      } catch {}
      setLoading(false);
    };
    if (companyId) fetchFiles();
    else setLoading(false);
  }, [companyId]);

  if (loading) return <div>Loading...</div>;
  if (!files.length)
    return <div className="text-sm text-muted-foreground">No files.</div>;
  return <div />;
}

function DealActivity({ dealId }: { dealId: number }) {
  // Placeholder; could fetch activities later
  return <div className="text-sm text-muted-foreground">No activity yet.</div>;
}
