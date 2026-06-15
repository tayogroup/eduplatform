# BBB Group 12: Final Code/SQL Consistency Audit

This group is a final review pack. It is not a feature phase. Use it before packaging the production release to confirm docs, routes, SQL scripts, and database expectations still agree.

## Implemented

- Added final code, route, documentation, and SQL audit checklist.
- Added route inventory for live-session pages.
- Added access-sensitive page review list.
- Added SQL/script consistency checks.
- Added PHP lint and Moodle upgrade sanity checklist.
- Added final audit SQL: `src/moodle/local_prequran/sql/verify_group_12_consistency_audit.sql`.
- Linked Group 12 from the operator handbook.

## Audit Goal

The goal is to catch mismatches before production:

- Documentation points to a route that does not exist.
- SQL references a column that was renamed.
- A live page is missing access protection.
- A parent page exposes teacher-only fields.
- A recording or summary workflow bypasses review.
- A deployment checklist skips schema readiness.

## Route Inventory

Core dashboards and launch pages:

```text
/local/hubredirect/dashboard.php
/local/hubredirect/live_admin.php
/local/hubredirect/live_ops.php
/local/hubredirect/live_diagnostics.php
/local/hubredirect/live_sessions.php
/local/hubredirect/live_teacher.php
```

Session creation and schedule:

```text
/local/hubredirect/live_create_wizard.php
/local/hubredirect/live_series_wizard.php
/local/hubredirect/live_series.php
/local/hubredirect/live_series_schedule.php
/local/hubredirect/live_schedule.php
/local/hubredirect/live_calendar.php
/local/hubredirect/live_capacity.php
/local/hubredirect/live_availability.php
```

Teacher workflow:

```text
/local/hubredirect/live_monitor.php
/local/hubredirect/live_review.php
/local/hubredirect/live_followups.php
/local/hubredirect/live_followup_message.php
```

Parent trust and visibility:

```text
/local/hubredirect/live_summaries.php
/local/hubredirect/live_recordings.php
/local/hubredirect/live_parent_trust.php
/local/hubredirect/live_parent_trust_audit.php
/local/hubredirect/live_parent_trust_retention.php
/local/hubredirect/live_parent_trust_review_pack.php
/local/hubredirect/live_parent_trust_purge_evidence.php
```

Admin quality and reporting:

```text
/local/hubredirect/live_recordings_admin.php
/local/hubredirect/live_quality.php
/local/hubredirect/live_quality_analytics.php
/local/hubredirect/live_leadership.php
/local/hubredirect/live_improvement_plans.php
/local/hubredirect/live_teacher_directory.php
/local/hubredirect/live_teacher_profile.php
/local/hubredirect/live_reports.php
```

Shared helpers:

```text
/local/hubredirect/live_security.php
/local/prequran/locallib.php
/local/prequran/notificationlib.php
```

## Access-Sensitive Page Audit

These pages require special attention:

- `live_review.php`: teacher/admin only; private notes must never show to parents.
- `live_monitor.php`: teacher/admin only; limited to assigned classes unless admin.
- `live_recordings_admin.php`: admin review required before parent visibility.
- `live_quality.php`: admin/QA only.
- `live_leadership.php`: leadership/admin only.
- `live_improvement_plans.php`: leadership/admin/authorized teacher view only.
- `live_parent_trust_audit.php`: support/admin with access reason.
- `live_parent_trust_purge_evidence.php`: admin only with reason and audit.
- `live_summaries.php`: parent sees linked children only and parent-visible fields only.
- `live_recordings.php`: parent sees linked children only and approved, unexpired recordings only.

For each page, confirm:

1. `require_login()` or equivalent Moodle login guard exists.
2. Role or relationship checks exist.
3. Context-required pages validate required IDs.
4. Denied access is handled safely.
5. Sensitive actions require `sesskey` when submitted by form.
6. Parent-visible pages do not print private teacher notes.
7. Admin/support access creates audit rows where expected.

## Documentation Consistency Audit

Check every Group document:

1. Referenced routes exist in `src/moodle/local_hubredirect`.
2. Referenced SQL scripts exist in `src/moodle/local_prequran/sql`.
3. Deployment docs reference `local/prequran` and `local/hubredirect`.
4. Pilot and launch docs reference Group 4, Group 5, and Group 6 in the right order.
5. Stable operations docs reference Group 10 monthly review.
6. Operator handbook references the latest group list.

## SQL Consistency Audit

For every verification script:

1. Replace `mdlgx_` only if the production Moodle prefix differs.
2. Confirm table names exist.
3. Confirm late-phase columns exist:
   - `qa_status`
   - `qa_coaching_status`
   - `leadership_review_status`
   - `improvement_plan_status`
   - `followup_status`
   - `parent_response_status`
   - `homework_lessonid`
   - `homework_unitid`
4. Confirm recording scripts do not assume parent visibility before admin review.
5. Confirm parent summary scripts do not expose `private_note` contents.

Run:

```text
src/moodle/local_prequran/sql/verify_group_12_consistency_audit.sql
```

## PHP Lint Checklist

Before final release, lint changed Moodle PHP files:

```text
C:\xampp\php\php.exe -l src\moodle\local_prequran\locallib.php
C:\xampp\php\php.exe -l src\moodle\local_prequran\notificationlib.php
C:\xampp\php\php.exe -l src\moodle\local_prequran\externallib_v4.php
C:\xampp\php\php.exe -l src\moodle\local_prequran\settings.php
C:\xampp\php\php.exe -l src\moodle\local_prequran\db\upgrade.php
C:\xampp\php\php.exe -l src\moodle\local_prequran\db\install.php
C:\xampp\php\php.exe -l src\moodle\local_prequran\db\upgradelib.php
```

Also lint every `src/moodle/local_hubredirect/*.php` page before packaging.

## Moodle Upgrade Sanity

Confirm:

1. `local_prequran/version.php` version increases only when upgrade code changes.
2. `db/upgrade.php` calls guarded upgrade helpers.
3. `db/install.php` can create fresh schema.
4. `db/messages.php` has no undefined Moodle constants.
5. `db/tasks.php` registers scheduled reminders.
6. Upgrade can be rerun without duplicate-column failures.

## Final Audit Decision

Use this decision format:

```text
Audit date:
Auditor:
Docs checked:
Routes checked:
SQL scripts checked:
PHP lint passed:
Schema readiness passed:
Group 12 SQL passed:
Open blockers:
Accepted known issues:
Decision: PASS / FIX REQUIRED
Approved by:
```

