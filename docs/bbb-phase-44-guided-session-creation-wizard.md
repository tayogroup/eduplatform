# Phase 44: Guided Session Creation Wizard

Phase 44 adds an admin-only wizard for creating one live review session safely.

## What Changed

- Added `/local/hubredirect/live_create_wizard.php`.
- Wizard steps:
  1. choose teacher;
  2. enter student user IDs;
  3. set title, lesson ID, and unit ID;
  4. set date, time, and duration;
  5. set recording/consent policy;
  6. review warnings and submit.
- The final submit posts to the existing `live_sessions.php` create handler, so BBB/session creation still uses the hardened workflow.
- Wizard-created sessions now write a `created_from_wizard` audit row and show a wizard-specific success message after creation.
- Wizard previews:
  - teacher availability mismatch;
  - teacher schedule overlap;
  - student schedule overlap;
  - BBB max participant warning.
- Admin conflict override remains available on the final review step.
- Added links from:
  - Live Sessions;
  - Live Operations;
  - Teacher Directory;
  - Capacity Planning.

## Files

- `local/hubredirect/live_create_wizard.php`
- `local/hubredirect/live_sessions.php`
- `local/hubredirect/live_ops.php`
- `local/hubredirect/live_capacity.php`
- `local/hubredirect/live_teacher_directory.php`
- `local/prequran/sql/verify_live_create_wizard.sql`

## Test

1. Open `/local/hubredirect/live_create_wizard.php`.
2. Choose a teacher.
3. Enter one or more student IDs.
4. Enter lesson/unit and class time.
5. Confirm the review step shows conflict status.
6. Submit and confirm the session appears in Live Sessions.
7. Confirm the success message says the session was created from the wizard.
8. Run `verify_live_create_wizard.sql` and confirm a `created_from_wizard` audit row exists.
