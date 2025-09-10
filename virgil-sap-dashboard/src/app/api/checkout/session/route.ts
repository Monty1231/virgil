import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  console.error("STRIPE_SECRET_KEY is not set");
}

const stripe = new Stripe((process.env.STRIPE_SECRET_KEY as string) || "");

const PRICE_IDS: Record<string, string> = {
  tier1: process.env.STRIPE_PRICE_TIER1 || "",
  tier2: process.env.STRIPE_PRICE_TIER2 || "",
  tier3: process.env.STRIPE_PRICE_TIER3 || "",
  tier4: process.env.STRIPE_PRICE_TIER4 || "",
};

function validateEnv(plan: string): string | null {
  if (!process.env.STRIPE_SECRET_KEY) return "Stripe secret key is missing.";
  if (!PRICE_IDS[plan]) return `Stripe price ID missing for plan: ${plan}.`;
  if (!process.env.NEXTAUTH_URL) return "NEXTAUTH_URL is not set.";
  return null;
}

export async function POST(request: Request) {
  try {
    const session = (await getServerSession(authOptions as any)) as any;
    const userEmail = session?.user?.email as string | undefined;
    if (!userEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { plan } = await request.json().catch(() => ({}));
    if (!plan) {
      return NextResponse.json({ error: "Missing plan" }, { status: 400 });
    }

    const envError = validateEnv(plan);
    if (envError) {
      console.error("Checkout env validation failed:", envError);
      return NextResponse.json({ error: envError }, { status: 500 });
    }

    const host = process.env.NEXTAUTH_URL as string;

    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: userEmail,
      line_items: [{ price: PRICE_IDS[plan], quantity: 1 }],
      metadata: { plan, userEmail },
      success_url: `${host}/pricing/success?plan=${plan}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${host}/pricing?canceled=1`,
    });

    return NextResponse.json({ id: checkout.id, url: checkout.url });
  } catch (err) {
    console.error("Error creating checkout session:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
