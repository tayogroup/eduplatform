# Progress Web Service — integration steps (P1.4c)

**2026-07-22.** The progress web service ships as two **inert** files in
`local_prequran`, so nothing runs against the live plugin until you wire them in
on a Moodle instance you can migrate and test:

- `externallib_progress.php` — the `local_prequran_progress_external` class
  (`progress_ingest` + `progress_get`). Both lint clean (`php -l`).
- `db/progresslib.php` — `xmldb_local_prequran_ensure_progress_schema()`, which
  creates `local_prequran_progress` (one reduced state row per env/user/course/unit).

They implement the server side of [progress-event-contract.md](progress-event-contract.md)
and are the target of the app's `remote` ProgressClient backend.

> Why unapplied: bumping `version.php`/`db/upgrade.php` auto-runs a schema
> migration on the next deploy of a plugin that serves **all** consumers. Apply
> these four edits only where you can run the upgrade and the curl tests below.

## The four edits to activate

**1. `db/services.php`** — add to the `$functions` array (auto-enrolls into the
existing `prequran_ws` service, which uses `array_keys($functions)`):

```php
'local_prequran_progress_ingest' => [
    'classname'   => 'local_prequran_progress_external',
    'methodname'  => 'progress_ingest',
    'classpath'   => 'local/prequran/externallib_progress.php',
    'description' => 'Progress contract: ingest a batch of learner progress events.',
    'type'        => 'write',
    'ajax'        => true,
],
'local_prequran_progress_get' => [
    'classname'   => 'local_prequran_progress_external',
    'methodname'  => 'progress_get',
    'classpath'   => 'local/prequran/externallib_progress.php',
    'description' => 'Progress contract: hydrate a learner\'s saved course state.',
    'type'        => 'read',
    'ajax'        => true,
],
```

**2. `db/install.php`** — add alongside the other `ensure_*` calls (after the
`require_once .../db/upgradelib.php` line):

```php
require_once($CFG->dirroot . '/local/prequran/db/progresslib.php');
xmldb_local_prequran_ensure_progress_schema();
```

**3. `db/upgrade.php`** — add a savepoint block (use a version just above the
current `version.php`):

```php
if ($oldversion < 2026072200) {
    require_once($CFG->dirroot . '/local/prequran/db/progresslib.php');
    xmldb_local_prequran_ensure_progress_schema();
    upgrade_plugin_savepoint(true, 2026072200, 'local', 'prequran');
}
```

**4. `version.php`** — bump `$plugin->version` to match (e.g. `2026072200`, must
be ≥ the current `202607210002` and equal to the savepoint above).

Then visit **Site administration → Notifications** to run the upgrade, and
**Site administration → Server → Web services → External services** to confirm
`prequran_ws` now lists the two `local_prequran_progress_*` functions.

## Test recipe (once migrated)

Get a token for the `prequran_ws` service, then:

```bash
# ingest a batch (writes one durable checkpoint + a state summary)
curl -s "$MOODLE/webservice/rest/server.php" \
  -d "wstoken=$TOKEN&moodlewsrestformat=json" \
  -d "wsfunction=local_prequran_progress_ingest" \
  -d "userid=$UID&course=ehel-eng-g03&contract=1.0&pq_env=integration" \
  --data-urlencode 'events_json=[
    {"id":"e-1","type":"checkpoint.result","unit":"u01","section":"quiz","seq":1,"at":"2026-07-22T10:00:00Z","score":92,"passed":true,"attempt":1},
    {"type":"progress.summary","unit":"u01","seq":2,"at":"2026-07-22T10:00:02Z","sectionsDone":["quiz"],"xp":40}]'
# → {"ok":true,"accepted":2,"durable":1,"dropped":0,"stateversion":1}

# resend the SAME batch — durable dedups, summary is idempotent LWW
# → {"ok":true,"accepted":1,"durable":0,"dropped":1,"stateversion":2}

# hydrate
curl -s "$MOODLE/webservice/rest/server.php" \
  -d "wstoken=$TOKEN&moodlewsrestformat=json&wsfunction=local_prequran_progress_get" \
  -d "userid=$UID&course=ehel-eng-g03&pq_env=integration"
# → state_json = {"course":"ehel-eng-g03","student":…,"stateVersion":2,
#     "units":{"u01":{"sectionsDone":["quiz"],"checkpoints":{"quiz":{"score":92,"passed":true,"attempt":1}},"xp":40,…}}}
```

## Point the apps at it

The apps already speak this contract via the ProgressClient `remote` backend.
Launch a course with `?pwsEndpoint=<edge-or-moodle-base>&pwsToken=<token>` and it
POSTs batches / hydrates with zero app changes. In production the edge verifies a
signed launch token and forwards to these two functions (see the contract's edge
routing); direct-to-Moodle also works for a first integration.

## Known follow-ups

- **Auth delegation.** `assert_progress_allowed()` currently permits self +
  siteadmin only. Extend it to the teacher/guardian relationships that
  `local_prequran_external::assert_quiz_save_allowed()` already checks, so staff
  tooling can read a learner's progress.
- **Gradebook.** `push_gradebook()` resolves a course by catalog `idnumber`
  (`coursekey`) and soft-skips when none exists. It becomes live once the catalog
  sync (P1.7) creates the courses + grade items; until then progress persists and
  hydrates but writes no grades — which is correct pre-catalog.
- **Edge tier.** For scale, front these with the Bunny Edge Script that coalesces
  state events and admits only durable+state to Moodle (contract §edge routing).
