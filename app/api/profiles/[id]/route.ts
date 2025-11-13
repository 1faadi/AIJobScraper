import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const profile = await prisma.profile.findUnique({
      where: { id },
    })

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    return NextResponse.json({
      profile: {
        id: profile.id,
        name: profile.name,
        title: profile.title,
        hourlyRate: profile.hourlyRate,
        jobSuccess: profile.jobSuccess,
        experience: profile.experience || "Not specified",
        badge: profile.badge,
        overview: profile.overview,
        skills: profile.skills || [],
        tags: profile.tags || [],
      },
    })
  } catch (error) {
    console.error("Error fetching profile:", error)
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
  }
}

