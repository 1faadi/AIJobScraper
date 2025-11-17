"use client"

import { Check, X, AlertCircle } from "lucide-react"
import { evaluateFit, PREFERRED_COUNTRIES, isVerified, toNumber, toPercent01 } from "@/lib/fit"

interface ScoreBreakdownProps {
  jobData: {
    clientCountry?: string
    paymentVerified?: boolean
    rating?: number
    hireRate?: number
    totalSpend?: number
    openJobs?: number
    matchScore?: number
    skills?: string[]
  }
  fitScore?: number
}

export function ScoreBreakdown({ jobData, fitScore }: ScoreBreakdownProps) {
  // Calculate scoring factors
  const country = (jobData.clientCountry || "").trim()
  const isPreferredCountry = PREFERRED_COUNTRIES.has(country)
  const verified = isVerified(jobData.paymentVerified)
  const rating = jobData.rating || 0
  // hireRate is already in percentage (0-100) from the API
  const hireRate = jobData.hireRate !== undefined ? jobData.hireRate / 100 : null // Convert to 0-1
  const totalSpent = (jobData.totalSpend || 0) * 1000 // Convert from K to actual
  const jobsPosted = jobData.openJobs || 0
  // matchScore is already in percentage (0-100) from the API
  const aiMatch = jobData.matchScore !== undefined ? jobData.matchScore / 100 : null // Convert to 0-1

  // Determine status for each factor
  const factors = [
    {
      label: "Country",
      status: isPreferredCountry ? "pass" : "fail",
      value: country || "Not specified",
      requirement: "Preferred country",
      icon: isPreferredCountry ? Check : X,
    },
    {
      label: "Payment Verified",
      status: verified ? "pass" : "fail",
      value: verified ? "Yes" : "No",
      requirement: "Payment verified",
      icon: verified ? Check : X,
    },
    {
      label: "Client Rating",
      status: rating >= 4.7 ? "pass" : rating >= 4.0 ? "warning" : "fail",
      value: `${rating.toFixed(1)}`,
      requirement: "≥ 4.7 (Best Fit), ≥ 4.0 (Minimum)",
      icon: rating >= 4.7 ? Check : rating >= 4.0 ? AlertCircle : X,
    },
    {
      label: "Hire Rate",
      status: hireRate === null ? "neutral" : hireRate >= 0.6 ? "pass" : "warning",
      value: hireRate !== null ? `${jobData.hireRate || 0}%` : "Not provided",
      requirement: "≥ 60% (Best Fit)",
      icon: hireRate === null ? AlertCircle : hireRate >= 0.6 ? Check : AlertCircle,
    },
    {
      label: "Spend/History",
      status: totalSpent >= 10000 || jobsPosted >= 50 ? "pass" : "warning",
      value: totalSpent >= 10000 
        ? `$${(totalSpent / 1000).toFixed(0)}K spent`
        : jobsPosted >= 50
        ? `${jobsPosted} jobs posted`
        : `$${(totalSpent / 1000).toFixed(0)}K / ${jobsPosted} jobs`,
      requirement: "≥ $10K OR ≥ 50 jobs",
      icon: totalSpent >= 10000 || jobsPosted >= 50 ? Check : AlertCircle,
    },
    {
      label: "AI Skills Match",
      status: aiMatch === null ? "neutral" : aiMatch >= 0.75 ? "pass" : aiMatch >= 0.5 ? "warning" : "fail",
      value: aiMatch !== null ? `${jobData.matchScore || 0}%` : "Not calculated",
      requirement: "≥ 75% (Best Fit)",
      icon: aiMatch === null ? AlertCircle : aiMatch >= 0.75 ? Check : aiMatch >= 0.5 ? AlertCircle : X,
      showProgress: true,
      progress: aiMatch || 0,
    },
  ]

  // Calculate overall score
  const getScore = () => {
    if (fitScore !== undefined) {
      if (fitScore === 0) return 25
      if (fitScore === 70) return 70
      if (fitScore === 100) return 90
      return fitScore
    }
    return jobData.matchScore || 0
  }

  const score = getScore()

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-[#0F172A]">Score Breakdown</h4>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-[#0F172A]">{score}%</span>
          <span className="text-xs text-[#64748B]">Overall Score</span>
        </div>
      </div>

      <div className="space-y-3">
        {factors.map((factor, index) => {
          const Icon = factor.icon
          const statusColors = {
            pass: "text-[#22C55E] bg-[#22C55E]/10 border-[#22C55E]/20",
            warning: "text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/20",
            fail: "text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/20",
            neutral: "text-[#64748B] bg-[#F1F5F9] border-[#E7ECF2]",
          }

          return (
            <div
              key={index}
              className="flex items-start gap-3 p-3 rounded-lg border bg-white"
            >
              {/* Icon */}
              <div
                className={`p-1.5 rounded-lg border flex-shrink-0 ${statusColors[factor.status]}`}
              >
                <Icon className="w-4 h-4" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-[#0F172A]">{factor.label}</span>
                  <span className="text-xs font-medium text-[#64748B]">{factor.value}</span>
                </div>
                
                {factor.showProgress && factor.progress !== undefined && (
                  <div className="mb-1.5">
                    <div className="h-1.5 bg-[#EEF2F6] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#FF6A00] to-[#F97316] transition-all duration-500"
                        style={{ width: `${factor.progress * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                <p className="text-xs text-[#64748B]">{factor.requirement}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Summary */}
      <div className="mt-4 p-3 bg-[#F7F8FA] rounded-lg border border-[#E7ECF2]">
        <p className="text-xs text-[#64748B] leading-relaxed">
          <strong className="text-[#0F172A]">Score Calculation:</strong> The overall score is based on multiple factors. 
          Jobs with all factors passing achieve 90-100% (Best Fit), while jobs with some issues score 70% (Medium Fit), 
          and jobs failing critical requirements score 25% (Not Fit).
        </p>
      </div>
    </div>
  )
}

