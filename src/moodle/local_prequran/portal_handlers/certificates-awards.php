<?php
// ---- report: certificates-awards (certificate templates & completion awards) --
// Ported from local_hubredirect/certificates_awards.php. The legacy page defines
// no functions of its own, so there is nothing in certificates_awards_portallib
// beyond its guard — every helper is shared (pqcp_* in
// certificates_placementlib.php, pqh_* in accesslib.php). Included from
// portal_data.php AFTER token auth: $claims verified, $USER set to the token
// user, JSON exception handler installed, headers sent.
// GET  = the workspace's certificate templates, completion awards (with student
//        names), course offerings, students, and award audit — as the legacy
//        page builds them, plus legacy PDF-download URLs.
// POST = do=save_template | issue_award | revoke_award — each the legacy
//        action=... write VERBATIM (same records, guards and messages).
//        require_sesskey() dropped: token auth replaces the session key. PDF
//        rendering/serving stays on the legacy document_pdf.php URL (not ported);
//        issue_award's certificate-document *registration* is a shared-lib DB
//        write and is kept.

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/certificates_placementlib.php');
require_once($CFG->dirroot . '/local/hubredirect/certificates_awards_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

$ispost = ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST';
$body = [];
if ($ispost) {
    $decoded = json_decode((string)file_get_contents('php://input'), true);
    $body = is_array($decoded) ? $decoded : [];
}

// -- workspace resolution + entry access check (same order and message as the
// -- legacy page): current-workspace fallback then registrar.manage capability.
$requestedworkspaceid = $ispost
    ? (int)($body['workspaceid'] ?? 0)
    : optional_param('workspaceid', 0, PARAM_INT);
$workspaceid = pqh_current_workspace_id($userid, $requestedworkspaceid);
if ($workspaceid <= 0 || !pqh_user_has_workspace_capability($userid, $workspaceid, 'registrar.manage')) {
    pqpd_fail(403, 'Certificates and awards require registrar or administrator access.');
}
$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', IGNORE_MISSING);
if (!$workspace) {
    pqpd_fail(403, 'Choose a valid workspace before opening certificates and awards.');
}

if ($ispost) {
    // Legacy wraps every write in try/catch and shows the message as the page
    // alert — same behaviour, delivered as JSON. require_sesskey() dropped.
    try {
        if (!pqcp_ready()) {
            throw new invalid_parameter_exception('Certificate tables are not ready. Run Moodle upgrade.');
        }
        $do = clean_param((string)($body['do'] ?? ''), PARAM_ALPHANUMEXT);
        $now = time();
        $message = '';
        if ($do === 'save_template') {
            // -- write: save_template (legacy action=save_template, verbatim) --
            $templateid = (int)($body['templateid'] ?? 0);
            $existing = $templateid > 0 ? $DB->get_record('local_prequran_cert_template', ['id' => $templateid, 'workspaceid' => $workspaceid], '*', IGNORE_MISSING) : false;
            $record = (object)[
                'workspaceid' => $workspaceid,
                'template_key' => clean_param((string)($body['template_key'] ?? ''), PARAM_ALPHANUMEXT),
                'title' => clean_param((string)($body['title'] ?? ''), PARAM_TEXT),
                'award_type' => clean_param((string)($body['award_type'] ?? 'completion'), PARAM_ALPHANUMEXT),
                'body_template' => clean_param((string)($body['body_template'] ?? ''), PARAM_TEXT),
                'designjson' => pqcp_json(['accent' => clean_param((string)($body['accent'] ?? '#2f6f4e'), PARAM_TEXT), 'seal' => clean_param((string)($body['seal'] ?? ''), PARAM_TEXT)]),
                'status' => clean_param((string)($body['status'] ?? 'active'), PARAM_ALPHANUMEXT),
                'createdby' => (int)($existing->createdby ?? $USER->id),
                'timecreated' => (int)($existing->timecreated ?? $now),
                'timemodified' => $now,
            ];
            if ($existing) {
                $record->id = (int)$existing->id;
                $DB->update_record('local_prequran_cert_template', $record);
                $message = 'Certificate template updated.';
            } else {
                $DB->insert_record('local_prequran_cert_template', $record);
                $message = 'Certificate template created.';
            }
        } else if ($do === 'issue_award') {
            // -- write: issue_award (legacy action=issue_award, verbatim) --
            $awardid = (int)($body['awardid'] ?? 0);
            $existing = $awardid > 0 ? $DB->get_record('local_prequran_completion_award', ['id' => $awardid, 'workspaceid' => $workspaceid], '*', IGNORE_MISSING) : false;
            $record = (object)[
                'workspaceid' => $workspaceid,
                'studentid' => (int)($body['studentid'] ?? (int)($existing->studentid ?? 0)),
                'offeringid' => (int)($body['offeringid'] ?? (int)($existing->offeringid ?? 0)),
                'courseid' => (int)($body['courseid'] ?? (int)($existing->courseid ?? 0)),
                'templateid' => (int)($body['templateid'] ?? (int)($existing->templateid ?? 0)),
                'awardnumber' => clean_param((string)($body['awardnumber'] ?? (string)($existing->awardnumber ?? '')), PARAM_TEXT),
                'award_type' => clean_param((string)($body['award_type'] ?? 'completion'), PARAM_ALPHANUMEXT),
                'title' => clean_param((string)($body['title'] ?? ''), PARAM_TEXT),
                'status' => clean_param((string)($body['status'] ?? 'issued'), PARAM_ALPHANUMEXT),
                'completion_percent' => clean_param((string)($body['completion_percent'] ?? ''), PARAM_TEXT),
                'final_grade' => clean_param((string)($body['final_grade'] ?? ''), PARAM_TEXT),
                'evidencejson' => pqcp_json(['evidence' => clean_param((string)($body['evidence'] ?? ''), PARAM_TEXT)]),
                'issuedby' => (int)$USER->id,
                'issuedat' => pqcp_date_to_time(clean_param((string)($body['issuedat'] ?? ''), PARAM_TEXT)) ?: $now,
                'revokedby' => 0,
                'revokedat' => 0,
                'revocation_reason' => '',
                'documentid' => (int)($existing->documentid ?? 0),
                'generateddocid' => (int)($existing->generateddocid ?? 0),
                'timecreated' => (int)($existing->timecreated ?? $now),
                'timemodified' => $now,
            ];
            if ($record->awardnumber === '') {
                $record->awardnumber = pqcp_award_number($workspaceid);
            }
            if ($existing) {
                $record->id = (int)$existing->id;
                $DB->update_record('local_prequran_completion_award', $record);
                $awardid = (int)$existing->id;
                pqcp_award_audit($workspaceid, $awardid, (int)$USER->id, 'award_updated', ['status' => $record->status]);
            } else {
                $awardid = (int)$DB->insert_record('local_prequran_completion_award', $record);
                $record->id = $awardid;
                pqcp_award_audit($workspaceid, $awardid, (int)$USER->id, 'award_issued', ['awardnumber' => $record->awardnumber]);
            }
            [$documentid, $generatedid] = pqcp_register_certificate_document($record, (int)$USER->id);
            if ($documentid > 0 || $generatedid > 0) {
                $record->id = $awardid;
                $record->documentid = $documentid;
                $record->generateddocid = $generatedid;
                $record->timemodified = time();
                $DB->update_record('local_prequran_completion_award', $record);
            }
            $message = 'Completion award saved and certificate PDF registered.';
        } else if ($do === 'revoke_award') {
            // -- write: revoke_award (legacy action=revoke_award, verbatim) --
            $award = $DB->get_record('local_prequran_completion_award', ['id' => (int)($body['awardid'] ?? 0), 'workspaceid' => $workspaceid], '*', MUST_EXIST);
            $award->status = 'revoked';
            $award->revokedby = (int)$USER->id;
            $award->revokedat = $now;
            $award->revocation_reason = clean_param((string)($body['revocation_reason'] ?? ''), PARAM_TEXT);
            $award->timemodified = $now;
            $DB->update_record('local_prequran_completion_award', $award);
            pqcp_award_audit($workspaceid, (int)$award->id, (int)$USER->id, 'award_revoked', ['reason' => $award->revocation_reason]);
            $message = 'Award revoked.';
        } else {
            pqpd_fail(400, 'Unknown certificates-awards action.');
        }
    } catch (Throwable $e) {
        pqpd_fail(400, $e->getMessage());
    }
    echo json_encode([
        'ok' => true,
        'message' => $message,
        'workspaceid' => $workspaceid,
    ], JSON_UNESCAPED_SLASHES);
    exit;
}

// -- GET: the certificate lists exactly as the legacy page builds them --
$ready = pqcp_ready();
$students = pqcp_workspace_users($workspaceid, ['student']);
$templates = pqh_table_exists_safe('local_prequran_cert_template') ? array_values($DB->get_records('local_prequran_cert_template', ['workspaceid' => $workspaceid], 'timemodified DESC', '*', 0, 80)) : [];
$offerings = pqh_table_exists_safe('local_prequran_course_offering') ? array_values($DB->get_records('local_prequran_course_offering', ['workspaceid' => $workspaceid], 'title ASC', 'id,title,moodlecourseid,course_key,status', 0, 120)) : [];
$awards = pqh_table_exists_safe('local_prequran_completion_award') ? array_values($DB->get_records_sql("SELECT a.*, u.firstname, u.lastname FROM {local_prequran_completion_award} a LEFT JOIN {user} u ON u.id = a.studentid WHERE a.workspaceid = :workspaceid ORDER BY a.timemodified DESC", ['workspaceid' => $workspaceid], 0, 100)) : [];
$audits = pqh_table_exists_safe('local_prequran_award_audit') ? array_values($DB->get_records('local_prequran_award_audit', ['workspaceid' => $workspaceid], 'timecreated DESC', '*', 0, 80)) : [];

// Decorate rows with the server-side labels the page renders inline (student
// full name and the legacy PDF-download URL). fullname()/userdate() are PHP-only.
$studentsout = [];
foreach ($students as $student) {
    $studentsout[] = ['id' => (int)$student->id, 'name' => fullname($student)];
}
$templatesout = [];
foreach ($templates as $template) {
    $templatesout[] = [
        'id' => (int)$template->id,
        'template_key' => (string)$template->template_key,
        'title' => (string)$template->title,
        'award_type' => (string)$template->award_type,
        'status' => (string)$template->status,
    ];
}
$offeringsout = [];
foreach ($offerings as $offering) {
    $offeringsout[] = ['id' => (int)$offering->id, 'title' => (string)$offering->title];
}
$awardsout = [];
foreach ($awards as $award) {
    $awardsout[] = [
        'id' => (int)$award->id,
        'title' => (string)$award->title,
        'awardnumber' => (string)$award->awardnumber,
        'award_type' => (string)$award->award_type,
        'status' => (string)$award->status,
        'student_name' => trim(((string)($award->firstname ?? '')) . ' ' . ((string)($award->lastname ?? ''))),
        'issuedat' => (int)$award->issuedat,
        'issuedat_label' => (int)$award->issuedat > 0 ? userdate((int)$award->issuedat) : 'not issued',
        'generateddocid' => (int)$award->generateddocid,
        'pdf_url' => (int)$award->generateddocid > 0
            ? $CFG->wwwroot . '/local/hubredirect/document_pdf.php?generatedid=' . (int)$award->generateddocid
            : '',
    ];
}
$auditsout = [];
foreach ($audits as $audit) {
    $auditsout[] = [
        'awardid' => (int)$audit->awardid,
        'action' => (string)$audit->action,
        'timecreated' => (int)$audit->timecreated,
        'timecreated_label' => userdate((int)$audit->timecreated),
    ];
}

echo json_encode([
    'ok' => true,
    'ready' => $ready,
    'workspace' => ['id' => $workspaceid, 'name' => (string)$workspace->name],
    'students' => $studentsout,
    'templates' => $templatesout,
    'offerings' => $offeringsout,
    'awards' => $awardsout,
    'audits' => $auditsout,
    'legacyurl' => $CFG->wwwroot . '/local/hubredirect/certificates_awards.php?workspaceid=' . $workspaceid,
], JSON_UNESCAPED_SLASHES);
exit;
