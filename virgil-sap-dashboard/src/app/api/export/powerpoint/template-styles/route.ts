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

    // Download template from S3
    const templateBuffer = await S3Service.downloadFile(s3Key);

    // Parse template styles using the buffer
    const styles = await parseTemplateStyles(templateBuffer);

    return NextResponse.json(styles);
  } catch (error) {
    console.error("Failed to get template styles:", error);
    return NextResponse.json(
      { error: "Failed to get template styles" },
      { status: 500 }
    );
  }
}
