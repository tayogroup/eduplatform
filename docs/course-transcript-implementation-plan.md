# Course Transcript Implementation Plan

Purpose: implement the course transcript requirements in controlled phases after the course enrollment and EduForTomorrow/institution routing foundations are stable.

Primary requirements: `docs/course-transcript-requirements.md`.

## Guiding Principles

- Build read-only transcript resolution before adding official documents.
- Reuse existing course offering, Moodle enrollment, gradebook, lesson progress, live-session, and workspace permission data before adding new schema.
- Treat official transcripts as immutable snapshots, not live reports.
- Keep consumer/workspace boundaries enforced in helpers, pages, exports, APIs, and verification routes.
- Prefer warnings over silent guesses when enrollment, completion, or grade data is incomplete.
- Ship each phase behind a narrow admin-visible surface until negative tests pass.

## Phase 0: Discovery, Data Mapping, And Risk Register

Goal: define exactly which current records become transcript inputs and where data is missing.

Status: complete. See `docs/course-transcript-phase-0-discovery.md` and the read-only SQL helper `src/moodle/local_prequran/sql/verify_course_transcript_phase0.sql`.

Tasks:

- Inventory existing course-related tables and fields:
  - `local_prequran_course_offering`
  - `local_prequran_course_enrol_req`
  - `local_prequran_course_audit`
  - Moodle `course`
  - Moodle `enrol`
  - Moodle `user_enrolments`
  - Moodle gradebook tables
  - Moodle course completion tables
  - local lesson progress tables
  - live-session attendance/review tables
- Map each transcript field to a source, fallback, and missing-data label.
- Define initial normalized transcript statuses and map current enrollment statuses to them.
- Identify which notes are public, parent-visible, internal-only, and official-transcript-safe.
- Confirm current permission helpers for student, parent, teacher, workspace admin, consumer admin, and platform admin transcript access.
- Create a transcript risk register for data leakage, wrong domain links, missing grades, duplicate course lines, stale official documents, and overexposed PII.

Deliverables:

- Data mapping checklist.
- Status mapping checklist.
- Permission matrix.
- Initial transcript warning catalog.

Exit criteria:

- Every required transcript field has a source or documented "not available yet" state.
- No transcript implementation starts with ambiguous permission ownership.
- Existing enrollment and workspace routing gaps are recorded before build work begins.

Verification:

- Manual review of one enrolled student, one approved-pending-sync student, one dropped student, and one student with no course history.
- SQL read-only checks for duplicate enrollment records and Moodle/local course mismatches.

## Phase 1: Transcript Resolver Library

Goal: create a server-side resolver that returns a normalized transcript preview without creating new transcript records.

Status: complete. The read-only resolver is `src/moodle/local_hubredirect/course_transcriptlib.php`; the admin diagnostic route is `src/moodle/local_hubredirect/course_transcript_debug.php`.

Tasks:

- Add a transcript library under `local_hubredirect` or shared local plugin code.
- Implement `resolve_student_transcript(studentid, workspaceid, consumercontext, options)` style behavior.
- Gather course offering and enrollment request records.
- Join or lookup Moodle course, manual enrollment, grade, completion, and relevant local progress evidence.
- Normalize line statuses:
  - requested
  - approved pending sync
  - enrolled
  - in progress
  - completed
  - passed
  - not passed
  - withdrawn
  - dropped
  - cancelled
  - rejected
  - transferred
- Produce warning objects for:
  - approved locally but Moodle enrollment missing
  - Moodle enrollment exists without local offering
  - no grade policy
  - hidden or unavailable grade
  - completion conflict
  - student in multiple workspaces
  - stale issued transcript exists after later course change
- Return structured header, line, summary, warning, and permission metadata.

Deliverables:

- Transcript resolver helper.
- Unit-style PHP smoke script or admin-only diagnostic route for resolver output.
- Warning catalog in code comments or docs.

Exit criteria:

- Resolver can produce an unofficial transcript payload for real workspace students.
- Resolver never returns data outside the requested consumer/workspace.
- Resolver shows missing data as warnings or "Not recorded", not invented values.

Verification:

