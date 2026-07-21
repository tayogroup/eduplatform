# Ehel Academy — Scale Architecture Plan

**Status:** Draft for review · 2026-07-21
**Scope:** Ehel Academy as a consumer tenant on the eduplatform platform.
**Target scale:** 12 grades × 9–12 subjects × 9–12 units ≈ **~1,200 units / ~120 subject-courses**.
**Now:** 3 subjects (English, Mathematics, Science), Grades 1–8, prototyped as static apps.

## Guiding principle

**Don't invent a new stack — extend the proven `pre_quraan` pattern.** The platform
already runs this exact shape for the Quraan product: a static SPA on Bunny CDN,
launched from Moodle with student identity, backed by Moodle web services and a
TTS proxy. Ehel Academy becomes a second product on the same rails.

What already exists and is reused verbatim:
- **Bunny pull zone** `ehelacademy.b-cdn.net` (see `course_launch.php:90`).
- **Launch flow** `local_hubredirect/course_launch.php` → `{cdn}/{env_base}/app/index.html?course=…&studentid=…&pq_env=…`.
- **Environment base paths** `/pre_quraan/` (prod) and `/pre_quraan_staging/` (staging).
- **Bunny Storage API** `pqh_upload_bytes_to_bunny_storage`, `pqh_bunny_storage_config`, `bunny_storage_zone/host/access_key`.
- **Consumer + catalog** `local_prequran_consumer(_domain)`, `pqh_course_catalog()`, `pqh_normalize_course_key()`.
- **Runtime TTS proxy** `local_hubredirect/quiz_tts.php`.

---

## 0) Environments (decided 2026-07-21)

Four tiers, **one pinned Moodle version everywhere**, all deployed tiers on
ScalaHosting + Bunny for full version-and-host parity. hosting.com (legacy
`quraantest`, older Moodle) is **retired from the topology** — kept only as the
live legacy site until production cutover, then decommissioned.

| Tier | Moodle backend | Static/CDN | Bunny base path | Purpose |
|---|---|---|---|---|
| **local / unit** | Local Moodle (Docker/SPanel), pinned to ScalaHosting's version | Bunny | `ehel_unit/` | Dev + component QA on a machine matching prod's Moodle version |
| **intg** | ScalaHosting | Bunny | `ehel_integration/` | Shared integration — first deployed ScalaHosting tier |
| **staging** | ScalaHosting | Bunny | `ehel_staging/` | Prod dress rehearsal — identical host + version to prod |
| **production** | ScalaHosting | Bunny | `ehel/` | Live |

Rationale: a **Moodle version split across tiers is disqualifying** — lower tiers
would test plugins against a Moodle you don't ship (changed APIs, schema, web-service
signatures), so intg would give false green. Consolidating on ScalaHosting means every
promotion tests exactly what ships; upgrades flow *through* the pipeline
(local → unit → intg → staging → prod) rather than existing as a permanent split.
`course_launch.php` already resolves integration/staging/production — add `unit` and
swap the product prefix `pre_quraan` → `ehel`.

## 1) Static files — folder structure in Bunny

Three independent lifecycles, kept in separate top-level trees so each can deploy,
cache, and version on its own cadence:

```
ehelacademy.b-cdn.net/
  ehel/                                  # product base path (prod). Staging = ehel_staging/
    app/                                 # ONE data-driven SPA shell for all subjects
      v42/                               #   versioned bundle → immutable, cache 1 year
        index.html
        course-ui.js  course-ui.css
        shared/… (shells, visuals, webgl, generators)
      current.json                       #   {"version":"v42"} — the only mutable app file (short TTL)
    content/                             # small per-unit JSON — edits often, no code redeploy
      english/g03/
        manifest.json
        capstone.json
        units/u01.json … u10.json
      mathematics/g03/…
      science/g03/…
    media/                               # large, IMMUTABLE, content-addressed → cache 1 year
      english/g03/audio/readings/<id>.mp3
      english/g03/audio/grammar/<id>.mp3
      mathematics/g03/audio/tts/<cyrb53>.mp3
      science/g03/video/<id>.mp4
      shared/images/<sha1>.webp
```

