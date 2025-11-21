import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { getPromptConfig, processPromptTemplate } from "@/lib/prompt-helper"
import { jobRequestsExternalContact, sanitizeExternalContacts } from "@/lib/guardrails/upworkContactPolicy"

interface ProposalVariant {
  variant: "short" | "technical" | "friendly"
  title: string
  description: string
  content: string
}

export async function POST(request: NextRequest) {
  try {
    const { 
      template, 
      profile, 
      portfolios, 
      caseStudies, 
      content, 
      jobDescription,
      jobSkills,
      jobCategory 
    } = await request.json()

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

    // Find most relevant case studies and portfolios
    const relevantCaseStudies = findRelevantItems(caseStudies || [], jobSkills, jobCategory, 2)
    const relevantPortfolios = findRelevantItems(portfolios || [], jobSkills, jobCategory, 2)

    // Detect missing information
    const missingInfo = detectMissingInfo(jobDescription, jobSkills)

    // Check if job requests external contact information
    const contactCheck = jobRequestsExternalContact(jobDescription || "")
    if (contactCheck.requested) {
      console.log("Job requests external contact info. Matched phrases:", contactCheck.matchedPhrases)
    }

    console.log("Building prompts for variant generation using PromptConfig...")
    console.log("Input data:", {
      hasTemplate: !!template,
      hasProfile: !!profile,
      portfoliosCount: portfolios?.length || 0,
      caseStudiesCount: caseStudies?.length || 0,
      hasJobDescription: !!jobDescription,
      hasContent: !!content,
    })

    // Generate 3 variants with delay between requests to avoid rate limiting
    const variants: ProposalVariant[] = []
    
    const variantConfigs = [
      {
        variant: "short" as const,
        title: "Short & Punchy",
        description: "Concise, impactful, gets straight to the point",
      },
      {
        variant: "technical" as const,
        title: "Technical Detail",
        description: "Detailed, technical, showcases expertise",
      },
      {
        variant: "friendly" as const,
        title: "Friendly Tone",
        description: "Warm, approachable, builds rapport",
      },
    ]

    // Generate variants sequentially with small delays to avoid rate limiting
    for (let i = 0; i < variantConfigs.length; i++) {
      if (i > 0) {
        // Add a small delay between requests (500ms)
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      
      try {
        const generatedContent = await generateVariant(
          api,
          promptConfig,
          {
            template,
            profile,
            portfolios: relevantPortfolios,
            caseStudies: relevantCaseStudies,
            jobDescription,
            content,
            variant: variantConfigs[i].variant,
            missingInfo,
            contactCheck,
          }
        )
        variants.push({
          variant: variantConfigs[i].variant,
          title: variantConfigs[i].title,
          description: variantConfigs[i].description,
          content: generatedContent,
        })
      } catch (error) {
        console.error(`Error generating ${variantConfigs[i].variant} variant:`, error)
        // Continue with other variants even if one fails - use original content as fallback
        variants.push({
          variant: variantConfigs[i].variant,
          title: variantConfigs[i].title,
          description: variantConfigs[i].description,
          content: content || "Failed to generate variant. Please try again.", // Use original content as fallback
        })
      }
    }

    // Post-process all variants
    variants.forEach((v) => {
      v.content = cleanProposal(v.content)
    })

    return NextResponse.json({
      variants,
      relevantCaseStudies: relevantCaseStudies.map(cs => ({ id: cs.id, title: cs.title })),
      relevantPortfolios: relevantPortfolios.map(p => ({ id: p.id, title: p.title })),
      missingInfo,
      success: true,
    })

  } catch (error) {
    console.error("Error generating proposal variants:", error)
    return NextResponse.json(
      { error: "Failed to generate proposal variants" },
      { status: 500 }
    )
  }
}

async function generateVariant(
  api: OpenAI,
  promptConfig: { systemPrompt: string; temperature: number; maxTokens: number; model: string },
  variables: {
    template?: string
    profile?: string | object
    portfolios?: Array<{ title: string; description: string }>
    caseStudies?: Array<{ title: string; description: string }>
    jobDescription?: string
    content?: string
    variant: "short" | "technical" | "friendly"
    missingInfo?: string[]
    contactCheck?: { requested: boolean; matchedPhrases: string[] }
  }
): Promise<string> {
  // Build the prompt using the configured template with variant-specific instructions
  const prompt = processPromptTemplate(promptConfig.systemPrompt, variables)
  
  console.log(`Prompt for ${variables.variant} variant built, length:`, prompt.length)
  console.log(`Prompt preview (first 500 chars):`, prompt.substring(0, 500))
  
  // Retry logic for rate limiting (429 errors)
  const maxRetries = 3
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      // Exponential backoff: wait 2^attempt seconds
      const waitTime = Math.pow(2, attempt) * 1000
      console.log(`Retrying variant ${variables.variant} after ${waitTime}ms (attempt ${attempt + 1}/${maxRetries + 1})...`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }

    try {
      const result = await api.chat.completions.create({
        model: promptConfig.model,
        messages: [{ role: "user", content: prompt }],
        temperature: promptConfig.temperature,
        top_p: 0.7,
        frequency_penalty: 1,
        max_tokens: promptConfig.maxTokens,
      })

      let content = result.choices?.[0]?.message?.content || ""
      
      // Post-process to remove any template variables or placeholders
      content = content
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
      const { sanitizedText, foundContacts } = sanitizeExternalContacts(content, { allowGitHub: true })
      if (foundContacts.length > 0) {
        console.warn(`LLM tried to output contact info in ${variables.variant} variant, sanitized ${foundContacts.length} items`)
      }
      content = sanitizedText
      
      return content
    } catch (error: any) {
      console.error(`OpenRouter API error for variant ${variables.variant} (attempt ${attempt + 1}):`, error)
      
      // Check if it's a rate limit error
      const isRateLimit = error?.status === 429 || error?.response?.status === 429 || error?.message?.includes('rate limit')
      
      // If it's a 429 (rate limit) and we have retries left, continue the loop
      if (isRateLimit && attempt < maxRetries) {
        continue
      }

      // For 429 errors after all retries, throw a more descriptive error
      if (isRateLimit) {
        throw new Error(`Rate limited: The AI model is currently rate-limited. Please try again in a few moments.`)
      }

      // For other errors, throw immediately
      throw new Error(`API error: ${error?.status || 'Unknown'} - ${error?.message?.substring(0, 100) || 'Failed to generate variant'}`)
    }
  }

  // If we exhausted all retries
  throw new Error(`Failed to generate ${variables.variant} variant after ${maxRetries + 1} attempts due to rate limiting.`)
}

