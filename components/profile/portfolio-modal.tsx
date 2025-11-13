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
import { TagInput } from "@/components/ui/tag-input"

interface Portfolio {
  id: string
  title: string
  description: string
  techStack?: string[]
  link?: string
  category?: string
}

interface PortfolioModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (portfolio: Omit<Portfolio, "id">) => void
  portfolio?: Portfolio | null
}

export function PortfolioModal({ isOpen, onClose, onSave, portfolio }: PortfolioModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    techStack: [] as string[],
    link: "",
    category: "",
  })

  useEffect(() => {
    if (portfolio) {
      setFormData({
        title: portfolio.title,
        description: portfolio.description,
        techStack: portfolio.techStack || [],
        link: portfolio.link || "",
        category: portfolio.category || "",
      })
    } else {
      setFormData({
        title: "",
        description: "",
        techStack: [],
        link: "",
        category: "",
      })
    }
  }, [portfolio, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.description) {
      return
    }

    onSave({
      title: formData.title,
      description: formData.description,
      techStack: formData.techStack,
      link: formData.link || undefined,
      category: formData.category || undefined,
    })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{portfolio ? "Edit Portfolio" : "Add Portfolio Item"}</DialogTitle>
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
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the project, technologies used, and key achievements..."
              required
              rows={5}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-primary outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Tech Stack</label>
            <TagInput
              tags={formData.techStack}
              onTagsChange={(techStack) => setFormData({ ...formData, techStack })}
              placeholder="Type technology and press Enter (e.g., React, Node.js)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Project Link (Optional)</label>
            <Input
              type="url"
              value={formData.link}
              onChange={(e) => setFormData({ ...formData, link: e.target.value })}
              placeholder="https://example.com"
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
              {portfolio ? "Update" : "Add"} Portfolio
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

