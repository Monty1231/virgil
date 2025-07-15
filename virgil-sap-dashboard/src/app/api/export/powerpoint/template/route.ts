import { type NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { S3Service } from "@/lib/s3";

export async function POST(request: NextRequest) {
  try {
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

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename and S3 key
    const timestamp = Date.now();
    const filename = `${timestamp}_${file.name.replace(
      /[^a-zA-Z0-9.-]/g,
      "_"
    )}`;
    const s3Key = S3Service.generateKey("templates", filename);

    // Upload to S3
    const s3FileInfo = await S3Service.uploadFile(
      buffer,
      s3Key,
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      {
        originalName: file.name,
        category: "templates",
        uploadedAt: new Date().toISOString(),
      }
    );

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
        uploaded_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8
      )
      RETURNING id
    `;

    const fileValues = [
      filename,
      file.name,
      file.size,
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "templates",
      `/api/files/${s3Key}`, // API endpoint for file access
      s3Key, // S3 key for direct S3 operations
      new Date().toISOString(),
    ];

    const fileResult = await sql.query(fileInsertQuery, fileValues);
    const fileId = fileResult.rows[0]?.id;

    return NextResponse.json({
      success: true,
      templateId: filename,
      originalName: file.name,
      size: file.size,
      id: fileId,
      s3Key: s3Key,
      url: `/api/files/${s3Key}`,
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
    // Query templates from database instead of reading local directory
    const templatesQuery = `
      SELECT id, filename, original_name, file_size, uploaded_at, s3_key
      FROM company_files 
      WHERE category = 'templates' 
      ORDER BY uploaded_at DESC
    `;

    const result = await sql.query(templatesQuery);
    const templates = result.rows.map((row) => ({
      id: row.filename,
      name: row.original_name.replace(/\.pptx$/, ""),
      uploadedAt: row.uploaded_at,
      size: row.file_size,
      s3Key: row.s3_key,
    }));

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

    // Get template info from database using filename
    const templateQuery = `
      SELECT s3_key, original_name 
      FROM company_files 
      WHERE filename = $1 AND category = 'templates'
    `;

    const result = await sql.query(templateQuery, [templateId]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    const template = result.rows[0];
    const s3Key = template.s3_key;

    // Check if the file exists in S3
    const exists = await S3Service.checkFileExists(s3Key);

    if (!exists) {
      console.warn(
        `Template ${templateId} not found in S3, but exists in database. Proceeding with database cleanup.`
      );
    }

    // Delete from S3 (if it exists)
    try {
      await S3Service.deleteFile(s3Key);
      console.log(`Deleted template from S3: ${s3Key}`);
    } catch (s3Error) {
      console.warn(`Failed to delete from S3 (may not exist): ${s3Error}`);
    }

    // Delete from database
    const deleteQuery = `
      DELETE FROM company_files
      WHERE filename = $1 AND category = 'templates'
    `;
    await sql.query(deleteQuery, [templateId]);
    console.log(`Deleted template from database: ${templateId}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Template deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    );
  }
}
