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

const convertQuestionMarksToNumberedParameters = (
  text: string,
  valueCount: number,
) => {
  if (!text.includes("?")) {
    return text;
  }

  let parameterIndex = 0;
  const converted = text.replace(/\?/g, () => {
    parameterIndex += 1;
    return `$${parameterIndex}`;
  });

  if (parameterIndex !== valueCount) {
    throw new Error(
      `Mismatched parameter count: expected ${parameterIndex}, received ${valueCount}.`,
    );
  }

  return converted;
};

export const conn = {
  pool,
  query,
  execute: async <T = unknown>(
    text: string,
    params: unknown[] = [],
  ): Promise<{ rows: T[] }> => {
    const finalText = convertQuestionMarksToNumberedParameters(
      text,
      params.length,
    );

    const result = await query<T>(finalText, params);
    return { rows: result.rows };
  },
};
