"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Bold, Italic, List } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ProposalPreviewModal } from "./proposal-preview-modal"
import { ProposalVariantsModal } from "./proposal-variants-modal"

interface ProposalTemplate {
  id: string
  name: string
  content: string
}

interface ProfileOption {
  id: string
  name: string
  title?: string
  overview?: string
  skills?: string[]
}

interface PortfolioOption {
  id: string
  title: string
  description?: string
  profileId: string
}

interface ProposalFormProps {
  jobId: string
}

export function ProposalForm({ jobId }: ProposalFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  
  const [templateId, setTemplateId] = useState("")
  const [profileId, setProfileId] = useState("")
  const [portfolioId, setPortfolioId] = useState("")
  const [message, setMessage] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [profiles, setProfiles] = useState<ProfileOption[]>([])
  const [portfolios, setPortfolios] = useState<PortfolioOption[]>([])
  const [templates, setTemplates] = useState<ProposalTemplate[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [jobDescription, setJobDescription] = useState<string>("")
  const [jobSkills, setJobSkills] = useState<string[]>([])
  const [jobCategory, setJobCategory] = useState<string>("")
  const [generatedProposal, setGeneratedProposal] = useState<string>("")
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [showVariantsModal, setShowVariantsModal] = useState(false)
  const [variants, setVariants] = useState<any[]>([])
  const [relevantCaseStudies, setRelevantCaseStudies] = useState<any[]>([])
  const [relevantPortfolios, setRelevantPortfolios] = useState<any[]>([])
  const [missingInfo, setMissingInfo] = useState<string[]>([])
  const [caseStudies, setCaseStudies] = useState<any[]>([])

  useEffect(() => {
    fetchTemplates()
    fetchProfiles()
    fetchJobDescription()
  }, [jobId])

  useEffect(() => {
    if (profileId) {
      fetchPortfolios(profileId)
      fetchCaseStudies(profileId)
    } else {
      setPortfolios([])
      setPortfolioId("")
      setCaseStudies([])
    }
  }, [profileId])

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/templates")
      if (response.ok) {
        const data = await response.json()
        const fetchedTemplates = data.templates.map((t: any) => ({
          id: t.id,
          name: t.name,
          content: t.content,
        }))
        setTemplates(fetchedTemplates)
        
        // Auto-select the first template if available and no template is currently selected
        if (fetchedTemplates.length > 0 && !templateId) {
          const firstTemplate = fetchedTemplates[0]
          setTemplateId(firstTemplate.id)
          setMessage(firstTemplate.content)
        }
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
        setProfiles(
          data.profiles.map((p: any) => ({
            id: p.id,
            name: p.name,
            title: p.title,
            overview: p.overview,
            skills: p.skills || [],
          }))
        )
      } else {
        setProfiles([])
      }
    } catch (error) {
      console.error("Error fetching profiles:", error)
      setProfiles([])
    }
  }

  const fetchJobDescription = async () => {
    try {
      const response = await fetch("/api/jobs")
      if (response.ok) {
        const data = await response.json()
        const foundJob = data.jobs.find((j: any) => j.id === jobId)
        if (foundJob) {
          const description = `${foundJob.title}\n\nJob Description:\n${foundJob.description}\n\nSkills Required: ${foundJob.skills?.join(", ") || "Not specified"}\n\nBudget: ${foundJob.budget}\nLevel: ${foundJob.level}`
          setJobDescription(description)
          setJobSkills(foundJob.skills || [])
          setJobCategory(foundJob.category || foundJob.industry || "")
        }
      }
    } catch (error) {
      console.error("Error fetching job description:", error)
    }
  }

  const fetchCaseStudies = async (profileId: string) => {
    try {
      const response = await fetch(`/api/profiles/${profileId}/case-studies`)
      if (response.ok) {
        const data = await response.json()
        setCaseStudies(data.caseStudies || [])
      }
    } catch (error) {
      console.error("Error fetching case studies:", error)
      setCaseStudies([])
    }
  }

  const fetchPortfolios = async (profileId: string) => {
    try {
      const response = await fetch(`/api/profiles/${profileId}/portfolios`)
      if (response.ok) {
        const data = await response.json()
        setPortfolios(
          data.portfolios.map((p: any) => ({
            id: p.id,
            title: p.title,
            description: p.description,
            profileId,
          }))
        )
      } else {
        setPortfolios([])
      }
    } catch (error) {
      console.error("Error fetching portfolios:", error)
      setPortfolios([])
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

    if (!message.trim()) {
      newErrors.message = "Please enter a message"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleGenerate = async () => {
    if (!validate()) {
      return
    }

    setIsGenerating(true)
    setErrors({})

    try {
      // Get full profile and portfolio data
      const selectedProfile = profiles.find((p) => p.id === profileId)
      const selectedPortfolio = portfolios.find((p) => p.id === portfolioId)
      const selectedTemplate = templates.find((t) => t.id === templateId)

      console.log("Sending proposal generation request...", {
        hasTemplate: !!selectedTemplate,
        hasProfile: !!selectedProfile,
        hasPortfolio: !!selectedPortfolio,
        contentLength: message.length,
        hasJobDescription: !!jobDescription,
      })

      // Use new multi-variant endpoint
      const response = await fetch("/api/proposals/generate-variants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          template: selectedTemplate?.content || "",
          profile: selectedProfile || "",
          portfolios: portfolios.map(p => ({ id: p.id, title: p.title, description: p.description, category: "" })),
          caseStudies: caseStudies.map(cs => ({ id: cs.id, title: cs.title, description: cs.description, category: cs.category })),
          content: message,
          jobDescription: jobDescription || "",
          jobSkills: jobSkills,
          jobCategory: jobCategory,
        }),
      })

      const data = await response.json()
      console.log("API Response:", { ok: response.ok, data })

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate proposal variants")
      }

      if (data.variants && data.variants.length > 0) {
        console.log("Setting generated variants, count:", data.variants.length)
        setVariants(data.variants)
        setRelevantCaseStudies(data.relevantCaseStudies || [])
        setRelevantPortfolios(data.relevantPortfolios || [])
        setMissingInfo(data.missingInfo || [])
        setShowVariantsModal(true)
        toast({
          title: "Proposal Variants Generated",
          description: `Generated ${data.variants.length} proposal variants. Choose your favorite!`,
        })
      } else {
        console.error("No variants in response:", data)
        throw new Error("No proposal variants received from API")
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to generate proposal"
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

  const handleClose = () => {
    router.back()
  }

  const handleAcceptProposal = (proposal: string) => {
    setMessage(proposal)
    toast({
      title: "Proposal Applied",
      description: "The generated proposal has been added to your message.",
    })
  }

  const handleVariantSelect = (content: string, variant: string) => {
    setMessage(content)
    setShowVariantsModal(false)
    toast({
      title: "Variant Selected",
      description: `The "${variant}" variant has been applied to your proposal.`,
    })
    
    // Track proposal usage
    fetch("/api/proposals/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        variant,
        jobId,
        event: "generated",
      }),
    }).catch(console.error)
  }

  const handleVariantMerge = async (selectedVariants: any[]) => {
    // Merge selected variants using AI
    try {
      const response = await fetch("/api/proposals/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: selectedVariants.map(v => v.content).join("\n\n---\n\n"),
          jobDescription,
          template: "Merge the following proposal variants into one cohesive proposal:",
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setMessage(data.proposal)
        setShowVariantsModal(false)
        toast({
          title: "Variants Merged",
          description: "The selected variants have been merged into one proposal.",
        })
      }
    } catch (error) {
      console.error("Error merging variants:", error)
      toast({
        title: "Merge Failed",
        description: "Could not merge variants. Please select a single variant instead.",
        variant: "destructive",
      })
    }
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
                {profile.name} {profile.title ? `- ${profile.title}` : ""}
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
            disabled={isGenerating}
            className="bg-primary hover:bg-orange-600 text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? "Generating..." : "Generate Proposal"}
          </Button>
        </div>
      </div>

      {/* Proposal Preview Modal */}
      <ProposalPreviewModal
        open={showPreviewModal}
        onOpenChange={setShowPreviewModal}
        proposal={generatedProposal}
        onAccept={handleAcceptProposal}
      />

      {/* Proposal Variants Modal */}
      <ProposalVariantsModal
        open={showVariantsModal}
        onOpenChange={setShowVariantsModal}
        variants={variants}
        relevantCaseStudies={relevantCaseStudies}
        relevantPortfolios={relevantPortfolios}
        missingInfo={missingInfo}
        onSelect={handleVariantSelect}
        onMerge={handleVariantMerge}
      />
    </div>
  )
}

