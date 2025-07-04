"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Building2, AlertCircle, RefreshCw, CheckCircle } from "lucide-react"

interface Company {
  id: number
  name: string
  industry: string
  company_size?: string
  region?: string
}

interface User {
  id: number
  name: string
  role: string
}

interface AddDealDialogProps {
  onDealCreated: () => void
}

// Ensure exact same stages array as in pipeline
const stages = ["Discovery", "Proposal", "Demo", "Negotiation", "Closed"]

export function AddDealDialog({ onDealCreated }: AddDealDialogProps) {
  const [open, setOpen] = useState(false)
  const [companies, setCompanies] = useState<Company[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadingCompanies, setLoadingCompanies] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [companiesError, setCompaniesError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    company_id: "",
    deal_name: "",
    stage: "Discovery",
    deal_value: "",
    ae_assigned: "",
    expected_close_date: "",
    notes: "",
  })

  // Fetch data when dialog opens
  useEffect(() => {
    if (open) {
      console.log("🔄 Dialog opened - fetching companies and users...")
      fetchCompanies()
      fetchUsers()
    }
  }, [open])

  const fetchCompanies = async () => {
    setLoadingCompanies(true)
    setCompaniesError(null)

    try {
      console.log("🏢 Dialog: Fetching companies...")

      const response = await fetch("/api/companies", {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      })

      console.log("🏢 Dialog: Response status:", response.status)
      console.log("🏢 Dialog: Response ok:", response.ok)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log("🏢 Dialog: Response data:", data)
      console.log("🏢 Dialog: Data type:", typeof data, "Is array:", Array.isArray(data))

      if (Array.isArray(data)) {
        setCompanies(data)
        console.log("🏢 Dialog: ✅ Successfully set", data.length, "companies")

        // Log company names for verification
        if (data.length > 0) {
          console.log(
            "🏢 Dialog: Company names:",
            data.map((c) => c.name),
          )
        }
      } else {
        console.error("🏢 Dialog: ❌ Response is not an array:", data)
        setCompanies([])
        setCompaniesError("Invalid response format from server")
      }
    } catch (error) {
      console.error("🏢 Dialog: ❌ Fetch error:", error)
      setCompaniesError(error instanceof Error ? error.message : "Failed to load companies")
      setCompanies([])
    } finally {
      setLoadingCompanies(false)
    }
  }

  const fetchUsers = async () => {
    setLoadingUsers(true)

    try {
      console.log("👥 Dialog: Fetching users...")

      const response = await fetch("/api/users")

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log("👥 Dialog: Users data:", data)

      if (Array.isArray(data)) {
        setUsers(data)
        console.log("👥 Dialog: ✅ Successfully set", data.length, "users")
      } else {
        console.error("👥 Dialog: ❌ Users response is not an array:", data)
        setUsers([])
      }
    } catch (error) {
      console.error("👥 Dialog: ❌ Users fetch error:", error)
      setUsers([])
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      console.log("📝 Dialog: Submitting deal:", formData)

      const dealData = {
        ...formData,
        company_id: Number.parseInt(formData.company_id),
        deal_value: formData.deal_value ? Number.parseFloat(formData.deal_value) : 0,
        ae_assigned: formData.ae_assigned ? Number.parseInt(formData.ae_assigned) : 1,
      }

      console.log("📝 Dialog: Processed deal data:", dealData)

      const response = await fetch("/api/deals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dealData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const newDeal = await response.json()
      console.log("📝 Dialog: ✅ Deal created successfully:", newDeal)

      // Reset form and close dialog
      setFormData({
        company_id: "",
        deal_name: "",
        stage: "Discovery",
        deal_value: "",
        ae_assigned: "",
        expected_close_date: "",
        notes: "",
      })
      setOpen(false)
      onDealCreated()
    } catch (error) {
      console.error("📝 Dialog: ❌ Error creating deal:", error)
      alert(`Failed to create deal: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" />
          Add Deal
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            Create New Deal
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="company">Company *</Label>

            {/* Show loading/error states */}
            {loadingCompanies && (
              <div className="flex items-center gap-2 text-sm text-blue-600 mb-2">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Loading companies...
              </div>
            )}

            {companiesError && (
              <div className="bg-red-50 border border-red-200 rounded p-2 mb-2">
                <div className="flex items-center gap-2 text-sm text-red-700">
                  <AlertCircle className="h-3 w-3" />
                  Error: {companiesError}
                </div>
                <Button
                  type="button"
                  onClick={fetchCompanies}
                  variant="outline"
                  size="sm"
                  className="mt-1 h-6 text-xs bg-transparent"
                >
                  <RefreshCw className="mr-1 h-2 w-2" />
                  Retry
                </Button>
              </div>
            )}

            {!loadingCompanies && !companiesError && companies.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-green-600 mb-2">
                <CheckCircle className="h-3 w-3" />
                Found {companies.length} companies
              </div>
            )}

            <Select
              onValueChange={(value) => handleInputChange("company_id", value)}
              required
              disabled={loadingCompanies}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    loadingCompanies
                      ? "Loading companies..."
                      : companies.length === 0
                        ? "No companies available"
                        : "Select a company"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {loadingCompanies ? (
                  <SelectItem value="loading" disabled>
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      Loading...
                    </div>
                  </SelectItem>
                ) : companies.length === 0 ? (
                  <SelectItem value="no-companies" disabled>
                    <div className="text-center py-2">
                      <p className="text-sm text-gray-500">No companies found</p>
                      <p className="text-xs text-gray-400">Create companies in "New Account" page</p>
                    </div>
                  </SelectItem>
                ) : (
                  companies.map((company) => (
                    <SelectItem key={company.id} value={company.id.toString()}>
                      <div className="flex flex-col py-1">
                        <span className="font-medium">{company.name}</span>
                        <span className="text-xs text-gray-500">
                          {company.industry}
                          {company.company_size && ` • ${company.company_size}`}
                          {company.region && ` • ${company.region}`}
                        </span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="deal_name">Deal Name *</Label>
            <Input
              id="deal_name"
              value={formData.deal_name}
              onChange={(e) => handleInputChange("deal_name", e.target.value)}
              placeholder="e.g., TechCorp S/4HANA Implementation"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="stage">Stage *</Label>
              <Select onValueChange={(value) => handleInputChange("stage", value)} value={formData.stage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {stages.map((stage) => (
                    <SelectItem key={stage} value={stage}>
                      {stage}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="deal_value">Deal Value ($)</Label>
              <Input
                id="deal_value"
                type="number"
                value={formData.deal_value}
                onChange={(e) => handleInputChange("deal_value", e.target.value)}
                placeholder="250000"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ae_assigned">Account Executive</Label>
              <Select onValueChange={(value) => handleInputChange("ae_assigned", value)}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingUsers ? "Loading users..." : "Select AE"} />
                </SelectTrigger>
                <SelectContent>
                  {loadingUsers ? (
                    <SelectItem value="loading-users" disabled>
                      Loading users...
                    </SelectItem>
                  ) : users.length === 0 ? (
                    <SelectItem value="no-users" disabled>
                      No users available
                    </SelectItem>
                  ) : (
                    users.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.name} ({user.role})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="expected_close_date">Expected Close Date</Label>
              <Input
                id="expected_close_date"
                type="date"
                value={formData.expected_close_date}
                onChange={(e) => handleInputChange("expected_close_date", e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Initial discovery call scheduled..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || companies.length === 0 || loadingCompanies}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? "Creating..." : "Create Deal"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
