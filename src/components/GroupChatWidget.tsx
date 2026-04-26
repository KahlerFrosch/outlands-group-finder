"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import Pusher from "pusher-js";
import {
  groupChatChannelName,
  GROUP_CHAT_FETCH_LIMIT,
  MAX_GROUP_CHAT_BODY_LENGTH,
  type GroupChatMessageDto
} from "@/lib/group-chat-shared";

type GroupChatWidgetProps = {
  groupId: string;
  discordId: string;
  className?: string;
};

function formatChatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export function GroupChatWidget({ groupId, discordId, className = "" }: GroupChatWidgetProps) {
  const [messages, setMessages] = useState<GroupChatMessageDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const listEndRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(async () => {
    setLoadError(null);
    try {
      const res = await fetch(`/api/groups/${groupId}/chat`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Could not load chat");
      }
      const list = data.messages as GroupChatMessageDto[] | undefined;
      setMessages(Array.isArray(list) ? list : []);
    } catch (e: unknown) {
      setLoadError(e instanceof Error ? e.message : "Could not load chat");
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    setLoading(true);
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    if (!key || !cluster) return;

    const pusher = new Pusher(key, {
      cluster,
      authEndpoint: "/api/pusher/auth",
      authTransport: "ajax"
    });

    const channelName = groupChatChannelName(groupId);
    const channel = pusher.subscribe(channelName);

    channel.bind("message", (data: GroupChatMessageDto) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === data.id)) return prev;
        const next = [...prev, data];
        return next.length > GROUP_CHAT_FETCH_LIMIT
          ? next.slice(-GROUP_CHAT_FETCH_LIMIT)
          : next;
      });
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(channelName);
      pusher.disconnect();
    };
  }, [groupId]);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    if (key && cluster) return;
    const id = window.setInterval(() => {
      loadMessages();
    }, 5000);
    return () => clearInterval(id);
  }, [loadMessages]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setSendError(null);
    try {
      const res = await fetch(`/api/groups/${groupId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Could not send");
      }
      const msg = data.message as GroupChatMessageDto | undefined;
      if (msg) {
        setMessages((prev) =>
          prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]
        );
      }
      setDraft("");
    } catch (err: unknown) {
      setSendError(err instanceof Error ? err.message : "Could not send");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className={`flex h-full min-h-0 w-full max-h-full flex-col overflow-hidden rounded-2xl border border-indigo-500/25 bg-slate-900/70 shadow-lg shadow-black/30 ${className}`}
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-white/10 px-3 py-2.5">
        <Icon icon="mdi:forum-outline" className="text-lg text-indigo-300/90" aria-hidden />
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-200/95">
          Group chat
        </span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-2.5 py-2">
          {loading ? (
            <p className="px-1 text-xs text-slate-500">Loading messages…</p>
          ) : loadError ? (
            <p className="px-1 text-xs text-red-300/90">{loadError}</p>
          ) : messages.length === 0 ? (
            <p className="px-1 text-xs text-slate-500">No messages yet. Say hello!</p>
          ) : (
            messages.map((m) => {
              const mine = m.discordId === discordId;
              return (
                <div
                  key={m.id}
                  className={`w-full rounded-lg px-2 py-1.5 text-xs ${
                    mine
                      ? "bg-indigo-600/25 text-slate-100"
                      : "bg-slate-800/80 text-slate-200"
                  }`}
                >
                  <div className="mb-0.5 flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0">
                    <span className="font-semibold text-slate-100/95">{m.authorName}</span>
                    <span className="text-[10px] text-slate-500">{formatChatTime(m.createdAt)}</span>
                  </div>
                  <p className="whitespace-pre-wrap break-words text-[13px] leading-snug text-slate-200/95">
                    {m.body}
                  </p>
                </div>
              );
            })
          )}
          <div ref={listEndRef} />
        </div>

        {sendError && (
          <p className="shrink-0 border-t border-white/5 px-2.5 py-1 text-[11px] text-red-300/90">
            {sendError}
          </p>
        )}

        <form
          onSubmit={onSubmit}
          className="flex shrink-0 gap-1.5 border-t border-white/10 p-2"
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={MAX_GROUP_CHAT_BODY_LENGTH}
            placeholder="Message the group…"
            disabled={sending || Boolean(loadError)}
            className="min-w-0 flex-1 rounded-lg border border-white/10 bg-slate-950/80 px-2 py-1.5 text-xs text-slate-100 outline-none placeholder:text-slate-600 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-500/40 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={sending || !draft.trim() || Boolean(loadError)}
            className="shrink-0 rounded-lg bg-indigo-600 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
