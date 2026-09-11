# Going live: Grade 3 Art & Design

**Not done.** Grade 3 is built and gated; nothing of it is on the CDN and no
Moodle course exists for it. Grade 1 went live through four parts (see
[`../grade-1-app/GO-LIVE.md`](../grade-1-app/GO-LIVE.md)); one of them, the
`art` slug in `pqpg_ehel_subject_map()`, is already on the box and covers
every Art & Design grade, so Grade 3 needs three, the same three as Grade 2.

## 1. The app, from this machine — media first, then the pages

```bash
cd src/prototypes/ehel-academy/art-and-design/grade-3-app
node ../lesson-kit/deploy-media.mjs --app . --upload
node ../../mathematics/lesson-app-tools/deploy.mjs --app . --upload
```

Media first because a page asks only for clips its index lists, and a miss on
a path that does not exist yet is cached at the edge. The pages include
`starting-check.html` (`extraPages`). Its review links go to
`../grade-2-v2/`, so **Grade 2 must be live first**, or the links a
not-yet-ready child is sent to are 404s.

## 2. The course — the catalogue

`tools/generate-ehel-catalog.js` already reads every
`art-and-design/grade-N-app/app.config.json`, so a regenerated catalogue
carries `ehel-art-g03` with eight units (the lessons). Regenerate it from a
clean tree (it reads every subject, so another session's unfinished content
would ride along), publish it with `upload-app-to-bunny.js catalog`, point
`local_prequran/catalog_source_url` at the new file and run the sync task: it
creates `EHEL-ART-G03`. Regenerate `cohorts.json` in the same change if the
Stage 3 pilot cohort should carry it.

## 3. The route — on the box

`repoint-grade.php` has the Grade 3 row (`ehel-art-g03` to
`app/art-and-design/grade-3-v2/index.html`). Stage it the usual way (a fresh
filename under `Ehel Primary/qa/`, fetched with a hash check), then in the
docroot:

```bash
php <staged-repoint-script>.php --subject art-and-design --grade 3          # report
php <staged-repoint-script>.php --subject art-and-design --grade 3 --apply  # write
```

Only after step 2: with no course `ehel-art-g03`, the override points a key
nothing launches.
