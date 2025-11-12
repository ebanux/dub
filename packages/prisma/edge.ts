import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const connectionString =
  process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("Missing SUPABASE_DB_URL or DATABASE_URL for Prisma edge client");
}

const pool = new Pool({
  connectionString,
  ssl:
    connectionString.includes("localhost") ||
    connectionString.includes("127.0.0.1") ||
    connectionString.includes("::1")
      ? undefined
      : { rejectUnauthorized: false },
});

const adapter = new PrismaPg(pool);

export const prismaEdge = new PrismaClient({ adapter });
