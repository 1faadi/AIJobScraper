"use client"

import { useState } from "react"
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

export function JobCard({ job }: { job: Job }) {
  const [isSaved, setIsSaved] = useState(false)

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
        <Button className="flex-1 bg-primary hover:bg-orange-600 text-primary-foreground">Write Proposal</Button>
        <button
          onClick={() => setIsSaved(!isSaved)}
          className={`p-3 rounded-lg border transition-colors ${
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
