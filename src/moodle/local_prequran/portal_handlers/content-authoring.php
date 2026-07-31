<?php
// Portal handler: content-authoring (workspace admin). Learning-objective
// management + JSON import (the content JSON's outcomes never reached Moodle),
// a content review/approval register with an audit trail, and objective
// coverage per course.
defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/content_authoring_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

$body = [];
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    $decoded = json_decode((string)file_get_contents('php://input'), true);
    $body = is_array($decoded) ? $decoded : [];
}

$consumercontext = pqh_requested_consumer_context();
$workspaceid = isset($body['workspaceid'])
    ? (int)$body['workspaceid']
    : optional_param('workspaceid', (int)($consumercontext->workspaceid ?? 0), PARAM_INT);
$workspaceid = pqh_current_workspace_id($userid, $workspaceid);

if ($workspaceid <= 0 || !pqh_user_can_manage_workspace($userid, $workspaceid)) {
    pqpd_fail(403, 'Content authoring requires workspace administrator access.');
}

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    $bint = static function (string $k, int $d = 0) use ($body): int {
        return isset($body[$k]) ? (int)$body[$k] : $d;
    };
    $btext = static function (string $k, string $d = '') use ($body): string {
        return clean_param((string)($body[$k] ?? $d), PARAM_TEXT);
    };
    try {
        $do = clean_param((string)($body['do'] ?? ''), PARAM_ALPHANUMEXT);
        if ($do === 'save_objective') {
            $id = pqcon_save_objective($workspaceid, $userid, [
                'courseid' => $bint('courseid'),
                'course_idnumber' => $btext('course_idnumber', ''),
                'unit_number' => $bint('unit_number'),
                'objective_code' => $btext('objective_code', ''),
                'sequence' => $bint('sequence'),
                'learning_outcome' => $btext('learning_outcome', ''),
                'bloom_level' => $btext('bloom_level', ''),
                'evidence' => $btext('evidence', ''),
                'framework_code' => $btext('framework_code', ''),
                'status' => clean_param((string)($body['status'] ?? 'active'), PARAM_ALPHANUMEXT),
            ]);
            echo json_encode(['ok' => true, 'message' => 'Objective saved.', 'id' => $id], JSON_UNESCAPED_SLASHES);
            exit;
        }
        if ($do === 'import_objectives') {
            $courseid = $bint('courseid');
            $raw = (string)($body['outcomes_json'] ?? '');
            $parsed = json_decode($raw, true);
            // Accept either a bare array of outcomes or a unit object with an
            // "outcomes" key (paste a whole unit-N.json).
            $outcomes = is_array($parsed)
                ? (isset($parsed['outcomes']) && is_array($parsed['outcomes']) ? $parsed['outcomes'] : $parsed)
                : [];
            if (!$outcomes) {
                pqpd_fail(400, 'Paste a JSON array of outcomes, or a unit JSON containing an "outcomes" array.');
            }
            $n = pqcon_import_objectives($workspaceid, $courseid, $btext('course_idnumber', ''), $userid, $outcomes);
            echo json_encode(['ok' => true, 'message' => $n . ' objective(s) imported.', 'imported' => $n], JSON_UNESCAPED_SLASHES);
            exit;
        }
        if ($do === 'save_review') {
            $id = pqcon_save_content_review($workspaceid, $consumercontext, $userid, [
                'content_type' => clean_param((string)($body['content_type'] ?? 'unit'), PARAM_ALPHANUMEXT),
                'content_ref' => $btext('content_ref', ''),
                'title' => $btext('title', ''),
                'review_status' => clean_param((string)($body['review_status'] ?? 'draft'), PARAM_ALPHANUMEXT),
                'content_version' => $btext('content_version', ''),
                'notes' => $btext('notes', ''),
            ]);
            echo json_encode(['ok' => true, 'message' => 'Content review saved.', 'id' => $id], JSON_UNESCAPED_SLASHES);
            exit;
        }
        pqpd_fail(400, 'Choose a valid content-authoring action.');
    } catch (Throwable $e) {
        pqpd_fail(400, $e->getMessage());
    }
}

// -- GET --
$selectedcourse = optional_param('courseid', 0, PARAM_INT);
$objectives = [];
foreach (pqcon_objectives_for_course($workspaceid, $selectedcourse) as $o) {
    $objectives[] = [
        'id' => (int)$o->id,
        'unit_number' => (int)$o->unit_number,
        'objective_code' => (string)$o->objective_code,
        'sequence' => (int)$o->sequence,
        'learning_outcome' => (string)$o->learning_outcome,
        'bloom_level' => (string)$o->bloom_level,
        'evidence' => (string)$o->evidence,
        'framework_code' => (string)$o->framework_code,
        'status' => (string)$o->status,
    ];
}

$reviews = [];
$nameids = [];
foreach (pqcon_content_reviews($workspaceid) as $r) {
    $nameids[] = (int)$r->reviewedby;
    $reviews[] = [
        'id' => (int)$r->id,
        'content_type' => (string)$r->content_type,
        'content_ref' => (string)$r->content_ref,
        'title' => (string)$r->title,
        'review_status' => (string)$r->review_status,
        'content_version' => (string)$r->content_version,
        'notes' => (string)$r->notes,
        'reviewedby' => (int)$r->reviewedby,
        'reviewedat' => (int)$r->reviewedat,
        'timemodified' => (int)$r->timemodified,
    ];
}

echo json_encode([
    'ok' => true, 'ready' => true,
    'workspaceid' => $workspaceid,
    'courses' => pqcon_workspace_courses($workspaceid),
    'selected_courseid' => $selectedcourse,
    'objectives' => $objectives,
    'coverage' => pqcon_objective_coverage($workspaceid),
    'reviews' => $reviews,
    'review_status_options' => pqcon_review_status_options(),
    'names' => pqpd_names(array_values(array_unique(array_filter($nameids)))),
], JSON_UNESCAPED_SLASHES);
exit;
