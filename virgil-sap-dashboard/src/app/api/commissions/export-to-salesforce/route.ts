import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserSalesforceConfig } from "@/lib/salesforce";

interface SalesforceConfig {
  instanceUrl: string;
  accessToken: string;
  refreshToken?: string;
  clientId?: string;
  clientSecret?: string;
  apiVersion: string;
}

interface CommissionData {
  id: number;
  deal_id: number;
  deal_name?: string;
  deal_value: number;
  commission_rate: number;
  commission_amount: number;
  submission_status: string;
  submission_date: string;
  notes?: string;
  submitted_by: number;
}

interface SalesforceOpportunity {
  Name: string;
  Amount: number;
  CloseDate: string;
  StageName: string;
  Description?: string;
  Type: string;
  LeadSource: string;
  Probability: number;
}

interface SalesforceQuote {
  Name: string;
  OpportunityId: string;
  ExpirationDate: string;
  Status: string;
  Description?: string;
  GrandTotal: number;
}

interface SalesforceOrder {
  OpportunityId: string;
  EffectiveDate: string;
  Status: string;
  Description?: string;
  TotalAmount: number;
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  instance_url: string;
  token_type: string;
  expires_in: number;
}

class SalesforceAPI {
  private config: SalesforceConfig;
  private tokenExpiry?: Date;

  constructor(config: SalesforceConfig) {
    this.config = config;
  }

