# Putting the programme live

The owner decided on 2026-09-18 to go live with new course keys. The live course (l00–l03, lph) and its learners stay as they are.

**Steps 0–5 were run on 2026-09-18.** What each step proved is in the Status section of `README.md`. Steps 6 and 7 are the owner's. A re-run is safe: the uploaders skip what is already on storage, and the routing report says "already pointed at its build".

Run the steps in this order. Each one says who runs it.
- Deploys are run by the owner in Windows PowerShell 5.1, from `C:\Users\inawa\documents\eduplatform`. The auto-mode classifier refuses deploy commands from Claude.
- Server steps are run on the Moodle box in cPanel Terminal, in the K-12 docroot `/home/ehelacad/quraantest.academy`. It hosts nine Moodles, so identify it by its database, never by wwwroot.

## 0. Before any deploy (Claude)

1. `python program/kit/build_program.py`: check, build, rewire.
2. Every page loads in the browser.
3. Narration is complete. `node tools/generate-ehel-intensive-programme-audio.js` (dry) reports `TO RECORD: 0`.
4. The clips and the rebuilt pages are committed. **A rebuild after recording matters**: a page lists only the clips that were on disk when it was built.

## 1. Media first (owner)

```powershell
node tools/upload-media-to-bunny.js intensive-english --dry
node tools/upload-media-to-bunny.js intensive-english
```

- Programme clips go to `media/intensive-english/g10`–`g15`. They are claimed in `tools/lib/ehel-intensive-narration.js`.
- The claim includes each manifest's `reused` list: recordings another level made that these pages also play (64 Phonics clips for Letters & Sounds). The first upload, on 2026-09-18, ran before they were claimed; the pages-vs-storage check caught it before any page was deployed.
- **Media before pages.** A page asks only for the clips it lists. A clip it lists that is not uploaded yet is a 404, and on a media path a 404 is cached for a year.

Claude then verifies from storage. Both checks must pass before any page is deployed:

- `node tools/verify-course-audio-deployed.mjs intensive-english`: 0 missing for g10–g15. This checks the claim map.
- `node src/prototypes/ehel-academy/intensive-english/program/kit/check-clips-on-storage.mjs`: exits 0. This checks every clip each built page lists, against its own folder.

The claim map and the pages are two lists, and on 2026-09-18 they disagreed.

## 2. The six level apps (owner)

```powershell
foreach ($l in "letters","starter","level-1","level-2","level-3","level-4") { node src/prototypes/ehel-academy/mathematics/lesson-app-tools/deploy.mjs --app "src/prototypes/ehel-academy/intensive-english/program/app/$l" --upload }
```

- Each one goes to `Ehel Primary/app/intensive-english/programme/<level>/`, from its `app.config.json` `remote`.
- The tool uploads the hub, the lessons and the five platform modules, then verifies each file on storage and at the edge.
- **Not deployed:** the programme home (`app/index.html`) and the Level 5 placeholder (`app/level-5/index.html`). The home shows build counts ("12 built of 12") and the Level 5 page shows the plan's authoring notes. Each level page links to both through its level tabs and back link, but a Moodle launch hides those. Before publishing either page, reword it for learners.

## 3. The catalogue (owner)

```powershell
$env:BUNNY_KEY = ((Select-String -Path .env -Pattern '^BUNNY_KEY=' | Select-Object -First 1).Line -split '=', 2)[1].Trim(); node tools/upload-app-to-bunny.js catalog; Remove-Item Env:BUNNY_KEY
```

- It prints the digest URL (`catalog-<hash>.json`). Copy it for step 4.
- It publishes the WORKING COPY of `catalog.json`. Check `git status` first: another session's uncommitted edit would ship with it.

## 4. Moodle: create the six courses (owner, cPanel Terminal)

```bash
php admin/cli/cfg.php --component=local_prequran --name=catalog_source_url
php admin/cli/cfg.php --component=local_prequran --name=catalog_source_url --set='<digest URL from step 3>'
php admin/cli/scheduled_task.php --execute='\local_prequran\task\catalog_sync'
```

- **Read the setting before you set it.** It is a textarea with one URL per school; on this install it has held a single line.
- The sync should report 6 courses created (l10–l15).
- "0 courses created" means the setting still names the previous digest.

## 5. Routing (owner, CDN-staging loop)

`repoint-grade.php` lives only in the repo, so it is staged through Bunny.

1. Upload it under `Ehel Primary/qa/` with a fresh, unguessable name. The edge caches a name forever, so never reuse one.
2. In the docroot:

   ```bash
   curl -s -o rp.php '<b-cdn URL of the staged file>'
   md5sum rp.php          # must equal the md5 of the committed file
   php rp.php --subject intensive-english --grade 10,11,12,13,14,15            # report only
   php rp.php --subject intensive-english --grade 10,11,12,13,14,15 --apply
   rm rp.php
   ```

3. Delete the staged copy from Bunny.

The override setting is keyed by course key, so the live levels' rows are untouched.

## 6. Enrolment (owner decision)

- `node tools/generate-ehel-cohorts.js --intake YYYY-MM` opens an intake across **every** Intensive English course in the catalogue, the live ones included. Decide which courses take new learners before running it.
- The placement test's recommended course key is free text (`placement_tests.php`). Point it at the new keys when the owner wants new learners placed there.

## 7. Verify (Claude, then the owner)

1. Storage and edge hashes for the apps.
2. Open each live hub.
3. The owner launches one programme course from Moodle as a test learner. Check that:
   - the Tutor chat and Ask Wehel buttons appear;
   - a finished step reaches the gradebook (a scored quiz writes the lesson's grade item);
   - the level page's Continue link keeps the session.

## Already done

- **Wehel:** `wehel_chat.php` accepts levels -1 to 9 for Intensive English (commit 3b51cf2d0d). The served copy matched the repo on 2026-09-18 (design_version.php probe, md5 c63c5536…), so Letters & Sounds (-1) and Starter (0) are served.
- **Launching:** the gateway launches keys shaped `ehel-<slug>-lNN`, so l10–l15 need no PHP change.
