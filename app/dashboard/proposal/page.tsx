"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Bold, Italic, List } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ProposalPreviewModal } from "@/components/proposals/proposal-preview-modal"

interface Template {
  id: string
  name: string
  content: string
}

interface Profile {
  id: string
  name: string
  title?: string
  overview?: string
  skills?: string[]
}

interface Portfolio {
  id: string
  title: string
  description?: string
}

export default function ProposalPage() {
  const [template, setTemplate] = useState("")
  const [profile, setProfile] = useState("")
  const [portfolio, setPortfolio] = useState("")
  const [content, setContent] = useState("")
  const [templates, setTemplates] = useState<Template[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedProposal, setGeneratedProposal] = useState<string>("")
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchTemplates()
    fetchProfiles()
  }, [])

  useEffect(() => {
    if (profile) {
      fetchPortfolios(profile)
    } else {
      setPortfolios([])
      setPortfolio("")
    }
  }, [profile])

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
      }
    } catch (error) {
      console.error("Error fetching templates:", error)
    }
  }

  const fetchProfiles = async () => {
    try {
      const response = await fetch("/api/profiles")
      if (response.ok) {
        const data = await response.json()
        setProfiles(data.profiles || [])
      }
    } catch (error) {
      console.error("Error fetching profiles:", error)
    }
  }

  const fetchPortfolios = async (profileId: string) => {
    try {
      const response = await fetch(`/api/profiles/${profileId}/portfolios`)
      if (response.ok) {
        const data = await response.json()
        setPortfolios(data.portfolios || [])
      }
    } catch (error) {
      console.error("Error fetching portfolios:", error)
      setPortfolios([])
    }
  }

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedTemplateId = e.target.value
    setTemplate(selectedTemplateId)
    
    if (selectedTemplateId) {
      const selectedTemplate = templates.find((t) => t.id === selectedTemplateId)
      if (selectedTemplate) {
        setContent(selectedTemplate.content)
      }
    } else {
      setContent("")
    }
  }

  const handleGenerateProposal = async () => {
    if (!content.trim()) {
      setError("Please provide proposal content")
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      // Get selected profile and portfolio data
      const selectedProfile = profiles.find((p) => p.id === profile)
      const selectedPortfolio = portfolios.find((p) => p.id === portfolio)
      const selectedTemplate = templates.find((t) => t.id === template)

      // Get job description from the preview panel (currently hardcoded, but can be made dynamic)
      const jobDescription = `Full Stack Web Application and AI & Chatbot Integration with WhatsApp marketing

Job Description:
We are looking for an experienced full-stack developer to build a comprehensive web application with integrated AI chatbot capabilities and WhatsApp marketing automation. The project requires expertise in modern web technologies and AI integration.

Key Responsibilities & Tasks:
1. Design and develop responsive web application
2. Integrate AI chatbot for customer support
3. Implement WhatsApp marketing automation
4. Set up database and backend infrastructure
5. Deploy and maintain the application`

      console.log("Sending proposal generation request...", {
        hasTemplate: !!selectedTemplate,
        hasProfile: !!selectedProfile,
        hasPortfolio: !!selectedPortfolio,
        contentLength: content.length,
      })

      const response = await fetch("/api/proposals/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          template: selectedTemplate?.content || "",
          profile: selectedProfile || "",
          portfolio: selectedPortfolio || "",
          content: content,
          jobDescription: jobDescription,
        }),
      })

      const data = await response.json()
      console.log("API Response:", { ok: response.ok, data })

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate proposal")
      }

      if (data.proposal) {
        console.log("Setting generated proposal content, length:", data.proposal.length)
        setGeneratedProposal(data.proposal)
        setShowPreviewModal(true)
        toast({
          title: "Proposal Generated",
          description: "Review your AI-generated proposal in the preview.",
        })
      } else {
        console.error("No proposal in response:", data)
        throw new Error("No proposal content received from API")
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to generate proposal"
      setError(errorMessage)
      console.error("Error generating proposal:", err)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-card border-b border-border p-8">
        <h1 className="text-2xl font-semibold text-foreground">General Proposal</h1>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-2 gap-8 p-8 h-full">
          {/* Left Panel - Editor */}
          <div className="flex flex-col gap-6 overflow-auto">
            {/* Template Selection */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Template</label>
              <select
                value={template}
                onChange={handleTemplateChange}
                className="w-full px-4 py-2 bg-card border border-border rounded-lg text-foreground focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="">Choose Template</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Profile Selection */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Select Profile</label>
              <select
                value={profile}
                onChange={(e) => setProfile(e.target.value)}
                className="w-full px-4 py-2 bg-card border border-border rounded-lg text-foreground focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="">Select Profile</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.title ? `- ${p.title}` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Portfolio Selection */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Select Portfolio</label>
              <select
                value={portfolio}
                onChange={(e) => setPortfolio(e.target.value)}
                disabled={!profile}
                className="w-full px-4 py-2 bg-card border border-border rounded-lg text-foreground focus:ring-2 focus:ring-primary outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Select Portfolio</option>
                {portfolios.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Rich Text Toolbar */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Formatting</label>
              <div className="flex gap-2 p-2 bg-muted rounded-lg">
                <button className="p-2 hover:bg-background rounded transition-colors" title="Bold">
                  <Bold className="w-4 h-4 text-foreground" />
                </button>
                <button className="p-2 hover:bg-background rounded transition-colors" title="Italic">
                  <Italic className="w-4 h-4 text-foreground" />
                </button>
                <button className="p-2 hover:bg-background rounded transition-colors" title="List">
                  <List className="w-4 h-4 text-foreground" />
                </button>
              </div>
            </div>

            {/* Content Editor */}
            <div className="flex-1 flex flex-col">
              <label className="block text-sm font-medium text-foreground mb-2">Proposal Content</label>
              <div className="relative flex-1">
                <textarea
                  placeholder="The message you wish to send to the recipient..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full h-full px-4 py-3 bg-card border border-border rounded-lg text-foreground focus:ring-2 focus:ring-primary outline-none resize-none"
                />
                <span className="absolute bottom-3 right-3 text-xs text-muted-foreground">{content.length}/5000</span>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-muted transition-colors">
                Close
              </button>
              <Button
                onClick={handleGenerateProposal}
                disabled={isGenerating}
                className="flex-1 bg-primary hover:bg-orange-600 text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? "Generating..." : "Generate Proposal"}
              </Button>
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div className="bg-card border border-border rounded-lg p-6 overflow-auto">
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-foreground mb-2">
                  Full Stack Web Application and AI & Chatbot Integration with WhatsApp marketing
                </h2>
                <p className="text-sm text-muted-foreground">Posted 48 minutes ago</p>
              </div>

              <div className="border-t border-border pt-4">
                <h3 className="font-semibold text-foreground mb-2">Job Description</h3>
                <p className="text-sm text-foreground leading-relaxed">
                  We are looking for an experienced full-stack developer to build a comprehensive web application with
                  integrated AI chatbot capabilities and WhatsApp marketing automation. The project requires expertise
                  in modern web technologies and AI integration.
                </p>
              </div>

              <div className="border-t border-border pt-4">
                <h3 className="font-semibold text-foreground mb-2">Key Responsibilities & Tasks:</h3>
                <ol className="text-sm text-foreground space-y-2 list-decimal list-inside">
                  <li>Design and develop responsive web application</li>
                  <li>Integrate AI chatbot for customer support</li>
                  <li>Implement WhatsApp marketing automation</li>
                  <li>Set up database and backend infrastructure</li>
                  <li>Deploy and maintain the application</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Proposal Preview Modal */}
      <ProposalPreviewModal
        open={showPreviewModal}
        onOpenChange={setShowPreviewModal}
        proposal={generatedProposal}
        onAccept={(proposal) => {
          setContent(proposal)
          toast({
            title: "Proposal Applied",
            description: "The generated proposal has been added to your content.",
          })
        }}
      />
    </div>
  )
}
