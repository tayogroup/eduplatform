# A second machine for unit lecture films

How to set up a second computer, on a second Claude account, to draft unit
lecture films in parallel with this one.

**Why a second account and not just a second computer.** Measured on Science
Grade 3 (13 films, 2026-09-23/24): authoring ran 13:32-23:22 and the whole
mechanical tail — `--dry`, `--narrate`, `--sweep`, `--render` — ran in about 71
minutes. Authoring is **~89%** of elapsed time and ~100% of the tokens;
rendering is ~8% and no tokens at all. A second account roughly halves the 89%.
A second computer only attacks the 8%, and even that saves nothing unless you
pipeline grades, because rendering is downstream of authoring and narration.

| | Machine A | Machine B | Elapsed (13 films) |
| --- | --- | --- | --- |
| one machine, today | 100% | — | 661 min |
| B renders only | 92% | 8% | 661 min (no gain without pipelining) |
| **B writes; A does the machine work** | **55%** | **45%** | **366 min** |
| B writes and renders half | 51% | 49% | 340 min |

Set up the third row. The fourth is a small add-on once the third is proven.

## What B does, and does not do

B **writes**: storyboards (`<app>/lecture-video/<slug>.json`) and pictures
(`tools/lib/film-scenes/<subject>-g<N>/<slug>*.js`), checked with the tool's
free modes, then pushed on a branch.

B **never**:

- runs `--narrate`. Two films can share a line, and two machines buying at once
  pay twice and keep whichever clip landed last. Narration is bought once, on A.
- holds `.env`, or any ElevenLabs or Bunny key. It does not need one — see the
  verification step below.
- deploys, releases or takes a version tag. The tag is one global number across
  all six subjects; one release lane only, and it is A's.
- pushes to `main`, or to the `backup` remote (that remote is a local filesystem
  path on A and B cannot reach it).

## 1. Prerequisites

| | version here | note |
| --- | --- | --- |
| Node | v24.14.1 | npm 11.11.0 |
| git | any recent | needs `--filter` support (2.19+) |
| ffmpeg | 8.0 gyan build | on `PATH`; only needed if B also renders |
| Claude Code | current | signed in to the **second** account |

## 2. Clone, without the 23 GB

The repository is private, so sign B in first — `gh auth login`, or let Git
Credential Manager prompt on the first clone.

The full pack is 22.88 GiB, almost all of it `src/media` and the rendered films.
A writing machine needs none of the media. Partial-clone plus sparse-checkout:

```bash
git clone --filter=blob:none --no-checkout https://github.com/tayogroup/eduplatform.git
```

```bash
cd eduplatform && git sparse-checkout set tools .claude docs src/prototypes/ehel-academy/shared src/prototypes/ehel-academy/science/lesson-kit src/prototypes/ehel-academy/science/grade-3-app && git checkout main
```

`.claude` is in that list on purpose: `/ehel-lecture-films` is not a separate
skill directory, it is `.claude/workflows/ehel-lecture-films.js`, which is
tracked and so arrives with the clone.

**List the grade apps B is writing, never the whole subject.** Measured tracked
sizes: `science` entire is 2,208 MB, of which `science/media` alone is 1,934 MB
— per-subject narration audio a film writer never opens. One grade app is 8 MB,
`lesson-kit` under 1 MB. So the line above costs about 25 MB; naming the subject
instead costs 2.2 GB for nothing.

Add one path per grade app B will write (`.../mathematics/grade-2-app`, and so
on). Note Mathematics Grade 1 is `grade-1-app/g1v2`. Blobs outside the cone are
fetched lazily, so nothing else downloads unless something reads it.

## 3. Install

```bash
npm install && npx playwright install chromium
```

The film tool calls `require("playwright")`, which resolves through the
`@playwright/test` dev dependency. Chromium is the only browser it needs.

## 4. Verify the tree is complete — buys nothing

Point the tool at a film that already exists and run the free mode:

