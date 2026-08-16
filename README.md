# One Ayah At A Time

An illustrated Quran memorization tracker for families. A learner colors in a book for every
surah they learn, across eight illustrated pages covering all 30 Juz.

This is a **static site**: a folder of fixed files with no server behind it. That is what lets it
be hosted free on GitHub Pages.

---

## How the pieces fit together

| Folder | What it holds |
|---|---|
| `src/` | The app's source code — `App.tsx` is the whole tracker |
| `public/` | The artwork, copied into the built site untouched |
| `docs/` | **The built site.** This is the folder GitHub Pages serves |

`docs/` is generated. Never edit anything inside it by hand — the next build overwrites it.

---

## Making a change

```bash
npm install     # once, after cloning
npm run dev     # preview locally while editing
npm run build   # regenerate docs/ — always do this before committing
```

`npm run build` type-checks first and refuses to build if anything is broken.

**A change is only live once `docs/` has been rebuilt, committed, and pushed.** Editing `src/`
alone changes nothing that anyone can see. If the live site looks stale, the usual cause is a
build that was never run.

### Checking a deploy actually landed

GitHub Pages takes 1–10 minutes. Don't trust the commit — check the live URL, with a
cache-buster so you aren't reading a cached copy:

```js
const t = await fetch(location.origin + location.pathname + 'assets/app.js?cb=' + Math.random())
  .then(r => r.text());
({ size: t.length, hasNewThing: t.includes('SOME_STRING_ONLY_IN_THE_NEW_VERSION') })
```

---

## Where the artwork logic lives

All of it is in `src/App.tsx`.

- **`bookRects`** — every surah is a percentage-coordinate rectangle overlaid on the page image.
- **The flood-fill** — clicking a book recolors connected light, low-saturation pixels
  (`light > 112 && sat < 132`) that touch its rectangle. **The PNG is never modified**; the color
  is painted onto a canvas drawn over it.
- **`cropForJuz()`** — trims each page's bottom, hiding the printable form area that the app
  replaces with its own fields.
- **`iconRects`** — where the overlay image (the star / crescent / prayer-bead status graphic)
  sits on each book. Measured from the artwork, **one size per page**.

Books start white with no overlay. An overlay appears only once a book is colored and a status
chosen.

---

## Where progress is stored

In the browser's own storage, on the device being used. Nothing is sent anywhere — there is no
server and no account.

Syncing progress between devices, unlocked by a family code, is planned but not built. When it
lands it will use Supabase, keyed by a hash of the family code.

---

## Hosting

Built output goes to `docs/`, and GitHub Pages is set to serve **main branch, /docs folder**.
That means push equals deploy — there is no build step running on GitHub, and nothing to
configure beyond that one setting.

Asset paths are **relative**, so the same build works whether the site is served from the root of
a domain or from a subfolder. Changing the address later needs no rebuild.
