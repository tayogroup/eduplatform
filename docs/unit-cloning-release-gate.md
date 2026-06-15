# Unit Cloning Release Gate

Use this gate before a cloned lesson is promoted beyond local work. The goal is to avoid copying hidden problems into many units.

## Golden Source Rule

Only clone from the neutral unit template:

```text
src/templates/unit
```

Existing lessons, including Alphabet, are references only. They may contain lesson-specific media maps, historical overrides, or encoding artifacts that should not become the starting point for new lessons.

## Pre-Clone Gate

Run:

```powershell
git status
npm.cmd run validate:units
npm.cmd run build:bunny:integration
npm.cmd run verify:bunny:integration
```

Expected:

```text
Unit config validation passed.
Bunny output verification passed.
```

If the working tree is dirty, check whether the changed files are related to the lesson cloning work before continuing.

## Clone Gate

Create units only with:

```powershell
npm.cmd run create:unit -- --manifest <lesson-manifest-json>
```

Use `--dry-run` first. Do not manually copy a folder from `src/units`. `--unit-key`, `--title`, and `--content-file` are still supported for small experiments, but production lesson clones should use the full manifest shape from `docs/examples/unit.lesson.template.json`.

Learner-facing step messages should be provided through `unitMessages` in the manifest or through `--messages-file`. Avoid hand-editing `unit.messages.js` unless the generated file needs final copy polish.

## Five-File Contract

Each cloned unit owns exactly:

```text
index.html
unit.config.js
unit.messages.js
unit.css
unit.runtime.js
```

Unit folders must not contain copied shared scripts, copied shared styles, media folders, notes, exports, or temporary files.

## Shared Resource Rule

Do not clone these per unit unless there is a deliberate shared version change:

```text
src/shared/css/
src/shared/js/
src/shared/js/patches/
src/app-shell/
tools/
docs/
```

If multiple lessons need the same behavior, add it once to shared runtime/config normalization.

## Validation Gate

Run after every clone and after every content edit:

```powershell
npm.cmd run validate:units
```

This gate checks:

```text
JavaScript syntax
required unit files
unexpected files or directories
required config fields
Moodle function names
step ids and filters
content keys and media filenames
wordLimit versus content.items length
missing local media
unresolved template placeholders
Alphabet clone leftovers
encoding/replacement artifacts
```

## Bunny Gate

Before changing live Moodle routes, confirm the built route exists:

```powershell
npm.cmd run build:bunny:integration
npm.cmd run verify:bunny:integration
```

For production dry runs:

```powershell
npm.cmd run env:production:dry-run
```

## Moodle Route Gate

Only update Moodle routes after Bunny verification passes.

Route format:

```text
/pre_quraan/units/<unit-key>/index.html?managed=1&v=<assetVersion>
```

Typical route file:

```text
src/moodle/local_hubredirect/issue_child.php
```

For protected unit pages, direct Bunny access may show 403. That is acceptable only if the Moodle launch flow succeeds.

## Production Release Checklist

1. `npm.cmd run validate:units` passes.
2. `npm.cmd run build:bunny:production` passes.
3. `npm.cmd run verify:bunny:production` passes.
4. Bunny upload completes.
5. Direct Bunny route behaves as expected.
6. Moodle route opens the unit.
7. Styling loads.
8. Audio and video load.
9. Core interaction works.
10. Progress/state behavior is checked.
11. Desktop and mobile/tablet smoke tests pass.
12. Commit and tag the unit baseline.

## Suggested Tag Format

```text
<unit-key>-v1-baseline
```

Examples:

```text
alphabet-v1-baseline
harakat-v1-baseline
letter-shapes-v1-baseline
```
