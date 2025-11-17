import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

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

    // Find most relevant case studies and portfolios
    const relevantCaseStudies = findRelevantItems(caseStudies || [], jobSkills, jobCategory, 2)
    const relevantPortfolios = findRelevantItems(portfolios || [], jobSkills, jobCategory, 2)

    // Build base context
    let baseContext = `You are a professional freelancer writing job proposals. Generate professional proposals based on the following:\n\n`
    
    if (template) {
      baseContext += `Template/Base Content:\n${template}\n\n`
    }
    
    if (profile && typeof profile === 'object') {
      const profileInfo = `Name: ${profile.name || 'N/A'}\nTitle: ${profile.title || 'N/A'}\nOverview: ${profile.overview || 'N/A'}\nSkills: ${profile.skills?.join(', ') || 'N/A'}`
      baseContext += `Profile Information:\n${profileInfo}\n\n`
    }
    
    if (relevantCaseStudies.length > 0) {
      baseContext += `IMPORTANT: You MUST reference these case studies in your proposal:\n`
      relevantCaseStudies.forEach((cs, idx) => {
        baseContext += `${idx + 1}. ${cs.title}: ${cs.description}\n`
      })
      baseContext += `\n`
    }
    
    if (relevantPortfolios.length > 0) {
      baseContext += `IMPORTANT: You MUST reference these portfolio items:\n`
      relevantPortfolios.forEach((p, idx) => {
        baseContext += `${idx + 1}. ${p.title}: ${p.description}\n`
      })
      baseContext += `\n`
    }
    
    if (jobDescription) {
      baseContext += `Job Description:\n${jobDescription}\n\n`
    }
    
    baseContext += `Current Proposal Content:\n${content}\n\n`

    // Detect missing information
    const missingInfo = detectMissingInfo(jobDescription, jobSkills)
    if (missingInfo.length > 0) {
      baseContext += `Note: The job description is missing some information. Consider adding a brief questions section at the end:\n`
      missingInfo.forEach((info) => {
        baseContext += `- ${info}\n`
      })
      baseContext += `\n`
    }

    // Formatting rules
    const formattingRules = `CRITICAL FORMATTING RULES:\n`
      + `1. NEVER use em-dashes (—) or en-dashes (–). Use regular hyphens (-) or commas instead.\n`
      + `2. Use ONLY standard ASCII punctuation: . , ! ? : ; - ( ) [ ] " '\n`
      + `3. Keep the text clean and professional.\n\n`

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
        const generatedContent = await generateVariant(api, baseContext, formattingRules, variantConfigs[i].variant)
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
  baseContext: string,
  formattingRules: string,
  variant: "short" | "technical" | "friendly"
): Promise<string> {
  const variantInstructions = {
    short: `Generate a SHORT and PUNCHY proposal (150-250 words). Be direct, confident, and impactful. Focus on key value propositions.`,
    technical: `Generate a TECHNICAL and DETAILED proposal (300-500 words). Showcase your technical expertise, methodologies, and specific solutions. Include technical details relevant to the project.`,
    friendly: `Generate a FRIENDLY and WARM proposal (250-400 words). Use a conversational, approachable tone. Build rapport with the client while maintaining professionalism.`,
  }

  const prompt = baseContext + variantInstructions[variant] + "\n\n" + formattingRules
    + `Return only the proposal text without any additional commentary.`
  
  // Retry logic for rate limiting (429 errors)
  const maxRetries = 3
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      // Exponential backoff: wait 2^attempt seconds
      const waitTime = Math.pow(2, attempt) * 1000
      console.log(`Retrying variant ${variant} after ${waitTime}ms (attempt ${attempt + 1}/${maxRetries + 1})...`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }

    try {
      const result = await api.chat.completions.create({
        model: 'google/gemma-3n-e4b-it',
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        top_p: 0.7,
        frequency_penalty: 1,
        max_tokens: 2000,
      })

      return result.choices?.[0]?.message?.content || ""
    } catch (error: any) {
      console.error(`AIML API error for variant ${variant} (attempt ${attempt + 1}):`, error)
      
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
  throw new Error(`Failed to generate ${variant} variant after ${maxRetries + 1} attempts due to rate limiting.`)
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
  return text
    .replace(/—/g, ', ')
    .replace(/–/g, '-')
    .replace(/\u2014/g, ', ')
    .replace(/\u2013/g, '-')
    .replace(/\u2015/g, ', ')
}

