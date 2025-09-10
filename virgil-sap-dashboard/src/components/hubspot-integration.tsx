import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useHubSpot } from "@/hooks/use-hubspot";
import {
  CheckCircle,
  XCircle,
  RefreshCw,
  Database,
  Users,
  TrendingUp,
  ExternalLink,
  Settings,
  Download,
} from "lucide-react";

interface HubSpotIntegrationProps {
  className?: string;
}

export function HubSpotIntegration({ className }: HubSpotIntegrationProps) {
  const {
    isConnected,
    isLoading,
    error,
    testConnection,
    syncCompanies,
    syncContacts,
    syncDeals,
    syncAll,
    clearError,
  } = useHubSpot();

  const [syncResults, setSyncResults] = useState<any>(null);
  const [remoteCompanies, setRemoteCompanies] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);

  const disconnect = async () => {
    await fetch("/api/hubspot/disconnect", { method: "POST" });
    setSyncResults(null);
    setRemoteCompanies([]);
    setSelectedIds([]);
    testConnection();
  };

  useEffect(() => {
    testConnection();
  }, [testConnection]);

  const handleSync = async (
    syncType: "companies" | "contacts" | "deals" | "all"
  ) => {
    clearError();
    let result;
    switch (syncType) {
      case "companies":
        result = await syncCompanies();
        break;
      case "contacts":
        result = await syncContacts();
        break;
      case "deals":
        result = await syncDeals();
        break;
      case "all":
        result = await syncAll();
        break;
    }
    setSyncResults(result);
  };

  const handleConnect = () => {
    window.location.href = "/api/hubspot/auth?action=authorize";
  };

  const fetchRemoteCompanies = async () => {
    setRemoteCompanies([]);
    const res = await fetch("/api/hubspot/sync");
    const data = await res.json();
    if (data.success) setRemoteCompanies(data.companies);
  };

  const importSelected = async () => {
    if (selectedIds.length === 0) return;
    setImporting(true);
    try {
      const res = await fetch("/api/hubspot/import/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hubspotCompanyIds: selectedIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");
      setSelectedIds([]);
    } catch (e: any) {
      console.error(e);
    } finally {
      setImporting(false);
    }
  };

  const getConnectionStatus = () => {
    if (isLoading) {
      return (
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Testing connection...</span>
        </div>
      );
    }
    if (isConnected) {
      return (
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="text-green-600">Connected</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2">
        <XCircle className="h-4 w-4 text-red-600" />
        <span className="text-red-600">Not connected</span>
      </div>
    );
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5 text-purple-600" />
          HubSpot Integration
        </CardTitle>
        <CardDescription>
          Connect your account to HubSpot to sync and import companies,
          contacts, and deals
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Connection Status</span>
          {getConnectionStatus()}
        </div>

        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {syncResults?.success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              {syncResults.message} - {syncResults.synced} items synced
            </AlertDescription>
          </Alert>
        )}

        <Separator />

        {!isConnected ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Connect your HubSpot account to start syncing data
            </p>
            <Button onClick={handleConnect} className="w-full">
              <ExternalLink className="mr-2 h-4 w-4" />
              Connect to HubSpot
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Sync Operations</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testConnection()}
                  disabled={isLoading}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Test Connection
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={disconnect}
                  disabled={isLoading}
                >
                  Disconnect
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => handleSync("companies")}
                disabled={isLoading}
                className="h-auto p-3 flex flex-col items-start gap-2"
              >
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  <span>Sync Companies</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  Sync company data to HubSpot
                </span>
              </Button>

              <Button
                variant="outline"
                onClick={() => handleSync("contacts")}
                disabled={isLoading}
                className="h-auto p-3 flex flex-col items-start gap-2"
              >
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>Sync Contacts</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  Sync contact information
                </span>
              </Button>

              <Button
                variant="outline"
                onClick={() => handleSync("deals")}
                disabled={isLoading}
                className="h-auto p-3 flex flex-col items-start gap-2"
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>Sync Deals</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  Sync deal pipeline data
                </span>
              </Button>

              <Button
                onClick={() => handleSync("all")}
                disabled={isLoading}
                className="h-auto p-3 flex flex-col items-start gap-2 bg-purple-600 hover:bg-purple-700"
              >
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  <span>Sync All</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  Sync all data at once
                </span>
              </Button>
            </div>

            <Separator />

            {/* Import from HubSpot */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Import from HubSpot</span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchRemoteCompanies}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" /> Refresh List
                  </Button>
                  <Button
                    size="sm"
                    onClick={importSelected}
                    disabled={selectedIds.length === 0 || importing}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {importing
                      ? "Importing..."
                      : `Import ${selectedIds.length || ""}`}
                  </Button>
                </div>
              </div>

              {remoteCompanies.length > 0 ? (
                <div className="max-h-64 overflow-auto border rounded-md">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr className="text-left">
                        <th className="py-2 px-3">Select</th>
                        <th className="py-2 px-3">Name</th>
                        <th className="py-2 px-3">Industry</th>
                        <th className="py-2 px-3">Website</th>
                      </tr>
                    </thead>
                    <tbody>
                      {remoteCompanies.map((c) => (
                        <tr key={c.id} className="border-t">
                          <td className="py-2 px-3">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(c.id)}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setSelectedIds((prev) =>
                                  checked
                                    ? [...prev, c.id]
                                    : prev.filter((x) => x !== c.id)
                                );
                              }}
                            />
                          </td>
                          <td className="py-2 px-3 font-medium">{c.name}</td>
                          <td className="py-2 px-3">{c.industry}</td>
                          <td className="py-2 px-3 truncate max-w-[240px]">
                            {c.website ? (
                              <a
                                href={c.website}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary hover:underline"
                              >
                                {c.website}
                              </a>
                            ) : (
                              "-"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No companies loaded. Click Refresh List to load from HubSpot.
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
