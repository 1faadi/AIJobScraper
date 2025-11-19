"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
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

export default function ProposalPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const jobId = params.jobId as string

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

    // First, check sessionStorage for raw job data (from raw proposal page)
    const storedJobData = sessionStorage.getItem('rawJobData')
    if (storedJobData) {
      try {
        const jobData = JSON.parse(storedJobData)
        setJob(jobData as Job)
        setIsLoading(false)
        // Clear the stored data after use
        sessionStorage.removeItem('rawJobData')
        return
      } catch (err) {
        console.error("Error parsing job data from sessionStorage:", err)
      }
    }

    // Check if job data is passed via query params (for raw jobs)
    const jobParam = searchParams.get("job")
    if (jobParam) {
      try {
        const jobData = JSON.parse(decodeURIComponent(jobParam))
        setJob(jobData as Job)
        setIsLoading(false)
        return
      } catch (err) {
        console.error("Error parsing job data from query params:", err)
      }
    }
    
    // Otherwise, fetch from API
    fetchJob()
  }, [jobId, searchParams])

  const fetchJob = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/jobs`)
      if (!response.ok) {
        throw new Error("Failed to fetch job")
      }
      const data = await response.json()
      const foundJob = data.jobs.find((j: Job) => j.id === jobId)
      
      if (foundJob) {
        setJob(foundJob)
      } else {
        // Fallback to mock data if job not found
        setJob({
          id: jobId,
          title: "Full Stack Web Application and AI & Chat Integration with WhatsApp marketing",
          postedTime: "49 minutes ago",
          pricing: "Fixed",
          budget: "$5,000 - $10,000",
          level: "Expert",
          description: "We're looking for a highly experienced Full-Stack Developer (7+ years) to build a modern, scalable web application that seamlessly integrates AI / machine learning capabilities for automation, intelligent user interaction, and data insights. The ideal candidate will design and deliver a production-grade system, from architecture to deployment, ensuring clean code, security, and performance.",
          skills: ["React", "Next.js", "Node.js", "Python", "AI/ML", "WhatsApp API"],
          paymentVerified: true,
          rating: 4.8,
          hireRate: 75,
          openJobs: 12,
          totalSpend: 150,
          totalHires: 45,
          avgRate: 65,
          matchScore: 92,
          fitScore: 100,
        })
      }
    } catch (err) {
      console.error("Error fetching job:", err)
      // Use mock data as fallback
      setJob({
        id: jobId,
        title: "Full Stack Web Application and AI & Chat Integration with WhatsApp marketing",
        postedTime: "49 minutes ago",
        pricing: "Fixed",
        budget: "$5,000 - $10,000",
        level: "Expert",
        description: "We're looking for a highly experienced Full-Stack Developer (7+ years) to build a modern, scalable web application that seamlessly integrates AI / machine learning capabilities for automation, intelligent user interaction, and data insights. The ideal candidate will design and deliver a production-grade system, from architecture to deployment, ensuring clean code, security, and performance.",
        skills: ["React", "Next.js", "Node.js", "Python", "AI/ML", "WhatsApp API"],
        paymentVerified: true,
        rating: 4.8,
        hireRate: 75,
        openJobs: 12,
        totalSpend: 150,
        totalHires: 45,
        avgRate: 65,
        matchScore: 92,
        fitScore: 100,
      })
    } finally {
      setIsLoading(false)
    }
  }

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
              <ProposalForm jobId={jobId} job={job || undefined} onProfileChange={setProfileId} />
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
                  <JobDetailsAICard jobId={jobId} jobData={job} profileId={profileId} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

