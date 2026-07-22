<?php
// ---- report: academic-quality-controls (workspace QA controls; read-only) ----
// Ported from local_hubredirect/academic_quality_controls.php via
// academic_quality_controls_portallib (pqaqc_*). Included from portal_data.php
// AFTER token auth: $claims verified, $USER set to the token user, JSON
// exception handler installed, headers sent. The legacy page stays live in
// parallel and is untouched.
// GET  = the QA controls dataset the legacy page renders: missing-grade,
//        incomplete-attendance, and low-score / progress-alert issues grouped
//        into the same three control sections (+ resolved student names).
// POST = rejected with 400: the legacy page is READ-ONLY (it performs no DB
//        writes; its only non-render path is the export=csv download, which the
//        portal page builds client-side from the same issue rows).

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/academic_quality_controls_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    pqpd_fail(400, 'Academic quality controls is read-only.');
}

// ---- Access + workspace resolution: same order and outcomes as the legacy
// page (academic_quality_controls.php lines 8-33). Legacy redirecting
// pqh_access_denied() calls become 403 JSON failures with the verbatim message
// (the portal page cannot silently hop origins).
$requestedworkspaceid = optional_param('workspaceid', 0, PARAM_INT);
$workspaceid = pqh_current_workspace_id($userid, $requestedworkspaceid);
if ($workspaceid <= 0 || !pqh_user_can_teach_in_workspace($userid, $workspaceid)) {
    pqpd_fail(403, 'Only workspace teaching and admin users can view academic quality controls.');
}

$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', IGNORE_MISSING);
if (!$workspace) {
    pqpd_fail(403, 'Choose a valid workspace before opening academic quality controls.');
}

// -- GET: the QA controls dataset (same issue build + section grouping as the page) --
$issues = pqaqc_all_issues($workspaceid);

// Same three control sections and membership rule as the legacy page.
$sectiondefs = [
    'Missing Grade Detection' => ['missing_grade'],
    'Incomplete Attendance Detection' => ['incomplete_attendance'],
    'Low-score / Progress Alerts' => ['low_score_alert', 'progress_alert'],
];
$sections = [];
foreach ($sectiondefs as $title => $types) {
    $rows = array_values(array_filter($issues, static function (array $issue) use ($types): bool {
        return in_array($issue['issue_type'], $types, true);
    }));
    $sections[] = [
        'title' => $title,
        'count' => count($rows),
        'issues' => $rows,
    ];
}

$nameids = [];
foreach ($issues as $issue) {
    $nameids[] = (int)$issue['studentid'];
}

echo json_encode([
    'ok' => true,
    'ready' => true,
    'workspace' => ['id' => $workspaceid, 'name' => (string)$workspace->name],
    'issues' => $issues,
    'sections' => $sections,
    'total' => count($issues),
    'names' => pqpd_names($nameids),
], JSON_UNESCAPED_SLASHES);
exit;
