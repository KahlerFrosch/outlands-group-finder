"use client";

import { Icon } from "@iconify/react";
import type { Group } from "@/lib/groups-shared";
import { groupNeedsApplyPrepModal } from "@/lib/group-apply-helpers";
import { GroupAvailabilityTooltip } from "./GroupAvailabilityTooltip";
import { GroupDeletionTimerButton } from "./GroupDeletionTimerButton";
import { GroupPersonLabel } from "./GroupPersonLabel";
import { VoiceChannelSettingTooltip } from "./VoiceChannelSettingTooltip";

function PvMStatBadge({
  icon,
  value,
  highlighted
}: {
  icon: string;
  value: number;
  highlighted: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium ${highlighted ? "bg-amber-500/30 text-amber-200" : "bg-slate-600/80 text-slate-200"}`}
    >
      <Icon icon={icon} className="h-3 w-3 shrink-0" aria-hidden />
      {value}
    </span>
  );
}

export type GroupCardProps = {
  group: Group;
  highlighted: boolean;
  discordId: string | undefined;
  groups: Group[];
  now: number;
  isLoggedIn: boolean;
  actingId: string | null;
  setActingId: (id: string | null) => void;
  autoDeletingId: string | null;
  setError: (msg: string | null) => void;
  refresh: () => void;
  onOpenApplyPrep: (group: Group) => void;
  handleApply: (
    groupId: string,
    mode: "apply" | "withdraw",
    opts?: { role?: string; redlinePoints?: number; chainLinkSlots?: number }
  ) => Promise<boolean>;
  handleLeave: (groupId: string) => void | Promise<void>;
  handleDelete: (groupId: string) => void | Promise<void>;
};

export function GroupCard(props: GroupCardProps) {
  const {
    group,
    highlighted,
    discordId,
    groups,
    now,
    isLoggedIn,
    actingId,
    setActingId,
    autoDeletingId,
    setError,
    refresh,
    onOpenApplyPrep,
    handleApply,
    handleLeave,
    handleDelete
  } = props;
  const isCreator = Boolean(
    discordId && group.members.some((m) => m.isCreator && m.discordId === discordId)
  );
  const isMember = Boolean(
    discordId && group.members.some((m) => m.discordId === discordId)
  );
  const isInAnyGroup = Boolean(
    discordId && groups.some((g) => g.members.some((m) => m.discordId === discordId))
  );
  const isApplicant = Boolean(
    discordId && group.applicants.some((a) => a.discordId === discordId)
  );
  const myApplicationsCount = discordId
    ? groups.reduce(
        (count, g) =>
          count + g.applicants.filter((a) => a.discordId === discordId).length,
        0
      )
    : 0;
  const canApplyMore = !discordId || isApplicant || myApplicationsCount < 5;
  const busy = (actingId?.startsWith(`${group.id}:`) ?? false) || autoDeletingId === group.id;
  const showApplyActions = group.available;

  const availabilityBusy = actingId === `${group.id}:availability`;
  const deleteBusy = actingId === `${group.id}:delete` || autoDeletingId === group.id;
  const leaveBusy = actingId === `${group.id}:leave`;
  const applyBusy = actingId === `${group.id}:apply`;

  const expiresAtMs = new Date(group.expiresAt).getTime();
  const remainingMs = Math.max(0, expiresAtMs - now);
  const remainingSeconds = Math.floor(remainingMs / 1000);
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTimer = `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;

  const membersOrdered = (() => {
    const leader = group.members.find((m) => m.isCreator);
    const rest = group.members.filter((m) => !m.isCreator);
    const sortedRest = [...rest].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
    );
    return leader ? [leader, ...sortedRest] : sortedRest;
  })();

  return (
    <article
      className={
        highlighted
          ? "group flex h-full min-h-0 max-w-full flex-col overflow-x-hidden rounded-2xl border-2 border-amber-400/70 bg-amber-950/40 p-4 shadow-lg shadow-amber-500/10 transition hover:border-amber-400 hover:bg-amber-950/50"
          : "group flex min-h-0 h-full flex-col rounded-2xl border border-white/10 bg-slate-900/60 p-4 transition hover:border-indigo-400/80 hover:bg-slate-900"
      }
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <h4 className="min-w-0 flex-1 text-sm font-semibold leading-tight">
          {group.categoryLevel1 === "Custom"
            ? "Custom"
            : group.categoryLevel1 === "Quests"
              ? group.categoryLevel2
                ? `Quests · ${group.categoryLevel2}`
                : "Quests"
              : group.categoryLevel1 === "Roleplay" || group.categoryLevel1 === "Mentoring"
                ? group.categoryLevel1
                : group.categoryLevel3
                  ? `${group.categoryLevel1} · ${group.categoryLevel2} · ${group.categoryLevel3}`
                  : group.categoryLevel2
                    ? `${group.categoryLevel1} · ${group.categoryLevel2}`
                    : `${group.categoryLevel1} group`}
        </h4>
        {(isMember || isCreator) && (
          <div className="flex shrink-0 items-center gap-2">
            {isMember && (
              <GroupAvailabilityTooltip
                available={group.available}
                highlighted={highlighted}
              />
            )}
            {isCreator && (
              <GroupDeletionTimerButton
                disabled={busy}
                formattedTimer={formattedTimer}
                onReset={async () => {
                  setActingId(`${group.id}:timer`);
                  try {
                    const res = await fetch(`/api/groups/${group.id}/heartbeat`, {
                      method: "POST"
                    });
                    if (!res.ok) {
                      const data = await res.json().catch(() => ({}));
                      throw new Error(data.error || "Failed to reset timer");
                    }
                    refresh();
                  } catch (err: any) {
                    setError(err.message ?? "Failed to reset timer");
                    refresh();
                  } finally {
                    setActingId(null);
                  }
                }}
              />
            )}
          </div>
        )}
      </div>
      <p
        className={`mb-2 h-[3lh] text-justify text-xs line-clamp-3 overflow-hidden ${group.description ? (highlighted ? "text-amber-100/90" : "text-slate-300") : highlighted ? "text-amber-200/50" : "text-slate-500"}`}
      >
        {group.description || "No description."}
      </p>
      {(group.voiceChannelListen || group.voiceChannelSpeak) && (
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {group.voiceChannelListen ? (
            <VoiceChannelSettingTooltip kind="listen" highlighted={highlighted} />
          ) : null}
          {group.voiceChannelSpeak ? (
            <VoiceChannelSettingTooltip kind="speak" highlighted={highlighted} />
          ) : null}
        </div>
      )}
      <div className="mb-2 space-y-3">
        <div>
          <p
            className={`text-[11px] font-semibold uppercase tracking-wide ${highlighted ? "text-amber-300/80" : "text-slate-400"}`}
          >
            Members ({membersOrdered.length})
          </p>
          <ul
            className={`mt-1 flex flex-col divide-y text-xs ${highlighted ? "divide-amber-500/20 text-amber-100/80" : "divide-white/[0.08] text-slate-300"}`}
          >
            {membersOrdered.map((m) => (
              <li
                key={m.discordId}
                className="flex min-w-0 items-center justify-between gap-2 py-2"
              >
                <GroupPersonLabel name={m.name} isLeader={m.isCreator} />
                <span className="flex shrink-0 flex-wrap items-center justify-end gap-1">
                  {m.role &&
                    (group.categoryLevel1 === "Mentoring" || group.categoryLevel1 === "PvM") && (
                      <span
                        className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${highlighted ? "bg-amber-500/30 text-amber-200" : "bg-slate-600/80 text-slate-200"}`}
                      >
                        {m.role}
                      </span>
                    )}
                  {group.categoryLevel1 === "PvM" && m.redlinePoints != null && (
                    <PvMStatBadge
                      icon="ix:sword-swing"
                      value={m.redlinePoints}
                      highlighted={highlighted}
                    />
                  )}
                  {group.categoryLevel1 === "PvM" && m.chainLinkSlots != null && (
                    <PvMStatBadge
                      icon="si:link-fill"
                      value={m.chainLinkSlots}
                      highlighted={highlighted}
                    />
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
        {isLoggedIn && isMember && group.applicants.length > 0 && (
          <div>
            <p
              className={`text-[11px] font-semibold uppercase tracking-wide ${highlighted ? "text-amber-300/80" : "text-slate-400"}`}
            >
              Applicants ({group.applicants.length})
            </p>
            <ul
              className={`mt-1 flex flex-col gap-2 text-xs ${highlighted ? "text-amber-100/80" : "text-slate-300"}`}
            >
              {group.applicants.map((a) => {
                const acceptDecline = isCreator ? (
                  <span className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={async () => {
                        setActingId(`${group.id}:accept:${a.discordId}`);
                        try {
                          const res = await fetch(`/api/groups/${group.id}/applications`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              applicantDiscordId: a.discordId,
                              action: "accept"
                            })
                          });
                          if (!res.ok) {
                            const data = await res.json().catch(() => ({}));
                            throw new Error(data.error || "Failed to accept applicant");
                          }
                          refresh();
                        } catch (err: any) {
                          setError(err.message ?? "Failed to accept applicant");
                          refresh();
                        } finally {
                          setActingId(null);
                        }
                      }}
                      className="rounded-lg bg-emerald-500 px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-emerald-400 disabled:opacity-60"
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={async () => {
                        setActingId(`${group.id}:decline:${a.discordId}`);
                        try {
                          const res = await fetch(`/api/groups/${group.id}/applications`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              applicantDiscordId: a.discordId,
                              action: "decline"
                            })
                          });
                          if (!res.ok) {
                            const data = await res.json().catch(() => ({}));
                            throw new Error(data.error || "Failed to decline applicant");
                          }
                          refresh();
                        } catch (err: any) {
                          setError(err.message ?? "Failed to decline applicant");
                          refresh();
                        } finally {
                          setActingId(null);
                        }
                      }}
                      className="rounded-lg bg-red-600/80 px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-red-500 disabled:opacity-60"
                    >
                      Decline
                    </button>
                  </span>
                ) : null;

                return (
                  <li
                    key={a.discordId}
                    className={`rounded-lg border ${highlighted ? "border-amber-500/25 bg-amber-950/15" : "border-white/10 bg-slate-950/40"}`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 px-2 py-1.5">
                      <div className="min-w-0 flex-1">
                        <GroupPersonLabel name={a.name} />
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        {group.requireRoleSelection && a.role && (
                          <span
                            className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${highlighted ? "bg-amber-500/30 text-amber-200" : "bg-slate-600/80 text-slate-200"}`}
                          >
                            {a.role}
                          </span>
                        )}
                        {group.categoryLevel1 === "PvM" && a.redlinePoints != null && (
                          <PvMStatBadge
                            icon="ix:sword-swing"
                            value={a.redlinePoints}
                            highlighted={highlighted}
                          />
                        )}
                        {group.categoryLevel1 === "PvM" && a.chainLinkSlots != null && (
                          <PvMStatBadge
                            icon="si:link-fill"
                            value={a.chainLinkSlots}
                            highlighted={highlighted}
                          />
                        )}
                        {acceptDecline}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      <div className="mt-auto pt-3">
        {isLoggedIn ? (
          isCreator ? (
            <div className="flex flex-col gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  setActingId(`${group.id}:availability`);
                  try {
                    const res = await fetch(`/api/groups/${group.id}/availability`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ available: !group.available })
                    });
                    if (!res.ok) {
                      const data = await res.json().catch(() => ({}));
                      throw new Error(data.error || "Failed to change availability");
                    }
                    refresh();
                  } catch (err: any) {
                    setError(err.message ?? "Failed to change availability");
                    refresh();
                  } finally {
                    setActingId(null);
                  }
                }}
                className={
                  group.available
                    ? "inline-flex w-full items-center justify-center rounded-xl bg-slate-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-600 disabled:opacity-60"
                    : "inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60"
                }
              >
                {availabilityBusy ? "Toggling availability…" : group.available ? "Make unavailable" : "Make available"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => handleDelete(group.id)}
                className="inline-flex w-full items-center justify-center rounded-xl bg-red-600/80 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-500 disabled:opacity-60"
              >
                {deleteBusy ? "Deleting…" : "Delete group"}
              </button>
            </div>
          ) : isMember ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => handleLeave(group.id)}
              className={
                highlighted
                  ? "inline-flex w-full items-center justify-center rounded-xl border border-amber-400/60 bg-amber-900/40 px-3 py-1.5 text-xs font-semibold text-amber-100 transition hover:bg-amber-800/50 disabled:opacity-60"
                  : "inline-flex w-full items-center justify-center rounded-xl border border-slate-500 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-700 disabled:opacity-60"
              }
            >
              {leaveBusy ? "Leaving…" : "Leave"}
            </button>
          ) : isInAnyGroup ? null : !showApplyActions ? (
            <div className="text-xs text-slate-400">Unavailable</div>
          ) : (
            <button
              type="button"
              disabled={busy || !canApplyMore}
              onClick={() => {
                if (!isApplicant && groupNeedsApplyPrepModal(group)) {
                  onOpenApplyPrep(group);
                } else {
                  void handleApply(group.id, isApplicant ? "withdraw" : "apply");
                }
              }}
              className={
                isApplicant
                  ? "inline-flex w-full items-center justify-center rounded-xl bg-fuchsia-600 px-3 py-1.5 text-xs font-semibold text-white shadow shadow-fuchsia-500/40 transition hover:bg-fuchsia-500 disabled:opacity-60"
                  : "inline-flex w-full items-center justify-center rounded-xl bg-indigo-500 px-3 py-1.5 text-xs font-semibold text-white shadow shadow-indigo-500/40 transition group-hover:bg-indigo-400 disabled:opacity-60"
              }
            >
              {applyBusy
                ? isApplicant
                  ? "Withdrawing…"
                  : "Applying…"
                : isApplicant
                  ? "Withdraw"
                  : "Apply"}
            </button>
          )
        ) : null}
      </div>
    </article>
  );
}
