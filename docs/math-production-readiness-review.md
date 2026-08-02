# Prompt — Ehel Academy Mathematics: pre-production health review

Paste the section below to a fresh session. It is written to be self-contained.

---

## Objective

Review the Ehel Academy **Mathematics** course (`src/prototypes/ehel-academy/mathematics/`, Stages 1–8) and report whether it is fit to put in front of learners. Produce a verdict per area — **ship / ship with caveats / do not ship** — with the evidence behind each.

This is a review, not a repair. Do not fix what you find unless it is a one-line change and you say so explicitly. The deliverable is a decision-ready report.

## Hard constraints

- **Do not run ElevenLabs generation.** Every narration tool bills per character; `--dry` reports cost without spending. A full course pass is ~1.5M characters.
- **Do not deploy.** No `upload-*-to-bunny.js`, no `deploy-*` scripts. Note that `upload-media-to-bunny.js` has no `--dry-run` flag and ignores unknown arguments, so passing one uploads for real.
- **Do not commit other sessions' work.** Several sessions share this working tree and push to `main`. Stage explicit paths, never `git add -A`. Expect unrelated modified files under `science/`, `english/`, `tools/`.
- **`TaskStop` does not reliably kill background processes here.** If you background anything, verify with the OS process list before assuming it stopped.

## What is already verified — do not redo

Trust these unless you find contradicting evidence; re-deriving them wastes the budget.

| Area | State |
|---|---|
| Narration coverage | 17,442 clips deployed, 0 missing, 0 orphaned (`check-ehel-deploy-sync.mjs mathematics`) |
| Content deploy | 149 files in sync with the CDN |
| Content gate | `tools/check-math-content.mjs` passes — 133 units, 844 concepts, 1,596 quiz questions |
| Audio coverage gate | `tools/check-ehel-audio-coverage.mjs mathematics` passes — 16 Listen buttons all mapped |
| Local audio cache | 16,919 clips, exactly the reachable set, 0 orphans |

## Deliberate decisions — report only if you disagree, with reasoning

- **Stage 1 addresses the parent; Stages 2–8 address the learner.** Stage 1 is sourced from a parent guide and keeps `How to teach it:` sections and `You:` / `Child:` dialogue. It is exempted from `ADULT_ADDRESSED` in `check-math-content.mjs` via `ADULT_VOICE_EXEMPT`. An automated conversion was attempted and reverted; ~324 fields, 63 of them dialogue scripts with no mechanical conversion.
- **Narration audio is untracked** (`.gitignore`), generated locally and shipped to Bunny. The CDN is the store.
- **A topic-overlap scan flags ~49 exploration cards** as question/explainer mismatches. That is its noise floor — numeric and discursive questions share no vocabulary with their explainer. Every one has been read. Do not treat the count as a defect list; spot-check a sample and say whether you agree.

## Areas to review

### 1. Runtime — does the app actually work?
The strongest evidence available, and the least covered so far. Start the dev server (`.claude/launch.json`, name `dev`, port 5173) and exercise the app rather than reading the code.

- Every route in `mathematics/shared/course-ui.js` renders without console errors: overview, concept, explore, visuals, method, examples, practice, activities, games, fluency, problems, explain, challenge, capstone, reference, ai, progress, reflect.
- Across a spread of stages (at least 1, 4, 8) and several units, not just unit 1.
- **Games are playable end to end** — `games.games[].rounds[]`, scoring, hints, the "next" flow, and the completion state.
- **Quizzes score correctly.** `assessment.questions[].answer` must be one of `options`. 1,596 questions exist; verify programmatically, not by clicking.
- **WebGL scenes load** — `math-webgl.js`, `geometry-webgl.js`, `math-visuals.js`. Check for silent canvas failures and for scenes that render nothing.
- **Progress persists** — `localStorage` resume, and the progress web-service client (`createProgressClient`, `docs/progress-event-contract.md`).
- **The AI tutor panel** is a fixed-script prototype; confirm it does not claim otherwise to a learner.

### 2. Media reachability at production paths
Localhost and production resolve audio differently — `./media/audio/tts/<hash>.mp3` locally versus `../../media/mathematics/gNN/audio/tts/<hash>.mp3` when deployed (`course-ui.js`, `IS_LOCAL_DEV`).

- Confirm the production path shape matches what `upload-media-to-bunny.js` writes.
- **What happens when a clip 404s?** Trace the fallback to the runtime TTS endpoint (`/api/elevenlabs-tts` in production, `/local/hubredirect/quiz_tts.php` locally). Confirm it degrades quietly and does not break the page.
- Check non-audio media: diagrams, images, any asset the units reference.

### 3. Content correctness
- **Answer keys.** Sample worked examples, practice, fluency, real problems, reasoning model answers and quiz answers across stages, and verify the mathematics is right — compute, do not eyeball. Report any wrong answer as a blocker.
- **Cambridge mapping.** `npm run validate:frameworks` and `npm run validate:curriculum-units -- --strict-cambridge` must exit 0. Stages 1–6 are framework 0096, Stages 7–8 are 0862.
- **Truncation and placeholders.** Text ending mid-sentence, stub explainers ending on a colon, `[Star]`-style source markers, lorem/TODO text, "Work through the task and explain each step to your teacher" filler.
- **Duplication.** Modules reading identically across units or stages.

### 4. Deploy integrity
- `node tools/check-ehel-deploy-sync.mjs mathematics` must exit 0.
- **Is the app tier itself deployed and current?** Content (`content/`) and media (`media/`) were shipped; the app bundle (`app/`) is a separate concern via `upload-app-to-bunny.js` / `deploy-app-version.js`. Check whether the deployed app matches this working tree — this is the most likely gap.
- Confirm `catalog.json` / `course-manifest.json` list Mathematics correctly for the launcher.

### 5. Accessibility and responsive behaviour
- Keyboard reachability of Listen buttons, quiz options, game controls.
- `aria-label` correctness on icon-only buttons; live regions on feedback.
- Colour contrast in `course-ui.css`.
- Mobile viewport (375px) — the learner audience is phone-first.

### 6. Security and cost exposure
- No API keys, tokens or storage credentials reachable from client code or committed data.
- The runtime TTS endpoint bills per play. Quantify the exposure: how many Listen buttons would fall back if a clip were missing, and is there anything rate-limiting abuse?

### 7. Performance
- Unit JSON payload sizes (some exceed 90 KB) and what the app fetches per route.
- First-render time on a cold cache.
- Whether 17k CDN clips introduce any listing or cache-invalidation concern on deploy.

## Output

A single report, ordered by severity:

1. **Blockers** — must fix before learners see it. Wrong mathematics, broken routes, data loss, exposed secrets.
2. **Should fix** — real defects that are survivable for a pilot.
3. **Watch list** — risks, debts, and things that will bite on the next content change.
4. **Verified healthy** — what you checked and found sound, so the next reviewer can skip it.

For each finding give: the file and line, what you did to observe it, and what a learner would experience. Distinguish clearly between what you **verified** and what you **inferred** — an unverified inference stated as fact is worse than an open question.

End with a one-line verdict: ship, ship with caveats, or do not ship.
