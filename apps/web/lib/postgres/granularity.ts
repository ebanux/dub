import { DateTime } from "luxon";

export const sqlGranularityMap: Record<
  string,
  {
    dateFormat: string;
    dateTrunc: string;
    dateIncrement: (dt: DateTime) => DateTime;
    startFunction: (dt: DateTime) => DateTime;
    formatString: string;
  }
> = {
  month: {
    dateFormat: "YYYY-MM",
    dateTrunc: "month",
    dateIncrement: (dt) => dt.plus({ month: 1 }),
    startFunction: (dt) => dt.startOf("month"),
    formatString: "yyyy-MM",
  },
  day: {
    dateFormat: "YYYY-MM-DD",
    dateTrunc: "day",
    dateIncrement: (dt) => dt.plus({ day: 1 }),
    startFunction: (dt) => dt.startOf("day"),
    formatString: "yyyy-MM-dd",
  },
  hour: {
    dateFormat: "YYYY-MM-DD HH24:00",
    dateTrunc: "hour",
    dateIncrement: (dt) => dt.plus({ hour: 1 }),
    startFunction: (dt) => dt.startOf("hour"),
    formatString: "yyyy-MM-dd HH:00",
  },
  minute: {
    dateFormat: "YYYY-MM-DD HH24:MI",
    dateTrunc: "minute",
    dateIncrement: (dt) => dt.plus({ minute: 1 }),
    startFunction: (dt) => dt.startOf("minute"),
    formatString: "yyyy-MM-dd HH:mm",
  },
} as const;
