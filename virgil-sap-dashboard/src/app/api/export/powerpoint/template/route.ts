import { type NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, readdir, unlink } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

const TEMPLATES_DIR = join(process.cwd(), "uploads", "templates");

// Ensure templates directory exists
async function ensureTemplatesDir() {
  if (!existsSync(TEMPLATES_DIR)) {
    await mkdir(TEMPLATES_DIR, { recursive: true });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureTemplatesDir();

    const formData = await request.formData();
    const file = formData.get("template") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No template file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.toLowerCase().endsWith(".pptx")) {
      return NextResponse.json(
        { error: "Only .pptx files are supported" },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 10MB" },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${timestamp}_${file.name.replace(
      /[^a-zA-Z0-9.-]/g,
      "_"
    )}`;
    const filepath = join(TEMPLATES_DIR, filename);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    return NextResponse.json({
      success: true,
      templateId: filename,
      originalName: file.name,
      size: file.size,
    });
  } catch (error) {
    console.error("Template upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload template" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await ensureTemplatesDir();

    const files = await readdir(TEMPLATES_DIR);
    const templates = [];

    for (const file of files) {
      if (file.toLowerCase().endsWith(".pptx")) {
        const originalName = file.replace(/^\d+_/, "").replace(/\.pptx$/, "");
        templates.push({
          id: file,
          name: originalName,
          uploadedAt: new Date(parseInt(file.split("_")[0])).toISOString(),
        });
      }
    }

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Template list error:", error);
    return NextResponse.json(
      { error: "Failed to list templates" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get("id");

    if (!templateId) {
      return NextResponse.json(
        { error: "Template ID required" },
        { status: 400 }
      );
    }

    const filepath = join(TEMPLATES_DIR, templateId);

    if (!existsSync(filepath)) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    await unlink(filepath);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Template deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    );
  }
}
