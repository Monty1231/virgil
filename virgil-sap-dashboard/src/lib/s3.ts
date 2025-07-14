import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;

export interface S3FileInfo {
  key: string;
  size: number;
  lastModified: Date;
  etag: string;
  contentType: string;
}

export class S3Service {
  /**
   * Upload a file to S3
   */
  static async uploadFile(
    file: Buffer,
    key: string,
    contentType: string,
    metadata?: Record<string, string>
  ): Promise<S3FileInfo> {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: contentType,
      Metadata: metadata,
    });

    const result = await s3Client.send(command);

    return {
      key,
      size: file.length,
      lastModified: new Date(),
      etag: result.ETag || "",
      contentType,
    };
  }

  /**
   * Get a presigned URL for downloading a file
   */
  static async getDownloadUrl(
    key: string,
    expiresIn: number = 3600
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    return await getSignedUrl(s3Client, command, { expiresIn });
  }

  /**
   * Get a presigned URL for uploading a file directly to S3
   */
  static async getUploadUrl(
    key: string,
    contentType: string,
    expiresIn: number = 3600
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    return await getSignedUrl(s3Client, command, { expiresIn });
  }

  /**
   * Delete a file from S3
   */
  static async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
  }

  /**
   * Check if a file exists in S3
   */
  static async fileExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      await s3Client.send(command);
      return true;
    } catch (error: any) {
      if (error.name === "NotFound") {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get file metadata from S3
   */
  static async getFileInfo(key: string): Promise<S3FileInfo | null> {
    try {
      const command = new HeadObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      const result = await s3Client.send(command);

      return {
        key,
        size: result.ContentLength || 0,
        lastModified: result.LastModified || new Date(),
        etag: result.ETag || "",
        contentType: result.ContentType || "",
      };
    } catch (error: any) {
      if (error.name === "NotFound") {
        return null;
      }
      throw error;
    }
  }

  /**
   * Generate a unique S3 key for a file
   */
  static generateKey(category: string, filename: string): string {
    const timestamp = Date.now();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
    return `${category}/${timestamp}_${sanitizedFilename}`;
  }
}
