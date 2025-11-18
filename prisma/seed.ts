import { PrismaClient } from '@prisma/client'
import * as XLSX from 'xlsx'
import * as path from 'path'
import { evaluateFit, type Bucket } from '../lib/fit'

type FitBucket = 'NOT_FIT' | 'P70_PERCENT' | 'BEST_FIT'

// Map fit.ts Bucket to Prisma FitBucket enum
function mapBucketToPrisma(bucket: Bucket): FitBucket {
  if (bucket === '70_PERCENT') return 'P70_PERCENT'
  return bucket as FitBucket
}

const prisma = new PrismaClient()

// Map Excel headers to Prisma field names
const headerMap: Record<string, string> = {
  'Job Title': 'jobTitle',
  'Job Description': 'jobDescription',
  'Client Details (Raw)': 'clientDetailsRaw',
  'Skills (Raw)': 'skillsRaw',
  'Client Country': 'clientCountry',
  'Payment Verified': 'paymentVerified',
  'Client Rating': 'clientRating',
  'Jobs Posted': 'jobsPosted',
  'Hire Rate (%)': 'hireRate',
  'Total Spent ($)': 'totalSpent',
  'Hires': 'hires',
  'Active Jobs': 'activeJobs',
  'Avg Hourly Paid ($)': 'avgHourlyPaid',
  'Total Hours': 'totalHours',
  'Member Since': 'memberSince',
  'AI Match %': 'aiMatchPercent',
  'Bucket (Fit Result)': 'bucket',
  'Reasons / Notes': 'reasonsNotes',
  'Category': 'category',
  'Industry': 'industry',
}

// Map bucket values from Excel to enum
function mapBucket(value: string | number | null | undefined): FitBucket {
  if (!value) return 'NOT_FIT'
  
  const str = String(value).trim().toUpperCase()
  
  if (str.includes('NOT_FIT') || str.includes('NOT FIT')) {
    return 'NOT_FIT'
  }
  if (str.includes('70') || str.includes('_70_PERCENT') || str.includes('P70_PERCENT') || str.includes('70%')) {
    return 'P70_PERCENT'
  }
  if (str.includes('BEST_FIT') || str.includes('BEST FIT')) {
    return 'BEST_FIT'
  }
  
  // Default fallback
  return 'NOT_FIT'
}

// Convert percentage string to float (0-1)
function parsePercentage(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null
  
  const num = typeof value === 'number' ? value : parseFloat(String(value))
  if (isNaN(num)) return null
  
  // If already in 0-1 range, return as is
  if (num <= 1) return num
  
  // If in 0-100 range, convert to 0-1
  if (num <= 100) return num / 100
  
  return num
}

// Convert to boolean
function parseBoolean(value: string | number | boolean | null | undefined): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim()
    return lower === 'true' || lower === 'yes' || lower === '1' || lower === 'verified'
  }
  return false
}

// Convert to number or null
function parseNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null
  const num = typeof value === 'number' ? value : parseFloat(String(value))
  return isNaN(num) ? null : num
}

// Convert to integer or null
function parseInteger(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null
  const num = typeof value === 'number' ? value : Number.parseInt(String(value), 10)
  return Number.isNaN(num) ? null : num
}

// Convert to string or null
function parseString(value: any): string | null {
  if (value === null || value === undefined) return null
  return String(value).trim() || null
}

