# Phase 26: Live Follow-Up Messaging Integration

This phase connects live-class follow-ups to the existing Quraan Academy Communications system. It does not create a new chat system.

## What It Adds

- Parent summary page: `Reply to follow-up`.
- Teacher workspace: `Message parent`.
- Admin operations: `Message`.
- A bridge page creates or reuses a `parent_teacher` thread.
- The live note stores `followup_threadid` and `followup_contactedat`.
- Live and communication audit rows record the linkage.

## Install

Run:

```sql
src/moodle/local_prequran/sql/alter_live_note_message_link.sql
```

Then verify:

```sql
src/moodle/local_prequran/sql/verify_live_followup_messages.sql
```

## Test

1. Ensure Phase 25 follow-up columns exist and at least one note has an open follow-up.
2. Open the parent summary page.
3. Click `Reply to follow-up`.
4. Confirm the Communications page opens on Messages.
5. Open Teacher Workspace or Live Operations.
6. Click `Message parent`.
7. Re-run the verification SQL and confirm `followup_threadid > 0`.

## Safety Notes

- Students are not added to parent-teacher threads.
- Parent-visible follow-up messages are used, not private teacher notes.
- Admins can audit the communication thread through the communication audit table.
