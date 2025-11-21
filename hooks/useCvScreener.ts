"use client"

import { useState } from "react"
import { CvScreenerResponse, CvScreenerError } from "@/lib/types/cv-screener"

export function useCvScreener() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<CvScreenerResponse | null>(null)

  const analyzeCv = async (params: { cvText?: string; file?: File }) => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const formData = new FormData()

      if (params.file) {
        formData.append("file", params.file)
      } else if (params.cvText) {
        formData.append("cvText", params.cvText)
      } else {
        throw new Error("Either cvText or file must be provided")
      }

      const response = await fetch("/api/cv-screener/analyze", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData: CvScreenerError = await response.json()
        throw new Error(errorData.message || "Failed to analyze CV")
      }

      const data: CvScreenerResponse = await response.json()
      setResult(data)
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to analyze CV"
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setError(null)
    setResult(null)
  }

  return {
    loading,
    error,
    result,
    analyzeCv,
    reset,
  }
}

