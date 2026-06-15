# Phase 25: Teacher-Parent Follow-Up Workflow

This phase turns post-class notes into a small operational loop:

- Teachers can mark a follow-up status while saving attendance and notes.
- Parents see only the parent-safe follow-up message on the summaries page.
- Admins see unresolved follow-ups in Live Operations.
- Teachers see their unresolved follow-ups in the Teacher Live-Class Workspace.
- Audit rows track homework publishing, parent follow-up requests, admin support requests, and resolved follow-ups.

## Install

Run:

```sql
src/moodle/local_prequran/sql/alter_live_note_followup.sql
```

Then verify:

```sql
src/moodle/local_prequran/sql/verify_live_followups.sql
```

## Follow-Up Statuses

- `none`: no special follow-up.
- `review_homework`: parent should help the student complete assigned practice.
- `parent_contact_requested`: teacher wants the parent to follow up.
- `admin_support_requested`: admin needs to help resolve an issue.

## Test

1. Open `/local/hubredirect/live_review.php?sessionid=SESSION_ID` as the teacher.
2. Add homework and a parent summary.
3. Set Follow-up Status to `Parent contact requested` or `Review homework`.
4. Add a parent-safe follow-up message.
5. Keep Parent summary visible checked, then save.
6. Open `/local/hubredirect/live_summaries.php?childid=STUDENT_ID` as the parent and confirm the Needs Attention section appears.
7. Open `/local/hubredirect/live_ops.php` as admin and confirm the Follow-Up Queue shows the item.
8. Return to the review page, check Follow-up resolved, and save.
9. Re-run the verification SQL and confirm `followup_resolved = 1`.
