# Phase 30: Live Session QA Checklist & Quality Review

This phase adds an admin quality review layer for Quraan Academy live sessions.

## What It Adds

- New page:
  - `/local/hubredirect/live_quality.php?sessionid=SESSION_ID`
- Session-level QA fields:
  - `qa_status`
  - `qa_score`
  - `qa_checklist`
  - `qa_notes`
  - `qa_coaching_notes`
  - `qa_reviewedby`
  - `qa_reviewedat`
- Admin-only checklist for:
  - teacher punctuality
  - child safety and privacy
  - appropriate interaction
  - lesson review quality
  - Arabic/pre-Quran practice quality
  - whiteboard/screen/class tool use
  - student participation
  - parent summary readiness
  - recording review
  - technical quality
- Quality outcomes:
  - `not_reviewed`
  - `passed`
  - `needs_coaching`
  - `serious_issue`
- QA audit rows:
  - `quality_review_saved`
  - `quality_review_passed`
  - `quality_review_needs_coaching`
  - `quality_review_serious_issue`

## Files

- `src/moodle/local_hubredirect/live_quality.php`
- `src/moodle/local_hubredirect/live_ops.php`
- `src/moodle/local_hubredirect/live_reports.php`
- `src/moodle/local_hubredirect/live_review.php`
- `src/moodle/local_prequran/sql/alter_live_session_quality.sql`
- `src/moodle/local_prequran/sql/verify_live_quality.sql`

## Install

1. Run:

```sql
src/moodle/local_prequran/sql/alter_live_session_quality.sql
```

If a duplicate-column error appears, the fields are already installed. Verify before changing anything manually.

2. Upload:

- `live_quality.php`
- updated `live_ops.php`
- updated `live_reports.php`
- updated `live_review.php`

3. Verify:

```sql
src/moodle/local_prequran/sql/verify_live_quality.sql
```

## Test

1. Open:

```text
/local/hubredirect/live_quality.php?sessionid=1
```

2. Set checklist items to `Pass`, `Concern`, or `N/A`.
3. Set QA status:
   - `Passed`
   - `Needs coaching`
   - `Serious issue`
4. Save.
5. Confirm:
   - QA score updates.
   - QA audit row is created.
   - Live Ops shows QA review queue and QA issues.
   - Live Reports shows QA status and score.
