# Moodle Plugin Triage — local_hubredirect & local_prequran

## local_hubredirect — File Triage (244 PHP files)

**Draft 2026-07-21 · heuristic first pass, borderline cases flagged for review.**

Moodle remains the multi-consumer backend (independent teachers, marketplaces, finance, live tutoring, intake — all consumers, not just Ehel Academy). This triage is about **where each file's responsibility should live**, not about removing platform features. Classification is by static scan (HTML-render markers, DB writes, JSON endpoints, function density, data-row ratio) and needs human confirmation on borderline files.

| Disposition | Files | Meaning |
|---|---|---|
| **Move to Bunny — UI → SPA** | 118 | Server-renders HTML today; becomes part of the one data-driven app. Any DB writes it performs split off into thin Moodle web services. |
| **Move to Bunny — static data** | 4 | A dataset shipped as PHP; publish as static JSON loaded by the app. |
| **Stay in Moodle — web-service / mutation endpoint** | 74 | Writes or serves authoritative data; keep as a thin JSON endpoint (no HTML). |
| **Stay in Moodle — backend library** | 33 | Server-side logic / data access / auth; no user-facing page. |
| **Remove from the plugin — cruft** | 15 | Test fixtures, mock-data generators, probes. Not platform features. |

**Net:** ~122 of 244 move off Moodle (UI + data), ~107 stay as backend, 15 are cruft. The moved files are the bulk of the *size*; the stayers are the smaller authoritative core.

> Mixed pages (render **and** write) are tagged by their dominant job (usually UI→SPA); their writes become web-service endpoints — noted inline.

## Move to Bunny — UI → SPA (118)

