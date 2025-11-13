"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { ItemCard } from "./item-card"
import { PortfolioModal } from "./portfolio-modal"
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

interface Portfolio {
  id: string
  title: string
  description: string
  techStack?: string[]
  link?: string
  category?: string
}

interface PortfolioSectionProps {
  portfolios: Portfolio[]
  onPortfoliosChange: (portfolios: Portfolio[]) => void
  activeCategory: string
  profileId: string
  onRefresh?: () => void
}

export function PortfolioSection({ portfolios, onPortfoliosChange, activeCategory, profileId, onRefresh }: PortfolioSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPortfolio, setEditingPortfolio] = useState<Portfolio | null>(null)
  const [deletingPortfolio, setDeletingPortfolio] = useState<Portfolio | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 3

  const filteredPortfolios = activeCategory === "All Work"
    ? portfolios
    : portfolios.filter((p) => p.category === activeCategory)

  const totalPages = Math.ceil(filteredPortfolios.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedPortfolios = filteredPortfolios.slice(startIndex, startIndex + itemsPerPage)

  const handleAdd = () => {
    setEditingPortfolio(null)
    setIsModalOpen(true)
  }

  const handleEdit = (portfolio: Portfolio) => {
    setEditingPortfolio(portfolio)
    setIsModalOpen(true)
  }

  const handleSave = async (portfolioData: Omit<Portfolio, "id">) => {
    try {
      if (editingPortfolio) {
        // Update existing
        const response = await fetch(`/api/profiles/${profileId}/portfolios/${editingPortfolio.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: portfolioData.title,
            description: portfolioData.description,
            category: portfolioData.category,
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to update portfolio")
        }

        const data = await response.json()
        const updated = portfolios.map((p) =>
          p.id === editingPortfolio.id ? { ...p, ...data.portfolio } : p
        )
        onPortfoliosChange(updated)
      } else {
        // Add new
        const response = await fetch(`/api/profiles/${profileId}/portfolios`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: portfolioData.title,
            description: portfolioData.description,
            category: portfolioData.category,
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to create portfolio")
        }

        const data = await response.json()
        onPortfoliosChange([...portfolios, { ...portfolioData, id: data.portfolio.id }])
      }
      setIsModalOpen(false)
      setEditingPortfolio(null)
      if (onRefresh) onRefresh()
    } catch (error) {
      console.error("Error saving portfolio:", error)
      alert(error instanceof Error ? error.message : "Failed to save portfolio")
    }
  }

  const handleDelete = async () => {
    if (!deletingPortfolio) return

    try {
      const response = await fetch(`/api/profiles/${profileId}/portfolios/${deletingPortfolio.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete portfolio")
      }

      onPortfoliosChange(portfolios.filter((p) => p.id !== deletingPortfolio.id))
      setDeletingPortfolio(null)
      if (onRefresh) onRefresh()
    } catch (error) {
      console.error("Error deleting portfolio:", error)
      alert(error instanceof Error ? error.message : "Failed to delete portfolio")
    }
  }

  return (
    <>
      <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">Portfolio</h2>
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

        {paginatedPortfolios.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No portfolio items found. Click "Add" to create one.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedPortfolios.map((portfolio) => (
                <ItemCard
                  key={portfolio.id}
                  id={portfolio.id}
                  title={portfolio.title}
                  description={portfolio.description}
                  onEdit={() => handleEdit(portfolio)}
                  onDelete={() => setDeletingPortfolio(portfolio)}
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

      <PortfolioModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingPortfolio(null)
        }}
        onSave={handleSave}
        portfolio={editingPortfolio}
      />

      <AlertDialog open={!!deletingPortfolio} onOpenChange={() => setDeletingPortfolio(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Portfolio Item?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingPortfolio?.title}"? This action cannot be undone.
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

