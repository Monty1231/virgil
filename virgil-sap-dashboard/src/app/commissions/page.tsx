"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { DollarSign, Upload, CheckCircle, Clock, AlertCircle, FileText, Calendar } from "lucide-react"

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
]

const getStatusColor = (status: string) => {
  switch (status) {
    case "Approved":
      return "bg-green-100 text-green-800"
    case "Under Review":
      return "bg-yellow-100 text-yellow-800"
    case "Rejected":
      return "bg-red-100 text-red-800"
    case "Draft":
      return "bg-gray-100 text-gray-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "Approved":
      return <CheckCircle className="h-4 w-4 text-green-600" />
    case "Under Review":
      return <Clock className="h-4 w-4 text-yellow-600" />
    case "Rejected":
      return <AlertCircle className="h-4 w-4 text-red-600" />
    default:
      return <Clock className="h-4 w-4 text-gray-600" />
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

export default function Commissions() {
  const [formData, setFormData] = useState({
    dealName: "",
    clientName: "",
    dealValue: "",
    closeDate: "",
    sapProducts: "",
    commissionRate: "5",
    notes: "",
  })

  const [submissions, setSubmissions] = useState(mockSubmissions)

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const calculateCommission = () => {
    const dealValue = Number.parseFloat(formData.dealValue) || 0
    const rate = Number.parseFloat(formData.commissionRate) || 0
    return (dealValue * rate) / 100
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newSubmission = {
      id: submissions.length + 1,
      dealName: formData.dealName,
      amount: Number.parseFloat(formData.dealValue) || 0,
      submissionDate: new Date().toISOString().split("T")[0],
      status: "Under Review",
      commissionAmount: calculateCommission(),
      notes: formData.notes,
    }
    setSubmissions([newSubmission, ...submissions])
    setFormData({
      dealName: "",
      clientName: "",
      dealValue: "",
      closeDate: "",
      sapProducts: "",
      commissionRate: "5",
      notes: "",
    })
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Commission Submission</h1>
          <p className="text-gray-600">Submit and track your closed deal commissions</p>
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
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="dealName">Deal Name</Label>
                <Input
                  id="dealName"
                  value={formData.dealName}
                  onChange={(e) => handleInputChange("dealName", e.target.value)}
                  placeholder="Enter deal name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="clientName">Client Name</Label>
                <Input
                  id="clientName"
                  value={formData.clientName}
                  onChange={(e) => handleInputChange("clientName", e.target.value)}
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
                    onChange={(e) => handleInputChange("dealValue", e.target.value)}
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
                    onChange={(e) => handleInputChange("closeDate", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="sapProducts">SAP Products/Modules</Label>
                <Select onValueChange={(value) => handleInputChange("sapProducts", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select primary SAP product" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="s4hana">S/4HANA</SelectItem>
                    <SelectItem value="ariba">Ariba</SelectItem>
                    <SelectItem value="successfactors">SuccessFactors</SelectItem>
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
                  onValueChange={(value) => handleInputChange("commissionRate", value)}
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
                    <span className="text-green-800 font-medium">Estimated Commission:</span>
                    <span className="text-green-900 font-bold text-lg">{formatCurrency(calculateCommission())}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                  <Upload className="mr-2 h-4 w-4" />
                  Submit for Review
                </Button>
                <Button type="button" variant="outline">
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
              {submissions.map((submission) => (
                <div key={submission.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900">{submission.dealName}</h4>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Submitted: {submission.submissionDate}
                      </p>
                    </div>
                    <Badge className={getStatusColor(submission.status)}>
                      {getStatusIcon(submission.status)}
                      <span className="ml-1">{submission.status}</span>
                    </Badge>
                  </div>

                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Deal Value:</span>
                      <span className="font-medium">{formatCurrency(submission.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Commission:</span>
                      <span className="font-medium text-green-600">{formatCurrency(submission.commissionAmount)}</span>
                    </div>
                    {submission.notes && (
                      <p className="text-xs text-gray-500 mt-2 p-2 bg-gray-50 rounded">{submission.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Submitted (YTD)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(submissions.reduce((sum, s) => sum + s.amount, 0))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Approved Commissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(
                submissions.filter((s) => s.status === "Approved").reduce((sum, s) => sum + s.commissionAmount, 0),
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {submissions.filter((s) => s.status === "Under Review").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Approval Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {Math.round((submissions.filter((s) => s.status === "Approved").length / submissions.length) * 100)}%
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
