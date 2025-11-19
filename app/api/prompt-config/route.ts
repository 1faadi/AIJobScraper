import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updatePromptConfigSchema = z.object({
  name: z.string().min(1).optional(),
  systemPrompt: z.string().min(1),
  temperature: z.number().min(0).max(1),
  maxTokens: z.number().int().min(100).max(2000),
  model: z.string().min(1),
})

export async function GET(request: NextRequest) {
  try {
    // Get the first (and only) prompt config, or create default if none exists
    let config = await prisma.promptConfig.findFirst()

    if (!config) {
      // Create default config matching the current proposal generation instructions
      config = await prisma.promptConfig.create({
        data: {
          name: "Default Proposal Prompt",
          systemPrompt: `You are a professional freelancer writing a job proposal. Generate a COMPLETE, READY-TO-USE proposal based on the information provided below. Write the actual proposal text with real content - DO NOT use placeholders, template variables, or brackets like {{variable}}.

{{#if template}}
Template/Base Content (use as inspiration, but write your own complete proposal):
{{template}}

{{/if}}
{{#if profile}}
Profile Information:
{{profile}}

{{/if}}
{{#if portfolio}}
Portfolio/Work Sample:
{{portfolio}}

{{/if}}
{{#if portfolios}}
{{portfolios}}
{{/if}}
{{#if caseStudies}}
{{caseStudies}}
{{/if}}
{{#if jobDescription}}
Job Description:
{{jobDescription}}

{{/if}}
{{#if content}}
Current Proposal Content (enhance and improve this):
{{content}}

{{/if}}
{{#if missingInfo}}
{{missingInfo}}
{{/if}}
CRITICAL INSTRUCTIONS:
1. Write a COMPLETE proposal with actual content - use the profile name, skills, and experience provided above
2. DO NOT use placeholders like {{client_details}}, {{job_summary}}, {{profile_profile}}, [Your Name], [X years], [link to...], etc.
3. Use the actual information from the profile, portfolio, and job description provided
4. Address the job requirements effectively using the specific details provided
5. Highlight relevant skills and experience from the profile information above
6. Reference specific portfolio work or case studies when mentioned above
7. Maintain a professional and engaging tone
8. Be concise but comprehensive (400-500 words)
9. Directly address how you can help solve the client's needs based on the job description

CRITICAL FORMATTING RULES - YOU MUST FOLLOW THESE STRICTLY:
1. NEVER use em-dashes (—) or en-dashes (–) anywhere in your response.
2. NEVER use the Unicode characters U+2014 (em-dash) or U+2013 (en-dash).
3. Instead of em-dashes or en-dashes, use:
   - Regular hyphens (-) for compound words or ranges
   - Commas (,) for pauses or separations
   - Periods (.) for sentence breaks
4. Use ONLY standard ASCII punctuation: . , ! ? : ; - ( ) [ ] " '
5. Keep the text clean, professional, and free of any special Unicode dash characters.

Example of what NOT to do: "I have experience—especially in web development—that makes me perfect for this role."
Example of what TO do: "I have experience, especially in web development, that makes me perfect for this role."

IMPORTANT: Write the complete proposal text now. Use real information from the data provided above. Do not include any placeholders, brackets, or template variables in your response.`,
          temperature: 0.7,
          maxTokens: 2000,
          model: "openai/gpt-4o-mini",
        },
      })
    }

    return NextResponse.json({
      config: {
        id: config.id,
        name: config.name,
        systemPrompt: config.systemPrompt,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        model: config.model,
        updatedAt: config.updatedAt.toISOString(),
        createdAt: config.createdAt.toISOString(),
      },
    })
  } catch (error) {
    console.error("Error fetching prompt config:", error)
    return NextResponse.json({ error: "Failed to fetch prompt configuration" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const validationResult = updatePromptConfigSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { name, systemPrompt, temperature, maxTokens, model } = validationResult.data

    // Get existing config or create if none exists
    let config = await prisma.promptConfig.findFirst()

    if (config) {
      // Update existing config
      config = await prisma.promptConfig.update({
        where: { id: config.id },
        data: {
          ...(name && { name }),
          systemPrompt,
          temperature,
          maxTokens,
          model,
        },
      })
    } else {
      // Create new config
      config = await prisma.promptConfig.create({
        data: {
          name: name || "Default Proposal Prompt",
          systemPrompt,
          temperature,
          maxTokens,
          model,
        },
      })
    }

    return NextResponse.json({
      config: {
        id: config.id,
        name: config.name,
        systemPrompt: config.systemPrompt,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        model: config.model,
        updatedAt: config.updatedAt.toISOString(),
        createdAt: config.createdAt.toISOString(),
      },
      success: true,
    })
  } catch (error) {
    console.error("Error updating prompt config:", error)
    return NextResponse.json({ error: "Failed to update prompt configuration" }, { status: 500 })
  }
}

