<?php
// Marketplace core library: public tutor reviews (surfacing the previously
// write-only session_rating.comment), automatic commission derivation for
// tutor payouts, and the lesson/tutor dispute flow. Requires accesslib.php.
defined('MOODLE_INTERNAL') || die();

function pqmk_rating_ready(): bool {
    return pqh_table_exists_safe('local_prequran_session_rating');
}

function pqmk_dispute_ready(): bool {
    return pqh_table_exists_safe('local_prequran_lesson_dispute');
}

/**
 * Public reputation summary for a tutor: average star rating, count, and the
 * approved written reviews. Reviews are approved by default (moderation_status
 * default 'approved'); a school can require manual approval by setting
 * marketplace_review_moderation_mode=manual, after which new reviews start
 * 'pending' and only appear once approved. Hidden reviews never appear.
 *
 * @return array{avg: ?float, count: int, reviews: array}
 */
function pqmk_tutor_reputation(int $teacherid, int $limit = 20): array {
    global $DB;

    if ($teacherid <= 0 || !pqmk_rating_ready()) {
        return ['avg' => null, 'count' => 0, 'reviews' => []];
    }
    $columns = $DB->get_columns('local_prequran_session_rating');
    $modclause = '';
    if (isset($columns['moderation_status'])) {
        $modclause .= " AND COALESCE(moderation_status, 'approved') = 'approved'";
    }
    if (isset($columns['hidden'])) {
        $modclause .= ' AND COALESCE(hidden, 0) = 0';
    }
    // Aggregate (all approved ratings count toward the average, comment or not).
    $agg = $DB->get_record_sql(
        "SELECT COUNT(1) AS cnt, AVG(rating) AS avgrating
           FROM {local_prequran_session_rating}
          WHERE teacherid = :tid AND rating > 0" . $modclause,
        ['tid' => $teacherid]);
    $count = (int)($agg->cnt ?? 0);
    $avg = $count > 0 ? round((float)$agg->avgrating, 2) : null;

    // Written reviews only (non-empty comment).
    $reviews = [];
    $rows = $DB->get_records_select('local_prequran_session_rating',
        "teacherid = :tid AND rating > 0 AND " . $DB->sql_isnotempty('local_prequran_session_rating', 'comment', false, false) . $modclause,
        ['tid' => $teacherid], 'timecreated DESC', '*', 0, $limit);
    foreach ($rows as $r) {
        $reviews[] = [
            'rating' => (int)$r->rating,
            'comment' => (string)$r->comment,
            'tutor_reply' => (string)($r->tutor_reply ?? ''),
            'timecreated' => (int)$r->timecreated,
        ];
    }
    return ['avg' => $avg, 'count' => $count, 'reviews' => $reviews];
}

/** Moderate a review (approve/reject/hide) — workspace managers only. */
function pqmk_moderate_review(int $ratingid, int $workspaceid, int $actorid, string $decision): void {
    global $DB;
    if (!pqmk_rating_ready()) {
        throw new invalid_parameter_exception('Ratings are not available.');
    }
    $rating = $DB->get_record('local_prequran_session_rating', ['id' => $ratingid], '*', MUST_EXIST);
    if ((int)$rating->workspaceid !== $workspaceid) {
        throw new invalid_parameter_exception('That review is outside this workspace.');
    }
    $update = (object)['id' => $ratingid, 'timemodified' => time()];
    if ($decision === 'approve') {
        $update->moderation_status = 'approved';
        $update->hidden = 0;
    } else if ($decision === 'reject') {
        $update->moderation_status = 'rejected';
    } else if ($decision === 'hide') {
        $update->hidden = 1;
    } else if ($decision === 'unhide') {
        $update->hidden = 0;
    } else {
        throw new invalid_parameter_exception('Invalid moderation decision.');
    }
    $DB->update_record('local_prequran_session_rating', $update);
    pqmk_audit($workspaceid, (int)$rating->teacherid, $ratingid, 'review_moderated', ['decision' => $decision], $actorid);
}

