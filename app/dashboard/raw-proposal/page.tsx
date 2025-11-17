"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Sparkles, FileText, Clipboard, ClipboardCheck } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { RawProposalGenerateModal } from "@/components/raw-proposal/raw-proposal-generate-modal"

export default function RawProposalPage() {
  const { toast } = useToast()
  const [rawText, setRawText] = useState("")
  const [openModal, setOpenModal] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generated, setGenerated] = useState<string>("")
  const [copied, setCopied] = useState(false)

  const handleOpenModal = () => {
    if (!rawText.trim()) {
      toast({
        title: "Paste a job summary first",
        description: "Please paste the raw job description before generating a proposal.",
        variant: "destructive",
      })
      return
    }
    setOpenModal(true)
  }

  const handleGenerate = async (payload: {
    templateId: string
    profileId: string
    portfolioIds: string[]
    caseStudyIds: string[]
  }) => {
    setIsGenerating(true)
    setGenerated("")
    setCopied(false)

    try {
      const res = await fetch("/api/raw-proposals/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawJobText: rawText,
          ...payload,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to generate proposal")
      }

      const data = await res.json()
      setGenerated(data.proposal ?? "")
      toast({
        title: "Proposal generated",
        description: "You can review, edit, and copy it from the right panel.",
      })
    } catch (err) {
      console.error(err)
      toast({
        title: "Something went wrong",
        description: err instanceof Error ? err.message : "Unable to generate proposal. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = () => {
    if (!generated) return
    navigator.clipboard.writeText(generated)
    setCopied(true)
    toast({
      title: "Copied!",
      description: "Proposal copied to clipboard.",
    })
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col gap-4 px-6 py-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-semibold text-[#0F172A]">
            <Sparkles className="h-5 w-5 text-primary" />
            Raw Proposal
          </h1>
          <p className="text-sm text-[#64748B]">
            Paste an Upwork job summary and generate a tailored proposal without saving the job in the feed.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="grid flex-1 gap-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        {/* Left: Raw job input */}
        <div className="flex flex-col rounded-2xl border border-[#E7ECF2] bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[#0F172A]">Job Summary</h2>
              <p className="text-xs text-[#64748B]">
                Paste the full text from the Upwork job page, including client details and skills.
              </p>
            </div>
          </div>

          <Textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Paste job details here..."
            className="min-h-[260px] flex-1 resize-none border-[#E7ECF2] text-sm"
          />

          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-[#94A3B8]">
              Tip: Include the questions, budget and client stats – the AI will use all of it.
            </p>
            <Button
              size="sm"
              className="bg-primary text-xs font-semibold text-white hover:bg-primary/90"
              disabled={!rawText.trim() || isGenerating}
              onClick={handleOpenModal}
            >
              <Sparkles className="mr-1.5 h-4 w-4" />
              {isGenerating ? "Generating..." : "Generate Proposal"}
            </Button>
          </div>
        </div>

        {/* Right: Generated proposal preview */}
        <div className="flex flex-col rounded-2xl border border-[#E7ECF2] bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[#0F172A]">Generated Proposal</h2>
              <p className="text-xs text-[#64748B]">
                Once generated, you can review, tweak and copy it into Upwork.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-8 border-[#E7ECF2] px-3 text-xs"
              disabled={!generated}
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <ClipboardCheck className="mr-1.5 h-3.5 w-3.5" />
                  Copied
                </>
              ) : (
                <>
                  <Clipboard className="mr-1.5 h-3.5 w-3.5" />
                  Copy
                </>
              )}
            </Button>
          </div>

          <div className="relative flex-1 overflow-auto rounded-lg bg-[#F7F8FA] p-4 text-sm text-[#0F172A]">
            {generated ? (
              <pre className="whitespace-pre-wrap font-sans text-[13px] leading-relaxed">
                {generated}
              </pre>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center text-xs text-[#94A3B8]">
                <FileText className="mb-2 h-6 w-6" />
                <p>Proposal content will appear here after generation.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal for template/profile/portfolio selection */}
      <RawProposalGenerateModal
        open={openModal}
        onOpenChange={setOpenModal}
        onGenerate={handleGenerate}
      />
    </div>
  )
}

