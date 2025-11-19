import { createId } from "@/lib/api/create-id";
import { generateRandomString } from "@/lib/api/utils/generate-random-string";
import { createWorkspaceId } from "@/lib/api/workspaces/create-workspace-id";
import { UserProps } from "@/lib/types";
import { prisma } from "@dub/prisma";
import { Prisma } from "@dub/prisma/client";
import { nanoid } from "@dub/utils";
import slugify from "@sindresorhus/slugify";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import type { CognitoIdOrAccessTokenPayload } from "aws-jwt-verify/jwt-model";
import type { Session } from "./session-types";

const COGNITO_ENV = {
  userPoolId: process.env.COGNITO_USER_POOL_ID,
  clientId: process.env.COGNITO_APP_CLIENT_ID,
};

const userSelect = {
  id: true,
  name: true,
  email: true,
  image: true,
  createdAt: true,
  source: true,
  defaultWorkspace: true,
  defaultPartnerId: true,
  isMachine: true,
  passwordHash: true,
} as const;

type SessionUser = Prisma.UserGetPayload<{
  select: typeof userSelect;
}>;

const COGNITO_VERIFIER =
  COGNITO_ENV.userPoolId && COGNITO_ENV.clientId
    ? CognitoJwtVerifier.create({
        userPoolId: COGNITO_ENV.userPoolId,
        clientId: COGNITO_ENV.clientId,
        tokenUse: null,
      })
    : null;

export const COGNITO_JWT_HEADER_NAME = "x-cognito-jwt";
export const COGNITO_JWT_COOKIE_NAME = "dub_cognito_jwt";

type CognitoPayload = CognitoIdOrAccessTokenPayload<
  { tokenUse: null },
  { tokenUse: null }
> &
  Record<string, unknown>;

export async function getCognitoSessionFromToken(token: string) {
  if (!COGNITO_VERIFIER) {
    return null;
  }

  const trimmedToken = sanitizeToken(token);

  if (!trimmedToken) {
    return null;
  }

  try {
    const payload = await COGNITO_VERIFIER.verify(trimmedToken);
    const user = await findOrCreateCognitoUser(payload);

    let hydratedUser = user;

    if (!user.defaultWorkspace) {
      await ensureWorkspaceForUser(user, payload);
      hydratedUser = (await prisma.user.findUnique({
        where: { id: user.id },
        select: userSelect,
      })) as SessionUser;
    }

    return {
      session: mapSession(hydratedUser),
      user: mapUser(hydratedUser),
      payload,
    };
  } catch (error) {
    console.error("Failed to validate Cognito token", error);
    return null;
  }
}

async function findOrCreateCognitoUser(payload: CognitoPayload) {
  const email = payload.email?.toString().toLowerCase();

  if (!email) {
    throw new Error("Cognito token is missing the email claim.");
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: userSelect,
  });

  if (existingUser) {
    return existingUser;
  }

  await prisma.user.create({
    data: {
      id: createId({ prefix: "user_" }),
      email,
      name: deriveName(payload, email),
      source: "cognito",
    },
  });

  return (await prisma.user.findUnique({
    where: { email },
    select: userSelect,
  })) as SessionUser;
}

function deriveName(payload: CognitoPayload, fallbackEmail: string) {
  if (payload.name) {
    return payload.name.toString();
  }

  const given = payload.given_name?.toString() ?? "";
  const family = payload.family_name?.toString() ?? "";
  const combined = `${given} ${family}`.trim();

  if (combined) {
    return combined;
  }

  return fallbackEmail.split("@")[0] || fallbackEmail;
}

async function ensureWorkspaceForUser(
  user: SessionUser,
  payload: CognitoPayload,
) {
  const existingWorkspace = await prisma.project.findFirst({
    where: {
      users: {
        some: {
          userId: user.id,
        },
      },
    },
    select: {
      slug: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (existingWorkspace) {
    if (!user.defaultWorkspace) {
      await prisma.user.update({
        where: { id: user.id },
        data: { defaultWorkspace: existingWorkspace.slug },
      });
    }
    return existingWorkspace.slug;
  }

  const workspaceId = createWorkspaceId();
  const workspaceName =
    (payload["custom:workspace_name"] as string | undefined) ||
    `${user.name || user.email?.split("@")[0] || "workspace"}'s workspace`;
  const workspaceSlug = await generateWorkspaceSlug(
    payload["custom:workspace_slug"] as string | undefined,
    user.email ?? undefined,
  );

  await prisma.project.create({
    data: {
      id: workspaceId,
      name: workspaceName,
      slug: workspaceSlug,
      billingCycleStart: new Date().getDate(),
      invoicePrefix: generateRandomString(8),
      inviteCode: nanoid(24),
      defaultDomains: {
        create: {},
      },
      users: {
        create: {
          userId: user.id,
          role: "owner",
          notificationPreference: {
            create: {},
          },
        },
      },
    },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { defaultWorkspace: workspaceSlug },
  });

  return workspaceSlug;
}

async function generateWorkspaceSlug(
  providedSlug?: string,
  email?: string,
) {
  const base =
    providedSlug ||
    slugify(email?.split("@")[0] || nanoid(6), { separator: "-" }) ||
    `workspace-${nanoid(6)}`;

  let candidate = base;
  let suffix = 1;

  while (
    await prisma.project.findUnique({
      where: { slug: candidate },
      select: { id: true },
    })
  ) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

function mapSession(user: SessionUser): Session {
  return {
    user: {
      id: user.id,
      name: user.name || "",
      email: user.email || "",
      image: user.image || undefined,
      isMachine: user.isMachine,
      defaultWorkspace: user.defaultWorkspace || undefined,
      defaultPartnerId: user.defaultPartnerId || undefined,
    },
  };
}

function mapUser(user: SessionUser): UserProps {
  return {
    id: user.id,
    name: user.name || "",
    email: user.email || "",
    image: user.image || undefined,
    createdAt: user.createdAt,
    source: user.source,
    defaultWorkspace: user.defaultWorkspace || undefined,
    defaultPartnerId: user.defaultPartnerId || undefined,
    isMachine: user.isMachine,
    hasPassword: Boolean(user.passwordHash),
    provider: "cognito",
  };
}

function sanitizeToken(token: string) {
  return token.replace(/^[Bb]earer\s+/i, "").trim();
}
