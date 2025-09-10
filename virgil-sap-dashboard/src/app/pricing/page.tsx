"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { AnimatedButton } from "@/components/animated-button";
import {
  FloatingLogo,
  StaggeredText,
  FloatingCard,
} from "@/components/landing-animations";

const plans = [
  {
    id: "tier1",
    name: "Tier 1",
    price: 1500,
    users: "Up to 5 users",
    features: ["Basic analytics", "Email support"],
  },
  {
    id: "tier2",
    name: "Tier 2",
    price: 2500,
    users: "Up to 15 users",
    features: ["Advanced analytics", "Priority support", "Custom integrations"],
    popular: true,
  },
  {
    id: "tier3",
    name: "Tier 3",
    price: 3500,
    users: "Up to 25 users",
    features: ["AI-powered insights", "24/7 support", "Advanced reporting"],
  },
  {
    id: "tier4",
    name: "Tier 4",
    price: 4500,
    users: "35+ users",
    features: [
      "Enterprise features",
      "Dedicated support",
      "Custom development",
    ],
    contact: true,
  },
];

export default function PricingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status, data: session, update } = useSession();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const planParam = searchParams.get("plan");

  const startCheckout = async (planId: string) => {
    setLoadingPlan(planId);
    setError("");
    try {
      const res = await fetch("/api/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.url) {
        setError(
          data?.error || "Unable to start checkout. Check Stripe configuration."
        );
        setLoadingPlan(null);
        return;
      }
      window.location.href = data.url as string;
    } catch (e) {
      setError("Network error starting checkout. Try again.");
      setLoadingPlan(null);
    }
  };

  useEffect(() => {
    if (!planParam) return;
    if (status === "authenticated") {
      void startCheckout(planParam);
    }
  }, [planParam, status]);

  useEffect(() => {
    // If the user becomes active (e.g., after returning from checkout), send to dashboard
    if (status === "authenticated" && session?.user?.isActive) {
      router.push("/dashboard");
    }
  }, [status, session?.user?.isActive, router]);

  const handleSelect = async (planId: string) => {
    if (status !== "authenticated") {
      await signIn("google", { callbackUrl: `/pricing?plan=${planId}` });
      return;
    }
    await startCheckout(planId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white shadow-lg border-b border-gray-100">
        <div className="flex justify-between items-center py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <FloatingLogo>
              <img src="/darkLogo.png" alt="Virgil" className="h-10 w-auto" />
            </FloatingLogo>
          </div>
          <div className="text-sm text-gray-600">
            <Link href="/" className="hover:text-blue-600 transition-colors">
              ← Back to Home
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <StaggeredText
            text="Simple, Transparent Pricing"
            className="text-3xl font-bold text-gray-900 sm:text-4xl"
          />
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Choose the plan that fits your team size and needs
          </p>
          {error && (
            <div className="mt-4 mx-auto max-w-xl bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 text-sm">
              {error}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan, idx) => (
            <FloatingCard key={plan.id} delay={(idx + 1) * 0.1}>
              <div
                className={`bg-white rounded-xl shadow-lg p-8 border ${
                  plan.popular
                    ? "border-2 border-blue-500 relative"
                    : "border-gray-100"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Popular
                    </span>
                  </div>
                )}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {plan.name}
                </h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">
                    ${plan.price.toLocaleString()}
                  </span>
                  <span className="text-gray-600">/month</span>
                </div>
                <ul className="space-y-3 mb-8 text-gray-600">
                  <li className="flex items-center">{plan.users}</li>
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center">
                      {f}
                    </li>
                  ))}
                </ul>
                <AnimatedButton
                  href={`/checkout/${plan.id}`}
                  className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-semibold rounded-lg text-white bg-blue-800 hover:bg-blue-900 transition-all duration-200"
                >
                  {plan.contact ? "Contact Sales" : "Get Started"}
                </AnimatedButton>
              </div>
            </FloatingCard>
          ))}
        </div>
      </main>
    </div>
  );
}
