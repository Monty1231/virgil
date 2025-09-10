"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";

export default function InviteAcceptPage() {
	const params = useParams<{ token: string }>();
	const router = useRouter();
	const { status } = useSession();
	const [message, setMessage] = useState("Validating invite...");

	useEffect(() => {
		const run = async () => {
			const token = params?.token as string | undefined;
			if (!token) return;

			// Ensure the user is signed in
			if (status === "unauthenticated") {
				await signIn("google", { callbackUrl: `/invite/${token}` });
				return;
			}
			if (status !== "authenticated") return;

			try {
				setMessage("Accepting invite...");
				const res = await fetch(`/api/admin/invites/${token}`, { method: "POST" });
				const data = await res.json().catch(() => ({}));
				if (!res.ok) {
					setMessage(data?.error || "Invite could not be accepted.");
					return;
				}
				setMessage("Success! Redirecting to your dashboard...");
				window.location.replace("/dashboard");
			} catch (e) {
				setMessage("An error occurred. Please try again or contact support.");
			}
		};
		run();
	}, [params?.token, status]);

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
			<div className="bg-white rounded-xl shadow p-8 border border-gray-100 text-center">
				<h1 className="text-2xl font-bold mb-2">Join Organization</h1>
				<p className="text-gray-700">{message}</p>
			</div>
		</div>
	);
} 