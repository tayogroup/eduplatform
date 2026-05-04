# Production Smoke Test

Use this checklist after every Bunny upload and Moodle route change.

## Target URLs

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

## Required Smoke Test

Run these checks from a real Moodle login:

1. Log in to Moodle as a test learner.
2. Open the Pre-Quraan launcher from the course/dashboard.
3. Click `Alphabet Listen`.
4. Confirm the Alphabet unit loads with full styling.
5. Confirm locked shared CSS and unit CSS are visible.
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
2. `npm.cmd run verify:bunny` passes before upload.
3. Direct protected unit URL returns the expected 403.
4. Moodle launcher opens the unit successfully.
5. Styling loads.
6. Core lesson interaction works.
7. Refresh/re-entry does not show obvious regressions.

## Current Baseline

The Alphabet production smoke test passed on:

```text
2026-05-04
```

Baseline tag:

```text
alphabet-v1-baseline
```
