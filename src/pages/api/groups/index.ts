import type { NextApiRequest, NextApiResponse } from "next";
import { getSessionDiscordUser } from "@/lib/api-session";
import {
  getGroups,
  createGroup,
  CONTENT_SUBTYPES,
  QUEST_SUBTYPES,
  PVM_TERTIARY_OPTIONS,
  PVP_TERTIARY_OPTIONS,
  MENTORING_ROLES,
  PVM_APPLICANT_ROLES,
  type CategoryLevel1
} from "@/lib/groups-db";
import { broadcastGroupsUpdated } from "@/lib/groups-broadcast";
import {
  parseNonNegativeWholeNumberUnknown,
  isValidChainLinkSlotsValue,
  maxChainLinkSlotsForRedline,
  CHAIN_LINK_REDLINE_PER_EXTRA_SLOT
} from "@/lib/groups-shared";

const CATEGORY_LEVEL1_VALUES: CategoryLevel1[] = [
  "PvM",
  "PvP",
  "Mentoring",
  "Roleplay",
  "Custom",
  "Quests"
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    try {
      const groups = await getGroups();
      return res.status(200).json(groups);
    } catch (err) {
      console.error("GET /api/groups failed:", err);
      return res.status(500).json({ error: "Could not load groups. Please try again later." });
    }
  }

  if (req.method === "POST") {
    const user = await getSessionDiscordUser(req, res);
    if (!user) return;

    const {
      categoryLevel1,
      categoryLevel2,
      categoryLevel3,
      description,
      creatorRole,
      creatorRedlinePoints,
      creatorChainLinkSlots,
      requireRoleSelection,
      requireRedlinePoints,
      requireChainLinks,
      voiceChannelListen,
      voiceChannelSpeak
    } = req.body ?? {};

    const truthy = (v: unknown) => v === true || v === "true";
    const desc = (description ?? "").toString().trim();
    const wantRole =
      (categoryLevel1 === "Mentoring" || categoryLevel1 === "PvM") && truthy(requireRoleSelection);

    if (!CATEGORY_LEVEL1_VALUES.includes(categoryLevel1)) {
      return res.status(400).json({ error: "Invalid group category" });
    }

    if (categoryLevel1 === "Custom") {
      if (!desc) {
        return res.status(400).json({
          error: "Description is required for Custom groups"
        });
      }
    } else if (categoryLevel1 === "Mentoring") {
      if (wantRole) {
        if (!creatorRole || !MENTORING_ROLES.includes(creatorRole)) {
          return res.status(400).json({
            error:
              "Choose your role (Guide or Student) in the confirmation dialog before creating a Mentoring group."
          });
        }
      }
    } else if (categoryLevel1 === "PvM") {
      if (wantRole) {
        if (
          !creatorRole ||
          !(PVM_APPLICANT_ROLES as readonly string[]).includes(String(creatorRole))
        ) {
          return res.status(400).json({
            error:
              "Choose your role (Tank, Healer, Damage Dealer, or Support) in the confirmation dialog before creating this PvM group."
          });
        }
      }
    } else if (categoryLevel1 === "Quests") {
      const questAllowed = QUEST_SUBTYPES as readonly string[];
      if (!categoryLevel2 || !questAllowed.includes(categoryLevel2)) {
        return res.status(400).json({ error: "Please select a valid Quest sub-category." });
      }
      if (!desc) {
        return res.status(400).json({
          error: "Description is required for Quests groups."
        });
      }
    } else if (categoryLevel1 !== "Roleplay") {
      const allowed =
        CONTENT_SUBTYPES[
          categoryLevel1 as Exclude<CategoryLevel1, "Mentoring" | "Roleplay" | "Custom" | "Quests">
        ];
      if (!categoryLevel2 || !allowed.includes(categoryLevel2)) {
        return res.status(400).json({ error: "Invalid or missing sub-type for this category" });
      }
      const pvmL3 = categoryLevel1 === "PvM" && PVM_TERTIARY_OPTIONS[categoryLevel2];
      const pvpL3 = categoryLevel1 === "PvP" && PVP_TERTIARY_OPTIONS[categoryLevel2];
      if (pvmL3) {
        if (!categoryLevel3 || !pvmL3.includes(categoryLevel3)) {
          return res.status(400).json({ error: "Invalid or missing level-3 option for this sub-type" });
        }
      }
      if (pvpL3) {
        if (!categoryLevel3 || !pvpL3.includes(categoryLevel3)) {
          return res.status(400).json({ error: "Invalid or missing level-3 option for this sub-type" });
        }
      }
      if (categoryLevel1 === "PvM" && categoryLevel2 === "Society Jobs" && !desc) {
        return res.status(400).json({
          error: "Description is required for Society Jobs groups."
        });
      }
    }

    const { discordId, name } = user;

    const level3Resolved =
      categoryLevel1 === "PvM" && categoryLevel2 && PVM_TERTIARY_OPTIONS[categoryLevel2]
        ? (categoryLevel3 ?? null)
        : categoryLevel1 === "PvP" && categoryLevel2 && PVP_TERTIARY_OPTIONS[categoryLevel2]
          ? (categoryLevel3 ?? null)
          : null;

    const voiceListen = truthy(voiceChannelListen);
    const voiceSpeak = voiceListen && truthy(voiceChannelSpeak);

    const wantRedline = categoryLevel1 === "PvM" && truthy(requireRedlinePoints);
    const wantChain = categoryLevel1 === "PvM" && truthy(requireChainLinks);

    const crRed = parseNonNegativeWholeNumberUnknown(creatorRedlinePoints);
    const crChain = parseNonNegativeWholeNumberUnknown(creatorChainLinkSlots);
    if (wantRedline && crRed === undefined) {
      return res.status(400).json({
        error:
          "Enter your number of redline points in the confirmation dialog (non-negative whole number, no decimals)."
      });
    }
    if (wantChain && crChain === undefined) {
      return res.status(400).json({
        error:
          "Enter your number of chain link slots in the confirmation dialog (non-negative whole number, no decimals)."
      });
    }
    if (wantChain && crChain !== undefined) {
      if (
        !isValidChainLinkSlotsValue(crChain, wantRedline ? crRed ?? null : null)
      ) {
        const max = maxChainLinkSlotsForRedline(wantRedline ? crRed ?? null : null);
        return res.status(400).json({
          error: `Enter a whole number of chain link slots from 0 to ${max}. Maximum is 30, plus 1 for each ${CHAIN_LINK_REDLINE_PER_EXTRA_SLOT} redline points when redline is required.`
        });
      }
    }

    if (categoryLevel1 !== "Mentoring" && categoryLevel1 !== "PvM" && truthy(requireRoleSelection)) {
      return res.status(400).json({
        error: "Role selection is only valid for Mentoring or PvM groups."
      });
    }
    if (categoryLevel1 !== "PvM" && (wantRedline || wantChain)) {
      return res.status(400).json({
        error: "Redline points and chain link fields are only valid for PvM groups."
      });
    }

    const result = await createGroup({
      categoryLevel1: categoryLevel1 as CategoryLevel1,
      categoryLevel2:
        categoryLevel1 === "Custom" || categoryLevel1 === "Roleplay" || categoryLevel1 === "Mentoring"
          ? null
          : (categoryLevel2 ?? null),
      categoryLevel3: level3Resolved,
      description: desc,
      creatorDiscordId: discordId,
      creatorName: name,
      creatorRole:
        categoryLevel1 === "Mentoring" || categoryLevel1 === "PvM"
          ? wantRole
            ? creatorRole ?? null
            : null
          : null,
      creatorRedlinePoints: wantRedline ? crRed! : null,
      creatorChainLinkSlots: wantChain ? crChain! : null,
      requireRoleSelection: wantRole,
      requireRedlinePoints: wantRedline,
      requireChainLinks: wantChain,
      voiceChannelListen: voiceListen,
      voiceChannelSpeak: voiceSpeak
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
