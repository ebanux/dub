import { ReferralsEmbedLinkSchema } from "@/lib/zod/schemas/referrals-embed";
import * as z from "zod";

export type ReferralsEmbedLink = z.infer<typeof ReferralsEmbedLinkSchema>;
