<?php
// ---- report: live-admin (academy-operations live admin menu; read-only) ----
// Ported from local_hubredirect/live_admin.php via live_admin_portallib
// (pqladml_*). Included from portal_data.php AFTER token auth: $claims verified,
// $USER set to the token user, JSON exception handler installed, headers sent.
// GET  = the operations-hub console state: implementation-health table checks,
//        the numbered primary admin workflow, and the grouped link directory
//        (Inquiry / Matching / Scheduling / Classroom / Parent trust / Quality /
//        Diagnostics). Targets already migrated to the portal come back as
//        portal_launch.php?report=<id> URLs; everything else is the legacy page.
//        The school-principal link filter is ported verbatim.
// POST = rejected (the legacy page performs no writes — every button is a link).

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/live_admin_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

// -- access: same gate as the page top. pqh_require_academy_operations(...)
// allows when pqh_can_manage_academy_operations(); otherwise pqh_access_denied
// with this exact message. Mapped to pqpd_fail(403, same message).
if (!pqh_can_manage_academy_operations($userid)) {
    pqpd_fail(403, 'Only academy operations users can view the live admin menu.');
}

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    // The legacy menu performs no writes — refuse anything sent here so a
    // future client bug cannot silently no-op.
    pqpd_fail(400, 'The live admin menu is read-only; it has no portal write actions.');
}

// -- consumer context + url params (verbatim resolution from the page) --
$consumercontext = pqh_requested_consumer_context();
$brandname = trim((string)($consumercontext->consumername ?? 'EduPlatform'));
if ($brandname === '') {
    $brandname = 'EduPlatform';
}
$requestedworkspaceid = optional_param('workspaceid', 0, PARAM_INT);
$urlparams = [];
if (!empty($consumercontext->consumerslug)) {
    $urlparams['consumer'] = (string)$consumercontext->consumerslug;
}
if ($requestedworkspaceid > 0) {
    $urlparams['workspaceid'] = $requestedworkspaceid;
} else if ((int)($consumercontext->workspaceid ?? 0) > 0) {
    $urlparams['workspaceid'] = (int)$consumercontext->workspaceid;
}

