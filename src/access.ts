/**
 * Who may use the app, worked out entirely on the device.
 *
 * There is no server. Lemon Squeezy's licence API is callable straight from the
 * browser, so a key is activated once per device and then that device keeps
 * working offline. We re-check quietly once a week, and only lock up if the
 * service actually says the key is finished — a network error, a timeout or an
 * activation limit must never lock a family out mid-week.
 *
 * Nothing here is a secret. A determined person can read this file and edit
 * their own storage; that is true of every client-side check and is an accepted
 * trade for having no server and collecting no personal data. The licence key
 * itself is only ever sent to Lemon Squeezy.
 */

import { sha256 } from "./hash";

export const TRIAL_DAYS = 7;
export const RECHECK_DAYS = 7;

/* ---- the shop --------------------------------------------------------------
   The two buy links from the One Ayah At A Time store on Lemon Squeezy (store
   `oneayahatatime`, separate from Spelling Quest so that a family buying a Quran
   tracker never gets mail branded with the other product).

   Both are annual subscriptions with licence keys and an unlimited activation
   limit, so every phone, tablet and laptop in a house can unlock with the same
   key. The upgrade product is hidden from the storefront on purpose — it is only
   reachable through the link below, which is shown to people who say they
   already own Spelling Quest or Muslim Kids Checklist.

   If either is ever blanked out, the buy buttons fall back to an email rather
   than landing nowhere. */
export const CHECKOUT_URL = "https://oneayahatatime.lemonsqueezy.com/checkout/buy/59b44647-2e95-4f4a-924d-3a678975ea2d";
export const UPGRADE_URL  = "https://oneayahatatime.lemonsqueezy.com/checkout/buy/24731e95-f176-4e06-98c4-a4217986f920";
export const SUPPORT_EMAIL = "oneayahtime@gmail.com";
export const PRICE_LINE = "$40 a year for the whole family";
export const UPGRADE_LINE = "$25 a year if you already have Spelling Quest or Muslim Kids Checklist";
export const UPGRADE_PRICE = "$25 a year, for as long as you stay";

/* Sister products. Muslim Kids Checklist has no public address yet — until it
   does, it is named in the copy without a link rather than linked wrongly. */
export const SPELLING_QUEST_URL = "https://spellingquest.github.io";
export const KIDS_CHECKLIST_URL = "";

/* ---- codes handed out by hand ----------------------------------------------
   Family, testers, a teacher, somebody who wrote in — people who should have the
   app without buying it. A code unlocks everything a paid key does and is never
   re-checked against anything, because there is nothing to check it against.

   **Only the salted hashes are here.** The codes themselves live in one text
   file outside the repository and are never committed, because this repository
   is public and a code in it would be a free key for the entire internet. A hash
   cannot be turned back into a code, and the codes are long and random enough
   that guessing is not on the table either.

   The device stores the *fingerprint* too, never the code — so an unlocked iPad
   carries nothing anybody could reuse.

   To add or retire a code: change this list and the private file together. */
export const CODE_SALT = "OneAyah/v1/";
const CODE_HASHES = [
  "a3fc12fdcbe63b6c2ac0b1c3ed4e8a62c22a9ff7b9f8bb9fc85c4631f87d4c01",
  "b5c8bcd0f7beaa11123c427c9bf9d1051ca7762911295b1bd77f9422d3d0091b",
  "77132ccc14cf75e72829c2f6ee3b765ef3dd7b52c7ac600ded5c3206b18fbf1c",
  "bfab47d7f23e9e7629dfe8ff4a4fdd5d151377b1eaaabe2d41aea38055c2cc03",
  "4abf0c4364ab39165f73809a7d0e7ab9415673d7223c58a81b216a8ecec071bb",
];

export const normCode = (s: string) => String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
export const codeFingerprint = (s: string) => sha256(CODE_SALT + normCode(s));

/** Takes either a code somebody typed or a fingerprint already on the device. */
export const codeOk = (s: string) => {
  const value = String(s || "");
  return CODE_HASHES.includes(value) || CODE_HASHES.includes(codeFingerprint(value));
};

/* ---- proving you already own one of the other apps --------------------------
   The $25 price is for people who already bought Spelling Quest or Muslim Kids
   Checklist. Rather than trust that, the app asks for the key from that other
   purchase and checks it with Lemon Squeezy before it will show the price.

   Store ids, not product ids, so a second product in either shop still counts.
   Muslim Kids Checklist has no shop yet; when it does, add its id here and the
   check starts accepting its keys with no other change. */
const OUR_OTHER_STORES: number[] = [451129];      // 451129 = Spelling Quest

const LS_API = "https://api.lemonsqueezy.com/v1/licenses";

/** Only these mean "this key is genuinely finished". Anything else is left alone. */
const DEAD_KEY = /expired|disabled|inactive|not found|revoked/i;

const ACCESS_KEY = "quran-tracker-access";

export type Licence = {
  key: string;
  instance: string | null;
  checked: number;
  dead: boolean;
  /** typed in while offline — activate properly on the next run */
  pending?: boolean;
};
/** `code` holds the *fingerprint* of a code we handed out, never the code. */
export type Access = { trialStart?: number; licence?: Licence; code?: string };

/** new = never opened the door; ended = paid once, and the key has since died. */
export type AccessState = "new" | "trial" | "trial-over" | "licensed" | "ended";

