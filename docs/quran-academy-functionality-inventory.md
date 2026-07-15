# Quran Academy Functionality Inventory

Purpose: categorized list of app functionality for onboarding testers and planning regression coverage.

## Public Website And Intake

- Public landing pages: introduce Quran Academy, courses, dashboards, live sessions, pricing, contact, and inquiry routes.
- Student inquiry and intake: collect student profile details, level, location, time zone, learning needs, parent/guardian details, and preferred schedule.
- Teacher intake: collect teacher profile, availability, and onboarding details.
- Enrollment approval: lets parents or guardians approve student enrollment where required.
- Referrer tracking: supports referral and source tracking for intake and academy growth workflows.

## Authentication And Role Routing

- Moodle login requirement: protects dashboard, courses, communications, reports, live sessions, and workspace tools.
- Dashboard redirect: sends Quran Academy users from Moodle into the custom hub.
- Role detection: identifies admin, teacher, parent, student, school principal, referrer, and marketplace/private tutor roles.
- Access denial handling: blocks users from courses, students, dashboards, or tools they are not allowed to access.
- Logout and session-expired pages: provide controlled session exit and recovery paths.

## Main Dashboard

- Role-aware dashboard: shows different cards and quick actions by user type.
- Child/student selector: lets parents and teachers switch context before opening child-specific tools.
- Course cards: launch available academy tracks, especially the Pre-Quran course.
- Quick links: live sessions, communications, reports, workspaces, recordings, summaries, intake, and admin operations.
- Environment-aware links: supports production, staging, and integration app launches.

## Pre-Quran Course Launcher

- Course launch registry: routes course cards to the correct app or placeholder page.
- Managed student launch: opens the static Pre-Quran app with student context.
- Bunny CDN environment selection: supports production, staging, and integration base paths.
- Secure lesson routing: uses Moodle hub routes for managed lesson access.
- Static local preview support: allows units to run locally during development and QA.

## Learner App Shell

- Multilingual app shell: supports English, Arabic, Urdu, Swahili, and Somali labels/configuration.
- Main course menu: organizes lessons into alphabet, movements, joint letters, rules/tajweed, pillars, and related categories.
- Parent/managed-student mode: carries child/student identity into lessons and communication scope.
- Header actions: exposes communications, language/settings controls, parent badge, and navigation utilities.
- Game and quiz launch links: opens practice games and quiz chatbot experiences.

## Lesson Units And Activities

- Unit pages: each course unit has its own `index.html`, config, runtime, styles, and message file.
- Shared runtime: common bootstrap, steps, playback, media, grid, progress, submit, speak, and write behavior.
- Learn/listen activities: present lesson content, media, cues, and guided learning steps.
- Match activities: interactive matching exercises through the shared match engine.
- Speak activities: record or evaluate pronunciation/practice attempts.
- Write activities: support handwriting or writing-based practice.
- Submit activities: capture final unit-level completion or recording evidence.
- Stepper UI: presents repeatable learning steps with progress state and rewards.
- Audio/video/caption media: plays unit lesson media and generated instructional content.

## Progress And Student Data

- Step progress persistence: saves completed steps for managed students.
- Focus/activity logging: tracks learner activity where enabled.
- Speak-state tracking: stores state for alphabet and harakat speak workflows.
- Submit recording storage: saves full-unit recordings for teacher review.
- Speak recording storage: saves step-level recordings for teacher review.
- Progress reset: allows teacher/admin reset of student progress where permitted.
- Managed reports: show student progress, focus, practice, quiz, and live-class summaries.

## Quiz And Practice Coach

- Quiz chatbot launch: supports child-friendly quiz interactions.
- Quiz event saving: records attempts, passes, questions, correctness, duration, and summary details.
- Quiz reports: lets authorized users view quiz outcomes for a student.
- Text-to-speech settings: supports quiz chatbot and practice coach voice generation.
- Practice coach: provides teacherless-session support prompts and reporting.
- Practice coach event logging: stores practice-coach activity for review.

## Communications

- Communications panel: app-shell inbox for announcements and parent-teacher messages.
- Standalone communications page: Moodle page for messages, direct thread reading, and fallback replies.
- Announcement threads: one-way messages for class, cohort, or student-specific updates.
- Parent-teacher threads: private message threads linked to one student.
- Thread listing: loads visible announcements and messages by role and student scope.
- Thread detail view: opens messages in a selected thread.
- Reply composer: sends replies when the user is an allowed participant.
- Unread badge: shows unread communication count in the learner shell.
- Read tracking: updates participant read state.
- Communication audit: logs creation and message actions when tables are available.
- Parent alert linkage: supports urgent parent alerts from live-session and follow-up workflows.

## Communication Safety And Privacy

- Participant allow-listing: checks explicit thread participants before exposing messages.
- Guardian-student validation: checks parent/guardian relationship before access.
- Teacher-student validation: checks teacher assignment, cohort, group, or live-session relationship.
- Student restrictions: prevents students from seeing parent-teacher threads.
- Announcement reply lock: keeps announcements read-only.
- Normal-user delete restriction: keeps communication records auditable.
- Message body sanitization: limits and cleans message content.
- Notification privacy: supports short notification text instead of exposing full private message bodies.

## Live Sessions

