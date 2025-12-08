import { prisma } from "@dub/prisma";
import CredentialsProvider from "next-auth/providers/credentials";
import { createId } from "../api/create-id.ts";
import { qrAppBaseUrl } from "./constants.ts";

export interface User {
  id: string;
  email: string;
  name?: string;
}

async function getUserInfo(token: string): Promise<User> {
  const response = await fetch(`${qrAppBaseUrl}/api/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await response.json();

  return data.result;
}

export const QRLynkAuthProvider = () =>
  CredentialsProvider({
    id: "qrlynk-auth",
    name: "QRLynk Authentication",
    credentials: {
      token: {},
    },
    async authorize(opt) {
      try {
        if (!opt?.token) return null;

        const userInfo = await getUserInfo(opt.token);

        if (!userInfo) return null;

        let existingUser = await prisma.user.findUnique({
          where: { email: userInfo.email },
        });

        // User is authorized but doesn't have a Dub account, create one for them
        if (!existingUser) {
          existingUser = await prisma.user.create({
            data: {
              id: createId({ prefix: "user_" }),
              email: userInfo.email,
              name: userInfo.email,
            },
          });
        }

        const { id, name, email, image } = existingUser;

        return {
          id,
          email,
          name,
          email_verified: true,
          image,
          // adding profile here so we can access it in signIn callback
          profile: userInfo,
        };
      } catch (error) {
        console.error("Authentication error:", error);
        return null;
      }
    },
  });
