"use client";

import { Icon } from "@iconify/react";
import { useId, useRef, useState } from "react";
import { PortalTooltip } from "./PortalTooltip";

const DELETION_TIMER_HELP =
  "Group will be deleted if you don't interact with the group before this timer runs out. Click the timer to manually reset it.";

type GroupDeletionTimerButtonProps = {
  disabled: boolean;
  formattedTimer: string;
  onReset: () => void | Promise<void>;
};

/**
 * Leader-only countdown: portal tooltip so parent overflow on the group card does not clip it.
 */
export function GroupDeletionTimerButton({
  disabled,
  formattedTimer,
  onReset
}: GroupDeletionTimerButtonProps) {
  const tipId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);
  const show = hover || focus;

  return (
    <>
      <PortalTooltip anchorRef={buttonRef} id={tipId} open={show}>
        {DELETION_TIMER_HELP}
      </PortalTooltip>
      <div
        className="relative inline-flex"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <button
          ref={buttonRef}
          type="button"
          disabled={disabled}
          aria-describedby={show ? tipId : undefined}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          onClick={(e) => {
            e.stopPropagation();
            void onReset();
          }}
          className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/30 px-2 py-0.5 text-[11px] font-mono text-slate-100 outline-none transition hover:border-indigo-400 hover:bg-black/50 focus-visible:ring-2 focus-visible:ring-indigo-500/50 disabled:opacity-60"
        >
          <Icon
            icon="tabler:clock"
            className="h-3.5 w-3.5 shrink-0 text-slate-300"
            aria-hidden
          />
          <span>{formattedTimer}</span>
        </button>
      </div>
    </>
  );
}
