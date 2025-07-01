"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { PlusCircle, FileText, DollarSign, TrendingUp, Users, Target, Building2, Calendar } from "lucide-react"
import Link from "next/link"

const mockDeals = [
  {
    id: 1,
    company: "TechCorp Industries",
    stage: "Discovery",
    value: "$250K",
    ae: "Sarah Johnson",
    lastActivity: "2 days ago",
  },
  {
    id: 2,
    company: "Global Manufacturing",
    stage: "Proposal",
    value: "$500K",
    ae: "Mike Chen",
    lastActivity: "1 day ago",
  },
  {
    id: 3,
    company: "RetailMax Solutions",
    stage: "Demo",
    value: "$180K",
    ae: "Emily Davis",
    lastActivity: "3 hours ago",
  },
  {
    id: 4,
    company: "FinanceFirst Bank",
    stage: "Negotiation",
    value: "$750K",
    ae: "David Wilson",
    lastActivity: "5 hours ago",
  },
]

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
    case "Closed":
      return "bg-green-100 text-green-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export default function Dashboard() {
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
            <div className="text-2xl font-bold text-gray-900">$1.68M</div>
            <p className="text-xs text-green-600">+12% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Deals</CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">24</div>
            <p className="text-xs text-blue-600">4 new this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Closed Won (Q4)</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">8</div>
            <p className="text-xs text-purple-600">$2.1M total value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Win Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">67%</div>
            <p className="text-xs text-green-600">Above target (60%)</p>
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
          <div className="space-y-4">
            {mockDeals.map((deal) => (
              <div
                key={deal.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-4">
                  <Building2 className="h-8 w-8 text-gray-400" />
                  <div>
                    <h3 className="font-medium text-gray-900">{deal.company}</h3>
                    <p className="text-sm text-gray-600">AE: {deal.ae}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge className={getStageColor(deal.stage)}>{deal.stage}</Badge>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{deal.value}</p>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {deal.lastActivity}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Button asChild variant="outline" className="w-full bg-transparent">
              <Link href="/pipeline">View Full Pipeline</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
