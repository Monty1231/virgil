import { type NextRequest, NextResponse } from "next/server";
import { join } from "path";
import { existsSync } from "fs";
import { parseTemplateStyles } from "../powerpoint/template-parser";

interface Slide {
  id: number;
  title: string;
  content: string;
  type: string;
  order: number;
}

interface BackgroundOption {
  id: string;
  name: string;
  type: "solid" | "gradient" | "image";
  value: string;
  preview: string;
}

interface ExportRequest {
  slides: Slide[];
  deckConfig: {
    deckName: string;
    presenterName: string;
    presentationDate: string;
    targetCompany: string;
    additionalNotes: string;
  };
  background?: BackgroundOption;
  templateId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ExportRequest = await request.json();
    const { slides, deckConfig, background, templateId } = body;

    if (!slides || slides.length === 0) {
      return NextResponse.json(
        { error: "No slides provided" },
        { status: 400 }
      );
    }

    // Check if template is provided
    let templateStyles = null;
    if (templateId) {
      const TEMPLATES_DIR = join(process.cwd(), "uploads", "templates");
      const templatePath = join(TEMPLATES_DIR, templateId);

      if (!existsSync(templatePath)) {
        return NextResponse.json(
          { error: "Template not found" },
          { status: 404 }
        );
      }

      try {
        // Parse template styles
        templateStyles = await parseTemplateStyles(templatePath);
        console.log("Template styles loaded for PDF:", templateStyles);
      } catch (error) {
        console.error("Failed to process template:", error);
        return NextResponse.json(
          { error: "Failed to process template" },
          { status: 500 }
        );
      }
    }

    // Helper function to safely get color value
    const getSafeColor = (colorValue: any): string => {
      if (!colorValue) return "FFFFFF";
      const colorStr = String(colorValue);
      const cleanColor = colorStr.startsWith("#")
        ? colorStr.substring(1)
        : colorStr;
      if (/^[0-9A-Fa-f]{6}$/.test(cleanColor)) {
        return cleanColor.toUpperCase();
      }
      return "FFFFFF";
    };

    // Helper function to convert hex to RGB
    const hexToRgb = (hex: string): [number, number, number] => {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return [r, g, b];
    };

    // Import jsPDF dynamically to avoid SSR issues
    const jsPDFModule = await import("jspdf");
    const jsPDF = jsPDFModule.default;

    // Create new PDF document
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    // PDF dimensions (A4 landscape)
    const pageWidth = 297;
    const pageHeight = 210;
    const margin = 20;

    // Get template colors
    const titleColor = templateStyles?.titleColor
      ? hexToRgb(getSafeColor(templateStyles.titleColor))
      : [31, 41, 55];
    const textColor = templateStyles?.textColor
      ? hexToRgb(getSafeColor(templateStyles.textColor))
      : [55, 65, 81];
    const accentColor = templateStyles?.accentColor
      ? hexToRgb(getSafeColor(templateStyles.accentColor))
      : [107, 114, 128];

    console.log(
      `Using PDF colors - Title: ${titleColor}, Text: ${textColor}, Accent: ${accentColor}`
    );

    // Sort slides by order
    const sortedSlides = slides.sort((a, b) => a.order - b.order);

    // Process each slide
    for (let i = 0; i < sortedSlides.length; i++) {
      const slide = sortedSlides[i];

      // Add new page for each slide (except first)
      if (i > 0) {
        pdf.addPage();
      }

      // Set background color if template is provided
      if (templateStyles?.slideBackground) {
        const bgColor = hexToRgb(getSafeColor(templateStyles.slideBackground));
        pdf.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
        pdf.rect(0, 0, pageWidth, pageHeight, "F");
      }

      // Add slide title with template styling
      pdf.setFontSize(templateStyles?.titleFontSize || 24);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(titleColor[0], titleColor[1], titleColor[2]);
      pdf.text(slide.title, margin, margin + 15);

      // Add slide content with template styling
      const contentLines = slide.content
        .split("\n")
        .filter((line) => line.trim());
      let yPosition = margin + 35;
      const lineHeight = 8;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(templateStyles?.bodyFontSize || 12);

      for (const line of contentLines) {
        if (line.trim().startsWith("•")) {
          // Bullet point with template styling
          pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
          pdf.text("•", margin + 5, yPosition);
          pdf.text(line.trim().substring(1).trim(), margin + 15, yPosition);
        } else if (line.trim().startsWith("-")) {
          // Sub-bullet point with accent color
          pdf.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
          pdf.text("-", margin + 15, yPosition);
          pdf.text(line.trim().substring(1).trim(), margin + 25, yPosition);
        } else if (line.includes(":")) {
          // Header/section text with title color
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize((templateStyles?.bodyFontSize || 12) + 2);
          pdf.setTextColor(titleColor[0], titleColor[1], titleColor[2]);
          pdf.text(line.trim(), margin + 5, yPosition);
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(templateStyles?.bodyFontSize || 12);
        } else if (line.trim()) {
          // Regular text with template styling
          pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
          pdf.text(line.trim(), margin + 5, yPosition);
        }

        yPosition += lineHeight;

        // Prevent content from going off page
        if (yPosition > pageHeight - margin - 20) {
          break;
        }
      }

      // Add footer with template styling
      pdf.setFontSize(10);
      pdf.setTextColor(accentColor[0], accentColor[1], accentColor[2]);

      // Company and date
      if (deckConfig.targetCompany) {
        pdf.text(
          `${deckConfig.targetCompany} | ${deckConfig.presentationDate}`,
          margin,
          pageHeight - margin
        );
      }

      // Page number
      pdf.text(`${slide.order}`, pageWidth - margin - 10, pageHeight - margin);

      // Presenter name
      pdf.text(
        `Presented by: ${deckConfig.presenterName}`,
        pageWidth - margin - 60,
        pageHeight - margin + 5
      );
    }

    // Generate the PDF
    const pdfBuffer = Buffer.from(pdf.output("arraybuffer"));

    // Return the file
    const fileName = `${deckConfig.deckName || "SAP-Presentation"}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("PDF export error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF presentation" },
      { status: 500 }
    );
  }
}
