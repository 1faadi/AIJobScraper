"use client"

import { Search, Bell } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function TopHeader() {
  return (
    <div className="flex items-start justify-between mb-4 mt-4">
      {/* Left: avatar + welcome */}
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10 ring-2 ring-white shadow-sm">
          <AvatarImage src="/placeholder-user.jpg" alt="Sophia" />
          <AvatarFallback>SW</AvatarFallback>
        </Avatar>
        <div className="pt-0.5">
          <h1 className="text-[15px] font-semibold text-[var(--ink)]">Sophia Williams</h1>
          <p className="text-[13px] text-[var(--muted)]">
            Welcome back to Synergy <span>👋</span>
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

