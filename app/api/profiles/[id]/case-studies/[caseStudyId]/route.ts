import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; caseStudyId: string }> }
) {
  try {
    const { caseStudyId } = await params
    const body = await request.json()

    if (!body.title || !body.description) {
      return NextResponse.json(
        { error: "Title and description are required" },
        { status: 400 }
      )
    }

    const caseStudy = await prisma.caseStudy.update({
      where: { id: caseStudyId },
      data: {
        title: body.title,
        description: body.description,
        category: body.category || null,
      },
    })

    return NextResponse.json({
      caseStudy: {
        id: caseStudy.id,
        title: caseStudy.title,
        description: caseStudy.description,
        category: caseStudy.category,
      },
      success: true,
    })
  } catch (error) {
    console.error("Error updating case study:", error)
    return NextResponse.json({ error: "Failed to update case study" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; caseStudyId: string }> }
) {
  try {
    const { caseStudyId } = await params

    await prisma.caseStudy.delete({
      where: { id: caseStudyId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting case study:", error)
    return NextResponse.json({ error: "Failed to delete case study" }, { status: 500 })
  }
}

