import { readFile } from "fs/promises";
import { join } from "path";
import AdmZip from "adm-zip";
import { parseString } from "xml2js";

interface TemplateStyle {
  backgroundColor?: string;
  titleColor?: string;
  textColor?: string;
  accentColor?: string;
  fontFamily?: string;
  titleFontSize?: number;
  bodyFontSize?: number;
  slideBackground?: string;
  primaryColor?: string;
  secondaryColor?: string;
  // New fields for actual template design
  templateDesign?: string;
  hasShapes?: boolean;
  hasImages?: boolean;
  layoutType?: string;
  colorScheme?: string;
}

// Enhanced template styles that better match actual PowerPoint designs
const templateStyles = {
  professional: {
    backgroundColor: "1e3a5f", // Virgil Navy
    titleColor: "ffffff",
    textColor: "374151",
    accentColor: "3b82f6",
    fontFamily: "Arial",
    titleFontSize: 28,
    bodyFontSize: 16,
    slideBackground: "1e3a5f",
    primaryColor: "ffffff",
    secondaryColor: "3b82f6",
    templateDesign: "corporate",
    hasShapes: true,
    hasImages: false,
    layoutType: "professional",
    colorScheme: "navy-blue",
  },
  modern: {
    backgroundColor: "3b82f6", // Blue
    titleColor: "ffffff",
    textColor: "1f2937",
    accentColor: "1e40af",
    fontFamily: "Arial",
    titleFontSize: 32,
    bodyFontSize: 18,
    slideBackground: "3b82f6",
    primaryColor: "ffffff",
    secondaryColor: "1e40af",
    templateDesign: "modern",
    hasShapes: true,
    hasImages: true,
    layoutType: "creative",
    colorScheme: "blue-gradient",
  },
  corporate: {
    backgroundColor: "374151", // Gray
    titleColor: "ffffff",
    textColor: "1f2937",
    accentColor: "6b7280",
    fontFamily: "Arial",
    titleFontSize: 30,
    bodyFontSize: 16,
    slideBackground: "374151",
    primaryColor: "ffffff",
    secondaryColor: "6b7280",
    templateDesign: "business",
    hasShapes: true,
    hasImages: false,
    layoutType: "formal",
    colorScheme: "gray-slate",
  },
  clean: {
    backgroundColor: "ffffff", // White
    titleColor: "1e3a5f",
    textColor: "374151",
    accentColor: "3b82f6",
    fontFamily: "Arial",
    titleFontSize: 28,
    bodyFontSize: 16,
    slideBackground: "ffffff",
    primaryColor: "1e3a5f",
    secondaryColor: "3b82f6",
    templateDesign: "minimal",
    hasShapes: false,
    hasImages: false,
    layoutType: "clean",
    colorScheme: "white-clean",
  },
  organic: {
    backgroundColor: "f0f9ff", // Light blue
    titleColor: "1e40af",
    textColor: "1e293b",
    accentColor: "3b82f6",
    fontFamily: "Arial",
    titleFontSize: 26,
    bodyFontSize: 16,
    slideBackground: "f0f9ff",
    primaryColor: "1e40af",
    secondaryColor: "3b82f6",
    templateDesign: "organic",
    hasShapes: true,
    hasImages: true,
    layoutType: "natural",
    colorScheme: "light-blue",
  },
  marketing: {
    backgroundColor: "7c3aed", // Purple
    titleColor: "ffffff",
    textColor: "1f2937",
    accentColor: "a855f7",
    fontFamily: "Arial",
    titleFontSize: 30,
    bodyFontSize: 18,
    slideBackground: "7c3aed",
    primaryColor: "ffffff",
    secondaryColor: "a855f7",
    templateDesign: "marketing",
    hasShapes: true,
    hasImages: true,
    layoutType: "dynamic",
    colorScheme: "purple-vibrant",
  },
};

// Helper function to extract colors from hex strings
const extractColorsFromHex = (hexColor: string): string => {
  if (!hexColor) return "FFFFFF";
  return hexColor.replace("#", "").toUpperCase();
};

const resolveSchemeColor = (
  schemeClr: string,
  themeColorMap: Record<string, string>
): string | undefined => {
  // Map schemeClr (e.g., bg1, accent1) to actual RGB value from themeColorMap
  if (!schemeClr) return undefined;
  const key = schemeClr.toLowerCase();
  return themeColorMap[key];
};

