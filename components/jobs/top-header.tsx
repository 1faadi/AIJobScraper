"use client"

import { Search, Bell } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/lib/auth-context"

export default function TopHeader() {
  const { user } = useAuth()
  
  // Get user initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const userName = user?.name || "User"
  const userInitials = user?.name ? getInitials(user.name) : "U"

  return (
    <div className="flex items-start justify-between mb-4 mt-4">
      {/* Left: avatar + welcome */}
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10 ring-2 ring-white shadow-sm">
          <AvatarImage src={user?.avatar || "/placeholder-user.jpg"} alt={userName} />
          <AvatarFallback>{userInitials}</AvatarFallback>
        </Avatar>
        <div className="pt-0.5">
          <h1 className="text-[15px] font-semibold text-[var(--ink)]">{userName}</h1>
          <p className="text-[13px] text-[var(--muted)]">
            Welcome back to BXTrack Solutions <span>👋</span>
          </p>
        </div>
      </div>

      {/* Right: search input, bell, orange CTA */}
      <div className="flex items-center gap-3">
        {/* Search icon button */}
        <button className="hidden md:grid h-10 w-10 place-items-center rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--field)] hover:bg-[#fafbfd] transition-colors">
          <Search className="h-5 w-5 text-[var(--muted)]" />
        </button>

        {/* Bell icon button */}
        <button className="grid h-10 w-10 place-items-center rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--field)] hover:bg-[#fafbfd] transition-colors">
          <Bell className="h-5 w-5 text-[var(--muted)]" />
        </button>

        {/* Orange CTA */}
        <button className="h-10 rounded-[var(--radius-md)] bg-[var(--brand-orange)] px-4 text-[13px] font-semibold text-white shadow-[var(--shadow-soft)] hover:brightness-95 transition-all">
          Jobs Feed
        </button>
      </div>
    </div>
  )
}

