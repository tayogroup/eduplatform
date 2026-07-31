<?php
// Portal handler: syllabus. Teacher authors the narrative, school administrator
// approves it; the schedule half is generated fresh from platform data.
defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/syllabus_portallib.php');

$userid = (int)($claims['sub'] ?? 0);
$consumercontext = pqh_requested_consumer_context();
$workspaceid = pqh_current_workspace_id($userid, optional_param('workspaceid', (int)($consumercontext->workspaceid ?? 0), PARAM_INT));

if ($workspaceid <= 0) {
    pqpd_fail(403, 'A workspace is required to view syllabi.');
}
if (!pqsyl_ready()) {
    pqpd_fail(503, 'Syllabus schema is not ready. Run the local_prequran upgrade first.');
}

$canapprove = pqsyl_can_approve($userid, $workspaceid);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $body = json_decode((string)file_get_contents('php://input'), true);
    if (!is_array($body)) {
        $body = [];
    }
    $btext = static function (string $key, string $fallback = '') use ($body): string {
        return trim((string)($body[$key] ?? $fallback));
    };
    $bint = static function (string $key, int $fallback = 0) use ($body): int {
        return (int)($body[$key] ?? $fallback);
    };

    try {
        $action = clean_param((string)($body['do'] ?? ''), PARAM_ALPHANUMEXT);
        $courseid = $bint('courseid', 0);
        $year = $bint('year', pqsyl_current_year());
        if ($courseid <= 0) {
            pqpd_fail(400, 'Choose a course.');
        }
        // Authoring is gated per course: a teacher may write their own syllabus,
        // a workspace manager may write any in the workspace.
        if (!pqsyl_can_author($userid, $workspaceid, $courseid)) {
            pqpd_fail(403, 'You do not teach this course.');
        }

        $message = '';
        if ($action === 'save') {
            pqsyl_save($workspaceid, $consumercontext, $courseid, $year, $userid, $body);
            $message = 'Syllabus saved as a draft.';
        } else if ($action === 'submit') {
            pqsyl_transition($workspaceid, $courseid, $year, $userid, 'submit');
            $message = 'Sent to the school administrator for approval.';
        } else if ($action === 'approve') {
            pqsyl_transition($workspaceid, $courseid, $year, $userid, 'approve', $btext('note'));
            $message = 'Syllabus approved.';
        } else if ($action === 'reject') {
            pqsyl_transition($workspaceid, $courseid, $year, $userid, 'reject', $btext('note'));
            $message = 'Returned to the teacher with your note.';
        } else if ($action === 'retire') {
            pqsyl_transition($workspaceid, $courseid, $year, $userid, 'retire');
            $message = 'Syllabus retired.';
        } else if ($action === 'visibility') {
            pqsyl_set_visibility($workspaceid, $courseid, $year, $userid, $btext('visibility', 'enrolled'));
            $message = 'Visibility updated.';
        } else {
            pqpd_fail(400, 'Choose a valid syllabus action.');
        }

        echo json_encode(['ok' => true, 'message' => $message], JSON_UNESCAPED_SLASHES);
        exit;
    } catch (Throwable $e) {
        pqpd_fail(400, $e->getMessage());
    }
}

// -- GET --
$year = optional_param('year', pqsyl_current_year(), PARAM_INT);
$courses = pqsyl_workspace_courses($workspaceid);
$selected = optional_param('courseid', 0, PARAM_INT);
if ($selected <= 0 && $courses) {
    $selected = (int)$courses[0]['courseid'];
}

$syllabus = null;
$policies = pqsyl_decode_policies(null);
$generated = ['alignment' => null, 'units' => [], 'assessments' => [], 'terms' => [], 'unit_source' => ''];
$canauthor = false;

if ($selected > 0) {
    // Only expose a course that genuinely belongs to this workspace.
    $known = false;
    foreach ($courses as $c) {
        if ((int)$c['courseid'] === $selected) {
            $known = true;
            break;
        }
    }
    if (!$known) {
        pqpd_fail(403, 'That course is not part of this workspace.');
    }
    $canauthor = pqsyl_can_author($userid, $workspaceid, $selected);
    $generated = pqsyl_generated($workspaceid, $selected);
    $row = pqsyl_get($workspaceid, $selected, $year);
    if ($row) {
        $policies = pqsyl_decode_policies($row);
        $syllabus = [
            'overview' => (string)$row->overview,
            'teacher_intro' => (string)$row->teacher_intro,
            'contact' => (string)$row->contact,
            'visibility' => (string)$row->visibility,
            'status' => (string)$row->status,
            'review_note' => (string)$row->review_note,
            'approvedby' => (int)$row->approvedby,
            'approvedat' => (int)$row->approvedat,
            'timemodified' => (int)$row->timemodified,
        ];
    }
}

$nameids = array_values(array_unique(array_filter([(int)($syllabus['approvedby'] ?? 0)])));

echo json_encode([
    'ok' => true, 'ready' => true,
    'workspaceid' => $workspaceid,
    'year' => $year,
    'year_label' => pqsyl_year_label($year),
    'courses' => $courses,
    'selected_courseid' => $selected,
    'syllabus' => $syllabus,
    'policies' => $policies,
    'policy_blocks' => pqsyl_policy_blocks(),
    'generated' => $generated,
    'visibility_options' => pqsyl_visibility_options(),
    'status_options' => pqsyl_status_options(),
    'can_author' => $canauthor,
    'can_approve' => $canapprove,
    'names' => pqpd_names($nameids),
], JSON_UNESCAPED_SLASHES);
exit;
