<?php
// Portal handler: transcript-policy (workspace transcript grade/completion/
// attendance/official-display policy editor). Ported from
// local_hubredirect/transcript_policy.php, which stays live in parallel. Runs
// from portal_data.php AFTER token auth: $claims verified, $USER set to the
// token user, JSON exception handler installed, CORS headers sent.
//
//   GET  ?report=transcript-policy&token=…[&workspaceid=&consumer=]
//   POST ?report=transcript-policy&token=…[&workspaceid=&consumer=]
//        body JSON: {do:"save", completion_source, passing_rule,
//          minimum_passing_percent, grade_display_mode, grade_rounding,
//          show_in_progress_grades, attendance_display,
//          drop_withdrawal_display, teacher_note_official_display,
//          unofficial_pdf_permission, official_issue_permission}
//
// The write is the legacy POST verbatim (same policy array, same defaults,
// same lib call); confirm_sesskey() is dropped — token auth replaces the
// session key — and the legacy redirect becomes an ok JSON. The legacy
// catch(Throwable) re-render-with-error becomes an error JSON with the same
// message. (transcript_policy.php has no pqh_live_security_audit calls — none
// to keep.)

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/course_transcriptlib.php');
require_once($CFG->dirroot . '/local/hubredirect/transcript_policy_portallib.php');

$userid = (int)($claims['sub'] ?? 0);
$ispost = ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST';
$body = [];
$do = '';
if ($ispost) {
    $decoded = json_decode((string)file_get_contents('php://input'), true);
    $body = is_array($decoded) ? $decoded : [];
    $do = (string)($body['do'] ?? '');
    if ($do !== 'save') {
        pqpd_fail(400, 'Unknown transcript-policy action.');
    }
}

// ---- request parameters (verbatim reads from the page) ----------------------
$consumercontext = pqh_requested_consumer_context();
$workspaceid = optional_param('workspaceid', (int)($consumercontext->workspaceid ?? 0), PARAM_INT);
if ($ispost && isset($body['workspaceid'])) {
    $workspaceid = clean_param($body['workspaceid'], PARAM_INT);
}
$workspaceid = pqh_current_workspace_id($userid, $workspaceid);

// ---- entry gates: same order as the page ------------------------------------
if ($workspaceid <= 0 || !pqh_user_can_manage_workspace($userid, $workspaceid)) {
    pqpd_fail(403, 'Only workspace owners and admins can edit transcript policy settings.');
}
if (!pqh_table_exists_safe('local_prequran_transcript_policy')) {
    pqpd_fail(403, 'Transcript policy tables are not ready yet. Run the local_prequran plugin upgrade first.');
}

$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', MUST_EXIST);
$allowed = pqct_policy_allowed_values();

if ($ispost) {
    // confirm_sesskey() dropped: token auth replaces the session key.
    // Body reads mirror the legacy optional_param() types and defaults exactly.
    $get = static function(array $body, string $key, $default, int $type) {
        return array_key_exists($key, $body) ? clean_param($body[$key], $type) : $default;
    };
    try {
        $policy = [
            'policy_version' => 1,
            'completion_source' => $get($body, 'completion_source', 'moodle_then_local', PARAM_ALPHANUMEXT),
            'passing_rule' => $get($body, 'passing_rule', 'completion_or_grade', PARAM_ALPHANUMEXT),
            'minimum_passing_percent' => $get($body, 'minimum_passing_percent', 60, PARAM_INT),
            'grade_display_mode' => $get($body, 'grade_display_mode', 'percent', PARAM_ALPHANUMEXT),
            'grade_rounding' => $get($body, 'grade_rounding', 1, PARAM_INT),
            'show_in_progress_grades' => $get($body, 'show_in_progress_grades', 0, PARAM_BOOL),
            'attendance_display' => $get($body, 'attendance_display', 'sessions_and_rate', PARAM_ALPHANUMEXT),
            'drop_withdrawal_display' => $get($body, 'drop_withdrawal_display', 'show_with_status', PARAM_ALPHANUMEXT),
            'teacher_note_official_display' => $get($body, 'teacher_note_official_display', 'none', PARAM_ALPHANUMEXT),
            'unofficial_pdf_permission' => $get($body, 'unofficial_pdf_permission', 'workspace_admin', PARAM_ALPHANUMEXT),
            'official_issue_permission' => $get($body, 'official_issue_permission', 'workspace_admin', PARAM_ALPHANUMEXT),
        ];
        pqct_save_workspace_transcript_policy($workspaceid, $policy, $userid);
        // Legacy: redirect back to the policy page with saved=1.
        echo json_encode([
            'ok' => true,
            'message' => 'Transcript policy saved.',
            'workspaceid' => $workspaceid,
        ], JSON_UNESCAPED_SLASHES);
        exit;
    } catch (Throwable $e) {
        // Legacy re-renders the page with the error message.
        pqpd_fail(400, $e->getMessage());
    }
}

// ---- GET: the current policy state (same reads as the page) -----------------
$policyinfo = pqct_workspace_transcript_policy($workspaceid);
$policy = pqct_normalize_transcript_policy($policyinfo['policy']);

// Decorate the allowed option sets with human labels via the verbatim page
// helper so the client can build the selects the page renders inline.
$options = [];
foreach ($allowed as $field => $values) {
    $options[$field] = [];
    foreach ($values as $value) {
        $options[$field][] = [
            'value' => (string)$value,
            'label' => pqctp_option_label((string)$value),
        ];
    }
}

$dashboardurl = (new moodle_url('/local/hubredirect/workspace_dashboard.php', $consumercontext ? array_filter([
    'consumer' => !empty($consumercontext->consumerslug) ? (string)$consumercontext->consumerslug : null,
    'workspaceid' => $workspaceid > 0 ? $workspaceid : null,
]) : []))->out(false);
$previewurl = (new moodle_url('/local/hubredirect/course_transcript.php', array_filter([
    'consumer' => !empty($consumercontext->consumerslug) ? (string)$consumercontext->consumerslug : null,
    'workspaceid' => $workspaceid > 0 ? $workspaceid : null,
])))->out(false);

echo json_encode([
    'ok' => true, 'ready' => true,
    'workspaceid' => $workspaceid,
    'workspace' => ['id' => $workspaceid, 'name' => (string)$workspace->name],
    'policy' => $policy,
    'options' => $options,
    'meta' => [
        'source' => (string)$policyinfo['source'],
        'policyversion' => (int)$policyinfo['policyversion'],
        'policyhash' => (string)$policyinfo['policyhash'],
        'timemodified' => (int)$policyinfo['timemodified'],
        'timemodified_label' => (int)$policyinfo['timemodified'] > 0
            ? userdate((int)$policyinfo['timemodified'], get_string('strftimedatetimeshort'))
            : 'Not saved yet',
    ],
    'links' => [
        'workspace' => $dashboardurl,
        'preview' => $previewurl,
    ],
    'names' => pqpd_names([]),
], JSON_UNESCAPED_SLASHES);
exit;
