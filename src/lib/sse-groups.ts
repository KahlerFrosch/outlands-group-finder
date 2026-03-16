import { notifyGroupsUpdatedViaPusher } from "./pusher-server";

/**
 * Notify all clients that the groups list changed.
 * Call after any create, delete, join, or leave.
 */
export async function broadcastGroupsUpdated(): Promise<void> {
  await notifyGroupsUpdatedViaPusher();
}

