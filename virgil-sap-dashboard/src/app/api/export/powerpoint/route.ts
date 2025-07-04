import { type NextRequest, NextResponse } from "next/server"
import PptxGenJS from "pptxgenjs"

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

    // Create new presentation
    const pptx = new PptxGenJS()

    // Set presentation properties
    pptx.author = deckConfig.presenterName || "Virgil.io"
    pptx.company = "Virgil.io"
    pptx.subject = deckConfig.deckName || "SAP Solutions Presentation"
    pptx.title = deckConfig.deckName || "SAP Solutions Presentation"

    // Define slide layouts and styles
    const slideWidth = 10
    const slideHeight = 7.5

    // Sort slides by order
    const sortedSlides = slides.sort((a, b) => a.order - b.order)

    // Process each slide
    for (const slide of sortedSlides) {
      const pptxSlide = pptx.addSlide()

      // Set slide background
      pptxSlide.background = { color: "FFFFFF" }

      // Add slide title
      pptxSlide.addText(slide.title, {
        x: 0.5,
        y: 0.5,
        w: slideWidth - 1,
        h: 1,
        fontSize: 28,
        bold: true,
        color: "1f2937",
        fontFace: "Arial",
      })

      // Process slide content
      const contentLines = slide.content.split("\n").filter((line) => line.trim())
      let yPosition = 1.8
      const lineHeight = 0.4

      for (const line of contentLines) {
        if (line.trim().startsWith("•")) {
          // Bullet point
          pptxSlide.addText(line.trim(), {
            x: 0.8,
            y: yPosition,
            w: slideWidth - 1.6,
            h: lineHeight,
            fontSize: 16,
            color: "374151",
            fontFace: "Arial",
            bullet: { type: "bullet", style: "•" },
          })
        } else if (line.trim().startsWith("-")) {
          // Sub-bullet point
          pptxSlide.addText(line.trim().substring(1).trim(), {
            x: 1.2,
            y: yPosition,
            w: slideWidth - 2,
            h: lineHeight,
            fontSize: 14,
            color: "6b7280",
            fontFace: "Arial",
            bullet: { type: "bullet", style: "-" },
          })
        } else if (line.trim() && !line.includes(":")) {
          // Regular text
          pptxSlide.addText(line.trim(), {
            x: 0.8,
            y: yPosition,
            w: slideWidth - 1.6,
            h: lineHeight,
            fontSize: 16,
            color: "374151",
            fontFace: "Arial",
          })
        } else if (line.includes(":")) {
          // Header/section text
          pptxSlide.addText(line.trim(), {
            x: 0.8,
            y: yPosition,
            w: slideWidth - 1.6,
            h: lineHeight,
            fontSize: 18,
            bold: true,
            color: "1f2937",
            fontFace: "Arial",
          })
        }

        yPosition += lineHeight

        // Prevent content from going off slide
        if (yPosition > slideHeight - 1) {
          break
        }
      }

      // Add slide number
      pptxSlide.addText(`${slide.order}`, {
        x: slideWidth - 1,
        y: slideHeight - 0.5,
        w: 0.5,
        h: 0.3,
        fontSize: 12,
        color: "9ca3af",
        align: "center",
        fontFace: "Arial",
      })

      // Add company branding
      if (deckConfig.targetCompany) {
        pptxSlide.addText(`${deckConfig.targetCompany} | ${deckConfig.presentationDate}`, {
          x: 0.5,
          y: slideHeight - 0.5,
          w: slideWidth - 2,
          h: 0.3,
          fontSize: 10,
          color: "9ca3af",
          fontFace: "Arial",
        })
      }
    }

    // Generate the presentation
    const pptxBuffer = await pptx.write({ outputType: "nodebuffer" })

    // Return the file
    const fileName = `${deckConfig.deckName || "SAP-Presentation"}.pptx`

    return new NextResponse(pptxBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": (
          pptxBuffer instanceof Uint8Array
            ? pptxBuffer.length
            : pptxBuffer instanceof ArrayBuffer
              ? pptxBuffer.byteLength
              : typeof pptxBuffer === "string"
                ? Buffer.byteLength(pptxBuffer)
                : pptxBuffer.size ?? 0
        ).toString(),
      },
    })
  } catch (error) {
    console.error("PowerPoint export error:", error)
    return NextResponse.json({ error: "Failed to generate PowerPoint presentation" }, { status: 500 })
  }
}
