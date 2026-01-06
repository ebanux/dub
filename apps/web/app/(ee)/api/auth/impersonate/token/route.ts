import { createId } from "@/lib/api/create-id.ts";
import { hashToken, isDubAdmin, withWorkspace } from "@/lib/auth";
import { prisma } from "@dub/prisma";
import { nanoid } from "@dub/utils";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const findOrCreateWorkspace = async (slug: string, userId: string) => {
  const workspace = await prisma.project.findUnique({
    where: { slug: slug },
    select: { id: true },
  });

  if (workspace) return workspace;

  return await prisma.project.create({
    data: {
      name: slug,
      slug: slug,
      plan: "advanced",
      users: { create: { userId, role: "owner" } },
      billingCycleStart: new Date().getDate(),
    },
  });
};

const findOrCreateUser = async (email: string, workspace: string) => {
  const user = await prisma.user.findFirst({
    where: { email },
    select: { id: true, email: true },
  });

  if (user) return user;

  return await prisma.user.create({
    data: {
      id: createId({ prefix: "user_" }),
      email: email,
      name: email.split("@")[0],
      defaultWorkspace: workspace,
      emailVerified: new Date(),
    },
  });
};

// POST /api/auth/impersonate/token - Get impersonate auth token
export const POST = withWorkspace(async ({ req, session }) => {
  const { email, slug } = await req.json();

  if (!session?.user) {
    return new Response("Unauthorized: Login required.", { status: 401 });
  }

  const isAdminUser = await isDubAdmin(session.user.id);
  if (!isAdminUser) {
    return new Response("Unauthorized: Not an admin.", { status: 401 });
  }

  const user = await findOrCreateUser(email, slug);

  await findOrCreateWorkspace(slug, user.id);

  const token = nanoid(24);
  const hashedKey = await hashToken(token); // take first 3 and last 4 characters of the key
  const partialKey = `${token.slice(0, 3)}...${token.slice(-4)}`;
  await prisma.token.create({
    data: {
      name: "E2E QRLynk Key",
      hashedKey,
      partialKey,
      userId: user.id,
    },
  });

  const data = { token };

  return NextResponse.json(data);
});
