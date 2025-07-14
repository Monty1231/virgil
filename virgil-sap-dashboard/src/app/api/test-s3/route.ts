import { NextResponse } from "next/server";
import { S3Service } from "@/lib/s3";

export async function GET() {
  try {
    // Test S3 configuration
    const config = {
      hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
      hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
      hasRegion: !!process.env.AWS_REGION,
      hasBucket: !!process.env.AWS_S3_BUCKET_NAME,
      bucketName: process.env.AWS_S3_BUCKET_NAME,
      region: process.env.AWS_REGION || 'us-east-1',
    };

    // Test S3 connectivity by trying to check if bucket exists
    let connectivityTest = { success: false, error: null };
    try {
      // Try to get file info for a non-existent file to test connectivity
      const testKey = 'test-connection-file';
      await S3Service.fileExists(testKey);
      connectivityTest = { success: true, error: null };
    } catch (error: any) {
      // If we get a "NotFound" error, that means S3 is working but file doesn't exist
      if (error.name === 'NotFound' || error.name === 'NoSuchKey') {
        connectivityTest = { success: true, error: null };
      } else {
        connectivityTest = { success: false, error: error.message };
      }
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      config,
      connectivityTest,
      status: connectivityTest.success ? 'S3 is properly configured' : 'S3 configuration issue',
    });
  } catch (error) {
    console.error('S3 test error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to test S3 configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 