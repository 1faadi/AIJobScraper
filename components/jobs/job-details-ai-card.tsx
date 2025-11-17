"use client"

import { useState, useEffect } from "react"
import { Sparkles, Loader2, ChevronDown, ChevronUp, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScoreBreakdown } from "./score-breakdown"

interface JobDetailsAICardProps {
  jobId: string
  jobData: any
  onClose?: () => void
}

// Simple markdown parser (same as proposal modal)
function parseMarkdown(text: string): string {
  text = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  
  const lines = text.split('\n')
  const processedLines: string[] = []
  let inList = false
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]
    const listMatch = line.match(/^- (.+)$/)
    
    if (listMatch) {
      let listContent = listMatch[1]
      listContent = listContent.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      listContent = listContent.replace(/\*([^*]+?)\*/g, '<em>$1</em>')
      
      if (!inList) {
        processedLines.push('<ul>')
        inList = true
      }
      processedLines.push(`<li>${listContent}</li>`)
    } else {
      if (inList) {
        processedLines.push('</ul>')
        inList = false
      }
      
      if (line.trim()) {
        line = line.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        line = line.replace(/\*([^*]+?)\*/g, '<em>$1</em>')
        processedLines.push(line)
      } else {
        processedLines.push('<br>')
      }
    }
  }
  
  if (inList) {
    processedLines.push('</ul>')
  }
  
  return processedLines.join('\n')
}

export function JobDetailsAICard({ jobId, jobData, onClose }: JobDetailsAICardProps) {
  const [details, setDetails] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [hasFetched, setHasFetched] = useState(false)

  const fetchJobDetails = async () => {
    if (hasFetched) {
      // If already fetched, just toggle visibility
      setShowAnalysis(!showAnalysis)
      return
    }

    setIsLoading(true)
    setError(null)
    setShowAnalysis(true)
    
    try {
      const response = await fetch(`/api/jobs/${jobId}/details`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(jobData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate job details")
      }

      if (data.details) {
        setDetails(data.details)
        setHasFetched(true)
      } else {
        throw new Error("No details received from API")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load job details")
      console.error("Error fetching job details:", err)
      setShowAnalysis(false)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-[0_8px_24px_rgba(15,23,42,0.06)] border border-[#E7ECF2] h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl border border-primary/20">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#0F172A]">AI Job Analysis</h3>
            <p className="text-xs text-[#64748B]">Generated insights for this position</p>
          </div>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 hover:bg-[#F7F8FA]"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="space-y-6 flex-1 flex flex-col">
        {/* Score Breakdown - Always visible */}
        <ScoreBreakdown 
          jobData={{
            clientCountry: jobData.clientCountry,
            paymentVerified: jobData.paymentVerified,
            rating: jobData.rating,
            hireRate: jobData.hireRate,
            totalSpend: jobData.totalSpend,
            openJobs: jobData.openJobs,
            matchScore: jobData.matchScore,
            skills: jobData.skills,
          }}
          fitScore={jobData.fitScore}
        />

        {/* Toggle Button for AI Analysis */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={fetchJobDetails}
            disabled={isLoading}
            className="border-[#E7ECF2] text-[#0F172A] hover:bg-[#F7F8FA] rounded-lg px-4 py-2 text-sm font-medium gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : showAnalysis ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Hide AI Analysis
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Show AI Analysis
              </>
            )}
          </Button>
        </div>

        {/* AI Analysis - Toggleable */}
        {showAnalysis && (
          <div className="max-h-[500px] overflow-auto">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
                <p className="text-sm text-[#64748B]">Analyzing job details...</p>
              </div>
            ) : error ? (
              <div className="py-8 text-center">
                <p className="text-sm text-red-500 mb-3">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchJobDetails}
                  className="text-xs"
                >
                  Retry
                </Button>
              </div>
            ) : details ? (
              <div>
                <h4 className="text-sm font-semibold text-[#0F172A] mb-3">AI Analysis</h4>
                <div
                  className="text-sm text-[#0F172A] leading-relaxed [&_strong]:font-semibold [&_em]:italic [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:space-y-2 [&_ul]:my-3 [&_li]:text-[#0F172A] [&_p]:mb-3 [&_p]:text-[#0F172A]/90"
                  dangerouslySetInnerHTML={{
                    __html: parseMarkdown(details)
                      .split('\n')
                      .map((line) => {
                        const trimmed = line.trim()
                        if (trimmed.startsWith('<ul>') || trimmed.startsWith('</ul>') || trimmed.startsWith('<li>') || trimmed === '<br>' || !trimmed) {
                          return line
                        }
                        return `<p>${line}</p>`
                      })
                      .join('')
                  }}
                />
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}