// -- grouped link directory (verbatim from the page) --
$groups = [
    '1. Inquiry & Intake' => [
        ['Public inquiry form', '/local/hubredirect/public_intake.php', 'Parent-facing prospective student inquiry with course, profile, consent, and preferred weekly times.'],
        ['Inquiry queue', '/local/hubredirect/intake_requests.php', 'Review submitted inquiries before converting them into Moodle student and parent accounts.'],
        ['Student intake', '/local/hubredirect/student_intake.php', 'Create or link student and parent accounts, consent, profile data, and grouping fields.'],
        ['Teacher application queue', '/local/hubredirect/teacher_intake_requests.php', 'Review independent teacher and tutor applications before creating teacher profiles or workspace access.'],
        ['Teacher intake', '/local/hubredirect/teacher_intake.php', 'Create or link teacher accounts and onboarding profile details.'],
        ['Teacher marketplace admin', '/local/hubredirect/teacher_marketplace_admin.php', 'Review parent-facing teacher profiles, vetting state, visibility, and parent tutor requests.'],
        ['Public landing', '/local/hubredirect/consumer_landing.php', 'Preview the current consumer landing experience with consumer-aware calls to action.'],
        ['Teacher marketplace', '/local/hubredirect/teacher_marketplace.php', 'Preview the current consumer teacher marketplace and published profiles.'],
        ['Parent teacher request tracker', '/local/hubredirect/teacher_marketplace_requests.php', 'Parent-facing request status page for marketplace messages, selections, and assignments.'],
        ['Teaching workspaces', '/local/hubredirect/workspaces.php', 'Create solo-teacher and institution workspaces, add members, and prepare workspace-scoped operations.'],
        ['Referrers', '/local/hubredirect/referrers.php', 'Create referrer accounts, generate five-digit codes, and track referral commission.'],
    ],
    '2. Matching, Pools & Class Groups' => [
        ['Student grouping', '/local/hubredirect/live_grouping.php', 'Manage profiles, matching pools, class groups, suggested assignments, and teacher matching.'],
        ['Teacher directory', '/local/hubredirect/live_teacher_directory.php', 'Find teachers, profiles, availability, current classes, QA status, and capacity.'],
        ['Teacher profile', '/local/hubredirect/live_teacher_profile.php', 'Teacher performance profile; usually opened from teacher directory or reports.'],
        ['Teacher availability', '/local/hubredirect/live_availability.php', 'Set teacher weekly availability in a calendar grid for matching and conflict prevention.'],
        ['Capacity planning', '/local/hubredirect/live_capacity.php', 'Compare teacher load, open seats, group capacity, and scheduling pressure.'],
    ],
    '3. Scheduling & Session Creation' => [
        ['Guided session wizard', '/local/hubredirect/live_create_wizard.php', 'Create one safe one-time BBB class from teacher, group, students, date, and time.'],
        ['Parent meeting rooms', '/local/hubredirect/live_sessions.php?session_type=parent_meeting&title=Parent%20Meeting%20Room', 'Create parent-moderated BBB meeting rooms organized by time zone, language, and child age.'],
        ['Teacher meeting rooms', '/local/hubredirect/live_sessions.php?session_type=teacher_meeting&title=Teacher%20Meeting%20Room', 'Create head-teacher BBB meeting rooms organized by time zone, language, and teaching level.'],
        ['Student rooms', '/local/hubredirect/live_sessions.php?session_type=student_room&title=Student%20Room', 'Create student community BBB rooms organized by level, language, and practice focus.'],
        ['Teacher-parent rooms', '/local/hubredirect/live_sessions.php?session_type=teacher_parent_room&title=Teacher-Parent%20Room', 'Create shared BBB rooms for teachers and parents to coordinate student support.'],
        ['Recurring series wizard', '/local/hubredirect/live_series_wizard.php', 'Create weekly recurring class programs from one guided workflow.'],
        ['Class series', '/local/hubredirect/live_series.php', 'View, edit, cancel, and manage generated recurring sessions.'],
        ['Series schedule history', '/local/hubredirect/live_series_schedule.php', 'Parent-facing series schedule and change history support.'],
        ['Live calendar', '/local/hubredirect/live_calendar.php', 'Calendar view and downloads for student, parent, teacher, and admin schedule visibility.'],
    ],
    '4. Live Classroom & Post-Class Work' => [
        ['Live sessions', '/local/hubredirect/live_sessions.php', 'Create, start, join, and monitor BBB live-session records.'],
        ['Teacher workspace', '/local/hubredirect/teacher_workspace.php', 'Teacher day view with start class, lesson monitor, attendance, notes, and completion actions.'],
        ['Live Session Agenda template', pqh_live_session_agenda_template_url()->out(false), 'Download the fillable BBB slide template teachers prepare before each live session.'],
        ['Live lesson monitor', '/local/hubredirect/live_monitor.php', 'Teacher view of student self-study progress during a live review session.'],
        ['Practice Coach report', '/local/hubredirect/live_practice_coach.php', 'Chatbot Practice Coach events for teacherless supervised-practice sessions.'],
        ['Attendance and notes', '/local/hubredirect/live_review.php', 'Post-class attendance, strengths, needs practice, homework, parent summary, and completion workflow.'],
    ],
    '5. Parent Trust & Communication' => [
        ['Live schedule', '/local/hubredirect/live_schedule.php', 'Parent and student schedule view with upcoming classes.'],
        ['Parent summaries', '/local/hubredirect/live_summaries.php', 'Parent-safe teacher feedback after class without private teacher notes.'],
        ['Follow-up command center', '/local/hubredirect/live_followups.php', 'Teacher-parent follow-ups, parent responses, reminders, escalation, and resolution.'],
        ['Communication center', '/local/hubredirect/communications.php', 'Parent-teacher communication linkage and support messages.'],
        ['Teacher marketplace', '/local/hubredirect/teacher_marketplace.php', 'Parent-facing approved private teacher and tutor profiles with message/request flow.'],
        ['Student parent links', '/local/hubredirect/live_parent_links.php', 'Audit student-to-parent guardian links, profile contacts, and consent status.'],
        ['Referrers', '/local/hubredirect/referrers.php', 'Referral status, referrer codes, commission approvals, and payment tracking.'],
        ['Parent trust dashboard', '/local/hubredirect/live_parent_trust.php', 'Parent-facing trust view for schedule, feedback, recordings, consent, and access confidence.'],
    ],
    '6. Recordings, Quality & Teacher Growth' => [
        ['Recording review', '/local/hubredirect/live_recordings_admin.php', 'Pull BBB recordings, review quality, publish safely, and track retention.'],
        ['Recordings for parents', '/local/hubredirect/live_recordings.php', 'Parent-visible recordings after admin review and publication.'],
        ['Quality review', '/local/hubredirect/live_quality.php', 'Admin QA checklist, score, notes, coaching requests, and review state.'],
        ['QA analytics', '/local/hubredirect/live_quality_analytics.php', 'Teacher trends, scores, completion gaps, review history, and quality signals.'],
        ['Leadership review', '/local/hubredirect/live_leadership.php', 'Escalated quality cases, leadership decisions, and case management.'],
        ['Improvement plans', '/local/hubredirect/live_improvement_plans.php', 'Teacher improvement plans, reminders, escalations, dashboard, and history.'],
    ],
    '7. Operations, Compliance & Diagnostics' => [
        ['Operations dashboard', '/local/hubredirect/live_ops.php', 'Today, upcoming sessions, BBB errors, follow-up work, recordings, and QA queues.'],
        ['Reports', '/local/hubredirect/live_reports.php', 'Operational reporting for live sessions, teachers, students, and academy performance.'],
        ['Practice Coach report', '/local/hubredirect/live_practice_coach.php', 'Teacherless-session coaching prompts, focus nudges, and CSV export.'],
        ['Student parent links', '/local/hubredirect/live_parent_links.php', 'Student and guardian relationship report with export.'],
        ['Referrers', '/local/hubredirect/referrers.php', 'Referrer records, referred students, commission approval, and CSV export.'],
        ['QA analytics', '/local/hubredirect/live_quality_analytics.php', 'Teacher quality trends, scores, completion gaps, review history, and quality signals.'],
        ['Diagnostics', '/local/hubredirect/live_diagnostics.php', 'Check BBB settings, live-session tables, recent sessions, and audit rows.'],
        ['Security review', '/local/hubredirect/live_security.php', 'Security and permission-support review for live-session operations.'],
        ['Parent trust audit', '/local/hubredirect/live_parent_trust_audit.php', 'Support access review, reasons, cases, and access audit.'],
        ['Retention policy', '/local/hubredirect/live_parent_trust_retention.php', 'Data retention settings, admin approval, purge readiness, and safeguards.'],
        ['Compliance review pack', '/local/hubredirect/live_parent_trust_review_pack.php', 'Parent trust export, compliance evidence, and review pack.'],
        ['Purge evidence', '/local/hubredirect/live_parent_trust_purge_evidence.php', 'Retention purge evidence and review support.'],
        ['Consumer diagnostics', '/local/hubredirect/consumer_diagnostics.php', 'Verify multi-consumer schema, current host resolution, configured domains, and consumer routing.'],
        ['Account IDs', '/local/hubredirect/account_ids.php', 'Lookup Moodle user IDs and Pre-Quraan IDs.'],
        ['SQL tools', '/local/hubredirect/sql_tools.php', 'QA configuration and non-production cleanup SQL helpers.'],
    ],
];

