"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Heart, ShieldCheck, Star, Briefcase, Coins, Sparkles } from "lucide-react"
import { CircleScore } from "@/components/ui/circle-score"
import { JobDetailsAICard } from "@/components/jobs/job-details-ai-card"

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
  clientCountry?: string
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

  // Calculate score from fitScore or matchScore
  const getScore = () => {
    if (job.fitScore !== undefined) {
      // Map fitScore: 0 -> 25, 70 -> 70, 100 -> 90
      if (job.fitScore === 0) return 25
      if (job.fitScore === 70) return 70
      if (job.fitScore === 100) return 90
      return job.fitScore
    }
    return job.matchScore || 0
  }

  const score = getScore()

  return (
    <div className="bg-white rounded-2xl p-6 shadow-[0_8px_24px_rgba(15,23,42,0.06)] border border-[#E7ECF2] hover:shadow-[0_12px_32px_rgba(15,23,42,0.08)] transition-shadow h-full flex flex-col">
      {/* Header with Posted Time and Score */}
      <div className="flex justify-between items-start mb-4">
        <p className="text-xs text-[#64748B]">Posted {job.postedTime}</p>
        <CircleScore value={score} />
      </div>

      {/* Title */}
      <h3 className="text-[18px] font-semibold text-[#0F172A] mb-3 leading-tight">
        {job.title}
      </h3>

      {/* Budget and Level */}
      <p className="text-sm text-[#64748B] mb-3">
        {job.pricing} Est. budget:{job.budget} {job.level}
      </p>

      {/* Description */}
      <p className="text-sm text-[#0F172A] line-clamp-2 mb-4 leading-relaxed">
        {job.description}
      </p>

      {/* Skills Chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        {job.skills.map((skill) => (
          <span
            key={skill}
            className="inline-flex items-center rounded-full bg-[#F1F5F9] px-2.5 py-1 text-[11px] font-medium text-[#0F172A]"
          >
            {skill}
          </span>
        ))}
      </div>

      {/* Stats Row */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-[#64748B] mb-4 pb-4 border-b border-[#E7ECF2]">
        {job.paymentVerified && (
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#22C55E]" />
            <span>Payment verified</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-0.5">
            <Star className="w-4 h-4 text-[#F97316] fill-[#F97316]" />
            <span className="font-medium">{job.rating}</span>
          </div>
          <span className="text-[#F97316]">★</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span>
            {job.hireRate}% hire rate, {job.openJobs} open jobs
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Briefcase className="w-4 h-4" />
          <span>
            {job.totalSpend}K Total Spend, {job.totalHires} hires
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Coins className="w-4 h-4" />
          <span>${job.avgRate} /hr average Rate</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-3 mt-auto">
        <Button
          onClick={() => router.push(`/dashboard/jobs-feed/${job.id}/proposal`)}
          className="bg-[#FF6A00] hover:bg-[#E55A00] text-white rounded-lg px-4 py-2 font-medium shadow-sm transition-colors"
        >
          Write Proposal
        </Button>
        <button
          onClick={handleSaveToggle}
          disabled={isSaving}
          className={`p-3 rounded-lg border border-[#E7ECF2] transition-colors disabled:opacity-50 ${
            isSaved
              ? "bg-[#FF6A00] text-white border-[#FF6A00]"
              : "bg-white text-[#64748B] hover:bg-[#FAFBFC] hover:text-[#0F172A]"
          }`}
        >
          <Heart className={`w-5 h-5 ${isSaved ? "fill-current" : ""}`} />
        </button>
      </div>
    </div>
  )
}

// Wrapper component to handle AI details card
export function JobCardWithDetails({ job, isSaved: initialIsSaved, onSaveChange }: JobCardProps) {
  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <div>
          <JobCard 
            job={job} 
            isSaved={initialIsSaved} 
            onSaveChange={onSaveChange}
          />
        </div>
        
        {/* AI Analysis card - always visible */}
        <div className="lg:sticky lg:top-4">
          <JobDetailsAICard
            jobId={job.id}
            jobData={job}
          />
        </div>
      </div>
    </div>
  )
}
