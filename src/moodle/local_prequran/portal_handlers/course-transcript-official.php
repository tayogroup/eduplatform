<?php
// Portal handler: course-transcript-official (official transcript draft/issued
// snapshot viewer + registrar writes). Ported from
// local_hubredirect/course_transcript_official.php, which stays live in
// parallel. Runs from portal_data.php AFTER token auth: $claims verified,
// $USER set to the token user, JSON exception handler installed, CORS headers
// sent.
//
//   GET  ?report=course-transcript-official&token=…[&studentid=&documentid=
//         &workspaceid=&consumer=&issued=1]
//   POST ?report=course-transcript-official&token=…[&workspaceid=&consumer=]
//        body JSON:
//          {do:"issue",   studentid, issuereason}          (draft mode)
//          {do:"revoke",  documentid, reason}              (issued mode)
//          {do:"reissue", documentid, reason}              (issued mode)
//
// Writes are the legacy POST actions verbatim (same gates, same lib calls,
// same check order); confirm_sesskey() is dropped — token auth replaces the
// session key — and the legacy redirect becomes an ok JSON carrying the
// documentid the redirect would have targeted. The legacy catch(Throwable)
// re-render-with-error becomes an error JSON with the same message.
// Verification codes/URLs are ported exactly: pqct_verification_code +
// pqct_verification_url from course_transcriptlib, same as the page.
// (course_transcript_official.php has no pqh_live_security_audit calls — none
// to keep; its pqco_course_audit('official_transcript_draft_previewed')
// compliance write IS kept on draft-mode GET, and issued-mode GET writes no
// audit, exactly like the page.)

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/course_transcriptlib.php');
require_once($CFG->dirroot . '/local/hubredirect/course_transcript_uilib.php');

$userid = (int)($claims['sub'] ?? 0);
$ispost = ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST';
$body = [];
$do = '';
if ($ispost) {
    $decoded = json_decode((string)file_get_contents('php://input'), true);
    $body = is_array($decoded) ? $decoded : [];
    $do = (string)($body['do'] ?? '');
    if (!in_array($do, ['issue', 'revoke', 'reissue'], true)) {
        pqpd_fail(400, 'Unknown official-transcript action.');
    }
}

// ---- request parameters (verbatim reads from the page; POST ids may also
// ---- arrive in the JSON body since text/plain posts leave $_POST empty) ------
$consumercontext = pqh_requested_consumer_context();
$workspaceid = optional_param('workspaceid', (int)($consumercontext->workspaceid ?? 0), PARAM_INT);
if ($ispost && isset($body['workspaceid'])) {
    $workspaceid = clean_param($body['workspaceid'], PARAM_INT);
}
$workspaceid = pqh_current_workspace_id($userid, $workspaceid);
$studentid = optional_param('studentid', 0, PARAM_INT);
if ($ispost && isset($body['studentid'])) {
    $studentid = clean_param($body['studentid'], PARAM_INT);
}
$documentid = trim(optional_param('documentid', '', PARAM_TEXT));
if ($ispost && isset($body['documentid'])) {
    $documentid = trim(clean_param((string)$body['documentid'], PARAM_TEXT));
}
$issued = optional_param('issued', 0, PARAM_INT);
$snapshot = [];

$baseparams = [];
if (!empty($consumercontext->consumerslug)) {
    $baseparams['consumer'] = (string)$consumercontext->consumerslug;
}
if ($workspaceid > 0) {
    $baseparams['workspaceid'] = $workspaceid;
}

// Legacy required_param('reason'/'issuereason') → the JSON body must carry the
// key; the value is trimmed exactly like the page.
$requirereason = static function(array $body, string $key): string {
    if (!array_key_exists($key, $body)) {
        pqpd_fail(400, 'A registrar reason is required (' . $key . ').');
    }
    return trim(clean_param((string)$body[$key], PARAM_TEXT));
};

