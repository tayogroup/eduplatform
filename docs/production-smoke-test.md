# Production Smoke Test

Use this checklist after every Bunny upload and Moodle route change.

For BigBlueButton live-class production checks, use:

```text
docs/bbb-group-4-production-smoke-tests.md
src/moodle/local_prequran/sql/verify_group_4_production_smoke.sql
```

## Target URLs

Integration app shell:

```text
https://app.quraan.academy/pre_quraan_integration/scripts/index_v030.html
```

Integration protected unit direct URL:

```text
https://app.quraan.academy/pre_quraan_integration/units/alphabet/index.html
```

Staging app shell:

```text
https://app.quraan.academy/pre_quraan_staging/scripts/index_v030.html
```

Staging protected unit direct URL:

```text
https://app.quraan.academy/pre_quraan_staging/units/alphabet/index.html
```

App shell:

```text
https://app.quraan.academy/pre_quraan/scripts/index_v030.html
```

Protected unit direct URL:

```text
https://app.quraan.academy/pre_quraan/units/alphabet/index.html
```

Moodle child launcher:

```text
https://quraan.academy/local/hubredirect/issue_child.php?goto=alphabet_listen
```

## Expected Direct URL Result

Opening the protected unit directly should show:

```text
Access Denied 403
```

This is expected. The unit should load through Moodle/official portal access, not by direct Bunny URL.

The hosted testing shortcut page can open Bunny unit links because it preserves an
`app.quraan.academy` referrer for those links. A copied unit URL opened directly
with no academy referrer should still show the 403 page.

## Required Smoke Test

Run these checks against Bunny integration first, repeat against staging after integration passes, then repeat against production after release approval.

Before integration upload:

```bash
npm.cmd run env:integration
```

Before staging upload:

```bash
npm.cmd run env:staging
```

Before production upload:

```bash
npm.cmd run env:production:dry-run
```

Run these checks from a real Moodle login:

1. Log in to Moodle as a test learner.
2. Open the Pre-Quraan launcher from the course/dashboard.
3. Click `Alphabet Listen`.
4. Confirm the Alphabet unit loads with full styling.
5. Confirm shared CSS and unit CSS are visible.
6. Confirm no 403 appears through Moodle launch.
7. Click `Play Lecture`.
8. Confirm audio/video controls do not break the page.
9. Interact with at least two letter tiles.
10. Confirm step/progress UI updates as expected for the selected step.
11. Refresh the page.
12. Confirm state/progress behavior is still acceptable.
13. Return to the launcher/app shell.
14. Re-open `Alphabet Listen`.
15. Confirm the unit still opens through Moodle.

## Environment Isolation Check

Repeat the learner smoke test through each approved environment launch:

```text
Integration: issue_child.php?goto=alphabet_listen&pq_env=integration
Staging:     issue_child.php?goto=alphabet_listen&pq_env=staging
Production:  issue_child.php?goto=alphabet_listen
```

Then run:

```text
src/moodle/local_prequran/sql/verify_environment_readiness.sql
```

Confirm integration activity appears under `environment = integration`, staging activity appears under `environment = staging`, and production activity appears under `environment = production`.

## Browser Coverage

Minimum:

```text
Desktop Chrome
One mobile or tablet browser
```

Recommended before larger rollout:

```text
Desktop Chrome
Desktop Edge
Android Chrome
iPad Safari or iPhone Safari
```

## Pass Criteria

The release passes smoke test when:

1. Bunny upload succeeds.
2. `npm.cmd run verify:bunny:integration` passes before integration upload.
3. `npm.cmd run verify:bunny:staging` passes before staging upload.
4. `npm.cmd run verify:bunny:production` passes before production upload.
5. Direct protected unit URL returns the expected 403.
6. Moodle launcher opens the unit successfully.
7. Styling loads.
8. Core lesson interaction works.
9. Refresh/re-entry does not show obvious regressions.

## Current Baseline

The Alphabet production smoke test passed on:

```text
2026-05-04
```

Baseline tag:

```text
alphabet-v1-baseline
```
