# S3 Integration Setup

This document explains how to set up AWS S3 integration for file storage in the Virgil SAP Dashboard.

## Prerequisites

1. AWS Account with S3 access
2. S3 bucket created for file storage
3. AWS credentials with appropriate permissions

## Environment Variables

Add the following environment variables to your `.env.local` file:

```bash
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-s3-bucket-name
```

## AWS IAM Permissions

Your AWS user/role needs the following S3 permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:HeadObject"
      ],
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

## S3 Bucket Configuration

1. Create an S3 bucket in your preferred region
2. Configure CORS if needed for direct browser uploads:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": []
  }
]
```

## Database Migration

Run the database migration to add S3 support:

```bash
npm run migrate
```

This will add the `s3_key` column to the `company_files` table.

## Features

### File Upload

- Files are uploaded directly to S3
- Unique S3 keys are generated for each file
- File metadata is stored in the database
- Content extraction is performed for AI analysis

### File Access

- Files are served via presigned URLs
- URLs expire after 1 hour for security
- Direct S3 access is available via API

### File Management

- Files can be deleted from S3
- Database records are updated accordingly
- File existence is verified before operations

## API Endpoints

### Upload File

```
POST /api/upload
Content-Type: multipart/form-data

Parameters:
- file: The file to upload
- category: File category (requirements, financial, etc.)
```

### Access File

```
GET /api/files/{s3-key}
```

Redirects to a presigned S3 URL for file download.

### Delete File

```
DELETE /api/files/{s3-key}
```

Deletes the file from S3.

## File Categories

The system supports the following file categories:

- `requirements`: Requirements documents
- `org_chart`: Organizational charts
- `current_systems`: Current systems documentation
- `financial`: Financial information
- `presentation`: Company presentations
- `other`: Other documents

## Security Considerations

1. **Presigned URLs**: File access URLs expire after 1 hour
2. **File Validation**: File types and sizes are validated before upload
3. **S3 Permissions**: Minimal required permissions are used
4. **Database Tracking**: All file operations are logged in the database

## Troubleshooting

### Common Issues

1. **AWS Credentials Error**

   - Verify AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are set
   - Check that credentials have appropriate S3 permissions

2. **Bucket Not Found**

   - Verify AWS_S3_BUCKET_NAME is correct
   - Ensure the bucket exists in the specified region

3. **Upload Failures**

   - Check file size limits (10MB maximum)
   - Verify file type is supported
   - Check S3 bucket permissions

4. **Database Migration Errors**
   - Ensure database connection is working
   - Check that the company_files table exists
   - Verify database user has ALTER TABLE permissions

## Migration from Local Storage

If you're migrating from local file storage to S3:

1. Run the database migration
2. Update your environment variables
3. Test file uploads with the new system
4. Consider migrating existing files to S3 (manual process)

## Performance Considerations

- S3 provides high availability and scalability
- Presigned URLs reduce server load
- File content extraction happens during upload
- Database queries are optimized with indexes
