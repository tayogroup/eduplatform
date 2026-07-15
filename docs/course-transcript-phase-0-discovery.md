# Course Transcript Phase 0 Discovery

Purpose: complete Phase 0 of `docs/course-transcript-implementation-plan.md` by defining transcript data sources, field mapping, status mapping, permission rules, warning catalog, and risk register before any transcript resolver or UI is built.

Status: Phase 0 documentation complete. The companion read-only SQL helper is `src/moodle/local_prequran/sql/verify_course_transcript_phase0.sql`.

## Current Source Inventory

Transcript data should be resolved from these existing sources first.

| Source | Current use | Transcript relevance | Readiness |
|---|---|---|---|
| `local_prequran_course_offering` | Workspace course seat/offering record | Course identity, workspace, consumer, Moodle course link, dates, syllabus, capacity, visibility, status | Ready |
| `local_prequran_course_enrol_req` | Student course request and approval lifecycle | Student course line, request/approval/sync/drop dates, enrollment status, requester/admin notes | Ready |
| `local_prequran_course_audit` | Course offering/request audit events | Resolver diagnostics, official issue audit context, later stale-transcript checks | Ready for course events; transcript-specific events need later schema |
| Moodle `course` | Moodle course record | Moodle fullname, shortname, idnumber, visibility, start/end dates, course context | Ready |
| Moodle `enrol` and `user_enrolments` | Moodle enrollment proof | Confirms active Moodle access after local approval | Ready |
| Moodle gradebook tables | Grade items and final grades | Official grade/outcome source when a workspace enables grade display | Needs Phase 3 policy before official use |
| Moodle course completion tables | Course completion evidence | Completion source when enabled in Moodle course settings | Needs course-by-course configuration check |
| `local_prequran_lessonprog` | Managed lesson/unit progress | Local completion percent, status, start/completion/activity timestamps | Ready as local progress evidence |
| `local_prequran_stepprog` | Managed lesson step progress | Step-level completion evidence, useful for internal transcript diagnostics | Ready as internal evidence, not official PDF detail |
| `local_prequran_quiz_attempt` | Quiz attempt summary | Quiz score/percent and completion status for local activities | Ready as internal evidence; official display needs policy |
| `local_prequran_quiz_pass` | Quiz pass summary | Pass-by-pass percent, duration, completion time | Ready as internal evidence; official display needs policy |
| `local_prequran_quiz_question` | Question-level quiz detail | Diagnostics only | Not official-transcript-safe |
| `local_prequran_live_session` | Live class schedule/session | Attendance period, teacher, session status, course/unit hints | Ready if workspace-linked |
| `local_prequran_live_attendance` | Live class attendance | Attendance status, join/leave times, technical issue flags | Ready for attendance summary |
| `local_prequran_live_note` | Teacher review, homework, parent/private notes | Parent-visible summaries and homework status may feed placement/internal transcript | Private notes must be excluded from official exports |
| `local_prequran_live_recording` | Live class recording metadata | Not transcript line data | Exclude from official transcript |
| `local_prequran_workspace` | Workspace/institution boundary | Transcript issuer/workspace header and scoping | Ready |
| `local_prequran_workspace_member` | Workspace role membership | Student/parent/teacher/admin transcript access | Ready |
| `local_prequran_teacher_student` | Teacher-student assignment | Teacher transcript access for assigned students | Ready |
| `local_prequran_comm_consent` | Guardian/student relationship | Parent access to child transcript | Ready where table exists |
| `local_prequran_live_consent` | Guardian/student relationship for live class consent | Parent access fallback used by existing course helper | Ready where table exists |
| `local_prequran_consumer` | Consumer/brand registry | Transcript brand, support contact, sender metadata, default dashboard/public routes | Ready |
| `local_prequran_consumer_domain` | Domain mapping | Official verification URL/domain continuity | Ready, but custom domain verification must be respected |

## Transcript Field Mapping