function findRelevantItems(
  items: Array<{ id: string; title: string; description: string; category?: string }>,
  jobSkills: string[],
  jobCategory: string,
  limit: number
): Array<{ id: string; title: string; description: string }> {
  // Simple relevance scoring based on category and keywords
  const scored = items.map((item) => {
    let score = 0
    const itemText = `${item.title} ${item.description}`.toLowerCase()
    
    // Category match
    if (item.category && jobCategory && item.category.toLowerCase().includes(jobCategory.toLowerCase())) {
      score += 10
    }
    
    // Skill keyword matching
    jobSkills?.forEach((skill) => {
      if (itemText.includes(skill.toLowerCase())) {
        score += 5
      }
    })
    
    return { ...item, score }
  })

  return scored
    .sort((a, b) => (b as any).score - (a as any).score)
    .slice(0, limit)
    .map(({ score, ...item }) => item)
}

function detectMissingInfo(jobDescription: string, jobSkills: string[]): string[] {
  const missing: string[] = []
  const desc = (jobDescription || "").toLowerCase()

  if (!desc.includes("tech") && !desc.includes("stack") && !desc.includes("technology")) {
    missing.push("What technology stack or tools do you prefer?")
  }

  if (!desc.includes("timeline") && !desc.includes("deadline") && !desc.includes("when")) {
    missing.push("What is the expected timeline or deadline for this project?")
  }

  if (!desc.includes("budget") && !desc.includes("rate") && !desc.includes("payment")) {
    missing.push("What is your budget range for this project?")
  }

  if (!desc.includes("team") && !desc.includes("collaborat")) {
    missing.push("Will I be working independently or as part of a team?")
  }

  return missing
}

function cleanProposal(text: string): string {
  let cleaned = text
    .replace(/—/g, ', ')
    .replace(/–/g, '-')
    .replace(/\u2014/g, ', ')
    .replace(/\u2013/g, '-')
    .replace(/\u2015/g, ', ')
    // Remove any template variables or placeholders
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
  const { sanitizedText } = sanitizeExternalContacts(cleaned, { allowGitHub: true })
  return sanitizedText
}

