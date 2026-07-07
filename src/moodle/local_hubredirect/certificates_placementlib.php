<?php
declare(strict_types=1);

defined('MOODLE_INTERNAL') || die();

require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/workflow_documentlib.php');

function pqcp_ready(): bool {
    return pqh_table_exists_safe('local_prequran_cert_template')
        && pqh_table_exists_safe('local_prequran_completion_award')
        && pqh_table_exists_safe('local_prequran_place_test')
        && pqh_table_exists_safe('local_prequran_place_session');
}

function pqcp_json(array $data): string {
    return json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) ?: '{}';
}

function pqcp_date_to_time(string $value, bool $endofday = false): int {
    $value = trim($value);
    if ($value === '') {
        return 0;
    }
    $time = strtotime($value . ($endofday ? ' 23:59:59' : ' 00:00:00'));
    return $time ? (int)$time : 0;
}

function pqcp_workspace_users(int $workspaceid, array $roles): array {
    global $DB;
    if ($workspaceid <= 0 || !pqh_table_exists_safe('local_prequran_workspace_member')) {
        return [];
    }
    [$insql, $params] = $DB->get_in_or_equal($roles, SQL_PARAMS_NAMED, 'role');
    $params['workspaceid'] = $workspaceid;
    $params['status'] = 'active';
    return array_values($DB->get_records_sql(
        "SELECT u.id, u.firstname, u.lastname, u.email, wm.workspace_role
           FROM {local_prequran_workspace_member} wm
           JOIN {user} u ON u.id = wm.userid
          WHERE wm.workspaceid = :workspaceid
            AND wm.status = :status
            AND wm.workspace_role $insql
       ORDER BY u.lastname ASC, u.firstname ASC",
        $params
    ));
}

function pqcp_award_number(int $workspaceid): string {
    global $DB;
    $prefix = 'CERT-' . $workspaceid . '-' . date('Ymd') . '-';
    $suffix = max(1, $DB->count_records_select(
        'local_prequran_completion_award',
        'workspaceid = :workspaceid AND timecreated >= :daystart',
        ['workspaceid' => $workspaceid, 'daystart' => strtotime('today')]
    ) + 1);
    do {
        $candidate = $prefix . str_pad((string)$suffix, 4, '0', STR_PAD_LEFT);
        $suffix++;
    } while ($DB->record_exists('local_prequran_completion_award', ['awardnumber' => $candidate]));
    return $candidate;
}

function pqcp_award_audit(int $workspaceid, int $awardid, int $actorid, string $action, array $details = []): void {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_award_audit')) {
        return;
    }
    $DB->insert_record('local_prequran_award_audit', (object)[
        'workspaceid' => $workspaceid,
        'awardid' => $awardid,
        'actorid' => $actorid,
        'action' => core_text::substr($action, 0, 80),
        'detailsjson' => pqcp_json($details),
        'timecreated' => time(),
    ]);
}

function pqcp_place_audit(int $workspaceid, int $sessionid, int $actorid, string $action, array $details = []): void {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_place_audit')) {
        return;
    }
    $DB->insert_record('local_prequran_place_audit', (object)[
        'workspaceid' => $workspaceid,
        'sessionid' => $sessionid,
        'actorid' => $actorid,
        'action' => core_text::substr($action, 0, 80),
        'detailsjson' => pqcp_json($details),
        'timecreated' => time(),
    ]);
}