// Helper function to parse PPTX and extract actual design elements
const parsePPTXDesign = async (
  templatePathOrBuffer: string | Buffer
): Promise<TemplateStyle> => {
  try {
    let templateBuffer: Buffer;
    let fileName: string;
    let selectedStyle: keyof typeof templateStyles = "professional"; // Always initialize

    if (typeof templatePathOrBuffer === "string") {
      // It's a file path
      templateBuffer = await readFile(templatePathOrBuffer);
      fileName = templatePathOrBuffer.split("/").pop()?.toLowerCase() || "";
    } else {
      // It's a buffer
      templateBuffer = templatePathOrBuffer;
      fileName = "template.pptx"; // Default name for buffer
    }

    const zip = new AdmZip(templateBuffer);

    // Extract theme colors from the presentation
    let extractedColors: any = {};
    let themeColorMap: Record<string, string> = {};
    let schemeBackgroundRef: string | undefined;

    try {
      console.log("Starting PPTX color extraction...");

      // List all entries in the zip to see what's available
      const zipEntries = zip.getEntries();
      const entryNames = zipEntries.map((e) => e.entryName);

      // Find all theme files
      const themeFiles = entryNames.filter((name) => name.includes("theme"));
      console.log("Found theme files:", themeFiles);

      // We'll use the first theme file for mapping
      let themeXml = "";
      if (themeFiles.length > 0) {
        const firstThemeEntry = zip.getEntry(themeFiles[0]);
        if (firstThemeEntry) {
          themeXml = firstThemeEntry.getData().toString();
          // Parse theme XML for color scheme
          await new Promise((resolve, reject) => {
            parseString(themeXml, (err, result) => {
              if (err) reject(err);
              const colorScheme =
                result?.["a:theme"]?.["a:themeElements"]?.[0]?.[
                  "a:clrScheme"
                ]?.[0];
              if (colorScheme) {
                // Map scheme names to RGB
                [
                  "bg1",
                  "bg2",
                  "tx1",
                  "tx2",
                  "accent1",
                  "accent2",
                  "accent3",
                  "accent4",
                  "accent5",
                  "accent6",
                ].forEach((name) => {
                  const clr =
                    colorScheme[`a:${name}`]?.[0]?.["a:srgbClr"]?.[0]?.["$"]?.[
                      "val"
                    ];
                  if (clr) {
                    themeColorMap[name] = clr.toUpperCase();
                  }
                });
              }
              resolve(result);
            });
          });
        }
      }

      // Find slide master files
      const slideMasterFiles = entryNames.filter((name) =>
        name.includes("slideMaster")
      );
      console.log("Found slide master files:", slideMasterFiles);

      // Parse slide masters for additional color information
      for (const masterFile of slideMasterFiles) {
        const masterEntry = zip.getEntry(masterFile);
        if (masterEntry) {
          const masterXml = masterEntry.getData().toString();
          // Extract colors from slide master
          const colorMatches = masterXml.match(
            /<a:srgbClr val="([0-9A-Fa-f]{6})"/g
          );
          if (colorMatches) {
            colorMatches.forEach((match, index) => {
              const color = match.match(/val="([0-9A-Fa-f]{6})"/)?.[1];
              if (color) {
                extractedColors[`master_${index + 37}`] = color.toUpperCase();
              }
            });
          }
        }
      }

      // Find slide files to extract colors from actual slides
      const slideFiles = entryNames.filter((name) =>
        name.includes("slides/slide")
      );
      console.log("Found slide files, checking for colors...");

      // Extract colors from slides
      for (const slideFile of slideFiles) {
        const slideEntry = zip.getEntry(slideFile);
        if (slideEntry) {
          const slideXml = slideEntry.getData().toString();
          // Extract colors from slide content
          const colorMatches = slideXml.match(
            /<a:srgbClr val="([0-9A-Fa-f]{6})"/g
          );
          if (colorMatches) {
            colorMatches.forEach((match, index) => {
              const color = match.match(/val="([0-9A-Fa-f]{6})"/)?.[1];
              if (color) {
                extractedColors[`theme_${index + 17}`] = color.toUpperCase();
              }
            });
          }
        }
      }

      // Extract colors from theme files
      for (const themeFile of themeFiles) {
        const themeEntry = zip.getEntry(themeFile);
        if (themeEntry) {
          const themeXml = themeEntry.getData().toString();
          console.log(`Parsing theme file: ${themeFile}`);

          // Extract colors from theme XML
          const colorMatches = themeXml.match(
            /<a:srgbClr val="([0-9A-Fa-f]{6})"/g
          );
          if (colorMatches) {
            console.log(
              `Found ${colorMatches.length} color matches in ${themeFile}`
            );
            colorMatches.forEach((match, index) => {
              const color = match.match(/val="([0-9A-Fa-f]{6})"/)?.[1];
              if (color) {
                extractedColors[`theme_${index}`] = color.toUpperCase();
                console.log(`Extracted theme color: ${color}`);
              }
            });
          }

          // Parse theme XML for color scheme
          await new Promise((resolve, reject) => {
            parseString(themeXml, (err, result) => {
              if (err) reject(err);
              const colorScheme =
                result?.["a:theme"]?.["a:themeElements"]?.[0]?.[
                  "a:clrScheme"
                ]?.[0];
              if (colorScheme) {
                console.log("Found color scheme in " + themeFile);

                // Extract background color
                const bg1 =
                  colorScheme["a:bg1"]?.[0]?.["a:srgbClr"]?.[0]?.["$"]?.["val"];
                const bg2 =
                  colorScheme["a:bg2"]?.[0]?.["a:srgbClr"]?.[0]?.["$"]?.["val"];

                if (bg1) {
                  extractedColors.background = bg1.toUpperCase();
                  console.log(`Using prominent color as background: ${bg1}`);
                } else if (bg2) {
                  extractedColors.background = bg2.toUpperCase();
                  console.log(`Using prominent color as background: ${bg2}`);
                }

                // Extract accent colors
                [
                  "accent1",
                  "accent2",
                  "accent3",
                  "accent4",
                  "accent5",
                  "accent6",
                ].forEach((name) => {
                  const clr =
                    colorScheme[`a:${name}`]?.[0]?.["a:srgbClr"]?.[0]?.["$"]?.[
                      "val"
                    ];
                  if (clr) {
                    extractedColors[name] = clr.toUpperCase();
                    console.log(`Extracted ${name} color: ${clr}`);
                  }
                });
              }
              resolve(result);
            });
          });
        }
      }

      console.log("Final extracted colors:", extractedColors);

      // Determine the most prominent background color
      const resolvedBackground =
        extractedColors.background ||
        extractedColors.bg1 ||
        extractedColors.theme_0 ||
        "FFFFFF";

      // Select template style based on extracted colors and filename
      // Analyze filename for design clues
      if (
        fileName.includes("organic") ||
        fileName.includes("natural") ||
        fileName.includes("soft")
      ) {
        selectedStyle = "organic";
      } else if (
        fileName.includes("marketing") ||
        fileName.includes("plan") ||
        fileName.includes("shapes") ||
        fileName.includes("creative")
      ) {
        selectedStyle = "marketing";
      } else if (
        fileName.includes("modern") ||
        fileName.includes("contemporary") ||
        fileName.includes("minimal")
      ) {
        selectedStyle = "modern";
      } else if (
        fileName.includes("corporate") ||
        fileName.includes("business") ||
        fileName.includes("professional")
      ) {
        selectedStyle = "corporate";
      } else if (
        fileName.includes("clean") ||
        fileName.includes("simple") ||
        fileName.includes("white")
      ) {
        selectedStyle = "clean";
      } else {
        // Size-based selection
        if (fileSize > 5000000) {
          selectedStyle = "marketing";
        } else if (fileSize > 2000000) {
          selectedStyle = "modern";
        } else {
          selectedStyle = "clean";
        }
      }
    } catch (parseError) {
      console.error("Failed to parse theme colors:", parseError);
      // Continue with basic analysis
    }

    // Get the base template style
    const baseStyle = templateStyles[selectedStyle];

    // Create enhanced style with actual extracted colors
    const actualBackgroundColor =
      extractedColors.background ||
      extractedColors.slideBackground ||
      resolvedBackground ||
      baseStyle.slideBackground;

    const enhancedStyle: TemplateStyle = {
      ...baseStyle,
      // Use actual extracted colors, prioritizing background colors
      backgroundColor: actualBackgroundColor,
      slideBackground: actualBackgroundColor,
      titleColor: extractedColors.text || baseStyle.titleColor,
      textColor: extractedColors.text || baseStyle.textColor,
      accentColor:
        extractedColors.accent1 ||
        extractedColors.accent2 ||
        baseStyle.accentColor,
      primaryColor: extractedColors.accent1 || baseStyle.primaryColor,
      secondaryColor: extractedColors.accent2 || baseStyle.secondaryColor,
      // Adjust based on file characteristics
      titleFontSize: baseStyle.titleFontSize + (fileSize > 3000000 ? 2 : 0),
      bodyFontSize: baseStyle.bodyFontSize + (fileSize > 3000000 ? 1 : 0),
      // Set hasShapes based on template design type, not just file size
      hasShapes: baseStyle.hasShapes || fileSize > 2000000,
      hasImages: baseStyle.hasImages || fileSize > 4000000,
    };

    console.log(
      `Selected template style: ${selectedStyle} with extracted colors:`,
      {
        slideBackground: enhancedStyle.slideBackground,
        titleColor: enhancedStyle.titleColor,
        accentColor: enhancedStyle.accentColor,
      }
    );

    return enhancedStyle;
  } catch (error) {
    console.error("Failed to parse PPTX design:", error);
    // Fallback to basic analysis
    return await analyzeTemplateDesign(templatePathOrBuffer);
  }
};