| File | KB | Signal |
|---|--:|---|
| `dashboard.php` | 290 | 253 render markers → SPA (+2 writes → WS) |
| `student_intake.php` | 175 | 199 render markers → SPA (+16 writes → WS) |
| `teacher_intake.php` | 165 | 191 render markers → SPA (+9 writes → WS) |
| `public_intake.php` | 128 | 176 render markers → SPA (+2 writes → WS) |
| `live_sessions.php` | 110 | 85 render markers → SPA (+13 writes → WS) |
| `public_teacher_intake.php` | 86 | 146 render markers → SPA (+1 writes → WS) |
| `workspaces.php` | 82 | 128 render markers → SPA (+12 writes → WS) |
| `workspace_reports.php` | 76 | 80 render markers → SPA |
| `course_offerings.php` | 75 | 86 render markers → SPA (+8 writes → WS) |
| `workspace_dashboard.php` | 70 | 48 render markers → SPA |
| `live_create_wizard.php` | 69 | 73 render markers → SPA |
| `live_grouping.php` | 64 | 101 render markers → SPA (+7 writes → WS) |
| `live_parent_trust.php` | 61 | 74 render markers → SPA (+3 writes → WS) |
| `workspace_people.php` | 60 | 76 render markers → SPA (+10 writes → WS) |
| `teacher_marketplace_admin.php` | 56 | 42 render markers → SPA (+9 writes → WS) |
| `invoice_detail.php` | 52 | 138 render markers → SPA |
| `live_series.php` | 51 | 39 render markers → SPA (+14 writes → WS) |
| `teacher_workspace.php` | 49 | 35 render markers → SPA (+3 writes → WS) |
| `live_ops.php` | 48 | 40 render markers → SPA |
| `live_review.php` | 45 | 48 render markers → SPA (+8 writes → WS) |
| `live_virtual_tutor.php` | 44 | 26 render markers → SPA (+3 writes → WS) |
| `intake_requests.php` | 41 | 38 render markers → SPA (+3 writes → WS) |
| `live_summaries.php` | 41 | 39 render markers → SPA (+2 writes → WS) |
| `live_teacher_profile.php` | 41 | 48 render markers → SPA |
| `workspace_student.php` | 39 | 42 render markers → SPA (+2 writes → WS) |
| `platform_consumers.php` | 38 | 59 render markers → SPA (+6 writes → WS) |
| `live_leadership.php` | 37 | 58 render markers → SPA (+2 writes → WS) |
| `managed_reports.php` | 37 | 24 render markers → SPA |
| `live_parent_trust_retention.php` | 36 | 48 render markers → SPA (+2 writes → WS) |
| `live_schedule.php` | 34 | 25 render markers → SPA |
| `live_followups.php` | 33 | 37 render markers → SPA (+2 writes → WS) |
| `live_improvement_plans.php` | 33 | 43 render markers → SPA |
| `live_quality.php` | 33 | 47 render markers → SPA (+2 writes → WS) |
| `live_reports.php` | 33 | 40 render markers → SPA |
| `communications.php` | 32 | 29 render markers → SPA (+4 writes → WS) |
| `live_capacity.php` | 32 | 28 render markers → SPA |
| `live_quality_analytics.php` | 32 | 35 render markers → SPA |
| `course_catalog_browse.php` | 31 | 44 render markers → SPA (+4 writes → WS) |
| `live_recordings_admin.php` | 31 | 31 render markers → SPA (+5 writes → WS) |
| `live_trust.php` | 31 | 31 render markers → SPA (+2 writes → WS) |
| `teacher_marketplace_profile.php` | 31 | 26 render markers → SPA (+9 writes → WS) |
| `live_series_wizard.php` | 30 | 54 render markers → SPA |
| `live_session_materials.php` | 30 | 35 render markers → SPA (+1 writes → WS) |
| `live_series_schedule.php` | 29 | 23 render markers → SPA (+3 writes → WS) |
| `live_teacher_directory.php` | 29 | 28 render markers → SPA |
| `platform_user_roster.php` | 29 | 27 render markers → SPA |
| `quiz_report.php` | 29 | 33 render markers → SPA |
| `safenet.php` | 29 | 40 render markers → SPA (+4 writes → WS) |
| `workspace_series.php` | 29 | 36 render markers → SPA (+7 writes → WS) |
| `live_monitor.php` | 28 | 30 render markers → SPA (+1 writes → WS) |
| `teacher_marketing.php` | 28 | 30 render markers → SPA (+3 writes → WS) |
| `live_parent_links.php` | 27 | 30 render markers → SPA (+6 writes → WS) |
| `marketplace_enrollment.php` | 27 | 32 render markers → SPA (+7 writes → WS) |
| `workspace_sessions.php` | 27 | 35 render markers → SPA (+4 writes → WS) |
| `consumer_wizard.php` | 26 | 63 render markers → SPA |
| `live_parent_trust_audit.php` | 26 | 36 render markers → SPA (+1 writes → WS) |
| `referrers.php` | 26 | 44 render markers → SPA (+2 writes → WS) |
| `workspace_materials.php` | 26 | 43 render markers → SPA |
| `communications_center.php` | 24 | 103 render markers → SPA (+7 writes → WS) |
| `institution_onboarding.php` | 24 | 59 render markers → SPA (+1 writes → WS) |
| `institution_reporting_branding.php` | 24 | 22 render markers → SPA (+2 writes → WS) |
| `live_practice_coach.php` | 24 | 29 render markers → SPA |
| `platform_landing.php` | 24 | 53 render markers → SPA |
| `teacher_intake_requests.php` | 24 | 44 render markers → SPA (+2 writes → WS) |
| `at_risk_report.php` | 23 | 21 render markers → SPA (+1 writes → WS) |
| `course_transcript.php` | 23 | 47 render markers → SPA |
| `institution_settings.php` | 23 | 49 render markers → SPA (+1 writes → WS) |
| `live_parent_trust_purge_evidence.php` | 23 | 30 render markers → SPA (+1 writes → WS) |
| `platform_course_roster.php` | 23 | 24 render markers → SPA |
| `recordings.php` | 23 | 25 render markers → SPA |
| `teacher_homework.php` | 23 | 38 render markers → SPA (+4 writes → WS) |
| `transcript_readiness.php` | 23 | 25 render markers → SPA |
| `attendance_operations.php` | 22 | 58 render markers → SPA (+6 writes → WS) |
| `teacher_portal.php` | 22 | 69 render markers → SPA (+8 writes → WS) |
| `student_dashboard.php` | 21 | 33 render markers → SPA |
| `compliance_governance.php` | 20 | 66 render markers → SPA (+8 writes → WS) |
| `document_management.php` | 20 | 62 render markers → SPA (+6 writes → WS) |
| `student_finance.php` | 20 | 64 render markers → SPA |
| `course_transcript_official.php` | 19 | 38 render markers → SPA |
| `gradebook_assessment.php` | 19 | 63 render markers → SPA (+5 writes → WS) |
| `learning_path.php` | 19 | 67 render markers → SPA (+7 writes → WS) |
| `live_parent_trust_review_pack.php` | 19 | 31 render markers → SPA |
| `localization_currency.php` | 19 | 65 render markers → SPA |
| `sql_tools.php` | 19 | 20 render markers → SPA |
| `workspace_parent.php` | 19 | 22 render markers → SPA |
| `classroom_operations.php` | 18 | 54 render markers → SPA (+6 writes → WS) |
| `consumer_landing.php` | 17 | 20 render markers → SPA |
| `platform_settings.php` | 17 | 26 render markers → SPA (+1 writes → WS) |
| `sponsor_donor_portal.php` | 17 | 41 render markers → SPA |
| `teacher_administration.php` | 17 | 60 render markers → SPA (+6 writes → WS) |
| `teacher_marketplace_requests.php` | 17 | 23 render markers → SPA (+1 writes → WS) |
| `admissions.php` | 16 | 48 render markers → SPA |
| `roles_permissions.php` | 16 | 59 render markers → SPA (+5 writes → WS) |
| `seb_exams.php` | 16 | 28 render markers → SPA (+3 writes → WS) |
| `academic_quality_controls.php` | 15 | 23 render markers → SPA |
| `admin_workflow.php` | 15 | 64 render markers → SPA (+4 writes → WS) |
| `certificates_awards.php` | 15 | 49 render markers → SPA (+6 writes → WS) |
| `platform_dashboard.php` | 15 | 25 render markers → SPA |
| `workspace_live_room.php` | 15 | 21 render markers → SPA |
| `academic_calendar.php` | 14 | 45 render markers → SPA (+5 writes → WS) |
| `finance_policy.php` | 14 | 33 render markers → SPA |
| `mobile_api_readiness.php` | 14 | 39 render markers → SPA |
| `student_homework.php` | 14 | 27 render markers → SPA (+3 writes → WS) |
| `support_audit.php` | 14 | 21 render markers → SPA (+1 writes → WS) |
| `teacher_student_connect.php` | 14 | 20 render markers → SPA (+2 writes → WS) |
| `backup_dr_checks.php` | 13 | 32 render markers → SPA |
| `invoice_view.php` | 13 | 29 render markers → SPA |
| `scholarship_portal.php` | 13 | 30 render markers → SPA |
| `transcript_controls.php` | 13 | 26 render markers → SPA |
| `transcript_policy.php` | 13 | 28 render markers → SPA |
| `data_migration_tools.php` | 12 | 33 render markers → SPA |
| `executive_dashboard.php` | 12 | 54 render markers → SPA (+1 writes → WS) |
| `seb_exam.php` | 11 | 23 render markers → SPA |
| `student_parent_portal.php` | 10 | 42 render markers → SPA |
| `bulk_import_export.php` | 9 | 22 render markers → SPA |
| `finance_audit.php` | 9 | 21 render markers → SPA |
| `transcript_verify.php` | 9 | 21 render markers → SPA |
| `payment_gateway_settings.php` | 8 | 23 render markers → SPA |

