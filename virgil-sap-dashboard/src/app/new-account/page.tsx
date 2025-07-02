"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Bot, Building2, Sparkles, CheckCircle, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"

const industries = [
  "Manufacturing",
  "Retail",
  "Financial Services",
  "Healthcare",
  "Technology",
  "Energy & Utilities",
  "Government",
  "Education",
]

const companySizes = [
  "Small (1-100 employees)",
  "Medium (101-1000 employees)",
  "Large (1001-5000 employees)",
  "Enterprise (5000+ employees)",
]

const regions = ["North America", "Europe", "Asia Pacific", "Latin America", "Middle East & Africa"]

interface SAPProduct {
  id: number
  product_name: string
  product_category: string
  description: string
}

export default function NewAccount() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    companyName: "",
    industry: "",
    size: "",
    challenges: "",
    region: "",
  })

  const [suggestedModules, setSuggestedModules] = useState<SAPProduct[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [createdCompanyId, setCreatedCompanyId] = useState<number | null>(null)

  const handleInputChange = async (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError("") // Clear any previous errors

    // Auto-suggest SAP modules based on industry
    if (field === "industry" && value) {
      try {
        const response = await fetch(`/api/sap-products?industry=${encodeURIComponent(value)}`)
        if (response.ok) {
          const products = await response.json()
          setSuggestedModules(products.slice(0, 3)) // Show top 3 suggestions
        }
      } catch (err) {
        console.error("Failed to fetch SAP products:", err)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")
    setSuccess("")

    try {
      // Validate form data
      if (!formData.companyName || !formData.industry || !formData.size || !formData.region) {
        throw new Error("Please fill in all required fields")
      }

      // Submit company data to database
      const response = await fetch("/api/companies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.companyName,
          industry: formData.industry,
          company_size: formData.size,
          region: formData.region,
          business_challenges: formData.challenges,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create company")
      }

      const newCompany = await response.json()
      setCreatedCompanyId(newCompany.id)
      setSuccess(`Successfully created account for ${formData.companyName}!`)

      // Clear form
      setFormData({
        companyName: "",
        industry: "",
        size: "",
        challenges: "",
        region: "",
      })
      setSuggestedModules([])
      setAnalysisResult("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAIAnalysis = async () => {
    if (!createdCompanyId) {
      setError("Please save the company first before running AI analysis")
      return
    }

    setIsAnalyzing(true)
    setError("")

    try {
      const response = await fetch("/api/ai-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyId: createdCompanyId,
          analysisData: formData,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate AI analysis")
      }

      const { analysis } = await response.json()

      setAnalysisResult(
        `AI Analysis Results for ${formData.companyName || "this company"}:
        
• Overall SAP Fit: ${analysis.overallFit} (${analysis.fitScore}% match)
• Estimated ROI: ${analysis.estimatedROI}%
• Implementation Timeline: ${analysis.implementationTime}
• Key Recommendations: ${analysis.recommendations.join(", ")}

This analysis suggests strong potential for SAP solutions with a phased implementation approach.`,
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate analysis")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleCreateDeal = () => {
    if (createdCompanyId) {
      router.push(`/pipeline?newDeal=true&companyId=${createdCompanyId}`)
    }
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">New Account Intake</h1>
          <p className="text-gray-600">Capture prospect information and save to database</p>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange("companyName", e.target.value)}
                  placeholder="Enter company name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="industry">Industry *</Label>
                <Select onValueChange={(value) => handleInputChange("industry", value)} value={formData.industry}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map((industry) => (
                      <SelectItem key={industry} value={industry}>
                        {industry}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="size">Company Size *</Label>
                <Select onValueChange={(value) => handleInputChange("size", value)} value={formData.size}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select company size" />
                  </SelectTrigger>
                  <SelectContent>
                    {companySizes.map((size) => (
                      <SelectItem key={size} value={size}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="region">Region *</Label>
                <Select onValueChange={(value) => handleInputChange("region", value)} value={formData.region}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map((region) => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="challenges">Business Challenges</Label>
                <Textarea
                  id="challenges"
                  value={formData.challenges}
                  onChange={(e) => handleInputChange("challenges", e.target.value)}
                  placeholder="Describe the main business challenges they're facing..."
                  rows={4}
                />
              </div>

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Bot className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Building2 className="mr-2 h-4 w-4" />
                    Save Account
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {suggestedModules.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-green-700">Suggested SAP Modules</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {suggestedModules.map((module) => (
                    <div key={module.id} className="p-3 border border-green-200 rounded-lg bg-green-50">
                      <div className="flex items-center justify-between mb-2">
                        <Badge className="bg-green-100 text-green-800">{module.product_name}</Badge>
                        <span className="text-xs text-green-600">{module.product_category}</span>
                      </div>
                      <p className="text-sm text-gray-700">{module.description}</p>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-600 mt-3">
                  Based on the selected industry: <strong>{formData.industry}</strong>
                </p>
              </CardContent>
            </Card>
          )}

          {createdCompanyId && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-blue-600" />
                  Next Steps
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={handleAIAnalysis}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <>
                      <Bot className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Run AI Analysis
                    </>
                  )}
                </Button>

                <Button onClick={handleCreateDeal} variant="outline" className="w-full bg-transparent">
                  Create Deal Opportunity
                </Button>
              </CardContent>
            </Card>
          )}

          {analysisResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-blue-600" />
                  AI Analysis Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <pre className="text-sm text-blue-900 whitespace-pre-wrap font-sans">{analysisResult}</pre>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={handleCreateDeal}>
                    Create Deal
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => router.push("/analyzer")}>
                    View Full Analysis
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
