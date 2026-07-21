# Bunny Folder Structure — ehelacademy.org

**Draft 2026-07-21.** Concrete Bunny layout for the Ehel Academy static site +
courses, grounded in what the three prototypes actually build. Separates the
three lifecycles (code · content · media) so each deploys and caches on its own
cadence, and isolates production writes from the test tiers.

## Zones, hostnames, environments

Two **Storage Zones** (separate access keys → a test deploy physically cannot
overwrite production media):

| Storage Zone | Pull-zone hostname(s) | Serves |
|---|---|---|
| `ehelacademy-prod` | **ehelacademy.org**, www.ehelacademy.org | production |
| `ehelacademy-nonprod` | staging.ehelacademy.org · intg.ehelacademy.org | staging + integration (base-path folders below) |

Local/unit runs from the dev machine against the nonprod zone (or a local copy).

## Storage tree (per zone; nonprod nests one level under `staging/` and `intg/`)

```
/                                            # zone root  →  ehelacademy.org
├── site/                                    # public marketing — static (retires local_ehelhome)
│   ├── index.html                           # landing
│   ├── about.html  courses.html  pricing.html  contact.html
│   └── assets/   logo.svg   hero.webp   og-*.jpg
│
├── app/                                     # LEARNING APPS — code only, versioned & immutable
│   ├── english/
│   │   ├── v3/   index.html  course-ui.js  course-ui.css  grammar-visuals.js  shared/…
│   │   └── current.json                     # {"version":"v3"} — the one mutable app file
│   ├── mathematics/
│   │   ├── v3/   index.html  course-ui.js  math-visuals.js  math-webgl.js  shared/…
│   │   └── current.json
│   ├── science/
│   │   ├── v3/   index.html  course-ui.js  science-visuals.js  science-webgl.js  shared/…
│   │   └── current.json
│   └── shared/
│       └── v3/   course-shell.js            # cross-subject modules
│
├── content/                                 # PER-UNIT DATA — small JSON, edited often, short TTL
│   ├── english/g01/ … g12/
│   │   ├── course-manifest.json   grade-capstone.json
│   │   └── units/  u00.json … u10.json
│   ├── mathematics/g01/ … g12/  (same shape)
│   └── science/g01/ … g12/       (same shape)
│
├── media/                                   # LARGE · IMMUTABLE · content-addressed · cache 1yr
│   ├── english/g03/audio/readings/  <readingId>.mp3
│   │              audio/grammar/    <grammarId>.mp3
│   │              audio/speaking/   <speakingId>.mp3
│   │              img/              <hash>.webp        # unit covers, vocab art
│   ├── mathematics/g03/audio/tts/   <cyrb53>.mp3       # per-grade tts hash cache
│   ├── science/g03/audio/tts/       <cyrb53>.mp3       # per-grade tts hash cache
│   └── shared/
│       ├── img/    <sha1>.webp
│       └── video/  <streamId>                          # Bunny Stream ids (lectures, recordings)
│
└── catalog.json                            # static course catalog (names, codes, unit lists) — P1
```

## Why this shape

- **`app/` vs `content/` vs `media/` are three lifecycles.** Code ships versioned
  (`app/<subject>/v3/`, released by flipping `current.json`); unit data edits without
  a code deploy (`content/`); heavy media is immutable and never re-uploaded.
- **Everything is per-grade** (`g01…g12`) for consistency and per-grade deploy /
  purge: English audio by category (`readings/`, `grammar/`, `speaking/`), Math &
  Science by their `audio/tts/<cyrb53>.mp3` hash cache. The tts filename is a
  content hash (globally unique, self-de-duplicating within a grade); it just lives
  under its grade so the tree is browsable and a grade can be shipped or purged on
  its own. *(Requires the small code change noted below.)*
- **Video → Bunny Stream** (`media/shared/video/<streamId>`), not raw files.
- **`content/g01…g12`** already accommodates all 12 grades; today only g01–g08 × 3
  subjects exist.

## Cache-Control per tree

| Path | Cache-Control | Why |
|---|---|---|
| `media/**`, `app/*/v*/**` | `public, max-age=31536000, immutable` | content-addressed / version-pinned — never changes |
| `content/**`, `catalog.json` | `public, max-age=300, must-revalidate` (or ETag) | edited between releases |
| `app/*/current.json` | `no-cache` | the release pointer — must be fresh |
| `site/**` | `public, max-age=3600` | marketing, changes occasionally |

## URL shape (what the app requests)

```
https://ehelacademy.org/app/science/v3/index.html?course=ehel-sci-g03&unit=1
   loads → /content/science/g03/units/u01.json
   plays → /media/science/audio/tts/<cyrb53>.mp3      (static-first; runtime TTS fallback)
   image → /media/english/g03/img/<hash>.webp
```

## Deploy mapping from the repo (what goes where)

| Repo source | → Bunny path |
|---|---|
| `…/english/grade-N/index.html` + `shared/` | `app/english/v3/` |
| `…/english/grade-N/data/units/*.json`, `course-manifest.json`, `grade-capstone.json` | `content/english/gNN/` |
| `…/english/media/audio/grade-N/{cat}/*.mp3` | `media/english/gNN/audio/{cat}/` |
| `…/mathematics/media/audio/tts/*.mp3` | `media/mathematics/gNN/audio/tts/` * |
| `…/science/media/audio/tts/*.mp3` | `media/science/gNN/audio/tts/` * |
| `local_ehelhome/*` (static landing) | `site/` |

\* **Per-grade tts change:** today the Math/Science generator writes a flat
`media/audio/tts/` and the UI resolves `./media/audio/tts/<hash>.mp3`. To nest by
grade, the generator writes `…/g{NN}/audio/tts/` and `staticVoiceUrl()` builds
`…/g{stage}/audio/tts/<hash>.mp3` (the app already has `stageNumber`). English needs
no change — its paths already carry the grade.

## Pilot vs target

For the **1 Aug pilot** you can deploy fast without the code/content split — push
each subject's current bundled folder under `app/<subject>/v1/` (data still inside
it) and the media under `media/`, then point the apps at the CDN. The clean
`content/` separation (P1) is a refactor you layer in later; the **media layout
above is the one to adopt now**, because it's what resolves the git-bloat problem
and it doesn't change when the app consolidates.
