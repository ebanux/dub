import { conn } from "./connection";
import { EdgeDomainProps } from "./types";

export const getDomainViaEdge = async (domain: string) => {
  const { rows } = await conn.execute<EdgeDomainProps>(
    'SELECT * FROM "Domain" WHERE "slug" = $1 LIMIT 1',
    [domain],
  );

  return rows && Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
};
