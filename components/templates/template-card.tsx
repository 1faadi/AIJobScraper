"use client"

import { MoreVertical } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Template {
  id: string
  name: string
  content: string
  createdAt?: string
  updatedAt?: string
}

interface TemplateCardProps {
  template: Template
  onEdit: () => void
  onDelete: () => void
}

export function TemplateCard({ template, onEdit, onDelete }: TemplateCardProps) {
  // Extract description from content (first paragraph or first 150 chars)
  const getDescription = () => {
    // Use first part of content as description
    const parts = template.content.split("\n\n")
    const firstPart = parts[0] || template.content
    if (firstPart.length > 150) {
      return firstPart.substring(0, 150) + "....."
    }
    return firstPart
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow group relative">
      {/* Title */}
      <h3 className="font-semibold text-foreground mb-3 line-clamp-2 pr-8">
        {template.name}
      </h3>

      {/* Description */}
      <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
        {getDescription()}
      </p>

      {/* Kebab Menu */}
      <div className="absolute top-4 right-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-2 opacity-0 group-hover:opacity-100 hover:bg-muted rounded-lg transition-all">
              <MoreVertical className="w-4 h-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-red-600">
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