if ($documentid !== '') {
    // ---- issued mode: same entry gate as the page ----------------------------
    $doc = pqct_load_official_transcript_doc($documentid, $userid);
    if (!$doc) {
        pqpd_fail(403, 'The requested official transcript could not be found or is outside your workspace access.');
    }
    $workspaceid = (int)$doc->workspaceid;
    $studentid = (int)$doc->studentid;
    $baseparams['workspaceid'] = $workspaceid;
    if ($ispost) {
        // confirm_sesskey() dropped: token auth replaces the session key.
        try {
            if ($do === 'revoke') {
                pqct_revoke_official_transcript($documentid, $userid, $requirereason($body, 'reason'));
                // Legacy: redirect back to the same documentid.
                echo json_encode([
                    'ok' => true,
                    'message' => 'Official transcript revoked.',
                    'documentid' => $documentid,
                ], JSON_UNESCAPED_SLASHES);
                exit;
            }
            if ($do === 'reissue') {
                $issuedrecord = pqct_reissue_official_transcript($documentid, $userid, $consumercontext, $requirereason($body, 'reason'));
                // Legacy: redirect to the replacement documentid with issued=1.
                echo json_encode([
                    'ok' => true,
                    'message' => 'Official transcript reissued.',
                    'documentid' => (string)$issuedrecord['record']->documentid,
                    'issued' => 1,
                ], JSON_UNESCAPED_SLASHES);
                exit;
            }
            pqpd_fail(400, 'This action is not available for an issued official transcript.');
        } catch (Throwable $e) {
            // Legacy re-renders the page with the error message.
            pqpd_fail(400, $e->getMessage());
        }
    }
    $snapshot = json_decode((string)$doc->snapshotjson, true);
    $snapshot = is_array($snapshot) ? $snapshot : [];
    $payload = [
        'header' => $snapshot['header'] ?? [],
        'lines' => $snapshot['lines'] ?? [],
        'summary' => $snapshot['summary'] ?? [],
        'policy' => $snapshot['policy'] ?? [],
        'warnings' => $snapshot['warnings'] ?? [],
    ];
    $mode = 'issued';
} else {
    // ---- draft mode: same entry gates + same order as the page ---------------
    if ($workspaceid <= 0 || !pqh_user_can_manage_workspace($userid, $workspaceid)) {
        pqpd_fail(403, 'Only workspace admins can draft or issue official transcripts.');
    }
    if (!pqct_document_schema_ready()) {
        pqpd_fail(403, 'Official transcript document tables are not ready yet. Run the local_prequran plugin upgrade first.');
    }
    if ($studentid <= 0) {
        $students = pqct_students_for_transcript_viewer($userid, $workspaceid);
        if ($students) {
            $studentid = (int)array_key_first($students);
        }
    }
    if ($studentid <= 0 || !pqct_user_can_view_student_transcript($userid, $studentid, $workspaceid)) {
        pqpd_fail(403, 'Choose a valid managed student before drafting an official transcript.');
    }

    if ($do === 'issue' && $ispost) {
        // confirm_sesskey() dropped: token auth replaces the session key.
        try {
            $reason = $requirereason($body, 'issuereason');
            $issuedrecord = pqct_issue_official_transcript($studentid, $workspaceid, $consumercontext, $userid, $reason);
            // Legacy: redirect to the new documentid with issued=1.
            echo json_encode([
                'ok' => true,
                'message' => 'Official transcript issued and stored as a snapshot.',
                'documentid' => (string)$issuedrecord['record']->documentid,
                'issued' => 1,
            ], JSON_UNESCAPED_SLASHES);
            exit;
        } catch (Throwable $e) {
            pqpd_fail(400, $e->getMessage());
        }
    }
    if ($ispost) {
        pqpd_fail(400, 'This action is only available for an issued official transcript.');
    }

    $payload = pqct_resolve_student_transcript($studentid, $workspaceid, $consumercontext, [
        'viewerid' => $userid,
        'include_internal' => false,
    ]);
    $blockers = pqct_official_issue_blockers($payload);
    pqco_course_audit('official_transcript_draft_previewed', 'student', $studentid, [
        'workspaceid' => $workspaceid,
        'consumerid' => (int)($consumercontext->consumerid ?? 0),
        'studentid' => $studentid,
        'blocker_count' => count($blockers),
    ]);
    $recentdocs = pqct_recent_official_transcript_docs($studentid, $workspaceid, 8);
    $mode = 'draft';
}

$header = $payload['header'] ?? [];
$student = $header['student'] ?? [];
$workspace = $header['workspace'] ?? [];
$lines = $payload['lines'] ?? [];
$summary = $payload['summary'] ?? [];
$policy = $payload['policy'] ?? [];
$docmeta = $snapshot['document'] ?? [];
$verificationurl = '';
if ($mode === 'issued') {
    $recentdocs = [];
    $blockers = [];
    // Verification code/URL ported exactly as legacy.
    $verificationurl = pqct_verification_url($consumercontext, $documentid, pqct_verification_code($doc));
}

