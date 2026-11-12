import pg from "pg";
import dotenv from "dotenv";
import { logger } from "./logger.js";

dotenv.config();

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  logger.error("DATABASE_URL environment variable is not defined");
}

const isRender = connectionString?.includes("render.com");
const isProduction = process.env.NODE_ENV === "production";

export const pool = new Pool({
  connectionString,
  ssl: isRender || isProduction ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

pool.on("connect", () => {
  logger.debug("New PostgreSQL client connected to pool");
});

pool.on("error", (err: Error) => {
  logger.error({ err: err.message }, "Unexpected error on idle PostgreSQL client");
});

export const query = (text: string, params?: any[]) => {
  return pool.query(text, params);
};

export const testConnection = async (): Promise<boolean> => {
  try {
    const res = await pool.query("SELECT NOW() as current_time, current_database() as db_name;");
    logger.info(`PostgreSQL connected successfully to database "${res.rows[0].db_name}"`);
    return true;
  } catch (error: any) {
    logger.error({ err: error.message }, "Failed to connect to PostgreSQL database");
    return false;
  }
};

