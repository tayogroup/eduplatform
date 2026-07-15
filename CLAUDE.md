# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this is

EduPlatform / Quraan Academy — a learning platform with three main parts:

1. **Static learner app** — lesson units (Arabic alphabet, tajweed rules, etc.) served from Bunny CDN. Source in `src/`, built into `dist/pre_quraan/`.
2. **Moodle plugins** — `src/moodle/local_prequran`, `local_hubredirect` (hub/launch/BBB live classes), `local_ehelhome` (landing). Deployed to a Moodle server separately; PHP code here is the source of truth.
3. **SQA automation** — a large Playwright e2e suite (`tests/e2e/`) that exercises student/teacher/parent/admin journeys against a live Moodle instance.

## Commands

```bash
npm run dev                      # Vite dev server, http://127.0.0.1:5173
npm test                         # = check:alphabet (rebuild runtime bundle + syntax check)
npm run validate:units           # validate every unit.config.js against the schema
npm run env:local-dev            # validate + build + verify production-path output locally
npm run preview:bunny:production # serve dist/ at http://127.0.0.1:4173/pre_quraan/
npm run test:e2e                 # full Playwright suite (needs EDUPLATFORM_* env, live Moodle)
```

Environment promotion (each step validates + builds + verifies, deploy steps are dry-run):

```bash
npm run env:local-dev -> env:local-unit -> env:integration -> env:staging -> env:production:dry-run
```

Real uploads are `npm run deploy:integration|staging|production`. **Never run a real deploy unless the user explicitly asks.** Production deploy prompts for confirmation. The build stamps `dist/pre_quraan/.bunny-build.json` with the base path; deploy refuses to upload if it doesn't match the target — so always build for the same target you deploy to.

## Architecture

- `src/units/<unit-key>/` — one folder per lesson unit, always exactly: `index.html`, `unit.config.js`, `unit.css`, `unit.messages.js`, `unit.runtime.js`. "alphabet" is the golden unit; new units are cloned from it (`npm run create:unit`, see `docs/cloning-guide.md`).
- `src/shared/js/runtime/*.js` — semantic runtime fragments (`speak.js`, `grid.js`, `playback.js`, `progress.js`, ...).
- `src/shared/js/runtime/runtime.bundle.js` — **GENERATED. Never hand-edit.** Rebuilt from the fragment manifest in `tools/build-unit-runtime-bundle.js` via `npm run check:alphabet`. Commit changed fragments and the regenerated bundle together.
- `src/app-shell/` — the app shell (menu, config, design system CSS).
- `src/media/` — source media (audio/video/images), ~1.4 GB. It is deploy input copied by the Bunny build, not disposable output.
- `src/scripts/` — static lesson/game compatibility pages copied into Bunny output.
- `tools/` — Node/Python/PowerShell scripts for build, deploy, media generation (ElevenLabs/OpenAI — cost real money, don't run casually), and SQA packaging.
- `docs/` — extensive runbooks and implementation plans. Start with `docs/architecture.md`, `docs/bunny-deploy.md`, `docs/eduplatform-admin-runbook.md`.

## Hard rules

- **Generated bundle**: never edit `runtime.bundle.js` directly (`docs/generated-bundle-policy.md`).
- **Stable filenames**: active JS/CSS filenames never contain versions, dates, or `locked`. Versions live in git tags (`alphabet-v1.0.0`, `shared-v1.0.0`) and manifests (`docs/naming-versioning.md`).
- **Unit config schema**: `unit.config.js` must pass `npm run validate:units`; schema documented in `docs/unit-config-schema.md`.
- **Secrets**: `.env` holds Bunny storage keys and TTS API keys — never commit it or copy values into source. E2e credentials are `EDUPLATFORM_*` env vars (template: `.env.e2e.example`).
- Windows environment; some docs write commands as `npm.cmd run ...` — plain `npm run ...` works in both shells.

## Git

- Work on `main` (or feature branches off it). History before 2026-07-16 lived on `codex/*` branches, now merged and deleted.
- Local backup remote `backup` → `C:\Users\inawa\Documents\Claude Code\EduPlatform-backup\eduplatform.git`. Refresh with `git push backup --all --follow-tags` after significant work.

## Verification before committing

1. `npm run validate:units` and `npm run check:alphabet` must pass.
2. If build output matters: `npm run env:local-dev`, then spot-check via `npm run preview:bunny:production`.
3. Playwright e2e only runs against a configured Moodle instance — don't treat missing `EDUPLATFORM_*` env as a code failure.
