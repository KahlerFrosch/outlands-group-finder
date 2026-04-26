"use client";

import { GroupLeaderCrownTooltip } from "./GroupLeaderCrownTooltip";

export function GroupPersonLabel({
  name,
  isLeader
}: {
  name: string;
  isLeader?: boolean;
}) {
  const d = (name || "Discord user").trim() || "Discord user";
  return (
    <span className="inline-flex min-w-0 items-center gap-1">
      <span className="min-w-0 truncate">{d}</span>
      {isLeader ? <GroupLeaderCrownTooltip /> : null}
    </span>
  );
}
