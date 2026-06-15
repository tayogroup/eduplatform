# Repo Untracked File Audit

Date: 2026-06-15

Scope: classify the remaining untracked files in `C:\Users\inawa\Documents\pre-quraan-app` as `keep`, `ignore`, or `move out` for the quraan.academy repository.

## Classification Summary

| Path group | Classification | Rationale |
| --- | --- | --- |
| `docs/bbb-*.md` | Keep | BigBlueButton live-class planning, release, smoke-test, monitoring, and operational docs are part of quraan.academy. |
| `docs/bbb-production-*.md` | Keep | Production-readiness and launch-gap records for quraan.academy BBB work. |
| `docs/bbb-student-grouping-foundation.md` | Keep | Quraan Academy live-session/student grouping planning. |
| `docs/communications-implementation-plan.md` | Keep | Quraan Academy parent/admin communications planning. |
| `docs/parent-whatsapp-urgent-alerts.md` | Keep | Quraan Academy parent communication workflow. |
| `docs/moodle-scalahosting-migration-pack.md` | Keep | Deployment/migration notes for Quraan Academy Moodle hosting. |
| `docs/alphabet-quiz-chatbot-requirements.md` | Keep | Product requirements for the Quraan Academy alphabet quiz chatbot. |
| `docs/alphabet-unit-step-reference.md` | Keep | Alphabet unit content/reference documentation. |
| `docs/rules-cue-generation.md` | Keep | Documentation for generated lesson/game cue assets. |
| `docs/speak-recording-review.md` | Keep | Quraan Academy speak/recording review workflow. |
| `docs/examples/` | Keep | Unit lesson/config templates used to create quraan.academy lesson units. |
| `docs/lecture-scripts/` | Keep | Source plan, step data, and generated script used by lecture audio/video tooling. |
| `docs/step-card-design-options.html` | Keep | Design artifact for quraan.academy unit UI; keep if still referenced by product/design review. |
| `src/app-shell/img/hero-quran-children.png` | Keep | App-shell visual asset for the Quraan Academy learner experience. |
| `src/media/` | Keep | Required lesson, game, message, audio, image, and lecture media copied into Bunny deploy output by `tools/build-bunny-output.js`. |
| `src/moodle/local_prequran/` | Keep | Moodle local plugin source, schema, language, services, and SQL verification scripts for quraan.academy. |
| `src/moodle/local_hubredirect/` | Keep | Moodle hub/launch/live-class pages for quraan.academy, including BBB flows. |
| `src/moodle/local_ehelhome/` | Keep | Moodle local home/landing plugin containing the EHEL/Quraan Academy landing page. |
| `src/scripts/` | Keep | Static lesson/game compatibility pages copied into `/pre_quraan/scripts/` by the Bunny build; several are directly linked from app-shell config. |
| `src/shared/js/shared-communications-panel.js` | Keep | Shared Quraan Academy communication UI code. |
| `src/templates/unit/unit.messages.js` | Keep | Unit template source for new Quraan Academy lessons. |
| `src/testing-links.html` | Keep | Testing index copied into Bunny output by `tools/build-bunny-output.js`. |
| `src/units/*/` | Keep | New Quraan Academy lesson units, each with `index.html`, `unit.config.js`, `unit.css`, `unit.messages.js`, and `unit.runtime.js`. |
| `tools/*.js`, `tools/*.py`, `tools/*.ps1` | Keep | Reproducible build, deploy, media-generation, Moodle lint, and release packaging scripts. |
| `tools/bin/` | Move out / ignore | Machine-local command wrappers and binary tooling. `php.cmd` hard-codes `C:\xampp\php\php.exe`, and `rg.exe` is a vendored local binary. This group is now ignored by `.gitignore`. |

## Notes

- `tmp/`, `.tmp/`, `outputs/`, Python caches, and `tools/bin/` should stay out of Git.
- BBB files are considered in-scope quraan.academy files.
- `src/media/` is large, but it is source media for deployment rather than disposable build output. If repository size becomes a problem, move these to a formal asset-storage strategy instead of leaving them untracked.
- Mock Moodle student/teacher helpers under `src/moodle/local_hubredirect/` are classified as keep because they are linked from the admin dashboard and used for testing. They should not expose private production data.

## Recommended Next Git Actions

1. Stage `.gitignore` and this audit document.
2. Stage remaining `keep` groups in focused commits by domain:
   - Moodle BBB/live-class implementation and docs.
   - Static app shell, scripts, units, shared runtime, and media.
   - Tooling and deployment support.
3. Do not stage `tools/bin/`; use system-installed PHP and ripgrep, or document required local tools.
