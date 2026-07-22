<?php
// ---- report: parent-trust (parent live-class hub; read + parent/staff writes) ----
// Ported from local_hubredirect/live_parent_trust.php via parent_trust_portallib
// (pqlptl_*). Included from portal_data.php AFTER token auth: $claims verified,
// $USER set to the token user, JSON exception handler installed, headers sent.
// GET  = the per-child parent trust dashboard state (chooser if multi-child).
// POST = do=ack_series_change (parent schedule acknowledgement, verbatim upsert
//        + audit) or do=log_support_case (staff support reason, audit-only).

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/parent_trust_portallib.php');
require_once($CFG->dirroot . '/user/profile/lib.php');

$userid = (int)($claims['sub'] ?? 0);

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    $body = json_decode((string)file_get_contents('php://input'), true);
    $do = is_array($body) ? (string)($body['do'] ?? '') : '';

    // -- write: ack_series_change (legacy action=ack_series_change, verbatim) --
    // confirm_sesskey() dropped: token auth replaces the session key.
    if ($do === 'ack_series_change') {
        $seriesid = (int)($body['seriesid'] ?? 0);
        $studentid = (int)($body['studentid'] ?? 0);
        if ($seriesid <= 0 || $studentid <= 0) {
            pqpd_fail(403, 'Choose a valid recurring class before acknowledging a schedule change.');
        }
        if (!pqlptl_parent_can_access_child($userid, $studentid)) {
            pqpd_fail(403, 'Only linked parents can acknowledge schedule changes.');
        }
        if (!pqlptl_table_exists('local_prequran_live_ack')) {
            pqpd_fail(403, 'Schedule acknowledgement is not installed yet.');
        }
        $latestchange = pqlptl_latest_series_change($seriesid);
        $now = time();
        $record = pqlptl_ack_record($seriesid, $studentid, $userid);
        if ($record) {
            $record->ack_status = 'acknowledged';
            $record->acknowledgedat = $now;
            $record->lastchangeat = $latestchange;
            $record->timemodified = $now;
            $DB->update_record('local_prequran_live_ack', $record);
        } else {
            $DB->insert_record('local_prequran_live_ack', (object)[
                'seriesid' => $seriesid,
                'studentid' => $studentid,
                'parentid' => $userid,
                'ack_status' => 'acknowledged',
                'ack_message' => '',
                'acknowledgedat' => $now,
                'lastchangeat' => $latestchange,
                'remindedat' => 0,
                'timecreated' => $now,
                'timemodified' => $now,
            ]);
        }
        pqlptl_audit(0, 'series_schedule_acknowledged', 'series', $seriesid, [
            'studentid' => $studentid,
            'parentid' => $userid,
            'source' => 'parent_trust_dashboard',
            'lastchangeat' => $latestchange,
        ]);
        echo json_encode([
            'ok' => true,
            'message' => 'Schedule acknowledgement saved.',
            'seriesid' => $seriesid,
            'studentid' => $studentid,
        ], JSON_UNESCAPED_SLASHES);
        exit;
    }

    // -- write: log_support_case (legacy action=log_support_case, verbatim) --
    if ($do === 'log_support_case') {
        $studentid = (int)($body['studentid'] ?? 0);
        if ($studentid <= 0) {
            pqpd_fail(403, 'Choose a valid student before saving a support case.');
        }
        if (!pqlptl_staff_can_preview_child($userid, $studentid)) {
            pqpd_fail(403, 'Only authorized staff can log parent trust support cases.');
        }
        $reason = clean_param((string)($body['support_reason'] ?? 'other'), PARAM_ALPHANUMEXT);
        $reasonoptions = pqlptl_support_reason_options();
        if (!array_key_exists($reason, $reasonoptions)) {
            $reason = 'other';
        }
        $casenote = clean_param((string)($body['case_note'] ?? ''), PARAM_TEXT);
        $casestatus = clean_param((string)($body['case_status'] ?? 'open'), PARAM_ALPHANUMEXT);
        if (!in_array($casestatus, ['open', 'resolved', 'escalated'], true)) {
            $casestatus = 'open';
        }
        $details = [
            'viewerid' => $userid,
            'support_reason' => $reason,
            'support_reason_label' => $reasonoptions[$reason],
            'case_status' => $casestatus,
            'case_note' => $casenote,
            'source' => 'parent_trust_support_panel',
        ];
        pqlptl_audit(0, 'parent_trust_preview_opened', 'student', $studentid, $details);
        pqlptl_audit(0, 'parent_trust_support_case_logged', 'student', $studentid, $details);
        echo json_encode([
            'ok' => true,
            'message' => 'Support reason and case note saved to the audit trail.',
            'studentid' => $studentid,
        ], JSON_UNESCAPED_SLASHES);
        exit;
    }

    pqpd_fail(400, 'Unknown parent-trust action.');
}

// -- GET: the parent trust dashboard state (same resolution order as the page) --
$childid = optional_param('childid', 0, PARAM_INT);

if ($childid > 0 && !pqlptl_user_can_access_child($userid, $childid)) {
    pqpd_fail(403, 'You cannot view the parent live-class hub for this student.');
}

$modechildren = is_siteadmin($USER) ? [] : pqlptl_parent_children($userid);
if (!$modechildren && pqlptl_has_teacher_role($userid)) {
    $modechildren = pqlptl_teacher_students($userid);
}
if ($childid <= 0 && count($modechildren) === 1) {
    $childid = (int)$modechildren[0]['studentid'];
}

