"use client"

import { Briefcase, Users, FileText, Heart } from "lucide-react"
import { DashboardHeader } from "./dashboard-header"
import { StatsCard } from "./stats-card"
import { Button } from "@/components/ui/button"

export default function DashboardPage() {
  return (
    <div className="flex flex-col h-full">
      <DashboardHeader />

      <div className="flex-1 overflow-auto p-8">
        <div className="space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="Active Jobs"
              value="24"
              icon={<Briefcase className="w-6 h-6" />}
              trend="↑ 12% from last week"
            />
            <StatsCard title="Profiles" value="8" icon={<Users className="w-6 h-6" />} trend="↑ 2 new profiles" />
            <StatsCard title="Templates" value="6" icon={<FileText className="w-6 h-6" />} trend="↑ 1 new template" />
            <StatsCard title="Saved Jobs" value="12" icon={<Heart className="w-6 h-6" />} trend="↑ 3 new saves" />
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button className="bg-primary hover:bg-orange-600 text-primary-foreground h-12">Browse Jobs</Button>
              <Button variant="outline" className="border-border h-12 bg-transparent">
                Create Profile
              </Button>
              <Button variant="outline" className="border-border h-12 bg-transparent">
                Write Proposal
              </Button>
              <Button variant="outline" className="border-border h-12 bg-transparent">
                View Templates
              </Button>
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h2>
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <div>
                    <p className="font-medium text-foreground">Saved "MERN Stack Event Management Web App"</p>
                    <p className="text-sm text-muted-foreground">2 hours ago</p>
                  </div>
                  <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full">Saved</span>
                </div>
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <div>
                    <p className="font-medium text-foreground">Created new profile "Full Stack Developer"</p>
                    <p className="text-sm text-muted-foreground">5 hours ago</p>
                  </div>
                  <span className="text-xs bg-green-500/10 text-green-600 px-3 py-1 rounded-full">Created</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Submitted proposal for "React Dashboard"</p>
                    <p className="text-sm text-muted-foreground">1 day ago</p>
                  </div>
                  <span className="text-xs bg-blue-500/10 text-blue-600 px-3 py-1 rounded-full">Submitted</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
