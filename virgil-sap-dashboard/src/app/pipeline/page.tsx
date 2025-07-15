"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Building2,
  User,
  Calendar,
  DollarSign,
  MoreHorizontal,
  GripVertical,
  Search,
  Filter,
  X,
  AlertTriangle,
  Star,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AddDealDialog } from "@/components/add-deal-dialog";
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
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const stages = ["Discovery", "Proposal", "Demo", "Negotiation", "Closed-Won"];

interface Deal {
  id: number;
  deal_name: string;
  stage: string;
  deal_value: number;
  company_name: string;
  ae_name: string;
  last_activity: string;
  notes: string;
  priority?: "high" | "medium" | "low";
}

const getStageColor = (stage: string) => {
  switch (stage) {
    case "Discovery":
      return "bg-primary/10 text-primary border-primary/20";
    case "Proposal":
      return "bg-secondary text-secondary-foreground border-secondary/20";
    case "Demo":
      return "bg-accent text-accent-foreground border-accent/20";
    case "Negotiation":
      return "bg-muted text-muted-foreground border-muted/20";
    case "Closed-Won":
      return "bg-green-100 text-green-800 border-green-200";
    default:
      return "bg-muted text-muted-foreground border-muted/20";
  }
};

const formatCurrency = (amount: number) => {
  // Handle invalid amounts
  if (
    amount === null ||
    amount === undefined ||
    isNaN(amount) ||
    typeof amount !== "number"
  ) {
    return "$0";
  }

  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

  return formatted;
};

const formatDate = (dateString: string) => {
  if (!dateString) return "No activity";

  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return "1 day ago";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
  return `${Math.ceil(diffDays / 30)} months ago`;
};

