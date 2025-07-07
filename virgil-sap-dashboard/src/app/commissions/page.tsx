"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  Upload,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Calendar,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { saveAs } from "file-saver";

const mockSubmissions = [
  {
    id: 1,
    dealName: "TechCorp S/4HANA Implementation",
    amount: 750000,
    submissionDate: "2024-01-10",
    status: "Approved",
    commissionAmount: 37500,
    notes: "Q4 2023 deal, implementation started",
  },
  {
    id: 2,
    dealName: "RetailMax Commerce Cloud",
    amount: 180000,
    submissionDate: "2024-01-08",
    status: "Under Review",
    commissionAmount: 9000,
    notes: "Pending final contract verification",
  },
  {
    id: 3,
    dealName: "FinanceFirst Analytics Suite",
    amount: 320000,
    submissionDate: "2024-01-05",
    status: "Rejected",
    commissionAmount: 0,
    notes: "Missing required documentation",
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "Approved":
      return "bg-green-100 text-green-800 border-green-200";
    case "Under Review":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "Rejected":
      return "bg-red-100 text-red-800 border-red-200";
    case "Draft":
      return "bg-muted text-muted-foreground border-muted/20";
    default:
      return "bg-muted text-muted-foreground border-muted/20";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "Approved":
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case "Under Review":
      return <Clock className="h-4 w-4 text-yellow-600" />;
    case "Rejected":
      return <AlertCircle className="h-4 w-4 text-red-600" />;
    default:
      return <Clock className="h-4 w-4 text-gray-600" />;
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

function toCsvValue(val: any) {
  if (val == null) return "";
  const str = String(val);
  return str.includes(",") || str.includes('"') || str.includes("\n")
    ? '"' + str.replace(/"/g, '""') + '"'
    : str;
}

function exportCommissionsToCsv(submissions: any[]) {
  if (!submissions.length) return;
  const headers = [
    "Deal Name",
    "Deal ID",
    "Deal Value",
    "Commission Rate",
    "Commission Amount",
    "Status",
    "Submission Date",
    "Notes",
  ];
  const rows = submissions.map((s) => [
    toCsvValue(s.deal_name),
    toCsvValue(s.deal_id),
    toCsvValue(s.deal_value),
    toCsvValue(s.commission_rate),
    toCsvValue(s.commission_amount),
    toCsvValue(s.submission_status),
    toCsvValue(s.submission_date),
    toCsvValue(s.notes),
  ]);
  const csv = [headers, ...rows].map((row) => row.join(",")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  saveAs(blob, "commission_submissions.csv");
}

export default function Commissions() {
  const [formData, setFormData] = useState({
    dealName: "",
    clientName: "",
    dealValue: "",
    closeDate: "",
    sapProducts: "",
    commissionRate: "5",
    notes: "",
  });

  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(true);

  const [closedDeals] = useState([
    {
      id: 101,
      name: "Acme Corp S/4HANA",
      value: 500000,
      ae: "Sarah Johnson",
      closeDate: "2024-01-15",
    },
    {
      id: 102,
      name: "Beta Retail Cloud",
      value: 320000,
      ae: "Mike Chen",
      closeDate: "2024-01-10",
    },
    {
      id: 103,
      name: "Gamma Analytics",
      value: 180000,
      ae: "Emily Davis",
      closeDate: "2024-01-05",
    },
  ]);

  const [editingDraftId, setEditingDraftId] = useState<number | null>(null);
  const [exportingId, setExportingId] = useState<number | null>(null);

  // Fetch commission submissions from API
  useEffect(() => {
    const fetchSubmissions = async () => {
      setLoadingSubmissions(true);
      try {
        const res = await fetch("/api/commissions");
        if (!res.ok) throw new Error("Failed to fetch submissions");
        const data = await res.json();
        setSubmissions(data);
      } catch (err) {
        setSubmissions([]);
      } finally {
        setLoadingSubmissions(false);
      }
    };
    fetchSubmissions();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const calculateCommission = () => {
    const dealValue = Number.parseFloat(formData.dealValue) || 0;
    const rate = Number.parseFloat(formData.commissionRate) || 0;
    return (dealValue * rate) / 100;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const commissionAmount = calculateCommission();
      const response = await fetch("/api/commissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deal_id: 1, // TODO: Replace with real deal ID
          submitted_by: 1, // TODO: Replace with real user ID
          deal_value: Number.parseFloat(formData.dealValue) || 0,
          commission_rate: Number.parseFloat(formData.commissionRate) || 0,
          commission_amount: commissionAmount,
          notes: formData.notes,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.error || "Failed to submit commission");
        return;
      }
      alert("Commission submitted successfully!");
      setFormData({
        dealName: "",
        clientName: "",
        dealValue: "",
        closeDate: "",
        sapProducts: "",
        commissionRate: "5",
        notes: "",
      });
    } catch (err) {
      alert("Failed to submit commission. Please try again.");
    }
  };

  const handleSaveDraft = async () => {
    try {
      const commissionAmount = calculateCommission();
      const response = await fetch("/api/commissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deal_id: 1, // TODO: Replace with real deal ID
          submitted_by: 1, // TODO: Replace with real user ID
          deal_value: Number.parseFloat(formData.dealValue) || 0,
          commission_rate: Number.parseFloat(formData.commissionRate) || 0,
          commission_amount: commissionAmount,
          notes: formData.notes,
          submission_status: "Draft",
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.error || "Failed to save draft");
        return;
      }
      alert("Draft saved successfully!");
      setFormData({
        dealName: "",
        clientName: "",
        dealValue: "",
        closeDate: "",
        sapProducts: "",
        commissionRate: "5",
        notes: "",
      });
    } catch (err) {
      alert("Failed to save draft. Please try again.");
    }
  };

  const handleEditDraft = (draft: any) => {
    setFormData({
      dealName: draft.deal_name || "",
      clientName: "", // You can enhance this if you have client info
      dealValue: draft.deal_value?.toString() || "",
      closeDate: "", // You can enhance this if you have close date info
      sapProducts: "",
      commissionRate: draft.commission_rate?.toString() || "5",
      notes: draft.notes || "",
    });
    setEditingDraftId(draft.id);
  };

  const handleExportToSalesforce = async (submission: any) => {
    setExportingId(submission.id);
    try {
      const response = await fetch("/api/commissions/export-to-salesforce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submission),
      });
      const data = await response.json();
      if (data.success) {
        alert("Exported to Salesforce CPQ!");
      } else {
        alert(data.error || "Failed to export to Salesforce CPQ");
      }
    } catch (err) {
      alert("Failed to export to Salesforce CPQ");
    } finally {
      setExportingId(null);
    }
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Commission Submission
          </h1>
          <p className="text-gray-600">
            Submit and track your closed deal commissions
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Submission Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              New Commission Submission
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="mb-4 bg-slate-700 hover:bg-slate-800 text-white shadow-sm transition-all duration-200 hover:shadow-md border border-slate-600">
                  Add Closed Deal
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64" align="start">
                <div className="p-2">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">
                    Select a Closed Deal
                  </h3>
                  <div className="space-y-1">
                    {closedDeals.map((deal) => (
                      <DropdownMenuItem
                        key={deal.id}
                        onClick={() => {
                          setFormData({
                            dealName: deal.name,
                            clientName: "",
                            dealValue: deal.value.toString(),
                            closeDate: deal.closeDate,
                            sapProducts: "",
                            commissionRate: "5",
                            notes: "",
                          });
                        }}
                        className="flex flex-col items-start p-3 hover:bg-gray-50 rounded cursor-pointer"
                      >
                        <div className="font-medium text-gray-900 text-sm">
                          {deal.name}
                        </div>
                        <div className="text-xs text-gray-600">
                          ${deal.value.toLocaleString()} • {deal.ae}
                        </div>
                        <div className="text-xs text-gray-500">
                          Closed: {deal.closeDate}
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="dealName">Deal Name</Label>
                <Input
                  id="dealName"
                  value={formData.dealName}
                  onChange={(e) =>
                    handleInputChange("dealName", e.target.value)
                  }
                  placeholder="Enter deal name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="clientName">Client Name</Label>
                <Input
                  id="clientName"
                  value={formData.clientName}
                  onChange={(e) =>
                    handleInputChange("clientName", e.target.value)
                  }
                  placeholder="Enter client company name"
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="dealValue">Deal Value ($)</Label>
                  <Input
                    id="dealValue"
                    type="number"
                    value={formData.dealValue}
                    onChange={(e) =>
                      handleInputChange("dealValue", e.target.value)
                    }
                    placeholder="0"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="closeDate">Close Date</Label>
                  <Input
                    id="closeDate"
                    type="date"
                    value={formData.closeDate}
                    onChange={(e) =>
                      handleInputChange("closeDate", e.target.value)
                    }
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="sapProducts">SAP Products/Modules</Label>
                <Select
                  onValueChange={(value) =>
                    handleInputChange("sapProducts", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select primary SAP product" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="s4hana">S/4HANA</SelectItem>
                    <SelectItem value="ariba">Ariba</SelectItem>
                    <SelectItem value="successfactors">
                      SuccessFactors
                    </SelectItem>
                    <SelectItem value="concur">Concur</SelectItem>
                    <SelectItem value="analytics">Analytics Cloud</SelectItem>
                    <SelectItem value="commerce">Commerce Cloud</SelectItem>
                    <SelectItem value="multiple">Multiple Products</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="commissionRate">Commission Rate (%)</Label>
                <Select
                  value={formData.commissionRate}
                  onValueChange={(value) =>
                    handleInputChange("commissionRate", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3% - Standard</SelectItem>
                    <SelectItem value="5">5% - Premium</SelectItem>
                    <SelectItem value="7">7% - Strategic</SelectItem>
                    <SelectItem value="10">10% - New Logo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  placeholder="Any additional details about the deal..."
                  rows={3}
                />
              </div>

              {formData.dealValue && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-green-800 font-medium">
                      Estimated Commission:
                    </span>
                    <span className="text-green-900 font-bold text-lg">
                      {formatCurrency(calculateCommission())}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Submit for Review
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSaveDraft}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Save Draft
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Submission History */}
        <Card>
          <CardHeader>
            <CardTitle>Submission History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button
                className="mb-4"
                variant="outline"
                onClick={() => exportCommissionsToCsv(submissions)}
                disabled={submissions.length === 0}
              >
                Export as CSV
              </Button>
              {loadingSubmissions ? (
                <p>Loading submissions...</p>
              ) : submissions.length === 0 ? (
                <p className="text-gray-500">
                  No commission submissions found.
                </p>
              ) : (
                submissions.map((submission) => (
                  <div
                    key={submission.id}
                    className="p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {submission.deal_name ? (
                            <>
                              {submission.deal_name}{" "}
                              <span className="text-xs text-gray-500">
                                (ID: {submission.deal_id})
                              </span>
                            </>
                          ) : (
                            <>Deal ID: {submission.deal_id}</>
                          )}
                        </h4>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          Submitted: {submission.submission_date}
                        </p>
                      </div>
                      <Badge
                        className={getStatusColor(submission.submission_status)}
                      >
                        {getStatusIcon(submission.submission_status)}
                        <span className="ml-1">
                          {submission.submission_status}
                        </span>
                      </Badge>
                    </div>
                    <div className="grid gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Deal Value:</span>
                        <span className="font-medium">
                          {formatCurrency(Number(submission.deal_value))}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Commission Rate:</span>
                        <span className="font-medium">
                          {Number(submission.commission_rate)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Commission:</span>
                        <span className="font-medium text-green-600">
                          {formatCurrency(Number(submission.commission_amount))}
                        </span>
                      </div>
                      {submission.notes && (
                        <p className="text-xs text-gray-500 mt-2 p-2 bg-gray-50 rounded">
                          {submission.notes}
                        </p>
                      )}
                      {submission.submission_status === "Draft" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2"
                          onClick={() => handleEditDraft(submission)}
                        >
                          Edit
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="secondary"
                        className="mt-2 ml-2"
                        onClick={() => handleExportToSalesforce(submission)}
                        disabled={exportingId === submission.id}
                      >
                        {exportingId === submission.id
                          ? "Exporting..."
                          : "Export to Salesforce"}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Submitted (YTD)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(
                submissions.reduce((sum, s) => sum + s.amount, 0)
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Approved Commissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(
                submissions
                  .filter((s) => s.status === "Approved")
                  .reduce((sum, s) => sum + s.commissionAmount, 0)
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pending Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {submissions.filter((s) => s.status === "Under Review").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Approval Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {Math.round(
                (submissions.filter((s) => s.status === "Approved").length /
                  submissions.length) *
                  100
              )}
              %
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
