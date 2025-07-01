"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Building2, User, Calendar, DollarSign, Plus, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const stages = ["Discovery", "Proposal", "Demo", "Negotiation", "Closed"]

const mockDeals = [
  {
    id: 1,
    company: "TechCorp Industries",
    stage: "Discovery",
    value: 250000,
    ae: "Sarah Johnson",
    lastActivity: "2 days ago",
    notes: "Initial discovery call scheduled for next week",
  },
  {
    id: 2,
    company: "Global Manufacturing",
    stage: "Proposal",
    value: 500000,
    ae: "Mike Chen",
    lastActivity: "1 day ago",
    notes: "Proposal submitted, awaiting feedback",
  },
  {
    id: 3,
    company: "RetailMax Solutions",
    stage: "Demo",
    value: 180000,
    ae: "Emily Davis",
    lastActivity: "3 hours ago",
    notes: "Demo went well, technical questions answered",
  },
  {
    id: 4,
    company: "FinanceFirst Bank",
    stage: "Negotiation",
    value: 750000,
    ae: "David Wilson",
    lastActivity: "5 hours ago",
    notes: "Contract terms under review",
  },
  {
    id: 5,
    company: "HealthTech Solutions",
    stage: "Discovery",
    value: 320000,
    ae: "Sarah Johnson",
    lastActivity: "1 week ago",
    notes: "Needs assessment in progress",
  },
  {
    id: 6,
    company: "EduCorp Systems",
    stage: "Proposal",
    value: 150000,
    ae: "Mike Chen",
    lastActivity: "3 days ago",
    notes: "Customizing proposal for education sector",
  },
  {
    id: 7,
    company: "AutoParts Inc",
    stage: "Demo",
    value: 400000,
    ae: "Emily Davis",
    lastActivity: "2 days ago",
    notes: "Follow-up demo requested for procurement team",
  },
  {
    id: 8,
    company: "GreenEnergy Corp",
    stage: "Closed",
    value: 600000,
    ae: "David Wilson",
    lastActivity: "1 day ago",
    notes: "Contract signed! Implementation starts Q1",
  },
]

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

export default function Pipeline() {
  const [deals, setDeals] = useState(mockDeals)

  const getDealsByStage = (stage: string) => {
    return deals.filter((deal) => deal.stage === stage)
  }

  const getStageTotal = (stage: string) => {
    return getDealsByStage(stage).reduce((sum, deal) => sum + deal.value, 0)
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Pipeline Tracker</h1>
            <p className="text-gray-600">Manage your sales opportunities through each stage</p>
          </div>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" />
          Add Deal
        </Button>
      </div>

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
              {getDealsByStage(stage).map((deal) => (
                <Card key={deal.id} className="cursor-move hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-2">
                          <Building2 className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
                          <div className="min-w-0">
                            <h4 className="font-medium text-gray-900 text-sm leading-tight">{deal.company}</h4>
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
                        <span className="font-medium text-green-600">{formatCurrency(deal.value)}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="h-3 w-3" />
                        <span className="truncate">{deal.ae}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="h-3 w-3" />
                        <span>{deal.lastActivity}</span>
                      </div>

                      {deal.notes && <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded">{deal.notes}</p>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
