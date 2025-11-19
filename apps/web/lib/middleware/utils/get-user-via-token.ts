import {
  COGNITO_JWT_COOKIE_NAME,
  COGNITO_JWT_HEADER_NAME,
  getCognitoSessionFromToken,
} from "@/lib/auth/cognito";
import { UserProps } from "@/lib/types";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

export async function getUserViaToken(req: NextRequest) {
  const session = (await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  })) as {
    email?: string;
    user?: UserProps;
  };

  if (session?.user) {
    return session.user as UserProps;
  }

  const cognitoToken =
    req.headers.get(COGNITO_JWT_HEADER_NAME) ||
    req.cookies.get(COGNITO_JWT_COOKIE_NAME)?.value;

  if (!cognitoToken) {
    return null;
  }

  const cognitoSession = await getCognitoSessionFromToken(cognitoToken);
  return cognitoSession?.user ?? null;
}
