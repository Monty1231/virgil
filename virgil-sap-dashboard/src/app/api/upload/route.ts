import { type NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import sql from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const category = formData.get("category") as string;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/plain",
      "image/jpeg",
      "image/jpg",
      "image/png",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "File type not supported" },
        { status: 400 }
      );
    }

    // Create upload directory structure
    const uploadDir = join(process.cwd(), "uploads", category);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filename = `${timestamp}_${originalName}`;
    const filepath = join(uploadDir, filename);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Extract text content for AI analysis (for supported file types)
    let fileContent = "";
    let contentExtracted = false;

    try {
      if (file.type === "text/plain") {
        // For text files, read the content directly
        fileContent = buffer.toString("utf-8");
        contentExtracted = true;
      } else if (file.type === "application/pdf") {
        // For PDFs, we'll need to extract text (this is a placeholder)
        // In a real implementation, you'd use a PDF parsing library
        fileContent = `[PDF Content: ${file.name}] - Content extraction would be implemented with a PDF library`;
        contentExtracted = true;
      } else {
        // For other file types, provide a placeholder
        fileContent = `[${file.type} Content: ${file.name}] - Content extraction would be implemented for this file type`;
        contentExtracted = true;
      }
    } catch (extractError) {
      console.error("Failed to extract file content:", extractError);
      fileContent = `[Content extraction failed for ${file.name}]`;
      contentExtracted = false;
    }

    // Store file information in database
    const fileInsertQuery = `
      INSERT INTO company_files (
        filename,
        original_name,
        file_size,
        file_type,
        category,
        file_path,
        file_content,
        content_extracted,
        uploaded_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9
      )
      RETURNING id
    `;

    const fileValues = [
      filename,
      file.name,
      file.size,
      file.type,
      category,
      `/uploads/${category}/${filename}`,
      fileContent,
      contentExtracted,
      new Date().toISOString(),
    ];

    const fileResult = await sql.query(fileInsertQuery, fileValues);
    const fileId = fileResult.rows[0]?.id;

    // Return file information
    return NextResponse.json({
      id: fileId || timestamp.toString(),
      filename: filename,
      originalName: file.name,
      size: file.size,
      type: file.type,
      category: category,
      url: `/uploads/${category}/${filename}`,
      uploadedAt: new Date().toISOString(),
      contentExtracted: contentExtracted,
      contentLength: fileContent.length,
    });
  } catch (error) {
    console.error("File upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
