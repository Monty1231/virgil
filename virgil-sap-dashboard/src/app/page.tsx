import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  FloatingLogo,
  StaggeredText,
  FloatingCard,
  TypewriterHeading,
  GradientText,
  // AuroraBackground,
  // MorphingShape,
  TiltCard,
} from "@/components/landing-animations";
import { AnimatedButton } from "@/components/animated-button";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  // If user is authenticated, redirect to dashboard
  if (session?.user?.isActive) {
    redirect("/dashboard");
  }

  // If user is authenticated but not active, redirect to pricing
  if (session?.user && !session.user.isActive) {
    redirect("/pricing");
  }

  // Landing page for unauthenticated users
  return (
    <div className="min-h-screen relative bg-[hsl(220_25%_10%)]">
      {/* Background effects removed for a bold brand-first look */}
      {/* <AuroraBackground /> */}
      {/* <div className="absolute inset-0 -z-10"><MorphingShape /></div> */}

      {/* Header */}
      <header className="bg-white shadow-xl border-b border-gray-100">
        <div className="flex justify-between items-center py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <FloatingLogo>
              <img src="/darkLogo.png" alt="Virgil" className="h-12 w-auto" />
            </FloatingLogo>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/auth/signin"
              className="inline-flex items-center px-6 py-3 border border-blue-200 text-base font-semibold rounded-lg text-blue-800 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-white transition-all duration-200"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center relative">
          <TypewriterHeading
            text="Transform Your SAP Sales Process"
            className="text-4xl font-extrabold text-white sm:text-5xl md:text-6xl relative z-10"
          />
          <StaggeredText
            text="Streamline your sales pipeline with AI-powered insights, automated deal tracking, and intelligent recommendations."
            className="mt-6 max-w-2xl mx-auto text-lg text-blue-100 sm:text-xl md:text-2xl relative z-10"
            delay={2}
          />
          <div className="mt-8 max-w-md mx-auto sm:flex sm:justify-center md:mt-12">
            <AnimatedButton
              href="/checkout/tier2"
              className="w-full flex items-center justify-center px-8 py-4 border border-transparent text-lg font-semibold rounded-lg text-blue-900 bg-white hover:bg-blue-50 md:py-5 md:text-xl md:px-12 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <span>Get Started</span>
            </AnimatedButton>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Powerful Features for Modern Sales Teams
            </h2>
            <p className="mt-4 text-lg text-blue-100 max-w-2xl mx-auto">
              Everything you need to close more deals and grow your pipeline
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <FloatingCard delay={0.1}>
              <TiltCard className="[transform-style:preserve-3d]">
                <div className="bg-blue-900/40 backdrop-blur rounded-xl shadow-xl p-8 border border-blue-800/70 hover:border-blue-500 transition-colors">
                  <div className="w-16 h-16 bg-blue-700/40 rounded-xl flex items-center justify-center mb-6">
                    <svg
                      className="w-8 h-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-4">
                    AI-Powered Analytics
                  </h3>
                  <p className="text-blue-100 leading-relaxed">
                    Get intelligent insights into your sales pipeline with
                    advanced analytics and predictive modeling.
                  </p>
                </div>
              </TiltCard>
            </FloatingCard>

            {/* Feature 2 */}
            <FloatingCard delay={0.2}>
              <TiltCard className="[transform-style:preserve-3d]">
                <div className="bg-blue-900/40 backdrop-blur rounded-xl shadow-xl p-8 border border-blue-800/70 hover:border-blue-500 transition-colors">
                  <div className="w-16 h-16 bg-blue-700/40 rounded-xl flex items-center justify-center mb-6">
                    <svg
                      className="w-8 h-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-4">
                    Deal Tracking
                  </h3>
                  <p className="text-blue-100 leading-relaxed">
                    Track your deals from initial contact to close with
                    comprehensive deal management tools.
                  </p>
                </div>
              </TiltCard>
            </FloatingCard>

            {/* Feature 3 */}
            <FloatingCard delay={0.3}>
              <TiltCard className="[transform-style:preserve-3d]">
                <div className="bg-blue-900/40 backdrop-blur rounded-xl shadow-xl p-8 border border-blue-800/70 hover:border-blue-500 transition-colors">
                  <div className="w-16 h-16 bg-blue-700/40 rounded-xl flex items-center justify-center mb-6">
                    <svg
                      className="w-8 h-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-4">
                    Team Collaboration
                  </h3>
                  <p className="text-blue-100 leading-relaxed">
                    Work together seamlessly with your sales team using shared
                    pipelines and real-time updates.
                  </p>
                </div>
              </TiltCard>
            </FloatingCard>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="mt-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-blue-100 max-w-2xl mx-auto">
              Get started in minutes with our simple three-step process
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Step 1 */}
            <FloatingCard delay={0.1}>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-blue-600">1</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">
                  Add Your Data
                </h3>
                <p className="text-blue-100">
                  Create custom company profiles for companies you are
                  prospecting.
                </p>
              </div>
            </FloatingCard>

            {/* Step 2 */}
            <FloatingCard delay={0.2}>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-blue-600">2</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">
                  AI Analysis
                </h3>
                <p className="text-blue-100">
                  Our AI analyzes your pipeline and provides intelligent
                  insights and recommendations.
                </p>
              </div>
            </FloatingCard>

            {/* Step 3 */}
            <FloatingCard delay={0.3}>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-blue-600">3</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">
                  Close More Deals
                </h3>
                <p className="text-blue-100">
                  Use actionable insights to prioritize opportunities and
                  increase your win rate.
                </p>
              </div>
            </FloatingCard>
          </div>
        </div>

        {/* Pricing Section */}
        <div className="mt-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Simple, Transparent Pricing
            </h2>
            <p className="mt-4 text-lg text-blue-100 max-w-2xl mx-auto">
              Choose the plan that fits your team size and needs
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Tier 1 */}
            <FloatingCard delay={0.1}>
              <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Tier 1
                </h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">
                    $1,500
                  </span>
                  <span className="text-gray-600">/month</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center text-gray-600">
                    <svg
                      className="w-5 h-5 text-green-500 mr-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Up to 5 users
                  </li>
                  <li className="flex items-center text-gray-600">
                    <svg
                      className="w-5 h-5 text-green-500 mr-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Basic analytics
                  </li>
                  <li className="flex items-center text-gray-600">
                    <svg
                      className="w-5 h-5 text-green-500 mr-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Email support
                  </li>
                </ul>
                <AnimatedButton
                  href="/checkout/tier1"
                  className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-semibold rounded-lg text-white bg-blue-800 hover:bg-blue-900 transition-all duration-200"
                >
                  <span>Get Started</span>
                </AnimatedButton>
              </div>
            </FloatingCard>

            {/* Tier 2 */}
            <FloatingCard delay={0.2}>
              <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-blue-500 relative">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Popular
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Tier 2
                </h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">
                    $2,500
                  </span>
                  <span className="text-gray-600">/month</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center text-gray-600">
                    <svg
                      className="w-5 h-5 text-green-500 mr-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Up to 15 users
                  </li>
                  <li className="flex items-center text-gray-600">
                    <svg
                      className="w-5 h-5 text-green-500 mr-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Advanced analytics
                  </li>
                  <li className="flex items-center text-gray-600">
                    <svg
                      className="w-5 h-5 text-green-500 mr-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Priority support
                  </li>
                  <li className="flex items-center text-gray-600">
                    <svg
                      className="w-5 h-5 text-green-500 mr-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Custom integrations
                  </li>
                </ul>
                <AnimatedButton
                  href="/checkout/tier2"
                  className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-semibold rounded-lg text-white bg-blue-800 hover:bg-blue-900 transition-all duration-200"
                >
                  <span>Get Started</span>
                </AnimatedButton>
              </div>
            </FloatingCard>

            {/* Tier 3 */}
            <FloatingCard delay={0.3}>
              <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Tier 3
                </h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">
                    $3,500
                  </span>
                  <span className="text-gray-600">/month</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center text-gray-600">
                    <svg
                      className="w-5 h-5 text-green-500 mr-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Up to 25 users
                  </li>
                  <li className="flex items-center text-gray-600">
                    <svg
                      className="w-5 h-5 text-green-500 mr-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    AI-powered insights
                  </li>
                  <li className="flex items-center text-gray-600">
                    <svg
                      className="w-5 h-5 text-green-500 mr-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    24/7 support
                  </li>
                  <li className="flex items-center text-gray-600">
                    <svg
                      className="w-5 h-5 text-green-500 mr-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Advanced reporting
                  </li>
                </ul>
                <AnimatedButton
                  href="/pricing"
                  className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-semibold rounded-lg text-white bg-blue-800 hover:bg-blue-900 transition-all duration-200"
                >
                  <span>Get Started</span>
                </AnimatedButton>
              </div>
            </FloatingCard>

            {/* Tier 4 */}
            <FloatingCard delay={0.4}>
              <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Tier 4
                </h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">
                    $4,500
                  </span>
                  <span className="text-gray-600">/month</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center text-gray-600">
                    <svg
                      className="w-5 h-5 text-green-500 mr-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    35+ users
                  </li>
                  <li className="flex items-center text-gray-600">
                    <svg
                      className="w-5 h-5 text-green-500 mr-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Enterprise features
                  </li>
                  <li className="flex items-center text-gray-600">
                    <svg
                      className="w-5 h-5 text-green-500 mr-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Dedicated support
                  </li>
                  <li className="flex items-center text-gray-600">
                    <svg
                      className="w-5 h-5 text-green-500 mr-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Custom development
                  </li>
                </ul>
                <AnimatedButton
                  href="/checkout/tier4"
                  className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-semibold rounded-lg text-white bg-blue-800 hover:bg-blue-900 transition-all duration-200"
                >
                  <span>Contact Sales</span>
                </AnimatedButton>
              </div>
            </FloatingCard>
          </div>
        </div>
      </main>

      {/* Removed contact and bottom CTA sections */}
    </div>
  );
}
