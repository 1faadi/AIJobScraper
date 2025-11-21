"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { FileCheck, Upload, FileText, CheckCircle2, AlertCircle, X, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useCvScreener } from "@/hooks/useCvScreener"
import { AtsEvaluation, JobMatchScore } from "@/lib/types/cv-screener"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"

export default function CvScreenerPage() {
  const router = useRouter()
  const { loading, error, result, analyzeCv, reset } = useCvScreener()
  const [cvText, setCvText] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      // Try to read text file
      if (file.type === "text/plain" || file.name.endsWith(".txt")) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const text = e.target?.result as string
          setCvText(text)
        }
        reader.readAsText(file)
      }
    }
  }

  const handleAnalyze = async () => {
    try {
      if (selectedFile) {
        await analyzeCv({ file: selectedFile })
      } else if (cvText.trim().length >= 50) {
        await analyzeCv({ cvText: cvText.trim() })
      }
    } catch (err) {
      // Error is handled by the hook
      console.error("Analysis error:", err)
    }
  }

  const handleReset = () => {
    reset()
    setCvText("")
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const canAnalyze = (selectedFile || cvText.trim().length >= 50) && !loading

  return (
    <div className="flex-1 flex flex-col bg-[#F7F8FA] min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-[#E7ECF2] px-8 py-6">
        <div className="flex items-center gap-3 mb-2">
          <FileCheck className="w-6 h-6 text-[#FF6A00]" />
          <h1 className="text-2xl font-semibold text-[#0F172A]">CV Screener</h1>
        </div>
        <p className="text-sm text-[#64748B]">
          Upload your CV, check if it's ATS-friendly, and see which jobs you're best suited for.
        </p>
        <div className="mt-3">
          <Badge variant="outline" className="text-xs">
            <Sparkles className="w-3 h-3 mr-1" />
            Uses AI + your live job feed
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        {!result ? (
          <div className="max-w-6xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Upload or Paste Your CV</CardTitle>
                <CardDescription>
                  Get instant feedback on ATS-friendliness and discover matching jobs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="paste" className="w-full">
                  <TabsList className="mb-6">
                    <TabsTrigger value="upload">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload File
                    </TabsTrigger>
                    <TabsTrigger value="paste">
                      <FileText className="w-4 h-4 mr-2" />
                      Paste Text
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="upload" className="space-y-4">
                    <div
                      className="border-2 border-dashed border-[#E7ECF2] rounded-xl p-8 text-center cursor-pointer hover:border-[#FF6A00] transition-colors bg-[#F7F8FA]"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".txt,.pdf,.doc,.docx"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <Upload className="w-12 h-12 text-[#64748B] mx-auto mb-4" />
                      <p className="text-sm font-medium text-[#0F172A] mb-1">
                        Drop your CV here or click to upload
                      </p>
                      <p className="text-xs text-[#64748B]">
                        Supports .txt, .pdf, .doc, .docx files
                      </p>
                    </div>
                    {selectedFile && (
                      <div className="flex items-center justify-between p-3 bg-[#F7F8FA] rounded-lg border border-[#E7ECF2]">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-[#FF6A00]" />
                          <div>
                            <p className="text-sm font-medium text-[#0F172A]">{selectedFile.name}</p>
                            <p className="text-xs text-[#64748B]">
                              {(selectedFile.size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => {
                            setSelectedFile(null)
                            if (fileInputRef.current) {
                              fileInputRef.current.value = ""
                            }
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="paste" className="space-y-4">
                    <div className="relative">
                      <Textarea
                        placeholder="Paste your CV/resume text here..."
                        value={cvText}
                        onChange={(e) => setCvText(e.target.value)}
                        className="min-h-[300px] font-mono text-sm"
                      />
                      <div className="absolute bottom-3 right-3 text-xs text-[#64748B] bg-white px-2 py-1 rounded">
                        {cvText.length} characters
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                {error && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-800">
                      <AlertCircle className="w-5 h-5" />
                      <p className="text-sm font-medium">Error</p>
                    </div>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                )}

                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={handleAnalyze}
                    disabled={!canAnalyze}
                    className="bg-[#FF6A00] hover:bg-[#FF6A00]/90"
                  >
                    {loading ? (
                      <>
                        <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <FileCheck className="w-4 h-4 mr-2" />
                        Analyze CV
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: ATS Score & Summary */}
            <div className="space-y-6">
              <AtsScoreCard evaluation={result.ats} />
              {result.ats.verdict === "needs_improvement" && (
                <ImprovementCard evaluation={result.ats} />
              )}
            </div>

            {/* Right Column: Detailed Feedback & Job Matches */}
            <div className="space-y-6">
              {result.ats.verdict === "pass" ? (
                <PassCard evaluation={result.ats} />
              ) : (
                <FeedbackCard evaluation={result.ats} />
              )}

              {result.matchedJobs && result.matchedJobs.length > 0 && (
                <JobMatchesCard jobs={result.matchedJobs} />
              )}
            </div>

            {/* Reset Button */}
            <div className="lg:col-span-2 flex justify-end">
              <Button variant="outline" onClick={handleReset}>
                Analyze Another CV
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function AtsScoreCard({ evaluation }: { evaluation: AtsEvaluation }) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-amber-600"
    return "text-red-600"
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-green-50 border-green-200"
    if (score >= 60) return "bg-amber-50 border-amber-200"
    return "bg-red-50 border-red-200"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>ATS Assessment</CardTitle>
        <CardDescription>Your CV's ATS-friendliness score</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Score */}
        <div className="text-center">
          <div
            className={`inline-flex items-center justify-center w-32 h-32 rounded-full border-4 ${getScoreBgColor(
              evaluation.atsScore
            )} ${getScoreColor(evaluation.atsScore)}`}
          >
            <div className="text-center">
              <div className="text-4xl font-bold">{evaluation.atsScore}</div>
              <div className="text-sm font-medium">/ 100</div>
            </div>
          </div>
          <div className="mt-4">
            <Badge
              variant={evaluation.verdict === "pass" ? "default" : "destructive"}
              className="text-sm px-4 py-1"
            >
              {evaluation.verdict === "pass" ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Pass
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 mr-1" />
                  Needs Improvement
                </>
              )}
            </Badge>
          </div>
        </div>

        {/* Sub-scores */}
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-[#64748B]">Structure</span>
              <span className={`font-medium ${getScoreColor(evaluation.structureScore)}`}>
                {evaluation.structureScore}
              </span>
            </div>
            <Progress value={evaluation.structureScore} className="h-2" />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-[#64748B]">Formatting</span>
              <span className={`font-medium ${getScoreColor(evaluation.formattingScore)}`}>
                {evaluation.formattingScore}
              </span>
            </div>
            <Progress value={evaluation.formattingScore} className="h-2" />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-[#64748B]">Keywords</span>
              <span className={`font-medium ${getScoreColor(evaluation.keywordScore)}`}>
                {evaluation.keywordScore}
              </span>
            </div>
            <Progress value={evaluation.keywordScore} className="h-2" />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-[#64748B]">Clarity</span>
              <span className={`font-medium ${getScoreColor(evaluation.clarityScore)}`}>
                {evaluation.clarityScore}
              </span>
            </div>
            <Progress value={evaluation.clarityScore} className="h-2" />
          </div>
        </div>

        {/* Summary */}
        <div className="pt-4 border-t border-[#E7ECF2]">
          <p className="text-sm text-[#64748B]">{evaluation.summary}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function PassCard({ evaluation }: { evaluation: AtsEvaluation }) {
  return (
    <Card className="border-green-200 bg-green-50/50">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-[#0F172A] mb-1">Your CV is ATS-friendly!</h3>
            <p className="text-sm text-[#64748B]">
              Your CV is ready to match with jobs. Great work on maintaining a clean, structured format.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ImprovementCard({ evaluation }: { evaluation: AtsEvaluation }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-amber-600" />
          Needs Improvement
        </CardTitle>
        <CardDescription>Here are specific areas to fix before applying to jobs</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Strengths */}
        {evaluation.strengths.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-[#0F172A] mb-2">Strengths</h4>
            <ul className="space-y-1">
              {evaluation.strengths.map((strength, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-[#64748B]">
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Issues */}
        {evaluation.issues.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-[#0F172A] mb-2">Critical Issues</h4>
            <ul className="space-y-1">
              {evaluation.issues.map((issue, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-[#64748B]">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <span>{issue}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function FeedbackCard({ evaluation }: { evaluation: AtsEvaluation }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recommendations</CardTitle>
        <CardDescription>Actionable steps to improve your CV</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {evaluation.recommendations.map((rec, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-3 bg-[#F7F8FA] rounded-lg border border-[#E7ECF2]"
            >
              <div className="w-5 h-5 rounded-full border-2 border-[#E7ECF2] flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium text-[#64748B]">{idx + 1}</span>
              </div>
              <p className="text-sm text-[#0F172A] flex-1">{rec}</p>
            </div>
          ))}
        </div>

        {evaluation.suggestedSections.length > 0 && (
          <div className="mt-6 pt-6 border-t border-[#E7ECF2]">
            <h4 className="text-sm font-semibold text-[#0F172A] mb-3">Suggested Sections</h4>
            <div className="flex flex-wrap gap-2">
              {evaluation.suggestedSections.map((section, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {section}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function JobMatchesCard({ jobs }: { jobs: JobMatchScore[] }) {
  const router = useRouter()

  const getBucketColor = (bucket?: string) => {
    if (bucket === "BEST_FIT") return "bg-green-100 text-green-800 border-green-200"
    if (bucket === "P70_PERCENT") return "bg-amber-100 text-amber-800 border-amber-200"
    return "bg-gray-100 text-gray-800 border-gray-200"
  }

  const getMatchColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-amber-600"
    return "text-gray-600"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Best Matching Jobs</CardTitle>
        <CardDescription>
          {jobs.length} job{jobs.length !== 1 ? "s" : ""} matched your CV
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {jobs.map((job) => (
            <div
              key={job.jobId}
              className="p-4 bg-[#F7F8FA] rounded-lg border border-[#E7ECF2] hover:border-[#FF6A00] transition-colors"
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-[#0F172A] mb-1">{job.jobTitle}</h4>
                  <div className="flex items-center gap-2 flex-wrap">
                    {job.bucket && (
                      <Badge variant="outline" className={`text-xs ${getBucketColor(job.bucket)}`}>
                        {job.bucket === "P70_PERCENT" ? "70% Match" : job.bucket}
                      </Badge>
                    )}
                    {job.clientCountry && (
                      <span className="text-xs text-[#64748B]">{job.clientCountry}</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${getMatchColor(job.matchScore)}`}>
                    {job.matchScore}
                  </div>
                  <div className="text-xs text-[#64748B]">Match</div>
                </div>
              </div>
              <p className="text-sm text-[#64748B] mb-3">{job.shortReason}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/dashboard/jobs-feed/${job.jobId}`)}
                className="w-full"
              >
                View Job Details
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

