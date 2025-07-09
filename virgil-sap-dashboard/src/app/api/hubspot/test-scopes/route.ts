import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = process.env.HUBSPOT_CLIENT_ID;
    const redirectUri = process.env.HUBSPOT_REDIRECT_URI || "http://localhost:3000/api/hubspot/auth/callback";

    // Test different scope combinations
    const scopeTests = [
      {
        name: "Basic Read Only",
        scopes: "crm.objects.contacts.read%20crm.objects.companies.read%20crm.objects.deals.read",
        description: "Only read permissions"
      },
      {
        name: "Contacts Only",
        scopes: "crm.objects.contacts.read%20crm.objects.contacts.write",
        description: "Contacts read and write only"
      },
      {
        name: "Companies Only", 
        scopes: "crm.objects.companies.read%20crm.objects.companies.write",
        description: "Companies read and write only"
      },
      {
        name: "Deals Only",
        scopes: "crm.objects.deals.read%20crm.objects.deals.write", 
        description: "Deals read and write only"
      },
      {
        name: "All Current",
        scopes: "crm.objects.contacts.read%20crm.objects.contacts.write%20crm.objects.companies.read%20crm.objects.companies.write%20crm.objects.deals.read%20crm.objects.deals.write",
        description: "All scopes currently in code"
      }
    ];

    const testUrls = scopeTests.map(test => ({
      name: test.name,
      description: test.description,
      url: `https://app.hubspot.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${test.scopes}`
    }));

    return NextResponse.json({
      message: "HubSpot OAuth scope test URLs",
      clientId: clientId,
      redirectUri: redirectUri,
      tests: testUrls
    });

  } catch (error) {
    console.error("HubSpot scope test error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate test URLs",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
} 