Design rules:
- **Immutable media, hashed filenames** (`<cyrb53>.mp3`, `<sha1>.webp`). Never overwritten,
  so `Cache-Control: public, max-age=31536000, immutable` — no purges, infinite CDN hits.
  (English readings/grammar/speaking already use stable IDs; math already uses `cyrb53(text)`.)
- **Versioned app bundle** (`app/v42/`). Deploy new code beside the old; flip `current.json`
  to release. In-flight sessions keep working; instant rollback = flip back.
- **Content JSON is the only frequently-edited tree.** Short TTL (e.g. 300s) or ETag
  revalidation so unit fixes go live without a code deploy or a media re-upload.
- **`g01`–`g12`, zero-padded**; subject folders match the repo (`english`, `mathematics`, `science`, …).
- **Environment isolation** via base path: `ehel/` (prod) vs `ehel_staging/` — mirrors
  the existing `/pre_quraan/` vs `/pre_quraan_staging/`.

Naming stays canonical and machine-parseable, extending today's IDs:
`eng-g03-t01-u01` → subject-grade-term-unit. Subject prefixes: `eng`, `mat`, `sci`, then new ones.

---

## 2) Moodle course structure / categories

Moodle owns **identity, enrolment, gradebook, completion, teacher tools, reporting** —
*not* the learning content (that's Bunny). One Moodle **course = one subject at one grade**.

Category tree (idnumbers in brackets — stable keys the sync script and catalog use):

```
Ehel Academy                         [ehel]                     (consumer top category)
  Grade 1                            [ehel-g01]
    Cambridge Primary English 0058 — Stage 1     course [ehel-eng-g01]
    Cambridge Primary Mathematics 0096 — Stage 1 course [ehel-mat-g01]
    Cambridge Primary Science 0097 — Stage 1     course [ehel-sci-g01]
    …(9–12 subjects)
  Grade 2                            [ehel-g02]
    …
  Grade 12                           [ehel-g12]
```

- **~120 Moodle courses** (12 × ~10), not ~1,200. **Units are content inside the Bunny app**,
  surfaced in Moodle only as **gradebook items / completion criteria** (unit checkpoint, capstone).
- **Course `idnumber` = the catalog key** (`ehel-eng-g03`) that maps 1:1 to the Bunny content
  path `content/english/g03/`. Extend `pqh_course_catalog()` with a row per course:
  `{key, consumer:'ehel', subject, grade, cambridgeCode, bunnyPath, cohort}`.
- **Cohorts per grade** (`ehel-cohort-g03`) for bulk enrolment / promotion between grades.
- **Cambridge naming already computed** (Primary 0058/0096/0097, Lower Sec 0861/0862/0893) —
  reuse the `cambridgeFramework(stage)` helper for course fullnames.
- **A grade is a cohort of enrolments, not 10 separate logins** — one student, one Moodle
  account, enrolled in their grade's cohort → sees all their subject courses.

A CLI sync (`local_prequran` task) reads the catalog and idempotently creates any missing
category / course / cohort — so adding a subject or grade is a catalog row + a rerun, not manual clicking.

---

## 3) UI and access to the courses in Bunny

**Moodle is the auth/enrolment authority; Bunny serves a stateless, cacheable SPA; the SPA
personalises itself via Moodle web-service calls.**

Launch flow (extends `course_launch.php`):
1. Student signs in on the Ehel consumer domain (Moodle SSO).
2. Dashboard lists their enrolled subject-courses (from the catalog).
3. Clicking a course hits `course_launch.php?course=ehel-eng-g03` → mints a **short-lived signed
   launch token** and redirects to
   `https://ehelacademy.b-cdn.net/ehel/app/index.html?course=ehel-eng-g03&studentid=…&token=…&pq_env=production`.
4. The **one** SPA reads `course=` → loads `content/english/g03/manifest.json` + units from CDN,
   and `app/current.json` for its own version. No secrets in the static bundle.
5. Personalised data (roster, saved progress, teacher feedback) comes from **Moodle web services**
   authenticated by the launch token; **TTS** from `quiz_tts.php` (runtime) or the pre-generated
   `media/.../tts/<hash>.mp3` (static-first, already implemented for math).

Key upgrade from the prototype:
- **Progress must move from `localStorage` to a Moodle web service** so it follows the student
  across devices and feeds the gradebook. Today drafts/scores/XP are per-device only — acceptable
  for a pilot, **required before public scale**. Add `local_prequran` web-service endpoints
  `save_progress` / `get_progress` keyed by (studentid, courseKey, section); the SPA calls them
  with the launch token; unit-checkpoint results write Moodle grade items.
- **Consolidate to one data-driven app.** Today each subject ships its own `index.html` +
  `course-ui.js`. At 10+ subjects that's unsustainable. Recommend a single shell that renders
  from `content/{subject}/g{NN}` — subject-specific bits (science visuals, math generators) become
  pluggable modules loaded by subject. (Migration cost is real; do it before subject #4.)

Access control lives entirely in Moodle: enrolment gate on launch, token expiry, guardian/managed-student
consent checks already present in `course_launch.php`.

---

## 4) Deployment to Bunny and Moodle

**Repo is the single source of truth.** Build → deploy to staging → verify → promote.

**Content & media → Bunny** (a `deploy-ehel-to-bunny` script over the existing Storage API):
1. **Build**: run the content builders (`build-ehel-*-runtime.js`) → `content/**` JSON;
   media already produced by the `generate-ehel-*-audio.js` tools.
2. **Diff & upload**: upload only changed files (compare local hash vs a Bunny manifest).
   Media is content-addressed → new files only, never overwrites.
3. **App bundle**: upload to `app/v{N}/`; do **not** touch `current.json` yet.
4. **Cache**: purge only `content/**` and `current.json` (media/app are immutable).
5. **Promote**: flip `current.json` → `v{N}`. Rollback = flip back. Same for `ehel_staging/` → `ehel/`.

**Moodle → plugins + catalog** (existing `deploy/<workspace>-vNN/` zip pattern):
1. Ship `local_prequran` / `local_hubredirect` updates (catalog rows, web-service endpoints,
   `course_launch.php`, `quiz_tts.php`) via the established staged-zip + `live_audit` verification.
2. Run the **catalog sync task** → creates missing categories/courses/cohorts, wires `idnumber`s.
3. Set Bunny configs (`bunny_storage_zone/host/access_key`, `bunny_cdn_base_url`) per environment.

**Media does NOT live in git long-term.** The ~1.4GB English audio (now Git-LFS-migrated) and the
growing math/video media should be **built in CI and pushed to Bunny**, with the repo holding the
*generators* + a media manifest, not the binaries. Git LFS is a reasonable interim; Bunny Storage
is the system of record for delivered media. (This resolves the open LFS-push question: push code
to git, media to Bunny.)

**CI/CD**: git push → CI builds content + validates (the audit scripts) → uploads to `ehel_staging/`
→ smoke test → manual/auto promote to `ehel/`. Moodle plugin release stays on the current review-gated
zip cadence.

---

## 4b) What lives where — allocation

**Rule: only the irreducible record-of-truth + credential auth + authoritative
mutations stay in Moodle. Everything else moves to Bunny** (static file, Bunny
Stream, edge cache, or edge compute).

**Stays in Moodle — the must-keep core:**

| Capability | Why it can't move |
|---|---|
| Authentication & credentials | Identity source of truth; the login itself |
| User accounts & profiles (records) | Authoritative person records |
| Roles & permissions | Authority definitions + assignments |
| Enrolment records (the *write*) | Authoritative "who is registered in what" |
| Gradebook & progress — *durable store* | System of record for results |
| Guardian–student links & consent | Authoritative + legal |
| Mutation web-services + launch-token *signing* | Enrol, commit grade/progress, teacher feedback, consent — thin write endpoints |
| Notification dispatch (email/SMS) | Backend send job (not a file) |

**Moves to Bunny — everything else:**

| Capability | Bunny mode | Trigger |
|---|---|---|
| Course catalog / manifest | Static JSON | Changes on publish, not per user |
| Course content (units) | Static JSON | Immutable per version |
| App / UI shell | Static, versioned | Code, not data |
| Audio narration | Static, content-hashed | Immutable |
| Video — lectures, live recordings | **Bunny Stream** | Large; adaptive delivery |
| TTS narration | Pre-generated static | Proxy only for the long tail |
| Reference / worksheets / PDFs / rubrics | Static | Downloadable artifacts |
| Games / interactive assets | Static | Client-side already |
| i18n / translation bundles | Static JSON | Strings, not logic |
| Live-session slides | Static | Materials |
| Certificates / report **artifacts** | Static (Moodle *issues*, Bunny *delivers*) | Rendered file |
| "My enrolments" / roster **reads** | Edge cache, token-authed | Read-mostly, personalised |
| Gradebook / progress **reads** (display) | Edge cache | Read-mostly |
| Launch-token verification + routing | Edge compute | Stateless verify of a Moodle-signed token |
| Per-tenant rate limiting / throttling | Edge compute / rules | Contain noisy tenants |
| Progress-beacon buffering | Edge compute | Batch writes before the backend |
| Analytics / event ingestion | Edge → analytics store (**not Moodle**) | High-volume telemetry |
| Public / marketing / course-description pages | Static | Fully static |

**Net residual Moodle work per session:** authenticate → return a small enrolment
list → accept a batched progress write → mint a launch token. Everything
high-volume and tenant-count-sensitive is off Moodle.

## 5) Others

- **Progress/state sync** (localStorage → Moodle WS) — the #1 platform gap before scale; see §3.
- **Content authoring & review pipeline** — source docs → build scripts → JSON → **human curriculum
  sign-off** (the "AI-assisted review, human pending" model in `docs/ehel-pilot-content-review.md`) →
  deploy. Bake the audit scripts into CI so no unreviewed/broken content promotes.
- **Media generation cost & budget** — ElevenLabs credits (audio) and Bunny storage/bandwidth grow
  with scale (~1,200 units). Track per-subject character counts; pre-generate for static, keep the
  runtime TTS proxy for the long tail. Video (lectures) is the biggest and needs a separate production plan.
- **Cache strategy** — immutable media/app (1yr), content JSON (short TTL/ETag), `current.json`
  (no-cache). Gives instant content edits + safe code releases + zero media purges.
- **Internationalisation / RTL** — the launch params already carry `pq_lang`/`pq_lang_scope`; design
  content JSON and the shell for EN + Arabic (RTL) from the start.
- **Analytics & evidence** — beacon section-completion/quiz events to Moodle (grade items + logs);
  optionally xAPI later. Teacher dashboards already exist in `local_hubredirect`.
- **Security** — no secrets in the Bunny bundle; short-lived signed launch tokens; CORS-locked
  Moodle web services; rate-limit `quiz_tts.php`; consent checks already enforced at launch.
- **Offline / low-bandwidth** — consider a service worker to cache a unit's JSON + audio for
  intermittent-connectivity learners (relevant to the East-African audience the content addresses).
- **Naming & IDs** — one canonical scheme everywhere: `{subj}-g{NN}-t{NN}-u{NN}`, Cambridge codes,
  catalog `idnumber`s. Never per-grade codes (see `docs`/memory: grade = Cambridge Stage).

---

## Suggested phasing

1. **Foundation** — build the deploy-to-Bunny script + catalog sync + one unified app shell; wire
   progress web services. Prove with the 3 current subjects, Grades 1–8.
2. **Pilot** — the 3 subjects live on `ehelacademy.b-cdn.net/ehel/`, launched from Moodle, progress
   synced, on the 1 Aug pilot cohort.
3. **Breadth** — add subjects 4→N per grade band (catalog rows + content builds), reusing the shell.
4. **Depth** — extend Grades 9–12 (Lower Secondary → IGCSE); add Stage 9 and IGCSE codes.
5. **Hardening** — offline, analytics, i18n/RTL, full curriculum sign-off, media fully on Bunny.
