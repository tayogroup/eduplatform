# Ehel Academy — Prioritised Change Register

**Draft 2026-07-21.** Consolidates every change discussed across content, pilot,
and scale architecture. Priorities: **P0** pilot-critical (by 1 Aug) · **P1**
scale foundation (right after pilot) · **P2** migration & cleanup · **P3** growth
& hardening. Status: ✅ done · 🔄 in progress · ⬜ to do.

The pilot runs on the **static prototype** (localStorage progress, no Moodle
integration), so most of the platform build is P1+, not P0.

---

## Status snapshot — already done / running

| Item | Status |
|---|---|
| English / Math / Science content reviews + fixes (quizzes, concepts, vocab, misconceptions) | ✅ |
| Cambridge framework naming across all 3 subjects (0058/0096/0097, 0861/0862/0893) | ✅ |
| English audio — readings 356, grammar 486, speaking 486 (all grades) | ✅ |
| Math audio — concepts + worked examples + real problems (static tts/ cache) | 🔄 generating |
| Science home-experiment safety guidance (AI-assisted) | ✅ (human sign-off pending) |
| Pilot content-review doc (AI-assisted educator role) | ✅ |
| "Listen to this page" removed from all 3 subjects | ✅ |
| Git LFS migration of media (local only, not pushed) | 🔄 superseded by "media → Bunny" (P1) |
| Scale plan + allocation table + plugin triage docs | ✅ |

---

## P0 — Pilot-critical (by 1 Aug)

| # | Change | Why / dependency |
|---|---|---|
| P0.1 | **Finish math audio generation** (all 6 categories) | 🔄 running; top up ElevenLabs as needed |
| P0.2 | **Host pilot static media on Bunny** (not git) | Repo is 1.4 GB+ of audio; serve from `ehelacademy.b-cdn.net`. Resolves the LFS-push question |
| P0.3 | **Deploy the 3 static courses to Bunny** for the pilot cohort | The pilot serving surface |
| P0.4 | **Human safety sign-off on padded home experiments** | Minors do these unsupervised — the one genuine risk item |
| P0.5 | **Cambridge "aligned" wording — legal/registration check** | Public claim about Cambridge frameworks |
| P0.6 | **Child-data basics: privacy policy, terms, consent** | Learners are minors; required even for a pilot |
| P0.7 | **Confirm pilot access** (how the cohort gets in, per-device progress expectations) | Static pilot = localStorage, disclose the limitation |

---

## P1 — Scale foundation (right after pilot, before adding breadth)

| # | Change | Why / dependency |
|---|---|---|
| P1.1 | **Provision 2 ScalaHosting VPS** — production isolated, staging+intg shared | Prod blast-radius isolation; version+host parity |
| P1.2 | **Stand up the 4-tier pipeline** (local/unit · intg · staging · production), one pinned Moodle version; retire hosting.com | Every promotion tests what ships |
| P1.3 | **Env config matrix in the repo** (CDN base, storage zone, Moodle URL, DB, TTS per tier) | Config-as-code for 4 tiers |
| P1.4 | **Progress web service** (localStorage → Moodle `save_progress`/`get_progress`) | **#1 prerequisite** — progress must follow the student + feed the gradebook |
| P1.5 | **Consolidate per-subject apps → one data-driven SPA shell** | Unsustainable to ship an app per subject at 10+ subjects |
| P1.6 | **Bunny deploy pipeline** — changed-file upload, `app/vN/` versioning, promote via `current.json` | Repeatable content/media/app releases |
| P1.7 | **Catalog: static `catalog.json` + Moodle catalog-sync task** (categories/courses/cohorts) | Adding a subject = a catalog row + rerun |
| P1.8 | **Extend `course_launch.php`** — add `unit` env + `ehel` prefix, signed launch tokens; SPA reads `course=` | Launch flow for the scaled product |
| P1.9 | **Media → Bunny; video → Bunny Stream**; repo keeps generators + a manifest | System of record for delivered media; ends git bloat |
| P1.10 | **Redis MUC + tuned OPcache + deploy-time cache invalidation** | Fixes the OPcache-staleness class of bug at the root |

---

## P2 — Migration & cleanup (per-feature, alongside P1)

