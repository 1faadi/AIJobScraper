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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.title) {
      return NextResponse.json({ error: "Name and title are required" }, { status: 400 })
    }

    // Get existing profile to preserve fields not being updated
    const existingProfile = await prisma.profile.findUnique({
      where: { id },
    })

    if (!existingProfile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    // Update profile in database
    const profile = await prisma.profile.update({
      where: { id },
      data: {
        name: body.name,
        title: body.title,
        hourlyRate: body.hourlyRate || "$0/hr",
        jobSuccess: body.jobSuccessRate || body.jobSuccess || "100%",
        experience: body.experience !== undefined ? body.experience : existingProfile.experience,
        badge: body.badge !== undefined ? body.badge : existingProfile.badge,
        overview: body.overview !== undefined ? body.overview : existingProfile.overview,
        skills: Array.isArray(body.skills) ? body.skills.filter((s: string) => s.trim()).map((s: string) => s.trim()) : existingProfile.skills,
        tags: Array.isArray(body.tags) ? body.tags.filter((t: string) => t.trim()).map((t: string) => t.trim()) : existingProfile.tags,
      },
    })

    return NextResponse.json(
      {
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
        success: true,
      }
    )
  } catch (error) {
    console.error("Error updating profile:", error)
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.profile.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting profile:", error)
    return NextResponse.json({ error: "Failed to delete profile" }, { status: 500 })
  }
}

