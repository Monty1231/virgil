"use client";

import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, AlertCircle, CheckCircle, ArrowRight } from "lucide-react";
import { FloatingLogo, StaggeredText } from "@/components/landing-animations";
import { AnimatedButton } from "@/components/animated-button";
import Link from "next/link";

export default function SignIn() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    // Check if user is already signed in
    getSession().then((session) => {
      if (session?.user) {
        if (session.user.isActive) {
          router.push("/");
        } else {
          setIsPending(true);
        }
      }
    });
  }, [router]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("google", { callbackUrl: "/auth/signin" });

      if (result?.error) {
        if (result.error === "AccessDenied") {
          setIsPending(true);
        } else {
          setError("An error occurred during sign in. Please try again.");
        }
      }
    } catch (error) {
      setError("An error occurred during sign in. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isPending) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full mx-auto p-8"
        >
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="text-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
              >
                <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
              </motion.div>
              <StaggeredText
                text="Access Request Submitted"
                className="text-2xl font-bold text-gray-900 mb-2"
              />
            </div>
            <StaggeredText
              text="Thank you for your interest in Virgil AI! Your access request has been submitted and is currently under review."
              className="text-gray-600 mb-6"
              delay={0.5}
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6"
            >
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <p className="text-sm text-blue-800">
                  You will receive an email notification once your access has
                  been approved.
                </p>
              </div>
            </motion.div>
            <div className="text-center text-sm text-gray-500">
              <p>Need immediate access? Contact us at support@virgil.io</p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
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

      {/* Main Content */}
      <main className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="mb-6"
              >
                <img
                  src="/darkLogo.png"
                  alt="Virgil"
                  className="h-16 mx-auto"
                />
              </motion.div>
              <StaggeredText
                text="Welcome to Virgil AI"
                className="text-3xl font-bold text-gray-900 mb-2"
              />
              <StaggeredText
                text="AI-Powered Sales Intelligence"
                className="text-lg text-blue-600 font-medium"
                delay={0.3}
              />
            </div>

            <div className="space-y-6">
              <AnimatedButton
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleGoogleSignIn();
                }}
                className="w-full flex items-center justify-center px-6 py-4 border border-blue-800 text-base font-semibold rounded-lg text-white bg-blue-800 hover:bg-blue-900 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                {isLoading ? (
                  <Loader2 className="mr-3 h-5 w-5 animate-spin text-white" />
                ) : (
                  <svg
                    className="mr-3 h-5 w-5 flex-shrink-0"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                )}
                Continue with Google
              </AnimatedButton>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-200 rounded-lg p-4"
                >
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </motion.div>
              )}

              <div className="text-center text-sm text-gray-500">
                <p>
                  By continuing, you agree to our{" "}
                  <span className="text-blue-600 hover:text-blue-700">
                    Terms of Service
                  </span>{" "}
                  and{" "}
                  <span className="text-blue-600 hover:text-blue-700">
                    Privacy Policy
                  </span>
                  .
                </p>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-8 text-center"
          >
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Why Choose Virgil AI?
              </h3>
              <div className="grid grid-cols-1 gap-4 mt-4">
                <div className="flex items-center text-sm text-gray-700">
                  <div className="w-2 h-2 bg-blue-800 rounded-full mr-3"></div>
                  AI-powered sales insights
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <div className="w-2 h-2 bg-blue-800 rounded-full mr-3"></div>
                  Automated deal tracking
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <div className="w-2 h-2 bg-blue-800 rounded-full mr-3"></div>
                  Intelligent recommendations
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
