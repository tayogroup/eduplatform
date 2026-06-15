# BigBlueButton Phase 6 Attendance And Notes

Phase 6 adds the teacher review workflow after a live session.

## Page

```text
src/moodle/local_hubredirect/live_review.php
```

Deploy to:

```text
local/hubredirect/live_review.php
```

## Features

- Teacher/admin can open `Attendance & notes` from each live-session card.
- Attendance status per student:
  - present
  - late
  - absent
  - excused
  - technical_issue
- Participation status text.
- Technical issue checkbox.
- Strengths.
- Needs practice.
- Homework.
- Parent summary.
- Private teacher note.
- Attendance notes.
- Parent summary visibility toggle.
- Optional mark session completed.

## Verification SQL

Run:

```text
src/moodle/local_prequran/sql/verify_live_review.sql
```

Expected after saving a review:

- rows in `mdlgx_local_prequran_live_attendance`
- rows in `mdlgx_local_prequran_live_note`
- `review_saved` row in `mdlgx_local_prequran_live_audit`
