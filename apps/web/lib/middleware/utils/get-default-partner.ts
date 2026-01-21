import { UserProps } from "@/lib/types";
import { conn } from "@/lib/planetscale/connection";

export async function getDefaultPartnerId(user: UserProps) {
  let defaultPartnerId = user?.defaultPartnerId;

  if (!defaultPartnerId) {
    const { rows } = await conn.execute(
      `SELECT 
        U.defaultPartnerId,
        P.partnerId
      FROM User U
      LEFT JOIN PartnerUser P ON P.userId = U.id
      WHERE U.id = ?
      LIMIT 1`,
      [user.id],
    );

    const result = rows && rows.length > 0 ? (rows[0] as any) : null;

    defaultPartnerId =
      result?.defaultPartnerId || result?.partnerId || undefined;

    // Auto-linking logic removed for Edge compatibility (requires write access)
  }

  return defaultPartnerId;
}
