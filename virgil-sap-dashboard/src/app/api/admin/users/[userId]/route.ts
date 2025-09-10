import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and is admin
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = (session.user as any).organizationId as number | null | undefined;
    if (!orgId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { userId } = await context.params;
    const body = await request.json();
    const { isActive, subscriptionTier, accessGrantedAt } = body;

    const target = await prisma.users.findUnique({
      where: { id: parseInt(userId) },
      select: { id: true, organizationId: true, isActive: true },
    });
    if (!target || target.organizationId !== orgId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // If we are granting access (inactive -> active), enforce seat limit
    if (isActive === true && target.isActive === false) {
      const org = await prisma.organizations.findUnique({
        where: { id: orgId },
        select: { seat_limit: true },
      });
      if (!org) {
        return NextResponse.json({ error: "Organization not found" }, { status: 404 });
      }
      const activeCount = await prisma.users.count({
        where: { organizationId: orgId, isActive: true },
      });
      const pendingInvites = await prisma.org_invites.count({
        where: { organizationId: orgId, status: "pending" },
      });
      if (activeCount + pendingInvites >= org.seat_limit) {
        return NextResponse.json({ error: "No seats available" }, { status: 400 });
      }
    }

    const updatedUser = await prisma.users.update({
      where: { id: parseInt(userId) },
      data: {
        isActive,
        subscriptionTier,
        accessGrantedAt: accessGrantedAt ? new Date(accessGrantedAt) : null,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
