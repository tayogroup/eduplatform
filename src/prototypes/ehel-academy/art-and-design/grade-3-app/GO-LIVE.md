# Going live: Grade 3 Art & Design

**DONE, 2026-09-12.** Grade 3 is live and routed: course `ehel-art-g03`
(Moodle id 85, visible), override pointing at
`app/art-and-design/grade-3-v2/index.html`, applied and read back clean.

What was run, in this order:

1. **The app, from this machine** - media before pages, each read back from
   storage (never through the edge):

   ```bash
   cd src/prototypes/ehel-academy/art-and-design/grade-3-app
   node ../lesson-kit/deploy-media.mjs --app . --upload    # 2,208 media files
   node ../../mathematics/lesson-app-tools/deploy.mjs --app . --upload   # 15 files
   ```

2. **The course.** `catalog_source_url` was still on `catalog-d2cbee310b.json`,
   which predates this build, so the nightly sync could never have created the
   course. A freshly GENERATED catalogue would also have carried another
   session's Intensive English Level 1 unit renames, whose content is not
   deployed - so the published catalogue is the in-use one with these two Art
   courses inserted and every other course and category byte-identical
   (verified, not assumed): `catalog-b8da71b83f.json`. The operator set
   `catalog_source_url` to it and ran the catalogue sync task (`local_prequran \ task \ catalog_sync`)
   ("2 courses created/updated, 475 grade items ensured"). The next
   generator-published catalogue supersedes it and carries these courses
   anyway, because they come from this build's own `app.config.json`.

3. **The route**, staged under `Ehel Primary/qa/` with a fresh name, fetched
   on the box to a temporary name, hash-checked, then run from the docroot:

   ```bash
   php <staged>.php --subject art-and-design --grade 3          # report
   php <staged>.php --subject art-and-design --grade 3 --apply  # write
   ```

   Both copies of every staged script were deleted afterwards, this side and
   the box's.

Verified on the LIVE pages, not just the files: the hub answers, a lesson
loads with no page errors, fetches its narration index (so the recorded voice
resolves rather than falling back to the paid runtime voice), and records
progress with the corrected timing - nothing while the page draws, the
overview on leaving it, Our world on arrival.

Still open, and not an engineering step: **enrolment**. The Art pilot cohort
roster is empty, as it was for Grade 1.
