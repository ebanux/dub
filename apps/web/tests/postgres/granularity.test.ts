import { sqlGranularityMap } from "@/lib/postgres/granularity";
import { DateTime } from "luxon";
import { describe, expect, it } from "vitest";

const granularities = ["month", "day", "hour", "minute"] as const;
const timezones = ["UTC", "America/New_York", "Asia/Tokyo"] as const;

describe("sqlGranularityMap", () => {
  timezones.forEach((zone) => {
    granularities.forEach((granularity) => {
      const { startFunction, dateIncrement, formatString } =
        sqlGranularityMap[granularity];

      it(`yields ordered buckets for ${granularity} granularity in ${zone}`, () => {
        let current = startFunction(
          DateTime.fromISO("2024-03-14T18:27:00", { zone }),
        );

        const buckets: string[] = [];

        for (let i = 0; i < 6; i++) {
          buckets.push(current.toFormat(formatString));
          current = dateIncrement(current);
        }

        const parsed = buckets.map((bucket) =>
          DateTime.fromFormat(bucket, formatString, { zone }),
        );

        for (let i = 1; i < parsed.length; i++) {
          expect(parsed[i].toMillis()).toBeGreaterThan(parsed[i - 1].toMillis());
        }
      });
    });
  });
});
