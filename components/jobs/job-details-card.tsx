"use client"

interface Job {
  id: string
  title: string
  postedTime: string
  pricing: string
  budget: string
  level: string
  description: string
  skills: string[]
  paymentVerified: boolean
  rating: number
  hireRate: number
  openJobs: number
  totalSpend: number
  totalHires: number
  avgRate: number
  matchScore: number
  fitScore?: number
  bucket?: string
}

interface JobDetailsCardProps {
  job: Job
}

export function JobDetailsCard({ job }: JobDetailsCardProps) {
  // Mock job description content based on the reference image
  const jobDescriptionContent = `We're looking for a highly experienced Full-Stack Developer (7+ years) to build a modern, scalable web application that seamlessly integrates AI / machine learning capabilities for automation, intelligent user interaction, and data insights. The ideal candidate will design and deliver a production-grade system, from architecture to deployment, ensuring clean code, security, and performance.

Please read the responsibilities and scope clearly:`

  const responsibilities = [
    {
      title: "Frontend Development:",
      items: [
        "1. Build a responsive, high-performance UI using React / Next.js",
        "2. Implement modern UX patterns, state management, routing, and animations",
      ],
    },
    {
      title: "Backend Development:",
      items: [
        "1. Develop secure RESTful APIs with Node.js / Express or Python (FastAPI / Django)",
        "2. Architect scalable backend services, caching, and microservice structure",
      ],
    },
  ]

  return (
    <div className="bg-card border border-border rounded-lg shadow-sm p-6 h-fit lg:sticky lg:top-8">
      <div className="space-y-6">
        {/* Job Title */}
        <div>
          <h2 className="text-xl font-bold text-foreground mb-2">{job.title}</h2>
          <p className="text-sm text-muted-foreground">Posted {job.postedTime}</p>
        </div>

        {/* Job Description Section */}
        <div className="border-t border-border pt-4">
          <h3 className="font-semibold text-foreground mb-3">Job Descripiton</h3>
          <div className="space-y-4 text-sm text-foreground leading-relaxed max-h-[600px] overflow-y-auto">
            <p>{jobDescriptionContent}</p>

            <div>
              <h4 className="font-semibold text-foreground mb-3">Key Responsibilities & Scope</h4>
              {responsibilities.map((section, index) => (
                <div key={index} className="mb-4">
                  <h5 className="font-medium text-foreground mb-2">{section.title}</h5>
                  <ul className="space-y-1 ml-4">
                    {section.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="text-muted-foreground">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

