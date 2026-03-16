import { notifyGroupsUpdatedViaPusher } from "./pusher-server";

/**
 * Notify all clients that the groups list changed.
 * Call after any create, delete, join, or leave.
 */
export function broadcastGroupsUpdated(): void {
  void notifyGroupsUpdatedViaPusher();
}

