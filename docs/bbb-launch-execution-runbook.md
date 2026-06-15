# Quraan Academy BBB Launch Execution Runbook

This runbook is the final launch checklist for the BigBlueButton live-session implementation. It assumes the feature build is complete and focuses on production readiness, release packaging, deployment, pilot checks, and sign-off.

## Phase 0 Baseline

Phase 0 status: baseline record created. Production-only values still require Moodle admin confirmation before Phase 1 starts.

| Item | Confirmed value | Evidence / source | Status |
| --- | --- | --- | --- |
| Candidate component | `local_prequran` | `src/moodle/local_prequran/version.php` | Confirmed from repo |
| Candidate plugin version | `202605240003` | `src/moodle/local_prequran/version.php` | Confirmed from repo |
| Candidate release | `0.1.2-pilot` | `src/moodle/local_prequran/version.php` | Confirmed from repo |
| Candidate maturity | `MATURITY_ALPHA` | `src/moodle/local_prequran/version.php` | Confirmed from repo |
| Moodle minimum required | `2022041900` | `src/moodle/local_prequran/version.php` | Confirmed from repo |
| Currently deployed test plugin version | `202512100569` | quraantest Moodle upgrade screen, 2026-05-24 | Confirmed from test clone |
| Currently deployed production plugin version | `TBD` | Production Moodle plugin overview or `mdl_config_plugins` | Pending Moodle admin |
| Production Moodle version | `TBD` | Site administration / server environment | Pending Moodle admin |
| Production database prefix | `TBD` | Production `config.php` or database inspection | Pending Moodle admin |
| Target next release version | `202605240003` | `src/moodle/local_prequran/version.php` | Confirmed from repo |
| Launch posture | Controlled production pilot | Phase 0 decision for this release | Confirmed |

Phase 0 evidence to attach before Phase 1 implementation:

- Production plugin overview note or screenshot showing the currently deployed `local_prequran` version.
- Production Moodle version note.
- Production database prefix note.

## Phase 0 Owners

Owner names are not available in the repository. The role ownership matrix below is the launch baseline and must be replaced with named people before production deployment.

| Responsibility | Owner role | Named owner | Phase 0 status |
| --- | --- | --- | --- |
| Technical lead | Technical owner | `TBD` | Role assigned, name pending |
| Moodle admin | Moodle technical owner | `TBD` | Role assigned, name pending |
| Privacy/child-safety lead | Privacy/safety owner | `TBD` | Role assigned, name pending |
| Operations lead | Live operations owner | `TBD` | Role assigned, name pending |
| Teacher pilot owner | Teacher lead | `TBD` | Role assigned, name pending |
| Parent support owner | Parent support owner | `TBD` | Role assigned, name pending |
| Rollback owner | Technical owner or delegated Moodle admin | `TBD` | Pending |

Phase 0 decision:

- The next release should be treated as a controlled production pilot, not a broad production launch.
- Release metadata remains conservative for pilot: `MATURITY_ALPHA`, release `0.1.2-pilot`.
- Broad launch remains blocked until the production gap implementation plan exit criteria are complete.

## Phase 1 Upgrade Status

Phase 1 code status: implemented in repo.

