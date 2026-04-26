"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import {
  type Group,
  type CategoryLevel1,
  type CategoryLevel2,
  type CategoryLevel3,
  CONTENT_SUBTYPES,
  QUEST_SUBTYPES,
  PVM_TERTIARY_OPTIONS,
  PVP_TERTIARY_OPTIONS,
  MENTORING_ROLES,
  PVM_APPLICANT_ROLES,
  parseNonNegativeWholeNumberString,
  isValidChainLinkSlotsValue,
  maxChainLinkSlotsForRedline
} from "@/lib/groups-shared";
import { AdditionalInputRequiredModal } from "@/components/AdditionalInputRequiredModal";
import { GroupCard } from "@/components/group-card/GroupCard";
import { GroupChatWidget } from "@/components/GroupChatWidget";
import { suppressJoinProgressionErrorMessage } from "@/lib/group-apply-helpers";
import { useGroups } from "@/hooks/useGroups";

/** Max height for Your group card + chat; content scrolls inside when taller. */
const YOUR_GROUP_PANEL_MAX = "max-h-[min(33rem,67svh)]";

export default function HomePage() {
  const { data: session } = useSession();
  const isLoggedIn = Boolean(session?.user);
  const discordId = session?.user?.discordId;

  const { groups, loading, error, setError, refresh } = useGroups();
  const [actingId, setActingId] = useState<string | null>(null);
  const [joinModalGroupId, setJoinModalGroupId] = useState<string | null>(null);
  const [joinModalRole, setJoinModalRole] = useState<string>("");
  const [joinModalRedlinePoints, setJoinModalRedlinePoints] = useState("");
  const [joinModalChainLinkSlots, setJoinModalChainLinkSlots] = useState("");
  const [now, setNow] = useState<number>(Date.now());
  const [autoDeletingId, setAutoDeletingId] = useState<string | null>(null);

  const [filterCategoryLevel1, setFilterCategoryLevel1] = useState<CategoryLevel1 | "All">("All");
  const [filterCategoryLevel2, setFilterCategoryLevel2] = useState<CategoryLevel2 | "All">("All");
  const [filterCategoryLevel3, setFilterCategoryLevel3] = useState<CategoryLevel3 | "All">("All");

  // Global ticking clock for expiry timers
  useEffect(() => {
    const id = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // Automatically delete groups when the leader's timer runs out,
  // so deletion behaves like other Pusher-driven updates.
  useEffect(() => {
    if (!discordId) return;

    // Only attempt one auto-delete at a time.
    if (autoDeletingId) return;

    const leaderGroups = groups.filter((g) =>
      g.members.some((m) => m.isCreator && m.discordId === discordId)
    );

    for (const g of leaderGroups) {
      const expiresAtMs = new Date(g.expiresAt).getTime();
      const remainingMs = expiresAtMs - now;
      if (remainingMs <= 0) {
        (async () => {
          setAutoDeletingId(g.id);
          try {
            const res = await fetch(`/api/groups/${g.id}`, { method: "DELETE" });
            if (!res.ok) {
              const data = await res.json().catch(() => ({}));
              throw new Error(data.error || "Failed to delete group");
            }
            refresh();
          } catch (err: any) {
            setError(err.message ?? "Failed to delete group");
            refresh();
          } finally {
            setAutoDeletingId(null);
          }
        })();
        break;
      }
    }
  }, [discordId, groups, now, autoDeletingId]);

  const handleApply = async (
    groupId: string,
    mode: "apply" | "withdraw",
    opts?: { role?: string; redlinePoints?: number; chainLinkSlots?: number }
  ): Promise<boolean> => {
    if (!discordId) return false;
    setActingId(`${groupId}:apply`);
    try {
      const res = await fetch(`/api/groups/${groupId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: mode,
          ...(opts?.role ? { role: opts.role } : {}),
          ...(opts?.redlinePoints !== undefined ? { redlinePoints: opts.redlinePoints } : {}),
          ...(opts?.chainLinkSlots !== undefined ? { chainLinkSlots: opts.chainLinkSlots } : {})
        })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to join");
      }
      refresh();
      return true;
    } catch (err: any) {
      const msg = err.message ?? "Failed to join group";
      if (!suppressJoinProgressionErrorMessage(msg)) {
        setError(msg);
      }
      return false;
    } finally {
      setActingId(null);
    }
  };

  const handleLeave = async (groupId: string) => {
    if (!discordId) return;
    setActingId(`${groupId}:leave`);
    try {
      const res = await fetch(`/api/groups/${groupId}/leave`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to leave");
      }
      refresh();
    } catch (err: any) {
      setError(err.message ?? "Failed to leave group");
      refresh();
    } finally {
      setActingId(null);
    }
  };

  const handleDelete = async (groupId: string) => {
    if (!discordId) return;
    setActingId(`${groupId}:delete`);
    try {
      const res = await fetch(`/api/groups/${groupId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete");
      }
      refresh();
    } catch (err: any) {
      setError(err.message ?? "Failed to delete group");
      refresh();
    } finally {
      setActingId(null);
    }
  };

  const myGroup = discordId
    ? groups.find((g) => g.members.some((m) => m.discordId === discordId))
    : null;

  const availableGroups = useMemo(() => {
    const base = myGroup
      ? groups.filter((g) => g.id !== myGroup.id && g.available)
      : groups.filter((g) => g.available);

    return base.filter((g) => {
      if (filterCategoryLevel1 !== "All" && g.categoryLevel1 !== filterCategoryLevel1) {
        return false;
      }
      if (filterCategoryLevel2 !== "All" && g.categoryLevel2 !== filterCategoryLevel2) {
        return false;
      }
      if (filterCategoryLevel3 !== "All" && g.categoryLevel3 !== filterCategoryLevel3) {
        return false;
      }
      return true;
    });
  }, [groups, myGroup, filterCategoryLevel1, filterCategoryLevel2, filterCategoryLevel3]);

  const availableSubTypes = useMemo(() => {
    if (filterCategoryLevel1 === "Quests") {
      return [...QUEST_SUBTYPES];
    }
    if (filterCategoryLevel1 === "PvM" || filterCategoryLevel1 === "PvP") {
      return CONTENT_SUBTYPES[filterCategoryLevel1] ?? [];
    }
    return [];
  }, [filterCategoryLevel1]);

  const availableTertiaryOptions = useMemo(() => {
    if (filterCategoryLevel1 === "PvM" && filterCategoryLevel2 !== "All") {
      return PVM_TERTIARY_OPTIONS[filterCategoryLevel2] ?? [];
    }
    if (filterCategoryLevel1 === "PvP" && filterCategoryLevel2 !== "All") {
      return PVP_TERTIARY_OPTIONS[filterCategoryLevel2] ?? [];
    }
    return [];
  }, [filterCategoryLevel1, filterCategoryLevel2]);


  const joinModalGroup = joinModalGroupId ? groups.find((g) => g.id === joinModalGroupId) : null;

  const joinModalNeedsRole =
    joinModalGroup &&
    joinModalGroup.requireRoleSelection &&
    (joinModalGroup.categoryLevel1 === "Mentoring" ||
      joinModalGroup.categoryLevel1 === "PvM");

  const joinModalNeedsRedline =
    joinModalGroup?.categoryLevel1 === "PvM" && joinModalGroup.requireRedlinePoints;

  const joinModalNeedsChain =
    joinModalGroup?.categoryLevel1 === "PvM" && joinModalGroup.requireChainLinks;

  const joinModalChainLinkMax = useMemo(
    () =>
      maxChainLinkSlotsForRedline(
        joinModalNeedsRedline
          ? parseNonNegativeWholeNumberString(joinModalRedlinePoints) ?? null
          : null
      ),
    [joinModalNeedsRedline, joinModalRedlinePoints]
  );

  const applyModalRequirementsMet = useMemo(() => {
    if (!joinModalGroup) return true;
    if (joinModalNeedsRole) {
      const rolePool: readonly string[] =
        joinModalGroup.categoryLevel1 === "Mentoring" ? MENTORING_ROLES : PVM_APPLICANT_ROLES;
      if (!rolePool.includes(joinModalRole)) {
        return false;
      }
    }
    const parsedRedline = joinModalNeedsRedline
      ? parseNonNegativeWholeNumberString(joinModalRedlinePoints)
      : null;
    if (joinModalNeedsRedline && parsedRedline === undefined) {
      return false;
    }
    if (joinModalNeedsChain) {
      const chain = parseNonNegativeWholeNumberString(joinModalChainLinkSlots);
      if (chain === undefined) return false;
      if (
        !isValidChainLinkSlotsValue(
          chain,
          joinModalNeedsRedline ? parsedRedline! : null
        )
      ) {
        return false;
      }
    }
    return true;
  }, [
    joinModalGroup,
    joinModalNeedsRole,
    joinModalNeedsRedline,
    joinModalNeedsChain,
    joinModalRole,
    joinModalRedlinePoints,
    joinModalChainLinkSlots
  ]);

  const applyModalBlocked = !applyModalRequirementsMet;

  const onConfirmApplyModal = async () => {
    if (!joinModalGroupId || !joinModalGroup) return;
    if (applyModalBlocked) return;
    const role =
      joinModalGroup.requireRoleSelection &&
      (joinModalGroup.categoryLevel1 === "Mentoring" ||
        joinModalGroup.categoryLevel1 === "PvM")
        ? joinModalRole
        : undefined;
    const redlinePoints =
      joinModalGroup.categoryLevel1 === "PvM" && joinModalGroup.requireRedlinePoints
        ? parseNonNegativeWholeNumberString(joinModalRedlinePoints)
        : undefined;
    const chainLinkSlots =
      joinModalGroup.categoryLevel1 === "PvM" && joinModalGroup.requireChainLinks
        ? parseNonNegativeWholeNumberString(joinModalChainLinkSlots)
        : undefined;
    const ok = await handleApply(joinModalGroupId, "apply", {
      role,
      ...(redlinePoints !== undefined ? { redlinePoints } : {}),
      ...(chainLinkSlots !== undefined ? { chainLinkSlots } : {})
    });
    if (ok) setJoinModalGroupId(null);
  };

  const groupCardSharedProps = {
    discordId,
    groups,
    now,
    isLoggedIn,
    actingId,
    setActingId,
    autoDeletingId,
    setError,
    refresh,
    onOpenApplyPrep: (group: Group) => {
      setError(null);
      setJoinModalRole("");
      setJoinModalRedlinePoints("");
      setJoinModalChainLinkSlots("");
      setJoinModalGroupId(group.id);
    },
    handleApply,
    handleLeave,
    handleDelete
  };

  return (
    <>
    <div className="space-y-8">
      {myGroup && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-400/90">
            Your group
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:items-stretch">
            <div
              className={`min-h-0 min-w-0 md:h-full ${YOUR_GROUP_PANEL_MAX} overflow-x-hidden overflow-y-auto overscroll-y-contain`}
            >
              <GroupCard
                group={myGroup}
                highlighted
                {...groupCardSharedProps}
              />
            </div>
            {discordId && (
              <div
                className={`flex min-h-0 min-w-0 flex-col overflow-hidden md:h-full ${YOUR_GROUP_PANEL_MAX}`}
              >
                <GroupChatWidget
                  groupId={myGroup.id}
                  discordId={discordId}
                  className="min-h-0 flex-1"
                />
              </div>
            )}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
              Available groups
            </h3>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
              <span className="font-semibold">Filter:</span>
              <select
                value={filterCategoryLevel1}
                onChange={(e) => {
                  const value = e.target.value as CategoryLevel1 | "All";
                  setFilterCategoryLevel1(value);
                  setFilterCategoryLevel2("All");
                  setFilterCategoryLevel3("All");
                }}
                className="rounded-lg border border-white/10 bg-slate-900/70 px-2 py-1 text-xs outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/40"
              >
                <option value="All">All</option>
                <option value="PvM">PvM</option>
                <option value="PvP">PvP</option>
                <option value="Quests">Quests</option>
                <option value="Mentoring">Mentoring</option>
                <option value="Roleplay">Roleplay</option>
                <option value="Custom">Custom</option>
              </select>
              {(filterCategoryLevel1 === "PvM" ||
                filterCategoryLevel1 === "PvP" ||
                filterCategoryLevel1 === "Quests") && (
                <select
                  value={filterCategoryLevel2}
                  onChange={(e) => {
                    const value = e.target.value as CategoryLevel2 | "All";
                    setFilterCategoryLevel2(value);
                    setFilterCategoryLevel3("All");
                  }}
                  className="rounded-lg border border-white/10 bg-slate-900/70 px-2 py-1 text-xs outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/40"
                >
                  <option value="All">All</option>
                  {availableSubTypes.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              )}
              {availableTertiaryOptions.length > 0 && (
                <select
                  value={filterCategoryLevel3}
                  onChange={(e) => setFilterCategoryLevel3(e.target.value as CategoryLevel3 | "All")}
                  className="rounded-lg border border-white/10 bg-slate-900/70 px-2 py-1 text-xs outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/40"
                >
                  <option value="All">All</option>
                  {availableTertiaryOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
          {isLoggedIn && !myGroup && (
            <Link
              href="/creategroup"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white shadow shadow-emerald-500/40 transition hover:bg-emerald-400"
            >
              <span className="text-base leading-none">＋</span>
              <span>Create new group</span>
            </Link>
          )}
        </div>

        {loading ? (
          <div className="mt-4 text-xs text-slate-400">Loading groups…</div>
        ) : (
          <>
            {error && (
              <div className="mt-4 text-xs text-red-400">{error}</div>
            )}
            {availableGroups.length === 0 ? (
              <div className="mt-4 text-xs text-slate-400">
                {myGroup ? "No other groups available." : "No groups available."}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-3">
                {availableGroups.map((g) => (
                  <GroupCard
                    key={g.id}
                    group={g}
                    highlighted={false}
                    {...groupCardSharedProps}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>

    <AdditionalInputRequiredModal
      open={Boolean(joinModalGroupId && joinModalGroup)}
      onClose={() => setJoinModalGroupId(null)}
      onConfirm={onConfirmApplyModal}
      confirmDisabled={
        joinModalGroupId ? actingId === `${joinModalGroupId}:apply` || applyModalBlocked : false
      }
      confirmBusy={Boolean(joinModalGroupId && actingId === `${joinModalGroupId}:apply`)}
      disableBack={false}
      needsRole={Boolean(joinModalNeedsRole)}
      roleOptions={
        joinModalGroup
          ? joinModalGroup.categoryLevel1 === "Mentoring"
            ? MENTORING_ROLES
            : PVM_APPLICANT_ROLES
          : []
      }
      roleValue={joinModalRole}
      onRoleChange={setJoinModalRole}
      needsRedlinePoints={Boolean(joinModalNeedsRedline)}
      needsChainLinkSlots={Boolean(joinModalNeedsChain)}
      chainLinkSlotsMax={joinModalChainLinkMax}
      redlinePointsValue={joinModalRedlinePoints}
      chainLinkSlotsValue={joinModalChainLinkSlots}
      onRedlinePointsChange={setJoinModalRedlinePoints}
      onChainLinkSlotsChange={setJoinModalChainLinkSlots}
    />
    </>
  );
}