## Move to Bunny — static data (4)

| File | KB | Signal |
|---|--:|---|
| `country_cities.php` | 84 | 2150 data rows, static |
| `country_timezones.php` | 59 | 913 data rows, static |
| `student_intake_config.php` | 25 | 572 data rows, static |
| `teacher_intake_config.php` | 20 | 456 data rows, static |

## Stay in Moodle — web-service / mutation endpoint (74)

| File | KB | Signal |
|---|--:|---|
| `issue_child.php` | 80 | JSON/AJAX endpoint |
| `institution_operations_isolation.php` | 33 | JSON/AJAX endpoint |
| `data_lifecycle_cleanup.php` | 30 | JSON/AJAX endpoint |
| `cross_role_golden_path.php` | 27 | JSON/AJAX endpoint |
| `institution_mobility_lifecycle.php` | 26 | JSON/AJAX endpoint |
| `live_calendar.php` | 25 | 1 DB writes (mutation endpoint) |
| `failure_workflow_controls.php` | 24 | JSON/AJAX endpoint |
| `live_admin.php` | 24 | thin endpoint / review |
| `live_availability.php` | 22 | 4 DB writes (mutation endpoint) |
| `practice_coach_event.php` | 19 | JSON/AJAX endpoint |
| `institution_security_matrix.php` | 18 | JSON/AJAX endpoint |
| `live_followup_message.php` | 17 | 8 DB writes (mutation endpoint) |
| `consumer_diagnostics.php` | 14 | thin endpoint / review |
| `student_workplace.php` | 14 | thin endpoint / review |
| `support.php` | 14 | JSON/AJAX endpoint |
| `workspace_materials_workflow.php` | 14 | 7 DB writes (mutation endpoint) |
| `enrollment_approval.php` | 13 | 4 DB writes (mutation endpoint) |
| `institution_academic_isolation.php` | 13 | JSON/AJAX endpoint |
| `institution_profile.php` | 13 | thin endpoint / review |
| `support_reports.php` | 13 | 1 DB writes (mutation endpoint) |
| `consumer_login.php` | 12 | thin endpoint / review |
| `institution_communications_isolation.php` | 12 | JSON/AJAX endpoint |
| `invoices.php` | 12 | thin endpoint / review |
| `office_material_callback.php` | 12 | JSON/AJAX endpoint |
| `live_session_agenda_editor.php` | 11 | thin endpoint / review |
| `seb_results.php` | 11 | thin endpoint / review |
| `workspace_materials_files.php` | 11 | 2 DB writes (mutation endpoint) |
| `course_transcript_debug.php` | 10 | thin endpoint / review |
| `institution_readiness_rollup.php` | 10 | JSON/AJAX endpoint |
| `notification_diagnostics.php` | 10 | thin endpoint / review |
| `office_material_editor.php` | 10 | thin endpoint / review |
| `teacher_office.php` | 10 | thin endpoint / review |
| `course_sync_report.php` | 9 | thin endpoint / review |
| `institution_inquiry.php` | 9 | thin endpoint / review |
| `payment_receipt.php` | 9 | thin endpoint / review |
| `course_student_history.php` | 8 | thin endpoint / review |
| `issue.php` | 8 | 1 DB writes (mutation endpoint) |
| `parent_billing.php` | 8 | thin endpoint / review |
| `repair_random_5_digit_idnumbers.php` | 8 | thin endpoint / review |
| `sponsor_billing.php` | 8 | thin endpoint / review |
| `student_billing.php` | 8 | thin endpoint / review |
| `access_denied.php` | 7 | thin endpoint / review |
| `course_seat_report.php` | 7 | thin endpoint / review |
| `live_demo_participants.php` | 7 | thin endpoint / review |
| `quiz_tts.php` | 7 | JSON/AJAX endpoint |
| `teacher_marketplace_request.php` | 7 | thin endpoint / review |
| `live_session_agenda_upload.php` | 6 | 2 DB writes (mutation endpoint) |
| `quiz_stt.php` | 6 | JSON/AJAX endpoint |
| `session_expired.php` | 6 | thin endpoint / review |
| `document_pdf.php` | 5 | 1 DB writes (mutation endpoint) |
| `course_debug.php` | 4 | JSON/AJAX endpoint |
| `live_session_agenda_callback.php` | 4 | JSON/AJAX endpoint |
| `live_session_agenda_file.php` | 4 | thin endpoint / review |
| `live_session_guide.php` | 4 | thin endpoint / review |
| `consumer_map_check.php` | 3 | 1 DB writes (mutation endpoint) |
| `design_check.php` | 3 | thin endpoint / review |
| `role_redirect.php` | 3 | thin endpoint / review |
| `account_ids.php` | 2 | 1 DB writes (mutation endpoint) |
| `live_security.php` | 2 | 1 DB writes (mutation endpoint) |
| `live_session_agenda_source.php` | 2 | thin endpoint / review |
| `office_material_file.php` | 2 | thin endpoint / review |
| `office_material_source.php` | 2 | thin endpoint / review |
| `payment_start.php` | 2 | thin endpoint / review |
| `whiteboard_pdf.php` | 2 | thin endpoint / review |
| `config_host_check.php` | 1 | thin endpoint / review |
| `design_version.php` | 1 | thin endpoint / review |
| `live_teacher.php` | 1 | thin endpoint / review |
| `logout.php` | 1 | thin endpoint / review |
| `payment_webhook.php` | 1 | JSON/AJAX endpoint |
| `seb_config.php` | 1 | thin endpoint / review |
| `seb_exam_unlock.php` | 1 | thin endpoint / review |
| `virtual_tutor.php` | 1 | thin endpoint / review |
| `platform_login.php` | 0 | thin endpoint / review |
| `teacher_dashboard.php` | 0 | thin endpoint / review |

