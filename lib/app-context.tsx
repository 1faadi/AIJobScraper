"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback } from "react"

interface SavedJob {
  jobId: string
  savedAt: string
}

interface AppContextType {
  savedJobs: SavedJob[]
  toggleSaveJob: (jobId: string) => void
  isJobSaved: (jobId: string) => boolean
  selectedProfile: string
  setSelectedProfile: (profileId: string) => void
  activeTab: "mostRecent" | "bestMatches" | "discarded"
  setActiveTab: (tab: "mostRecent" | "bestMatches" | "discarded") => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([])
  const [selectedProfile, setSelectedProfile] = useState("all")
  const [activeTab, setActiveTab] = useState<"mostRecent" | "bestMatches" | "discarded">("mostRecent")

  const toggleSaveJob = useCallback((jobId: string) => {
    setSavedJobs((prev) => {
      const isAlreadySaved = prev.some((job) => job.jobId === jobId)
      if (isAlreadySaved) {
        return prev.filter((job) => job.jobId !== jobId)
      } else {
        return [...prev, { jobId, savedAt: new Date().toISOString() }]
      }
    })
  }, [])

  const isJobSaved = useCallback(
    (jobId: string) => {
      return savedJobs.some((job) => job.jobId === jobId)
    },
    [savedJobs],
  )

  return (
    <AppContext.Provider
      value={{
        savedJobs,
        toggleSaveJob,
        isJobSaved,
        selectedProfile,
        setSelectedProfile,
        activeTab,
        setActiveTab,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider")
  }
  return context
}
