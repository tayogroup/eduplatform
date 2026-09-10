# Going live: what is done, and what has to be done on the Moodle box

**DONE, 2026-09-10 16:16 server time.** The owner ran the three steps below in
cPanel Terminal: both plugin files matched their md5s and were moved into
place; `catalog_source_url` moved from `catalog-5a4d81d7ed.json` to
`catalog-d2cbee310b.json` and the sync task created the category and the
course (`EHEL-ART-G01`, course id 83, 8 grade items among the 457 ensured);
the override was applied and read back with all 13 intact. The staged qa
folder has been deleted from the zone. What remains is enrolment: a learner in
`EHEL-ART-G01` (manual, or the Stage 1 pilot cohort once rostered) launches
straight into the build.

Art & Design is the first subject with no shell app behind it, so going live
touches four places, and only two of them can be reached from this machine.
This is the state on 2026-09-10 and the exact steps for the other two.

## Done from this machine

| what | where | proof |
| --- | --- | --- |
| the app | `https://ehelacademy.b-cdn.net/Ehel%20Primary/app/art-and-design/grade-1-v2/index.html` | `deploy.mjs --upload`: 14 files PUT, storage read-back matched, edge fresh; the live hub and two lessons booted in Chromium with no page errors |
| the catalogue | `https://ehelacademy.b-cdn.net/Ehel%20Primary/catalog-d2cbee310b.json` (plus the plain `catalog.json`) | `upload-app-to-bunny.js catalog`: uploaded 2. `ehel-art-g01` with 8 units (the lessons) under `Ehel Academy / Primary / Art & Design` |
| the cohorts | `cohorts.json` regenerated; `check:cohorts` green | `ehel-pilot-g01` now carries `ehel-art-g01` beside the other five Stage 1 courses |
| the plugin edits, STAGED | `Ehel Primary/qa/art-golive-20260910-55e184a5db0e/` on the `ehelacademy` zone (fetch from `ehelacademy.b-cdn.net`, NOT `quraanacademy`) | three files, hashes below |

Nothing reaches a learner until the Moodle side is done: the course does not
exist, the launch door does not recognise `ehel-art-g01` as an EHEL key, and
no override sends it to the page.

## To do on the Moodle box (cPanel Terminal, docroot `/home/ehelacad/quraantest.academy`)

Identify the install by its DATABASE (`ehelacad_quraantest`, the `ehel-k12`
consumer row), never by `$CFG->wwwroot`.

### 1. The two plugin files — the launch door must learn the subject

`pqpg_ehel_subject_map()` gained `'art'`; the family portal's label map gained
`Art & Design`. Download to a temporary name, hash, move only on a match:

```bash
cd /home/ehelacad/quraantest.academy
Q="https://ehelacademy.b-cdn.net/Ehel%20Primary/qa/art-golive-20260910-55e184a5db0e"
curl -fsS -o local/prequran/progress_gatewaylib.php.new "$Q/progress_gatewaylib.php"
md5sum local/prequran/progress_gatewaylib.php.new        # 10f75458fa9ac8574e532ae79d017f84
curl -fsS -o local/prequran/portal_handlers/student-parent-portal.php.new "$Q/student-parent-portal.php"
md5sum local/prequran/portal_handlers/student-parent-portal.php.new   # cab2bebf0681d40980463b2525e1c8ef
# only if BOTH hashes match:
mv local/prequran/progress_gatewaylib.php.new local/prequran/progress_gatewaylib.php
mv local/prequran/portal_handlers/student-parent-portal.php.new local/prequran/portal_handlers/student-parent-portal.php
php -l local/prequran/progress_gatewaylib.php
```

Then open `design_version.php?…&reset=1` once so the opcache drops the old
bytecode (it is process-global, so it reaches `local_prequran` even though the
listing cannot show it).

### 2. The course — point the sync task at the new catalogue and run it

Site administration → Plugins → Local plugins → Pre-Quraan →
`local_prequran/catalog_source_url`: replace the Ehel line with

```
https://ehelacademy.b-cdn.net/Ehel%20Primary/catalog-d2cbee310b.json
```

(the digest name is a guaranteed cache miss; the plain `catalog.json` is
`max-age=2592000`). Then run the scheduled task now rather than waiting:

```bash
php admin/cli/scheduled_task.php --execute='\local_prequran\task\catalog_sync'
```

It creates the category `Ehel Academy / Primary / Art & Design`, the course
`ehel-art-g01` (shortname `EHEL-ART-G01`), a manual enrolment instance, and
eight grade items, one per lesson. Note the same catalogue also carries three
changes committed on 2026-09-03 that nobody had regenerated it for: English
Grade 1 no longer lists Unit 0, English Grade 3's capstone is retitled, and
Mathematics Grade 1 Unit 14 takes the UK spelling. The task updates names and
never deletes a grade item, so the old `ehel-eng-g01-u00` item stays.

### 3. The route — send the course to the page

```bash
cd /home/ehelacad/quraantest.academy
curl -fsS -o repoint-grade-art.php "$Q/repoint-grade.php"
md5sum repoint-grade-art.php          # 2a38fcf31444a436e9cd4f3b9f07d9ac
php repoint-grade-art.php --subject art-and-design --grade 1            # report
php repoint-grade-art.php --subject art-and-design --grade 1 --apply    # write
rm repoint-grade-art.php
```

It writes one key into `local_prequran/ehel_app_url_overrides`:
`ehel-art-g01 → …/app/art-and-design/grade-1-v2/index.html`. Step 1 must be
in place first — without `'art'` in the subject map the launch door does not
consider `ehel-art-g01` an EHEL key at all and never consults the override.

### 4. Enrol, then check

Cohort sync (`\local_prequran\task\cohort_sync`) enrols the Stage 1 pilot
cohort once `cohorts.json` is re-uploaded and the roster has members; a
manual enrolment into `EHEL-ART-G01` works for a test learner meanwhile.
Launch the course from the dashboard: the hub should open with the launch
parameters carried (Wehel's dock appears; class controls only while a teacher
is on the group), and finishing a step should write `ehel-art-g01` / `u01` to
the progress gateway and tick the grade item.

## Afterwards

Delete the staged files from the zone (both the qa folder here and any
`.new` copies on the box). The qa folder is on the `ehelacademy` storage zone
under `Ehel Primary/qa/`.
