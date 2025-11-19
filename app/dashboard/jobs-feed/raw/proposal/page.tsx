"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { TopBar } from "@/components/profile/top-bar"
import { ProposalForm } from "@/components/proposals/proposal-form"
import { JobDetailsCard } from "@/components/jobs/job-details-card"
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
  matchScore?: number
  fitScore?: number
  bucket?: string
}

export default function RawProposalPage() {
  const router = useRouter()
  const [job, setJob] = useState<Job | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"details" | "analysis">("details")
  const [profileId, setProfileId] = useState<string>("")

  useEffect(() => {
    // Check if we're in the browser
    if (typeof window === 'undefined') {
      setIsLoading(false)
      return
    }

    // Small delay to ensure sessionStorage is available after navigation
    const timer = setTimeout(() => {
      // Get job data from sessionStorage
      const storedJobData = sessionStorage.getItem('rawJobData')
      if (storedJobData) {
        try {
          const jobData = JSON.parse(storedJobData)
          setJob(jobData as Job)
          setIsLoading(false)
          // Clear the stored data after use
          sessionStorage.removeItem('rawJobData')
        } catch (err) {
          console.error("Error parsing job data from sessionStorage:", err)
          setError("Invalid job data")
          setIsLoading(false)
        }
      } else {
        setError("No job data provided. Please go back and paste the job text first.")
        setIsLoading(false)
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading job details...</span>
        </div>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-500">{error || "Job not found"}</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <TopBar />
      
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Proposal Form */}
            <div className="order-2 lg:order-1">
              <ProposalForm jobId={job.id} job={job} onProfileChange={setProfileId} />
            </div>

            {/* Right Column - Job Details with Tabs */}
            <div className="order-1 lg:order-2">
              {/* Tabs */}
              <div className="mb-4">
                <div className="flex items-center rounded-[12px] border border-[#E7ECF2] bg-[#F7F8FA] p-0.5">
                  <button
                    onClick={() => setActiveTab("details")}
                    className={`flex-1 h-9 rounded-[10px] px-4 text-[13px] transition-all ${
                      activeTab === "details"
                        ? "bg-white text-[#0F172A] shadow-[0_1px_2px_rgba(0,0,0,0.05)] font-semibold"
                        : "bg-transparent text-[#64748B] hover:text-[#0F172A] font-normal"
                    }`}
                  >
                    Job Details
                  </button>
                  <button
                    onClick={() => setActiveTab("analysis")}
                    className={`flex-1 h-9 rounded-[10px] px-4 text-[13px] transition-all ${
                      activeTab === "analysis"
                        ? "bg-white text-[#0F172A] shadow-[0_1px_2px_rgba(0,0,0,0.05)] font-semibold"
                        : "bg-transparent text-[#64748B] hover:text-[#0F172A] font-normal"
                    }`}
                  >
                    AI Analysis
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              {activeTab === "details" ? (
                <JobDetailsCard job={job} />
              ) : (
                <div className="lg:sticky lg:top-8">
                  <JobDetailsAICard jobId={job.id} jobData={job} profileId={profileId} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

