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

    const portfolios = await prisma.portfolio.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json({
      portfolios: portfolios.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        category: p.category,
      })),
    })
  } catch (error) {
    console.error("Error fetching portfolios:", error)
    return NextResponse.json({ error: "Failed to fetch portfolios" }, { status: 500 })
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

    const portfolio = await prisma.portfolio.create({
      data: {
        profileId: id,
        title: body.title,
        description: body.description,
        category: body.category || null,
      },
    })

    return NextResponse.json(
      {
        portfolio: {
          id: portfolio.id,
          title: portfolio.title,
          description: portfolio.description,
          category: portfolio.category,
        },
        success: true,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating portfolio:", error)
    return NextResponse.json({ error: "Failed to create portfolio" }, { status: 500 })
  }
}

