"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Search, Filter, MoreVertical, Loader2, Edit, Trash2 } from "lucide-react"
import { AddProfileModal } from "@/components/add-profile-modal"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

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
  const router = useRouter()
  const { toast } = useToast()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null)
  const [deleteProfileId, setDeleteProfileId] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
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
      if (newProfile.id) {
        // Update existing profile
        const response = await fetch(`/api/profiles/${newProfile.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newProfile),
        })

        if (!response.ok) {
          throw new Error("Failed to update profile")
        }
      } else {
        // Create new profile
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
      }

      // Refresh profiles list
      await fetchProfiles()
      setIsModalOpen(false)
      setEditingProfile(null)
      toast({
        title: newProfile.id ? "Profile Updated" : "Profile Created",
        description: newProfile.id 
          ? "Profile has been updated successfully." 
          : "Profile has been created successfully.",
      })
    } catch (err) {
      console.error("Error saving profile:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to save profile",
        variant: "destructive",
      })
    }
  }

  const handleEditProfile = (profile: Profile) => {
    setEditingProfile(profile)
    setIsModalOpen(true)
  }

  const handleDeleteProfile = async () => {
    if (!deleteProfileId) return

    try {
      const response = await fetch(`/api/profiles/${deleteProfileId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete profile")
      }

      // Refresh profiles list
      await fetchProfiles()
      setIsDeleteDialogOpen(false)
      setDeleteProfileId(null)
      toast({
        title: "Profile Deleted",
        description: "Profile has been deleted successfully.",
      })
    } catch (err) {
      console.error("Error deleting profile:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete profile",
        variant: "destructive",
      })
    }
  }

  const openDeleteDialog = (profileId: string) => {
    setDeleteProfileId(profileId)
    setIsDeleteDialogOpen(true)
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
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading profiles...</span>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-red-500">{error}</div>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-gray-100">
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
                <tr 
                  key={profile.id} 
                  className="border-b border-border hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => router.push(`/dashboard/profiles/${profile.id}`)}
                >
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
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button 
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          onClick={(e) => {
                            e.stopPropagation()
                          }}
                        >
                          <MoreVertical className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditProfile(profile)
                          }}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            openDeleteDialog(profile.id)
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
              className="px-3 py-2 border border-border rounded-lg text-sm hover:bg-gray-100 disabled:opacity-50"
            >
              «
            </button>
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="px-3 py-2 border border-border rounded-lg text-sm hover:bg-gray-100 disabled:opacity-50"
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
                      : "border border-border hover:bg-gray-100"
                  }`}
                >
                  {pageNum}
                </button>
              )
            })}
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="px-3 py-2 border border-border rounded-lg text-sm hover:bg-gray-100 disabled:opacity-50"
            >
              &gt;
            </button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(totalPages)}
              className="px-3 py-2 border border-border rounded-lg text-sm hover:bg-gray-100 disabled:opacity-50"
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

      {/* Add/Edit Profile Modal */}
      <AddProfileModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false)
          setEditingProfile(null)
        }} 
        onAdd={handleAddProfile}
        profile={editingProfile}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Profile</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this profile? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteProfileId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProfile}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
