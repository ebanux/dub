import { prisma } from "@dub/prisma";
import { DubApiError } from "../errors";

export const getBountyWithDetails = async ({
  bountyId,
  programId,
}: {
  bountyId: string;
  programId: string;
}) => {
  const bounties = (await prisma.$queryRaw`
    SELECT
      b."id",
      b."name",
      b."description",
      b."type",
      b."startsAt",
      b."endsAt",
      b."submissionsOpenAt",
      b."rewardAmount",
      b."rewardDescription",
      b."submissionRequirements",
      b."performanceScope",
      wf."triggerConditions",

      --  Bounty groups
      (
        SELECT COALESCE(
          json_agg(
            json_build_object('id', bg."groupId")
          ) FILTER (WHERE bg."groupId" IS NOT NULL),
          '[]'::json
        )
        FROM "BountyGroup" bg
        WHERE bg."bountyId" = b."id"
      ) AS "groups"

    FROM "Bounty" b
    LEFT JOIN "Workflow" wf ON wf."id" = b."workflowId"
    WHERE b."id" = ${bountyId} AND b."programId" = ${programId}
    LIMIT 1
  `) satisfies Array<any>;

  if (!bounties.length) {
    throw new DubApiError({
      code: "not_found",
      message: `Bounty ${bountyId} not found.`,
    });
  }

  const bounty = bounties[0];
  const performanceCondition =
    bounty.triggerConditions?.length > 0 ? bounty.triggerConditions[0] : null;
  const performanceScope = bounty.performanceScope;

  const groups = (Array.isArray(bounty.groups)
    ? bounty.groups
    : typeof bounty.groups === "string"
      ? (() => {
          try {
            const parsed = JSON.parse(bounty.groups);
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        })()
      : []) as Array<{ id: string }>;

  return {
    id: bounty.id,
    name: bounty.name,
    description: bounty.description,
    type: bounty.type,
    startsAt: bounty.startsAt,
    endsAt: bounty.endsAt,
    submissionsOpenAt: bounty.submissionsOpenAt,
    rewardAmount: bounty.rewardAmount,
    rewardDescription: bounty.rewardDescription,
    submissionRequirements: bounty.submissionRequirements,
    performanceScope,
    performanceCondition,
    groups,
  };
};