export function readAccess(): Access {
  try {
    const raw = localStorage.getItem(ACCESS_KEY);
    if (raw) return JSON.parse(raw) as Access;
  } catch {
    // blocked or unreadable storage behaves like a fresh visit
  }
  return {};
}

export function writeAccess(value: Access): void {
  try { localStorage.setItem(ACCESS_KEY, JSON.stringify(value)); } catch { /* storage blocked */ }
}

/** Whole days left of the free week, or null if it was never started. */
export function trialLeft(a: Access): number | null {
  if (!a.trialStart) return null;
  const used = Math.floor((Date.now() - a.trialStart) / 86400000);
  return Math.max(0, TRIAL_DAYS - used);
}

export function accessState(a: Access): AccessState {
  // A code we handed out beats everything, and is never re-checked: there is no
  // subscription behind it to expire, and nothing to phone home about.
  if (a.code && codeOk(a.code)) return "licensed";
  if (a.licence?.key && !a.licence.dead) return "licensed";
  if (a.licence?.key && a.licence.dead) return "ended";
  const left = trialLeft(a);
  if (left === null) return "new";
  return left > 0 ? "trial" : "trial-over";
}

export const hasAccess = (a: Access) => {
  const state = accessState(a);
  return state === "licensed" || state === "trial";
};

export const looksLikeKey = (s: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(s || "").trim());

type LsReply = {
  activated?: boolean; valid?: boolean; deactivated?: boolean; error?: string;
  instance?: { id?: string };
  /** Lemon Squeezy also returns the buyer's email here. It is never read, never
   *  stored and never shown — only `store_id` is looked at. */
  meta?: { store_id?: number; product_name?: string };
};

export function activateKey(key: string, deviceName = "One Ayah device"): Promise<LsReply> {
  return fetch(`${LS_API}/activate`, {
    method: "POST",
    headers: { Accept: "application/json" },
    body: new URLSearchParams({ license_key: key.trim(), instance_name: deviceName }),
  }).then(r => r.json() as Promise<LsReply>);
}

export function validateKey(key: string, instanceId: string | null): Promise<LsReply> {
  const body: Record<string, string> = { license_key: key.trim() };
  if (instanceId) body.instance_id = instanceId;
  return fetch(`${LS_API}/validate`, {
    method: "POST",
    headers: { Accept: "application/json" },
    body: new URLSearchParams(body),
  }).then(r => r.json() as Promise<LsReply>);
}

/** Hand an activation back when somebody signs a device out. Best effort. */
export function deactivateKey(key: string, instanceId: string): Promise<LsReply> {
  return fetch(`${LS_API}/deactivate`, {
    method: "POST",
    headers: { Accept: "application/json" },
    body: new URLSearchParams({ license_key: key.trim(), instance_id: instanceId }),
  }).then(r => r.json() as Promise<LsReply>);
}

export type OwnerCheck = { owns: boolean; product?: string; offline?: boolean };

/**
 * Does this key belong to one of our other shops?
 *
 * Validating without an instance id only asks a question — it does not use up
 * one of that key's activations, so checking costs the person nothing.
 *
 * A network failure answers `offline`, not `no`. Somebody who really does own
 * Spelling Quest should never be told they don't because a request timed out;
 * the screen offers to email instead.
 */
export async function ownsAnotherApp(key: string): Promise<OwnerCheck> {
  try {
    const res = await validateKey(key, null);
    if (!res?.valid) return { owns: false };
    const store = res.meta?.store_id;
    return { owns: !!store && OUR_OTHER_STORES.includes(store), product: res.meta?.product_name };
  } catch {
    return { owns: false, offline: true };
  }
}

/**
 * The quiet weekly re-check. Resolves to the access it wants saved, or null if
 * nothing should change — which is the answer for every failure that isn't a
 * definite "this key is finished".
 */
export async function recheck(a: Access): Promise<Access | null> {
  if (a.code && codeOk(a.code)) return null;      // nothing behind a code to check
  const licence = a.licence;
  if (!licence?.key || licence.dead) return null;
  if (Date.now() - (licence.checked || 0) < RECHECK_DAYS * 86400000) return null;

  // A key typed in while offline was never really activated. Finish that now,
  // so the device gets a proper instance and a made-up key can't live for ever.
  if (licence.pending || !licence.instance) {
    try {
      const res = await activateKey(licence.key);
      const next: Licence = { ...licence, checked: Date.now() };
      if (res?.activated) { next.instance = res.instance?.id ?? null; next.pending = false; }
      else if (DEAD_KEY.test(res?.error || "")) next.dead = true;
      return { ...a, licence: next };
    } catch {
      return null;                                  // still offline: try again next time
    }
  }

  try {
    const res = await validateKey(licence.key, licence.instance);
    const next: Licence = { ...licence, checked: Date.now() };
    if (res?.valid === false && DEAD_KEY.test(res?.error || "")) next.dead = true;
    return { ...a, licence: next };
  } catch {
    return null;                                    // offline or blocked: leave everything alone
  }
}

/** Where the buy button goes. An empty checkout link falls back to email. */
export const buyHref = (upgrade = false) => {
  const url = upgrade ? UPGRADE_URL || CHECKOUT_URL : CHECKOUT_URL;
  if (url) return url;
  const subject = upgrade ? "One Ayah At A Time — upgrade" : "One Ayah At A Time";
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`;
};
