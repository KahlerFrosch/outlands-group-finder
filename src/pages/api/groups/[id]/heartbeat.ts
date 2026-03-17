import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Group lifetime: 1 hour
const GROUP_LIFETIME_MS = 60 * 60 * 1000;

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

  const discordId = (session.user as any).discordId as string | undefined;
  if (!discordId) {
    return res.status(400).json({ error: "Discord ID missing" });
  }

  const { id } = req.query;
  if (typeof id !== "string") {
    return res.status(400).json({ error: "Invalid group id" });
  }

  const group = await prisma.group.findUnique({
    where: { id },
    include: { members: true }
  });

  if (!group) {
    return res.status(404).json({ error: "Group not found" });
  }

  const me = group.members.find((m) => m.discordId === discordId);
  if (!me || !me.isCreator) {
    return res.status(403).json({
      error: "Only the group leader can reset the timer"
    });
  }

  await prisma.group.update({
    where: { id },
    data: {
      expiresAt: new Date(Date.now() + GROUP_LIFETIME_MS)
    }
  });

  return res.status(200).json({ ok: true });
}

