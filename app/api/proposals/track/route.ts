import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const { 
      proposalId,
      variant,
      templateId,
      snippetIds,
      jobId,
      userId,
      event, // "sent", "reply_received", "interview_scheduled"
    } = await request.json()

    if (!event || !jobId) {
      return NextResponse.json(
        { error: "Event and jobId are required" },
        { status: 400 }
      )
    }

    // For now, just log the event (can be extended to save to database)
    console.log("Proposal tracking event:", {
      proposalId,
      variant,
      templateId,
      snippetIds,
      jobId,
      userId,
      event,
      timestamp: new Date().toISOString(),
    })

    // TODO: Save to database for A/B testing analysis
    // await prisma.proposalTracking.create({ ... })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error tracking proposal:", error)
    return NextResponse.json({ error: "Failed to track proposal" }, { status: 500 })
  }
}

// Get performance analytics
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const templateId = searchParams.get("templateId")
    const variant = searchParams.get("variant")

    // For now, return mock data (can be extended to query database)
    const analytics = {
      totalSent: 0,
      repliesReceived: 0,
      interviewsScheduled: 0,
      replyRate: 0,
      interviewRate: 0,
      topPerformingVariants: [
        { variant: "short", replyRate: 0, interviewRate: 0 },
        { variant: "technical", replyRate: 0, interviewRate: 0 },
        { variant: "friendly", replyRate: 0, interviewRate: 0 },
      ],
      topPerformingSnippets: [] as Array<{ id: string; title: string; replyRate: number }>,
    }

    return NextResponse.json({ analytics })
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
  }
}

