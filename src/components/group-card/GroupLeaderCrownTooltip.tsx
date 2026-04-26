"use client";

import { Icon } from "@iconify/react";
import { useEffect, useId, useRef, useState } from "react";
import { PortalTooltip } from "./PortalTooltip";

export function GroupLeaderCrownTooltip() {
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

  return (
    <div
      className="relative inline-flex shrink-0"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <PortalTooltip anchorRef={buttonRef} id={tipId} open={show}>
        Group Leader
      </PortalTooltip>
      <button
        ref={buttonRef}
        type="button"
        className="inline-flex rounded-md p-0.5 text-inherit outline-none transition hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-indigo-500/50"
        aria-describedby={show ? tipId : undefined}
        aria-expanded={show}
        aria-label="Group Leader"
        onClick={(e) => {
          e.stopPropagation();
          setPinned((p) => !p);
        }}
      >
        <Icon icon="tabler:crown-filled" className="h-3.5 w-3.5 shrink-0" aria-hidden />
      </button>
    </div>
  );
}
