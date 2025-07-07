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
  templatePath: string
): Promise<TemplateStyle> => {
  try {
    const templateBuffer = await readFile(templatePath);
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
                  if (clr) themeColorMap[name] = clr;
                });
              }
              resolve(undefined);
            });
          });
        }
      }

      // Find the first slide and look for schemeClr reference
      const slideFiles = entryNames.filter((name) =>
        name.includes("slides/slide")
      );
      if (slideFiles.length > 0) {
        const firstSlideEntry = zip.getEntry(slideFiles[0]);
        if (firstSlideEntry) {
          const slideXml = firstSlideEntry.getData().toString();
          // Look for a:schemeClr val="..."
          const schemeMatch = slideXml.match(/<a:schemeClr[^>]*val="([^"]+)"/);
          if (schemeMatch) {
            schemeBackgroundRef = schemeMatch[1];
          }
        }
      }

      // Try to read theme colors from all available theme files
      for (const themePath of themeFiles) {
        const themeEntry = zip.getEntry(themePath);
        if (themeEntry) {
          console.log(`Parsing theme file: ${themePath}`);
          const themeXml = themeEntry.getData().toString();

          // Look for color patterns in the XML
          const colorMatches = themeXml.match(/srgbClr[^>]*val="([^"]+)"/g);
          if (colorMatches) {
            console.log(
              `Found ${colorMatches.length} color matches in ${themePath}`
            );
            colorMatches.forEach((match: string) => {
              const color = match.match(/val="([^"]+)"/)?.[1];
              if (
                color &&
                color !== "FFFFFF" &&
                color !== "000000" &&
                color.length === 6
              ) {
                extractedColors[
                  `theme_${Object.keys(extractedColors).length}`
                ] = color;
                console.log("Extracted theme color:", color);
              }
            });
          }

          // Also try to parse the XML structure for color schemes
          try {
            const themeResult = await new Promise((resolve, reject) => {
              parseString(themeXml, (err, result) => {
                if (err) reject(err);
                else resolve(result);
              });
            });

            const colorScheme =
              themeResult?.["a:theme"]?.["a:themeElements"]?.[0]?.[
                "a:clrScheme"
              ]?.[0];
            if (colorScheme) {
              console.log(`Found color scheme in ${themePath}`);

              // Extract background colors
              const bg1 =
                colorScheme["a:bg1"]?.[0]?.["a:srgbClr"]?.[0]?.["$"]?.["val"];
              const bg2 =
                colorScheme["a:bg2"]?.[0]?.["a:srgbClr"]?.[0]?.["$"]?.["val"];
              if (bg1 && bg1 !== "FFFFFF") {
                extractedColors.background = bg1;
                console.log("Extracted background color:", bg1);
              } else if (bg2 && bg2 !== "FFFFFF") {
                extractedColors.background = bg2;
                console.log("Extracted background color:", bg2);
              } else {
                // If no explicit background color found, try to find the most prominent color
                const allColors = Object.values(extractedColors).filter(
                  (c) => c && c !== "FFFFFF" && c !== "000000"
                );
                if (allColors.length > 0) {
                  // Use the first non-white/black color as background
                  const prominentColor = allColors[0];
                  extractedColors.background = prominentColor;
                  console.log(
                    "Using prominent color as background:",
                    prominentColor
                  );
                }
              }

              // Extract text colors
              const tx1 =
                colorScheme["a:tx1"]?.[0]?.["a:srgbClr"]?.[0]?.["$"]?.["val"];
              const tx2 =
                colorScheme["a:tx2"]?.[0]?.["a:srgbClr"]?.[0]?.["$"]?.["val"];
              if (tx1 && tx1 !== "000000") {
                extractedColors.text = tx1;
                console.log("Extracted text color:", tx1);
              } else if (tx2 && tx2 !== "000000") {
                extractedColors.text = tx2;
                console.log("Extracted text color:", tx2);
              }

              // Extract accent colors
              for (let i = 1; i <= 6; i++) {
                const accent =
                  colorScheme[`a:accent${i}`]?.[0]?.["a:srgbClr"]?.[0]?.["$"]?.[
                    "val"
                  ];
                if (accent && accent !== "FFFFFF" && accent !== "000000") {
                  extractedColors[`accent${i}`] = accent;
                  console.log(`Extracted accent${i} color:`, accent);
                }
              }
            }
          } catch (parseError) {
            console.log(
              `Could not parse theme XML structure for ${themePath}:`,
              parseError.message
            );
          }
        }
      }

      // Try to extract colors from slide masters
      const slideMasterFiles = entryNames.filter((name) =>
        name.includes("slideMaster")
      );
      console.log("Found slide master files:", slideMasterFiles);

      for (const masterPath of slideMasterFiles) {
        const slideMasterEntry = zip.getEntry(masterPath);
        if (slideMasterEntry) {
          console.log(`Parsing slide master: ${masterPath}`);
          const slideMasterXml = slideMasterEntry.getData().toString();

          // Look for background colors in slide master
          const bgMatches = slideMasterXml.match(
            /p:solidFill[^>]*a:srgbClr[^>]*val="([^"]+)"/g
          );
          if (bgMatches) {
            console.log(
              `Found ${bgMatches.length} background matches in ${masterPath}`
            );
            bgMatches.forEach((match: string) => {
              const color = match.match(/val="([^"]+)"/)?.[1];
              if (color && color !== "FFFFFF" && color.length === 6) {
                extractedColors.slideBackground = color;
                console.log("Extracted slide background color:", color);
              }
            });
          }

          // Look for any other color references
          const colorMatches = slideMasterXml.match(
            /srgbClr[^>]*val="([^"]+)"/g
          );
          if (colorMatches) {
            colorMatches.forEach((match: string) => {
              const color = match.match(/val="([^"]+)"/)?.[1];
              if (
                color &&
                color !== "FFFFFF" &&
                color !== "000000" &&
                color.length === 6
              ) {
                extractedColors[
                  `master_${Object.keys(extractedColors).length}`
                ] = color;
                console.log("Extracted master color:", color);
              }
            });
          }
        }
      }

      // Try to extract colors from any slide content
      const slideContentFiles = entryNames.filter((name) =>
        name.includes("slides/slide")
      );
      if (slideContentFiles.length > 0) {
        console.log(
          `Found ${slideContentFiles.length} slide files, checking for colors...`
        );

        // Check first few slides for colors
        for (let i = 0; i < Math.min(3, slideContentFiles.length); i++) {
          const slideEntry = zip.getEntry(slideContentFiles[i]);
          if (slideEntry) {
            const slideXml = slideEntry.getData().toString();
            const colorMatches = slideXml.match(/srgbClr[^>]*val="([^"]+)"/g);
            if (colorMatches) {
              colorMatches.forEach((match: string) => {
                const color = match.match(/val="([^"]+)"/)?.[1];
                if (
                  color &&
                  color !== "FFFFFF" &&
                  color !== "000000" &&
                  color.length === 6
                ) {
                  extractedColors[
                    `slide_${Object.keys(extractedColors).length}`
                  ] = color;
                  console.log("Extracted slide color:", color);
                }
              });
            }
          }
        }
      }
    } catch (error) {
      console.log(
        "Could not parse theme colors, using fallback:",
        error.message
      );
    }

    console.log("Final extracted colors:", extractedColors);

    // If we found a schemeClr reference and can resolve it, use that as the background
    let resolvedBackground =
      extractedColors.background || extractedColors.slideBackground;
    if (
      schemeBackgroundRef &&
      themeColorMap[schemeBackgroundRef.toLowerCase()]
    ) {
      resolvedBackground = themeColorMap[schemeBackgroundRef.toLowerCase()];
    }

    // Determine template style based on extracted colors and file characteristics
    const fileName = templatePath.split("/").pop()?.toLowerCase() || "";
    const fileSize = templateBuffer.length;

    let selectedStyle: keyof typeof templateStyles = "professional";

    // Analyze the extracted colors to determine template style
    if (Object.keys(extractedColors).length > 0) {
      // We have actual colors from template - analyze them
      const allColors = Object.values(extractedColors).map((c) =>
        c.toLowerCase()
      );

      console.log("Analyzing extracted colors:", allColors);

      // Check for specific color patterns
      if (
        allColors.some(
          (c) =>
            c.includes("f0f9ff") || c.includes("e0f2fe") || c.includes("dbeafe")
        )
      ) {
        selectedStyle = "organic";
      } else if (
        allColors.some(
          (c) =>
            c.includes("3b82f6") || c.includes("1e40af") || c.includes("2563eb")
        )
      ) {
        selectedStyle = "modern";
      } else if (
        allColors.some(
          (c) =>
            c.includes("1e3a5f") || c.includes("1e293b") || c.includes("0f172a")
        )
      ) {
        selectedStyle = "professional";
      } else if (
        allColors.some(
          (c) =>
            c.includes("7c3aed") || c.includes("a855f7") || c.includes("9333ea")
        )
      ) {
        selectedStyle = "marketing";
      } else if (
        allColors.some(
          (c) =>
            c.includes("374151") || c.includes("6b7280") || c.includes("4b5563")
        )
      ) {
        selectedStyle = "corporate";
      } else if (
        allColors.some(
          (c) =>
            c.includes("ffffff") || c.includes("f8fafc") || c.includes("f1f5f9")
        )
      ) {
        selectedStyle = "clean";
      } else {
        // Use the most prominent non-white color to determine style
        const prominentColor = allColors.find(
          (c) => c !== "ffffff" && c !== "000000"
        );
        if (prominentColor) {
          // Analyze the color to determine style
          const r = parseInt(prominentColor.substring(0, 2), 16);
          const g = parseInt(prominentColor.substring(2, 4), 16);
          const b = parseInt(prominentColor.substring(4, 6), 16);

          // Simple color analysis
          if (b > r && b > g) {
            selectedStyle = "modern"; // Blue dominant
          } else if (r > g && r > b) {
            selectedStyle = "marketing"; // Red dominant
          } else if (g > r && g > b) {
            selectedStyle = "organic"; // Green dominant
          } else {
            selectedStyle = "professional"; // Neutral
          }
        }
      }
    } else {
      // Fallback to filename analysis
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
      hasShapes: fileSize > 2000000,
      hasImages: fileSize > 4000000,
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
    return await analyzeTemplateDesign(templatePath);
  }
};

// Helper function to analyze template content and extract actual design
const analyzeTemplateDesign = async (
  templatePath: string
): Promise<TemplateStyle> => {
  try {
    // For now, we'll use the filename-based approach but with better analysis
    const fileName = templatePath.split("/").pop()?.toLowerCase() || "";
    const templateBuffer = await readFile(templatePath);
    const fileSize = templateBuffer.length;

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
  templatePath: string
): Promise<TemplateStyle> {
  try {
    // Use the enhanced PPTX parser to extract actual design elements
    const templateStyle = await parsePPTXDesign(templatePath);

    console.log(
      `Template parsed: ${templatePath}, style: ${templateStyle.templateDesign}, colors: ${templateStyle.slideBackground}`
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
