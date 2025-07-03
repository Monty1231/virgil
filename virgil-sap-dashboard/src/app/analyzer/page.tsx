"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SidebarTrigger } from "@/components/ui/sidebar"
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
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Company {
  id: number
  name: string
  industry: string
  company_size: string
  region: string
  business_challenges?: string
  annual_revenue?: number
  employee_count?: number
}

interface AIAnalysis {
  fitScore: number
  overallFit: string
  keySuccessFactors: string[]
  businessChallenges: string[]
  recommendedSolutions: {
    module: string
    fit: string
    priority: number
    estimatedROI: number
    timeToValue: string
    estimatedCostMin: number
    estimatedCostMax: number
    keyBenefits: string[]
    implementationComplexity: string
  }[]
  nextSteps: string[]
  riskFactors: string[]
}

interface AnalysisResponse {
  company: Company
  analysis: AIAnalysis
  generatedAt: string
}

export default function Analyzer() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("")
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [analysisData, setAnalysisData] = useState<AIAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [analysisError, setAnalysisError] = useState<string | null>(null)

  // Fetch companies when component mounts
  useEffect(() => {
    fetchCompanies()
  }, [])

  // Generate analysis when company is selected
  useEffect(() => {
    if (selectedCompanyId && selectedCompany) {
      generateAnalysis(selectedCompanyId)
    }
  }, [selectedCompanyId])

  const fetchCompanies = async () => {
    setLoading(true)
    setError(null)

    try {
      console.log("🏢 Analyzer: Fetching companies...")

      const response = await fetch("/api/companies", {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache",
        },
      })

      console.log("🏢 Analyzer: Response status:", response.status)
      console.log("🏢 Analyzer: Response headers:", Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorText = await response.text()
        console.error("🏢 Analyzer: Error response:", errorText)
        throw new Error(`Failed to fetch companies: ${response.status} - ${errorText.substring(0, 200)}`)
      }

      const data = await response.json()

      if (Array.isArray(data)) {
        setCompanies(data)
        console.log("🏢 Analyzer: ✅ Successfully loaded", data.length, "companies")

        // Auto-select first company if available
        if (data.length > 0 && !selectedCompanyId) {
          const firstCompany = data[0]
          setSelectedCompanyId(firstCompany.id.toString())
          setSelectedCompany(firstCompany)
        }
      } else {
        setCompanies([])
        setError("Invalid data format received from server")
      }
    } catch (error) {
      console.error("🏢 Analyzer: ❌ Fetch error:", error)
      setError(error instanceof Error ? error.message : "Failed to load companies")
      setCompanies([])
    } finally {
      setLoading(false)
    }
  }

  const generateAnalysis = async (companyId: string) => {
    setAnalyzing(true)
    setAnalysisError(null)
    setAnalysisData(null)

    try {
      console.log("🤖 Analyzer: Generating AI analysis for company ID:", companyId)

      const response = await fetch(`/api/ai-analysis/company/${companyId}`, {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache",
          Accept: "application/json",
        },
      })

      console.log("🤖 Analyzer: AI Analysis response status:", response.status)
      console.log("🤖 Analyzer: AI Analysis response headers:", Object.fromEntries(response.headers.entries()))

      // Check if response is HTML (error page)
      const contentType = response.headers.get("content-type")
      if (contentType && !contentType.includes("application/json")) {
        const htmlContent = await response.text()
        console.error("🤖 Analyzer: Received HTML instead of JSON:", htmlContent.substring(0, 500))
        throw new Error(`Server returned HTML instead of JSON. Status: ${response.status}`)
      }

      if (!response.ok) {
        let errorData
        try {
          errorData = await response.json()
        } catch (parseError) {
          const errorText = await response.text()
          console.error("🤖 Analyzer: Error response (not JSON):", errorText)
          throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 200)}`)
        }

        console.error("🤖 Analyzer: Error response:", errorData)
        throw new Error(errorData.error || errorData.details || `HTTP ${response.status}`)
      }

      let data: AnalysisResponse
      try {
        data = await response.json()
      } catch (parseError) {
        console.error("🤖 Analyzer: Failed to parse JSON response:", parseError)
        const responseText = await response.text()
        console.error("🤖 Analyzer: Raw response:", responseText.substring(0, 500))
        throw new Error("Failed to parse server response as JSON")
      }

      console.log("🤖 Analyzer: ✅ Analysis generated successfully")
      console.log("🤖 Analyzer: Analysis data:", {
        fitScore: data.analysis?.fitScore,
        solutionsCount: data.analysis?.recommendedSolutions?.length,
      })

      setAnalysisData(data.analysis)
    } catch (error) {
      console.error("🤖 Analyzer: ❌ Analysis error:", error)
      setAnalysisError(error instanceof Error ? error.message : "Failed to generate analysis")
    } finally {
      setAnalyzing(false)
    }
  }

  const handleCompanyChange = (companyId: string) => {
    setSelectedCompanyId(companyId)

    const company = companies.find((c) => c.id.toString() === companyId)
    if (company) {
      setSelectedCompany(company)
      console.log("🏢 Analyzer: Selected company:", company.name)
    } else {
      setSelectedCompany(null)
    }
  }

  const getFitColor = (fit: string) => {
    switch (fit) {
      case "Excellent":
        return "bg-green-100 text-green-800"
      case "High":
        return "bg-blue-100 text-blue-800"
      case "Medium":
        return "bg-yellow-100 text-yellow-800"
      case "Low":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case "Low":
        return "text-green-600"
      case "Medium":
        return "text-yellow-600"
      case "High":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AI-Powered Fit & Benefit Analyzer</h1>
            <p className="text-gray-600">OpenAI-generated SAP solution recommendations and analysis</p>
          </div>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Company Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            Select Company for AI Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="flex items-center gap-2 text-blue-600 mb-4">
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
              <Button onClick={fetchCompanies} variant="outline" size="sm" className="mt-2 bg-transparent">
                <RefreshCw className="mr-2 h-3 w-3" />
                Retry
              </Button>
            </div>
          )}

          <div className="space-y-2">
            <Select value={selectedCompanyId} onValueChange={handleCompanyChange} disabled={loading}>
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
                      <p className="text-sm text-gray-500">No companies found</p>
                      <p className="text-xs text-gray-400">Create companies in "New Account" page</p>
                    </div>
                  </SelectItem>
                ) : (
                  companies.map((company) => (
                    <SelectItem key={company.id} value={company.id.toString()}>
                      <div className="flex flex-col py-1">
                        <span className="font-medium">{company.name}</span>
                        <span className="text-xs text-gray-500">
                          {company.industry} • {company.company_size} • {company.region}
                        </span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            {companies.length > 0 && !loading && (
              <p className="text-xs text-green-600">✅ Found {companies.length} companies</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* AI Analysis Loading */}
      {analyzing && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Brain className="h-12 w-12 text-purple-600 animate-pulse" />
                <Sparkles className="h-6 w-6 text-yellow-500 absolute -top-1 -right-1 animate-bounce" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Analysis in Progress</h3>
                <p className="text-gray-600 mb-4">
                  OpenAI is analyzing {selectedCompany?.name} to generate comprehensive SAP fit assessment...
                </p>
                <div className="flex items-center justify-center gap-2 text-sm text-purple-600">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>This may take 10-30 seconds</span>
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
                <h3 className="font-semibold text-red-800">AI Analysis Failed</h3>
              </div>
              <p className="text-red-700 mb-4">{analysisError}</p>

              {/* Helpful debugging info */}
              <div className="bg-red-100 p-3 rounded text-sm text-red-800 mb-4">
                <p>
                  <strong>Troubleshooting steps:</strong>
                </p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Check that OPENAI_API_KEY is set in your .env.local file</li>
                  <li>Verify your OpenAI API key is valid and has credits</li>
                  <li>Check browser console for detailed error logs</li>
                  <li>Ensure DATABASE_URL is properly configured</li>
                </ul>
              </div>

              <Button
                onClick={() => selectedCompanyId && generateAnalysis(selectedCompanyId)}
                variant="outline"
                size="sm"
                className="bg-transparent"
              >
                <RefreshCw className="mr-2 h-3 w-3" />
                Retry Analysis
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Analysis Results */}
      {selectedCompany && analysisData && !analyzing && (
        <>
          {/* Overall Fit Assessment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                AI-Generated SAP Fit Assessment - {selectedCompany.name}
                <Badge className="bg-purple-100 text-purple-800 ml-2">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI Powered
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                      <span className="text-lg font-semibold text-gray-900">{analysisData.overallFit} Fit</span>
                    </div>
                    <Badge className="bg-green-100 text-green-800 text-lg px-3 py-1">
                      {analysisData.fitScore}% Match
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <p>
                      <strong>Industry:</strong> {selectedCompany.industry}
                    </p>
                    <p>
                      <strong>Company Size:</strong> {selectedCompany.company_size}
                    </p>
                    <p>
                      <strong>Region:</strong> {selectedCompany.region}
                    </p>
                    {selectedCompany.employee_count && (
                      <p>
                        <strong>Employees:</strong> {selectedCompany.employee_count.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">AI-Identified Success Factors</h4>
                  <ul className="space-y-1">
                    {analysisData.keySuccessFactors.map((factor, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        {factor}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

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
                {analysisData.businessChallenges.map((challenge, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 p-3 bg-orange-50 rounded-lg border border-orange-200"
                  >
                    <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-orange-800">{challenge}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* AI-Recommended Solutions */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-purple-600" />
              AI-Recommended SAP Solutions
            </h2>
            {analysisData.recommendedSolutions
              .sort((a, b) => a.priority - b.priority)
              .map((solution, index) => (
                <Card key={solution.module}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-xl text-gray-900">SAP {solution.module}</CardTitle>
                        <Badge className={getFitColor(solution.fit)}>{solution.fit} Fit</Badge>
                        <Badge variant="outline" className="text-xs">
                          Priority {solution.priority}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">Complexity</div>
                        <div className={`font-medium ${getComplexityColor(solution.implementationComplexity)}`}>
                          {solution.implementationComplexity}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6 md:grid-cols-3">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="text-sm text-gray-600">AI-Estimated ROI</p>
                            <p className="text-lg font-semibold text-green-600">{solution.estimatedROI}%</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="text-sm text-gray-600">Time to Value</p>
                            <p className="text-lg font-semibold text-blue-600">{solution.timeToValue}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-5 w-5 text-purple-600" />
                          <div>
                            <p className="text-sm text-gray-600">Investment Range</p>
                            <p className="text-lg font-semibold text-purple-600">
                              {formatCurrency(solution.estimatedCostMin)} - {formatCurrency(solution.estimatedCostMax)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <h4 className="font-semibold text-gray-900 mb-3">AI-Identified Key Benefits</h4>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {solution.keyBenefits.map((benefit, benefitIndex) => (
                            <div key={benefitIndex} className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-gray-600">{benefit}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        Generate Proposal
                      </Button>
                      <Button size="sm" variant="outline">
                        Add to Pipeline
                      </Button>
                      <Button size="sm" variant="outline">
                        Schedule Demo
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>

          {/* Risk Factors */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                AI-Identified Risk Factors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-2">
                {analysisData.riskFactors.map((risk, index) => (
                  <div key={index} className="flex items-start gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
                    <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-red-800">{risk}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Users className="h-8 w-8 text-blue-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">AI-Recommended Next Steps</h3>
                  <ul className="space-y-2 mb-4">
                    {analysisData.nextSteps.map((step, index) => (
                      <li key={index} className="flex items-start gap-2 text-blue-800">
                        <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{step}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex gap-2">
                    <Button className="bg-blue-600 hover:bg-blue-700">Create Presentation Deck</Button>
                    <Button variant="outline" className="border-blue-300 text-blue-700 bg-transparent">
                      Schedule Executive Briefing
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* No Company Selected State */}
      {!selectedCompany && companies.length > 0 && !loading && (
        <Card>
          <CardContent className="text-center py-12">
            <Brain className="h-12 w-12 text-purple-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Company for AI Analysis</h3>
            <p className="text-gray-600">
              Choose a company from the dropdown above to generate AI-powered SAP fit analysis and solution
              recommendations using OpenAI.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
