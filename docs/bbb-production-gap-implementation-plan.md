# BBB Production Gap Implementation Plan

Date created: 2026-05-23

This plan turns `docs/bbb-production-live-remaining-requirements.md` into an executable path from the current BBB live-session implementation to a controlled production launch.

## Launch Goal

Move BBB live sessions from feature-complete/pilot-ready into production-live readiness for a small controlled launch, then scale only after evidence shows the flow is stable.

## Non-Negotiable Exit Criteria

Broad production launch is allowed only when:

- Moodle upgrade works from the currently deployed production version.
- Live-session schema verification passes on a production database copy.
- Recording consent is enforced before BBB recording starts.
- BBB provider create/join/recording sync has been tested with production credentials.
- Admin, teacher, student, and parent role smoke tests pass.
- The release archive is built and verified to exclude secrets and child-sensitive data.
- Launch gates have named owners, evidence links, and pass/fail decisions.
- Rollback owner, backup location, and restore steps are confirmed.

## Phase 0: Confirm Baseline And Owners

Purpose: Make sure the implementation work starts from a known production target.

Implementation status: baseline and owner placeholders added to `docs/bbb-launch-execution-runbook.md` on 2026-05-23.

Phase 0 result:

- Candidate repo version confirmed as `local_prequran` `2026052202`, release `0.1.0`, maturity `MATURITY_ALPHA`.
- Launch posture set to controlled production pilot.
- Owner roles recorded in the launch runbook.
- Named owners, production plugin version, production Moodle version, and production database prefix remain pending because they require production Moodle access.

Tasks:

1. Confirm the currently deployed production `local_prequran` plugin version.
2. Confirm production Moodle version and database prefix.
3. Assign owners:
   - Technical lead
   - Moodle admin
   - Privacy/child-safety lead
   - Operations lead
   - Teacher pilot owner
   - Parent support owner
4. Confirm whether the next release is:
   - controlled production pilot, or
   - broad production launch.
5. Update `docs/bbb-launch-execution-runbook.md` with owner names where known.

Deliverables:

- Filled owner list.
- Confirmed source and target plugin versions.
- Launch posture decision.

Evidence:

- Screenshot or note from production plugin overview.
- Production Moodle version note.

## Phase 1: Fix Upgrade And Release Metadata

Purpose: Ensure existing installs receive the complete BBB schema.

Implementation status: code implemented on 2026-05-23 and corrected on 2026-05-24 for candidate version `202605240003`.

Phase 1 result:

- Added a `202605240003` upgrade step in `src/moodle/local_prequran/db/upgrade.php`.
- The upgrade step calls `xmldb_local_prequran_ensure_live_schema()`, `xmldb_local_prequran_ensure_grouping_schema()`, and `xmldb_local_prequran_ensure_intake_request_schema()`.
- Bumped `src/moodle/local_prequran/version.php` to `202605240003`.
- Set release metadata to controlled-pilot posture: `MATURITY_ALPHA`, release `0.1.2-pilot`.
- quraantest showed installed `local_prequran` version `202512100569`; the candidate version must remain numerically higher than that value to avoid Moodle's downgrade guard.
- quraantest Moodle upgrade completed successfully for `202605240002`.
- quraantest live diagnostics showed BBB config, helper file, and core live tables passing.
- SQL verification remains pending because it must be run against the quraantest database.

Tasks:

1. Add a new upgrade step in `src/moodle/local_prequran/db/upgrade.php` for the next plugin version.
2. In that step, call:
   - `xmldb_local_prequran_ensure_live_schema()`
   - `xmldb_local_prequran_ensure_grouping_schema()`
   - `xmldb_local_prequran_ensure_intake_request_schema()`
3. Bump `src/moodle/local_prequran/version.php`.
4. Decide release metadata:
   - Pilot-only: keep conservative maturity but document pilot status.
   - Production launch: move from `MATURITY_ALPHA` after all blockers close.
5. Run PHP lint.
6. Test Moodle upgrade from a copy of the current production plugin/database state.

Acceptance criteria:

- Moodle upgrade completes without manual SQL.
- New install still works through `db/install.php`.
- Existing install receives all live-session tables and fields.
- No duplicate BBB meeting IDs.

Evidence:

