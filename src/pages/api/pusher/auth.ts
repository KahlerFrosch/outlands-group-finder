import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { authorizePusherPrivateChannel, getPusherServer } from "@/lib/pusher-server";
import { isUserMemberOfActiveGroup } from "@/lib/group-chat-db";
import { groupChatChannelName } from "@/lib/group-chat-shared";

const CHANNEL_PREFIX = "private-group-";

function parseGroupIdFromChannel(channelName: string): string | null {
  if (!channelName.startsWith(CHANNEL_PREFIX)) return null;
  const groupId = channelName.slice(CHANNEL_PREFIX.length);
  return groupId.length > 0 ? groupId : null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end("Method Not Allowed");
  }

  if (!getPusherServer()) {
    return res.status(503).json({ error: "Realtime is not configured" });
  }

  const socketId =
    typeof req.body?.socket_id === "string" ? req.body.socket_id : null;
  const channelName =
    typeof req.body?.channel_name === "string" ? req.body.channel_name : null;

  if (!socketId || !channelName) {
    return res.status(400).json({ error: "socket_id and channel_name required" });
  }

  const groupId = parseGroupIdFromChannel(channelName);
  if (!groupId || channelName !== groupChatChannelName(groupId)) {
    return res.status(403).json({ error: "Invalid channel" });
  }

  const session = await getServerSession(req, res, authOptions);
  const discordId = session?.user?.discordId;
  if (!discordId) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  const allowed = await isUserMemberOfActiveGroup(groupId, discordId);
  if (!allowed) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const auth = authorizePusherPrivateChannel(socketId, channelName);
  if (!auth) {
    return res.status(500).json({ error: "Could not authorize channel" });
  }

  return res.status(200).json(auth);
}
