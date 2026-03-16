import { prisma } from "./db";

export type ContentType = "PvM" | "PvP" | "Mentoring" | "Roleplay" | "Custom";

export const CONTENT_SUBTYPES: Record<Exclude<ContentType, "Mentoring" | "Roleplay" | "Custom">, readonly string[]> = {
  PvM: ["Dungeons", "Pit Trials", "Treasure Maps", "Society Jobs", "Quests"],
  PvP: ["Factions", "Proving Grounds", "PK", "Anti-PK"]
} as const;

/** Roles for Mentoring groups (per-member). */
export const MENTORING_ROLES = ["Guide", "Student"] as const;

/** Tertiary options for PvM sub-types that have a third level. */
export const PVM_TERTIARY_OPTIONS: Record<string, readonly string[]> = {
  "Dungeons": ["Aegis Keep", "Cavernam", "Darkmire Temple", "Inferno", "Kraul Hive", "The Mausoleum", "Mount Petram", "Nusero", "Ossuary", "Pulma", "Shadowspire Cathedral", "Tidal Tomb", "Time"],
  "Pit Trials": ["3 Players", "5 Players"],
  "Treasure Maps": ["Levels 1-7", "Level 8 (Lore Boss)"]
} as const;

/** Tertiary options for PvP sub-types that have a third level. */
export const PVP_TERTIARY_OPTIONS: Record<string, readonly string[]> = {
  "Factions": ["Andaria", "Cambria", "Prevalia", "Terran"],
  "Proving Grounds": ["3 Players", "4 Players", "5 Players"]
} as const;

export const PVM_DESCRIPTION_REQUIRED_SUBTYPES = ["Society Jobs", "Quests"] as const;

export type GroupMember = {
  discordId: string;
  name: string;
  isCreator: boolean;
  role: string | null;
};

export type GroupApplicant = {
  discordId: string;
  name: string;
  role: string | null;
};

export type Group = {
  id: string;
  contentType: ContentType;
  contentSubType: string | null;
  contentTertiary: string | null;
  description: string;
  members: GroupMember[];
  applicants: GroupApplicant[];
  createdAt: string;
};

function toGroup(rows: {
  id: string;
  contentType: string;
  contentSubType: string | null;
  contentTertiary: string | null;
  description: string;
  createdAt: Date;
  members: { discordId: string; name: string; isCreator: boolean; role: string | null }[];
  applications: { discordId: string; name: string; role: string | null }[];
}): Group {
  return {
    id: rows.id,
    contentType: rows.contentType as ContentType,
    contentSubType: rows.contentSubType,
    contentTertiary: rows.contentTertiary ?? null,
    description: rows.description,
    createdAt: rows.createdAt.toISOString(),
    members: rows.members.map((m) => ({
      discordId: m.discordId,
      name: m.name,
      isCreator: m.isCreator,
      role: m.role ?? null
    })),
    applicants: rows.applications.map((a) => ({
      discordId: a.discordId,
      name: a.name,
      role: a.role ?? null
    }))
  };
}

export async function getGroups(): Promise<Group[]> {
  const list = await prisma.group.findMany({
    include: { members: true, applications: true },
    orderBy: { createdAt: "asc" }
  });
  return list.map(toGroup);
}

/** True if this user is already a member (or creator) of any group. */
export async function isUserInAnyGroup(discordId: string): Promise<boolean> {
  const count = await prisma.groupMember.count({
    where: { discordId }
  });
  return count > 0;
}

export async function createGroup(data: {
  contentType: ContentType;
  contentSubType: string | null;
  contentTertiary?: string | null;
  description: string;
  creatorDiscordId: string;
  creatorName: string;
  creatorRole?: string | null;
}): Promise<Group | "already_in_group"> {
  if (await isUserInAnyGroup(data.creatorDiscordId)) {
    return "already_in_group";
  }
  const [created] = await prisma.$transaction([
    prisma.group.create({
      data: {
        contentType: data.contentType,
        contentSubType: data.contentSubType,
        contentTertiary: data.contentTertiary ?? null,
        description: data.description,
        members: {
          create: [
            {
              discordId: data.creatorDiscordId,
              name: data.creatorName,
              isCreator: true,
              role: data.creatorRole ?? null
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

/** Maximum number of groups a user can apply to at once. */
const MAX_APPLICATIONS_PER_USER = 5;

export async function getUserApplicationsCount(discordId: string): Promise<number> {
  return prisma.groupApplication.count({
    where: { discordId }
  });
}

export async function applyToGroup(
  groupId: string,
  discordId: string,
  name: string,
  role?: string | null
): Promise<
  | Group
  | "not_found"
  | "already_member"
  | "already_in_group"
  | "already_applied"
  | "application_limit_reached"
> {
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
  if (group.members.some((m) => m.discordId === discordId)) return "already_member";
  if (group.applications.some((a) => a.discordId === discordId)) return "already_applied";

  await prisma.groupApplication.create({
    data: { groupId, discordId, name, role: role ?? null }
  });
  const updated = await prisma.group.findUnique({
    where: { id: groupId },
    include: { members: true, applications: true }
  });
  return updated ? toGroup(updated) : "not_found";
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
  return updated ? toGroup(updated) : "not_found";
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
  return updated ? toGroup(updated) : "not_found";
}