- PHP lint output.
- Moodle upgrade completion screenshot.
- Results from:
  - `verify_live_schema_readiness.sql`
  - `verify_group_12_consistency_audit.sql`
  - `verify_launch_execution_readiness.sql`

## Phase 2: Enforce Recording Consent

Purpose: Prevent accidental recording of child sessions without required guardian consent.

Implementation status: code implemented on 2026-05-24.

Phase 2 result:

- Added reusable recording-consent decision helpers in `src/moodle/local_prequran/locallib.php`.
- Enforced the consent decision before BBB `create` in `src/moodle/local_hubredirect/live_sessions.php`.
- Enforced the same consent decision before BBB `create` in `src/moodle/local_prequran/externallib_v4.php`.
- If recording was requested but consent is missing, BBB meeting creation continues with `record = false` and `autoStartRecording = false`.
- The session is updated so `recording_enabled = 0` when recording is disabled by policy at BBB create time.
- Added audit action `recording_disabled_missing_consent` with affected student IDs.
- Added diagnostics visibility for the recording-consent policy and disabled-by-consent sessions.
- Updated `verify_launch_execution_readiness.sql` to report recording-enabled sessions with active students missing recording consent.

Policy decision:

- Default: recording is disabled unless every active student participant has recording consent.
- Admins may not override missing recording consent for production child sessions unless a separate written policy is approved.

Implementation tasks:

1. Add a reusable consent check in the Moodle live-session code path.
2. Check consent before BBB `create` is called from:
   - `src/moodle/local_hubredirect/live_sessions.php`
   - `src/moodle/local_prequran/externallib_v4.php`
3. If consent is missing:
   - set BBB `record` to false
   - set BBB `autoStartRecording` to false
   - keep the meeting start/join flow working
   - write an audit row with missing student IDs and action such as `recording_disabled_missing_consent`
4. Update diagnostics or operations visibility so admins can see why recording was disabled.
5. Add/update SQL verification to catch sessions with recording enabled but missing consent.

Acceptance criteria:

- Session starts without recording when any required consent is missing.
- Session starts with recording when all required consent exists.
- Parent-visible recording publish remains review-gated and hidden by default.
- Audit trail identifies the consent decision.

Evidence:

- Two test sessions:
  - one missing consent
  - one with all consents
- BBB create parameters observed through logs/audit/diagnostics.
- Parent recording page shows only reviewed, visible, non-expired recordings.

## Phase 3: Decide Session Lifecycle Automation

Purpose: Avoid operational ambiguity after BBB class time ends.

Implementation status: implemented in repo on 2026-05-24.

Phase 3 result:

- Lifecycle decision set to `awaiting_review` for ended live sessions that still need teacher review.
- The existing `local_prequran\task\live_session_reminders` scheduled task now moves ended `live` sessions to `awaiting_review`.
- Legacy ended `needs_review` rows are normalized to `awaiting_review` by the same task.
- Teacher and operations dashboards label the post-class queue as awaiting review.
- `completed` remains reserved for sessions whose attendance and parent-visible feedback pass the completion check.
- `verify_launch_execution_readiness.sql` now reports ended `live` sessions that were not moved and lists the current `awaiting_review` queue.

Decision:

- Option A: Sessions stay `live` until teacher marks review complete.
- Option B: Cron moves ended `live` sessions to `awaiting_review`.
- Option C: Cron moves ended `live` sessions to `completed_pending_review`.

Recommended choice:

- Use `awaiting_review` for ended sessions that need teacher attendance/notes.
- Use `completed` only after attendance and parent-visible feedback are complete.

Implementation tasks:

1. Add lifecycle status rules to the implementation docs.
2. If choosing automation, extend the scheduled task to mark ended `live` sessions as `awaiting_review`.
3. Make operations/teacher dashboards treat `awaiting_review` as needing action.
4. Confirm reports and SQL checks include the new status.

Acceptance criteria:

- Teachers can easily find classes needing review.
- Operations can distinguish active, ended-needing-review, completed, cancelled, and failed sessions.
- No parent-facing page treats an unreviewed session as complete.

Evidence:

- Ended live session appears in teacher review queue.
- Completed session appears only after review save.

## Phase 4: Recording Sync And Retention Operations

Purpose: Decide whether recordings are cron-owned or operator-owned.

Implementation status: implemented in repo on 2026-05-24.

Phase 4 result:

