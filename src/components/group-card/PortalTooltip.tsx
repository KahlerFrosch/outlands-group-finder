"use client";

import { useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";

type PortalTooltipProps = {
  anchorRef: React.RefObject<HTMLElement | null>;
  id: string;
  open: boolean;
  children: React.ReactNode;
  className?: string;
  maxWidthPx?: number;
  gapPx?: number;
  zIndex?: number;
};

function clampCenterX(centerX: number, tooltipWidthEstimate: number): number {
  const pad = 8;
  const half = tooltipWidthEstimate / 2;
  return Math.max(pad + half, Math.min(centerX, window.innerWidth - pad - half));
}

export function PortalTooltip({
  anchorRef,
  id,
  open,
  children,
  className = "",
  maxWidthPx = 280,
  gapPx = 6,
  zIndex = 100
}: PortalTooltipProps) {
  const [pos, setPos] = useState<{
    left: number;
    top: number;
    transform: string;
  } | null>(null);

  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    const el = anchorRef.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      const centerX = clampCenterX(rect.left + rect.width / 2, maxWidthPx);
      const estHeight = 72;
      const topAbove = rect.top - gapPx;
      let top: number;
      let transform: string;
      if (topAbove - estHeight >= 8) {
        top = topAbove;
        transform = "translate(-50%, -100%)";
      } else {
        top = rect.bottom + gapPx;
        transform = "translateX(-50%)";
      }
      setPos({ left: centerX, top, transform });
    };

    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [anchorRef, gapPx, maxWidthPx, open]);

  if (!open || !pos || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <span
      id={id}
      role="tooltip"
      className={`pointer-events-none fixed w-max max-w-[min(280px,calc(100vw-2rem))] rounded-md border border-white/15 bg-slate-900 px-2.5 py-2 text-[10px] leading-snug text-slate-200 shadow-xl ring-1 ring-white/10 transition-opacity duration-150 ${className}`}
      style={{
        left: pos.left,
        top: pos.top,
        transform: pos.transform,
        zIndex
      }}
    >
      {children}
    </span>,
    document.body
  );
}
