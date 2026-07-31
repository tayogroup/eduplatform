<?php
// Portal handler: finance-monetization (school-side console).
// Marketplace payout lifecycle + batch runs, coupon codes, and standing
// scholarship grants. Disbursement is RECORDED here (reference + timestamps),
// never executed — money always moves outside the platform.
defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/finance_lib.php');

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

if ($workspaceid <= 0 || !pqfin_user_can_manage_workspace_finance($userid, $workspaceid)) {
    pqpd_fail(403, 'Only workspace finance admins can use the monetization console.');
}

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
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
        return $value !== '' ? (int)strtotime($value . ' 12:00:00') : 0;
    };

    try {
        $action = clean_param((string)($body['do'] ?? ''), PARAM_ALPHANUMEXT);
        $message = '';
        $extra = [];
        if ($action === 'payout_status') {
            pqfin_update_marketplace_payout_status(
                $bint('payoutid', 0),
                $consumercontext,
                $userid,
                $balnum('newstatus', ''),
                $braw('reference', ''),
                $btext('note', ''),
                $workspaceid
            );
            $message = 'Payout status updated.';
        } else if ($action === 'create_batch') {
            $ids = $body['payoutids'] ?? [];
            $batchid = pqfin_create_payout_batch(
                $workspaceid,
                $consumercontext,
                $userid,
                is_array($ids) ? $ids : [],
                $btext('notes', '')
            );
            $message = 'Payout batch created (draft).';
            $extra['batchid'] = (int)$batchid;
        } else if ($action === 'batch_status') {
            pqfin_transition_payout_batch(
                $bint('batchid', 0),
                $consumercontext,
                $userid,
                $balnum('newstatus', ''),
                $braw('reference', ''),
                $workspaceid
            );
            $message = 'Batch status updated.';
        } else if ($action === 'save_coupon') {
            $couponid = pqfin_save_coupon($workspaceid, $consumercontext, $userid, [
                'couponid' => $bint('couponid', 0),
                'code' => $braw('code', ''),
                'description' => $btext('description', ''),
                'discounttype' => $balnum('discounttype', 'fixed'),
                'discountvalue' => $braw('discountvalue', '0'),
                'maxredemptions' => $bint('maxredemptions', 0),
                'perstudentlimit' => $bint('perstudentlimit', 1),
                'validfrom' => $bdate('validfrom'),
                'validuntil' => $bdate('validuntil'),
                'status' => $balnum('status', 'active'),
                'notes' => $btext('notes', ''),
            ]);
            $message = 'Coupon saved.';
            $extra['couponid'] = (int)$couponid;
        } else if ($action === 'save_grant') {
            $grantid = pqfin_save_scholar_grant($workspaceid, $consumercontext, $userid, [
                'grantid' => $bint('grantid', 0),
                'studentid' => $bint('studentid', 0),
                'name' => $btext('name', 'Scholarship'),
                'discounttype' => $balnum('discounttype', 'percent'),
                'discountvalue' => $braw('discountvalue', '0'),
                'source' => $balnum('source', 'internal'),
                'sponsoraccountid' => $bint('sponsoraccountid', 0),
                'status' => $balnum('status', 'active'),
                'startdate' => $bdate('startdate'),
                'enddate' => $bdate('enddate'),
                'notes' => $btext('notes', ''),
            ]);
            $message = 'Scholarship grant saved.';
            $extra['grantid'] = (int)$grantid;
        } else {
            pqpd_fail(400, 'Choose a valid monetization action.');
        }
        echo json_encode(['ok' => true, 'message' => $message] + $extra, JSON_UNESCAPED_SLASHES);
        exit;
    } catch (Throwable $e) {
        pqpd_fail(400, $e->getMessage());
    }
}

// -- GET: console payload -----------------------------------------------------
$nameids = [];

$payoutout = [];
foreach (pqfin_payouts_for_workspace($workspaceid) as $payout) {
    $nameids[] = (int)$payout->teacherid;
    $payoutout[] = [
        'id' => (int)$payout->id,
        'payoutnumber' => (string)$payout->payoutnumber,
        'teacherid' => (int)$payout->teacherid,
        'invoiceid' => (int)$payout->invoiceid,
        'currency' => (string)$payout->currency,
        'grossamount' => (string)$payout->grossamount,
        'platformfee' => (string)$payout->platformfee,
        'payoutamount' => (string)$payout->payoutamount,
        'status' => (string)$payout->status,
        'batchid' => (int)($payout->batchid ?? 0),
        'reference' => (string)$payout->reference,
        'approvedat' => (int)$payout->approvedat,
        'paidat' => (int)$payout->paidat,
    ];
}

$batchout = [];
foreach (pqfin_payout_batches_for_workspace($workspaceid) as $batch) {
    $batchout[] = [
        'id' => (int)$batch->id,
        'batchnumber' => (string)$batch->batchnumber,
        'status' => (string)$batch->status,
        'currency' => (string)$batch->currency,
        'totalgross' => (string)$batch->totalgross,
        'totalfee' => (string)$batch->totalfee,
        'totalnet' => (string)$batch->totalnet,
        'payoutcount' => (int)$batch->payoutcount,
        'paidreference' => (string)$batch->paidreference,
        'timecreated' => (int)$batch->timecreated,
        'paidat' => (int)$batch->paidat,
    ];
}

$couponout = [];
foreach (pqfin_coupons_for_workspace($workspaceid) as $coupon) {
    $couponout[] = [
        'id' => (int)$coupon->id,
        'code' => (string)$coupon->code,
        'description' => (string)$coupon->description,
        'discounttype' => (string)$coupon->discounttype,
        'discountvalue' => (string)$coupon->discountvalue,
        'maxredemptions' => (int)$coupon->maxredemptions,
        'perstudentlimit' => (int)$coupon->perstudentlimit,
        'redemptioncount' => (int)$coupon->redemptioncount,
        'validfrom' => (int)$coupon->validfrom,
        'validuntil' => (int)$coupon->validuntil,
        'status' => (string)$coupon->status,
    ];
}

$grantout = [];
foreach (pqfin_scholar_grants_for_workspace($workspaceid) as $grant) {
    $nameids[] = (int)$grant->studentid;
    $grantout[] = [
        'id' => (int)$grant->id,
        'grantnumber' => (string)$grant->grantnumber,
        'studentid' => (int)$grant->studentid,
        'name' => (string)$grant->name,
        'discounttype' => (string)$grant->discounttype,
        'discountvalue' => (string)$grant->discountvalue,
        'source' => (string)$grant->source,
        'status' => (string)$grant->status,
        'startdate' => (int)$grant->startdate,
        'enddate' => (int)$grant->enddate,
    ];
}

$policy = pqfin_workspace_finance_policy($workspaceid, $consumercontext);

echo json_encode([
    'ok' => true, 'ready' => true,
    'workspaceid' => $workspaceid,
    'consumerid' => (int)($consumercontext->consumerid ?? 0),
    'payouts' => $payoutout,
    'batches' => $batchout,
    'coupons' => $couponout,
    'grants' => $grantout,
    'payouttransitions' => pqfin_payout_allowed_transitions(),
    'scholarshipautoapply' => (string)($policy['policy']['scholarship_auto_apply'] ?? 'disabled'),
    'couponschemaready' => pqfin_coupon_schema_ready(),
    'batchschemaready' => pqfin_payout_batch_schema_ready(),
    'grantschemaready' => pqfin_scholar_grant_schema_ready(),
    'names' => pqpd_names(array_values(array_unique(array_filter($nameids)))),
], JSON_UNESCAPED_SLASHES);
exit;
