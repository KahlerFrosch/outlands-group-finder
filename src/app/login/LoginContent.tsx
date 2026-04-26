"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";

export function LoginContent() {
  return (
    <div className="mx-auto max-w-md space-y-6 rounded-2xl border border-white/10 bg-slate-900/60 p-6 shadow-lg shadow-black/40">
      <h2 className="text-lg font-semibold tracking-tight">Sign in with Discord</h2>

      <p className="text-sm text-slate-300">
        Click the button below to sign in with your Discord account. Your Discord name and profile
        picture will be used as your identity on this site.
      </p>
      <p className="text-xs text-slate-400">
        After authorizing the app on Discord, you will be redirected back here as a logged-in user.
      </p>

      <button
        type="button"
        onClick={() => signIn("discord", { callbackUrl: "/" })}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow shadow-indigo-500/40 transition hover:bg-indigo-400"
      >
        <span>Continue with Discord</span>
      </button>

      <div className="flex items-center justify-between text-xs text-slate-400">
        <Link href="/" className="hover:text-slate-200 hover:underline">
          &larr; Back to home
        </Link>
        <span>Uses Discord OAuth2 via next-auth.</span>
      </div>
    </div>
  );
}
