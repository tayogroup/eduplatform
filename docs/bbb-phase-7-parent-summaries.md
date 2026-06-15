# BBB Phase 7: Parent Live-Session Summaries

This phase adds a read-only parent summary page for live-class feedback:

- URL: `/local/hubredirect/live_summaries.php?childid=STUDENT_USER_ID`
- Source: `src/moodle/local_hubredirect/live_summaries.php`
- Dashboard entry: `Live Summaries`

The page shows only rows from `local_prequran_live_note` where `visible_to_parent = 1`.
It displays strengths, needs practice, homework, parent summary, attendance status, participation status, teacher, lesson/unit, and class date.

Private teacher notes are intentionally excluded from the query and are never rendered on the parent page.

## Access Rules

- Parents can view summaries only for linked children through guardian consent or communication-thread parent participation.
- Teachers can preview summaries for assigned students.
- Students can view their own visible summaries.
- Site administrators can view a student summary by passing `childid`.

## Verification

Run:

```sql
source src/moodle/local_prequran/sql/verify_live_summaries.sql
```

Expected result after a teacher saves parent-visible feedback:

- one row per visible student summary
- `visible_to_parent = 1`
- public fields populated as saved from the teacher review page
- no `private_note` column in the result
