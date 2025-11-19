"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Copy, Check, X, Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Simple markdown parser for bold, italic, and lists
function parseMarkdown(text: string): string {
  // First, escape any existing HTML to prevent XSS
  text = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  
  // Process line by line to handle lists properly
  const lines = text.split('\n')
  const processedLines: string[] = []
  let inList = false
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]
    const listMatch = line.match(/^- (.+)$/)
    
    if (listMatch) {
      // Process markdown in list item
      let listContent = listMatch[1]
      // Convert **text** to <strong>text</strong> (bold) - process first
      listContent = listContent.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      // Convert *text* to <em>text</em> (italic) - but avoid matching **
      listContent = listContent.replace(/\*([^*]+?)\*/g, '<em>$1</em>')
      
      if (!inList) {
        processedLines.push('<ul>')
        inList = true
      }
      processedLines.push(`<li>${listContent}</li>`)
    } else {
      if (inList) {
        processedLines.push('</ul>')
        inList = false
      }
      
      if (line.trim()) {
        // Convert **text** to <strong>text</strong> (bold) - process first
        line = line.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        // Convert *text* to <em>text</em> (italic) - but avoid matching **
        line = line.replace(/\*([^*]+?)\*/g, '<em>$1</em>')
        processedLines.push(line)
      } else {
        processedLines.push('<br>')
      }
    }
  }
  
  if (inList) {
    processedLines.push('</ul>')
  }
  
  return processedLines.join('\n')
}

interface ProposalPreviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  proposal: string
  onAccept: (proposal: string) => void
  onReject?: () => void
}

export function ProposalPreviewModal({
  open,
  onOpenChange,
  proposal,
  onAccept,
  onReject,
}: ProposalPreviewModalProps) {
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(proposal)
      setCopied(true)
      toast({
        title: "Copied!",
        description: "Proposal copied to clipboard",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy proposal to clipboard",
        variant: "destructive",
      })
    }
  }

  const handleAccept = () => {
    onAccept(proposal)
    onOpenChange(false)
  }

  const handleReject = () => {
    if (onReject) {
      onReject()
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl border border-primary/20">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-orange-600 bg-clip-text text-transparent">
                AI Generated Proposal
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1.5">
                Review and customize your proposal before using it
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto px-6 py-4">
          <div className="bg-gradient-to-br from-muted/80 via-muted/50 to-muted/30 rounded-xl p-6 border border-border/50 shadow-sm">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <div
                className="text-foreground leading-relaxed text-[15px] [&_strong]:font-semibold [&_em]:italic [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:space-y-1 [&_li]:text-foreground [&_p]:mb-3 [&_p]:text-foreground/90"
                dangerouslySetInnerHTML={{
                  __html: parseMarkdown(proposal)
                    .split('\n')
                    .map((line) => {
                      const trimmed = line.trim()
                      // Don't wrap HTML tags or empty lines
                      if (trimmed.startsWith('<ul>') || trimmed.startsWith('</ul>') || trimmed.startsWith('<li>') || trimmed === '<br>' || !trimmed) {
                        return line
                      }
                      // Wrap regular text in paragraphs
                      return `<p>${line}</p>`
                    })
                    .join('')
                }}
              />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            <span>Generated by AI • {proposal.length} characters</span>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border bg-gray-100/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="gap-2 hover:bg-background transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-green-600">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleReject}
              className="gap-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-colors"
            >
              <X className="w-4 h-4" />
              Cancel
            </Button>
            <Button
              onClick={handleAccept}
              className="bg-gradient-to-r from-primary to-orange-600 hover:from-primary/90 hover:to-orange-600/90 text-primary-foreground gap-2 shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30"
            >
              <Check className="w-4 h-4" />
              Use This Proposal
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

