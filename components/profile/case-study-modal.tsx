"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

interface CaseStudy {
  id: string
  title: string
  summary: string
  details: string
  impact?: string
  relatedProject?: string
  category?: string
}

interface CaseStudyModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (caseStudy: Omit<CaseStudy, "id">) => void
  caseStudy?: CaseStudy | null
}

export function CaseStudyModal({ isOpen, onClose, onSave, caseStudy }: CaseStudyModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    summary: "",
    details: "",
    impact: "",
    relatedProject: "",
    category: "",
  })

  useEffect(() => {
    if (caseStudy) {
      setFormData({
        title: caseStudy.title,
        summary: caseStudy.summary,
        details: caseStudy.details,
        impact: caseStudy.impact || "",
        relatedProject: caseStudy.relatedProject || "",
        category: caseStudy.category || "",
      })
    } else {
      setFormData({
        title: "",
        summary: "",
        details: "",
        impact: "",
        relatedProject: "",
        category: "",
      })
    }
  }, [caseStudy, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.summary || !formData.details) {
      return
    }

    onSave({
      title: formData.title,
      summary: formData.summary,
      details: formData.details,
      impact: formData.impact || undefined,
      relatedProject: formData.relatedProject || undefined,
      category: formData.category || undefined,
    })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{caseStudy ? "Edit Case Study" : "Add Case Study"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., AI Integration Engineer | AI Automation Workflows, Python..."
              required
              className="bg-background border-border"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Short Summary <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              placeholder="Brief summary of the case study..."
              required
              rows={3}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-primary outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Detailed Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.details}
              onChange={(e) => setFormData({ ...formData, details: e.target.value })}
              placeholder="Detailed description of the project, challenges, solutions, and outcomes..."
              required
              rows={6}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-primary outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Impact/Results (Optional)</label>
            <textarea
              value={formData.impact}
              onChange={(e) => setFormData({ ...formData, impact: e.target.value })}
              placeholder="Describe the impact, results, or metrics achieved..."
              rows={3}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-primary outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Related Project (Optional)</label>
            <Input
              value={formData.relatedProject}
              onChange={(e) => setFormData({ ...formData, relatedProject: e.target.value })}
              placeholder="Link to related project or portfolio item"
              className="bg-background border-border"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-primary outline-none"
            >
              <option value="">All Work</option>
              <option value="Script & Automation">Script & Automation</option>
              <option value="AI Integration">AI Integration</option>
            </select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-primary hover:bg-orange-600 text-primary-foreground">
              {caseStudy ? "Update" : "Add"} Case Study
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

