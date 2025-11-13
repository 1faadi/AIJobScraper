import { type NextRequest, NextResponse } from "next/server"

// In-memory storage for demo purposes
const savedJobsStore: Map<string, string[]> = new Map()

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId") || "default"

    const userSavedJobs = savedJobsStore.get(userId) || []

    return NextResponse.json({ savedJobs: userSavedJobs })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch saved jobs" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId = "default", jobId } = await request.json()

    if (!jobId) {
      return NextResponse.json({ error: "Job ID is required" }, { status: 400 })
    }

    const userSavedJobs = savedJobsStore.get(userId) || []

    if (!userSavedJobs.includes(jobId)) {
      userSavedJobs.push(jobId)
      savedJobsStore.set(userId, userSavedJobs)
    }

    return NextResponse.json({ success: true, savedJobs: userSavedJobs })
  } catch (error) {
    return NextResponse.json({ error: "Failed to save job" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId = "default", jobId } = await request.json()

    if (!jobId) {
      return NextResponse.json({ error: "Job ID is required" }, { status: 400 })
    }

    const userSavedJobs = savedJobsStore.get(userId) || []
    const filteredJobs = userSavedJobs.filter((id) => id !== jobId)
    savedJobsStore.set(userId, filteredJobs)

    return NextResponse.json({ success: true, savedJobs: filteredJobs })
  } catch (error) {
    return NextResponse.json({ error: "Failed to remove saved job" }, { status: 500 })
  }
}
