"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

interface Template {
  id: string
  name: string
  content: string
  createdAt?: string
  updatedAt?: string
}

interface AddTemplateModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (template: Omit<Template, "id" | "createdAt" | "updatedAt">) => void
  template?: Template | null
}

export function AddTemplateModal({ isOpen, onClose, onSave, template }: AddTemplateModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    content: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const defaultCoverLetter = `{Create an Upwork cover letter proposal for this job, matching the tone of the job description. Do not include a salutation or signature line. Make sure to include any previous jobs and/or skills that may align with their needs. Provide any insights that may help them while also demonstrating my expertise. Keep the tone of my proposal casual and without sounding like AI-generated content.}`

  const defaultProfileInfo = `{Write out my name, profession, and a link to my Upwork Profile (if available). For example: Daniel Reiling Mobile App Developer https://www.upwork.com/freelancers/reiling Instruction: Use Mathematical Italic Bold for the name and profession only. }`

  useEffect(() => {
    if (template) {
      const parts = template.content.split("\n\n")
      setFormData({
        name: template.name,
        content: template.content,
      })
    } else {
      setFormData({
        name: "",
        content: `${defaultCoverLetter}\n\n${defaultProfileInfo}`,
      })
    }
    setErrors({})
  }, [template, isOpen])

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Template name is required"
    }

    if (!formData.content.trim()) {
      newErrors.content = "Template content is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) {
      return
    }

    onSave({
      name: formData.name.trim(),
      content: formData.content.trim(),
    })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template ? "Edit Template" : "Add Template"}</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Fill all the details to get the better AI response.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Template Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Template Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Template Name"
              className={`w-full px-4 py-2 bg-background border rounded-lg text-foreground focus:ring-2 focus:ring-primary outline-none ${
                errors.name ? "border-red-500" : "border-border"
              }`}
            />
            {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
          </div>

          {/* Cover Letter Prompt */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Cover Letter Prompt <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.content.split("\n\n")[0] || ""}
              onChange={(e) => {
                const parts = formData.content.split("\n\n")
                parts[0] = e.target.value
                const newContent = parts.length > 1 
                  ? parts.join("\n\n") 
                  : e.target.value + "\n\n" + (parts[1] || defaultProfileInfo)
                setFormData({ ...formData, content: newContent })
              }}
              placeholder="Enter your cover letter prompt..."
              rows={8}
              className={`w-full px-4 py-3 bg-background border rounded-lg text-foreground focus:ring-2 focus:ring-primary outline-none resize-none font-mono text-sm ${
                errors.content ? "border-red-500" : "border-border"
              }`}
            />
          </div>

          {/* Profile Information Prompt */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Profile Information Prompt <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.content.split("\n\n")[1] || ""}
              onChange={(e) => {
                const parts = formData.content.split("\n\n")
                parts[1] = e.target.value
                const newContent = parts[0] 
                  ? parts.join("\n\n") 
                  : (parts[0] || defaultCoverLetter) + "\n\n" + e.target.value
                setFormData({ ...formData, content: newContent })
              }}
              placeholder="Enter your profile information prompt..."
              rows={6}
              className={`w-full px-4 py-3 bg-background border rounded-lg text-foreground focus:ring-2 focus:ring-primary outline-none resize-none font-mono text-sm ${
                errors.content ? "border-red-500" : "border-border"
              }`}
            />
            <div className="flex justify-end mt-2">
              <span className="text-xs text-muted-foreground">
                {formData.content.length}/2000
              </span>
            </div>
            {errors.content && <p className="mt-1 text-sm text-red-500">{errors.content}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} className="border-border">
              Close
            </Button>
            <Button type="submit" className="bg-primary hover:bg-orange-600 text-primary-foreground">
              {template ? "Update" : "Add"} Template
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

