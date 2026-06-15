# Moodle Fresh Install Migration Pack: hosting.com quraantest to ScalaHosting

This pack supports a controlled migration from `quraantest` on hosting.com into a fresh Moodle installation on ScalaHosting.

The goal is not to clone the old site. The goal is:

1. Install clean Moodle core on ScalaHosting.
2. Install required plugins cleanly.
3. Move Moodle learning data with Moodle-native tools where possible.
4. Move project-specific plugin data with targeted SQL exports/imports.
5. Re-enter secrets and host-specific settings deliberately.

## Migration Rule

Do not import the full old Moodle database over the fresh ScalaHosting database.

Use Moodle backup/restore for courses and files, CSV/admin tools for users where possible, and targeted SQL only for data that belongs to the PreQuran custom tables or carefully selected Moodle configuration tables.

## Files In This Pack

```text
docs/moodle-scalahosting-migration-pack.md
src/moodle/local_prequran/sql/migration/source_inventory.sql
src/moodle/local_prequran/sql/migration/custom_table_export_list.sql
src/moodle/local_prequran/sql/migration/target_post_migration_verification.sql
```

Run the SQL files in phpMyAdmin or a MySQL client against the relevant Moodle database. Replace `mdlgx_` if the source or target database prefix is different.

## Phase 1: Source Inventory On hosting.com quraantest

Run:

```text
src/moodle/local_prequran/sql/migration/source_inventory.sql
```

Record:

- Moodle version from `config`.
- Database prefix from `config.php`.
- Active plugins and versions from `config_plugins`.
- Enabled auth plugins.
- Enabled enrolment plugins.
- Web service services, functions, users, and tokens.
- Roles, capabilities, cohorts, courses, users, and enrolment counts.
- Custom `local_prequran_*` table row counts.

Also collect from the old file system:

- `config.php` for reference only. Do not copy it to ScalaHosting.
- List of installed plugin folders.
- Any custom language packs, themes, or local modifications.
- Any non-Moodle files referenced by custom pages.

## Phase 2: Fresh ScalaHosting Install

Install a fresh Moodle site on ScalaHosting.

Prefer the same Moodle major version as `quraantest`. If upgrading Moodle during the move, first test the migration on a staging subdomain.

Minimum setup:

1. Create a new database and database user.
2. Install Moodle core fresh.
3. Configure HTTPS and `$CFG->wwwroot`.
4. Configure cron.
5. Configure mail/SMTP.
6. Configure timezone.
7. Confirm `moodledata` is outside public web root.
8. Confirm PHP extensions required by Moodle are enabled.

## Phase 3: Plugin Installation Checklist

Install these project plugins from this repo:

```text
src/moodle/local_prequran  ->  local/prequran
src/moodle/local_ehelhome  ->  local/ehelhome
src/moodle/local_hubredirect  ->  local/hubredirect
```

Plugin metadata:

```text
local_prequran version: 202606150002
local_prequran release: 0.1.2-pilot
local_prequran requires: Moodle 2022041900 or newer

local_ehelhome version: 2026061101
local_ehelhome release: 1.1.1-login-clean
local_ehelhome requires: Moodle 2023111800 or newer

local_hubredirect: page bundle, no version.php found in this repo
```

After uploading plugin code:

1. Visit Site administration.
2. Run Moodle plugin install/upgrade prompts.
3. Purge Moodle caches.
4. Confirm `local_prequran` tables were created by Moodle upgrade/install, not by manual table creation.
5. Reinstall third-party plugins from original sources, matching source versions when possible.

Important schema note:

The current `local_prequran` install helper creates the live/class grouping and quiz schema paths. Several older operational tables are still represented by manual SQL files in this repo and may not be created automatically on a brand-new install unless the plugin install lifecycle is expanded before deployment.

Review these before importing source data:

```text
src/moodle/local_prequran/sql/create_comm_phase1.sql
src/moodle/local_prequran/sql/create_teacher_intake.sql
src/moodle/local_prequran/sql/create_teacher_student.sql
src/moodle/local_prequran/sql/create_speakrec.sql
src/moodle/local_prequran/sql/create_submitrec.sql
src/moodle/local_prequran/sql/create_student_grouping.sql
src/moodle/local_prequran/sql/create_intake_request.sql
```

Best option: add any still-required legacy tables to the Moodle install/upgrade lifecycle before the ScalaHosting production cutover. Operational fallback: run the relevant `CREATE TABLE IF NOT EXISTS` scripts once on ScalaHosting after the fresh plugin install and before importing rows.

## Phase 4: Moodle Core Data Move

Use Moodle-native tools first.

Recommended:

- Users: CSV import if history is not critical; course backup/restore with user data if history is critical.
- Courses/categories: Moodle backup/restore.
- Course files and activity files: Moodle backup/restore, not raw SQL.
- Cohorts/groups/groupings: Moodle admin export/import or course restore.
- Enrolments: course restore with user data, or recreate via CSV/enrolment methods.
- Roles/capabilities: manually recreate unless there are many custom roles.

Handle these carefully:

- Passwords may not migrate cleanly if auth settings differ.
- User IDs must be preserved or mapped before importing custom PreQuran tables.
- Course IDs, cohort IDs, group IDs, and context IDs may differ on ScalaHosting.
- Moodle File API records depend on `moodledata/filedir`; do not move file-related rows without their files.

## Phase 5: Custom Table Export List

Run this on the source:

