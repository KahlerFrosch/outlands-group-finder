"use client";

import { FormEvent, useState, useMemo, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type CategoryLevel1,
  type CategoryLevel2,
  type CategoryLevel3,
  QUEST_SUBTYPES,
  MENTORING_ROLES,
  PVM_APPLICANT_ROLES,
  CONTENT_SUBTYPES,
  PVM_TERTIARY_OPTIONS,
  PVP_TERTIARY_OPTIONS,
  PVM_DESCRIPTION_REQUIRED_SUBTYPES,
  parseNonNegativeWholeNumberString,
  isValidChainLinkSlotsValue,
  maxChainLinkSlotsForRedline
} from "@/lib/groups-shared";
import { AdditionalInputRequiredModal } from "@/components/AdditionalInputRequiredModal";

/** Leader confirmation dialog when any requested extra fields must be collected from the creator too. */
function creationNeedsLeaderPrepModal(
  categoryLevel1: CategoryLevel1,
  requestRoleSelection: boolean,
  requestRedlinePoints: boolean,
  requestChainLinks: boolean
): boolean {
  if (categoryLevel1 === "Mentoring") {
    return requestRoleSelection;
  }
  if (categoryLevel1 === "PvM") {
    return (
      requestRoleSelection ||
      requestRedlinePoints ||
      requestChainLinks
    );
  }
  return false;
}

