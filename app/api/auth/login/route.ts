import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Find user by email
    let user
    try {
      user = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() }
      })
    } catch (dbError) {
      console.error("Database error:", dbError)
      return NextResponse.json({ 
        error: "Database connection error. Please check your database configuration." 
      }, { status: 500 })
    }

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Verify password
    let isPasswordValid = false
    try {
      isPasswordValid = await bcrypt.compare(password, user.password)
    } catch (bcryptError) {
      console.error("Password comparison error:", bcryptError)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Return user data (excluding password)
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({ 
      user: userWithoutPassword, 
      success: true 
    })

  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    }, { status: 500 })
  }
}
