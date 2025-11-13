import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get("category") || ""

    let where: any = { profileId: id }
    if (category) {
      where.category = category
    }

    const caseStudies = await prisma.caseStudy.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json({
      caseStudies: caseStudies.map((c) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        category: c.category,
      })),
    })
  } catch (error) {
    console.error("Error fetching case studies:", error)
    return NextResponse.json({ error: "Failed to fetch case studies" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    if (!body.title || !body.description) {
      return NextResponse.json(
        { error: "Title and description are required" },
        { status: 400 }
      )
    }

    const caseStudy = await prisma.caseStudy.create({
      data: {
        profileId: id,
        title: body.title,
        description: body.description,
        category: body.category || null,
      },
    })

    return NextResponse.json(
      {
        caseStudy: {
          id: caseStudy.id,
          title: caseStudy.title,
          description: caseStudy.description,
          category: caseStudy.category,
        },
        success: true,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating case study:", error)
    return NextResponse.json({ error: "Failed to create case study" }, { status: 500 })
  }
}

