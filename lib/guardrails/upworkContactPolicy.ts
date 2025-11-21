/**
 * Upwork Contact Policy Guardrails
 * 
 * This module provides utilities to:
 * 1. Detect if a job description requests external contact information
 * 2. Sanitize proposals to remove any contact information that violates Upwork's terms
 */

export interface ContactCheckResult {
  requested: boolean
  matchedPhrases: string[]
}

export interface SanitizedTextResult {
  sanitizedText: string
  foundContacts: {
    type: "email" | "phone" | "website" | "social" | "address"
    value: string
  }[]
}

/**
 * Checks if a job description explicitly requests external contact information
 */
export function jobRequestsExternalContact(jobText: string): ContactCheckResult {
  if (!jobText || typeof jobText !== "string") {
    return { requested: false, matchedPhrases: [] }
  }

  // Normalize: lowercase, remove extra whitespace
  const normalized = jobText.toLowerCase().replace(/\s+/g, " ").trim()

  // Patterns that indicate a request for contact information
  const contactPatterns: Array<{ pattern: RegExp; phrase: string }> = [
    // Email patterns
    { pattern: /\b(email|e-mail|mail me|send your email|your email|email address|email id)\b/i, phrase: "email" },
    { pattern: /\b(contact me|contact you|reach out|reach me|get in touch)\b/i, phrase: "contact" },
    
    // Phone patterns
    { pattern: /\b(phone|phone number|mobile|mobile number|cell|cell phone|telephone|call me|call you|contact number)\b/i, phrase: "phone" },
    { pattern: /\b(whatsapp|whats app|telegram|skype|zoom|wechat|viber|signal)\b/i, phrase: "messaging app" },
    
    // Website/portfolio patterns
    { pattern: /\b(website|portfolio|portfolio website|company website|your website|send me your website|share your website)\b/i, phrase: "website" },
    { pattern: /\b(linkedin|linked in|social media|social profile)\b/i, phrase: "social media" },
    
    // Direct contact patterns
    { pattern: /\b(direct contact|off platform|outside upwork|off-upwork|move communication|communicate outside)\b/i, phrase: "direct contact" },
    { pattern: /\b(share your contact|contact details|contact info|contact information)\b/i, phrase: "contact details" },
    
    // Location/address patterns (only when clearly in contact context)
    { pattern: /\b(your address|physical address|location|where are you|based in|located in)\b/i, phrase: "location/address" },
    { pattern: /\b(city|country|timezone|time zone)\s+(for|to|where|contact|reach)\b/i, phrase: "location for contact" },
  ]

  const matchedPhrases: string[] = []

  for (const { pattern, phrase } of contactPatterns) {
    if (pattern.test(normalized)) {
      matchedPhrases.push(phrase)
    }
  }

  return {
    requested: matchedPhrases.length > 0,
    matchedPhrases: [...new Set(matchedPhrases)], // Remove duplicates
  }
}

/**
 * Sanitizes text to remove external contact information while preserving GitHub links
 */