- Test students covering active, pending sync, dropped, cancelled, and no-history cases.
- Negative permission checks using guessed student IDs from another workspace.

## Phase 2: Unofficial Transcript UI

Goal: expose the resolver in a safe, read-only UI for admins first, then students and parents.

Status: complete. The read-only UI is `src/moodle/local_hubredirect/course_transcript.php`, with links from student course history, workspace dashboard, and role dashboards.

Tasks:

- Add workspace admin transcript page linked from Student Course History and student profile.
- Show transcript header, course lines, warnings, and summary.
- Add filters for status, academic period/date range, and course.
- Add an internal/debug panel only for workspace admins.
- Add student dashboard link to unofficial transcript.
- Add parent dashboard link for linked children.
- Add teacher read-only access only for assigned students after permission checks are proven.
- Add user-facing copy that clearly says "Unofficial Transcript".

Deliverables:

- Admin transcript preview page.
- Student transcript page.
- Parent child transcript page.
- Navigation links from existing course/student flows.

Exit criteria:

- Students see only their own unofficial transcript.
- Parents see only linked children.
- Admins can preview a transcript from course history without issuing anything.
- All visible branding and support links match the active consumer/domain/workspace.

Verification:

- Browser smoke tests across Quran Academy, EduForTomorrow, and one institution workspace.
- Negative direct URL tests for student and parent access.

## Phase 3: Transcript Policy Settings

Goal: let each workspace define how completion, grades, attendance, and official display should behave.

Status: complete. Policy schema is created by `local_prequran` install/upgrade, settings live at `src/moodle/local_hubredirect/transcript_policy.php`, and resolver payloads include policy metadata plus policy-aware display values.

Tasks:

- Add `local_prequran_transcript_policy` through Moodle install/upgrade lifecycle.
- Store policy as guarded JSON initially:
  - completion source
  - passing rule
  - grade display mode
  - grade rounding
  - in-progress grade visibility
  - attendance display
  - drop/withdrawal display policy
  - teacher-note official display policy
  - unofficial PDF permission
  - official issue permission
- Add workspace admin policy page with conservative defaults.
- Make resolver consume policy and include policy version/hash in payload.
- Add warnings when a workspace has no explicit policy and defaults are being used.

Deliverables:

- Policy table.
- Policy settings page.
- Resolver policy integration.
- Default policy for existing workspaces.

Exit criteria:

- Transcript grade/completion display is no longer hard-coded.
- Missing gradebook data follows policy instead of appearing as a system error.
- Official transcript issue remains disabled until policy is valid.

Verification:

- Change policy and confirm unofficial preview changes expected display fields.
- Confirm policy cannot be edited by non-admins or unrelated workspace admins.

## Phase 4: Data-Quality Dashboard And Admin Readiness

Goal: give admins a way to fix transcript blockers before official issuing exists.

Status: complete. Workspace admins can use `src/moodle/local_hubredirect/transcript_readiness.php` to scan students, filter transcript warnings, follow repair links, and export filtered warning rows to CSV.

Tasks:

- Add transcript readiness report for a workspace.
- List students with transcript warnings and blocking issues.
- Add filters by warning type, course, status, teacher, and student.
- Add links to relevant repair pages:
  - course offerings
  - Moodle enrollment sync retry
  - student course history
  - gradebook
  - workspace people
- Add CSV export for warnings.
- Add audit logging for transcript preview views and readiness report exports if audit table exists.

Deliverables:

- Workspace transcript readiness report.
- Warning CSV export.
- Admin remediation links.

Exit criteria:

- Admins can identify transcript blockers without opening each student one by one.
- Pending Moodle enrollment sync issues are visible before official transcript launch.

Verification:

- Seed or identify students with each warning category.
- Confirm CSV includes stable IDs for admin reconciliation but no unnecessary private notes.

## Phase 5: Official Snapshot Schema And Draft Workflow

Goal: add immutable transcript document records and an admin draft/issue workflow.

Status: complete. Official transcript documents are stored in `local_prequran_transcript_doc`, with draft/issue and snapshot-view workflow in `src/moodle/local_hubredirect/course_transcript_official.php`.

Tasks:

- Add transcript document table through Moodle install/upgrade lifecycle:
  - `local_prequran_transcript_doc`