async function main() {
  console.log('🌱 Starting seed...')

  // Seed Profiles, Portfolios, Case Studies, and Templates first
  await seedProfilesAndRelated()
  await seedTemplates()

  // Read Excel file
  const excelPath = path.join(process.cwd(), 'jobs_with_bucket.xlsx')
  console.log(`📖 Reading Excel file: ${excelPath}`)

  const workbook = XLSX.readFile(excelPath)
  const sheetName = workbook.SheetNames[0] // First worksheet
  const worksheet = workbook.Sheets[sheetName]
  
  // Convert to JSON
  const data = XLSX.utils.sheet_to_json(worksheet, { raw: false })
  
  console.log(`📊 Found ${data.length} rows in Excel file`)

  // Clear existing jobs
  console.log('🗑️  Clearing existing jobs...')
  await prisma.job.deleteMany({})
  console.log('✅ Cleared existing jobs')

  // Process and insert jobs
  console.log('📝 Inserting jobs...')
  let successCount = 0
  let errorCount = 0

  for (let i = 0; i < data.length; i++) {
    const row = data[i] as Record<string, any>
    
    try {
      // Map Excel row to Prisma Job model
      const jobData: any = {}
      
      // Map each field
      for (const [excelHeader, prismaField] of Object.entries(headerMap)) {
        const value = row[excelHeader]
        
        switch (prismaField) {
          case 'jobTitle':
          case 'jobDescription':
          case 'clientDetailsRaw':
          case 'skillsRaw':
          case 'clientCountry':
          case 'memberSince':
          case 'reasonsNotes':
          case 'category':
          case 'industry':
            jobData[prismaField] = parseString(value) || ''
            break
          
          case 'paymentVerified':
            jobData[prismaField] = parseBoolean(value)
            break
          
          case 'clientRating':
            const rating = parseNumber(value)
            jobData[prismaField] = rating !== null ? rating : 0
            break
          
          case 'hireRate':
          case 'aiMatchPercent':
            jobData[prismaField] = parsePercentage(value)
            break
          
          case 'totalSpent':
          case 'avgHourlyPaid':
            jobData[prismaField] = parseNumber(value)
            break
          
          case 'jobsPosted':
          case 'hires':
          case 'activeJobs':
          case 'totalHours':
            jobData[prismaField] = parseInteger(value)
            break
          
          case 'bucket':
            jobData[prismaField] = mapBucket(value)
            break
        }
      }

      // Validate required fields
      if (!jobData.jobTitle || !jobData.jobDescription || !jobData.clientDetailsRaw || 
          !jobData.skillsRaw || !jobData.clientCountry) {
        console.warn(`⚠️  Row ${i + 2}: Missing required fields, skipping...`)
        errorCount++
        continue
      }

      // Calculate fit score using the fit evaluation logic
      const fitResult = evaluateFit({
        clientCountry: jobData.clientCountry,
        paymentVerified: jobData.paymentVerified,
        clientRating: jobData.clientRating,
        jobsPosted: jobData.jobsPosted,
        hireRate: jobData.hireRate,
        totalSpent: jobData.totalSpent,
        aiMatchPercent: jobData.aiMatchPercent,
      })

      // Update bucket and add fitScore
      jobData.bucket = mapBucketToPrisma(fitResult.bucket)
      jobData.fitScore = fitResult.fitScore

      // Insert job
      await prisma.job.create({
        data: jobData
      })

      successCount++
      
      if ((i + 1) % 100 === 0) {
        console.log(`  ✅ Processed ${i + 1}/${data.length} rows...`)
      }
    } catch (error) {
      console.error(`❌ Error processing row ${i + 2}:`, error)
      errorCount++
    }
  }

  console.log('\n✨ Seed completed!')
  console.log(`  ✅ Successfully inserted: ${successCount} jobs`)
  if (errorCount > 0) {
    console.log(`  ❌ Errors: ${errorCount} rows`)
  }
}