- Pilot operating model set to manual admin sync during the first pilot week.
- `live_recordings_admin.php` now shows recording operations metrics, last sync, last expiry audit, retention days, and the pilot checklist.
- Publish is guarded so expired recordings and recordings without playback URLs cannot be made parent-visible.
- Recording review actions now write production-readable audit actions: `recording_reviewed`, `recording_published`, `recording_unpublished`, `recording_archived`, and `recording_expired`.
- `verify_launch_execution_readiness.sql` now reports parent-visible recording blockers and recent recording operations.
- `verify_live_recordings.sql` now checks visible-without-review, visible-after-expiry, and visible-non-available recording blockers.

Decision:

- Manual admin sync for pilot, or automated sync after pilot.

Recommended pilot approach:

- Keep recording sync manual during the first pilot week.
- Add a named daily admin responsibility.
- Automate after the team sees provider processing timing.

Tasks:

1. Document who syncs recordings and when.
2. Confirm `live_recordings_admin.php` works against production BBB credentials.
3. Confirm retention expiry is applied either:
   - manually on a schedule, or
   - by a future cron task.
4. Add a first-week operations checklist item for recording sync and retention.

Acceptance criteria:

- Recordings remain hidden until admin review.
- Expired recordings are hidden from parents.
- No raw recording metadata or playback URLs are exported into release artifacts.

Evidence:

- Recording sync result.
- Recording publish/unpublish/archive audit rows.
- Parent access test.

## Phase 5: Production-Copy Verification

Purpose: Catch schema, data, access, and SQL issues before touching production.

Implementation status: verification package implemented in repo on 2026-05-24.

Phase 5 result:

- Added `verify_phase_5_production_copy.sql` as a single read-only production-copy blocker summary for quraantest/phpMyAdmin evidence.
- Updated Group 4 and Group 6 verification SQL to use current BBB join and recording audit action names.
- Phase 5 blocker summary now checks duplicate BBB meeting IDs, open BBB errors, ended live sessions not moved to `awaiting_review`, recording-consent blockers, parent-visible recording safety, completed-session review completeness, and recent notification failures.
- Operational queues are separated from blockers so pilot work-in-progress can be documented without blocking release packaging by default.

Tasks:

1. Restore or clone production DB into a safe test environment.
2. Deploy the candidate plugin files.
3. Complete Moodle upgrade.
4. Run:
   - `tools/run_moodle_php_lint.ps1`
   - `verify_phase_5_production_copy.sql`
   - `verify_live_schema_readiness.sql`
   - `verify_group_12_consistency_audit.sql`
   - `verify_launch_execution_readiness.sql`
   - `verify_group_4_production_smoke.sql`
   - `verify_group_6_deployment_handoff.sql`
5. Fix any blocker rows before release packaging.

Acceptance criteria:

- No schema blockers.
- No access-control blockers.
- No open BBB errors in test data unless documented as known non-launch blockers.
- No parent-visible recordings without review.

Evidence:

- SQL output files or screenshots.
- Diagnostics screenshot.
- Known-issues table updated.

## Phase 6: Role-Based Browser Smoke Test

Purpose: Prove the workflow works for each real user role.

Implementation status: smoke-test package implemented in repo on 2026-05-24.

Phase 6 result:

- Added `docs/bbb-phase-6-role-browser-smoke.md` with admin, teacher, student, and parent browser evidence steps.
- Added `verify_phase_6_role_browser_smoke.sql` to summarize role smoke evidence, privacy/access blockers, latest session audit rows, and student isolation shape.
- Phase 6 evidence now distinguishes required `PASS` items from `NOT_APPLICABLE` paths such as recording or follow-up when the pilot scenario does not include them.

Admin smoke:

- Open diagnostics.
- Create/select group.
- Create live session.
- Open operations dashboard.
- Sync recording metadata.
- Review/publish/archive recording.

Teacher smoke:

- Open teacher workspace.
- Start class.
- Open lesson monitor.
- Save attendance and notes.
- Mark session complete.

Student smoke:

- See assigned live session.
- Cannot join before the configured window.
- Can join inside the window.
- Cannot see other students' sessions.

Parent smoke:

- See linked child schedule/summary.
- Cannot view private teacher notes.
- Can view only approved recordings.
- Can respond to follow-ups or acknowledgements.

Acceptance criteria:

- Screenshots collected for each role.
- Audit rows exist for create, BBB create, join, review save, parent publish, and recording action.

## Phase 7: Release Archive And Deployment Handoff

Purpose: Package the launch safely and make rollback real.

Tasks:

1. Build archive:
   `tools/build_bbb_live_release_archive.ps1`
2. Verify archive includes:
   - `code/local_prequran`
   - `code/local_hubredirect`
   - docs
   - SQL verification scripts
   - evidence placeholders or completed evidence
3. Verify archive excludes:
   - BBB shared secret
   - `config.php`
   - raw recordings
   - database dumps
   - private notes
   - child-sensitive exports
   - join links/session tokens
   - cookies
4. Fill deployment owner, rollback owner, backup location, and restore steps.
5. Freeze known issues and launch decision.

Acceptance criteria:

- Archive path and hash recorded.
- Exclusion checklist complete.
- Rollback owner confirmed.

## Phase 8: Controlled Production Pilot

Purpose: Prove real production conditions before broad launch.

Pilot scope:

- 1 admin
- 1 trained teacher
- 1 managed student
- 1 linked parent
- 1 live session
- recording only if consent passes

Pilot steps:

1. Back up production DB and plugin folders.
2. Deploy candidate plugin files.
3. Run Moodle upgrade.
4. Purge caches.
5. Configure BBB settings.
6. Run diagnostics.
7. Create pilot class/session.
8. Teacher starts BBB.
9. Student joins inside window.
10. Teacher completes attendance and notes.
11. Parent verifies summary visibility and private-note protection.
12. Admin syncs recording after provider processing.
13. Admin reviews and publishes recording if consent allows.
14. Parent verifies recording access.
15. Confirm reminders/follow-ups/audit rows.

Acceptance criteria:

- Pilot class completes without manual database intervention.
- No unexpected BBB create/join errors.
- No privacy leak.
- Operations can support the workflow from dashboards/runbooks.

## Phase 9: Launch Decision And Scale

Purpose: Decide whether to expand beyond pilot.

Decision options:

- Go: expand to next small cohort.
- Hold: fix issues and rerun pilot.
- Rollback: restore previous plugin folders/database if critical behavior regresses.

Scale-up criteria:

- Two or more successful pilot sessions.
- No unresolved P0/P1 privacy, access, BBB, or recording issues.
- Parent support questions are understood and documented.
- Teacher can run the workflow without technical lead supervision.
- Operations dashboard has no unresolved launch blockers.

## Suggested Work Tickets

1. `BBB-PROD-001`: Add current-version upgrade step and bump plugin version.
2. `BBB-PROD-002`: Enforce recording consent before BBB create.
3. `BBB-PROD-003`: Add recording consent diagnostics/audit visibility.
4. `BBB-PROD-004`: Decide and implement ended-session lifecycle status.
5. `BBB-PROD-005`: Define recording sync/retention operating model.
6. `BBB-PROD-006`: Run production-copy SQL verification.
7. `BBB-PROD-007`: Complete role-based browser smoke evidence.
8. `BBB-PROD-008`: Build and verify release archive.
9. `BBB-PROD-009`: Fill launch gate owners, decisions, and rollback details.
10. `BBB-PROD-010`: Execute controlled production pilot.

## Risk Register

| Risk | Impact | Mitigation | Launch rule |
| --- | --- | --- | --- |
| Existing production install skips newer schema | Pages fail or data missing | Current-version upgrade step and production-copy upgrade test | Block launch |
| Recording starts without consent | Child-safety/privacy incident | Consent gate before BBB create | Block launch |
| BBB provider credentials wrong | Teacher cannot start class | Production API create/join smoke | Block launch |
| Parent sees private data | Privacy incident | Parent role smoke and SQL access checks | Block launch |
| Recording playback URL overexposed | Privacy incident | Hidden-by-default review workflow and parent access test | Block launch |
| Cron not running | Reminders/follow-ups fail | Verify scheduled task execution | Pilot only with manual monitoring |
| Teacher workflow too complex | Pilot failure | Teacher dry run and one-page operator checklist | Hold scale-up |

## Immediate Next Step

Start with `BBB-PROD-001` and `BBB-PROD-002`. Those two close the largest technical and child-safety blockers. After that, run production-copy verification before spending time on final release packaging.