export function sanitizeExternalContacts(
  text: string,
  options?: { allowGitHub?: boolean }
): SanitizedTextResult {
  if (!text || typeof text !== "string") {
    return { sanitizedText: text || "", foundContacts: [] }
  }

  const allowGitHub = options?.allowGitHub !== false // Default to true
  let sanitized = text
  const foundContacts: SanitizedTextResult["foundContacts"] = []

  // Email detection: [A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}
  const emailRegex = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi
  const emails = text.match(emailRegex) || []
  emails.forEach((email) => {
    foundContacts.push({ type: "email", value: email })
    sanitized = sanitized.replace(email, "[Contact information removed per Upwork policy]")
  })

  // Phone number detection: various formats
  // Matches: +1-234-567-8900, (123) 456-7890, 123-456-7890, +1234567890, etc.
  const phoneRegex = /(\+?\d{1,4}[\s\-]?)?\(?\d{1,4}\)?[\s\-]?\d{1,4}[\s\-]?\d{1,9}/g
  const phones = text.match(phoneRegex) || []
  // Filter out false positives (years, IDs, etc.) - phone numbers typically have 7-15 digits total
  phones.forEach((phone) => {
    const digitsOnly = phone.replace(/\D/g, "")
    // Only consider it a phone if it has 7-15 digits (reasonable phone number range)
    if (digitsOnly.length >= 7 && digitsOnly.length <= 15) {
      // Additional check: not a year (1900-2099) or common false positives
      if (!/^(19|20)\d{2}$/.test(digitsOnly) && !/^\d{4,6}$/.test(digitsOnly)) {
        foundContacts.push({ type: "phone", value: phone })
        sanitized = sanitized.replace(phone, "[Contact information removed per Upwork policy]")
      }
    }
  })

  // Website/URL detection (excluding GitHub if allowed)
  // Matches: http(s)://..., www.example.com, example.com, etc.
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-z0-9-]+\.(com|io|net|org|co|dev|app|ai|me|info|biz|us|uk|ca|au|de|fr|es|it|nl|se|no|dk|fi|pl|cz|at|ch|be|ie|pt|gr|ru|jp|cn|in|br|mx|ar|za|ae|sa|tr|kr|tw|hk|sg|my|th|id|ph|vn|nz)[^\s]*)/gi
  const urlMatches = [...text.matchAll(urlRegex)]
  urlMatches.forEach((match) => {
    const url = match[0]
    const normalizedUrl = url.toLowerCase()
    // Allow GitHub URLs if specified
    if (allowGitHub && normalizedUrl.includes("github.com")) {
      return // Skip GitHub URLs
    }
    // Only process if URL still exists in sanitized text (hasn't been replaced yet)
    if (sanitized.includes(url)) {
      foundContacts.push({ type: "website", value: url })
      // Use string replacement (safer than regex for URLs with special chars)
      sanitized = sanitized.split(url).join("[Contact information removed per Upwork policy]")
    }
  })

  // Social handles detection (only when clearly contact-related)
  // Look for patterns like "Telegram: @username", "WhatsApp: @username", etc.
  const socialContextRegex = /\b(telegram|whatsapp|skype|wechat|viber|signal|discord|slack)\s*:?\s*@?([a-z0-9_\-]+)/gi
  const socialMatches = [...text.matchAll(socialContextRegex)]
  socialMatches.forEach((match) => {
    const fullMatch = match[0]
    foundContacts.push({ type: "social", value: fullMatch })
    sanitized = sanitized.replace(fullMatch, "[Contact information removed per Upwork policy]")
  })

  // Address/location detection (only when preceded by contact cues)
  const addressContextRegex = /\b(based in|located in|address|physical location|my location|i am in|i'm in|from)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,?\s*(?:[A-Z][a-z]+,?\s*)?(?:USA|US|United States|UK|United Kingdom|Canada|Australia|Germany|France|Spain|Italy|Netherlands|Sweden|Norway|Denmark|Finland|Poland|Czech Republic|Austria|Switzerland|Belgium|Ireland|Portugal|Greece|Russia|Japan|China|India|Brazil|Mexico|Argentina|South Africa|UAE|Saudi Arabia|Turkey|South Korea|Taiwan|Hong Kong|Singapore|Malaysia|Thailand|Indonesia|Philippines|Vietnam|New Zealand|Europe|Asia|America|North America|South America|Africa|Middle East|Oceania)?)/gi
  const addressMatches = [...text.matchAll(addressContextRegex)]
  addressMatches.forEach((match) => {
    // Only capture if it's clearly a location mention in contact context
    const fullMatch = match[0]
    // Avoid false positives - check if it's not just a general location mention
    if (fullMatch.length > 10 && fullMatch.length < 100) {
      foundContacts.push({ type: "address", value: fullMatch })
      sanitized = sanitized.replace(fullMatch, "[Contact information removed per Upwork policy]")
    }
  })

  // Clean up multiple consecutive replacements
  sanitized = sanitized.replace(/\[Contact information removed per Upwork policy\](?:\s*\[Contact information removed per Upwork policy\])+/g, "[Contact information removed per Upwork policy]")

  // If we found contacts and the text was modified, add a note if the job explicitly requested contact
  // (This is handled at the prompt level, so we just sanitize here)

  return {
    sanitizedText: sanitized,
    foundContacts,
  }
}

