"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Sparkles, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { JobDetailsAICard } from "@/components/jobs/job-details-ai-card"
import { evaluateFit } from "@/lib/fit"

// Parse raw job text to extract job details
function parseRawJobText(rawText: string) {
  if (!rawText.trim()) return null

  const text = rawText.trim()
  
  // Extract title (usually first line or before "Posted")
  const titleMatch = text.match(/^(.+?)(?:\s+Posted|\s+Summary|$)/i)
  const title = titleMatch ? titleMatch[1].trim() : text.split('\n')[0]?.trim() || "Untitled Job"

  // Extract posted time
  const postedMatch = text.match(/Posted\s+([^•\n]+)/i)
  const postedTime = postedMatch ? postedMatch[1].trim() : "Recently"

  // Extract summary
  const summaryMatch = text.match(/Summary\s+(.+?)(?:\s+Deliverables|$)/is)
  const summary = summaryMatch ? summaryMatch[1].trim() : ""

  // Extract deliverables
  const deliverablesMatch = text.match(/Deliverables\s+(.+?)(?:\s+Less than|\s+Hourly|\s+Duration|$)/is)
  const deliverables = deliverablesMatch ? deliverablesMatch[1].trim().split(/\n/).filter(l => l.trim()) : []

  // Extract hours per week
  const hoursMatch = text.match(/Less than\s+(\d+)\s+hrs\/week/i)
  const hoursPerWeek = hoursMatch ? hoursMatch[1] : ""

  // Extract pricing type
  const pricingType = text.match(/Hourly|Fixed/i)?.[0] || "Fixed"

  // Extract budget/rate
  const budgetMatch = text.match(/\$([\d,]+(?:\.[\d]+)?)\s*-\s*\$([\d,]+(?:\.[\d]+)?)/)
  const budget = budgetMatch ? `$${budgetMatch[1]} - $${budgetMatch[2]}` : text.match(/\$([\d,]+(?:\.[\d]+)?)/)?.[0] || "Not specified"

  // Extract duration
  const durationMatch = text.match(/Duration\s+(.+?)(?:\s+Expert|$)/i)
  const duration = durationMatch ? durationMatch[1].trim() : ""

  // Extract level
  const levelMatch = text.match(/Expert|Intermediate|Entry\s+Level/i)
  const level = levelMatch ? levelMatch[0] : "Expert"

  // Extract questions
  const questionsMatch = text.match(/You will be asked to answer the following questions[^:]*:\s*(.+?)(?:\s+Skills|$)/is)
  const questions = questionsMatch 
    ? questionsMatch[1].split(/\n/).filter(q => q.trim() && !q.match(/^\s*$/)).map(q => q.trim())
    : []

  // Extract skills
  const skillsSection = text.match(/Skills and Expertise[^:]*:\s*(.+?)(?:\s+About the client|$)/is)
  let allSkills: string[] = []
  if (skillsSection) {
    const mandatoryMatch = skillsSection[1]?.match(/Mandatory skills\s*(.+?)(?:\s+Nice-to-have|$)/is)
    const niceToHaveMatch = skillsSection[1]?.match(/Nice-to-have skills\s*(.+?)(?:\s+Tools|$)/is)
    
    if (mandatoryMatch) {
      const mandatoryText = mandatoryMatch[1].trim()
      allSkills = [...allSkills, ...mandatoryText.split(/[,;]/).map(s => s.trim()).filter(s => s)]
    }
    if (niceToHaveMatch) {
      const niceToHaveText = niceToHaveMatch[1].trim()
      allSkills = [...allSkills, ...niceToHaveText.split(/[,;]/).map(s => s.trim()).filter(s => s)]
    }
  }
  
  // If no skills found in structured format, try to extract from Tools section
  if (allSkills.length === 0) {
    const toolsMatch = text.match(/Tools\s*(.+?)(?:\s+About the client|$)/is)
    if (toolsMatch) {
      allSkills = toolsMatch[1].split(/[,;]/).map(s => s.trim()).filter(s => s)
    }
  }

  // Extract client info
  const clientSection = text.match(/About the client\s+(.+?)$/is)?.[1] || ""
  const paymentVerified = /Payment method verified/i.test(clientSection)
  const ratingMatch = clientSection.match(/Rating is\s+([\d.]+)/i) || clientSection.match(/([\d.]+)\s+out of/i)
  const rating = ratingMatch ? parseFloat(ratingMatch[1]) : 0
  const hireRateMatch = clientSection.match(/(\d+)%\s+hire rate/i)
  const hireRate = hireRateMatch ? parseInt(hireRateMatch[1]) : 0
  const jobsPostedMatch = clientSection.match(/(\d+)\s+jobs posted/i)
  const openJobs = jobsPostedMatch ? parseInt(jobsPostedMatch[1]) : 0
  const totalSpendMatch = clientSection.match(/\$([\d,]+)\s+total spent/i)
  const totalSpend = totalSpendMatch ? parseFloat(totalSpendMatch[1].replace(/,/g, '')) : 0
  const hiresMatch = clientSection.match(/(\d+)\s+hires/i)
  const totalHires = hiresMatch ? parseInt(hiresMatch[1]) : 0
  const avgRateMatch = clientSection.match(/\$([\d.]+)\s*\/hr/i) || clientSection.match(/\$([\d.]+)\s*\/\s*hr/i)
  const avgRate = avgRateMatch ? parseFloat(avgRateMatch[1]) : 0

  // Extract country - try multiple patterns
  let clientCountry = ""
  
  // Import preferred countries for matching
  const PREFERRED_COUNTRIES_LIST = [
    "United States", "United Kingdom", "United Arab Emirates", "New Zealand",
    "Czech Republic", "South Korea", "South Africa", "Saudi Arabia",
    "Austria", "Belgium", "Croatia", "Cyprus", "Denmark", "Estonia", 
    "Finland", "France", "Germany", "Greece", "Hungary", "Ireland", 
    "Italy", "Luxembourg", "Malta", "Netherlands", "Poland", "Portugal", 
    "Romania", "Slovakia", "Slovenia", "Spain", "Sweden", "Switzerland", 
    "Norway", "Singapore", "Australia", "Canada"
  ]
  
  // Pattern 1: Look for country names from preferred list (most reliable)
  // Search in reverse order (longest first) to match "United States" before "United"
  const sortedCountries = [...PREFERRED_COUNTRIES_LIST].sort((a, b) => b.length - a.length)
  for (const country of sortedCountries) {
    // Use word boundary to avoid partial matches
    const regex = new RegExp(`\\b${country.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
    if (regex.test(clientSection)) {
      clientCountry = country
      break
    }
  }
  
  // Pattern 2: Also check for common abbreviations
  if (!clientCountry) {
    const abbrevMap: Record<string, string> = {
      "USA": "United States",
      "UK": "United Kingdom", 
      "UAE": "United Arab Emirates"
    }
    for (const [abbrev, fullName] of Object.entries(abbrevMap)) {
      const regex = new RegExp(`\\b${abbrev}\\b`, 'i')
      if (regex.test(clientSection)) {
        clientCountry = fullName
        break
      }
    }
  }
  
  // Pattern 3: Try to extract from "Country City Time" pattern (e.g., "United States South Jordan 6:00 AM")
  if (!clientCountry) {
    // Look for pattern: [Country] [City] [Time]
    // This pattern appears near the end of client section
    const timePattern = /\d+:\d+\s*(?:AM|PM)/i
    const timeMatch = clientSection.match(timePattern)
    if (timeMatch) {
      const timeIndex = clientSection.indexOf(timeMatch[0])
      // Get text before time (should contain country and city)
      const locationText = clientSection.substring(Math.max(0, timeIndex - 100), timeIndex).trim()
      
      // Try to find country in this location text
      for (const country of sortedCountries) {
        const regex = new RegExp(`\\b${country.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
        if (regex.test(locationText)) {
          clientCountry = country
          break
        }
      }
    }
  }
  
  // Pattern 4: Check if "Worldwide" is mentioned
  if (!clientCountry && text.includes("Worldwide")) {
    // If Worldwide, we can't determine country - leave empty
    clientCountry = ""
  }

  // Build description
  const description = [
    summary,
    deliverables.length > 0 ? `\n\nDeliverables:\n${deliverables.map(d => `- ${d}`).join('\n')}` : "",
    questions.length > 0 ? `\n\nQuestions:\n${questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}` : ""
  ].filter(Boolean).join('\n')

  // Calculate fit score using evaluateFit
  const fitResult = evaluateFit({
    clientCountry: clientCountry || undefined,
    paymentVerified: paymentVerified,
    clientRating: rating,
    jobsPosted: openJobs,
    hireRate: hireRate > 0 ? hireRate : null,
    totalSpent: totalSpend > 0 ? totalSpend : null,
    aiMatchPercent: null, // We don't have AI match for raw jobs
  })

  return {
    id: `raw-${Date.now()}`,
    title,
    postedTime,
    pricing: pricingType,
    budget,
    level,
    description: description || summary || rawText.substring(0, 500),
    skills: allSkills.length > 0 ? allSkills : [],
    paymentVerified,
    rating,
    hireRate,
    openJobs,
    totalSpend,
    totalHires,
    avgRate,
    clientCountry: clientCountry || undefined,
    matchScore: undefined, // AI match not calculated for raw jobs (no profile to match against)
    fitScore: fitResult.fitScore,
    bucket: fitResult.bucket,
    rawText, // Keep original for reference
  }
}

