"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type Template = { id: string; name: string; description?: string }
type Profile = { id: string; name: string }
type Portfolio = { id: string; title: string }
type CaseStudy = { id: string; title: string }

interface RawProposalGenerateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onGenerate: (payload: {
    templateId: string
    profileId: string
    portfolioIds: string[]
    caseStudyIds: string[]
  }) => void
}

export function RawProposalGenerateModal({
  open,
  onOpenChange,
  onGenerate,
}: RawProposalGenerateModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [templates, setTemplates] = useState<Template[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([])

  const [templateId, setTemplateId] = useState("")
  const [profileId, setProfileId] = useState("")
  const [selectedPortfolios, setSelectedPortfolios] = useState<Set<string>>(new Set())
  const [selectedCaseStudies, setSelectedCaseStudies] = useState<Set<string>>(new Set())
  const [submitting, setSubmitting] = useState(false)

  // Load portfolios and case studies when profile changes
  useEffect(() => {
    if (!profileId) {
      setPortfolios([])
      setCaseStudies([])
      setSelectedPortfolios(new Set())
      setSelectedCaseStudies(new Set())
      return
    }

    const loadProfileData = async () => {
      try {
        const [portRes, csRes] = await Promise.all([
          fetch(`/api/profiles/${profileId}/portfolios`),
          fetch(`/api/profiles/${profileId}/case-studies`),
        ])

        if (portRes.ok) {
          const portData = await portRes.json()
          setPortfolios(portData.portfolios || [])
        }

        if (csRes.ok) {
          const csData = await csRes.json()
          setCaseStudies(csData.caseStudies || [])
        }
      } catch (err) {
        console.error("Error loading profile data:", err)
      }
    }

    loadProfileData()
  }, [profileId])

  useEffect(() => {
    if (!open) return
    const loadData = async () => {
      try {
        setLoading(true)
        // Reset selections when modal opens
        setTemplateId("")
        setProfileId("")
        setSelectedPortfolios(new Set())
        setSelectedCaseStudies(new Set())

        // Adjust endpoints to match your existing APIs
        const [tplRes, profRes] = await Promise.all([
          fetch("/api/templates"),
          fetch("/api/profiles"),
        ])

        const [tplData, profData] = await Promise.all([
          tplRes.ok ? tplRes.json() : { templates: [] },
          profRes.ok ? profRes.json() : { profiles: [] },
        ])

        setTemplates(tplData.templates || [])
        setProfiles(profData.profiles || [])
      } catch (err) {
        console.error(err)
        toast({
          title: "Unable to load data",
          description: "Could not load templates or profiles.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [open, toast])

  const toggleSet = (set: Set<string>, id: string) => {
    const next = new Set(set)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  }

  const handleConfirm = async () => {
    if (!templateId || !profileId) {
      toast({
        title: "Select template & profile",
        description: "Both template and profile are required.",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)
    await onGenerate({
      templateId,
      profileId,
      portfolioIds: Array.from(selectedPortfolios),
      caseStudyIds: Array.from(selectedCaseStudies),
    })
    setSubmitting(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[520px] max-w-[95vw] rounded-2xl">
        <DialogHeader className="pb-3">
          <DialogTitle className="text-base font-semibold">
            Generate Proposal
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading templates and profiles…
          </div>
        ) : (
          <div className="space-y-4">
            {/* Template */}
            <div className="space-y-1">
              <Label className="text-xs text-[#64748B]">Template</Label>
              <Select value={templateId} onValueChange={setTemplateId}>
                <SelectTrigger className="h-9 border-[#E7ECF2] text-sm">
                  <SelectValue placeholder="Select Template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Profile */}
            <div className="space-y-1">
              <Label className="text-xs text-[#64748B]">Select Profile</Label>
              <Select value={profileId} onValueChange={setProfileId}>
                <SelectTrigger className="h-9 border-[#E7ECF2] text-sm">
                  <SelectValue placeholder="Select Profile" />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Portfolio */}
            {profileId && (
              <div className="space-y-1">
                <Label className="text-xs text-[#64748B]">Select Portfolio (optional)</Label>
                <ScrollArea className="h-24 rounded-md border border-[#E7ECF2] bg-[#F7F8FA] p-2 text-xs">
                  {portfolios.length === 0 ? (
                    <p className="text-[11px] text-[#94A3B8]">No portfolio items configured for this profile.</p>
                  ) : (
                    <div className="space-y-1">
                      {portfolios.map((p) => (
                        <label
                          key={p.id}
                          className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 hover:bg-white"
                        >
                          <Checkbox
                            checked={selectedPortfolios.has(p.id)}
                            onCheckedChange={() =>
                              setSelectedPortfolios((prev) => toggleSet(prev, p.id))
                            }
                          />
                          <span>{p.title}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            )}

            {/* Case Studies */}
            {profileId && (
              <div className="space-y-1">
                <Label className="text-xs text-[#64748B]">Select Case Studies (optional)</Label>
                <ScrollArea className="h-24 rounded-md border border-[#E7ECF2] bg-[#F7F8FA] p-2 text-xs">
                  {caseStudies.length === 0 ? (
                    <p className="text-[11px] text-[#94A3B8]">No case studies configured for this profile.</p>
                  ) : (
                    <div className="space-y-1">
                      {caseStudies.map((c) => (
                        <label
                          key={c.id}
                          className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 hover:bg-white"
                        >
                          <Checkbox
                            checked={selectedCaseStudies.has(c.id)}
                            onCheckedChange={() =>
                              setSelectedCaseStudies((prev) => toggleSet(prev, c.id))
                            }
                          />
                          <span>{c.title}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            )}

            {/* Actions */}
            <div className="mt-2 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-9 border-[#E7ECF2] px-4 text-xs text-[#64748B]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={submitting}
                className="h-9 bg-primary px-4 text-xs font-semibold text-white hover:bg-primary/90"
              >
                {submitting && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                Generate Proposal
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

