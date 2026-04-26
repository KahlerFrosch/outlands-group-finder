/**
 * Types and constants shared with the browser (client components).
 * Do not import Prisma or server-only modules here.
 */

/** Top-level group classification (e.g. PvM, Mentoring). */
export type CategoryLevel1 = "PvM" | "PvP" | "Mentoring" | "Roleplay" | "Custom" | "Quests";

/**
 * Second-tier label (e.g. Dungeons, Factions). Allowed values depend on {@link CategoryLevel1}.
 * Further tiers use {@link CategoryLevel3}; a fourth tier could be added as `categoryLevel4` later.
 */
export type CategoryLevel2 = string;

/**
 * Third-tier label when the first two levels have finer options (e.g. a specific dungeon).
 */
export type CategoryLevel3 = string;

export const CONTENT_SUBTYPES: Record<Exclude<CategoryLevel1, "Mentoring" | "Roleplay" | "Custom" | "Quests">, readonly string[]> = {
  PvM: ["Dungeons", "Pit Trials", "Treasure Maps", "Society Jobs"],
  PvP: ["Factions", "Proving Grounds", "PK", "Anti-PK"]
} as const;

/** Roles for Mentoring groups (per-member). */
export const MENTORING_ROLES = ["Guide", "Student"] as const;

/** Roles for PvM groups when role selection is required. */
export const PVM_APPLICANT_ROLES = [
  "Tank",
  "Healer",
  "Damage Dealer",
  "Support"
] as const;

/** Level-3 options for PvM, keyed by level-2 subtype. */
export const PVM_TERTIARY_OPTIONS: Record<string, readonly string[]> = {
  "Dungeons": ["Aegis Keep", "Cavernam", "Darkmire Temple", "Inferno", "Kraul Hive", "The Mausoleum", "Mount Petram", "Nusero", "Ossuary", "Pulma", "Shadowspire Cathedral", "Tidal Tomb", "Time"],
  "Pit Trials": ["3 Players", "5 Players"],
  "Treasure Maps": ["Levels 1-7", "Level 8 (Lore Boss)"]
} as const;

/** Level-3 options for PvP, keyed by level-2 subtype. */
export const PVP_TERTIARY_OPTIONS: Record<string, readonly string[]> = {
  "Factions": ["Andaria", "Cambria", "Prevalia", "Terran"],
  "Proving Grounds": ["3 Players", "4 Players", "5 Players"]
} as const;

export const PVM_DESCRIPTION_REQUIRED_SUBTYPES = ["Society Jobs"] as const;

/** Quest category sub-types (order preserved). */
export const QUEST_SUBTYPES = ["New Lycaeum", "Time Dungeon", "New Player", "Misc."] as const;

/** Default cap on chain link slots when redline points are not used for the cap. */
export const CHAIN_LINK_SLOTS_BASE_MAX = 30;

/** Each full block of this many redline points raises the chain link cap by 1 (above {@link CHAIN_LINK_SLOTS_BASE_MAX}). */
export const CHAIN_LINK_REDLINE_PER_EXTRA_SLOT = 8;

/**
 * Maximum chain link slots allowed for a given redline total.
 * Uses base {@link CHAIN_LINK_SLOTS_BASE_MAX}, plus one slot per full {@link CHAIN_LINK_REDLINE_PER_EXTRA_SLOT} redline points.
 * When `redlinePoints` is `null`, only the base cap applies (e.g. chain slots requested without redline on the same form).
 */
export function maxChainLinkSlotsForRedline(redlinePoints: number | null): number {
  if (redlinePoints === null) return CHAIN_LINK_SLOTS_BASE_MAX;
  return CHAIN_LINK_SLOTS_BASE_MAX + Math.floor(redlinePoints / CHAIN_LINK_REDLINE_PER_EXTRA_SLOT);
}

export function isValidRedlinePointsValue(n: number): boolean {
  return Number.isInteger(n) && n >= 0 && Number.isSafeInteger(n);
}

export function isValidChainLinkSlotsValue(chain: number, redlinePointsForCap: number | null): boolean {
  if (!isValidRedlinePointsValue(chain)) return false;
  return chain <= maxChainLinkSlotsForRedline(redlinePointsForCap);
}

/** Parses a non-negative whole number from user input; rejects signs, decimals, and non-digits. */
export function parseNonNegativeWholeNumberString(s: string): number | undefined {
  const t = s.trim();
  if (t === "") return undefined;
  if (!/^\d+$/.test(t)) return undefined;
  const n = Number(t);
  if (!Number.isSafeInteger(n)) return undefined;
  return n;
}

/** Parses a non-negative whole number from JSON (string or integer); rejects non-integers and negatives. */
export function parseNonNegativeWholeNumberUnknown(v: unknown): number | undefined {
  if (v === undefined || v === null || v === "") return undefined;
  if (typeof v === "number") {
    if (!Number.isInteger(v) || v < 0 || !Number.isSafeInteger(v)) return undefined;
    return v;
  }
  return parseNonNegativeWholeNumberString(String(v));
}

export type GroupMember = {
  discordId: string;
  /** Discord display name (stored). */
  name: string;
  isCreator: boolean;
  role: string | null;
  /** PvM progression fields when the group requested them. */
  redlinePoints: number | null;
  chainLinkSlots: number | null;
};

export type GroupApplicant = {
  discordId: string;
  name: string;
  role: string | null;
  redlinePoints: number | null;
  chainLinkSlots: number | null;
};

export type Group = {
  id: string;
  categoryLevel1: CategoryLevel1;
  categoryLevel2: string | null;
  categoryLevel3: string | null;
  description: string;
  available: boolean;
  /** Mentoring or PvM: everyone must pick a role (Guide/Student or PvM roles), including the leader when creating. */
  requireRoleSelection: boolean;
  /** PvM: everyone must enter redline points, including the leader when creating. */
  requireRedlinePoints: boolean;
  /** PvM: everyone must enter chain link slots, including the leader when creating. */
  requireChainLinks: boolean;
  /** Voice channel: members may listen in the group voice channel. */
  voiceChannelListen: boolean;
  /** Voice channel: members may speak (only meaningful when listen is enabled). */
  voiceChannelSpeak: boolean;
  members: GroupMember[];
  applicants: GroupApplicant[];
  createdAt: string;
  expiresAt: string;
};