export default function CreateGroupPage() {
  const { data: session, status } = useSession();
  const isLoggedIn = Boolean(session?.user);
  const router = useRouter();

  const [categoryLevel1, setCategoryLevel1] = useState<CategoryLevel1>("PvM");
  const [categoryLevel2, setCategoryLevel2] = useState<CategoryLevel2>("Dungeons");
  const [categoryLevel3, setCategoryLevel3] = useState<CategoryLevel3>("Aegis Keep");
  const [description, setDescription] = useState("");
  const [voiceChannelListen, setVoiceChannelListen] = useState(false);
  const [voiceChannelSpeak, setVoiceChannelSpeak] = useState(false);
  const [requestRoleSelection, setRequestRoleSelection] = useState(false);
  const [requestRedlinePoints, setRequestRedlinePoints] = useState(false);
  const [requestChainLinks, setRequestChainLinks] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [prepOpen, setPrepOpen] = useState(false);
  const [prepModalRole, setPrepModalRole] = useState("");
  const [prepModalRedlinePoints, setPrepModalRedlinePoints] = useState("");
  const [prepModalChainLinkSlots, setPrepModalChainLinkSlots] = useState("");

  const subTypeOptions = useMemo(() => {
    if (categoryLevel1 === "Custom" || categoryLevel1 === "Roleplay" || categoryLevel1 === "Mentoring") {
      return null;
    }
    if (categoryLevel1 === "Quests") {
      return [...QUEST_SUBTYPES];
    }
    return [...CONTENT_SUBTYPES[categoryLevel1]];
  }, [categoryLevel1]);

  const tertiaryOptions =
    categoryLevel2 && (categoryLevel1 === "PvM" || categoryLevel1 === "PvP")
      ? (PVM_TERTIARY_OPTIONS[categoryLevel2] ?? PVP_TERTIARY_OPTIONS[categoryLevel2] ?? null)
      : null;
  const descriptionRequired =
    categoryLevel1 === "Custom" ||
    categoryLevel1 === "Quests" ||
    (categoryLevel1 === "PvM" &&
      (PVM_DESCRIPTION_REQUIRED_SUBTYPES as readonly string[]).includes(categoryLevel2));

  const prepModalChainLinkMax = useMemo(
    () =>
      maxChainLinkSlotsForRedline(
        requestRedlinePoints
          ? parseNonNegativeWholeNumberString(prepModalRedlinePoints) ?? null
          : null
      ),
    [requestRedlinePoints, prepModalRedlinePoints]
  );

  const prepModalAllMet = useMemo(() => {
    if (categoryLevel1 === "Mentoring") {
      if (!requestRoleSelection) return true;
      if (!prepModalRole || !MENTORING_ROLES.includes(prepModalRole as (typeof MENTORING_ROLES)[number])) {
        return false;
      }
      return true;
    }
    if (categoryLevel1 === "PvM") {
      if (requestRoleSelection) {
        if (!PVM_APPLICANT_ROLES.includes(prepModalRole as (typeof PVM_APPLICANT_ROLES)[number])) {
          return false;
        }
      }
      const parsedRedline = requestRedlinePoints
        ? parseNonNegativeWholeNumberString(prepModalRedlinePoints)
        : null;
      if (requestRedlinePoints && parsedRedline === undefined) {
        return false;
      }
      if (requestChainLinks) {
        const chain = parseNonNegativeWholeNumberString(prepModalChainLinkSlots);
        if (chain === undefined) return false;
        if (
          !isValidChainLinkSlotsValue(
            chain,
            requestRedlinePoints ? parsedRedline! : null
          )
        ) {
          return false;
        }
      }
      return true;
    }
    return true;
  }, [
    categoryLevel1,
    requestRoleSelection,
    requestRedlinePoints,
    requestChainLinks,
    prepModalRole,
    prepModalRedlinePoints,
    prepModalChainLinkSlots
  ]);

  const prepBlocked = !prepModalAllMet;

  useEffect(() => {
    if (prepOpen) {
      setPrepModalRole("");
      setPrepModalRedlinePoints("");
      setPrepModalChainLinkSlots("");
    }
  }, [prepOpen]);

  useEffect(() => {
    setRequestRoleSelection(false);
    setRequestRedlinePoints(false);
    setRequestChainLinks(false);
  }, [categoryLevel1]);

  const handleCategoryChange = (value: CategoryLevel1) => {
    setCategoryLevel1(value);
    if (value === "Quests") {
      setCategoryLevel2(QUEST_SUBTYPES[0]);
      setCategoryLevel3("");
    } else if (value !== "Custom" && value !== "Roleplay" && value !== "Mentoring") {
      const first = CONTENT_SUBTYPES[value][0];
      setCategoryLevel2(first);
      const firstTertiary = PVM_TERTIARY_OPTIONS[first]?.[0] ?? PVP_TERTIARY_OPTIONS[first]?.[0] ?? "";
      setCategoryLevel3(firstTertiary);
    }
  };

  const handleSubTypeChange = (value: string) => {
    setCategoryLevel2(value);
    const firstTertiary = PVM_TERTIARY_OPTIONS[value]?.[0] ?? PVP_TERTIARY_OPTIONS[value]?.[0] ?? "";
    setCategoryLevel3(firstTertiary);
  };

  const buildCreateBody = () => {
    return {
      categoryLevel1,
      categoryLevel2:
        categoryLevel1 === "Custom" || categoryLevel1 === "Roleplay" || categoryLevel1 === "Mentoring"
          ? null
          : categoryLevel2,
      categoryLevel3: tertiaryOptions ? categoryLevel3 || null : null,
      description: description.trim(),
      creatorRole:
        (categoryLevel1 === "Mentoring" || categoryLevel1 === "PvM") && requestRoleSelection
          ? prepModalRole
          : undefined,
      creatorRedlinePoints:
        categoryLevel1 === "PvM" && requestRedlinePoints
          ? parseNonNegativeWholeNumberString(prepModalRedlinePoints)
          : undefined,
      creatorChainLinkSlots:
        categoryLevel1 === "PvM" && requestChainLinks
          ? parseNonNegativeWholeNumberString(prepModalChainLinkSlots)
          : undefined,
      requireRoleSelection: requestRoleSelection,
      requireRedlinePoints: requestRedlinePoints,
      requireChainLinks: requestChainLinks,
      voiceChannelListen,
      voiceChannelSpeak
    };
  };

  const postCreate = async () => {
    const res = await fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildCreateBody())
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || "Failed to create group");
    }
    router.push("/");
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (descriptionRequired && !description.trim()) {
      setError(
        categoryLevel1 === "Custom"
          ? "Description is required for Custom groups."
          : categoryLevel1 === "Quests"
            ? "Description is required for Quests groups."
            : categoryLevel2 === "Society Jobs"
              ? "Description is required for Society Jobs groups."
              : "Description is required."
      );
      return;
    }

    if (
      creationNeedsLeaderPrepModal(
        categoryLevel1,
        requestRoleSelection,
        requestRedlinePoints,
        requestChainLinks
      )
    ) {
      setPrepOpen(true);
      return;
    }

    setSubmitting(true);
    try {
      await postCreate();
    } catch (err: any) {
      setError(err.message ?? "Something went wrong while creating the group.");
    } finally {
      setSubmitting(false);
    }
  };

  const onConfirmPrepModal = async () => {
    if (prepBlocked) return;
    setError(null);
    setSubmitting(true);
    try {
      await postCreate();
      setPrepOpen(false);
    } catch (err: any) {
      setError(err.message ?? "Something went wrong while creating the group.");
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-slate-900/60 p-6">
        <div className="h-4 w-40 animate-pulse rounded bg-slate-800" />
        <div className="mt-4 h-32 animate-pulse rounded bg-slate-800" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="mx-auto max-w-xl space-y-4 rounded-2xl border border-white/10 bg-slate-900/60 p-6">
        <h2 className="text-lg font-semibold tracking-tight">Sign in to create a group</h2>
        <p className="text-sm text-slate-300">
          Creating activity groups is limited to logged-in users so we can link groups to your Discord
          account.
        </p>
        <button
          type="button"
          onClick={() => signIn("discord", { callbackUrl: "/creategroup" })}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow shadow-indigo-500/40 transition hover:bg-indigo-400"
        >
          Continue with Discord
        </button>
        <div className="pt-2 text-xs text-slate-400">
          <Link href="/" className="hover:text-slate-200 hover:underline" aria-label="Back to group list">
            Back
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-xl space-y-6 rounded-2xl border border-white/10 bg-slate-900/60 p-6 shadow-lg shadow-black/40">
        <h2 className="text-lg font-semibold tracking-tight">Create group</h2>

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-1 text-sm">
            <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Category
            </label>
            <select
              value={categoryLevel1}
              onChange={(e) => handleCategoryChange(e.target.value as CategoryLevel1)}
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none ring-0 transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/40"
            >
              <option value="PvM">PvM (Player vs. Monster)</option>
              <option value="PvP">PvP (Player vs. Player)</option>
              <option value="Quests">Quests</option>
              <option value="Mentoring">Mentoring</option>
              <option value="Roleplay">Roleplay</option>
              <option value="Custom">Custom</option>
            </select>
          </div>

          {subTypeOptions && (
            <div className="space-y-1 text-sm">
              <select
                value={categoryLevel2}
                onChange={(e) => handleSubTypeChange(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none ring-0 transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/40"
              >
                {subTypeOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {categoryLevel1 === "PvP" && opt === "PK" ? "PK (Player Killing)" : opt}
                  </option>
                ))}
              </select>
            </div>
          )}

          {tertiaryOptions && (
            <div className="space-y-1 text-sm">
              <select
                value={categoryLevel3}
                onChange={(e) => setCategoryLevel3(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none ring-0 transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/40"
              >
                {tertiaryOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1 text-sm">
            <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className={
                descriptionRequired
                  ? "w-full resize-none rounded-xl border-2 border-amber-400/60 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none ring-0 transition focus:border-amber-400 focus:ring-2 focus:ring-amber-500/40"
                  : "w-full resize-none rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none ring-0 transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/40"
              }
              placeholder={
                categoryLevel1 === "Custom"
                  ? "Required: Describe what this group is for."
                  : categoryLevel1 === "Quests"
                    ? "Required: Specify which quests you want to do."
                    : categoryLevel2 === "Society Jobs"
                      ? "Required: Specify which Society Jobs you want to do."
                      : "Optional: Add more detailed information here."
              }
            />
          </div>

          <div className="space-y-3 border-t border-white/10 pt-5 text-sm">
            <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Voice channel requirements
            </label>
            <label className="flex cursor-pointer items-start gap-2 text-slate-200">
              <input
                type="checkbox"
                checked={voiceChannelListen}
                onChange={(e) => {
                  const on = e.target.checked;
                  setVoiceChannelListen(on);
                  if (!on) setVoiceChannelSpeak(false);
                }}
                className="mt-0.5 h-4 w-4 rounded border-white/20 bg-slate-900 text-indigo-500 focus:ring-indigo-500/40"
              />
              <span>Voice Channel - Listen</span>
            </label>
            <label
              className={`flex cursor-pointer items-start gap-2 ${voiceChannelListen ? "text-slate-200" : "cursor-not-allowed text-slate-500"}`}
            >
              <input
                type="checkbox"
                checked={voiceChannelSpeak}
                disabled={!voiceChannelListen}
                onChange={(e) => setVoiceChannelSpeak(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-white/20 bg-slate-900 text-indigo-500 focus:ring-indigo-500/40 disabled:opacity-50"
              />
              <span>Voice Channel - Speak</span>
            </label>
          </div>

          {(categoryLevel1 === "Mentoring" || categoryLevel1 === "PvM") && (
            <div className="space-y-3 border-t border-white/10 pt-5 text-sm">
              <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Request User Information
              </label>
              <label className="flex cursor-pointer items-start gap-2 text-slate-200">
                <input
                  type="checkbox"
                  checked={requestRoleSelection}
                  onChange={(e) => setRequestRoleSelection(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-white/20 bg-slate-900 text-indigo-500 focus:ring-indigo-500/40"
                />
                <span>Role Selection</span>
              </label>
              {categoryLevel1 === "PvM" && (
                <>
                  <label className="flex cursor-pointer items-start gap-2 text-slate-200">
                    <input
                      type="checkbox"
                      checked={requestRedlinePoints}
                      onChange={(e) => setRequestRedlinePoints(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-white/20 bg-slate-900 text-indigo-500 focus:ring-indigo-500/40"
                    />
                    <span>Redline Points</span>
                  </label>
                  <label className="flex cursor-pointer items-start gap-2 text-slate-200">
                    <input
                      type="checkbox"
                      checked={requestChainLinks}
                      onChange={(e) => setRequestChainLinks(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-white/20 bg-slate-900 text-indigo-500 focus:ring-indigo-500/40"
                    />
                    <span>Chain Link Slots</span>
                  </label>
                </>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow shadow-emerald-500/40 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Creating…" : "Create group"}
            </button>
            <Link
              href="/"
              className="ml-auto inline-flex items-center justify-center rounded-xl border border-slate-500 bg-slate-800/80 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-700"
            >
              Cancel
            </Link>
          </div>

          {error && !prepOpen && <p className="text-xs text-red-400">{error}</p>}
        </form>
      </div>

      <AdditionalInputRequiredModal
        open={prepOpen}
        onClose={() => !submitting && setPrepOpen(false)}
        onConfirm={onConfirmPrepModal}
        confirmDisabled={submitting || prepBlocked}
        confirmBusy={submitting}
        disableBack={submitting}
        needsRole={requestRoleSelection}
        roleOptions={categoryLevel1 === "Mentoring" ? MENTORING_ROLES : PVM_APPLICANT_ROLES}
        roleValue={prepModalRole}
        onRoleChange={setPrepModalRole}
        needsRedlinePoints={categoryLevel1 === "PvM" && requestRedlinePoints}
        needsChainLinkSlots={categoryLevel1 === "PvM" && requestChainLinks}
        chainLinkSlotsMax={prepModalChainLinkMax}
        redlinePointsValue={prepModalRedlinePoints}
        chainLinkSlotsValue={prepModalChainLinkSlots}
        onRedlinePointsChange={setPrepModalRedlinePoints}
        onChainLinkSlotsChange={setPrepModalChainLinkSlots}
        error={prepOpen ? error : null}
      />
    </>
  );
}
