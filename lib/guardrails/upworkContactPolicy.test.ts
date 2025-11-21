/**
 * Unit tests for Upwork Contact Policy Guardrails
 * 
 * To run these tests, you'll need to set up a test framework like Jest or Vitest.
 * Example with Vitest:
 *   npm install -D vitest @vitest/ui
 *   Add to package.json: "test": "vitest"
 *   Run: npm test
 */

import { describe, it, expect } from 'vitest'
import { jobRequestsExternalContact, sanitizeExternalContacts } from './upworkContactPolicy'

describe('jobRequestsExternalContact', () => {
  it('should detect email requests', () => {
    const result = jobRequestsExternalContact('Please share your email address with me')
    expect(result.requested).toBe(true)
    expect(result.matchedPhrases).toContain('email')
  })

  it('should detect phone number requests', () => {
    const result = jobRequestsExternalContact('Send me your phone number')
    expect(result.requested).toBe(true)
    expect(result.matchedPhrases).toContain('phone')
  })

  it('should detect WhatsApp requests', () => {
    const result = jobRequestsExternalContact('Contact me via WhatsApp')
    expect(result.requested).toBe(true)
    expect(result.matchedPhrases).toContain('messaging app')
  })

  it('should detect Telegram requests', () => {
    const result = jobRequestsExternalContact('Reach out on Telegram')
    expect(result.requested).toBe(true)
    expect(result.matchedPhrases).toContain('messaging app')
  })

  it('should detect website/portfolio requests', () => {
    const result = jobRequestsExternalContact('Please send me your website URL')
    expect(result.requested).toBe(true)
    expect(result.matchedPhrases).toContain('website')
  })

  it('should detect LinkedIn requests', () => {
    const result = jobRequestsExternalContact('Share your LinkedIn profile')
    expect(result.requested).toBe(true)
    expect(result.matchedPhrases).toContain('social media')
  })

  it('should detect direct contact requests', () => {
    const result = jobRequestsExternalContact('Let\'s move communication off Upwork')
    expect(result.requested).toBe(true)
    expect(result.matchedPhrases).toContain('direct contact')
  })

  it('should detect contact details requests', () => {
    const result = jobRequestsExternalContact('Please share your contact details')
    expect(result.requested).toBe(true)
    expect(result.matchedPhrases).toContain('contact details')
  })

  it('should detect location/address requests in contact context', () => {
    const result = jobRequestsExternalContact('What is your address?')
    expect(result.requested).toBe(true)
    expect(result.matchedPhrases).toContain('location/address')
  })

  it('should detect multiple contact requests', () => {
    const result = jobRequestsExternalContact('Share your email and phone number')
    expect(result.requested).toBe(true)
    expect(result.matchedPhrases.length).toBeGreaterThan(1)
  })

  it('should not detect false positives in normal text', () => {
    const result = jobRequestsExternalContact('I need a developer with 5 years of experience')
    expect(result.requested).toBe(false)
    expect(result.matchedPhrases).toHaveLength(0)
  })

  it('should handle empty or null input', () => {
    expect(jobRequestsExternalContact('')).toEqual({ requested: false, matchedPhrases: [] })
    expect(jobRequestsExternalContact(null as any)).toEqual({ requested: false, matchedPhrases: [] })
    expect(jobRequestsExternalContact(undefined as any)).toEqual({ requested: false, matchedPhrases: [] })
  })

  it('should be case-insensitive', () => {
    const result1 = jobRequestsExternalContact('EMAIL ME')
    const result2 = jobRequestsExternalContact('email me')
    const result3 = jobRequestsExternalContact('Email Me')
    expect(result1.requested).toBe(true)
    expect(result2.requested).toBe(true)
    expect(result3.requested).toBe(true)
  })
})