// -- school-principal link filter (verbatim from the page) --
if (pqh_is_school_principal((int)$USER->id)) {
    $blockedpaths = [
        '/local/hubredirect/live_diagnostics.php',
        '/local/hubredirect/live_security.php',
        '/local/hubredirect/live_parent_trust_audit.php',
        '/local/hubredirect/live_parent_trust_retention.php',
        '/local/hubredirect/live_parent_trust_review_pack.php',
        '/local/hubredirect/live_parent_trust_purge_evidence.php',
        '/local/hubredirect/account_ids.php',
        '/local/hubredirect/sql_tools.php',
    ];
    foreach ($groups as $groupname => $links) {
        $groups[$groupname] = array_values(array_filter($links, static function(array $link) use ($blockedpaths): bool {
            return !in_array((string)$link[1], $blockedpaths, true);
        }));
    }
}

// -- numbered primary admin workflow (verbatim from the page) --
$workflows = [
    ['1', 'Collect public inquiry', '/local/hubredirect/public_intake.php', 'Parent submits student details, course interest, location, language, level, and preferred weekly times.'],
    ['2', 'Review inquiry queue', '/local/hubredirect/intake_requests.php', 'Admin reviews prospective student data, contact details, consent, and scheduling preferences.'],
    ['3', 'Create student intake', '/local/hubredirect/student_intake.php', 'Create/link Moodle student and parent accounts, capture consent, and create the student profile.'],
    ['4', 'Review teacher applications', '/local/hubredirect/teacher_intake_requests.php', 'Admin reviews independent teacher applications and records approval or follow-up state.'],
    ['5', 'Onboard teachers', '/local/hubredirect/teacher_intake.php', 'Create teacher accounts and profiles before they can be matched to class groups.'],
    ['6', 'Publish marketplace profiles', '/local/hubredirect/teacher_marketplace_admin.php', 'Review teacher profile content, vetting state, parent visibility, and tutor requests.'],
    ['7', 'Set teacher availability', '/local/hubredirect/live_availability.php', 'Capture weekly availability in a calendar grid so matching and conflict checks can work.'],
    ['8', 'Build pools and groups', '/local/hubredirect/live_grouping.php', 'Create matching pools and class groups using course, timezone, language, age, level, gender, and availability.'],
    ['9', 'Check capacity', '/local/hubredirect/live_capacity.php', 'Confirm teacher load, open seats, and class capacity before assigning recurring sessions.'],
    ['10', 'Create session or series', '/local/hubredirect/live_create_wizard.php', 'Create a one-time class, or use the recurring wizard when the class repeats weekly.'],
    ['11', 'Run live class', '/local/hubredirect/teacher_workspace.php', 'Teacher starts BBB, monitors student lesson progress, and supports the live review.'],
    ['12', 'Complete post-class review', '/local/hubredirect/live_review.php', 'Mark attendance, add feedback, assign homework, publish parent summary, and complete the session.'],
    ['13', 'Review recordings and QA', '/local/hubredirect/live_recordings_admin.php', 'Admin reviews recordings and quality before anything becomes parent-visible.'],
    ['14', 'Monitor operations', '/local/hubredirect/live_ops.php', 'Use daily operations, parent follow-ups, reports, retention, and audit pages for ongoing management.'],
];

