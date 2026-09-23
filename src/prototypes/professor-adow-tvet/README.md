# Professor Adow TVET

A vocational school **hosted by eduplatform but not under Ehel Academy**: its
own storage zone, its own catalogue, its own consumer record and branding in
Moodle. The plan, the owner's decisions and the reasoning behind them are in
[`docs/professor-adow-tvet-setup-plan.md`](../../../docs/professor-adow-tvet-setup-plan.md).

The working precedent for everything here is **Quraan Academy**
(`../quraan-academy/`), the second school. Read
`tools/upload-prequran-to-bunny.js`'s header before changing how this deploys.

## The tree

| | |
| --- | --- |
| `school.config.json` | school-level constants: name, id prefix, storage zone, CDN host, the six departments. Three Phase 0 `TODO` values; the uploader refuses to run while any remain. |
| `courses/<slug>/course-manifest.json` | one course. Declares its department, level, progress partition and its units of competency. |
| `courses/<slug>/units/unit-N.json` | a unit's content. **Absent until authored** — that is the point, see below. |
| `catalog.json` | generated, never hand-edited. `npm run catalog:adow`. |

## Declared vs built — why nothing here is a placeholder

`catalog_sync` is **get-or-create with no reconciliation pass**. A course it
creates stays in Moodle with its enrolments forever; removing it from the
catalogue does not retire it. So a throwaway "TEST COURSE" would be permanent
clutter in a live school.

Instead: a course enters the catalogue when its `course-manifest.json` exists,
and a **unit** enters it when that unit's data file exists. The Solar PV course
ships today with eight units *declared* and none *built*, so Moodle creates a
real course with **zero grade items**. That is the Phase 1 empty-school probe
and it is also just what a course looks like while it is being authored.

A listed unit becomes a grade item named `Progress: uNN` from its `number`, so
`units` in the manifest **is** the progress partition. `progressPartition`
records which of a TVET course's three plausible partitions (modules, units of
competency, assessment events) that is. Nothing else may claim it.

## Commands

```bash
npm run catalog:adow
```

```bash
npm run deploy:adow:dry
```

```bash
npm run deploy:adow
```

`deploy:adow:dry` regenerates the catalogue and shows exactly what would be
sent. The uploader is **dry by default** and refuses unrecognised arguments, so
neither a bare run nor a typo can upload anything — unlike the other uploaders
in this repo, one of which once re-uploaded all six Ehel subjects from a stray
probe.

## Phase 0 — the three decisions the uploader is blocked on

Fill these in `school.config.json`, then add the key to `.env`:

| field | what it is |
| --- | --- |
| `storageZone` | the Bunny Storage zone name, created in the Bunny dashboard |
| `cdnHost` | that zone's pull-zone hostname, e.g. `adowtvet.b-cdn.net` |
| `appDomain` | where learners reach the app |

```
BUNNY_TVET_ZONE=...
BUNNY_TVET_KEY=...
```

`BUNNY_TVET_KEY` is **that zone's own password** — never Ehel's `BUNNY_KEY`,
never Quraan's generic `BUNNY_STORAGE_ACCESS_KEY`. `.env` is not committed and
no value from it belongs in source.

**Do not probe a path on the new zone before its upload lands.** A 404 minted
by a check is edge-cached for a long time on version and media paths and cannot
be purged with the key in `.env`.

## Phase 1 — the manual half

Four steps, none of which is a commit. Do them in this order.

**1. Create the Bunny storage zone** and its pull zone in the Bunny dashboard.
Put the name and hostname into `school.config.json`, the key into `.env`.

**2. Create the consumer in Moodle.** Site administration →
`/local/hubredirect/consumer_wizard.php`:

- consumer type **`institution`**
- institution type **`technical_training`** — already an option in
  `pqhi_institution_type_options()`; no code change is needed to classify this
  school
- teaching method / operator type as the school actually is
- logo, colours, support email and copy go in the consumer's landing defaults,
  so **no Ehel branding reaches a TVET learner** and none of it is hard-coded

**3. Upload the catalogue.**

```bash
npm run deploy:adow:dry
```

Read what it plans, then:

```bash
npm run deploy:adow
```

**4. Point Moodle at it.** The run prints the exact URL. Site administration →
Plugins → Local plugins → Pre-Quraan → `local_prequran/catalog_source_url`.

- Use the **content-addressed** URL (`catalog-<digest>.json`), never the plain
  `catalog.json`: the plain name is served with a 30-day max-age, query strings
  are ignored, and a catalogue change would be invisible to Moodle for weeks
  with no way to purge it.
- The setting takes **one URL per line, one per school**. **Add** a line. Do
  not replace Ehel's or Quraan's — the task reads every line, and a school
  removed from the list silently stops syncing.
- The digest is over the file's content, so re-running the deploy with an
  unchanged catalogue keeps the same URL and this step is not repeated. A new
  digest means the catalogue really changed and the setting must be repointed.

Then wait for (or run) the `catalog_sync` scheduled task and confirm the course
and its two categories exist in Moodle. That is the whole tenancy path proven,
with no content at risk.

## What Phase 1 deliberately does not include

- **The app tier.** The uploader has a documented, empty slot for it. Quraan
  copies the Ehel shell in at deploy time and rewrites its imports; TVET will
  do the same, in Phase 3, when there is a built page whose transforms can
  actually be tested. Guessing them now is how Quraan once shipped an
  `index.html` pointing at a stylesheet that did not exist on the zone.
- **The occupational standards.** The unit titles in the Solar PV manifest are
  a first pass and are **not trade-reviewed**. Phase 2 replaces them from
  `src/curriculum/adow-tvet-solar-pv.json`, with its own validator.
- **The per-criterion competency record** in `local_hubredirect`. Attendance,
  certificates and admissions already exist there; assessor sign-off against a
  named performance criterion does not, anywhere. It is Phase 4, after Phase 3
  has shown what evidence a lesson actually produces.
