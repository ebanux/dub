import { conn } from "@/lib/planetscale/connection";
import { UserProps } from "@/lib/types";

export async function getDefaultWorkspace(user: UserProps) {
  let defaultWorkspace = user?.defaultWorkspace;

  if (!defaultWorkspace) {
    // If no default workspace, check if the user has any projects
    const { rows } = await conn.execute(
      `SELECT 
        U.defaultWorkspace,
        P.slug
      FROM User U
      LEFT JOIN ProjectUsers PU ON PU.userId = U.id
      LEFT JOIN Project P ON P.id = PU.projectId
      WHERE U.id = ?
      LIMIT 1`,
      [user.id],
    );

    const result = rows && rows.length > 0 ? (rows[0] as any) : null;

    defaultWorkspace =
      result?.defaultWorkspace || result?.slug || undefined;
  }

  return defaultWorkspace;
}
