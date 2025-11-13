"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Search, Bell, MessageCircle, Plus } from "lucide-react"

export function SavedJobsHeader() {
  const router = useRouter()
  const { user } = useAuth()

  return (
    <div className="bg-card border-b border-border p-8">
      {/* Top Row - User Info and Actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
            {user?.avatar || user?.name?.charAt(0) || "U"}
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              {user?.name || "User"} - Welcome back to BXTrack Solutions 👋
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-muted rounded-lg transition-colors">
            <Search className="w-5 h-5 text-muted-foreground" />
          </button>
          <button className="p-2 hover:bg-muted rounded-lg transition-colors relative">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <button className="p-2 hover:bg-muted rounded-lg transition-colors">
            <MessageCircle className="w-5 h-5 text-muted-foreground" />
          </button>
          <Button
            onClick={() => router.push("/dashboard/jobs-feed")}
            className="bg-primary hover:bg-orange-600 text-primary-foreground"
          >
            Jobs Feed
          </Button>
        </div>
      </div>

      {/* Page Title Row */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-foreground">Saved Jobs</h2>
        <Button
          variant="outline"
          className="border-border flex items-center gap-2"
          onClick={() => router.push("/dashboard/templates")}
        >
          <Plus className="w-4 h-4" />
          Add Template
        </Button>
      </div>
    </div>
  )
}

