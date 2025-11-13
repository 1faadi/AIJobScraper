"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus, MoreVertical } from "lucide-react"
import { mockTemplates } from "@/lib/mock-data"

export default function TemplatesPage() {
  const [templates, setTemplates] = useState(mockTemplates)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-card border-b border-border p-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">Templates</h1>
          <Button className="bg-primary hover:bg-orange-600 text-primary-foreground flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Template
          </Button>
        </div>
      </div>

      {/* Template Grid */}
      <div className="flex-1 overflow-auto p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow group"
            >
              {/* Header with Menu */}
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-semibold">
                  {template.icon}
                </div>
                <button className="p-2 opacity-0 group-hover:opacity-100 hover:bg-muted rounded-lg transition-all">
                  <MoreVertical className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Title */}
              <h3 className="font-semibold text-foreground mb-2 line-clamp-2">{template.title}</h3>

              {/* Description */}
              <p className="text-sm text-muted-foreground line-clamp-2">{template.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
