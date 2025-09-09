import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { disconnectUserSalesforce } from "@/lib/salesforce";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.id === "0") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    await disconnectUserSalesforce(Number(session.user.id));
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
