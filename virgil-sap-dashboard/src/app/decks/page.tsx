"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { FileText, Download, Edit, Eye, Presentation, Sparkles, ImageIcon } from "lucide-react"

const mockSlides = [
  {
    id: 1,
    title: "Executive Summary",
    content: "SAP Solutions for TechCorp Industries - Digital Transformation Initiative",
    type: "title",
  },
  {
    id: 2,
    title: "Current State Analysis",
    content:
      "• Legacy systems causing inefficiencies\n• Manual processes in procurement\n• Limited real-time visibility\n• Compliance challenges",
    type: "bullets",
  },
  {
    id: 3,
    title: "Recommended SAP Solutions",
    content: "S/4HANA Core Implementation\nAriba Procurement Suite\nAnalytics Cloud Integration",
    type: "solutions",
  },
  {
    id: 4,
    title: "Business Benefits",
    content:
      "• 30% reduction in processing time\n• 25% cost savings in procurement\n• Real-time financial reporting\n• Enhanced compliance",
    type: "benefits",
  },
  {
    id: 5,
    title: "Implementation Roadmap",
    content:
      "Phase 1: S/4HANA Foundation (6 months)\nPhase 2: Ariba Integration (3 months)\nPhase 3: Analytics & Reporting (2 months)",
    type: "timeline",
  },
  {
    id: 6,
    title: "Investment & ROI",
    content: "Total Investment: $1.2M\nExpected ROI: 320% over 3 years\nPayback Period: 18 months",
    type: "financial",
  },
]

export default function Decks() {
  const [selectedCompany, setSelectedCompany] = useState("TechCorp Industries")
  const [slides, setSlides] = useState(mockSlides)
  const [editingSlide, setEditingSlide] = useState<number | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerateDeck = () => {
    setIsGenerating(true)
    setTimeout(() => {
      setIsGenerating(false)
    }, 2000)
  }

  const handleEditSlide = (slideId: number, newContent: string) => {
    setSlides(slides.map((slide) => (slide.id === slideId ? { ...slide, content: newContent } : slide)))
    setEditingSlide(null)
  }

  const getSlideIcon = (type: string) => {
    switch (type) {
      case "title":
        return <Presentation className="h-4 w-4" />
      case "bullets":
        return <FileText className="h-4 w-4" />
      case "solutions":
        return <Sparkles className="h-4 w-4" />
      case "benefits":
        return <FileText className="h-4 w-4" />
      case "timeline":
        return <FileText className="h-4 w-4" />
      case "financial":
        return <FileText className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Deck Generator</h1>
            <p className="text-gray-600">Create customized presentations for your prospects</p>
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

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Deck Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Deck Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="company">Target Company</Label>
              <Input
                id="company"
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                placeholder="Enter company name"
              />
            </div>

            <div>
              <Label htmlFor="presenter">Presenter Name</Label>
              <Input id="presenter" placeholder="Your name" defaultValue="Sarah Johnson" />
            </div>

            <div>
              <Label htmlFor="date">Presentation Date</Label>
              <Input id="date" type="date" defaultValue="2024-01-15" />
            </div>

            <div>
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea id="notes" placeholder="Any specific points to emphasize..." rows={3} />
            </div>

            <Button
              onClick={handleGenerateDeck}
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Regenerate Deck
                </>
              )}
            </Button>

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
            <h2 className="text-xl font-bold text-gray-900">Slide Preview & Editor</h2>
            <Badge className="bg-green-100 text-green-800">{slides.length} slides</Badge>
          </div>

          <div className="space-y-4">
            {slides.map((slide, index) => (
              <Card key={slide.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getSlideIcon(slide.type)}
                      <CardTitle className="text-lg">
                        Slide {index + 1}: {slide.title}
                      </CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingSlide(editingSlide === slide.id ? null : slide.id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {editingSlide === slide.id ? (
                    <div className="space-y-3">
                      <Textarea
                        value={slide.content}
                        onChange={(e) => handleEditSlide(slide.id, e.target.value)}
                        rows={4}
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
            ))}
          </div>

          <Card className="border-dashed border-2 border-gray-300">
            <CardContent className="flex items-center justify-center py-8">
              <Button variant="outline" className="text-gray-600 bg-transparent">
                <FileText className="mr-2 h-4 w-4" />
                Add New Slide
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
