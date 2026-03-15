import type { NextApiRequest, NextApiResponse } from "next";
import { registerGroupsStreamClient } from "@/lib/sse-groups";

export const config = {
  api: {
    bodyParser: false
  }
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end("Method Not Allowed");
  }

  registerGroupsStreamClient(res);

  // Keep the connection open; client will close when leaving the page
  // Optional: send a comment periodically to keep the connection alive (e.g. every 30s)
  const keepAlive = setInterval(() => {
    try {
      res.write(": keep-alive\n\n");
    } catch {
      clearInterval(keepAlive);
    }
  }, 25000);

  res.on("close", () => {
    clearInterval(keepAlive);
  });
}
