import { prisma } from "./db";
import type { CategoryLevel1, Group, GroupMember, GroupApplicant } from "./groups-shared";
import {
  MENTORING_ROLES,
  PVM_APPLICANT_ROLES,
  CONTENT_SUBTYPES,
  PVM_TERTIARY_OPTIONS,
  PVP_TERTIARY_OPTIONS,
  PVM_DESCRIPTION_REQUIRED_SUBTYPES,
  QUEST_SUBTYPES,
  isValidRedlinePointsValue,
  isValidChainLinkSlotsValue
} from "./groups-shared";

export type { CategoryLevel1, Group, GroupMember, GroupApplicant };
export {
  CONTENT_SUBTYPES,
  MENTORING_ROLES,
  PVM_APPLICANT_ROLES,
  PVM_TERTIARY_OPTIONS,
  PVP_TERTIARY_OPTIONS,
  PVM_DESCRIPTION_REQUIRED_SUBTYPES,
  QUEST_SUBTYPES
};

type GroupRow = {
  id: string;
  categoryLevel1: string;
  categoryLevel2: string | null;
  categoryLevel3: string | null;
  description: string;
  available: boolean;
  requireRoleSelection?: boolean;
  requireRedlinePoints?: boolean;
  requireChainLinks?: boolean;
  voiceChannelListen?: boolean;
  voiceChannelSpeak?: boolean;
  createdAt: Date;
  expiresAt: Date;
  members: {
    discordId: string;
    name: string;
    isCreator: boolean;
    role: string | null;
    redlinePoints: number | null;
    chainLinkSlots: number | null;
  }[];
  applications: {
    discordId: string;
    name: string;
    role: string | null;
    redlinePoints: number | null;
    chainLinkSlots: number | null;
  }[];
};

function toGroup(rows: GroupRow): Group {
  return {
    id: rows.id,
    categoryLevel1: rows.categoryLevel1 as CategoryLevel1,
    categoryLevel2: rows.categoryLevel2,
    categoryLevel3: rows.categoryLevel3 ?? null,
    description: rows.description,
    available: rows.available,
    requireRoleSelection: Boolean(rows.requireRoleSelection),
    requireRedlinePoints: Boolean(rows.requireRedlinePoints),
    requireChainLinks: Boolean(rows.requireChainLinks),
    voiceChannelListen: Boolean(rows.voiceChannelListen),
    voiceChannelSpeak: Boolean(rows.voiceChannelSpeak),
    createdAt: rows.createdAt.toISOString(),
    expiresAt: rows.expiresAt.toISOString(),
    members: rows.members.map((m) => ({
      discordId: m.discordId,
      name: m.name,
      isCreator: m.isCreator,
      role: m.role ?? null,
      redlinePoints: m.redlinePoints ?? null,
      chainLinkSlots: m.chainLinkSlots ?? null
    })),
    applicants: rows.applications.map((a) => ({
      discordId: a.discordId,
      name: a.name,
      role: a.role ?? null,
      redlinePoints: a.redlinePoints ?? null,
      chainLinkSlots: a.chainLinkSlots ?? null
    }))
  };
}

const nowOrLater = () => new Date();

/** Deletes expired groups and cascaded members/applications. Called from hot paths so the DB does not keep stale rows; optional cron is extra safety for idle deployments. */
export async function cleanupExpiredGroups(): Promise<number> {
  const result = await prisma.group.deleteMany({
    where: { expiresAt: { lt: nowOrLater() } }
  });
  return result.count;
}

export async function getGroups(): Promise<Group[]> {
  await cleanupExpiredGroups();
  const list = await prisma.group.findMany({
    where: { expiresAt: { gte: nowOrLater() } },
    include: { members: true, applications: true },
    orderBy: { createdAt: "asc" }
  });
  return list.map((g) => toGroup(g));
}

/** Serialized group for API responses. */
export async function getGroupForResponse(groupId: string): Promise<Group | null> {
  const row = await prisma.group.findFirst({
    where: { id: groupId, expiresAt: { gte: nowOrLater() } },
    include: { members: true, applications: true }
  });
  if (!row) return null;
  return toGroup(row);
}

const GROUP_LIFETIME_MS = 60 * 60 * 1000;

/** Canonical expiry timestamp used by all group-lifetime refresh paths. */
export function nextGroupExpiry(): Date {
  return new Date(Date.now() + GROUP_LIFETIME_MS);
}

/** Reset a group's lifetime regardless of actor (authorization handled by caller). */
export async function resetGroupLifetime(groupId: string): Promise<void> {
  await prisma.group.update({
    where: { id: groupId },
    data: { expiresAt: nextGroupExpiry() }
  });
}

/** Membership on expired groups does not count (expired rows are removed on list/create/apply and by optional cron). */
export async function isUserInAnyGroup(discordId: string): Promise<boolean> {
  const count = await prisma.groupMember.count({
    where: {
      discordId,
      group: { expiresAt: { gte: nowOrLater() } }
    }
  });
  return count > 0;
}

