<?php
// Live parent-links query library — extracted VERBATIM from
// live_parent_links.php (the pqlpl_* helpers defined inline on that page) for
// the token-gated portal endpoint. The legacy page keeps its own copies and
// stays untouched (parallel-run). Requires: local/hubredirect/accesslib.php
// loaded first (for core_user, fullname, pqh_* shared helpers).

defined('MOODLE_INTERNAL') || die();

function pqlpl_table_exists(string $table): bool {
    global $DB;
    return $DB->get_manager()->table_exists($table);
}

function pqlpl_table_has_field(string $table, string $field): bool {
    global $DB;
    static $cache = [];
    $key = $table . ':' . $field;
    if (!array_key_exists($key, $cache)) {
        try {
            $columns = $DB->get_columns($table);
            $cache[$key] = array_key_exists($field, $columns);
        } catch (Throwable $e) {
            $cache[$key] = false;
        }
    }
    return $cache[$key];
}

function pqlpl_user_name(int $userid, string $fallback): string {
    $user = $userid > 0 ? core_user::get_user($userid) : null;
    return $user ? fullname($user) : $fallback;
}

function pqlpl_user_email(int $userid): string {
    $user = $userid > 0 ? core_user::get_user($userid) : null;
    return $user ? (string)$user->email : '';
}

function pqlpl_csv(string $filename, array $headers, array $rows): void {
    @header('Content-Type: text/csv; charset=utf-8');
    @header('Content-Disposition: attachment; filename="' . $filename . '"');
    $out = fopen('php://output', 'w');
    fputcsv($out, $headers);
    foreach ($rows as $row) {
        fputcsv($out, $row);
    }
    fclose($out);
    exit;
}

function pqlpl_bool_label($value): string {
    return !empty($value) ? 'yes' : 'no';
}

function pqlpl_get_active_user(int $userid, string $label, string &$error): ?stdClass {
    $user = $userid > 0 ? core_user::get_user($userid, 'id,username,firstname,lastname,email,idnumber,deleted,suspended', IGNORE_MISSING) : null;
    if (!$user || !empty($user->deleted)) {
        $error = $label . ' Moodle user ID was not found.';
        return null;
    }
    if (!empty($user->suspended)) {
        $error = $label . ' Moodle user is suspended. Unsuspend or choose another account before linking.';
        return null;
    }
    return $user;
}

function pqlpl_apply_record_fields(string $table, stdClass $record, array $values): stdClass {
    foreach ($values as $field => $value) {
        if (pqlpl_table_has_field($table, $field)) {
            $record->{$field} = $value;
        }
    }
    return $record;
}

function pqlpl_upsert_comm_link(int $studentid, int $parentid, string $source): string {
    global $DB;
    if (!pqlpl_table_exists('local_prequran_comm_consent')) {
        return 'communication consent table missing';
    }
    $now = time();
    $existing = $DB->get_record('local_prequran_comm_consent', ['studentid' => $studentid, 'guardianid' => $parentid], '*', IGNORE_MISSING);
    $record = $existing ? (object)['id' => (int)$existing->id] : new stdClass();
    $record = pqlpl_apply_record_fields('local_prequran_comm_consent', $record, [
        'studentid' => $studentid,
        'guardianid' => $parentid,
        'student_messaging_enabled' => 0,
        'free_text_enabled' => 0,
        'parent_visible' => 1,
        'consent_source' => $source,
        'timemodified' => $now,
    ]);
    if ($existing) {
        $DB->update_record('local_prequran_comm_consent', $record);
        return 'updated';
    }
    $record = pqlpl_apply_record_fields('local_prequran_comm_consent', $record, ['timecreated' => $now]);
    $DB->insert_record('local_prequran_comm_consent', $record);
    return 'created';
}

function pqlpl_upsert_live_consent(int $studentid, int $parentid, string $type, int $granted, string $source, string $details): string {
    global $DB;
    if (!pqlpl_table_exists('local_prequran_live_consent')) {
        return 'skipped';
    }
    $now = time();
    $existing = $DB->get_record('local_prequran_live_consent', [
        'studentid' => $studentid,
        'guardianid' => $parentid,
        'consent_type' => $type,
    ], '*', IGNORE_MISSING);
    $record = $existing ? (object)['id' => (int)$existing->id] : new stdClass();
    $record = pqlpl_apply_record_fields('local_prequran_live_consent', $record, [
        'studentid' => $studentid,
        'guardianid' => $parentid,
        'consent_type' => $type,
        'granted' => $granted,
        'version' => '1',
        'consent_source' => $source,
        'details' => $details,
        'timemodified' => $now,
    ]);
    if ($existing) {
        $DB->update_record('local_prequran_live_consent', $record);
        return 'updated';
    }
    $record = pqlpl_apply_record_fields('local_prequran_live_consent', $record, ['timecreated' => $now]);
    $DB->insert_record('local_prequran_live_consent', $record);
    return 'created';
}

