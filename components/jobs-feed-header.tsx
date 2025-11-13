"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Search, Bell } from "lucide-react"

export interface JobsFeedHeaderProps {
  activeTab?: string
  onTabChange?: (tab: string) => void
}

export function JobsFeedHeader(props: JobsFeedHeaderProps) {
  const { activeTab: externalActiveTab, onTabChange } = props
  const [selectedProfile, setSelectedProfile] = useState("all")
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
    <div className="bg-card border-b border-border p-8">
      {/* Top Row */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Welcome back to BXTrack Solutions 👋</h1>
          <p className="text-sm text-muted-foreground mt-1">Sophia Williams</p>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-muted rounded-lg transition-colors">
            <Search className="w-5 h-5 text-muted-foreground" />
          </button>
          <button className="p-2 hover:bg-muted rounded-lg transition-colors relative">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <Button className="bg-primary hover:bg-orange-600 text-primary-foreground">Jobs Feed</Button>
        </div>
      </div>

      {/* Profile Selector and Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <select
            value={selectedProfile}
            onChange={(e) => setSelectedProfile(e.target.value)}
            className="px-4 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-primary outline-none"
          >
            <option value="all">Select Profile</option>
            <option value="profile1">Profile 1</option>
            <option value="profile2">Profile 2</option>
          </select>
        </div>
        <div className="flex gap-4">
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
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
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
