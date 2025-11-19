import { prisma } from "@/lib/prisma"

interface PromptConfig {
  systemPrompt: string
  temperature: number
  maxTokens: number
  model: string
}

interface PromptVariables {
  template?: string
  profile?: string | object
  portfolio?: string | object
  portfolios?: Array<{ title: string; description: string }>
  caseStudies?: Array<{ title: string; description: string }>
  jobDescription?: string
  content?: string
  variant?: "short" | "technical" | "friendly"
  missingInfo?: string[]
}

/**
 * Fetches the current PromptConfig from the database
 */
export async function getPromptConfig(): Promise<PromptConfig> {
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

  return {
    systemPrompt: config.systemPrompt,
    temperature: config.temperature,
    maxTokens: config.maxTokens,
    model: config.model,
  }
}

/**
 * Processes a prompt template by replacing placeholders with actual values
 */
export function processPromptTemplate(template: string, variables: PromptVariables): string {
  let prompt = template

  // Format profile
  let profileText = ""
  if (variables.profile) {
    if (typeof variables.profile === "object") {
      const p = variables.profile as any
      profileText = `Name: ${p.name || "N/A"}\nTitle: ${p.title || "N/A"}\nOverview: ${p.overview || "N/A"}\nSkills: ${p.skills?.join(", ") || "N/A"}`
    } else {
      profileText = variables.profile
    }
  }

  // Format portfolio (single)
  let portfolioText = ""
  if (variables.portfolio) {
    if (typeof variables.portfolio === "object") {
      const p = variables.portfolio as any
      portfolioText = `Title: ${p.title || "N/A"}\nDescription: ${p.description || "N/A"}`
    } else {
      portfolioText = variables.portfolio
    }
  }

  // Format portfolios (multiple)
  let portfoliosText = ""
  if (variables.portfolios && variables.portfolios.length > 0) {
    portfoliosText = `IMPORTANT: You MUST reference these portfolio items:\n`
    variables.portfolios.forEach((p, idx) => {
      portfoliosText += `${idx + 1}. ${p.title}: ${p.description}\n`
    })
    portfoliosText += `\n`
  }

  // Format case studies
  let caseStudiesText = ""
  if (variables.caseStudies && variables.caseStudies.length > 0) {
    caseStudiesText = `IMPORTANT: You MUST reference these case studies in your proposal:\n`
    variables.caseStudies.forEach((cs, idx) => {
      caseStudiesText += `${idx + 1}. ${cs.title}: ${cs.description}\n`
    })
    caseStudiesText += `\n`
  }

  // Format missing info
  let missingInfoText = ""
  if (variables.missingInfo && variables.missingInfo.length > 0) {
    missingInfoText = `Note: The job description is missing some information. Consider adding a brief questions section at the end:\n`
    variables.missingInfo.forEach((info) => {
      missingInfoText += `- ${info}\n`
    })
    missingInfoText += `\n`
  }

  // Replace conditional blocks
  prompt = prompt.replace(/\{\{#if template\}\}([\s\S]*?)\{\{\/if\}\}/g, variables.template ? "$1" : "")
  prompt = prompt.replace(/\{\{#if profile\}\}([\s\S]*?)\{\{\/if\}\}/g, profileText ? "$1" : "")
  prompt = prompt.replace(/\{\{#if portfolio\}\}([\s\S]*?)\{\{\/if\}\}/g, portfolioText ? "$1" : "")
  prompt = prompt.replace(/\{\{#if portfolios\}\}([\s\S]*?)\{\{\/if\}\}/g, portfoliosText ? "$1" : "")
  prompt = prompt.replace(/\{\{#if caseStudies\}\}([\s\S]*?)\{\{\/if\}\}/g, caseStudiesText ? "$1" : "")
  prompt = prompt.replace(/\{\{#if jobDescription\}\}([\s\S]*?)\{\{\/if\}\}/g, variables.jobDescription ? "$1" : "")
  prompt = prompt.replace(/\{\{#if content\}\}([\s\S]*?)\{\{\/if\}\}/g, variables.content ? "$1" : "")
  prompt = prompt.replace(/\{\{#if missingInfo\}\}([\s\S]*?)\{\{\/if\}\}/g, missingInfoText ? "$1" : "")

  // Replace simple placeholders
  prompt = prompt.replace(/\{\{template\}\}/g, variables.template || "")
  prompt = prompt.replace(/\{\{profile\}\}/g, profileText)
  prompt = prompt.replace(/\{\{portfolio\}\}/g, portfolioText)
  prompt = prompt.replace(/\{\{portfolios\}\}/g, portfoliosText)
  prompt = prompt.replace(/\{\{caseStudies\}\}/g, caseStudiesText)
  prompt = prompt.replace(/\{\{jobDescription\}\}/g, variables.jobDescription || "")
  prompt = prompt.replace(/\{\{content\}\}/g, variables.content || "")
  prompt = prompt.replace(/\{\{missingInfo\}\}/g, missingInfoText)

  // Add variant-specific instructions if provided (for variants route)
  if (variables.variant) {
    const variantInstructions = {
      short: `\n\nGenerate a SHORT and PUNCHY proposal (150-250 words). Be direct, confident, and impactful. Focus on key value propositions.`,
      technical: `\n\nGenerate a TECHNICAL and DETAILED proposal (300-500 words). Showcase your technical expertise, methodologies, and specific solutions. Include technical details relevant to the project.`,
      friendly: `\n\nGenerate a FRIENDLY and WARM proposal (250-400 words). Use a conversational, approachable tone. Build rapport with the client while maintaining professionalism.`,
    }
    // Check if the prompt already ends with "Return only..." to avoid duplication
    if (!prompt.includes("Return only the proposal text")) {
      prompt += variantInstructions[variables.variant]
      prompt += `\n\nReturn only the proposal text without any additional commentary.`
    } else {
      // Insert variant instructions before the final return statement
      const returnIndex = prompt.lastIndexOf("Return only")
      if (returnIndex > 0) {
        prompt = prompt.slice(0, returnIndex) + variantInstructions[variables.variant] + "\n\n" + prompt.slice(returnIndex)
      } else {
        prompt += variantInstructions[variables.variant]
      }
    }
  }

  // Clean up multiple newlines (but preserve intentional double newlines)
  prompt = prompt.replace(/\n{4,}/g, "\n\n\n")
  prompt = prompt.replace(/\n{3}/g, "\n\n")

  return prompt.trim()
}

