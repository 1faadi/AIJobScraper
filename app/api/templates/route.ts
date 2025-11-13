import { type NextRequest, NextResponse } from "next/server"
import { mockTemplates } from "@/lib/mock-data"

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({ templates: mockTemplates })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.title || !body.description) {
      return NextResponse.json({ error: "Title and description are required" }, { status: 400 })
    }

    const newTemplate = {
      id: Date.now().toString(),
      ...body,
      icon: "📝",
    }

    return NextResponse.json({ template: newTemplate, success: true }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 })
  }
}
