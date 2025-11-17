"use client"

import { useEffect, useState } from "react"
import { JobCardWithDetails } from "@/components/job-card"
import TopHeader from "@/components/jobs/top-header"
import TabsStrip from "@/components/jobs/tabs-strip"

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
    <div className="flex flex-col h-full bg-[var(--bg)]">
      <div className="mx-auto w-full px-6 py-4">
        <TopHeader />
        <TabsStrip activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
      <div className="flex-1 overflow-auto">
        <div className="mx-auto w-full  px-6 pb-8">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-[var(--muted)]">Loading jobs...</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-red-500">{error}</div>
            </div>
          ) : jobs.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-[var(--muted)]">No jobs found</div>
            </div>
          ) : (
            <div className="space-y-6 mt-6">
              {jobs.map((job) => (
                <JobCardWithDetails key={job.id} job={job} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
