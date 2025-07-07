"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  CheckCircle,
  TrendingUp,
  DollarSign,
  Download,
  Target,
  Clock,
  Users,
  RefreshCw,
  AlertCircle,
  Sparkles,
  Brain,
  TrendingDown,
  Bug,
  Play,
  History,
  Eye,
  Calendar,
  Building,
  MapPin,
  Globe,
  FileText,
  BarChart3,
  Shield,
  Zap,
  Settings,
  Cpu,
  Lock,
  Gauge,
  LineChart,
  PieChart,
  Activity,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

interface Company {
  id: number;
  name: string;
  industry: string;
  company_size: string;
  region: string;
  website?: string;
  business_challenges?: string;
  current_systems?: string;
  budget?: string;
  timeline?: string;
  priority?: string;
  primary_contact?: any;
  secondary_contact?: any;
  notes?: string;
  tags?: string[];
  created_at?: string;
}

interface AIAnalysis {
  fitScore: number;
  overallFit: string;
  keySuccessFactors?: string[];
  keyFindings?: string[];
  businessChallenges: string[];
  recommendedSolutions: {
    module: string;
    fit?: string;
    fitJustification?: string;
    priority: number;
    estimatedROI?: number;
    calculatedROI?: number;
    timeToValue: string;
    estimatedCostMin?: number;
    estimatedCostMax?: number;
    costAnalysis?: {
      estimatedCostMin: number;
      estimatedCostMax: number;
      calculationMethodology: string;
    };
    keyBenefits?: string[];
    quantifiedBenefits?: Array<{
      benefit: string;
      quantification: string;
    }>;
    implementationComplexity: string;
    technicalRequirements?: string[];
    businessImpact?: string;
    riskMitigation?: string[];
    riskAssessment?: {
      implementationRisks: string[];
      mitigationStrategies: string[];
    };
    successMetrics?: string[];
    moduleAnalysisContext?: string;
  }[];
  nextSteps: string[];
  riskFactors?: string[];
  implementationRoadmap?: {
    phase: string;
    duration: string;
    activities?: string[];
    specificActivities?: string[];
    deliverables?: string[];
    keyDeliverables?: string[];
    resources?: string[];
    calculatedCost?: number;
  }[];
  businessCase?: {
    totalInvestment: number;
    projectedSavings: number;
    paybackPeriod: string;
    netPresentValue: number;
    riskAdjustedROI: number;
  };
  financialAnalysis?: {
    investmentCalculation: {
      totalInvestment: number;
      methodology: string;
    };
    savingsProjection: {
      annualSavings: number;
      methodology: string;
    };
    roiAnalysis: {
      paybackPeriod: string;
      netPresentValue: number;
      riskAdjustedROI: number;
    };
  };
  competitiveAnalysis?: {
    sapAdvantages: string[];
    competitorComparison:
      | string[]
      | {
          oracle: string;
          microsoft: string;
        };
    differentiators?: string[];
  };
  executiveSummary?: string;
}

interface AnalysisResponse {
  company: Company;
  analysis: AIAnalysis;
  generatedAt: string;
  note?: string;
}

interface StoredAnalysis {
  id: number;
  company_id: number;
  company_name?: string;
  industry?: string;
  company_size?: string;
  analysis_results: AIAnalysis;
  confidence_score: number;
  created_at: string;
  analysis_type?: string;
  model_version?: string;
}

