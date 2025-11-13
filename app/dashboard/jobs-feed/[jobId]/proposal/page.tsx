"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { TopBar } from "@/components/profile/top-bar"
import { ProposalForm } from "@/components/proposals/proposal-form"
import { JobDetailsCard } from "@/components/jobs/job-details-card"

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

export default function ProposalPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params.jobId as string

  const [job, setJob] = useState<Job | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchJob()
  }, [jobId])

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
        <div className="text-muted-foreground">Loading job details...</div>
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
              <ProposalForm jobId={jobId} />
            </div>

            {/* Right Column - Job Details */}
            <div className="order-1 lg:order-2">
              <JobDetailsCard job={job} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

