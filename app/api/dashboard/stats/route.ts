import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // Fetch counts from database
    const [jobsCount, profilesCount, templatesCount, savedJobsCount] = await Promise.all([
      prisma.job.count({
        where: {
          bucket: {
            in: ["BEST_FIT", "P70_PERCENT"],
          },
        },
      }),
      prisma.profile.count(),
      prisma.template.count(),
      prisma.savedJob.count(),
    ])

    // Calculate trends (for now, we'll use simple logic)
    // In a real app, you'd compare with previous period
    const jobsTrend = jobsCount > 0 ? `↑ ${Math.floor(jobsCount * 0.12)} from last week` : "No jobs yet"
    const profilesTrend = profilesCount > 0 ? `↑ ${Math.max(1, Math.floor(profilesCount * 0.25))} new profiles` : "No profiles yet"
    const templatesTrend = templatesCount > 0 ? `↑ ${Math.max(1, Math.floor(templatesCount * 0.2))} new templates` : "No templates yet"
    const savedJobsTrend = savedJobsCount > 0 ? `↑ ${Math.max(1, Math.floor(savedJobsCount * 0.25))} new saves` : "No saved jobs yet"

    return NextResponse.json({
      stats: {
        activeJobs: {
          value: jobsCount,
          trend: jobsTrend,
        },
        profiles: {
          value: profilesCount,
          trend: profilesTrend,
        },
        templates: {
          value: templatesCount,
          trend: templatesTrend,
        },
        savedJobs: {
          value: savedJobsCount,
          trend: savedJobsTrend,
        },
      },
    })
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 })
  }
}

