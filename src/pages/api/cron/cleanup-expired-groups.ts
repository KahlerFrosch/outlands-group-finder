import type { NextApiRequest, NextApiResponse } from "next";
import { cleanupExpiredGroups } from "@/lib/groups-db";

/**
 * Deletes expired groups. Secure with CRON_SECRET (Bearer token or ?secret=).
 * Schedule externally (e.g. Vercel Cron, GitHub Actions, system cron).
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).end("Method Not Allowed");
  }

  const configured = process.env.CRON_SECRET?.trim();
  if (!configured) {
    return res
      .status(503)
      .json({ error: "CRON_SECRET is not configured" });
  }

  const auth = req.headers.authorization;
  const bearer =
    typeof auth === "string" && auth.startsWith("Bearer ")
      ? auth.slice("Bearer ".length)
      : undefined;
  const q = req.query.secret;
  const fromQuery =
    typeof q === "string" ? q : Array.isArray(q) ? q[0] : undefined;

  if (bearer !== configured && fromQuery !== configured) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const deleted = await cleanupExpiredGroups();
  return res.status(200).json({ ok: true, deleted });
}