| # | Change | Why / dependency |
|---|---|---|
| P2.1 | **hubredirect: migrate ~122 UI pages → Bunny SPA** (per feature; student dashboard first) | Half the plugin is server-rendered UI (see triage doc) |
| P2.2 | **hubredirect: refactor page DB-writes → thin web-service endpoints** | Mutations stay in Moodle, UI leaves |
| P2.3 | **hubredirect: move 4 static-data files → JSON** (`country_cities`, `country_timezones`, …) | Datasets, not logic |
| P2.4 | **hubredirect: delete 15 cruft files** (mock/test/probe/fixture) — verify `placement_tests`, `sqa_tracker_api` first | Don't ship test fixtures |
| P2.5 | **prequran: split `externallib_v4.php`** (501 KB / 508 fns) into domain modules | Becomes THE API contract; must stay maintainable |
| P2.6 | **prequran: add web-service endpoints** for migrated hubredirect UI + progress/roster/catalog | Serves the moved-off UI |
| P2.7 | **ehelhome: rewire 4 deps → Bunny, then retire the plugin** | Old Quraan landing; marketing pages belong on Bunny (needs the replacement confirmed) |
| P2.8 | **Uninstall `mb2builder` + `mb2megamenu` server-side** | No longer needed; zero code references |
| P2.9 | **SPA i18n bundle on Bunny** (EN + Arabic RTL) | Bidi from the start |

---

## P3 — Growth & hardening

