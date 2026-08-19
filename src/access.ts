/**
 * Who may use the app, worked out entirely on the device.
 *
 * There is no server of our own. Gumroad's licence API is callable straight from
 * the browser, so a key is checked when it is first entered and then that device
 * keeps working offline. We re-check quietly once a week, and only lock up if
 * Gumroad actually says the purchase is finished — a network error, a timeout or
 * a payment being retried must never lock a family out mid-week.
 *
 * Nothing here is a secret. A determined person can read this file and edit
 * their own storage; that is true of every client-side check and is an accepted
 * trade for having no server and collecting no personal data. The licence key
 * itself is only ever sent to Gumroad.
 *
 * ---------------------------------------------------------------------------
 * WHY GUMROAD, AND NOT LEMON SQUEEZY
 *
 * Lemon Squeezy declined the account twice, the second time finally: "the
 * decision relies on multiple data points… we have assessed the totality of
 * data", with no specifics and from a different reviewer. That is a closed door,
 * not a request for more information, so there was nothing left to answer.
 *
 * Everything Lemon Squeezy did here has been removed rather than left commented
 * out, because a half-live integration against a dead account is worse than none.
 */

import { sha256 } from "./hash";

export const TRIAL_DAYS = 7;
export const RECHECK_DAYS = 7;

/* ═══════════════════════════════════════════════════════════════════════════
   ⬇ THE ONLY BLOCK THAT NEEDS FILLING IN ⬇

   Create three products in Gumroad, then paste each one's **product ID** and
   its **checkout URL** here. Both are on the product's page in Gumroad:

     • the product ID is under Settings, near "Generate a unique licence key
       per sale" — which must be switched ON for all three
     • the checkout URL is the share link, of the form
       https://<yourname>.gumroad.com/l/<something>

   Until a product's two fields are filled in, its buy button quietly falls back
   to an email, so nothing on the page is ever broken — just not yet buyable.
   ═══════════════════════════════════════════════════════════════════════════ */

export type Plan = { productId: string; checkout: string; price: string; label: string };

export const PLANS: Record<"family" | "second" | "bundle", Plan> = {
  /** The ordinary price: One Ayah At A Time on its own. */
  family: {
    productId: "5K-rSAFj42TdAX3vlGNQsQ==",
    checkout: "https://oneayahtime.gumroad.com/l/vcwkuz",
    price: "$40 a year",
    label: "One Ayah At A Time, for the whole family",
  },
  /** For people who already have Spelling Quest or Muslim Kids Checklist. */
  second: {
    productId: "6TLtDTxe19Rgypj9kASU1A==",
    checkout: "https://oneayahtime.gumroad.com/l/bumvs",
    price: "$25 a year",
    label: "One Ayah At A Time, for readers who already have one of our apps",
  },
  /** All three apps together. */
  bundle: {
    productId: "wDMOSJIqK40DaP5STkK7Pw==",
    checkout: "https://oneayahtime.gumroad.com/l/auwpw",
    price: "$89 a year",
    label: "All three apps — One Ayah At A Time, Spelling Quest and Muslim Kids Checklist",
  },
};

/**
 * Gumroad product IDs for our OTHER apps — Spelling Quest and Muslim Kids
 * Checklist. A valid key from any of these earns *either* discount price — the
 * $25 second-app price and the $89 all-three-apps price both gate on it
 * (Kathryn's rule, 19 Aug: neither is a bare buy link, both require proof).
 *
 * Empty for now: those two are not on Gumroad yet. While this list is empty
 * both discount prices are still reachable, by Spelling Quest **access code**
 * (below), which needs no shop at all. Add the product IDs when those apps
 * move across and keys start working too, with no other change.
 */
export const OTHER_APP_PRODUCT_IDS: string[] = [];

/**
 * Gumroad product IDs for Spelling Quest's and Muslim Kids Checklist's OWN
 * "all three apps" bundle products. Each app sells its bundle from its own
 * account — separate accounts can't share one product — but a bundle bought
 * from *any one* of the three shops has to unlock *all three* apps, or a
 * paying customer opens the wrong app and simply cannot get in, with no error
 * that explains why (Kathryn's rule, 19 Aug, reconciling Spelling Quest's and
 * this app's runbooks, which had drifted onto two different bundle shapes).
 *
 * Distinct from `OTHER_APP_PRODUCT_IDS` above: that list proves *ownership*
 * of any tier of another app, to unlock the $25/$89 checkout link here. This
 * list is narrower — only the other apps' *bundle* products — and is checked
 * for actually unlocking this app, in `unlockWithKey`.
 *
 * Empty for now: neither app is on Gumroad yet. Add each one's bundle product
 * ID here once it exists, with no other change needed.
 */
export const OTHER_APP_BUNDLE_PRODUCT_IDS: string[] = [];

