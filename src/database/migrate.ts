import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { pool, testConnection } from "../config/db.js";
import { logger } from "../config/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const runMigrations = async () => {
  logger.info("Starting database migration...");
  const isConnected = await testConnection();
  if (!isConnected) {
    logger.error("Cannot run migrations: database is unreachable");
    process.exit(1);
  }

  const candidatePaths = [
    path.join(__dirname, "migrations", "001_initial_schema.sql"),
    path.join(__dirname, "..", "database", "migrations", "001_initial_schema.sql"),
    path.join(process.cwd(), "src", "database", "migrations", "001_initial_schema.sql")
  ];

  const migrationFile = candidatePaths.find(p => fs.existsSync(p));

  if (!migrationFile) {
    logger.error("Could not find migration file 001_initial_schema.sql");
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationFile, "utf-8");

  try {
    await pool.query(sql);
    logger.info("Database migration (001_initial_schema.sql) executed successfully!");
  } catch (err: any) {
    logger.error({ err: err.message }, "Database migration failed");
    process.exit(1);
  } finally {
    await pool.end();
  }
};

runMigrations();