// -- implementation-health table checks (verbatim from the page) --
$tablechecks = [
    'sessions' => pqladml_table_exists('local_prequran_live_session'),
    'participants' => pqladml_table_exists('local_prequran_live_participant'),
    'attendance' => pqladml_table_exists('local_prequran_live_attendance'),
    'notes' => pqladml_table_exists('local_prequran_live_note'),
    'recordings' => pqladml_table_exists('local_prequran_live_recording'),
    'audit' => pqladml_table_exists('local_prequran_live_audit'),
    'series' => pqladml_table_exists('local_prequran_live_series'),
    'availability' => pqladml_table_exists('local_prequran_live_availability'),
    'intake requests' => pqladml_table_exists('local_prequran_intake_request'),
    'teacher applications' => pqladml_table_exists('local_prequran_teacher_intake_request'),
    'student profiles' => pqladml_table_exists('local_prequran_student_profile'),
    'teacher profiles' => pqladml_table_exists('local_prequran_teacher_profile'),
    'teacher marketplace requests' => pqladml_table_exists('local_prequran_teacher_request'),
    'practice coach' => pqladml_table_exists('local_prequran_practice_coach_event'),
    'matching pools' => pqladml_table_exists('local_prequran_group_pool'),
    'class groups' => pqladml_table_exists('local_prequran_class_group'),
    'group members' => pqladml_table_exists('local_prequran_group_member'),
];

