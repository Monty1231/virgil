"use client";

import { useState, useEffect } from "react";

interface Deal {
  id: number;
  deal_name: string;
  stage: string;
  deal_value?: number;
  value?: number;
  notes: string;
  last_activity: string;
  company_name: string;
  ae_name: string;
}

export function useDeals() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    try {
      const response = await fetch("/api/deals");
      if (!response.ok) throw new Error("Failed to fetch deals");
      const data = await response.json();
      setDeals(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const createDeal = async (dealData: Partial<Deal>) => {
    try {
      const response = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dealData),
      });
      if (!response.ok) throw new Error("Failed to create deal");
      const newDeal = await response.json();
      setDeals((prev) => [newDeal, ...prev]);
      return newDeal;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      throw err;
    }
  };

  return { deals, loading, error, createDeal, refetch: fetchDeals };
}