// Helper function to analyze template content and extract actual design
const analyzeTemplateDesign = async (
  templatePathOrBuffer: string | Buffer
): Promise<TemplateStyle> => {
  try {
    let fileName: string;
    let fileSize: number;

    if (typeof templatePathOrBuffer === "string") {
      // It's a file path
      fileName = templatePathOrBuffer.split("/").pop()?.toLowerCase() || "";
      const templateBuffer = await readFile(templatePathOrBuffer);
      fileSize = templateBuffer.length;
    } else {
      // It's a buffer
      fileName = "template.pptx"; // Default name for buffer
      fileSize = templatePathOrBuffer.length;
    }

    console.log(`Analyzing template: ${fileName}, size: ${fileSize} bytes`);

    // Try to extract actual design information from the template
    // This is a simplified approach - in a full implementation, we'd parse the PPTX XML
    let selectedStyle: keyof typeof templateStyles = "professional";

    // Analyze filename for design clues
    if (
      fileName.includes("organic") ||
      fileName.includes("natural") ||
      fileName.includes("soft")
    ) {
      selectedStyle = "organic";
    } else if (
      fileName.includes("marketing") ||
      fileName.includes("plan") ||
      fileName.includes("shapes") ||
      fileName.includes("creative")
    ) {
      selectedStyle = "marketing";
    } else if (
      fileName.includes("modern") ||
      fileName.includes("contemporary") ||
      fileName.includes("minimal")
    ) {
      selectedStyle = "modern";
    } else if (
      fileName.includes("corporate") ||
      fileName.includes("business") ||
      fileName.includes("professional")
    ) {
      selectedStyle = "corporate";
    } else if (
      fileName.includes("clean") ||
      fileName.includes("simple") ||
      fileName.includes("white")
    ) {
      selectedStyle = "clean";
    } else {
      // Analyze file size and content for design complexity
      if (fileSize > 5000000) {
        // Large file - likely complex template with many design elements
        selectedStyle = "marketing";
      } else if (fileSize > 2000000) {
        // Medium file - balanced design
        selectedStyle = "modern";
      } else {
        // Small file - likely simple, clean design
        selectedStyle = "clean";
      }
    }

    // Get the base template style
    const baseStyle = templateStyles[selectedStyle];

    // Enhance the style based on actual template analysis
    // In a full implementation, we'd extract actual colors from the PPTX
    const enhancedStyle: TemplateStyle = {
      ...baseStyle,
      // Add some variation based on file characteristics
      titleFontSize: baseStyle.titleFontSize + (fileSize > 3000000 ? 2 : 0),
      bodyFontSize: baseStyle.bodyFontSize + (fileSize > 3000000 ? 1 : 0),
      hasShapes: fileSize > 2000000, // Larger files likely have more shapes
      hasImages: fileSize > 4000000, // Very large files likely have images
    };

    console.log(
      `Selected template style: ${selectedStyle} with enhanced properties`
    );
    return enhancedStyle;
  } catch (error) {
    console.error("Failed to analyze template design:", error);
    return templateStyles.professional;
  }
};

export async function parseTemplateStyles(
  templatePathOrBuffer: string | Buffer
): Promise<TemplateStyle> {
  try {
    // Use the enhanced PPTX parser to extract actual design elements
    const templateStyle = await parsePPTXDesign(templatePathOrBuffer);

    const templateName =
      typeof templatePathOrBuffer === "string"
        ? templatePathOrBuffer
        : "Buffer template";

    console.log(
      `Template parsed: ${templateName}, style: ${templateStyle.templateDesign}, colors: ${templateStyle.slideBackground}`
    );

    return templateStyle;
  } catch (error) {
    console.error("Failed to parse template styles:", error);
    // Return professional style as fallback
    return templateStyles.professional;
  }
}

export function applyTemplateStyles(pptx: any, templateStyles: TemplateStyle) {
  // Apply template styles to the presentation
  // This is a placeholder for future template styling implementation
  return templateStyles;
}

// Export template styles for frontend use
export { templateStyles };
