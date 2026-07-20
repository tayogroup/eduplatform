<?php
declare(strict_types=1);

// Safe Exam Browser (SEB) support for EduPlatform exams.
//
// Phase 1 built the enforcement rails: an exam page refuses to render unless
// the request carries SEB's Config Key hash header, which only a genuine SEB
// session launched from our generated .seb config can produce.
//
// Phase 2 makes exams data: teachers create them (seb_exams.php), assign
// students, and set windows; students take them once, tracked in attempts.
// Tables (created by local_prequran/sql/create_seb_exam_tables.sql):
//   local_prequran_seb_exam, local_prequran_seb_exam_student,
//   local_prequran_seb_attempt.
//
// The Config Key math is deliberately NOT reimplemented here: Moodle core
// ships it in quizaccess_seb and this library reuses those classes.

function pqh_seb_tables_ready(): bool {
    return pqh_table_exists_safe('local_prequran_seb_exam')
        && pqh_table_exists_safe('local_prequran_seb_exam_student')
        && pqh_table_exists_safe('local_prequran_seb_attempt');
}

// Content the exam creator can pick without knowing URLs. Custom URLs are
// also accepted; English/Mathematics entries join this list once their
// production URLs are decided.
function pqh_seb_known_content(): array {
    return [
        '/local/hubredirect/issue_child.php?goto=alphabet_quiz&managed_student=0' => 'Alphabet quiz unit (Pre-Quraan)',
    ];
}

function pqh_seb_exam_record(int $examid): ?stdClass {
    global $DB;
    if ($examid <= 0 || !pqh_seb_tables_ready()) {
        return null;
    }
    $record = $DB->get_record('local_prequran_seb_exam', ['id' => $examid], '*', IGNORE_MISSING);
    return $record ?: null;
}

function pqh_seb_exam_url(int $examid): moodle_url {
    return new moodle_url('/local/hubredirect/seb_exam.php', ['examid' => $examid]);
}

function pqh_seb_config_download_url(int $examid): moodle_url {
    return new moodle_url('/local/hubredirect/seb_config.php', ['examid' => $examid]);
}

function pqh_seb_quit_url(int $examid): string {
    return (new moodle_url('/local/hubredirect/seb_exam_unlock.php', ['examid' => $examid]))->out(false);
}

function pqh_seb_manage_url(int $workspaceid = 0): moodle_url {
    return new moodle_url('/local/hubredirect/seb_exams.php', $workspaceid > 0 ? ['workspaceid' => $workspaceid] : []);
}

// ---------------------------------------------------------------------------
// Permissions and state.
// ---------------------------------------------------------------------------

function pqh_seb_can_manage(stdClass $exam, int $userid): bool {
    if (is_siteadmin($userid) || pqh_can_manage_academy_operations($userid)) {
        return true;
    }
    if ((int)$exam->createdby === $userid) {
        return true;
    }
    return (int)$exam->workspaceid > 0 && pqh_user_can_manage_workspace($userid, (int)$exam->workspaceid);
}

function pqh_seb_exam_studentids(int $examid): array {
    global $DB;
    if (!pqh_seb_tables_ready()) {
        return [];
    }
    return array_map('intval', $DB->get_fieldset_select(
        'local_prequran_seb_exam_student', 'studentid', 'examid = ?', [$examid]));
}

function pqh_seb_attempt(int $examid, int $userid): ?stdClass {
    global $DB;
    if (!pqh_seb_tables_ready()) {
        return null;
    }
    $attempt = $DB->get_record('local_prequran_seb_attempt', ['examid' => $examid, 'userid' => $userid], '*', IGNORE_MISSING);
    return $attempt ?: null;
}

