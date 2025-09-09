import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";

const SF_CLIENT_ID = process.env.SALESFORCE_CLIENT_ID;
const SF_LOGIN_URL =
  process.env.SALESFORCE_LOGIN_URL || "https://login.salesforce.com";
const SF_SCOPES = (process.env.SALESFORCE_SCOPES || "api refresh_token web")
  .split(/[\s,]+/)
  .filter(Boolean)
  .join(" ");

function base64Url(input: Buffer) {
  return input
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function generateCodeVerifier() {
  return base64Url(crypto.randomBytes(32));
}

function generateCodeChallenge(verifier: string) {
  const hash = crypto.createHash("sha256").update(verifier).digest();
  return base64Url(hash);
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const origin = `${url.protocol}//${url.host}`;
    const redirectUri =
      process.env.SALESFORCE_REDIRECT_URI ||
      `${origin}/api/salesforce/auth/callback`;

    // PKCE
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);

    const authUrl = `${SF_LOGIN_URL}/services/oauth2/authorize?response_type=code&client_id=${encodeURIComponent(
      SF_CLIENT_ID || ""
    )}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&scope=${encodeURIComponent(
      SF_SCOPES
    )}&code_challenge=${encodeURIComponent(
      codeChallenge
    )}&code_challenge_method=S256`;

    const response = NextResponse.redirect(authUrl);
    response.cookies.set("sf_pkce_verifier", codeVerifier, {
      httpOnly: true,
      secure: url.protocol === "https:",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 10, // 10 minutes
    });

    if (url.searchParams.get("debug") === "1") {
      return NextResponse.json({
        loginUrl: SF_LOGIN_URL,
        redirectUri,
        scopes: SF_SCOPES,
        clientIdPresent: Boolean(SF_CLIENT_ID),
        pkce: true,
      });
    }

    return response;
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to start Salesforce OAuth" },
      { status: 500 }
    );
  }
}