| Transcript field | Primary source | Fallback | Missing-data label/warning |
|---|---|---|---|
| Consumer/issuer name | `local_prequran_consumer.name` from active context or workspace consumer | `EduPlatform` fallback context | `consumer_context_missing` if no trusted consumer can be resolved |
| Workspace/program name | `local_prequran_workspace.name` | Course offering workspace ID label | `workspace_missing` |
| Support/registrar email | `local_prequran_consumer.supportemail` or `emailreplyto` | Site support config if later added | `support_contact_missing` |
| Student full name | Moodle `user.firstname`, `user.lastname` | `local_prequran_student_profile.student_display_name` when joined later | `student_identity_incomplete` |
| Student account number | Moodle `user.idnumber`; existing helper expects 5-digit account number | Moodle user ID for internal views only | `student_account_no_missing` |
| Student date of birth | `local_prequran_student_profile.date_of_birth` | None | Show only if policy enables and viewer is authorized |
| Course title | `local_prequran_course_offering.title` | Moodle `course.fullname` | `course_title_missing` |
| Course code/key | `local_prequran_course_offering.course_key` | Moodle `course.shortname` or `course.idnumber` | `course_code_missing` |
| Moodle course ID | `local_prequran_course_offering.moodlecourseid` | Moodle enrollment course ID found by reconciliation | `moodle_course_missing` |
| Course dates | `local_prequran_course_offering.startdate`, `enddate` | Moodle `course.startdate`, `enddate` | `course_dates_missing` |
| Enrollment request date | `local_prequran_course_enrol_req.timecreated` | None | Blank for Moodle-only warning rows |
| Approval date | `local_prequran_course_enrol_req.approvedat` | None | `approval_date_missing` for approved/enrolled statuses |
| Moodle enrollment date | `local_prequran_course_enrol_req.moodleenrolledat` plus active `user_enrolments` proof | `user_enrolments.timestart` when available | `moodle_enrollment_missing` |
| Drop/withdraw date | `local_prequran_course_enrol_req.droppedat` | Audit event time if later needed | `drop_date_missing` for dropped records |
| Enrollment status | `local_prequran_course_enrol_req.status` plus Moodle enrollment proof | Moodle-only status generated by resolver | See status mapping |
| Completion status | Moodle course completion, local `lessonprog.overall_status`, policy | `Not recorded` | `completion_not_recorded` |
| Completion percent | `local_prequran_lessonprog.completion_percent` | Derived from steps completed/total | Internal/unofficial only by default |
| Final grade | Moodle gradebook final grade | Quiz percent/local result only if policy allows | `grade_not_recorded` |
| Pass/fail outcome | Transcript policy over Moodle grade/completion/teacher outcome | Complete/incomplete | `grade_policy_missing` |
| Attendance summary | `local_prequran_live_attendance.attendance_status` joined through session/student/workspace/date/course hints | None | `attendance_not_recorded` |
| Teacher of record | `local_prequran_teacher_student.teacherid` or `local_prequran_live_session.teacherid` | Empty | `teacher_not_recorded` |
| Parent-visible teacher comment | `local_prequran_live_note.parent_summary` only when `visible_to_parent = 1` and policy allows | None | Exclude by default |
| Private teacher/admin notes | `local_prequran_live_note.private_note`, enrol request `admin_notes` | None | Internal only; never official by default |
| Official document ID | Future `local_prequran_transcript_doc.documentid` | None | Phase 5 |
| Verification URL | Future transcript doc + `pqh_consumer_url`/domain context | None | Phase 8 |

## Status Mapping

Current local statuses should map to transcript-normalized statuses as follows.

| Current source status/evidence | Normalized transcript status | Default visibility | Notes |
|---|---|---|---|
| `course_enrol_req.status = pending` | `requested` | Unofficial/internal | Shows a request exists but is not approved. |
| `course_enrol_req.status = approved` and `moodleenrolledat = 0` | `approved_pending_sync` | Unofficial/internal | Warning condition; official issue should block or require admin finalization. |
| `course_enrol_req.status = approved` and active Moodle enrollment exists but `moodleenrolledat = 0` | `enrolled` with warning | Unofficial/internal; official only after sync repair | Data mismatch should be repaired. |
| `course_enrol_req.status = enrolled` and active Moodle enrollment exists | `enrolled` | Unofficial/official candidate | Completion/grade policy can later upgrade to completed/passed/not passed. |
| `course_enrol_req.status = enrolled` and local/Moodle activity started | `in_progress` | Unofficial/internal | Resolver can infer from lesson progress, attendance, or grade activity. |
| Moodle/local completion met; no pass/fail policy | `completed` | Unofficial/official candidate | Official use requires Phase 3 policy. |
| Completion met and pass threshold met | `passed` | Official candidate | Requires policy and stable grade/completion source. |
| Completion met and pass threshold not met | `not_passed` | Official candidate | Requires policy. |
| `course_enrol_req.status = drop_requested` | `withdrawn` or `drop_requested` internal | Internal/unofficial | Official label depends on Phase 3 drop policy. |
| `course_enrol_req.status = dropped` | `dropped` or `withdrawn` | Official candidate depending policy | Use `droppedat` as date. |
| `course_enrol_req.status = cancelled` | `cancelled` | Internal/unofficial by default | Not official by default. |
| `course_enrol_req.status = rejected` | `rejected` | Internal only by default | Not official by default. |
| Active Moodle enrollment with no local request/offering | `moodle_only_enrollment` warning | Internal/unofficial | Should not become official course line until reconciled. |
| Local offering linked to hidden/deleted Moodle course | Existing mapped status plus warning | Internal/unofficial | Official issue should block until repaired. |
| Future transfer workflow | `transferred` | Official candidate | No current source status; later correction/override workflow may create it. |