export default function RawProposalPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [rawText, setRawText] = useState("")

  // Parse job details from raw text
  const parsedJob = useMemo(() => parseRawJobText(rawText), [rawText])

  const handleGenerateProposal = () => {
    if (!rawText.trim()) {
      toast({
        title: "Paste a job summary first",
        description: "Please paste the raw job description before generating a proposal.",
        variant: "destructive",
      })
      return
    }

    if (!parsedJob) {
      toast({
        title: "Invalid job text",
        description: "Could not parse job details. Please check the format.",
        variant: "destructive",
      })
      return
    }

    // Store job data in sessionStorage and navigate
    if (typeof window !== 'undefined') {
      try {
        const jobDataString = JSON.stringify(parsedJob)
        sessionStorage.setItem('rawJobData', jobDataString)
        
        // Verify it was stored
        const verify = sessionStorage.getItem('rawJobData')
        if (verify) {
          router.push(`/dashboard/jobs-feed/raw/proposal`)
        } else {
          throw new Error("Failed to store job data in sessionStorage")
        }
      } catch (err) {
        console.error("Error storing job data:", err)
        toast({
          title: "Error",
          description: "Failed to store job data. Please try again.",
          variant: "destructive",
        })
      }
    } else {
      router.push(`/dashboard/jobs-feed/raw/proposal`)
    }
  }

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col gap-4 px-6 py-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-semibold text-[#0F172A]">
            <Sparkles className="h-5 w-5 text-primary" />
            Raw Proposal
          </h1>
          <p className="text-sm text-[#64748B]">
            Paste an Upwork job summary and generate a tailored proposal without saving the job in the feed.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="grid flex-1 gap-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        {/* Left: Raw job input */}
        <div className="flex flex-col rounded-2xl border border-[#E7ECF2] bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[#0F172A]">Job Summary</h2>
              <p className="text-xs text-[#64748B]">
                Paste the full text from the Upwork job page, including client details and skills.
              </p>
            </div>
          </div>

          <Textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Paste job details here..."
            className="min-h-[260px] flex-1 resize-none border-[#E7ECF2] text-sm"
          />

          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-[#94A3B8]">
              Tip: Include the questions, budget and client stats – the AI will use all of it.
            </p>
            <Button
              size="sm"
              className="bg-primary text-xs font-semibold text-white hover:bg-primary/90"
              disabled={!rawText.trim()}
              onClick={handleGenerateProposal}
            >
              <Sparkles className="mr-1.5 h-4 w-4" />
              Generate Proposal
            </Button>
          </div>
        </div>

        {/* Right: Job Details Card */}
        {parsedJob ? (
          <div className="lg:sticky lg:top-8">
            <JobDetailsAICard 
              jobId={parsedJob.id} 
              jobData={parsedJob} 
            />
          </div>
        ) : (
          <div className="flex flex-col rounded-2xl border border-[#E7ECF2] bg-white p-4 shadow-sm">
            <div className="flex h-full flex-col items-center justify-center text-center text-xs text-[#94A3B8]">
              <FileText className="mb-2 h-6 w-6" />
              <p>Job details will appear here after pasting job text.</p>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}

