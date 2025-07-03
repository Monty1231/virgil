"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  FileText,
  Download,
  Edit,
  Eye,
  Presentation,
  Sparkles,
  ImageIcon,
  Bot,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Brain,
  Wand2,
  Plus,
  Trash2,
} from "lucide-react"

interface Company {
  id: number
  name: string
  industry: string
  company_size: string
}

interface AIAnalysis {
  id: number
  company_id: number
  company_name: string
  industry: string
  company_size: string
  analysis_results: {
    fitScore: number
    overallFit: string
    keySuccessFactors: string[]
    businessChallenges: string[]
    recommendedSolutions: Array<{
      module: string
      fit: string
      priority: number
      estimatedROI: number
      timeToValue: string
      estimatedCostMin: number
      estimatedCostMax: number
      keyBenefits: string[]
      implementationComplexity: string
    }>
    nextSteps: string[]
    riskFactors: string[]
  }
  confidence_score: number
  created_at: string
}

interface Slide {
  id: number
  title: string
  content: string
  type: string
  order: number
}

const slideTemplates = [
  { type: "title", name: "Title Slide", icon: Presentation },
  { type: "executive_summary", name: "Executive Summary", icon: FileText },
  { type: "current_state", name: "Current State Analysis", icon: AlertCircle },
  { type: "business_challenges", name: "Business Challenges", icon: AlertCircle },
  { type: "recommended_solutions", name: "Recommended Solutions", icon: Sparkles },
  { type: "solution_details", name: "Solution Details", icon: FileText },
  { type: "benefits_roi", name: "Benefits & ROI", icon: CheckCircle },
  { type: "implementation_roadmap", name: "Implementation Roadmap", icon: FileText },
  { type: "investment_summary", name: "Investment Summary", icon: FileText },
  { type: "next_steps", name: "Next Steps", icon: CheckCircle },
]

