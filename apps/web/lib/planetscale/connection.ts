import { connect as PlanetScaleConnect } from "@planetscale/database";
import { connect as TiDBConnect } from "@tidbcloud/serverless";

export const conn = process.env.TIDB_DATABASE_URL
  ? TiDBConnect({ url: process.env.TIDB_DATABASE_URL, fullResult: true })
  : PlanetScaleConnect({ url: process.env.PLANETSCALE_DATABASE_URL });
