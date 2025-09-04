import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST() {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const me = await prisma.users.findUnique({ where: { email: session.user.email } });
    if (!me) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // If already active, nothing to do
    if (me.isActive) {
      return NextResponse.json({ success: true, message: "Already active" });
    }

    // Require that the user is or will be part of an organization
    if (!me.organizationId) {
      // If there's exactly one admin org with remaining seats and same email domain, we could attach; for now, require existing org
      return NextResponse.json({ error: "No organization found for your account. Contact your admin." }, { status: 400 });
    }

    const org = await prisma.organizations.findUnique({
      where: { id: me.organizationId },
      include: { users: true, invites: true },
    });
    if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

    const usedSeats = org.users.filter((u) => u.isActive).length;
    const pendingSeats = org.invites.filter((i) => i.status === "pending").length;
    if (usedSeats + pendingSeats >= org.seat_limit) {
      return NextResponse.json({ error: "No seats available" }, { status: 400 });
    }

    // Create or refresh a pending invite for this user
    const token = crypto.randomBytes(24).toString("hex");
    const invite = await prisma.org_invites.upsert({
      where: { organizationId_email: { organizationId: org.id, email: me.email } },
      update: { status: "pending", token },
      create: {
        organizationId: org.id,
        email: me.email,
        token,
        invited_by: org.users.find((u) => u.isAdmin)?.id || null,
        status: "pending",
      },
      select: { id: true, email: true, token: true, status: true },
    });

    // TODO: Send email notification to org admins (out of scope for now)

    return NextResponse.json({ success: true, invite });
  } catch (e) {
    console.error("Access request failed:", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
} 