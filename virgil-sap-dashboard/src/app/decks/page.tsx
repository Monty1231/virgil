"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  Loader2,
  Palette,
  Upload,
} from "lucide-react";

interface Company {
  id: number;
  name: string;
  industry: string;
  company_size: string;
}

interface AIAnalysis {
  id: number;
  company_id: number;
  company_name: string;
  industry: string;
  company_size: string;
  analysis_results: {
    fitScore: number;
    overallFit: string;
    keySuccessFactors: string[];
    businessChallenges: string[];
    recommendedSolutions: Array<{
      module: string;
      fit: string;
      fitScore?: number;
      priority: number;
      estimatedROI: number;
      timeToValue: string;
      estimatedCostMin: number;
      estimatedCostMax: number;
      keyBenefits: string[];
      implementationComplexity: string;
    }>;
    nextSteps: string[];
    riskFactors: string[];
  };
  confidence_score: number;
  created_at: string;
}

interface Slide {
  id: number;
  title: string;
  content: string;
  type: string;
  order: number;
}

interface BackgroundOption {
  id: string;
  name: string;
  type: "solid" | "gradient" | "image";
  value: string;
  preview: string;
}

interface Template {
  id: string;
  name: string;
  uploadedAt: string;
}

const slideTemplates = [
  { type: "title", name: "Title Slide", icon: Presentation },
  { type: "executive_summary", name: "Executive Summary", icon: FileText },
  { type: "current_state", name: "Current State Analysis", icon: AlertCircle },
  {
    type: "business_challenges",
    name: "Business Challenges",
    icon: AlertCircle,
  },
  {
    type: "recommended_solutions",
    name: "Recommended Solutions",
    icon: Sparkles,
  },
  { type: "solution_details", name: "Solution Details", icon: FileText },
  { type: "benefits_roi", name: "Benefits & ROI", icon: CheckCircle },
  {
    type: "implementation_roadmap",
    name: "Implementation Roadmap",
    icon: FileText,
  },
  { type: "investment_summary", name: "Investment Summary", icon: FileText },
  { type: "next_steps", name: "Next Steps", icon: CheckCircle },
];

const backgroundOptions: BackgroundOption[] = [
  {
    id: "white",
    name: "Clean White",
    type: "solid",
    value: "FFFFFF",
    preview: "#FFFFFF",
  },
  {
    id: "virgil-navy",
    name: "Virgil Navy",
    type: "solid",
    value: "1e3a5f",
    preview: "#1e3a5f",
  },
  {
    id: "light-gray",
    name: "Light Gray",
    type: "solid",
    value: "f8fafc",
    preview: "#f8fafc",
  },
  {
    id: "dark-blue",
    name: "Professional Blue",
    type: "solid",
    value: "1e40af",
    preview: "#1e40af",
  },
  {
    id: "navy-gradient",
    name: "Navy Gradient",
    type: "gradient",
    value: "linear-gradient(135deg, #1e3a5f 0%, #3b82f6 100%)",
    preview: "linear-gradient(135deg, #1e3a5f 0%, #3b82f6 100%)",
  },
  {
    id: "blue-gradient",
    name: "Blue Gradient",
    type: "gradient",
    value: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
    preview: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
  },
  {
    id: "subtle-gradient",
    name: "Subtle Gray",
    type: "gradient",
    value: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
    preview: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
  },
];

