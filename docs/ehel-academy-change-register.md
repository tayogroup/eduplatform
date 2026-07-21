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