```bash
node tools/run-ehel-lecture-films.js --app src/prototypes/ehel-academy/science/grade-3-app --dry
```

This must print each film's characters, coverage and estimated length, and one
fingerprint, ending with "nothing was bought and nothing was rendered". If it
refuses with a missing renderer, a `film-scenes` directory is outside the sparse
cone — widen it and re-run.

`--dry` reads only the script, so it works on a machine with no API key. A
missing `ELEVENLABS_API_KEY` only stops the tool when a clip is *not already
cached*, which is why B can also render (step 7) without ever holding a key.

## 5. Take a lane

Partition by **grade**, never by sections of one grade — an agent owns exactly
two files per film, so grade-level lanes never collide. Agree the split with A
before starting, e.g. A takes Science Grade 4, B takes Mathematics Grades 2-3.

Work on a branch named for the lane:

```bash
git checkout -b films/math-g2
```

## 6. Write the films

In Claude Code on B, invoke the skill with the lane's lessons:

```
/ehel-lecture-films {"app":"src/prototypes/ehel-academy/mathematics/grade-2-app","brief":"src/prototypes/ehel-academy/mathematics/grade-2-app/lecture-video/BRIEF.md","scenesDir":"tools/lib/film-scenes/math-g2","subject":"Mathematics","grade":2,"mode":"draft","review":true,"lessons":[{"n":1,"slug":"<slug>","title":"<title>"}]}
```

`app` is the directory that **contains** `lecture-video/`, which is not always
`grade-<N>-app`: Mathematics Grade 1 keeps its films under
`mathematics/grade-1-app/g1v2/`. Check where `lecture-video/` actually sits
before filling in `app` and `brief`.

`review: true` has a second agent check each film against its lesson as soon as
it is drafted. A run holds at most ten agents at once — that is the account's
rate limit, and it is the thing the second account doubles.

Each agent checks its own work with `--dry`, `--preview` and `--sample`. None of
those buys anything. B stops there.

## 7. Hand the work back

```bash
git status
```

Bare, and read it — the shared-checkout rules in `CLAUDE.md` apply on B exactly
as they do on A. Then commit with a pathspec, in one command:

```bash
git commit -F <message-file> -- <the storyboards and scenes files you wrote>
```

```bash
git push -u origin films/math-g2
```

A fetches that branch, merges it, and from then on it is A's: one `--dry` over
the merged set, one owner approval of that fingerprint, one `--narrate`.

**Do not run `--dry` on B and send A the fingerprint.** The fingerprint is
computed over the films `--films` selected, so a half-set fingerprints
differently from the merged set and A's run would refuse it.

## 8. Optional — B renders its half too

Worth about 4 further points of elapsed time. After A has narrated:

1. A copies `.cache/ehel-lecture-audio/` to the same path on B (86 MB, 1,207
   clips as of 2026-09-24, gitignored). Clips are keyed by a hash of voice,
   settings and text, so the copy is safe and idempotent. Without it B would try
   to *buy* the clips and stop for want of a key.
2. B re-derives its own fingerprint for its half — free:

```bash
node tools/run-ehel-lecture-films.js --app <app> --films <a,b,c> --dry
```

3. B renders with that fingerprint:

```bash
node tools/run-ehel-lecture-films.js --app <app> --films <a,b,c> --render --approved <fingerprint>
```

Never pipe either command through `head` or `tail`: SIGPIPE kills the run, and
these tools print their summary first.

## Troubleshooting

| symptom | cause |
| --- | --- |
| `REFUSED: unknown option --x` | a typo; the tool refuses before anything runs, by design |
| `--approved ... is not these scripts` | the fingerprint is for a different film set, or a line changed since it was taken |
| `ELEVENLABS_API_KEY is not set` | a clip is missing from `.cache/ehel-lecture-audio/`; copy the cache again rather than adding a key |
| a storyboard "names no renderer" | its `film-scenes` directory is outside the sparse cone |
