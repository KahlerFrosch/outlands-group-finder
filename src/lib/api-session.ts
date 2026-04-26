import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

/**
 * Returns the signed-in user's Discord ID, or sends an error response and returns null.
 */
export async function getSessionDiscordId(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<string | null> {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  const discordId = session.user.discordId;
  if (!discordId) {
    res.status(400).json({ error: "Discord ID missing" });
    return null;
  }
  return discordId;
}

/** Discord ID plus display name for routes that need both (e.g. join, create group). */
export async function getSessionDiscordUser(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<{ discordId: string; name: string } | null> {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  const discordId = session.user.discordId;
  if (!discordId) {
    res.status(400).json({ error: "Discord ID missing" });
    return null;
  }
  return { discordId, name: session.user.name ?? "Discord user" };
}
