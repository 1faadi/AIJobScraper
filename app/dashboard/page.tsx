"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Briefcase, Users, FileText, Heart } from "lucide-react"
import { DashboardHeader } from "./dashboard-header"
import { StatsCard } from "./stats-card"
import { Button } from "@/components/ui/button"

interface DashboardStats {
  activeJobs: { value: number; trend: string }
  profiles: { value: number; trend: string }
  templates: { value: number; trend: string }
  savedJobs: { value: number; trend: string }
}

interface Activity {
  id: string
  type: "profile" | "job" | "saved"
  title: string
  time: string
  badge: string
  badgeColor: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setIsLoading(true)
    try {
      const [statsRes, activityRes] = await Promise.all([
        fetch("/api/dashboard/stats"),
        fetch("/api/dashboard/activity"),
      ])

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData.stats)
      }

      if (activityRes.ok) {
        const activityData = await activityRes.json()
        setActivities(activityData.activities || [])
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <DashboardHeader />

      <div className="flex-1 overflow-auto p-8">
        <div className="space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoading ? (
              <>
                <StatsCard title="Active Jobs" value="..." icon={<Briefcase className="w-6 h-6" />} />
                <StatsCard title="Profiles" value="..." icon={<Users className="w-6 h-6" />} />
                <StatsCard title="Templates" value="..." icon={<FileText className="w-6 h-6" />} />
                <StatsCard title="Saved Jobs" value="..." icon={<Heart className="w-6 h-6" />} />
              </>
            ) : (
              <>
                <StatsCard
                  title="Active Jobs"
                  value={stats?.activeJobs.value ?? 0}
                  icon={<Briefcase className="w-6 h-6" />}
                  trend={stats?.activeJobs.trend}
                />
                <StatsCard
                  title="Profiles"
                  value={stats?.profiles.value ?? 0}
                  icon={<Users className="w-6 h-6" />}
                  trend={stats?.profiles.trend}
                />
                <StatsCard
                  title="Templates"
                  value={stats?.templates.value ?? 0}
                  icon={<FileText className="w-6 h-6" />}
                  trend={stats?.templates.trend}
                />
                <div
                  onClick={() => router.push("/dashboard/saved-jobs")}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <StatsCard
                    title="Saved Jobs"
                    value={stats?.savedJobs.value ?? 0}
                    icon={<Heart className="w-6 h-6" />}
                    trend={stats?.savedJobs.trend}
                  />
                </div>
              </>
            )}
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button
                onClick={() => router.push("/dashboard/jobs-feed")}
                className="bg-primary hover:bg-orange-600 text-primary-foreground h-12"
              >
                Browse Jobs
              </Button>
              <Button
                onClick={() => router.push("/dashboard/profiles")}
                variant="outline"
                className="border-border h-12 bg-transparent"
              >
                Create Profile
              </Button>
              <Button
                onClick={() => router.push("/dashboard/jobs-feed")}
                variant="outline"
                className="border-border h-12 bg-transparent"
              >
                Write Proposal
              </Button>
              <Button
                onClick={() => router.push("/dashboard/templates")}
                variant="outline"
                className="border-border h-12 bg-transparent"
              >
                View Templates
              </Button>
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h2>
            <div className="bg-card border border-border rounded-lg p-6">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading activity...</div>
              ) : activities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No recent activity</div>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity, index) => (
                    <div
                      key={activity.id}
                      className={`flex items-center justify-between ${
                        index < activities.length - 1 ? "pb-4 border-b border-border" : ""
                      }`}
                    >
                      <div>
                        <p className="font-medium text-foreground">{activity.title}</p>
                        <p className="text-sm text-muted-foreground">{activity.time}</p>
                      </div>
                      <span className={`text-xs px-3 py-1 rounded-full ${activity.badgeColor}`}>
                        {activity.badge}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