- Live session listing: shows scheduled, active, and recent sessions.
- Live session creation: admins and authorized teachers can create sessions.
- Live series: supports recurring session series and schedule management.
- Live schedule: displays upcoming and recent classes for students, parents, and teachers.
- Live calendar: monthly view and calendar-style access to sessions.
- Join session: generates BigBlueButton join links for permitted users.
- Join window control: limits session joining based on schedule and role.
- Attendance tracking: records join/leave and participation data.
- Live notes: captures strengths, needs practice, homework, follow-up status, and parent summaries.
- Parent live hub: parent-facing access to schedule, feedback, homework, recordings, and receipts.
- Live summaries: parent/student-visible teacher feedback after class.
- Live recordings: approved playback for parents/students and review tools for admins.
- Recording automation: sync, review queue, retention, and approval-related workflows.
- Live diagnostics: troubleshooting and readiness support.

## Live Operations And Quality

- Live admin menu: central admin area for live-session operations.
- Capacity planning: tracks teacher capacity and session load.
- Student grouping: groups students by profile, level, schedule, and class readiness.
- Teacher directory: lists teachers, profiles, assignments, and capacity signals.
- Teacher workspace: daily classes and post-class reviews.
- Teacher schedule: teacher-specific upcoming and recent sessions.
- Parent follow-ups: command center for responding to families and closing follow-up items.
- Live reports: operational and learning reports for live sessions.
- QA analytics: teacher quality trends, coaching signals, and leadership review.
- Improvement plans: teacher improvement dashboards, reminders, and review packs.
- Leadership dashboards: aggregated performance and quality review tools.

## Meeting Rooms

- Parent meeting rooms: parent-moderated rooms by time zone, language, and child age.
- Teacher meeting rooms: head-teacher/community rooms by time zone, language, and teaching level.
- Student rooms: student community rooms by level and practice focus.
- Teacher-parent rooms: shared support rooms for teachers and families.
- BBB theme support: custom BigBlueButton visual/theme assets and install scripts.

## Workspace System

- Workspace dashboard: central workspace hub for a class, group, or teaching team.
- Workspace people: manages owners, admins, teachers, assistant teachers, students, and related members.
- Workspace materials: upload, organize, and assign learning materials.
- Workspace sessions: manage workspace-linked sessions.
- Workspace series: manage workspace-linked recurring series.
- Workspace reports: report on workspace activity and student progress.
- Workspace student profile: shows student details, teachers, guardians, consent, attendance, notes, and assigned materials.
- Workspace parent page: parent-facing workspace access.
- Material assignment workflow: assigns materials to students and tracks in-progress/completed state.
- Teacher notification on completion: notifies assigned teaching users when a student completes material.
- Workspace permission checks: prevents cross-workspace data leakage.

## Admin Operations

- Student intake administration: creates and reviews student, parent, profile, consent, and readiness data.
- Teacher intake administration: configures teacher onboarding and intake data.
- Teacher marketplace: public/admin teacher profiles, private tutor visibility, and parent messaging entry points.
- Teacher marketplace admin: review and manage marketplace profiles.
- Parent links: manage student-guardian relationships and consent.
- SQL tools: support operational database checks and manual verification scripts.
- Mock data tools: create mock teachers and students for testing.
- Course catalog/debug/launch tools: inspect and test course availability and routing.
- Access library: centralized helper functions for role and workspace permission checks.

## Reporting

- Managed reports: student progress, focus, practice, quiz, and live-class summary.
- Unmanaged reports: broader report route for non-managed contexts.
- Quiz reports: quiz chatbot outcomes by student.
- Live reports: attendance, sessions, summaries, follow-ups, and operations.
- Workspace reports: workspace-specific student and material progress.
- Recording reports: recording review and playback state.
- QA analytics: quality trends and teacher performance signals.
- Parent trust pages: parent-facing receipts, summaries, retention, audit, and evidence pages.

## Notifications And Reminders

- Moodle message notifications: sends live-session and follow-up updates.
- Live session reminders: scheduled reminder task for upcoming sessions and follow-ups.
- Workspace weekly digest: periodic workspace notification task.
- Parent urgent alerts: supports urgent parent communication, including WhatsApp configuration where enabled.
- Follow-up notifications: links notes, homework, and parent responses to follow-up workflows.

## Deployment And Environment Tools

- Unit config validation: validates unit configuration.
- Runtime bundle build: builds shared runtime bundle for units.
- Bunny output build: generates deployable static output in `dist/pre_quraan/`.
- Bunny verification: checks generated output.
- Bunny deployment: deploys production, staging, integration, and communications assets.
- Local preview server: serves source or generated output for QA.
- Environment promotion checklist: documents deployment readiness.
- Rollback backups: preserve prior versions of sensitive live-session/chat changes.

## Testing Support

- Testing links page: provides quick access to testable app surfaces.
- QA checklist: baseline page-load, console, progress, and Moodle-sync checks.
- Production smoke-test documentation: supports release validation.
- SQL verification scripts: validate live-session, workspace, communication, report, and migration states.
- Mock student/teacher CSV data: supports repeatable role testing.
- Generated guides and training assets: live-session guide, agenda template, and explainer media.

## Recommended Test Coverage Categories

- Role routing and permission checks.
- Course launch and environment correctness.
- Unit loading, media playback, and step completion.
- Managed progress persistence and reporting.
- Speak/submit recording workflows.
- Quiz attempt saving and reporting.
- Communications thread visibility, replies, unread counts, and audit trails.
- Parent/teacher/student privacy boundaries.
- Live-session schedule, join, notes, summaries, recordings, and follow-ups.
- Workspace membership, materials, completion, and notification flows.
- Admin setup workflows for student, parent, teacher, consent, grouping, and marketplace.
- Deployment smoke checks across integration, staging, and production.
