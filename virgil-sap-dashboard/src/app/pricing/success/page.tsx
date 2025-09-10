"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";

export default function PricingSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { update } = useSession();
  const [status, setStatus] = useState<string>("Confirming your payment...");

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (!sessionId) return;
    const confirm = async () => {
      try {
        const res = await fetch("/api/checkout/success", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        if (res.ok) {
          setStatus("Payment confirmed. Activating your account...");
          // Ensure NextAuth JWT/session reflects latest DB values before navigating
          try {
            await update();
          } catch {}
          setStatus("All set! Redirecting to your dashboard...");
          // Use hard redirect to ensure updated auth cookie is used by middleware
          window.location.replace("/dashboard");
        } else {
          const data = await res.json().catch(() => ({}));
          setStatus(
            data?.error || "Unable to confirm payment. Please contact support."
          );
        }
      } catch (e) {
        setStatus("An error occurred. Please contact support.");
      }
    };
    void confirm();
  }, [router, searchParams, update]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="bg-white rounded-xl shadow p-8 border border-gray-100 text-center">
        <h1 className="text-2xl font-bold mb-4">Subscription Activation</h1>
        <p className="text-gray-700">{status}</p>
      </div>
    </div>
  );
}
