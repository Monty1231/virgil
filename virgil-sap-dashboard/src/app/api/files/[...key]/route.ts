import { type NextRequest, NextResponse } from "next/server";
import { S3Service } from "@/lib/s3";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ key: string[] }> }
) {
  try {
    const { key } = await context.params;
    const s3Key = key.join("/");

    // Check if file exists in S3
    const fileExists = await S3Service.fileExists(s3Key);
    if (!fileExists) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Get file info
    const fileInfo = await S3Service.getFileInfo(s3Key);
    if (!fileInfo) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Generate presigned download URL
    const downloadUrl = await S3Service.getDownloadUrl(s3Key, 3600); // 1 hour expiry

    // Redirect to presigned URL
    return NextResponse.redirect(downloadUrl);
  } catch (error) {
    console.error("File access error:", error);
    return NextResponse.json(
      { error: "Failed to access file" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ key: string[] }> }
) {
  try {
    const { key } = await context.params;
    const s3Key = key.join("/");

    // Delete from S3
    await S3Service.deleteFile(s3Key);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("File deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}