$child = $childid > 0 ? core_user::get_user($childid) : null;
$childname = $child ? fullname($child) : ($childid > 0 ? 'Student ' . $childid : 'your student');
$upcoming = $childid > 0 ? pqlptl_upcoming_sessions($childid, 5) : [];
$summaries = $childid > 0 ? pqlptl_public_summaries($childid, 4) : [];
$recordings = $childid > 0 ? pqlptl_visible_recordings($childid, 3) : [];
$seriesrows = $childid > 0 ? pqlptl_series_rows($childid) : [];
$openfollowups = array_values(array_filter($summaries, static function($summary): bool {
    return (string)($summary->followup_status ?? 'none') !== 'none' && empty($summary->followup_resolved);
}));
$homeworkrows = array_values(array_filter($summaries, static function($summary): bool {
    return trim((string)($summary->homework ?? '') . ' ' . (string)($summary->homework_unitid ?? '')) !== '';
}));
$supportmode = $childid > 0 && pqlptl_staff_can_preview_child($userid, $childid);
$canackasparent = $childid > 0 && !$supportmode && pqlptl_parent_can_access_child($userid, $childid);
$linkedparents = $supportmode ? pqlptl_linked_parents($childid) : [];
$pendingackcount = $supportmode ? pqlptl_pending_ack_count($childid) : 0;
$missingitems = $supportmode ? pqlptl_support_missing_items() : [];

// The page audits every fresh staff preview (rate-limited to one per hour) —
// keep the same compliance write on the portal read.
if ($supportmode && !pqlptl_recent_staff_preview_audit_exists($childid)) {
    pqlptl_audit(0, 'parent_trust_preview_opened', 'student', $childid, [
        'viewerid' => $userid,
        'linked_parents' => count($linkedparents),
        'upcoming_sessions' => count($upcoming),
        'visible_summaries' => count($summaries),
        'open_followups' => count($openfollowups),
        'visible_recordings' => count($recordings),
        'pending_acknowledgements' => $pendingackcount,
    ]);
}

$diagnostics = [];
if ($childid > 0) {
    if (!pqlptl_table_exists('local_prequran_live_ack')) {
        $diagnostics[] = 'Schedule read receipts are not enabled yet.';
    }
    if (!$upcoming) {
        $diagnostics[] = 'No upcoming live sessions are currently scheduled.';
    }
    if (!$summaries) {
        $diagnostics[] = 'No parent-visible teacher summaries are ready yet.';
    }
    if (!$recordings) {
        $diagnostics[] = 'No approved live-class recordings are available yet.';
    }
    if (!pqlptl_parent_can_access_child($userid, $childid) && !is_siteadmin($USER) && $userid !== $childid) {
        $diagnostics[] = 'This login is not linked as a parent for this student.';
    }
    if ($supportmode && !$linkedparents) {
        $diagnostics[] = 'Staff preview: no linked parent/guardian record was found for this student.';
    }
}

// Decorate for the client (join window + focus activity computed server-side,
// same helpers the page uses inline while rendering).
foreach ($upcoming as $session) {
    [$joinstate, $joinlabel] = pqlptl_join_state($session);
    $session->join_state = $joinstate;
    $session->join_label = $joinlabel;
}
foreach ($summaries as $summary) {
    $activity = pqlptl_focus_summary($childid, (int)$summary->sessionid);
    $activity['active_label'] = pqlptl_focus_minutes((int)$activity['active_ms']);
    $activity['step_label'] = pqlptl_focus_step_label((string)$activity['current_step']);
    $summary->focus = $activity;
}
$seriesout = [];
foreach ($seriesrows as $series) {
    $latestchange = pqlptl_latest_series_change((int)$series->id);
    $ack = pqlptl_ack_record((int)$series->id, $childid, $userid);
    $current = $ack && (string)$ack->ack_status === 'acknowledged' && (int)$ack->acknowledgedat >= $latestchange;
    $series->latestchange = $latestchange;
    $series->ack_status = $ack ? (string)$ack->ack_status : '';
    $series->acknowledgedat = $ack ? (int)$ack->acknowledgedat : 0;
    $series->ack_current = (bool)$current;
    $series->needs_ack = $latestchange > 0 && !$current;
    $seriesout[] = $series;
}
foreach ($linkedparents as $i => $parent) {
    $linkedparents[$i]['account_label'] = pqh_account_no_label((int)$parent['userid']);
}

$nameids = [];
foreach (array_merge($upcoming, $summaries, $recordings) as $row) {
    $nameids[] = (int)($row->teacherid ?? 0);
}

echo json_encode([
    'ok' => true, 'ready' => true,
    'mode' => $childid > 0 ? 'child' : 'chooser',
    'child' => ['id' => $childid, 'name' => $childname],
    'children' => $modechildren,
    'upcoming' => array_values($upcoming),
    'summaries' => array_values($summaries),
    'openfollowups' => $openfollowups,
    'homework' => $homeworkrows,
    'recordings' => array_values($recordings),
    'series' => $seriesout,
    'supportmode' => $supportmode,
    'canackasparent' => $canackasparent,
    'linkedparents' => $linkedparents,
    'pendingackcount' => $pendingackcount,
    'missingitems' => $missingitems,
    'supportreasons' => pqlptl_support_reason_options(),
    'supporturl' => $supportmode ? $CFG->wwwroot . '/local/hubredirect/live_parent_trust.php?childid=' . $childid : '',
    'diagnostics' => $diagnostics,
    'names' => pqpd_names($nameids),
], JSON_UNESCAPED_SLASHES);
exit;
