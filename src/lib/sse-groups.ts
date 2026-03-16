import type { NextApiResponse } from "next";
import { notifyGroupsUpdatedViaPusher } from "./pusher-server";

// Use globalThis so the same Set is shared across all API route handlers
// (Next.js may load route modules separately, so a module-level Set can be empty in delete/join/leave)
const KEY = "__groupsStreamClients";
const clients: Set<NextApiResponse> =
  (typeof globalThis !== "undefined" && (globalThis as any)[KEY]) ||
  ((globalThis as any)[KEY] = new Set<NextApiResponse>());

/**
 * Register an SSE client. Call from GET /api/groups/stream.
 * Removes the client when the connection closes.
 */
export function registerGroupsStreamClient(res: NextApiResponse): void {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();

  clients.add(res);

  const onClose = () => {
    clients.delete(res);
  };

  res.on("close", onClose);
  res.on("error", onClose);
}

/**
 * Notify all connected clients that the groups list changed.
 * Call after any create, delete, join, or leave.
 */
export function broadcastGroupsUpdated(): void {
  const message = "data: groups-updated\n\n";
  clients.forEach((res) => {
    try {
      res.write(message);
    } catch {
      clients.delete(res);
    }
  });

  // Also notify via Pusher so all serverless instances' clients can react
  void notifyGroupsUpdatedViaPusher();
}