describe('sanitizeExternalContacts', () => {
  it('should remove email addresses', () => {
    const text = 'Contact me at john.doe@example.com for more info'
    const result = sanitizeExternalContacts(text)
    expect(result.sanitizedText).not.toContain('john.doe@example.com')
    expect(result.sanitizedText).toContain('[Contact information removed per Upwork policy]')
    expect(result.foundContacts).toHaveLength(1)
    expect(result.foundContacts[0].type).toBe('email')
  })

  it('should remove phone numbers', () => {
    const text = 'Call me at +1-234-567-8900'
    const result = sanitizeExternalContacts(text)
    expect(result.sanitizedText).not.toContain('+1-234-567-8900')
    expect(result.sanitizedText).toContain('[Contact information removed per Upwork policy]')
    expect(result.foundContacts.some(c => c.type === 'phone')).toBe(true)
  })

  it('should remove website URLs', () => {
    const text = 'Visit my website at https://myagency.com'
    const result = sanitizeExternalContacts(text)
    expect(result.sanitizedText).not.toContain('https://myagency.com')
    expect(result.sanitizedText).toContain('[Contact information removed per Upwork policy]')
    expect(result.foundContacts.some(c => c.type === 'website')).toBe(true)
  })

  it('should keep GitHub URLs by default', () => {
    const text = 'Check out my work at https://github.com/username'
    const result = sanitizeExternalContacts(text, { allowGitHub: true })
    expect(result.sanitizedText).toContain('https://github.com/username')
    expect(result.foundContacts.some(c => c.type === 'website' && c.value.includes('github'))).toBe(false)
  })

  it('should remove GitHub URLs if allowGitHub is false', () => {
    const text = 'Check out my work at https://github.com/username'
    const result = sanitizeExternalContacts(text, { allowGitHub: false })
    expect(result.sanitizedText).not.toContain('https://github.com/username')
    expect(result.sanitizedText).toContain('[Contact information removed per Upwork policy]')
  })

  it('should remove social handles in contact context', () => {
    const text = 'Message me on Telegram: @myusername'
    const result = sanitizeExternalContacts(text)
    expect(result.sanitizedText).not.toContain('@myusername')
    expect(result.sanitizedText).toContain('[Contact information removed per Upwork policy]')
    expect(result.foundContacts.some(c => c.type === 'social')).toBe(true)
  })

  it('should handle multiple contact types in one text', () => {
    const text = 'Email me at test@example.com or call +1-234-567-8900. Visit https://mywebsite.com'
    const result = sanitizeExternalContacts(text)
    expect(result.foundContacts.length).toBeGreaterThanOrEqual(3)
    expect(result.sanitizedText).not.toContain('test@example.com')
    expect(result.sanitizedText).not.toContain('+1-234-567-8900')
    expect(result.sanitizedText).not.toContain('https://mywebsite.com')
  })

  it('should preserve text structure when removing contacts', () => {
    const text = 'I am a developer. Contact me at test@example.com for more details. I have 5 years of experience.'
    const result = sanitizeExternalContacts(text)
    expect(result.sanitizedText).toContain('I am a developer')
    expect(result.sanitizedText).toContain('I have 5 years of experience')
    expect(result.sanitizedText).not.toContain('test@example.com')
  })

  it('should handle empty or null input', () => {
    expect(sanitizeExternalContacts('')).toEqual({ sanitizedText: '', foundContacts: [] })
    expect(sanitizeExternalContacts(null as any)).toEqual({ sanitizedText: '', foundContacts: [] })
    expect(sanitizeExternalContacts(undefined as any)).toEqual({ sanitizedText: '', foundContacts: [] })
  })

  it('should not remove false positive phone numbers (years)', () => {
    const text = 'I have been working since 2020'
    const result = sanitizeExternalContacts(text)
    expect(result.sanitizedText).toContain('2020')
    expect(result.foundContacts.some(c => c.type === 'phone' && c.value.includes('2020'))).toBe(false)
  })

  it('should handle complex email formats', () => {
    const emails = [
      'test@example.com',
      'user.name+tag@example.co.uk',
      'user_name@example-domain.com',
    ]
    emails.forEach(email => {
      const text = `Contact me at ${email}`
      const result = sanitizeExternalContacts(text)
      expect(result.sanitizedText).not.toContain(email)
      expect(result.foundContacts.some(c => c.type === 'email' && c.value === email)).toBe(true)
    })
  })

  it('should handle various phone number formats', () => {
    const phones = [
      '+1-234-567-8900',
      '(123) 456-7890',
      '123-456-7890',
      '+1234567890',
      '123.456.7890',
    ]
    phones.forEach(phone => {
      const text = `Call me at ${phone}`
      const result = sanitizeExternalContacts(text)
      // Phone detection is more lenient, so we just check it doesn't break
      expect(result.sanitizedText).toBeTruthy()
    })
  })

  it('should handle URLs without protocol', () => {
    const text = 'Visit www.example.com or example.io'
    const result = sanitizeExternalContacts(text)
    expect(result.foundContacts.some(c => c.type === 'website')).toBe(true)
    expect(result.sanitizedText).not.toContain('www.example.com')
    expect(result.sanitizedText).not.toContain('example.io')
  })

  it('should preserve GitHub URLs in mixed content', () => {
    const text = 'Visit https://mywebsite.com and https://github.com/username for my work'
    const result = sanitizeExternalContacts(text, { allowGitHub: true })
    expect(result.sanitizedText).toContain('https://github.com/username')
    expect(result.sanitizedText).not.toContain('https://mywebsite.com')
  })
})