// Pre-render the per-line display strings server-side with the verbatim page
// helpers (userdate honours the token user's language/timezone) so the portal
// page mirrors the legacy formatting exactly.
$linesout = [];
foreach ($lines as $line) {
    $line['render'] = [
        'status_label' => pqctol_status_label((string)($line['status']['normalized'] ?? 'unknown')),
        'grade' => pqctol_snapshot_value($line, 'grade'),
        'completion' => pqctol_snapshot_value($line, 'completion'),
        'attendance' => pqctol_snapshot_value($line, 'attendance'),
        'warning_count' => count($line['warnings'] ?? []),
    ];
    $linesout[] = $line;
}

$recentout = [];
foreach ($recentdocs as $recent) {
    $recentout[] = [
        'documentid' => (string)$recent->documentid,
        'status' => (string)$recent->status,
        'status_label' => pqctol_status_label((string)$recent->status),
        'issuedat' => (int)$recent->issuedat,
        'issued_label' => pqctol_date((int)$recent->issuedat),
        'snapshothash' => substr((string)$recent->snapshothash, 0, 16),
        'legacy_url' => (new moodle_url('/local/hubredirect/course_transcript_official.php', $baseparams + ['documentid' => (string)$recent->documentid]))->out(false),
    ];
}

// Legacy action buttons stay links to the live Moodle pages (parallel-run);
// PDF/CSV exports keep their legacy audit + bytes when opened from here.
$links = [
    'unofficial' => pqct_transcript_url($studentid, $workspaceid, $consumercontext)->out(false),
    'controls' => (new moodle_url('/local/hubredirect/transcript_controls.php', $baseparams + ['studentid' => $studentid, 'documentid' => $documentid]))->out(false),
    'readiness' => (new moodle_url('/local/hubredirect/transcript_readiness.php', $baseparams))->out(false),
    'workspace' => (new moodle_url('/local/hubredirect/workspace_dashboard.php', $baseparams))->out(false),
];
if ($mode === 'issued') {
    $links['pdf'] = (new moodle_url('/local/hubredirect/course_transcript_export.php', $baseparams + ['type' => 'official', 'format' => 'pdf', 'documentid' => $documentid]))->out(false);
    $links['csv'] = (new moodle_url('/local/hubredirect/course_transcript_export.php', $baseparams + ['type' => 'official', 'format' => 'csv', 'documentid' => $documentid]))->out(false);
}

$docout = null;
if ($mode === 'issued') {
    $docout = [
        'documentid' => (string)($docmeta['documentid'] ?? $documentid),
        'status' => (string)($doc->status ?? 'issued'),
        'status_label' => pqctol_status_label((string)($doc->status ?? 'issued')),
        'issuedat' => (int)($docmeta['issuedat'] ?? $doc->issuedat ?? 0),
        'issued_label' => pqctol_date((int)($docmeta['issuedat'] ?? $doc->issuedat ?? 0)),
        'snapshothash' => substr((string)($doc->snapshothash ?? ''), 0, 16),
        'replacedbydocumentid' => (string)($doc->replacedbydocumentid ?? ''),
        'revocationreason' => (string)($doc->revocationreason ?? ''),
        'can_registrar_act' => in_array((string)($doc->status ?? ''), ['issued', 'reissued', 'stale'], true),
    ];
}

echo json_encode([
    'ok' => true, 'ready' => true,
    'mode' => $mode,
    'issued' => $issued,
    'workspaceid' => $workspaceid,
    'studentid' => $studentid,
    'documentid' => $documentid,
    'header' => [
        'student' => $student,
        'workspace' => $workspace,
    ],
    'policyhash' => substr((string)($policy['policyhash'] ?? ($header['policy']['hash'] ?? '')), 0, 16),
    'summary' => $summary,
    'warning_count' => (int)($summary['warning_count'] ?? count($payload['warnings'] ?? [])),
    'lines' => $linesout,
    'blockers' => array_values($blockers),
    'doc' => $docout,
    'verificationurl' => $verificationurl,
    'recentdocs' => $recentout,
    'links' => $links,
    'names' => pqpd_names([$studentid]),
], JSON_UNESCAPED_SLASHES);
exit;
