-- Add user_id column to companies table
ALTER TABLE companies ADD COLUMN IF NOT EXISTS user_id VARCHAR(255);

-- Add user_id column to deals table  
ALTER TABLE deals ADD COLUMN IF NOT EXISTS user_id VARCHAR(255);

-- Add user_id column to company_files table
ALTER TABLE company_files ADD COLUMN IF NOT EXISTS user_id VARCHAR(255);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_companies_user_id ON companies(user_id);
CREATE INDEX IF NOT EXISTS idx_deals_user_id ON deals(user_id);
CREATE INDEX IF NOT EXISTS idx_company_files_user_id ON company_files(user_id); 