## Stay in Moodle — backend library (33)

| File | KB | Signal |
|---|--:|---|
| `finance_lib.php` | 188 | 159 fns, backend logic |
| `accesslib.php` | 92 | 122 fns, backend logic |
| `course_transcriptlib.php` | 66 | 55 fns, backend logic |
| `institutionlib.php` | 37 | 46 fns, backend logic |
| `course_offeringlib.php` | 31 | 40 fns, backend logic |
| `finance_operations.php` | 26 | 6 fns, backend logic |
| `office_materials_lib.php` | 24 | 24 fns, backend logic |
| `safenetlib.php` | 22 | 23 fns, backend logic |
| `unmanaged_reports.php` | 21 | 9 fns, backend logic |
| `course_launch.php` | 20 | 6 fns, backend logic |
| `admissionslib.php` | 19 | 17 fns, backend logic |
| `scholarship_sponsorlib.php` | 19 | 15 fns, backend logic |
| `live_pilot_readiness.php` | 18 | 10 fns, backend logic |
| `platform_diagnostics.php` | 17 | 7 fns, backend logic |
| `homeworklib.php` | 16 | 14 fns, backend logic |
| `master_dashboard.php` | 16 | 4 fns, backend logic |
| `live_recordings.php` | 15 | 10 fns, backend logic |
| `notification_delivery_audit.php` | 15 | 4 fns, backend logic |
| `data_export_compliance.php` | 14 | 5 fns, backend logic |
| `seb_lib.php` | 14 | 27 fns, backend logic |
| `data_operationslib.php` | 13 | 12 fns, backend logic |
| `mobile_localizationlib.php` | 13 | 10 fns, backend logic |
| `course_transcript_export.php` | 12 | 6 fns, backend logic |
| `live_diagnostics.php` | 12 | 4 fns, backend logic |
| `teacher_marketplace.php` | 12 | 4 fns, backend logic |
| `course_catalog.php` | 11 | 14 fns, backend logic |
| `gradebook_progresslib.php` | 9 | 11 fns, backend logic |
| `certificates_placementlib.php` | 8 | 9 fns, backend logic |
| `governance_analyticslib.php` | 8 | 10 fns, backend logic |
| `operations_layerlib.php` | 8 | 9 fns, backend logic |
| `live_session_agenda_template.php` | 5 | 4 fns, backend logic |
| `workflow_documentlib.php` | 5 | 10 fns, backend logic |
| `lib.php` | 3 | 1 fns, backend logic |

