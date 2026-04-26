"use client";

import { Icon } from "@iconify/react";
import { useEffect, useId, useRef, useState } from "react";
import { PortalTooltip } from "./PortalTooltip";

export function VoiceChannelSettingTooltip({
  kind,
  highlighted
}: {
  kind: "listen" | "speak";
  highlighted: boolean;
}) {
  const tipId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [hover, setHover] = useState(false);
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    if (!pinned) return;
    const onDoc = (e: MouseEvent) => {
      if (buttonRef.current?.contains(e.target as Node)) return;
      setPinned(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [pinned]);

  const show = hover || pinned;
  const listen = kind === "listen";
  const btnClass = highlighted
    ? "text-amber-200/95 hover:bg-amber-500/20"
    : "text-slate-400 hover:bg-white/10 hover:text-slate-200";

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <PortalTooltip anchorRef={buttonRef} id={tipId} open={show}>
        {listen ? (
          <>
            Ability to <strong className="font-semibold text-slate-100">listen</strong> in voice
            channel is required.
          </>
        ) : (
          <>
            Ability to <strong className="font-semibold text-slate-100">speak</strong> in voice
            channel is required.
          </>
        )}
      </PortalTooltip>
      <button
        ref={buttonRef}
        type="button"
        className={`inline-flex rounded-md p-0.5 outline-none transition focus-visible:ring-2 focus-visible:ring-indigo-500/50 ${btnClass}`}
        aria-describedby={show ? tipId : undefined}
        aria-expanded={show}
        aria-label={
          listen
            ? "Voice channel: listening required"
            : "Voice channel: speaking required"
        }
        onClick={(e) => {
          e.stopPropagation();
          setPinned((p) => !p);
        }}
      >
        <Icon
          icon={listen ? "tabler:headphones" : "tabler:microphone"}
          className="size-4 shrink-0"
          aria-hidden
        />
      </button>
    </div>
  );
}
