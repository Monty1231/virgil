import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import sql from "@/lib/db";

const HUBSPOT_CLIENT_ID = process.env.HUBSPOT_CLIENT_ID as string;
const HUBSPOT_CLIENT_SECRET = process.env.HUBSPOT_CLIENT_SECRET as string;

async function revokeRefreshToken(refreshToken: string) {
  try {
    const basic = Buffer.from(
      `${HUBSPOT_CLIENT_ID}:${HUBSPOT_CLIENT_SECRET}`
    ).toString("base64");
    const resp = await fetch(
      `https://api.hubapi.com/oauth/v1/refresh-tokens/${encodeURIComponent(
        refreshToken
      )}`,
      { method: "DELETE", headers: { Authorization: `Basic ${basic}` } }
    );
    // HubSpot returns 204 on success; ignore failures (best-effort)
    return resp.ok;
  } catch {
    return false;
  }
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.id === "0") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Read token row
    const { rows } = await sql.query(
      "SELECT refresh_token FROM hubspot_tokens WHERE user_id = $1 LIMIT 1",
      [Number(session.user.id)]
    );

    const refreshToken: string | null = rows[0]?.refresh_token || null;
    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }

    // Delete local tokens regardless of revoke outcome
    await sql.query("DELETE FROM hubspot_tokens WHERE user_id = $1", [
      Number(session.user.id),
    ]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to disconnect" },
      { status: 500 }
    );
  }
}