- Generate document IDs with consumer/workspace-safe prefixes.
- Generate verification token hash, not plaintext storage.
- Store official snapshot JSON containing header, course lines, summary, policy, issue metadata, and branding references.
- Add official draft preview from current resolver payload.
- Add "Issue official transcript" action with confirmation and required reason.
- Block issue when required policy, identity, grade, enrollment, or hold checks fail.
- Record audit events for draft preview and issue.

Deliverables:

- Transcript document schema.
- Official draft preview.
- Issue action.
- Snapshot storage.

Exit criteria:

- Issued official transcript snapshot does not change after live data changes.
- Reopening an issued transcript reads from snapshot, not live resolver data.
- Issue action is restricted to authorized workspace/consumer/platform admins.

Verification:

- Issue a transcript, then change course title or grade, and confirm issued snapshot remains unchanged.
- Confirm direct document ID guessing fails outside permitted scope.

## Phase 6: PDF And CSV Exports

Goal: produce official and unofficial exports without exposing private data.

Status: complete. Protected exports are served by `src/moodle/local_hubredirect/course_transcript_export.php`, including official snapshot PDFs, unofficial policy-gated PDFs, transcript line CSVs, issued document CSVs, and official PDF hash tracking.

Tasks:

- Add PDF generator for official transcript snapshots.
- Add PDF generator for unofficial live preview if workspace policy allows it.
- Add admin CSV export for transcript lines.
- Add admin CSV export for issued transcript documents.
- Store official PDF hash and optional protected file reference.
- Serve downloads through permission-checked route.
- Include document ID, issue date, verification URL, issuer, support contact, page number, and confidentiality note.
- Ensure EduForTomorrow and institution exports use the correct branding and domain-aware verification URL.

Deliverables:

- Official PDF export.
- Unofficial PDF export.
- Admin transcript CSV exports.
- Protected download route.

Exit criteria:

- Official PDFs can be regenerated or served consistently from snapshot data.
- PDFs do not include private notes, raw quiz attempts, hidden grade data, internal IDs, or unrelated parent details.
- Generated links do not use hard-coded quraantest URLs for EduForTomorrow/institution transcripts.

Verification:

- Visual PDF review for short, long, and multi-page transcripts.
- Permission checks on download route.
- Domain smoke tests for verification URL generation.

## Phase 7: Holds, Corrections, Reissue, And Revocation

Goal: support real registrar operations after transcripts become official records.

Status: complete. Transcript lifecycle controls include holds, correction records, revoke/reissue actions, and document status transitions without editing issued snapshots in place.

Tasks:

- Add transcript hold table:
  - `local_prequran_transcript_hold`
- Add hold management UI for workspace admins.
- Add transcript override/correction table:
  - `local_prequran_transcript_override`
- Add correction workflow with before/after values and reason.
- Add optional approval step for workspaces that require dual control.
- Add revoke action with required reason.
- Add reissue action that links the new document to the replaced document.
- Make public/internal document status show issued, revoked, reissued, or expired.

Deliverables:

- Hold schema and UI.
- Correction schema and workflow.
- Revoke and reissue actions.
- Audit events for every state change.

Exit criteria:

- Official snapshots are never edited in place.
- Holds block official issue when configured.
- Revoked documents remain auditable and no longer verify as valid.

Verification:

- Add hold, attempt issue, resolve hold, issue transcript.
- Revoke issued transcript and confirm download/verification behavior.
- Reissue after correction and confirm old/new relationship.

## Phase 8: Public Verification

Status: complete. Public verification now uses domain-aware signed-code URLs, validates official transcript document IDs without exposing full records, shows valid/revoked/reissued/non-valid statuses, and logs safe verification audit events.

Goal: let recipients verify official transcript authenticity without exposing the full transcript publicly.

Tasks:

- Add domain-aware verification route.
- Accept document ID and verification token or signed code.
- Show minimal verification result:
  - valid/revoked/reissued/expired/not found
  - issuer
  - issue date
  - student name or masked identifier according to policy
  - document type
- Add rate limiting or basic abuse controls where available.
- Log verification checks with safe metadata.
- Add QR code or verification URL to official PDF.

