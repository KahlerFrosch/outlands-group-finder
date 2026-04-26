import Pusher from "pusher";
import { groupChatChannelName, type GroupChatMessageDto } from "./group-chat-shared";

const {
  PUSHER_APP_ID,
  PUSHER_KEY,
  PUSHER_SECRET,
  PUSHER_CLUSTER
} = process.env;

let pusher: Pusher | null = null;

if (PUSHER_APP_ID && PUSHER_KEY && PUSHER_SECRET && PUSHER_CLUSTER) {
  pusher = new Pusher({
    appId: PUSHER_APP_ID,
    key: PUSHER_KEY,
    secret: PUSHER_SECRET,
    cluster: PUSHER_CLUSTER,
    useTLS: true
  });
}

export function getPusherServer(): Pusher | null {
  return pusher;
}

/** Auth payload for `private-*` channels (return as JSON from `/api/pusher/auth`). */
export function authorizePusherPrivateChannel(
  socketId: string,
  channelName: string
): object | null {
  if (!pusher) return null;
  try {
    return pusher.authorizeChannel(socketId, channelName);
  } catch {
    return null;
  }
}

export async function notifyGroupsUpdatedViaPusher(): Promise<void> {
  if (!pusher) return;
  try {
    await pusher.trigger("groups", "updated", {});
  } catch (err) {
    console.error("Pusher trigger failed", err);
  }
}

export async function notifyGroupChatMessage(
  groupId: string,
  payload: GroupChatMessageDto
): Promise<void> {
  if (!pusher) return;
  try {
    await pusher.trigger(groupChatChannelName(groupId), "message", payload);
  } catch (err) {
    console.error("Pusher group chat trigger failed", err);
  }
}

