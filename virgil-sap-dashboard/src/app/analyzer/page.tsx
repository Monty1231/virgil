"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { CheckCircle, TrendingUp, DollarSign, Download, Target, Clock, Users } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"

export default function Analyzer() {
  const [selectedCompany, setSelectedCompany] = useState<keyof typeof companyAnalyses>("TechCorp Industries")

  const companyAnalyses = {
    "TechCorp Industries": {
      company: "TechCorp Industries",
      industry: "Manufacturing",
      size: "Large (1001-5000 employees)",
      overallFit: "High",
      fitScore: 85,
      reasons: [
        "Strong digital transformation initiative",
        "Complex supply chain operations",
        "Multiple legacy systems requiring integration",
        "Growing international presence",
      ],
    },
    "RetailMax Solutions": {
      company: "RetailMax Solutions",
      industry: "Retail",
      size: "Medium (101-1000 employees)",
      overallFit: "Excellent",
      fitScore: 92,
      reasons: [
        "Rapid e-commerce growth",
        "Need for omnichannel integration",
        "Customer experience focus",
        "Inventory optimization requirements",
      ],
    },
    "FinanceFirst Bank": {
      company: "FinanceFirst Bank",
      industry: "Financial Services",
      size: "Enterprise (5000+ employees)",
      overallFit: "Medium",
      fitScore: 75,
      reasons: [
        "Regulatory compliance requirements",
        "Risk management needs",
        "Legacy core banking systems",
        "Digital banking transformation",
      ],
    },
  }

  const companySolutions = {
    "TechCorp Industries": [
      {
        module: "S/4HANA",
        fit: "Excellent",
        roi: "320%",
        timeToValue: "12-18 months",
        benefits: [
          "Real-time financial reporting",
          "Streamlined procurement processes",
          "Enhanced inventory management",
          "Improved compliance reporting",
        ],
        estimatedCost: "$750K - $1.2M",
      },
      {
        module: "Ariba",
        fit: "High",
        roi: "280%",
        timeToValue: "6-9 months",
        benefits: [
          "Supplier risk management",
          "Procurement cost reduction",
          "Contract lifecycle management",
          "Spend visibility and control",
        ],
        estimatedCost: "$200K - $400K",
      },
      {
        module: "SuccessFactors",
        fit: "Medium",
        roi: "180%",
        timeToValue: "4-6 months",
        benefits: [
          "Talent management optimization",
          "Performance tracking",
          "Learning and development",
          "Succession planning",
        ],
        estimatedCost: "$150K - $300K",
      },
    ],
    "RetailMax Solutions": [
      {
        module: "Commerce Cloud",
        fit: "Excellent",
        roi: "380%",
        timeToValue: "4-6 months",
        benefits: [
          "Unified e-commerce platform",
          "Personalized customer experiences",
          "Mobile-first design",
          "Integrated inventory management",
        ],
        estimatedCost: "$300K - $500K",
      },
      {
        module: "S/4HANA",
        fit: "High",
        roi: "290%",
        timeToValue: "8-12 months",
        benefits: [
          "Real-time inventory visibility",
          "Streamlined order management",
          "Financial consolidation",
          "Supply chain optimization",
        ],
        estimatedCost: "$400K - $700K",
      },
    ],
    "FinanceFirst Bank": [
      {
        module: "S/4HANA",
        fit: "High",
        roi: "250%",
        timeToValue: "12-18 months",
        benefits: [
          "Regulatory reporting automation",
          "Risk management integration",
          "Real-time financial analytics",
          "Compliance monitoring",
        ],
        estimatedCost: "$1M - $1.5M",
      },
    ],
  }

  const fitAnalysis = companyAnalyses[selectedCompany]
  const recommendedSolutions = companySolutions[selectedCompany] || []

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

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Fit & Benefit Analyzer</h1>
            <p className="text-gray-600">AI-powered SAP solution recommendations</p>
          </div>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Company to Analyze</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedCompany} onValueChange={(value) => setSelectedCompany(value as keyof typeof companyAnalyses)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(companyAnalyses).map((company) => (
                <SelectItem key={company} value={company}>
                  {company}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Overall Fit Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            SAP Fit Assessment - {fitAnalysis.company}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <span className="text-lg font-semibold text-gray-900">{fitAnalysis.overallFit} Fit</span>
                </div>
                <Badge className="bg-green-100 text-green-800 text-lg px-3 py-1">{fitAnalysis.fitScore}% Match</Badge>
              </div>
              <div className="space-y-2">
                <p>
                  <strong>Industry:</strong> {fitAnalysis.industry}
                </p>
                <p>
                  <strong>Company Size:</strong> {fitAnalysis.size}
                </p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Key Success Factors</h4>
              <ul className="space-y-1">
                {fitAnalysis.reasons.map((reason, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommended Solutions */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Recommended SAP Solutions</h2>
        {recommendedSolutions.map((solution, index) => (
          <Card key={solution.module}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl text-gray-900">SAP {solution.module}</CardTitle>
                <Badge className={getFitColor(solution.fit)}>{solution.fit} Fit</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600">Estimated ROI</p>
                      <p className="text-lg font-semibold text-green-600">{solution.roi}</p>
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
                      <p className="text-lg font-semibold text-purple-600">{solution.estimatedCost}</p>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <h4 className="font-semibold text-gray-900 mb-3">Key Business Benefits</h4>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {solution.benefits.map((benefit, benefitIndex) => (
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

      {/* Summary Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Users className="h-8 w-8 text-blue-600 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Next Steps Recommendation</h3>
              <p className="text-blue-800 mb-4">
                Based on the analysis, {fitAnalysis.company} is an excellent candidate for SAP solutions. We recommend
                starting with S/4HANA as the foundation, followed by Ariba integration to maximize procurement benefits.
              </p>
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
    </div>
  )
}
