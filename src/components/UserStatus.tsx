
"use client";

import { useSession, signIn, signOut } from "next-auth/react";

export function UserStatus() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="h-8 w-24 animate-pulse rounded-full bg-slate-800/60" />
    );
  }

  if (!session || !session.user) {
    return (
      <button
        type="button"
        onClick={() => signIn("discord", { callbackUrl: "/" })}
        className="inline-flex items-center gap-2 rounded-full border border-indigo-400/70 bg-slate-900/60 px-3 py-1 text-xs font-medium text-indigo-100 shadow-sm hover:bg-slate-800"
      >
        <span className="h-2 w-2 rounded-full bg-emerald-400" />
        <span>Sign in with Discord</span>
      </button>
    );
  }

  const name = session.user.name ?? "Discord user";
  const image = session.user.image;

  return (
    <div className="flex items-center gap-2 text-xs text-slate-200">
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        className="rounded-full border border-slate-600/70 bg-slate-900/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-300 hover:border-red-400/80 hover:text-red-200"
      >
        Log out
      </button>

      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/60 px-2 py-1">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={name}
            className="h-6 w-6 rounded-full border border-slate-600 object-cover"
          />
        ) : (
          <div className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-600 bg-slate-800 text-[9px] font-semibold uppercase text-slate-300">
            {name.charAt(0)}
          </div>
        )}
        <span className="max-w-[120px] truncate text-[11px] font-medium">
          {name}
        </span>
      </div>
    </div>
  );
}

