import { DUB_WORKSPACE_ID } from "@dub/utils";
import { NextRequest, NextResponse } from "next/server";
import { getUserViaToken } from "./utils/get-user-via-token";
import { parse } from "./utils/parse";
import { conn } from "@/lib/planetscale/connection";

export async function AdminMiddleware(req: NextRequest) {
  const { path } = parse(req);

  const user = await getUserViaToken(req);

  if (!user && path !== "/login") {
    return NextResponse.redirect(new URL("/login", req.url));
  } else if (user) {
    const { rows } = await conn.execute(
      `SELECT id FROM ProjectUsers WHERE userId = ? AND projectId = ? LIMIT 1`,
      [user.id, DUB_WORKSPACE_ID],
    );

    const isAdminUser = rows && rows.length > 0;

    if (!isAdminUser) {
      return NextResponse.next(); // throw 404 page
    } else if (path === "/login") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.rewrite(
    new URL(`/admin.dub.co${path === "/" ? "" : path}`, req.url),
  );
}