async function seedProfilesAndRelated() {
  console.log('\n👤 Seeding profiles, portfolios, and case studies...')

  // Clear existing data
  await prisma.caseStudy.deleteMany({})
  await prisma.portfolio.deleteMany({})
  await prisma.profile.deleteMany({})
  console.log('✅ Cleared existing profiles, portfolios, and case studies')

  // Profile 1: Full-Stack Developer
  const profile1 = await prisma.profile.create({
    data: {
      name: 'Sarah Chen',
      title: 'Senior Full-Stack Developer',
      hourlyRate: '$75/hr',
      jobSuccess: '98%',
      experience: '8+ Years',
      badge: 'top-rated',
      overview: 'Experienced full-stack developer specializing in React, Node.js, and cloud architecture. I build scalable web applications with a focus on performance and user experience. Proven track record of delivering complex projects on time and within budget.',
      skills: ['React', 'Next.js', 'TypeScript', 'Node.js', 'PostgreSQL', 'AWS', 'Docker', 'GraphQL', 'MongoDB', 'Tailwind CSS'],
      tags: ['fullstack', 'react', 'nodejs', 'typescript', 'aws'],
    },
  })

  await prisma.portfolio.createMany({
    data: [
      {
        profileId: profile1.id,
        title: 'E-Commerce Platform with Real-time Inventory',
        description: 'Built a scalable e-commerce platform handling 10K+ daily transactions. Implemented real-time inventory management, payment processing, and order tracking. Tech stack: Next.js, Node.js, PostgreSQL, Redis, Stripe API.',
        category: 'E-Commerce',
      },
      {
        profileId: profile1.id,
        title: 'SaaS Dashboard for Analytics',
        description: 'Developed a comprehensive analytics dashboard for a SaaS startup. Features include real-time data visualization, custom reports, and team collaboration tools. Reduced data processing time by 60%.',
        category: 'SaaS',
      },
      {
        profileId: profile1.id,
        title: 'Mobile-First Restaurant Ordering System',
        description: 'Created a mobile-first ordering system with admin panel for restaurant management. Integrated with payment gateways and delivery APIs. Increased order volume by 45% for client.',
        category: 'Mobile Web',
      },
    ],
  })

  await prisma.caseStudy.createMany({
    data: [
      {
        profileId: profile1.id,
        title: 'Migration from Legacy System to Modern Stack',
        description: 'Led migration of a legacy PHP application to a modern React/Node.js stack. Reduced page load times by 70%, improved developer productivity, and cut hosting costs by 40%. Project completed 2 weeks ahead of schedule.',
        category: 'Migration',
      },
      {
        profileId: profile1.id,
        title: 'High-Traffic API Optimization',
        description: 'Optimized REST API handling 1M+ requests daily. Implemented caching strategies, database query optimization, and load balancing. Achieved 99.9% uptime and reduced response time by 50%.',
        category: 'Performance',
      },
    ],
  })

  // Profile 2: AI/ML Engineer
  const profile2 = await prisma.profile.create({
    data: {
      name: 'Michael Rodriguez',
      title: 'AI/ML Engineer & Data Scientist',
      hourlyRate: '$90/hr',
      jobSuccess: '100%',
      experience: '6+ Years',
      badge: 'expert',
      overview: 'AI/ML engineer with expertise in deep learning, NLP, and computer vision. I help businesses leverage AI to solve complex problems, from recommendation systems to automated content generation. Published researcher with 5+ papers in top-tier conferences.',
      skills: ['Python', 'TensorFlow', 'PyTorch', 'OpenAI API', 'LangChain', 'NLP', 'Computer Vision', 'MLOps', 'AWS SageMaker', 'Pandas'],
      tags: ['ai', 'ml', 'nlp', 'python', 'deep-learning'],
    },
  })

  await prisma.portfolio.createMany({
    data: [
      {
        profileId: profile2.id,
        title: 'Custom LLM Integration for Customer Support',
        description: 'Built an AI-powered customer support system using fine-tuned LLM models. Reduced response time by 80% and improved customer satisfaction scores by 35%. Integrated with existing CRM systems.',
        category: 'AI Integration',
      },
      {
        profileId: profile2.id,
        title: 'Image Classification System for E-Commerce',
        description: 'Developed a computer vision system for automatic product categorization. Achieved 95% accuracy using custom CNN architecture. Processed 50K+ product images daily.',
        category: 'Computer Vision',
      },
      {
        profileId: profile2.id,
        title: 'Recommendation Engine for Content Platform',
        description: 'Created a hybrid recommendation system combining collaborative filtering and content-based approaches. Increased user engagement by 45% and average session duration by 60%.',
        category: 'Machine Learning',
      },
    ],
  })

  await prisma.caseStudy.createMany({
    data: [
      {
        profileId: profile2.id,
        title: 'Chatbot Development with RAG Architecture',
        description: 'Designed and implemented a RAG-based chatbot for a knowledge base with 10K+ documents. Achieved 92% accuracy in answering user queries. Reduced support ticket volume by 70%.',
        category: 'NLP',
      },
      {
        profileId: profile2.id,
        title: 'Predictive Analytics for Sales Forecasting',
        description: 'Built a time-series forecasting model for sales prediction. Improved forecast accuracy by 30% compared to previous methods. Model deployed in production with real-time inference.',
        category: 'Predictive Analytics',
      },
    ],
  })

  // Profile 3: Frontend Specialist
  const profile3 = await prisma.profile.create({
    data: {
      name: 'Emily Watson',
      title: 'Senior Frontend Developer',
      hourlyRate: '$65/hr',
      jobSuccess: '96%',
      experience: '7+ Years',
      badge: 'top-rated',
      overview: 'Frontend specialist focused on creating beautiful, performant, and accessible user interfaces. Expert in React, Vue.js, and modern CSS. Passionate about design systems and component architecture. I turn complex requirements into intuitive user experiences.',
      skills: ['React', 'Vue.js', 'TypeScript', 'CSS3', 'SASS', 'Tailwind CSS', 'Figma', 'Webpack', 'Vite', 'Jest'],
      tags: ['frontend', 'react', 'vue', 'ui-ux', 'typescript'],
    },
  })

  await prisma.portfolio.createMany({
    data: [
      {
        profileId: profile3.id,
        title: 'Design System & Component Library',
        description: 'Created a comprehensive design system with 50+ reusable components. Implemented Storybook documentation, accessibility features, and dark mode support. Used by 20+ developers across the organization.',
        category: 'Design Systems',
      },
      {
        profileId: profile3.id,
        title: 'Interactive Data Visualization Dashboard',
        description: 'Built a real-time data visualization dashboard with D3.js and React. Features include interactive charts, filters, and export functionality. Handles 100K+ data points with smooth performance.',
        category: 'Data Visualization',
      },
      {
        profileId: profile3.id,
        title: 'Progressive Web App for Mobile',
        description: 'Developed a PWA with offline capabilities, push notifications, and app-like experience. Achieved 95+ Lighthouse score. Increased mobile engagement by 55%.',
        category: 'PWA',
      },
    ],
  })

  await prisma.caseStudy.createMany({
    data: [
      {
        profileId: profile3.id,
        title: 'Performance Optimization: 3s to 0.5s Load Time',
        description: 'Optimized a slow-loading React application. Implemented code splitting, lazy loading, image optimization, and caching strategies. Reduced initial load time from 3 seconds to 0.5 seconds.',
        category: 'Performance',
      },
      {
        profileId: profile3.id,
        title: 'Accessibility Audit & Remediation',
        description: 'Conducted comprehensive accessibility audit and fixed 150+ WCAG violations. Achieved WCAG 2.1 AA compliance. Improved screen reader compatibility and keyboard navigation.',
        category: 'Accessibility',
      },
    ],
  })

  // Profile 4: Backend/DevOps Engineer
  const profile4 = await prisma.profile.create({
    data: {
      name: 'James Kim',
      title: 'Backend Engineer & DevOps Specialist',
      hourlyRate: '$80/hr',
      jobSuccess: '99%',
      experience: '9+ Years',
      badge: 'expert',
      overview: 'Backend engineer and DevOps specialist with deep expertise in microservices, cloud infrastructure, and system architecture. I design and build scalable, reliable systems that handle millions of requests. Expert in containerization, CI/CD, and infrastructure as code.',
      skills: ['Python', 'Go', 'Docker', 'Kubernetes', 'AWS', 'Terraform', 'PostgreSQL', 'Redis', 'RabbitMQ', 'Grafana'],
      tags: ['backend', 'devops', 'aws', 'kubernetes', 'microservices'],
    },
  })

  await prisma.portfolio.createMany({
    data: [
      {
        profileId: profile4.id,
        title: 'Microservices Architecture Migration',
        description: 'Architected and implemented migration from monolithic to microservices architecture. Reduced deployment time by 80%, improved system reliability, and enabled independent scaling of services.',
        category: 'Architecture',
      },
      {
        profileId: profile4.id,
        title: 'CI/CD Pipeline with Automated Testing',
        description: 'Built comprehensive CI/CD pipeline with automated testing, security scanning, and deployment automation. Reduced deployment time from 2 hours to 15 minutes. Achieved 99.9% deployment success rate.',
        category: 'DevOps',
      },
      {
        profileId: profile4.id,
        title: 'High-Performance API Gateway',
        description: 'Developed a custom API gateway handling 10M+ requests daily. Implemented rate limiting, authentication, request routing, and monitoring. Achieved sub-10ms latency.',
        category: 'Backend',
      },
    ],
  })

  await prisma.caseStudy.createMany({
    data: [
      {
        profileId: profile4.id,
        title: 'Database Optimization: 10x Performance Improvement',
        description: 'Optimized PostgreSQL database queries and schema design. Implemented indexing strategies, query optimization, and connection pooling. Reduced average query time from 500ms to 50ms.',
        category: 'Database',
      },
      {
        profileId: profile4.id,
        title: 'Infrastructure Cost Reduction Project',
        description: 'Redesigned cloud infrastructure using auto-scaling, reserved instances, and cost optimization strategies. Reduced monthly AWS costs by 45% while maintaining performance and reliability.',
        category: 'Cost Optimization',
      },
    ],
  })

  // Profile 5: Mobile Developer
  const profile5 = await prisma.profile.create({
    data: {
      name: 'Alexandra Park',
      title: 'Mobile App Developer',
      hourlyRate: '$70/hr',
      jobSuccess: '97%',
      experience: '5+ Years',
      badge: 'rising-talent',
      overview: 'Mobile app developer specializing in React Native and Flutter. I build cross-platform mobile applications with native performance. Experienced in app store deployment, push notifications, and mobile analytics.',
      skills: ['React Native', 'Flutter', 'iOS', 'Android', 'TypeScript', 'Firebase', 'Redux', 'GraphQL', 'App Store', 'Play Store'],
      tags: ['mobile', 'react-native', 'flutter', 'ios', 'android'],
    },
  })

  await prisma.portfolio.createMany({
    data: [
      {
        profileId: profile5.id,
        title: 'Fitness Tracking App with Social Features',
        description: 'Developed a cross-platform fitness app with workout tracking, social sharing, and progress analytics. Integrated with wearables and health APIs. Achieved 4.8+ app store rating with 50K+ downloads.',
        category: 'Mobile App',
      },
      {
        profileId: profile5.id,
        title: 'E-Commerce Mobile App',
        description: 'Built a feature-rich e-commerce mobile app with offline support, push notifications, and secure payment integration. Increased mobile sales by 60% for the client.',
        category: 'E-Commerce',
      },
      {
        profileId: profile5.id,
        title: 'Real-time Chat Application',
        description: 'Created a real-time messaging app with video calls, file sharing, and group chats. Handles 1000+ concurrent users with low latency. Built with React Native and WebSocket technology.',
        category: 'Communication',
      },
    ],
  })

  await prisma.caseStudy.createMany({
    data: [
      {
        profileId: profile5.id,
        title: 'App Performance Optimization',
        description: 'Optimized React Native app performance by reducing bundle size, implementing code splitting, and optimizing images. Improved app startup time by 50% and reduced memory usage by 30%.',
        category: 'Performance',
      },
      {
        profileId: profile5.id,
        title: 'Cross-Platform Code Sharing Strategy',
        description: 'Implemented a code sharing strategy between iOS and Android using React Native. Achieved 85% code reuse, reducing development time by 40% and ensuring consistent user experience.',
        category: 'Architecture',
      },
    ],
  })

  console.log('✅ Seeded 5 profiles with portfolios and case studies')
}

