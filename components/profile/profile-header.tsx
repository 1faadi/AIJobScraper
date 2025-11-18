"use client"

import { Button } from "@/components/ui/button"
import { Star, CheckCircle2, User } from "lucide-react"

interface ProfileHeaderProps {
  name: string
  title: string
  badge?: string
  jobSuccess: string
  onAddProfile?: () => void
}

export function ProfileHeader({ name, title, badge, jobSuccess, onAddProfile }: ProfileHeaderProps) {
  const getBadgeDisplay = (badge?: string) => {
    if (badge === "top-rated") return { text: "Top Rated", icon: Star }
    if (badge === "rising-talent") return { text: "Rising Talent", icon: null }
    if (badge === "expert") return { text: "Expert", icon: null }
    return null
  }

  const badgeInfo = getBadgeDisplay(badge)

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex-1">
        <h1 className="text-3xl font-bold text-foreground mb-2">{name}</h1>
        <p className="text-lg text-muted-foreground mb-4">{title}</p>
        <div className="flex items-center gap-3">
          {badgeInfo && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium">
              {badgeInfo.icon && <badgeInfo.icon className="w-4 h-4" />}
              {badgeInfo.text}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 text-green-600 rounded-full text-sm font-medium">
            <CheckCircle2 className="w-4 h-4" />
            {jobSuccess} Job Success
          </span>
        </div>
      </div>
      {onAddProfile && (
        <Button
          onClick={onAddProfile}
          variant="outline"
          className="bg-white border border-gray-300 text-foreground hover:bg-gray-50 flex items-center gap-2"
        >
          <User className="w-4 h-4" />
          Add Profile
        </Button>
      )}
    </div>
  )
}