/** A tutor's public reply to one of their reviews. */
function pqmk_tutor_reply_review(int $ratingid, int $teacherid, string $reply): void {
    global $DB;
    if (!pqmk_rating_ready()) {
        throw new invalid_parameter_exception('Ratings are not available.');
    }
    $rating = $DB->get_record('local_prequran_session_rating', ['id' => $ratingid], '*', MUST_EXIST);
    if ((int)$rating->teacherid !== $teacherid) {
        throw new invalid_parameter_exception('You can only reply to reviews of your own classes.');
    }
    $DB->update_record('local_prequran_session_rating', (object)[
        'id' => $ratingid,
        'tutor_reply' => core_text::substr(trim($reply), 0, 1500),
        'tutor_reply_at' => time(),
        'timemodified' => time(),
    ]);
    pqmk_audit((int)$rating->workspaceid, $teacherid, $ratingid, 'review_reply_added', [], $teacherid);
}

// ---- Commission ------------------------------------------------------------

/**
 * Effective marketplace commission percent for a tutor: the teacher's own
 * override (teacher_profile.marketplace_commission_percent) if set, else the
 * workspace/site default (marketplace_commission_percent config), else 0.
 * Returns a float percentage 0-100.
 */
function pqmk_commission_percent(int $workspaceid, int $teacherid): float {
    global $DB;

    if ($teacherid > 0 && pqh_table_exists_safe('local_prequran_teacher_profile')) {
        $cols = $DB->get_columns('local_prequran_teacher_profile');
        if (isset($cols['marketplace_commission_percent'])) {
            $override = $DB->get_field('local_prequran_teacher_profile', 'marketplace_commission_percent', ['userid' => $teacherid], IGNORE_MULTIPLE);
            if ($override !== false && trim((string)$override) !== '') {
                return max(0.0, min(100.0, (float)preg_replace('/[^0-9.]/', '', (string)$override)));
            }
        }
    }
    $default = trim((string)get_config('local_prequran', 'marketplace_commission_percent'));
    if ($default === '') {
        return 0.0;
    }
    return max(0.0, min(100.0, (float)preg_replace('/[^0-9.]/', '', $default)));
}

// ---- Lesson / tutor disputes ----------------------------------------------

function pqmk_dispute_type_options(): array {
    return ['no_show_teacher' => 'Teacher no-show', 'no_show_student' => 'Student could not attend',
        'quality' => 'Lesson quality concern', 'refund_request' => 'Refund request',
        'behaviour' => 'Conduct concern', 'other' => 'Other'];
}

function pqmk_dispute_outcome_options(): array {
    return ['review' => 'Please review', 'refund' => 'Refund', 'credit' => 'Lesson credit',
        'reschedule' => 'Reschedule', 'apology' => 'Acknowledgement'];
}

function pqmk_raise_dispute(int $workspaceid, $consumercontext, int $raisedby, array $data): int {
    global $DB;
    if (!pqmk_dispute_ready()) {
        throw new invalid_parameter_exception('Dispute schema is not ready. Run the local_prequran upgrade first.');
    }
    $studentid = (int)($data['studentid'] ?? 0);
    if ($studentid <= 0) {
        throw new invalid_parameter_exception('Choose the student the dispute concerns.');
    }
    $type = (string)($data['dispute_type'] ?? 'quality');
    if (!isset(pqmk_dispute_type_options()[$type])) {
        $type = 'quality';
    }
    $outcome = (string)($data['desired_outcome'] ?? 'review');
    if (!isset(pqmk_dispute_outcome_options()[$outcome])) {
        $outcome = 'review';
    }
    $description = trim((string)($data['description'] ?? ''));
    if (core_text::strlen($description) < 10) {
        throw new invalid_parameter_exception('Please describe the issue (at least a sentence).');
    }
    $sessionid = (int)($data['sessionid'] ?? 0);
    $teacherid = (int)($data['teacherid'] ?? 0);
    if ($teacherid <= 0 && $sessionid > 0 && pqh_table_exists_safe('local_prequran_live_session')) {
        $teacherid = (int)$DB->get_field('local_prequran_live_session', 'teacherid', ['id' => $sessionid], IGNORE_MISSING);
    }
    $now = time();
    $id = (int)$DB->insert_record('local_prequran_lesson_dispute', (object)[
        'consumerid' => (int)($consumercontext->consumerid ?? 0),
        'workspaceid' => $workspaceid,
        'studentid' => $studentid,
        'teacherid' => $teacherid,
        'sessionid' => $sessionid,
        'raisedby' => $raisedby,
        'disputenumber' => '',
        'dispute_type' => $type,
        'desired_outcome' => $outcome,
        'description' => $description,
        'status' => 'open',
        'resolution_type' => '',
        'resolution' => '',
        'refundid' => 0,
        'timecreated' => $now,
        'timemodified' => $now,
    ]);
    $DB->set_field('local_prequran_lesson_dispute', 'disputenumber',
        'DSP-' . gmdate('Ym', $now) . '-W' . $workspaceid . '-' . str_pad((string)$id, 5, '0', STR_PAD_LEFT), ['id' => $id]);
    pqmk_audit($workspaceid, $teacherid, $id, 'lesson_dispute_raised', ['type' => $type, 'studentid' => $studentid], $raisedby);
    // Notify workspace managers (best-effort) via the existing provider.
    pqmk_notify_managers($workspaceid, 'New lesson dispute raised',
        'A ' . pqmk_dispute_type_options()[$type] . ' dispute was raised and needs review.');
    return $id;
}

