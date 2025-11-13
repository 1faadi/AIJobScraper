"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Search, Bell, MessageCircle } from "lucide-react"

export function TopBar() {
  const router = useRouter()

  return (
    <div className="bg-card border-b border-border px-8 py-4">
      <div className="flex items-center justify-end gap-4">
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
  )
}