// Why (not just whether) a student can enter: the exam page shows the reason.
function pqh_seb_student_gate(stdClass $exam, int $userid): array {
    $now = time();
    if ((string)$exam->status !== 'active') {
        return [false, 'This exam is no longer available.'];
    }
    if (!in_array($userid, pqh_seb_exam_studentids((int)$exam->id), true)) {
        return [false, 'You are not assigned to this exam.'];
    }
    if ((int)$exam->window_start > 0 && $now < (int)$exam->window_start) {
        return [false, 'This exam opens ' . userdate((int)$exam->window_start, get_string('strftimedatetimeshort')) . '.'];
    }
    if ((int)$exam->window_end > 0 && $now > (int)$exam->window_end) {
        return [false, 'The exam window closed ' . userdate((int)$exam->window_end, get_string('strftimedatetimeshort')) . '.'];
    }
    $attempt = pqh_seb_attempt((int)$exam->id, $userid);
    if ($attempt && (string)$attempt->status === 'finished') {
        return [false, 'You have already submitted this exam.'];
    }
    return [true, ''];
}

function pqh_seb_attempt_start(int $examid, int $userid): stdClass {
    global $DB;
    $attempt = pqh_seb_attempt($examid, $userid);
    if ($attempt) {
        return $attempt;
    }
    $now = time();
    $record = (object)[
        'examid' => $examid,
        'userid' => $userid,
        'timestarted' => $now,
        'timefinished' => 0,
        'sebverified' => 1,
        'status' => 'in_progress',
        'timecreated' => $now,
        'timemodified' => $now,
    ];
    $record->id = (int)$DB->insert_record('local_prequran_seb_attempt', $record);
    pqh_seb_audit('seb_exam_started', $examid, ['attemptid' => $record->id]);
    return $record;
}

function pqh_seb_attempt_finish(stdClass $attempt, string $status = 'finished'): void {
    global $DB;
    $attempt->timefinished = time();
    $attempt->status = $status;
    $attempt->timemodified = time();
    $DB->update_record('local_prequran_seb_attempt', $attempt);
    pqh_seb_audit('seb_exam_finished', (int)$attempt->examid, [
        'attemptid' => (int)$attempt->id,
        'status' => $status,
        'elapsed_seconds' => (int)$attempt->timefinished - (int)$attempt->timestarted,
    ]);
}

// ---------------------------------------------------------------------------
// Config (.seb plist) generation. Deterministic for a given exam row +
// wwwroot, so the Config Key can be recomputed statelessly on every request.
// ---------------------------------------------------------------------------

function pqh_seb_plist_value($value): string {
    if (is_bool($value)) {
        return $value ? '<true/>' : '<false/>';
    }
    if (is_int($value)) {
        return '<integer>' . $value . '</integer>';
    }
    if (is_array($value)) {
        $islist = array_keys($value) === range(0, count($value) - 1);
        if ($islist) {
            $out = "<array>";
            foreach ($value as $item) {
                $out .= pqh_seb_plist_value($item);
            }
            return $out . "</array>";
        }
        $out = "<dict>";
        foreach ($value as $key => $item) {
            $out .= '<key>' . htmlspecialchars((string)$key, ENT_XML1) . '</key>' . pqh_seb_plist_value($item);
        }
        return $out . "</dict>";
    }
    return '<string>' . htmlspecialchars((string)$value, ENT_XML1) . '</string>';
}

function pqh_seb_exam_allow_expressions(stdClass $exam): array {
    $extra = [];
    $json = trim((string)($exam->allowjson ?? ''));
    if ($json !== '') {
        $decoded = json_decode($json, true);
        if (is_array($decoded)) {
            $extra = array_values(array_filter(array_map('strval', $decoded)));
        }
    }
    if (!$extra) {
        $extra = ['*.b-cdn.net/*'];
    }
    return $extra;
}

function pqh_seb_config_xml(stdClass $exam): string {
    global $CFG;
    $host = parse_url($CFG->wwwroot, PHP_URL_HOST) ?: '';

    $rules = [];
    foreach (array_merge([$host . '/*'], pqh_seb_exam_allow_expressions($exam)) as $expression) {
        $rules[] = [
            'action' => 1,
            'active' => true,
            'expression' => (string)$expression,
        ];
    }

    $config = [
        'originatorVersion' => 'EduPlatform_SEB_2.0',
        'startURL' => pqh_seb_exam_url((int)$exam->id)->out(false),
        'sendBrowserExamKey' => true,
        'quitURL' => pqh_seb_quit_url((int)$exam->id),
        'quitURLConfirm' => false,
        'allowQuit' => true,
        'hashedQuitPassword' => hash('sha256', (string)($exam->quitpassword !== '' ? $exam->quitpassword : 'ehel-unlock')),
        'URLFilterEnable' => true,
        'URLFilterEnableContentFilter' => false,
        'URLFilterRules' => $rules,
        'browserWindowAllowReload' => true,
        'showReloadButton' => true,
        'showTime' => true,
    ];

    return '<?xml version="1.0" encoding="UTF-8"?>'
        . '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">'
        . '<plist version="1.0">'
        . pqh_seb_plist_value($config)
        . '</plist>';
}

