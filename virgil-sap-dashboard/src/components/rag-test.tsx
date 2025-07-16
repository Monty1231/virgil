"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface RAGStatus {
  success: boolean;
  stats?: {
    totalVectorCount?: number;
    dimension?: number;
    indexFullness?: number;
  };
  initialized?: boolean;
  error?: string;
}

export function RAGTest() {
  const [status, setStatus] = useState<RAGStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const initializeRAG = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/rag/init", {
        method: "POST",
      });
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      setStatus({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/rag/init");
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      setStatus({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  const testRAGAnalysis = async () => {
    setLoading(true);
    try {
      // Test with a sample company ID (you'll need to adjust this)
      const response = await fetch("/api/ai-analysis/company/1/rag");
      const data = await response.json();
      setTestResult(data);
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>RAG System Test</CardTitle>
          <CardDescription>
            Test the Retrieval-Augmented Generation system for AI analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={initializeRAG} disabled={loading}>
              {loading ? "Initializing..." : "Initialize RAG"}
            </Button>
            <Button onClick={checkStatus} disabled={loading} variant="outline">
              Check Status
            </Button>
            <Button onClick={testRAGAnalysis} disabled={loading} variant="secondary">
              Test RAG Analysis
            </Button>
          </div>

          {status && (
            <div className="space-y-2">
              <Separator />
              <h3 className="font-semibold">RAG Status</h3>
              <div className="flex items-center gap-2">
                <Badge variant={status.success ? "default" : "destructive"}>
                  {status.success ? "Success" : "Error"}
                </Badge>
                {status.initialized && (
                  <Badge variant="secondary">Initialized</Badge>
                )}
              </div>
              
              {status.stats && (
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Total Vectors:</span>
                    <br />
                    {status.stats.totalVectorCount || 0}
                  </div>
                  <div>
                    <span className="font-medium">Dimension:</span>
                    <br />
                    {status.stats.dimension || "N/A"}
                  </div>
                  <div>
                    <span className="font-medium">Index Fullness:</span>
                    <br />
                    {status.stats.indexFullness ? `${(status.stats.indexFullness * 100).toFixed(1)}%` : "N/A"}
                  </div>
                </div>
              )}
              
              {status.error && (
                <div className="text-red-600 text-sm">
                  Error: {status.error}
                </div>
              )}
            </div>
          )}

          {testResult && (
            <div className="space-y-2">
              <Separator />
              <h3 className="font-semibold">RAG Analysis Test Result</h3>
              <div className="flex items-center gap-2">
                <Badge variant={testResult.success ? "default" : "destructive"}>
                  {testResult.success ? "Success" : "Error"}
                </Badge>
                {testResult.metadata?.method && (
                  <Badge variant="secondary">{testResult.metadata.method}</Badge>
                )}
              </div>
              
              {testResult.success && testResult.analysis && (
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Company:</span> {testResult.metadata?.company_name}
                  </div>
                  <div>
                    <span className="font-medium">Fit Score:</span> {testResult.analysis.fitScore}
                  </div>
                  <div>
                    <span className="font-medium">Overall Fit:</span> {testResult.analysis.overallFit}
                  </div>
                  <div>
                    <span className="font-medium">Solutions:</span> {testResult.analysis.recommendedSolutions?.length || 0}
                  </div>
                </div>
              )}
              
              {testResult.error && (
                <div className="text-red-600 text-sm">
                  Error: {testResult.error}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 