| Item | Result | Evidence / source | Status |
| --- | --- | --- | --- |
| Upgrade step added | `202605240003` savepoint | `src/moodle/local_prequran/db/upgrade.php` | Complete |
| Live schema ensure called | `xmldb_local_prequran_ensure_live_schema()` | `src/moodle/local_prequran/db/upgrade.php` | Complete |
| Grouping schema ensure called | `xmldb_local_prequran_ensure_grouping_schema()` | `src/moodle/local_prequran/db/upgrade.php` | Complete |
| Intake request schema ensure called | `xmldb_local_prequran_ensure_intake_request_schema()` | `src/moodle/local_prequran/db/upgrade.php` | Complete |
| Version bumped | `202605240003` | `src/moodle/local_prequran/version.php` | Complete |
| Release metadata decision | Pilot-only conservative metadata | `src/moodle/local_prequran/version.php` | Complete |
| PHP lint | Passed 65 files, failed 0 | `tools/run_moodle_php_lint.ps1`, latest run 2026-05-24 09:25 +03:00 | Complete |
| Production-copy Moodle upgrade | `202605240003` upgrade completed successfully on quraantest | quraantest Moodle upgrade screen, 2026-05-24 | Complete |
| Live diagnostics | BBB config, helper, and core live tables PASS on quraantest | `/local/hubredirect/live_diagnostics.php`, 2026-05-24 | Complete |
| Schema SQL verification | BBB config present, live-session columns present, no duplicate BBB meeting IDs, no recording consent blockers | quraantest phpMyAdmin SQL evidence, 2026-05-24 | Complete |

## Phase 2 Recording Consent Status

Phase 2 code status: implemented in repo.

| Item | Result | Evidence / source | Status |
| --- | --- | --- | --- |
| Reusable consent decision helper | Added | `src/moodle/local_prequran/locallib.php` | Complete |
| Page join BBB create enforcement | Recording disabled when any active student lacks consent | `src/moodle/local_hubredirect/live_sessions.php` | Complete |
| Web-service BBB create enforcement | Recording disabled when any active student lacks consent | `src/moodle/local_prequran/externallib_v4.php` | Complete |
| Audit action | `recording_disabled_missing_consent` | Live audit table | Complete |
| Diagnostics visibility | Recording policy and disabled-by-consent sessions shown | `/local/hubredirect/live_diagnostics.php` | Complete |
| SQL readiness check | Missing-consent recording blocker query added | `verify_launch_execution_readiness.sql` | Complete |
| PHP lint | Passed 65 files, failed 0 | `tools/run_moodle_php_lint.ps1`, latest run 2026-05-24 09:53 +03:00 | Complete |
| Missing-consent test | `TBD` | quraantest controlled test session | Pending quraantest |
| All-consent recording test | `TBD` | quraantest controlled test session | Pending quraantest |

## Phase 3 Session Lifecycle Status

Phase 3 code status: implemented in repo.

| Item | Result | Evidence / source | Status |
| --- | --- | --- | --- |
| Lifecycle decision | Use `awaiting_review` after scheduled end when teacher review is still needed | `docs/bbb-production-gap-implementation-plan.md` | Complete |
| Scheduled task automation | Ended `live` sessions move to `awaiting_review`; legacy `needs_review` rows are normalized | `src/moodle/local_prequran/classes/task/live_session_reminders.php` | Complete |
| Review completion rule | `completed` only after attendance and parent-visible feedback pass completion checks | `src/moodle/local_hubredirect/live_review.php` | Complete |
| Teacher visibility | Teacher workspace labels the queue as awaiting review | `src/moodle/local_hubredirect/live_teacher.php` | Complete |
| Operations visibility | Operations dashboard tracks awaiting review and review gaps | `src/moodle/local_hubredirect/live_ops.php` | Complete |
| SQL readiness check | Lifecycle blocker and awaiting-review queue queries added | `verify_launch_execution_readiness.sql` | Complete |
| PHP lint | Passed 65 files, failed 0 | `tools/run_moodle_php_lint.ps1`, latest run 2026-05-24 10:03 +03:00 | Complete |
| quraantest lifecycle evidence | `TBD` | scheduled task run and teacher/ops screenshots | Pending quraantest |

## Phase 4 Recording Sync And Retention Status

Phase 4 code status: implemented in repo.

