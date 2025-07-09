import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useHubSpot } from '@/hooks/use-hubspot';
import { 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Database, 
  Users, 
  TrendingUp,
  ExternalLink,
  Settings
} from 'lucide-react';

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
    clearError
  } = useHubSpot();

  const [syncResults, setSyncResults] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Test connection on component mount
  useEffect(() => {
    testConnection();
  }, [testConnection]);

  const handleSync = async (syncType: 'companies' | 'contacts' | 'deals' | 'all') => {
    clearError();
    let result;
    
    switch (syncType) {
      case 'companies':
        result = await syncCompanies();
        break;
      case 'contacts':
        result = await syncContacts();
        break;
      case 'deals':
        result = await syncDeals();
        break;
      case 'all':
        result = await syncAll();
        break;
    }
    
    setSyncResults(result);
  };

  const handleConnect = () => {
    // Redirect to HubSpot OAuth
    window.location.href = '/api/hubspot/auth?action=authorize';
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
          Connect your account to HubSpot to sync contacts, companies, and deals
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Connection Status</span>
          {getConnectionStatus()}
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Message */}
        {syncResults?.success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              {syncResults.message} - {syncResults.synced} items synced
            </AlertDescription>
          </Alert>
        )}

        <Separator />

        {/* Connection Actions */}
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => testConnection()}
                disabled={isLoading}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Test Connection
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => handleSync('companies')}
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
                onClick={() => handleSync('contacts')}
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
                onClick={() => handleSync('deals')}
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
                onClick={() => handleSync('all')}
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

            {/* Sync Results */}
            {syncResults && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Last Sync Results</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <Badge variant={syncResults.success ? "default" : "destructive"}>
                      {syncResults.success ? "Success" : "Failed"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Items Synced:</span>
                    <span>{syncResults.synced}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Message:</span>
                    <span className="text-muted-foreground">{syncResults.message}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Environment Variables Info */}
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            Required Environment Variables
          </h4>
          <div className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
            <div>• HUBSPOT_CLIENT_ID</div>
            <div>• HUBSPOT_CLIENT_SECRET</div>
            <div>• HUBSPOT_ACCESS_TOKEN</div>
            <div>• HUBSPOT_REDIRECT_URI (optional)</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 