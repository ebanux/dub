import { conn } from "./connection";

export const checkIfUserExists = async (userId: string) => {
  const { rows } = await conn.execute<{ exists: number }>(
    'SELECT 1 as exists FROM "User" WHERE "id" = $1 LIMIT 1',
    [userId],
  );

  return rows && Array.isArray(rows) && rows.length > 0;
};
