"use client"

import { useState, useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { formatDistanceToNow } from "date-fns"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Check, Loader2, AlertCircle } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

const promptConfigSchema = z.object({
  name: z.string().min(1).optional(),
  systemPrompt: z.string().min(1),
  temperature: z.number().min(0).max(1),
  maxTokens: z.number().int().min(100).max(2000),
  model: z.string().min(1),
})

type PromptConfigFormData = z.infer<typeof promptConfigSchema>

interface PromptConfig {
  id: string
  name: string
  systemPrompt: string
  temperature: number
  maxTokens: number
  model: string
  updatedAt: string
  createdAt: string
}

export default function PromptConfigPage() {
  const { toast } = useToast()
  const [config, setConfig] = useState<PromptConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
    reset,
  } = useForm<PromptConfigFormData>({
    resolver: zodResolver(promptConfigSchema),
    defaultValues: {
      systemPrompt: "",
      temperature: 0.7,
      maxTokens: 800,
      model: "openai/gpt-4o-mini",
    },
  })

  const systemPrompt = watch("systemPrompt")
  const temperature = watch("temperature")
  const maxTokens = watch("maxTokens")
  const model = watch("model")

  // Calculate character count and token estimate
  const stats = useMemo(() => {
    const charCount = systemPrompt.length
    const tokenEstimate = Math.ceil(charCount / 4)
    return { charCount, tokenEstimate }
  }, [systemPrompt])

  // Fetch config on mount
  useEffect(() => {
    fetchConfig()
  }, [])

  // Update form when config is loaded
  useEffect(() => {
    if (config) {
      reset({
        name: config.name,
        systemPrompt: config.systemPrompt,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        model: config.model,
      })
      setLastSaved(new Date(config.updatedAt))
    }
  }, [config, reset])

  const fetchConfig = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/prompt-config")
      if (!response.ok) {
        throw new Error("Failed to fetch prompt configuration")
      }
      const data = await response.json()
      setConfig(data.config)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load prompt configuration")
      console.error("Error fetching prompt config:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (data: PromptConfigFormData) => {
    setIsSaving(true)
    try {
      const response = await fetch("/api/prompt-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save prompt configuration")
      }

      const result = await response.json()
      setConfig(result.config)
      setLastSaved(new Date())
      reset(data, { keepValues: true })
      
      toast({
        title: "Success",
        description: "Prompt configuration updated successfully",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to save prompt configuration",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSavePrompt = () => {
    handleSubmit(onSubmit)()
  }

  const handleSaveSettings = () => {
    handleSubmit(onSubmit)()
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <div>
              <Skeleton className="h-9 w-64 mb-2" />
              <Skeleton className="h-5 w-96" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Skeleton className="h-[600px]" />
              </div>
              <div>
                <Skeleton className="h-[400px]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error && !config) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-7xl mx-auto">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <AlertCircle className="w-12 h-12 text-destructive" />
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2">Unable to load prompt configuration</h3>
                    <p className="text-muted-foreground mb-4">{error}</p>
                    <Button onClick={fetchConfig}>Retry</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Prompt Configuration</h1>
            <p className="text-muted-foreground">
              Control the system prompt and LLM settings used when generating Upwork proposals.
            </p>
          </div>

          {/* Main Content - 2 Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Prompt Editor */}
            <div className="lg:col-span-2">
              <Card className="flex flex-col h-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Proposal System Prompt</CardTitle>
                      <CardDescription className="mt-1">
                        <Badge variant="secondary" className="text-xs">
                          Used for proposal generation
                        </Badge>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="flex-1 flex flex-col">
                    <Textarea
                      {...register("systemPrompt")}
                      placeholder={`You are a professional freelancer writing a job proposal. Generate a COMPLETE, READY-TO-USE proposal based on the information provided below. Write the actual proposal text with real content - DO NOT use placeholders, template variables, or brackets like {{variable}}.

{{#if template}}
Template/Base Content:
{{template}}

{{/if}}
{{#if profile}}
Profile Information:
{{profile}}

{{/if}}
{{#if portfolio}}
Portfolio/Work Sample:
{{portfolio}}

{{/if}}
{{#if portfolios}}
{{portfolios}}
{{/if}}
{{#if caseStudies}}
{{caseStudies}}
{{/if}}
{{#if jobDescription}}
Job Description:
{{jobDescription}}

{{/if}}
{{#if content}}
Current Proposal Content:
{{content}}

{{/if}}
{{#if missingInfo}}
{{missingInfo}}
{{/if}}
Please generate a professional, compelling proposal that:
1. Addresses the job requirements effectively
2. Highlights relevant skills and experience from the profile
3. References relevant portfolio work when applicable
4. Maintains a professional and engaging tone
5. Is concise but comprehensive
6. Directly addresses how you can help solve the client's needs

CRITICAL FORMATTING RULES - YOU MUST FOLLOW THESE STRICTLY:
1. NEVER use em-dashes (—) or en-dashes (–) anywhere in your response.
2. NEVER use the Unicode characters U+2014 (em-dash) or U+2013 (en-dash).
3. Instead of em-dashes or en-dashes, use:
   - Regular hyphens (-) for compound words or ranges
   - Commas (,) for pauses or separations
   - Periods (.) for sentence breaks
4. Use ONLY standard ASCII punctuation: . , ! ? : ; - ( ) [ ] " '
5. Keep the text clean, professional, and free of any special Unicode dash characters.

Example of what NOT to do: "I have experience—especially in web development—that makes me perfect for this role."
Example of what TO do: "I have experience, especially in web development, that makes me perfect for this role."

Return only the enhanced proposal text without any additional commentary or explanations.`}
                      className="font-mono text-sm min-h-[400px] resize-y"
                    />
                    {errors.systemPrompt && (
                      <p className="text-sm text-destructive mt-1">{errors.systemPrompt.message}</p>
                    )}

                    {/* Footer Stats */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t text-xs text-muted-foreground">
                      <div>
                        {lastSaved && (
                          <span>
                            Last updated: {formatDistanceToNow(lastSaved, { addSuffix: true })}
                          </span>
                        )}
                      </div>
                      <div>
                        Characters: {stats.charCount.toLocaleString()} · ~{stats.tokenEstimate} tokens
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-4 sticky bottom-0 bg-card">
                  <Button
                    onClick={handleSavePrompt}
                    disabled={!isDirty || isSaving}
                    className="w-full"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Save Prompt
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </div>

            {/* Right Column - LLM Settings */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>LLM Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Model Select */}
                  <div className="space-y-2">
                    <Label htmlFor="model">Model</Label>
                    <Select
                      value={model}
                      onValueChange={(value) => setValue("model", value, { shouldDirty: true })}
                    >
                      <SelectTrigger id="model">
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="openai/gpt-4o-mini">gpt-4o-mini</SelectItem>
                        <SelectItem value="openai/gpt-4o">gpt-4o</SelectItem>
                        <SelectItem value="openai/gpt-4-turbo">gpt-4-turbo</SelectItem>
                        <SelectItem value="anthropic/claude-3.5-sonnet">claude-3.5-sonnet</SelectItem>
                        <SelectItem value="anthropic/claude-3-opus">claude-3-opus</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.model && (
                      <p className="text-sm text-destructive">{errors.model.message}</p>
                    )}
                  </div>

                  {/* Temperature Slider */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="temperature">Temperature</Label>
                      <Input
                        id="temperature"
                        type="number"
                        min="0"
                        max="1"
                        step="0.1"
                        value={temperature}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value)
                          if (!isNaN(val) && val >= 0 && val <= 1) {
                            setValue("temperature", val, { shouldDirty: true })
                          }
                        }}
                        className="w-20 h-8 text-sm"
                      />
                    </div>
                    <Slider
                      value={[temperature]}
                      onValueChange={([val]) => setValue("temperature", val, { shouldDirty: true })}
                      min={0}
                      max={1}
                      step={0.1}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      Lower = more deterministic, higher = more creative.
                    </p>
                    {errors.temperature && (
                      <p className="text-sm text-destructive">{errors.temperature.message}</p>
                    )}
                  </div>

                  {/* Max Tokens */}
                  <div className="space-y-2">
                    <Label htmlFor="maxTokens">Max Tokens</Label>
                    <Input
                      id="maxTokens"
                      type="number"
                      min="100"
                      max="2000"
                      step="100"
                      {...register("maxTokens", {
                        valueAsNumber: true,
                      })}
                      onChange={(e) => {
                        const val = parseInt(e.target.value)
                        if (!isNaN(val) && val >= 100 && val <= 2000) {
                          setValue("maxTokens", val, { shouldDirty: true })
                        }
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      Maximum tokens for the model response (not including prompt).
                    </p>
                    {errors.maxTokens && (
                      <p className="text-sm text-destructive">{errors.maxTokens.message}</p>
                    )}
                  </div>

                  {/* Preview Summary */}
                  <div className="pt-4 border-t">
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p className="font-medium text-foreground mb-2">Preview Summary</p>
                      <p>Using {model.split("/").pop()} at temperature {temperature.toFixed(1)}</p>
                      <p>· max {maxTokens} tokens</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-4">
                  <Button
                    onClick={handleSaveSettings}
                    disabled={!isDirty || isSaving}
                    className="w-full"
                    variant="outline"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Settings"
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

