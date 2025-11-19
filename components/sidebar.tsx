"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, Briefcase, Users, Heart, FileText, LogOut, Sparkles, Settings } from "lucide-react"
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
  { href: "/dashboard/profiles", icon: Users, label: "Profiles" },
  { href: "/dashboard/saved-jobs", icon: Heart, label: "Saved Jobs" },
  { href: "/dashboard/templates", icon: FileText, label: "Templates" },
  { href: "/dashboard/prompt-config", icon: Settings, label: "Prompt Config" },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  return (
    <aside className="w-[240px] bg-white border-r border-[#E7ECF2] flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-[#E7ECF2]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#FF6A00] flex items-center justify-center">
            <span className="text-white font-bold text-sm">AI</span>
          </div>
          <span className="text-sm font-semibold text-[#0F172A]">AI Job Scraping</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        <div className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-3 px-3">Main</div>
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                isActive
                  ? "bg-[rgba(255,106,0,0.1)] text-[#FF6A00] font-semibold"
                  : "text-[#64748B] hover:bg-[#F7F8FA] hover:text-[#0F172A]"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* User Profile Card */}
      <div className="p-4 border-t border-[#E7ECF2]">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#F7F8FA] transition-colors cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-[#FF6A00] text-white flex items-center justify-center font-semibold text-sm">
                {user?.name?.charAt(0) || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#0F172A] truncate">{user?.name || "User"}</p>
                <p className="text-xs text-[#64748B] truncate">{user?.email || "user@example.com"}</p>
              </div>
              <svg
                className="w-4 h-4 text-[#64748B]"
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
