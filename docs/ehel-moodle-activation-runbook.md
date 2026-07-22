# Ehel Moodle Activation — one-shot runbook

**2026-07-22.** The wiring for all three inert pieces — the **progress web
service** (P1.4c), **catalog sync** and **cohort sync** (P1.7) — is now APPLIED
in the plugin source under one version bump (`202607220001`, release
`0.1.9-ehel-progress-catalog-cohort`). The per-piece "four edits" sections in
[progress-webservice-integration.md](progress-webservice-integration.md),
[catalog-sync-integration.md](catalog-sync-integration.md) and
[cohort-enrolment-integration.md](cohort-enrolment-integration.md) are done;
this runbook is the single path from here to live.

What one deploy + upgrade now does:
- creates table `local_prequran_progress` (idempotent XMLDB)
- registers WS functions `local_prequran_progress_ingest` / `_get` into the
  existing `prequran_ws` service
- registers scheduled tasks **catalog_sync** (daily 03:10) and **cohort_sync**
  (daily 03:25)
- adds two admin settings, defaulted to the live CDN files:
  `catalog_source_url` → `…/Ehel Primary/catalog.json`,
  `cohorts_source_url` → `…/Ehel Primary/cohorts.json`
  (Moodle writes setting defaults during upgrade, so the tasks are armed
  immediately; blank either setting to disable its task.)

## 0. Before you deploy (5 min)

1. **Roster** — if you want enrolments on the first run, fill `members[]` in
   `cohorts.json` and re-upload it to Bunny (see the cohort doc §1). With empty
   rosters the task still creates the 8 cohorts + enrol links — harmless.
2. **Accounts** — cohort_sync only matches EXISTING users (username/email);
   create pilot accounts first (Site administration → Users → Upload users).
3. **Backup** — take the usual pre-deploy DB backup. The migration is additive
   (one new table), but this is the all-consumer production Moodle.

## 1. Deploy + upgrade (10 min)

1. Deploy the updated `local_prequran` plugin to the Moodle instance via your
   normal process (the changed files: `version.php`, `settings.php`,
   `lang/en/local_prequran.php`, `db/{services,install,upgrade,tasks}.php`,
   plus the already-present `db/progresslib.php`, `externallib_progress.php`,
   `classes/task/{catalog_sync,cohort_sync}.php`).
2. Visit **Site administration → Notifications** → run the upgrade to
   `202607220001`.
3. Sanity: **Plugins → Local plugins → local_prequran** shows the two new
   "Ehel Academy catalog & enrolment" settings with the CDN defaults.

## 2. First sync run (5 min)

**Site administration → Server → Scheduled tasks:**
1. Run **"Ehel Academy catalog sync"** (Run now). Expect mtrace like:
   `Catalog sync: 6 categories created, 24 courses created/updated, 291 grade items ensured.`
2. Run **"Ehel Academy cohort enrolment sync"**. Expect:
   `Cohort sync: 8 cohorts, N memberships added, 0 unmatched, 24 cohort-enrol links ensured.`
   (Any `unmatched roster member` lines = fix the roster or create the account, rerun.)

Verify in the UI: **Courses → Manage courses** shows
`Ehel Academy → Primary/Lower Secondary → {English, Mathematics, Science}` with
24 courses named `Ehel {Subject} — Stage N`.

## 3. Web service smoke test (10 min)

Get a token for the `prequran_ws` service (Site administration → Server → Web
services → Manage tokens; any test user), then:

```bash
MOODLE=https://<your-moodle>; TOKEN=<token>; UID=<studentid>

# ingest: one durable checkpoint + one summary
curl -s "$MOODLE/webservice/rest/server.php" \
  -d "wstoken=$TOKEN&moodlewsrestformat=json&wsfunction=local_prequran_progress_ingest" \
  -d "userid=$UID&course=ehel-math-g03&contract=1.0&pq_env=production" \
  --data-urlencode 'events_json=[
    {"id":"e-smoke1","type":"checkpoint.result","unit":"u03","section":"quiz","seq":1,"at":"2026-07-22T08:00:00Z","score":85,"passed":true,"attempt":1},
    {"type":"progress.summary","unit":"u03","seq":2,"at":"2026-07-22T08:00:02Z","sectionsDone":["quiz"],"xp":40}]'
# → {"ok":true,"accepted":2,"durable":1,"dropped":0,"stateversion":1}

# resend the SAME batch → durable dedups:
# → {"ok":true,"accepted":1,"durable":0,"dropped":1,"stateversion":2}

# hydrate
curl -s "$MOODLE/webservice/rest/server.php" \
  -d "wstoken=$TOKEN&moodlewsrestformat=json&wsfunction=local_prequran_progress_get" \
  -d "userid=$UID&course=ehel-math-g03&pq_env=production"
```

**Gradebook check** (the P1.7 payoff): after the ingest, open course
`EHEL-MATH-G03` → Grades — the test user has a grade on item `Progress: u03`
(the catalog sync pre-created it, so `push_gradebook()` resolved instead of
soft-skipping). If the user isn't enrolled the grade may be hidden — enrol them
(or use a rostered learner) and re-run.

## 4. Point the apps at it (when ready)

The deployed apps already speak the contract. A learner launched with
`?pwsEndpoint=<moodle-or-edge-base>&pwsToken=<token>&studentid=<id>` switches the
ProgressClient to remote — batches POST to ingest, resume hydrates via GET,
checkpoints land in the gradebook. Without those params the apps stay on the
local (per-device) backend, exactly as in the pilot.

## Rollback

- Tasks: blank the two URL settings (tasks skip) or disable them under
  Scheduled tasks.
- WS: remove the two functions from the `prequran_ws` service (or delete the
  token).
- Schema: the `local_prequran_progress` table is inert if unused; no rollback
  needed.
