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

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

