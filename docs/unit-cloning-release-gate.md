# Unit Cloning Release Gate

Use this before cloning Alphabet into additional units.

The goal is to avoid copying hidden problems into many units.

## Golden Source Rule

Only clone from a unit that has:

1. Clean Git status.
2. Passing local validation.
3. Passing Bunny build verification.
4. Successful Bunny upload.
5. Successful Moodle production smoke test.
6. A Git tag marking the baseline.

Current golden baseline:

```text
alphabet-v1-baseline
```

## Pre-Clone Checks

Run:

```powershell
git status
npm.cmd run validate:units
npm.cmd run check:alphabet
npm.cmd run build:bunny
npm.cmd run verify:bunny
```

Expected:

```text
working tree clean
Unit config validation passed.
Bunny output verification passed.
```

## Files That Should Be Unit-Owned

Each cloned unit should have its own:

```text
src/units/<unit-key>/index.html
src/units/<unit-key>/unit.config.js
src/units/<unit-key>/unit.css
src/units/<unit-key>/unit.runtime.js
src/units/<unit-key>/patches/
src/units/<unit-key>/README.md
```

## Files That Should Stay Shared

Do not clone these per unit unless there is a deliberate version change:

```text
src/platform/locked/styles/
src/platform/locked/scripts/js/
src/app-shell/
tools/
docs/
```

## Clone Checklist

For each new unit:

1. Create a new branch.
2. Copy the Alphabet unit folder to `src/units/<new-unit-key>/`.
3. Rename unit identifiers in config and docs.
4. Change media paths in `unit.config.js`.
5. Change Moodle web-service names only if the backend supports them.
6. Update app-shell `LINK_MAP` only after the unit path exists.
7. Extend `tools/build-bunny-output.js` only if the build does not already support the new unit key.
8. Add a validation entry for the new unit.
9. Run local preview.
10. Run smoke test through Moodle after deployment.

## Moodle Route Gate

Before changing live Moodle routes, confirm the Bunny URL exists:

```text
https://app.quraan.academy/pre_quraan/units/<unit-key>/index.html
```

For protected unit pages, direct access may show 403. That is acceptable if Moodle launch succeeds.

Then update the matching route in:

```text
src/moodle/local_hubredirect/issue_child.php
```

Example:

```php
'alphabet_listen' => '/pre_quraan/units/alphabet/index.html?managed=1&v=20260504_001',
```

## Release Checklist

Before marking a cloned unit production-ready:

1. `git status` is clean before starting release.
2. `npm.cmd run build:bunny` passes.
3. `npm.cmd run verify:bunny` passes.
4. Bunny upload completes.
5. Direct Bunny route behaves as expected.
6. Moodle route opens the unit.
7. Styling loads.
8. Audio/media loads.
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
tanween-v1-baseline
```
