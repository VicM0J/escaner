
import pg from "pg";
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:12345@localhost:5432/escanjsn";

if (!connectionString) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ 
  connectionString: connectionString,
  ssl: false, // No SSL para base de datos local
});

export const db = drizzle(pool, { schema });
