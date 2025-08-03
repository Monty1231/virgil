import { type NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { S3Service } from "@/lib/s3";
import pdfParse from "pdf-parse";

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

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate S3 key
    const s3Key = S3Service.generateKey(category, file.name);

    // Upload to S3
    const s3FileInfo = await S3Service.uploadFile(buffer, s3Key, file.type, {
      originalName: file.name,
      category: category,
      uploadedAt: new Date().toISOString(),
    });

    // Extract text content for AI analysis (for supported file types)
    let fileContent = "";
    let contentExtracted = false;

    try {
      if (file.type === "text/plain") {
        // For text files, read the content directly
        fileContent = buffer.toString("utf-8");
        contentExtracted = true;
      } else if (file.type === "application/pdf") {
        // For PDFs, download from S3 and extract text using pdf-parse
        try {
          const s3Buffer = await S3Service.downloadFile(s3FileInfo.key);
          const data = await pdfParse(s3Buffer);
          fileContent = data.text;
          contentExtracted = !!fileContent && fileContent.length > 0;
        } catch (pdfError) {
          console.error("PDF parsing error:", pdfError);
          if (
            pdfError.message?.includes("bad XRef") ||
            pdfError.message?.includes("FormatError")
          ) {
            fileContent = `[PDF appears to be corrupted or has invalid structure: ${file.name}]`;
          } else {
            fileContent = `[PDF content extraction failed: ${file.name}]`;
          }
          contentExtracted = false;
        }
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
        s3_key,
        file_content,
        content_extracted,
        uploaded_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
      )
      RETURNING id
    `;

    const fileValues = [
      s3FileInfo.key.split("/").pop(), // filename without path
      file.name,
      file.size,
      file.type,
      category,
      `/api/files/${s3FileInfo.key}`, // API endpoint for file access
      s3FileInfo.key, // S3 key for direct S3 operations
      fileContent,
      contentExtracted,
      new Date().toISOString(),
    ];

    const fileResult = await sql.query(fileInsertQuery, fileValues);
    const fileId = fileResult.rows[0]?.id;

    // Return file information
    return NextResponse.json({
      id: fileId || Date.now().toString(),
      filename: s3FileInfo.key.split("/").pop(),
      originalName: file.name,
      size: file.size,
      type: file.type,
      category: category,
      url: `/api/files/${s3FileInfo.key}`,
      s3Key: s3FileInfo.key,
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