## Permission Matrix

Current helpers to reuse:

- `pqh_user_workspace_role($userid, $workspaceid)`
- `pqh_user_can_manage_workspace($userid, $workspaceid)`
- `pqh_user_can_teach_in_workspace($userid, $workspaceid)`
- `pqh_current_workspace_id($userid, $requestedid)`
- `pqco_workspace_students_for_user($workspaceid, $userid)`
- `pqh_requested_consumer_context()`
- `pqh_consumer_context_by_workspace($workspaceid)`

| Viewer | Allowed transcript access | Current basis | Phase 0 decision |
|---|---|---|---|
| Student | Own unofficial transcript in active workspace | Workspace role `student`; Moodle user ID equals transcript student ID | Allow own only. |
| Parent | Linked child unofficial transcript | `pqco_workspace_students_for_user()` uses `local_prequran_comm_consent` and `local_prequran_live_consent` plus active student workspace membership | Allow linked children only. |
| Teacher | Assigned workspace student transcript | `pqh_user_can_teach_in_workspace()` plus `local_prequran_teacher_student` should be checked for student-specific access | Require student assignment for non-admin teachers. |
| Assistant teacher | Assigned workspace student transcript | Same as teacher | Require student assignment. |
| Workspace owner/admin | All workspace student transcripts | `pqh_user_can_manage_workspace()` | Allow preview, later issue/revoke only after Phase 5+. |
| Consumer admin | Workspaces under assigned consumer | Consumer admin distinction is planned but not fully formalized in current helpers | Treat as future role; do not rely on it in Phase 1. |
| Platform admin / school principal | All active workspaces | `pqh_can_manage_academy_operations()` returns platform-level workspace role | Allow support access with clear consumer/workspace labels. |
| SQA tester | No transcript access by default | `pqh_can_view_sqa_dashboard()` exists but not transcript-specific | Exclude unless a test-only route explicitly masks data. |
| Anonymous verifier | Minimal official document verification only | Future verification token | Phase 8 only; never show full transcript. |

## Warning Catalog

Warnings should be structured objects in Phase 1: `code`, `severity`, `studentid`, optional `offeringid`, optional `moodlecourseid`, `message`, and `recommended_action`.

| Code | Severity | Trigger | Recommended action |
|---|---|---|---|
| `consumer_context_missing` | blocker | No trusted consumer/domain/workspace context | Resolve consumer/domain mapping before transcript use. |
| `workspace_missing` | blocker | Course/request/student is not tied to a workspace | Repair workspace membership or source row. |
| `student_not_workspace_member` | blocker | Student has course request but no active student workspace membership | Add/repair workspace membership. |
| `student_account_no_missing` | warning | Student `idnumber` does not contain expected account number | Repair account number before official issue if policy requires it. |
| `course_offering_missing` | blocker | Enrollment request points to missing offering | Repair or archive request. |
| `moodle_course_missing` | blocker | Offering has no valid `moodlecourseid` | Link/create Moodle course. |
| `moodle_course_hidden` | warning | Linked Moodle course is hidden | Confirm whether hidden courses can appear on official transcripts. |
| `approved_pending_moodle_sync` | blocker for official issue | Request approved but `moodleenrolledat = 0` and active Moodle enrollment not found | Retry Moodle sync or manually repair enrollment. |
| `moodle_enrolled_timestamp_missing` | warning | Active Moodle enrollment exists but local `moodleenrolledat = 0` | Backfill local sync timestamp after confirmation. |
| `moodle_only_enrollment` | blocker | Active Moodle enrollment exists with no local course request/offering | Create/reconcile offering/request or exclude intentionally. |
| `duplicate_moodle_course_offering` | warning | Multiple active offerings in one workspace link to the same Moodle course/course key unexpectedly | Confirm sections vs duplicate setup. |
| `grade_policy_missing` | blocker for official issue | Workspace has no transcript policy for grade/completion display | Configure Phase 3 policy before official issue. |
| `grade_not_recorded` | warning | No Moodle gradebook final grade and policy expects grade | Configure gradebook or use non-graded policy. |
| `grade_hidden_or_locked` | warning | Grade exists but gradebook visibility/lock state conflicts with policy | Registrar/admin review. |
| `completion_not_recorded` | warning | No Moodle completion and no local completion evidence | Teacher/admin review. |
| `completion_conflict` | blocker for official issue | Moodle and local completion evidence disagree | Registrar/admin review before issue. |
| `attendance_not_recorded` | warning | Course policy expects attendance but live attendance rows are missing | Teacher/admin attendance review. |
| `private_note_present` | info | Private teacher note exists | Ensure official export excludes it. |
| `parent_visible_note_policy_missing` | warning | Parent-visible note exists but policy does not define official use | Keep out of official PDF until policy allows. |
| `student_multiple_active_workspaces` | warning | Student has active membership in multiple workspaces | Require workspace selector and clear issuer label. |
| `stale_official_transcript` | warning | Future official document exists and source data changed later | Reissue workflow after Phase 7. |

