"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Bold, Italic, List } from "lucide-react"

interface ProposalTemplate {
  id: string
  name: string
  content: string
}

interface ProfileOption {
  id: string
  name: string
}

interface PortfolioOption {
  id: string
  title: string
  profileId: string
}

interface ProposalFormProps {
  jobId: string
}

export function ProposalForm({ jobId }: ProposalFormProps) {
  const router = useRouter()
  
  const [templateId, setTemplateId] = useState("")
  const [profileId, setProfileId] = useState("")
  const [portfolioId, setPortfolioId] = useState("")
  const [message, setMessage] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [profiles, setProfiles] = useState<ProfileOption[]>([])
  const [portfolios, setPortfolios] = useState<PortfolioOption[]>([])
  const [templates, setTemplates] = useState<ProposalTemplate[]>([])

  useEffect(() => {
    fetchTemplates()
    fetchProfiles()
  }, [])

  useEffect(() => {
    if (profileId) {
      fetchPortfolios(profileId)
    } else {
      setPortfolios([])
      setPortfolioId("")
    }
  }, [profileId])

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/templates")
      if (response.ok) {
        const data = await response.json()
        setTemplates(
          data.templates.map((t: any) => ({
            id: t.id,
            name: t.name,
            content: t.content,
          }))
        )
      } else {
        console.error("Failed to fetch templates")
        setTemplates([])
      }
    } catch (error) {
      console.error("Error fetching templates:", error)
      setTemplates([])
    }
  }

  const fetchProfiles = async () => {
    try {
      const response = await fetch("/api/profiles")
      if (response.ok) {
        const data = await response.json()
        setProfiles(data.profiles.map((p: any) => ({ id: p.id, name: p.name })))
      } else {
        // Fallback to mock data
        setProfiles([
          { id: "profile1", name: "Full Stack Developer" },
          { id: "profile2", name: "AI Integration Specialist" },
        ])
      }
    } catch (error) {
      console.error("Error fetching profiles:", error)
      // Fallback to mock data
      setProfiles([
        { id: "profile1", name: "Full Stack Developer" },
        { id: "profile2", name: "AI Integration Specialist" },
      ])
    }
  }

  const fetchPortfolios = async (profileId: string) => {
    try {
      const response = await fetch(`/api/profiles/${profileId}/portfolios`)
      if (response.ok) {
        const data = await response.json()
        setPortfolios(data.portfolios.map((p: any) => ({ id: p.id, title: p.title, profileId })))
      } else {
        // Fallback to mock data
        setPortfolios([
          { id: "portfolio1", title: "AI Integration Project", profileId },
          { id: "portfolio2", title: "Full Stack Web App", profileId },
        ])
      }
    } catch (error) {
      console.error("Error fetching portfolios:", error)
      // Fallback to mock data
      setPortfolios([
        { id: "portfolio1", title: "AI Integration Project", profileId },
        { id: "portfolio2", title: "Full Stack Web App", profileId },
      ])
    }
  }

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedTemplateId = e.target.value
    setTemplateId(selectedTemplateId)
    
    if (selectedTemplateId) {
      const template = templates.find((t) => t.id === selectedTemplateId)
      if (template) {
        // Use the template content to pre-fill the message
        setMessage(template.content)
      }
    } else {
      // Clear message if no template selected
      setMessage("")
    }
  }

  const handleFormat = (format: "bold" | "italic" | "list") => {
    const textarea = document.querySelector("textarea") as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = message.substring(start, end)
    let formattedText = ""

    switch (format) {
      case "bold":
        formattedText = `**${selectedText}**`
        break
      case "italic":
        formattedText = `*${selectedText}*`
        break
      case "list":
        formattedText = `- ${selectedText}`
        break
    }

    const newMessage = message.substring(0, start) + formattedText + message.substring(end)
    setMessage(newMessage)
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + formattedText.length, start + formattedText.length)
    }, 0)
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!templateId) {
      newErrors.template = "Please select a template"
    }
    if (!profileId) {
      newErrors.profile = "Please select a profile"
    }
    if (!portfolioId) {
      newErrors.portfolio = "Please select a portfolio"
    }
    if (!message.trim()) {
      newErrors.message = "Please enter a message"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleGenerate = () => {
    if (!validate()) {
      return
    }

    const payload = {
      jobId,
      templateId,
      profileId,
      portfolioId,
      message,
    }

    console.log("Generated proposal", payload)
    
    // Show success message (you can replace this with a toast notification)
    alert("Proposal generated successfully!")
  }

  const handleClose = () => {
    router.back()
  }

  return (
    <div className="bg-card border border-border rounded-lg shadow-sm p-6">
      <h1 className="text-2xl font-semibold text-foreground mb-6">General Proposal</h1>

      <div className="space-y-6">
        {/* Template Selection */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Template
          </label>
          <select
            value={templateId}
            onChange={handleTemplateChange}
            className={`w-full px-4 py-2 bg-background border rounded-lg text-foreground focus:ring-2 focus:ring-primary outline-none ${
              errors.template ? "border-red-500" : "border-border"
            }`}
          >
            <option value="">Choose Template</option>
            {templates.length === 0 ? (
              <option value="" disabled>
                No templates available. Create one in Templates page.
              </option>
            ) : (
              templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))
            )}
          </select>
          {errors.template && (
            <p className="mt-1 text-sm text-red-500">{errors.template}</p>
          )}
        </div>

        {/* Profile Selection */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Select Profile
          </label>
          <select
            value={profileId}
            onChange={(e) => setProfileId(e.target.value)}
            className={`w-full px-4 py-2 bg-background border rounded-lg text-foreground focus:ring-2 focus:ring-primary outline-none ${
              errors.profile ? "border-red-500" : "border-border"
            }`}
          >
            <option value="">Select Profile</option>
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.name}
              </option>
            ))}
          </select>
          {errors.profile && (
            <p className="mt-1 text-sm text-red-500">{errors.profile}</p>
          )}
        </div>

        {/* Portfolio Selection */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Select Portfolio
          </label>
          <select
            value={portfolioId}
            onChange={(e) => setPortfolioId(e.target.value)}
            disabled={!profileId}
            className={`w-full px-4 py-2 bg-background border rounded-lg text-foreground focus:ring-2 focus:ring-primary outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
              errors.portfolio ? "border-red-500" : "border-border"
            }`}
          >
            <option value="">Select Portfolio</option>
            {portfolios.map((portfolio) => (
              <option key={portfolio.id} value={portfolio.id}>
                {portfolio.title}
              </option>
            ))}
          </select>
          {errors.portfolio && (
            <p className="mt-1 text-sm text-red-500">{errors.portfolio}</p>
          )}
        </div>

        {/* Message Editor */}
        <div>
          <div className="flex items-center gap-2 p-2 bg-muted rounded-t-lg border border-b-0 border-border">
            <button
              type="button"
              onClick={() => handleFormat("bold")}
              className="p-2 hover:bg-background rounded transition-colors"
              title="Bold"
            >
              <Bold className="w-4 h-4 text-foreground" />
            </button>
            <button
              type="button"
              onClick={() => handleFormat("italic")}
              className="p-2 hover:bg-background rounded transition-colors"
              title="Italic"
            >
              <Italic className="w-4 h-4 text-foreground" />
            </button>
            <button
              type="button"
              onClick={() => handleFormat("list")}
              className="p-2 hover:bg-background rounded transition-colors"
              title="List"
            >
              <List className="w-4 h-4 text-foreground" />
            </button>
          </div>
          <div className="relative">
            <textarea
              value={message}
              onChange={(e) => {
                const value = e.target.value
                if (value.length <= 2000) {
                  setMessage(value)
                }
              }}
              placeholder="The message you wish to send to the recipient..."
              rows={12}
              className={`w-full px-4 py-3 bg-background border rounded-b-lg text-foreground focus:ring-2 focus:ring-primary outline-none resize-none ${
                errors.message ? "border-red-500" : "border-border"
              }`}
            />
            <div className="absolute bottom-3 right-3 text-xs text-muted-foreground">
              {message.length}/2000
            </div>
          </div>
          {errors.message && (
            <p className="mt-1 text-sm text-red-500">{errors.message}</p>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-between gap-4 pt-4 border-t border-border">
          <Button
            variant="outline"
            onClick={handleClose}
            className="border-border"
          >
            Close
          </Button>
          <Button
            onClick={handleGenerate}
            className="bg-primary hover:bg-orange-600 text-primary-foreground"
          >
            Generate Proposal
          </Button>
        </div>
      </div>
    </div>
  )
}

