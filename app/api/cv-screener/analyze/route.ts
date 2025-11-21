import { type NextRequest, NextResponse } from "next/server"
import { analyzeAtsFriendliness, matchCvToJobs } from "@/lib/ai/analyzeCv"
import { CvScreenerResponse, CvScreenerError } from "@/lib/types/cv-screener"

// Lazy load pdf-parse to avoid initialization issues
// Note: pdf-parse v1.1.1 has a known issue where it tries to access test files during init
// We handle this gracefully by catching the error and providing a helpful message
let pdfParseModule: any = null
let pdfParseLoadAttempted = false

function getPdfParse() {
  if (!pdfParseModule && !pdfParseLoadAttempted) {
    pdfParseLoadAttempted = true
    
    // Ensure test directory exists (workaround for pdf-parse v1.1.1 bug)
    try {
      const fs = require('fs')
      const path = require('path')
      const testDir = path.join(process.cwd(), 'test', 'data')
      if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true })
      }
      // Create a minimal valid PDF if it doesn't exist
      const testFile = path.join(testDir, '05-versions-space.pdf')
      if (!fs.existsSync(testFile)) {
        const minimalPdf = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\nxref\n0 1\ntrailer\n<< /Size 1 /Root 1 0 R >>\nstartxref\n9\n%%EOF')
        fs.writeFileSync(testFile, minimalPdf)
      }
    } catch (setupError) {
      // Ignore setup errors - try to load anyway
      console.warn("Could not create test directory structure:", setupError)
    }
    
    // Try to load pdf-parse
    // Note: pdf-parse v1.1.1 may throw an error during require due to test file access
    // but the module might still be usable, so we check the cache
    try {
      pdfParseModule = require("pdf-parse")
    } catch (error: any) {
      // Error occurred, but check if module was still cached
      if (error?.code === 'ENOENT' && error?.path?.includes('test')) {
        // Known issue - test file access error
        // Try to get module from cache (sometimes module loads despite error)
        try {
          const Module = require('module')
          const resolvedPath = require.resolve('pdf-parse')
          const cached = Module._cache[resolvedPath]
          if (cached?.exports) {
            pdfParseModule = cached.exports
          }
        } catch {
          // Cache access failed
        }
      }
      
      // If we still don't have the module, it's truly unavailable
      if (!pdfParseModule) {
        console.warn("pdf-parse failed to load:", error?.message)
      }
    }
    
    // Verify it's actually a function
    if (pdfParseModule && typeof pdfParseModule !== 'function') {
      pdfParseModule = null
    }
  }
  
  if (!pdfParseModule) {
    throw new Error("PDF parsing is currently unavailable. Please paste your CV text directly or upload a .txt file.")
  }
  
  return pdfParseModule
}

/**
 * API endpoint for CV analysis
 * Supports both file upload (multipart/form-data) and text input (JSON)
 */
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || ""

    let cvText: string = ""

    // Handle file upload (multipart/form-data)
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData()
      const file = formData.get("file") as File | null
      const textInput = formData.get("cvText") as string | null

      if (file) {
        // Extract text from file
        const fileText = await extractTextFromFile(file)
        cvText = fileText
      } else if (textInput) {
        cvText = textInput
      } else {
        return NextResponse.json(
          { message: "Either file or cvText must be provided" } as CvScreenerError,
          { status: 400 }
        )
      }
    } else {
      // Handle JSON body
      const body = await request.json()
      cvText = body.cvText

      if (!cvText || typeof cvText !== "string" || cvText.trim().length === 0) {
        return NextResponse.json(
          { message: "cvText is required and must be a non-empty string" } as CvScreenerError,
          { status: 400 }
        )
      }
    }

    // Validate minimum length
    if (cvText.trim().length < 50) {
      return NextResponse.json(
        { message: "CV text must be at least 50 characters long" } as CvScreenerError,
        { status: 400 }
      )
    }

    // Step 1: Analyze ATS friendliness
    console.log("Analyzing CV for ATS friendliness...")
    const atsEvaluation = await analyzeAtsFriendliness(cvText)

    const response: CvScreenerResponse = {
      ats: atsEvaluation,
    }

    // Step 2: If ATS score is good enough (>= 70), match against jobs
    if (atsEvaluation.atsScore >= 70) {
      console.log("ATS score is good, matching CV to jobs...")
      try {
        const matchedJobs = await matchCvToJobs(cvText, 10)
        response.matchedJobs = matchedJobs
      } catch (error) {
        console.error("Error matching jobs (non-fatal):", error)
        // Continue without job matches if matching fails
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error analyzing CV:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to analyze CV"
    return NextResponse.json(
      { message: errorMessage } as CvScreenerError,
      { status: 500 }
    )
  }
}

