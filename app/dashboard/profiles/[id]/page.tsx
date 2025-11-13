"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ProfileHeader } from "@/components/profile/profile-header"
import { WorkTabs } from "@/components/profile/work-tabs"
import { ProfileSummaryCard } from "@/components/profile/profile-summary-card"
import { PortfolioSection } from "@/components/profile/portfolio-section"
import { CaseStudiesSection } from "@/components/profile/case-studies-section"
import { TopBar } from "@/components/profile/top-bar"

interface Profile {
  id: string
  name: string
  title: string
  hourlyRate: string
  jobSuccess: string
  experience?: string
  badge?: string
  overview?: string
  skills?: string[]
  tags?: string[]
}

interface Portfolio {
  id: string
  title: string
  description: string
  techStack?: string[]
  link?: string
  category?: string
}

interface CaseStudy {
  id: string
  title: string
  summary: string
  details: string
  impact?: string
  relatedProject?: string
  category?: string
}

export default function ProfileDetailPage() {
  const params = useParams()
  const router = useRouter()
  const profileId = params.id as string

  const [profile, setProfile] = useState<Profile | null>(null)
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([])
  const [activeCategory, setActiveCategory] = useState("All Work")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const categories = ["All Work", "Script & Automation", "AI Integration"]

  useEffect(() => {
    fetchProfileData()
  }, [profileId])

  useEffect(() => {
    // Filter portfolios and case studies when category changes
    // This is handled in the section components, but we can refetch if needed
  }, [activeCategory])

  const fetchProfileData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [profileRes, portfoliosRes, caseStudiesRes] = await Promise.all([
        fetch(`/api/profiles/${profileId}`),
        fetch(`/api/profiles/${profileId}/portfolios`),
        fetch(`/api/profiles/${profileId}/case-studies`),
      ])

      if (!profileRes.ok) {
        throw new Error("Failed to fetch profile")
      }

      const profileData = await profileRes.json()
      setProfile(profileData.profile)

      if (portfoliosRes.ok) {
        const portfoliosData = await portfoliosRes.json()
        // Convert API format to component format
        const convertedPortfolios: Portfolio[] = (portfoliosData.portfolios || []).map((p: any) => ({
          id: p.id,
          title: p.title,
          description: p.description,
          category: p.category,
        }))
        setPortfolios(convertedPortfolios)
      }

      if (caseStudiesRes.ok) {
        const caseStudiesData = await caseStudiesRes.json()
        // Convert API format to component format
        const convertedCaseStudies: CaseStudy[] = (caseStudiesData.caseStudies || []).map((c: any) => ({
          id: c.id,
          title: c.title,
          summary: c.description || "", // Use description as summary
          details: c.description || "", // Use description as details
          category: c.category,
        }))
        setCaseStudies(convertedCaseStudies)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile")
      console.error("Error fetching profile:", err)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading profile...</div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-500">{error || "Profile not found"}</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <TopBar />
      
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-8">
          {/* Main Card Container */}
          <div className="bg-card border border-border rounded-xl shadow-lg p-8">
            {/* Profile Header */}
            <ProfileHeader
              name={profile.name}
              title={profile.title}
              badge={profile.badge}
              jobSuccess={profile.jobSuccess}
              onAddProfile={() => router.push("/dashboard/profiles")}
            />

            {/* Work Categories Tabs */}
            <WorkTabs
              categories={categories}
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
            />

            <div className="mt-8 space-y-8">
              {/* Profile Summary Card */}
              <ProfileSummaryCard
                title={profile.title}
                description={profile.overview || "No overview provided."}
                hourlyRate={profile.hourlyRate}
                skills={profile.skills}
              />

              {/* Portfolio Section */}
              <PortfolioSection
                portfolios={portfolios}
                onPortfoliosChange={setPortfolios}
                activeCategory={activeCategory}
                profileId={profileId}
                onRefresh={fetchProfileData}
              />

              {/* Case Studies Section */}
              <CaseStudiesSection
                caseStudies={caseStudies}
                onCaseStudiesChange={setCaseStudies}
                activeCategory={activeCategory}
                profileId={profileId}
                onRefresh={fetchProfileData}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
