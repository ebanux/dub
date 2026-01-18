import {
  ExecutedQuery,
  connect as PlanetScaleConnect,
} from "@planetscale/database";
import { FullResult, connect as TiDBConnect } from "@tidbcloud/serverless";

type ExecuteArgs = Record<string, any> | any[] | null;
type Row = Record<string, any>;

type ExecutedQueryResult<T = Row> = (FullResult | ExecutedQuery<T>) & {
  rows: T[];
};

interface ITiDBConnection {
  execute<T>(query: string, args?: ExecuteArgs): Promise<ExecutedQueryResult<T>>;
}

interface IPlanetScaleConnect {
  execute<T>(query: string, args?: ExecuteArgs): Promise<ExecutedQueryResult<T>>;
}

export const conn = process.env.TIDB_DATABASE_URL
  ? (TiDBConnect({
      url: process.env.TIDB_DATABASE_URL,
      fullResult: true,
    }) as ITiDBConnection)
  : (PlanetScaleConnect({
      url: process.env.PLANETSCALE_DATABASE_URL,
    }) as IPlanetScaleConnect);
