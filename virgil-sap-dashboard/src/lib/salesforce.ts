import sql from "./db";

interface SalesforceTokenRow {
  id: number;
  user_id: number;
  instance_url: string;
  access_token: string;
  refresh_token: string | null;
  expires_at: Date | null;
  scope: string | null;
  created_at: Date;
  updated_at: Date;
}

export async function ensureSalesforceTokensTable(): Promise<void> {
  await sql.query(`
		CREATE TABLE IF NOT EXISTS salesforce_tokens (
			id SERIAL PRIMARY KEY,
			user_id INTEGER UNIQUE NOT NULL,
			instance_url TEXT NOT NULL,
			access_token TEXT NOT NULL,
			refresh_token TEXT,
			expires_at TIMESTAMPTZ,
			scope TEXT,
			created_at TIMESTAMPTZ DEFAULT NOW(),
			updated_at TIMESTAMPTZ DEFAULT NOW()
		);
	`);
}

async function getSfRow(userId: number): Promise<SalesforceTokenRow | null> {
  const { rows } = await sql.query(
    "SELECT * FROM salesforce_tokens WHERE user_id = $1 LIMIT 1",
    [userId]
  );
  return rows[0] || null;
}

async function saveSfTokens(args: {
  userId: number;
  instanceUrl: string;
  accessToken: string;
  refreshToken?: string | null;
  expiresAt?: Date | null;
  scope?: string | null;
}) {
  await ensureSalesforceTokensTable();
  await sql.query(
    `
		INSERT INTO salesforce_tokens (user_id, instance_url, access_token, refresh_token, expires_at, scope)
		VALUES ($1, $2, $3, $4, $5, $6)
		ON CONFLICT (user_id) DO UPDATE SET
			instance_url = EXCLUDED.instance_url,
			access_token = EXCLUDED.access_token,
			refresh_token = EXCLUDED.refresh_token,
			expires_at = EXCLUDED.expires_at,
			scope = EXCLUDED.scope,
			updated_at = NOW()
		`,
    [
      args.userId,
      args.instanceUrl,
      args.accessToken,
      args.refreshToken || null,
      args.expiresAt || null,
      args.scope || null,
    ]
  );
}

async function refreshAccessToken(refreshToken: string) {
  const loginBase =
    process.env.SALESFORCE_LOGIN_URL || "https://login.salesforce.com";
  const resp = await fetch(`${loginBase}/services/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: process.env.SALESFORCE_CLIENT_ID || "",
      client_secret: process.env.SALESFORCE_CLIENT_SECRET || "",
      refresh_token: refreshToken,
    }),
  });
  if (!resp.ok) {
    throw new Error(await resp.text());
  }
  return resp.json();
}

export async function getUserSalesforceConfig(userId: number) {
  await ensureSalesforceTokensTable();
  const row = await getSfRow(userId);
  if (!row) throw new Error("No Salesforce connection found for this user");

  let accessToken = row.access_token;
  let instanceUrl = row.instance_url;

  if (row.expires_at && row.refresh_token) {
    const now = new Date();
    if (now >= new Date(row.expires_at)) {
      const token = await refreshAccessToken(row.refresh_token);
      accessToken = token.access_token;
      instanceUrl = token.instance_url || instanceUrl;
      const expiresAt = token.expires_in
        ? new Date(Date.now() + token.expires_in * 1000)
        : null;
      await saveSfTokens({
        userId,
        instanceUrl,
        accessToken,
        refreshToken: token.refresh_token || row.refresh_token,
        expiresAt,
        scope: token.scope || null,
      });
    }
  }

  return { instanceUrl, accessToken };
}

export async function storeUserSalesforceTokens(args: {
  userId: number;
  instanceUrl: string;
  accessToken: string;
  refreshToken?: string | null;
  expiresIn?: number | null;
  scope?: string | null;
}) {
  const expiresAt = args.expiresIn
    ? new Date(Date.now() + args.expiresIn * 1000)
    : null;
  await saveSfTokens({
    userId: args.userId,
    instanceUrl: args.instanceUrl,
    accessToken: args.accessToken,
    refreshToken: args.refreshToken || null,
    expiresAt,
    scope: args.scope || null,
  });
}

export async function disconnectUserSalesforce(userId: number) {
  await sql.query("DELETE FROM salesforce_tokens WHERE user_id = $1", [userId]);
}
