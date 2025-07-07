import { type NextRequest, NextResponse } from "next/server";
import PptxGenJS from "pptxgenjs";
import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { parseTemplateStyles, applyTemplateStyles } from "./template-parser";

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

    console.log("Starting PowerPoint generation...");

    let pptx: PptxGenJS;
    let templateStyles = null;

    // Check if template is provided
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
        pptx = new PptxGenJS();
        console.log("Template styles loaded:", templateStyles);
      } catch (error) {
        console.error("Failed to process template:", error);
        return NextResponse.json(
          { error: "Failed to process template" },
          { status: 500 }
        );
      }
    } else {
      // Create new presentation
      pptx = new PptxGenJS();
    }

    // Set presentation properties
    pptx.author = deckConfig.presenterName || "Virgil.io";
    pptx.company = "Virgil.io";
    pptx.subject = deckConfig.deckName || "SAP Solutions Presentation";
    pptx.title = deckConfig.deckName || "SAP Solutions Presentation";

    // Define slide layouts and styles
    const slideWidth = 10;
    const slideHeight = 7.5;

    // Sort slides by order
    const sortedSlides = slides.sort((a, b) => a.order - b.order);

    // Helper function to safely get color value
    const getSafeColor = (colorValue: any): string => {
      if (!colorValue) return "FFFFFF";
      const colorStr = String(colorValue);
      // Remove # if present and ensure it's a valid hex color
      const cleanColor = colorStr.startsWith("#")
        ? colorStr.substring(1)
        : colorStr;
      // Validate hex color format (6 characters, hex only)
      if (/^[0-9A-Fa-f]{6}$/.test(cleanColor)) {
        return cleanColor.toUpperCase();
      }
      return "FFFFFF"; // Default to white if invalid
    };

    // Helper function to add decorative elements based on template design
    const addDecorativeElements = (slide: any, templateStyles: any) => {
      if (!templateStyles?.hasShapes) return;

      const primaryColor = getSafeColor(templateStyles.primaryColor);
      const accentColor = getSafeColor(templateStyles.accentColor);
      const design = templateStyles.templateDesign;

      try {
        if (design === "marketing" || design === "modern") {
          // Add decorative rectangle on the left
          slide.addShape("rect", {
            x: 0,
            y: 0,
            w: 0.3,
            h: slideHeight,
            fill: { color: primaryColor },
            line: { color: primaryColor },
            opacity: 0.1,
          });

          // Add accent circle
          slide.addShape("ellipse", {
            x: slideWidth - 1.5,
            y: 0.5,
            w: 1,
            h: 1,
            fill: { color: accentColor },
            line: { color: accentColor },
            opacity: 0.2,
          });
        } else if (design === "organic") {
          // Add organic circle
          slide.addShape("ellipse", {
            x: 0.5,
            y: 0.5,
            w: 2,
            h: 2,
            fill: { color: accentColor },
            line: { color: accentColor },
            opacity: 0.15,
          });
        } else if (design === "corporate" || design === "business") {
          // Add professional accent bar
          slide.addShape("rect", {
            x: 0,
            y: 0,
            w: 0.2,
            h: slideHeight,
            fill: { color: primaryColor },
            line: { color: primaryColor },
            opacity: 0.3,
          });
        }
      } catch (error) {
        console.log("Could not add decorative elements:", error);
      }
    };

    console.log(`Processing ${sortedSlides.length} slides...`);

    // Process each slide with template styling
    for (const slide of sortedSlides) {
      try {
        console.log(`Processing slide ${slide.order}: ${slide.title}`);
        const pptxSlide = pptx.addSlide();

        // Set slide background based on template
        if (templateStyles) {
          const bgColor = getSafeColor(templateStyles.slideBackground);
          console.log(`Setting template background: ${bgColor}`);
          pptxSlide.background = { color: bgColor };
        } else {
          // Use basic white background if no template
          pptxSlide.background = { color: "FFFFFF" };
        }

        // Add decorative elements based on template design
        if (templateStyles) {
          addDecorativeElements(pptxSlide, templateStyles);
        }

        // Get text colors based on template
        const titleColor = getSafeColor(templateStyles?.titleColor || "1f2937");
        const textColor = getSafeColor(templateStyles?.textColor || "374151");
        const accentColor = getSafeColor(
          templateStyles?.accentColor || "6b7280"
        );

        console.log(
          `Using colors - Title: ${titleColor}, Text: ${textColor}, Accent: ${accentColor}`
        );

        // Add slide title with template styling
        pptxSlide.addText(slide.title, {
          x: templateStyles?.hasShapes ? 0.8 : 0.5,
          y: 0.5,
          w: slideWidth - (templateStyles?.hasShapes ? 1.6 : 1),
          h: 1,
          fontSize: templateStyles?.titleFontSize || 28,
          bold: true,
          color: titleColor,
          fontFace: templateStyles?.fontFamily || "Arial",
          align: "left",
        });

        // Process slide content with template styling
        const contentLines = slide.content
          .split("\n")
          .filter((line) => line.trim());
        let yPosition = 1.8;
        const lineHeight = 0.4;

        for (const line of contentLines) {
          const textOptions = {
            x: templateStyles?.hasShapes ? 1.2 : 0.8,
            y: yPosition,
            w: slideWidth - (templateStyles?.hasShapes ? 2.4 : 1.6),
            h: lineHeight,
            fontSize: templateStyles?.bodyFontSize || 16,
            color: textColor,
            fontFace: templateStyles?.fontFamily || "Arial",
          };

          if (line.trim().startsWith("•")) {
            // Bullet point with template styling
            pptxSlide.addText(line.trim(), {
              ...textOptions,
              bullet: { type: "bullet", style: "•" },
              indentLevel: 0,
            });
          } else if (line.trim().startsWith("-")) {
            // Sub-bullet point with accent color
            pptxSlide.addText(line.trim().substring(1).trim(), {
              ...textOptions,
              x: templateStyles?.hasShapes ? 1.6 : 1.2,
              w: slideWidth - (templateStyles?.hasShapes ? 3.2 : 2),
              fontSize: (templateStyles?.bodyFontSize || 16) - 2,
              color: accentColor,
              bullet: { type: "bullet", style: "-" },
              indentLevel: 1,
            });
          } else if (line.trim() && !line.includes(":")) {
            // Regular text
            pptxSlide.addText(line.trim(), textOptions);
          } else if (line.includes(":")) {
            // Header/section text with title color
            pptxSlide.addText(line.trim(), {
              ...textOptions,
              fontSize: (templateStyles?.bodyFontSize || 16) + 2,
              bold: true,
              color: titleColor,
            });
          }

          yPosition += lineHeight;

          // Prevent content from going off slide
          if (yPosition > slideHeight - 1) {
            break;
          }
        }

        // Add footer with template styling
        const footerText = deckConfig.targetCompany
          ? `${deckConfig.targetCompany} | ${deckConfig.presentationDate}`
          : `${deckConfig.presentationDate}`;

        pptxSlide.addText(footerText, {
          x: 0.5,
          y: slideHeight - 0.5,
          w: slideWidth - 1,
          h: 0.3,
          fontSize: 10,
          color: accentColor,
          fontFace: templateStyles?.fontFamily || "Arial",
          align: "center",
        });

        // Add slide number with template styling
        pptxSlide.addText(`${slide.order}`, {
          x: slideWidth - 1,
          y: slideHeight - 0.5,
          w: 0.5,
          h: 0.3,
          fontSize: 12,
          color: accentColor,
          align: "center",
          fontFace: templateStyles?.fontFamily || "Arial",
        });

        console.log(`Successfully processed slide ${slide.order}`);
      } catch (slideError) {
        console.error(`Error processing slide ${slide.order}:`, slideError);
        throw slideError;
      }
    }

    console.log("Generating PowerPoint presentation...");

    // Generate the presentation
    const pptxBuffer = await pptx.write({ outputType: "nodebuffer" });

    console.log("PowerPoint generation successful");

    // Return the file
    const fileName = `${deckConfig.deckName || "SAP-Presentation"}.pptx`;

    return new NextResponse(pptxBuffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": pptxBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("PowerPoint export error:", error);
    return NextResponse.json(
      { error: "Failed to generate PowerPoint presentation" },
      { status: 500 }
    );
  }
}
