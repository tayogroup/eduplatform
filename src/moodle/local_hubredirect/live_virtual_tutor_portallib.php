<?php
// Live virtual-tutor query/write library — extracted VERBATIM from
// live_virtual_tutor.php (prefix pqlvt_ kept; grep-confirmed the prefix appears
// only in the legacy page, which is never co-loaded with this file) for the
// token-gated portal endpoint. The legacy page keeps its inline copies and
// stays untouched (parallel-run).
// Requires: local/hubredirect/accesslib.php loaded first (pqh_* helpers).
//
// The tutor reply (pqlvt_tutor_reply) is a SERVER-SIDE rule-based guided helper
// (ai_mode = guided_rule_based) — no external AI/LLM endpoint, no keys/creds.

defined('MOODLE_INTERNAL') || die();

function pqlvt_table_exists(string $table): bool {
    global $DB;
    try {
        return $DB->get_manager()->table_exists($table);
    } catch (Throwable $e) {
        return false;
    }
}

function pqlvt_url(string $path, array $urlparams, array $params = []): moodle_url {
    return new moodle_url($path, $urlparams + $params);
}

function pqlvt_can_access_student(int $studentid, int $userid): bool {
    global $DB;
    if ($studentid <= 0 || $userid <= 0) {
        return false;
    }
    if ($studentid === $userid || pqh_can_manage_academy_operations($userid)) {
        return true;
    }
    if (pqlvt_table_exists('local_prequran_comm_consent')
        && $DB->record_exists('local_prequran_comm_consent', ['guardianid' => $userid, 'studentid' => $studentid])) {
        return true;
    }
    if (pqlvt_table_exists('local_prequran_live_consent')
        && $DB->record_exists('local_prequran_live_consent', ['guardianid' => $userid, 'studentid' => $studentid])) {
        return true;
    }
    return pqlvt_table_exists('local_prequran_teacher_student')
        && $DB->record_exists('local_prequran_teacher_student', ['teacherid' => $userid, 'studentid' => $studentid, 'status' => 'active']);
}

function pqlvt_virtual_tutor_tables_ready(): bool {
    return pqlvt_table_exists('local_prequran_vt_session') && pqlvt_table_exists('local_prequran_vt_message');
}

function pqlvt_safe_key(string $value, int $max = 100): string {
    $value = clean_param(trim($value), PARAM_ALPHANUMEXT);
    return core_text::substr($value, 0, $max);
}

function pqlvt_unit_help(string $unitid): array {
    $units = [
        'alphabet_listen' => [
            'title' => 'Alphabet Listen',
            'focus' => 'Arabic letters by name, sound, shape, dots, and writing direction.',
            'tip' => 'Name the letter first, check its dots and shape, then say the sound slowly three times.',
        ],
        'joint_connecting_forms' => [
            'title' => 'Connection Forms',
            'focus' => 'How Arabic letters change at the beginning, middle, end, or alone.',
            'tip' => 'First identify the base letter. Then ask whether it is alone, initial, medial, or final.',
        ],
        'harakat_listen' => [
            'title' => 'Harakat Listen',
            'focus' => 'Short vowel marks: fatha, kasra, and damma.',
            'tip' => 'Read the letter first, then read the mark: fatha is a, kasra is i, and damma is u.',
        ],
        'madd_listen' => [
            'title' => 'Madd',
            'focus' => 'Long vowel stretching.',
            'tip' => 'Compare the short sound with the stretched sound. Hold only as long as the rule asks.',
        ],
        'sakoon_jazm_listen' => [
            'title' => 'Sukoon and Jazm',
            'focus' => 'A consonant with no vowel after it.',
            'tip' => 'Stop the letter cleanly. Do not add a hidden a, i, or u sound after it.',
        ],
        'tanween_listen' => [
            'title' => 'Tanween',
            'focus' => 'Double vowel marks that add an n sound.',
            'tip' => 'Say the vowel first, then add the light ending n sound.',
        ],
        'tashdeed_shaddah_listen' => [
            'title' => 'Tashdeed and Shaddah',
            'focus' => 'Doubling or holding a letter.',
            'tip' => 'Hold the doubled letter briefly, then release it with the vowel. Do not skip the doubled sound.',
        ],
    ];
    $unitid = trim($unitid);
    return $units[$unitid] ?? [
        'title' => $unitid !== '' ? ucwords(str_replace('_', ' ', $unitid)) : 'Current Lesson',
        'focus' => 'The current Pre-Quran lesson step.',
        'tip' => 'Look at one small part first, try it slowly, then ask for the next step.',
    ];
}

