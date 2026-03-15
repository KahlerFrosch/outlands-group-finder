import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { leaveGroup } from "@/lib/groups-db";
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

  broadcastGroupsUpdated();
  return res.status(200).json(result);
}
