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
        {/* Search input */}
        <div className="hidden md:block">
          <div className="relative">
            <input
              placeholder="Search"
              className="h-[38px] w-[240px] rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--field)] pl-10 pr-3 text-[13px] text-[var(--ink)] outline-none focus:ring-4 focus:ring-[#eaf3ff]"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)] pointer-events-none" />
          </div>
        </div>

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

