"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Check,
  Sparkles,
  Loader2,
  Copy,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ProposalPreviewModal } from "./proposal-preview-modal"

interface ProposalVariant {
  variant: "short" | "technical" | "friendly" | string
  title: string
  description: string
  content: string
  qualityScore?: number
  qualityStatus?: string
}

interface QualityResult {
  score: number
  scoreStatus?: string
}

interface ProposalVariantsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  variants: ProposalVariant[]
  relevantCaseStudies?: Array<{ id: string; title: string }>
  relevantPortfolios?: Array<{ id: string; title: string }>
  missingInfo?: string[]
  onSelect: (content: string, variant: string) => void
  onMerge?: (variants: ProposalVariant[]) => void
}

export function ProposalVariantsModal({
  open,
  onOpenChange,
  variants,
  relevantCaseStudies = [],
  relevantPortfolios = [],
  missingInfo = [],
  onSelect,
  onMerge,
}: ProposalVariantsModalProps) {
  const { toast } = useToast()
  const [selectedVariants, setSelectedVariants] = useState<Set<string>>(new Set())
  const [qualityScores, setQualityScores] = useState<Record<string, QualityResult>>({})
  const [loadingQuality, setLoadingQuality] = useState<Set<string>>(new Set())
  const [previewContent, setPreviewContent] = useState<string>("")
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    if (open && variants.length > 0) {
      variants.forEach((v) => checkQuality(v))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, variants.length])

  const checkQuality = async (variant: ProposalVariant) => {
    if (qualityScores[variant.variant]) return

    setLoadingQuality((prev) => new Set(prev).add(variant.variant))

    try {
      const response = await fetch("/api/proposals/quality-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposal: variant.content }),
      })

      if (response.ok) {
        const data: QualityResult = await response.json()
        setQualityScores((prev) => ({
          ...prev,
          [variant.variant]: data,
        }))
      }
    } catch (error) {
      console.error("Error checking quality:", error)
    } finally {
      setLoadingQuality((prev) => {
        const next = new Set(prev)
        next.delete(variant.variant)
        return next
      })
    }
  }

  const toggleVariant = (variant: string) => {
    const next = new Set(selectedVariants)
    if (next.has(variant)) next.delete(variant)
    else next.add(variant)
    setSelectedVariants(next)
  }

  const handleSelect = (variant: ProposalVariant) => {
    onSelect(variant.content, variant.variant)
    onOpenChange(false)
  }

  const handleMerge = () => {
    if (selectedVariants.size < 2) {
      toast({
        title: "Select at least 2 variants",
        description: "Please select multiple variants to merge them.",
        variant: "destructive",
      })
      return
    }

    const toMerge = variants.filter((v) => selectedVariants.has(v.variant))
    onMerge?.(toMerge)
    onOpenChange(false)
  }

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content)
    toast({
      title: "Copied!",
      description: "Proposal copied to clipboard",
    })
  }

  const getQualityColor = (status?: string) => {
    switch (status) {
      case "excellent":
        return "text-[#22C55E]"
      case "good":
        return "text-[#3B82F6]"
      case "fair":
        return "text-[#F59E0B]"
      case "poor":
        return "text-[#EF4444]"
      default:
        return "text-[#64748B]"
    }
  }

  const getQualityIcon = (status?: string) => {
    switch (status) {
      case "excellent":
      case "good":
        return CheckCircle2
      case "fair":
      case "poor":
        return AlertCircle
      default:
        return TrendingUp
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[92vh] w-[95vw] max-w-4xl flex-col overflow-hidden rounded-2xl p-0">
          {/* HEADER */}
          <DialogHeader className="border-b border-[#E7ECF2] px-6 pt-5 pb-4">
            <DialogTitle className="flex items-center gap-2 text-[15px] font-semibold">
              <Sparkles className="h-5 w-5 text-primary" />
              Choose Your Proposal Variant
            </DialogTitle>
          </DialogHeader>

          {/* BODY (scrollable) */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {/* INFO STRIP */}
            {(relevantCaseStudies.length > 0 ||
              relevantPortfolios.length > 0 ||
              missingInfo.length > 0) && (
              <div className="mb-4 rounded-lg border border-[#E7ECF2] bg-[#F7F8FA] p-4">
                <div className="grid gap-4 md:grid-cols-3">
                  {relevantCaseStudies.length > 0 && (
                    <div>
                      <p className="mb-1 text-[11px] font-semibold text-[#0F172A]">
                        Referenced Case Studies
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {relevantCaseStudies.map((cs) => (
                          <span
                            key={cs.id}
                            className="rounded-md border border-[#E7ECF2] bg-white px-2 py-1 text-[11px] text-[#0F172A]"
                          >
                            {cs.title}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {relevantPortfolios.length > 0 && (
                    <div>
                      <p className="mb-1 text-[11px] font-semibold text-[#0F172A]">
                        Referenced Portfolios
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {relevantPortfolios.map((p) => (
                          <span
                            key={p.id}
                            className="rounded-md border border-[#E7ECF2] bg-white px-2 py-1 text-[11px] text-[#0F172A]"
                          >
                            {p.title}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {missingInfo.length > 0 && (
                    <div>
                      <p className="mb-1 text-[11px] font-semibold text-[#0F172A]">
                        Missing Information
                      </p>
                      <ul className="space-y-0.5 text-[11px] text-[#64748B]">
                        {missingInfo.map((info, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="mt-0.5 text-[#F59E0B]">•</span>
                            <span>{info}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* VARIANTS STRIP */}
            <div className="flex gap-4 overflow-x-auto pb-2 pt-2">
              {variants.map((variant) => {
                const quality = qualityScores[variant.variant]
                const isLoading = loadingQuality.has(variant.variant)
                const QualityIcon = getQualityIcon(quality?.scoreStatus)

                return (
                  <div
                    key={variant.variant}
                    className={`flex h-full min-h-[280px] w-[260px] flex-shrink-0 flex-col rounded-xl border-2 p-4 transition-all ${
                      selectedVariants.has(variant.variant)
                        ? "border-primary bg-primary/5 shadow-lg"
                        : "border-[#E7ECF2] bg-white hover:border-primary/50 hover:shadow-md"
                    }`}
                  >
                    {/* CARD HEADER */}
                    <div className="mb-3 flex items-start gap-2">
                      <div className="flex-1">
                        <h3 className="mb-1 text-[13px] font-semibold leading-snug text-[#0F172A]">
                          {variant.title}
                        </h3>
                        <p className="text-[11px] leading-relaxed text-[#64748B]">
                          {variant.description}
                        </p>
                      </div>
                      <button
                        onClick={() => toggleVariant(variant.variant)}
                        className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md border-2 text-xs transition-all ${
                          selectedVariants.has(variant.variant)
                            ? "border-primary bg-primary text-white shadow-sm"
                            : "border-[#E7ECF2] bg-white hover:border-primary/60"
                        }`}
                        aria-label={
                          selectedVariants.has(variant.variant)
                            ? "Deselect variant"
                            : "Select variant"
                        }
                      >
                        {selectedVariants.has(variant.variant) && (
                          <Check className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>

                    {/* QUALITY */}
                    <div className="mb-3">
                      {isLoading ? (
                        <div className="flex items-center gap-2 rounded-lg border border-[#E7ECF2] bg-[#F7F8FA] px-3 py-2 text-[11px] text-[#64748B]">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Checking quality…</span>
                        </div>
                      ) : quality ? (
                        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 rounded-lg border border-[#E7ECF2] bg-[#F7F8FA] px-3 py-2">
                          <QualityIcon
                            className={`h-4 w-4 flex-shrink-0 ${getQualityColor(
                              quality.scoreStatus
                            )}`}
                          />
                          <div className="flex items-baseline gap-1">
                            <span
                              className={`text-[15px] font-bold ${getQualityColor(
                                quality.scoreStatus
                              )}`}
                            >
                              {quality.score}
                            </span>
                            <span className="text-[10px] text-[#64748B]">
                              /100
                            </span>
                          </div>
                          <span className="text-[10px] font-medium text-[#64748B]">
                            Score
                          </span>
                        </div>
                      ) : null}
                    </div>

                    {/* PREVIEW TEXT */}
                    <div className="mb-3 flex-1">
                      <p className="line-clamp-6 text-[12px] leading-relaxed text-[#0F172A]">
                        {variant.content.substring(0, 320)}
                        {variant.content.length > 320 ? "…" : ""}
                      </p>
                    </div>

                    {/* ACTIONS */}
                    <div className="mt-auto grid grid-cols-[1fr_auto_1fr] gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 text-[11px] font-medium border-[#E7ECF2] hover:bg-[#F7F8FA]"
                        onClick={() => {
                          setPreviewContent(variant.content)
                          setShowPreview(true)
                        }}
                      >
                        Preview
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-9 px-3 hover:bg-[#F7F8FA]"
                        onClick={() => handleCopy(variant.content)}
                        aria-label="Copy proposal"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        className="h-9 text-[11px] font-semibold bg-primary text-white hover:bg-primary/90"
                        onClick={() => handleSelect(variant)}
                      >
                        Use This
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* FOOTER */}
          <div className="border-t border-[#E7ECF2] bg-[#F7F8FA] px-6 py-4">
            {selectedVariants.size >= 2 ? (
              <div className="grid grid-cols-[1fr_auto] items-center gap-4">
                <p className="text-[13px] font-medium text-[#0F172A]">
                  {selectedVariants.size} variant
                  {selectedVariants.size > 1 ? "s" : ""} selected for merging
                </p>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedVariants(new Set())}
                    className="border-[#E7ECF2] text-[13px] text-[#64748B] hover:bg-white"
                  >
                    Clear
                  </Button>
                  <Button
                    onClick={handleMerge}
                    className="bg-primary px-6 text-[13px] font-semibold text-white hover:bg-primary/90"
                  >
                    Merge {selectedVariants.size} Variants
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-end">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="border-[#E7ECF2] px-6 text-[13px] text-[#64748B] hover:bg-white"
                >
                  Close
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {showPreview && (
        <ProposalPreviewModal
          open={showPreview}
          onOpenChange={setShowPreview}
          proposal={previewContent}
          onAccept={() => {
            onSelect(previewContent, "merged")
            setShowPreview(false)
            onOpenChange(false)
          }}
          onReject={() => setShowPreview(false)}
        />
      )}
    </>
  )
}
