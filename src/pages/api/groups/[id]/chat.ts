import type { NextApiRequest, NextApiResponse } from "next";
import { getSessionDiscordUser } from "@/lib/api-session";
import { listGroupChatMessages, postGroupChatMessage } from "@/lib/group-chat-db";
import { MAX_GROUP_CHAT_BODY_LENGTH } from "@/lib/group-chat-shared";
import { notifyGroupChatMessage } from "@/lib/pusher-server";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id: groupId } = req.query;
  if (typeof groupId !== "string") {
    return res.status(400).json({ error: "Invalid group id" });
  }

  const user = await getSessionDiscordUser(req, res);
  if (!user) return;

  if (req.method === "GET") {
    const messages = await listGroupChatMessages(groupId, user.discordId);
    if (messages === "forbidden") {
      return res.status(403).json({ error: "Not a member of this group" });
    }
    return res.status(200).json({ messages });
  }

  if (req.method === "POST") {
    const raw = req.body?.body;
    if (typeof raw !== "string") {
      return res.status(400).json({ error: "Message text required" });
    }
    const result = await postGroupChatMessage(
      groupId,
      user.discordId,
      user.name,
      raw
    );
    if (result === "forbidden") {
      return res.status(403).json({ error: "Not a member of this group" });
    }
    if (result === "invalid") {
      return res.status(400).json({
        error: `Message must be 1–${MAX_GROUP_CHAT_BODY_LENGTH} characters.`
      });
    }
    await notifyGroupChatMessage(groupId, result);
    return res.status(201).json({ message: result });
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).end("Method Not Allowed");
}
