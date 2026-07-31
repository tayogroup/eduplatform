<?php
// Portal handler: fee-schedule (workspace admin). Reusable tuition-by-grade/
// level/program price book — pricing was per-offering only, with no shared
// catalog or fee-schedule-by-year.
defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/institution_records_portallib.php');

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
    pqpd_fail(403, 'Fee schedules require workspace administrator access.');
}
if (!pqir_fee_ready()) {
    pqpd_fail(503, 'Fee schedule tables are not ready. Run the local_prequran plugin upgrade first.');
}

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    $braw = static function (string $k, string $d = '') use ($body): string {
        return trim((string)($body[$k] ?? $d));
    };
    try {
        $do = clean_param((string)($body['do'] ?? ''), PARAM_ALPHANUMEXT);
        if ($do === 'save') {
            $id = pqir_save_fee_schedule($workspaceid, $consumercontext, $userid, [
                'id' => isset($body['id']) ? (int)$body['id'] : 0,
                'title' => $braw('title'),
                'applies_to' => clean_param((string)($body['applies_to'] ?? 'grade'), PARAM_ALPHANUMEXT),
                'applies_value' => $braw('applies_value'),
                'academic_year' => $braw('academic_year'),
                'currency' => clean_param((string)($body['currency'] ?? 'USD'), PARAM_ALPHANUMEXT),
                'tuition_amount' => $braw('tuition_amount', '0'),
                'registration_fee' => $braw('registration_fee', '0'),
                'materials_fee' => $braw('materials_fee', '0'),
                'sibling_discount_percent' => $braw('sibling_discount_percent', '0'),
                'early_payment_discount_percent' => $braw('early_payment_discount_percent', '0'),
                'status' => clean_param((string)($body['status'] ?? 'active'), PARAM_ALPHANUMEXT),
                'notes' => clean_param((string)($body['notes'] ?? ''), PARAM_TEXT),
            ]);
            echo json_encode(['ok' => true, 'message' => 'Fee schedule saved.', 'id' => $id], JSON_UNESCAPED_SLASHES);
            exit;
        }
        pqpd_fail(400, 'Choose a valid fee-schedule action.');
    } catch (Throwable $e) {
        pqpd_fail(400, $e->getMessage());
    }
}

// -- GET --
$schedules = [];
foreach ($DB->get_records('local_prequran_fee_schedule', ['workspaceid' => $workspaceid], 'status ASC, title ASC', '*', 0, 300) as $s) {
    $schedules[] = [
        'id' => (int)$s->id,
        'schedule_code' => (string)$s->schedule_code,
        'title' => (string)$s->title,
        'applies_to' => (string)$s->applies_to,
        'applies_value' => (string)$s->applies_value,
        'academic_year' => (string)$s->academic_year,
        'currency' => (string)$s->currency,
        'tuition_amount' => (string)$s->tuition_amount,
        'registration_fee' => (string)$s->registration_fee,
        'materials_fee' => (string)$s->materials_fee,
        'sibling_discount_percent' => (string)$s->sibling_discount_percent,
        'early_payment_discount_percent' => (string)$s->early_payment_discount_percent,
        'status' => (string)$s->status,
        'notes' => (string)$s->notes,
    ];
}

echo json_encode([
    'ok' => true, 'ready' => true,
    'workspaceid' => $workspaceid,
    'schedules' => $schedules,
], JSON_UNESCAPED_SLASHES);
exit;
