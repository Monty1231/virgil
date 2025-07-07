import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import AdmZip from "adm-zip";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get("templateId");

    if (!templateId) {
      return NextResponse.json(
        { error: "Template ID required" },
        { status: 400 }
      );
    }

    const TEMPLATES_DIR = join(process.cwd(), "uploads", "templates");
    const templatePath = join(TEMPLATES_DIR, templateId);

    if (!existsSync(templatePath)) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    console.log(`Debugging template: ${templatePath}`);

    const templateBuffer = await readFile(templatePath);
    const zip = new AdmZip(templateBuffer);

    // List all entries
    const entries = zip.getEntries();
    const entryNames = entries.map((e) => e.entryName);

    // Look for theme files
    const themeFiles = entryNames.filter((name) => name.includes("theme"));
    const slideMasterFiles = entryNames.filter((name) =>
      name.includes("slideMaster")
    );
    const slideFiles = entryNames.filter((name) =>
      name.includes("slides/slide")
    );

    // Extract sample content from key files
    const debugInfo: any = {
      totalEntries: entries.length,
      entryNames: entryNames.slice(0, 20), // First 20 entries
      themeFiles,
      slideMasterFiles,
      slideFiles: slideFiles.slice(0, 5), // First 5 slides
    };

    // Try to extract content from theme file
    const themeEntry = zip.getEntry("ppt/theme/theme1.xml");
    if (themeEntry) {
      const themeXml = themeEntry.getData().toString();
      debugInfo.themeXmlSample = themeXml.substring(0, 1000); // First 1000 chars

      // Look for color patterns
      const colorMatches = themeXml.match(/srgbClr[^>]*val="([^"]+)"/g);
      if (colorMatches) {
        debugInfo.themeColors = colorMatches.map((match: string) => {
          const color = match.match(/val="([^"]+)"/)?.[1];
          return { match, color };
        });
      }
    }

    // Try to extract content from slide master
    const slideMasterEntry = zip.getEntry("ppt/slideMasters/slideMaster1.xml");
    if (slideMasterEntry) {
      const slideMasterXml = slideMasterEntry.getData().toString();
      debugInfo.slideMasterXmlSample = slideMasterXml.substring(0, 1000);

      // Look for color patterns
      const colorMatches = slideMasterXml.match(/srgbClr[^>]*val="([^"]+)"/g);
      if (colorMatches) {
        debugInfo.slideMasterColors = colorMatches.map((match: string) => {
          const color = match.match(/val="([^"]+)"/)?.[1];
          return { match, color };
        });
      }
    }

    // Try to extract content from first slide
    if (slideFiles.length > 0) {
      const firstSlideEntry = zip.getEntry(slideFiles[0]);
      if (firstSlideEntry) {
        const slideXml = firstSlideEntry.getData().toString();
        debugInfo.slideXmlSample = slideXml.substring(0, 1000);

        // Look for color patterns
        const colorMatches = slideXml.match(/srgbClr[^>]*val="([^"]+)"/g);
        if (colorMatches) {
          debugInfo.slideColors = colorMatches.map((match: string) => {
            const color = match.match(/val="([^"]+)"/)?.[1];
            return { match, color };
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      debugInfo,
      templatePath,
      fileSize: templateBuffer.length,
    });
  } catch (error) {
    console.error("Template debug failed:", error);
    return NextResponse.json(
      { error: "Failed to debug template", details: error.message },
      { status: 500 }
    );
  }
}