| Item | Result | Evidence / source | Status |
| --- | --- | --- | --- |
| Pilot operating model | Manual admin sync during first pilot week; automate only after provider timing is observed | `docs/bbb-production-gap-implementation-plan.md` | Complete |
| Daily recording owner | Operations lead or delegated Moodle admin must run sync and expiry daily during pilot | Launch owner matrix | Pending named owner |
| Recording operations page | Metrics, last sync, last expiry, retention days, and pilot checklist shown | `src/moodle/local_hubredirect/live_recordings_admin.php` | Complete |
| Hidden-by-default rule | Synced recordings are stored with `visible_to_parent = 0` | `src/moodle/local_hubredirect/live_recordings_admin.php` | Complete |
| Publish guard | Expired recordings and recordings without playback URLs cannot be published | `src/moodle/local_hubredirect/live_recordings_admin.php` | Complete |
| Retention operation | Manual `Apply retention expiry` hides expired recordings and audits `recording_expired` | `src/moodle/local_hubredirect/live_recordings_admin.php` | Complete |
| Recording audit actions | `recordings_synced`, `recording_reviewed`, `recording_published`, `recording_unpublished`, `recording_archived`, `recording_expired` | Live audit table | Complete |
| SQL readiness check | Parent-visible recording blocker checks and recording operation audit checks added | `verify_launch_execution_readiness.sql`, `verify_live_recordings.sql` | Complete |
| PHP lint | Passed 65 files, failed 0 | `tools/run_moodle_php_lint.ps1`, latest run 2026-05-24 10:08 +03:00 | Complete |
| quraantest recording evidence | `TBD` | sync result, review/publish/archive/expiry screenshots and SQL output | Pending quraantest |

## Phase 5 Production-Copy Verification Status

Phase 5 code status: implemented in repo.

| Item | Result | Evidence / source | Status |
| --- | --- | --- | --- |
| Production-copy environment | quraantest clone exists and has accepted candidate plugin upgrades | quraantest Moodle admin screens | Complete |
| Single blocker summary SQL | Added read-only Phase 5 SQL for phpMyAdmin evidence | `src/moodle/local_prequran/sql/verify_phase_5_production_copy.sql` | Complete |
| Group 4 SQL alignment | Updated production smoke audit checks to current join/recording actions | `verify_group_4_production_smoke.sql` | Complete |
| Group 6 SQL alignment | Updated deployment handoff blockers for current recording visibility rules | `verify_group_6_deployment_handoff.sql` | Complete |
| Blocker coverage | Duplicate BBB IDs, BBB errors, lifecycle, consent, recording visibility, completion, notification failures | `verify_phase_5_production_copy.sql` | Complete |
| Operational queue coverage | Awaiting review, recording review, follow-ups, QA review | `verify_phase_5_production_copy.sql` | Complete |
| PHP lint | Passed 65 files, failed 0 | `tools/run_moodle_php_lint.ps1`, latest run 2026-05-24 10:12 +03:00 | Complete |
| quraantest SQL evidence | `TBD` | Phase 5 SQL outputs/screenshots | Pending quraantest |
| Known issues table | `TBD` | Runbook known issues section | Pending quraantest results |

### quraantest Moodle Bootstrap Recovery

Current incident, 2026-06-08: `https://quraantest.academy/` returns:

```text
Fatal error: $CFG->dataroot is not configured properly, directory does not exist or is not accessible! Exiting.
```

This is a Moodle bootstrap failure. It happens before `local_prequran` or `local_hubredirect` code can run, so do not redeploy plugin files as the first fix.

Recovery steps for the Moodle admin or hosting owner:

1. Open the quraantest Moodle `config.php`.
2. Confirm these values point to the test site, not production:
   - `$CFG->wwwroot` should be `https://quraantest.academy`.
   - `$CFG->dataroot` should point to the quraantest Moodle data directory.
   - Database name should remain the quraantest database. Previous evidence recorded `ehelacad_quraantest`.
   - Database prefix should remain `mdlgx_`.
