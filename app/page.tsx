"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { LoginForm } from "@/components/login-form"
import { RegisterForm } from "@/components/register-form"

export default function AuthPage() {
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard")
    }
  }, [isAuthenticated, router])

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with Logo */}
      <div className="p-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
            ⚙️
          </div>
          <span className="text-lg font-semibold text-foreground">AI Job Scraping</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4">
        {isLogin ? (
          <LoginForm 
            onSuccess={() => router.push("/dashboard")}
            onSwitchToRegister={() => setIsLogin(false)}
          />
        ) : (
          <RegisterForm 
            onSuccess={() => router.push("/dashboard")}
            onSwitchToLogin={() => setIsLogin(true)}
          />
        )}
      </div>

      {/* Footer */}
      <div className="p-6 text-sm text-muted-foreground">© 2025 AI Job Scraping</div>
    </div>
  )
}
