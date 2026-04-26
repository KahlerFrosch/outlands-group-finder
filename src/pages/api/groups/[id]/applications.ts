import type { NextApiRequest, NextApiResponse } from "next";
import { getSessionDiscordId } from "@/lib/api-session";
import { prisma } from "@/lib/db";
import { getGroupForResponse, isUserInAnyGroup } from "@/lib/groups-db";
import { broadcastGroupsUpdated } from "@/lib/groups-broadcast";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end("Method Not Allowed");
  }

  const currentDiscordId = await getSessionDiscordId(req, res);
  if (!currentDiscordId) return;

  const { id } = req.query;
  if (typeof id !== "string") {
    return res.status(400).json({ error: "Invalid group id" });
  }

  const { applicantDiscordId, action } = req.body ?? {};
  if (!applicantDiscordId || typeof applicantDiscordId !== "string") {
    return res.status(400).json({ error: "Missing applicantDiscordId" });
  }
  if (action !== "accept" && action !== "decline") {
    return res.status(400).json({ error: "Invalid action" });
  }

  const group = await prisma.group.findUnique({
    where: { id },
    include: { members: true, applications: true }
  });
  if (!group) {
    return res.status(404).json({ error: "Group not found" });
  }
  if (group.expiresAt < new Date()) {
    return res.status(404).json({ error: "Group not found" });
  }

  const me = group.members.find((m) => m.discordId === currentDiscordId);
  if (!me) {
    return res.status(403).json({ error: "Only group members can manage applications" });
  }
  if (!me.isCreator) {
    return res.status(403).json({ error: "Only the group leader can accept or decline applicants" });
  }

  const application = group.applications.find((a) => a.discordId === applicantDiscordId);
  if (!application) {
    return res.status(404).json({ error: "Application not found" });
  }

  if (action === "decline") {
    await prisma.$transaction([
      prisma.groupApplication.deleteMany({
        where: { groupId: id, discordId: applicantDiscordId }
      }),
      prisma.group.update({
        where: { id },
        data: {
          expiresAt: new Date(Date.now() + 60 * 60 * 1000)
        }
      })
    ]);
  } else if (action === "accept") {
    if (await isUserInAnyGroup(applicantDiscordId)) {
      return res.status(400).json({
        error: "This user is already a member of another group."
      });
    }

    await prisma.$transaction([
      prisma.groupApplication.deleteMany({
        where: { groupId: id, discordId: applicantDiscordId }
      }),
      prisma.groupMember.create({
        data: {
          groupId: id,
          discordId: applicantDiscordId,
          name: application.name,
          isCreator: false,
          role: application.role ?? null,
          redlinePoints: application.redlinePoints ?? null,
          chainLinkSlots: application.chainLinkSlots ?? null
        }
      }),
      prisma.groupApplication.deleteMany({
        where: {
          discordId: applicantDiscordId,
          groupId: { not: id }
        }
      }),
      prisma.group.update({
        where: { id },
        data: {
          expiresAt: new Date(Date.now() + 60 * 60 * 1000)
        }
      })
    ]);
  }

  const updated = await getGroupForResponse(id);
  if (!updated) {
    return res.status(404).json({ error: "Group not found" });
  }

  await broadcastGroupsUpdated();
  return res.status(200).json(updated);
}

