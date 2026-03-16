import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { MENTORING_ROLES } from "@/lib/groups-db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end("Method Not Allowed");
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { id } = req.query;
  if (typeof id !== "string") {
    return res.status(400).json({ error: "Invalid group id" });
  }

  const currentDiscordId = (session.user as any).discordId as string | undefined;
  if (!currentDiscordId) {
    return res.status(400).json({ error: "Discord ID missing" });
  }

  const { name, role } = req.body ?? {};
  const safeName =
    typeof name === "string" && name.trim() ? name.trim() : "Test applicant";

  const group = await prisma.group.findUnique({
    where: { id },
    include: { members: true, applications: true }
  });
  if (!group) {
    return res.status(404).json({ error: "Group not found" });
  }

  const me = group.members.find((m) => m.discordId === currentDiscordId);
  if (!me || !me.isCreator) {
    return res.status(403).json({
      error: "Only the group leader can add test applicants"
    });
  }

  const testDiscordId = `test-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

  await prisma.groupApplication.create({
    data: {
      groupId: id,
      discordId: testDiscordId,
      name: safeName,
      role:
        group.contentType === "Mentoring" && typeof role === "string"
          ? (MENTORING_ROLES.find((r) => r === role) ?? null)
          : null
    }
  });

  const updated = await prisma.group.findUnique({
    where: { id },
    include: { members: true, applications: true }
  });

  return res.status(200).json(updated);
}

