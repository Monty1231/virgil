import { NextRequest, NextResponse } from "next/server";

const HUBSPOT_CLIENT_ID = process.env.HUBSPOT_CLIENT_ID;
const HUBSPOT_CLIENT_SECRET = process.env.HUBSPOT_CLIENT_SECRET;
const HUBSPOT_REDIRECT_URI =
  process.env.HUBSPOT_REDIRECT_URI ||
  "http://localhost:3000/api/hubspot/auth/callback";

// Initiate OAuth flow
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "authorize") {
      // Scopes configurable via env; default to minimal read-only to avoid mismatch
      const configuredScopes = (
        process.env.HUBSPOT_OAUTH_SCOPES ||
        "crm.objects.contacts.read crm.objects.companies.read"
      )
        .split(/[,\s]+/)
        .filter(Boolean);

      const scopes = encodeURIComponent(configuredScopes.join(" "));

      const authUrl = `https://app.hubspot.com/oauth/authorize?client_id=${HUBSPOT_CLIENT_ID}&redirect_uri=${encodeURIComponent(
        HUBSPOT_REDIRECT_URI
      )}&scope=${scopes}`;

      return NextResponse.redirect(authUrl);
    }

    return NextResponse.json(
      {
        error: "Invalid action",
        message: "Use ?action=authorize to start OAuth flow",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("HubSpot auth error:", error);
    return NextResponse.json(
      {
        error: "Authentication failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Handle OAuth callback
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        { error: "Authorization code is required" },
        { status: 400 }
      );
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch("https://api.hubapi.com/oauth/v1/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: HUBSPOT_CLIENT_ID!,
        client_secret: HUBSPOT_CLIENT_SECRET!,
        redirect_uri: HUBSPOT_REDIRECT_URI,
        code: code,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error("Token exchange failed:", errorData);
      return NextResponse.json(
        { error: "Failed to exchange authorization code for access token" },
        { status: 400 }
      );
    }

    const tokenData = await tokenResponse.json();

    // Store the access token securely (in production, use a secure database)
    // For now, we'll return it to be stored by the frontend
    return NextResponse.json({
      success: true,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
      message: "HubSpot authentication successful",
    });
  } catch (error) {
    console.error("HubSpot token exchange error:", error);
    return NextResponse.json(
      {
        error: "Token exchange failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
