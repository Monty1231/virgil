import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = (await getServerSession(authOptions as any)) as any;
    const userEmail = session?.user?.email as string | undefined;
    if (!userEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { plan, expiresAt } = body as { plan?: string; expiresAt?: string };
    if (!plan) {
      return NextResponse.json({ error: "Missing plan" }, { status: 400 });
    }

    const updated = await prisma.users.update({
      where: { email: userEmail },
      data: {
        subscriptionTier: plan,
        subscriptionExpiresAt: expiresAt ? new Date(expiresAt) : undefined,
      },
      select: {
        id: true,
        email: true,
        subscriptionTier: true,
        subscriptionExpiresAt: true,
      },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (err) {
    console.error("Failed to update subscription:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
