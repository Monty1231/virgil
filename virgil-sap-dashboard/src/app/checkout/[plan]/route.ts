import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ plan: string }> }
) {
  try {
    const { plan } = await context.params;
    if (!plan) return NextResponse.redirect(new URL("/pricing", req.url));

    // Ensure user session (redirect to sign-in and back if missing)
    const session = (await getServerSession(authOptions as any)) as any;
    const userEmail = session?.user?.email as string | undefined;
    if (!userEmail) {
      const url = new URL(`/auth/signin`, req.url);
      url.searchParams.set("callbackUrl", `/checkout/${plan}`);
      return NextResponse.redirect(url);
    }

    const cookie = req.headers.get("cookie") || "";
    const res = await fetch(new URL("/api/checkout/session", req.url), {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie },
      body: JSON.stringify({ plan }),
      cache: "no-store",
    });
    const data = await res.json();
    if (!res.ok || !data?.url) {
      return NextResponse.redirect(
        new URL(
          `/pricing?error=${encodeURIComponent(
            data?.error || "checkout_failed"
          )}`,
          req.url
        )
      );
    }
    return NextResponse.redirect(data.url);
  } catch {
    return NextResponse.redirect(new URL("/pricing?error=unexpected", req.url));
  }
}
