"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Building2, User, Calendar, DollarSign, MoreHorizontal, GripVertical } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { AddDealDialog } from "@/components/add-deal-dialog"
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragOverEvent,
  useDroppable,
} from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

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

interface DealCardProps {
  deal: Deal
  isDragging?: boolean
}

function DealCard({ deal, isDragging = false }: DealCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: `deal-${deal.id}`,
    data: {
      type: "deal",
      deal,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging || isSortableDragging ? 0.5 : 1,
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`cursor-grab hover:shadow-md transition-shadow ${
        isDragging || isSortableDragging ? "shadow-lg ring-2 ring-blue-500" : ""
      }`}
      {...attributes}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-2 flex-1">
              <div {...listeners} className="mt-1 cursor-grab hover:text-gray-600 transition-colors">
                <GripVertical className="h-4 w-4 text-gray-400" />
              </div>
              <Building2 className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
              <div className="min-w-0 flex-1">
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
  )
}

interface DroppableStageProps {
  stage: string
  children: React.ReactNode
  isOver?: boolean
}

function DroppableStage({ stage, children, isOver = false }: DroppableStageProps) {
  const { setNodeRef } = useDroppable({
    id: `stage-${stage}`,
    data: {
      type: "stage",
      stage: stage, // Explicitly set the stage name
    },
  })

  return (
    <div
      ref={setNodeRef}
      className={`space-y-3 min-h-[400px] p-2 rounded-lg border-2 border-dashed transition-colors ${
        isOver ? "border-blue-400 bg-blue-50" : "border-gray-200 bg-gray-50/50"
      }`}
      data-stage={stage} // Add data attribute for debugging
    >
      {children}
    </div>
  )
}

export default function Pipeline() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null)
  const [activeStage, setActiveStage] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  )

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

      if (response.status === 500 && data.deals) {
        setDeals(data.deals)
        setError(data.details || "Database connection issue")
      } else if (Array.isArray(data)) {
        setDeals(data)
        console.log("Successfully loaded", data.length, "deals")
      } else {
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

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const dealId = active.id.toString().replace("deal-", "")
    const deal = deals.find((d) => d.id.toString() === dealId)
    setActiveDeal(deal || null)
    console.log("🎯 Drag started for deal:", deal?.deal_name, "from stage:", deal?.stage)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event
    if (over && over.data.current?.type === "stage") {
      const targetStage = over.data.current.stage
      setActiveStage(targetStage)
      console.log("🎯 Dragging over stage:", targetStage)
    } else {
      setActiveStage(null)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveDeal(null)
    setActiveStage(null)

    console.log("🎯 Drag ended - Active:", active.id, "Over:", over?.id)

    if (!over) {
      console.log("🎯 Drag ended with no drop target")
      return
    }

    const dealId = active.id.toString().replace("deal-", "")
    let newStage: string

    // Check if dropped on a stage
    if (over.data.current?.type === "stage") {
      newStage = over.data.current.stage
      console.log("🎯 Dropped on stage:", newStage)
    } else {
      console.log("🎯 Could not determine target stage, over data:", over.data.current)
      return
    }

    console.log("🎯 Attempting to move deal", dealId, "to stage", newStage)

    // Find the deal being moved
    const deal = deals.find((d) => d.id.toString() === dealId)
    if (!deal) {
      console.error("🎯 Deal not found:", dealId)
      return
    }

    if (deal.stage === newStage) {
      console.log("🎯 Deal already in target stage")
      return
    }

    console.log("🎯 Moving deal from", deal.stage, "to", newStage)

    // Optimistically update the UI
    setDeals((prevDeals) =>
      prevDeals.map((d) =>
        d.id.toString() === dealId ? { ...d, stage: newStage, last_activity: new Date().toISOString() } : d,
      ),
    )

    try {
      console.log("🔄 Making API call to update deal...")
      const response = await fetch(`/api/deals/${dealId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ stage: newStage }),
      })

      console.log("📡 API response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error("❌ API error:", errorData)
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const updatedDeal = await response.json()
      console.log("✅ Deal updated successfully:", updatedDeal)

      // Update with the actual response data
      setDeals((prevDeals) => prevDeals.map((d) => (d.id.toString() === dealId ? updatedDeal : d)))
    } catch (error) {
      console.error("❌ Error updating deal:", error)
      // Revert the optimistic update
      setDeals((prevDeals) => prevDeals.map((d) => (d.id.toString() === dealId ? { ...d, stage: deal.stage } : d)))
      alert(`Failed to move deal: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
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
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
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
                  `Drag deals between stages to update their status (${deals.length} total deals)`
                )}
              </p>
            </div>
          </div>
          <AddDealDialog onDealCreated={handleDealCreated} />
        </div>

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

              <DroppableStage stage={stage} isOver={activeStage === stage}>
                <SortableContext
                  items={getDealsByStage(stage).map((deal) => `deal-${deal.id}`)}
                  strategy={verticalListSortingStrategy}
                >
                  {getDealsByStage(stage).length === 0 ? (
                    <div className="text-center text-gray-500 text-sm py-8">
                      {error ? "Unable to load deals" : `Drop deals here or create new ${stage} deals`}
                    </div>
                  ) : (
                    getDealsByStage(stage).map((deal) => <DealCard key={deal.id} deal={deal} />)
                  )}
                </SortableContext>
              </DroppableStage>
            </div>
          ))}
        </div>

        <DragOverlay>{activeDeal ? <DealCard deal={activeDeal} isDragging /> : null}</DragOverlay>
      </div>
    </DndContext>
  )
}
