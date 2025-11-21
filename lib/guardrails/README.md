# Upwork Contact Policy Guardrails

This module provides utilities to enforce Upwork's terms of service by preventing the inclusion of external contact information in proposals.

## Functions

### `jobRequestsExternalContact(jobText: string): ContactCheckResult`

Checks if a job description explicitly requests external contact information.

**Usage:**
```typescript
import { jobRequestsExternalContact } from '@/lib/guardrails/upworkContactPolicy'

const jobDescription = "Please share your email and phone number"
const result = jobRequestsExternalContact(jobDescription)

if (result.requested) {
  console.log("Job requests contact info:", result.matchedPhrases)
  // Output: ["email", "phone"]
}
```

**Returns:**
- `requested: boolean` - Whether the job requests contact information
- `matchedPhrases: string[]` - Array of matched phrase types (e.g., "email", "phone", "website")

### `sanitizeExternalContacts(text: string, options?: { allowGitHub?: boolean }): SanitizedTextResult`

Removes external contact information from text while preserving GitHub links (by default).

**Usage:**
```typescript
import { sanitizeExternalContacts } from '@/lib/guardrails/upworkContactPolicy'

const proposal = "Contact me at john@example.com or visit https://mywebsite.com. Check my GitHub: https://github.com/username"

const { sanitizedText, foundContacts } = sanitizeExternalContacts(proposal, { allowGitHub: true })

console.log(sanitizedText)
// Output: "Contact me at [Contact information removed per Upwork policy] or visit [Contact information removed per Upwork policy]. Check my GitHub: https://github.com/username"

console.log(foundContacts)
// Output: [
//   { type: "email", value: "john@example.com" },
//   { type: "website", value: "https://mywebsite.com" }
// ]
```

**Options:**
- `allowGitHub?: boolean` - Whether to allow GitHub URLs (default: `true`)

**Returns:**
- `sanitizedText: string` - Text with contact information removed/replaced
- `foundContacts: Array<{ type: string, value: string }>` - Array of detected contact information

## Integration

The guardrails are automatically integrated into:

1. **Proposal Generation** (`app/api/proposals/generate/route.ts`)
   - Checks job description for contact requests
   - Injects guardrail instructions into prompts
   - Sanitizes generated proposals

2. **Proposal Variants** (`app/api/proposals/generate-variants/route.ts`)
   - Same guardrails applied to all variant types

3. **Raw Proposals** (`app/api/raw-proposals/generate/route.ts`)
   - Guardrails applied to raw proposal generation

## Using in Other Parts of the App

If you need to use these guardrails in other parts of the application:

```typescript
import { 
  jobRequestsExternalContact, 
  sanitizeExternalContacts 
} from '@/lib/guardrails/upworkContactPolicy'

// Check if a job requests contact info
const contactCheck = jobRequestsExternalContact(job.description)

// Sanitize any user-generated content before saving/displaying
const { sanitizedText } = sanitizeExternalContacts(userInput, { allowGitHub: true })
```

## Testing

Unit tests are available in `lib/guardrails/upworkContactPolicy.test.ts`. To run tests:

```bash
# Install test framework (if not already installed)
npm install -D vitest @vitest/ui

# Run tests
npm test
```

## Contact Types Detected

The sanitization function detects and removes:

- **Email addresses**: `user@example.com`
- **Phone numbers**: `+1-234-567-8900`, `(123) 456-7890`, etc.
- **Website URLs**: `https://example.com`, `www.example.com`, `example.io`
- **Social handles**: `Telegram: @username`, `WhatsApp: @username` (in contact context)
- **Addresses/Locations**: `Based in New York, USA` (in contact context)

**Exception:** GitHub URLs are preserved by default (`https://github.com/username`)

