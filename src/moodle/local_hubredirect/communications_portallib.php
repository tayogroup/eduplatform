<?php
// Communications query library — extracted VERBATIM from communications.php
// (renamed pqh_comm_ -> pqcomml_) for the token-gated portal endpoint. The
// legacy page keeps its inline copies and stays untouched (parallel-run).
// Requires: local/hubredirect/accesslib.php loaded first (pqh_* helpers).

defined('MOODLE_INTERNAL') || die();

function pqcomml_context_url(string $path, array $contextparams, array $params = []): moodle_url {
    return new moodle_url($path, $contextparams + $params);
}

function pqcomml_current_user_ws_token(string $fallback = ''): string {
    global $DB;

    try {
        $service = $DB->get_record('external_services', [
            'shortname' => 'prequran_ws',
            'enabled' => 1,
        ]);
        if (!$service || !function_exists('external_generate_token_for_current_user')) {
            return $fallback;
        }

        $token = external_generate_token_for_current_user($service);
        if (is_object($token) && !empty($token->token)) {
            return (string)$token->token;
        }
    } catch (Throwable $e) {
        return $fallback;
    }

    return $fallback;
}

function pqcomml_table_exists(string $table): bool {
    global $DB;
    try {
        return $DB->get_manager()->table_exists($table);
    } catch (Throwable $e) {
        return false;
    }
}

function pqcomml_student_in_workspace(int $workspaceid, int $studentid): bool {
    global $DB;

    if ($workspaceid <= 0 || $studentid <= 0) {
        return true;
    }

    $checked = false;
    if (pqh_table_exists_safe('local_prequran_workspace_member')) {
        $checked = true;
        if ($DB->record_exists('local_prequran_workspace_member', [
            'workspaceid' => $workspaceid,
            'userid' => $studentid,
            'workspace_role' => 'student',
            'status' => 'active',
        ])) {
            return true;
        }
    }
    if (pqh_table_exists_safe('local_prequran_student_profile')
            && pqh_table_has_field_safe('local_prequran_student_profile', 'workspaceid')) {
        $checked = true;
        if ($DB->record_exists('local_prequran_student_profile', [
            'workspaceid' => $workspaceid,
            'userid' => $studentid,
        ])) {
            return true;
        }
    }
    if (pqh_table_exists_safe('local_prequran_teacher_student')
            && pqh_table_has_field_safe('local_prequran_teacher_student', 'workspaceid')) {
        $checked = true;
        if ($DB->record_exists('local_prequran_teacher_student', [
            'workspaceid' => $workspaceid,
            'studentid' => $studentid,
            'status' => 'active',
        ])) {
            return true;
        }
    }

    return !$checked;
}

function pqcomml_direct_tables_ready(): bool {
    return pqcomml_table_exists('local_prequran_comm_thread')
        && pqcomml_table_exists('local_prequran_comm_participant')
        && pqcomml_table_exists('local_prequran_comm_message');
}

function pqcomml_direct_can_read($thread, int $userid, int $workspaceid = 0): bool {
    global $DB;
    if (!$thread || empty($thread->id) || $userid <= 0) {
        return false;
    }
    if (!pqcomml_student_in_workspace($workspaceid, (int)($thread->studentid ?? 0))) {
        return false;
    }
    if ((int)($thread->studentid ?? 0) > 0 && !pqh_user_belongs_to_consumer_context((int)$thread->studentid)) {
        return false;
    }
    if ($DB->record_exists('local_prequran_comm_participant', [
        'threadid' => (int)$thread->id,
        'userid' => $userid,
    ])) {
        return true;
    }
    if ((int)$thread->createdby === $userid) {
        return true;
    }
    return is_siteadmin($userid) && (string)$thread->type !== 'parent_teacher';
}

function pqcomml_direct_can_reply($thread, int $userid): bool {
    global $DB;
    if (!$thread || empty($thread->id) || (string)$thread->status !== 'active' || (string)$thread->type === 'announcement') {
        return false;
    }
    return $DB->record_exists('local_prequran_comm_participant', [
        'threadid' => (int)$thread->id,
        'userid' => $userid,
        'canreply' => 1,
    ]);
}

function pqcomml_direct_clean_body(string $body, int $max = 1000): string {
    $body = trim($body);
    if (core_text::strlen($body) > $max) {
        $body = core_text::substr($body, 0, $max);
    }
    return clean_param($body, PARAM_TEXT);
}

function pqcomml_direct_user_name(int $userid): string {
    global $DB;
    if ($userid <= 0) {
        return 'EduPlatform';
    }
    $user = $DB->get_record('user', ['id' => $userid, 'deleted' => 0], 'id, firstname, lastname, email');
    if (!$user) {
        return 'EduPlatform';
    }
    return fullname($user);
}
