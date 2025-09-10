import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

const TIER_TO_SEATS: Record<string, number> = {
  tier1: 5,
  tier2: 15,
  tier3: 25,
  tier4: 35,
};

export async function POST(request: Request) {
  try {
    const { sessionId } = await request.json().catch(() => ({}));
    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    const checkout = await stripe.checkout.sessions.retrieve(sessionId);
    if (!checkout || checkout.payment_status !== "paid") {
      return NextResponse.json(
        { error: "Payment not confirmed" },
        { status: 400 }
      );
    }

    const plan = ((checkout.metadata?.plan as string) || "basic").toLowerCase();
    const email =
      checkout.customer_details?.email ||
      checkout.customer_email ||
      checkout.metadata?.userEmail;
    if (!email) {
      return NextResponse.json(
        { error: "Missing email on session" },
        { status: 400 }
      );
    }

    // Find or create paying user
    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json(
        { error: "User not found after checkout" },
        { status: 404 }
      );
    }

    // If user already belongs to org, just update fields
    let organizationId = user.organizationId;
    if (!organizationId) {
      const org = await prisma.organizations.create({
        data: {
          name: user.name || email.split("@")[0],
          tier: plan,
          seat_limit: TIER_TO_SEATS[plan] || 5,
        },
        select: { id: true },
      });
      organizationId = org.id;
    }

    const updated = await prisma.users.update({
      where: { email },
      data: {
        isActive: true,
        isAdmin: true,
        subscriptionTier: plan,
        organizationId,
      },
      select: {
        id: true,
        email: true,
        isActive: true,
        isAdmin: true,
        organizationId: true,
        subscriptionTier: true,
      },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (err) {
    console.error("Checkout success handling error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
