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