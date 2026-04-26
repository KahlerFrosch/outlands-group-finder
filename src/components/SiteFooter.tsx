"use client";

import { Icon } from "@iconify/react";

export function SiteFooter({ discordServerUrl }: { discordServerUrl: string | null }) {
  return (
    <footer className="mt-8 flex items-center justify-start border-t border-white/10 pt-4 text-xs text-slate-500">
      {discordServerUrl ? (
        <a
          href={discordServerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 hover:text-slate-300 hover:underline"
        >
          <Icon
            icon="tabler:brand-discord-filled"
            className="shrink-0 text-base text-current"
            aria-hidden
          />
          Join Discord
        </a>
      ) : (
        <span className="inline-flex items-center gap-1.5 text-slate-600">
          <Icon
            icon="tabler:brand-discord-filled"
            className="shrink-0 text-base text-current"
            aria-hidden
          />
          Join Discord
        </span>
      )}
    </footer>
  );
}
