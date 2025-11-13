"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Heart, CheckCircle, Star, Users, DollarSign } from "lucide-react"

interface Job {
  id: string
  title: string
  postedTime: string
  pricing: string
  budget: string
  level: string
  description: string
  skills: string[]
  paymentVerified: boolean
  rating: number
  hireRate: number
  openJobs: number
  totalSpend: number
  totalHires: number
  avgRate: number
  matchScore: number
  fitScore?: number
  bucket?: string
}

interface JobCardProps {
  job: Job
  isSaved?: boolean
  onSaveChange?: (jobId: string, isSaved: boolean) => void
}

export function JobCard({ job, isSaved: initialIsSaved, onSaveChange }: JobCardProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [isSaved, setIsSaved] = useState(initialIsSaved || false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const checkSavedStatus = async () => {
      if (!user?.id) return
      
      try {
        const response = await fetch(`/api/saved-jobs?userId=${user.id}`)
        if (response.ok) {
          const data = await response.json()
          const saved = data.savedJobs?.includes(job.id) || false
          setIsSaved(saved)
        }
      } catch (error) {
        console.error("Error checking saved status:", error)
      }
    }

    checkSavedStatus()
  }, [job.id, user?.id])

  const handleSaveToggle = async () => {
    if (!user?.id) {
      alert("Please log in to save jobs")
      return
    }

    setIsSaving(true)
    try {
      if (isSaved) {
        // Unsave job
        const response = await fetch("/api/saved-jobs", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, jobId: job.id }),
        })

        if (response.ok) {
          setIsSaved(false)
          if (onSaveChange) onSaveChange(job.id, false)
        } else {
          throw new Error("Failed to unsave job")
        }
      } else {
        // Save job
        const response = await fetch("/api/saved-jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, jobId: job.id }),
        })

        if (response.ok) {
          setIsSaved(true)
          if (onSaveChange) onSaveChange(job.id, true)
        } else {
          throw new Error("Failed to save job")
        }
      }
    } catch (error) {
      console.error("Error toggling save:", error)
      alert(error instanceof Error ? error.message : "Failed to save job")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <p className="text-xs text-muted-foreground mb-2">Posted {job.postedTime}</p>
          <h3 className="text-lg font-bold text-foreground mb-2">{job.title}</h3>
          <p className="text-sm text-muted-foreground mb-3">
            {job.pricing} | Est. budget: {job.budget} | {job.level}
          </p>
          <p className="text-sm text-foreground line-clamp-2 mb-4">{job.description}</p>
        </div>
        <div className="flex flex-col items-center gap-2 ml-4">
          <div className="w-16 h-16 rounded-full border-4 border-orange-500 bg-orange-50 dark:bg-orange-950 flex items-center justify-center">
            <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
              {job.fitScore ?? job.matchScore}%
            </span>
          </div>
        </div>
      </div>

      {/* Skills */}
      <div className="flex flex-wrap gap-2 mb-4">
        {job.skills.map((skill) => (
          <span key={skill} className="px-3 py-1 bg-muted text-muted-foreground text-xs rounded-full">
            {skill}
          </span>
        ))}
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-4 pb-4 border-b border-border">
        <div className="flex items-center gap-1">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span>Payment verified</span>
        </div>
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 text-yellow-500" />
          <span>{job.rating} rating</span>
        </div>
        <div className="flex items-center gap-1">
          <Users className="w-4 h-4" />
          <span>
            {job.hireRate}% hire rate, {job.openJobs} open jobs
          </span>
        </div>
        <div className="flex items-center gap-1">
          <DollarSign className="w-4 h-4" />
          <span>
            ${job.totalSpend}K Total Spend, {job.totalHires} hires
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span>${job.avgRate}/hr average Rate</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button 
          onClick={() => router.push(`/dashboard/jobs-feed/${job.id}/proposal`)}
          className="flex-1 bg-primary hover:bg-orange-600 text-primary-foreground"
        >
          Write Proposal
        </Button>
        <button
          onClick={handleSaveToggle}
          disabled={isSaving}
          className={`p-3 rounded-lg border transition-colors disabled:opacity-50 ${
            isSaved
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          <Heart className={`w-5 h-5 ${isSaved ? "fill-current" : ""}`} />
        </button>
      </div>
    </div>
  )
}
