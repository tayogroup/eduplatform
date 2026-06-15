# Phase 28: Parent Follow-Up Resolution Experience

This phase gives parents a simple way to close the loop on teacher follow-ups.

## What It Adds

- Parent buttons on live summaries:
  - `Marked as reviewed`
  - `Homework completed`
  - `Need teacher help`
- Optional parent note.
- Parent responses are stored on `local_prequran_live_note`.
- Teacher and admin follow-up queues show the parent response.
- Low-risk parent responses auto-resolve the follow-up:
  - `reviewed`
  - `homework_completed`
- `needs_help` keeps the follow-up open.

## Install

Run:

```sql
src/moodle/local_prequran/sql/alter_live_note_parent_response.sql
```

Then verify:

```sql
src/moodle/local_prequran/sql/verify_live_parent_followup_response.sql
```

## Test

1. Create an open parent-visible follow-up.
2. Open `/local/hubredirect/live_summaries.php?childid=STUDENT_ID` as the parent.
3. Click `Marked as reviewed`, `Homework completed`, or `Need teacher help`.
4. Reopen Teacher Workspace and Live Operations.
5. Confirm the parent response appears in the follow-up queue.
