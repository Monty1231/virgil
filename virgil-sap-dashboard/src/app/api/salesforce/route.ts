import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import sql from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.id === "0") {
      return NextResponse.json({ connected: false }, { status: 200 });
    }
    const { rows } = await sql.query(
      "SELECT 1 FROM salesforce_tokens WHERE user_id = $1 LIMIT 1",
      [Number(session.user.id)]
    );
    return NextResponse.json({ connected: rows.length > 0 });
  } catch (err) {
    return NextResponse.json({ connected: false }, { status: 200 });
  }
}
