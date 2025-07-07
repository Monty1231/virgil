"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";

const stages = ["Discovery", "Proposal", "Demo", "Negotiation", "Closed-Won"];

interface AddDealDialogProps {
  onDealCreated: () => void;
}

export function AddDealDialog({ onDealCreated }: AddDealDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    deal_name: "",
    company_name: "",
    ae_name: "",
    deal_value: "",
    stage: "Discovery",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/deals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          deal_value: Number.parseFloat(formData.deal_value) || 0,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || errorData.details || "Failed to create deal"
        );
      }

      // Reset form
      setFormData({
        deal_name: "",
        company_name: "",
        ae_name: "",
        deal_value: "",
        stage: "Discovery",
        notes: "",
      });

      setOpen(false);
      onDealCreated();
    } catch (error) {
      console.error("Error creating deal:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to create deal. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!loading) {
      setOpen(newOpen);
      if (!newOpen) {
        // Reset form when dropdown closes
        setFormData({
          deal_name: "",
          company_name: "",
          ae_name: "",
          deal_value: "",
          stage: "Discovery",
          notes: "",
        });
      }
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button className="bg-slate-700 hover:bg-slate-800 text-white shadow-sm transition-all duration-200 hover:shadow-md border border-slate-600">
          <Plus className="h-4 w-4 mr-2" />
          Add Deal
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 p-4" align="end">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Add New Deal
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Create a new deal in your pipeline
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <Label
                htmlFor="deal_name"
                className="text-sm font-medium text-gray-700"
              >
                Deal Name
              </Label>
              <Input
                id="deal_name"
                value={formData.deal_name}
                onChange={(e) =>
                  setFormData({ ...formData, deal_name: e.target.value })
                }
                className="mt-1 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter deal name"
                required
                disabled={loading}
              />
            </div>

            <div>
              <Label
                htmlFor="company_name"
                className="text-sm font-medium text-gray-700"
              >
                Company
              </Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) =>
                  setFormData({ ...formData, company_name: e.target.value })
                }
                className="mt-1 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter company name"
                required
                disabled={loading}
              />
            </div>

            <div>
              <Label
                htmlFor="ae_name"
                className="text-sm font-medium text-gray-700"
              >
                Account Executive
              </Label>
              <Input
                id="ae_name"
                value={formData.ae_name}
                onChange={(e) =>
                  setFormData({ ...formData, ae_name: e.target.value })
                }
                className="mt-1 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter AE name"
                required
                disabled={loading}
              />
            </div>

            <div>
              <Label
                htmlFor="deal_value"
                className="text-sm font-medium text-gray-700"
              >
                Deal Value
              </Label>
              <Input
                id="deal_value"
                type="number"
                value={formData.deal_value}
                onChange={(e) =>
                  setFormData({ ...formData, deal_value: e.target.value })
                }
                className="mt-1 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
                disabled={loading}
              />
            </div>

            <div>
              <Label
                htmlFor="stage"
                className="text-sm font-medium text-gray-700"
              >
                Stage
              </Label>
              <Select
                value={formData.stage}
                onValueChange={(value) =>
                  setFormData({ ...formData, stage: value })
                }
                disabled={loading}
              >
                <SelectTrigger className="mt-1 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
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
              <Label
                htmlFor="notes"
                className="text-sm font-medium text-gray-700"
              >
                Notes
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                className="mt-1 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Optional notes about this deal..."
                rows={2}
                disabled={loading}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
                className="flex-1 transition-all duration-200"
                size="sm"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 hover:shadow-md"
                size="sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Deal"
                )}
              </Button>
            </div>
          </form>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
