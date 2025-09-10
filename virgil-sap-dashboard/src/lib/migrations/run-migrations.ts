import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import sql from "../db";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
if (import.meta.url === `file://${process.argv[1]}`) {
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
