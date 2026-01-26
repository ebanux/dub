import { UserProps } from "@/lib/types";
import { conn } from "@/lib/planetscale/connection";
import { NextRequest } from "next/server";

export async function hasPendingInvites({
  req,
  user,
}: {
  req: NextRequest;
  user: UserProps;
}) {
  if (
    req.nextUrl.searchParams.get("invite") ||
    req.nextUrl.pathname.startsWith("/invites/")
  ) {
    return true;
  }

  if (!user.email) return false;

  const { rows } = await conn.execute(
    `SELECT count(*) as count FROM ProjectInvite WHERE email = ? AND expires >= NOW()`,
    [user.email],
  );

  const pendingInvites = rows && rows.length > 0 ? (rows[0] as any).count : 0;

  return pendingInvites > 0;
}
