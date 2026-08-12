# Kiswahili subject module — recovered from Bunny storage

`kiswahili.js` is a course-app shell subject module for a **Kiswahili** course
that exists nowhere else. It is preserved here because it was about to stop
existing at all.

## Why it is in `inputs/`

It was recovered from `app/shell/subjects/kiswahili.js` on the Bunny storage
zone on **2026-08-12**, immediately before that path was deleted, and it has
**never been tracked in git** — `git log --all -- '*kiswahili*'` returns
nothing, and no commit in recent history contains the path. The copy on the CDN
was the only copy anywhere. Deleting it without saving it first would have
destroyed the file.

`inputs/` is the right home for the same reason
`inputs/ehel-global-perspectives-source/` is: a source that cannot be
regenerated, kept because the place it used to live got cleared out. `deploy/`
would have been wrong — it is gitignored, so it is not durable.

## What it is

A subject module for the unified course-app shell (the same `createCourseApp`
contract `shell/subjects/*.js` uses), modelled on the Grade 2 English course.
From its own header, the design differences that make it a language course
rather than a school-grade one:

- The stage axis is a competency **track**, not a grade. Track 1 is the core
  survival/social course (Units 0-19); tracks 2-4 are the manual's technical
  sectors — Agroforestry, Small Enterprise Development, Water and Sanitation.
  `config.stageDir` maps them to `track-N/` folders.
- **Mazungumzo** (dialogues) are a section of their own, because in the source
  manual the dialogue rather than the reading passage carries each competency.
- Bilingual text renders Kiswahili first with English as a hideable gloss, so
  the learner reads Kiswahili before falling back.
- Nouns carry their class, shown wherever a noun appears.
- Reference — pronunciation guide, grammar chart, glossary — replaces the
  English course's shared ebook library.
- It uses the **shell's** voice engine rather than a bespoke one: every
  Kiswahili line is a `data-speak` button, resolving to a pre-generated clip
  where one exists and to ElevenLabs otherwise, so pronunciation works before
  any audio is recorded.

## What it is not

Not a working course. There is no `src/prototypes/ehel-academy/kiswahili/`,
no unit data, no `index.html`, and no course on the CDN — `app/kiswahili/` and
`app/kiswahili/index.html` both returned 404 when this was recovered. This is
the runtime with nothing to run.

It is also **not deployable as it stands**. These bytes are the *uploaded* form
produced by the old `upload-app-to-bunny.js` flow, which rewrote import paths
for the deployed layout. Reviving the course means putting the module back under
`shell/subjects/`, restoring its imports to the source layout the other subjects
use, and releasing through `deploy-app-version.js --shell` like every other
subject.

## Provenance

| | |
|---|---|
| recovered from | `Ehel Primary/app/shell/subjects/kiswahili.js` (Bunny storage) |
| storage timestamp | 2026-08-01T21:46:42 |
| size | 83,512 bytes |
| sha256 | `1ecfc0343af5a9bc8a3ca666636db169…` (first 32 hex chars) |
| recovered on | 2026-08-12 |

The five files deleted alongside it — `english.js`, `mathematics.js`,
`science.js`, `intensive-english.js` and `course-app.js` — are **not** kept
here. Each is the deployed form of a module whose source is in git, so they are
reconstructible; this one was not.

## Why the CDN copies were deleted

They were fossils of the pre-versioning release flow, where
`{subject}/shared/course-ui.js` did `import "../../shell/subjects/{subject}.js"`.
Every subject now ships as a self-contained `v{TAG}/` bundle and no live
`index.html` referenced the unversioned path, so the files were unreachable —
but they still served *old* code at an obvious URL, and someone verifying a
release by hand found pre-fix source there and concluded, wrongly, that their
deploy had failed.