3. In hosting file manager or SSH, confirm the exact `$CFG->dataroot` directory exists.
4. If the directory is missing, recreate or restore the quraantest moodledata directory from the test-site backup or clone package. Do not point quraantest at production moodledata.
5. Confirm the web server account can read, write, and create folders inside `$CFG->dataroot`.
6. Confirm `$CFG->dataroot` is outside the public web root where possible.
7. Clear Moodle cache only after the dataroot path and permissions are fixed.
8. Reload `https://quraantest.academy/`, then continue with `/admin/index.php` and `/local/hubredirect/live_diagnostics.php`.

Suggested hosting checks:

```bash
grep "dataroot\|wwwroot\|dbname\|prefix" /path/to/quraantest/config.php
ls -ld /path/from/CFG/dataroot
find /path/from/CFG/dataroot -maxdepth 1 -type d | head
```

If SSH is not available, use cPanel/File Manager to verify the folder named in `$CFG->dataroot` exists and has writable permissions for the site owner. Typical safe permissions are directories `755` or `750`, adjusted to the hosting account model.

If Moodle then reports `invaliddatarootpermissions` with `[tempdir]/filestorage can not be created`, the restored dataroot exists but Moodle cannot write inside its temp directory.

Fix the restored dataroot ownership and required writable subdirectories:

```bash
mkdir -p /path/from/CFG/dataroot/temp/filestorage
mkdir -p /path/from/CFG/dataroot/cache
mkdir -p /path/from/CFG/dataroot/localcache
mkdir -p /path/from/CFG/dataroot/filedir
chmod -R u+rwX /path/from/CFG/dataroot
find /path/from/CFG/dataroot -type d -exec chmod 755 {} \;
find /path/from/CFG/dataroot -type f -exec chmod 644 {} \;
```

On hosting where the account owner should own the files, also correct ownership, for example:

```bash
chown -R ehelacad:ehelacad /path/from/CFG/dataroot
```

Do not use world-writable `777` as a permanent fix unless the hosting provider explicitly requires it for the account isolation model.

## Phase 6 Role-Based Browser Smoke Status

Phase 6 code status: implemented in repo.

| Item | Result | Evidence / source | Status |
| --- | --- | --- | --- |
| Browser smoke checklist | Admin, teacher, student, and parent evidence steps documented | `docs/bbb-phase-6-role-browser-smoke.md` | Complete |
| Role smoke SQL | Added read-only role evidence and blocker SQL | `src/moodle/local_prequran/sql/verify_phase_6_role_browser_smoke.sql` | Complete |
| Admin smoke package | Diagnostics, grouping/session creation, operations, recording review evidence defined | Phase 6 checklist | Complete |
| Teacher smoke package | Workspace, BBB start, monitor, attendance/notes, completion evidence defined | Phase 6 checklist | Complete |
| Student smoke package | Assigned session, join-window behavior, BBB join, isolation evidence defined | Phase 6 checklist | Complete |
| Parent smoke package | Schedule/summary, private-note protection, approved recording visibility, response/ack evidence defined | Phase 6 checklist | Complete |
| PHP lint | Passed 65 files, failed 0 | `tools/run_moodle_php_lint.ps1`, latest run 2026-05-24 10:16 +03:00 | Complete |
| quraantest browser screenshots | `TBD` | Admin/teacher/student/parent screenshots | Pending quraantest |
| quraantest role SQL evidence | `TBD` | `verify_phase_6_role_browser_smoke.sql` output | Pending quraantest |

## Launch Gates

Do not launch until every gate has an owner, evidence, and a pass/fail decision.

| Gate | Owner | Required evidence | Decision |
| --- | --- | --- | --- |
| Final production checks | Technical lead | SQL results, PHP lint results, browser smoke screenshots | Pending |
| Release archive | Technical lead | Archive zip, manifest, excluded-data checklist | Pending |
| Production deployment | Moodle admin | Backup confirmation, upgrade confirmation, diagnostics screenshot | Pending |
| Pilot live class | Operations lead | Teacher/student/parent workflow screenshots, audit rows | Pending |
| Privacy and child safety | Privacy lead | Consent, recording visibility, access-control confirmation | Pending |
| Rollback readiness | Technical lead | Rollback owner, backup location, restore steps | Pending |

