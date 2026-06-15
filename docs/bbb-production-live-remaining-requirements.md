# BBB Production Live: Remaining Requirements

Date reviewed: 2026-06-09

This review defines the remaining requirements for taking the BigBlueButton live-session implementation from controlled pilot readiness to production-live operation.

Primary dashboard links:

- Admin BBB dashboard / operations hub: `/local/hubredirect/live_admin.php`
- Daily operations dashboard: `/local/hubredirect/live_ops.php`
- Role dashboard entry point: `/local/hubredirect/dashboard.php`
- Live diagnostics: `/local/hubredirect/live_diagnostics.php`

Implementation plan: `docs/bbb-production-gap-implementation-plan.md`

## Current Implementation Snapshot

The implementation includes the core production-pilot surface:

- BBB server-side helper for signed `create`, `join`, and `getRecordings` API calls.
- Moodle plugin settings for BBB base URL, shared secret, join windows, capacity, and recording retention.
- Live-session schema helpers for sessions, participants, attendance, notes, recordings, consent, audit, series, availability, grouping, intake, acknowledgements, quality, follow-ups, leadership review, teacher profiles, and parent trust.
- Moodle install and upgrade hooks for guarded schema creation.
- Web-service endpoints for live-session create/list/get/join flows.
- Admin, teacher, student, and parent browser pages for scheduling, joining, teacher workspace, review, recordings, parent summaries, quality review, leadership review, series management, grouping, and parent trust.
- Scheduled task coverage for reminders, follow-ups, quality/coaching alerts, leadership alerts, improvement-plan reminders, ended-session review transition, and series acknowledgement reminders.
- Launch, smoke-test, monitoring, handoff, pilot, rollout, stable-operations, and release archive documentation.

Current candidate metadata:

- Component: `local_prequran`
- Version: `202605240003`
- Release: `0.1.2-pilot`
- Maturity: `MATURITY_ALPHA`
- Launch posture: controlled production pilot until production evidence is complete.

## Closed Technical Blockers

These blockers were identified in the original May 2026 review and are now implemented in the repo:

1. Current-version upgrade path.
   - `db/upgrade.php` includes a current candidate upgrade step.
   - The upgrade step calls the guarded live schema, grouping schema, and intake request schema helpers.
2. Recording consent enforcement.
   - BBB create paths disable recording when required guardian consent is missing.
   - The policy writes `recording_disabled_missing_consent` audit evidence.
3. Ended-session lifecycle.
   - Scheduled task moves ended `live` sessions into `awaiting_review`.
   - `completed` remains reserved for reviewed sessions with attendance and parent-visible feedback complete.
4. Recording review and retention operating model.
   - Pilot model is manual admin recording sync.
   - Recording publish is review-gated and blocks expired or unavailable playback URLs.
5. Verification package.
   - Production-copy, role-smoke, launch-readiness, group audit, recording, and operations SQL scripts are available under `src/moodle/local_prequran/sql`.

## Remaining Go-Live Requirements

### A. Production Owner And Environment Decisions

Before pilot deployment, confirm and record:

- Technical lead.
- Moodle admin.
- Privacy/child-safety lead.
- Operations lead.
- Teacher pilot owner.
- Parent support owner.
- Production Moodle version.
- Production database prefix.
- Currently deployed production `local_prequran` version.
- Backup location and restore owner.
- Final decision: controlled production pilot or broader launch.

Evidence:

- Production plugin overview screenshot or written note.
- Owner list in `docs/bbb-launch-execution-runbook.md`.
- Rollback owner and backup location recorded in the launch runbook.

### B. Technical Release

Required:

- Moodle upgrade completes from a production database copy.
- `tools/run_moodle_php_lint.ps1` passes for Moodle PHP files.
- Schema and launch SQL verification returns no launch blockers.
- Release archive is built with `tools/build_bbb_live_release_archive.ps1`.
- Archive excludes secrets, raw recordings, database dumps, private notes, join links, cookies, and child-sensitive exports.
- Plugin files deploy cleanly to `local/prequran` and `local/hubredirect`.
- Moodle caches are purged after upgrade.

Required SQL evidence:

- `verify_phase_5_production_copy.sql`
- `verify_live_schema_readiness.sql`
- `verify_group_12_consistency_audit.sql`
- `verify_launch_execution_readiness.sql`
- `verify_group_4_production_smoke.sql`
- `verify_group_6_deployment_handoff.sql`

