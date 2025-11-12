import { Pool, QueryResult } from "pg";

const connectionString =
  process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("Missing SUPABASE_DB_URL or DATABASE_URL for Postgres connection");
}

const isLocalConnection =
  connectionString.includes("localhost") ||
  connectionString.includes("127.0.0.1") ||
  connectionString.includes("::1");

export const pool = new Pool({
  connectionString,
  ssl: isLocalConnection ? undefined : { rejectUnauthorized: false },
});

export const query = async <T = unknown>(
  text: string,
  params: unknown[] = [],
): Promise<QueryResult<T>> => {
  const client = await pool.connect();

  try {
    return await client.query<T>(text, params as any[]);
  } finally {
    client.release();
  }
};

export const conn = {
  pool,
  query,
  execute: async <T = unknown>(
    text: string,
    params: unknown[] = [],
  ): Promise<{ rows: T[] }> => {
    const result = await query<T>(text, params);
    return { rows: result.rows };
  },
};
