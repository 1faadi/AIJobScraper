import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get("search") || ""

    let where: any = {}
    
    if (search) {
      where = {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { title: { contains: search, mode: "insensitive" as const } },
        ],
      }
    }

    const profiles = await prisma.profile.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
    })

    // Map to expected format
    const mappedProfiles = profiles.map((profile) => ({
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
    }))

    return NextResponse.json({ profiles: mappedProfiles })
  } catch (error) {
    console.error("Error fetching profiles:", error)
    return NextResponse.json({ error: "Failed to fetch profiles" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.title) {
      return NextResponse.json({ error: "Name and title are required" }, { status: 400 })
    }

    // Create profile in database
    const profile = await prisma.profile.create({
      data: {
        name: body.name,
        title: body.title,
        hourlyRate: body.hourlyRate || "$0/hr",
        jobSuccess: body.jobSuccessRate || body.jobSuccess || "100%",
        experience: body.experience || null,
        badge: body.badge || null,
        overview: body.overview || null,
        skills: Array.isArray(body.skills) ? body.skills.filter((s: string) => s.trim()).map((s: string) => s.trim()) : [],
        tags: Array.isArray(body.tags) ? body.tags.filter((t: string) => t.trim()).map((t: string) => t.trim()) : [],
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
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating profile:", error)
    return NextResponse.json({ error: "Failed to create profile" }, { status: 500 })
  }
}
