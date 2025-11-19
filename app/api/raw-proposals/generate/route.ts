import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const {
      rawJobText,
      templateId,
      profileId,
      portfolioIds = [],
      caseStudyIds = [],
    } = await request.json()

    if (!rawJobText || !templateId || !profileId) {
      return NextResponse.json(
        { error: "Missing required fields: rawJobText, templateId, and profileId are required" },
        { status: 400 }
      )
    }

    const openRouterApiKey = process.env.OPENROUTER_API_KEY
    if (!openRouterApiKey) {
      return NextResponse.json(
        { error: "OpenRouter API key is not configured" },
        { status: 500 }
      )
    }

    // Load template, profile, portfolios, and case studies from DB
    const [template, profile, portfolios, caseStudies] = await Promise.all([
      prisma.template.findUnique({ where: { id: templateId } }),
      prisma.profile.findUnique({ where: { id: profileId } }),
      portfolioIds.length > 0
        ? prisma.portfolio.findMany({ where: { id: { in: portfolioIds } } })
        : Promise.resolve([]),
      caseStudyIds.length > 0
        ? prisma.caseStudy.findMany({ where: { id: { in: caseStudyIds } } })
        : Promise.resolve([]),
    ])

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    const api = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: openRouterApiKey,
      defaultHeaders: {
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "X-Title": process.env.SITE_NAME || "AI Job Scraping",
      },
    })

    console.log("Building prompt for raw proposal generation...")

    // Build the prompt for AI proposal generation
    let prompt = `You are a professional freelancer writing a job proposal. Generate an enhanced, professional proposal based on the following information:\n\n`

    // Add template/base content
    prompt += `Template/Base Content:\n${template.content}\n\n`

    // Add profile information
    const profileInfo = `Name: ${profile.name || 'N/A'}\nTitle: ${profile.title || 'N/A'}\nOverview: ${profile.overview || 'N/A'}\nSkills: ${profile.skills?.join(', ') || 'N/A'}`
    prompt += `Profile Information:\n${profileInfo}\n\n`

    // Add portfolio items if selected
    if (portfolios.length > 0) {
      const portfolioInfo = portfolios
        .map((p) => `Title: ${p.title}\nDescription: ${p.description || 'N/A'}`)
        .join('\n\n')
      prompt += `Portfolio/Work Samples:\n${portfolioInfo}\n\n`
    }

    // Add case studies if selected
    if (caseStudies.length > 0) {
      const caseStudyInfo = caseStudies
        .map((c) => `Title: ${c.title}\nDescription: ${c.description || 'N/A'}`)
        .join('\n\n')
      prompt += `Case Studies:\n${caseStudyInfo}\n\n`
    }

    // Add raw job text
    prompt += `Job Description:\n${rawJobText}\n\n`

    prompt += `Please generate a professional, compelling proposal that:\n`
    prompt += `1. Addresses the job requirements effectively\n`
    prompt += `2. Highlights relevant skills and experience from the profile\n`
    prompt += `3. References relevant portfolio work and case studies when applicable\n`
    prompt += `4. Maintains a professional and engaging tone\n`
    prompt += `5. Is concise but comprehensive\n`
    prompt += `6. Directly addresses how you can help solve the client's needs\n\n`
    prompt += `CRITICAL FORMATTING RULES - YOU MUST FOLLOW THESE STRICTLY:\n`
    prompt += `1. NEVER use em-dashes (—) or en-dashes (–) anywhere in your response.\n`
    prompt += `2. NEVER use the Unicode characters U+2014 (em-dash) or U+2013 (en-dash).\n`
    prompt += `3. Instead of em-dashes or en-dashes, use:\n`
    prompt += `   - Regular hyphens (-) for compound words or ranges\n`
    prompt += `   - Commas (,) for pauses or separations\n`
    prompt += `   - Periods (.) for sentence breaks\n`
    prompt += `4. Use ONLY standard ASCII punctuation: . , ! ? : ; - ( ) [ ] " '\n`
    prompt += `5. Keep the text clean, professional, and free of any special Unicode dash characters.\n\n`
    prompt += `Example of what NOT to do: "I have experience—especially in web development—that makes me perfect for this role."\n`
    prompt += `Example of what TO do: "I have experience, especially in web development, that makes me perfect for this role."\n\n`
    prompt += `Return only the enhanced proposal text without any additional commentary or explanations.`

    console.log("Prompt built, length:", prompt.length)

    // Retry logic for rate limiting (429 errors)
    const maxRetries = 3

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (attempt > 0) {
        // Exponential backoff: wait 2^attempt seconds
        const waitTime = Math.pow(2, attempt) * 1000
        console.log(`Retrying after ${waitTime}ms (attempt ${attempt + 1}/${maxRetries + 1})...`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }

      try {
        // Call OpenRouter API
        const result = await api.chat.completions.create({
          model: 'openai/gpt-4o-mini',
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.7,
          top_p: 0.7,
          frequency_penalty: 1,
          max_tokens: 2000,
        })

        console.log("OpenRouter API response received")

        let generatedProposal = result.choices?.[0]?.message?.content || ""

        // Post-process to remove any em-dashes or en-dashes that might have slipped through
        generatedProposal = generatedProposal
          .replace(/—/g, ', ') // Replace em-dash (U+2014) with comma and space
          .replace(/–/g, '-')  // Replace en-dash (U+2013) with regular hyphen
          .replace(/\u2014/g, ', ') // Unicode em-dash
          .replace(/\u2013/g, '-')  // Unicode en-dash
          .replace(/\u2015/g, ', ') // Horizontal bar (sometimes used as dash)

        if (!generatedProposal) {
          console.warn("No proposal generated")
          return NextResponse.json(
            { error: "Failed to generate proposal" },
            { status: 500 }
          )
        }

        console.log("Generated proposal length:", generatedProposal.length)

        return NextResponse.json({
          proposal: generatedProposal,
          success: true,
        })
      } catch (error: any) {
        console.error(`OpenRouter API error (attempt ${attempt + 1}):`, error)

        let errorMessage = "Failed to generate proposal with AI"
        let statusCode = 500
        let isRateLimit = false

        // Check if it's a rate limit error
        if (error?.status === 429 || error?.response?.status === 429 || error?.message?.includes('rate limit')) {
          isRateLimit = true
          statusCode = 429
          errorMessage = "The AI model is currently rate-limited due to high demand. Please try again in a few moments."
        } else if (error?.message) {
          errorMessage = error.message
          if (error?.status) {
            statusCode = error.status
          }
        }

        // If it's a 429 (rate limit) and we have retries left, continue the loop
        if (isRateLimit && attempt < maxRetries) {
          continue
        }

        // For 429 errors after all retries, provide a user-friendly message
        if (isRateLimit) {
          return NextResponse.json(
            {
              error: errorMessage,
              errorCode: "RATE_LIMITED",
              retryAfter: 60 // Suggest waiting 60 seconds
            },
            { status: 429 }
          )
        }

        // For other errors, return immediately
        return NextResponse.json(
          { error: errorMessage },
          { status: statusCode }
        )
      }
    }

    // If we exhausted all retries
    return NextResponse.json(
      {
        error: "The AI model is currently unavailable due to rate limiting. Please try again in a few minutes.",
        errorCode: "RATE_LIMITED_EXHAUSTED"
      },
      { status: 429 }
    )

  } catch (error) {
    console.error("Error generating raw proposal:", error)
    return NextResponse.json(
      { error: "Failed to generate proposal" },
      { status: 500 }
    )
  }
}

