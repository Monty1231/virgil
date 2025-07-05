"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { PlusCircle, FileText, DollarSign, TrendingUp, Users, Target, Building2, Calendar } from "lucide-react"
import Link from "next/link"
import { useDeals } from "@/hooks/use-deals"
import { useState, useEffect } from "react"

interface Company {
  id: number
  name: string
  industry: string
  company_size: string
  region: string
  created_at: string
}

const getStageColor = (stage: string) => {
  switch (stage) {
    case "Discovery":
      return "bg-blue-100 text-blue-800"
    case "Proposal":
      return "bg-yellow-100 text-yellow-800"
    case "Demo":
      return "bg-purple-100 text-purple-800"
    case "Negotiation":
      return "bg-orange-100 text-orange-800"
    case "Closed-Won":
      return "bg-green-100 text-green-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export default function Dashboard() {
  const { deals, loading: dealsLoading } = useDeals()
  const [companies, setCompanies] = useState<Company[]>([])
  const [companiesLoading, setCompaniesLoading] = useState(true)

  // Fetch companies
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await fetch("/api/companies")
        if (response.ok) {
          const data = await response.json()
          setCompanies(Array.isArray(data) ? data : [])
        }
      } catch (error) {
        console.error("Failed to fetch companies:", error)
        setCompanies([])
      } finally {
        setCompaniesLoading(false)
      }
    }

    fetchCompanies()
  }, [])

  // Calculate real metrics from deals data
  const calculateMetrics = () => {
    if (!deals || deals.length === 0) {
      return {
        totalPipelineValue: 0,
        activeDeals: 0,
        closedWonCount: 0,
        closedWonValue: 0,
        winRate: 0,
      }
    }

    const totalPipelineValue = deals
      .filter((deal) => deal.stage !== "Closed-Won")
      .reduce((sum, deal) => {
        const value = Number(deal.deal_value) || 0
        return sum + value
      }, 0)

    const activeDeals = deals.filter((deal) => deal.stage !== "Closed-Won").length

    const closedWonDeals = deals.filter((deal) => deal.stage === "Closed-Won")
    const closedWonCount = closedWonDeals.length
    const closedWonValue = closedWonDeals.reduce((sum, deal) => {
      const value = Number(deal.deal_value) || 0
      return sum + value
    }, 0)

    // Calculate win rate (closed won vs total deals that have been through the pipeline)
    const totalProcessedDeals = deals.length
    const winRate = totalProcessedDeals > 0 ? Math.round((closedWonCount / totalProcessedDeals) * 100) : 0

    return {
      totalPipelineValue,
      activeDeals,
      closedWonCount,
      closedWonValue,
      winRate,
    }
  }

  const metrics = calculateMetrics()

  // Get recent active deals for display
  const recentActiveDeals = deals
    .filter((deal) => deal.stage !== "Closed-Won")
    .sort((a, b) => new Date(b.last_activity).getTime() - new Date(a.last_activity).getTime())
    .slice(0, 4)

  // Format currency with proper null checking
  const formatCurrency = (amount: number | string | null | undefined) => {
    const numAmount = Number(amount) || 0

    if (numAmount >= 1000000) {
      return `$${(numAmount / 1000000).toFixed(1)}M`
    } else if (numAmount >= 1000) {
      return `$${(numAmount / 1000).toFixed(0)}K`
    } else {
      return `$${numAmount.toLocaleString()}`
    }
  }

  // Format date for last activity
  const formatLastActivity = (dateString: string) => {
    if (!dateString) return "No activity"

    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffTime = Math.abs(now.getTime() - date.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays === 1) return "1 day ago"
      if (diffDays < 7) return `${diffDays} days ago`
      if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`
      return `${Math.ceil(diffDays / 30)} months ago`
    } catch (error) {
      return "Invalid date"
    }
  }

  if (dealsLoading || companiesLoading) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">Loading your sales data...</p>
            </div>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
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
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Welcome back! Here's your sales overview.</p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Pipeline Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.totalPipelineValue)}</div>
            <p className="text-xs text-gray-500">Active opportunities</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Deals</CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{metrics.activeDeals}</div>
            <p className="text-xs text-gray-500">In pipeline</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Closed Won</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{metrics.closedWonCount}</div>
            <p className="text-xs text-purple-600">{formatCurrency(metrics.closedWonValue)} total value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Win Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{metrics.winRate}%</div>
            <p className="text-xs text-gray-500">Overall conversion</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button asChild className="bg-blue-600 hover:bg-blue-700">
              <Link href="/new-account">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New Account
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-gray-300 bg-transparent">
              <Link href="/decks">
                <FileText className="mr-2 h-4 w-4" />
                Generate Deck
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-gray-300 bg-transparent">
              <Link href="/commissions">
                <DollarSign className="mr-2 h-4 w-4" />
                Submit Commission
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Opportunities */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">Active Opportunities</CardTitle>
        </CardHeader>
        <CardContent>
          {recentActiveDeals.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No active deals yet</p>
              <Button asChild>
                <Link href="/pipeline">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Your First Deal
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentActiveDeals.map((deal) => (
                <div
                  key={deal.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <Building2 className="h-8 w-8 text-gray-400" />
                    <div>
                      <h3 className="font-medium text-gray-900">{deal.deal_name || "Unnamed Deal"}</h3>
                      <p className="text-sm text-gray-600">
                        {deal.company_name || "Unknown Company"} • AE: {deal.ae_name || "Unassigned"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge className={getStageColor(deal.stage)}>{deal.stage}</Badge>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{formatCurrency(deal.deal_value)}</p>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatLastActivity(deal.last_activity)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4">
            <Button asChild variant="outline" className="w-full bg-transparent">
              <Link href="/pipeline">View Full Pipeline</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Companies Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">Companies in Database</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="text-2xl font-bold text-gray-900">{companies.length}</div>
            <Building2 className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-sm text-gray-600 mb-4">Total companies in your database ready for analysis</p>
          <div className="flex gap-2">
            <Button asChild size="sm">
              <Link href="/new-account">Add Company</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/analyzer">Run Analysis</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
