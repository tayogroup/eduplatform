# Going live: Grade 2 Art & Design

**Not done.** Grade 2 is built, gated, driven and committed; nothing of it is
on the CDN and no Moodle course exists for it. Grade 1 went live through four
parts (see [`../grade-1-app/GO-LIVE.md`](../grade-1-app/GO-LIVE.md)); one of
them, the `art` slug in `pqpg_ehel_subject_map()`, is already on the box and
covers every Art & Design grade, so Grade 2 needs three.

## 1. The app, from this machine — media first, then the pages

```bash
cd src/prototypes/ehel-academy/art-and-design/grade-2-app
node ../lesson-kit/deploy-media.mjs --app . --upload
node ../../mathematics/lesson-app-tools/deploy.mjs --app . --upload
```

Media first because a page asks only for clips its index lists, and a miss on
a path that does not exist yet is cached at the edge. The pages include
`starting-check.html` (`extraPages`). Its review links go to
`../grade-1-v2/`, which is live.

## 2. The course — the catalogue

`tools/generate-ehel-catalog.js` already reads every
`art-and-design/grade-N-app/app.config.json`, so a regenerated catalogue
carries `ehel-art-g02` with eight units (the lessons). Regenerate it from a
clean tree (it reads every subject, so another session's unfinished content
would ride along), publish it with `upload-app-to-bunny.js catalog`, point
`local_prequran/catalog_source_url` at the new file and run the sync task: it
creates `EHEL-ART-G02`. Regenerate `cohorts.json` in the same change if the
Stage 2 pilot cohort should carry it.

## 3. The route — on the box

`repoint-grade.php` has the Grade 2 row (`ehel-art-g02` to
`app/art-and-design/grade-2-v2/index.html`). Stage it the usual way (a fresh
filename under `Ehel Primary/qa/`, fetched with a hash check), then in the
docroot:

```bash
php <staged-repoint-script>.php --subject art-and-design --grade 2          # report
php <staged-repoint-script>.php --subject art-and-design --grade 2 --apply  # write
```

Only after step 2: with no course `ehel-art-g02`, the override points a key
nothing launches.