async function seedTemplates() {
  console.log('\n📝 Seeding proposal templates...')

  // Clear existing templates
  await prisma.template.deleteMany({})
  console.log('✅ Cleared existing templates')

  await prisma.template.createMany({
    data: [
      {
        name: 'Professional & Direct',
        content: `Hi [Client Name],

I've reviewed your project requirements and I'm excited about the opportunity to work with you. With my experience in [relevant skills], I'm confident I can deliver exactly what you need.

Here's what I bring to the table:
- [Key skill/experience point 1]
- [Key skill/experience point 2]
- [Key skill/experience point 3]

I understand that [specific project requirement/concern]. My approach will be to [your approach/solution].

I'm available to start immediately and can commit [time availability]. I'm also happy to provide regular updates and maintain open communication throughout the project.

Looking forward to discussing this further!

Best regards,
[Your Name]`,
      },
      {
        name: 'Results-Focused',
        content: `Hello [Client Name],

I specialize in [your expertise area] and have a proven track record of delivering results for clients similar to yours.

In my previous projects, I've:
- [Specific achievement with metrics]
- [Another achievement with metrics]
- [Third achievement with metrics]

For your project, I'll focus on [key deliverables] and ensure [specific outcome]. I work efficiently and always prioritize quality and client satisfaction.

I'm available [time availability] and can start right away. I'm also flexible with communication preferences and time zones.

Let's schedule a call to discuss your project in detail.

Best,
[Your Name]`,
      },
      {
        name: 'Friendly & Collaborative',
        content: `Hi there [Client Name],

Thanks for posting this opportunity! Your project sounds really interesting, and I'd love to help bring it to life.

A bit about me: I'm a [your role] with [X] years of experience in [relevant field]. I've worked on similar projects before, including [brief example], and I'm passionate about [relevant passion/interest].

What I can offer:
- [Skill/benefit 1]
- [Skill/benefit 2]
- [Skill/benefit 3]

I believe in clear communication, regular check-ins, and making sure you're happy with the work every step of the way. I'm also open to feedback and iterations to ensure we get it just right.

I'm available [time availability] and excited to get started!

Feel free to reach out if you have any questions.

Cheers,
[Your Name]`,
      },
      {
        name: 'Technical & Detailed',
        content: `Dear [Client Name],

I've carefully analyzed your project requirements and I'm confident I have the technical expertise to deliver a high-quality solution.

Technical Approach:
- Technology Stack: [relevant technologies]
- Architecture: [your approach]
- Key Features: [main features you'll implement]

My Experience:
- [X] years working with [relevant technology/domain]
- Successfully completed [number] similar projects
- Expertise in [specific technical areas]

Project Timeline:
- Phase 1: [deliverable] - [timeframe]
- Phase 2: [deliverable] - [timeframe]
- Phase 3: [deliverable] - [timeframe]

I'll provide:
- Clean, well-documented code
- Regular progress updates
- Testing and quality assurance
- Post-launch support

I'm available [time availability] and can start immediately. Let's discuss the technical details further.

Best regards,
[Your Name]`,
      },
      {
        name: 'Quick & Concise',
        content: `Hi [Client Name],

I'm a [your role] with expertise in [key skills]. I've completed [number] similar projects and can deliver [key deliverables] for your project.

Key strengths:
- [Strength 1]
- [Strength 2]
- [Strength 3]

Available [time availability]. Ready to start immediately.

Let's discuss!

[Your Name]`,
      },
      {
        name: 'Problem-Solver',
        content: `Hello [Client Name],

I understand you need [main requirement]. Having worked on similar challenges, I can help you achieve [desired outcome].

The Challenge:
[Briefly acknowledge their specific challenge/need]

My Solution:
[Your approach to solving it]

Why I'm the Right Fit:
- [Relevant experience/qualification 1]
- [Relevant experience/qualification 2]
- [Relevant experience/qualification 3]

I'm available [time availability] and can start right away. I'm committed to understanding your needs and delivering a solution that exceeds expectations.

Looking forward to working with you!

Best,
[Your Name]`,
      },
    ],
  })

  console.log('✅ Seeded 6 proposal templates')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

