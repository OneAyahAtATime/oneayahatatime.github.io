/*
  One Ayah At A Time — service worker.

  It exists for two reasons, in this order:

    1. So the app opens with no internet. A family on a plane, in a masjid
       basement, or out of data should still be able to colour a book.
    2. Because Chrome will not offer to install a web app without one. The
       `beforeinstallprompt` event — the thing that hands the page an "Add to my
       Home Screen" button — only fires for a site with a service worker that
       has a `fetch` handler. Chrome relaxed that for menu-based install in v108
       mobile / v112 desktop, but not for the event.

  ────────────────────────────────────────────────────────────────────────────
  THE DANGER, AND HOW THIS AVOIDS IT

  A service worker done carelessly serves yesterday's files for ever. Somebody
  pushes a fix, the family never sees it, and there is no way to tell from the
  outside — the site looks live and is stale. That is the single worst failure
  mode available here, and it is worth more than the offline support.

  It comes from ONE mistake: caching the HTML cache-first. So this never does.

    · index.html and every other page  → NETWORK FIRST. Cache only as a
      fallback for when the network is actually gone. A push is therefore
      picked up on the next load, exactly as it would be with no service
      worker at all.

    · assets/app.js?v=… and app.css?v=…  → cache-first, and safe *because*
      they are stamped. A new build writes a new `?v=`, which is a new URL,
      which cannot hit an old cache entry. The stamp is what makes this
      sound; without it this rule would be the bug.

    · artwork (.png/.jpg/.webp)  → cache-first, filled as pages are opened
      rather than precached. The eight Juz pages are ~14 MB; downloading all
      of them on first visit to a site somebody has not paid for yet would be
      rude. They arrive as a family visits them, and then they are offline.

    · everything else, including Supabase  → straight to the network, never
      cached. Sync must never be answered from a cache.

  Bump CACHE_VERSION to throw away every cached asset. Not normally needed —
  stamped URLs make old entries unreachable — but it is the escape hatch if a
  cache ever needs clearing for everybody at once.
*/

const CACHE_VERSION = "v1";
const CACHE = `one-ayah-${CACHE_VERSION}`;

/* The shell needed to render something useful with no network. Deliberately
   tiny: the HTML and the icon. Stamped assets and artwork arrive through use. */
const SHELL = ["./", "./index.html", "./logo-icon.png"];

self.addEventListener("install", event => {
  // Take over as soon as this worker is ready, rather than waiting for every
  // tab to close. A visitor who reloads after a push should get the new one.
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then(cache =>
      // addAll rejects the whole install if any one file 404s, which would
      // leave the site with no worker at all. Each is added on its own.
      Promise.all(SHELL.map(url => cache.add(url).catch(() => {})))
    )
  );
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.map(n => (n !== CACHE ? caches.delete(n) : null)));
    // Control pages that were already open, so the first load after an update
    // does not run half-old and half-new.
    await self.clients.claim();
  })());
});

const isPage = request =>
  request.mode === "navigate" ||
  (request.destination === "document") ||
  new URL(request.url).pathname.endsWith(".html");

const isStampedAsset = url =>
  url.pathname.includes("/assets/") && url.searchParams.has("v");

const isArtwork = url => /\.(png|jpe?g|webp|svg)$/i.test(url.pathname);

self.addEventListener("fetch", event => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Anything not served from this origin — above all Supabase — goes straight
  // to the network. A family's progress must never come from a cache.
  if (url.origin !== self.location.origin) return;

  // ── Pages: network first, cache only as a fallback ──────────────────────
  if (isPage(request)) {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(request);
        const cache = await caches.open(CACHE);
        cache.put(request, fresh.clone());
        return fresh;
      } catch {
        const cached = await caches.match(request);
        // A page we have never opened falls back to the home page, which is
        // the whole app anyway.
        return cached || (await caches.match("./index.html")) || Response.error();
      }
    })());
    return;
  }

  // ── Stamped build assets and artwork: cache first ───────────────────────
  if (isStampedAsset(url) || isArtwork(url)) {
    event.respondWith((async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      try {
        const fresh = await fetch(request);
        if (fresh && fresh.ok) {
          const cache = await caches.open(CACHE);
          cache.put(request, fresh.clone());
        }
        return fresh;
      } catch {
        return cached || Response.error();
      }
    })());
    return;
  }

  // ── Everything else: network, with a cached copy only if offline ────────
  event.respondWith(
    fetch(request).catch(async () => (await caches.match(request)) || Response.error())
  );
});
