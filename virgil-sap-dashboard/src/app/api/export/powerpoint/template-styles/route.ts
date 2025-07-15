import { type NextRequest, NextResponse } from "next/server";
import { parseTemplateStyles } from "../template-parser";
import sql from "@/lib/db";
import { S3Service } from "@/lib/s3";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get("id");

    if (!templateId) {
      return NextResponse.json(
        { error: "Template ID required" },
        { status: 400 }
      );
    }

    console.log("🔍 Fetching template styles for ID:", templateId);

    // Debug S3Service import
    console.log("🔧 S3Service type:", typeof S3Service);
    console.log(
      "🔧 S3Service methods:",
      S3Service ? Object.getOwnPropertyNames(S3Service) : "null"
    );
    console.log(
      "🔧 S3Service.downloadFile type:",
      typeof S3Service?.downloadFile
    );

    // Check if S3Service is available
    if (!S3Service) {
      console.error("❌ S3Service is null or undefined");
      return NextResponse.json(
        { error: "S3Service not available" },
        { status: 500 }
      );
    }

    // Get template info from database
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

    console.log("📁 Template found, S3 key:", s3Key);

    // Check if S3Service.downloadFile is available
    if (typeof S3Service.downloadFile !== "function") {
      console.error(
        "❌ S3Service.downloadFile is not a function:",
        typeof S3Service.downloadFile
      );
      console.error(
        "❌ Available S3Service methods:",
        Object.getOwnPropertyNames(S3Service)
      );
      return NextResponse.json(
        { error: "S3Service.downloadFile method not available" },
        { status: 500 }
      );
    }

    // Download template from S3
    console.log("⬇️ Downloading template from S3...");
    const templateBuffer = await S3Service.downloadFile(s3Key);
    console.log("✅ Template downloaded, size:", templateBuffer.length);

    // Parse template styles using the buffer
    console.log("🎨 Parsing template styles...");
    const styles = await parseTemplateStyles(templateBuffer);
    console.log("✅ Template styles parsed:", styles);

    return NextResponse.json(styles);
  } catch (error) {
    console.error("❌ Failed to get template styles:", error);
    return NextResponse.json(
      {
        error: `Failed to get template styles: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      },
      { status: 500 }
    );
  }
}