function pqcp_register_certificate_document(stdClass $award, int $actorid): array {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_document') || !pqh_table_exists_safe('local_prequran_generated_doc')) {
        return [0, 0];
    }
    $now = time();
    $documentid = (int)($award->documentid ?? 0);
    if ($documentid <= 0) {
        $documentid = (int)$DB->insert_record('local_prequran_document', (object)[
            'workspaceid' => (int)$award->workspaceid,
            'studentid' => (int)$award->studentid,
            'ownerid' => (int)$award->studentid,
            'document_type' => 'certificate',
            'title' => (string)$award->title,
            'document_number' => (string)$award->awardnumber,
            'status' => 'generated',
            'verification_status' => 'system_generated',
            'verifiedby' => $actorid,
            'verifiedat' => $now,
            'issuedat' => (int)$award->issuedat,
            'expiresat' => 0,
            'filename' => '',
            'mimetype' => 'application/pdf',
            'filesize' => 0,
            'contenthash' => '',
            'source_type' => 'completion_award',
            'source_id' => (int)$award->id,
            'metadatajson' => pqcp_json(['award_type' => (string)$award->award_type, 'offeringid' => (int)$award->offeringid]),
            'uploadedby' => $actorid,
            'timecreated' => $now,
            'timemodified' => $now,
        ]);
    }
    $generatedid = (int)($award->generateddocid ?? 0);
    if ($generatedid <= 0) {
        $generatedid = (int)$DB->insert_record('local_prequran_generated_doc', (object)[
            'workspaceid' => (int)$award->workspaceid,
            'studentid' => (int)$award->studentid,
            'documentid' => $documentid,
            'doc_type' => 'certificate',
            'source_type' => 'completion_award',
            'source_id' => (int)$award->id,
            'document_key' => (string)$award->awardnumber,
            'status' => 'ready',
            'payloadjson' => pqcp_json([
                'title' => (string)$award->title,
                'award_type' => (string)$award->award_type,
                'completion_percent' => (string)$award->completion_percent,
                'final_grade' => (string)$award->final_grade,
                'note' => 'Completion award certificate.',
            ]),
            'pdfhash' => '',
            'download_url' => '',
            'generatedby' => $actorid,
            'generatedat' => $now,
            'timecreated' => $now,
            'timemodified' => $now,
        ]);
    }
    return [$documentid, $generatedid];
}

function pqcp_apply_placement_result(stdClass $session, int $actorid): void {
    global $DB;
    $now = time();
    if ((int)$session->applicationid > 0 && pqh_table_exists_safe('local_prequran_admission_app')) {
        $app = $DB->get_record('local_prequran_admission_app', ['id' => (int)$session->applicationid, 'workspaceid' => (int)$session->workspaceid], '*', IGNORE_MISSING);
        if ($app) {
            $placement = json_decode((string)$app->placement_json, true);
            $placement = is_array($placement) ? $placement : [];
            $placement['recommended_level'] = (string)$session->recommended_level;
            $placement['recommended_course_key'] = (string)$session->recommended_course_key;
            $placement['score_percent'] = (string)$session->score_percent;
            $placement['assessor_notes'] = (string)$session->assessor_notes;
            $app->placement_status = (string)$session->status === 'completed' ? 'placed' : 'ready_for_review';
            $app->placement_json = pqcp_json($placement);
            $app->timemodified = $now;
            $DB->update_record('local_prequran_admission_app', $app);
        }
    }
    if ((int)$session->studentid > 0 && pqh_table_exists_safe('local_prequran_student_path')) {
        $existing = $DB->get_record('local_prequran_student_path', ['workspaceid' => (int)$session->workspaceid, 'studentid' => (int)$session->studentid], '*', IGNORE_MISSING);
        $record = (object)[
            'workspaceid' => (int)$session->workspaceid,
            'studentid' => (int)$session->studentid,
            'current_level' => (string)$session->recommended_level,
            'placement_level' => (string)$session->recommended_level,
            'advancement_status' => 'placed',
            'recommended_course_key' => (string)$session->recommended_course_key,
            'recommendation_reason' => 'Placement test score ' . (string)$session->score_percent . '%.',
            'teacher_comment' => (string)$session->assessor_notes,
            'reviewedby' => $actorid,
            'reviewedat' => $now,
            'timecreated' => (int)($existing->timecreated ?? $now),
            'timemodified' => $now,
        ];
        if ($existing) {
            $record->id = (int)$existing->id;
            $DB->update_record('local_prequran_student_path', $record);
        } else {
            $DB->insert_record('local_prequran_student_path', $record);
        }
    }
}
