"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { SavedJobCard } from "@/components/saved-job-card"
import { SavedJobsHeader } from "@/components/saved-jobs-header"

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

export default function SavedJobsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [savedJobs, setSavedJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user?.id) {
      fetchSavedJobs()
    } else {
      setIsLoading(false)
    }
  }, [user?.id])

  const fetchSavedJobs = async () => {
    if (!user?.id) return

    setIsLoading(true)
    setError(null)
    try {
      // Fetch saved job IDs
      const savedResponse = await fetch(`/api/saved-jobs?userId=${user.id}`)
      if (!savedResponse.ok) {
        throw new Error("Failed to fetch saved jobs")
      }

      const savedData = await savedResponse.json()
      const savedJobIds = savedData.savedJobs || []

      if (savedJobIds.length === 0) {
        setSavedJobs([])
        setIsLoading(false)
        return
      }

      // Fetch all jobs and filter by saved IDs
      const jobsResponse = await fetch("/api/jobs?tab=mostRecent&page=1")
      if (!jobsResponse.ok) {
        throw new Error("Failed to fetch jobs")
      }

      const jobsData = await jobsResponse.json()
      const allJobs = jobsData.jobs || []
      
      // Filter to only saved jobs
      const saved = allJobs.filter((job: Job) => savedJobIds.includes(job.id))
      setSavedJobs(saved)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load saved jobs")
      console.error("Error fetching saved jobs:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveJob = async (jobId: string) => {
    if (!user?.id) return

    try {
      const response = await fetch("/api/saved-jobs", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, jobId }),
      })

      if (response.ok) {
        // Remove from local state
        setSavedJobs(savedJobs.filter((job) => job.id !== jobId))
      } else {
        throw new Error("Failed to remove saved job")
      }
    } catch (error) {
      console.error("Error removing saved job:", error)
      alert(error instanceof Error ? error.message : "Failed to remove saved job")
    }
  }

  const handleSaveChange = (jobId: string, isSaved: boolean) => {
    if (!isSaved) {
      // Job was unsaved, remove from list
      setSavedJobs(savedJobs.filter((job) => job.id !== jobId))
    }
  }

  return (
    <div className="flex flex-col h-full">
      <SavedJobsHeader />

      {/* Jobs List */}
      <div className="flex-1 overflow-auto p-8">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading saved jobs...</span>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-red-500">{error}</div>
          </div>
        ) : savedJobs.length > 0 ? (
          <div className="space-y-6 max-w-4xl mx-auto">
            {savedJobs.map((job) => (
              <SavedJobCard key={job.id} job={job} onRemove={handleRemoveJob} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No saved jobs yet. Start saving jobs to see them here!</p>
            <Button
              onClick={() => router.push("/dashboard/jobs-feed")}
              className="bg-primary hover:bg-orange-600 text-primary-foreground"
            >
              Browse Jobs
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
