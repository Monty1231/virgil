import { Client } from "@hubspot/api-client";
import sql from "./db";

const HUBSPOT_CLIENT_ID = process.env.HUBSPOT_CLIENT_ID as string;
const HUBSPOT_CLIENT_SECRET = process.env.HUBSPOT_CLIENT_SECRET as string;

interface HubSpotTokenRow {
  id: number;
  user_id: number;
  access_token: string;
  refresh_token: string | null;
  expires_at: Date | null;
  scope: string | null;
  portal_id: string | null;
}

export async function ensureHubspotTokensTable(): Promise<void> {
  await sql.query(`
		CREATE TABLE IF NOT EXISTS hubspot_tokens (
			id SERIAL PRIMARY KEY,
			user_id INTEGER UNIQUE NOT NULL,
			access_token TEXT NOT NULL,
			refresh_token TEXT,
			expires_at TIMESTAMPTZ,
			scope TEXT,
			portal_id TEXT,
			created_at TIMESTAMPTZ DEFAULT NOW(),
			updated_at TIMESTAMPTZ DEFAULT NOW()
		);
	`);
}

async function getTokenRow(userId: number): Promise<HubSpotTokenRow | null> {
  const { rows } = await sql.query(
    "SELECT * FROM hubspot_tokens WHERE user_id = $1 LIMIT 1",
    [userId]
  );
  return rows[0] || null;
}

async function saveTokens(
  userId: number,
  accessToken: string,
  refreshToken: string | null,
  expiresAt: Date | null,
  scope?: string | null,
  portalId?: string | null
): Promise<void> {
  await ensureHubspotTokensTable();
  await sql.query(
    `
		INSERT INTO hubspot_tokens (user_id, access_token, refresh_token, expires_at, scope, portal_id)
		VALUES ($1, $2, $3, $4, $5, $6)
		ON CONFLICT (user_id) DO UPDATE SET
			access_token = EXCLUDED.access_token,
			refresh_token = EXCLUDED.refresh_token,
			expires_at = EXCLUDED.expires_at,
			scope = EXCLUDED.scope,
			portal_id = EXCLUDED.portal_id,
			updated_at = NOW()
		`,
    [
      userId,
      accessToken,
      refreshToken,
      expiresAt,
      scope || null,
      portalId || null,
    ]
  );
}

async function refreshAccessToken(refreshToken: string) {
  const resp = await fetch("https://api.hubapi.com/oauth/v1/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: HUBSPOT_CLIENT_ID,
      client_secret: HUBSPOT_CLIENT_SECRET,
      refresh_token: refreshToken,
    }),
  });
  if (!resp.ok) {
    throw new Error(`Failed to refresh HubSpot token: ${await resp.text()}`);
  }
  return resp.json();
}

export async function getUserHubSpotClient(userId: number): Promise<Client> {
  await ensureHubspotTokensTable();
  const row = await getTokenRow(userId);
  if (!row) {
    throw new Error("No HubSpot connection found for this user");
  }

  let accessToken = row.access_token;

  // Check expiration
  if (row.expires_at && row.refresh_token) {
    const now = new Date();
    if (now >= new Date(row.expires_at)) {
      const tokenData = await refreshAccessToken(row.refresh_token);
      accessToken = tokenData.access_token;
      const newExpires = new Date(
        Date.now() + (tokenData.expires_in || 0) * 1000
      );
      await saveTokens(
        userId,
        tokenData.access_token,
        tokenData.refresh_token || row.refresh_token,
        newExpires,
        tokenData.scope || row.scope,
        (row as any).portal_id || null
      );
    }
  }

  return new Client({ accessToken });
}

export async function storeUserHubSpotTokens(opts: {
  userId: number;
  accessToken: string;
  refreshToken?: string | null;
  expiresIn?: number | null;
  scope?: string | null;
  portalId?: string | null;
}) {
  const expiresAt = opts.expiresIn
    ? new Date(Date.now() + opts.expiresIn * 1000)
    : null;
  await saveTokens(
    opts.userId,
    opts.accessToken,
    opts.refreshToken || null,
    expiresAt,
    opts.scope || null,
    opts.portalId || null
  );
}
