import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { applyToGroup, withdrawApplication, MENTORING_ROLES } from "@/lib/groups-db";
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
  const name = session.user.name ?? "Discord user";
  if (!discordId) {
    return res.status(400).json({ error: "Discord ID missing" });
  }

  const { id } = req.query;
  if (typeof id !== "string") {
    return res.status(400).json({ error: "Invalid group id" });
  }

  const { action, role } = req.body ?? {};

  if (action === "withdraw") {
    const result = await withdrawApplication(id, discordId);

    if (result === "not_found") {
      return res.status(404).json({ error: "Group not found" });
    }
    if (result === "no_application") {
      return res.status(400).json({ error: "No application to withdraw" });
    }

    await broadcastGroupsUpdated();
    return res.status(200).json(result);
  }

  const group = await prisma.group.findUnique({ where: { id } });
  if (group?.contentType === "Mentoring") {
    if (!role || !MENTORING_ROLES.includes(role)) {
      return res.status(400).json({
        error: "Please select your role (Guide or Student) for Mentoring groups."
      });
    }
  }

  const result = await applyToGroup(
    id,
    discordId,
    name,
    group?.contentType === "Mentoring" ? role : undefined
  );

  if (result === "not_found") {
    return res.status(404).json({ error: "Group not found" });
  }
  if (result === "already_in_group") {
    return res.status(400).json({
      error: "You can only be in one group at a time. Leave your current group before joining another."
    });
  }
  if (result === "already_member") {
    return res.status(400).json({ error: "Already a member" });
  }
  if (result === "already_applied") {
    return res.status(400).json({ error: "You have already applied to this group" });
  }
  if (result === "application_limit_reached") {
    return res.status(400).json({
      error: "You can apply to a maximum of 5 groups at the same time."
    });
  }

  await broadcastGroupsUpdated();
  return res.status(200).json(result);
}