function pqlpl_update_student_profile_parent(int $studentid, stdClass $parent): string {
    global $DB, $USER;
    if (!pqlpl_table_exists('local_prequran_student_profile')) {
        return 'skipped';
    }
    $profile = $DB->get_record('local_prequran_student_profile', ['userid' => $studentid], '*', IGNORE_MISSING);
    if (!$profile) {
        return 'missing';
    }
    $record = (object)['id' => (int)$profile->id];
    $record = pqlpl_apply_record_fields('local_prequran_student_profile', $record, [
        'parent_name' => fullname($parent),
        'parent_email' => (string)$parent->email,
        'timemodified' => time(),
        'updatedby' => (int)$USER->id,
    ]);
    $DB->update_record('local_prequran_student_profile', $record);
    return 'updated';
}

function pqlpl_audit(string $action, int $studentid, int $parentid, array $details = []): void {
    global $DB, $USER;
    if (!pqlpl_table_exists('local_prequran_live_audit')) {
        return;
    }
    $DB->insert_record('local_prequran_live_audit', (object)[
        'sessionid' => 0,
        'actorid' => (int)$USER->id,
        'action' => $action,
        'targettype' => 'student_parent_link',
        'targetid' => $studentid,
        'details' => json_encode([
            'studentid' => $studentid,
            'parentid' => $parentid,
        ] + $details),
        'timecreated' => time(),
    ]);
}

function pqlpl_live_consent_map(): array {
    global $DB;
    $map = [];
    if (!pqlpl_table_exists('local_prequran_live_consent')) {
        return $map;
    }
    $rows = $DB->get_records_sql(
        "SELECT id, studentid, guardianid, consent_type, granted
           FROM {local_prequran_live_consent}
       ORDER BY studentid ASC, guardianid ASC, consent_type ASC"
    );
    foreach ($rows as $row) {
        $key = (int)$row->studentid . ':' . (int)$row->guardianid;
        $type = (string)$row->consent_type;
        $map[$key][$type] = !empty($row->granted) ? 'yes' : 'no';
    }
    return $map;
}

function pqlpl_rows(): array {
    global $DB;
    $rows = [];
    $seenstudents = [];
    $consents = pqlpl_live_consent_map();

    if (pqlpl_table_exists('local_prequran_comm_consent')) {
        $links = $DB->get_records_sql(
            "SELECT id, studentid, guardianid, student_messaging_enabled, free_text_enabled, parent_visible, consent_source, timemodified
               FROM {local_prequran_comm_consent}
           ORDER BY studentid ASC, guardianid ASC"
        );
        foreach ($links as $link) {
            $studentid = (int)$link->studentid;
            $guardianid = (int)$link->guardianid;
            $key = $studentid . ':' . $guardianid;
            $rows[] = [
                'studentid' => $studentid,
                'student' => pqlpl_user_name($studentid, 'Student ' . $studentid),
                'studentemail' => pqlpl_user_email($studentid),
                'parentid' => $guardianid,
                'parent' => pqlpl_user_name($guardianid, 'Parent ' . $guardianid),
                'parentemail' => pqlpl_user_email($guardianid),
                'profileparent' => '',
                'profilecontact' => '',
                'source' => 'communication link',
                'messaging' => pqlpl_bool_label($link->student_messaging_enabled),
                'free_text' => pqlpl_bool_label($link->free_text_enabled),
                'parent_visible' => pqlpl_bool_label($link->parent_visible),
                'live_consent' => $consents[$key]['live_session'] ?? '',
                'recording_consent' => $consents[$key]['recording'] ?? '',
                'notes' => (string)$link->consent_source,
                'updated' => (int)$link->timemodified,
            ];
            $seenstudents[$studentid] = true;
        }
    }

    if (pqlpl_table_exists('local_prequran_student_profile')) {
        $profiles = $DB->get_records_sql(
            "SELECT id, userid, student_display_name, parent_name, parent_email, parent_phone, live_class_consent, recording_consent, timemodified
               FROM {local_prequran_student_profile}
           ORDER BY userid ASC"
        );
        foreach ($profiles as $profile) {
            $studentid = (int)$profile->userid;
            if (isset($seenstudents[$studentid])
                || (trim((string)$profile->parent_name) === '' && trim((string)$profile->parent_email) === '' && trim((string)$profile->parent_phone) === '')) {
                continue;
            }
            $studentname = trim((string)$profile->student_display_name);
            $rows[] = [
                'studentid' => $studentid,
                'student' => $studentname !== '' ? $studentname : pqlpl_user_name($studentid, 'Student ' . $studentid),
                'studentemail' => pqlpl_user_email($studentid),
                'parentid' => 0,
                'parent' => '',
                'parentemail' => '',
                'profileparent' => (string)$profile->parent_name,
                'profilecontact' => trim((string)$profile->parent_email . ' ' . (string)$profile->parent_phone),
                'source' => 'profile contact only',
                'messaging' => '',
                'free_text' => '',
                'parent_visible' => '',
                'live_consent' => pqlpl_bool_label($profile->live_class_consent),
                'recording_consent' => pqlpl_bool_label($profile->recording_consent),
                'notes' => 'No linked guardian account found in communication consent.',
                'updated' => (int)$profile->timemodified,
            ];
        }
    }

    usort($rows, function(array $a, array $b): int {
        return strcasecmp((string)$a['student'], (string)$b['student'])
            ?: ((int)$a['studentid'] <=> (int)$b['studentid'])
            ?: strcasecmp((string)$a['parent'], (string)$b['parent']);
    });
    return $rows;
}
