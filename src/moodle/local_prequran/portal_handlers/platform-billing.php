<?php
// ---- report: platform-billing (EduPlatform side, B2B settlement) -------------
// Settlement statements between EduPlatform and its consumer schools: platform
// fee on gross collected per period. Statement PAYMENT is recorded (reference
// + timestamps), never executed — money moves outside the platform.
// Included from portal_data.php AFTER token auth: $claims verified, $USER set,
// pqpd_fail/pqpd_names available.
// GET  = consumer list + statements (all, or ?consumerid= filtered).
// POST = do=generate_statement | update_statement | statement_status.

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/finance_lib.php');

$userid = (int)($claims['sub'] ?? 0);

// -- access: same two-stage gate as platform-consumers (foundation domain,
//    then academy operations). Settlement is strictly EduPlatform-side. --
$consumercontext = pqh_current_consumer_context();
$isfoundationdomain = (string)($consumercontext->consumerslug ?? '') === 'eduplatform'
    && (string)($consumercontext->consumer_type ?? '') === 'platform_foundation'
    && !empty($consumercontext->trusted_domain);
if (!$isfoundationdomain) {
    pqpd_fail(403, 'EduPlatform billing is only available from the EduPlatform foundation domain.');
}
if (!pqh_can_manage_academy_operations($userid)) {
    pqpd_fail(403, 'Only platform administrators can manage settlement statements.');
}
if (!pqfin_platform_stmt_schema_ready()) {
    pqpd_fail(503, 'Settlement statement tables are not ready. Run the local_prequran plugin upgrade first.');
}

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    $body = json_decode((string)file_get_contents('php://input'), true);
    if (!is_array($body)) {
        $body = [];
    }
    $bint = static function(string $key, int $default = 0) use ($body): int {
        return isset($body[$key]) ? (int)$body[$key] : $default;
    };
    $btext = static function(string $key, string $default = '') use ($body): string {
        return clean_param((string)($body[$key] ?? $default), PARAM_TEXT);
    };
    $balnum = static function(string $key, string $default = '') use ($body): string {
        return clean_param((string)($body[$key] ?? $default), PARAM_ALPHANUMEXT);
    };
    $braw = static function(string $key, string $default = '') use ($body): string {
        return trim((string)($body[$key] ?? $default));
    };
    $bdate = static function(string $key) use ($body): int {
        $value = trim((string)($body[$key] ?? ''));
        return $value !== '' ? (int)strtotime($value . ' 00:00:00 UTC') : 0;
    };

    try {
        $do = clean_param((string)($body['do'] ?? ''), PARAM_ALPHANUMEXT);
        $message = '';
        $extra = [];
        if ($do === 'generate_statement') {
            $periodstart = $bdate('periodstart');
            $periodend = $bdate('periodend');
            // The end date the operator picks is inclusive; the query bound is
            // exclusive, so add a day.
            if ($periodend > 0) {
                $periodend += DAYSECS;
            }
            $stmtid = pqfin_generate_platform_statement(
                $bint('consumerid', 0),
                $periodstart,
                $periodend,
                $userid,
                $braw('feepercent', ''),
                $btext('notes', '')
            );
            $message = 'Settlement statement generated (draft).';
            $extra['stmtid'] = (int)$stmtid;
        } else if ($do === 'update_statement') {
            pqfin_update_platform_statement($bint('stmtid', 0), $userid, [
                'feepercent' => $braw('feepercent', ''),
                'adjustment' => $braw('adjustment', '0'),
                'adjustmentnote' => $btext('adjustmentnote', ''),
                'notes' => $btext('notes', ''),
            ]);
            $message = 'Draft statement updated.';
        } else if ($do === 'statement_status') {
            pqfin_transition_platform_statement(
                $bint('stmtid', 0),
                $userid,
                $balnum('newstatus', ''),
                $braw('reference', '')
            );
            $message = 'Statement status updated.';
        } else {
            pqpd_fail(400, 'Choose a valid platform-billing action.');
        }
        echo json_encode(['ok' => true, 'message' => $message] + $extra, JSON_UNESCAPED_SLASHES);
        exit;
    } catch (Throwable $e) {
        pqpd_fail(400, $e->getMessage());
    }
}

// -- GET: consumers + statements ----------------------------------------------
$filterconsumerid = optional_param('consumerid', 0, PARAM_INT);

$consumerout = [];
$consumers = $DB->get_records_select('local_prequran_consumer',
    "consumer_type <> 'platform_foundation'", [], 'name ASC');
foreach ($consumers as $consumer) {
    $consumerout[] = [
        'id' => (int)$consumer->id,
        'slug' => (string)$consumer->slug,
        'name' => (string)$consumer->name,
        'status' => (string)$consumer->status,
        'primaryworkspaceid' => (int)$consumer->primaryworkspaceid,
    ];
}

$stmtout = [];
foreach (pqfin_platform_statements($filterconsumerid) as $stmt) {
    $stmtout[] = [
        'id' => (int)$stmt->id,
        'consumerid' => (int)$stmt->consumerid,
        'statementnumber' => (string)$stmt->statementnumber,
        'periodstart' => (int)$stmt->periodstart,
        'periodend' => (int)$stmt->periodend,
        'currency' => (string)$stmt->currency,
        'grosscollected' => (string)$stmt->grosscollected,
        'feepercent' => (string)$stmt->feepercent,
        'feeamount' => (string)$stmt->feeamount,
        'adjustment' => (string)$stmt->adjustment,
        'adjustmentnote' => (string)$stmt->adjustmentnote,
        'netdue' => (string)$stmt->netdue,
        'notes' => (string)$stmt->notes,
        'status' => (string)$stmt->status,
        'paymentcount' => (int)$stmt->paymentcount,
        'paidreference' => (string)$stmt->paidreference,
        'issuedat' => (int)$stmt->issuedat,
        'paidat' => (int)$stmt->paidat,
        'timecreated' => (int)$stmt->timecreated,
    ];
}

echo json_encode([
    'ok' => true, 'ready' => true,
    'consumers' => $consumerout,
    'statements' => $stmtout,
    'feepercentdefault' => pqfin_platform_fee_percent_default(),
    'filterconsumerid' => $filterconsumerid,
], JSON_UNESCAPED_SLASHES);
exit;