function pqmk_resolve_dispute(int $disputeid, int $workspaceid, $consumercontext, int $actorid, array $data): void {
    global $DB;
    $dispute = $DB->get_record('local_prequran_lesson_dispute', ['id' => $disputeid, 'workspaceid' => $workspaceid], '*', MUST_EXIST);
    $status = (string)($data['status'] ?? 'reviewing');
    if (!in_array($status, ['open', 'reviewing', 'resolved', 'dismissed'], true)) {
        throw new invalid_parameter_exception('Invalid dispute status.');
    }
    $resolutiontype = (string)($data['resolution_type'] ?? '');
    $now = time();
    $update = (object)[
        'id' => $disputeid,
        'status' => $status,
        'resolution_type' => in_array($resolutiontype, ['refund', 'credit', 'apology', 'reschedule', 'dismissed', ''], true) ? $resolutiontype : '',
        'resolution' => core_text::substr(trim((string)($data['resolution'] ?? '')), 0, 4000),
        'timemodified' => $now,
    ];
    if ($status === 'resolved' || $status === 'dismissed') {
        $update->resolvedby = $actorid;
        $update->resolvedat = $now;
    }
    $DB->update_record('local_prequran_lesson_dispute', $update);
    pqmk_audit($workspaceid, (int)$dispute->teacherid, $disputeid, 'lesson_dispute_' . $status,
        ['resolution_type' => $update->resolution_type], $actorid);
}

// ---- shared ----------------------------------------------------------------

function pqmk_audit(int $workspaceid, int $teacherid, int $targetid, string $action, array $details, int $actorid): void {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_course_audit')) {
        return;
    }
    try {
        $DB->insert_record('local_prequran_course_audit', (object)[
            'consumerid' => 0, 'workspaceid' => $workspaceid, 'offeringid' => 0, 'requestid' => 0,
            'studentid' => 0, 'actorid' => $actorid, 'action' => $action,
            'targettype' => 'marketplace', 'targetid' => $targetid,
            'details' => json_encode($details + ['teacherid' => $teacherid], JSON_UNESCAPED_SLASHES),
            'timecreated' => time(),
        ]);
    } catch (Throwable $e) {
        // Audit best-effort.
    }
}

function pqmk_notify_managers(int $workspaceid, string $subject, string $message): void {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_workspace_member')) {
        return;
    }
    try {
        $rows = $DB->get_records_select('local_prequran_workspace_member',
            "workspaceid = :ws AND status = 'active' AND workspace_role IN ('owner','admin','support')",
            ['ws' => $workspaceid], '', 'userid', 0, 50);
        foreach ($rows as $r) {
            $to = core_user::get_user((int)$r->userid);
            if (!$to || !empty($to->deleted) || !empty($to->suspended)) {
                continue;
            }
            $m = new \core\message\message();
            $m->component = 'local_prequran';
            $m->name = 'live_session_update';
            $m->userfrom = core_user::get_noreply_user();
            $m->userto = $to;
            $m->subject = $subject;
            $m->fullmessage = $message;
            $m->fullmessageformat = FORMAT_PLAIN;
            $m->fullmessagehtml = '';
            $m->smallmessage = $subject;
            $m->notification = 1;
            $m->courseid = SITEID;
            message_send($m);
        }
    } catch (Throwable $e) {
        // Best-effort.
    }
}
