import { useState, useCallback } from 'react';

interface HubSpotContact {
  email: string;
  firstname: string;
  lastname: string;
  company?: string;
  phone?: string;
  jobtitle?: string;
}

interface HubSpotDeal {
  dealname: string;
  amount: string;
  dealstage: string;
  pipeline?: string;
  closedate?: string;
  contactId?: string;
  companyId?: string;
}

interface HubSpotCompany {
  name: string;
  industry?: string;
  website?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

interface SyncResult {
  success: boolean;
  synced: number;
  results: any[];
  message: string;
}

export function useHubSpot() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Test HubSpot connection
  const testConnection = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/hubspot');
      const data = await response.json();
      
      if (data.connected) {
        setIsConnected(true);
        return { success: true, message: data.message };
      } else {
        setIsConnected(false);
        setError(data.error || 'Connection failed');
        return { success: false, error: data.error };
      }
    } catch (err) {
      setIsConnected(false);
      const errorMessage = err instanceof Error ? err.message : 'Connection failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create contact in HubSpot
  const createContact = useCallback(async (contact: HubSpotContact) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/hubspot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create_contact',
          data: contact
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        return { success: true, contact: data.contact };
      } else {
        setError(data.error || 'Failed to create contact');
        return { success: false, error: data.error };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create contact';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create deal in HubSpot
  const createDeal = useCallback(async (deal: HubSpotDeal) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/hubspot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create_deal',
          data: deal
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        return { success: true, deal: data.deal };
      } else {
        setError(data.error || 'Failed to create deal');
        return { success: false, error: data.error };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create deal';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sync companies with HubSpot
  const syncCompanies = useCallback(async (): Promise<SyncResult> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/hubspot/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          syncType: 'companies'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        return data;
      } else {
        setError(data.error || 'Failed to sync companies');
        return { success: false, synced: 0, results: [], message: data.error };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sync companies';
      setError(errorMessage);
      return { success: false, synced: 0, results: [], message: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sync contacts with HubSpot
  const syncContacts = useCallback(async (): Promise<SyncResult> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/hubspot/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          syncType: 'contacts'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        return data;
      } else {
        setError(data.error || 'Failed to sync contacts');
        return { success: false, synced: 0, results: [], message: data.error };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sync contacts';
      setError(errorMessage);
      return { success: false, synced: 0, results: [], message: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sync deals with HubSpot
  const syncDeals = useCallback(async (): Promise<SyncResult> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/hubspot/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          syncType: 'deals'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        return data;
      } else {
        setError(data.error || 'Failed to sync deals');
        return { success: false, synced: 0, results: [], message: data.error };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sync deals';
      setError(errorMessage);
      return { success: false, synced: 0, results: [], message: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sync all data with HubSpot
  const syncAll = useCallback(async (): Promise<SyncResult> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/hubspot/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          syncType: 'all'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        return data;
      } else {
        setError(data.error || 'Failed to sync data');
        return { success: false, synced: 0, results: [], message: data.error };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sync data';
      setError(errorMessage);
      return { success: false, synced: 0, results: [], message: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isConnected,
    isLoading,
    error,
    testConnection,
    createContact,
    createDeal,
    syncCompanies,
    syncContacts,
    syncDeals,
    syncAll,
    clearError
  };
} 