function pqlvt_detect_letter_tip(string $message): string {
    $letters = [
        'alif' => 'Alif starts with a clean opening. Do not add an extra vowel unless the mark asks for it.',
        'ba' => 'Ba starts from both lips. Close the lips, then release softly.',
        'ta' => 'Light Ta uses the tongue tip near the gum ridge. Keep it light and clear.',
        'tha' => 'Tha uses the tongue near the teeth with a soft airy sound.',
        'jeem' => 'Jeem is voiced from the middle tongue area.',
        'ha' => 'Arabic has more than one h sound. Light Ha is gentle, while Ha and Kha come from the throat.',
        'kha' => 'Kha comes from the upper throat. Let the sound be full and slightly rough, not like English k.',
        'dal' => 'Dal is light. Touch the tongue tip, then release.',
        'ra' => 'Ra should be quick and controlled. It can be light or heavy depending on the vowel and context.',
        'seen' => 'Seen is light and thin. Keep the tongue forward.',
        'sheen' => 'Sheen is a light sh sound.',
        'sad' => 'Sad is the heavy partner of Seen. Lift the back of the tongue and make the sound fuller.',
        'qaf' => 'Qaf is deep from the back of the tongue touching the soft palate.',
        'kaf' => 'Kaf is lighter than Qaf and a little more forward.',
        'lam' => 'Lam uses the side and front of the tongue. Keep it clear.',
        'meem' => 'Meem closes both lips and carries nasal sound.',
        'noon' => 'Noon touches the gum ridge and carries nasal sound.',
        'waw' => 'Waw rounds the lips. Keep it smooth.',
        'ya' => 'Ya is light and soft from the middle tongue area.',
        'hamza' => 'Hamza starts deep in the throat with a clean stop and release.',
    ];
    $lower = core_text::strtolower($message);
    foreach ($letters as $key => $tip) {
        if (preg_match('/\b' . preg_quote($key, '/') . '\b/u', $lower)) {
            return $tip;
        }
    }
    return '';
}

function pqlvt_tutor_reply(string $message, string $lessonid, string $unitid): string {
    $clean = trim($message);
    $lower = core_text::strtolower($clean);
    $unit = pqlvt_unit_help($unitid);
    $lettertip = pqlvt_detect_letter_tip($clean);

    if ($clean === '') {
        return 'Type one thing that feels difficult, and I will help one step at a time.';
    }
    if (preg_match('/\b(right.?to.?left|direction|write|writing|start)\b/i', $clean)) {
        return 'Start from the right side. Point to the first letter, say its name, check its dots or mark, then move left one letter at a time.';
    }
    if (preg_match('/\b(shape|connect|connected|join|middle|beginning|end|final|initial)\b/i', $clean)) {
        return 'First identify the base letter. Then check its position: alone, beginning, middle, or end. Arabic letters can change shape depending on that position.';
    }
    if (preg_match('/\b(vowel|harakah|harakat|fatha|kasra|damma|mark|marks)\b/i', $clean)) {
        return 'Read the letter first, then read the vowel mark. Fatha gives a short a, kasra gives a short i, and damma gives a short u. Try the sound slowly before reading the whole item.';
    }
    if (preg_match('/\b(sukoon|sakoon|jazm|no vowel|stop)\b/i', $clean)) {
        return 'With sukoon, stop the letter cleanly. Do not add a hidden vowel after it. Say the letter, close the sound, then pause.';
    }
    if (preg_match('/\b(madd|stretch|long vowel)\b/i', $clean)) {
        return 'For madd, stretch the sound longer than a short vowel. Compare the short sound first, then stretch only as much as the lesson asks.';
    }
    if (preg_match('/\b(tanween|fathatan|kasratan|dammatan)\b/i', $clean)) {
        return 'Tanween adds a light n sound at the end. Read the vowel first, then add the ending n sound: an, in, or un.';
    }
    if (preg_match('/\b(shaddah|tashdeed|double|doubled)\b/i', $clean)) {
        return 'Shaddah means the letter is doubled. Hold the letter briefly, then release it with the vowel. Try it slowly twice before reading faster.';
    }
    if ($lettertip !== '') {
        return $lettertip . ' Now try this: say it slowly three times, then read it once with the mark from the lesson.';
    }
    if (preg_match('/\b(stuck|hard|difficult|confused|help|how)\b/i', $clean)) {
        return 'Let us take one small step. For ' . $unit['title'] . ', focus on this: ' . $unit['tip'] . ' After that, try one example and tell me which part is still difficult.';
    }

    return 'For this lesson, the main focus is ' . $unit['focus'] . ' Try this step: ' . $unit['tip'] . ' If it still feels unclear, ask me about the letter, mark, sound, or word you are looking at.';
}

