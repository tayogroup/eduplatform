# Going live: Grade 4 Art & Design

**Not done.** Grade 4 is built, reviewed, recorded and gated; nothing of it is
on the CDN and no Moodle course exists for it. Grades 2 and 3 went live on
2026-09-12 and their GO-LIVE files record exactly what was run; this is the
same three steps, and the traps below are the ones those two hit.

## 1. The app, from this machine — media first, then the pages

```bash
cd src/prototypes/ehel-academy/art-and-design/grade-4-app
node ../lesson-kit/deploy-media.mjs --app . --upload
node ../../mathematics/lesson-app-tools/deploy.mjs --app . --upload
```

Media first because a page asks only for clips its index lists, and a miss on
a path that does not exist yet is cached at the edge. The pages include
`starting-check.html` and `lesson-search.json` (`extraPages`). The starting
check's review links go to `../grade-3-v2/`, so **Grade 3 must be live
first** — it is.

## 2. The course — the catalogue

`tools/generate-ehel-catalog.js` reads every
`art-and-design/grade-N-app/app.config.json`, so a regenerated catalogue
carries `ehel-art-g04` with eight units. **Check what else a regenerated
catalogue would carry before publishing it**: on 2026-09-12 a fresh one also
carried another session's Intensive English unit renames, whose content was
not deployed, so what was published instead was the in-use catalogue with only
the new Art courses inserted and every other course byte-identical. Compare,
then point `local_prequran/catalog_source_url` at the new file and run the
catalogue sync task; it creates `EHEL-ART-G04`.

**The routing cannot tell you whether the course exists.** The override map
accepts any key, so after routing, probe for the course itself — that is how
Grades 2 and 3 were found to be routed at keys nothing could launch, because
Moodle was still syncing from a catalogue that predated them.

## 3. The route — on the box

`repoint-grade.php` needs a Grade 4 row for `art-and-design`
(`ehel-art-g04` to `app/art-and-design/grade-4-v2/index.html`); Grades 1 to 3
are there. Stage the script the usual way — a fresh, unguessable filename
under `Ehel Primary/qa/`, fetched on the box to a temporary name, hash-checked,
then moved into place — and run it from the DOCROOT, not the home directory:

```bash
php <staged>.php --subject art-and-design --grade 4          # report
php <staged>.php --subject art-and-design --grade 4 --apply  # write
```

Delete both copies afterwards, this side and the box's. A staged CLI script
needs `define('CLI_SCRIPT', true);` before it requires `config.php`, and a
re-stage takes a NEW filename, because the edge caches the first fetch.

Still open after all three steps, and not an engineering task: **enrolment**.
The Art pilot cohort roster is empty, as it has been since Grade 1 went live.
