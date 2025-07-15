import { NextResponse } from "next/server";
import {
  S3Client,
  CreateBucketCommand,
  HeadBucketCommand,
} from "@aws-sdk/client-s3";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const bucketName = searchParams.get("bucketName");

    // Initialize S3 client
    const s3Client = new S3Client({
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    if (action === "check-bucket") {
      if (!bucketName) {
        return NextResponse.json(
          { error: "Bucket name is required" },
          { status: 400 }
        );
      }

      try {
        // Check if bucket exists
        await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
        return NextResponse.json({
          exists: true,
          message: `Bucket '${bucketName}' already exists and is accessible`,
        });
      } catch (error: any) {
        if (error.name === "NotFound" || error.name === "NoSuchBucket") {
          return NextResponse.json({
            exists: false,
            message: `Bucket '${bucketName}' does not exist`,
          });
        } else if (error.name === "Forbidden") {
          return NextResponse.json({
            exists: false,
            message: `Bucket '${bucketName}' exists but you don't have access to it`,
          });
        } else {
          return NextResponse.json({
            exists: false,
            message: `Error checking bucket: ${error.message}`,
          });
        }
      }
    }

    if (action === "create-bucket") {
      if (!bucketName) {
        return NextResponse.json(
          { error: "Bucket name is required" },
          { status: 400 }
        );
      }

      try {
        // Create bucket
        await s3Client.send(new CreateBucketCommand({ Bucket: bucketName }));
        return NextResponse.json({
          success: true,
          message: `Bucket '${bucketName}' created successfully`,
        });
      } catch (error: any) {
        if (error.name === "BucketAlreadyExists") {
          return NextResponse.json({
            success: false,
            error: `Bucket '${bucketName}' already exists globally`,
          });
        } else if (error.name === "BucketAlreadyOwnedByYou") {
          return NextResponse.json({
            success: true,
            message: `Bucket '${bucketName}' already exists and is owned by you`,
          });
        } else {
          return NextResponse.json({
            success: false,
            error: `Failed to create bucket: ${error.message}`,
          });
        }
      }
    }

    if (action === "generate-names") {
      // Generate some unique bucket name suggestions
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const suggestions = [
        `virgil-sap-${timestamp}`,
        `virgil-files-${randomSuffix}`,
        `virgil-dashboard-${timestamp}-${randomSuffix}`,
        `virgil-uploads-${Date.now()}`,
        `virgil-sap-dashboard-${timestamp}`,
        `virgil-company-files-${randomSuffix}`,
        `virgil-documents-${timestamp}`,
        `virgil-storage-${Date.now()}-${randomSuffix}`,
      ];

      return NextResponse.json({
        suggestions,
        timestamp,
        randomSuffix,
        note: "S3 bucket names must be globally unique across all AWS accounts",
      });
    }

    // Default response with available actions
    return NextResponse.json({
      availableActions: [
        "check-bucket?bucketName=your-bucket-name",
        "create-bucket?bucketName=your-bucket-name",
        "generate-names",
      ],
      config: {
        hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
        hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
        hasRegion: !!process.env.AWS_REGION,
        region: process.env.AWS_REGION || "us-east-1",
      },
    });
  } catch (error) {
    console.error("S3 setup error:", error);
    return NextResponse.json(
      {
        error: "Failed to setup S3",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