export async function createGroup(data: {
  categoryLevel1: CategoryLevel1;
  categoryLevel2: string | null;
  categoryLevel3?: string | null;
  description: string;
  creatorDiscordId: string;
  creatorName: string;
  creatorRole?: string | null;
  creatorRedlinePoints?: number | null;
  creatorChainLinkSlots?: number | null;
  requireRoleSelection?: boolean;
  requireRedlinePoints?: boolean;
  requireChainLinks?: boolean;
  voiceChannelListen?: boolean;
  voiceChannelSpeak?: boolean;
}): Promise<Group | "already_in_group"> {
  await cleanupExpiredGroups();
  if (await isUserInAnyGroup(data.creatorDiscordId)) {
    return "already_in_group";
  }

  const requireRoleSelection =
    (data.categoryLevel1 === "Mentoring" || data.categoryLevel1 === "PvM") &&
    Boolean(data.requireRoleSelection);
  const requireRedlinePoints =
    data.categoryLevel1 === "PvM" && Boolean(data.requireRedlinePoints);
  const requireChainLinks =
    data.categoryLevel1 === "PvM" && Boolean(data.requireChainLinks);

  const voiceChannelListen = Boolean(data.voiceChannelListen);
  const voiceChannelSpeak =
    voiceChannelListen && Boolean(data.voiceChannelSpeak);

  const creatorRedline =
    requireRedlinePoints && data.creatorRedlinePoints != null
      ? data.creatorRedlinePoints
      : null;
  const creatorChain =
    requireChainLinks && data.creatorChainLinkSlots != null
      ? data.creatorChainLinkSlots
      : null;

  if (requireRedlinePoints) {
    if (creatorRedline == null || !isValidRedlinePointsValue(creatorRedline)) {
      throw new Error("createGroup: invalid creator redline points");
    }
  }
  if (requireChainLinks) {
    const capRedline = requireRedlinePoints ? creatorRedline : null;
    if (
      creatorChain == null ||
      !isValidChainLinkSlotsValue(creatorChain, capRedline)
    ) {
      throw new Error("createGroup: invalid creator chain link slots");
    }
  }

  const [created] = await prisma.$transaction([
    prisma.group.create({
      data: {
        categoryLevel1: data.categoryLevel1,
        categoryLevel2: data.categoryLevel2,
        categoryLevel3: data.categoryLevel3 ?? null,
        description: data.description,
        requireRoleSelection,
        requireRedlinePoints,
        requireChainLinks,
        voiceChannelListen,
        voiceChannelSpeak,
        expiresAt: nextGroupExpiry(),
        members: {
          create: [
            {
              discordId: data.creatorDiscordId,
              name: data.creatorName,
              isCreator: true,
              role: data.creatorRole ?? null,
              redlinePoints: creatorRedline,
              chainLinkSlots: creatorChain
            }
          ]
        }
      },
      include: { members: true, applications: true }
    }),
    prisma.groupApplication.deleteMany({
      where: { discordId: data.creatorDiscordId }
    })
  ]);
  return toGroup(created);
}

export async function deleteGroup(
  groupId: string,
  byDiscordId: string
): Promise<"ok" | "not_found" | "forbidden"> {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { members: true }
  });
  if (!group) return "not_found";
  const creator = group.members.find((m) => m.isCreator);
  if (!creator || creator.discordId !== byDiscordId) return "forbidden";
  await prisma.group.delete({ where: { id: groupId } });
  return "ok";
}

const MAX_APPLICATIONS_PER_USER = 5;

/** Applications to expired groups do not count toward the per-user cap. */
export async function getUserApplicationsCount(discordId: string): Promise<number> {
  return prisma.groupApplication.count({
    where: {
      discordId,
      group: { expiresAt: { gte: nowOrLater() } }
    }
  });
}

export type ApplyToGroupInput = {
  role?: string | null;
  redlinePoints?: number | null;
  chainLinkSlots?: number | null;
};

export async function applyToGroup(
  groupId: string,
  discordId: string,
  name: string,
  input?: ApplyToGroupInput
): Promise<
  | Group
  | "not_found"
  | "already_member"
  | "already_in_group"
  | "already_applied"
  | "application_limit_reached"
  | "applicant_role_required"
  | "applicant_redline_required"
  | "applicant_chain_links_required"
  | "applicant_chain_links_invalid"