const getPriorityColor = (priority?: string) => {
  switch (priority) {
    case "high":
      return "bg-red-100 text-red-800 border-red-200";
    case "medium":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "low":
      return "bg-green-100 text-green-800 border-green-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const getPriorityIcon = (priority?: string) => {
  switch (priority) {
    case "high":
      return <AlertTriangle className="h-3 w-3 text-red-600" />;
    case "medium":
      return <Star className="h-3 w-3 text-yellow-600" />;
    case "low":
      return <Star className="h-3 w-3 text-green-600" />;
    default:
      return null;
  }
};

const getDealAge = (dateString: string) => {
  if (!dateString) return 0;
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const getDealAgeColor = (days: number) => {
  if (days > 30) return "text-red-600";
  if (days > 14) return "text-orange-600";
  if (days > 7) return "text-yellow-600";
  return "text-gray-600";
};

const getDealAgeText = (days: number) => {
  if (days === 0) return "Today";
  if (days === 1) return "1 day";
  if (days < 7) return `${days} days`;
  if (days < 30) return `${Math.ceil(days / 7)} weeks`;
  return `${Math.ceil(days / 30)} months`;
};

interface DealCardProps {
  deal: Deal;
  isDragging?: boolean;
  isSelected?: boolean;
  onSelect?: (dealId: number, selected: boolean) => void;
  onEdit?: (deal: Deal) => void;
  onAddNote?: (deal: Deal) => void;
}

function DealCard({
  deal,
  isDragging = false,
  isSelected = false,
  onSelect,
  onEdit,
  onAddNote,
}: DealCardProps) {
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
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging || isSortableDragging ? 0.5 : 1,
  };

  const dealAge = getDealAge(deal.last_activity);
  const ageColor = getDealAgeColor(dealAge);
  const ageText = getDealAgeText(dealAge);

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`cursor-grab hover:shadow-md transition-shadow w-full border-blue-300 ${
        isDragging || isSortableDragging ? "shadow-lg ring-2 ring-blue-600" : ""
      } ${isSelected ? "ring-2 ring-blue-600 bg-blue-100" : ""}`}
      {...attributes}
    >
      <CardContent className="p-3">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 flex-1 min-w-0">
              {onSelect && (
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => onSelect(deal.id, e.target.checked)}
                  className="mt-1 h-4 w-4 text-blue-700 focus:ring-blue-600 border-blue-400 rounded"
                  onClick={(e) => e.stopPropagation()}
                />
              )}
              <div
                {...listeners}
                className="mt-0.5 cursor-grab hover:text-blue-700 transition-colors flex-shrink-0"
              >
                <GripVertical className="h-4 w-4 text-blue-500" />
              </div>
              <Building2 className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-gray-900 text-sm leading-tight break-words">
                    {deal.company_name || "Unknown Company"}
                  </h4>
                  {deal.priority && (
                    <Badge
                      variant="outline"
                      className={`text-xs ${getPriorityColor(deal.priority)}`}
                    >
                      {getPriorityIcon(deal.priority)}
                      <span className="ml-1 capitalize">{deal.priority}</span>
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-gray-700 break-words line-clamp-2">
                  {deal.deal_name}
                </p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 flex-shrink-0 text-blue-500 hover:text-blue-700"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit && onEdit(deal)}>
                  Edit Deal
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAddNote && onAddNote(deal)}>
                  Add Note
                </DropdownMenuItem>
                <DropdownMenuItem>Schedule Follow-up</DropdownMenuItem>
                <DropdownMenuItem className="text-red-600">
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="h-3 w-3 text-green-700 flex-shrink-0" />
            <span className="font-medium text-green-700 truncate">
              {formatCurrency(Number(deal.deal_value))}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-700">
            <User className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{deal.ae_name || "Unassigned"}</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-3 w-3 flex-shrink-0" />
            <span className={`truncate ${ageColor}`}>
              {ageText} ago
              {dealAge > 14 && (
                <span className="ml-1 text-xs bg-red-100 text-red-800 px-1 rounded">
                  Aging
                </span>
              )}
            </span>
          </div>

          {deal.notes && (
            <p className="text-xs text-gray-700 bg-blue-100 p-2 rounded break-words line-clamp-3">
              {deal.notes}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface DroppableStageProps {
  stage: string;
  children: React.ReactNode;
  isOver?: boolean;
}

function DroppableStage({
  stage,
  children,
  isOver = false,
}: DroppableStageProps) {
  const { setNodeRef, isOver: isDroppableOver } = useDroppable({
    id: `droppable-${stage}`,
    data: {
      type: "stage",
      stage: stage,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`space-y-3 min-h-[400px] p-3 rounded-lg border-2 border-dashed transition-all duration-200 ${
        isOver || isDroppableOver
          ? "border-blue-500 bg-blue-100/50"
          : "border-blue-300 bg-blue-50/50"
      }`}
      data-stage={stage}
    >
      {children}
    </div>
  );
}

export default function Pipeline() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);
  const [activeStage, setActiveStage] = useState<string | null>(null);

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAE, setSelectedAE] = useState<string>("");
  const [minValue, setMinValue] = useState<string>("");
  const [selectedPriority, setSelectedPriority] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  // Bulk selection state
  const [selectedDeals, setSelectedDeals] = useState<Set<number>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);

  // Edit deal state
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [editFormData, setEditFormData] = useState({
    deal_name: "",
    company_name: "",
    ae_name: "",
    deal_value: "",
    stage: "",
    notes: "",
    priority: "",
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const fetchDeals = async () => {
    try {
      setError(null);

      const response = await fetch("/api/deals");

      if (!response.ok) {
        throw new Error(
          `Failed to fetch deals: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      if (response.status === 500 && data.deals) {
        setDeals(data.deals);
        setError(data.details || "Database connection issue");
      } else if (Array.isArray(data)) {
        if (data.length > 0) {
          // Check if all deals have $0 values
          const dealsWithValues = data.filter(
            (deal) => deal.deal_value && deal.deal_value > 0
          );
          if (dealsWithValues.length === 0) {
            console.log(
              "⚠️ All deals have $0 or null values. This might be expected if no deals have been created with values yet."
            );
          }
        }
        setDeals(data);
      } else {
        console.error("API returned unexpected data format:", data);
        setDeals([]);
        setError("Invalid data format received from server");
      }
    } catch (error) {
      console.error("Failed to fetch deals:", error);
      setError(error instanceof Error ? error.message : "Failed to load deals");
      setDeals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, []);

  // Filter deals based on search and filter criteria
  const getFilteredDeals = () => {
    if (!Array.isArray(deals)) return [];

    return deals.filter((deal) => {
      // Search term filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        deal.company_name?.toLowerCase().includes(searchLower) ||
        deal.deal_name?.toLowerCase().includes(searchLower) ||
        deal.ae_name?.toLowerCase().includes(searchLower);

      // AE filter
      const matchesAE = !selectedAE || deal.ae_name === selectedAE;

      // Value filter
      const matchesValue =
        !minValue || (deal.deal_value || 0) >= parseInt(minValue);

      // Priority filter
      const matchesPriority =
        !selectedPriority || deal.priority === selectedPriority;

      return matchesSearch && matchesAE && matchesValue && matchesPriority;
    });
  };

  const filteredDeals = getFilteredDeals();

  // Get unique AEs for filter dropdown
  const uniqueAEs = Array.from(
    new Set(deals.map((deal) => deal.ae_name).filter(Boolean))
  );

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedAE("");
    setMinValue("");
    setSelectedPriority("");
  };

  const getDealsByStage = (stage: string) => {
    return filteredDeals.filter((deal) => deal.stage === stage);
  };

  const getStageTotal = (stage: string) => {
    const stageDeals = getDealsByStage(stage);

    return stageDeals.reduce((sum, deal) => {
      let value = deal.deal_value;

      // Convert string to number if needed
      if (typeof value === "string") {
        value = parseFloat(value);
      }

      // Handle null, undefined, NaN, and non-numeric values
      if (
        value === null ||
        value === undefined ||
        isNaN(value) ||
        typeof value !== "number"
      ) {
        return sum;
      }
      return sum + value;
    }, 0);
  };

  const handleDealCreated = () => {
    fetchDeals();
  };

  const handleEditDeal = (deal: Deal) => {
    setEditingDeal(deal);
    setEditFormData({
      deal_name: deal.deal_name || "",
      company_name: deal.company_name || "",
      ae_name: deal.ae_name || "",
      deal_value: deal.deal_value?.toString() || "",
      stage: deal.stage || "",
      notes: deal.notes || "",
      priority: deal.priority || "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editingDeal) return;

    try {
      const response = await fetch(`/api/deals/${editingDeal.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deal_name: editFormData.deal_name,
          company_name: editFormData.company_name,
          ae_name: editFormData.ae_name,
          deal_value: parseFloat(editFormData.deal_value) || 0,
          stage: editFormData.stage,
          notes: editFormData.notes,
          priority: editFormData.priority,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update deal");
      }

      const updatedDeal = await response.json();
      setDeals((prevDeals) =>
        prevDeals.map((deal) =>
          deal.id === editingDeal.id ? updatedDeal : deal
        )
      );

      setEditingDeal(null);
      setEditFormData({
        deal_name: "",
        company_name: "",
        ae_name: "",
        deal_value: "",
        stage: "",
        notes: "",
        priority: "",
      });
    } catch (error) {
      console.error("Error updating deal:", error);
      alert("Failed to update deal. Please try again.");
    }
  };

  const handleAddNote = (deal: Deal) => {
    const note = prompt("Enter your note:");
    if (note && note.trim()) {
      handleEditDeal({
        ...deal,
        notes: deal.notes ? `${deal.notes}\n\n${note}` : note,
      });
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const dealId = active.id.toString().replace("deal-", "");
    const deal = deals.find((d) => d.id.toString() === dealId);
    setActiveDeal(deal || null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (over) {
      // Extract stage from droppable ID
      const targetStage = over.id.toString().replace("droppable-", "");
      if (stages.includes(targetStage)) {
        setActiveStage(targetStage);
      }
    } else {
      setActiveStage(null);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDeal(null);
    setActiveStage(null);

    if (!over) {
      return;
    }

    const dealId = active.id.toString().replace("deal-", "");

    // Extract stage from droppable ID
    let newStage: string;
    if (over.data.current?.type === "stage") {
      newStage = over.data.current.stage;
    } else {
      // Fallback: extract from ID
      newStage = over.id.toString().replace("droppable-", "");
    }

    // Validate that newStage is a valid stage
    if (!stages.includes(newStage)) {
      return;
    }

    // Find the deal being moved
    const deal = deals.find((d) => d.id.toString() === dealId);
    if (!deal) {
      return;
    }

    if (deal.stage === newStage) {
      return;
    }

    // Optimistically update the UI
    setDeals((prevDeals) =>
      prevDeals.map((d) =>
        d.id.toString() === dealId
          ? { ...d, stage: newStage, last_activity: new Date().toISOString() }
          : d
      )
    );

    try {
      const requestBody = { stage: newStage };

      const response = await fetch(`/api/deals/${dealId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP ${response.status}`);
      }

      const updatedDeal = await response.json();

      // Update with the actual response data
      setDeals((prevDeals) =>
        prevDeals.map((d) => (d.id.toString() === dealId ? updatedDeal : d))
      );
    } catch (error) {
      // Revert the optimistic update
      setDeals((prevDeals) =>
        prevDeals.map((d) =>
          d.id.toString() === dealId ? { ...d, stage: deal.stage } : d
        )
      );

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      alert(`Failed to move deal: ${errorMessage}`);
    }
  };

  // Bulk selection handlers
  const handleDealSelect = (dealId: number, selected: boolean) => {
    const newSelected = new Set(selectedDeals);
    if (selected) {
      newSelected.add(dealId);
    } else {
      newSelected.delete(dealId);
    }
    setSelectedDeals(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedDeals.size === filteredDeals.length) {
      setSelectedDeals(new Set());
    } else {
      setSelectedDeals(new Set(filteredDeals.map((deal) => deal.id)));
    }
  };

  const handleBulkMove = async (newStage: string) => {
    if (selectedDeals.size === 0) return;

    const selectedDealIds = Array.from(selectedDeals);

    // Optimistically update UI
    setDeals((prevDeals) =>
      prevDeals.map((deal) =>
        selectedDeals.has(deal.id)
          ? {
              ...deal,
              stage: newStage,
              last_activity: new Date().toISOString(),
            }
          : deal
      )
    );

    try {
      // Update each selected deal
      const updatePromises = selectedDealIds.map((dealId) =>
        fetch(`/api/deals/${dealId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stage: newStage }),
        })
      );

      await Promise.all(updatePromises);
      setSelectedDeals(new Set());
      setBulkMode(false);
    } catch (error) {
      alert("Failed to move some deals. Please try again.");
      // Refresh deals to revert optimistic updates
      fetchDeals();
    }
  };

  // Get aging deals (deals that haven't been updated in more than 14 days)
  const getAgingDeals = () => {
    return filteredDeals.filter((deal) => getDealAge(deal.last_activity) > 14);
  };

  const agingDeals = getAgingDeals();

  const downloadPipelinePivot = async () => {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/export-pipeline-pivot"
      );
      if (!response.ok) throw new Error("Network response was not ok");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      // Get filename from Content-Disposition header
      let filename = "pipeline_template.xlsx";
      const disposition = response.headers.get("Content-Disposition");
      if (disposition && disposition.indexOf("filename=") !== -1) {
        filename = disposition
          .split("filename=")[1]
          .replace(/['"]/g, "")
          .trim();
      }
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert(
        "Failed to export: " + (error instanceof Error ? error.message : error)
      );
    }
  };

  if (loading) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Pipeline Tracker
            </h1>
            <p className="text-gray-600">Loading deals...</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-5">
          {stages.map((stage) => (
            <Card key={stage} className="text-center">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stage}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">-</div>
                <p className="text-sm text-gray-500">Loading...</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
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
              <h1 className="text-3xl font-bold">Pipeline Tracker</h1>
              <p className="text-gray-700">
                {error ? (
                  <span className="text-red-600">Error: {error}</span>
                ) : (
                  `Drag deals between stages to update their status (${filteredDeals.length} of ${deals.length} deals)`
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {bulkMode && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">
                  {selectedDeals.size} selected
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-blue-300 hover:bg-blue-100"
                    >
                      Move Selected
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {stages.map((stage) => (
                      <DropdownMenuItem
                        key={stage}
                        onClick={() => handleBulkMove(stage)}
                      >
                        Move to {stage}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setBulkMode(false);
                    setSelectedDeals(new Set());
                  }}
                >
                  Cancel
                </Button>
              </div>
            )}
            <Button
              variant={bulkMode ? "default" : "outline"}
              size="sm"
              className={
                bulkMode
                  ? "bg-blue-950 hover:bg-blue-900"
                  : "border-blue-300 hover:bg-blue-100"
              }
              onClick={() => setBulkMode(!bulkMode)}
            >
              {bulkMode ? "Exit Bulk Mode" : "Bulk Actions"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-blue-300 hover:bg-blue-100"
              onClick={downloadPipelinePivot}
            >
              Export Pipeline Pivot to Excel
            </Button>
            <AddDealDialog onDealCreated={handleDealCreated} />
          </div>
        </div>

        {/* Aging Deals Alert */}
        {agingDeals.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <p className="text-amber-800 text-sm font-medium">
                {agingDeals.length} deal{agingDeals.length > 1 ? "s" : ""} aging
                in pipeline
              </p>
            </div>
            <p className="text-amber-600 text-xs mt-1">
              These deals haven't been updated in over 14 days. Consider
              following up or updating their status.
            </p>
          </div>
        )}

        {/* Search and Filter Controls */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-500" />
              <Input
                placeholder="Search deals by company, deal name, or AE..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-blue-300 focus:border-blue-500 focus:ring-blue-500"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-blue-500 hover:text-blue-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 border-blue-300 hover:bg-blue-100 hover:border-blue-400"
            >
              <Filter className="h-4 w-4" />
              Filters
              {(selectedAE || minValue || selectedPriority) && (
                <Badge
                  variant="secondary"
                  className="ml-1 bg-blue-200 text-blue-800"
                >
                  {
                    [selectedAE, minValue, selectedPriority].filter(Boolean)
                      .length
                  }
                </Badge>
              )}
            </Button>
            {(selectedAE || minValue || selectedPriority || searchTerm) && (
              <Button
                variant="ghost"
                onClick={clearFilters}
                size="sm"
                className="text-blue-700 hover:text-blue-900"
              >
                Clear All
              </Button>
            )}
            {bulkMode && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                className="border-blue-300 hover:bg-blue-100"
              >
                {selectedDeals.size === filteredDeals.length
                  ? "Deselect All"
                  : "Select All"}
              </Button>
            )}
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg border">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Account Executive
                </label>
                <select
                  value={selectedAE}
                  onChange={(e) => setSelectedAE(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All AEs</option>
                  {uniqueAEs.map((ae) => (
                    <option key={ae} value={ae}>
                      {ae}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Minimum Deal Value
                </label>
                <Input
                  type="number"
                  placeholder="e.g., 50000"
                  value={minValue}
                  onChange={(e) => setMinValue(e.target.value)}
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Priority
                </label>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Priorities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">
              <strong>Database Issue:</strong> {error}
            </p>
            <p className="text-red-600 text-xs mt-1">
              Check your database connection and ensure the tables exist. You
              can still add new deals.
            </p>
            <Button
              onClick={fetchDeals}
              variant="outline"
              size="sm"
              className="mt-2 bg-transparent"
            >
              Retry Connection
            </Button>
          </div>
        )}

        {/* Pipeline Overview */}
        <div className="grid gap-4 md:grid-cols-5">
          {stages.map((stage) => (
            <Card
              key={stage}
              className="text-center border-blue-300 hover:shadow-lg transition-shadow bg-gradient-to-br from-white to-blue-100"
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-950">
                  {stage}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-950">
                  {getDealsByStage(stage).length}
                </div>
                <p className="text-sm text-blue-800 font-medium">
                  {formatCurrency(getStageTotal(stage))}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Kanban Board */}
        <div className="grid gap-6 md:grid-cols-5 min-h-[600px]">
          {stages.map((stage) => (
            <div key={stage} className="space-y-4 min-w-0">
              <div
                className={`p-3 rounded-lg border-2 ${getStageColor(stage)}`}
              >
                <h3 className="font-semibold text-center">{stage}</h3>
                <p className="text-sm text-center opacity-75">
                  {getDealsByStage(stage).length} deals •{" "}
                  {formatCurrency(getStageTotal(stage))}
                </p>
              </div>

              <DroppableStage stage={stage} isOver={activeStage === stage}>
                <SortableContext
                  items={getDealsByStage(stage).map(
                    (deal) => `deal-${deal.id}`
                  )}
                  strategy={verticalListSortingStrategy}
                >
                  {getDealsByStage(stage).length === 0 ? (
                    <div className="text-center text-gray-500 text-sm py-8">
                      {error
                        ? "Unable to load deals"
                        : searchTerm ||
                          selectedAE ||
                          minValue ||
                          selectedPriority
                        ? "No deals match your filters"
                        : `Drop deals here or create new ${stage} deals`}
                    </div>
                  ) : (
                    getDealsByStage(stage).map((deal) => (
                      <DealCard
                        key={deal.id}
                        deal={deal}
                        isSelected={selectedDeals.has(deal.id)}
                        onSelect={bulkMode ? handleDealSelect : undefined}
                        onEdit={handleEditDeal}
                        onAddNote={handleAddNote}
                      />
                    ))
                  )}
                </SortableContext>
              </DroppableStage>
            </div>
          ))}
        </div>

        <DragOverlay>
          {activeDeal ? <DealCard deal={activeDeal} isDragging /> : null}
        </DragOverlay>

        {/* Edit Deal Dialog */}
        {editingDeal && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-lg border">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Edit Deal
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Deal Name
                  </label>
                  <Input
                    value={editFormData.deal_name}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        deal_name: e.target.value,
                      })
                    }
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name
                  </label>
                  <Input
                    value={editFormData.company_name}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        company_name: e.target.value,
                      })
                    }
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account Executive
                  </label>
                  <Input
                    value={editFormData.ae_name}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        ae_name: e.target.value,
                      })
                    }
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Deal Value
                  </label>
                  <Input
                    type="number"
                    value={editFormData.deal_value}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        deal_value: e.target.value,
                      })
                    }
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stage
                  </label>
                  <select
                    value={editFormData.stage}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        stage: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {stages.map((stage) => (
                      <option key={stage} value={stage}>
                        {stage}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={editFormData.priority}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        priority: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">No Priority</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={editFormData.notes}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        notes: e.target.value,
                      })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <Button
                  onClick={handleSaveEdit}
                  className="flex-1 bg-blue-900 hover:bg-blue-800"
                >
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEditingDeal(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DndContext>
  );
}