## Risk Register

| Risk | Impact | Likelihood | Mitigation | Owner phase |
|---|---:|---:|---|---|
| Cross-workspace transcript leakage by guessed student/document ID | High | Medium | Central permission helper, negative tests, workspace filter on every query | Phase 1-2 |
| Cross-consumer branding/domain mismatch on EduForTomorrow or institution transcripts | High | Medium | Resolve consumer from workspace/domain; never hard-code quraantest links | Phase 2, 6, 8 |
| Official transcript changes after live data changes | High | Medium | Snapshot official documents and read issued records from snapshot only | Phase 5 |
| Private teacher/admin notes appear on official PDF | High | Medium | Explicit field allow-list for official export; exclude `private_note` and admin-only notes by default | Phase 6 |
| Moodle enrollment and local request state disagree | Medium | High | Warning catalog and readiness report before official issue | Phase 1, 4 |
| Gradebook missing or hidden grades produce misleading transcript | High | Medium | Phase 3 policy, missing-grade labels, block official issue when required data is missing | Phase 3, 5 |
| Course completion not configured in Moodle | Medium | High | Support local completion fallback for unofficial view; require policy for official completion | Phase 1, 3 |
| Duplicate course lines from multiple offerings/Moodle enrollments | Medium | Medium | Deduplicate by workspace/offering/student; warn on Moodle-only and duplicate linked courses | Phase 1 |
| Parent/guardian relationship is inferred from incomplete consent records | High | Medium | Use existing consent joins plus active workspace membership; deny when uncertain | Phase 2 |
| Teacher sees all workspace students instead of assigned students | Medium | Medium | Require `local_prequran_teacher_student` assignment for non-admin teacher transcript access | Phase 2 |
| Official verification endpoint exposes too much PII | High | Medium | Minimal verification payload only; generic not-found response; rate limiting where possible | Phase 8 |
| Old official documents need revocation/reissue after correction | High | Medium | Never edit snapshots; add revoke/reissue status and replacement link | Phase 7 |
| Readiness report exports sensitive notes | Medium | Medium | Export stable IDs and warning codes, not private notes | Phase 4 |
| Feature rollout destabilizes existing course enrollment | Medium | Low | Add transcript pages behind feature flags; do not alter enrollment lifecycle in early phases | All phases |

## Phase 0 Verification Checks

Use `src/moodle/local_prequran/sql/verify_course_transcript_phase0.sql` on a database copy or test environment. The checks are read-only and focus on:

- Required table availability.
- Duplicate local request rows.
- Approved local requests without Moodle sync.
- Active Moodle enrollments without matching local enrolled request.
- Course offerings linked to missing Moodle courses.
- Student course requests without active workspace student membership.
- Parent consent rows where the child is not an active workspace student.
- Teacher-student assignments where either side is not an active workspace member.

## Phase 1 Hand-Off

The transcript resolver should start with these explicit assumptions:

1. The first transcript payload is unofficial only.
2. Workspace ID is required.
3. Student ID is required and must be checked against viewer permissions.
4. Consumer context is derived from workspace/domain and must be carried into all links.
5. Course offering/request rows are the primary source for transcript course lines.
6. Moodle enrollments without a local offering are warnings, not official transcript lines.
7. Grades and completion are displayed as "Not recorded" until policy makes them meaningful.
8. Official issuing, PDF export, verification, holds, corrections, and reissue are out of Phase 1.
