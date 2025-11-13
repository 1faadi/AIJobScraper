"use client"

import { useState } from "react"
import { Clock } from "lucide-react"

interface ProfileSummaryCardProps {
  title: string
  description: string
  hourlyRate: string
  skills?: string[]
}

export function ProfileSummaryCard({ title, description, hourlyRate, skills }: ProfileSummaryCardProps) {
  const [showFull, setShowFull] = useState(false)
  const descriptionParts = description.split("\n\n").filter(p => p.trim())
  const hasMultipleParts = descriptionParts.length > 1
  const maxLength = 300 // Character limit for truncated view

  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
      <div className="flex items-start justify-between gap-6">
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            {title} {skills && skills.length > 0 && `| ${skills.slice(0, 3).join(", ")}`}
          </h2>
          <div className="space-y-3 text-sm text-muted-foreground">
            {hasMultipleParts ? (
              <>
                {descriptionParts.map((part, index) => (
                  <p key={index} className={!showFull && index > 0 ? "hidden" : ""}>
                    {part}
                  </p>
                ))}
                <button
                  onClick={() => setShowFull(!showFull)}
                  className="text-primary hover:underline font-medium"
                >
                  {showFull ? "show less" : "...more"}
                </button>
              </>
            ) : (
              <>
                <p>{showFull ? description : (description.length > maxLength ? description.substring(0, maxLength) + "..." : description)}</p>
                {description.length > maxLength && (
                  <button
                    onClick={() => setShowFull(!showFull)}
                    className="text-primary hover:underline font-medium"
                  >
                    {showFull ? "show less" : "...more"}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 text-green-600">
          <Clock className="w-5 h-5" />
          <span className="text-2xl font-bold">{hourlyRate}</span>
        </div>
      </div>
    </div>
  )
}

