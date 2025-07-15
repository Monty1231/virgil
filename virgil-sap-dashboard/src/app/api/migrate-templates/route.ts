import { NextResponse } from "next/server";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import sql from "@/lib/db";
import { S3Service } from "@/lib/s3";

export async function POST() {
  try {
    console.log("🔄 Starting template migration to S3...");

    const templatesDir = join(process.cwd(), "uploads", "templates");
    const files = readdirSync(templatesDir);

    const results = [];

    for (const filename of files) {
      try {
        console.log(`📁 Processing template: ${filename}`);

        const filePath = join(templatesDir, filename);
        const fileBuffer = readFileSync(filePath);

        // Generate S3 key for template
        const s3Key = S3Service.generateKey("templates", filename);

        // Upload to S3
        const s3FileInfo = await S3Service.uploadFile(
          fileBuffer,
          s3Key,
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          {
            originalName: filename,
            category: "templates",
            migratedAt: new Date().toISOString(),
          }
        );

        // Check if file already exists in database
        const existingFile = await sql.query(
          "SELECT id FROM company_files WHERE filename = $1",
          [filename]
        );

        if (existingFile.rows.length > 0) {
          // Update existing record with S3 key
          await sql.query(
            `UPDATE company_files 
             SET s3_key = $1, file_path = $2, updated_at = $3
             WHERE filename = $4`,
            [s3Key, `/api/files/${s3Key}`, new Date().toISOString(), filename]
          );
          console.log(`✅ Updated database record for: ${filename}`);
        } else {
          // Create new database record
          await sql.query(
            `INSERT INTO company_files (
              filename, original_name, file_size, file_type, category,
              file_path, s3_key, uploaded_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              filename,
              filename,
              fileBuffer.length,
              "application/vnd.openxmlformats-officedocument.presentationml.presentation",
              "templates",
              `/api/files/${s3Key}`,
              s3Key,
              new Date().toISOString(),
            ]
          );
          console.log(`✅ Created database record for: ${filename}`);
        }

        results.push({
          filename,
          s3Key,
          size: fileBuffer.length,
          status: "success",
        });
      } catch (error) {
        console.error(`❌ Failed to migrate ${filename}:`, error);
        results.push({
          filename,
          error: error instanceof Error ? error.message : "Unknown error",
          status: "failed",
        });
      }
    }

    const successCount = results.filter((r) => r.status === "success").length;
    const failureCount = results.filter((r) => r.status === "failed").length;

    console.log(
      `🎉 Template migration completed: ${successCount} successful, ${failureCount} failed`
    );

    return NextResponse.json({
      success: true,
      message: `Template migration completed: ${successCount} successful, ${failureCount} failed`,
      results,
      summary: {
        total: results.length,
        successful: successCount,
        failed: failureCount,
      },
    });
  } catch (error) {
    console.error("❌ Template migration failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Template migration failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
