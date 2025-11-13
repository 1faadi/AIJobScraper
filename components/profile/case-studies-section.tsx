"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { ItemCard } from "./item-card"
import { CaseStudyModal } from "./case-study-modal"
import { Pagination } from "./pagination"
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

interface CaseStudy {
  id: string
  title: string
  summary: string
  details: string
  impact?: string
  relatedProject?: string
  category?: string
}

interface CaseStudiesSectionProps {
  caseStudies: CaseStudy[]
  onCaseStudiesChange: (caseStudies: CaseStudy[]) => void
  activeCategory: string
  profileId: string
  onRefresh?: () => void
}

export function CaseStudiesSection({
  caseStudies,
  onCaseStudiesChange,
  activeCategory,
  profileId,
  onRefresh,
}: CaseStudiesSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCaseStudy, setEditingCaseStudy] = useState<CaseStudy | null>(null)
  const [deletingCaseStudy, setDeletingCaseStudy] = useState<CaseStudy | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 3

  const filteredCaseStudies = activeCategory === "All Work"
    ? caseStudies
    : caseStudies.filter((c) => c.category === activeCategory)

  const totalPages = Math.ceil(filteredCaseStudies.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedCaseStudies = filteredCaseStudies.slice(startIndex, startIndex + itemsPerPage)

  const handleAdd = () => {
    setEditingCaseStudy(null)
    setIsModalOpen(true)
  }

  const handleEdit = (caseStudy: CaseStudy) => {
    setEditingCaseStudy(caseStudy)
    setIsModalOpen(true)
  }

  const handleSave = async (caseStudyData: Omit<CaseStudy, "id">) => {
    try {
      if (editingCaseStudy) {
        // Update existing
        const response = await fetch(`/api/profiles/${profileId}/case-studies/${editingCaseStudy.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: caseStudyData.title,
            description: caseStudyData.summary || caseStudyData.details,
            category: caseStudyData.category,
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to update case study")
        }

        const data = await response.json()
        const updated = caseStudies.map((c) =>
          c.id === editingCaseStudy.id ? { ...c, ...caseStudyData, summary: data.caseStudy.description, details: data.caseStudy.description } : c
        )
        onCaseStudiesChange(updated)
      } else {
        // Add new
        const response = await fetch(`/api/profiles/${profileId}/case-studies`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: caseStudyData.title,
            description: caseStudyData.summary || caseStudyData.details,
            category: caseStudyData.category,
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to create case study")
        }

        const data = await response.json()
        onCaseStudiesChange([...caseStudies, { ...caseStudyData, id: data.caseStudy.id }])
      }
      setIsModalOpen(false)
      setEditingCaseStudy(null)
      if (onRefresh) onRefresh()
    } catch (error) {
      console.error("Error saving case study:", error)
      alert(error instanceof Error ? error.message : "Failed to save case study")
    }
  }

  const handleDelete = async () => {
    if (!deletingCaseStudy) return

    try {
      const response = await fetch(`/api/profiles/${profileId}/case-studies/${deletingCaseStudy.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete case study")
      }

      onCaseStudiesChange(caseStudies.filter((c) => c.id !== deletingCaseStudy.id))
      setDeletingCaseStudy(null)
      if (onRefresh) onRefresh()
    } catch (error) {
      console.error("Error deleting case study:", error)
      alert(error instanceof Error ? error.message : "Failed to delete case study")
    }
  }

  return (
    <>
      <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">Case Studies</h2>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAdd}
              className="border-border"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
            <Button variant="outline" size="sm" className="border-border">
              View All
            </Button>
          </div>
        </div>

        {paginatedCaseStudies.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No case studies found. Click "Add" to create one.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedCaseStudies.map((caseStudy) => (
                <ItemCard
                  key={caseStudy.id}
                  id={caseStudy.id}
                  title={caseStudy.title}
                  description={caseStudy.summary || caseStudy.details}
                  onEdit={() => handleEdit(caseStudy)}
                  onDelete={() => setDeletingCaseStudy(caseStudy)}
                />
              ))}
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>

      <CaseStudyModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingCaseStudy(null)
        }}
        onSave={handleSave}
        caseStudy={editingCaseStudy}
      />

      <AlertDialog open={!!deletingCaseStudy} onOpenChange={() => setDeletingCaseStudy(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Case Study?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingCaseStudy?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