export const SUPPORT_EMAIL = "oneayahtime@gmail.com";
export const SPELLING_QUEST_URL = "https://spellingquest.github.io";
export const KIDS_CHECKLIST_URL = "https://muslimkidschecklist.github.io";

/* ---- codes handed out by hand ----------------------------------------------
   Family, testers, a teacher, somebody who wrote in — people who should have the
   app without buying it. A code unlocks everything a paid key does and is never
   re-checked against anything, because there is nothing to check it against.
   It works with no connection at all, which is also why it is the fastest way to
   put the app in someone's hands while the shop is still being sorted out.

   **Only the salted hashes are here.** The codes themselves live in one text
   file outside the repository and are never committed, because this repository
   is public and a code in it would be a free key for the entire internet. A hash
   cannot be turned back into a code, and the codes are long and random enough
   that guessing is not on the table either.

   The device stores the *fingerprint* too, never the code.

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

/* Spelling Quest's own handout codes, so somebody invited to that app also gets
   the $25 price here. These hashes are already public in Spelling Quest's
   index.html, so copying them reveals nothing new, and a hash still cannot be
   turned back into a code. If a Spelling Quest code is ever retired, retire it
   there and here together or it will keep earning the lower price. */
const SQ_CODE_SALT = "SpellingQuest/v1/";
const SQ_CODE_HASHES = [
  "1bb8b64e5eb98c97d73c967f9cae90deb7d4c26734c85b9179c50e32b5bdd3a5",
  "cd6f4b3fa5409e2f7f5aa7db9bc12aba396fe9bfc1e9402fa8f598d70ee7eb34",
  "66aeccf744626884c451df27838361bababe178fa896c429fda643ef40fe5dee",
  "ac8baf21c7092b7fff2ec75da54bd81fac7e1ac621f8f7dec77220c0b2af1c53",
  "c22add296c477dd9d621344e1efb1cb2037f2dde595c8b04d53c6f8c645fa420",
];
const isSpellingQuestCode = (s: string) =>
  SQ_CODE_HASHES.includes(sha256(SQ_CODE_SALT + normCode(s)));

/* ---- Gumroad --------------------------------------------------------------- */

const GUMROAD_VERIFY = "https://api.gumroad.com/v2/licenses/verify";

export type Licence = {
  key: string;
  /** which of our products it came from, so a re-check asks the right question */
  productId: string;
  checked: number;
  dead: boolean;
  /** typed in while offline — check it properly on the next run */
  pending?: boolean;
};
/** `code` holds the *fingerprint* of a code we handed out, never the code. */
export type Access = { trialStart?: number; licence?: Licence; code?: string };

/** new = never opened the door; ended = paid once, and the purchase has ended. */
export type AccessState = "new" | "trial" | "trial-over" | "licensed" | "ended";

const ACCESS_KEY = "quran-tracker-access";

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
  // purchase behind it to end, and nothing to phone home about.
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

/**
 * Deliberately permissive.
 *
 * Gumroad keys look like `85DE4E4A-B7D14C10-91C3A31D-1C7D5866`, but this used to
 * insist on a stricter shape and the result was that a perfectly real Spelling
 * Quest access code was rejected before anybody was asked. Let the thing that
 * actually knows decide; all this does is avoid sending obvious nonsense.
 */
export const looksLikeKey = (s: string) => {
  const v = String(s || "").trim();
  return v.length >= 8 && /^[A-Za-z0-9][A-Za-z0-9-]*$/.test(v);
};

type GumroadPurchase = {
  product_id?: string;
  product_name?: string;
  refunded?: boolean;
  disputed?: boolean;
  chargebacked?: boolean;
  subscription_ended_at?: string | null;
  subscription_cancelled_at?: string | null;
  subscription_failed_at?: string | null;
  /** Gumroad also returns the buyer's email. It is never read or stored. */
  test?: boolean;
};
type GumroadReply = { success?: boolean; message?: string; uses?: number; purchase?: GumroadPurchase };

/**
 * Ask Gumroad about one key against one product.
 *
 * `increment_uses_count` is only set when somebody is unlocking a new device, so
 * the count in Gumroad means "devices in this household" rather than "times we
 * happened to re-check".
 */
export function verifyKey(productId: string, key: string, countIt = false): Promise<GumroadReply> {
  return fetch(GUMROAD_VERIFY, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      product_id: productId,
      license_key: key.trim(),
      increment_uses_count: countIt ? "true" : "false",
    }),
  }).then(r => r.json() as Promise<GumroadReply>);
}

/**
 * Is this purchase finished for good?
 *
 * Only three things count: refunded, disputed, or the subscription actually
 * ended. **A cancelled subscription is not finished** — cancelling means "don't
 * bill me again", and that family keeps their access until the year they paid
 * for runs out. **A failed payment is not finished either** — that is a card
 * being retried, and locking someone out mid-retry is exactly the moment they
 * would have fixed it.
 */
