# Catalog Sync — integration steps (P1.7)

**2026-07-22.** P1.7 turns a static `catalog.json` into real Moodle courses +
grade items, keyed by `idnumber` — which is the exact link the progress web
service (P1.4c) needs: `push_gradebook()` resolves
`get_record('course', ['idnumber' => $coursekey])`, so **no course = no grade**.
Once this sync has run, the gradebook push goes live.

## Pieces

| Piece | State | What it is |
|---|---|---|
| `tools/generate-ehel-catalog.js` | ✅ live | Builds `catalog.json` from the prototype `course-manifest.json`s — 24 courses (3 subjects × Stages 1–8), 6 categories, 267 unit grade-item keys. |
| `src/prototypes/ehel-academy/catalog.json` | ✅ generated + deployed | Source of truth. On Bunny at `Ehel Primary/catalog.json` (serves 200 via `ehelacademy.b-cdn.net`). |
| `src/moodle/local_prequran/classes/task/catalog_sync.php` | ⚠️ inert | Scheduled task: fetch catalog → ensure categories, courses (by idnumber), grade items. Lints clean; does nothing until registered + configured. |

`catalog.json` shape (per course): `idnumber` (`ehel-{eng|math|sci}-gNN`),
`fullname`, `shortname`, `categoryPath`, `cambridgeCode`, `stage`, and
`units[]` (`number`, `idnumber`, `title`). The course `idnumber` matches the
ProgressClient course id and the WS `coursekey`; each unit's `number` matches the
`iteminstance` `push_gradebook()` writes.

## Regenerate + redeploy the catalog (safe, no Moodle)

```bash
node tools/generate-ehel-catalog.js            # rewrites catalog.json (byte-stable)
BUNNY_KEY=… curl -X PUT \
  "https://storage.bunnycdn.com/ehelacademy/Ehel%20Primary/catalog.json" \
  -H "AccessKey: $BUNNY_KEY" -H "Content-Type: application/json" \
  --data-binary @src/prototypes/ehel-academy/catalog.json
```

Adding/renaming a unit or grade = rerun both, then rerun the Moodle sync task.

## Activate the sync (on a Moodle instance you can test)

Like the progress WS, the class ships **inert** so it can't run untested against
the plugin that serves all consumers. Four edits switch it on:

**1. `settings.php`** — add the catalog source URL (inside the `if ($hassiteconfig)` block):

```php
$settings->add(new admin_setting_configtext(
    'local_prequran/catalog_source_url',
    'Ehel catalog URL',
    'catalog.json that the catalog-sync task reads to create courses + grade items.',
    'https://ehelacademy.b-cdn.net/Ehel%20Primary/catalog.json',
    PARAM_URL
));
```

**2. `lang/en/local_prequran.php`** — add the task name string:

```php
$string['task_catalog_sync'] = 'Ehel Academy catalog sync';
```

**3. `db/tasks.php`** — append to `$tasks` (daily at 03:10, adjust as needed):

```php
[
    'classname' => 'local_prequran\task\catalog_sync',
    'blocking'  => 0,
    'minute'    => '10',
    'hour'      => '3',
    'day'       => '*',
    'month'     => '*',
    'dayofweek' => '*',
],
```

**4. `version.php`** — bump `$plugin->version` so Moodle re-reads `db/tasks.php`
and registers the task. (Coordinate with the P1.4c version bump — do both in one
increment if activating together.)

Run **Site administration → Notifications**, set the catalog URL under
**Site administration → Plugins → Local plugins → local_prequran**, then run the
task once: **Site administration → Server → Scheduled tasks → Ehel Academy
catalog sync → Run now**.

## Verify

```
# courses exist keyed by idnumber
SELECT idnumber, shortname, fullname FROM {course} WHERE idnumber LIKE 'ehel-%';
# grade items exist for a course (itemtype mod / module local_prequran)
SELECT gi.iteminstance, gi.itemname FROM {grade_items} gi
  JOIN {course} c ON c.id = gi.courseid
  WHERE c.idnumber = 'ehel-math-g03' AND gi.itemmodule = 'local_prequran'
  ORDER BY gi.iteminstance;
```

Then re-run the progress WS test from
[progress-webservice-integration.md](progress-webservice-integration.md): a
`checkpoint.result` ingest for `course=ehel-math-g03` now writes a grade to the
matching `Progress: u03` item instead of soft-skipping.

## Notes

- **Idempotent.** Categories/courses are get-or-created by idnumber; grade items
  by their `grade_update` coordinates. Re-running only fixes drift (course moved
  category, fullname/summary changed).
- **Enrolment.** New courses get a manual enrolment instance. Cohort/auto
  enrolment of the pilot cohort is a separate step (P1.7 cohorts / launch flow).
- **Env-agnostic.** Courses + gradebook are shared across a Moodle instance; the
  progress table's `environment` column (staging/integration/production) keeps
  per-tier *progress* separate on a shared Moodle, but a course is a course.
