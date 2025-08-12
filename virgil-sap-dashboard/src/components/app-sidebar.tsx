"use client";

import {
  BarChart3,
  FileText,
  Kanban,
  PlusCircle,
  Search,
  Settings,
  DollarSign,
  Bot,
  Users,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const menuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: BarChart3,
  },
  {
    title: "New Account",
    url: "/new-account",
    icon: PlusCircle,
  },
  {
    title: "Fit & Benefit Analyzer",
    url: "/analyzer",
    icon: Search,
  },
  {
    title: "Deck Generator",
    url: "/decks",
    icon: FileText,
  },
  {
    title: "Pipeline",
    url: "/pipeline",
    icon: Kanban,
  },
  {
    title: "Commission Submission",
    url: "/commissions",
    icon: DollarSign,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
];

const adminMenuItems = [
  {
    title: "User Management",
    url: "/admin",
    icon: Users,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar-background flex flex-col">
      <SidebarHeader className="border-b border-sidebar-border pl-0 pr-0 py-0">
        <div className="flex items-center justify-start gap-0">
          <div className="flex-shrink-0 -ml-4">
            <Image
              src="/Virgil_blue.svg"
              alt="Virgil Logo"
              width={120}
              height={120}
              className="h-48 w-auto object-contain"
            />
          </div>
          <div className="flex-shrink-0 min-w-0 flex-1 -ml-12">
            <h1 className="text-sm font-semibold text-sidebar-foreground truncate"></h1>
            <p className="text-xs text-sidebar-muted-foreground truncate"></p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="flex-1">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-muted-foreground font-medium">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      pathname === item.url ||
                      (item.url !== "/pipeline" &&
                        pathname.startsWith(item.url))
                    }
                    className="text-sidebar-foreground hover:text-sidebar-primary hover:bg-sidebar-accent transition-colors"
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Section */}
        {session?.user?.isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-muted-foreground font-medium">
              Administration
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminMenuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={
                        pathname === item.url || pathname.startsWith(item.url)
                      }
                      className="text-sidebar-foreground hover:text-sidebar-primary hover:bg-sidebar-accent transition-colors"
                    >
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* User Section - Fixed at bottom */}
      {session?.user && (
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-sidebar-accent/50 hover:bg-sidebar-accent transition-colors">
            <div className="flex-shrink-0">
              {session.user.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-sidebar-primary flex items-center justify-center">
                  <span className="text-xs font-medium text-white">
                    {session.user.name?.charAt(0) || "U"}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {session.user.name || "User"}
              </p>
              <p className="text-xs text-sidebar-muted-foreground truncate">
                {session.user.email}
              </p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/auth/signin" })}
              className="flex-shrink-0 p-1 rounded-md hover:bg-sidebar-accent transition-colors"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4 text-sidebar-muted-foreground hover:text-sidebar-foreground" />
            </button>
          </div>
        </div>
      )}
    </Sidebar>
  );
}
