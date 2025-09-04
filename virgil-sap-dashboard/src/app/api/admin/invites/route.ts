import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const session = (await getServerSession(authOptions as any)) as any;
    const userEmail = session?.user?.email as string | undefined;
    if (!userEmail)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = await prisma.users.findUnique({
      where: { email: userEmail },
    });
    if (!admin || !admin.isAdmin || !admin.organizationId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { emails } = await request
      .json()
      .catch(() => ({ emails: [] as string[] }));
    if (!Array.isArray(emails) || emails.length === 0)
      return NextResponse.json(
        { error: "No emails provided" },
        { status: 400 }
      );

    const org = await prisma.organizations.findUnique({
      where: { id: admin.organizationId },
      include: { users: true, invites: true },
    });
    if (!org)
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );

    const usedSeats = org.users.filter((u) => u.isActive).length; // count only active users
    const pendingSeats = org.invites.filter(
      (i) => i.status === "pending"
    ).length;
    const available = org.seat_limit - usedSeats - pendingSeats;
    if (available <= 0)
      return NextResponse.json(
        { error: "No seats available" },
        { status: 400 }
      );

    const toInvite = emails.slice(0, available);
    const created = [] as any[];
    for (const email of toInvite) {
      const token = crypto.randomBytes(24).toString("hex");
      const invite = await prisma.org_invites.upsert({
        where: { organizationId_email: { organizationId: org.id, email } },
        update: { status: "pending", token },
        create: {
          organizationId: org.id,
          email,
          token,
          invited_by: admin.id,
          status: "pending",
        },
        select: { id: true, email: true, token: true, status: true },
      });
      created.push(invite);
    }

    return NextResponse.json({
      success: true,
      invites: created,
      seatsRemaining: available - created.length,
    });
  } catch (e) {
    console.error("Invite creation failed:", e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
