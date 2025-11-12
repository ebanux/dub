import { conn } from "./connection";
import { EdgeLinkProps } from "./types";

export const getShortLinkViaEdge = async (shortLink: string) => {
  const { rows } = await conn.execute<EdgeLinkProps>(
    'SELECT * FROM "Link" WHERE "shortLink" = $1 LIMIT 1',
    [shortLink],
  );

  return rows && Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
};