/**
 * Extracts text from uploaded file
 * Supports plain text files and PDF files
 * DOCX support can be added later with appropriate libraries
 */
async function extractTextFromFile(file: File): Promise<string> {
  const fileType = file.type
  const fileName = file.name.toLowerCase()

  // Plain text files
  if (fileType === "text/plain" || fileName.endsWith(".txt")) {
    return await file.text()
  }

  // PDF files
  if (fileType === "application/pdf" || fileName.endsWith(".pdf")) {
    try {
      // Convert File to ArrayBuffer, then to Buffer
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // Use pdf-parse v1 (simpler, works better in serverless environments)
      // Try to get the parser function
      let pdfParse: any
      try {
        pdfParse = getPdfParse()
      } catch (loadError: any) {
        // If loading fails, provide helpful error message
        if (loadError?.message?.includes('unavailable')) {
          throw loadError
        }
        throw new Error("PDF parsing is currently unavailable. Please paste your CV text directly or upload a .txt file.")
      }
      
      if (typeof pdfParse !== 'function') {
        throw new Error("Failed to load PDF parser. Please try uploading a .txt file or paste the text directly.")
      }
      
      // Parse PDF - pdf-parse v1 is a function that takes a buffer
      // Wrap in try-catch to handle any runtime errors
      let pdfData
      try {
        pdfData = await pdfParse(buffer)
      } catch (parseError: any) {
        // Handle parsing errors
        if (parseError?.code === 'ENOENT' && parseError?.path?.includes('test')) {
          // This is the test file access issue - the library has a bug
          throw new Error("PDF parsing encountered a library issue. Please paste your CV text directly or upload a .txt file.")
        }
        throw parseError
      }
      
      // Extract text from PDF
      const text = pdfData.text.trim()
      
      if (!text || text.length < 50) {
        throw new Error(
          "The PDF file appears to be empty or contains no extractable text. Please ensure your PDF contains text (not just images) or paste the text directly."
        )
      }
      
      return text
    } catch (error) {
      console.error("Error parsing PDF:", error)
      if (error instanceof Error) {
        // Re-throw with more context if it's already an Error
        if (error.message.includes("empty") || error.message.includes("extractable")) {
          throw error
        }
        throw new Error(
          `Failed to parse PDF file: ${error.message}. Please ensure the PDF contains text (not just images) or paste the text directly.`
        )
      }
      throw new Error(
        "Failed to parse PDF file. Please ensure the PDF contains text (not just images) or paste the text directly."
      )
    }
  }

  // DOCX files - for now, return error suggesting text extraction
  if (
    fileType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    fileName.endsWith(".docx") ||
    fileName.endsWith(".doc")
  ) {
    // TODO: Add DOCX parsing library (e.g., mammoth, docx)
    // For now, return an error with a helpful message
    throw new Error(
      "DOCX file parsing is not yet implemented. Please extract text from your document and paste it, or upload a .txt or .pdf file."
    )
  }

  // Unknown file type
  throw new Error(
    `Unsupported file type: ${fileType || "unknown"}. Please upload a .txt, .pdf, or .docx file, or paste your CV text directly.`
  )
}

