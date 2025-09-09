import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { storeUserSalesforceTokens } from "@/lib/salesforce";

const SF_CLIENT_ID = process.env.SALESFORCE_CLIENT_ID || "";
const SF_CLIENT_SECRET = process.env.SALESFORCE_CLIENT_SECRET || "";
const SF_LOGIN_URL =
  process.env.SALESFORCE_LOGIN_URL || "https://login.salesforce.com";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.id === "0") {
      return NextResponse.redirect(
        `${
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        }/settings?error=unauthorized`
      );
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.redirect(
        `${
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        }/settings?error=salesforce_auth_failed&message=${encodeURIComponent(
          error
        )}`
      );
    }
    if (!code) {
      return NextResponse.redirect(
        `${
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        }/settings?error=salesforce_auth_failed&message=${encodeURIComponent(
          "No authorization code received"
        )}`
      );
    }

    const reqUrl = new URL(request.url);
    const origin = `${reqUrl.protocol}//${reqUrl.host}`;
    const redirectUri =
      process.env.SALESFORCE_REDIRECT_URI ||
      `${origin}/api/salesforce/auth/callback`;

    const codeVerifier = request.cookies.get("sf_pkce_verifier")?.value || "";

    const tokenResponse = await fetch(`${SF_LOGIN_URL}/services/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: SF_CLIENT_ID,
        client_secret: SF_CLIENT_SECRET,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      }),
    });
    if (!tokenResponse.ok) {
      const txt = await tokenResponse.text();
      return NextResponse.redirect(
        `${
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        }/settings?error=salesforce_auth_failed&message=${encodeURIComponent(
          "Token exchange failed: " + txt
        )}`
      );
    }
    const token = await tokenResponse.json();

    await storeUserSalesforceTokens({
      userId: Number(session.user.id),
      instanceUrl: token.instance_url,
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      expiresIn: token.expires_in,
      scope: token.scope || null,
    });

    const res = NextResponse.redirect(
      `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/settings?success=salesforce_connected`
    );
    res.cookies.set("sf_pkce_verifier", "", { path: "/", maxAge: 0 });
    return res;
  } catch (err) {
    return NextResponse.redirect(
      `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/settings?error=salesforce_auth_failed`
    );
  }
}
