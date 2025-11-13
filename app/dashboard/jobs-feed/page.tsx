"use client"

import { useEffect, useState } from "react"
import { JobsFeedHeader } from "@/components/jobs-feed-header"
import { JobCard } from "@/components/job-card"

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

export default function JobsFeedPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("mostRecent")

  useEffect(() => {
    fetchJobs(activeTab)
  }, [activeTab])

  const fetchJobs = async (tab: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/jobs?tab=${tab}&page=1`)
      if (!response.ok) {
        throw new Error("Failed to fetch jobs")
      }
      const data = await response.json()
      setJobs(data.jobs)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load jobs")
      console.error("Error fetching jobs:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <JobsFeedHeader onTabChange={setActiveTab} activeTab={activeTab} />
      <div className="flex-1 overflow-auto p-8">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading jobs...</div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-red-500">{error}</div>
          </div>
        ) : jobs.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">No jobs found</div>
          </div>
        ) : (
          <div className="space-y-4 max-w-4xl">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
