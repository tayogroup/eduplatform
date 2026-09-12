# Going live: Grade 4 Art & Design

**DONE, 2026-09-12.** Grade 4 is live and routed: course `ehel-art-g04`
(Moodle id 86, visible), override pointing at
`app/art-and-design/grade-4-v2/index.html`, applied and read back clean with
all 24 overrides intact.

What was run, in this order:

1. **The app, from this machine** - media before pages, each read back from
   storage (never through the edge):

   ```bash
   cd src/prototypes/ehel-academy/art-and-design/grade-4-app
   node ../lesson-kit/deploy-media.mjs --app . --upload    # 2,267 files
   node ../../mathematics/lesson-app-tools/deploy.mjs --app . --upload   # 16 files
   ```

   Sixteen, not fifteen: `extraPages` now carries `lesson-search.json` as well
   as `starting-check.html`.

2. **The course.** A freshly GENERATED catalogue would also have carried
   another session's Intensive English Level 1 unit renames, whose content is
   not deployed - so what was published is the in-use catalogue with this one
   course inserted and every other course and category byte-identical
   (verified, not assumed): `catalog-d74e4d1418.json`. The operator pointed
   `catalog_source_url` at it and ran the catalogue sync task, which reported
   "1 courses created/updated, 484 grade items ensured".

3. **The route**, staged under `Ehel Primary/qa/` with a fresh name, fetched
   on the box to a temporary name, hash-checked, then run from the docroot:

   ```bash
   php <staged>.php --subject art-and-design --grade 4          # report
   php <staged>.php --subject art-and-design --grade 4 --apply  # write
   ```

4. **The course was PROVED to exist afterwards**, with a read-only probe: all
   four Art courses are there (ids 83, 84, 85, 86) and visible. This is the
   step that matters most, because the override map accepts a key whether or
   not a course answers to it - which is exactly how Grades 2 and 3 came to be
   routed at keys nothing could launch while Moodle still synced an older
   catalogue.

Both copies of every staged script were deleted afterwards, this side and the
box's.

Verified on the LIVE pages, not just the files: the hub and the starting check
answer, and a lesson loads with no page errors, fetches its recorded narration
and its lecture video from the CDN, and records progress with the corrected
timing - nothing while the page draws, the overview on leaving it, Our world
on arrival.

**Known, and not this build's:** at 375px these pages overflow horizontally by
46px, as does every other standalone app measured - bar 1's right-hand cluster
needs 327px where 299px is free. It came with another session's lesson search
and is in pages already live across the platform; the fix belongs in that
tool's CSS.

Still open, and not an engineering step: **enrolment**. The Art pilot cohort
roster is empty, as it has been since Grade 1 went live.
