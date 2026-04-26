import type { NextApiRequest, NextApiResponse } from "next";
import { getSessionDiscordId } from "@/lib/api-session";
import { leaveGroup } from "@/lib/groups-db";
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

  const result = await leaveGroup(id, discordId);

  if (result === "not_found") {
    return res.status(404).json({ error: "Group not found" });
  }
  if (result === "not_member") {
    return res.status(400).json({ error: "Not a member" });
  }
  if (result === "creator_cannot_leave") {
    return res.status(403).json({
      error: "Creator cannot leave; use Delete to remove the group"
    });
  }

  await broadcastGroupsUpdated();
  return res.status(200).json(result);
}
