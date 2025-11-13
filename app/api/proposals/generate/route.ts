import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { template, profile, portfolio, content } = await request.json()

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    // Mock AI proposal generation
    const enhancedProposal = `${content}\n\nThis proposal was generated using AI enhancement based on your profile and template.`

    return NextResponse.json({
      proposal: enhancedProposal,
      success: true,
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to generate proposal" }, { status: 500 })
  }
}
