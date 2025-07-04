import { type NextRequest, NextResponse } from "next/server"

interface Slide {
  id: number
  title: string
  content: string
  type: string
  order: number
}

interface ExportRequest {
  slides: Slide[]
  deckConfig: {
    deckName: string
    presenterName: string
    presentationDate: string
    targetCompany: string
    additionalNotes: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: ExportRequest = await request.json()
    const { slides, deckConfig } = body

    if (!slides || slides.length === 0) {
      return NextResponse.json({ error: "No slides provided" }, { status: 400 })
    }

    // Import jsPDF dynamically to avoid SSR issues
    const jsPDFModule = await import("jspdf")
    const jsPDF = jsPDFModule.default

    // Create new PDF document
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    })

    // PDF dimensions (A4 landscape)
    const pageWidth = 297
    const pageHeight = 210
    const margin = 20

    // Sort slides by order
    const sortedSlides = slides.sort((a, b) => a.order - b.order)

    // Process each slide
    for (let i = 0; i < sortedSlides.length; i++) {
      const slide = sortedSlides[i]

      // Add new page for each slide (except first)
      if (i > 0) {
        pdf.addPage()
      }

      // Add slide title
      pdf.setFontSize(24)
      pdf.setFont("helvetica", "bold")
      pdf.setTextColor(31, 41, 55) // gray-800
      pdf.text(slide.title, margin, margin + 15)

      // Add slide content
      const contentLines = slide.content.split("\n").filter((line) => line.trim())
      let yPosition = margin + 35
      const lineHeight = 8

      pdf.setFont("helvetica", "normal")
      pdf.setFontSize(12)

      for (const line of contentLines) {
        if (line.trim().startsWith("•")) {
          // Bullet point
          pdf.setTextColor(55, 65, 81) // gray-700
          pdf.text("•", margin + 5, yPosition)
          pdf.text(line.trim().substring(1).trim(), margin + 15, yPosition)
        } else if (line.trim().startsWith("-")) {
          // Sub-bullet point
          pdf.setTextColor(107, 114, 128) // gray-500
          pdf.text("-", margin + 15, yPosition)
          pdf.text(line.trim().substring(1).trim(), margin + 25, yPosition)
        } else if (line.includes(":")) {
          // Header/section text
          pdf.setFont("helvetica", "bold")
          pdf.setFontSize(14)
          pdf.setTextColor(31, 41, 55) // gray-800
          pdf.text(line.trim(), margin + 5, yPosition)
          pdf.setFont("helvetica", "normal")
          pdf.setFontSize(12)
        } else if (line.trim()) {
          // Regular text
          pdf.setTextColor(55, 65, 81) // gray-700
          pdf.text(line.trim(), margin + 5, yPosition)
        }

        yPosition += lineHeight

        // Prevent content from going off page
        if (yPosition > pageHeight - margin - 20) {
          break
        }
      }

      // Add footer
      pdf.setFontSize(10)
      pdf.setTextColor(156, 163, 175) // gray-400

      // Company and date
      if (deckConfig.targetCompany) {
        pdf.text(`${deckConfig.targetCompany} | ${deckConfig.presentationDate}`, margin, pageHeight - margin)
      }

      // Page number
      pdf.text(`${slide.order}`, pageWidth - margin - 10, pageHeight - margin)

      // Presenter name
      pdf.text(`Presented by: ${deckConfig.presenterName}`, pageWidth - margin - 60, pageHeight - margin + 5)
    }

    // Generate the PDF
    const pdfBuffer = Buffer.from(pdf.output("arraybuffer"))

    // Return the file
    const fileName = `${deckConfig.deckName || "SAP-Presentation"}.pdf`

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error("PDF export error:", error)
    return NextResponse.json({ error: "Failed to generate PDF presentation" }, { status: 500 })
  }
}
