"use client"

import type React from "react"

import { useState } from "react"
import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X } from "lucide-react"

// Tag Input Component
function TagInput({ tags, onTagsChange, placeholder }: { tags: string[]; onTagsChange: (tags: string[]) => void; placeholder: string }) {
  const [inputValue, setInputValue] = useState("")

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault()
      if (!tags.includes(inputValue.trim())) {
        onTagsChange([...tags, inputValue.trim()])
      }
      setInputValue("")
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      onTagsChange(tags.slice(0, -1))
    }
  }

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter((tag) => tag !== tagToRemove))
  }

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap gap-2 p-2 min-h-[38px] bg-background border border-border rounded-lg focus-within:ring-2 focus-within:ring-primary">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-sm"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="hover:bg-primary/20 rounded-full p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-sm"
        />
      </div>
      <p className="text-xs text-muted-foreground">Press Enter to add</p>
    </div>
  )
}

interface AddProfileModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (profile: any) => void
  profile?: Profile | null // Optional profile for edit mode
}

interface Profile {
  id?: string
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

export function AddProfileModal({ isOpen, onClose, onAdd, profile }: AddProfileModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    jobSuccessRate: "100%",
    hourlyRate: "$65/hr",
    badge: "",
    title: "",
    overview: "",
    skills: [] as string[],
    tags: [] as string[],
  })

  // Update form data when profile prop changes (for edit mode)
  React.useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        jobSuccessRate: profile.jobSuccess || "100%",
        hourlyRate: profile.hourlyRate || "$65/hr",
        badge: profile.badge || "",
        title: profile.title || "",
        overview: profile.overview || "",
        skills: profile.skills || [],
        tags: profile.tags || [],
      })
    } else {
      // Reset form when not in edit mode
      setFormData({
        name: "",
        jobSuccessRate: "100%",
        hourlyRate: "$65/hr",
        badge: "",
        title: "",
        overview: "",
        skills: [],
        tags: [],
      })
    }
  }, [profile, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const profileData = profile 
      ? { ...formData, id: profile.id }
      : formData
    onAdd(profileData)
    if (!profile) {
      // Only reset if not in edit mode
    setFormData({
      name: "",
      jobSuccessRate: "100%",
      hourlyRate: "$65/hr",
      badge: "",
      title: "",
      overview: "",
      skills: [],
      tags: [],
    })
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-lg max-w-md w-full max-h-[90vh] flex flex-col my-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{profile ? "Edit Profile" : "Add Profile"}</h2>
            <p className="text-sm text-muted-foreground mt-1">Fill all the details to get the better AI response</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          {/* Scrollable Content */}
          <div className="p-4 space-y-3 overflow-y-auto flex-1">
          {/* Profile Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Profile Name</label>
            <Input
              placeholder="Profile Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="bg-background border-border"
            />
          </div>

          {/* Job Success Rate */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Job Success Rate</label>
            <Input
              placeholder="100%"
              value={formData.jobSuccessRate}
              onChange={(e) => setFormData({ ...formData, jobSuccessRate: e.target.value })}
              className="bg-background border-border"
            />
          </div>

          {/* Hourly Rate */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Hourly Rate</label>
            <Input
              placeholder="$320/hr"
              value={formData.hourlyRate}
              onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
              className="bg-background border-border"
            />
          </div>

          {/* Badge */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Badge</label>
            <select
              value={formData.badge}
              onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-primary outline-none"
            >
              <option value="">Choose Badge</option>
              <option value="top-rated">Top Rated</option>
              <option value="rising-talent">Rising Talent</option>
              <option value="expert">Expert</option>
            </select>
          </div>

          {/* Profile Title */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Profile Title</label>
            <Input
              placeholder="Profile Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="bg-background border-border"
            />
          </div>

          {/* Profile Overview */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Profile Overview</label>
            <div className="relative">
              <textarea
                placeholder="The message you wish to send to the recipient..."
                value={formData.overview}
                onChange={(e) => setFormData({ ...formData, overview: e.target.value })}
                maxLength={320}
                  rows={3}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-primary outline-none resize-none"
              />
              <span className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                {formData.overview.length}/320
              </span>
            </div>
          </div>

          {/* Skills */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Skills</label>
            <TagInput
              tags={formData.skills}
              onTagsChange={(skills) => setFormData({ ...formData, skills })}
              placeholder="Type skill and press Enter (e.g., React, Node.js)"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Tags</label>
            <TagInput
              tags={formData.tags}
              onTagsChange={(tags) => setFormData({ ...formData, tags })}
              placeholder="Type tag and press Enter (e.g., frontend, remote)"
            />
            </div>
          </div>

          {/* Actions - Fixed at bottom */}
          <div className="flex gap-3 p-4 border-t border-border flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-gray-100 transition-colors"
            >
              Close
            </button>
            <Button type="submit" className="flex-1 bg-primary hover:bg-orange-600 text-primary-foreground">
              {profile ? "Update" : "Add"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
