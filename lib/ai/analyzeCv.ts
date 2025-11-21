/**
 * AI helper functions for CV analysis
 */

import OpenAI from "openai"
import { AtsEvaluation, JobMatchScore } from "@/lib/types/cv-screener"
import { prisma } from "@/lib/prisma"

const openRouterApiKey = process.env.OPENROUTER_API_KEY
if (!openRouterApiKey) {
  console.warn("OPENROUTER_API_KEY is not configured")
}

const api = openRouterApiKey
  ? new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: openRouterApiKey,
      defaultHeaders: {
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "X-Title": process.env.SITE_NAME || "AI Job Scraping",
      },
    })
  : null

/**
 * Analyzes a CV for ATS-friendliness
 */
export async function analyzeAtsFriendliness(cvText: string): Promise<AtsEvaluation> {
  if (!api) {
    throw new Error("OpenRouter API key is not configured")
  }

  const systemPrompt = `You are an expert ATS (Applicant Tracking System) and resume reviewer specializing in software/tech roles and freelancing platforms like Upwork.

Your task is to evaluate a resume/CV for ATS-friendliness, structure, formatting, keyword richness, and clarity.

You must return ONLY a valid JSON object matching this exact structure:
{
  "atsScore": <number 0-100>,
  "verdict": "pass" | "needs_improvement",
  "summary": "<brief summary string>",
  "structureScore": <number 0-100>,
  "formattingScore": <number 0-100>,
  "keywordScore": <number 0-100>,
  "clarityScore": <number 0-100>,
  "strengths": ["<strength 1>", "<strength 2>", ...],
  "issues": ["<issue 1>", "<issue 2>", ...],
  "recommendations": ["<recommendation 1>", "<recommendation 2>", ...],
  "suggestedSections": ["Summary", "Skills", "Experience", "Projects", "Education", ...]
}

Evaluation criteria:
1. Structure Score: Clear sections, logical flow, proper headings
2. Formatting Score: Clean layout, readable fonts, proper spacing, no complex tables/graphics
3. Keyword Score: Relevant tech keywords, skills mentioned, industry terms
4. Clarity Score: Clear language, concise descriptions, quantifiable achievements

Verdict rules:
- "pass" if atsScore >= 70
- "needs_improvement" if atsScore < 70

Focus on software/tech freelancing context (Upwork-style jobs). Be specific and actionable in feedback.`

  const userMessage = `Resume text:

\`\`\`
${cvText}
\`\`\`

Analyze this resume and return the JSON evaluation.`

  try {
    const response = await api.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: "json_object" },
    })

    const content = response.choices?.[0]?.message?.content
    if (!content) {
      throw new Error("No response from AI")
    }

    const evaluation = JSON.parse(content) as AtsEvaluation

    // Validate and normalize the response
    return {
      atsScore: Math.max(0, Math.min(100, evaluation.atsScore || 0)),
      verdict: evaluation.atsScore >= 70 ? "pass" : "needs_improvement",
      summary: evaluation.summary || "No summary provided",
      structureScore: Math.max(0, Math.min(100, evaluation.structureScore || 0)),
      formattingScore: Math.max(0, Math.min(100, evaluation.formattingScore || 0)),
      keywordScore: Math.max(0, Math.min(100, evaluation.keywordScore || 0)),
      clarityScore: Math.max(0, Math.min(100, evaluation.clarityScore || 0)),
      strengths: Array.isArray(evaluation.strengths) ? evaluation.strengths : [],
      issues: Array.isArray(evaluation.issues) ? evaluation.issues : [],
      recommendations: Array.isArray(evaluation.recommendations) ? evaluation.recommendations : [],
      suggestedSections: Array.isArray(evaluation.suggestedSections)
        ? evaluation.suggestedSections
        : ["Summary", "Skills", "Experience", "Projects", "Education"],
    }
  } catch (error) {
    console.error("Error analyzing ATS friendliness:", error)
    throw new Error(`Failed to analyze CV: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

/**
 * Matches a CV against existing jobs in the database
 */
export async function matchCvToJobs(cvText: string, limit: number = 10): Promise<JobMatchScore[]> {
  if (!api) {
    throw new Error("OpenRouter API key is not configured")
  }

  // Fetch recent jobs (preferably BEST_FIT or P70_PERCENT, limit to 200 for AI processing)
  const jobs = await prisma.job.findMany({
    where: {
      bucket: {
        in: ["BEST_FIT", "P70_PERCENT"],
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 200, // Limit for AI processing
    select: {
      id: true,
      jobTitle: true,
      jobDescription: true,
      skillsRaw: true,
      clientCountry: true,
      bucket: true,
      category: true,
    },
  })

  if (jobs.length === 0) {
    return []
  }

  // Prepare jobs data for AI
  const jobsForAi = jobs.map((job) => ({
    id: job.id.toString(),
    title: job.jobTitle,
    description: job.jobDescription.substring(0, 1000), // Limit description length
    skills: job.skillsRaw,
    bucket: job.bucket,
    country: job.clientCountry,
  }))

  const systemPrompt = `You are a job-CV matching engine for software/tech freelancing roles.

Given a resume/CV and a list of job descriptions, evaluate how well the CV matches each job.

Return ONLY a valid JSON array of match scores, with this exact structure:
[
  {
    "jobId": "<job id>",
    "matchScore": <number 0-100>,
    "shortReason": "<one sentence reason for the match score>"
  },
  ...
]

Match criteria:
- Skills alignment (keywords, technologies)
- Experience relevance
- Role fit
- Industry/domain match

Sort by matchScore descending. Only include jobs with matchScore >= 50.`

  const userMessage = `Resume/CV:

\`\`\`
${cvText.substring(0, 2000)}
\`\`\`

Jobs to match against:

\`\`\`json
${JSON.stringify(jobsForAi, null, 2)}
\`\`\`

Return the JSON array of match scores.`

  try {
    const response = await api.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.3,
      max_tokens: 3000,
      response_format: { type: "json_object" },
    })

    const content = response.choices?.[0]?.message?.content
    if (!content) {
      throw new Error("No response from AI")
    }

    const parsed = JSON.parse(content)
    // Handle both array and object with array property
    let matches: any[] = []
    if (Array.isArray(parsed)) {
      matches = parsed
    } else if (parsed.matches && Array.isArray(parsed.matches)) {
      matches = parsed.matches
    } else if (parsed.results && Array.isArray(parsed.results)) {
      matches = parsed.results
    } else if (parsed.jobs && Array.isArray(parsed.jobs)) {
      matches = parsed.jobs
    } else {
      // Try to find any array property
      const arrayKey = Object.keys(parsed).find((key) => Array.isArray(parsed[key]))
      if (arrayKey) {
        matches = parsed[arrayKey]
      }
    }

    // Map to JobMatchScore and enrich with job data
    const jobMap = new Map(jobs.map((j) => [j.id.toString(), j]))
    const jobMatches: JobMatchScore[] = matches
      .map((match: any) => {
        const job = jobMap.get(match.jobId)
        if (!job) return null

        return {
          jobId: match.jobId,
          jobTitle: job.jobTitle,
          clientCountry: job.clientCountry,
          bucket: job.bucket,
          matchScore: Math.max(0, Math.min(100, match.matchScore || 0)),
          shortReason: match.shortReason || "No reason provided",
        }
      })
      .filter((m: JobMatchScore | null): m is JobMatchScore => m !== null)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit)

    return jobMatches
  } catch (error) {
    console.error("Error matching CV to jobs:", error)
    // Return empty array on error rather than throwing
    return []
  }
}

