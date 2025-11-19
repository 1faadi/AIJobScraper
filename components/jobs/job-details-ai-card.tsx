"use client"

import { useState, useEffect } from "react"
import { Sparkles, Loader2, ChevronDown, ChevronUp, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScoreBreakdown } from "./score-breakdown"

interface JobDetailsAICardProps {
  jobId: string
  jobData: any
  profileId?: string
  onClose?: () => void
}

// Enhanced markdown parser for AI analysis
function parseMarkdown(text: string): string {
  // Escape HTML
  text = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  
  const lines = text.split('\n')
  const processedLines: string[] = []
  let inList = false
  let inNumberedList = false
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim()
    
    // Skip empty lines (will add spacing later)
    if (!line) {
      if (inList) {
        processedLines.push('</ul>')
        inList = false
      }
      if (inNumberedList) {
        processedLines.push('</ol>')
        inNumberedList = false
      }
      processedLines.push('<br>')
      continue
    }
    
    // Headings (###, ##, #)
    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/)
    if (headingMatch) {
      if (inList) {
        processedLines.push('</ul>')
        inList = false
      }
      if (inNumberedList) {
        processedLines.push('</ol>')
        inNumberedList = false
      }
      const level = headingMatch[1].length
      const headingText = headingMatch[2]
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*]+?)\*/g, '<em>$1</em>')
      processedLines.push(`<h${Math.min(level + 2, 6)} class="font-semibold text-[#0F172A] mt-4 mb-2">${headingText}</h${Math.min(level + 2, 6)}>`)
      continue
    }
    
    // Bullet lists (- or *)
    const bulletMatch = line.match(/^[-*]\s+(.+)$/)
    if (bulletMatch) {
      if (inNumberedList) {
        processedLines.push('</ol>')
        inNumberedList = false
      }
      if (!inList) {
        processedLines.push('<ul class="list-disc ml-6 space-y-1 my-2">')
        inList = true
      }
      let listContent = bulletMatch[1]
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*]+?)\*/g, '<em>$1</em>')
      processedLines.push(`<li class="text-[#0F172A]">${listContent}</li>`)
      continue
    }
    
    // Numbered lists (1., 2., etc.)
    const numberedMatch = line.match(/^\d+\.\s+(.+)$/)
    if (numberedMatch) {
      if (inList) {
        processedLines.push('</ul>')
        inList = false
      }
      if (!inNumberedList) {
        processedLines.push('<ol class="list-decimal ml-6 space-y-1 my-2">')
        inNumberedList = true
      }
      let listContent = numberedMatch[1]
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*]+?)\*/g, '<em>$1</em>')
      processedLines.push(`<li class="text-[#0F172A]">${listContent}</li>`)
      continue
    }
    
    // Regular paragraph text
    if (inList) {
      processedLines.push('</ul>')
      inList = false
    }
    if (inNumberedList) {
      processedLines.push('</ol>')
      inNumberedList = false
    }
    
    // Process inline formatting
    line = line
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+?)\*/g, '<em>$1</em>')
    
    processedLines.push(`<p class="text-[#0F172A]/90 mb-2">${line}</p>`)
  }
  
  // Close any open lists
  if (inList) {
    processedLines.push('</ul>')
  }
  if (inNumberedList) {
    processedLines.push('</ol>')
  }
  
  return processedLines.join('\n')
}

export function JobDetailsAICard({ jobId, jobData, profileId, onClose }: JobDetailsAICardProps) {
  const [details, setDetails] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [hasFetched, setHasFetched] = useState(false)
  const [calculatedMatchScore, setCalculatedMatchScore] = useState<number | undefined>(undefined)
  const [isCalculatingMatch, setIsCalculatingMatch] = useState(false)

  // Calculate skills match score when profileId changes
  useEffect(() => {
    if (!profileId || !jobData?.skills || jobData.skills.length === 0) {
      setCalculatedMatchScore(undefined)
      return
    }

    const calculateMatchScore = async () => {
      setIsCalculatingMatch(true)
      try {
        const response = await fetch("/api/skills-match", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            profileId,
            jobSkills: jobData.skills,
            jobDescription: jobData.description,
            jobTitle: jobData.title,
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to calculate skills match")
        }

        const data = await response.json()
        setCalculatedMatchScore(data.matchScore)
      } catch (err) {
        console.error("Error calculating skills match:", err)
        setCalculatedMatchScore(undefined)
      } finally {
        setIsCalculatingMatch(false)
      }
    }

    calculateMatchScore()
  }, [profileId, jobData?.skills, jobData?.description, jobData?.title])

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
            matchScore: calculatedMatchScore !== undefined ? calculatedMatchScore : jobData.matchScore,
            skills: jobData.skills,
          }}
          fitScore={jobData.fitScore}
        />
        {isCalculatingMatch && (
          <div className="flex items-center gap-2 text-xs text-[#64748B]">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Calculating skills match...</span>
          </div>
        )}

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
                  className="text-sm leading-relaxed prose prose-sm max-w-none [&_strong]:font-semibold [&_strong]:text-[#0F172A] [&_em]:italic [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-[#0F172A] [&_h3]:mt-4 [&_h3]:mb-2 [&_h4]:text-sm [&_h4]:font-semibold [&_h4]:text-[#0F172A] [&_h4]:mt-3 [&_h4]:mb-2 [&_h5]:text-sm [&_h5]:font-semibold [&_h5]:text-[#0F172A] [&_h5]:mt-2 [&_h5]:mb-1 [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:space-y-1 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:space-y-1 [&_ol]:my-2 [&_li]:text-[#0F172A] [&_p]:mb-2 [&_p]:text-[#0F172A]/90"
                  dangerouslySetInnerHTML={{
                    __html: parseMarkdown(details)
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

