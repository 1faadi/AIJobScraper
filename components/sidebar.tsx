"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, Briefcase, Users, Heart, FileText, LogOut, Sparkles, Settings, Menu, ChevronLeft, FileCheck } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/jobs-feed", icon: Briefcase, label: "Jobs Feed" },
  { href: "/dashboard/raw-proposal", icon: Sparkles, label: "Raw Proposal" },
  { href: "/dashboard/cv-screener", icon: FileCheck, label: "CV Screener" },
  { href: "/dashboard/profiles", icon: Users, label: "Profiles" },
  { href: "/dashboard/saved-jobs", icon: Heart, label: "Saved Jobs" },
  { href: "/dashboard/templates", icon: FileText, label: "Templates" },
  { href: "/dashboard/prompt-config", icon: Settings, label: "Prompt Config" },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const router = useRouter()
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Load collapsed state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem("sidebarCollapsed")
    if (savedState !== null) {
      setIsCollapsed(savedState === "true")
    }
  }, [])

  // Save collapsed state to localStorage
  const toggleSidebar = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem("sidebarCollapsed", String(newState))
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  return (
    <aside
      className={`bg-white border-r border-[#E7ECF2] flex flex-col transition-all duration-300 ease-in-out ${
        isCollapsed ? "w-[80px]" : "w-[240px]"
      }`}
    >
      {/* Logo */}
      <div className="h-[72px] px-8 border-b border-[#E7ECF2] flex items-center justify-between">
        <div className={`flex items-center gap-2 transition-opacity duration-300 ${isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"}`}>
          <div className="w-8 h-8 rounded-lg bg-[#FF6A00] flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">AI</span>
          </div>
          <span className="text-sm font-semibold text-[#0F172A] whitespace-nowrap">AI Job Scraping</span>
        </div>
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg hover:bg-[#F7F8FA] transition-colors flex-shrink-0 ml-auto"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <Menu className="w-5 h-5 text-[#64748B]" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-[#64748B]" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        <div
          className={`text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-3 px-3 transition-opacity duration-300 ${
            isCollapsed ? "opacity-0 h-0 overflow-hidden mb-0" : "opacity-100"
          }`}
        >
          Main
        </div>
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors group relative ${
                isActive
                  ? "bg-[rgba(255,106,0,0.1)] text-[#FF6A00] font-semibold"
                  : "text-[#64748B] hover:bg-[#F7F8FA] hover:text-[#0F172A]"
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span
                className={`text-sm font-medium transition-opacity duration-300 whitespace-nowrap ${
                  isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
                }`}
              >
                {item.label}
              </span>
              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-[#0F172A] text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User Profile Card */}
      <div className="p-4 border-t border-[#E7ECF2]">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#F7F8FA] transition-colors cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-[#FF6A00] text-white flex items-center justify-center font-semibold text-sm flex-shrink-0">
                {user?.name?.charAt(0) || "U"}
              </div>
              <div
                className={`flex-1 min-w-0 transition-opacity duration-300 ${
                  isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
                }`}
              >
                <p className="text-sm font-medium text-[#0F172A] truncate">{user?.name || "User"}</p>
                <p className="text-xs text-[#64748B] truncate">{user?.email || "user@example.com"}</p>
              </div>
              <svg
                className={`w-4 h-4 text-[#64748B] flex-shrink-0 transition-opacity duration-300 ${
                  isCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium text-[#0F172A]">{user?.name || "User"}</p>
              <p className="text-xs text-[#64748B] truncate">{user?.email || "user@example.com"}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={handleLogout}
              className="cursor-pointer"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  )
}
