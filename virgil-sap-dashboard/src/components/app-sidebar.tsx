"use client"

import { BarChart3, FileText, Kanban, PlusCircle, Search, Settings, DollarSign, Bot } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"

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
} from "@/components/ui/sidebar"

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
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar className="border-r border-gray-200">
      <SidebarHeader className="border-b border-gray-200 p-6">
        <div className="flex items-center gap-2">
           <Image
            src="/Virgil_blue.png"
            alt="My Logo"
            width={32}
            height={32}
            className="h-8 w-8"
          />
          <div>
            <h1 className="text-xl font-bold text-gray-900">Virgil AI</h1>
            <p className="text-sm text-gray-500">SAP Sales Assistant</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-600 font-medium">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    className="text-gray-700 hover:text-blue-600 hover:bg-blue-50"
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
  )
}
