
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Pusher from "pusher-js";

type ContentType = "PvM" | "PvP" | "Mentoring" | "Roleplay" | "Custom";

type GroupMember = {
  discordId: string;
  name: string;
  isCreator: boolean;
  role: string | null;
};

type Group = {
  id: string;
  contentType: ContentType;
  contentSubType: string | null;
  contentTertiary: string | null;
  description: string;
  members: GroupMember[];
  createdAt: string;
};

function loadGroups(): Promise<Group[]> {
  return fetch("/api/groups").then((res) => {
    if (!res.ok) throw new Error("Failed to load groups");
    return res.json();
  });
}

export default function HomePage() {
  const { data: session } = useSession();
  const isLoggedIn = Boolean(session?.user);
  const discordId = (session?.user as any)?.discordId as string | undefined;

  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);
  const [joinModalGroupId, setJoinModalGroupId] = useState<string | null>(null);
  const [joinModalRole, setJoinModalRole] = useState<string>("Guide");

  const refresh = () => {
    loadGroups()
      .then((data) => {
        setGroups(data);
        setError(null);
      })
      .catch(() => setError("Could not load groups. Please try again later."));
  };

  useEffect(() => {
    let isMounted = true;
    loadGroups()
      .then((data) => {
        if (isMounted) setGroups(data);
      })
      .catch(() => {
        if (isMounted) setError("Could not load groups. Please try again later.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Real-time: SSE when supported (single-server),
  // Pusher for serverless (Vercel), plus polling fallback as a safety net
  useEffect(() => {
    // SSE (mainly useful in local dev / single-instance hosting)
    const eventSource = new EventSource("/api/groups/stream");
    eventSource.onmessage = () => {
      refresh();
    };
    eventSource.onerror = () => {
      eventSource.close();
    };

    // Pusher (works across serverless instances)
    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    let pusher: Pusher | null = null;
    let channel: any = null;

    if (pusherKey && pusherCluster) {
      pusher = new Pusher(pusherKey, { cluster: pusherCluster });
      channel = pusher.subscribe("groups");
      channel.bind("updated", () => {
        refresh();
      });
    }

    // Polling fallback (ensures eventual consistency even if real-time fails)
    const pollInterval = setInterval(refresh, 25_000);

    return () => {
      eventSource.close();
      if (channel && pusher) {
        channel.unbind_all();
        pusher.unsubscribe("groups");
        pusher.disconnect();
      }
      clearInterval(pollInterval);
    };
  }, []);

  const handleJoin = async (groupId: string, role?: string) => {
    if (!discordId) return;
    setActingId(groupId);
    try {
      const res = await fetch(`/api/groups/${groupId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: role ? JSON.stringify({ role }) : undefined
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to join");
      }
      refresh();
    } catch (err: any) {
      setError(err.message ?? "Failed to join group");
      refresh();
    } finally {
      setActingId(null);
    }
  };

  const handleLeave = async (groupId: string) => {
    if (!discordId) return;
    setActingId(groupId);
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
    setActingId(groupId);
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
  const availableGroups = myGroup
    ? groups.filter((g) => g.id !== myGroup.id)
    : groups;

  const renderGroupCard = (group: Group, highlighted: boolean) => {
    const isCreator = Boolean(
      discordId && group.members.some((m) => m.isCreator && m.discordId === discordId)
    );
    const isMember = Boolean(
      discordId && group.members.some((m) => m.discordId === discordId)
    );
    const isInAnyGroup = Boolean(
      discordId && groups.some((g) => g.members.some((m) => m.discordId === discordId))
    );
    const busy = actingId === group.id;

    return (
      <article
        key={group.id}
        className={
          highlighted
            ? "group flex min-h-0 flex-col rounded-2xl border-2 border-amber-400/70 bg-amber-950/40 p-4 shadow-lg shadow-amber-500/10 transition hover:border-amber-400 hover:bg-amber-950/50"
            : "group flex min-h-0 h-full flex-col rounded-2xl border border-white/10 bg-slate-900/60 p-4 transition hover:border-indigo-400/80 hover:bg-slate-900"
        }
      >
        <h4 className="mb-2 text-sm font-semibold leading-tight">
          {group.contentType === "Custom"
            ? "Custom"
            : group.contentType === "Roleplay" || group.contentType === "Mentoring"
              ? group.contentType
              : group.contentTertiary
                ? `${group.contentType} · ${group.contentSubType} · ${group.contentTertiary}`
                : group.contentSubType
                  ? `${group.contentType} · ${group.contentSubType}`
                  : `${group.contentType} group`}
        </h4>
        <p
          className={`mb-2 h-[3lh] text-justify text-xs line-clamp-3 overflow-hidden ${group.description ? (highlighted ? "text-amber-100/90" : "text-slate-300") : (highlighted ? "text-amber-200/50" : "text-slate-500")}`}
        >
          {group.description || "No description."}
        </p>
        <div className="mb-2">
          <p className={`text-[11px] font-semibold uppercase tracking-wide ${highlighted ? "text-amber-300/80" : "text-slate-400"}`}>
            Members ({group.members.length})
          </p>
          <ul className={`mt-1 flex flex-col gap-1 text-xs ${highlighted ? "text-amber-100/80" : "text-slate-300"}`}>
            {[...group.members]
              .sort((a, b) => Number(b.isCreator) - Number(a.isCreator))
              .map((m) => (
              <li key={m.discordId} className="flex items-center gap-1.5 flex-wrap">
                {m.isCreator && (
                  <span className="text-amber-400" title="Group creator" aria-label="Creator">
                    ♔
                  </span>
                )}
                <span>{m.name}</span>
                {group.contentType === "Mentoring" && m.role && (
                  <span
                    className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${highlighted ? "bg-amber-500/30 text-amber-200" : "bg-slate-600/80 text-slate-200"}`}
                  >
                    {m.role}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-auto pt-3">
          {isLoggedIn ? (
            isCreator ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => handleDelete(group.id)}
                className="inline-flex w-full items-center justify-center rounded-xl bg-red-600/80 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-500 disabled:opacity-60"
              >
                {busy ? "Deleting…" : "Delete group"}
              </button>
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
                {busy ? "Leaving…" : "Leave"}
              </button>
            ) : isInAnyGroup ? null : (
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  group.contentType === "Mentoring"
                    ? (setJoinModalRole("Guide"), setJoinModalGroupId(group.id))
                    : handleJoin(group.id)
                }
                className="inline-flex w-full items-center justify-center rounded-xl bg-indigo-500 px-3 py-1.5 text-xs font-semibold text-white shadow shadow-indigo-500/40 transition group-hover:bg-indigo-400 disabled:opacity-60"
              >
                {busy ? "Joining…" : "Join"}
              </button>
            )
          ) : null}
        </div>
      </article>
    );
  };

  const joinModalGroup = joinModalGroupId ? groups.find((g) => g.id === joinModalGroupId) : null;
  const onConfirmJoinWithRole = async () => {
    if (!joinModalGroupId) return;
    await handleJoin(joinModalGroupId, joinModalRole);
    setJoinModalGroupId(null);
  };

  return (
    <>
    <div className="space-y-8">
      {myGroup && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-400/90">
            Your group
          </h3>
          <div className="flex justify-center">
            <div className="w-full max-w-md">
              {renderGroupCard(myGroup, true)}
            </div>
          </div>
        </section>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
              Available groups
            </h3>
          </div>
          {isLoggedIn && !myGroup && (
            <Link
              href="/groups/new"
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
                {availableGroups.map((g) => renderGroupCard(g, false))}
              </div>
            )}
          </>
        )}
      </section>
    </div>

    {joinModalGroupId && joinModalGroup && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        onClick={() => setJoinModalGroupId(null)}
        role="dialog"
        aria-modal="true"
        aria-labelledby="join-modal-title"
      >
        <div
          className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900 p-5 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 id="join-modal-title" className="text-sm font-semibold uppercase tracking-wide text-slate-200">
            Join as…
          </h3>
          <div className="mt-4">
            <select
              value={joinModalRole}
              onChange={(e) => setJoinModalRole(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/40"
            >
              <option value="Guide">Guide</option>
              <option value="Student">Student</option>
            </select>
          </div>
          <div className="mt-5 flex gap-3">
            <button
              type="button"
              disabled={actingId === joinModalGroupId}
              onClick={onConfirmJoinWithRole}
              className="flex-1 rounded-xl bg-indigo-500 px-3 py-2 text-sm font-semibold text-white shadow shadow-indigo-500/40 transition hover:bg-indigo-400 disabled:opacity-60"
            >
              {actingId === joinModalGroupId ? "Joining…" : "Join"}
            </button>
            <button
              type="button"
              onClick={() => setJoinModalGroupId(null)}
              className="flex-1 rounded-xl border border-slate-500 bg-slate-800 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-700"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

