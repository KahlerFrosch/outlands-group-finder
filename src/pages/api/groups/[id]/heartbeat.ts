import type { NextApiRequest, NextApiResponse } from "next";
import { getSessionDiscordId } from "@/lib/api-session";
import { prisma } from "@/lib/db";
import { resetGroupLifetimeIfLeader } from "@/lib/groups-db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end("Method Not Allowed");
  }

  const discordId = await getSessionDiscordId(req, res);
  if (!discordId) return;

  const { id } = req.query;
  if (typeof id !== "string") {
    return res.status(400).json({ error: "Invalid group id" });
  }

  const group = await prisma.group.findUnique({
    where: { id },
    select: { id: true }
  });
  if (!group) {
    return res.status(404).json({ error: "Group not found" });
  }

  const ok = await resetGroupLifetimeIfLeader(id, discordId);
  if (!ok) {
    return res.status(403).json({
      error: "Only the group leader can reset the timer"
    });
  }

  return res.status(200).json({ ok: true });
}

