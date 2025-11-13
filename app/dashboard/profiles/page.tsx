"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Filter, MoreVertical } from "lucide-react"
import { AddProfileModal } from "@/components/add-profile-modal"

interface Profile {
  id: string
  name: string
  title: string
  hourlyRate: string
  jobSuccess: string
  experience: string
  badge?: string
  overview?: string
  skills?: string[]
  tags?: string[]
}

export default function ProfilesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchProfiles()
  }, [searchTerm])

  const fetchProfiles = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const searchParam = searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : ""
      const response = await fetch(`/api/profiles${searchParam}`)
      if (!response.ok) {
        throw new Error("Failed to fetch profiles")
      }
      const data = await response.json()
      setProfiles(data.profiles)
      setCurrentPage(1) // Reset to first page when search changes
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profiles")
      console.error("Error fetching profiles:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const itemsPerPage = 8
  const totalPages = Math.ceil(profiles.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedProfiles = profiles.slice(startIndex, startIndex + itemsPerPage)

  const handleAddProfile = async (newProfile: any) => {
    try {
      const response = await fetch("/api/profiles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newProfile),
      })

      if (!response.ok) {
        throw new Error("Failed to create profile")
      }

      const data = await response.json()
      // Refresh profiles list
      await fetchProfiles()
      setIsModalOpen(false)
    } catch (err) {
      console.error("Error creating profile:", err)
      alert(err instanceof Error ? err.message : "Failed to create profile")
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-card border-b border-border p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-foreground">All Profiles</h1>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-primary hover:bg-orange-600 text-primary-foreground"
          >
            Add Profile
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search profiles..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              className="pl-10 bg-background border-border"
            />
          </div>
          <button className="px-4 py-2 border border-border rounded-lg text-muted-foreground hover:text-foreground flex items-center gap-2">
            <Filter className="w-4 h-4" />
            <span className="text-sm">Filter</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto p-8">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading profiles...</div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-red-500">{error}</div>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Profile Title</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Hourly Rate</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Experience</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Job Success</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProfiles.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                      No profiles found
                    </td>
                  </tr>
                ) : (
                  paginatedProfiles.map((profile) => (
                <tr key={profile.id} className="border-b border-border hover:bg-muted transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                        {profile.name.charAt(0)}
                      </div>
                      <span className="text-sm font-medium text-foreground">{profile.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground">{profile.title}</td>
                  <td className="px-6 py-4 text-sm text-foreground">{profile.hourlyRate}</td>
                  <td className="px-6 py-4 text-sm text-foreground">{profile.experience}</td>
                  <td className="px-6 py-4 text-sm text-foreground">{profile.jobSuccess}</td>
                  <td className="px-6 py-4">
                    <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                      <MoreVertical className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
              className="px-3 py-2 border border-border rounded-lg text-sm hover:bg-muted disabled:opacity-50"
            >
              «
            </button>
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="px-3 py-2 border border-border rounded-lg text-sm hover:bg-muted disabled:opacity-50"
            >
              &lt;
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = i + 1
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-2 rounded-lg text-sm ${
                    currentPage === pageNum
                      ? "bg-primary text-primary-foreground"
                      : "border border-border hover:bg-muted"
                  }`}
                >
                  {pageNum}
                </button>
              )
            })}
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="px-3 py-2 border border-border rounded-lg text-sm hover:bg-muted disabled:opacity-50"
            >
              &gt;
            </button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(totalPages)}
              className="px-3 py-2 border border-border rounded-lg text-sm hover:bg-muted disabled:opacity-50"
            >
              »
            </button>
          </div>
          <select
            defaultValue="8"
            className="px-3 py-2 border border-border rounded-lg text-sm bg-card text-foreground"
          >
            <option value="8">8 / page</option>
            <option value="16">16 / page</option>
            <option value="32">32 / page</option>
          </select>
        </div>
      </div>

      {/* Add Profile Modal */}
      <AddProfileModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAdd={handleAddProfile} />
    </div>
  )
}
