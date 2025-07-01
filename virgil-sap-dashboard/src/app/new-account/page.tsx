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
import { Bot, Building2, Sparkles } from "lucide-react"

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

const sapModules = [
  "S/4HANA",
  "Ariba",
  "SuccessFactors",
  "Concur",
  "SAP Analytics Cloud",
  "SAP Commerce Cloud",
  "SAP Customer Experience",
  "SAP Fieldglass",
]

export default function NewAccount() {
  const [formData, setFormData] = useState({
    companyName: "",
    industry: "",
    size: "",
    challenges: "",
    region: "",
  })
  const [suggestedModules, setSuggestedModules] = useState<string[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState("")

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    // Auto-suggest SAP modules based on industry
    if (field === "industry" && value) {
      const suggestions = getSuggestedModules(value)
      setSuggestedModules(suggestions)
    }
  }

  const getSuggestedModules = (industry: string): string[] => {
    const moduleMap: Record<string, string[]> = {
      Manufacturing: ["S/4HANA", "SAP Analytics Cloud", "Ariba"],
      Retail: ["SAP Commerce Cloud", "S/4HANA", "SAP Customer Experience"],
      "Financial Services": ["S/4HANA", "SAP Analytics Cloud", "Concur"],
      Healthcare: ["SuccessFactors", "S/4HANA", "SAP Analytics Cloud"],
      Technology: ["SuccessFactors", "Concur", "SAP Analytics Cloud"],
      "Energy & Utilities": ["S/4HANA", "SAP Analytics Cloud", "Ariba"],
      Government: ["S/4HANA", "SuccessFactors", "Concur"],
      Education: ["SuccessFactors", "Concur", "S/4HANA"],
    }
    return moduleMap[industry] || []
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsAnalyzing(true)

    // Simulate GPT analysis
    setTimeout(() => {
      setAnalysisResult(
        `Based on the information provided for ${formData.companyName}, this ${formData.industry.toLowerCase()} company appears to be a strong candidate for SAP solutions. Key recommendations include implementing ${suggestedModules.slice(0, 2).join(" and ")} to address their ${formData.challenges.toLowerCase()} challenges. The ${formData.size.toLowerCase()} size suggests they would benefit from a phased implementation approach.`,
      )
      setIsAnalyzing(false)
    }, 2000)
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">New Account Intake</h1>
          <p className="text-gray-600">Capture prospect information for AI-powered analysis</p>
        </div>
      </div>

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
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange("companyName", e.target.value)}
                  placeholder="Enter company name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="industry">Industry</Label>
                <Select onValueChange={(value) => handleInputChange("industry", value)}>
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
                <Label htmlFor="size">Company Size</Label>
                <Select onValueChange={(value) => handleInputChange("size", value)}>
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
                <Label htmlFor="region">Region</Label>
                <Select onValueChange={(value) => handleInputChange("region", value)}>
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

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isAnalyzing}>
                {isAnalyzing ? (
                  <>
                    <Bot className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Analyze with AI
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
                <div className="flex flex-wrap gap-2">
                  {suggestedModules.map((module) => (
                    <Badge key={module} className="bg-green-100 text-green-800">
                      {module}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-gray-600 mt-2">Based on the selected industry: {formData.industry}</p>
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
                <p className="text-gray-700 leading-relaxed">{analysisResult}</p>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    Generate Fit Analysis
                  </Button>
                  <Button size="sm" variant="outline">
                    Create Deck
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