export default function Analyzer() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [analysisData, setAnalysisData] = useState<AIAnalysis | null>(null);
  const [previousAnalyses, setPreviousAnalyses] = useState<StoredAnalysis[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [loadingPrevious, setLoadingPrevious] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [useSimpleRoute, setUseSimpleRoute] = useState(false);
  const [activeTab, setActiveTab] = useState("generate");

  // Fetch companies when component mounts
  useEffect(() => {
    fetchCompanies();
    testDebugAPI();
  }, []);

  // Fetch previous analyses when company is selected
  useEffect(() => {
    if (selectedCompanyId) {
      fetchPreviousAnalyses(selectedCompanyId);
    } else {
      setPreviousAnalyses([]);
    }
  }, [selectedCompanyId]);

  const testDebugAPI = async () => {
    try {
      console.log("🔍 Testing debug API...");
      const response = await fetch("/api/debug-ai");
      const data = await response.json();
      setDebugInfo(data);
      console.log("🔍 Debug API result:", data);
    } catch (error) {
      console.error("🔍 Debug API failed:", error);
    }
  };

  const fetchCompanies = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log("🏢 Analyzer: Fetching companies...");

      const response = await fetch("/api/companies", {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache",
        },
      });

      console.log("🏢 Analyzer: Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("🏢 Analyzer: Error response:", errorText);
        throw new Error(
          `Failed to fetch companies: ${
            response.status
          } - ${errorText.substring(0, 200)}`
        );
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        setCompanies(data);
        console.log(
          "🏢 Analyzer: ✅ Successfully loaded",
          data.length,
          "companies"
        );
      } else {
        setCompanies([]);
        setError("Invalid data format received from server");
      }
    } catch (error) {
      console.error("🏢 Analyzer: ❌ Fetch error:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load companies"
      );
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPreviousAnalyses = async (companyId: string) => {
    setLoadingPrevious(true);

    try {
      console.log(
        "📊 Analyzer: Fetching previous analyses for company:",
        companyId
      );

      const response = await fetch(`/api/ai-analyses?companyId=${companyId}`);

      if (response.ok) {
        const data = await response.json();
        console.log("📊 Analyzer: Previous analyses raw data:", data);

        if (Array.isArray(data)) {
          // Enhanced data processing for the new analysis structure
          const validAnalyses = data
            .map((analysis) => {
              let analysisResults = analysis.analysis_results;

              // Handle string JSON parsing
              if (typeof analysisResults === "string") {
                try {
                  analysisResults = JSON.parse(analysisResults);
                } catch (parseError) {
                  console.error(
                    "📊 Failed to parse analysis_results JSON:",
                    parseError
                  );
                  analysisResults = null;
                }
              }

              // Add company info if missing
              const processedAnalysis = {
                ...analysis,
                analysis_results: analysisResults,
                company_name:
                  analysis.company_name ||
                  selectedCompany?.name ||
                  "Unknown Company",
                industry:
                  analysis.industry ||
                  selectedCompany?.industry ||
                  "Unknown Industry",
                company_size:
                  analysis.company_size ||
                  selectedCompany?.company_size ||
                  "Unknown Size",
              };

              return processedAnalysis;
            })
            .filter((analysis) => analysis.analysis_results !== null)
            .sort(
              (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime()
            );

          setPreviousAnalyses(validAnalyses);
          console.log(
            "📊 Analyzer: Set",
            validAnalyses.length,
            "previous analyses"
          );
        } else {
          setPreviousAnalyses([]);
        }
      } else {
        console.log("📊 Analyzer: No previous analyses found or API error");
        setPreviousAnalyses([]);
      }
    } catch (error) {
      console.error("📊 Analyzer: Failed to fetch previous analyses:", error);
      setPreviousAnalyses([]);
    } finally {
      setLoadingPrevious(false);
    }
  };

  const generateAnalysis = async (companyId: string) => {
    setAnalyzing(true);
    setAnalysisError(null);
    setAnalysisData(null);

    try {
      console.log(
        "🤖 Analyzer: Generating AI analysis for company ID:",
        companyId
      );

      const apiUrl = `/api/ai-analysis/company/${companyId}`;
      console.log("🤖 Analyzer: Using API URL:", apiUrl);

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache",
          Accept: "application/json",
        },
      });

      console.log("🤖 Analyzer: AI Analysis response status:", response.status);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (parseError) {
          const errorText = await response.text();
          console.error("🤖 Analyzer: Error response (not JSON):", errorText);
          throw new Error(
            `HTTP ${response.status}: ${errorText.substring(0, 200)}`
          );
        }

        console.error("🤖 Analyzer: Error response:", errorData);

        // Create a more detailed error message
        let errorMessage =
          errorData?.error || errorData?.details || `HTTP ${response.status}`;

        // Add debugging information if available
        if (errorData?.businessCase) {
          errorMessage += `\n\nBusiness Case Data: ${JSON.stringify(
            errorData.businessCase,
            null,
            2
          )}`;
        }
        if (errorData?.raw) {
          errorMessage += `\n\nRaw AI Output: ${errorData.raw.substring(
            0,
            500
          )}...`;
        }
        if (errorData?.analysis) {
          errorMessage += `\n\nAnalysis Object Keys: ${Object.keys(
            errorData.analysis
          ).join(", ")}`;
        }

        throw new Error(errorMessage);
      }

      let data: AnalysisResponse;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error(
          "🤖 Analyzer: Failed to parse JSON response:",
          parseError
        );
        throw new Error("Failed to parse server response as JSON");
      }

      console.log("🤖 Analyzer: ✅ Analysis generated successfully");
      console.log("🤖 Analyzer: Analysis data:", {
        fitScore: data.analysis?.fitScore,
        solutionsCount: data.analysis?.recommendedSolutions?.length,
        note: data.note,
      });

      setAnalysisData(data.analysis);

      // Refresh previous analyses to include the new one
      fetchPreviousAnalyses(companyId);
    } catch (error) {
      console.error("🤖 Analyzer: ❌ Analysis error:", error);
      setAnalysisError(
        error instanceof Error ? error.message : "Failed to generate analysis"
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const loadPreviousAnalysis = (analysis: StoredAnalysis) => {
    console.log("📊 Loading previous analysis:", analysis.id);
    setAnalysisData(analysis.analysis_results);
    setActiveTab("generate"); // Switch to the analysis view
  };

  const handleCompanyChange = (companyId: string) => {
    setSelectedCompanyId(companyId);

    const company = companies.find((c) => c.id.toString() === companyId);
    if (company) {
      setSelectedCompany(company);
      console.log("🏢 Analyzer: Selected company:", company.name);
    } else {
      setSelectedCompany(null);
    }

    // Clear current analysis when changing companies
    setAnalysisData(null);
    setAnalysisError(null);
  };

  const getFitColor = (fit: string) => {
    switch (fit) {
      case "Excellent":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "High":
        return "bg-primary/10 text-primary border-primary/20";
      case "Medium":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "Low":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-muted text-muted-foreground border-muted/20";
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case "Low":
        return "text-emerald-600";
      case "Medium":
        return "text-amber-600";
      case "High":
        return "text-red-600";
      default:
        return "text-slate-600";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatLargeCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return formatCurrency(amount);
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div>
            <h1 className="text-heading text-foreground">
              AI-Powered Fit & Benefit Analyzer
            </h1>
            <p className="text-caption text-muted-foreground">
              Comprehensive SAP solution analysis with business case development
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setUseSimpleRoute(!useSimpleRoute)}
            variant="outline"
            size="sm"
            className="bg-transparent hover:bg-accent"
          >
            <Bug className="mr-2 h-4 w-4" />
            {useSimpleRoute ? "Use Full AI" : "Use Simple Test"}
          </Button>
          <Button className="bg-primary hover:bg-primary/90">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Debug Info */}
      {debugInfo && (
        <Card className="bg-muted border border-border">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Debug Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>
                <strong>Environment:</strong> OpenAI Key:{" "}
                {debugInfo.environment?.hasOpenAI ? "✅" : "❌"}, Database:{" "}
                {debugInfo.environment?.hasDatabase ? "✅" : "❌"}
              </p>
              <p>
                <strong>AI SDK:</strong> {debugInfo.imports?.aiSdkStatus}
              </p>
              <p>
                <strong>Database:</strong> {debugInfo.database?.status}
              </p>
              <p>
                <strong>Current Mode:</strong>{" "}
                {useSimpleRoute ? "Simple Test Route" : "Full AI Route"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Company Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Select Company for Comprehensive AI Analysis
            {useSimpleRoute && (
              <Badge className="bg-amber-100 text-amber-800 border-amber-200 ml-2">
                <Bug className="h-3 w-3 mr-1" />
                Test Mode
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="flex items-center gap-2 text-primary mb-4">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Loading companies...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <p className="text-red-800 text-sm">
                  <strong>Error:</strong> {error}
                </p>
              </div>
              <Button
                onClick={fetchCompanies}
                variant="outline"
                size="sm"
                className="mt-2 bg-transparent hover:bg-accent"
              >
                <RefreshCw className="mr-2 h-3 w-3" />
                Retry
              </Button>
            </div>
          )}

          <div className="space-y-4">
            <Select
              value={selectedCompanyId}
              onValueChange={handleCompanyChange}
              disabled={loading}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    loading
                      ? "Loading companies..."
                      : companies.length === 0
                      ? "No companies available"
                      : "Select a company to analyze"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {companies.length === 0 ? (
                  <SelectItem value="no-companies" disabled>
                    <div className="text-center py-2">
                      <p className="text-sm text-muted-foreground">
                        No companies found
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Create companies in "New Account" page
                      </p>
                    </div>
                  </SelectItem>
                ) : (
                  companies.map((company) => (
                    <SelectItem key={company.id} value={company.id.toString()}>
                      <div className="flex flex-col py-1">
                        <span className="font-medium">{company.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {company.industry} • {company.company_size} •{" "}
                          {company.region}
                        </span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            {companies.length > 0 && !loading && (
              <p className="text-xs text-emerald-600">
                ✅ Found {companies.length} companies
              </p>
            )}

            {/* Generate Analysis Button */}
            {selectedCompany && (
              <div className="flex gap-2">
                <Button
                  onClick={() => generateAnalysis(selectedCompanyId)}
                  disabled={analyzing}
                  className="bg-primary hover:bg-primary/90"
                >
                  {analyzing ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Generating Analysis...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Generate Comprehensive Analysis
                    </>
                  )}
                </Button>
                {previousAnalyses.length > 0 && (
                  <Button
                    onClick={() => setActiveTab("history")}
                    variant="outline"
                    className="bg-transparent hover:bg-accent"
                  >
                    <History className="mr-2 h-4 w-4" />
                    View Previous ({previousAnalyses.length})
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Analysis and History */}
      {selectedCompany && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generate" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Current Analysis
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Previous Reports ({previousAnalyses.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-6">
            {/* AI Analysis Loading */}
            {analyzing && (
              <Card>
                <CardContent className="text-center py-12">
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                      <Brain className="h-12 w-12 text-indigo-600 animate-pulse" />
                      <Sparkles className="h-6 w-6 text-amber-500 absolute -top-1 -right-1 animate-bounce" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">
                        Comprehensive AI Analysis in Progress
                      </h3>
                      <p className="text-slate-600 mb-4">
                        OpenAI is performing deep analysis of{" "}
                        {selectedCompany?.name} including business case
                        development, competitive analysis, and implementation
                        roadmap...
                      </p>
                      <div className="flex items-center justify-center gap-2 text-sm text-indigo-600">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>
                          This may take 30-60 seconds for comprehensive analysis
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Analysis Error */}
            {analysisError && (
              <Card>
                <CardContent className="py-8">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      <h3 className="font-semibold text-red-800">
                        AI Analysis Failed
                      </h3>
                    </div>
                    <p className="text-red-700 mb-4">{analysisError}</p>

                    <div className="bg-red-100 p-3 rounded text-sm text-red-800 mb-4">
                      <p>
                        <strong>Troubleshooting steps:</strong>
                      </p>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>
                          Check that OPENAI_API_KEY is set in your .env.local
                          file
                        </li>
                        <li>
                          Verify your OpenAI API key is valid and has credits
                        </li>
                        <li>Check browser console for detailed error logs</li>
                        <li>Ensure DATABASE_URL is properly configured</li>
                      </ul>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() =>
                          selectedCompanyId &&
                          generateAnalysis(selectedCompanyId)
                        }
                        variant="outline"
                        size="sm"
                        className="bg-transparent"
                      >
                        <RefreshCw className="mr-2 h-3 w-3" />
                        Retry Analysis
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Comprehensive AI Analysis Results */}
            {selectedCompany && analysisData && !analyzing && (
              <>
                {/* Company Overview & Fit Assessment */}
                <div className="grid gap-6 md:grid-cols-3">
                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-blue-600" />
                        SAP Fit Assessment - {selectedCompany.name}
                        <Badge className="bg-purple-100 text-purple-800 ml-2">
                          <Sparkles className="h-3 w-3 mr-1" />
                          AI Powered
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-6 w-6 text-emerald-600" />
                            <span className="text-lg font-semibold text-slate-900">
                              {analysisData.overallFit} Fit
                            </span>
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4 text-slate-500" />
                              <span className="text-sm">
                                <strong>Industry:</strong>{" "}
                                {selectedCompany.industry}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-slate-500" />
                              <span className="text-sm">
                                <strong>Size:</strong>{" "}
                                {selectedCompany.company_size}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-slate-500" />
                              <span className="text-sm">
                                <strong>Region:</strong>{" "}
                                {selectedCompany.region}
                              </span>
                            </div>
                            {selectedCompany.website && (
                              <div className="flex items-center gap-2">
                                <Globe className="h-4 w-4 text-slate-500" />
                                <span className="text-sm">
                                  <strong>Website:</strong>{" "}
                                  <a
                                    href={selectedCompany.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline"
                                  >
                                    {selectedCompany.website}
                                  </a>
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="space-y-2">
                            {selectedCompany.budget && (
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-slate-500" />
                                <span className="text-sm">
                                  <strong>Budget:</strong>{" "}
                                  {selectedCompany.budget}
                                </span>
                              </div>
                            )}
                            {selectedCompany.timeline && (
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-slate-500" />
                                <span className="text-sm">
                                  <strong>Timeline:</strong>{" "}
                                  {selectedCompany.timeline}
                                </span>
                              </div>
                            )}
                            {selectedCompany.priority && (
                              <div className="flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-slate-500" />
                                <span className="text-sm">
                                  <strong>Priority:</strong>{" "}
                                  {selectedCompany.priority}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <Progress
                          value={analysisData.fitScore}
                          className="w-full"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Key Success Factors
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {analysisData.keySuccessFactors &&
                        Array.isArray(analysisData.keySuccessFactors) ? (
                          analysisData.keySuccessFactors.map(
                            (factor, index) => (
                              <li
                                key={index}
                                className="flex items-start gap-2 text-sm text-slate-600"
                              >
                                <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                                {factor}
                              </li>
                            )
                          )
                        ) : (
                          <li className="text-sm text-slate-400 italic">
                            No key success factors identified.
                          </li>
                        )}
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                {/* AI Analysis Insights */}
                <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5 text-purple-600" />
                      AI Analysis Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6 md:grid-cols-2">
                      {/* Company Profile Analysis */}
                      <div className="space-y-4">
                        <h4 className="font-semibold text-purple-900 mb-3">
                          Company Profile Analysis
                        </h4>
                        <div className="space-y-3">
                          <div className="flex items-start gap-2">
                            <Building className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-purple-900">
                                Industry Analysis
                              </p>
                              <p className="text-xs text-purple-700">
                                {selectedCompany.industry} sector analysis
                                indicates {analysisData.fitScore}% fit score
                                based on industry benchmarks and market
                                conditions
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <Users className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-purple-900">
                                Scale Assessment
                              </p>
                              <p className="text-xs text-purple-700">
                                {selectedCompany.company_size} provides optimal
                                balance of complexity and resource availability
                                for comprehensive SAP deployment
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-purple-900">
                                Regional Factors
                              </p>
                              <p className="text-xs text-purple-700">
                                {selectedCompany.region} market offers strong
                                SAP partner ecosystem with local implementation
                                support and expertise
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Business Context Analysis */}
                      <div className="space-y-4">
                        <h4 className="font-semibold text-blue-900 mb-3">
                          Business Context Analysis
                        </h4>
                        <div className="space-y-3">
                          {selectedCompany.business_challenges && (
                            <div className="flex items-start gap-2">
                              <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-sm font-medium text-blue-900">
                                  Business Challenges
                                </p>
                                <p className="text-xs text-blue-700">
                                  "
                                  {selectedCompany.business_challenges.substring(
                                    0,
                                    120
                                  )}
                                  ..." directly align with SAP's core value
                                  propositions
                                </p>
                              </div>
                            </div>
                          )}
                          {selectedCompany.current_systems && (
                            <div className="flex items-start gap-2">
                              <Settings className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-sm font-medium text-blue-900">
                                  Current Systems
                                </p>
                                <p className="text-xs text-blue-700">
                                  Integration with "
                                  {selectedCompany.current_systems.substring(
                                    0,
                                    100
                                  )}
                                  ..." presents manageable but addressable
                                  requirements
                                </p>
                              </div>
                            </div>
                          )}
                          {selectedCompany.budget && (
                            <div className="flex items-start gap-2">
                              <DollarSign className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-sm font-medium text-blue-900">
                                  Budget Alignment
                                </p>
                                <p className="text-xs text-blue-700">
                                  {selectedCompany.budget} budget range supports
                                  comprehensive SAP implementation with
                                  realistic ROI expectations
                                </p>
                              </div>
                            </div>
                          )}
                          {selectedCompany.timeline && (
                            <div className="flex items-start gap-2">
                              <Clock className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-sm font-medium text-blue-900">
                                  Timeline Assessment
                                </p>
                                <p className="text-xs text-blue-700">
                                  {selectedCompany.timeline} timeline aligns
                                  with phased implementation approach for
                                  optimal success
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* AI Analysis Methodology */}
                    <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <h5 className="font-medium text-slate-900 mb-2 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-slate-600" />
                        AI Analysis Methodology
                      </h5>
                      <div className="text-sm text-slate-700 space-y-2">
                        <p>
                          <strong>Data Sources:</strong> Industry benchmarks for{" "}
                          {selectedCompany.industry}, regional market data for{" "}
                          {selectedCompany.region}, current SAP pricing models,
                          and public implementation case studies
                        </p>
                        <p>
                          <strong>Calculation Method:</strong> Implementation
                          costs based on user count × industry multiplier ×
                          regional cost factor. Annual savings calculated from
                          operational efficiency (25-35%), process automation
                          (20-30%), compliance savings (10-20%)
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Business Case Overview */}
                {analysisData.businessCase && (
                  <Card className="bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200 shadow-md rounded-xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-indigo-700 font-semibold">
                        <BarChart3 className="h-5 w-5 text-amber-600" />
                        Business Case Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-5">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-amber-600">
                            {formatLargeCurrency(
                              analysisData.businessCase.totalInvestment
                            )}
                          </div>
                          <div className="text-sm text-slate-600">
                            Total Investment
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-emerald-700">
                            {formatLargeCurrency(
                              analysisData.businessCase.projectedSavings
                            )}
                          </div>
                          <div className="text-sm text-slate-600">
                            Projected Savings
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-indigo-700">
                            {analysisData.businessCase.paybackPeriod}
                          </div>
                          <div className="text-sm text-slate-600">
                            Payback Period
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-slate-700">
                            {formatLargeCurrency(
                              analysisData.businessCase.netPresentValue
                            )}
                          </div>
                          <div className="text-sm text-slate-600">
                            Net Present Value
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-amber-600">
                            {analysisData.businessCase.riskAdjustedROI}%
                          </div>
                          <div className="text-sm text-slate-600">
                            Risk-Adjusted ROI
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Business Challenges */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingDown className="h-5 w-5 text-orange-600" />
                      Identified Business Challenges
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {analysisData.businessChallenges &&
                      Array.isArray(analysisData.businessChallenges) ? (
                        analysisData.businessChallenges.map(
                          (challenge, index) => (
                            <div
                              key={index}
                              className="flex items-start gap-2 p-3 bg-orange-50 rounded-lg border border-orange-200"
                            >
                              <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-orange-800">
                                {challenge}
                              </span>
                            </div>
                          )
                        )
                      ) : (
                        <div className="col-span-2 text-center py-4 text-slate-400 italic">
                          No business challenges identified.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Recommended Solutions – Enhanced */}
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="h-6 w-6 text-amber-600" />
                    AI-Recommended SAP Solutions
                  </h2>

                  {Array.isArray(analysisData.recommendedSolutions) ? (
                    analysisData.recommendedSolutions
                      .sort((a, b) => a.priority - b.priority)
                      .map((solution, index) => (
                        <Card
                          key={solution.module}
                          className="overflow-hidden bg-slate-50 border-slate-200 shadow-md rounded-xl"
                        >
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <CardTitle className="text-xl text-slate-900 font-semibold">
                                  SAP {solution.module}
                                </CardTitle>
                                <Badge
                                  className={
                                    getFitColor(solution.fit || "Medium") +
                                    " font-medium rounded-full px-3 py-1"
                                  }
                                >
                                  {solution.fit || "Medium"} Fit
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className="text-xs border-slate-300 bg-slate-100 text-slate-700 font-medium rounded-full px-3 py-1"
                                >
                                  Priority {solution.priority}
                                </Badge>
                              </div>
                              <div className="text-right">
                                <div className="text-sm text-slate-500">
                                  Complexity
                                </div>
                                <div
                                  className={`font-medium ${getComplexityColor(
                                    solution.implementationComplexity
                                  )}`}
                                >
                                  {solution.implementationComplexity}
                                </div>
                              </div>
                            </div>
                          </CardHeader>

                          <CardContent>
                            <div className="grid gap-6 lg:grid-cols-4">
                              {/* Key Metrics */}
                              <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                  <TrendingUp className="h-5 w-5 text-emerald-700" />
                                  <div>
                                    <p className="text-sm text-slate-600">
                                      Estimated ROI
                                    </p>
                                    <p className="text-lg font-semibold text-emerald-700">
                                      {solution.estimatedROI}%
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock className="h-5 w-5 text-indigo-700" />
                                  <div>
                                    <p className="text-sm text-slate-600">
                                      Time to Value
                                    </p>
                                    <p className="text-lg font-semibold text-indigo-700">
                                      {solution.timeToValue}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <DollarSign className="h-5 w-5 text-amber-600" />
                                  <div>
                                    <p className="text-sm text-slate-600">
                                      Investment Range
                                    </p>
                                    <p className="text-lg font-semibold text-amber-600">
                                      {formatCurrency(
                                        solution.estimatedCostMin || 0
                                      )}{" "}
                                      –{" "}
                                      {formatCurrency(
                                        solution.estimatedCostMax || 0
                                      )}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Key Benefits */}
                              <div className="lg:col-span-2">
                                <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                  <Zap className="h-4 w-4 text-amber-600" />
                                  Key Benefits
                                </h4>
                                <div className="grid gap-2 sm:grid-cols-2">
                                  {solution.keyBenefits &&
                                  Array.isArray(solution.keyBenefits) ? (
                                    solution.keyBenefits.map((benefit, i) => (
                                      <div
                                        key={i}
                                        className="flex items-start gap-2 text-sm text-slate-600"
                                      >
                                        <CheckCircle className="h-4 w-4 text-emerald-700 mt-0.5 flex-shrink-0" />
                                        {benefit}
                                      </div>
                                    ))
                                  ) : (
                                    <div className="col-span-2 text-sm text-slate-400 italic">
                                      No key benefits identified.
                                    </div>
                                  )}
                                </div>

                                {solution.businessImpact && (
                                  <div className="mt-4 p-3 bg-slate-100 rounded-lg border border-slate-200">
                                    <h5 className="font-medium text-indigo-700 mb-1 flex items-center gap-2">
                                      <Activity className="h-4 w-4" />
                                      Business Impact
                                    </h5>
                                    <p className="text-sm text-slate-800">
                                      {solution.businessImpact}
                                    </p>
                                  </div>
                                )}
                              </div>

                              {/* Technical Requirements & Success Metrics */}
                              <div className="space-y-4">
                                {solution.technicalRequirements &&
                                Array.isArray(
                                  solution.technicalRequirements
                                ) ? (
                                  <div>
                                    <h5 className="font-medium text-slate-900 mb-2 flex items-center gap-2">
                                      <Settings className="h-4 w-4 text-slate-600" />
                                      Technical Requirements
                                    </h5>
                                    <ul className="space-y-1">
                                      {solution.technicalRequirements.map(
                                        (req, i) => (
                                          <li
                                            key={i}
                                            className="text-xs text-slate-600 flex items-start gap-1"
                                          >
                                            <Cpu className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                            {req}
                                          </li>
                                        )
                                      )}
                                    </ul>
                                  </div>
                                ) : null}

                                {solution.successMetrics &&
                                Array.isArray(solution.successMetrics) ? (
                                  <div>
                                    <h5 className="font-medium text-slate-900 mb-2 flex items-center gap-2">
                                      <Gauge className="h-4 w-4 text-slate-600" />
                                      Success Metrics
                                    </h5>
                                    <ul className="space-y-1">
                                      {solution.successMetrics.map(
                                        (metric, i) => (
                                          <li
                                            key={i}
                                            className="text-xs text-slate-600 flex items-start gap-1"
                                          >
                                            <LineChart className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                            {metric}
                                          </li>
                                        )
                                      )}
                                    </ul>
                                  </div>
                                ) : null}
                              </div>

                              {/* AI Analysis Context */}
                              <div className="mt-4 p-3 bg-slate-100 rounded-lg border border-slate-200 lg:col-span-2">
                                <h5 className="font-medium text-indigo-700 mb-2 flex items-center gap-2">
                                  <Brain className="h-4 w-4" />
                                  AI Analysis Context
                                </h5>
                                <div className="text-sm text-slate-800 space-y-2">
                                  {solution.moduleAnalysisContext ? (
                                    <div className="mb-2">
                                      {solution.moduleAnalysisContext}
                                    </div>
                                  ) : (
                                    <div className="text-slate-400 italic">
                                      No analysis context provided.
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                  ) : (
                    <div className="text-slate-400 italic">
                      No recommended solutions identified.
                    </div>
                  )}
                </div>

                {/* AI Analysis Insights */}
                <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5 text-purple-600" />
                      AI Analysis Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6 md:grid-cols-2">
                      {/* Company Profile Analysis */}
                      <div className="space-y-4">
                        <h4 className="font-semibold text-purple-900 mb-3">
                          Company Profile Analysis
                        </h4>
                        <div className="space-y-3">
                          <div className="flex items-start gap-2">
                            <Building className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-purple-900">
                                Industry Analysis
                              </p>
                              <p className="text-xs text-purple-700">
                                {selectedCompany.industry} sector analysis
                                indicates {analysisData.fitScore}% fit score
                                based on industry benchmarks and market
                                conditions
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <Users className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-purple-900">
                                Scale Assessment
                              </p>
                              <p className="text-xs text-purple-700">
                                {selectedCompany.company_size} provides optimal
                                balance of complexity and resource availability
                                for comprehensive SAP deployment
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-purple-900">
                                Regional Factors
                              </p>
                              <p className="text-xs text-purple-700">
                                {selectedCompany.region} market offers strong
                                SAP partner ecosystem with local implementation
                                support and expertise
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Business Context Analysis */}
                      <div className="space-y-4">
                        <h4 className="font-semibold text-blue-900 mb-3">
                          Business Context Analysis
                        </h4>
                        <div className="space-y-3">
                          {selectedCompany.business_challenges && (
                            <div className="flex items-start gap-2">
                              <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-sm font-medium text-blue-900">
                                  Business Challenges
                                </p>
                                <p className="text-xs text-blue-700">
                                  "
                                  {selectedCompany.business_challenges.substring(
                                    0,
                                    120
                                  )}
                                  ..." directly align with SAP's core value
                                  propositions
                                </p>
                              </div>
                            </div>
                          )}
                          {selectedCompany.current_systems && (
                            <div className="flex items-start gap-2">
                              <Settings className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-sm font-medium text-blue-900">
                                  Current Systems
                                </p>
                                <p className="text-xs text-blue-700">
                                  Integration with "
                                  {selectedCompany.current_systems.substring(
                                    0,
                                    100
                                  )}
                                  ..." presents manageable but addressable
                                  requirements
                                </p>
                              </div>
                            </div>
                          )}
                          {selectedCompany.budget && (
                            <div className="flex items-start gap-2">
                              <DollarSign className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-sm font-medium text-blue-900">
                                  Budget Alignment
                                </p>
                                <p className="text-xs text-blue-700">
                                  {selectedCompany.budget} budget range supports
                                  comprehensive SAP implementation with
                                  realistic ROI expectations
                                </p>
                              </div>
                            </div>
                          )}
                          {selectedCompany.timeline && (
                            <div className="flex items-start gap-2">
                              <Clock className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-sm font-medium text-blue-900">
                                  Timeline Assessment
                                </p>
                                <p className="text-xs text-blue-700">
                                  {selectedCompany.timeline} timeline aligns
                                  with phased implementation approach for
                                  optimal success
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* AI Analysis Methodology */}
                    <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <h5 className="font-medium text-slate-900 mb-2 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-slate-600" />
                        AI Analysis Methodology
                      </h5>
                      <div className="text-sm text-slate-700 space-y-2">
                        <p>
                          <strong>Data Sources:</strong> Industry benchmarks for{" "}
                          {selectedCompany.industry}, regional market data for{" "}
                          {selectedCompany.region}, current SAP pricing models,
                          and public implementation case studies
                        </p>
                        <p>
                          <strong>Calculation Method:</strong> Implementation
                          costs based on user count × industry multiplier ×
                          regional cost factor. Annual savings calculated from
                          operational efficiency (25-35%), process automation
                          (20-30%), compliance savings (10-20%)
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Implementation Roadmap */}
                {analysisData.implementationRoadmap &&
                Array.isArray(analysisData.implementationRoadmap) ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-blue-600" />
                        Implementation Roadmap
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {analysisData.implementationRoadmap.map(
                          (phase, index) => (
                            <div key={index} className="border rounded-lg p-4">
                              <div className="flex items-center gap-3 mb-3">
                                <Badge variant="outline" className="text-xs">
                                  Phase {index + 1}
                                </Badge>
                                <h4 className="font-semibold text-slate-900">
                                  {phase.phase}
                                </h4>
                                <Badge className="bg-blue-100 text-blue-800">
                                  {phase.duration}
                                </Badge>
                              </div>
                              <div className="grid gap-4 md:grid-cols-3">
                                <div>
                                  <h5 className="font-medium text-slate-700 mb-2">
                                    Activities
                                  </h5>
                                  <ul className="space-y-1">
                                    {phase.activities &&
                                    Array.isArray(phase.activities) ? (
                                      phase.activities.map(
                                        (activity, actIndex) => (
                                          <li
                                            key={actIndex}
                                            className="text-sm text-slate-600 flex items-start gap-1"
                                          >
                                            <CheckCircle className="h-3 w-3 mt-0.5 flex-shrink-0 text-emerald-600" />
                                            {activity}
                                          </li>
                                        )
                                      )
                                    ) : (
                                      <li className="text-sm text-slate-400 italic">
                                        No activities specified.
                                      </li>
                                    )}
                                  </ul>
                                </div>
                                <div>
                                  <h5 className="font-medium text-slate-700 mb-2">
                                    Deliverables
                                  </h5>
                                  <ul className="space-y-1">
                                    {phase.deliverables &&
                                    Array.isArray(phase.deliverables) ? (
                                      phase.deliverables.map(
                                        (deliverable, delIndex) => (
                                          <li
                                            key={delIndex}
                                            className="text-sm text-slate-600 flex items-start gap-1"
                                          >
                                            <FileText className="h-3 w-3 mt-0.5 flex-shrink-0 text-blue-600" />
                                            {deliverable}
                                          </li>
                                        )
                                      )
                                    ) : (
                                      <li className="text-sm text-slate-400 italic">
                                        No deliverables specified.
                                      </li>
                                    )}
                                  </ul>
                                </div>
                                <div>
                                  <h5 className="font-medium text-slate-700 mb-2">
                                    Resources
                                  </h5>
                                  <ul className="space-y-1">
                                    {phase.resources &&
                                    Array.isArray(phase.resources) ? (
                                      phase.resources.map(
                                        (resource, resIndex) => (
                                          <li
                                            key={resIndex}
                                            className="text-sm text-slate-600 flex items-start gap-1"
                                          >
                                            <Users className="h-3 w-3 mt-0.5 flex-shrink-0 text-purple-600" />
                                            {resource}
                                          </li>
                                        )
                                      )
                                    ) : (
                                      <li className="text-sm text-slate-400 italic">
                                        No resources specified.
                                      </li>
                                    )}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ) : null}

                {/* Competitive Analysis */}
                {analysisData.competitiveAnalysis && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-emerald-600" />
                        Competitive Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-6 md:grid-cols-3">
                        <div>
                          <h4 className="font-semibold text-emerald-900 mb-3">
                            SAP Advantages
                          </h4>
                          <ul className="space-y-2">
                            {analysisData.competitiveAnalysis.sapAdvantages &&
                            Array.isArray(
                              analysisData.competitiveAnalysis.sapAdvantages
                            ) ? (
                              analysisData.competitiveAnalysis.sapAdvantages.map(
                                (advantage, index) => (
                                  <li
                                    key={index}
                                    className="flex items-start gap-2 text-sm text-emerald-800"
                                  >
                                    <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                                    {advantage}
                                  </li>
                                )
                              )
                            ) : (
                              <li className="text-sm text-slate-400 italic">
                                No SAP advantages identified.
                              </li>
                            )}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold text-blue-900 mb-3">
                            Competitor Comparison
                          </h4>
                          <ul className="space-y-2">
                            {analysisData.competitiveAnalysis
                              .competitorComparison &&
                            Array.isArray(
                              analysisData.competitiveAnalysis
                                .competitorComparison
                            ) ? (
                              analysisData.competitiveAnalysis.competitorComparison.map(
                                (comparison, index) => (
                                  <li
                                    key={index}
                                    className="flex items-start gap-2 text-sm text-blue-800"
                                  >
                                    <BarChart3 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                    {comparison}
                                  </li>
                                )
                              )
                            ) : (
                              <li className="text-sm text-slate-400 italic">
                                No competitor comparisons available.
                              </li>
                            )}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold text-purple-900 mb-3">
                            Key Differentiators
                          </h4>
                          <ul className="space-y-2">
                            {analysisData.competitiveAnalysis.differentiators &&
                            Array.isArray(
                              analysisData.competitiveAnalysis.differentiators
                            ) ? (
                              analysisData.competitiveAnalysis.differentiators.map(
                                (differentiator, index) => (
                                  <li
                                    key={index}
                                    className="flex items-start gap-2 text-sm text-purple-800"
                                  >
                                    <Sparkles className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                                    {differentiator}
                                  </li>
                                )
                              )
                            ) : (
                              <li className="text-sm text-slate-400 italic">
                                No differentiators identified.
                              </li>
                            )}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Risk Factors */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      Risk Factors & Mitigation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {analysisData.riskFactors &&
                      Array.isArray(analysisData.riskFactors) ? (
                        analysisData.riskFactors.map((risk, index) => (
                          <div
                            key={index}
                            className="flex flex-col gap-1 p-3 bg-red-50 rounded-lg border border-red-200"
                          >
                            <div className="flex items-start gap-2">
                              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                              {typeof risk === "object" && risk !== null ? (
                                <span className="text-sm text-red-800">
                                  <strong>Risk:</strong> {risk.risk}
                                  <br />
                                  <strong>Mitigation:</strong> {risk.mitigation}
                                </span>
                              ) : (
                                <span className="text-sm text-red-800">
                                  {risk}
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-2 text-center py-4 text-slate-400 italic">
                          No risk factors identified.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Next Steps */}
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <Users className="h-8 w-8 text-blue-600 mt-1" />
                      <div>
                        <h3 className="font-semibold text-blue-900 mb-2">
                          Recommended Next Steps
                        </h3>
                        <ul className="space-y-2 mb-4">
                          {analysisData.nextSteps &&
                          Array.isArray(analysisData.nextSteps) ? (
                            analysisData.nextSteps.map((step, index) => (
                              <li
                                key={index}
                                className="flex items-start gap-2 text-blue-800"
                              >
                                <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                <span className="text-sm">{step}</span>
                              </li>
                            ))
                          ) : (
                            <li className="text-sm text-slate-400 italic">
                              No next steps identified.
                            </li>
                          )}
                        </ul>
                        <div className="flex gap-2">
                          <Button className="bg-blue-600 hover:bg-blue-700">
                            Create Presentation Deck
                          </Button>
                          <Button
                            variant="outline"
                            className="border-blue-300 text-blue-700 bg-transparent"
                          >
                            Schedule Executive Briefing
                          </Button>
                          <Button
                            variant="outline"
                            className="border-blue-300 text-blue-700 bg-transparent"
                          >
                            Generate Proposal
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* No Analysis State */}
            {selectedCompany &&
              !analysisData &&
              !analyzing &&
              !analysisError && (
                <Card>
                  <CardContent className="text-center py-12">
                    <Brain className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      Ready to Generate Comprehensive Analysis
                    </h3>
                    <p className="text-slate-600 mb-4">
                      Click "Generate Comprehensive Analysis" to create
                      AI-powered SAP fit analysis with business case,
                      implementation roadmap, and competitive analysis for{" "}
                      {selectedCompany.name}.
                    </p>
                    <Button
                      onClick={() => generateAnalysis(selectedCompanyId)}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Generate Comprehensive Analysis
                    </Button>
                  </CardContent>
                </Card>
              )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {loadingPrevious && (
              <Card>
                <CardContent className="text-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                  <p>Loading previous analyses...</p>
                </CardContent>
              </Card>
            )}

            {!loadingPrevious && previousAnalyses.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <History className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    No Previous Analyses
                  </h3>
                  <p className="text-slate-600 mb-4">
                    No previous AI analyses found for {selectedCompany?.name}.
                    Generate your first analysis to get started.
                  </p>
                  <Button
                    onClick={() => setActiveTab("generate")}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Generate First Analysis
                  </Button>
                </CardContent>
              </Card>
            )}

            {previousAnalyses.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  Previous AI Analyses for {selectedCompany?.name}
                </h3>
                {previousAnalyses.map((analysis) => (
                  <Card
                    key={analysis.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Brain className="h-5 w-5 text-purple-600" />
                            AI Analysis #{analysis.id}
                            {analysis.analysis_type && (
                              <Badge variant="outline" className="text-xs">
                                {analysis.analysis_type}
                              </Badge>
                            )}
                          </CardTitle>
                          <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                            <Calendar className="h-4 w-4" />
                            Generated on{" "}
                            {new Date(
                              analysis.created_at
                            ).toLocaleDateString()}{" "}
                            at{" "}
                            {new Date(analysis.created_at).toLocaleTimeString()}
                            {analysis.model_version && (
                              <Badge variant="outline" className="text-xs ml-2">
                                {analysis.model_version}
                              </Badge>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-emerald-100 text-emerald-800">
                            {analysis.analysis_results?.fitScore ||
                              analysis.confidence_score}
                            % Match
                          </Badge>
                          <Badge variant="outline">
                            {analysis.analysis_results?.overallFit || "Unknown"}{" "}
                            Fit
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-sm font-medium">Solutions</p>
                          <p className="text-sm text-slate-600">
                            {analysis.analysis_results?.recommendedSolutions
                              ?.length || 0}{" "}
                            recommended
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Success Factors</p>
                          <p className="text-sm text-slate-600">
                            {analysis.analysis_results?.keySuccessFactors
                              ?.length || 0}{" "}
                            identified
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Challenges</p>
                          <p className="text-sm text-slate-600">
                            {analysis.analysis_results?.businessChallenges
                              ?.length || 0}{" "}
                            identified
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Risk Factors</p>
                          <p className="text-sm text-slate-600">
                            {analysis.analysis_results?.riskFactors?.length ||
                              0}{" "}
                            identified
                          </p>
                        </div>
                      </div>

                      {/* Enhanced preview for comprehensive analysis */}
                      {analysis.analysis_results?.businessCase && (
                        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <h5 className="font-medium text-blue-900 mb-2">
                            Business Case Summary
                          </h5>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-blue-700">
                                Investment:{" "}
                              </span>
                              <span className="font-medium">
                                {formatLargeCurrency(
                                  analysis.analysis_results.businessCase
                                    .totalInvestment
                                )}
                              </span>
                            </div>
                            <div>
                              <span className="text-blue-700">Savings: </span>
                              <span className="font-medium">
                                {formatLargeCurrency(
                                  analysis.analysis_results.businessCase
                                    .projectedSavings
                                )}
                              </span>
                            </div>
                            <div>
                              <span className="text-blue-700">Payback: </span>
                              <span className="font-medium">
                                {
                                  analysis.analysis_results.businessCase
                                    .paybackPeriod
                                }
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          onClick={() => loadPreviousAnalysis(analysis)}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Full Analysis
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="mr-2 h-4 w-4" />
                          Export Report
                        </Button>
                        {analysis.analysis_results?.businessCase && (
                          <Button size="sm" variant="outline">
                            <PieChart className="mr-2 h-4 w-4" />
                            Business Case
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* No Company Selected State */}
      {!selectedCompany && companies.length > 0 && !loading && (
        <Card>
          <CardContent className="text-center py-12">
            <Brain className="h-12 w-12 text-purple-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Select a Company for Comprehensive Analysis
            </h3>
            <p className="text-slate-600">
              Choose a company from the dropdown above to generate comprehensive
              AI-powered SAP analysis with business case development,
              implementation roadmap, and competitive analysis.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
