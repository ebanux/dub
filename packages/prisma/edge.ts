import { PrismaClient } from "@prisma/client";
import { PrismaTiDBCloud } from "@tidbcloud/prisma-adapter";
import { PrismaPlanetScale } from "@prisma/adapter-planetscale";

const TiDBAdapter = () =>
  new PrismaTiDBCloud({ url: process.env.TIDB_DATABASE_URL, fullResult: true });

const PlanetScaleAdapter = () =>
  new PrismaPlanetScale({ url: process.env.PLANETSCALE_DATABASE_URL });

export const prismaEdge = new PrismaClient({
  adapter: process.env.TIDB_DATABASE_URL ? TiDBAdapter() : PlanetScaleAdapter(),
});
