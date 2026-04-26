import type { NextApiRequest, NextApiResponse } from "next";
import { getSessionDiscordId } from "@/lib/api-session";
import { deleteGroup } from "@/lib/groups-db";
import { broadcastGroupsUpdated } from "@/lib/groups-broadcast";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;
  if (req.method !== "DELETE" || typeof id !== "string") {
    res.setHeader("Allow", ["DELETE"]);
    return res.status(405).end("Method Not Allowed");
  }

  const discordId = await getSessionDiscordId(req, res);
  if (!discordId) return;

  const result = await deleteGroup(id, discordId);

  if (result === "not_found") {
    return res.status(404).json({ error: "Group not found" });
  }
  if (result === "forbidden") {
    return res.status(403).json({
      error: "Only the group creator can delete the group"
    });
  }

  await broadcastGroupsUpdated();
  return res.status(204).end();
}