```text
src/moodle/local_prequran/sql/migration/custom_table_export_list.sql
```

Use the output as a planning list, not as proof that a table is safe to import directly. Any table containing Moodle user IDs, course IDs, cohort IDs, group IDs, context IDs, or File API references must be checked against the target IDs first.

The expected custom table clusters are:

Core progress and recordings:

```text
local_prequran_lessonprog
local_prequran_stepprog
local_prequran_stepcfg
local_prequran_focuslog
local_prequran_focusagg
local_prequran_speakrec
local_prequran_submitrec
```

Teacher/student/intake/grouping:

```text
local_prequran_student_profile
local_prequran_teacher_profile
local_prequran_teacher_student
local_prequran_intake_request
local_prequran_group_pool
local_prequran_class_group
local_prequran_group_member
```

Live class operations:

```text
local_prequran_live_series
local_prequran_live_session
local_prequran_live_participant
local_prequran_live_attendance
local_prequran_live_note
local_prequran_live_recording
local_prequran_live_consent
local_prequran_live_audit
local_prequran_live_availability
local_prequran_live_ack
```

Communications:

```text
local_prequran_comm_thread
local_prequran_comm_message
local_prequran_comm_participant
local_prequran_comm_consent
```

Quiz analytics:

```text
local_prequran_quiz_attempt
local_prequran_quiz_pass
local_prequran_quiz_question
```

## Phase 6: Import Order

Import after users/courses/cohorts are present on ScalaHosting.

Recommended import order:

1. `local_prequran_stepcfg`
2. `local_prequran_student_profile`
3. `local_prequran_teacher_profile`
4. `local_prequran_teacher_student`
5. `local_prequran_group_pool`
6. `local_prequran_class_group`
7. `local_prequran_group_member`
8. `local_prequran_intake_request`
9. `local_prequran_lessonprog`
10. `local_prequran_stepprog`
11. `local_prequran_focuslog`
12. `local_prequran_focusagg`
13. `local_prequran_speakrec`
14. `local_prequran_submitrec`
15. `local_prequran_comm_thread`
16. `local_prequran_comm_participant`
17. `local_prequran_comm_message`
18. `local_prequran_comm_consent`
19. `local_prequran_live_availability`
20. `local_prequran_live_consent`
21. `local_prequran_live_series`
22. `local_prequran_live_session`
23. `local_prequran_live_participant`
24. `local_prequran_live_attendance`
25. `local_prequran_live_note`
26. `local_prequran_live_recording`
27. `local_prequran_live_ack`
28. `local_prequran_live_audit`
29. `local_prequran_quiz_attempt`
30. `local_prequran_quiz_pass`
31. `local_prequran_quiz_question`

If user IDs, cohort IDs, group IDs, or course IDs differ between source and target, do not import directly. Build mapping tables first.

## Phase 7: Settings To Recreate Manually

Re-enter these on ScalaHosting instead of blindly copying them:

- `$CFG->wwwroot`, database, dataroot, and cache settings.
- SMTP credentials.
- BigBlueButton base URL and shared secret.
- ElevenLabs or TTS API keys.
- WhatsApp/Meta/webhook credentials.
- Web service tokens.
- OAuth or SSO secrets.
- Payment keys, if any.
- Any hosting-specific paths.

These settings may be copied only after review:

- `local_prequran` non-secret plugin settings.
- Enabled web service service definitions.
- Role capabilities.
- Scheduled task enablement/frequency.

## Phase 8: Post-Migration Verification

Run:

```text
src/moodle/local_prequran/sql/migration/target_post_migration_verification.sql
src/moodle/local_prequran/sql/verify_live_schema_readiness.sql
src/moodle/local_prequran/sql/verify_group_1_access_security.sql
src/moodle/local_prequran/sql/verify_group_4_production_smoke.sql
src/moodle/local_prequran/sql/verify_group_5_monitoring_runbook.sql
src/moodle/local_prequran/sql/verify_group_12_consistency_audit.sql
```

The target migration verification script assumes the expected custom tables exist. If it fails on a missing table, return to the plugin/schema checklist above before importing data.

Browser checks:

```text
/local/hubredirect/dashboard.php
/local/hubredirect/live_admin.php
/local/hubredirect/live_ops.php
/local/hubredirect/live_diagnostics.php
/local/hubredirect/live_teacher.php
/local/hubredirect/live_schedule.php
/local/hubredirect/live_summaries.php
/local/hubredirect/live_recordings.php
/local/hubredirect/quiz_report.php
```

Role checks:

1. Admin can see diagnostics and admin dashboards.
2. Teacher can see assigned students only.
3. Parent can see linked children only.
4. Student can see own schedule and lessons only.
5. Anonymous users cannot access private dashboards.

Web service checks:

1. `PreQuran Web Services` exists and is enabled.
2. Required functions from `local/prequran/db/services.php` are registered.
3. New ScalaHosting token is created for any external app integration.
4. Old hosting.com tokens are not reused unless deliberately approved.

## Go/No-Go Decision

Use this sign-off format:

```text
Migration date:
Source site:
Target site:
Source Moodle version:
Target Moodle version:
Source DB prefix:
Target DB prefix:
Fresh Moodle install confirmed:
Plugins installed cleanly:
Courses restored:
Users restored:
Custom tables imported:
Secrets recreated:
Cron confirmed:
Web services confirmed:
SQL verification passed:
Role browser checks passed:
Known issues:
Decision: GO / NO-GO
Approved by:
```
