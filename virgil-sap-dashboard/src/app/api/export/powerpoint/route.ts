import { type NextRequest, NextResponse } from "next/server"
import PptxGenJS from "pptxgenjs"

interface Slide {
  id: number
  title: string
  content: string
  type: string
  order: number
}

interface BackgroundOption {
  id: string
  name: string
  type: "solid" | "gradient" | "image"
  value: string
  preview: string
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
  background?: BackgroundOption
}

export async function POST(request: NextRequest) {
  try {
    const body: ExportRequest = await request.json()
    const { slides, deckConfig, background } = body

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

    // Helper function to get background configuration
    const getSlideBackground = () => {
      if (!background || background.id === "white") {
        return { color: "FFFFFF" }
      }

      switch (background.type) {
        case "solid":
          return { color: background.value.replace("#", "") }

        case "gradient":
          // Extract gradient colors for PowerPoint
          if (background.id === "navy-gradient") {
            return {
              type: "gradient",
              angle: 135,
              colors: [
                { color: "1e3a5f", position: 0 },
                { color: "3b82f6", position: 100 },
              ],
            }
          } else if (background.id === "blue-gradient") {
            return {
              type: "gradient",
              angle: 135,
              colors: [
                { color: "3b82f6", position: 0 },
                { color: "1d4ed8", position: 100 },
              ],
            }
          } else if (background.id === "subtle-gradient") {
            return {
              type: "gradient",
              angle: 135,
              colors: [
                { color: "f8fafc", position: 0 },
                { color: "e2e8f0", position: 100 },
              ],
            }
          }
          return { color: "FFFFFF" }

        case "image":
          // For custom images, we'll use the base64 data
          if (background.value.startsWith("data:image")) {
            return {
              path: background.value,
              sizing: { type: "cover", w: slideWidth, h: slideHeight },
            }
          }
          return { color: "FFFFFF" }

        default:
          return { color: "FFFFFF" }
      }
    }

    // Helper function to get text color based on background
    const getTextColor = () => {
      if (!background) return "1f2937"

      // Light backgrounds use dark text
      if (["white", "light-gray", "subtle-gradient"].includes(background.id)) {
        return "1f2937"
      }

      // Dark backgrounds use white text
      return "FFFFFF"
    }

    const getSecondaryTextColor = () => {
      if (!background) return "374151"

      // Light backgrounds use dark text
      if (["white", "light-gray", "subtle-gradient"].includes(background.id)) {
        return "374151"
      }

      // Dark backgrounds use light gray text
      return "e5e7eb"
    }

    const getAccentTextColor = () => {
      if (!background) return "6b7280"

      // Light backgrounds use gray text
      if (["white", "light-gray", "subtle-gradient"].includes(background.id)) {
        return "6b7280"
      }

      // Dark backgrounds use lighter gray text
      return "d1d5db"
    }

    const slideBackground = getSlideBackground()
    const textColor = getTextColor()
    const secondaryTextColor = getSecondaryTextColor()
    const accentTextColor = getAccentTextColor()

    // Process each slide
    for (const slide of sortedSlides) {
      const pptxSlide = pptx.addSlide()

      // Set slide background
      if (slideBackground.type === "gradient") {
        // PowerPoint gradient background
        pptxSlide.background = {
          fill: {
            type: "gradient",
            angle: slideBackground.angle,
            colors: slideBackground.colors,
          },
        }
      } else if (slideBackground.path) {
        // Image background
        pptxSlide.background = {
          path: slideBackground.path,
          sizing: slideBackground.sizing,
        }
      } else {
        // Solid color background
        pptxSlide.background = { color: slideBackground.color }
      }

      // Add slide title
      pptxSlide.addText(slide.title, {
        x: 0.5,
        y: 0.5,
        w: slideWidth - 1,
        h: 1,
        fontSize: 28,
        bold: true,
        color: textColor,
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
            color: secondaryTextColor,
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
            color: accentTextColor,
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
            color: secondaryTextColor,
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
            color: textColor,
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
        color: accentTextColor,
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
          color: accentTextColor,
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
        "Content-Length": pptxBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error("PowerPoint export error:", error)
    return NextResponse.json({ error: "Failed to generate PowerPoint presentation" }, { status: 500 })
  }
}
