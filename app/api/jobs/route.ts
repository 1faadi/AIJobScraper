import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const profile = searchParams.get("profile")
    const tab = searchParams.get("tab") || "mostRecent"
    const page = Number.parseInt(searchParams.get("page") || "1")
    const itemsPerPage = 10
    const skip = (page - 1) * itemsPerPage

    // Build where clause based on tab
    let where: any = {}
    if (tab === "bestMatches") {
      where.bucket = "BEST_FIT"
    } else if (tab === "discarded") {
      where.bucket = "NOT_FIT"
    } else if (tab === "mostRecent") {
      // Show all jobs, ordered by most recent
    }

    // Fetch jobs from database
    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        skip,
        take: itemsPerPage,
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.job.count({ where }),
    ])

    // Map database jobs to the expected format
    const mappedJobs = jobs.map((job) => {
      // Map Prisma bucket enum to fit.ts format
      const bucketMap: Record<string, string> = {
        'NOT_FIT': 'NOT_FIT',
        'P70_PERCENT': '70_PERCENT',
        'BEST_FIT': 'BEST_FIT',
      }
      const bucket = bucketMap[job.bucket] || job.bucket

      return {
        id: job.id.toString(),
        title: job.jobTitle,
        postedTime: formatTimeAgo(job.createdAt),
        pricing: "Fixed price", // Default, can be enhanced later
        budget: job.totalSpent ? `$${job.totalSpent.toFixed(2)}` : "Not specified",
        level: "Intermediate", // Default, can be enhanced later
        description: job.jobDescription,
        skills: parseSkills(job.skillsRaw),
        paymentVerified: job.paymentVerified,
        rating: job.clientRating,
        hireRate: job.hireRate ? Math.round(job.hireRate * 100) : 0,
        openJobs: job.activeJobs || 0,
        totalSpend: job.totalSpent ? Math.round(job.totalSpent / 1000) : 0, // Convert to thousands
        totalHires: job.hires || 0,
        avgRate: job.avgHourlyPaid || 0,
        matchScore: job.aiMatchPercent !== null && job.aiMatchPercent !== undefined 
          ? Math.round(job.aiMatchPercent * 100) 
          : undefined,
        bucket,
        fitScore: job.fitScore ?? 0, // Use stored fitScore or default to 0
        clientCountry: job.clientCountry,
        category: job.category,
        industry: job.industry,
      }
    })

    return NextResponse.json({
      jobs: mappedJobs,
      total,
      page,
      totalPages: Math.ceil(total / itemsPerPage),
    })
  } catch (error) {
    console.error("Error fetching jobs:", error)
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 })
  }
}

// Helper function to format time ago
function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
  return `${Math.floor(diffInSeconds / 604800)} weeks ago`
}

// Helper function to parse skills from raw string
function parseSkills(skillsRaw: string): string[] {
  if (!skillsRaw) return []
  
  // Try to split by common delimiters
  const delimiters = [",", ";", "|", "\n"]
  for (const delimiter of delimiters) {
    if (skillsRaw.includes(delimiter)) {
      return skillsRaw
        .split(delimiter)
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
        .slice(0, 10) // Limit to 10 skills
    }
  }
  
  // If no delimiter found, return as single skill
  return [skillsRaw.trim()].filter((s) => s.length > 0)
}
