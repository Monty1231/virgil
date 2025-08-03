import sql from "../db";
import fs from "fs";
import path from "path";

async function runUserMigrations() {
  try {
    console.log("🔄 Running user-related migrations...");

    // Read and execute the migration file
    const migrationPath = path.join(__dirname, "add-user-id-columns.sql");
    const migrationSQL = fs.readFileSync(migrationPath, "utf8");

    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0);

    for (const statement of statements) {
      console.log(`📝 Executing: ${statement.substring(0, 50)}...`);
      await sql.query(statement);
    }

    console.log("✅ User migrations completed successfully!");
  } catch (error) {
    console.error("❌ Error running user migrations:", error);
    throw error;
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runUserMigrations()
    .then(() => {
      console.log("🎉 All migrations completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Migration failed:", error);
      process.exit(1);
    });
}

export { runUserMigrations };
