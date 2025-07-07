import { type NextRequest, NextResponse } from "next/server";
import { parseTemplateStyles } from "../template-parser";
import { join } from "path";
import { existsSync } from "fs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get("id");

    if (!templateId) {
      return NextResponse.json({ error: "Template ID required" }, { status: 400 });
    }

    const TEMPLATES_DIR = join(process.cwd(), "uploads", "templates");
    const templatePath = join(TEMPLATES_DIR, templateId);

    if (!existsSync(templatePath)) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Parse template styles
    const styles = await parseTemplateStyles(templatePath);

    return NextResponse.json(styles);
  } catch (error) {
    console.error("Failed to get template styles:", error);
    return NextResponse.json({ error: "Failed to get template styles" }, { status: 500 });
  }
} 