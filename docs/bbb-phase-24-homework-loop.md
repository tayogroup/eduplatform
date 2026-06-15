# Phase 24: Post-Class Action Plan & Homework Loop

This phase turns the teacher's post-class notes into a visible homework loop for students and parents.

## What Was Added

- Optional structured homework fields on `local_prequran_live_note`:
  - `homework_lessonid`
  - `homework_unitid`
  - `homework_due_date`
  - `homework_priority`

- Teacher review page:
  - homework unit,
  - due date,
  - priority.

- Parent summaries:
  - homework details,
  - due date,
  - priority,
  - `Practice assigned homework` shortcut.

- Student/parent schedule:
  - homework reminder on recent classes,
  - `Practice homework` shortcut.

- Admin reports:
  - homework plan count.

- SQL:
  - `alter_live_note_homework_loop.sql`
  - `verify_live_homework_loop.sql`

## Required SQL

Run `alter_live_note_homework_loop.sql` once before using the structured homework fields. Existing text homework continues to work.

## How To Test

1. Run the alter SQL.
2. Open a session review page.
3. Add homework text, homework unit, due date, and priority.
4. Save with parent visibility enabled.
5. Open parent summaries and confirm homework appears.
6. Click `Practice assigned homework`.
7. Run `verify_live_homework_loop.sql`.
