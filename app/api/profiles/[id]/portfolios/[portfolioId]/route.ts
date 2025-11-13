import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; portfolioId: string }> }
) {
  try {
    const { portfolioId } = await params
    const body = await request.json()

    if (!body.title || !body.description) {
      return NextResponse.json(
        { error: "Title and description are required" },
        { status: 400 }
      )
    }

    const portfolio = await prisma.portfolio.update({
      where: { id: portfolioId },
      data: {
        title: body.title,
        description: body.description,
        category: body.category || null,
      },
    })

    return NextResponse.json({
      portfolio: {
        id: portfolio.id,
        title: portfolio.title,
        description: portfolio.description,
        category: portfolio.category,
      },
      success: true,
    })
  } catch (error) {
    console.error("Error updating portfolio:", error)
    return NextResponse.json({ error: "Failed to update portfolio" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; portfolioId: string }> }
) {
  try {
    const { portfolioId } = await params

    await prisma.portfolio.delete({
      where: { id: portfolioId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting portfolio:", error)
    return NextResponse.json({ error: "Failed to delete portfolio" }, { status: 500 })
  }
}

