"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Building, PlugZap, Unplug } from "lucide-react";

export function SalesforceIntegration() {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      setError(null);
      const res = await fetch("/api/salesforce", { cache: "no-store" });
      const json = await res.json();
      setConnected(!!json.connected);
    } catch (e) {
      setError("Failed to check Salesforce status");
      setConnected(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const connect = () => {
    window.location.href = "/api/salesforce/auth";
  };
  const disconnect = async () => {
    try {
      const res = await fetch("/api/salesforce/disconnect", { method: "POST" });
      if (!res.ok) throw new Error("Failed to disconnect");
      fetchStatus();
    } catch (e) {
      setError("Failed to disconnect Salesforce");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5 text-blue-600" />
          Salesforce
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">Connection</div>
            <div className="text-sm text-muted-foreground">
              {connected === null
                ? "Checking..."
                : connected
                ? "Connected"
                : "Not connected"}
            </div>
          </div>
          {connected ? (
            <Button
              variant="outline"
              onClick={disconnect}
              className="bg-transparent"
            >
              <Unplug className="mr-2 h-4 w-4" />
              Disconnect
            </Button>
          ) : (
            <Button onClick={connect} className="bg-blue-600 hover:bg-blue-700">
              <PlugZap className="mr-2 h-4 w-4" />
              Connect Salesforce
            </Button>
          )}
        </div>

        <Separator />
        <div className="text-sm text-muted-foreground">
          Requires a Salesforce Connected App with scopes: api, refresh_token,
          web. Set environment variables: SALESFORCE_CLIENT_ID,
          SALESFORCE_CLIENT_SECRET, SALESFORCE_REDIRECT_URI,
          SALESFORCE_LOGIN_URL (for sandbox use https://test.salesforce.com).
        </div>
      </CardContent>
    </Card>
  );
}
