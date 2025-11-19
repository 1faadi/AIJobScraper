"use client"

import { useState } from "react"
import { Search } from "lucide-react"

interface TabsStripProps {
  activeTab?: string
  onTabChange?: (tab: string) => void
  hideProfileSelector?: boolean
  hideSearch?: boolean
  searchValue?: string
  onSearchChange?: (value: string) => void
}

export default function TabsStrip({ 
  activeTab: externalActiveTab, 
  onTabChange, 
  hideProfileSelector = false, 
  hideSearch = false,
  searchValue = "",
  onSearchChange
}: TabsStripProps) {
  const [internalActiveTab, setInternalActiveTab] = useState("mostRecent")
  const activeTab = externalActiveTab ?? internalActiveTab

  const handleTabChange = (tab: string) => {
    if (onTabChange) {
      onTabChange(tab)
    } else {
      setInternalActiveTab(tab)
    }
  }

  return (
    <div className={`${hideProfileSelector ? 'mt-3' : 'mt-4'} flex items-center ${hideProfileSelector ? 'justify-between' : 'justify-between'}`}>
      {/* Select Profile (left) */}
      {!hideProfileSelector && (
        <div className="flex flex-col">
          <label className="mb-1 text-[12px] font-medium text-[var(--muted)]">Select Profile</label>
          <div className="relative">
            <input
              defaultValue="Williams Sophia"
              readOnly
              className="h-[38px] w-[260px] rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--field)] px-3 pr-9 text-[13px] text-[var(--ink)] cursor-pointer"
            />
            <svg
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>
        </div>
      )}

      {/* Tabs (aligned left when profile selector is hidden) */}
      <div className={`${hideProfileSelector ? '' : 'flex-1 pl-8'}`}>
        <div className="inline-flex items-center rounded-[12px] border border-[var(--tab-outline)] bg-[#F7F8FA] p-0.5">
          <button
            onClick={() => handleTabChange("mostRecent")}
            className={`h-9 min-w-[140px] rounded-[10px] px-4 text-[13px] transition-all ${
              activeTab === "mostRecent"
                ? "bg-white text-[var(--ink)] shadow-[var(--shadow-soft)] font-semibold"
                : "bg-transparent text-[var(--muted)] hover:text-[var(--ink)] font-normal"
            }`}
          >
            Most Recent
          </button>
          <button
            onClick={() => handleTabChange("bestMatches")}
            className={`h-9 min-w-[140px] rounded-[10px] px-4 text-[13px] transition-all ${
              activeTab === "bestMatches"
                ? "bg-white text-[var(--ink)] shadow-[var(--shadow-soft)] font-semibold"
                : "bg-transparent text-[var(--muted)] hover:text-[var(--ink)] font-normal"
            }`}
          >
            Best Matches
          </button>
          <button
            onClick={() => handleTabChange("discarded")}
            className={`h-9 min-w-[140px] rounded-[10px] px-4 text-[13px] transition-all ${
              activeTab === "discarded"
                ? "bg-white text-[var(--ink)] shadow-[var(--shadow-soft)] font-semibold"
                : "bg-transparent text-[var(--muted)] hover:text-[var(--ink)] font-normal"
            }`}
          >
            Discarded
          </button>
        </div>
      </div>

      {/* Right search (for larger screens) */}
      {!hideSearch && (
        <div className="hidden lg:block ml-auto">
          <div className="relative">
            <input
              type="text"
              placeholder="Search jobs..."
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="h-[38px] w-[220px] rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--field)] pl-10 pr-3 text-[13px] text-[var(--ink)] outline-none focus:ring-4 focus:ring-[#eaf3ff]"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)] pointer-events-none" />
          </div>
        </div>
      )}
    </div>
  )
}

