import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/db";
import { getSessionDiscordUser } from "@/lib/api-session";
import {
  applyToGroup,
  withdrawApplication,
  type ApplyToGroupInput,
  MENTORING_ROLES,
  PVM_APPLICANT_ROLES
} from "@/lib/groups-db";
import { broadcastGroupsUpdated } from "@/lib/groups-broadcast";
import {
  parseNonNegativeWholeNumberUnknown,
  isValidChainLinkSlotsValue,
  maxChainLinkSlotsForRedline
} from "@/lib/groups-shared";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end("Method Not Allowed");
  }

  const user = await getSessionDiscordUser(req, res);
  if (!user) return;
  const { discordId, name } = user;

  const { id } = req.query;
  if (typeof id !== "string") {
    return res.status(400).json({ error: "Invalid group id" });
  }

  const { action, role, redlinePoints: redlineBody, chainLinkSlots: chainBody } = req.body ?? {};

  if (action === "withdraw") {
    const result = await withdrawApplication(id, discordId);

    if (result === "not_found") {
      return res.status(404).json({ error: "Group not found" });
    }
    if (result === "no_application") {
      return res.status(400).json({ error: "No application to withdraw" });
    }

    await broadcastGroupsUpdated();
    return res.status(200).json(result);
  }

  const group = await prisma.group.findUnique({ where: { id } });
  const needsRole = Boolean(group?.requireRoleSelection);
  if (group?.categoryLevel1 === "Mentoring" && needsRole) {
    const roleStr = role != null ? String(role) : "";
    if (!roleStr || !MENTORING_ROLES.includes(roleStr as (typeof MENTORING_ROLES)[number])) {
      return res.status(400).json({
        error:
          "This group requires you to select Guide or Student when applying. Open the apply dialog to choose your role."
      });
    }
  }
  if (group?.categoryLevel1 === "PvM" && needsRole) {
    const roleStr = role != null ? String(role) : "";
    if (!roleStr || !PVM_APPLICANT_ROLES.includes(roleStr as (typeof PVM_APPLICANT_ROLES)[number])) {
      return res.status(400).json({
        error:
          "This group requires you to select a role (Tank, Healer, Damage Dealer, or Support) when applying. Open the apply dialog to choose your role."
      });
    }
  }

  const needsRedline = Boolean(group?.categoryLevel1 === "PvM" && group.requireRedlinePoints);
  const needsChain = Boolean(group?.categoryLevel1 === "PvM" && group.requireChainLinks);
  const redlineParsed = parseNonNegativeWholeNumberUnknown(redlineBody);
  const chainParsed = parseNonNegativeWholeNumberUnknown(chainBody);
  if (needsRedline && redlineParsed === undefined) {
    return res.status(400).json({
      error:
        "This group requires your number of redline points. Open the apply dialog and enter a valid non-negative whole number (no decimals)."
    });
  }
  if (needsChain && chainParsed === undefined) {
    return res.status(400).json({
      error:
        "This group requires your number of chain link slots. Open the apply dialog and enter a valid non-negative whole number (no decimals)."
    });
  }
  if (needsChain && chainParsed !== undefined) {
    if (!isValidChainLinkSlotsValue(chainParsed, needsRedline ? redlineParsed ?? null : null)) {
      const max = maxChainLinkSlotsForRedline(needsRedline ? redlineParsed ?? null : null);
      return res.status(400).json({
        error: `Chain link slots must be a whole number from 0 to ${max} for your redline points.`
      });
    }
  }

  const input: ApplyToGroupInput = {};
  if (
    group &&
    (group.categoryLevel1 === "Mentoring" || group.categoryLevel1 === "PvM") &&
    role != null &&
    String(role).trim() !== ""
  ) {
    input.role = String(role);
  }
  if (group?.categoryLevel1 === "PvM") {
    if (needsRedline) input.redlinePoints = redlineParsed!;
    if (needsChain) input.chainLinkSlots = chainParsed!;
  }

  const result = await applyToGroup(id, discordId, name, input);

  if (result === "not_found") {
    return res.status(404).json({ error: "Group not found" });
  }
  if (result === "already_in_group") {
    return res.status(400).json({
      error: "You can only be in one group at a time. Leave your current group before joining another."
    });
  }
  if (result === "already_member") {
    return res.status(400).json({ error: "Already a member" });
  }
  if (result === "already_applied") {
    return res.status(400).json({ error: "You have already applied to this group" });
  }
  if (result === "application_limit_reached") {
    return res.status(400).json({
      error: "You can apply to a maximum of 5 groups at the same time."
    });
  }
  if (result === "applicant_role_required") {
    return res.status(400).json({
      error:
        "Please select a role in the apply dialog before applying to this group."
    });
  }
  if (result === "applicant_redline_required") {
    return res.status(400).json({
      error:
        "Please enter your number of redline points in the apply dialog (non-negative whole number)."
    });
  }
  if (result === "applicant_chain_links_required") {
    return res.status(400).json({
      error:
        "Please enter your number of chain link slots in the apply dialog (non-negative whole number)."
    });
  }
  if (result === "applicant_chain_links_invalid") {
    return res.status(400).json({
      error:
        "Chain link slots are too high for your redline points (maximum 30, plus 1 per 8 redline points when redline is required)."
    });
  }

  await broadcastGroupsUpdated();
  return res.status(200).json(result);
}
