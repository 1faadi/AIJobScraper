// API client utilities for making requests to the backend

export async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `/api${endpoint}`
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "API request failed")
  }

  return response.json()
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      apiCall("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
  },
  jobs: {
    getJobs: (profile?: string, tab?: string, page?: number) => {
      const params = new URLSearchParams()
      if (profile) params.append("profile", profile)
      if (tab) params.append("tab", tab)
      if (page) params.append("page", page.toString())
      return apiCall(`/jobs?${params.toString()}`)
    },
  },
  profiles: {
    getProfiles: (search?: string) => {
      const params = new URLSearchParams()
      if (search) params.append("search", search)
      return apiCall(`/profiles?${params.toString()}`)
    },
    createProfile: (data: any) =>
      apiCall("/profiles", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },
  templates: {
    getTemplates: () => apiCall("/templates"),
    createTemplate: (data: any) =>
      apiCall("/templates", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },
  proposals: {
    generate: (data: any) =>
      apiCall("/proposals/generate", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },
  savedJobs: {
    getSavedJobs: (userId?: string) => {
      const params = new URLSearchParams()
      if (userId) params.append("userId", userId)
      return apiCall(`/saved-jobs?${params.toString()}`)
    },
    saveJob: (jobId: string, userId?: string) =>
      apiCall("/saved-jobs", {
        method: "POST",
        body: JSON.stringify({ jobId, userId }),
      }),
    removeSavedJob: (jobId: string, userId?: string) =>
      apiCall("/saved-jobs", {
        method: "DELETE",
        body: JSON.stringify({ jobId, userId }),
      }),
  },
}
