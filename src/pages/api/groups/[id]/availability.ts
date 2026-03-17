import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { setGroupAvailability } from "@/lib/groups-db";
import { broadcastGroupsUpdated } from "@/lib/sse-groups";

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

  const { available } = req.body ?? {};
  if (typeof available !== "boolean") {
    return res.status(400).json({ error: "Missing available boolean" });
  }

  const result = await setGroupAvailability(id, discordId, available);
  if (result === "not_found") {
    return res.status(404).json({ error: "Group not found" });
  }
  if (result === "forbidden") {
    return res.status(403).json({ error: "Only the group leader can change availability" });
  }

  await broadcastGroupsUpdated();
  return res.status(200).json({ ok: true });
}