function pqh_seb_engine_ready(): bool {
    return class_exists('\quizaccess_seb\config_key');
}

function pqh_seb_config_key(stdClass $exam): string {
    if (!pqh_seb_engine_ready()) {
        throw new moodle_exception('generalexceptionmessage', 'error', '',
            'Moodle SEB engine (quizaccess_seb) is not available on this installation.');
    }
    return \quizaccess_seb\config_key::generate(pqh_seb_config_xml($exam))->get_hash();
}

// ---------------------------------------------------------------------------
// Request verification. SEB sends X-SafeExamBrowser-ConfigKeyHash =
// SHA256(absolute request URL without fragment . configKey) on every request.
// ---------------------------------------------------------------------------

function pqh_seb_header_hash(): string {
    return strtolower(trim((string)($_SERVER['HTTP_X_SAFEEXAMBROWSER_CONFIGKEYHASH'] ?? '')));
}

function pqh_seb_request_verified(stdClass $exam): bool {
    $header = pqh_seb_header_hash();
    if ($header === '') {
        return false;
    }
    $url = qualified_me();
    if ($url === false || $url === '') {
        return false;
    }
    try {
        $configkey = pqh_seb_config_key($exam);
    } catch (Throwable $e) {
        return false;
    }
    return hash_equals(hash('sha256', $url . $configkey), $header);
}

// ---------------------------------------------------------------------------
// Audit: reuse the live-audit table (sessionid 0, seb_* actions) so exam
// activity sits in the same trail as everything else on the platform.
// ---------------------------------------------------------------------------

function pqh_seb_audit(string $action, int $examid, array $details = []): void {
    global $DB, $USER;
    if (!pqh_table_exists_safe('local_prequran_live_audit')) {
        return;
    }
    $DB->insert_record('local_prequran_live_audit', (object)[
        'sessionid' => 0,
        'actorid' => (int)$USER->id,
        'action' => $action,
        'targettype' => 'seb_exam',
        'targetid' => $examid,
        'details' => $details ? json_encode($details) : '',
        'timecreated' => time(),
    ]);
}

// ---------------------------------------------------------------------------
// Queries for the management and student surfaces.
// ---------------------------------------------------------------------------

function pqh_seb_exams_for_manager(int $userid, int $workspaceid): array {
    global $DB;
    if (!pqh_seb_tables_ready()) {
        return [];
    }
    $canmanageworkspace = $workspaceid > 0 && pqh_user_can_manage_workspace($userid, $workspaceid);
    if ($canmanageworkspace || is_siteadmin($userid) || pqh_can_manage_academy_operations($userid)) {
        $where = $workspaceid > 0 ? 'workspaceid = ?' : '1 = 1';
        $params = $workspaceid > 0 ? [$workspaceid] : [];
    } else {
        $where = 'createdby = ?';
        $params = [$userid];
    }
    return array_values($DB->get_records_select('local_prequran_seb_exam', $where, $params, 'timecreated DESC', '*', 0, 100));
}

function pqh_seb_exams_for_student(int $userid): array {
    global $DB;
    if (!pqh_seb_tables_ready()) {
        return [];
    }
    return array_values($DB->get_records_sql(
        "SELECT e.*
           FROM {local_prequran_seb_exam} e
           JOIN {local_prequran_seb_exam_student} s ON s.examid = e.id
          WHERE s.studentid = :userid
            AND e.status = 'active'
            AND (e.window_end = 0 OR e.window_end > :cutoff)
       ORDER BY e.window_start ASC, e.id ASC",
        ['userid' => $userid, 'cutoff' => time() - DAYSECS]
    ));
}
