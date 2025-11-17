import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

export async function POST(request: NextRequest) {
  try {
    const { proposal } = await request.json()

    if (!proposal) {
      return NextResponse.json({ error: "Proposal is required" }, { status: 400 })
    }

    const aimlApiKey = process.env.AIML_API_KEY
    if (!aimlApiKey) {
      return NextResponse.json(
        { error: "AIML API key is not configured" },
        { status: 500 }
      )
    }

    const api = new OpenAI({
      baseURL: 'https://api.aimlapi.com/v1',
      apiKey: aimlApiKey,
    })

    // Check length (Upwork limit is typically 5000 characters)
    const length = proposal.length
    const wordCount = proposal.split(/\s+/).filter(Boolean).length
    const lengthScore = length <= 5000 ? 100 : Math.max(0, 100 - ((length - 5000) / 50))
    const lengthStatus = length <= 5000 ? "pass" : length <= 6000 ? "warning" : "fail"

    // Grammar and quality check via AI
    const qualityPrompt = `Analyze this job proposal and provide a quality score (0-100) and feedback:\n\n`
      + `Proposal:\n${proposal}\n\n`
      + `Evaluate:\n`
      + `1. Grammar and spelling (0-25 points)\n`
      + `2. Professional tone - confident, not desperate (0-25 points)\n`
      + `3. Clarity and structure (0-25 points)\n`
      + `4. Value proposition and persuasiveness (0-25 points)\n\n`
      + `Respond in JSON format:\n`
      + `{\n`
      + `  "grammarScore": <0-25>,\n`
      + `  "toneScore": <0-25>,\n`
      + `  "clarityScore": <0-25>,\n`
      + `  "valueScore": <0-25>,\n`
      + `  "totalScore": <0-100>,\n`
      + `  "grammarIssues": ["issue1", "issue2"],\n`
      + `  "toneFeedback": "feedback text",\n`
      + `  "suggestions": ["suggestion1", "suggestion2"]\n`
      + `}`

    let qualityData = {
      grammarScore: 20,
      toneScore: 20,
      clarityScore: 20,
      valueScore: 20,
      totalScore: 80,
      grammarIssues: [] as string[],
      toneFeedback: "Tone appears professional.",
      suggestions: [] as string[],
    }

    try {
      const result = await api.chat.completions.create({
        model: 'google/gemma-3n-e4b-it',
        messages: [{ role: "user", content: qualityPrompt }],
        temperature: 0.7,
        top_p: 0.7,
        frequency_penalty: 1,
        max_tokens: 2000,
      })

      const content = result.choices?.[0]?.message?.content || ""
      
      // Try to parse JSON from response
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          qualityData = { ...qualityData, ...JSON.parse(jsonMatch[0]) }
        }
      } catch (e) {
        console.warn("Failed to parse quality check JSON, using defaults")
      }
    } catch (error) {
      console.error("Error calling AIML API for quality check:", error)
      // Use default quality data if API call fails
    }

    // Calculate overall proposal score (weighted)
    const overallScore = Math.round(
      (qualityData.totalScore * 0.7) + (lengthScore * 0.3)
    )

    const scoreStatus = overallScore >= 85 ? "excellent" : overallScore >= 70 ? "good" : overallScore >= 60 ? "fair" : "poor"

    return NextResponse.json({
      score: overallScore,
      scoreStatus,
      breakdown: {
        grammar: {
          score: qualityData.grammarScore,
          maxScore: 25,
          issues: qualityData.grammarIssues,
        },
        tone: {
          score: qualityData.toneScore,
          maxScore: 25,
          feedback: qualityData.toneFeedback,
        },
        clarity: {
          score: qualityData.clarityScore,
          maxScore: 25,
        },
        value: {
          score: qualityData.valueScore,
          maxScore: 25,
        },
        length: {
          score: Math.round(lengthScore),
          maxScore: 100,
          characterCount: length,
          wordCount,
          status: lengthStatus,
          limit: 5000,
        },
      },
      suggestions: qualityData.suggestions,
      success: true,
    })

  } catch (error) {
    console.error("Error checking proposal quality:", error)
    return NextResponse.json(
      { error: "Failed to check proposal quality" },
      { status: 500 }
    )
  }
}

