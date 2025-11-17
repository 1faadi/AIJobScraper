import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const jobData = await request.json()

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

    // Build prompt for job details generation
    let prompt = `You are an expert job analyst. Analyze the following job posting and provide detailed insights:\n\n`
    prompt += `Job Title: ${jobData.title || 'N/A'}\n`
    prompt += `Description: ${jobData.description || 'N/A'}\n`
    prompt += `Skills Required: ${jobData.skills?.join(', ') || 'N/A'}\n`
    prompt += `Budget: ${jobData.budget || 'N/A'}\n`
    prompt += `Level: ${jobData.level || 'N/A'}\n`
    prompt += `Client Rating: ${jobData.rating || 'N/A'}\n`
    prompt += `Hire Rate: ${jobData.hireRate || 'N/A'}%\n`
    prompt += `Payment Verified: ${jobData.paymentVerified ? 'Yes' : 'No'}\n\n`
    
    prompt += `Please provide a comprehensive analysis including:\n`
    prompt += `1. Key Requirements Summary\n`
    prompt += `2. Skills Assessment (what skills are most important)\n`
    prompt += `3. Project Scope Analysis\n`
    prompt += `4. Client Quality Indicators\n`
    prompt += `5. Proposal Strategy Recommendations\n`
    prompt += `6. Potential Challenges or Red Flags\n\n`
    prompt += `Format your response in clear sections with bullet points where appropriate.\n`
    prompt += `CRITICAL: Do NOT use em-dashes (—) or en-dashes (–). Use regular hyphens (-) or commas instead.\n`
    prompt += `Use only standard ASCII punctuation.\n\n`
    prompt += `Return only the analysis without any additional commentary.`

    console.log("Generating job details for job ID:", id)

    // Retry logic for rate limiting
    const maxRetries = 3
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (attempt > 0) {
        const waitTime = Math.pow(2, attempt) * 1000
        console.log(`Retrying after ${waitTime}ms (attempt ${attempt + 1}/${maxRetries + 1})...`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }

      try {
        const result = await api.chat.completions.create({
          model: 'google/gemma-3n-e4b-it',
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

        console.log("Job details generated successfully")
        
        let details = result.choices?.[0]?.message?.content || ""
        
        // Post-process to remove any em-dashes
        details = details
          .replace(/—/g, ', ')
          .replace(/–/g, '-')
          .replace(/\u2014/g, ', ')
          .replace(/\u2013/g, '-')
          .replace(/\u2015/g, ', ')

        return NextResponse.json({
          details,
          success: true,
        })
      } catch (error: any) {
        console.error(`AIML API error (attempt ${attempt + 1}):`, error)
        
        let errorMessage = "Failed to generate job details"
        let isRateLimit = false

        // Check if it's a rate limit error
        if (error?.status === 429 || error?.response?.status === 429 || error?.message?.includes('rate limit')) {
          isRateLimit = true
          errorMessage = "The AI model is currently rate-limited. Please try again in a few moments."
        } else if (error?.message) {
          errorMessage = error.message
        }

        if (isRateLimit && attempt < maxRetries) {
          continue
        }

        if (isRateLimit) {
          return NextResponse.json(
            { 
              error: errorMessage,
              errorCode: "RATE_LIMITED"
            },
            { status: 429 }
          )
        }

        return NextResponse.json(
          { error: errorMessage },
          { status: error?.status || 500 }
        )
      }
    }

    return NextResponse.json(
      { 
        error: "The AI model is currently unavailable due to rate limiting. Please try again in a few minutes.",
        errorCode: "RATE_LIMITED_EXHAUSTED"
      },
      { status: 429 }
    )

  } catch (error) {
    console.error("Error generating job details:", error)
    return NextResponse.json(
      { error: "Failed to generate job details" },
      { status: 500 }
    )
  }
}

