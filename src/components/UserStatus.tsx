"use client";

import { Icon } from "@iconify/react";
import { useEffect, useRef, useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";

/** Matches `duration-300` on the menu panel collapse. */
const MENU_PANEL_TRANSITION_MS = 300;

/** Invisible row matching the menu so column width = max(menu, trigger). */
function UserMenuWidthProbe() {
  return (
    <div
      className="pointer-events-none flex h-0 flex-col gap-0 overflow-hidden opacity-0"
      aria-hidden
    >
      <div className="flex items-center gap-2 whitespace-nowrap py-2 pl-3 pr-8 text-sm text-slate-200">
        <Icon icon="tabler:power" className="shrink-0 text-lg text-slate-400" aria-hidden />
        Log out
      </div>
    </div>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function UserStatus() {
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  /** Rounded trigger bottom + border: stay "open" shape until panel has finished folding. */
  const [menuShellExpanded, setMenuShellExpanded] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (menuOpen) {
      setMenuShellExpanded(true);
      return;
    }
    const id = window.setTimeout(
      () => setMenuShellExpanded(false),
      MENU_PANEL_TRANSITION_MS
    );
    return () => window.clearTimeout(id);
  }, [menuOpen]);

  useEffect(() => {
    if (!logoutConfirmOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLogoutConfirmOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [logoutConfirmOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  if (status === "loading") {
    return (
      <div className="inline-flex max-w-[min(100vw-2rem,100%)] flex-col items-stretch">
        <UserMenuWidthProbe />
        <div className="h-11 w-full animate-pulse rounded-lg border border-white/10 bg-slate-800/60" />
      </div>
    );
  }

  if (!session || !session.user) {
    return (
      <div className="inline-flex max-w-[min(100vw-2rem,100%)]">
        <div className="overflow-hidden rounded-lg border border-white/10 bg-slate-900 shadow-xl shadow-black/40">
          <button
            type="button"
            onClick={() => signIn("discord", { callbackUrl: "/" })}
            className="flex h-11 items-center gap-1.5 px-2 text-left text-xs font-semibold leading-tight text-slate-100 transition-colors hover:bg-slate-800 active:bg-slate-800/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500/50"
          >
            <Icon
              icon="tabler:brand-discord-filled"
              className="h-5 w-5 shrink-0 text-[#5865F2]"
              aria-hidden
            />
            <span className="whitespace-nowrap">Log in with Discord</span>
          </button>
        </div>
      </div>
    );
  }

  const name = session.user.name ?? "Discord user";
  const image = session.user.image;

  return (
    <div
      className="relative inline-flex max-w-[min(100vw-2rem,100%)] w-max flex-col items-stretch"
      ref={containerRef}
    >
      <UserMenuWidthProbe />
      {logoutConfirmOpen ? (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/55 p-4"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setLogoutConfirmOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-confirm-title"
            className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900 p-5 shadow-xl shadow-black/50"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <h2
              id="logout-confirm-title"
              className="text-base font-semibold tracking-tight text-slate-100"
            >
              Confirm log out
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              You will need to sign in with Discord again to use Outlands Group Finder.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-red-600/90 px-3 py-2 text-sm font-semibold text-white shadow shadow-red-600/35 transition hover:bg-red-500"
                onClick={() => {
                  setLogoutConfirmOpen(false);
                  void signOut({ callbackUrl: "/" });
                }}
              >
                <Icon icon="tabler:power" className="text-lg" aria-hidden />
                Log out
              </button>
              <button
                type="button"
                className="flex-1 rounded-xl border border-slate-500 bg-slate-800 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-700"
                onClick={() => setLogoutConfirmOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <div
        className={`w-full overflow-hidden border border-white/10 bg-slate-900 shadow-xl shadow-black/40 ${
          menuShellExpanded ? "rounded-t-lg border-b-transparent" : "rounded-lg"
        }`}
      >
        <button
          type="button"
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          onClick={() => setMenuOpen((o) => !o)}
          className="flex w-full items-center gap-1.5 px-2 py-2 text-left transition-colors hover:bg-slate-800 active:bg-slate-800/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500/50"
        >
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt=""
              className="h-7 w-7 shrink-0 rounded-full border border-slate-600 object-cover"
            />
          ) : (
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-600 bg-slate-800 text-[9px] font-semibold uppercase text-slate-300">
              {name.charAt(0)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-semibold leading-tight text-slate-100">
              {name}
            </div>
          </div>
          <ChevronDownIcon
            className={`h-3.5 w-3.5 shrink-0 text-slate-500 transition-transform duration-300 ${menuOpen ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      <div
        className={`absolute left-0 right-0 top-full z-[100] grid overflow-hidden transition-[grid-template-rows] duration-300 ease-out ${
          menuOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
        aria-hidden={!menuOpen}
      >
        <div className="min-h-0">
          <div
            className={`w-full rounded-b-lg border-x border-b border-white/10 bg-slate-900 shadow-xl shadow-black/40 ${
              !menuOpen ? "pointer-events-none" : ""
            }`}
          >
            <div
              className="flex w-full flex-col border-t border-white/10 py-1"
              role="menu"
            >
              <button
                type="button"
                role="menuitem"
                tabIndex={menuOpen ? undefined : -1}
                className="flex w-full items-center gap-2 whitespace-nowrap py-2 pl-3 pr-8 text-left text-sm text-slate-200 transition hover:bg-slate-800"
                onClick={() => {
                  setMenuOpen(false);
                  setLogoutConfirmOpen(true);
                }}
              >
                <Icon icon="tabler:power" className="shrink-0 text-lg text-slate-400" aria-hidden />
                Log out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
