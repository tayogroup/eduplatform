# BBB Group 6: Release Packaging & Final Deployment Handoff

This group packages the live-class work into a production deployment and handoff process.

## Implemented

- Added the final deployment sequence for `local/prequran` and `local/hubredirect`.
- Added upload map for Moodle plugin files and operational docs.
- Added backup, upgrade, cache purge, verification, rollback, and launch sign-off steps.
- Added final handoff bundles for admin, support, teachers, leadership, and technical owners.
- Added consolidated final deployment SQL: `src/moodle/local_prequran/sql/verify_group_6_deployment_handoff.sql`.

## Release Scope

Deploy these Moodle folders:

```text
src/moodle/local_prequran  ->  Moodle: local/prequran
src/moodle/local_hubredirect  ->  Moodle: local/hubredirect
```

Keep these documentation and SQL assets in the release handoff:

```text
docs/bbb-group-1-access-security-hardening.md
docs/bbb-group-2-upgrade-deployment-readiness.md
docs/bbb-group-3-navigation-ux-cleanup.md
docs/bbb-group-4-production-smoke-tests.md
docs/bbb-group-5-production-monitoring-runbook.md
docs/bbb-group-6-release-packaging-deployment-handoff.md
src/moodle/local_prequran/sql/verify_live_schema_readiness.sql
src/moodle/local_prequran/sql/verify_group_1_access_security.sql
src/moodle/local_prequran/sql/verify_group_3_navigation_ux.sql
src/moodle/local_prequran/sql/verify_group_4_production_smoke.sql
src/moodle/local_prequran/sql/verify_group_5_monitoring_runbook.sql
src/moodle/local_prequran/sql/verify_group_6_deployment_handoff.sql
```

## Pre-Deployment Checklist

Complete these before uploading files:

1. Confirm a current database backup exists.
2. Confirm a copy of the current production `local/prequran` folder exists.
3. Confirm a copy of the current production `local/hubredirect` folder exists.
4. Confirm BBB provider base URL and shared secret are available to the technical owner.
5. Confirm Moodle admin access.
6. Confirm phpMyAdmin or database read access for verification scripts.
7. Confirm a maintenance window or low-traffic deployment time.
8. Confirm support and teacher leads know a deployment is happening.
9. Confirm rollback owner and decision maker.
10. Confirm no live class is currently in progress.

## Deployment Steps

1. Put Moodle in maintenance mode if the deployment window requires it.
2. Upload `src/moodle/local_prequran` to `local/prequran`.
3. Upload `src/moodle/local_hubredirect` to `local/hubredirect`.
4. Visit Moodle Site administration.
5. Run the plugin upgrade if Moodle prompts for it.
6. Purge Moodle caches.
7. Open `/local/hubredirect/live_diagnostics.php`.
8. Confirm BBB settings and live tables pass.
9. Run `verify_live_schema_readiness.sql`.
10. Run `verify_group_6_deployment_handoff.sql`.
11. Run the Group 4 smoke test.
12. Run the Group 5 monitoring checks.
13. Remove maintenance mode if enabled.
14. Notify admin, teacher, and support owners that deployment is complete.

## Verification Order

Use this order after every production deployment:

1. Schema readiness: `verify_live_schema_readiness.sql`.
2. Access/security: `verify_group_1_access_security.sql`.
3. Navigation: `verify_group_3_navigation_ux.sql`.
4. Live smoke: `verify_group_4_production_smoke.sql`.
5. Monitoring: `verify_group_5_monitoring_runbook.sql`.
6. Final handoff: `verify_group_6_deployment_handoff.sql`.

If an earlier verification fails, stop and resolve it before continuing.

## Post-Deployment Browser Checks

Admin:

1. `/local/hubredirect/dashboard.php`
2. `/local/hubredirect/live_admin.php`
3. `/local/hubredirect/live_ops.php`
4. `/local/hubredirect/live_diagnostics.php`
5. `/local/hubredirect/live_recordings_admin.php`
6. `/local/hubredirect/live_quality_analytics.php`

Teacher:

1. `/local/hubredirect/dashboard.php`
2. `/local/hubredirect/live_teacher.php`
3. `/local/hubredirect/live_sessions.php`
4. `/local/hubredirect/live_schedule.php`

Parent:

1. `/local/hubredirect/dashboard.php`
2. `/local/hubredirect/live_schedule.php`
3. `/local/hubredirect/live_summaries.php`
4. `/local/hubredirect/live_recordings.php`
5. `/local/hubredirect/live_parent_trust.php`

Student:

1. `/local/hubredirect/dashboard.php`
2. `/local/hubredirect/live_schedule.php`
3. `/local/hubredirect/live_sessions.php`
4. Start or join one test class inside the join window.

## Rollback Plan

Use rollback only if production is blocked or child-safety/privacy risk exists.

1. Put Moodle into maintenance mode.
2. Preserve logs, audit rows, screenshots, and error messages.
3. Restore the previous `local/prequran` folder.
4. Restore the previous `local/hubredirect` folder.
5. Restore the database backup only if schema/data changes caused the failure and leadership approves.
6. Purge Moodle caches.
7. Run diagnostics.
8. Confirm dashboards load.
9. Remove maintenance mode.
10. Record rollback reason and owner.

Do not delete live-session data, recordings, parent summaries, audit rows, or purge evidence as part of a normal code rollback.

## Emergency Production Pause

If rollback is not required but live operations should pause:

1. Stop creating new sessions.
2. Hide or disable live-class links if needed.
3. Pause parent recording publication.
4. Pause parent summary publication if privacy is affected.
5. Keep cron running unless reminders are causing the incident.
6. Keep audit history intact.

## Release Sign-Off Template

```text
Release name:
Release date:
Deployed by:
Database backup confirmed by:
Moodle file backup confirmed by:
BBB settings verified by:
Schema readiness passed:
Group 4 smoke test passed:
Group 5 monitoring passed:
Known issues:
Rollback owner:
Launch decision: GO / NO-GO
Approved by:
```

## Handoff Bundles

Admin operations bundle:

- Group 3 navigation guide.
- Group 4 smoke test.
- Group 5 monitoring runbook.
- Group 6 deployment handoff.

Support bundle:

- Group 5 incident runbook.
- Parent and teacher support templates.
- Privacy escalation process.

Teacher bundle:

- Teacher workspace route.
- Start/join class process.
- Attendance and notes process.
- Parent-safe summary guidance.

Leadership bundle:

- Launch go/no-go criteria.
- QA analytics and leadership dashboard guidance.
- Improvement-plan process.
- Privacy and retention escalation process.

Technical bundle:

- Deployment steps.
- Rollback steps.
- SQL verification scripts.
- BBB diagnostics and cron checks.

## First Production Pilot

Run the first pilot with a small group:

1. One teacher.
2. One class.
3. One to three students.
4. One linked parent per student.
5. Recording enabled only if consent exists.
6. Admin present for the full session.
7. Support owner available during and after class.
8. QA review completed the same day.
9. Parent summary reviewed for safety before broad rollout.

Move to larger classes only after the pilot passes the Group 4 and Group 5 checks.

## Production Pilot Pack

For the first real pilot and feedback loop, use:

```text
docs/bbb-group-7-production-pilot-feedback-loop.md
src/moodle/local_prequran/sql/verify_group_7_pilot_feedback.sql
```