const isFinished = (p: GumroadPurchase | undefined) =>
  !!p && (!!p.refunded || !!p.disputed || !!p.chargebacked || !!p.subscription_ended_at);

/**
 * Every product a key could plausibly have come from: our own three, plus
 * the other two apps' "all three apps" bundle — since buying the bundle
 * anywhere has to work everywhere.
 */
const ourProducts = () => [
  ...Object.values(PLANS).map(p => p.productId),
  ...OTHER_APP_BUNDLE_PRODUCT_IDS,
].filter(Boolean);

export type Unlocked =
  | { ok: true; productId: string }
  | { ok: false; offline?: boolean; finished?: boolean; noShopYet?: boolean };

/**
 * Somebody has typed a key. Try it against each of our products until one owns
 * it — a customer has no idea which "product" they bought, and should not have
 * to.
 */
export async function unlockWithKey(key: string): Promise<Unlocked> {
  const products = ourProducts();
  /* No products configured means no key can be checked against anything.
     This must NOT fall through to the offline path: that path exists to let a
     paying customer in when the network is down, and with nothing to check
     against it would let *anybody* in with *any* text. Say so instead. */
  if (!products.length) return { ok: false, noShopYet: true };
  let reachedSomething = false;
  for (const productId of products) {
    try {
      const res = await verifyKey(productId, key, true);
      reachedSomething = true;
      if (res?.success) {
        if (isFinished(res.purchase)) return { ok: false, finished: true };
        return { ok: true, productId };
      }
    } catch {
      // this one request failed; try the next, and fall through to offline
    }
  }
  return { ok: false, offline: !reachedSomething };
}

export type OwnerCheck = { owns: boolean; product?: string; offline?: boolean };

/**
 * Does this person already have one of our other apps?
 *
 * Two ways to say yes, and the first needs no connection at all:
 *
 *  1. a **Spelling Quest access code** — checked here, on the device
 *  2. a **Gumroad key** for one of our other products, once they are on Gumroad
 *
 * A network failure answers `offline`, never `no`. Somebody who really does own
 * Spelling Quest must never be told they don't because a request timed out.
 */
export async function ownsAnotherApp(key: string): Promise<OwnerCheck> {
  if (isSpellingQuestCode(key)) return { owns: true, product: "Spelling Quest" };
  if (!looksLikeKey(key)) return { owns: false };
  if (!OTHER_APP_PRODUCT_IDS.length) return { owns: false };   // nothing to check against yet
  let reached = false;
  for (const productId of OTHER_APP_PRODUCT_IDS) {
    try {
      const res = await verifyKey(productId, key, false);
      reached = true;
      if (res?.success && !isFinished(res.purchase)) {
        return { owns: true, product: res.purchase?.product_name };
      }
    } catch { /* try the next */ }
  }
  return { owns: false, offline: !reached };
}

/**
 * The quiet weekly re-check. Resolves to the access it wants saved, or null if
 * nothing should change — which is the answer for every failure that isn't
 * Gumroad plainly saying the purchase is over.
 */
export async function recheck(a: Access): Promise<Access | null> {
  if (a.code && codeOk(a.code)) return null;        // nothing behind a code to check
  const licence = a.licence;
  if (!licence?.key || licence.dead) return null;
  if (Date.now() - (licence.checked || 0) < RECHECK_DAYS * 86400000) return null;

  // A key typed in while offline was never really checked, and we may not know
  // which product it belongs to. Do the whole search now.
  if (licence.pending || !licence.productId) {
    const found = await unlockWithKey(licence.key);
    if (found.ok) return { ...a, licence: { ...licence, productId: found.productId, checked: Date.now(), pending: false } };
    if (found.finished) return { ...a, licence: { ...licence, checked: Date.now(), dead: true } };
    return null;                                    // still offline: try again next time
  }

  try {
    const res = await verifyKey(licence.productId, licence.key, false);
    const next: Licence = { ...licence, checked: Date.now() };
    // A key Gumroad has never heard of is not proof of anything on its own —
    // only an explicit "this purchase is over" locks the door.
    if (res?.success && isFinished(res.purchase)) next.dead = true;
    return { ...a, licence: next };
  } catch {
    return null;                                    // offline or blocked: leave everything alone
  }
}

/** Where a buy button goes. An unwired plan falls back to email, never nowhere. */
export const buyHref = (which: keyof typeof PLANS = "family") => {
  const plan = PLANS[which];
  if (plan.checkout) return plan.checkout;
  const subject = `One Ayah At A Time — ${plan.price}`;
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`;
};

/** Is the shop actually open? Used to soften the copy while it is not. */
export const shopIsOpen = () => !!PLANS.family.checkout;
