import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { getPromptConfig, processPromptTemplate } from "@/lib/prompt-helper"
import { jobRequestsExternalContact, sanitizeExternalContacts } from "@/lib/guardrails/upworkContactPolicy"

export async function POST(request: NextRequest) {
  try {
    const { template, profile, portfolio, content, jobDescription } = await request.json()

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    const openRouterApiKey = process.env.OPENROUTER_API_KEY
    if (!openRouterApiKey) {
      return NextResponse.json(
        { error: "OpenRouter API key is not configured" },
        { status: 500 }
      )
    }

    // Fetch prompt configuration
    const promptConfig = await getPromptConfig()

    const api = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: openRouterApiKey,
      defaultHeaders: {
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "X-Title": process.env.SITE_NAME || "AI Job Scraping",
      },
    })

    console.log("Building prompt for proposal generation using PromptConfig...")
    console.log("Input data:", {
      hasTemplate: !!template,
      hasProfile: !!profile,
      hasPortfolio: !!portfolio,
      hasJobDescription: !!jobDescription,
      hasContent: !!content,
    })
    
    // Check if job requests external contact information
    const contactCheck = jobRequestsExternalContact(jobDescription || "")
    if (contactCheck.requested) {
      console.log("Job requests external contact info. Matched phrases:", contactCheck.matchedPhrases)
    }
    
    // Build the prompt using the configured template
    const prompt = processPromptTemplate(promptConfig.systemPrompt, {
      template,
      profile,
      portfolio,
      jobDescription,
      content,
      contactCheck,
    })

    console.log("Prompt built, length:", prompt.length)
    console.log("Prompt preview (first 500 chars):", prompt.substring(0, 500))

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
        // Call OpenRouter API using configured settings
        const result = await api.chat.completions.create({
          model: promptConfig.model,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: promptConfig.temperature,
          top_p: 0.7,
          frequency_penalty: 1,
          max_tokens: promptConfig.maxTokens,
        })

        console.log("OpenRouter API response received")
        
        let generatedProposal = result.choices?.[0]?.message?.content || content
        
        // Post-process to remove any em-dashes or en-dashes that might have slipped through
        generatedProposal = generatedProposal
          .replace(/—/g, ', ') // Replace em-dash (U+2014) with comma and space
          .replace(/–/g, '-')  // Replace en-dash (U+2013) with regular hyphen
          .replace(/\u2014/g, ', ') // Unicode em-dash
          .replace(/\u2013/g, '-')  // Unicode en-dash
          .replace(/\u2015/g, ', ') // Horizontal bar (sometimes used as dash)
        
        // Remove any template variables or placeholders that might have been generated
        generatedProposal = generatedProposal
          .replace(/\{\{[^}]+\}\}/g, '') // Remove {{variable}} patterns
          .replace(/\[Your Name\]/gi, '')
          .replace(/\[X years?\]/gi, '')
          .replace(/\[link to[^\]]+\]/gi, '')
          .replace(/\[Answer question \d+\]/gi, '')
          .replace(/\[specific skills[^\]]+\]/gi, '')
          .replace(/\[number\]/gi, '')
          .replace(/\[details\]/gi, '')
          .replace(/\n{3,}/g, '\n\n') // Clean up excessive newlines
        
        // Sanitize external contact information (guardrail)
        const { sanitizedText, foundContacts } = sanitizeExternalContacts(generatedProposal, { allowGitHub: true })
        if (foundContacts.length > 0) {
          console.warn(`LLM tried to output contact info, sanitized ${foundContacts.length} items:`, foundContacts.map(c => `${c.type}: ${c.value.substring(0, 50)}`))
        }
        generatedProposal = sanitizedText
        
        if (!generatedProposal || generatedProposal === content) {
          console.warn("No new proposal generated, using original content")
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
    console.error("Error generating proposal:", error)
    return NextResponse.json(
      { error: "Failed to generate proposal" },
      { status: 500 }
    )
  }
}
