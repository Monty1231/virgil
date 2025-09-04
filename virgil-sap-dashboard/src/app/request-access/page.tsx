"use client";

import { useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function RequestAccessPage() {
	const { status, data } = useSession();
	const router = useRouter();
	const [submitting, setSubmitting] = useState(false);
	const [message, setMessage] = useState<string>(
		"Request access to your company's Virgil workspace."
	);

	useEffect(() => {
		if (status === "unauthenticated") {
			signIn("google", { callbackUrl: "/request-access" });
		}
		if (status === "authenticated" && data?.user?.isActive) {
			router.push("/dashboard");
		}
	}, [status, data?.user?.isActive, router]);

	const request = async () => {
		setSubmitting(true);
		setMessage("");
		try {
			const res = await fetch("/api/access-request", { method: "POST" });
			const body = await res.json().catch(() => ({}));
			if (!res.ok) {
				setMessage(body?.error || "Could not submit request. Try again.");
			} else {
				setMessage(
					"Request submitted. Your admins have been notified. You'll be activated when a seat is available."
				);
			}
		} catch (e) {
			setMessage("Network error. Please try again.");
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
			<div className="bg-white rounded-xl shadow p-8 border border-gray-100 text-center space-y-4 max-w-md">
				<h1 className="text-2xl font-bold">Request Access</h1>
				<p className="text-gray-700">{message}</p>
				<Button onClick={request} disabled={submitting}>
					{submitting ? "Submitting..." : "Request Access"}
				</Button>
			</div>
		</div>
	);
} 