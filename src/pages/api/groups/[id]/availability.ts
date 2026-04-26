import type { NextApiRequest, NextApiResponse } from "next";
import { getSessionDiscordId } from "@/lib/api-session";
import { setGroupAvailability } from "@/lib/groups-db";
import { broadcastGroupsUpdated } from "@/lib/groups-broadcast";

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