function pqlvt_open_tutor_session(int $studentid, int $actorid, int $livesessionid, string $lessonid, string $unitid): int {
    global $DB;
    if (!pqlvt_virtual_tutor_tables_ready()) {
        return 0;
    }
    try {
        $now = time();
        $existing = $DB->get_record_sql(
            "SELECT *
               FROM {local_prequran_vt_session}
              WHERE studentid = :studentid
                AND createdby = :createdby
                AND source_type = :source_type
                AND session_status = :status
           ORDER BY timemodified DESC, id DESC",
            [
                'studentid' => $studentid,
                'createdby' => $actorid,
                'source_type' => 'teacher_live_session',
                'status' => 'active',
            ],
            IGNORE_MULTIPLE
        );
        $context = ['live_sessionid' => $livesessionid, 'lessonid' => $lessonid, 'unitid' => $unitid];
        if ($existing) {
            $existing->context_json = json_encode($context);
            $existing->lessonid = pqlvt_safe_key($lessonid);
            $existing->unitid = pqlvt_safe_key($unitid);
            $existing->timemodified = $now;
            $DB->update_record('local_prequran_vt_session', $existing);
            return (int)$existing->id;
        }
        return (int)$DB->insert_record('local_prequran_vt_session', (object)[
            'environment' => 'live',
            'studentid' => $studentid,
            'parentid' => 0,
            'teacherid' => $actorid,
            'createdby' => $actorid,
            'source_type' => 'teacher_live_session',
            'lessonid' => pqlvt_safe_key($lessonid),
            'unitid' => pqlvt_safe_key($unitid),
            'step_id' => '',
            'step_title' => '',
            'lesson_url' => '',
            'teacher_instructions' => 'Help the learner with the current live lesson one step at a time.',
            'context_json' => json_encode($context),
            'session_status' => 'active',
            'ai_mode' => 'guided_rule_based',
            'ai_model' => '',
            'summary' => '',
            'startedat' => $now,
            'closedat' => 0,
            'timecreated' => $now,
            'timemodified' => $now,
        ]);
    } catch (Throwable $e) {
        return 0;
    }
}

function pqlvt_log_tutor_message(int $chatsessionid, int $senderid, string $role, string $message, string $source): void {
    global $DB;
    if ($chatsessionid <= 0 || !pqlvt_virtual_tutor_tables_ready()) {
        return;
    }
    try {
        $DB->insert_record('local_prequran_vt_message', (object)[
            'sessionid' => $chatsessionid,
            'senderid' => $senderid,
            'sender_role' => $role,
            'message' => $message,
            'prompt_json' => '',
            'message_source' => $source,
            'safety_status' => 'ok',
            'timecreated' => time(),
        ]);
    } catch (Throwable $e) {
        return;
    }
}
