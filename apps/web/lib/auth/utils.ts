import { getServerSession } from "next-auth/next";
import { cookies, headers } from "next/headers";
import { NextRequest } from "next/server";
import { DubApiError } from "../api/errors";
import {
  COGNITO_JWT_COOKIE_NAME,
  COGNITO_JWT_HEADER_NAME,
  getCognitoSessionFromToken,
} from "./cognito";
import { authOptions } from "./options";
import type { Session } from "./session-types";
export type { Session } from "./session-types";

export const getSession = async () => {
  const nextAuthSession = (await getServerSession(authOptions)) as
    | Session
    | null;

  if (nextAuthSession?.user?.id) {
    return nextAuthSession;
  }

  try {
    const headerStore = headers();
    const cookieStore = cookies();
    const token =
      headerStore.get(COGNITO_JWT_HEADER_NAME) ||
      cookieStore.get(COGNITO_JWT_COOKIE_NAME)?.value;

    if (!token) {
      return nextAuthSession as Session;
    }

    const cognitoSession = await getCognitoSessionFromToken(token);
    if (cognitoSession) {
      return cognitoSession.session;
    }
  } catch (error) {
    console.error("Cognito session fallback failed", error);
  }

  return nextAuthSession as Session;
};

export const getAuthTokenOrThrow = (
  req: Request | NextRequest,
  type: "Bearer" | "Basic" = "Bearer",
) => {
  const authorizationHeader = req.headers.get("Authorization");

  if (!authorizationHeader) {
    throw new DubApiError({
      code: "bad_request",
      message:
        "Misconfigured authorization header. Did you forget to add 'Bearer '? Learn more: https://d.to/auth",
    });
  }

  return authorizationHeader.replace(`${type} `, "");
};

export function generateOTP() {
  // Generate a random number between 0 and 999999
  const randomNumber = Math.floor(Math.random() * 1000000);

  // Pad the number with leading zeros if necessary to ensure it is always 6 digits
  return randomNumber.toString().padStart(6, "0");
}
