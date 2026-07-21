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

## 3. Path versioning — app deploys are now purge-free ✅

App code ships as immutable, version-pinned bundles: `tools/deploy-app-version.js`
uploads `app/{subject}/v{N}/…` and rewrites `app/{subject}/index.html` to reference
`v{N}/course-ui.{js,css}` directly (a `current.json` records the live version). With
the rules above:

- **A new release** (`node tools/deploy-app-version.js v2`) uploads `v2/` (a new
  immutable path — instant cache miss, no purge) and re-uploads the short-cached
  `index.html` pointer, which flips to `v2/` within the 5-minute TTL. **No purge.**
- **Rollback** = re-deploy the previous `index.html` (old `vN/` is still on storage).
- The `?v=…` query strings still inside the modules are now vestigial (harmless);
  the path is the cache key.

Until the app-tier Edge Rule (#4) is set, a first cutover to a new `vN` still needs
one purge (the old `index.html` is 30-day cached). After it's set, deploys are
purge-free.

## Orphaned app-tree data (cleanup, do AFTER the purge)

The old per-grade data still sits at `app/{subject}/grade-N/data/…` from the P0.3
deploy. Nothing references it once the new app code is live, but don't delete it
**before** the purge (the still-cached old code would 404 on uncached units).
After the purge, it can be removed with a storage-API DELETE sweep.
