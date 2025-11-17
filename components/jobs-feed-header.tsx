"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Search, Bell } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export interface JobsFeedHeaderProps {
  activeTab?: string
  onTabChange?: (tab: string) => void
}

export function JobsFeedHeader(props: JobsFeedHeaderProps) {
  const { activeTab: externalActiveTab, onTabChange } = props
  const [selectedProfile, setSelectedProfile] = useState("Williams Sophia")
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
    <div className="bg-white border-b border-[#E7ECF2] px-8 py-6">
      {/* Top Row */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src="/placeholder-user.jpg" />
            <AvatarFallback>SW</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-lg font-semibold text-[#0F172A]">
              Welcome back to Synergy. <span className="font-normal">Sophia Williams</span>
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-[#F7F8FA] rounded-lg transition-colors">
            <Search className="w-5 h-5 text-[#64748B]" />
          </button>
          <button className="p-2 hover:bg-[#F7F8FA] rounded-lg transition-colors relative">
            <Bell className="w-5 h-5 text-[#64748B]" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <Button className="bg-[#FF6A00] hover:bg-[#E55A00] text-white rounded-lg px-4 py-2 font-medium shadow-sm">
            Jobs Feed
          </Button>
        </div>
      </div>

      {/* Profile Selector and Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <select
            value={selectedProfile}
            onChange={(e) => setSelectedProfile(e.target.value)}
            className="px-4 py-2 bg-white border border-[#E7ECF2] rounded-lg text-sm text-[#0F172A] focus:ring-2 focus:ring-[#FF6A00] focus:border-[#FF6A00] outline-none"
          >
            <option value="Williams Sophia">Williams Sophia</option>
            <option value="profile1">Profile 1</option>
            <option value="profile2">Profile 2</option>
          </select>
        </div>
        <div className="flex gap-1">
          {[
            { id: "mostRecent", label: "Most Recent" },
            { id: "bestMatches", label: "Best Matches" },
            { id: "discarded", label: "Discarded" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "text-[#FF6A00] border-b-2 border-[#FF6A00] pb-2"
                  : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
