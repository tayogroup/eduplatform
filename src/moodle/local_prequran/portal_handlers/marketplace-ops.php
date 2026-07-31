<?php
// Portal handler: marketplace-ops (workspace admin). Review moderation + lesson
// dispute resolution — the marketplace had no review moderation and no lesson/
// tutor dispute flow.
defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/marketplace_core_portallib.php');

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
    pqpd_fail(403, 'Marketplace operations require workspace administrator access.');
}

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    $bint = static function (string $k, int $d = 0) use ($body): int {
        return isset($body[$k]) ? (int)$body[$k] : $d;
    };
    $balnum = static function (string $k, string $d = '') use ($body): string {
        return clean_param((string)($body[$k] ?? $d), PARAM_ALPHANUMEXT);
    };
    try {
        $do = clean_param((string)($body['do'] ?? ''), PARAM_ALPHANUMEXT);
        if ($do === 'moderate_review') {
            pqmk_moderate_review($bint('ratingid'), $workspaceid, $userid, $balnum('decision', 'approve'));
            echo json_encode(['ok' => true, 'message' => 'Review updated.'], JSON_UNESCAPED_SLASHES);
            exit;
        }
        if ($do === 'resolve_dispute') {
            pqmk_resolve_dispute($bint('disputeid'), $workspaceid, $consumercontext, $userid, [
                'status' => $balnum('status', 'reviewing'),
                'resolution_type' => $balnum('resolution_type', ''),
                'resolution' => (string)($body['resolution'] ?? ''),
            ]);
            echo json_encode(['ok' => true, 'message' => 'Dispute updated.'], JSON_UNESCAPED_SLASHES);
            exit;
        }
        pqpd_fail(400, 'Choose a valid marketplace-ops action.');
    } catch (Throwable $e) {
        pqpd_fail(400, $e->getMessage());
    }
}

// -- GET: reviews needing attention + disputes --------------------------------
$nameids = [];
$reviews = [];
if (pqmk_rating_ready()) {
    $rows = $DB->get_records_select('local_prequran_session_rating',
        "workspaceid = :ws AND rating > 0 AND " . $DB->sql_isnotempty('local_prequran_session_rating', 'comment', false, false),
        ['ws' => $workspaceid], 'timecreated DESC', '*', 0, 200);
    foreach ($rows as $r) {
        $nameids[] = (int)$r->teacherid;
        $nameids[] = (int)$r->raterid;
        $reviews[] = [
            'id' => (int)$r->id,
            'teacherid' => (int)$r->teacherid,
            'raterid' => (int)$r->raterid,
            'rating' => (int)$r->rating,
            'comment' => (string)$r->comment,
            'tutor_reply' => (string)($r->tutor_reply ?? ''),
            'moderation_status' => (string)($r->moderation_status ?? 'approved'),
            'hidden' => (int)($r->hidden ?? 0),
            'timecreated' => (int)$r->timecreated,
        ];
    }
}

$disputes = [];
if (pqmk_dispute_ready()) {
    $rows = $DB->get_records_select('local_prequran_lesson_dispute',
        "workspaceid = :ws", ['ws' => $workspaceid],
        "CASE WHEN status IN ('resolved','dismissed') THEN 1 ELSE 0 END ASC, timecreated DESC", '*', 0, 200);
    foreach ($rows as $d) {
        $nameids[] = (int)$d->studentid;
        $nameids[] = (int)$d->teacherid;
        $disputes[] = [
            'id' => (int)$d->id,
            'disputenumber' => (string)$d->disputenumber,
            'studentid' => (int)$d->studentid,
            'teacherid' => (int)$d->teacherid,
            'sessionid' => (int)$d->sessionid,
            'dispute_type' => (string)$d->dispute_type,
            'desired_outcome' => (string)$d->desired_outcome,
            'description' => (string)$d->description,
            'status' => (string)$d->status,
            'resolution_type' => (string)$d->resolution_type,
            'resolution' => (string)$d->resolution,
            'timecreated' => (int)$d->timecreated,
        ];
    }
}

echo json_encode([
    'ok' => true, 'ready' => true,
    'workspaceid' => $workspaceid,
    'reviews' => $reviews,
    'disputes' => $disputes,
    'dispute_type_options' => pqmk_dispute_type_options(),
    'dispute_outcome_options' => pqmk_dispute_outcome_options(),
    'moderation_mode' => (string)get_config('local_prequran', 'marketplace_review_moderation_mode'),
    'names' => pqpd_names(array_values(array_unique(array_filter($nameids)))),
], JSON_UNESCAPED_SLASHES);
exit;
