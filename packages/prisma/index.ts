import { PrismaClient } from "@prisma/client";

// function to append ssl to the url
const appendSSL = (url: string) => {
  if (url.includes("?ssl=") || url.includes("&ssl=")) {
    return url;
  }
  return `${url}?ssl={"rejectUnauthorized":true}`;
};

const databaseUrl =
  process.env.DATABASE_URL || process.env.TIDB_DATABASE_URL;

export const prisma =
  global.prisma ||
  new PrismaClient({
    datasourceUrl: databaseUrl ? appendSSL(databaseUrl) : undefined,
    omit: {
      user: { passwordHash: true },
    },
  });

declare global {
  var prisma:
    | PrismaClient<{ omit: { user: { passwordHash: true } } }>
    | undefined;
}

if (process.env.NODE_ENV === "development") global.prisma = prisma;

export const sanitizeFullTextSearch = (search: string) => {
  // remove unsupported characters for full text search
  return search.replace(/[*+\-()~@%<>!=?:]/g, "").trim();
};