## Remove from the plugin — cruft (15)

| File | KB | Signal |
|---|--:|---|
| `institution_school_functional_test.php` | 37 | test/fixture/cruft |
| `sqa_teacher_portal_fixture.php` | 30 | test/fixture/cruft |
| `institution_sample_data.php` | 24 | test/fixture/cruft |
| `create_mock_teachers.php` | 19 | test/fixture/cruft |
| `create_mock_students.php` | 18 | test/fixture/cruft |
| `institution_test_matrix.php` | 17 | test/fixture/cruft |
| `placement_tests.php` ⚠️ | 14 | test/fixture/cruft — **verify: may be a real feature, not cruft** |
| `performance_reliability_smoke.php` | 11 | test/fixture/cruft |
| `sqa_test_artifacts.php` | 9 | test/fixture/cruft |
| `sqa_tester_setup.php` | 9 | test/fixture/cruft |
| `create_test_teachers.php` | 8 | test/fixture/cruft |
| `sqa_tracker_api.php` ⚠️ | 5 | test/fixture/cruft — **verify: may be a real feature, not cruft** |
| `consumer_probe.php` | 4 | test/fixture/cruft |
| `demo_students_setup.php` | 4 | test/fixture/cruft |
| `deployment_drift_probe.php` | 3 | test/fixture/cruft |

