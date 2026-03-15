"use client";

import { FormEvent, useState, useMemo } from "react";
import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type ContentType = "PvM" | "PvP" | "Mentoring" | "Roleplay" | "Custom";

const SUBTYPES: Record<Exclude<ContentType, "Mentoring" | "Roleplay" | "Custom">, readonly string[]> = {
  PvM: ["Dungeons", "Pit Trials", "Treasure Maps", "Society Jobs", "Quests"],
  PvP: ["Factions", "Proving Grounds", "PK", "Anti-PK"]
};

const MENTORING_ROLES = ["Guide", "Student"] as const;

const PVM_TERTIARY_OPTIONS: Record<string, readonly string[]> = {
  "Dungeons": ["Aegis Keep", "Cavernam", "Darkmire Temple", "Inferno", "Kraul Hive", "The Mausoleum", "Mount Petram", "Nusero", "Ossuary", "Pulma", "Shadowspire Cathedral", "Tidal Tomb", "Time"],
  "Pit Trials": ["3 Players", "5 Players"],
  "Treasure Maps": ["Levels 1-7", "Level 8 (Lore Boss)"]
};

const PVP_TERTIARY_OPTIONS: Record<string, readonly string[]> = {
  "Factions": ["Andaria", "Cambria", "Prevalia", "Terran"],
  "Proving Grounds": ["3 Players", "4 Players", "5 Players"]
};

const PVM_DESCRIPTION_REQUIRED_SUBTYPES = ["Society Jobs", "Quests"];

export default function NewGroupPage() {
  const { data: session, status } = useSession();
  const isLoggedIn = Boolean(session?.user);
  const router = useRouter();

  const [contentType, setContentType] = useState<ContentType>("PvM");
  const [contentSubType, setContentSubType] = useState<string>("Dungeons");
  const [contentTertiary, setContentTertiary] = useState<string>("Aegis Keep");
  const [creatorRole, setCreatorRole] = useState<string>("Guide");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subTypeOptions = useMemo(() => {
    if (contentType === "Custom" || contentType === "Roleplay" || contentType === "Mentoring") return null;
    return SUBTYPES[contentType];
  }, [contentType]);

  const tertiaryOptions =
    contentSubType && (contentType === "PvM" || contentType === "PvP")
      ? (PVM_TERTIARY_OPTIONS[contentSubType] ?? PVP_TERTIARY_OPTIONS[contentSubType] ?? null)
      : null;
  const descriptionRequired = contentType === "Custom" || (contentType === "PvM" && PVM_DESCRIPTION_REQUIRED_SUBTYPES.includes(contentSubType));

  const handleCategoryChange = (value: ContentType) => {
    setContentType(value);
    if (value === "Mentoring") {
      setCreatorRole("Guide");
    } else if (value !== "Custom" && value !== "Roleplay") {
      const first = SUBTYPES[value][0];
      setContentSubType(first);
      const firstTertiary = PVM_TERTIARY_OPTIONS[first]?.[0] ?? PVP_TERTIARY_OPTIONS[first]?.[0] ?? "";
      setContentTertiary(firstTertiary);
    }
  };

  const handleSubTypeChange = (value: string) => {
    setContentSubType(value);
    const firstTertiary = PVM_TERTIARY_OPTIONS[value]?.[0] ?? PVP_TERTIARY_OPTIONS[value]?.[0] ?? "";
    setContentTertiary(firstTertiary);
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (descriptionRequired && !description.trim()) {
      setError(
        contentType === "Custom"
          ? "Description is required for Custom groups."
          : contentSubType === "Society Jobs"
            ? "Description is required for Society Jobs groups."
            : "Description is required for Quests groups."
      );
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contentType,
          contentSubType: contentType === "Custom" || contentType === "Roleplay" || contentType === "Mentoring" ? null : contentSubType,
          contentTertiary: tertiaryOptions ? contentTertiary || null : null,
          creatorRole: contentType === "Mentoring" ? creatorRole : undefined,
          description: description.trim()
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create group");
      }

      router.push("/");
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
        <h2 className="text-lg font-semibold tracking-tight">
          Sign in to create a group
        </h2>
        <p className="text-sm text-slate-300">
          Creating activity groups is limited to logged-in users so we can link
          groups to your Discord account.
        </p>
        <button
          type="button"
          onClick={() => signIn("discord", { callbackUrl: "/groups/new" })}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow shadow-indigo-500/40 transition hover:bg-indigo-400"
        >
          Continue with Discord
        </button>
        <div className="pt-2 text-xs text-slate-400">
          <Link href="/" className="hover:text-slate-200 hover:underline">
            &larr; Back to group list
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 rounded-2xl border border-white/10 bg-slate-900/60 p-6 shadow-lg shadow-black/40">
      <h2 className="text-lg font-semibold tracking-tight">
        Create a new group
      </h2>

      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-1 text-sm">
          <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Category
          </label>
          <select
            value={contentType}
            onChange={(e) => handleCategoryChange(e.target.value as ContentType)}
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none ring-0 transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/40"
          >
            <option value="PvM">PvM (Player vs. Monster)</option>
            <option value="PvP">PvP (Player vs. Player)</option>
            <option value="Mentoring">Mentoring</option>
            <option value="Roleplay">Roleplay</option>
            <option value="Custom">Custom</option>
          </select>
        </div>

        {subTypeOptions && (
          <div className="space-y-1 text-sm">
            <select
              value={contentSubType}
              onChange={(e) => handleSubTypeChange(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none ring-0 transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/40"
            >
              {subTypeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {contentType === "PvP" && opt === "PK" ? "PK (Player Killing)" : opt}
                </option>
              ))}
            </select>
          </div>
        )}

        {tertiaryOptions && (
          <div className="space-y-1 text-sm">
            <select
              value={contentTertiary}
              onChange={(e) => setContentTertiary(e.target.value)}
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
              contentType === "Custom"
                ? "Required: Describe what this group is for."
                : contentSubType === "Society Jobs"
                  ? "Required: Specify which Society Jobs you want to do."
                  : contentSubType === "Quests"
                    ? "Required: Specify which Quests you want to do."
                    : "Optional: Add more detailed information here."
            }
          />
        </div>

        {contentType === "Mentoring" && (
          <>
            <hr className="border-white/10" />
            <div className="space-y-1 text-sm">
              <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Your role
              </label>
              <select
                value={creatorRole}
                onChange={(e) => setCreatorRole(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none ring-0 transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/40"
              >
                {MENTORING_ROLES.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </>
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

        {error && (
          <p className="text-xs text-red-400">{error}</p>
        )}
      </form>
    </div>
  );
}
