import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const savedJobs = await prisma.savedJob.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    })

    const jobIds = savedJobs.map((sj: { jobId: string }) => sj.jobId)

    return NextResponse.json({ savedJobs: jobIds })
  } catch (error) {
    console.error("Error fetching saved jobs:", error)
    return NextResponse.json({ error: "Failed to fetch saved jobs" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, jobId } = await request.json()

    if (!userId || !jobId) {
      return NextResponse.json(
        { error: "User ID and Job ID are required" },
        { status: 400 }
      )
    }

    // Check if already saved
    const existing = await prisma.savedJob.findUnique({
      where: {
        userId_jobId: {
          userId,
          jobId,
        },
      },
    })

    if (existing) {
      // Already saved, return existing list
      const savedJobs = await prisma.savedJob.findMany({
        where: { userId },
        select: { jobId: true },
      })
      return NextResponse.json({
        success: true,
        savedJobs: savedJobs.map((sj: { jobId: string }) => sj.jobId),
      })
    }

    // Create new saved job
    await prisma.savedJob.create({
      data: {
        userId,
        jobId,
      },
    })

    // Return updated list
    const savedJobs = await prisma.savedJob.findMany({
      where: { userId },
      select: { jobId: true },
    })

    return NextResponse.json({
      success: true,
      savedJobs: savedJobs.map((sj: { jobId: string }) => sj.jobId),
    })
  } catch (error) {
    console.error("Error saving job:", error)
    return NextResponse.json({ error: "Failed to save job" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId, jobId } = await request.json()

    if (!userId || !jobId) {
      return NextResponse.json(
        { error: "User ID and Job ID are required" },
        { status: 400 }
      )
    }

    await prisma.savedJob.delete({
      where: {
        userId_jobId: {
          userId,
          jobId,
        },
      },
    })

    // Return updated list
    const savedJobs = await prisma.savedJob.findMany({
      where: { userId },
      select: { jobId: true },
    })

    return NextResponse.json({
      success: true,
      savedJobs: savedJobs.map((sj: { jobId: string }) => sj.jobId),
    })
  } catch (error) {
    console.error("Error removing saved job:", error)
    if ((error as any).code === "P2025") {
      return NextResponse.json({ error: "Saved job not found" }, { status: 404 })
    }
    return NextResponse.json({ error: "Failed to remove saved job" }, { status: 500 })
  }
}
