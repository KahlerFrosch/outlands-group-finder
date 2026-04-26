"use client";

import { useId } from "react";
import {
  CHAIN_LINK_SLOTS_BASE_MAX,
  parseNonNegativeWholeNumberString,
  isValidChainLinkSlotsValue
} from "@/lib/groups-shared";

export function AdditionalInputRequiredModal({
  open,
  onClose,
  onConfirm,
  confirmDisabled,
  confirmBusy,
  disableBack,
  needsRole,
  roleOptions,
  roleValue,
  onRoleChange,
  needsRedlinePoints,
  needsChainLinkSlots,
  chainLinkSlotsMax,
  redlinePointsValue,
  chainLinkSlotsValue,
  onRedlinePointsChange,
  onChainLinkSlotsChange,
  error
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  confirmDisabled: boolean;
  confirmBusy: boolean;
  disableBack: boolean;
  needsRole: boolean;
  roleOptions: readonly string[];
  roleValue: string;
  onRoleChange: (value: string) => void;
  needsRedlinePoints: boolean;
  needsChainLinkSlots: boolean;
  /** Upper bound for chain link slots (from redline-based rules). Ignored when `needsChainLinkSlots` is false. */
  chainLinkSlotsMax?: number;
  redlinePointsValue: string;
  chainLinkSlotsValue: string;
  onRedlinePointsChange: (value: string) => void;
  onChainLinkSlotsChange: (value: string) => void;
  error?: string | null;
}) {
  const roleId = useId();
  const redlineId = useId();
  const chainId = useId();
  const chainMax =
    needsChainLinkSlots ? (chainLinkSlotsMax ?? CHAIN_LINK_SLOTS_BASE_MAX) : CHAIN_LINK_SLOTS_BASE_MAX;
  if (!open) return null;

  const redlineTrimmed = redlinePointsValue.trim();
  const redlineInputInvalid =
    needsRedlinePoints &&
    redlineTrimmed !== "" &&
    parseNonNegativeWholeNumberString(redlinePointsValue) === undefined;

  const chainTrimmed = chainLinkSlotsValue.trim();
  let chainInputInvalid = false;
  if (needsChainLinkSlots && chainTrimmed !== "") {
    const parsedChain = parseNonNegativeWholeNumberString(chainLinkSlotsValue);
    const redlineForCap = needsRedlinePoints
      ? parseNonNegativeWholeNumberString(redlinePointsValue) ?? null
      : null;
    chainInputInvalid =
      parsedChain === undefined ||
      !isValidChainLinkSlotsValue(parsedChain, redlineForCap);
  }

  const inputClassNormal =
    "w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/40";
  const inputClassInvalid =
    "w-full rounded-xl border-2 border-red-500/70 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-500/35";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Additional input required"
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900 p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm font-semibold text-slate-200">Additional input required:</p>

        {needsRole && (
          <div className="mt-4 space-y-1">
            <label
              htmlFor={roleId}
              className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400"
            >
              YOUR ROLE
            </label>
            <select
              id={roleId}
              value={roleValue}
              onChange={(e) => onRoleChange(e.target.value)}
              className={inputClassNormal}
            >
              <option value="" disabled hidden>
                Select a role...
              </option>
              {roleOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}

        {needsRedlinePoints && (
          <div className="mt-4 space-y-1">
            <label
              htmlFor={redlineId}
              className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400"
            >
              REDLINE POINTS
            </label>
            <input
              id={redlineId}
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={redlinePointsValue}
              onChange={(e) => onRedlinePointsChange(e.target.value)}
              placeholder="0"
              aria-invalid={redlineInputInvalid}
              className={redlineInputInvalid ? inputClassInvalid : inputClassNormal}
            />
          </div>
        )}

        {needsChainLinkSlots && (
          <div className="mt-4 space-y-1">
            <label
              htmlFor={chainId}
              className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400"
            >
              CHAIN LINK SLOTS
            </label>
            <input
              id={chainId}
              type="number"
              inputMode="numeric"
              min={0}
              max={chainMax}
              step={1}
              value={chainLinkSlotsValue}
              onChange={(e) => onChainLinkSlotsChange(e.target.value)}
              placeholder="0"
              aria-invalid={chainInputInvalid}
              className={chainInputInvalid ? inputClassInvalid : inputClassNormal}
            />
          </div>
        )}

        {error ? <p className="mt-3 text-xs text-red-400">{error}</p> : null}

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            disabled={confirmDisabled}
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-indigo-500 px-3 py-2 text-sm font-semibold text-white shadow shadow-indigo-500/40 transition hover:bg-indigo-400 disabled:opacity-60"
          >
            {confirmBusy ? "Continuing…" : "Continue"}
          </button>
          <button
            type="button"
            disabled={disableBack}
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-500 bg-slate-800 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-700 disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