---
⚠️ = flagged for human verification before action.

---

## local_prequran — Verdict: stays in Moodle (it *is* the backend core)

**~27 PHP files, 2.2 MB. A clean, well-formed Moodle plugin — the opposite of
hubredirect. Essentially all of it stays; nothing meaningful moves to Bunny; no
cruft to delete.** Zero HTML rendering across the plugin (the front end was never
here). This is precisely the "must-keep core" the allocation table describes.

| Group | Files | Disposition |
|---|---|---|
| **Web services** — `externallib_v4.php` (501 KB, 508 fns, 1,211 external_* defs) | 1 | **Stay** — this *is* the API the Bunny SPA calls |
| **DB schema & lifecycle** — `db/` (install, upgrade, upgradelib 281 KB, services, access, tasks, events, messages) | 8 | **Stay** — the plugin's spine |
| **Scheduled tasks** — `classes/task/*` (live reminders, recording automation, weekly digest, finance refresh, SLA monitor, maintenance…) | ~12 | **Stay** — Moodle cron (already off the request path) |
| **Libraries** — `locallib.php`, `lib.php`, `notificationlib.php`, `classes/observer.php` | 4 | **Stay** — server-side logic, data access, event handling |
| **Config / settings / lang / version** | ~4 | **Stay** — incl. the Bunny + TTS admin settings |

**The real finding here is refactoring, not relocation:**

1. **`externallib_v4.php` is a 501 KB / 508-function monolith.** It stays, but as the
   UI moves to Bunny this file becomes **THE API contract** for the whole product —
   so it should be **split into domain modules** (identity, enrolment, progress,
   live, finance, …) for maintainability. Refactor within Moodle, not a move.
2. **As hubredirect's UI moves to Bunny, its data needs are served by these web
   services** — expect to *add* endpoints here (e.g. the progress save/get, roster,
   catalog-personalisation calls from the allocation table), so prequran grows more
   central even as hubredirect shrinks.
3. **Heavy scheduled tasks** (live-session reminders, digests, finance refresh) run
   on the Moodle server. They're already off the request path (cron), but if they
   strain prod at scale they're the candidate for a **separate worker/queue tier** —
   an optimisation, not a Bunny move (Bunny runs no cron).
4. **i18n split:** prequran's `lang/` stays for Moodle admin/settings; the SPA needs
   its **own user-facing string bundle on Bunny** (separate concern).

**Net across both plugins:** hubredirect is where the migration work is (~122 files
move, 15 deleted); prequran is the destination-side backend that stays and gets
*tidied and extended*, not moved.
