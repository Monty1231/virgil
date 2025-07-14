"use client";

import React, { ReactElement, useState } from "react";
import { Image as ImageIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Bot,
  Building2,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Users,
  MapPin,
  Phone,
  Mail,
  Globe,
  Calendar,
  DollarSign,
  Target,
  Save,
  Loader2,
  Plus,
  X,
  Upload,
  FileText,
  Paperclip,
  Download,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";

const industries = [
  "Manufacturing",
  "Retail",
  "Financial Services",
  "Healthcare",
  "Technology",
  "Energy & Utilities",
  "Government",
  "Education",
  "Automotive",
  "Aerospace & Defense",
  "Telecommunications",
  "Media & Entertainment",
  "Real Estate",
  "Transportation & Logistics",
  "Food & Beverage",
  "Pharmaceuticals",
  "Construction",
  "Agriculture",
];

const companySizes = [
  {
    value: "Small (1-100 employees)",
    label: "Small",
    range: "1-100 employees",
    color: "bg-green-100 text-green-800 border-green-200",
  },
  {
    value: "Medium (101-1000 employees)",
    label: "Medium",
    range: "101-1,000 employees",
    color: "bg-primary/10 text-primary border-primary/20",
  },
  {
    value: "Large (1001-5000 employees)",
    label: "Large",
    range: "1,001-5,000 employees",
    color: "bg-secondary text-secondary-foreground border-secondary/20",
  },
  {
    value: "Enterprise (5000+ employees)",
    label: "Enterprise",
    range: "5,000+ employees",
    color: "bg-accent text-accent-foreground border-accent/20",
  },
];

const regions = [
  "North America",
  "Europe",
  "Asia Pacific",
  "Latin America",
  "Middle East & Africa",
  "Global",
];

const priorities = [
  {
    value: "high",
    label: "High Priority",
    color: "bg-red-100 text-red-800 border-red-200",
  },
  {
    value: "medium",
    label: "Medium Priority",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  {
    value: "low",
    label: "Low Priority",
    color: "bg-green-100 text-green-800 border-green-200",
  },
];

const fileTypes = [
  { value: "requirements", label: "Requirements Document", icon: FileText },
  { value: "org_chart", label: "Organizational Chart", icon: Users },
  {
    value: "current_systems",
    label: "Current Systems Documentation",
    icon: Building2,
  },
  { value: "financial", label: "Financial Information", icon: DollarSign },
  { value: "presentation", label: "Company Presentation", icon: ImageIcon },
  { value: "other", label: "Other", icon: Paperclip },
];

interface SAPProduct {
  id: number;
  product_name: string;
  product_category: string;
  description: string;
  confidence_score?: number;
  reasoning?: string;
}

interface ContactPerson {
  name: string;
  title: string;
  email: string;
  phone: string;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  category: string;
  url?: string;
  s3Key?: string;
  uploadedAt: Date;
  status?: "uploading" | "success" | "error";
  error?: string;
}

export default function NewAccount(): ReactElement {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    // Basic Company Info
    companyName: "",
    industry: "",
    size: "",
    region: "",
    website: "",

    // Business Details
    challenges: "",
    currentSystems: "",
    budget: "",
    timeline: "",
    priority: "",

    // Contact Information
    primaryContact: {
      name: "",
      title: "",
      email: "",
      phone: "",
    } as ContactPerson,
    secondaryContact: {
      name: "",
      title: "",
      email: "",
      phone: "",
    } as ContactPerson,

    // Additional Info
    notes: "",
    tags: [] as string[],
  });

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [suggestedModules, setSuggestedModules] = useState<SAPProduct[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] =
    useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [createdCompanyId, setCreatedCompanyId] = useState<number | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [newTag, setNewTag] = useState("");
  const saveClickedRef = React.useRef(false);

  const steps = [
    {
      title: "Company Info",
      icon: Building2,
      fields: ["companyName", "industry", "size", "region", "website"],
    },
    {
      title: "Business Details",
      icon: Target,
      fields: [
        "challenges",
        "currentSystems",
        "budget",
        "timeline",
        "priority",
      ],
    },
    { title: "Contacts & Files", icon: Users, fields: ["primaryContact"] },
    { title: "Additional Info", icon: Plus, fields: ["notes", "tags"] },
  ];

  const calculateProgress = () => {
    const totalFields = steps.flatMap((step) => step.fields).length;
    const completedFields = steps
      .flatMap((step) => step.fields)
      .filter((field) => {
        if (field === "primaryContact") {
          return formData.primaryContact.name && formData.primaryContact.email;
        }
        if (field === "tags") {
          return formData.tags.length > 0;
        }
        return formData[field as keyof typeof formData];
      }).length;
    return Math.round((completedFields / totalFields) * 100);
  };

  const validateStep = (stepIndex: number) => {
    const errors: Record<string, string> = {};
    const step = steps[stepIndex];

    step.fields.forEach((field) => {
      if (field === "companyName" && !formData.companyName.trim()) {
        errors.companyName = "Company name is required";
      }
      if (field === "industry" && !formData.industry) {
        errors.industry = "Industry is required";
      }
      if (field === "size" && !formData.size) {
        errors.size = "Company size is required";
      }
      if (field === "region" && !formData.region) {
        errors.region = "Region is required";
      }
      if (field === "primaryContact") {
        if (!formData.primaryContact.name.trim()) {
          errors.primaryContactName = "Primary contact name is required";
        }
        if (!formData.primaryContact.email.trim()) {
          errors.primaryContactEmail = "Primary contact email is required";
        }
        if (
          formData.primaryContact.email &&
          !/\S+@\S+\.\S+/.test(formData.primaryContact.email)
        ) {
          errors.primaryContactEmail = "Please enter a valid email address";
        }
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = async (
    field: string,
    value: string | ContactPerson
  ) => {
    if (typeof value === "string") {
      setFormData((prev) => ({ ...prev, [field]: value }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }

    setError("");
    setValidationErrors((prev) => ({ ...prev, [field]: "" }));

    // Generate AI-powered SAP module recommendations
    if (field === "industry" && typeof value === "string" && value) {
      await generateSAPRecommendations();
    }
  };

  const generateSAPRecommendations = async () => {
    if (!formData.companyName || !formData.industry) return;

    setIsLoadingRecommendations(true);
    try {
      const response = await fetch("/api/sap-recommendations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyName: formData.companyName,
          industry: formData.industry,
          size: formData.size,
          challenges: formData.challenges,
          currentSystems: formData.currentSystems,
          budget: formData.budget,
        }),
      });

      if (response.ok) {
        const recommendations = await response.json();
        setSuggestedModules(recommendations.modules || []);
      }
    } catch (err) {
      console.error("Failed to generate SAP recommendations:", err);
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  const handleContactChange = (
    type: "primaryContact" | "secondaryContact",
    field: keyof ContactPerson,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value,
      },
    }));
    setValidationErrors((prev) => ({
      ...prev,
      [`${type}${field.charAt(0).toUpperCase() + field.slice(1)}`]: "",
    }));
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    category: string
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setError("");

    try {
      for (const file of Array.from(files)) {
        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(
            `File ${file.name} is too large. Maximum size is 10MB.`
          );
        }

        // Add file to list with uploading status
        const tempFile: UploadedFile = {
          id: Date.now().toString() + Math.random(),
          name: file.name,
          size: file.size,
          type: file.type,
          category,
          uploadedAt: new Date(),
          status: "uploading",
        };

        setUploadedFiles((prev) => [...prev, tempFile]);

        // Create FormData for file upload
        const formData = new FormData();
        formData.append("file", file);
        formData.append("category", category);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to upload ${file.name}`);
        }

        const uploadResult = await response.json();

        // Update file with success status
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === tempFile.id
              ? {
                  ...f,
                  id: uploadResult.id || f.id,
                  url: uploadResult.url,
                  s3Key: uploadResult.s3Key,
                  status: "success" as const,
                }
              : f
          )
        );
      }

      // Regenerate recommendations with file context
      if (uploadedFiles.length > 0) {
        await generateSAPRecommendations();
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to upload files";
      setError(errorMessage);

      // Update any uploading files with error status
      setUploadedFiles((prev) =>
        prev.map((f) =>
          f.status === "uploading"
            ? { ...f, status: "error" as const, error: errorMessage }
            : f
        )
      );
    } finally {
      setIsUploading(false);
      // Reset file input
      event.target.value = "";
    }
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((file) => file.id !== fileId));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (
      Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    );
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const nextStep = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    console.log("Attempting to advance from step:", currentStep);
    const isValid = validateStep(currentStep);
    console.log("Validation result for step", currentStep, ":", isValid);
    console.log("Validation errors:", validationErrors);
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
      setTimeout(() => {
        // Log after state update
        console.log("Advanced to step:", currentStep + 1);
      }, 0);
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    console.log("Form submitted");
    console.trace();
    if (!saveClickedRef.current) {
      console.log("Blocked submit: not from Save button");
      e.preventDefault();
      return;
    }
    saveClickedRef.current = false; // reset for next submit
    e.preventDefault();

    // Validate all steps
    let allValid = true;
    for (let i = 0; i < steps.length; i++) {
      if (!validateStep(i)) {
        allValid = false;
        setCurrentStep(i);
        break;
      }
    }

    if (!allValid) return;

    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
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
          website: formData.website,
          business_challenges: formData.challenges,
          current_systems: formData.currentSystems,
          budget: formData.budget,
          timeline: formData.timeline,
          priority: formData.priority,
          primary_contact: formData.primaryContact,
          secondary_contact: formData.secondaryContact,
          notes: formData.notes,
          tags: formData.tags,
          uploaded_files: uploadedFiles,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create company");
      }

      const newCompany = await response.json();
      setCreatedCompanyId(newCompany.id);
      setSuccess(`Successfully created account for ${formData.companyName}!`);

      // Reset form
      setFormData({
        companyName: "",
        industry: "",
        size: "",
        region: "",
        website: "",
        challenges: "",
        currentSystems: "",
        budget: "",
        timeline: "",
        priority: "",
        primaryContact: { name: "", title: "", email: "", phone: "" },
        secondaryContact: { name: "", title: "", email: "", phone: "" },
        notes: "",
        tags: [],
      });
      setUploadedFiles([]);
      setSuggestedModules([]);
      setAnalysisResult("");
      setCurrentStep(0);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAIAnalysis = async () => {
    if (!createdCompanyId) {
      setError("Please save the company first before running AI analysis");
      return;
    }

    setIsAnalyzing(true);
    setError("");

    try {
      const response = await fetch("/api/ai-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyId: createdCompanyId,
          analysisData: { ...formData, uploadedFiles },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate AI analysis");
      }

      const { analysis } = await response.json();

      setAnalysisResult(
        `AI Analysis Results for ${formData.companyName || "this company"}:
        
• Overall SAP Fit: ${analysis.overallFit} (${analysis.fitScore}% match)
• Estimated ROI: ${analysis.estimatedROI}%
• Implementation Timeline: ${analysis.implementationTime}
• Key Recommendations: ${analysis.recommendations.join(", ")}

This analysis suggests strong potential for SAP solutions with a phased implementation approach.`
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate analysis"
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCreateDeal = () => {
    if (createdCompanyId) {
      router.push(`/pipeline?newDeal=true&companyId=${createdCompanyId}`);
    }
  };

  console.log("Rendering step:", currentStep);

  React.useEffect(() => {
    const logSubmit = (e: Event) => {
      console.log("Global submit event detected:", e.target);
    };
    window.addEventListener("submit", logSubmit, true);
    return () => window.removeEventListener("submit", logSubmit, true);
  }, []);

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">
            New Account Intake
          </h1>
          <p className="text-gray-600">
            Comprehensive prospect information capture with document upload
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500 mb-1">Form Progress</div>
          <div className="flex items-center gap-2">
            <Progress value={calculateProgress()} className="w-24" />
            <span className="text-sm font-medium">{calculateProgress()}%</span>
          </div>
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
          <AlertDescription className="text-green-800">
            {success}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {React.createElement(steps[currentStep].icon, {
                    className: "h-5 w-5 text-blue-600",
                  })}
                  {steps[currentStep].title}
                </CardTitle>
                <div className="text-sm text-gray-500">
                  Step {currentStep + 1} of {steps.length}
                </div>
              </div>

              {/* Step Progress */}
              <div className="flex gap-2 mt-4">
                {steps.map((step, index) => (
                  <div
                    key={index}
                    className={`flex-1 h-2 rounded-full ${
                      index <= currentStep ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>
            </CardHeader>

            <CardContent>
              <form
                onSubmit={handleSubmit}
                onKeyDown={(e) => {
                  // Only allow Enter to submit if the Save button is focused
                  if (
                    e.key === "Enter" &&
                    !(
                      document.activeElement &&
                      document.activeElement.getAttribute("type") === "submit"
                    )
                  ) {
                    e.preventDefault();
                  }
                }}
                className="space-y-6"
              >
                {/* Step 0: Company Info */}
                {currentStep === 0 && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="companyName">Company Name *</Label>
                      <Input
                        id="companyName"
                        value={formData.companyName}
                        onChange={(e) =>
                          handleInputChange("companyName", e.target.value)
                        }
                        placeholder="Enter company name"
                        className={
                          validationErrors.companyName ? "border-red-500" : ""
                        }
                      />
                      {validationErrors.companyName && (
                        <p className="text-sm text-red-600 mt-1">
                          {validationErrors.companyName}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="industry">Industry *</Label>
                        <Select
                          onValueChange={(value) =>
                            handleInputChange("industry", value)
                          }
                          value={formData.industry}
                        >
                          <SelectTrigger
                            className={
                              validationErrors.industry ? "border-red-500" : ""
                            }
                          >
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
                        {validationErrors.industry && (
                          <p className="text-sm text-red-600 mt-1">
                            {validationErrors.industry}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="size">Company Size *</Label>
                        <Select
                          onValueChange={(value) =>
                            handleInputChange("size", value)
                          }
                          value={formData.size}
                        >
                          <SelectTrigger
                            className={
                              validationErrors.size ? "border-red-500" : ""
                            }
                          >
                            <SelectValue placeholder="Select company size" />
                          </SelectTrigger>
                          <SelectContent>
                            {companySizes.map((size) => (
                              <SelectItem key={size.value} value={size.value}>
                                <div className="flex items-center gap-2">
                                  <Badge className={size.color}>
                                    {size.label}
                                  </Badge>
                                  <span className="text-sm text-gray-600">
                                    {size.range}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {validationErrors.size && (
                          <p className="text-sm text-red-600 mt-1">
                            {validationErrors.size}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="region">Region *</Label>
                        <Select
                          onValueChange={(value) =>
                            handleInputChange("region", value)
                          }
                          value={formData.region}
                        >
                          <SelectTrigger
                            className={
                              validationErrors.region ? "border-red-500" : ""
                            }
                          >
                            <SelectValue placeholder="Select region" />
                          </SelectTrigger>
                          <SelectContent>
                            {regions.map((region) => (
                              <SelectItem key={region} value={region}>
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4" />
                                  {region}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {validationErrors.region && (
                          <p className="text-sm text-red-600 mt-1">
                            {validationErrors.region}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="website">Website</Label>
                        <div className="relative">
                          <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="website"
                            value={formData.website}
                            onChange={(e) =>
                              handleInputChange("website", e.target.value)
                            }
                            placeholder="https://company.com"
                            className="pl-10"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 1: Business Details */}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="challenges">Business Challenges</Label>
                      <Textarea
                        id="challenges"
                        value={formData.challenges}
                        onChange={(e) =>
                          handleInputChange("challenges", e.target.value)
                        }
                        placeholder="Describe the main business challenges they're facing..."
                        rows={4}
                      />
                    </div>

                    <div>
                      <Label htmlFor="currentSystems">Current Systems</Label>
                      <Textarea
                        id="currentSystems"
                        value={formData.currentSystems}
                        onChange={(e) =>
                          handleInputChange("currentSystems", e.target.value)
                        }
                        placeholder="What systems are they currently using? (ERP, CRM, etc.)"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="budget">Budget Range</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="budget"
                            value={formData.budget}
                            onChange={(e) =>
                              handleInputChange("budget", e.target.value)
                            }
                            placeholder="e.g., $100K - $500K"
                            className="pl-10"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="timeline">
                          Implementation Timeline
                        </Label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="timeline"
                            value={formData.timeline}
                            onChange={(e) =>
                              handleInputChange("timeline", e.target.value)
                            }
                            placeholder="e.g., 6-12 months"
                            className="pl-10"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="priority">Priority Level</Label>
                      <Select
                        onValueChange={(value) =>
                          handleInputChange("priority", value)
                        }
                        value={formData.priority}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority level" />
                        </SelectTrigger>
                        <SelectContent>
                          {priorities.map((priority) => (
                            <SelectItem
                              key={priority.value}
                              value={priority.value}
                            >
                              <div className="flex items-center gap-2">
                                <Badge className={priority.color}>
                                  {priority.label}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Step 2: Contacts & Files */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Primary Contact *
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="primaryName">Full Name *</Label>
                          <Input
                            id="primaryName"
                            value={formData.primaryContact.name}
                            onChange={(e) =>
                              handleContactChange(
                                "primaryContact",
                                "name",
                                e.target.value
                              )
                            }
                            placeholder="John Smith"
                            className={
                              validationErrors.primaryContactName
                                ? "border-red-500"
                                : ""
                            }
                          />
                          {validationErrors.primaryContactName && (
                            <p className="text-sm text-red-600 mt-1">
                              {validationErrors.primaryContactName}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="primaryTitle">Job Title</Label>
                          <Input
                            id="primaryTitle"
                            value={formData.primaryContact.title}
                            onChange={(e) =>
                              handleContactChange(
                                "primaryContact",
                                "title",
                                e.target.value
                              )
                            }
                            placeholder="CTO, IT Director, etc."
                          />
                        </div>
                        <div>
                          <Label htmlFor="primaryEmail">Email *</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                              id="primaryEmail"
                              type="email"
                              value={formData.primaryContact.email}
                              onChange={(e) =>
                                handleContactChange(
                                  "primaryContact",
                                  "email",
                                  e.target.value
                                )
                              }
                              placeholder="john@company.com"
                              className={`pl-10 ${
                                validationErrors.primaryContactEmail
                                  ? "border-red-500"
                                  : ""
                              }`}
                            />
                          </div>
                          {validationErrors.primaryContactEmail && (
                            <p className="text-sm text-red-600 mt-1">
                              {validationErrors.primaryContactEmail}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="primaryPhone">Phone</Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                              id="primaryPhone"
                              value={formData.primaryContact.phone}
                              onChange={(e) =>
                                handleContactChange(
                                  "primaryContact",
                                  "phone",
                                  e.target.value
                                )
                              }
                              placeholder="+1 (555) 123-4567"
                              className="pl-10"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Secondary Contact (Optional)
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="secondaryName">Full Name</Label>
                          <Input
                            id="secondaryName"
                            value={formData.secondaryContact.name}
                            onChange={(e) =>
                              handleContactChange(
                                "secondaryContact",
                                "name",
                                e.target.value
                              )
                            }
                            placeholder="Jane Doe"
                          />
                        </div>
                        <div>
                          <Label htmlFor="secondaryTitle">Job Title</Label>
                          <Input
                            id="secondaryTitle"
                            value={formData.secondaryContact.title}
                            onChange={(e) =>
                              handleContactChange(
                                "secondaryContact",
                                "title",
                                e.target.value
                              )
                            }
                            placeholder="CFO, Project Manager, etc."
                          />
                        </div>
                        <div>
                          <Label htmlFor="secondaryEmail">Email</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                              id="secondaryEmail"
                              type="email"
                              value={formData.secondaryContact.email}
                              onChange={(e) =>
                                handleContactChange(
                                  "secondaryContact",
                                  "email",
                                  e.target.value
                                )
                              }
                              placeholder="jane@company.com"
                              className="pl-10"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="secondaryPhone">Phone</Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                              id="secondaryPhone"
                              value={formData.secondaryContact.phone}
                              onChange={(e) =>
                                handleContactChange(
                                  "secondaryContact",
                                  "phone",
                                  e.target.value
                                )
                              }
                              placeholder="+1 (555) 987-6543"
                              className="pl-10"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* File Upload Section */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Upload className="h-5 w-5" />
                        Document Upload
                        <Badge variant="outline" className="text-xs">
                          S3 Cloud Storage
                        </Badge>
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        {fileTypes.map((fileType) => (
                          <div
                            key={fileType.value}
                            className="border border-gray-200 rounded-lg p-4"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              {React.createElement(fileType.icon, {
                                className: "h-4 w-4 text-gray-600",
                              })}
                              <Label className="text-sm font-medium">
                                {fileType.label}
                              </Label>
                            </div>
                            <Input
                              type="file"
                              multiple
                              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png"
                              onChange={(e) =>
                                handleFileUpload(e, fileType.value)
                              }
                              disabled={isUploading}
                              className="text-sm"
                            />
                          </div>
                        ))}
                      </div>

                      {/* Uploaded Files List */}
                      {uploadedFiles.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium mb-2">
                            Uploaded Files ({uploadedFiles.length})
                          </h4>
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {uploadedFiles.map((file) => (
                              <div
                                key={file.id}
                                className={`flex items-center justify-between p-2 rounded border ${
                                  file.status === "uploading"
                                    ? "bg-blue-50 border-blue-200"
                                    : file.status === "error"
                                    ? "bg-red-50 border-red-200"
                                    : "bg-gray-50 border-gray-200"
                                }`}
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  {file.status === "uploading" ? (
                                    <Loader2 className="h-4 w-4 text-blue-500 flex-shrink-0 animate-spin" />
                                  ) : file.status === "error" ? (
                                    <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                                  ) : (
                                    <FileText className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium truncate">
                                      {file.name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {formatFileSize(file.size)} •{" "}
                                      {file.category}
                                      {file.s3Key && (
                                        <span className="text-green-600 ml-1">
                                          • S3
                                        </span>
                                      )}
                                    </p>
                                    {file.status === "uploading" && (
                                      <p className="text-xs text-blue-600">
                                        Uploading to S3...
                                      </p>
                                    )}
                                    {file.status === "error" && file.error && (
                                      <p className="text-xs text-red-600">
                                        {file.error}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  {file.url && file.status === "success" && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        window.open(file.url, "_blank")
                                      }
                                      title="Download file"
                                    >
                                      <Download className="h-3 w-3" />
                                    </Button>
                                  )}
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeFile(file.id)}
                                    className="text-red-600 hover:text-red-700"
                                    title="Remove file"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {isUploading && (
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center gap-2 text-sm text-blue-700 mb-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="font-medium">
                              Uploading to S3...
                            </span>
                          </div>
                          <p className="text-xs text-blue-600">
                            Files are being securely uploaded to AWS S3 cloud
                            storage
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 3: Additional Info */}
                {currentStep === 3 && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="notes">Additional Notes</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) =>
                          handleInputChange("notes", e.target.value)
                        }
                        placeholder="Any additional information, meeting notes, special requirements..."
                        rows={4}
                      />
                    </div>

                    <div>
                      <Label htmlFor="tags">Tags</Label>
                      <div className="flex gap-2 mb-2">
                        <Input
                          id="tags"
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          placeholder="Add a tag (e.g., hot-lead, enterprise, urgent)"
                          onKeyPress={(e) =>
                            e.key === "Enter" && (e.preventDefault(), addTag())
                          }
                        />
                        <Button type="button" onClick={addTag} size="sm">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {formData.tags.map((tag, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="flex items-center gap-1"
                          >
                            {tag}
                            <X
                              className="h-3 w-3 cursor-pointer hover:text-red-600"
                              onClick={() => removeTag(tag)}
                            />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    disabled={currentStep === 0}
                  >
                    Previous
                  </Button>

                  <div className="flex gap-2">
                    {currentStep < steps.length - 1 ? (
                      <Button type="button" onClick={nextStep}>
                        Next
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        onClick={() => {
                          saveClickedRef.current = true;
                          console.log("Save button clicked");
                        }}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Account
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* AI-Powered SAP Module Recommendations */}
          {(suggestedModules.length > 0 || isLoadingRecommendations) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-green-700 flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  AI-Powered SAP Recommendations
                  {isLoadingRecommendations && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingRecommendations ? (
                  <div className="space-y-3">
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {suggestedModules.map((module, index) => (
                      <div
                        key={index}
                        className="p-3 border border-green-200 rounded-lg bg-green-50"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Badge className="bg-green-100 text-green-800">
                            {module.product_name}
                          </Badge>
                          {module.confidence_score && (
                            <span className="text-xs text-green-600">
                              {module.confidence_score}% match
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 mb-2">
                          {module.description}
                        </p>
                        {module.reasoning && (
                          <p className="text-xs text-green-600 italic">
                            AI Reasoning: {module.reasoning}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-sm text-gray-600 mt-3">
                  Powered by OpenAI • Based on:{" "}
                  <strong>{formData.industry}</strong>
                  {uploadedFiles.length > 0 &&
                    ` • ${uploadedFiles.length} uploaded documents`}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Form Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                Form Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm space-y-2">
                {formData.companyName && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Company:</span>
                    <span className="font-medium">{formData.companyName}</span>
                  </div>
                )}
                {formData.industry && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Industry:</span>
                    <span className="font-medium">{formData.industry}</span>
                  </div>
                )}
                {formData.size && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Size:</span>
                    <Badge className="text-xs">
                      {
                        companySizes.find((s) => s.value === formData.size)
                          ?.label
                      }
                    </Badge>
                  </div>
                )}
                {formData.priority && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Priority:</span>
                    <Badge
                      className={
                        priorities.find((p) => p.value === formData.priority)
                          ?.color
                      }
                    >
                      {
                        priorities.find((p) => p.value === formData.priority)
                          ?.label
                      }
                    </Badge>
                  </div>
                )}
                {formData.primaryContact.name && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Contact:</span>
                    <span className="font-medium">
                      {formData.primaryContact.name}
                    </span>
                  </div>
                )}
                {uploadedFiles.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Files:</span>
                    <Badge variant="outline">
                      {uploadedFiles.length} uploaded
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
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

                <Button
                  onClick={handleCreateDeal}
                  variant="outline"
                  className="w-full bg-transparent"
                >
                  Create Deal Opportunity
                </Button>
              </CardContent>
            </Card>
          )}

          {/* AI Analysis Results */}
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
                  <pre className="text-sm text-blue-900 whitespace-pre-wrap font-sans">
                    {analysisResult}
                  </pre>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={handleCreateDeal}
                  >
                    Create Deal
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push("/analyzer")}
                  >
                    View Full Analysis
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
