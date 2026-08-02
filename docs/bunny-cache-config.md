# Bunny Cache Configuration — ehelacademy pull zone

**2026-07-22.** The content/app/media split only pays off if each tier caches on
its own cadence. Right now the `ehelacademy` pull zone caches **everything** at
`Cache-Control: public, max-age=2592000` (30 days, Bunny's default) and **ignores
query strings** — so `?v=…` cache-busting does **not** work; only a purge or a
shorter TTL refreshes a file. These two dashboard changes fix that.

## 1. One-time purge (makes the content split go live)

The new app code (fetches data from `content/…`) and the content tree are both on
storage, but the pull zone still serves the 30-day-cached old app code (which
fetches the co-located `app/…/grade-N/data/…`, still present, so the site keeps
working). **Purge once** to flip to the new code + content tree:

- Bunny dashboard → **Pull Zones → ehelacademy → Purge Cache** (purges everything), **or**
- API: `curl -X POST "https://api.bunny.net/pullzone/3928521/purgeCache" -H "AccessKey: <ACCOUNT_API_KEY>"`
  (the **account API key**, not the storage key — Account Settings → API Key)

After purge, verify (should print `4` / a content URL):
```
curl -s "https://ehelacademy.b-cdn.net/Ehel%20Primary/app/mathematics/shared/course-ui.js" | grep -c dataRootUrl
```

## 2. Cache tiers via Edge Rules (so future edits go live without purges)

Pull Zone → ehelacademy → **Edge Rules → Add Rule**. Each rule: action
**"Override Cache Time"**, condition on **Request URL** matches the pattern.

Add these in order — Edge Rules match **top to bottom**, so the immutable
`v{N}/` and media rules must come *before* the short-cache app rule.

| # | Tier | URL pattern (contains) | Override cache time | Why |
|---|---|---|---|---|
| 1 | Versioned code | `*/app/*/v` *(matches `/v1/`, `/v2/`…)* | **1 year** | `app/{subject}/vN/…` is immutable — a new release is a new path, never re-fetched |
| 2 | Media | `*/media/*` | **1 year** | Audio/video/images are content-addressed & immutable |
| 3 | Content | `*/content/*` | **5 minutes** | Unit JSON is edited often — edits should appear fast |
| 4 | App pointers + assets | `*/app/*` | **5 minutes** | `index.html` + `current.json` are the release pointers and must flip; per-grade images fall here too (small, rarely change) |

Media + versioned code are ~99% of bytes and requests, so keeping them at 1 year
holds the cache-hit ratio high while pointers and content stay fresh within 5 min.

### What is actually configured (measured 2026-08-02)

Rules 1 and the `index.html` half of rule 4 are live. Rule 4's general `*/app/*`
pattern is **not** — everything under `app/` that is not `index.html` still falls
through to the 30-day default:

| path | Cache-Control | as designed? |
|---|---|---|
| `app/{subject}/v{N}/…` | `max-age=31536000` | ✅ 1 year |
| `app/{subject}/index.html` | `max-age=300` | ✅ 5 min |
| `app/{subject}/current.json` | `max-age=2592000` | ❌ documented as a pointer that flips |
| `app/{subject}/shared/…` | `max-age=2592000` | ❌ |
| `app/shared/…` | `max-age=2592000` | ❌ |

The two tiers the release mechanism actually depends on — immutable `v{N}/` and a
short-cached `index.html` — are both correct, so deploys work. The rest matters
in two places:

- **`current.json` reports the live version and is cached for 30 days**, so it can
  name a release that was superseded weeks ago. Trust `index.html` (which is what
  browsers load) when the two disagree.
- **`app/{subject}/shared/grade-redirect.js`** is a stable path by design, so an
  edit to it is stuck behind the 30-day TTL. It is six lines and has not changed;
  if it ever needs to, purge that path.

Adding the general `*/app/*` rule would fix both. Until then, nothing else should
be served from a stable path under `app/`.

## 3. Path versioning — app deploys are now purge-free ✅

App code ships as immutable, version-pinned bundles: `tools/deploy-app-version.js`
uploads `app/{subject}/v{N}/…` and rewrites `app/{subject}/index.html` to reference
`v{N}/course-ui.{js,css}` directly (a `current.json` records the live version). With
the rules above:

- **A new release** (`node tools/deploy-app-version.js v2`) uploads `v2/` (a new
  immutable path — instant cache miss, no purge) and re-uploads the short-cached
  `index.html` pointer, which flips to `v2/` within the 5-minute TTL. **No purge.**
- **Rollback** = re-deploy the previous `index.html` (old `vN/` is still on storage).
- The `?v=…` query strings have been removed from the six `index.html` entries.
  They were not merely vestigial — they read as a working cache-bust and were
  repeatedly relied on. Verify for yourself that they do nothing:

  ```bash
  curl -sD - -o /dev/null "https://ehelacademy.b-cdn.net/Ehel%20Primary/app/english/shared/course-ui.css?probe=$RANDOM" | grep -i "cdn-cache\|cachedat"
  ```

  A never-before-seen query string returns `CDN-Cache: HIT` with the same
  `CDN-CachedAt` as the bare URL. The path is the cache key; the query is not
  part of it.

  That probe is safe because it targets a path that **exists**, on the 30-day
  tier. Do not adapt it to a `v{N}/` path you have not uploaded yet — see the
  warning below.

### ⚠ Never request a `v{N}/` URL before you upload it

Edge Rule #1 sets **Override Cache Time = 1 year** on `*/app/*/v`. Bunny applies
an override to whatever the origin returned — including a **404**. So fetching a
version path that does not exist yet caches the miss for a year, and the release
you upload afterwards is invisible behind it.

This is not theoretical. On 2026-08-02 a pre-deploy check ran

```bash
curl -o /dev/null -w '%{http_code}' ".../app/computing/v114/course-ui.js"   # DON'T
```

to see whether `v114` existed. It did not. The deploy then uploaded all 77 files
successfully, and every course still broke: `index.html` had flipped to `v114`,
but the edge kept serving the cached 404. The signature is unmistakable once you
look for it —

```
CDN-Cache: HIT
CDN-RequestPullCode: 404          ← the origin 404 that got cached
Cache-Control: public, max-age=31536000
```

Three things make it nasty:

- **The deploy reports success.** Storage really does have every file; only the
  edge is lying. `curl` against `storage.bunnycdn.com` returns 200 the whole time.
- **It poisons only the exact URLs requested.** That check hit `course-ui.js` and
  `design-system.css` but never `course-ui.css`, so the CSS loaded and the JS
  404'd — the courses rendered, styled, and never booted. A half-broken app is
  much harder to read than a dead one.
- **You probably cannot purge it.** A purge needs the Bunny **account API key**,
  which is not in `.env` (that holds the *storage* key). Without it the poisoned
  path stays poisoned.

**Recovery: bump the tag.** `v{N+1}` is a path nothing has ever requested, so it
cannot be poisoned. That is the whole point of immutable paths, and it is faster
than chasing a purge. v114 was abandoned this way and v115 shipped minutes later.

**To check whether a tag is free, ask storage, not the CDN** — storage is the
origin, so a 404 there caches nothing:

```bash
curl -s -o /dev/null -w '%{http_code}\n' -H "AccessKey: $BUNNY_KEY" "https://storage.bunnycdn.com/ehelacademy/Ehel%20Primary/app/computing/v117/course-ui.js"
```

**Verify a release only after the upload finishes.** At that point the paths
exist, so requesting them caches a 200 — which is what you want anyway.

### The invariant: a version bundle must be self-contained

Path versioning only busts the cache for what is **inside** `v{N}/`. Anything a
bundle reaches out to still comes from an unversioned, 30-day-cached path, so the
release is only partly pinned. This was live and unnoticed: `mathematics` and
`science` on v110 both opened `v110/course-ui.css` with

```css
@import url("../../english/shared/course-ui-20260723e.css");
```

which resolves to `app/english/shared/` and carries the 67 KB design system —
most of the CSS in the release. Dating that filename by hand (`-20260723e`) was
the workaround; minting a new alias and repointing five importers was a manual
ritual nobody could be expected to get right every time.

`deploy-app-version.js` now copies the design system in as `v{N}/design-system.css`
and rewrites the `@import`, and does the same for the `app/shared/` modules a
standalone subject imports. `--dry` prints the release and fails loudly if any
reference still escapes:

```bash
node tools/deploy-app-version.js v114 --dry --shell english
```

The one deliberate exception is `app/shared/fonts/*.woff2`: a woff2 is immutable
under its own name, so it is already content-versioned.

Two guards back this up. `versionIndexHtml()` refuses to deploy a subject whose
`index.html` does not reference `./shared/course-ui.css` and `./shared/course-ui.js`
— that silently shipped a bundle nothing loaded. And `upload-app-to-bunny.js` no
longer uploads `index.html`/`current.json` for a subject: it was overwriting the
rewritten pointer with the source copy, which is how `english` ended up live on
`./shared/…` while its intact `v113/` bundle sat unused.

Until the app-tier Edge Rule (#4) is set, a first cutover to a new `vN` still needs
one purge (the old `index.html` is 30-day cached). After it's set, deploys are
purge-free.

## Orphaned app-tree data (cleanup, do AFTER the purge)

The old per-grade data still sits at `app/{subject}/grade-N/data/…` from the P0.3
deploy. Nothing references it once the new app code is live, but don't delete it
**before** the purge (the still-cached old code would 404 on uncached units).
After the purge, it can be removed with a storage-API DELETE sweep.
