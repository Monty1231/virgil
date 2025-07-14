import { readFileSync } from "fs";
import { join } from "path";
import sql from "../db";

export async function runMigrations() {
  try {
    console.log("🔄 Running database migrations...");

    // Read and execute the S3 migration
    const migrationPath = join(__dirname, "add-s3-key-to-company-files.sql");
    const migrationSQL = readFileSync(migrationPath, "utf-8");

    console.log("📝 Executing S3 migration...");
    await sql.query(migrationSQL);
    console.log("✅ S3 migration completed successfully");

    console.log("🎉 All migrations completed successfully");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log("Migrations completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration failed:", error);
      process.exit(1);
    });
}
