<?php
// Portal handler: tutor-storefront (a tutor's own marketplace controls). Edit
// structured rate + trial offer, reply to reviews, and view an earnings
// statement (own payouts) — the tutor-facing side the marketplace lacked.
defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/marketplace_core_portallib.php');

$userid = (int)($claims['sub'] ?? 0);
if ($userid <= 0) {
    pqpd_fail(403, 'Sign in to manage your tutor storefront.');
}

$body = [];
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    $decoded = json_decode((string)file_get_contents('php://input'), true);
    $body = is_array($decoded) ? $decoded : [];
}

if (!pqh_table_exists_safe('local_prequran_teacher_profile')) {
    pqpd_fail(503, 'Tutor profiles are not available.');
}
$profile = $DB->get_record('local_prequran_teacher_profile', ['userid' => $userid], '*', IGNORE_MISSING);
if (!$profile) {
    pqpd_fail(403, 'You do not have a tutor profile.');
}

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    $braw = static function (string $k, string $d = '') use ($body): string {
        return trim((string)($body[$k] ?? $d));
    };
    try {
        $do = clean_param((string)($body['do'] ?? ''), PARAM_ALPHANUMEXT);
        if ($do === 'save_pricing') {
            $columns = $DB->get_columns('local_prequran_teacher_profile');
            $update = (object)['id' => (int)$profile->id];
            if (isset($columns['hourly_rate'])) {
                $update->hourly_rate = number_format((float)preg_replace('/[^0-9.]/', '', $braw('hourly_rate', '0')), 2, '.', '');
            }
            if (isset($columns['rate_currency'])) {
                $update->rate_currency = core_text::substr(clean_param((string)($body['rate_currency'] ?? 'USD'), PARAM_ALPHANUMEXT), 0, 10);
            }
            if (isset($columns['session_length_minutes'])) {
                $update->session_length_minutes = max(0, min(600, (int)($body['session_length_minutes'] ?? 0)));
            }
            if (isset($columns['trial_available'])) {
                $update->trial_available = !empty($body['trial_available']) ? 1 : 0;
            }
            if (isset($columns['trial_rate'])) {
                $update->trial_rate = number_format((float)preg_replace('/[^0-9.]/', '', $braw('trial_rate', '0')), 2, '.', '');
            }
            $DB->update_record('local_prequran_teacher_profile', $update);
            pqmk_audit(0, $userid, (int)$profile->id, 'tutor_pricing_saved', [], $userid);
            echo json_encode(['ok' => true, 'message' => 'Pricing and trial details saved.'], JSON_UNESCAPED_SLASHES);
            exit;
        }
        if ($do === 'reply_review') {
            pqmk_tutor_reply_review((int)($body['ratingid'] ?? 0), $userid, (string)($body['reply'] ?? ''));
            echo json_encode(['ok' => true, 'message' => 'Reply posted to the review.'], JSON_UNESCAPED_SLASHES);
            exit;
        }
        pqpd_fail(400, 'Choose a valid storefront action.');
    } catch (Throwable $e) {
        pqpd_fail(400, $e->getMessage());
    }
}

// -- GET: pricing, reviews (own), earnings ------------------------------------
$rep = pqmk_tutor_reputation($userid, 50);

// Earnings statement — this tutor's own payouts + totals.
$payouts = [];
$totgross = 0.0;
$totnet = 0.0;
$totpaid = 0.0;
if (pqh_table_exists_safe('local_prequran_market_payout')) {
    $rows = $DB->get_records('local_prequran_market_payout', ['teacherid' => $userid], 'timecreated DESC', '*', 0, 200);
    foreach ($rows as $p) {
        $gross = (float)preg_replace('/[^0-9.]/', '', (string)$p->grossamount);
        $net = (float)preg_replace('/[^0-9.]/', '', (string)$p->payoutamount);
        $totgross += $gross;
        $totnet += $net;
        if ((string)$p->status === 'paid') {
            $totpaid += $net;
        }
        $payouts[] = [
            'payoutnumber' => (string)$p->payoutnumber,
            'currency' => (string)$p->currency,
            'grossamount' => (string)$p->grossamount,
            'platformfee' => (string)$p->platformfee,
            'payoutamount' => (string)$p->payoutamount,
            'status' => (string)$p->status,
            'paidat' => (int)($p->paidat ?? 0),
        ];
    }
}

echo json_encode([
    'ok' => true, 'ready' => true,
    'teacherid' => $userid,
    'pricing' => [
        'hourly_rate' => (string)($profile->hourly_rate ?? ''),
        'rate_currency' => (string)($profile->rate_currency ?? 'USD'),
        'session_length_minutes' => (int)($profile->session_length_minutes ?? 0),
        'trial_available' => (int)($profile->trial_available ?? 0) === 1,
        'trial_rate' => (string)($profile->trial_rate ?? ''),
    ],
    'reputation' => ['avg' => $rep['avg'], 'count' => $rep['count']],
    'reviews' => (function () use ($DB, $userid) {
        $out = [];
        if (!pqh_table_exists_safe('local_prequran_session_rating')) {
            return $out;
        }
        $rows = $DB->get_records_select('local_prequran_session_rating',
            "teacherid = :tid AND rating > 0", ['tid' => $userid], 'timecreated DESC', 'id,rating,comment,tutor_reply,moderation_status,hidden,timecreated', 0, 50);
        foreach ($rows as $r) {
            $out[] = [
                'id' => (int)$r->id,
                'rating' => (int)$r->rating,
                'comment' => (string)$r->comment,
                'tutor_reply' => (string)($r->tutor_reply ?? ''),
                'moderation_status' => (string)($r->moderation_status ?? 'approved'),
                'hidden' => (int)($r->hidden ?? 0),
                'timecreated' => (int)$r->timecreated,
            ];
        }
        return $out;
    })(),
    'earnings' => [
        'payouts' => $payouts,
        'total_gross' => number_format($totgross, 2, '.', ''),
        'total_net' => number_format($totnet, 2, '.', ''),
        'total_paid' => number_format($totpaid, 2, '.', ''),
    ],
], JSON_UNESCAPED_SLASHES);
exit;
