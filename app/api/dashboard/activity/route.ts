import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // Fetch recent activity from database
    // We'll combine recent profiles, jobs, and portfolios/case studies
    const [recentProfiles, recentJobs] = await Promise.all([
      prisma.profile.findMany({
        take: 3,
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          name: true,
          title: true,
          createdAt: true,
        },
      }),
      prisma.job.findMany({
        take: 3,
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          jobTitle: true,
          createdAt: true,
        },
      }),
    ])

    // Format activity items
    const activities: Array<{
      id: string
      type: "profile" | "job" | "saved"
      title: string
      time: string
      badge: string
      badgeColor: string
    }> = []

    // Add recent profiles
    recentProfiles.forEach((profile: { id: string; title: string; createdAt: Date }) => {
      activities.push({
        id: profile.id,
        type: "profile" as const,
        title: `Created new profile "${profile.title}"`,
        time: formatTimeAgo(profile.createdAt),
        badge: "Created",
        badgeColor: "bg-green-500/10 text-green-600",
      })
    })

    // Add recent jobs (as saved jobs for now)
    recentJobs.slice(0, 2).forEach((job: { id: number; jobTitle: string; createdAt: Date }) => {
      activities.push({
        id: job.id.toString(),
        type: "saved" as const,
        title: `Saved "${job.jobTitle}"`,
        time: formatTimeAgo(job.createdAt),
        badge: "Saved",
        badgeColor: "bg-primary/10 text-primary",
      })
    })

    // Sort by creation date (most recent first)
    activities.sort((a, b) => {
      const timeA = getTimeValue(a.time)
      const timeB = getTimeValue(b.time)
      return timeA - timeB
    })

    // Return top 3 most recent
    return NextResponse.json({
      activities: activities.slice(0, 3),
    })
  } catch (error) {
    console.error("Error fetching dashboard activity:", error)
    return NextResponse.json({ error: "Failed to fetch dashboard activity" }, { status: 500 })
  }
}

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return `${diffInSeconds} seconds ago`
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? "minute" : "minutes"} ago`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? "hour" : "hours"} ago`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) {
    return `${diffInDays} ${diffInDays === 1 ? "day" : "days"} ago`
  }

  const diffInWeeks = Math.floor(diffInDays / 7)
  return `${diffInWeeks} ${diffInWeeks === 1 ? "week" : "weeks"} ago`
}

function getTimeValue(timeString: string): number {
  const match = timeString.match(/(\d+)\s*(second|minute|hour|day|week)/)
  if (!match) return 0

  const value = parseInt(match[1])
  const unit = match[2]

  const multipliers: Record<string, number> = {
    second: 1,
    minute: 60,
    hour: 3600,
    day: 86400,
    week: 604800,
  }

  return value * (multipliers[unit] || 0)
}