## Gate 1: Final Production Checks

Run these checks on the production Moodle database after plugin files are deployed and Moodle upgrade has completed.

0. Review the remaining production-live requirements:
   `docs/bbb-production-live-remaining-requirements.md`

   Then follow the implementation plan:
   `docs/bbb-production-gap-implementation-plan.md`

1. Run the Group 12 consistency audit:
   `src/moodle/local_prequran/sql/verify_group_12_consistency_audit.sql`

2. Run the Group 13 release archive audit:
   `src/moodle/local_prequran/sql/verify_group_13_release_archive.sql`

3. Run the launch readiness audit:
   `src/moodle/local_prequran/sql/verify_launch_execution_readiness.sql`

4. Run PHP lint locally before upload:
   `tools/run_moodle_php_lint.ps1`

5. Browser smoke test these roles:
   - Admin: diagnostics, live sessions, grouping, teacher directory, recordings admin, command center.
   - Teacher: teacher workspace, start class, lesson monitor, attendance and notes.
   - Student: live sessions list, join window behavior, BBB join.
   - Parent: live sessions, parent summaries, parent trust dashboard, follow-up response.

## Gate 2: Release Archive

Build the archive from the workspace:

```powershell
tools/build_bbb_live_release_archive.ps1
```

The archive must include:

- `code/local_prequran`
- `code/local_hubredirect`
- BBB live-session documentation
- SQL verification scripts
- Verification evidence placeholders or completed evidence
- Approval templates
- Known-issues template

The archive must not include:

- BBB shared secret or provider credentials
- `config.php`
- raw recordings
- database dumps
- private teacher notes
- child-sensitive exports
- session join links or session tokens
- browser cookies or screenshots exposing private data

## Gate 3: Production Deployment

1. Put site into maintenance mode if required.
2. Back up the production database.
3. Back up existing plugin folders:
   - `local/prequran`
   - `local/hubredirect`
4. Upload the release plugin folders.
5. Visit `/admin/index.php` and complete Moodle upgrade.
6. Purge Moodle caches.
7. Confirm PreQuran BBB settings are present and do not expose the shared secret.
8. Open `/local/hubredirect/live_diagnostics.php` and confirm all checks pass.

## Gate 4: Pilot Live Operational Checks

Create a controlled pilot with one teacher, one student, and one parent.

1. Create or select a matching pool.
2. Create or select a class group.
3. Confirm teacher availability.
4. Create a test live session.
5. Start BBB as teacher.
6. Join BBB as student within the join window.
7. Save attendance and teacher notes.
8. Publish parent-safe summary only.
9. Confirm parent can view the summary and cannot view private teacher notes.
10. Pull BBB recording metadata.
11. Review and publish recording only after admin approval.
12. Confirm reminders and follow-ups create audit rows.

## Gate 5: Final Sign-Off

Record sign-off before broad launch.

| Area | Sign-off owner | Date | Status | Notes |
| --- | --- | --- | --- | --- |
| Admin operations |  |  | Pending |  |
| Technical deployment |  |  | Pending |  |
| Privacy and child safety |  |  | Pending |  |
| Teacher readiness |  |  | Pending |  |
| Parent support readiness |  |  | Pending |  |
| Rollback owner confirmed |  |  | Pending |  |

## Rollback Plan

Rollback owner: `TBD`

1. Put Moodle into maintenance mode.
2. Restore previous `local/prequran` and `local/hubredirect` plugin folders.
3. Restore database backup if upgrade/database changes must be reversed.
4. Purge caches.
5. Confirm `/admin/index.php` has no pending upgrade.
6. Confirm normal student lessons still work.
7. Document incident and decision.

## Known Issues Template

| Issue | Severity | Owner | Workaround | Launch decision |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |
