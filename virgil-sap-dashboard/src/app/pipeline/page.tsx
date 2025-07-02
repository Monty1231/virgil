"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Building2, User, Calendar, DollarSign, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { AddDealDialog } from "@/components/add-deal-dialog"

const stages = ["Discovery", "Proposal", "Demo", "Negotiation", "Closed"]

interface Deal {
  id: number
  deal_name: string
  stage: string
  deal_value: number
  company_name: string
  ae_name: string
  last_activity: string
  notes: string
}

const getStageColor = (stage: string) => {
  switch (stage) {
    case "Discovery":
      return "bg-blue-100 text-blue-800 border-blue-200"
    case "Proposal":
      return "bg-yellow-100 text-yellow-800 border-yellow-200"
    case "Demo":
      return "bg-purple-100 text-purple-800 border-purple-200"
    case "Negotiation":
      return "bg-orange-100 text-orange-800 border-orange-200"
    case "Closed":
      return "bg-green-100 text-green-800 border-green-200"
    default:
      return "bg-gray-100 text-gray-800 border-gray-200"
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

const formatDate = (dateString: string) => {
  if (!dateString) return "No activity"

  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 1) return "1 day ago"
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`
  return `${Math.ceil(diffDays / 30)} months ago`
}

export default function Pipeline() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDeals = async () => {
    try {
      setError(null)
      console.log("Fetching deals from API...")

      const response = await fetch("/api/deals")
      console.log("API response status:", response.status)

      if (!response.ok) {
        throw new Error(`Failed to fetch deals: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log("API response data:", data)

      // Handle both success and error responses
      if (response.status === 500 && data.deals) {
        // API returned error but included empty deals array
        setDeals(data.deals)
        setError(data.details || "Database connection issue")
      } else if (Array.isArray(data)) {
        // Normal success response
        setDeals(data)
        console.log("Successfully loaded", data.length, "deals")
      } else {
        // Unexpected response format
        console.error("API returned unexpected data format:", data)
        setDeals([])
        setError("Invalid data format received from server")
      }
    } catch (error) {
      console.error("Failed to fetch deals:", error)
      setError(error instanceof Error ? error.message : "Failed to load deals")
      setDeals([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDeals()
  }, [])

  const getDealsByStage = (stage: string) => {
    if (!Array.isArray(deals)) {
      console.warn("deals is not an array:", deals)
      return []
    }
    return deals.filter((deal) => deal.stage === stage)
  }

  const getStageTotal = (stage: string) => {
    return getDealsByStage(stage).reduce((sum, deal) => sum + (deal.deal_value || 0), 0)
  }

  const handleDealCreated = () => {
    console.log("Deal created, refreshing pipeline...")
    fetchDeals()
  }

  if (loading) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Pipeline Tracker</h1>
            <p className="text-gray-600">Loading deals...</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-5">
          {stages.map((stage) => (
            <Card key={stage} className="text-center">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">{stage}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">-</div>
                <p className="text-sm text-gray-500">Loading...</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Pipeline Tracker</h1>
            <p className="text-gray-600">
              {error ? (
                <span className="text-red-600">Error: {error}</span>
              ) : (
                `Manage your sales opportunities through each stage (${deals.length} total deals)`
              )}
            </p>
          </div>
        </div>
        <AddDealDialog onDealCreated={handleDealCreated} />
      </div>

      {/* Show error message but still render the pipeline */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">
            <strong>Database Issue:</strong> {error}
          </p>
          <p className="text-red-600 text-xs mt-1">
            Check your database connection and ensure the tables exist. You can still add new deals.
          </p>
          <Button onClick={fetchDeals} variant="outline" size="sm" className="mt-2 bg-transparent">
            Retry Connection
          </Button>
        </div>
      )}

      {/* Pipeline Overview */}
      <div className="grid gap-4 md:grid-cols-5">
        {stages.map((stage) => (
          <Card key={stage} className="text-center">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">{stage}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{getDealsByStage(stage).length}</div>
              <p className="text-sm text-gray-500">{formatCurrency(getStageTotal(stage))}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Kanban Board */}
      <div className="grid gap-6 md:grid-cols-5 min-h-[600px]">
        {stages.map((stage) => (
          <div key={stage} className="space-y-4">
            <div className={`p-3 rounded-lg border-2 ${getStageColor(stage)}`}>
              <h3 className="font-semibold text-center">{stage}</h3>
              <p className="text-sm text-center opacity-75">
                {getDealsByStage(stage).length} deals • {formatCurrency(getStageTotal(stage))}
              </p>
            </div>

            <div className="space-y-3">
              {getDealsByStage(stage).length === 0 ? (
                <div className="text-center text-gray-500 text-sm py-8">
                  {error ? "Unable to load deals" : `No deals in ${stage}`}
                </div>
              ) : (
                getDealsByStage(stage).map((deal) => (
                  <Card key={deal.id} className="cursor-move hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-2">
                            <Building2 className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
                            <div className="min-w-0">
                              <h4 className="font-medium text-gray-900 text-sm leading-tight">
                                {deal.company_name || "Unknown Company"}
                              </h4>
                              <p className="text-xs text-gray-600 truncate">{deal.deal_name}</p>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>Edit Deal</DropdownMenuItem>
                              <DropdownMenuItem>Add Note</DropdownMenuItem>
                              <DropdownMenuItem>Schedule Follow-up</DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="h-3 w-3 text-green-600" />
                          <span className="font-medium text-green-600">{formatCurrency(deal.deal_value || 0)}</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <User className="h-3 w-3" />
                          <span className="truncate">{deal.ae_name || "Unassigned"}</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(deal.last_activity)}</span>
                        </div>

                        {deal.notes && <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded">{deal.notes}</p>}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
