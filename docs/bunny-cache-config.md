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

| Tier | URL pattern (contains) | Override cache time | Why |
|---|---|---|---|
| Content | `*/content/*` | **5 minutes** | Unit JSON is edited often — edits should appear fast |
| App HTML/JS/CSS | `*/app/*` (see note) | **5 minutes** | App code isn't path-versioned yet; short TTL avoids a purge per fix |
| Media | `*/media/*` | **1 year** | Audio/video/images are content-addressed & immutable — never re-fetched |

Media is ~99% of bytes and requests, so keeping it at 1 year holds the cache-hit
ratio high while everything else stays fresh within 5 minutes.

> **Note (app tier):** `app/*` also matches the per-grade images/video under
> `app/{subject}/grade-N/media/…`. Those are large and immutable, so ideally
> exclude them: make the media rule pattern `*/media/*` **and** add a second
> long-TTL rule for `*/app/*/grade-*/media/*`, or simply keep the whole `app/*`
> short for the pilot (the per-grade media is already cached and rarely purged).

## 3. Post-pilot: make app code immutable (removes the app-tier compromise)

Move app code to versioned paths `app/{subject}/v{N}/…` released via a
short-cached `current.json` pointer (deferred P1 item). Then `app/*/v*/*` becomes
`max-age=1y immutable` like media, and a deploy = upload a new `vN` + flip
`current.json` — no purge, no query strings. Until then, the 5-minute app TTL above
is the interim.

## Orphaned app-tree data (cleanup, do AFTER the purge)

The old per-grade data still sits at `app/{subject}/grade-N/data/…` from the P0.3
deploy. Nothing references it once the new app code is live, but don't delete it
**before** the purge (the still-cached old code would 404 on uncached units).
After the purge, it can be removed with a storage-API DELETE sweep.