export default function Decks() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [aiAnalyses, setAiAnalyses] = useState<AIAnalysis[]>([])
  const [selectedCompany, setSelectedCompany] = useState("")
  const [selectedAnalysis, setSelectedAnalysis] = useState<AIAnalysis | null>(null)
  const [slides, setSlides] = useState<Slide[]>([])
  const [editingSlide, setEditingSlide] = useState<number | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deckMode, setDeckMode] = useState<"manual" | "ai">("manual")

  // Form data for manual deck creation
  const [deckConfig, setDeckConfig] = useState({
    deckName: "",
    presenterName: "Sarah Johnson",
    presentationDate: new Date().toISOString().split("T")[0],
    targetCompany: "",
    additionalNotes: "",
  })

  useEffect(() => {
    fetchCompanies()
    fetchAIAnalyses()
  }, [])

  useEffect(() => {
    if (selectedCompany) {
      fetchAIAnalyses(selectedCompany)
    }
  }, [selectedCompany])

  const fetchCompanies = async () => {
    try {
      const response = await fetch("/api/companies")
      if (response.ok) {
        const data = await response.json()
        setCompanies(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("Failed to fetch companies:", error)
    }
  }

  const fetchAIAnalyses = async (companyId?: string) => {
    setLoading(true)
    setError(null)

    try {
      // First try to get existing analyses from the database
      const url = companyId ? `/api/ai-analyses?companyId=${companyId}` : "/api/ai-analyses"
      console.log("📊 Fetching AI analyses from:", url)

      const response = await fetch(url)
      console.log("📊 AI analyses response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("📊 AI analyses raw data:", data)

        if (Array.isArray(data)) {
          // Validate and clean the data
          const validAnalyses = data
            .map((analysis) => {
              console.log("📊 Processing analysis:", analysis.id, "for company:", analysis.company_name)
              console.log("📊 Analysis results type:", typeof analysis.analysis_results)

              // Ensure analysis_results is properly parsed
              let analysisResults = analysis.analysis_results
              if (typeof analysisResults === "string") {
                try {
                  analysisResults = JSON.parse(analysisResults)
                  console.log("📊 Parsed analysis results:", analysisResults)
                } catch (parseError) {
                  console.error("📊 Failed to parse analysis_results JSON:", parseError)
                  analysisResults = null
                }
              }

              return {
                ...analysis,
                analysis_results: analysisResults,
              }
            })
            .filter((analysis) => analysis.analysis_results !== null)

          setAiAnalyses(validAnalyses)
          console.log("📊 Set", validAnalyses.length, "valid analyses")
        } else {
          console.error("📊 AI analyses response is not an array:", data)
          setAiAnalyses([])
          if (data.error) {
            setError(data.error)
          }
        }
      } else {
        // If no existing analyses found and we have a specific company, show option to generate
        if (companyId && (response.status === 404 || response.status === 500)) {
          console.log("📊 No existing analyses found for company:", companyId)
          setAiAnalyses([])
        } else {
          const contentType = response.headers.get("content-type")
          if (contentType && contentType.includes("text/html")) {
            console.error("📊 Received HTML error page instead of JSON")
            throw new Error(`API endpoint not found (${response.status}). The /api/ai-analyses route may not exist.`)
          } else {
            const errorText = await response.text()
            console.error("📊 AI analyses error response:", errorText)
            throw new Error(`Failed to fetch analyses: ${response.status}`)
          }
        }
      }
    } catch (error) {
      console.error("📊 Failed to fetch AI analyses:", error)
      setError(`Failed to load AI analyses: ${error instanceof Error ? error.message : "Unknown error"}`)
      setAiAnalyses([])
    } finally {
      setLoading(false)
    }
  }

  const generateNewAnalysis = async (companyId: string) => {
    try {
      console.log("🤖 Generating new AI analysis for company:", companyId)
      setError(null)
      setLoading(true)

      const response = await fetch(`/api/ai-analysis/company/${companyId}`)
      console.log("🤖 AI analysis generation response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("🤖 Generated analysis data:", data)

        // Convert the generated analysis to our expected format
        if (data.analysis && data.company) {
          const formattedAnalysis: AIAnalysis = {
            id: Date.now(), // Temporary ID
            company_id: Number.parseInt(companyId),
            company_name: data.company.name,
            industry: data.company.industry,
            company_size: data.company.company_size,
            analysis_results: data.analysis,
            confidence_score: data.analysis.fitScore || 0,
            created_at: data.generatedAt || new Date().toISOString(),
          }

          setAiAnalyses([formattedAnalysis])
          console.log("🤖 Set generated analysis")
        }
      } else {
        const errorData = await response.json()
        console.error("🤖 Failed to generate analysis:", errorData)
        setError(`Failed to generate analysis: ${errorData.error || "Unknown error"}`)
      }
    } catch (error) {
      console.error("🤖 Error generating analysis:", error)
      setError(`Failed to generate analysis: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setLoading(false)
    }
  }

  const generateDeckFromAI = async (analysis: AIAnalysis) => {
    setIsGenerating(true)
    setError(null)

    try {
      console.log("🎯 Generating deck from AI analysis:", analysis.company_name)
      console.log("🎯 Analysis data structure:", analysis)

      // Check if analysis_results exists and has the expected structure
      if (!analysis.analysis_results) {
        console.error("🎯 No analysis_results found in:", analysis)
        throw new Error("Analysis data is incomplete - missing analysis_results")
      }

      const analysisData = analysis.analysis_results
      console.log("🎯 Analysis results:", analysisData)

      // Validate required fields with defaults
      const fitScore = analysisData.fitScore || 75
      const overallFit = analysisData.overallFit || "Medium"
      const keySuccessFactors = analysisData.keySuccessFactors || [
        "Digital transformation opportunity",
        "Industry alignment with SAP solutions",
      ]
      const businessChallenges = analysisData.businessChallenges || [
        "Legacy system modernization",
        "Process optimization needs",
      ]
      const recommendedSolutions = analysisData.recommendedSolutions || []
      const nextSteps = analysisData.nextSteps || ["Schedule executive briefing", "Conduct detailed needs assessment"]

      const generatedSlides: Slide[] = []
      let slideId = 1

      // Title Slide
      generatedSlides.push({
        id: slideId++,
        title: "Executive Presentation",
        content: `SAP Digital Transformation Proposal for ${analysis.company_name}

Presented by: ${deckConfig.presenterName}
Date: ${deckConfig.presentationDate}

Transforming ${analysis.industry || "Business"} Operations with SAP Solutions`,
        type: "title",
        order: 1,
      })

      // Executive Summary
      generatedSlides.push({
        id: slideId++,
        title: "Executive Summary",
        content: `• ${analysis.company_name} shows ${overallFit} fit for SAP solutions (${fitScore}% match)
• ${analysis.industry || "Industry"} leader with ${analysis.company_size || "enterprise"} scale
• Key opportunity areas identified through AI-powered analysis
• Recommended phased implementation approach
• Estimated ROI: ${recommendedSolutions[0]?.estimatedROI || 300}%+ over 3 years`,
        type: "executive_summary",
        order: 2,
      })

      // Business Challenges
      if (businessChallenges.length > 0) {
        generatedSlides.push({
          id: slideId++,
          title: "Current Business Challenges",
          content: businessChallenges.map((challenge) => `• ${challenge}`).join("\n"),
          type: "business_challenges",
          order: 3,
        })
      }

      // Recommended Solutions
      if (recommendedSolutions.length > 0) {
        const topSolutions = recommendedSolutions.sort((a, b) => (a.priority || 1) - (b.priority || 1)).slice(0, 3)

        generatedSlides.push({
          id: slideId++,
          title: "AI-Recommended SAP Solutions",
          content: topSolutions
            .map(
              (solution) =>
                `• SAP ${solution.module || "Solution"} - ${solution.fit || "High"} Fit
  - ROI: ${solution.estimatedROI || 300}%
  - Time to Value: ${solution.timeToValue || "12-18 months"}
  - Investment: $${((solution.estimatedCostMin || 500000) / 1000).toFixed(0)}K - $${((solution.estimatedCostMax || 1000000) / 1000).toFixed(0)}K`,
            )
            .join("\n\n"),
          type: "recommended_solutions",
          order: 4,
        })

        // Individual solution slides for top 2 solutions
        topSolutions.slice(0, 2).forEach((solution, index) => {
          generatedSlides.push({
            id: slideId++,
            title: `SAP ${solution.module || "Solution"} Details`,
            content: `Implementation Complexity: ${solution.implementationComplexity || "Medium"}
Time to Value: ${solution.timeToValue || "12-18 months"}
Estimated ROI: ${solution.estimatedROI || 300}%

Key Benefits:
${(solution.keyBenefits || ["Process optimization", "Enhanced efficiency", "Cost reduction"]).map((benefit) => `• ${benefit}`).join("\n")}

Investment Range: $${((solution.estimatedCostMin || 500000) / 1000).toFixed(0)}K - $${((solution.estimatedCostMax || 1000000) / 1000).toFixed(0)}K`,
            type: "solution_details",
            order: 5 + index,
          })
        })
      } else {
        // Add a default solutions slide if no recommendations exist
        generatedSlides.push({
          id: slideId++,
          title: "Recommended SAP Solutions",
          content: `Based on ${analysis.company_name}'s profile:

• SAP S/4HANA - Core ERP Platform
  - Comprehensive business process management
  - Real-time analytics and reporting
  - Investment: $750K - $1.5M

• SAP Ariba - Procurement Excellence  
  - Supplier management and sourcing
  - Contract lifecycle management
  - Investment: $200K - $500K

• SAP Analytics Cloud - Business Intelligence
  - Advanced analytics and planning
  - Predictive insights
  - Investment: $150K - $400K`,
          type: "recommended_solutions",
          order: 4,
        })
      }

      // Benefits & ROI Summary
      const avgROI =
        recommendedSolutions.length > 0
          ? recommendedSolutions.reduce((sum, sol) => sum + (sol.estimatedROI || 300), 0) / recommendedSolutions.length
          : 300

      generatedSlides.push({
        id: slideId++,
        title: "Business Benefits & ROI",
        content: `Expected Business Outcomes:

Financial Impact:
• Average ROI: ${Math.round(avgROI)}% over 3 years
• Payback period: 18-24 months
• Cost optimization opportunities identified

Operational Benefits:
${keySuccessFactors.map((factor) => `• ${factor}`).join("\n")}

Strategic Advantages:
• Enhanced competitive positioning
• Improved operational efficiency
• Future-ready technology foundation`,
        type: "benefits_roi",
        order: 7,
      })

      // Implementation Roadmap
      generatedSlides.push({
        id: slideId++,
        title: "Recommended Implementation Roadmap",
        content: `Phase 1: Foundation (Months 1-6)
• Core system implementation
• Data migration and integration
• Initial user training

Phase 2: Optimization (Months 7-12)
• Process refinement
• Advanced feature rollout
• Performance optimization

Phase 3: Innovation (Months 13-18)
• Advanced analytics implementation
• Integration with emerging technologies
• Continuous improvement processes

Success Factors:
• Executive sponsorship and change management
• Dedicated project team
• Phased rollout approach`,
        type: "implementation_roadmap",
        order: 8,
      })

      // Next Steps
      generatedSlides.push({
        id: slideId++,
        title: "Recommended Next Steps",
        content: nextSteps.map((step) => `• ${step}`).join("\n"),
        type: "next_steps",
        order: 9,
      })

      setSlides(generatedSlides)
      setSelectedAnalysis(analysis)

      // Update deck config
      setDeckConfig((prev) => ({
        ...prev,
        deckName: `${analysis.company_name} SAP Transformation Proposal`,
        targetCompany: analysis.company_name,
      }))

      console.log("🎯 Generated", generatedSlides.length, "slides from AI analysis")
    } catch (error) {
      console.error("🎯 Failed to generate deck:", error)
      setError(`Failed to generate deck: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const addManualSlide = (templateType: string) => {
    const template = slideTemplates.find((t) => t.type === templateType)
    if (!template) return

    const newSlide: Slide = {
      id: Date.now(),
      title: template.name,
      content: getTemplateContent(templateType),
      type: templateType,
      order: slides.length + 1,
    }

    setSlides([...slides, newSlide])
  }

  const getTemplateContent = (type: string): string => {
    switch (type) {
      case "title":
        return `${deckConfig.deckName || "SAP Solutions Presentation"}

Presented by: ${deckConfig.presenterName}
Date: ${deckConfig.presentationDate}
Company: ${deckConfig.targetCompany || "[Company Name]"}`

      case "executive_summary":
        return `• [Company] digital transformation opportunity
• Key business challenges and objectives
• Recommended SAP solution approach
• Expected business outcomes and ROI
• Implementation timeline and next steps`

      case "current_state":
        return `Current State Analysis:

• Legacy systems and processes
• Business challenges and pain points
• Technology gaps and limitations
• Operational inefficiencies
• Compliance and risk considerations`

      case "business_challenges":
        return `Key Business Challenges:

• [Challenge 1]
• [Challenge 2]
• [Challenge 3]
• [Challenge 4]

Impact on Business:
• [Impact description]`

      case "recommended_solutions":
        return `Recommended SAP Solutions:

• SAP S/4HANA - Core ERP Platform
• SAP Ariba - Procurement Excellence
• SAP SuccessFactors - Human Capital Management
• SAP Analytics Cloud - Business Intelligence

Strategic Fit: [High/Medium/Low]`

      case "benefits_roi":
        return `Expected Business Benefits:

Financial Impact:
• ROI: [X]% over 3 years
• Cost savings: $[X]M annually
• Revenue opportunities: $[X]M

Operational Benefits:
• Process efficiency improvements
• Enhanced decision-making capabilities
• Improved compliance and risk management`

      case "implementation_roadmap":
        return `Implementation Roadmap:

Phase 1: Foundation (Months 1-6)
• [Key activities]

Phase 2: Expansion (Months 7-12)
• [Key activities]

Phase 3: Optimization (Months 13-18)
• [Key activities]`

      case "investment_summary":
        return `Investment Summary:

Software Licenses: $[X]
Implementation Services: $[X]
Training & Change Management: $[X]
Infrastructure: $[X]

Total Investment: $[X]
Expected ROI: [X]% over 3 years`

      case "next_steps":
        return `Recommended Next Steps:

• Executive alignment and sponsorship
• Detailed requirements gathering
• Solution demonstration and proof of concept
• Project planning and resource allocation
• Contract negotiation and finalization

Timeline: [X] weeks to project kickoff`

      default:
        return "• [Add your content here]\n• [Bullet point 2]\n• [Bullet point 3]"
    }
  }

  const handleEditSlide = (slideId: number, newContent: string) => {
    setSlides(slides.map((slide) => (slide.id === slideId ? { ...slide, content: newContent } : slide)))
    setEditingSlide(null)
  }

  const deleteSlide = (slideId: number) => {
    setSlides(slides.filter((slide) => slide.id !== slideId))
  }

  const moveSlide = (slideId: number, direction: "up" | "down") => {
    const slideIndex = slides.findIndex((slide) => slide.id === slideId)
    if (slideIndex === -1) return

    const newSlides = [...slides]
    if (direction === "up" && slideIndex > 0) {
      ;[newSlides[slideIndex], newSlides[slideIndex - 1]] = [newSlides[slideIndex - 1], newSlides[slideIndex]]
    } else if (direction === "down" && slideIndex < slides.length - 1) {
      ;[newSlides[slideIndex], newSlides[slideIndex + 1]] = [newSlides[slideIndex + 1], newSlides[slideIndex]]
    }

    // Update order numbers
    newSlides.forEach((slide, index) => {
      slide.order = index + 1
    })

    setSlides(newSlides)
  }

  const getSlideIcon = (type: string) => {
    const template = slideTemplates.find((t) => t.type === type)
    return template?.icon || FileText
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AI-Powered Deck Generator</h1>
            <p className="text-gray-600">Create presentations from AI analysis or build manually</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Deck Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Presentation className="h-5 w-5 text-blue-600" />
              Deck Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Mode Selection */}
            <div>
              <Label>Creation Mode</Label>
              <div className="flex gap-2 mt-2">
                <Button
                  variant={deckMode === "manual" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDeckMode("manual")}
                  className={deckMode === "manual" ? "bg-blue-600 hover:bg-blue-700" : "bg-transparent"}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Manual
                </Button>
                <Button
                  variant={deckMode === "ai" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDeckMode("ai")}
                  className={deckMode === "ai" ? "bg-purple-600 hover:bg-purple-700" : "bg-transparent"}
                >
                  <Brain className="mr-2 h-4 w-4" />
                  AI-Powered
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="deckName">Deck Name</Label>
              <Input
                id="deckName"
                value={deckConfig.deckName}
                onChange={(e) => setDeckConfig((prev) => ({ ...prev, deckName: e.target.value }))}
                placeholder="Enter deck name"
              />
            </div>

            <div>
              <Label htmlFor="presenter">Presenter Name</Label>
              <Input
                id="presenter"
                value={deckConfig.presenterName}
                onChange={(e) => setDeckConfig((prev) => ({ ...prev, presenterName: e.target.value }))}
                placeholder="Your name"
              />
            </div>

            <div>
              <Label htmlFor="date">Presentation Date</Label>
              <Input
                id="date"
                type="date"
                value={deckConfig.presentationDate}
                onChange={(e) => setDeckConfig((prev) => ({ ...prev, presentationDate: e.target.value }))}
              />
            </div>

            {deckMode === "ai" && (
              <>
                <div>
                  <Label htmlFor="company">Target Company</Label>
                  <Select onValueChange={setSelectedCompany} value={selectedCompany}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select company" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id.toString()}>
                          {company.name} ({company.industry})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedCompany && (
                  <div>
                    <Label>Available AI Analyses</Label>

                    {loading ? (
                      <div className="flex items-center gap-2 text-sm text-blue-600 mt-2">
                        <RefreshCw className="h-3 w-3 animate-spin" />
                        Loading analyses...
                      </div>
                    ) : aiAnalyses.length === 0 ? (
                      <div className="text-sm text-gray-500 mt-2">
                        <p>No existing AI analyses found for this company.</p>
                        <Button
                          size="sm"
                          onClick={() => generateNewAnalysis(selectedCompany)}
                          className="mt-2 bg-purple-600 hover:bg-purple-700"
                          disabled={loading}
                        >
                          <Brain className="mr-2 h-3 w-3" />
                          {loading ? "Generating..." : "Generate New Analysis"}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2 mt-2">
                        {aiAnalyses.map((analysis) => (
                          <div
                            key={analysis.id}
                            className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                            onClick={() => generateDeckFromAI(analysis)}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-sm">{analysis.company_name}</p>
                                <p className="text-xs text-gray-500">
                                  {analysis.analysis_results?.overallFit || "Unknown"} Fit •{" "}
                                  {analysis.analysis_results?.fitScore || 0}% Match
                                </p>
                                <p className="text-xs text-gray-400">
                                  Created: {new Date(analysis.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              <Badge className="bg-purple-100 text-purple-800">
                                <Wand2 className="h-3 w-3 mr-1" />
                                Generate
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {deckMode === "manual" && (
              <>
                <div>
                  <Label htmlFor="targetCompany">Target Company</Label>
                  <Input
                    id="targetCompany"
                    value={deckConfig.targetCompany}
                    onChange={(e) => setDeckConfig((prev) => ({ ...prev, targetCompany: e.target.value }))}
                    placeholder="Company name"
                  />
                </div>

                <div>
                  <Label>Add Slide Template</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {slideTemplates.map((template) => (
                      <Button
                        key={template.type}
                        variant="outline"
                        size="sm"
                        onClick={() => addManualSlide(template.type)}
                        className="justify-start text-xs bg-transparent"
                      >
                        <template.icon className="mr-1 h-3 w-3" />
                        {template.name}
                      </Button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div>
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={deckConfig.additionalNotes}
                onChange={(e) => setDeckConfig((prev) => ({ ...prev, additionalNotes: e.target.value }))}
                placeholder="Any specific points to emphasize..."
                rows={3}
              />
            </div>

            {deckMode === "manual" && (
              <Button
                onClick={() => {
                  // Generate a basic manual deck
                  addManualSlide("title")
                  addManualSlide("executive_summary")
                  addManualSlide("current_state")
                  addManualSlide("recommended_solutions")
                  addManualSlide("benefits_roi")
                  addManualSlide("next_steps")
                }}
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Basic Deck
                  </>
                )}
              </Button>
            )}

            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">Export Options</h4>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                  <ImageIcon className="mr-2 h-4 w-4" />
                  Google Slides
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                  <FileText className="mr-2 h-4 w-4" />
                  PowerPoint
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                  <Download className="mr-2 h-4 w-4" />
                  PDF
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Slide Editor */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              Slide Preview & Editor
              {selectedAnalysis && (
                <Badge className="bg-purple-100 text-purple-800">
                  <Bot className="h-3 w-3 mr-1" />
                  AI Generated
                </Badge>
              )}
            </h2>
            <Badge className="bg-green-100 text-green-800">{slides.length} slides</Badge>
          </div>

          {isGenerating && (
            <Card>
              <CardContent className="text-center py-12">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <Brain className="h-12 w-12 text-purple-600 animate-pulse" />
                    <Sparkles className="h-6 w-6 text-yellow-500 absolute -top-1 -right-1 animate-bounce" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Generating AI-Powered Deck</h3>
                    <p className="text-gray-600">Creating presentation slides from AI analysis data...</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {slides.length === 0 && !isGenerating && (
            <Card className="border-dashed border-2 border-gray-300">
              <CardContent className="text-center py-12">
                <Presentation className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Slides Created Yet</h3>
                <p className="text-gray-600 mb-4">
                  {deckMode === "ai"
                    ? "Select a company and AI analysis to auto-generate slides"
                    : "Add slide templates or create a basic deck to get started"}
                </p>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {slides.map((slide, index) => {
              const SlideIcon = getSlideIcon(slide.type)
              return (
                <Card key={slide.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <SlideIcon className="h-4 w-4" />
                        <CardTitle className="text-lg">
                          Slide {index + 1}: {slide.title}
                        </CardTitle>
                        {slide.type && (
                          <Badge variant="outline" className="text-xs">
                            {slideTemplates.find((t) => t.type === slide.type)?.name || slide.type}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveSlide(slide.id, "up")}
                          disabled={index === 0}
                        >
                          ↑
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveSlide(slide.id, "down")}
                          disabled={index === slides.length - 1}
                        >
                          ↓
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingSlide(editingSlide === slide.id ? null : slide.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteSlide(slide.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {editingSlide === slide.id ? (
                      <div className="space-y-3">
                        <Input
                          value={slide.title}
                          onChange={(e) =>
                            setSlides(slides.map((s) => (s.id === slide.id ? { ...s, title: e.target.value } : s)))
                          }
                          placeholder="Slide title"
                          className="font-semibold"
                        />
                        <Textarea
                          value={slide.content}
                          onChange={(e) => handleEditSlide(slide.id, e.target.value)}
                          rows={8}
                          className="font-mono text-sm"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleEditSlide(slide.id, slide.content)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingSlide(null)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-200">
                        <div className="whitespace-pre-line text-sm text-gray-700">{slide.content}</div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {slides.length > 0 && (
            <Card className="border-dashed border-2 border-gray-300">
              <CardContent className="flex items-center justify-center py-8">
                <div className="flex gap-2">
                  {slideTemplates.map((template) => (
                    <Button
                      key={template.type}
                      variant="outline"
                      size="sm"
                      onClick={() => addManualSlide(template.type)}
                      className="text-gray-600 bg-transparent"
                    >
                      <template.icon className="mr-2 h-4 w-4" />
                      Add {template.name}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
