"use client";

import { useSession } from "next-auth/react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const { data: session, status } = useSession();

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated and active, show the full app with sidebar
  if (session?.user?.isActive) {
    return (
      <SidebarProvider defaultOpen={true}>
        <AppSidebar />
        <main className="flex-1 overflow-auto">{children}</main>
      </SidebarProvider>
    );
  }

  // If user is not authenticated or not active, show content without sidebar
  return <>{children}</>;
}
