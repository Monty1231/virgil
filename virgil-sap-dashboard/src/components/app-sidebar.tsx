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
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

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
    url: "/",
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
    title: "Pipeline Tracker",
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

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar-background">
      <SidebarHeader className="border-b border-sidebar-border p-6">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-12">
            <Image
              src="/Virgil_blue.svg"
              alt="My Logo"
              width={32}
              height={32}
              className="h-51 w-51 rounded-full object-cover"
            />
          </div>
          <div>
            <h1 className="text-subheading font-semibold text-sidebar-foreground">
              Virgil AI
            </h1>
            <p className="text-caption text-sidebar-muted-foreground">
              SAP Sales Assistant
            </p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
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
                    isActive={pathname === item.url}
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
      </SidebarContent>
    </Sidebar>
  );
}