  private async refreshAccessToken(): Promise<void> {
    if (
      !this.config.refreshToken ||
      !this.config.clientId ||
      !this.config.clientSecret
    ) {
      throw new Error(
        "Refresh token, client ID, and client secret are required for token refresh"
      );
    }

    const loginBase = process.env.SALESFORCE_LOGIN_URL || "https://login.salesforce.com";

    try {
      const response = await fetch(
        `${loginBase}/services/oauth2/token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            grant_type: "refresh_token",
            client_id: this.config.clientId,
            client_secret: this.config.clientSecret,
            refresh_token: this.config.refreshToken,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        // Specific guidance when refresh token is invalid/expired
        if (errorText.includes("invalid_grant")) {
          throw new Error(
            "Salesforce refresh token is invalid or expired. Please re-authenticate your Salesforce connection."
          );
        }
        throw new Error(
          `Token refresh failed: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const tokenData: TokenResponse = await response.json();

      // Update the config with new token
      this.config.accessToken = tokenData.access_token;
      if (tokenData.refresh_token) {
        this.config.refreshToken = tokenData.refresh_token;
      }
      this.config.instanceUrl = tokenData.instance_url;

      // Set token expiry (subtract 5 minutes for safety)
      this.tokenExpiry = new Date(
        Date.now() + (tokenData.expires_in - 300) * 1000
      );

      console.log("Salesforce access token refreshed successfully");
    } catch (error) {
      console.error("Failed to refresh Salesforce access token:", error);
      throw new Error(
        error instanceof Error ? error.message :
        "Failed to refresh Salesforce access token. Please re-authenticate."
      );
    }
  }

  private async makeRequest(
    endpoint: string,
    method: string = "GET",
    data?: any,
    retryCount: number = 0
  ): Promise<any> {
    const url = `${this.config.instanceUrl}/services/data/v${this.config.apiVersion}/${endpoint}`;

    const headers: HeadersInit = {
      Authorization: `Bearer ${this.config.accessToken}`,
      "Content-Type": "application/json",
    };

    const options: RequestInit = {
      method,
      headers,
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        const errorText = await response.text();

        // Check if it's an authentication error and we haven't retried yet
        if (
          response.status === 401 &&
          retryCount === 0 &&
          this.config.refreshToken
        ) {
          console.log(
            "Salesforce session expired, attempting token refresh..."
          );
          await this.refreshAccessToken();
          // Retry the request with the new token
          return this.makeRequest(endpoint, method, data, retryCount + 1);
        }

        throw new Error(
          `Salesforce API error: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Salesforce API request failed:", error);
      throw error;
    }
  }

  async createOpportunity(opportunityData: SalesforceOpportunity) {
    return this.makeRequest("sobjects/Opportunity", "POST", opportunityData);
  }

  async createQuote(quoteData: SalesforceQuote) {
    return this.makeRequest("sobjects/Quote", "POST", quoteData);
  }

  async createOrder(orderData: SalesforceOrder) {
    return this.makeRequest("sobjects/Order", "POST", orderData);
  }

  async searchRecords(query: string) {
    return this.makeRequest(`query?q=${encodeURIComponent(query)}`);
  }

  async getRecord(sobject: string, id: string) {
    return this.makeRequest(`sobjects/${sobject}/${id}`);
  }

  // Test the connection and token validity
  async testConnection() {
    try {
      await this.makeRequest("sobjects");
      return true;
    } catch (error) {
      console.error("Salesforce connection test failed:", error);
      return false;
    }
  }
}

// Helper function to get Salesforce configuration for current user or fallback to env
async function getSalesforceConfigForUser(): Promise<SalesforceConfig> {
  const session = await getServerSession(authOptions);
  const apiVersion = process.env.SALESFORCE_API_VERSION || "64.0";
  const clientId = process.env.SALESFORCE_CLIENT_ID;
  const clientSecret = process.env.SALESFORCE_CLIENT_SECRET;

  if (session?.user?.id && session.user.id !== "0") {
    try {
      const creds = await getUserSalesforceConfig(Number(session.user.id));
      return {
        instanceUrl: creds.instanceUrl,
        accessToken: creds.accessToken,
        refreshToken: process.env.SALESFORCE_REFRESH_TOKEN || undefined, // optional if using user refresh later
        clientId,
        clientSecret,
        apiVersion,
      };
    } catch (e) {
      // fallthrough to env-based config
    }
  }

  // fallback to env
  const instanceUrl = process.env.SALESFORCE_INSTANCE_URL;
  const accessToken = process.env.SALESFORCE_ACCESS_TOKEN;
  if (!instanceUrl || !accessToken) {
    throw new Error(
      "Salesforce configuration missing. Please connect Salesforce in Settings or set env variables."
    );
  }
  return {
    instanceUrl,
    accessToken,
    refreshToken: process.env.SALESFORCE_REFRESH_TOKEN,
    clientId,
    clientSecret,
    apiVersion,
  };
}

// Helper function to format commission data for Salesforce
function formatCommissionForSalesforce(commissionData: CommissionData) {
  const closeDate = new Date();
  closeDate.setDate(closeDate.getDate() + 30); // Set close date to 30 days from now

  const opportunityData: SalesforceOpportunity = {
    Name:
      commissionData.deal_name || `Commission Deal ${commissionData.deal_id}`,
    Amount: commissionData.deal_value,
    CloseDate: closeDate.toISOString().split("T")[0],
    StageName: "Prospecting",
    Description: `Commission submission for deal ${
      commissionData.deal_id
    }. Commission amount: $${commissionData.commission_amount} (${
      commissionData.commission_rate
    }% rate). ${commissionData.notes || ""}`,
    Type: "New Customer",
    LeadSource: "Virgil Dashboard",
    Probability: 20,
  };

  return opportunityData;
}

export async function POST(request: Request) {
  try {
    const commissionData: CommissionData = await request.json();

    // Validate required fields
    if (
      !commissionData.deal_id ||
      !commissionData.deal_value ||
      !commissionData.commission_amount
    ) {
      return NextResponse.json(
        { success: false, error: "Missing required commission data" },
        { status: 400 }
      );
    }

    // Real Salesforce integration if user connected or env set, else mock
    let config: SalesforceConfig | null = null;
    try {
      config = await getSalesforceConfigForUser();
    } catch {
      // no config found, fallback to mock
    }

    if (!config) {
      console.log("[MOCK] Exporting to Salesforce CPQ:", commissionData);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return NextResponse.json({
        success: true,
        message: "Exported to Salesforce CPQ (mock - connect Salesforce in Settings)",
        data: {
          opportunity: formatCommissionForSalesforce(commissionData),
          commissionData,
        },
      });
    }

    const sfApi = new SalesforceAPI(config);

    // Test the connection first
    const connectionTest = await sfApi.testConnection();
    if (!connectionTest) {
      throw new Error(
        "Failed to connect to Salesforce. Please check your credentials and try again."
      );
    }

    const opportunityData = formatCommissionForSalesforce(commissionData);
    const result = await sfApi.createOpportunity(opportunityData);

    if (!result.success) {
      throw new Error(
        `Failed to create Salesforce opportunity: ${result.errors?.join(", ")}`
      );
    }

    return NextResponse.json({
      success: true,
      message: "Successfully exported to Salesforce CPQ",
      data: {
        salesforceId: result.id,
        opportunity: opportunityData,
        commissionData,
      },
    });
  } catch (error) {
    console.error("Salesforce export error:", error);

    let errorMessage = "Failed to export to Salesforce CPQ";
    if (error instanceof Error) {
      if (
        error.message.includes("Salesforce refresh token is invalid or expired")
      ) {
        errorMessage =
          "Your Salesforce session has expired. Please reconnect Salesforce in Settings > Integrations.";
      } else if (error.message.includes("401 Unauthorized")) {
        errorMessage =
          "Salesforce session expired. Please refresh your authentication token.";
      } else if (
        error.message.includes("Failed to refresh Salesforce access token")
      ) {
        errorMessage =
          "Salesforce authentication failed. Please re-authenticate with Salesforce.";
      } else if (error.message.includes("Salesforce configuration missing")) {
        errorMessage =
          "Salesforce not connected. Go to Settings > Integrations to connect.";
      } else if (error.message.includes("Failed to connect to Salesforce")) {
        errorMessage =
          "Unable to connect to Salesforce. Please check your configuration.";
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