| # | Change | Why / dependency |
|---|---|---|
| P3.1 | **Add subjects 4→N per grade** (catalog rows + content builds) | Breadth, reusing the shell |
| P3.2 | **Extend Grades 9–12** (Lower Secondary Stage 9 + IGCSE codes/content) | Depth; needs Year 9–12 sources |
| P3.3 | **Per-tenant metering + rate limits** (billing basis + noisy-neighbour containment) | Unpredictable per-tenant growth |
| P3.4 | **Hybrid tenancy** — pool small/medium, dedicated install for whale tenants; onboarding capacity gate | Cap blast radius of any one tenant |
| P3.5 | **Edge compute** (Bunny) — launch-token verify, rate limiting, progress-beacon buffering, analytics ingestion | Offload the thin Moodle tier |
| P3.6 | **Progress off the synchronous DB path** (queue/worker or separate store, summaries → gradebook) | The one high-volume write |
| P3.7 | **Read-path edge caching** (enrolments/roster, token-authed) | Second-most-frequent Moodle hit |
| P3.8 | **Offline service worker** (cache a unit's JSON + audio) | Intermittent-connectivity learners |
| P3.9 | **Analytics/events → analytics store** (not Moodle) | Telemetry off the backend |
| P3.10 | **CI review gate** — audit scripts block unreviewed/broken content promotion | Quality at scale |
| P3.11 | **Full human curriculum sign-off** (Sept reviewer audits the AI-reviewed corpus) | From pilot to accredited |
| P3.12 | **Teacher-lecture video production → Bunny Stream** (71+ units) | The remaining media gap; needs production, not TTS |

---

## Critical path (the spine)

**P0.1–P0.3 (pilot)** → **P1.4 progress WS + P1.5 unified app + P1.9 media→Bunny**
(the three that unblock everything) → **P1.1–P1.3 environments + P1.6–P1.8 deploy/catalog/launch**
→ **P2 migration per feature** → **P3 growth**. Tenancy hardening (P3.3–P3.7) waits until a
second sizeable tenant is real — build the *seams* (metering, service interface) early, the
machinery late.

---

## Release log — app tier (`deploy-app-version.js`, zone `ehelacademy` / "Ehel Primary")

Newest first. Each tag is an immutable `app/{subject}/v{TAG}/` bundle; the
subject's `index.html` is the pointer. Content and audio tiers ship separately
(`upload-media-to-bunny.js`, content uploader) and are not listed here.

| Date | Tag | Subjects | What shipped | Notes |
|---|---|---|---|---|
| 2026-08-19 | content-only, no tag | English | **Hotfix**: restored `successCriteria` on all 6 Grade 5 Unit 2 writing tasks (`bd8ad9412`). The field was dropped by the sub-agent that added `completedExample` to that one file in the v195 Grades-5-8 release below — `task.successCriteria.split(";")` then threw on `undefined` and crashed the Writing studio and slide-deck renderer entirely for that unit, live in production. No content validator catches a dropped-but-present-elsewhere field; found by live-browser verification of Grade 5 at the user's request, not by any automated check. A field-diff sweep of all 486 writing tasks in Grades 1-8 against their pre-`completedExample` git state (comparing key sets, not just JSON validity) found this was the only file affected. Content tier only, 1 file uploaded. | The lesson: after any bulk automated content edit, diff the full key set per object against the prior commit, not just validity/spot-checks — a validator can pass while a UI-only runtime crash ships. |
| 2026-08-19 | v195 (content-only) | English | "Completed example" extended from Grades 1-4 to Grades 5-8 — all 240 Grade 5-8 writing tasks (`1c54e2dbf`). Grades 5-8 use the classic studio view only (no slide deck), and the renderer already handled the field generically, so no code changed and no new app tag was needed — `current.json` was v195 going in and stayed v195. Content tier: the 40 changed Grade 5-8 unit JSON files. | Caught two defects before shipping: units 3-4 had required vocabulary wrapped in literal `**word**` (the renderer has no markdown processing, so these would have rendered as literal asterisks) — stripped 82 instances; a demeanor→demeanour spelling fix in unit 4 was first applied file-wide and broke the unit's existing vocabulary IDs and audio file references (the actual `.mp3`s on disk keep the US spelling) — reverted to match the unit's own established spelling everywhere outside the new content. `check:english`, `validate:curriculum-units --strict-cambridge` clean afterward. Upload-only release (`upload-content-to-bunny.js`); tiers confirmed in step post-upload. |
| 2026-08-19 | **v195** | English | "Completed example" extended from Grade 1 to Grades 2-4 — same `completedExample` field, worked answers authored per-task for all 180 Grade 2-4 writing tasks (`1507d1b74`). Code-only diff vs v194 is a stale comment fix in `completedExampleHtml`'s header (no renderer logic changed — it already handled the field generically). Content tier: the 30 changed Grade 2-4 unit JSON files. | Confirmed v194 was still the live tag before releasing (`current.json` + a direct `v195` 404 probe), so no stale-tag risk this time. `--verify` 13/13 from the edge; content+app+audio tiers back in step afterward. `current.json`'s own cache-control read back as `max-age=300` here, not the 30-day figure recorded elsewhere in this doc — re-measure before trusting either number, per the standing warning below. |
| 2026-08-19 | **v194** | English | Grade 1 writing tasks gain a "Completed example" (worked-example bullets + alternative valid answers where open-ended), shown next to "View model text" in both the writing studio and the slide deck (`completedExampleHtml`, `1731891f1`). Content tier: the 11 Grade 1 unit JSON files carrying the new `completedExample` field. | v193 was already live going into this session (another session's release, not logged here — likely `003512bd6`, the most recent English commit on `main` before this one; this local checkout's manifest only knew up to v192, so its own "next free tag" suggestion of v193 was stale; confirmed the real floor via `current.json` and a direct probe of `v193`/`v194` on the CDN before releasing). `--verify` 13/13 from the edge; content+app+audio tiers back in step afterward. |
| 2026-08-17 | **v178** | Mathematics, Science, Computing, Global Perspectives, Intensive English | Shell completion card at the end of every section and the unit finish line (`course-app.js` `renderCompletionCard`, `1b02af5c0`); Wehel dock pill kept clear of page content (`8b8329654`) | Cut from a clean worktree at `8b8329654` with the working tree's bytes, because the tree held another session's uncommitted `course-app.js` edit. `--verify` read all 74 files back from the edge; pointers on v178. |
| 2026-08-17 | v177 | Mathematics, Science, Computing, Global Perspectives, Intensive English | Same content as v178 | **Superseded within the hour** — the worktree checked out with `core.autocrlf=true`, so the bundle was CRLF and the tier check reported 10-12 files "behind" per subject. Functionally identical; left on storage (version paths cannot be removed). |
| 2026-08-17 | v177 | English | 2026-08-17 content review: answer keys, grammar rules, factual slips, learner-addressed text, British spelling; reviewed narration workbook synced (`eecf81410`) | Released by the English review session after v176. |
| 2026-08-17 | v176 | English | Section completion card + unit finish line (`d74f00981`); Grade 1-4 decks end on a closing slide (`450d1ba73`) | Code-only; `--verify` 13/13 from the edge. |
| earlier | v175 English · v175 Mathematics · v161 Science · … | — | see `.bunny-appver-manifest.json` (local) | Predates this log. |

Two things every release here relearned, kept so the next one does not:

- **The tool ships the working tree.** If another session has an uncommitted
  edit in a shared file, release from a detached worktree at `HEAD` — and check
  out with `core.autocrlf=false` (or mirror the main tree's bytes) so the shas
  match what `check-ehel-deploy-sync.mjs` compares against.
- **`--verify` always.** A version path with a cached 404 cannot be purged; the
  read-back is what proves the edge serves the release.
