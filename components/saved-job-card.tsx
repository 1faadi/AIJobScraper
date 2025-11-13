"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { CheckCircle, Star, Users, DollarSign, FilePen } from "lucide-react"

interface SavedJob {
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
}

interface SavedJobCardProps {
  job: SavedJob
  onRemove: (jobId: string) => void
}

export function SavedJobCard({ job, onRemove }: SavedJobCardProps) {
  const router = useRouter()
  
  const score = job.fitScore ?? job.matchScore

  const handleWriteProposal = () => {
    router.push(`/dashboard/jobs-feed/${job.id}/proposal`)
  }

  const handleRemove = () => {
    if (confirm("Are you sure you want to remove this job from your saved jobs?")) {
      onRemove(job.id)
    }
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow relative">
      {/* Header Row */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-xs text-muted-foreground mb-2">Posted {job.postedTime}</p>
        </div>
        {/* Score Indicator */}
        <div className="flex flex-col items-center ml-4">
          <div className="w-16 h-16 rounded-full border-4 border-orange-500 bg-orange-50 dark:bg-orange-950 flex items-center justify-center">
            <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
              {score}%
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Score</p>
        </div>
      </div>

      {/* Job Title */}
      <h3 className="text-lg font-bold text-foreground mb-3">{job.title}</h3>

      {/* Meta Info */}
      <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
        <span>{job.pricing}</span>
        <span>•</span>
        <span>
          Est. budget:{" "}
          {typeof job.budget === "string" && job.budget.includes("$")
            ? job.budget
            : `$${typeof job.budget === "number" ? job.budget.toFixed(2) : job.budget}`}
        </span>
        <span>•</span>
        <span>{job.level}</span>
      </div>

      {/* Description */}
      <p className="text-sm text-foreground mb-4 line-clamp-3 leading-relaxed">
        {job.description}
      </p>

      {/* Skills Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {job.skills.map((skill) => (
          <span
            key={skill}
            className="px-3 py-1 bg-muted text-muted-foreground text-xs rounded-full"
          >
            {skill}
          </span>
        ))}
      </div>

      {/* Trust / Metrics Row */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-4 pb-4 border-b border-border">
        {job.paymentVerified && (
          <div className="flex items-center gap-1">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Payment verified</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-3 h-3 ${
                  star <= Math.round(job.rating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                }`}
              />
            ))}
          </div>
          <span className="ml-1">{job.rating}</span>
        </div>
        <div className="flex items-center gap-1">
          <Users className="w-4 h-4 text-green-500" />
          <span>
            {job.hireRate}% hire rate, {job.openJobs} open jobs
          </span>
        </div>
        <div className="flex items-center gap-1">
          <DollarSign className="w-4 h-4 text-green-500" />
          <span>
            {typeof job.totalSpend === "number" ? `${job.totalSpend}K` : job.totalSpend} Total Spend, {job.totalHires} hires
          </span>
        </div>
        <div className="flex items-center gap-1">
          <DollarSign className="w-4 h-4 text-orange-500" />
          <span>${typeof job.avgRate === "number" ? job.avgRate.toFixed(2) : job.avgRate} /hr average Rate</span>
        </div>
      </div>

      {/* Actions Row */}
      <div className="flex items-center gap-3">
        <Button
          onClick={handleWriteProposal}
          className="bg-primary hover:bg-orange-600 text-primary-foreground flex items-center gap-2"
        >
          <FilePen className="w-4 h-4" />
          Write Proposal
        </Button>
        <Button
          onClick={handleRemove}
          variant="outline"
          className="border-border text-foreground hover:bg-muted"
        >
          Remove
        </Button>
      </div>
    </div>
  )
}

