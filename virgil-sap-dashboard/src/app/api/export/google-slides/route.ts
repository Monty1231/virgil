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

    // For now, we'll create a Google Slides-compatible HTML format
    // In a full implementation, you'd use the Google Slides API

    const sortedSlides = slides.sort((a, b) => a.order - b.order)

    // Create HTML content that can be imported into Google Slides
    let htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${deckConfig.deckName || "SAP Solutions Presentation"}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .slide { 
            page-break-after: always; 
            min-height: 500px; 
            padding: 40px; 
            border: 1px solid #ddd; 
            margin-bottom: 20px;
            background: white;
        }
        .slide-title { 
            font-size: 28px; 
            font-weight: bold; 
            color: #1f2937; 
            margin-bottom: 30px; 
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 10px;
        }
        .slide-content { 
            font-size: 16px; 
            line-height: 1.6; 
            color: #374151; 
        }
        .slide-content ul { margin: 10px 0; padding-left: 20px; }
        .slide-content li { margin: 8px 0; }
        .slide-header { 
            font-size: 18px; 
            font-weight: bold; 
            color: #1f2937; 
            margin: 20px 0 10px 0; 
        }
        .slide-footer { 
            position: absolute; 
            bottom: 20px; 
            left: 40px; 
            right: 40px; 
            font-size: 12px; 
            color: #9ca3af; 
            display: flex; 
            justify-content: space-between; 
        }
        @media print {
            .slide { page-break-after: always; }
        }
    </style>
</head>
<body>
    <h1>Instructions for Google Slides Import</h1>
    <p>To import this presentation into Google Slides:</p>
    <ol>
        <li>Save this HTML file to your computer</li>
        <li>Open Google Slides (slides.google.com)</li>
        <li>Create a new presentation</li>
        <li>Copy the content from each slide below and paste into Google Slides</li>
        <li>Format as needed using Google Slides tools</li>
    </ol>
    <hr style="margin: 40px 0;">
`

    // Add each slide
    for (const slide of sortedSlides) {
      htmlContent += `
    <div class="slide">
        <div class="slide-title">${slide.title}</div>
        <div class="slide-content">
`

      // Process slide content
      const contentLines = slide.content.split("\n").filter((line) => line.trim())
      let inList = false

      for (const line of contentLines) {
        const trimmedLine = line.trim()

        if (trimmedLine.startsWith("•")) {
          if (!inList) {
            htmlContent += "<ul>"
            inList = true
          }
          htmlContent += `<li>${trimmedLine.substring(1).trim()}</li>`
        } else if (trimmedLine.startsWith("-")) {
          htmlContent += `<div style="margin-left: 20px; color: #6b7280;">- ${trimmedLine.substring(1).trim()}</div>`
        } else if (trimmedLine.includes(":")) {
          if (inList) {
            htmlContent += "</ul>"
            inList = false
          }
          htmlContent += `<div class="slide-header">${trimmedLine}</div>`
        } else if (trimmedLine) {
          if (inList) {
            htmlContent += "</ul>"
            inList = false
          }
          htmlContent += `<p>${trimmedLine}</p>`
        }
      }

      if (inList) {
        htmlContent += "</ul>"
      }

      htmlContent += `
        </div>
        <div class="slide-footer">
            <span>${deckConfig.targetCompany ? `${deckConfig.targetCompany} | ${deckConfig.presentationDate}` : ""}</span>
            <span>Slide ${slide.order}</span>
        </div>
    </div>
`
    }

    htmlContent += `
</body>
</html>`

    // Return the HTML file
    const fileName = `${deckConfig.deckName || "SAP-Presentation"}-GoogleSlides.html`

    return new NextResponse(htmlContent, {
      status: 200,
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": Buffer.byteLength(htmlContent, "utf8").toString(),
      },
    })
  } catch (error) {
    console.error("Google Slides export error:", error)
    return NextResponse.json({ error: "Failed to generate Google Slides format" }, { status: 500 })
  }
}
