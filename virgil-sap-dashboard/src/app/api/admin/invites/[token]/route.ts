import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token } = await context.params;
    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    const invite = await prisma.org_invites.findUnique({ where: { token } });
    if (!invite || invite.status !== "pending") {
      return NextResponse.json({ error: "Invalid or expired invite" }, { status: 400 });
    }

    // Ensure the invite email matches the logged-in user
    if (invite.email.toLowerCase() !== session.user.email!.toLowerCase()) {
      return NextResponse.json({ error: "Invite email mismatch" }, { status: 403 });
    }

    // Ensure seats available (count only active)
    const org = await prisma.organizations.findUnique({
      where: { id: invite.organizationId },
      include: { users: true },
    });
    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }
    const activeCount = org.users.filter((u) => u.isActive).length;
    if (activeCount >= org.seat_limit) {
      return NextResponse.json({ error: "No seats available" }, { status: 400 });
    }

    // Attach the user to the org and activate them
    const updatedUser = await prisma.users.update({
      where: { email: session.user.email! },
      data: {
        organizationId: invite.organizationId,
        isActive: true,
        isAdmin: false,
      },
      select: { id: true, email: true, organizationId: true, isActive: true, isAdmin: true },
    });

    await prisma.org_invites.update({
      where: { token },
      data: { status: "accepted" },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (e) {
    console.error("Invite acceptance failed:", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
} 