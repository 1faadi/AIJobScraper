"use client"

import React from "react"

interface Job {
  id: string
  title: string
  postedTime: string
  pricing: string
  budget: string
  level: string
  description: string
  skills: string[]
  paymentVerified: boolean
  rating: number
  hireRate: number
  openJobs: number
  totalSpend: number
  totalHires: number
  avgRate: number
  matchScore?: number
  fitScore?: number
  bucket?: string
}

interface JobDetailsCardProps {
  job: Job
}

export function JobDetailsCard({ job }: JobDetailsCardProps) {
  // Parse the job description to extract structured information
  const description = job.description || ""
  
  // Format the description with proper line breaks
  const formatDescription = (text: string) => {
    const lines = text.split('\n')
    const elements: React.ReactNode[] = []
    let listItems: string[] = []
    
    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="ml-4 space-y-1 my-2 list-disc">
            {listItems.map((item, idx) => (
              <li key={idx} className="text-muted-foreground">{item}</li>
            ))}
          </ul>
        )
        listItems = []
      }
    }
    
    lines.forEach((line, index) => {
      const trimmed = line.trim()
      if (!trimmed) {
        flushList()
        return
      }
      
      // Check if it's a section heading (ends with colon and is short)
      if (trimmed.match(/^[A-Z][^:]*:$/) && trimmed.length < 60) {
        flushList()
        const headingText = trimmed.replace(/:$/, '')
        elements.push(
          <h4 key={index} className="font-semibold text-foreground mt-4 mb-2">
            {headingText}
          </h4>
        )
        return
      }
      
      // Check if it's a bullet point
      if (trimmed.match(/^[-*•]\s+/)) {
        const content = trimmed.replace(/^[-*•]\s+/, '')
        listItems.push(content)
        return
      }
      
      // Check if it's a numbered list item
      if (trimmed.match(/^\d+\.\s+/)) {
        flushList()
        const content = trimmed.replace(/^\d+\.\s+/, '')
        elements.push(
          <div key={index} className="ml-4 text-muted-foreground mb-1">
            {trimmed}
          </div>
        )
        return
      }
      
      // Regular paragraph - flush list first
      flushList()
      elements.push(
        <p key={index} className="text-foreground mb-2 leading-relaxed">
          {trimmed}
        </p>
      )
    })
    
    // Flush any remaining list items
    flushList()
    
    return elements
  }

  return (
    <div className="bg-card border border-border rounded-lg shadow-sm p-6 h-fit lg:sticky lg:top-8">
      <div className="space-y-6">
        {/* Job Title */}
        <div>
          <h2 className="text-xl font-bold text-foreground mb-2">{job.title}</h2>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span>Posted {job.postedTime}</span>
            {job.pricing && <span>• {job.pricing}</span>}
            {job.budget && <span>• {job.budget}</span>}
            {job.level && <span>• {job.level}</span>}
          </div>
        </div>

        {/* Skills */}
        {job.skills && job.skills.length > 0 && (
          <div className="border-t border-border pt-4">
            <h3 className="font-semibold text-foreground mb-2">Skills Required</h3>
            <div className="flex flex-wrap gap-2">
              {job.skills.map((skill, index) => (
                <span
                  key={index}
                  className="px-2.5 py-1 bg-gray-100 text-muted-foreground rounded-md text-xs font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Client Info */}
        <div className="border-t border-border pt-4">
          <h3 className="font-semibold text-foreground mb-2">Client Information</h3>
          <div className="space-y-1 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className={job.paymentVerified ? "text-green-600" : "text-red-600"}>
                {job.paymentVerified ? "✓" : "✗"}
              </span>
              <span>Payment {job.paymentVerified ? "Verified" : "Not Verified"}</span>
            </div>
            {job.rating > 0 && (
              <div>Rating: {job.rating.toFixed(1)} / 5.0</div>
            )}
            {job.hireRate > 0 && (
              <div>Hire Rate: {job.hireRate}%</div>
            )}
            {job.totalSpend > 0 && (
              <div>Total Spent: ${job.totalSpend.toLocaleString()}</div>
            )}
            {job.openJobs > 0 && (
              <div>Open Jobs: {job.openJobs}</div>
            )}
          </div>
        </div>

        {/* Job Description Section */}
        {description && (
          <div className="border-t border-border pt-4">
            <h3 className="font-semibold text-foreground mb-3">Job Description</h3>
            <div className="space-y-2 text-sm text-foreground leading-relaxed max-h-[600px] overflow-y-auto">
              {formatDescription(description)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

