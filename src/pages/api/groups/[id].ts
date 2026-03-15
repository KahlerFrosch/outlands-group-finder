import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { deleteGroup } from "@/lib/groups-db";
import { broadcastGroupsUpdated } from "@/lib/sse-groups";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;
  if (req.method !== "DELETE" || typeof id !== "string") {
    res.setHeader("Allow", ["DELETE"]);
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

  const result = await deleteGroup(id, discordId);

  if (result === "not_found") {
    return res.status(404).json({ error: "Group not found" });
  }
  if (result === "forbidden") {
    return res.status(403).json({
      error: "Only the group creator can delete the group"
    });
  }

  broadcastGroupsUpdated();
  return res.status(204).end();
}