Deliverables:

- Public verification route.
- Verification status page.
- PDF verification block.

Exit criteria:

- Valid documents verify correctly.
- Revoked/reissued documents show a non-valid status.
- Verification does not expose full transcript course lines or private data.
- Unknown tokens produce a generic not-found response.

Verification:

- Verify issued, revoked, reissued, expired, and fake document tokens.
- Confirm EduForTomorrow and institution verification domains resolve correctly.

## Phase 9: APIs, Scheduled Maintenance, And Notifications

Status: complete. Transcript service methods are registered, scheduled maintenance flags issued documents as stale after transcript-affecting changes, and transcript lifecycle notifications now route through a dedicated transcript message provider.

Goal: harden transcript operations for long-term use.

Tasks:

- Add external/internal service methods only after page workflows are stable:
  - resolve transcript preview
  - list warnings
  - issue official transcript
  - download transcript
  - verify transcript
  - manage holds
  - revoke/reissue transcript
- Add scheduled task to flag stale official transcripts after transcript-affecting changes.
- Add optional admin digest for transcript blockers and newly stale issued documents.
- Add notification templates for official transcript issued, blocked, revoked, and reissued.
- Ensure notifications use consumer sender, support address, and domain-aware links.

Deliverables:

- Service methods with server-side permission checks.
- Stale transcript detector.
- Optional transcript admin digest.
- Notification templates.

Exit criteria:

- Services cannot read/write cross-consumer or cross-workspace transcript data.
- Admins are alerted when official transcripts may need reissue after relevant data changes.

Verification:

- Direct REST negative tests with guessed IDs.
- Scheduled task dry run in a test environment.

## Phase 10: Pilot, Rollout, And Operational Handoff

Goal: launch transcripts gradually without destabilizing enrollment or routing flows.

Tasks:

- Pilot with one internal Quran Academy workspace.
- Pilot with EduForTomorrow test workspace.
- Pilot with one institution workspace under platform fallback domain.
- Pilot with one verified institution custom domain after domain routing is stable.
- Review PDF wording, branding, privacy, and verification behavior with admin stakeholders.
- Write admin runbook:
  - configure policy
  - review readiness warnings
  - issue official transcript
  - handle holds
  - correct/reissue/revoke
  - verify a transcript
- Add support troubleshooting guide for common mismatches.

Deliverables:

- Pilot sign-off checklist.
- Admin runbook.
- Troubleshooting guide.
- Final launch checklist.

Exit criteria:

- All negative tests pass across Quran Academy, EduForTomorrow, and institution workspace contexts.
- Admins can operate the transcript lifecycle without developer intervention.
- Rollback switches or disablement steps are documented.

Verification:

- End-to-end transcript issue, download, verification, revoke, and reissue in each pilot context.
- Regression check that course enrollment, catalog, and dashboard access still work.

## Rollback And Feature Flags

Recommended flags:

- `transcript_preview_enabled`
- `transcript_student_parent_enabled`
- `transcript_policy_enabled`
- `transcript_official_issue_enabled`
- `transcript_public_verification_enabled`
- `transcript_notifications_enabled`

Rollback approach:

- Disable official issue first if data quality or export problems appear.
- Keep unofficial previews available only for admins during remediation.
- Revoke or reissue incorrect official documents rather than deleting rows.
- Disable public verification route only if token abuse or privacy issues appear, while retaining internal document audit records.
- Do not remove transcript schema in rollback; mark features disabled and preserve issued-document audit trail.

## Cross-Phase Test Requirements

Every phase should include these checks when relevant:

- Student cannot view another student's transcript.
- Parent cannot view an unlinked child.
- Teacher cannot view a student outside assignment/workspace.
- Workspace admin cannot view another workspace's transcript.
- EduForTomorrow user cannot view Quran Academy transcript data.
- Institution user cannot view another institution's transcript data.
- Official export never includes private teacher/admin notes by default.
- Domain-aware links do not fall back to quraantest except for Quran Academy contexts where it is configured.
- Snapshot data remains stable after live data changes.
- Audit records exist for transcript views, exports, issue, revoke, reissue, holds, corrections, and verification checks.
