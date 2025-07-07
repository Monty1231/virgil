import { NextRequest, NextResponse } from "next/server";
import { parseTemplateStyles } from "../export/powerpoint/template-parser";
import { join } from "path";
import { existsSync } from "fs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get("templateId");
    
    if (!templateId) {
      return NextResponse.json({ error: "Template ID required" }, { status: 400 });
    }

    const TEMPLATES_DIR = join(process.cwd(), "uploads", "templates");
    const templatePath = join(TEMPLATES_DIR, templateId);

    if (!existsSync(templatePath)) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    console.log(`Testing template parser for: ${templatePath}`);
    
    const templateStyles = await parseTemplateStyles(templatePath);
    
    return NextResponse.json({
      success: true,
      templateStyles,
      templatePath,
      fileExists: existsSync(templatePath)
    });
    
  } catch (error) {
    console.error("Template parser test failed:", error);
    return NextResponse.json(
      { error: "Failed to test template parser", details: error.message },
      { status: 500 }
    );
  }
} 