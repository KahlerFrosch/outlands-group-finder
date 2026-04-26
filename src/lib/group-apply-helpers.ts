import type { Group } from "@/lib/groups-shared";

/** Open the apply modal when role and/or PvM progression fields must be supplied. */
export function groupNeedsApplyPrepModal(group: Group): boolean {
  if (group.categoryLevel1 === "Mentoring" && group.requireRoleSelection) {
    return true;
  }
  if (group.categoryLevel1 === "PvM") {
    if (group.requireRoleSelection) return true;
    if (group.requireRedlinePoints) return true;
    if (group.requireChainLinks) return true;
  }
  return false;
}

export function suppressJoinProgressionErrorMessage(msg: string): boolean {
  return (
    msg.includes("Guide or Student") ||
    msg.includes("redline points") ||
    msg.includes("chain link")
  );
}
