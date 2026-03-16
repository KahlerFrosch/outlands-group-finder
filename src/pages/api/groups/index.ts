import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import {
  getGroups,
  createGroup,
  CONTENT_SUBTYPES,
  PVM_TERTIARY_OPTIONS,
  PVP_TERTIARY_OPTIONS,
  PVM_DESCRIPTION_REQUIRED_SUBTYPES,
  MENTORING_ROLES,
  type ContentType
} from "@/lib/groups-db";
import { broadcastGroupsUpdated } from "@/lib/sse-groups";

const CONTENT_TYPES: ContentType[] = ["PvM", "PvP", "Mentoring", "Roleplay", "Custom"];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    const groups = await getGroups();
    return res.status(200).json(groups);
  }

  if (req.method === "POST") {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { contentType, contentSubType, contentTertiary, description, creatorRole } = req.body;
    const desc = (description ?? "").toString().trim();

    if (!CONTENT_TYPES.includes(contentType)) {
      return res.status(400).json({ error: "Invalid content type" });
    }

    if (contentType === "Custom") {
      if (!desc) {
        return res.status(400).json({
          error: "Description is required for Custom groups"
        });
      }
    } else if (contentType === "Mentoring") {
      if (!creatorRole || !MENTORING_ROLES.includes(creatorRole)) {
        return res.status(400).json({
          error: "Please select your role (Guide or Student) for Mentoring groups."
        });
      }
    } else if (contentType !== "Roleplay") {
      const allowed = CONTENT_SUBTYPES[contentType as Exclude<ContentType, "Mentoring" | "Roleplay" | "Custom">];
      if (!contentSubType || !allowed.includes(contentSubType)) {
        return res.status(400).json({ error: "Invalid or missing sub-type for this category" });
      }
      const pvmTertiary = contentType === "PvM" && PVM_TERTIARY_OPTIONS[contentSubType];
      const pvpTertiary = contentType === "PvP" && PVP_TERTIARY_OPTIONS[contentSubType];
      if (pvmTertiary) {
        if (!contentTertiary || !pvmTertiary.includes(contentTertiary)) {
          return res.status(400).json({ error: "Invalid or missing tertiary option for this sub-type" });
        }
      }
      if (pvpTertiary) {
        if (!contentTertiary || !pvpTertiary.includes(contentTertiary)) {
          return res.status(400).json({ error: "Invalid or missing tertiary option for this sub-type" });
        }
      }
      if (contentType === "PvM" && contentSubType === "Society Jobs" && !desc) {
        return res.status(400).json({
          error: "Description is required for Society Jobs groups."
        });
      }
      if (contentType === "PvM" && contentSubType === "Quests" && !desc) {
        return res.status(400).json({
          error: "Description is required for Quests groups."
        });
      }
    }

    const discordId = (session.user as any).discordId as string | undefined;
    const name = session.user.name ?? "Discord user";
    if (!discordId) {
      return res.status(400).json({ error: "Discord ID missing from session" });
    }

    const tertiary =
      contentType === "PvM" && contentSubType && PVM_TERTIARY_OPTIONS[contentSubType]
        ? (contentTertiary ?? null)
        : contentType === "PvP" && contentSubType && PVP_TERTIARY_OPTIONS[contentSubType]
          ? (contentTertiary ?? null)
          : null;

    const result = await createGroup({
      contentType: contentType as ContentType,
      contentSubType: contentType === "Custom" || contentType === "Roleplay" || contentType === "Mentoring" ? null : (contentSubType ?? null),
      contentTertiary: tertiary,
      description: desc,
      creatorDiscordId: discordId,
      creatorName: name,
      creatorRole: contentType === "Mentoring" ? creatorRole : null
    });

    if (result === "already_in_group") {
      return res.status(400).json({
        error: "You can only be in one group at a time. Leave your current group before creating a new one."
      });
    }

    await broadcastGroupsUpdated();
    return res.status(201).json(result);
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).end("Method Not Allowed");
}
