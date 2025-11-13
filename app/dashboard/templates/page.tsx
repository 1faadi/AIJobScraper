"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { TemplatesHeader } from "@/components/templates-header"
import { TemplateCard } from "@/components/templates/template-card"
import { AddTemplateModal } from "@/components/templates/add-template-modal"
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

interface Template {
  id: string
  name: string
  content: string
  createdAt?: string
  updatedAt?: string
}

export default function TemplatesPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<Template[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [deletingTemplate, setDeletingTemplate] = useState<Template | null>(null)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/templates")
      if (!response.ok) {
        throw new Error("Failed to fetch templates")
      }
      const data = await response.json()
      
      // Convert API format to Template format
      const convertedTemplates: Template[] = (data.templates || []).map((t: any) => ({
        id: t.id,
        name: t.name || t.title || "Untitled Template",
        content: t.content || t.description || "",
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      }))
      
      setTemplates(convertedTemplates)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load templates")
      console.error("Error fetching templates:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingTemplate(null)
    setIsModalOpen(true)
  }

  const handleEdit = (template: Template) => {
    setEditingTemplate(template)
    setIsModalOpen(true)
  }

  const handleSave = async (templateData: Omit<Template, "id" | "createdAt" | "updatedAt">) => {
    try {
      if (editingTemplate) {
        // Update existing template
        const response = await fetch(`/api/templates/${editingTemplate.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: templateData.name,
            content: templateData.content,
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to update template")
        }

        const data = await response.json()
        const updated = templates.map((t) =>
          t.id === editingTemplate.id ? { ...t, ...data.template } : t
        )
        setTemplates(updated)
      } else {
        // Add new template
        const response = await fetch("/api/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: templateData.name,
            content: templateData.content,
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to create template")
        }

        const data = await response.json()
        setTemplates([...templates, { ...templateData, id: data.template.id }])
      }
      setIsModalOpen(false)
      setEditingTemplate(null)
      // Refresh templates list
      await fetchTemplates()
    } catch (error) {
      console.error("Error saving template:", error)
      alert(error instanceof Error ? error.message : "Failed to save template")
    }
  }

  const handleDelete = async () => {
    if (!deletingTemplate) return

    try {
      const response = await fetch(`/api/templates/${deletingTemplate.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete template")
      }

      setTemplates(templates.filter((t) => t.id !== deletingTemplate.id))
      setDeletingTemplate(null)
      // Refresh templates list
      await fetchTemplates()
    } catch (error) {
      console.error("Error deleting template:", error)
      alert(error instanceof Error ? error.message : "Failed to delete template")
    }
  }

  return (
    <div className="flex flex-col h-full">
      <TemplatesHeader />

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8">
        {/* Title Row */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-foreground">Templates</h1>
          <Button
            onClick={handleAdd}
            variant="outline"
            className="border-border flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Template
          </Button>
        </div>

        {/* Templates Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading templates...</div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-red-500">{error}</div>
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No templates yet. Create your first template!</p>
            <Button
              onClick={handleAdd}
              className="bg-primary hover:bg-orange-600 text-primary-foreground"
            >
              Add Template
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {templates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onEdit={() => handleEdit(template)}
                onDelete={() => setDeletingTemplate(template)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Template Modal */}
      <AddTemplateModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingTemplate(null)
        }}
        onSave={handleSave}
        template={editingTemplate}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingTemplate} onOpenChange={() => setDeletingTemplate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingTemplate?.name}"? This action cannot be undone.
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
    </div>
  )
}
