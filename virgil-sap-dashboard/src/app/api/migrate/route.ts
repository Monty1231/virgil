import { NextResponse } from "next/server";
import sql from "@/lib/db";

export async function POST() {
  try {
    console.log("🔄 API: Starting database migration...");
    
    // S3 migration SQL
    const migrationSQL = `
      -- Migration: Add S3 key column to company_files table
      -- This migration adds support for S3 file storage
      
      -- Add s3_key column to company_files table
      ALTER TABLE company_files 
      ADD COLUMN IF NOT EXISTS s3_key VARCHAR(500);
      
      -- Add index for better query performance
      CREATE INDEX IF NOT EXISTS idx_company_files_s3_key 
      ON company_files(s3_key);
      
      -- Add comment to document the column
      COMMENT ON COLUMN company_files.s3_key IS 'S3 object key for file storage in AWS S3';
    `;

    console.log("📝 Executing S3 migration...");
    await sql.query(migrationSQL);
    console.log("✅ S3 migration completed successfully");

    return NextResponse.json({
      success: true,
      message: "Database migration completed successfully"
    });
  } catch (error) {
    console.error("❌ API: Migration failed:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: "Migration failed",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
