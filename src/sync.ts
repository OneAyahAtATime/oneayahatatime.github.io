/**
 * Keeping a family's devices in step.
 *
 * A child does a page on the iPad downstairs, a parent checks from a phone, and
 * a new tablet arrives at Eid. That only works if progress travels, so it does.
 *
 * It travels under a FINGERPRINT of the licence key — literally a fingerprint: a
 * one-way scramble. The same key always makes the same 64-character string, and
 * there is no way back from that string to the key. It is the only thing the
 * server ever sees, so the database cannot say who anybody is: no email, no real
 * name, no address, no age.
 *
 * During the free week there is no key, so there is no fingerprint and nothing
 * is stored anywhere at all — the trial is exactly as private as the app used to
 * be for everyone.
 *
 * A sync problem must never interrupt somebody's memorization. Every call here
 * fails quietly and leaves the device's own copy alone; the next save tries
 * again.
 */

import type { Access } from "./access";
import { sha256 } from "./hash";

const SB_URL = "https://nkkckcnclqwpvvwujedg.supabase.co";
/* Publishable by design — it is in every visitor's browser and grants nothing on
   its own. It cannot read or write a single row directly: the table has row
   level security on with no policies at all, so the only way in is through the
   three functions below, and each of those needs a fingerprint you could only
   have if you hold the key. */
const SB_KEY = "sb_publishable_jTvqG53LAS1LsP7A8evx2Q_RgekRHXZ";

/* Salted per product, so the same licence key in two of our apps produces two
   unrelated fingerprints and nothing can be matched up across them. */
const FAMILY_SALT = "OneAyah/family/";

export type SyncState = "off" | "working" | "ok" | "offline" | "later";

export type RemoteReciter = {
  reciter_id: string;
  nickname: string;
  colored: Record<string, string>;
  statuses: Record<string, string>;
  status_at: Record<string, number>;
  dates: Record<string, string>;
  favorites: Record<string, string>;
  ayahs: Record<string, string>;
  working_on: Record<string, unknown>;
  practice_days: string[];
  honorific: string;
  removed: boolean;
};

const normKey = (s: string) => String(s || "").trim().toLowerCase();

/**
 * The family's fingerprint, or null when there is nothing to sync to — which is
 * every moment of the free week.
 *
 * A code handed out by hand syncs too, and its own stored fingerprint stands in
 * for the key. That is not a weaker identifier: it is already a 64-character
 * one-way hash, and scrambling it again with a different salt keeps the two
 * unrelatable.
 */
export function familyFingerprint(access: Access): string | null {
  const key = normKey(access?.licence?.key || "");
  if (key) return sha256(FAMILY_SALT + key);
  if (access?.code) return sha256(FAMILY_SALT + access.code);
  return null;
}

function rpc<T>(fn: string, body: unknown): Promise<T> {
  return fetch(`${SB_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then(r => {
    if (!r.ok) throw new Error(`sync ${r.status}`);
    return r.json() as Promise<T>;
  });
}

export const pullReciters = (fp: string) =>
  rpc<RemoteReciter[]>("pull_reciters", { p_family_hash: fp });

export const pushReciter = (fp: string, row: {
  id: string; name: string;
  colored: Record<string,string>; statuses: Record<string,string>; statusAt: Record<string,number>;
  dates: Record<string,string>; favorites: Record<string,string>; ayahs: Record<string,string>;
  workingOn: Record<string,unknown>; practiceDays: string[]; honorific: string; removed?: boolean;
}) => rpc<RemoteReciter>("push_reciter", {
  p_family_hash: fp,
  p_reciter_id: row.id,
  p_nickname: row.name || "",
  p_colored: row.colored || {},
  p_statuses: row.statuses || {},
  p_status_at: row.statusAt || {},
  p_dates: row.dates || {},
  p_favorites: row.favorites || {},
  p_ayahs: row.ayahs || {},
  p_working_on: row.workingOn || {},
  p_practice_days: row.practiceDays || [],
  p_honorific: row.honorific === "Hafiz" ? "Hafiz" : "Hafizah",
  p_removed: !!row.removed,
});

/** "Take our family off the server." Everything, every device, gone. */
export const forgetFamily = (fp: string) =>
  rpc<number>("forget_reciters", { p_family_hash: fp });

/**
 * Has anybody actually used this reciter?
 *
 * A device that has only ever been opened has one untouched "Reciter 1". If that
 * were sent, every other device in the family would receive a stranger it has no
 * way to recognise as a placeholder. So a reciter counts as used only once
 * somebody has selected a book, written a note, or given them a name.
 */
export function reciterHasBeenUsed(name: string, saved: {
  colored?: Record<string,string>; statuses?: Record<string,string>;
  ayahs?: Record<string,string>; dates?: Record<string,string>; practiceDays?: string[];
}): boolean {
  if (name && !/^Reciter \d+$/.test(name)) return true;
  return !!(Object.keys(saved.colored || {}).length
    || Object.keys(saved.statuses || {}).length
    || Object.keys(saved.ayahs || {}).length
    || Object.keys(saved.dates || {}).length
    || (saved.practiceDays || []).length);
}
