import {
  COGNITO_JWT_COOKIE_NAME,
  COGNITO_JWT_HEADER_NAME,
  getCognitoSessionFromToken,
} from "@/lib/auth/cognito";
import { NextRequest, NextResponse } from "next/server";

const isProd = process.env.NODE_ENV === "production";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const redirect = req.nextUrl.searchParams.get("redirect") || "/";

  if (!token) {
    return NextResponse.json(
      { error: "Missing Cognito token." },
      { status: 400 },
    );
  }

  const session = await getCognitoSessionFromToken(token);

  if (!session) {
    return NextResponse.json({ error: "Invalid Cognito token." }, { status: 401 });
  }

  const response = NextResponse.redirect(new URL(redirect, req.url));
  attachCognitoCookie(response, token, session.payload.exp);
  return response;
}

export async function POST(req: NextRequest) {
  const body = await parseBody(req);
  const token =
    body?.token ||
    req.headers.get(COGNITO_JWT_HEADER_NAME) ||
    req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json(
      { error: "Missing Cognito token." },
      { status: 400 },
    );
  }

  const session = await getCognitoSessionFromToken(token);

  if (!session) {
    return NextResponse.json({ error: "Invalid Cognito token." }, { status: 401 });
  }

  const response = NextResponse.json({
    ok: true,
    user: session.user,
    session: session.session,
  });

  attachCognitoCookie(response, token, session.payload.exp);
  return response;
}

function attachCognitoCookie(
  res: NextResponse,
  token: string,
  exp?: number,
) {
  res.cookies.set({
    name: COGNITO_JWT_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/",
    ...(exp && { expires: new Date(exp * 1000) }),
  });
}

async function parseBody(req: NextRequest) {
  try {
    return await req.json();
  } catch {
    return null;
  }
}
