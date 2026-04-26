import { prisma } from "./db";
import { resetGroupLifetimeIfLeader } from "./groups-db";
import { broadcastGroupsUpdated } from "./groups-broadcast";
import {
  GROUP_CHAT_FETCH_LIMIT,
  MAX_GROUP_CHAT_BODY_LENGTH,
  type GroupChatMessageDto
} from "./group-chat-shared";

export type { GroupChatMessageDto };
export { MAX_GROUP_CHAT_BODY_LENGTH, GROUP_CHAT_FETCH_LIMIT };

const activeGroupWhere = { expiresAt: { gte: new Date() } };

function toDto(row: {
  id: string;
  groupId: string;
  discordId: string;
  authorName: string;
  body: string;
  createdAt: Date;
}): GroupChatMessageDto {
  return {
    id: row.id,
    groupId: row.groupId,
    discordId: row.discordId,
    authorName: row.authorName,
    body: row.body,
    createdAt: row.createdAt.toISOString()
  };
}

export async function isUserMemberOfActiveGroup(
  groupId: string,
  discordId: string
): Promise<boolean> {
  const row = await prisma.groupMember.findFirst({
    where: {
      groupId,
      discordId,
      group: activeGroupWhere
    },
    select: { id: true }
  });
  return row != null;
}

export async function listGroupChatMessages(
  groupId: string,
  discordId: string
): Promise<GroupChatMessageDto[] | "forbidden"> {
  const ok = await isUserMemberOfActiveGroup(groupId, discordId);
  if (!ok) return "forbidden";

  const rows = await prisma.groupChatMessage.findMany({
    where: { groupId },
    orderBy: { createdAt: "desc" },
    take: GROUP_CHAT_FETCH_LIMIT,
    select: {
      id: true,
      groupId: true,
      discordId: true,
      authorName: true,
      body: true,
      createdAt: true
    }
  });

  return rows.reverse().map(toDto);
}

export async function postGroupChatMessage(
  groupId: string,
  discordId: string,
  authorName: string,
  body: string
): Promise<GroupChatMessageDto | "forbidden" | "invalid"> {
  const trimmed = body.trim();
  if (!trimmed || trimmed.length > MAX_GROUP_CHAT_BODY_LENGTH) {
    return "invalid";
  }
  const ok = await isUserMemberOfActiveGroup(groupId, discordId);
  if (!ok) return "forbidden";

  const row = await prisma.$transaction(async (tx) => {
    const created = await tx.groupChatMessage.create({
      data: {
        groupId,
        discordId,
        authorName,
        body: trimmed
      }
    });

    const toDrop = await tx.groupChatMessage.findMany({
      where: { groupId },
      orderBy: { createdAt: "desc" },
      skip: GROUP_CHAT_FETCH_LIMIT,
      select: { id: true }
    });
    if (toDrop.length > 0) {
      await tx.groupChatMessage.deleteMany({
        where: { id: { in: toDrop.map((r) => r.id) } }
      });
    }

    return created;
  });

  const extended = await resetGroupLifetimeIfLeader(groupId, discordId);
  if (extended) {
    await broadcastGroupsUpdated();
  }

  return toDto(row);
}
