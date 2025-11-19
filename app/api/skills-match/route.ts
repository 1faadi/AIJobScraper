import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import OpenAI from "openai"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { profileId, jobSkills, jobDescription, jobTitle } = body

    if (!profileId || profileId.trim() === "") {
      return NextResponse.json(
        { error: "Profile ID is required" },
        { status: 400 }
      )
    }

    if (!jobSkills || !Array.isArray(jobSkills) || jobSkills.length === 0) {
      return NextResponse.json(
        { error: "Job skills are required" },
        { status: 400 }
      )
    }

    // Fetch profile with skills
    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      select: {
        id: true,
        name: true,
        title: true,
        skills: true,
        overview: true,
      },
    })

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      )
    }

    const profileSkills = profile.skills || []

    // Simple calculation: percentage of job skills that match profile skills
    const normalizeSkill = (skill: string): string => {
      return skill.toLowerCase().trim().replace(/[^\w\s]/g, '')
    }

    const normalizedJobSkills = jobSkills.map(normalizeSkill)
    const normalizedProfileSkills = profileSkills.map(normalizeSkill)

    // Count exact matches
    const exactMatches = normalizedJobSkills.filter(jobSkill =>
      normalizedProfileSkills.some(profileSkill => profileSkill === jobSkill)
    )

    // Count partial matches (substring matches)
    const partialMatches = normalizedJobSkills.filter(jobSkill => {
      if (exactMatches.includes(jobSkill)) return false
      return normalizedProfileSkills.some(profileSkill =>
        profileSkill.includes(jobSkill) || jobSkill.includes(profileSkill)
      )
    })

    // Calculate base score: exact matches count more
    const exactMatchScore = (exactMatches.length / normalizedJobSkills.length) * 100
    const partialMatchScore = (partialMatches.length / normalizedJobSkills.length) * 50 // Partial matches count as 50%
    const baseScore = Math.min(100, exactMatchScore + partialMatchScore)

    // Use AI to refine the score if API key is available
    const openRouterApiKey = process.env.OPENROUTER_API_KEY
    if (openRouterApiKey && baseScore > 0) {
      try {
        const api = new OpenAI({
          baseURL: 'https://openrouter.ai/api/v1',
          apiKey: openRouterApiKey,
          defaultHeaders: {
            "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
            "X-Title": process.env.SITE_NAME || "AI Job Scraping",
          },
        })

        const prompt = `You are a skills matching expert. Analyze how well a freelancer's skills match a job's requirements.

Job Title: ${jobTitle || 'N/A'}
Job Description: ${jobDescription || 'N/A'}
Job Required Skills: ${jobSkills.join(', ')}

Freelancer Profile:
Name: ${profile.name}
Title: ${profile.title}
Overview: ${profile.overview || 'N/A'}
Freelancer Skills: ${profileSkills.join(', ')}

Based on the above information, provide a skills match score as a percentage (0-100) where:
- 100% = Perfect match, all required skills are present
- 75-99% = Very good match, most skills match
- 50-74% = Good match, some skills match
- 25-49% = Partial match, few skills match
- 0-24% = Poor match, minimal skills match

Consider:
1. Exact skill matches
2. Similar/equivalent skills (e.g., "React" matches "React.js", "JavaScript" matches "JS")
3. Related skills (e.g., "Frontend" includes "React", "Vue", etc.)
4. Experience level and depth of skills
5. Job requirements vs profile capabilities

Respond with ONLY a number between 0 and 100 (no text, no explanation, just the number).`

        const result = await api.chat.completions.create({
          model: 'openai/gpt-4o-mini',
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.3,
          max_tokens: 10,
        })

        const aiScoreText = result.choices?.[0]?.message?.content?.trim() || ''
        const aiScore = parseFloat(aiScoreText)

        if (!isNaN(aiScore) && aiScore >= 0 && aiScore <= 100) {
          // Blend base score (30%) with AI score (70%) for more accurate results
          const finalScore = Math.round((baseScore * 0.3) + (aiScore * 0.7))
          return NextResponse.json({
            matchScore: finalScore,
            baseScore: Math.round(baseScore),
            aiScore: Math.round(aiScore),
            exactMatches: exactMatches.length,
            partialMatches: partialMatches.length,
            totalJobSkills: normalizedJobSkills.length,
            matchedSkills: [...exactMatches, ...partialMatches],
          })
        }
      } catch (aiError) {
        console.error("AI skills match calculation error:", aiError)
        // Fall back to base score if AI fails
      }
    }

    // Return base score if AI is not available or fails
    return NextResponse.json({
      matchScore: Math.round(baseScore),
      baseScore: Math.round(baseScore),
      exactMatches: exactMatches.length,
      partialMatches: partialMatches.length,
      totalJobSkills: normalizedJobSkills.length,
      matchedSkills: [...exactMatches, ...partialMatches],
    })

  } catch (error) {
    console.error("Error calculating skills match:", error)
    return NextResponse.json(
      { error: "Failed to calculate skills match" },
      { status: 500 }
    )
  }
}

