/**
 * TypeScript types for CV Screener feature
 */

export interface CvScreenerRequest {
  cvText: string // Required after extraction
  file?: File // Optional file upload
}

export interface AtsEvaluation {
  atsScore: number // 0-100
  verdict: "pass" | "needs_improvement"
  summary: string
  structureScore: number // 0-100
  formattingScore: number // 0-100
  keywordScore: number // 0-100
  clarityScore: number // 0-100
  strengths: string[] // bullet points
  issues: string[] // bullet points describing problems
  recommendations: string[] // concrete actionable suggestions
  suggestedSections: string[] // e.g. ["Summary", "Skills", "Experience", "Projects", "Education"]
}

export interface JobMatchScore {
  jobId: string
  jobTitle: string
  clientCountry?: string
  bucket?: string // BEST_FIT / P70_PERCENT / NOT_FIT
  matchScore: number // 0-100
  shortReason: string
}

export interface CvScreenerResponse {
  ats: AtsEvaluation
  matchedJobs?: JobMatchScore[]
}

export interface CvScreenerError {
  message: string
  code?: string
}

