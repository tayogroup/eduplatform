<!--
  Extracted from the root CLAUDE.md on 2026-09-12.
  Loads on demand when Claude reads files in this directory,
  so it costs no context in sessions that work elsewhere.
  Cross-cutting rules stay in the root CLAUDE.md.
-->

### The portal pages are a deploy channel too, and it had no tool

`src/portal/*.html` (~150 pages) are served from Bunny at `platform/portal/`,
the second half of the manual Moodle release — plugin PHP to the server, portal
HTML here. Every other tier had an uploader; this one had none, and the cost was
measurable. On 2026-08-21 the two live pages were serving **2026-07-22 and
2026-07-31** builds, three merged commits behind, including the fix that first
showed families any app quiz score at all. Nothing in the repo could say so.

```bash
node tools/upload-portal-to-bunny.js                       # drift report, uploads nothing
node tools/upload-portal-to-bunny.js --upload <page.html>  # named pages
node tools/upload-portal-to-bunny.js --upload --all        # everything that differs
```

**The default is a drift report, not an upload** — "what is stale?" had no
answer before, and it is the question worth asking most often. Assume nothing
about the other ~150 pages; ask the tool.

#### Routes are gated before the upload, not after

```bash
npm run check:portal-routes                  # offline, deterministic
node tools/check-portal-routes.mjs --cdn     # plus the two CDN-only questions
```

A menu entry is `["portal:live-ops", …]`, which becomes
`portal_launch.php?report=live-ops`, resolved against an explicit `$reports`
allowlist. **A report id missing from that allowlist does not 404** — the
launcher falls through to its default, so the user silently lands on a different
page than the one they clicked. Nothing else reads both sides of that mapping.
`upload-portal-to-bunny.js` runs the gate before any PUT and refuses on failure
(`--skip-route-check` overrides), because once a dead link is on the CDN the
only symptom is somebody saying "that button goes to the wrong place".

It became worth writing when `dashboard.html` shipped after a month of drift and
took its menu from 40 entries to 112 — 99 `portal:` links in one upload, against
an allowlist nothing had ever checked it agreed with.

Mutation-tested: a dead link, a deleted allowlist entry, an entry pointing at no
file, a stale exemption, and a `$reports` format change that makes the parser
match nothing — all five must fail the gate. That last one matters most: a
parser that silently matches nothing passes every other check while comparing
against an empty map, which is green because it did no work. The gate refuses to
run below 50 parsed entries for that reason.

`--cdn` adds what only the CDN can answer. **18 `dashboard-N.html` pages are
live with no source in the repo** — design variants uploaded during the 2026-07
build and never committed — and `portal_launch.php` routes `report=dashboard` at
`dashboard-19.html`, one of them. So that route works and nothing can edit it.
Recorded as the gate's one exemption; an exemption that stops firing is itself a
failure, so it cannot rot.

Two more things learned the hard way here, both now in the tool:

- **Verify storage first, the edge second.** Pages are `max-age=300` with warm
  entries, so straight after a PUT the edge legitimately still serves the old
  copy. The first version checked only the edge and reported a perfectly good
  deploy as `✗ STILL STALE` — a false alarm that, left in, teaches whoever runs
  it to ignore the check. Storage answers "did the write land" immediately; the
  edge answers "what does a parent see" after the TTL.
- **Prove the origin before believing a stale read.** When the edge kept serving
  old bytes after a confirmed write, the decisive test was writing a
  uniquely-named probe file to storage and fetching it through the CDN: it came
  back instantly, which proved the origin was right and the staleness was only
  cache. Without that, the obvious next guess — "I uploaded to the wrong zone" —
  would have sent a re-upload somewhere worse.

