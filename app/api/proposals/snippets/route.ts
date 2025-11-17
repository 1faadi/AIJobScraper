import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Get all snippets
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get("category")
    const type = searchParams.get("type")

    let where: any = {}
    if (category) {
      where.category = category
    }
    if (type) {
      where.type = type
    }

    // For now, return default snippets (can be extended to use database)
    const snippets = [
      {
        id: "intro-1",
        type: "intro",
        category: "general",
        title: "Confident Opening",
        content: "I've reviewed your project requirements and I'm excited about the opportunity to help bring your vision to life.",
        usageCount: 0,
        successRate: 0,
      },
      {
        id: "intro-2",
        type: "intro",
        category: "technical",
        title: "Technical Opening",
        content: "With [X years] of experience in [technology], I'm well-equipped to tackle the challenges outlined in your project.",
        usageCount: 0,
        successRate: 0,
      },
      {
        id: "closing-1",
        type: "closing",
        category: "general",
        title: "Call to Action",
        content: "I'd love to discuss how I can help you achieve your goals. Let's schedule a call to dive deeper into the details.",
        usageCount: 0,
        successRate: 0,
      },
      {
        id: "guarantee-1",
        type: "guarantee",
        category: "general",
        title: "Quality Guarantee",
        content: "I'm committed to delivering high-quality work on time and within budget. Your satisfaction is my top priority.",
        usageCount: 0,
        successRate: 0,
      },
    ]

    return NextResponse.json({ snippets })
  } catch (error) {
    console.error("Error fetching snippets:", error)
    return NextResponse.json({ error: "Failed to fetch snippets" }, { status: 500 })
  }
}

// Create a snippet
export async function POST(request: NextRequest) {
  try {
    const { type, category, title, content } = await request.json()

    if (!type || !title || !content) {
      return NextResponse.json(
        { error: "Type, title, and content are required" },
        { status: 400 }
      )
    }

    // For now, just return success (can be extended to save to database)
    return NextResponse.json({
      snippet: {
        id: `snippet-${Date.now()}`,
        type,
        category: category || "general",
        title,
        content,
        usageCount: 0,
        successRate: 0,
      },
      success: true,
    })
  } catch (error) {
    console.error("Error creating snippet:", error)
    return NextResponse.json({ error: "Failed to create snippet" }, { status: 500 })
  }
}

