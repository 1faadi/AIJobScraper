import { type NextRequest, NextResponse } from "next/server"
import { analyzeAtsFriendliness, matchCvToJobs } from "@/lib/ai/analyzeCv"
import { CvScreenerResponse, CvScreenerError } from "@/lib/types/cv-screener"

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
      // Convert File to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)

      // Use pdfjs-dist legacy build for Node.js environments (as recommended)
      // Dynamically import to handle CommonJS/ESM interop
      const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs")
      
      // For server-side use, we need to provide a worker source
      // Use path module to construct the absolute path to the worker file
      if (pdfjsLib.GlobalWorkerOptions) {
        const path = await import("path")
        const fs = await import("fs")
        
        // Try multiple possible paths for the worker file
        const possiblePaths = [
          path.join(process.cwd(), "node_modules", "pdfjs-dist", "legacy", "build", "pdf.worker.mjs"),
          path.resolve("node_modules", "pdfjs-dist", "legacy", "build", "pdf.worker.mjs"),
        ]
        
        let workerPath: string | null = null
        for (const possiblePath of possiblePaths) {
          try {
            if (fs.existsSync(possiblePath)) {
              // Convert Windows paths to forward slashes and add file:// protocol
              workerPath = `file://${possiblePath.replace(/\\/g, "/")}`
              break
            }
          } catch {
            // Continue to next path
          }
        }
        
        if (workerPath) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = workerPath
        } else {
          // Fallback: try require.resolve if available
          try {
            const workerResolved = require.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs")
            pdfjsLib.GlobalWorkerOptions.workerSrc = `file://${workerResolved.replace(/\\/g, "/")}`
          } catch {
            // Last resort: use a relative path
            pdfjsLib.GlobalWorkerOptions.workerSrc = "./node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs"
          }
        }
      }
      
      // Load the PDF document
      const loadingTask = pdfjsLib.getDocument({
        data: uint8Array,
        useSystemFonts: true,
        verbosity: 0, // Suppress warnings
      })
      
      const pdfDocument = await loadingTask.promise
      const numPages = pdfDocument.numPages
      
      // Extract text from all pages
      let fullText = ""
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdfDocument.getPage(pageNum)
        const textContent = await page.getTextContent()
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(" ")
        fullText += pageText + "\n"
      }
      
      const text = fullText.trim()
      
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