### C. BBB Provider Readiness

Required:

- BBB API base URL is configured to the `/bigbluebutton/api/` endpoint.
- BBB shared secret is present only in Moodle server-side config.
- Provider plan supports expected simultaneous meetings, max participants, recording, regional performance, and retention.
- Real BBB API health/create/join test succeeds using production credentials.
- Provider support contact and escalation path are documented.

Evidence:

- Diagnostics screenshot from `/local/hubredirect/live_diagnostics.php`.
- Successful pilot create/join audit rows.
- Provider support contact recorded in the runbook.

### D. Access Control And Child Safety

Required:

- Admin-only pages remain admin-only.
- Teacher pages expose only assigned students/sessions.
- Student pages expose only the student's own active sessions.
- Parent pages expose only linked child data.
- Join URL generation remains server-side and audited.
- Student/parent join windows are confirmed against operating policy.
- Private teacher notes are not visible to parents.
- Parent summaries and recordings require explicit publish/review steps.
- Parent trust support/audit views require a reason where applicable.

Evidence:

- Role-based browser smoke screenshots for admin, teacher, student, and parent.
- `verify_phase_6_role_browser_smoke.sql` output.
- Access-sensitive page review from Group 12.

### E. Scheduling And Session Lifecycle

Required:

- Admin and teacher session creation paths are tested.
- Conflict prevention is tested for teacher overlap, student overlap, capacity, and availability.
- Recurring series creation, update, cancellation, and acknowledgement flows are tested.
- Ended sessions move to `awaiting_review`.
- Teachers can complete attendance, notes, parent summaries, homework, follow-ups, and session completion without admin intervention.
- Operations dashboard shows actionable queues for live, awaiting review, recording, quality, parent follow-up, and escalation work.

Evidence:

- Created one-time session and recurring series.
- Teacher review save screenshot.
- Operations dashboard screenshot from `/local/hubredirect/live_ops.php`.

### F. Recordings

Required:

- Recording consent rule is enforced before BBB create.
- Recording sync from BBB is tested after provider processing delay.
- Recordings are hidden from parents by default.
- Admin review/publish/unpublish/archive works.
- Retention expiry is either manually operated during pilot or assigned to future automation.
- Parent access to playback URLs is validated.

Evidence:

- Test session where missing consent disables recording.
- Test session where all consents allow recording, if pilot policy permits recording.
- Recording review audit rows.
- Parent recording page shows only reviewed, visible, non-expired recordings.

### G. Notifications And Operations

Required:

- Moodle cron is running at the expected frequency.
- Scheduled task `local_prequran\task\live_session_reminders` is active.
- 24-hour and 1-hour reminders are tested.
- Teacher post-class follow-ups are tested.
- Admin escalation paths are tested.
- Parent follow-up and acknowledgement reminders are tested.
- Operations dashboard and diagnostics are reviewed daily during pilot.

Evidence:

- Scheduled task run evidence.
- Notification audit rows.
- Daily operations checklist entry.

### H. Controlled Production Pilot

Run a controlled pilot with:

- 1 admin.
- 1 trained teacher.
- 1 managed student.
- 1 linked parent.
- 1 live session.
- Recording enabled only if consent requirements pass.

Pilot must prove:

- Teacher starts BBB as moderator.
- Student joins inside the join window.
- Parent cannot join/view unless explicitly allowed.
- Attendance and notes save.
- Parent summary is visible and private notes are not.
- Recording sync, review, publish, and parent viewing work when recording is permitted.
- Audit rows exist for create, BBB create, join, review, recording, notifications, and parent-visible actions.

## Recommended Next Work Order

1. Fill owner, production version, database prefix, backup, and rollback details in the launch runbook.
2. Run the production-copy upgrade and SQL verification package.
3. Run PHP lint for Moodle files.
4. Complete the role-based browser smoke test and attach screenshots.
5. Execute BBB provider create/join test with production credentials.
6. Build and verify the release archive.
7. Run the controlled production pilot.
8. Record launch decision: go, hold, rollback, or expand to the next small cohort.

## Current Launch Recommendation

Proceed only with a controlled production pilot after production-copy SQL verification, PHP lint, role browser smoke, and BBB provider create/join checks pass.

Do not broad-launch until pilot evidence shows no unresolved P0/P1 privacy, access, BBB, recording, or teacher-workflow issues.