> {
  await cleanupExpiredGroups();
  if (await isUserInAnyGroup(discordId)) {
    return "already_in_group";
  }

  const existingCount = await getUserApplicationsCount(discordId);
  if (existingCount >= MAX_APPLICATIONS_PER_USER) {
    return "application_limit_reached";
  }

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { members: true, applications: true }
  });
  if (!group) return "not_found";
  if (group.expiresAt < new Date()) return "not_found";
  if (!group.available) return "not_found";
  if (group.members.some((m) => m.discordId === discordId)) return "already_member";
  if (group.applications.some((a) => a.discordId === discordId)) return "already_applied";

  const role = input?.role ?? null;
  const redlinePoints = input?.redlinePoints;
  const chainLinkSlots = input?.chainLinkSlots;

  let applicationRole: string | null = null;
  let applicationRedline: number | null = null;
  let applicationChain: number | null = null;

  if (group.categoryLevel1 === "Mentoring") {
    const needRole = Boolean(group.requireRoleSelection);
    if (needRole) {
      if (
        !role ||
        !(MENTORING_ROLES as readonly string[]).includes(role)
      ) {
        return "applicant_role_required";
      }
      applicationRole = role;
    }
  } else if (group.categoryLevel1 === "PvM") {
    const needRole = Boolean(group.requireRoleSelection);
    if (needRole) {
      if (!role || !(PVM_APPLICANT_ROLES as readonly string[]).includes(role)) {
        return "applicant_role_required";
      }
      applicationRole = role;
    }

    const needRedline = Boolean(group.requireRedlinePoints);
    const needChain = Boolean(group.requireChainLinks);
    if (needRedline) {
      if (
        redlinePoints === undefined ||
        redlinePoints === null ||
        !isValidRedlinePointsValue(redlinePoints)
      ) {
        return "applicant_redline_required";
      }
      applicationRedline = redlinePoints;
    }
    if (needChain) {
      if (chainLinkSlots === undefined || chainLinkSlots === null) {
        return "applicant_chain_links_required";
      }
      if (!isValidChainLinkSlotsValue(chainLinkSlots, needRedline ? applicationRedline : null)) {
        return "applicant_chain_links_invalid";
      }
      applicationChain = chainLinkSlots;
    }
  }

  await prisma.groupApplication.create({
    data: {
      groupId,
      discordId,
      name,
      role: applicationRole,
      redlinePoints: applicationRedline,
      chainLinkSlots: applicationChain
    }
  });
  const updated = await prisma.group.findUnique({
    where: { id: groupId },
    include: { members: true, applications: true }
  });
  if (!updated) return "not_found";
  return toGroup(updated);
}

export async function withdrawApplication(
  groupId: string,
  discordId: string
): Promise<Group | "not_found" | "no_application"> {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { members: true, applications: true }
  });
  if (!group) return "not_found";

  const existing = group.applications.find((a) => a.discordId === discordId);
  if (!existing) {
    return "no_application";
  }

  await prisma.groupApplication.deleteMany({
    where: { groupId, discordId }
  });

  const updated = await prisma.group.findUnique({
    where: { id: groupId },
    include: { members: true, applications: true }
  });
  if (!updated) return "not_found";
  return toGroup(updated);
}

export async function leaveGroup(
  groupId: string,
  discordId: string
): Promise<Group | "not_found" | "not_member" | "creator_cannot_leave"> {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { members: true, applications: true }
  });
  if (!group) return "not_found";
  const member = group.members.find((m) => m.discordId === discordId);
  if (!member) return "not_member";
  if (member.isCreator) return "creator_cannot_leave";
  await prisma.groupMember.deleteMany({
    where: { groupId, discordId }
  });
  const updated = await prisma.group.findUnique({
    where: { id: groupId },
    include: { members: true, applications: true }
  });
  if (!updated) return "not_found";
  return toGroup(updated);
}

export async function setGroupAvailability(
  groupId: string,
  byDiscordId: string,
  available: boolean
): Promise<"ok" | "not_found" | "forbidden"> {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { members: true }
  });
  if (!group) return "not_found";

  const creator = group.members.find((m) => m.isCreator);
  if (!creator || creator.discordId !== byDiscordId) return "forbidden";

  if (available) {
    await prisma.group.update({
      where: { id: groupId },
      data: {
        available,
        expiresAt: nextGroupExpiry()
      }
    });
  } else {
    await prisma.$transaction([
      prisma.group.update({
        where: { id: groupId },
        data: {
          available,
          expiresAt: nextGroupExpiry()
        }
      }),
      prisma.groupApplication.deleteMany({
        where: { groupId }
      })
    ]);
  }

  return "ok";
}

/**
 * Resets the group's expiry to now + {@link GROUP_LIFETIME_MS} if `discordId` is the active group's leader.
 * Used when the leader performs actions that should refresh the deletion timer (e.g. group chat).
 */
export async function resetGroupLifetimeIfLeader(
  groupId: string,
  discordId: string
): Promise<boolean> {
  const member = await prisma.groupMember.findFirst({
    where: {
      groupId,
      discordId,
      isCreator: true,
      group: { expiresAt: { gte: nowOrLater() } }
    },
    select: { id: true }
  });
  if (!member) return false;

  await resetGroupLifetime(groupId);
  return true;
}
