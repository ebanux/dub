import { PrismaClient } from "@prisma/client";

// function to append ssl to the url
const appendSSL = (url: string) => {
  if (url.includes("ssl=")) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}ssl={"rejectUnauthorized":true}`;
};

const databaseUrl =
  process.env.DATABASE_URL || process.env.TIDB_DATABASE_URL;

// Ensure that we are using the correct database URL
if (databaseUrl) {
  const secureUrl = appendSSL(databaseUrl);
  // Explicitly override env vars to ensure consistency
  if (process.env.DATABASE_URL) process.env.DATABASE_URL = secureUrl;
  if (process.env.TIDB_DATABASE_URL) process.env.TIDB_DATABASE_URL = secureUrl;
}

if (process.env.NODE_ENV === "production" && !global.prisma) {
  if (!databaseUrl) {
    console.warn("WARNING: No DATABASE_URL or TIDB_DATABASE_URL found!");
  }
}

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
