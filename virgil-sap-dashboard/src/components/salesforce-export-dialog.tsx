"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Cloud,
  CheckCircle,
  AlertCircle,
  Clock,
  Download,
  Settings,
  Building,
  DollarSign,
  Calendar,
  User,
} from "lucide-react";

interface CommissionData {
  id: number;
  deal_id: number;
  deal_name?: string;
  deal_value: number;
  commission_rate: number;
  commission_amount: number;
  submission_status: string;
  submission_date: string;
  notes?: string;
  submitted_by: number;
}

interface SalesforceExportDialogProps {
  commissionData: CommissionData;
  onExportComplete?: (result: any) => void;
  trigger?: React.ReactNode;
}

interface ExportOptions {
  exportType: "opportunity" | "quote" | "order" | "all";
  stage: string;
  probability: number;
  closeDate: string;
  additionalNotes: string;
  createAccount: boolean;
  accountName: string;
}

export function SalesforceExportDialog({
  commissionData,
  onExportComplete,
  trigger,
}: SalesforceExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportResult, setExportResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    exportType: "opportunity",
    stage: "Prospecting",
    probability: 20,
    closeDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    additionalNotes: "",
    createAccount: false,
    accountName: "",
  });

  const handleExport = async () => {
    setExporting(true);
    setExportProgress(0);
    setError(null);
    setExportResult(null);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setExportProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch("/api/commissions/export-to-salesforce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...commissionData,
          exportOptions,
        }),
      });

      clearInterval(progressInterval);
      setExportProgress(100);

      const result = await response.json();

      if (result.success) {
        setExportResult(result);
        onExportComplete?.(result);
        setTimeout(() => {
          setOpen(false);
          setExporting(false);
          setExportProgress(0);
          setExportResult(null);
        }, 2000);
      } else {
        setError(result.error || "Export failed");
        setExporting(false);
        setExportProgress(0);
      }
    } catch (err) {
      setError("Network error occurred during export");
      setExporting(false);
      setExportProgress(0);
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Cloud className="mr-2 h-4 w-4" />
            Export to Salesforce
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5 text-blue-600" />
            Export to Salesforce CPQ
          </DialogTitle>
          <DialogDescription>
            Export this commission submission to Salesforce as an opportunity,
            quote, or order.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Commission Data Summary */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">
              Commission Data
            </h3>
            <div className="grid gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Deal Name:</span>
                <span className="font-medium">
                  {commissionData.deal_name || `Deal ${commissionData.deal_id}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Deal Value:</span>
                <span className="font-medium">
                  {formatCurrency(commissionData.deal_value)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Commission Rate:</span>
                <span className="font-medium">
                  {commissionData.commission_rate}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Commission Amount:</span>
                <span className="font-medium text-green-600">
                  {formatCurrency(commissionData.commission_amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <Badge className={getStatusColor(commissionData.submission_status)}>
                  {commissionData.submission_status}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Export Options */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">
              Export Configuration
            </h3>

            <div className="grid gap-4">
              <div>
                <Label htmlFor="exportType">Export Type</Label>
                <Select
                  value={exportOptions.exportType}
                  onValueChange={(value: any) =>
                    setExportOptions((prev) => ({
                      ...prev,
                      exportType: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="opportunity">Opportunity</SelectItem>
                    <SelectItem value="quote">Quote</SelectItem>
                    <SelectItem value="order">Order</SelectItem>
                    <SelectItem value="all">Opportunity + Quote + Order</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="stage">Stage</Label>
                  <Select
                    value={exportOptions.stage}
                    onValueChange={(value) =>
                      setExportOptions((prev) => ({
                        ...prev,
                        stage: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Prospecting">Prospecting</SelectItem>
                      <SelectItem value="Qualification">Qualification</SelectItem>
                      <SelectItem value="Proposal">Proposal</SelectItem>
                      <SelectItem value="Negotiation">Negotiation</SelectItem>
                      <SelectItem value="Closed Won">Closed Won</SelectItem>
                      <SelectItem value="Closed Lost">Closed Lost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="probability">Probability (%)</Label>
                  <Input
                    id="probability"
                    type="number"
                    min="0"
                    max="100"
                    value={exportOptions.probability}
                    onChange={(e) =>
                      setExportOptions((prev) => ({
                        ...prev,
                        probability: parseInt(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="closeDate">Close Date</Label>
                <Input
                  id="closeDate"
                  type="date"
                  value={exportOptions.closeDate}
                  onChange={(e) =>
                    setExportOptions((prev) => ({
                      ...prev,
                      closeDate: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <Label htmlFor="additionalNotes">Additional Notes</Label>
                <Textarea
                  id="additionalNotes"
                  value={exportOptions.additionalNotes}
                  onChange={(e) =>
                    setExportOptions((prev) => ({
                      ...prev,
                      additionalNotes: e.target.value,
                    }))
                  }
                  placeholder="Any additional information for Salesforce..."
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="createAccount"
                  checked={exportOptions.createAccount}
                  onChange={(e) =>
                    setExportOptions((prev) => ({
                      ...prev,
                      createAccount: e.target.checked,
                    }))
                  }
                  className="rounded border-gray-300"
                />
                <Label htmlFor="createAccount">Create Account Record</Label>
              </div>

              {exportOptions.createAccount && (
                <div>
                  <Label htmlFor="accountName">Account Name</Label>
                  <Input
                    id="accountName"
                    value={exportOptions.accountName}
                    onChange={(e) =>
                      setExportOptions((prev) => ({
                        ...prev,
                        accountName: e.target.value,
                      }))
                    }
                    placeholder="Enter account name..."
                  />
                </div>
              )}
            </div>
          </div>

          {/* Export Progress */}
          {exporting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Exporting to Salesforce...</span>
                <span>{exportProgress}%</span>
              </div>
              <Progress value={exportProgress} className="w-full" />
            </div>
          )}

          {/* Success Message */}
          {exportResult && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Successfully exported to Salesforce CPQ!
                {exportResult.data?.salesforceId && (
                  <div className="mt-1 text-sm">
                    Salesforce ID: {exportResult.data.salesforceId}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Error Message */}
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={exporting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={exporting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {exporting ? (
              <>
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Cloud className="mr-2 h-4 w-4" />
                Export to Salesforce
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 