export default function Decks() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [aiAnalyses, setAiAnalyses] = useState<AIAnalysis[]>([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedAnalysis, setSelectedAnalysis] = useState<AIAnalysis | null>(
    null
  );
  const [slides, setSlides] = useState<Slide[]>([]);
  const [editingSlide, setEditingSlide] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deckMode, setDeckMode] = useState<"manual" | "ai">("manual");
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [selectedBackground, setSelectedBackground] =
    useState<BackgroundOption>(backgroundOptions[0]);
  const [customBackgroundImage, setCustomBackgroundImage] = useState<
    string | null
  >(null);
  const backgroundImageInputRef = useRef<HTMLInputElement>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [isUploadingTemplate, setIsUploadingTemplate] = useState(false);
  const [templateStyles, setTemplateStyles] = useState<any>(null);
  const [usePythonBackend, setUsePythonBackend] = useState(true); // Default to Python backend

  // Form data for manual deck creation
  const [deckConfig, setDeckConfig] = useState({
    deckName: "",
    presenterName: "Sarah Johnson",
    presentationDate: new Date().toISOString().split("T")[0],
    targetCompany: "",
    additionalNotes: "",
  });

  useEffect(() => {
    fetchCompanies();
    fetchAIAnalyses();
    fetchTemplates();
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      fetchAIAnalyses(selectedCompany);
    }
  }, [selectedCompany]);

  useEffect(() => {
    // Refetch templates when backend changes
    fetchTemplates();
    // Clear selected template when switching backends
    setSelectedTemplate("");
    setTemplateStyles(null);
  }, [usePythonBackend]);

  const fetchCompanies = async () => {
    try {
      const response = await fetch("/api/companies");
      if (response.ok) {
        const data = await response.json();
        setCompanies(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Failed to fetch companies:", error);
    }
  };

  const fetchTemplates = async () => {
    try {
      // Use Python backend endpoint if enabled, otherwise use original endpoint
      const endpoint = usePythonBackend
        ? "/api/export/powerpoint/python-template?action=list"
        : "/api/export/powerpoint/template";

      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error("Failed to fetch templates:", error);
    }
  };

  const fetchAIAnalyses = async (companyId?: string) => {
    setLoading(true);
    setError(null);

    try {
      // First try to get existing analyses from the database
      const url = companyId
        ? `/api/ai-analyses?companyId=${companyId}`
        : "/api/ai-analyses";
      console.log("📊 Fetching AI analyses from:", url);

      const response = await fetch(url);
      console.log("📊 AI analyses response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("📊 AI analyses raw data:", data);

        if (Array.isArray(data)) {
          // Validate and clean the data
          const validAnalyses = data
            .map((analysis) => {
              console.log(
                "📊 Processing analysis:",
                analysis.id,
                "for company:",
                analysis.company_name
              );
              console.log(
                "📊 Analysis results type:",
                typeof analysis.analysis_results
              );

              // Ensure analysis_results is properly parsed
              let analysisResults = analysis.analysis_results;
              if (typeof analysisResults === "string") {
                try {
                  analysisResults = JSON.parse(analysisResults);
                  console.log("📊 Parsed analysis results:", analysisResults);
                } catch (parseError) {
                  console.error(
                    "📊 Failed to parse analysis_results JSON:",
                    parseError
                  );
                  analysisResults = null;
                }
              }

              return {
                ...analysis,
                analysis_results: analysisResults,
              };
            })
            .filter((analysis) => analysis.analysis_results !== null);

          setAiAnalyses(validAnalyses);
          console.log("📊 Set", validAnalyses.length, "valid analyses");
        } else {
          console.error("📊 AI analyses response is not an array:", data);
          setAiAnalyses([]);
          if (data.error) {
            setError(data.error);
          }
        }
      } else {
        // If no existing analyses found and we have a specific company, show option to generate
        if (companyId && (response.status === 404 || response.status === 500)) {
          console.log("📊 No existing analyses found for company:", companyId);
          setAiAnalyses([]);
        } else {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("text/html")) {
            console.error("📊 Received HTML error page instead of JSON");
            throw new Error(
              `API endpoint not found (${response.status}). The /api/ai-analyses route may not exist.`
            );
          } else {
            const errorText = await response.text();
            console.error("📊 AI analyses error response:", errorText);
            throw new Error(`Failed to fetch analyses: ${response.status}`);
          }
        }
      }
    } catch (error) {
      console.error("📊 Failed to fetch AI analyses:", error);
      setError(
        `Failed to load AI analyses: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      setAiAnalyses([]);
    } finally {
      setLoading(false);
    }
  };

  const generateNewAnalysis = async (companyId: string) => {
    try {
      console.log("🤖 Generating new AI analysis for company:", companyId);
      setError(null);
      setLoading(true);

      const response = await fetch(`/api/ai-analysis/company/${companyId}`);
      console.log(
        "🤖 AI analysis generation response status:",
        response.status
      );

      if (response.ok) {
        const data = await response.json();
        console.log("🤖 Generated analysis data:", data);

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
          };

          setAiAnalyses([formattedAnalysis]);
          console.log("🤖 Set generated analysis");
        }
      } else {
        const errorData = await response.json();
        console.error("🤖 Failed to generate analysis:", errorData);
        setError(
          `Failed to generate analysis: ${errorData.error || "Unknown error"}`
        );
      }
    } catch (error) {
      console.error("🤖 Error generating analysis:", error);
      setError(
        `Failed to generate analysis: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const generateDeckFromAI = async (analysis: AIAnalysis) => {
    setIsGenerating(true);
    setError(null);

    try {
      console.log(
        "🎯 Generating deck from AI analysis:",
        analysis.company_name
      );
      console.log("🎯 Analysis data structure:", analysis);

      // Check if analysis_results exists and has the expected structure
      if (!analysis.analysis_results) {
        console.error("🎯 No analysis_results found in:", analysis);
        throw new Error(
          "Analysis data is incomplete - missing analysis_results"
        );
      }

      const analysisData = analysis.analysis_results;
      console.log("🎯 Analysis results:", analysisData);

      // Validate required fields with defaults
      const fitScore = analysisData.fitScore || 75;
      const overallFit = analysisData.overallFit || "Medium";
      const keySuccessFactors = analysisData.keySuccessFactors || [
        "Digital transformation opportunity",
        "Industry alignment with SAP solutions",
      ];
      const businessChallenges = analysisData.businessChallenges || [
        "Legacy system modernization",
        "Process optimization needs",
      ];
      const recommendedSolutions = analysisData.recommendedSolutions || [];
      const nextSteps = analysisData.nextSteps || [
        "Schedule executive briefing",
        "Conduct detailed needs assessment",
      ];

      const generatedSlides: Slide[] = [];
      let slideId = 1;

      // Title Slide
      generatedSlides.push({
        id: slideId++,
        title: "Executive Presentation",
        content: `SAP Digital Transformation Proposal for ${
          analysis.company_name
        }

Presented by: ${deckConfig.presenterName}
Date: ${deckConfig.presentationDate}

Transforming ${analysis.industry || "Business"} Operations with SAP Solutions`,
        type: "title",
        order: 1,
      });

      // Executive Summary
      generatedSlides.push({
        id: slideId++,
        title: "Executive Summary",
        content: `• ${
          analysis.company_name
        } shows ${overallFit} fit for SAP solutions (${fitScore}% match)
• ${analysis.industry || "Industry"} leader with ${
          analysis.company_size || "enterprise"
        } scale
• Key opportunity areas identified through AI-powered analysis
• Recommended phased implementation approach
• Estimated ROI: ${
          recommendedSolutions[0]?.estimatedROI || 300
        }%+ over 3 years`,
        type: "executive_summary",
        order: 2,
      });

      // Business Challenges
      if (businessChallenges.length > 0) {
        generatedSlides.push({
          id: slideId++,
          title: "Current Business Challenges",
          content: businessChallenges
            .map((challenge) => `• ${challenge}`)
            .join("\n"),
          type: "business_challenges",
          order: 3,
        });
      }

      // Recommended Solutions
      if (recommendedSolutions.length > 0) {
        const topSolutions = recommendedSolutions
          .sort((a, b) => {
            const fb =
              typeof (b as any).fitScore === "number"
                ? (b as any).fitScore
                : -Infinity;
            const fa =
              typeof (a as any).fitScore === "number"
                ? (a as any).fitScore
                : -Infinity;
            if (Number.isFinite(fa) || Number.isFinite(fb)) return fb - fa;
            return (a.priority || 1) - (b.priority || 1);
          })
          .slice(0, 3);

        generatedSlides.push({
          id: slideId++,
          title: "AI-Recommended SAP Solutions",
          content: topSolutions
            .map(
              (solution) =>
                `• SAP ${solution.module || "Solution"} - ${
                  solution.fit || "High"
                } Fit${
                  typeof solution.fitScore === "number"
                    ? ` (Fit Score ${(solution.fitScore as number).toFixed(
                        2
                      )}%)`
                    : ""
                }
  - ROI: ${solution.estimatedROI || 300}%
  - Time to Value: ${solution.timeToValue || "12-18 months"}
  - Investment: $${((solution.estimatedCostMin || 500000) / 1000).toFixed(
    0
  )}K - $${((solution.estimatedCostMax || 1000000) / 1000).toFixed(0)}K`
            )
            .join("\n\n"),
          type: "recommended_solutions",
          order: 4,
        });

        // Individual solution slides for top 2 solutions
        topSolutions.slice(0, 2).forEach((solution, index) => {
          generatedSlides.push({
            id: slideId++,
            title: `SAP ${solution.module || "Solution"} Details`,
            content: `Implementation Complexity: ${
              solution.implementationComplexity || "Medium"
            }
Time to Value: ${solution.timeToValue || "12-18 months"}
Estimated ROI: ${solution.estimatedROI || 300}%

Key Benefits:
${(
  solution.keyBenefits || [
    "Process optimization",
    "Enhanced efficiency",
    "Cost reduction",
  ]
)
  .map((benefit) => `• ${benefit}`)
  .join("\n")}

Investment Range: $${((solution.estimatedCostMin || 500000) / 1000).toFixed(
              0
            )}K - $${((solution.estimatedCostMax || 1000000) / 1000).toFixed(
              0
            )}K`,
            type: "solution_details",
            order: 5 + index,
          });
        });
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
        });
      }

      // Benefits & ROI Summary
      const avgROI =
        recommendedSolutions.length > 0
          ? recommendedSolutions.reduce(
              (sum, sol) => sum + (sol.estimatedROI || 300),
              0
            ) / recommendedSolutions.length
          : 300;

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
      });

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
      });

      // Next Steps
      generatedSlides.push({
        id: slideId++,
        title: "Recommended Next Steps",
        content: nextSteps.map((step) => `• ${step}`).join("\n"),
        type: "next_steps",
        order: 9,
      });

      setSlides(generatedSlides);
      setSelectedAnalysis(analysis);

      // Update deck config
      setDeckConfig((prev) => ({
        ...prev,
        deckName: `${analysis.company_name} SAP Transformation Proposal`,
        targetCompany: analysis.company_name,
      }));

      console.log(
        "🎯 Generated",
        generatedSlides.length,
        "slides from AI analysis"
      );
    } catch (error) {
      console.error("🎯 Failed to generate deck:", error);
      setError(
        `Failed to generate deck: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const addManualSlide = (templateType: string) => {
    const template = slideTemplates.find((t) => t.type === templateType);
    if (!template) return;

    const newSlide: Slide = {
      id: Date.now(),
      title: template.name,
      content: getTemplateContent(templateType),
      type: templateType,
      order: slides.length + 1,
    };

    setSlides([...slides, newSlide]);
  };

  const getTemplateContent = (type: string): string => {
    switch (type) {
      case "title":
        return `${deckConfig.deckName || "SAP Solutions Presentation"}

Presented by: ${deckConfig.presenterName}
Date: ${deckConfig.presentationDate}
Company: ${deckConfig.targetCompany || "[Company Name]"}`;

      case "executive_summary":
        return `• [Company] digital transformation opportunity
• Key business challenges and objectives
• Recommended SAP solution approach
• Expected business outcomes and ROI
• Implementation timeline and next steps`;

      case "current_state":
        return `Current State Analysis:

• Legacy systems and processes
• Business challenges and pain points
• Technology gaps and limitations
• Operational inefficiencies
• Compliance and risk considerations`;

      case "business_challenges":
        return `Key Business Challenges:

• [Challenge 1]
• [Challenge 2]
• [Challenge 3]
• [Challenge 4]

Impact on Business:
• [Impact description]`;

      case "recommended_solutions":
        return `Recommended SAP Solutions:

• SAP S/4HANA - Core ERP Platform
• SAP Ariba - Procurement Excellence
• SAP SuccessFactors - Human Capital Management
• SAP Analytics Cloud - Business Intelligence

Strategic Fit: [High/Medium/Low]`;

      case "benefits_roi":
        return `Expected Business Benefits:

Financial Impact:
• ROI: [X]% over 3 years
• Cost savings: $[X]M annually
• Revenue opportunities: $[X]M

Operational Benefits:
• Process efficiency improvements
• Enhanced decision-making capabilities
• Improved compliance and risk management`;

      case "implementation_roadmap":
        return `Implementation Roadmap:

Phase 1: Foundation (Months 1-6)
• [Key activities]

Phase 2: Expansion (Months 7-12)
• [Key activities]

Phase 3: Optimization (Months 13-18)
• [Key activities]`;

      case "investment_summary":
        return `Investment Summary:

Software Licenses: $[X]
Implementation Services: $[X]
Training & Change Management: $[X]
Infrastructure: $[X]

Total Investment: $[X]
Expected ROI: [X]% over 3 years`;

      case "next_steps":
        return `Recommended Next Steps:

• Executive alignment and sponsorship
• Detailed requirements gathering
• Solution demonstration and proof of concept
• Project planning and resource allocation
• Contract negotiation and finalization

Timeline: [X] weeks to project kickoff`;

      default:
        return "• [Add your content here]\n• [Bullet point 2]\n• [Bullet point 3]";
    }
  };

  const handleEditSlide = (slideId: number, newContent: string) => {
    setSlides(
      slides.map((slide) =>
        slide.id === slideId ? { ...slide, content: newContent } : slide
      )
    );
    setEditingSlide(null);
  };

  const deleteSlide = (slideId: number) => {
    setSlides(slides.filter((slide) => slide.id !== slideId));
  };

  const moveSlide = (slideId: number, direction: "up" | "down") => {
    const slideIndex = slides.findIndex((slide) => slide.id === slideId);
    if (slideIndex === -1) return;

    const newSlides = [...slides];
    if (direction === "up" && slideIndex > 0) {
      [newSlides[slideIndex], newSlides[slideIndex - 1]] = [
        newSlides[slideIndex - 1],
        newSlides[slideIndex],
      ];
    } else if (direction === "down" && slideIndex < slides.length - 1) {
      [newSlides[slideIndex], newSlides[slideIndex + 1]] = [
        newSlides[slideIndex + 1],
        newSlides[slideIndex],
      ];
    }

    // Update order numbers
    newSlides.forEach((slide, index) => {
      slide.order = index + 1;
    });

    setSlides(newSlides);
  };

  const getSlideIcon = (type: string) => {
    const template = slideTemplates.find((t) => t.type === type);
    return template?.icon || FileText;
  };

  // Handle background image upload
  const handleBackgroundImageUpload = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Only image files are supported for background.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setCustomBackgroundImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleTemplateUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pptx")) {
      setError("Only .pptx files are supported");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      return;
    }

    setIsUploadingTemplate(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("template", file);

      // Use Python backend endpoint if enabled, otherwise use original endpoint
      const endpoint = usePythonBackend
        ? "/api/export/powerpoint/python-template"
        : "/api/export/powerpoint/template";

      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        await fetchTemplates(); // Refresh templates list
        setSelectedTemplate(data.templateId);
        // Fetch template info for the newly uploaded template (Python backend doesn't use styles)
        if (usePythonBackend) {
          await fetchTemplateInfo(data.templateId);
        } else {
          await fetchTemplateStyles(data.templateId);
        }
        console.log("✅ Template uploaded successfully");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload template");
      }
    } catch (error) {
      console.error("❌ Template upload failed:", error);
      setError(
        `Failed to upload template: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsUploadingTemplate(false);
    }
  };

  const deleteTemplate = async (templateId: string) => {
    try {
      // Use Python backend endpoint if enabled, otherwise use original endpoint
      const endpoint = usePythonBackend
        ? `/api/export/powerpoint/python-template?id=${templateId}`
        : `/api/export/powerpoint/template?id=${templateId}`;

      const response = await fetch(endpoint, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchTemplates(); // Refresh templates list
        if (selectedTemplate === templateId) {
          setSelectedTemplate("");
          setTemplateStyles(null);
        }
        console.log("✅ Template deleted successfully");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete template");
      }
    } catch (error) {
      console.error("❌ Template deletion failed:", error);
      setError(
        `Failed to delete template: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const fetchTemplateInfo = async (templateId: string) => {
    try {
      console.log("🔍 Fetching template info for:", templateId);
      const response = await fetch(
        `/api/export/powerpoint/python-template?action=info&id=${templateId}`
      );

      console.log("📡 Response status:", response.status);
      console.log("📡 Response ok:", response.ok);

      if (response.ok) {
        const info = await response.json();
        console.log("✅ Template info loaded:", info);
        setTemplateStyles(info); // Store template info instead of styles
      } else {
        const errorData = await response.json();
        console.error("❌ Template info fetch failed:", errorData);
        setError(
          `Failed to load template info: ${errorData.error || "Unknown error"}`
        );
      }
    } catch (error) {
      console.error("❌ Failed to fetch template info:", error);
      setError(
        `Failed to fetch template info: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const fetchTemplateStyles = async (templateId: string) => {
    try {
      console.log("🔍 Fetching template styles for:", templateId);
      const response = await fetch(
        `/api/export/powerpoint/template-styles?id=${templateId}`
      );

      console.log("📡 Response status:", response.status);
      console.log("📡 Response ok:", response.ok);

      if (response.ok) {
        const styles = await response.json();
        console.log("✅ Template styles loaded:", styles);
        setTemplateStyles(styles);
      } else {
        const errorData = await response.json();
        console.error("❌ Template styles fetch failed:", errorData);
        setError(
          `Failed to load template styles: ${
            errorData.error || "Unknown error"
          }`
        );
      }
    } catch (error) {
      console.error("❌ Failed to fetch template styles:", error);
      setError(
        `Failed to fetch template styles: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const handleTemplateSelection = (templateId: string) => {
    setSelectedTemplate(templateId);
    if (templateId) {
      if (usePythonBackend) {
        fetchTemplateInfo(templateId);
      } else {
        fetchTemplateStyles(templateId);
      }
    } else {
      setTemplateStyles(null);
    }
  };

  const handleExport = async (
    format: "powerpoint" | "pdf" | "google-slides"
  ) => {
    if (slides.length === 0) {
      setError("No slides to export. Please create some slides first.");
      return;
    }

    setIsExporting(format);
    setError(null);

    try {
      console.log(`📤 Exporting to ${format}...`);
      console.log("🎨 Current template styles:", templateStyles);
      console.log("📄 Selected template:", selectedTemplate);

      // Use Python backend for PowerPoint if enabled and template is selected
      if (format === "powerpoint" && usePythonBackend && selectedTemplate) {
        console.log("🐍 Using Python backend for PowerPoint export");

        const exportData = {
          slides,
          deckConfig,
          templateId: selectedTemplate,
        };

        console.log("📦 Python backend export data:", exportData);

        const response = await fetch("/api/export/powerpoint/python-template", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(exportData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to export to ${format}`);
        }

        // Get the filename from the response headers
        const contentDisposition = response.headers.get("Content-Disposition");
        const filename = contentDisposition
          ? contentDisposition.split("filename=")[1]?.replace(/"/g, "")
          : `${deckConfig.deckName || "presentation"}.pptx`;

        // Create blob and download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        console.log(`✅ Successfully exported to ${format} via Python backend`);
        return;
      }

      // Use original export for other formats or when Python backend is disabled
      const exportData = {
        slides,
        deckConfig,
        background: selectedBackground,
        templateId: selectedTemplate,
        customBackgroundImage, // send the image data URL to backend
      };

      console.log("📦 Original export data:", exportData);

      const response = await fetch(`/api/export/${format}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(exportData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to export to ${format}`);
      }

      // Get the filename from the response headers
      const contentDisposition = response.headers.get("Content-Disposition");
      const filename = contentDisposition
        ? contentDisposition.split("filename=")[1]?.replace(/"/g, "")
        : `presentation.${
            format === "powerpoint" ? "pptx" : format === "pdf" ? "pdf" : "html"
          }`;

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      console.log(`✅ Successfully exported to ${format}`);
    } catch (error) {
      console.error(`❌ Export to ${format} failed:`, error);
      setError(
        `Failed to export to ${format}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              AI-Powered Deck Generator
            </h1>
            <p className="text-gray-600">
              Create presentations from AI analysis or build manually
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => handleExport("powerpoint")}
            disabled={slides.length === 0 || isExporting !== null}
          >
            {isExporting === "powerpoint" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Export PowerPoint
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
                  className={
                    deckMode === "manual"
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-transparent"
                  }
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Manual
                </Button>
                <Button
                  variant={deckMode === "ai" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDeckMode("ai")}
                  className={
                    deckMode === "ai"
                      ? "bg-purple-600 hover:bg-purple-700"
                      : "bg-transparent"
                  }
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
                onChange={(e) =>
                  setDeckConfig((prev) => ({
                    ...prev,
                    deckName: e.target.value,
                  }))
                }
                placeholder="Enter deck name"
              />
            </div>

            <div>
              <Label htmlFor="presenter">Presenter Name</Label>
              <Input
                id="presenter"
                value={deckConfig.presenterName}
                onChange={(e) =>
                  setDeckConfig((prev) => ({
                    ...prev,
                    presenterName: e.target.value,
                  }))
                }
                placeholder="Your name"
              />
            </div>

            <div>
              <Label htmlFor="date">Presentation Date</Label>
              <Input
                id="date"
                type="date"
                value={deckConfig.presentationDate}
                onChange={(e) =>
                  setDeckConfig((prev) => ({
                    ...prev,
                    presentationDate: e.target.value,
                  }))
                }
              />
            </div>

            {/* Background Selection */}
            <div>
              <Label className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Slide Background
              </Label>
              <div className="space-y-3 mt-2">
                <div className="grid grid-cols-3 gap-2">
                  {backgroundOptions.map((bg) => (
                    <button
                      key={bg.id}
                      onClick={() => setSelectedBackground(bg)}
                      className={`relative h-12 rounded-md border-2 transition-all ${
                        selectedBackground.id === bg.id
                          ? "border-blue-500 ring-2 ring-blue-200"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      style={{
                        background:
                          bg.type === "gradient" ? bg.preview : bg.preview,
                      }}
                      title={bg.name}
                    >
                      {selectedBackground.id === bg.id && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-white drop-shadow-lg" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                <div className="text-sm text-gray-600">
                  Selected:{" "}
                  <span className="font-medium">{selectedBackground.name}</span>
                </div>

                {/* Custom Image Upload */}
                <div className="border-t pt-3">
                  <Label htmlFor="background-upload" className="text-sm">
                    Or upload custom background:
                  </Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      id="background-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleBackgroundImageUpload}
                      className="text-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        document.getElementById("background-upload")?.click()
                      }
                    >
                      <Upload className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {deckMode === "ai" && (
              <>
                <div>
                  <Label htmlFor="company">Target Company</Label>
                  <Select
                    onValueChange={setSelectedCompany}
                    value={selectedCompany}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select company" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem
                          key={company.id}
                          value={company.id.toString()}
                        >
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
                                <p className="font-medium text-sm">
                                  {analysis.company_name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {analysis.analysis_results?.overallFit ||
                                    "Unknown"}{" "}
                                  Fit •{" "}
                                  {analysis.analysis_results?.fitScore || 0}%
                                  Match
                                </p>
                                <p className="text-xs text-gray-400">
                                  Created:{" "}
                                  {new Date(
                                    analysis.created_at
                                  ).toLocaleDateString()}
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
                    onChange={(e) =>
                      setDeckConfig((prev) => ({
                        ...prev,
                        targetCompany: e.target.value,
                      }))
                    }
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
                onChange={(e) =>
                  setDeckConfig((prev) => ({
                    ...prev,
                    additionalNotes: e.target.value,
                  }))
                }
                placeholder="Any specific points to emphasize..."
                rows={3}
              />
            </div>

            {/* PowerPoint Template Management */}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-3">
                <Label className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  PowerPoint Template
                </Label>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-gray-600">Backend:</Label>
                  <Button
                    variant={usePythonBackend ? "default" : "outline"}
                    size="sm"
                    onClick={() => setUsePythonBackend(true)}
                    className={
                      usePythonBackend ? "bg-green-600 hover:bg-green-700" : ""
                    }
                  >
                    Python
                  </Button>
                  <Button
                    variant={!usePythonBackend ? "default" : "outline"}
                    size="sm"
                    onClick={() => setUsePythonBackend(false)}
                    className={
                      !usePythonBackend ? "bg-blue-600 hover:bg-blue-700" : ""
                    }
                  >
                    Original
                  </Button>
                </div>
              </div>

              {/* Template Upload */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Input
                    id="template-upload"
                    type="file"
                    accept=".pptx"
                    onChange={handleTemplateUpload}
                    className="text-sm"
                    disabled={isUploadingTemplate}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      document.getElementById("template-upload")?.click()
                    }
                    disabled={isUploadingTemplate}
                  >
                    {isUploadingTemplate ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Upload className="h-3 w-3" />
                    )}
                  </Button>
                </div>

                {/* Template Selection */}
                {templates.length > 0 && (
                  <div>
                    <Label className="text-sm mb-2">Available Templates</Label>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {templates.map((template) => (
                        <div
                          key={template.id}
                          className={`p-2 border rounded-md cursor-pointer transition-colors ${
                            selectedTemplate === template.id
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          onClick={() => handleTemplateSelection(template.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {template.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                Uploaded:{" "}
                                {new Date(
                                  template.uploadedAt
                                ).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              {selectedTemplate === template.id && (
                                <CheckCircle className="h-3 w-3 text-blue-600" />
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteTemplate(template.id);
                                }}
                                className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {selectedTemplate && (
                      <p className="text-xs text-blue-600 mt-1">
                        ✓ Using template:{" "}
                        {templates.find((t) => t.id === selectedTemplate)?.name}
                      </p>
                    )}
                  </div>
                )}

                {templates.length === 0 && (
                  <p className="text-xs text-gray-500">
                    No templates uploaded yet. Upload a .pptx file to use as a
                    template.
                  </p>
                )}
              </div>
            </div>

            {deckMode === "manual" && (
              <Button
                onClick={() => {
                  // Generate a basic manual deck
                  addManualSlide("title");
                  addManualSlide("executive_summary");
                  addManualSlide("current_state");
                  addManualSlide("recommended_solutions");
                  addManualSlide("benefits_roi");
                  addManualSlide("next_steps");
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
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start bg-transparent"
                  onClick={() => handleExport("google-slides")}
                  disabled={slides.length === 0 || isExporting !== null}
                >
                  {isExporting === "google-slides" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ImageIcon className="mr-2 h-4 w-4" />
                  )}
                  Google Slides
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start bg-transparent"
                  onClick={() => handleExport("powerpoint")}
                  disabled={slides.length === 0 || isExporting !== null}
                >
                  {isExporting === "powerpoint" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="mr-2 h-4 w-4" />
                  )}
                  PowerPoint
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start bg-transparent"
                  onClick={() => handleExport("pdf")}
                  disabled={slides.length === 0 || isExporting !== null}
                >
                  {isExporting === "pdf" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
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
            <Badge className="bg-green-100 text-green-800">
              {slides.length} slides
            </Badge>
          </div>

          {isGenerating && (
            <Card>
              <CardContent className="text-center py-12">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <Image
                      src="/darkLogo.png"
                      alt="Virgil AI"
                      width={48}
                      height={48}
                      className="animate-pulse"
                    />
                    <Sparkles className="h-6 w-6 text-yellow-500 absolute -top-1 -right-1 animate-bounce" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Generating AI-Powered Deck
                    </h3>
                    <p className="text-gray-600">
                      Creating presentation slides from AI analysis data...
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {slides.length === 0 && !isGenerating && (
            <Card className="border-dashed border-2 border-gray-300">
              <CardContent className="text-center py-12">
                <Presentation className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Slides Created Yet
                </h3>
                <p className="text-gray-600 mb-4">
                  {deckMode === "ai"
                    ? "Select a company and AI analysis to auto-generate slides"
                    : "Add slide templates or create a basic deck to get started"}
                </p>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {(() => {
              console.log("Template styles in preview:", templateStyles);
              return null;
            })()}
            {slides.map((slide, index) => {
              const SlideIcon = getSlideIcon(slide.type);
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
                            {slideTemplates.find((t) => t.type === slide.type)
                              ?.name || slide.type}
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
                          onClick={() =>
                            setEditingSlide(
                              editingSlide === slide.id ? null : slide.id
                            )
                          }
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
                            setSlides(
                              slides.map((s) =>
                                s.id === slide.id
                                  ? { ...s, title: e.target.value }
                                  : s
                              )
                            )
                          }
                          placeholder="Slide title"
                          className="font-semibold"
                        />
                        <Textarea
                          value={slide.content}
                          onChange={(e) =>
                            handleEditSlide(slide.id, e.target.value)
                          }
                          rows={8}
                          className="font-mono text-sm"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() =>
                              handleEditSlide(slide.id, slide.content)
                            }
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingSlide(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="p-4 rounded-lg border-2 border-dashed border-gray-200 relative"
                        style={{
                          background: customBackgroundImage
                            ? undefined
                            : templateStyles?.slideBackground
                            ? `#${templateStyles.slideBackground}`
                            : selectedBackground.type === "gradient"
                            ? selectedBackground.preview
                            : selectedBackground.preview,
                          color: templateStyles?.textColor
                            ? `#${templateStyles.textColor}`
                            : selectedBackground.id === "white" ||
                              selectedBackground.id === "light-gray" ||
                              selectedBackground.id === "subtle-gradient"
                            ? "#1f2937"
                            : "#ffffff",
                          position: "relative",
                          overflow: "hidden",
                          ...(customBackgroundImage
                            ? {
                                backgroundImage: `url(${customBackgroundImage})`,
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                              }
                            : {}),
                        }}
                      >
                        {/* Add template design elements */}
                        {templateStyles?.hasShapes && (
                          <>
                            {templateStyles.templateDesign === "marketing" ||
                            templateStyles.templateDesign === "modern" ? (
                              <>
                                {/* Decorative rectangle */}
                                <div
                                  className="absolute left-0 top-0 w-1/3 h-full opacity-10"
                                  style={{
                                    background: `#${templateStyles.primaryColor}`,
                                    borderRight: `2px solid #${templateStyles.primaryColor}`,
                                  }}
                                />
                                {/* Accent circle */}
                                <div
                                  className="absolute right-4 top-4 w-8 h-8 rounded-full opacity-20"
                                  style={{
                                    background: `#${templateStyles.accentColor}`,
                                  }}
                                />
                              </>
                            ) : templateStyles.templateDesign === "organic" ? (
                              <>
                                {/* Organic circle */}
                                <div
                                  className="absolute left-4 top-4 w-16 h-16 rounded-full opacity-15"
                                  style={{
                                    background: `#${templateStyles.accentColor}`,
                                  }}
                                />
                              </>
                            ) : templateStyles.templateDesign === "corporate" ||
                              templateStyles.templateDesign === "business" ? (
                              <>
                                {/* Professional accent bar */}
                                <div
                                  className="absolute left-0 top-0 w-1/5 h-full opacity-30"
                                  style={{
                                    background: `#${templateStyles.primaryColor}`,
                                    borderRight: `1px solid #${templateStyles.primaryColor}`,
                                  }}
                                />
                              </>
                            ) : null}
                          </>
                        )}

                        {/* Content with adjusted positioning for shapes */}
                        <div
                          className="whitespace-pre-line text-sm relative z-10"
                          style={{
                            marginLeft: templateStyles?.hasShapes
                              ? "2rem"
                              : "0",
                            fontSize: templateStyles?.bodyFontSize
                              ? `${templateStyles.bodyFontSize}px`
                              : "14px",
                            fontFamily: templateStyles?.fontFamily || "Arial",
                          }}
                        >
                          {/* Title with template styling */}
                          <h3
                            className="font-bold mb-2"
                            style={{
                              fontSize: templateStyles?.titleFontSize
                                ? `${templateStyles.titleFontSize}px`
                                : "18px",
                              color: templateStyles?.titleColor
                                ? `#${templateStyles.titleColor}`
                                : "inherit",
                            }}
                          >
                            {slide.title}
                          </h3>

                          {/* Content with template text color */}
                          <div
                            style={{
                              color: templateStyles?.textColor
                                ? `#${templateStyles.textColor}`
                                : "inherit",
                            }}
                          >
                            {slide.content}
                          </div>
                        </div>

                        <div className="absolute top-2 right-2">
                          <Badge
                            variant="secondary"
                            className="text-xs opacity-75"
                          >
                            {usePythonBackend ? (
                              templateStyles?.template_info ? (
                                <>
                                  Python Backend •{" "}
                                  {templateStyles.template_info.slide_layouts}{" "}
                                  layouts
                                </>
                              ) : (
                                "Python Backend • Template"
                              )
                            ) : (
                              <>
                                Preview with{" "}
                                {templateStyles
                                  ? `${
                                      templateStyles.templateDesign ||
                                      "Template"
                                    } Design`
                                  : selectedBackground.name}
                              </>
                            )}
                          </Badge>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {slides.length > 0 && (
            <Card className="border-dashed border-2 border-gray-300">
              <CardContent className="flex items-center justify-center py-4">
                <p className="text-gray-500 text-sm">
                  Use the slide templates in the configuration panel to add more
                  slides
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
