"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { JobCard } from "@/components/job-card"
import { mockJobs } from "@/lib/mock-data"

export default function SavedJobsPage() {
  const [savedJobs, setSavedJobs] = useState(mockJobs.slice(0, 2))

  const handleRemoveJob = (jobId: string) => {
    setSavedJobs(savedJobs.filter((job) => job.id !== jobId))
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-card border-b border-border p-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">Saved Jobs</h1>
          <Button className="bg-primary hover:bg-orange-600 text-primary-foreground flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Template
          </Button>
        </div>
      </div>

      {/* Jobs List */}
      <div className="flex-1 overflow-auto p-8">
        <div className="space-y-4 max-w-4xl">
          {savedJobs.length > 0 ? (
            savedJobs.map((job) => (
              <div key={job.id} className="relative">
                <JobCard job={job} />
                {/* Remove Button */}
                <button
                  onClick={() => handleRemoveJob(job.id)}
                  className="absolute top-6 right-6 text-primary hover:text-orange-600 text-sm font-medium transition-colors"
                >
                  Remove
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No saved jobs yet. Start saving jobs to see them here!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
