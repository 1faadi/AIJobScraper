"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
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

interface Profile {
  id: string
  name: string
  title?: string
}

export default function JobsFeedPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("mostRecent")
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [selectedProfile, setSelectedProfile] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300) // 300ms delay

    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    fetchJobs(activeTab, debouncedSearchQuery)
    fetchProfiles()
  }, [activeTab, debouncedSearchQuery])

  const fetchProfiles = async () => {
    try {
      const response = await fetch("/api/profiles")
      if (response.ok) {
        const data = await response.json()
        setProfiles(data.profiles || [])
        if (data.profiles && data.profiles.length > 0) {
          setSelectedProfile(data.profiles[0].id)
        }
      }
    } catch (error) {
      console.error("Error fetching profiles:", error)
    }
  }

  const fetchJobs = async (tab: string, search: string = "") => {
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        tab,
        page: "1",
      })
      if (search.trim()) {
        params.append("search", search.trim())
      }
      const response = await fetch(`/api/jobs?${params.toString()}`)
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
        
        {/* Select Profile Dropdown */}
        <div className="mt-4 flex flex-col">
          <label className="mb-1 text-[12px] font-medium text-[var(--muted)]">Select Profile</label>
          <div className="relative inline-block">
            <select
              value={selectedProfile}
              onChange={(e) => setSelectedProfile(e.target.value)}
              className="h-[38px] w-[426px] rounded-[var(--radius-md)] border border-[var(--line)] bg-[var(--field)] px-3 pr-9 text-[13px] text-[var(--ink)] cursor-pointer appearance-none outline-none focus:ring-2 focus:ring-[#eaf3ff]"
            >
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name} {profile.title ? `- ${profile.title}` : ""}
                </option>
              ))}
            </select>
            <svg
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted)]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>
        </div>

        {/* Tabs Strip */}
        <TabsStrip 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
          hideProfileSelector={true} 
          hideSearch={false}
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>
      <div className="flex-1 overflow-auto">
        <div className="mx-auto w-full  px-6 pb-8">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex items-center gap-2 text-[var(--muted)]">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading jobs...</span>
              </div>
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