// Legacy pages already migrated to the token-gated portal: rewrite their URLs
// to portal_launch.php?report=<id> so the click re-mints a scoped token. Only
// query-free internal paths are rewritten — the parametrized live_sessions.php
// room links (session_type/title) cannot travel through portal_launch and keep
// their legacy URLs.
$portalmap = [
    'intake_requests.php' => 'intake-requests',
    'student_intake.php' => 'student-intake',
    'teacher_intake_requests.php' => 'teacher-intake-requests',
    'teacher_intake.php' => 'teacher-intake',
    'teacher_marketplace_admin.php' => 'teacher-marketplace-admin',
    'teacher_marketplace.php' => 'teacher-marketplace',
    'live_create_wizard.php' => 'live-create-wizard',
    'live_sessions.php' => 'live-sessions',
    'teacher_workspace.php' => 'teacher-workspace',
    'live_review.php' => 'live-review',
    'live_schedule.php' => 'live-schedule',
    'live_summaries.php' => 'live-summaries',
    'live_followups.php' => 'live-followups',
    'communications.php' => 'communications',
    'live_parent_trust.php' => 'parent-trust',
    'live_recordings_admin.php' => 'recordings-admin',
    'live_recordings.php' => 'recordings',
    'live_quality.php' => 'live-quality',
    'live_quality_analytics.php' => 'quality-analytics',
    'live_ops.php' => 'live-ops',
    'live_reports.php' => 'live-reports',
];

$resolve = function(string $path) use ($CFG, $urlparams, $portalmap): array {
    $external = (bool)preg_match('#^https?://#i', $path);
    $status = pqladml_page_status($path);
    $query = $external ? '' : (string)(parse_url($path, PHP_URL_QUERY) ?: '');
    $basename = $external ? '' : basename((string)(parse_url($path, PHP_URL_PATH) ?: $path));
    $portalid = (!$external && $query === '' && isset($portalmap[$basename])) ? $portalmap[$basename] : '';
    $url = $portalid !== ''
        ? $CFG->wwwroot . '/local/prequran/portal_launch.php?report=' . $portalid
        : pqladml_url($path, $urlparams);
    return [$url, $status, $portalid !== ''];
};

$counts = ['links' => 0, 'ready' => 0, 'missing' => 0, 'external' => 0, 'portal' => 0];
$sections = [];
foreach ($groups as $groupname => $links) {
    $rows = [];
    foreach ($links as $link) {
        [$label, $path, $description] = $link;
        [$url, $status, $isportal] = $resolve($path);
        $external = (bool)preg_match('#^https?://#i', $path);
        $counts['links']++;
        if ($external) {
            $counts['external']++;
        } else if (isset($counts[$status])) {
            $counts[$status]++;
        }
        if ($isportal) {
            $counts['portal']++;
        }
        $rows[] = [
            'title' => $label,
            'desc' => $description,
            'url' => $url,
            'status' => $external ? 'external' : $status,
            'portal' => $isportal,
        ];
    }
    $sections[] = ['category' => $groupname, 'links' => $rows];
}

$workflowout = [];
foreach ($workflows as $workflow) {
    [$step, $label, $path, $description] = $workflow;
    [$url, , $isportal] = $resolve($path);
    $workflowout[] = [
        'step' => $step,
        'title' => $label,
        'desc' => $description,
        'url' => $url,
        'portal' => $isportal,
    ];
}

$health = [];
foreach ($tablechecks as $label => $ok) {
    $health[] = ['label' => $label, 'ready' => (bool)$ok];
}

// Header action buttons (mirror the page top; migrated targets re-mint a token).
[$opsurl] = $resolve('/local/hubredirect/live_ops.php');
[$masterurl] = $resolve('/local/hubredirect/master_dashboard.php');
[$sessionsurl] = $resolve('/local/hubredirect/live_sessions.php');
$actions = [
    ['title' => 'Operations', 'url' => $opsurl, 'primary' => true],
    ['title' => 'Master dashboard', 'url' => $masterurl, 'primary' => false],
    ['title' => 'Live sessions', 'url' => $sessionsurl, 'primary' => false],
    ['title' => 'Agenda template', 'url' => pqh_live_session_agenda_template_url()->out(false), 'primary' => false],
];

echo json_encode([
    'ok' => true,
    'title' => $brandname . ' Operations Hub',
    'subtitle' => 'One organized entry point for inquiry, intake, grouping, teacher matching, session creation, live classes, parent trust, QA, and compliance.',
    'consumer' => [
        'slug' => (string)($consumercontext->consumerslug ?? ''),
        'workspaceid' => (int)($urlparams['workspaceid'] ?? 0),
    ],
    'actions' => $actions,
    'health' => $health,
    'workflow' => $workflowout,
    'sections' => $sections,
    'counts' => $counts,
], JSON_UNESCAPED_SLASHES);
exit;
