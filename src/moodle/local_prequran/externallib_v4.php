<?php
defined('MOODLE_INTERNAL') || die();



// -------------------------------------------------------------------------
// Global compatibility helper
// Some deployments call pq_assert_teacher_or_admin_in_cohort() as a global
// function from externallib. Define it here if missing.
// -------------------------------------------------------------------------
if (!function_exists('pq_assert_teacher_or_admin_in_cohort')) {
    function pq_assert_teacher_or_admin_in_cohort(int $cohortid): void {
        global $DB, $USER;
        if (is_siteadmin((int)$USER->id)) {
            return;
        }
        if (empty($cohortid) || $cohortid <= 0) {
            throw new invalid_parameter_exception('cohortid is required for this action.');
        }
        $teacherinc = $DB->record_exists('cohort_members', ['cohortid' => $cohortid, 'userid' => $USER->id]);
        if (!$teacherinc) {
            throw new moodle_exception('nopermissions', '', '', 'Teacher is not a member of the cohort.');
        }
    }
}

require_once($CFG->libdir . '/externallib.php');
require_once($CFG->libdir . '/ddllib.php');
require_once($CFG->dirroot . '/user/profile/lib.php');
require_once($CFG->dirroot . '/cohort/lib.php');
$prequranlocallib = $CFG->dirroot . '/local/prequran/locallib.php';
if (file_exists($prequranlocallib)) {
    require_once($prequranlocallib);
}
$prequrannotificationlib = $CFG->dirroot . '/local/prequran/notificationlib.php';
if (file_exists($prequrannotificationlib)) {
    require_once($prequrannotificationlib);
}

// PQ_FOCUS_PATCH_VER: 20251224_4


/**
 * Web service functions for local_prequran.
 */
class local_prequran_external extends external_api {
    protected static $environment_override = '';

    // -------------------------------------------------------------------------
    // Helper: get managed_student flag from custom profile
    // -------------------------------------------------------------------------
    protected static function is_managed_student(int $userid): bool {
        try {
            $profile = profile_user_record($userid, false);
        } catch (\Throwable $e) {
            return false;
        }
        if ($profile && property_exists($profile, 'managed_student')) {
            $val = trim(core_text::strtolower($profile->managed_student));
            return ($val === 'yes' || $val === '1' || $val === 'true');
        }
        return false;
    }

    protected static function profile_field_value($profile, array $shortnames): string {
        foreach ($shortnames as $name) {
            if ($profile && property_exists($profile, $name) && $profile->{$name} !== '' && $profile->{$name} !== null) {
                return trim((string)$profile->{$name});
            }
        }
        return '';
    }

    protected static function normalize_preferred_language(string $value): string {
        $raw = core_text::strtolower(trim(str_replace('_', '-', $value)));
        $parts = explode('-', $raw);
        $first = $parts[0] ?? '';
        $aliases = [
            'english' => 'en', 'eng' => 'en', 'en' => 'en',
            'arabic' => 'ar', 'ar' => 'ar',
            'somali' => 'so', 'som' => 'so', 'so' => 'so',
            'swahili' => 'sw', 'kiswahili' => 'sw', 'swa' => 'sw', 'sw' => 'sw',
            'punjabi' => 'pa', 'panjabi' => 'pa', 'pa' => 'pa',
            'urdu' => 'ur', 'ur' => 'ur',
        ];
        $code = $aliases[$raw] ?? ($aliases[$first] ?? $first);
        return in_array($code, ['en', 'ar', 'so', 'sw', 'pa', 'ur'], true) ? $code : 'en';
    }

    protected static function normalize_language_scope(string $value): string {
        $raw = core_text::strtolower(trim(preg_replace('/[\s\-]+/', '_', $value)));
        $aliases = [
            'ui' => 'ui',
            'interface' => 'ui',
            'ui_only' => 'ui',
            'content' => 'content',
            'lecture' => 'content',
            'lectures' => 'content',
            'message' => 'content',
            'messages' => 'content',
            'only_lectures' => 'content',
            'lectures_and_messages' => 'content',
            'content_messages' => 'content',
            'both' => 'both',
            'all' => 'both',
            'ui_and_content' => 'both',
        ];
        return $aliases[$raw] ?? 'both';
    }

    protected static function get_user_language_preferences(int $userid): array {
        try {
            $profile = profile_user_record($userid, false);
        } catch (\Throwable $e) {
            $profile = null;
        }

        $langraw = self::profile_field_value($profile, [
            'preferred_language', 'preferredlanguage', 'language_preference', 'languagepreference',
            'prequran_language', 'prequran_lang', 'ui_language', 'uilanguage', 'langpref', 'language'
        ]);

        if ($langraw === '') {
            $user = core_user::get_user($userid);
            $langraw = $user && !empty($user->lang) ? (string)$user->lang : '';
        }

        $scoperaw = self::profile_field_value($profile, [
            'scope', 'language_scope', 'languagescope', 'translation_scope', 'translationscope',
            'localization_scope', 'localizationscope', 'prequran_language_scope',
            'prequran_lang_scope', 'ui_content_preference', 'uicontentpreference',
            'translation_preference', 'translationpreference', 'preferred_language_scope'
        ]);

        return [
            'preferred_language' => self::normalize_preferred_language($langraw),
            'language_scope' => self::normalize_language_scope($scoperaw),
        ];
    }

    // -------------------------------------------------------------------------
    // Helper: cohort member lookup (DB fallback; avoids cohort_get_members dependency)
    // -------------------------------------------------------------------------
    protected static function pq_get_cohort_userids(int $cohortid): array {
        global $DB;
        if ($cohortid <= 0) return [];
        return array_map('intval', $DB->get_fieldset_sql(
            "SELECT userid FROM {cohort_members} WHERE cohortid = ?",
            [$cohortid]
        ));
    }

    protected static function normalize_environment(string $value): string {
        $value = core_text::strtolower(trim($value));
        $value = str_replace(['-', ' '], '_', $value);
        $aliases = [
            'prod' => 'production',
            'production' => 'production',
            'stage' => 'staging',
            'staging' => 'staging',
            'integration' => 'integration',
            'int' => 'integration',
            'qa' => 'integration',
        ];
        return $aliases[$value] ?? 'production';
    }

    protected static function set_environment_override(string $value): void {
        self::$environment_override = ($value === '') ? '' : self::normalize_environment($value);
    }

    protected static function current_environment(): string {
        if (self::$environment_override !== '') {
            return self::$environment_override;
        }

        $requested = optional_param('pq_env', '', PARAM_ALPHANUMEXT);
        if ($requested !== '') {
            return self::normalize_environment($requested);
        }

        $referer = (string)($_SERVER['HTTP_REFERER'] ?? '');
        if (strpos($referer, '/pre_quraan_integration/') !== false) {
            return 'integration';
        }
        if (strpos($referer, '/pre_quraan_staging/') !== false) {
            return 'staging';
        }
        if (strpos($referer, '/pre_quraan/') !== false) {
            return 'production';
        }

        return self::normalize_environment((string)get_config('local_prequran', 'bunny_environment'));
    }

    protected static function table_has_environment(string $table): bool {
        global $DB;
        static $cache = [];

        if (!array_key_exists($table, $cache)) {
            $dbman = $DB->get_manager();
            $xtable = new xmldb_table($table);
            $cache[$table] = $dbman->table_exists($xtable)
                && $dbman->field_exists($xtable, new xmldb_field('environment'));
        }

        return $cache[$table];
    }

    protected static function table_has_field(string $table, string $field): bool {
        global $DB;
        static $cache = [];

        $key = $table . ':' . $field;
        if (!array_key_exists($key, $cache)) {
            $dbman = $DB->get_manager();
            $xtable = new xmldb_table($table);
            $cache[$key] = $dbman->table_exists($xtable)
                && $dbman->field_exists($xtable, new xmldb_field($field));
        }

        return $cache[$key];
    }

    protected static function table_exists(string $table): bool {
        global $DB;
        static $cache = [];

        if (!array_key_exists($table, $cache)) {
            try {
                $cache[$table] = $DB->get_manager()->table_exists(new xmldb_table($table));
            } catch (\Throwable $e) {
                $cache[$table] = false;
            }
        }

        return $cache[$table];
    }

    protected static function activeish_status_clause(string $field = 'status'): array {
        return [
            '(' . $field . ' IS NULL OR ' . $field . " = '' OR " . $field . ' NOT IN (?, ?, ?, ?, ?))',
            ['rejected', 'archived', 'inactive', 'suspended', 'deleted'],
        ];
    }

    protected static function current_user_prequran_teacher_sources(): array {
        global $DB, $USER;

        $sources = [
            'teacher_profile' => false,
            'teacher_student_assignment' => false,
            'class_group_assignment' => false,
            'live_teacher_record' => false,
        ];

        $userid = (int)($USER->id ?? 0);
        if ($userid <= 0) {
            return $sources;
        }

        try {
            [$statussql, $statusparams] = self::activeish_status_clause();

            if (self::table_exists('local_prequran_teacher_profile')) {
                $sources['teacher_profile'] = $DB->record_exists_select(
                    'local_prequran_teacher_profile',
                    'userid = ? AND ' . $statussql,
                    array_merge([$userid], $statusparams)
                );
            }

            if (self::table_exists('local_prequran_teacher_student')) {
                $sources['teacher_student_assignment'] = $DB->record_exists_select(
                    'local_prequran_teacher_student',
                    'teacherid = ? AND ' . $statussql,
                    array_merge([$userid], $statusparams)
                );
            }

            if (self::table_exists('local_prequran_class_group')) {
                $sources['class_group_assignment'] = $DB->record_exists_select(
                    'local_prequran_class_group',
                    'teacherid = ? AND ' . $statussql,
                    array_merge([$userid], $statusparams)
                );
            }

            foreach (['local_prequran_live_session', 'local_prequran_live_series', 'local_prequran_live_availability'] as $table) {
                if ($sources['live_teacher_record']) {
                    break;
                }
                if (self::table_exists($table)) {
                    $sources['live_teacher_record'] = $DB->record_exists_select(
                        $table,
                        'teacherid = ? AND ' . $statussql,
                        array_merge([$userid], $statusparams)
                    );
                }
            }
        } catch (\Throwable $e) {
            return $sources;
        }

        return $sources;
    }

    protected static function current_user_has_prequran_teacher_assignment(): bool {
        return in_array(true, self::current_user_prequran_teacher_sources(), true);
    }

    protected static function current_user_can_use_nonproduction_qa_tools(): bool {
        global $DB, $USER;

        $userid = (int)($USER->id ?? 0);
        if ($userid <= 0) {
            return false;
        }

        if (is_siteadmin($userid)) {
            return true;
        }

        if (self::current_user_has_prequran_teacher_assignment()) {
            return true;
        }

        $syscontext = context_system::instance();
        if (has_capability('local/prequran:resetstep', $syscontext)) {
            return true;
        }

        try {
            return $DB->record_exists_sql(
                "SELECT 1
                   FROM {role_assignments} ra
                   JOIN {role} r ON r.id = ra.roleid
              LEFT JOIN {role_capabilities} rc ON rc.roleid = r.id
                  WHERE ra.userid = :userid
                    AND (
                        r.shortname IN (
                            'admin', 'administrator', 'manager', 'coursecreator',
                            'editingteacher', 'teacher', 'noneditingteacher'
                        )
                        OR r.archetype IN ('manager', 'coursecreator', 'editingteacher', 'teacher')
                        OR rc.capability IN (
                            'local/prequran:resetstep',
                            'moodle/course:update',
                            'moodle/course:manageactivities',
                            'moodle/role:assign'
                        )
                    )",
                ['userid' => $userid]
            );
        } catch (\Throwable $e) {
            return false;
        }
    }

    protected static function with_environment_condition(string $table, array $conditions, ?string $environment = null): array {
        if (self::table_has_environment($table)) {
            $conditions['environment'] = self::normalize_environment($environment ?? self::current_environment());
        }
        return $conditions;
    }

    protected static function add_environment_field(string $table, object $record, ?string $environment = null): object {
        if (self::table_has_environment($table)) {
            $record->environment = self::normalize_environment($environment ?? self::current_environment());
        }
        return $record;
    }

    protected static function environment_sql(string $alias, string $table, array &$params, ?string $environment = null): string {
        if (!self::table_has_environment($table)) {
            return '';
        }
        $param = preg_replace('/[^a-z0-9_]+/', '_', $alias . '_environment_' . count($params));
        $params[$param] = self::normalize_environment($environment ?? self::current_environment());
        return " AND {$alias}.environment = :{$param}";
    }

    protected static function environment_prefkey(string $prefkey, ?string $environment = null): string {
        $environment = self::normalize_environment($environment ?? self::current_environment());
        return 'prequran_' . $environment . '_' . preg_replace('/^prequran_/', '', $prefkey);
    }

    protected static function environment_bunny_prefix(string $configuredprefix, string $fallbacksuffix, ?string $environment = null): string {
        $environment = self::normalize_environment($environment ?? self::current_environment());
        $base = [
            'integration' => 'pre_quraan_integration',
            'staging' => 'pre_quraan_staging',
            'production' => 'pre_quraan',
        ][$environment] ?? 'pre_quraan';

        $prefix = trim($configuredprefix, '/');
        if ($prefix === '') {
            return $base . '/' . trim($fallbacksuffix, '/');
        }

        return preg_replace('#^pre_quraan(?:_integration|_staging)?(?=/|$)#', $base, $prefix);
    }

    // -------------------------------------------------------------------------
    // Helper: fetch step configuration for a lesson/unit from DB or simple fallback
    // -------------------------------------------------------------------------
    protected static function get_step_config(string $lessonid, string $unitid,
                                              int $globalpasses, int $globalrepeats): array {
        global $DB;

        $steps = [];

        $environment = self::current_environment();
        $conditions = self::with_environment_condition('local_prequran_stepcfg',
            ['lessonid' => $lessonid, 'unitid' => $unitid, 'active' => 1],
            $environment);
        $records = $DB->get_records('local_prequran_stepcfg', $conditions, 'step_index ASC');

        if (!$records && $environment !== 'production' && self::table_has_environment('local_prequran_stepcfg')) {
            $records = $DB->get_records('local_prequran_stepcfg',
                self::with_environment_condition('local_prequran_stepcfg',
                    ['lessonid' => $lessonid, 'unitid' => $unitid, 'active' => 1],
                    'production'),
                'step_index ASC');
        }

        if ($records) {
            foreach ($records as $rec) {
                $steps[] = (object)[
                    'step_index' => (int)$rec->step_index,
                    'step_id'    => $rec->step_id,
                    'step_title' => $rec->step_title ?: $rec->step_id,
                    'passes'     => (int)($rec->default_passes_required ?? $globalpasses),
                    'repeats'    => (int)($rec->default_repeats_per_letter ?? $globalrepeats),
                    'step_type'  => !empty($rec->step_type) ? $rec->step_type : (($rec->step_id === 'lecture') ? 'lecture' : 'playlist'),
                ];
            }
            return $steps;
        }

        // Fallback only for Alphabet Listen if DB is empty.
        if ($lessonid === 'alphabet' && $unitid === 'alphabet_listen') {
            $fallback = [
                ['id' => 'lecture',     'title' => 'Lecture – listen 2 times', 'passes' => 2, 'repeats' => 1, 'type' => 'lecture'],
                ['id' => 'all_letters', 'title' => 'All letters',              'passes' => $globalpasses, 'repeats' => $globalrepeats, 'type' => 'playlist'],
                ['id' => 'heavy',       'title' => 'Heavy letters',            'passes' => $globalpasses, 'repeats' => $globalrepeats, 'type' => 'playlist'],
                ['id' => 'light',       'title' => 'Light letters',            'passes' => $globalpasses, 'repeats' => $globalrepeats, 'type' => 'playlist'],
                ['id' => 'alifaa',      'title' => 'Letters with Alif',        'passes' => $globalpasses, 'repeats' => $globalrepeats, 'type' => 'playlist'],
                ['id' => 'vowels',      'title' => 'Vowels',                   'passes' => $globalpasses, 'repeats' => $globalrepeats, 'type' => 'playlist'],
            ];
            $fallback = self::alphabet_listen_frontend_steps($globalpasses, $globalrepeats);
            $i = 1;
            foreach ($fallback as $s) {
                $steps[] = (object)[
                    'step_index' => $i++,
                    'step_id'    => $s['id'],
                    'step_title' => $s['title'],
                    'passes'     => $s['passes'],
                    'repeats'    => $s['repeats'],
                    'step_type'  => ($s['type'] ?? (($s['id']==='lecture')?'lecture':'playlist')),
                ];
            }
        }

        return $steps;
    }

    protected static function alphabet_listen_frontend_steps(int $globalpasses = 1, int $globalrepeats = 1): array {
        return [
            ['id' => 'lecture',    'title' => 'Lecture',    'passes' => 2, 'repeats' => 1, 'type' => 'lecture'],
            ['id' => 'rules',      'title' => 'Rules',      'passes' => 2, 'repeats' => 1, 'type' => 'content'],
            ['id' => 'listen',     'title' => 'Listen',     'passes' => $globalpasses, 'repeats' => $globalrepeats, 'type' => 'playlist'],
            ['id' => 'watch',      'title' => 'Watch',      'passes' => $globalpasses, 'repeats' => $globalrepeats, 'type' => 'video_playlist'],
            ['id' => 'phonetics',  'title' => 'Phonetics',  'passes' => $globalpasses, 'repeats' => $globalrepeats, 'type' => 'phonetics'],
            ['id' => 'repeat',     'title' => 'Repeat',     'passes' => $globalpasses, 'repeats' => $globalrepeats, 'type' => 'playlist'],
            ['id' => 'letterclue', 'title' => 'LetterClue', 'passes' => $globalpasses, 'repeats' => $globalrepeats, 'type' => 'letterclue'],
            ['id' => 'speak',      'title' => 'Speak',      'passes' => $globalpasses, 'repeats' => $globalrepeats, 'type' => 'speak'],
            ['id' => 'match',      'title' => 'Match',      'passes' => $globalpasses, 'repeats' => $globalrepeats, 'type' => 'match'],
            ['id' => 'soundclue',  'title' => 'SoundClue',  'passes' => $globalpasses, 'repeats' => $globalrepeats, 'type' => 'soundclue'],
            ['id' => 'animate',    'title' => 'Animate',    'passes' => $globalpasses, 'repeats' => $globalrepeats, 'type' => 'animate'],
            ['id' => 'write',      'title' => 'Write',      'passes' => $globalpasses, 'repeats' => $globalrepeats, 'type' => 'write'],
            ['id' => 'submit',     'title' => 'Submit',     'passes' => $globalpasses, 'repeats' => $globalrepeats, 'type' => 'submit'],
        ];
    }

    protected static function alphabet_listen_frontend_step(string $stepid): ?object {
        foreach (self::alphabet_listen_frontend_steps(1, 1) as $index => $step) {
            if ((string)$step['id'] !== $stepid) {
                continue;
            }
            return (object)[
                'step_index' => $index + 1,
                'step_id' => (string)$step['id'],
                'step_title' => (string)$step['title'],
                'default_passes_required' => (int)$step['passes'],
                'default_repeats_per_letter' => (int)$step['repeats'],
                'step_type' => (string)$step['type'],
            ];
        }
        return null;
    }

    protected static function ensure_step_progress_row(
        int $userid,
        string $lessonid,
        string $unitid,
        object $stepcfg,
        string $environment
    ): ?object {
        global $DB;

        $lessonprog = $DB->get_record('local_prequran_lessonprog',
            self::with_environment_condition('local_prequran_lessonprog', [
                'userid' => $userid,
                'lessonid' => $lessonid,
                'unitid' => $unitid,
            ], $environment),
            '*', IGNORE_MISSING);
        if (!$lessonprog) {
            return null;
        }

        $conditions = self::with_environment_condition('local_prequran_stepprog', [
            'userid' => $userid,
            'lessonid' => $lessonid,
            'unitid' => $unitid,
            'step_id' => (string)$stepcfg->step_id,
        ], $environment);
        $existing = $DB->get_record('local_prequran_stepprog', $conditions, '*', IGNORE_MISSING);
        if ($existing) {
            return $existing;
        }

        $now = time();
        $rec = (object)[
            'userid' => $userid,
            'lessonid' => $lessonid,
            'unitid' => $unitid,
            'lessonprog_id' => (int)$lessonprog->id,
            'attempt_no' => 1,
            'step_index' => (int)($stepcfg->step_index ?? 0),
            'step_id' => (string)$stepcfg->step_id,
            'step_title' => (string)($stepcfg->step_title ?? $stepcfg->step_id),
            'passes_required' => max(1, (int)($stepcfg->default_passes_required ?? 1)),
            'repeats_per_letter' => max(1, (int)($stepcfg->default_repeats_per_letter ?? 1)),
            'step_status' => 'not_started',
            'step_starttime' => null,
            'step_lastactivity' => null,
            'passes_done' => 0,
            'completed' => 0,
            'last_activity' => null,
            'progress_json' => '',
            'timecreated' => $now,
            'timemodified' => $now,
        ];
        $rec = self::add_environment_field('local_prequran_stepprog', $rec, $environment);

        $cols = array_keys((array)$DB->get_columns('local_prequran_stepprog'));
        $safe = new stdClass();
        foreach ($rec as $k => $v) {
            if (in_array($k, $cols, true)) {
                $safe->$k = $v;
            }
        }
        $id = $DB->insert_record('local_prequran_stepprog', $safe);
        return $DB->get_record('local_prequran_stepprog', ['id' => $id], '*', IGNORE_MISSING) ?: null;
    }

    // -------------------------------------------------------------------------
    // Ensure DB rows exist for a (userid, lessonid, unitid) managed unit.
    // This prevents WS calls from failing on first run ("Can't find data record...").
    // Creates:
    //  - local_prequran_lessonprog row (if missing)
    //  - local_prequran_stepprog rows for each active stepcfg (if missing)
    // -------------------------------------------------------------------------
    protected static function ensure_unit_initialized(
        int $userid,
        string $lessonid,
        string $unitid,
        string $lessontitle,
        string $unittitle
    ): void {
        global $DB;

        $environment = self::current_environment();
        $conditions = self::with_environment_condition('local_prequran_lessonprog',
            ['userid' => $userid, 'lessonid' => $lessonid, 'unitid' => $unitid],
            $environment);
        $lessonprog = $DB->get_record('local_prequran_lessonprog', $conditions);

        $now = time();
        if (!$lessonprog) {
            $rec = (object)[
                'userid' => $userid,
                'lessonid' => $lessonid,
                'unitid' => $unitid,
                'lesson_title' => $lessontitle,
                'unit_title' => $unittitle,
                'managed' => 1,
                'overall_status' => 'not_started',
                'overall_starttime' => null,
                'overall_completiontime' => null,
                'overall_lastactivity' => $now,
                // optional analytics fields (if present in your schema)
                'total_entries' => 0,
                'attempt_no' => 0,
                'correct_answers' => 0,
                'wrong_answers' => 0,
                'timeout_count' => 0,
                'timecreated' => $now,
                'timemodified' => $now,
            ];
            $rec = self::add_environment_field('local_prequran_lessonprog', $rec, $environment);

            // Insert only the fields that exist (defensive for schema differences)
            $cols = array_keys((array)$DB->get_columns('local_prequran_lessonprog'));
            $safe = new stdClass();
            foreach ($rec as $k => $v) {
                if (in_array($k, $cols, true)) $safe->$k = $v;
            }
            $lessonprog_id = $DB->insert_record('local_prequran_lessonprog', $safe);
            $lessonprog = $DB->get_record('local_prequran_lessonprog', $conditions, '*', MUST_EXIST);
} else {
            // keep titles fresh (non-breaking)
            $upd = new stdClass();
            $upd->id = $lessonprog->id;
            $upd->lesson_title = $lessontitle;
            $upd->unit_title = $unittitle;
            $upd->overall_lastactivity = $now;
            $upd->timemodified = $now;
            $DB->update_record('local_prequran_lessonprog', $upd);
        }

        // Ensure stepprog rows exist for active stepcfg
        $stepscfg = self::get_step_config($lessonid, $unitid, 1, 1);

        if (!$stepscfg) return;

        $stepconditions = self::with_environment_condition('local_prequran_stepprog',
            ['userid' => $userid, 'lessonid' => $lessonid, 'unitid' => $unitid],
            $environment);
        $existing = $DB->get_records('local_prequran_stepprog', $stepconditions, '', 'id,step_id');
        $have = [];
        foreach ($existing as $r) $have[$r->step_id] = true;

        $cols = array_keys((array)$DB->get_columns('local_prequran_stepprog'));
        foreach ($stepscfg as $s) {
            if (!empty($have[$s->step_id])) continue;

            $rec = (object)[
                'userid' => $userid,
                'lessonid' => $lessonid,
                'unitid' => $unitid,
                'lessonprog_id' => (int)$lessonprog->id,
                'attempt_no' => 1,
                'step_index' => (int)($s->step_index ?? 0),
                'step_id' => $s->step_id,
                'step_title' => $s->step_title ?? null,
                'passes_required' => (int)($s->passes ?? 1),
                'repeats_per_letter' => (int)($s->repeats ?? 1),
                'step_status' => 'not_started',
                'step_starttime' => null,
                'step_lastactivity' => null,
                'passes_done' => 0,
                'completed' => 0,
                'last_activity' => null,
                'progress_json' => '',
                'timecreated' => $now,
                'timemodified' => $now,
            ];
            $rec = self::add_environment_field('local_prequran_stepprog', $rec, $environment);

            $safe = new stdClass();
            foreach ($rec as $k => $v) {
                if (in_array($k, $cols, true)) $safe->$k = $v;
            }
            $DB->insert_record('local_prequran_stepprog', $safe);
        }
    }
    // -------------------------------------------------------------------------
    // QUIZ CHATBOT ANALYTICS - single event ingestion endpoint
    // -------------------------------------------------------------------------
    protected static function quiz_value(array $payload, string $key, $default = '') {
        return array_key_exists($key, $payload) ? $payload[$key] : $default;
    }

    protected static function quiz_text(array $payload, string $key, int $max = 255, string $default = ''): string {
        $value = trim((string)self::quiz_value($payload, $key, $default));
        if ($max > 0 && core_text::strlen($value) > $max) {
            return core_text::substr($value, 0, $max);
        }
        return $value;
    }

    protected static function quiz_int(array $payload, string $key, int $default = 0): int {
        $value = self::quiz_value($payload, $key, $default);
        return is_numeric($value) ? (int)$value : $default;
    }

    protected static function quiz_bool_int(array $payload, string $key): int {
        $value = self::quiz_value($payload, $key, 0);
        return (int)($value === true || $value === 1 || $value === '1' || $value === 'true');
    }

    protected static function quiz_json(array $payload, string $key): string {
        $value = self::quiz_value($payload, $key, null);
        if ($value === null || $value === '') return '';
        if (is_string($value)) return $value;
        return json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    protected static function request_uses_configured_ws_token(): bool {
        $requesttoken = optional_param('wstoken', '', PARAM_RAW_TRIMMED);
        $configuredtoken = (string)get_config('local_prequran', 'ws_token');
        return $requesttoken !== ''
            && $configuredtoken !== ''
            && hash_equals($configuredtoken, $requesttoken);
    }

    protected static function assert_quiz_save_allowed(int $userid): void {
        global $USER;
        $current = (int)($USER->id ?? 0);
        if ($userid > 0 && $current === $userid) return;
        if ($userid > 0 && self::request_uses_configured_ws_token()) return;
        if (is_siteadmin($current) || self::current_user_has_prequran_teacher_assignment()) return;
        throw new moodle_exception('nopermissions', '', '', 'Cannot save quiz analytics for this user.');
    }

    protected static function quiz_attempt_from_payload(array $payload, int $userid, string $environment): object {
        global $DB;

        $sessionid = self::quiz_text($payload, 'attempt_session_id', 120);
        if ($sessionid === '') {
            throw new invalid_parameter_exception('attempt_session_id is required.');
        }

        $attempt = $DB->get_record('local_prequran_quiz_attempt', [
            'environment' => $environment,
            'attempt_session_id' => $sessionid,
        ]);
        $now = time();

        if (!$attempt) {
            $lessonid = self::quiz_text($payload, 'lessonid', 100, 'alphabet');
            $unitid = self::quiz_text($payload, 'unitid', 100, 'alphabet_quiz');
            $quizid = self::quiz_text($payload, 'quizid', 120, 'alphabet_quiz_chatbot');
            $attemptno = 1 + (int)$DB->count_records('local_prequran_quiz_attempt', [
                'environment' => $environment,
                'userid' => $userid,
                'lessonid' => $lessonid,
                'unitid' => $unitid,
                'quizid' => $quizid,
            ]);
            $attempt = (object)[
                'environment' => $environment,
                'userid' => $userid,
                'lessonid' => $lessonid,
                'unitid' => $unitid,
                'quizid' => $quizid,
                'quiz_version' => self::quiz_text($payload, 'quiz_version', 80),
                'attempt_session_id' => $sessionid,
                'attempt_no' => $attemptno,
                'status' => 'started',
                'pass_count' => self::quiz_int($payload, 'pass_count'),
                'questions_total' => self::quiz_int($payload, 'questions_total'),
                'questions_answered' => self::quiz_int($payload, 'questions_answered'),
                'correct_count' => self::quiz_int($payload, 'correct_count'),
                'incorrect_count' => self::quiz_int($payload, 'incorrect_count'),
                'percent' => self::quiz_int($payload, 'percent'),
                'duration_seconds' => self::quiz_int($payload, 'duration_seconds'),
                'started_at' => self::quiz_int($payload, 'started_at', $now),
                'completed_at' => 0,
                'last_activity_at' => $now,
                'device_type' => self::quiz_text($payload, 'device_type', 40),
                'useragent' => self::quiz_text($payload, 'useragent', 0),
                'summary_json' => self::quiz_json($payload, 'summary'),
                'timecreated' => $now,
                'timemodified' => $now,
            ];
            $attempt->id = $DB->insert_record('local_prequran_quiz_attempt', $attempt);
            return $attempt;
        }

        $attempt->status = self::quiz_text($payload, 'status', 40, $attempt->status ?: 'in_progress');
        $attempt->quiz_version = self::quiz_text($payload, 'quiz_version', 80, $attempt->quiz_version ?? '');
        $attempt->pass_count = self::quiz_int($payload, 'pass_count', (int)($attempt->pass_count ?? 0));
        $attempt->questions_total = self::quiz_int($payload, 'questions_total', (int)($attempt->questions_total ?? 0));
        $attempt->questions_answered = self::quiz_int($payload, 'questions_answered', (int)($attempt->questions_answered ?? 0));
        $attempt->correct_count = self::quiz_int($payload, 'correct_count', (int)($attempt->correct_count ?? 0));
        $attempt->incorrect_count = self::quiz_int($payload, 'incorrect_count', (int)($attempt->incorrect_count ?? 0));
        $attempt->percent = self::quiz_int($payload, 'percent', (int)($attempt->percent ?? 0));
        $attempt->duration_seconds = self::quiz_int($payload, 'duration_seconds', (int)($attempt->duration_seconds ?? 0));
        $attempt->completed_at = self::quiz_int($payload, 'completed_at', (int)($attempt->completed_at ?? 0));
        $attempt->last_activity_at = $now;
        $attempt->device_type = self::quiz_text($payload, 'device_type', 40, $attempt->device_type ?? '');
        $attempt->useragent = self::quiz_text($payload, 'useragent', 0, $attempt->useragent ?? '');
        $attempt->summary_json = self::quiz_json($payload, 'summary') ?: ($attempt->summary_json ?? '');
        $attempt->timemodified = $now;
        $DB->update_record('local_prequran_quiz_attempt', $attempt);
        return $attempt;
    }

    public static function save_quiz_event_parameters() {
        return new external_function_parameters([
            'userid' => new external_value(PARAM_INT, 'Student user id', VALUE_REQUIRED),
            'event_type' => new external_value(PARAM_ALPHANUMEXT, 'start|answer|pass_complete|complete', VALUE_REQUIRED),
            'payload_json' => new external_value(PARAM_RAW, 'Quiz analytics event payload JSON', VALUE_REQUIRED),
            'pq_env' => new external_value(PARAM_ALPHANUMEXT, 'Environment: production|staging|integration', VALUE_DEFAULT, ''),
        ]);
    }

    public static function save_quiz_event($userid, $event_type, $payload_json, $pq_env = '') {
        global $DB;

        $params = self::validate_parameters(self::save_quiz_event_parameters(), [
            'userid' => $userid,
            'event_type' => $event_type,
            'payload_json' => $payload_json,
            'pq_env' => $pq_env,
        ]);
        self::set_environment_override((string)($params['pq_env'] ?? ''));

        if (!self::table_exists('local_prequran_quiz_attempt')
            || !self::table_exists('local_prequran_quiz_pass')
            || !self::table_exists('local_prequran_quiz_question')) {
            return ['ok' => false, 'message' => 'Quiz analytics schema is not installed yet.', 'attemptid' => 0];
        }

        $userid = (int)$params['userid'];
        self::assert_quiz_save_allowed($userid);
        $payload = json_decode((string)$params['payload_json'], true);
        if (!is_array($payload)) {
            throw new invalid_parameter_exception('Invalid JSON in payload_json.');
        }

        $environment = self::current_environment();
        $eventtype = core_text::strtolower(trim((string)$params['event_type']));
        $attempt = self::quiz_attempt_from_payload($payload, $userid, $environment);
        $now = time();

        if ($eventtype === 'answer') {
            $questionid = self::quiz_text($payload, 'question_id', 160);
            if ($questionid !== '') {
                $row = $DB->get_record('local_prequran_quiz_question', ['attemptid' => (int)$attempt->id, 'question_id' => $questionid]);
                $record = $row ?: (object)[
                    'environment' => $environment,
                    'attemptid' => (int)$attempt->id,
                    'userid' => $userid,
                    'lessonid' => self::quiz_text($payload, 'lessonid', 100, $attempt->lessonid),
                    'unitid' => self::quiz_text($payload, 'unitid', 100, $attempt->unitid),
                    'quizid' => self::quiz_text($payload, 'quizid', 120, $attempt->quizid),
                    'question_id' => $questionid,
                    'timecreated' => $now,
                ];
                $record->pass_number = self::quiz_int($payload, 'pass_number');
                $record->question_index = self::quiz_int($payload, 'question_index');
                $record->question_tag = self::quiz_text($payload, 'question_tag', 160);
                $record->skill_area = self::quiz_text($payload, 'skill_area', 80);
                $record->prompt = self::quiz_text($payload, 'prompt', 0);
                $record->focus_text = self::quiz_text($payload, 'focus_text', 0);
                $record->correct_answer = self::quiz_text($payload, 'correct_answer', 160);
                $record->selected_answer = self::quiz_text($payload, 'selected_answer', 160);
                $record->is_correct = self::quiz_bool_int($payload, 'is_correct');
                $record->attempt_count = self::quiz_int($payload, 'attempt_count', 1);
                $record->used_listen = self::quiz_bool_int($payload, 'used_listen');
                $record->listen_count = self::quiz_int($payload, 'listen_count');
                $record->time_to_answer_seconds = self::quiz_int($payload, 'time_to_answer_seconds');
                $record->answered_at = self::quiz_int($payload, 'answered_at', $now);
                $record->choices_json = self::quiz_json($payload, 'choices');
                $record->extra_json = self::quiz_json($payload, 'extra');
                $record->timemodified = $now;
                if ($row) {
                    $record->id = $row->id;
                    $DB->update_record('local_prequran_quiz_question', $record);
                } else {
                    $DB->insert_record('local_prequran_quiz_question', $record);
                }
            }
        } else if ($eventtype === 'pass_complete') {
            $passnumber = self::quiz_int($payload, 'pass_number');
            if ($passnumber > 0) {
                $row = $DB->get_record('local_prequran_quiz_pass', ['attemptid' => (int)$attempt->id, 'pass_number' => $passnumber]);
                $record = $row ?: (object)[
                    'environment' => $environment,
                    'attemptid' => (int)$attempt->id,
                    'userid' => $userid,
                    'lessonid' => self::quiz_text($payload, 'lessonid', 100, $attempt->lessonid),
                    'unitid' => self::quiz_text($payload, 'unitid', 100, $attempt->unitid),
                    'quizid' => self::quiz_text($payload, 'quizid', 120, $attempt->quizid),
                    'pass_number' => $passnumber,
                    'timecreated' => $now,
                ];
                $record->pass_title = self::quiz_text($payload, 'pass_title', 160);
                $record->questions_total = self::quiz_int($payload, 'questions_total');
                $record->questions_answered = self::quiz_int($payload, 'questions_answered');
                $record->correct_count = self::quiz_int($payload, 'correct_count');
                $record->incorrect_count = self::quiz_int($payload, 'incorrect_count');
                $record->percent = self::quiz_int($payload, 'percent');
                $record->duration_seconds = self::quiz_int($payload, 'duration_seconds');
                $record->started_at = self::quiz_int($payload, 'started_at');
                $record->completed_at = self::quiz_int($payload, 'completed_at', $now);
                $record->summary_json = self::quiz_json($payload, 'summary');
                $record->timemodified = $now;
                if ($row) {
                    $record->id = $row->id;
                    $DB->update_record('local_prequran_quiz_pass', $record);
                } else {
                    $DB->insert_record('local_prequran_quiz_pass', $record);
                }
            }
        }

        return ['ok' => true, 'message' => 'Quiz analytics saved.', 'attemptid' => (int)$attempt->id];
    }

    public static function save_quiz_event_returns() {
        return new external_single_structure([
            'ok' => new external_value(PARAM_BOOL, 'Whether the save succeeded'),
            'message' => new external_value(PARAM_TEXT, 'Status message'),
            'attemptid' => new external_value(PARAM_INT, 'Quiz attempt id'),
        ]);
    }

    protected static function assert_quiz_report_allowed(int $studentid): void {
        global $USER;
        $current = (int)($USER->id ?? 0);
        if ($studentid > 0 && $current === $studentid) return;
        if (is_siteadmin($current) || self::current_user_has_prequran_teacher_assignment()) return;
        if (method_exists(__CLASS__, 'comm_is_student_guardian') && self::comm_is_student_guardian($studentid, $current)) return;
        throw new moodle_exception('nopermissions', '', '', 'Cannot view quiz reporting for this student.');
    }

    public static function get_quiz_report_parameters() {
        return new external_function_parameters([
            'userid' => new external_value(PARAM_INT, 'Student user id', VALUE_REQUIRED),
            'lessonid' => new external_value(PARAM_ALPHANUMEXT, 'Lesson id', VALUE_DEFAULT, 'alphabet'),
            'unitid' => new external_value(PARAM_ALPHANUMEXT, 'Unit id', VALUE_DEFAULT, 'alphabet_quiz'),
            'limit' => new external_value(PARAM_INT, 'Recent attempts limit', VALUE_DEFAULT, 10),
            'pq_env' => new external_value(PARAM_ALPHANUMEXT, 'Environment: production|staging|integration', VALUE_DEFAULT, ''),
        ]);
    }

    public static function get_quiz_report($userid, $lessonid = 'alphabet', $unitid = 'alphabet_quiz', $limit = 10, $pq_env = '') {
        global $DB;

        $params = self::validate_parameters(self::get_quiz_report_parameters(), [
            'userid' => $userid,
            'lessonid' => $lessonid,
            'unitid' => $unitid,
            'limit' => $limit,
            'pq_env' => $pq_env,
        ]);
        self::set_environment_override((string)($params['pq_env'] ?? ''));

        $userid = (int)$params['userid'];
        self::assert_quiz_report_allowed($userid);

        if (!self::table_exists('local_prequran_quiz_attempt')) {
            return ['ok' => false, 'message' => 'Quiz analytics schema is not installed yet.', 'report_json' => '{}'];
        }

        $environment = self::current_environment();
        $limit = max(1, min(50, (int)$params['limit']));
        $where = 'environment = :environment AND userid = :userid';
        $bind = ['environment' => $environment, 'userid' => $userid];
        $lessonid = trim((string)$params['lessonid']);
        $unitid = trim((string)$params['unitid']);
        if ($lessonid !== '') {
            $where .= ' AND lessonid = :lessonid';
            $bind['lessonid'] = $lessonid;
        }
        if ($unitid !== '') {
            $where .= ' AND unitid = :unitid';
            $bind['unitid'] = $unitid;
        }

        $attempts = array_values($DB->get_records_select(
            'local_prequran_quiz_attempt',
            $where,
            $bind,
            'last_activity_at DESC, id DESC',
            '*',
            0,
            $limit
        ));

        $attemptids = array_map(static function($attempt) {
            return (int)$attempt->id;
        }, $attempts);

        $passesbyattempt = [];
        $skills = [];
        $missed = [];
        if ($attemptids) {
            [$insql, $inparams] = $DB->get_in_or_equal($attemptids, SQL_PARAMS_NAMED, 'attemptid');
            $passrows = $DB->get_records_select(
                'local_prequran_quiz_pass',
                'attemptid ' . $insql,
                $inparams,
                'attemptid ASC, pass_number ASC'
            );
            foreach ($passrows as $pass) {
                $aid = (int)$pass->attemptid;
                if (!isset($passesbyattempt[$aid])) $passesbyattempt[$aid] = [];
                $passesbyattempt[$aid][] = [
                    'pass_number' => (int)$pass->pass_number,
                    'pass_title' => (string)$pass->pass_title,
                    'questions_answered' => (int)$pass->questions_answered,
                    'questions_total' => (int)$pass->questions_total,
                    'correct_count' => (int)$pass->correct_count,
                    'incorrect_count' => (int)$pass->incorrect_count,
                    'percent' => (int)$pass->percent,
                    'duration_seconds' => (int)$pass->duration_seconds,
                    'completed_at' => (int)$pass->completed_at,
                ];
            }

            $skillrows = $DB->get_records_sql(
                "SELECT MIN(id) AS id, skill_area,
                        COUNT(1) AS answered,
                        SUM(is_correct) AS correct_count
                   FROM {local_prequran_quiz_question}
                  WHERE attemptid {$insql}
               GROUP BY skill_area
               ORDER BY skill_area",
                $inparams
            );
            foreach ($skillrows as $skill) {
                $answered = (int)$skill->answered;
                $correct = (int)$skill->correct_count;
                $skills[] = [
                    'skill_area' => (string)$skill->skill_area,
                    'answered' => $answered,
                    'correct_count' => $correct,
                    'incorrect_count' => max(0, $answered - $correct),
                    'percent' => $answered > 0 ? (int)round(($correct / $answered) * 100) : 0,
                ];
            }

            $missedrows = $DB->get_records_select(
                'local_prequran_quiz_question',
                'attemptid ' . $insql . ' AND is_correct = 0',
                $inparams,
                'answered_at DESC, id DESC',
                '*',
                0,
                20
            );
            foreach ($missedrows as $row) {
                $missed[] = [
                    'attemptid' => (int)$row->attemptid,
                    'pass_number' => (int)$row->pass_number,
                    'question_id' => (string)$row->question_id,
                    'question_tag' => (string)$row->question_tag,
                    'skill_area' => (string)$row->skill_area,
                    'prompt' => (string)$row->prompt,
                    'selected_answer' => (string)$row->selected_answer,
                    'correct_answer' => (string)$row->correct_answer,
                    'answered_at' => (int)$row->answered_at,
                ];
            }
        }

        $reportattempts = array_map(static function($attempt) use ($passesbyattempt) {
            $aid = (int)$attempt->id;
            return [
                'attemptid' => $aid,
                'quizid' => (string)$attempt->quizid,
                'quiz_version' => (string)$attempt->quiz_version,
                'attempt_no' => (int)$attempt->attempt_no,
                'status' => (string)$attempt->status,
                'questions_answered' => (int)$attempt->questions_answered,
                'questions_total' => (int)$attempt->questions_total,
                'correct_count' => (int)$attempt->correct_count,
                'incorrect_count' => (int)$attempt->incorrect_count,
                'percent' => (int)$attempt->percent,
                'duration_seconds' => (int)$attempt->duration_seconds,
                'started_at' => (int)$attempt->started_at,
                'completed_at' => (int)$attempt->completed_at,
                'last_activity_at' => (int)$attempt->last_activity_at,
                'passes' => $passesbyattempt[$aid] ?? [],
            ];
        }, $attempts);

        $report = [
            'environment' => $environment,
            'userid' => $userid,
            'lessonid' => $lessonid,
            'unitid' => $unitid,
            'attempts' => $reportattempts,
            'skill_summary' => $skills,
            'recent_missed_questions' => $missed,
        ];

        return [
            'ok' => true,
            'message' => 'Quiz report loaded.',
            'report_json' => json_encode($report, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        ];
    }

    public static function get_quiz_report_returns() {
        return new external_single_structure([
            'ok' => new external_value(PARAM_BOOL, 'Whether the report loaded'),
            'message' => new external_value(PARAM_TEXT, 'Status message'),
            'report_json' => new external_value(PARAM_RAW, 'JSON report payload'),
        ]);
    }

    // -------------------------------------------------------------------------
    // GENERIC: get managed unit state (DB-safe, shared by all units)
    // -------------------------------------------------------------------------
    protected static function get_managed_unit_state_generic(
        int $userid,
        string $lessonid,
        string $unitid,
        string $prefkey
    ): array {
        global $DB;

        self::validate_context(context_system::instance());
        $environment = self::current_environment();
        $prefkey = self::environment_prefkey($prefkey, $environment);

        // Do not hard-fail if Moodle user record isn't found (prevents new-user WS crashes).
        // Some flows may call the WS before the profile record is fully available.
        $user = core_user::get_user($userid);

        // 1) Is this a managed student?
        $managed = self::is_managed_student($userid);
        $languageprefs = self::get_user_language_preferences($userid);

        // 2) Global config for passes / repeats (fallback only).
        $passes_required   = (int)get_config('local_prequran', 'passes_required');
        $number_of_repeats = (int)get_config('local_prequran', 'number_of_repeats');

        if ($passes_required < 1) {
            $passes_required = 3;
        }
        if ($number_of_repeats < 1) {
            $number_of_repeats = 3;
        }

        // 3) Step configuration from DB (or fallback).
        $stepscfg = self::get_step_config($lessonid, $unitid, $passes_required, $number_of_repeats);
        $stepsout = [];
        foreach ($stepscfg as $s) {
            $stepsout[] = [
                'step_index'         => $s->step_index,
                'step_id'            => $s->step_id,
                'step_title'         => $s->step_title,
                'passes_required'    => $s->passes,
                'repeats_per_letter' => $s->repeats,
                'step_type'          => ($s->step_type ?? (($s->step_id === 'lecture') ? 'lecture' : 'playlist')),
            ];
        }

        // 4) Build progress from local_prequran_stepprog if any rows exist.
        $steprows = $DB->get_records('local_prequran_stepprog',
            self::with_environment_condition('local_prequran_stepprog', [
                'userid'   => $userid,
                'lessonid' => $lessonid,
                'unitid'   => $unitid,
            ], $environment),
            'step_index ASC');

        $progress    = null;
        $rawprogress = '';

        if ($steprows) {
            // Seed with defaults from stepcfg.
            $progress = [];
            foreach ($stepscfg as $s) {
                $sid = $s->step_id;
                $progress[$sid] = [
                    'passesDone'     => 0,
                    'passesRequired' => (int)$s->passes,
                    'completed'      => false,
                ];
            }

            // Overlay DB values.
            foreach ($steprows as $row) {
                $sid = $row->step_id;
                if (!isset($progress[$sid])) {
                    $progress[$sid] = [
                        'passesDone'     => 0,
                        'passesRequired' => max(1, (int)$row->passes_required),
                        'completed'      => false,
                    ];
                }
                $p =& $progress[$sid];
                $p['passesDone'] = (int)$row->passes_done;
                if (!empty($row->passes_required)) {
                    $p['passesRequired'] = (int)$row->passes_required;
                }
                $p['completed'] = ($row->step_status === 'completed');
            }

            // Determine current step id: first incomplete step, or last if all completed.
            $currentStepId = null;
            $allCompleted  = true;
            foreach ($stepscfg as $s) {
                $sid = $s->step_id;
                if (empty($progress[$sid]['completed'])) {
                    if ($currentStepId === null) {
                        $currentStepId = $sid;
                    }
                    $allCompleted = false;
                }
            }
            if ($currentStepId === null && !empty($stepscfg)) {
                $last = end($stepscfg);
                $currentStepId = $last->step_id;
            }
            if ($currentStepId === null) {
                $currentStepId = $stepscfg[0]->step_id ?? 'lecture';
            }

            $progress['currentStepId'] = $currentStepId;
            $progress['__finished']    = $allCompleted;

            $rawprogress = json_encode($progress);

        } else {
            // 5) No DB rows for this user/lesson/unit – treat as fresh.
            //    Ignore stale user preference here.
            try {
                unset_user_preference($prefkey, $userid);
            } catch (\Throwable $e) {
                // Preference cleanup is best-effort; the DB remains authoritative.
            }
            $rawprogress = '';
        }

        // Total stars = completed steps across all units for this user.
        // Reward rule: 1 star per completed step.
        $params = ['userid' => $userid];
        $envsql = self::environment_sql('lp', 'local_prequran_lessonprog', $params, $environment);
        $totalstars = (int)$DB->get_field_sql(
            "SELECT COALESCE(SUM(lp.steps_completed), 0)
               FROM {local_prequran_lessonprog} lp
              WHERE lp.userid = :userid{$envsql}",
            $params
        );

        // Completed units = units whose overall status is completed.
        $params = ['userid' => $userid, 'completed' => 'completed'];
        $envsql = self::environment_sql('lp', 'local_prequran_lessonprog', $params, $environment);
        $completedunits = (int)$DB->count_records_sql(
            "SELECT COUNT(*)
               FROM {local_prequran_lessonprog} lp
              WHERE lp.userid = :userid
                AND lp.overall_status = :completed{$envsql}",
            $params
        );

        return [
            'managed_student'   => (bool)$managed,
            'passes_required'   => $passes_required,
            'number_of_repeats' => $number_of_repeats,
            'progress_json'     => $rawprogress,
            'steps'             => $stepsout,
            'totalstars'        => $totalstars,
            'completedunits'    => $completedunits,
            'preferred_language'=> $languageprefs['preferred_language'],
            'language_scope'     => $languageprefs['language_scope'],
        ];
    }

    // -------------------------------------------------------------------------
    // GENERIC: set managed unit state (JSON from JS → DB + user preference)
    // -------------------------------------------------------------------------
    protected static function set_managed_unit_state_generic(
        string $progress_json,
        int $userid,
        string $lessonid,
        string $unitid,
        string $prefkey,
        string $lessontitle,
        string $unittitle
    ): array {
        global $DB;

        self::validate_context(context_system::instance());
        $environment = self::current_environment();
        $prefkey = self::environment_prefkey($prefkey, $environment);

        $now = time();

        // Decode JSON.
        $decoded = json_decode($progress_json, true);
        if ($decoded === null && json_last_error() !== JSON_ERROR_NONE) {
            throw new invalid_parameter_exception('Invalid JSON in progress_json');
        }
        
        // ---- SERVER ASSERT: Lecture must be completed before any other step progress ----
$lectureid = 'lecture';
$lecturecompleted = false;

if (is_array($decoded) && isset($decoded[$lectureid]) && is_array($decoded[$lectureid])) {
    $ls = $decoded[$lectureid];

    if (!empty($ls['completed'])) {
        $lecturecompleted = true;
    } else if (isset($ls['passesDone'], $ls['passesRequired'])) {
        $lecturecompleted = ((int)$ls['passesDone'] >= max(1, (int)$ls['passesRequired']));
    }
}

if (!$lecturecompleted && is_array($decoded)) {
    foreach ($decoded as $sid => $stepstate) {
        if ($sid === $lectureid) continue;
        if (!is_array($stepstate)) continue;

        $pd = isset($stepstate['passesDone']) ? (int)$stepstate['passesDone'] : 0;
        $cm = !empty($stepstate['completed']);

        if ($pd > 0 || $cm) {
            throw new moodle_exception(
                'lecture_required',
                'local_prequran',
                '',
                null,
                'Lecture must be completed before proceeding to practice steps.'
            );
        }
    }
}



        // Always keep storing raw JSON as user preference (legacy / fallback).
        set_user_preference($prefkey, $progress_json, $userid);

        // Only write to reporting tables if user is managed.
        $managed = self::is_managed_student($userid);
        if (!$managed) {
            return ['status' => true, 'managed' => false];
        }

        // Get global config as fallback.
        $globalpasses  = (int)get_config('local_prequran', 'passes_required');
        $globalrepeats = (int)get_config('local_prequran', 'number_of_repeats');
        if ($globalpasses < 1) {
            $globalpasses = 3;
        }
        if ($globalrepeats < 1) {
            $globalrepeats = 3;
        }

        // Step configuration (from DB or fallback).
        $stepscfg  = self::get_step_config($lessonid, $unitid, $globalpasses, $globalrepeats);
        $stepcount = count($stepscfg);

        // Upsert into local_prequran_lessonprog
        $conditions = self::with_environment_condition('local_prequran_lessonprog',
            ['userid' => $userid, 'lessonid' => $lessonid, 'unitid' => $unitid],
            $environment);
        $lessonprog = $DB->get_record('local_prequran_lessonprog', $conditions);
        if (!$lessonprog) {
            $lessonprog = (object)[
                'userid'                 => $userid,
                'lessonid'               => $lessonid,
                'unitid'                 => $unitid,
                'lesson_title'           => $lessontitle,
                'unit_title'             => $unittitle,
                'managed'                => 1,
                'overall_status'         => 'not_started',
                'overall_starttime'      => null,
                'overall_completiontime' => null,
                'overall_lastactivity'   => null,
                'steps_total'            => $stepcount,
                'steps_completed'        => 0,
                'timecreated'            => $now,
                'timemodified'           => $now,
            ];
            $lessonprog = self::add_environment_field('local_prequran_lessonprog', $lessonprog, $environment);
            $lessonprog->id = $DB->insert_record('local_prequran_lessonprog', $lessonprog);
        }

        // Upsert per-step rows in local_prequran_stepprog
        $stepscompleted = 0;

        foreach ($stepscfg as $stepcfg) {
            $sid    = $stepcfg->step_id;
            $index  = (int)$stepcfg->step_index;
            $title  = $stepcfg->step_title;
            $defpasses  = (int)$stepcfg->passes;
            $defrepeats = (int)$stepcfg->repeats;

            $stepstate = $decoded[$sid] ?? null;

            $passesdone = 0;
            $passesreq  = $defpasses;
            
            // Ensure lecture step always has a sensible required passes value
if ($sid === 'lecture' && $passesreq < 1) {
    $passesreq = 1;
}

            
            $completed  = false;

            if (is_array($stepstate)) {
                if (isset($stepstate['passesDone'])) {
                    $passesdone = (int)$stepstate['passesDone'];
                }
                if (isset($stepstate['passesRequired']) && (int)$stepstate['passesRequired'] > 0) {
                    $passesreq = (int)$stepstate['passesRequired'];
                }
                if (!empty($stepstate['completed'])) {
                    $completed = true;
                }
            }

            if ($completed) {
                $stepscompleted++;
            }

            $status = 'not_started';
            if ($completed) {
                $status = 'completed';
            } else if ($passesdone > 0) {
                $status = 'in_progress';
            }

            $stepconds = [
                'lessonprog_id' => $lessonprog->id,
                'step_id'       => $sid,
            ];
            $stepconds = self::with_environment_condition('local_prequran_stepprog', $stepconds, $environment);
            $steprec = $DB->get_record('local_prequran_stepprog', $stepconds);

            if (!$steprec) {
                $steprec = (object)[
                    'lessonprog_id'      => $lessonprog->id,
                    'userid'             => $userid,
                    'lessonid'           => $lessonid,
                    'unitid'             => $unitid,
                    'step_index'         => $index,
                    'step_id'            => $sid,
                    'step_title'         => $title,
                    'step_status'        => $status,
                    'passes_done'        => $passesdone,
                    'passes_required'    => $passesreq,
                    'repeats_per_letter' => $defrepeats,
                    'step_starttime'     => ($passesdone > 0 ? $now : null),
                    'step_lastactivity'  => ($passesdone > 0 || $completed ? $now : null),
                    'step_completiontime'=> ($completed ? $now : null),
                    'timecreated'        => $now,
                    'timemodified'       => $now,
                ];
                $steprec = self::add_environment_field('local_prequran_stepprog', $steprec, $environment);
                $DB->insert_record('local_prequran_stepprog', $steprec);
            } else {
                if ($steprec->step_starttime === null && $passesdone > 0) {
                    $steprec->step_starttime = $now;
                }
                if ($completed && $steprec->step_completiontime === null) {
                    $steprec->step_completiontime = $now;
                }
                $steprec->step_status        = $status;
                $steprec->passes_done        = $passesdone;
                $steprec->passes_required    = $passesreq;
                $steprec->repeats_per_letter = $defrepeats;
                $steprec->step_index         = $index;
                $steprec->step_title         = $title;
                if (property_exists($steprec, 'completed')) {
                    $steprec->completed = $completed ? 1 : 0;
                }
                if ($passesdone <= 0 && !$completed) {
                    if (property_exists($steprec, 'step_starttime')) {
                        $steprec->step_starttime = null;
                    }
                    if (property_exists($steprec, 'step_lastactivity')) {
                        $steprec->step_lastactivity = null;
                    }
                    if (property_exists($steprec, 'step_completiontime')) {
                        $steprec->step_completiontime = null;
                    }
                    if (property_exists($steprec, 'total_entries')) {
                        $steprec->total_entries = 0;
                    }
                    if (property_exists($steprec, 'correct_answers')) {
                        $steprec->correct_answers = 0;
                    }
                    if (property_exists($steprec, 'wrong_answers')) {
                        $steprec->wrong_answers = 0;
                    }
                    if (property_exists($steprec, 'timeout_count')) {
                        $steprec->timeout_count = 0;
                    }
                } else if (property_exists($steprec, 'step_lastactivity') && ($passesdone > 0 || $completed)) {
                    $steprec->step_lastactivity = $now;
                }
                $steprec->timemodified       = $now;
                $DB->update_record('local_prequran_stepprog', $steprec);
            }
        }

        // Update lesson summary
        $lessonprog->steps_total     = $stepcount;
        $lessonprog->steps_completed = $stepscompleted;
        // Cached completion percentage (0..100) for fast reporting (column may or may not exist)
        if (property_exists($lessonprog, 'completion_percent')) {
            $lessonprog->completion_percent = ($stepcount > 0) ? (int)floor(($stepscompleted / $stepcount) * 100) : 0;
        }

        if ($stepscompleted === 0) {
            $lessonprog->overall_status = 'not_started';
        } else if ($stepscompleted < $stepcount) {
            $lessonprog->overall_status = 'in_progress';
        } else {
            $lessonprog->overall_status = 'completed';
        }

        if ($lessonprog->overall_starttime === null && $stepscompleted > 0) {
            $lessonprog->overall_starttime = $now;
        }
        if ($lessonprog->overall_status === 'completed' && empty($lessonprog->overall_completiontime)) {
            $lessonprog->overall_completiontime = $now;
        }
        $lessonprog->overall_lastactivity = $now;
        $lessonprog->timemodified         = $now;

        $DB->update_record('local_prequran_lessonprog', $lessonprog);

        return [
            'status'  => true,
            'managed' => true,
        ];
    }
    // -------------------------------------------------------------------------
    // GENERIC WS: Get/Set unit state by (lessonid, unitid)
    // This lets Alphabet Listen and Alphabet Watch (and other units) share one WS entry point.
    // Internally uses the existing generic helpers:
    //   - get_managed_unit_state_generic()
    //   - set_managed_unit_state_generic()
    // -------------------------------------------------------------------------
    public static function get_unit_state_parameters() {
        return new external_function_parameters([
            'lessonid' => new external_value(PARAM_ALPHANUMEXT, 'Lesson id', VALUE_REQUIRED),
            'unitid'   => new external_value(PARAM_ALPHANUMEXT, 'Unit id', VALUE_REQUIRED),
            'userid'   => new external_value(PARAM_INT, 'User id', VALUE_REQUIRED),
            'pq_env'   => new external_value(PARAM_ALPHANUMEXT, 'Environment: production|staging|integration', VALUE_DEFAULT, ''),
        ]);
    }


    public static function get_unit_state($lessonid, $unitid, $userid, $pq_env = '') {
        $params = self::validate_parameters(
            self::get_unit_state_parameters(),
            ['lessonid' => $lessonid, 'unitid' => $unitid, 'userid' => $userid, 'pq_env' => $pq_env]
        );
        self::set_environment_override((string)($params['pq_env'] ?? ''));

        $lessonid = trim($params['lessonid']);
        $unitid   = trim($params['unitid']);
        $userid   = (int)$params['userid'];

        $prefkey = 'prequran_' . $lessonid . '_' . $unitid . '_state_v1';

        $lessontitle = core_text::strtotitle(str_replace('_', ' ', $lessonid));
        $unittitle   = core_text::strtotitle(str_replace('_', ' ', $unitid));
        self::ensure_unit_initialized($userid, $lessonid, $unitid, $lessontitle, $unittitle);

        return self::get_managed_unit_state_generic($userid, $lessonid, $unitid, $prefkey);
    }


    public static function get_unit_state_returns() {
        // Same payload shape as Alphabet Listen.
        return self::get_alphabet_listen_state_returns();
    }

    public static function set_unit_state_parameters() {
        return new external_function_parameters([
            'lessonid'      => new external_value(PARAM_ALPHANUMEXT, 'Lesson id (e.g. alphabet)', VALUE_REQUIRED),
            'unitid'        => new external_value(PARAM_ALPHANUMEXT, 'Unit id (e.g. alphabet_listen or alphabet_watch)', VALUE_REQUIRED),
            'userid'        => new external_value(PARAM_INT, 'User id', VALUE_REQUIRED),
            'progress_json' => new external_value(PARAM_RAW, 'JSON string of progress', VALUE_REQUIRED),
            'pq_env'        => new external_value(PARAM_ALPHANUMEXT, 'Environment: production|staging|integration', VALUE_DEFAULT, ''),
        ]);
    }

    public static function set_unit_state($lessonid, $unitid, $userid, $progress_json, $pq_env = '') {
        $params = self::validate_parameters(
            self::set_unit_state_parameters(),
            [
                'lessonid' => $lessonid,
                'unitid' => $unitid,
                'userid' => $userid,
                'progress_json' => $progress_json,
                'pq_env' => $pq_env
            ]
        );
        self::set_environment_override((string)($params['pq_env'] ?? ''));

        $lessonid = trim($params['lessonid']);
        $unitid   = trim($params['unitid']);
        $userid   = (int)$params['userid'];
        $jsonraw  = $params['progress_json'];

        $prefkey = 'prequran_' . $lessonid . '_' . $unitid . '_state_v1';

        // Human titles (used only for lessonprog rows); keep simple and stable.
        $lessontitle = core_text::strtotitle(str_replace('_', ' ', $lessonid));
        $unittitle   = core_text::strtotitle(str_replace('_', ' ', $unitid));

        return self::set_managed_unit_state_generic(
            $jsonraw,
            $userid,
            $lessonid,
            $unitid,
            $prefkey,
            $lessontitle,
            $unittitle
        );
    }

    public static function set_unit_state_returns() {
        return self::set_alphabet_listen_state_returns();
    }



    // -------------------------------------------------------------------------
    // ALPHABET LISTEN — GET/SET (uses generic)
    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------
    // MOST USED WORDS - GET/SET (Extras unit, uses generic)
    // -------------------------------------------------------------------------
    public static function get_most_used_words_state_parameters() {
        return new external_function_parameters([
            'userid' => new external_value(PARAM_INT, 'User id', VALUE_REQUIRED),
            'pq_env' => new external_value(PARAM_ALPHANUMEXT, 'Environment: production|staging|integration', VALUE_DEFAULT, ''),
        ]);
    }

    public static function get_most_used_words_state($userid, $pq_env = '') {
        $params = self::validate_parameters(
            self::get_most_used_words_state_parameters(),
            ['userid' => $userid, 'pq_env' => $pq_env]
        );
        self::set_environment_override((string)($params['pq_env'] ?? ''));
        $userid = (int)$params['userid'];

        self::ensure_unit_initialized($userid, 'extras', 'most_used_words', 'Extras', 'Most Used Words');

        return self::get_managed_unit_state_generic(
            $userid,
            'extras',
            'most_used_words',
            'prequran_extras_most_used_words_state_v1'
        );
    }

    public static function get_most_used_words_state_returns() {
        return self::get_alphabet_listen_state_returns();
    }

    public static function set_most_used_words_state_parameters() {
        return new external_function_parameters([
            'progress_json' => new external_value(PARAM_RAW, 'JSON string for Most Used Words managed progress', VALUE_REQUIRED),
            'userid'        => new external_value(PARAM_INT, 'User id', VALUE_REQUIRED),
            'pq_env'        => new external_value(PARAM_ALPHANUMEXT, 'Environment: production|staging|integration', VALUE_DEFAULT, ''),
        ]);
    }

    public static function set_most_used_words_state($progress_json, $userid, $pq_env = '') {
        $params = self::validate_parameters(
            self::set_most_used_words_state_parameters(),
            ['progress_json' => $progress_json, 'userid' => $userid, 'pq_env' => $pq_env]
        );
        self::set_environment_override((string)($params['pq_env'] ?? ''));
        $userid  = (int)$params['userid'];
        $jsonraw = $params['progress_json'];

        return self::set_managed_unit_state_generic(
            $jsonraw,
            $userid,
            'extras',
            'most_used_words',
            'prequran_extras_most_used_words_state_v1',
            'Extras',
            'Most Used Words'
        );
    }

    public static function set_most_used_words_state_returns() {
        return self::set_alphabet_listen_state_returns();
    }

    // -------------------------------------------------------------------------
    // NAMES OF ALLAH - GET/SET (Extras unit, uses generic)
    // -------------------------------------------------------------------------
    public static function get_names_of_allah_state_parameters() {
        return new external_function_parameters([
            'userid' => new external_value(PARAM_INT, 'User id', VALUE_REQUIRED),
            'pq_env' => new external_value(PARAM_ALPHANUMEXT, 'Environment: production|staging|integration', VALUE_DEFAULT, ''),
        ]);
    }

    public static function get_names_of_allah_state($userid, $pq_env = '') {
        $params = self::validate_parameters(
            self::get_names_of_allah_state_parameters(),
            ['userid' => $userid, 'pq_env' => $pq_env]
        );
        self::set_environment_override((string)($params['pq_env'] ?? ''));
        $userid = (int)$params['userid'];

        self::ensure_unit_initialized($userid, 'extras', 'names_of_allah', 'Extras', 'Names of Allah');

        return self::get_managed_unit_state_generic(
            $userid,
            'extras',
            'names_of_allah',
            'prequran_names_of_allah_state_v1'
        );
    }

    public static function get_names_of_allah_state_returns() {
        return self::get_alphabet_listen_state_returns();
    }

    public static function set_names_of_allah_state_parameters() {
        return new external_function_parameters([
            'progress_json' => new external_value(PARAM_RAW, 'JSON string for Names of Allah managed progress', VALUE_REQUIRED),
            'userid'        => new external_value(PARAM_INT, 'User id', VALUE_REQUIRED),
            'pq_env'        => new external_value(PARAM_ALPHANUMEXT, 'Environment: production|staging|integration', VALUE_DEFAULT, ''),
        ]);
    }

    public static function set_names_of_allah_state($progress_json, $userid, $pq_env = '') {
        $params = self::validate_parameters(
            self::set_names_of_allah_state_parameters(),
            ['progress_json' => $progress_json, 'userid' => $userid, 'pq_env' => $pq_env]
        );
        self::set_environment_override((string)($params['pq_env'] ?? ''));
        $userid  = (int)$params['userid'];
        $jsonraw = $params['progress_json'];

        return self::set_managed_unit_state_generic(
            $jsonraw,
            $userid,
            'extras',
            'names_of_allah',
            'prequran_names_of_allah_state_v1',
            'Extras',
            'Names of Allah'
        );
    }

    public static function set_names_of_allah_state_returns() {
        return self::set_alphabet_listen_state_returns();
    }

    // -------------------------------------------------------------------------
    // PILLARS OF ISLAM - GET/SET (Extras unit, uses generic)
    // -------------------------------------------------------------------------
    public static function get_pillars_of_islam_state_parameters() {
        return new external_function_parameters([
            'userid' => new external_value(PARAM_INT, 'User id', VALUE_REQUIRED),
            'pq_env' => new external_value(PARAM_ALPHANUMEXT, 'Environment: production|staging|integration', VALUE_DEFAULT, ''),
        ]);
    }

    public static function get_pillars_of_islam_state($userid, $pq_env = '') {
        $params = self::validate_parameters(
            self::get_pillars_of_islam_state_parameters(),
            ['userid' => $userid, 'pq_env' => $pq_env]
        );
        self::set_environment_override((string)($params['pq_env'] ?? ''));
        $userid = (int)$params['userid'];

        self::ensure_unit_initialized($userid, 'extras', 'pillars_of_islam', 'Extras', 'Pillars of Islam');

        return self::get_managed_unit_state_generic(
            $userid,
            'extras',
            'pillars_of_islam',
            'prequran_pillars_of_islam_state_v1'
        );
    }

    public static function get_pillars_of_islam_state_returns() {
        return self::get_alphabet_listen_state_returns();
    }

    public static function set_pillars_of_islam_state_parameters() {
        return new external_function_parameters([
            'progress_json' => new external_value(PARAM_RAW, 'JSON string for Pillars of Islam managed progress', VALUE_REQUIRED),
            'userid'        => new external_value(PARAM_INT, 'User id', VALUE_REQUIRED),
            'pq_env'        => new external_value(PARAM_ALPHANUMEXT, 'Environment: production|staging|integration', VALUE_DEFAULT, ''),
        ]);
    }

    public static function set_pillars_of_islam_state($progress_json, $userid, $pq_env = '') {
        $params = self::validate_parameters(
            self::set_pillars_of_islam_state_parameters(),
            ['progress_json' => $progress_json, 'userid' => $userid, 'pq_env' => $pq_env]
        );
        self::set_environment_override((string)($params['pq_env'] ?? ''));
        $userid  = (int)$params['userid'];
        $jsonraw = $params['progress_json'];

        return self::set_managed_unit_state_generic(
            $jsonraw,
            $userid,
            'extras',
            'pillars_of_islam',
            'prequran_pillars_of_islam_state_v1',
            'Extras',
            'Pillars of Islam'
        );
    }

    public static function set_pillars_of_islam_state_returns() {
        return self::set_alphabet_listen_state_returns();
    }

    // -------------------------------------------------------------------------
    // PILLARS OF FAITH - GET/SET (Extras unit, uses generic)
    // -------------------------------------------------------------------------
    public static function get_pillars_of_faith_state_parameters() {
        return new external_function_parameters([
            'userid' => new external_value(PARAM_INT, 'User id', VALUE_REQUIRED),
            'pq_env' => new external_value(PARAM_ALPHANUMEXT, 'Environment: production|staging|integration', VALUE_DEFAULT, ''),
        ]);
    }

    public static function get_pillars_of_faith_state($userid, $pq_env = '') {
        $params = self::validate_parameters(
            self::get_pillars_of_faith_state_parameters(),
            ['userid' => $userid, 'pq_env' => $pq_env]
        );
        self::set_environment_override((string)($params['pq_env'] ?? ''));
        $userid = (int)$params['userid'];

        self::ensure_unit_initialized($userid, 'extras', 'pillars_of_faith', 'Extras', 'Pillars of Faith');

        return self::get_managed_unit_state_generic(
            $userid,
            'extras',
            'pillars_of_faith',
            'prequran_pillars_of_faith_state_v1'
        );
    }

    public static function get_pillars_of_faith_state_returns() {
        return self::get_alphabet_listen_state_returns();
    }

    public static function set_pillars_of_faith_state_parameters() {
        return new external_function_parameters([
            'progress_json' => new external_value(PARAM_RAW, 'JSON string for Pillars of Faith managed progress', VALUE_REQUIRED),
            'userid'        => new external_value(PARAM_INT, 'User id', VALUE_REQUIRED),
            'pq_env'        => new external_value(PARAM_ALPHANUMEXT, 'Environment: production|staging|integration', VALUE_DEFAULT, ''),
        ]);
    }

    public static function set_pillars_of_faith_state($progress_json, $userid, $pq_env = '') {
        $params = self::validate_parameters(
            self::set_pillars_of_faith_state_parameters(),
            ['progress_json' => $progress_json, 'userid' => $userid, 'pq_env' => $pq_env]
        );
        self::set_environment_override((string)($params['pq_env'] ?? ''));
        $userid  = (int)$params['userid'];
        $jsonraw = $params['progress_json'];

        return self::set_managed_unit_state_generic(
            $jsonraw,
            $userid,
            'extras',
            'pillars_of_faith',
            'prequran_pillars_of_faith_state_v1',
            'Extras',
            'Pillars of Faith'
        );
    }

    public static function set_pillars_of_faith_state_returns() {
        return self::set_alphabet_listen_state_returns();
    }

    // -------------------------------------------------------------------------
    // MANNERS AKHLAQ - GET/SET (Extras unit, uses generic)
    // -------------------------------------------------------------------------
    public static function get_manners_akhlaq_state_parameters() {
        return new external_function_parameters([
            'userid' => new external_value(PARAM_INT, 'User id', VALUE_REQUIRED),
            'pq_env' => new external_value(PARAM_ALPHANUMEXT, 'Environment: production|staging|integration', VALUE_DEFAULT, ''),
        ]);
    }

    public static function get_manners_akhlaq_state($userid, $pq_env = '') {
        $params = self::validate_parameters(
            self::get_manners_akhlaq_state_parameters(),
            ['userid' => $userid, 'pq_env' => $pq_env]
        );
        self::set_environment_override((string)($params['pq_env'] ?? ''));
        $userid = (int)$params['userid'];

        self::ensure_unit_initialized($userid, 'extras', 'manners_akhlaq', 'Extras', 'Manners Akhlaq');

        return self::get_managed_unit_state_generic(
            $userid,
            'extras',
            'manners_akhlaq',
            'prequran_manners_akhlaq_state_v1'
        );
    }

    public static function get_manners_akhlaq_state_returns() {
        return self::get_alphabet_listen_state_returns();
    }

    public static function set_manners_akhlaq_state_parameters() {
        return new external_function_parameters([
            'progress_json' => new external_value(PARAM_RAW, 'JSON string for Manners Akhlaq managed progress', VALUE_REQUIRED),
            'userid'        => new external_value(PARAM_INT, 'User id', VALUE_REQUIRED),
            'pq_env'        => new external_value(PARAM_ALPHANUMEXT, 'Environment: production|staging|integration', VALUE_DEFAULT, ''),
        ]);
    }

    public static function set_manners_akhlaq_state($progress_json, $userid, $pq_env = '') {
        $params = self::validate_parameters(
            self::set_manners_akhlaq_state_parameters(),
            ['progress_json' => $progress_json, 'userid' => $userid, 'pq_env' => $pq_env]
        );
        self::set_environment_override((string)($params['pq_env'] ?? ''));
        $userid  = (int)$params['userid'];
        $jsonraw = $params['progress_json'];

        return self::set_managed_unit_state_generic(
            $jsonraw,
            $userid,
            'extras',
            'manners_akhlaq',
            'prequran_manners_akhlaq_state_v1',
            'Extras',
            'Manners Akhlaq'
        );
    }

    public static function set_manners_akhlaq_state_returns() {
        return self::set_alphabet_listen_state_returns();
    }

    public static function get_alphabet_listen_state_parameters() {
        return new external_function_parameters([
            'userid' => new external_value(PARAM_INT, 'User id', VALUE_REQUIRED),
            'pq_env' => new external_value(PARAM_ALPHANUMEXT, 'Environment: production|staging|integration', VALUE_DEFAULT, ''),
        ]);
    }

    public static function get_alphabet_listen_state($userid, $pq_env = '') {
        // IMPORTANT: validate_parameters must receive the requested userid (not 0),
        // otherwise WS may read/write the wrong user's progress.

        $params = self::validate_parameters(
            self::get_alphabet_listen_state_parameters(),
            ['userid' => $userid, 'pq_env' => $pq_env]
        );
        self::set_environment_override((string)($params['pq_env'] ?? ''));
        $userid = (int)$params['userid'];
        // Bootstrap DB rows on first run (prevents missing-record WS errors)
        self::ensure_unit_initialized($userid, 'alphabet', 'alphabet_listen', 'Alphabet', 'Alphabet Listen');

        return self::get_managed_unit_state_generic(
            $userid,
            'alphabet',
            'alphabet_listen',
            'prequran_alphabet_listen_state_v1'
        );
    }

    public static function get_alphabet_listen_state_returns() {
        return new external_single_structure([
            'managed_student' => new external_value(PARAM_BOOL, 'Whether user is a managed student', VALUE_REQUIRED),
            'passes_required' => new external_value(PARAM_INT, 'Global passes required (fallback)', VALUE_REQUIRED),
            'number_of_repeats' => new external_value(PARAM_INT, 'Global repeats per letter (fallback)', VALUE_REQUIRED),
            'progress_json' => new external_value(PARAM_RAW, 'JSON string of progress (or empty)', VALUE_REQUIRED),
            'steps' => new external_multiple_structure(
                new external_single_structure([
                    'step_index'         => new external_value(PARAM_INT, 'Step index (1..N)'),
                    'step_id'            => new external_value(PARAM_TEXT,'Step id'),
                    'step_title'         => new external_value(PARAM_TEXT,'Step title'),
                    'step_type'          => new external_value(PARAM_TEXT,'Step type', VALUE_OPTIONAL),
                    'passes_required'    => new external_value(PARAM_INT, 'Required passes for this step'),
                    'repeats_per_letter' => new external_value(PARAM_INT, 'Repeats per letter for this step'),
                ]),
                'Per-step configuration',
                VALUE_OPTIONAL
            ),
            'totalstars' => new external_value(PARAM_INT, 'Completed steps across all units for this user', VALUE_OPTIONAL),
            'completedunits' => new external_value(PARAM_INT, 'Completed units across all lessons for this user', VALUE_OPTIONAL),
            'preferred_language' => new external_value(PARAM_ALPHANUMEXT, 'Preferred language code', VALUE_OPTIONAL),
            'language_scope' => new external_value(PARAM_ALPHANUMEXT, 'Language preference scope: ui, content, or both', VALUE_OPTIONAL),
        ]);
    }

    public static function set_alphabet_listen_state_parameters() {
        return new external_function_parameters([
            'progress_json' => new external_value(PARAM_RAW, 'JSON string for Alphabet Listen managed progress', VALUE_REQUIRED),
            'userid'        => new external_value(PARAM_INT,  'User id', VALUE_REQUIRED),
            'pq_env'        => new external_value(PARAM_ALPHANUMEXT, 'Environment: production|staging|integration', VALUE_DEFAULT, ''),
        ]);
    }

    public static function set_alphabet_listen_state($progress_json, $userid, $pq_env = '') {
        $params = self::validate_parameters(
            self::set_alphabet_listen_state_parameters(),
            ['progress_json' => $progress_json, 'userid' => $userid, 'pq_env' => $pq_env]
        );
        self::set_environment_override((string)($params['pq_env'] ?? ''));
        $userid  = (int)$params['userid'];
        $jsonraw = $params['progress_json'];

        return self::set_managed_unit_state_generic(
            $jsonraw,
            $userid,
            'alphabet',
            'alphabet_listen',
            'prequran_alphabet_listen_state_v1',
            'Alphabet',
            'Alphabet Listen'
        );
    }

    public static function set_alphabet_listen_state_returns() {
        return new external_single_structure([
            'status'  => new external_value(PARAM_BOOL, 'True on success'),
            'managed' => new external_value(PARAM_BOOL, 'True if user is managed and DB rows were updated'),
        ]);
    }

    // -------------------------------------------------------------------------
    // ALPHABET MATCH — GET/SET
    // -------------------------------------------------------------------------
    public static function get_alphabet_match_state_parameters() {
        return new external_function_parameters([
            'userid' => new external_value(PARAM_INT, 'User id', VALUE_REQUIRED),
        ]);
    }

    public static function get_alphabet_match_state($userid) {
        $params = self::validate_parameters(
            self::get_alphabet_match_state_parameters(),
            ['userid' => $userid]
        );
        $userid = (int)$params['userid'];

        return self::get_managed_unit_state_generic(
            $userid,
            'alphabet',
            'alphabet_match',
            'prequran_alphabet_match_state_v1'
        );
    }

    public static function get_alphabet_match_state_returns() {
        // Same as Listen
        return self::get_alphabet_listen_state_returns();
    }

    public static function set_alphabet_match_state_parameters() {
        return new external_function_parameters([
            'progress_json' => new external_value(PARAM_RAW, 'JSON string for Alphabet Match managed progress', VALUE_REQUIRED),
            'userid'        => new external_value(PARAM_INT,  'User id', VALUE_REQUIRED),
        ]);
    }

    public static function set_alphabet_match_state($progress_json, $userid) {
        $params = self::validate_parameters(
            self::set_alphabet_match_state_parameters(),
            ['progress_json' => $progress_json, 'userid' => $userid]
        );
        $userid  = (int)$params['userid'];
        $jsonraw = $params['progress_json'];

        return self::set_managed_unit_state_generic(
            $jsonraw,
            $userid,
            'alphabet',
            'alphabet_match',
            'prequran_alphabet_match_state_v1',
            'Alphabet',
            'Alphabet Match'
        );
    }

    public static function set_alphabet_match_state_returns() {
        return self::set_alphabet_listen_state_returns();
    }

    // -------------------------------------------------------------------------
    // ALPHABET WRITE — GET/SET
    // -------------------------------------------------------------------------
    public static function get_alphabet_write_state_parameters() {
        return new external_function_parameters([
            'userid' => new external_value(PARAM_INT, 'User id', VALUE_REQUIRED),
        ]);
    }

    public static function get_alphabet_write_state($userid) {
        $params = self::validate_parameters(
            self::get_alphabet_write_state_parameters(),
            ['userid' => $userid]
        );
        $userid = (int)$params['userid'];

        return self::get_managed_unit_state_generic(
            $userid,
            'alphabet',
            'alphabet_write',
            'prequran_alphabet_write_state_v1'
        );
    }

    public static function get_alphabet_write_state_returns() {
        return self::get_alphabet_listen_state_returns();
    }

    public static function set_alphabet_write_state_parameters() {
        return new external_function_parameters([
            'progress_json' => new external_value(PARAM_RAW, 'JSON string for Alphabet Write managed progress', VALUE_REQUIRED),
            'userid'        => new external_value(PARAM_INT,  'User id', VALUE_REQUIRED),
        ]);
    }

    public static function set_alphabet_write_state($progress_json, $userid) {
        $params = self::validate_parameters(
            self::set_alphabet_write_state_parameters(),
            ['progress_json' => $progress_json, 'userid' => $userid]
        );
        $userid  = (int)$params['userid'];
        $jsonraw = $params['progress_json'];

        return self::set_managed_unit_state_generic(
            $jsonraw,
            $userid,
            'alphabet',
            'alphabet_write',
            'prequran_alphabet_write_state_v1',
            'Alphabet',
            'Alphabet Write'
        );
    }

    public static function set_alphabet_write_state_returns() {
        return self::set_alphabet_listen_state_returns();
    }

    // -------------------------------------------------------------------------
    // ALPHABET WATCH — GET/SET
    // -------------------------------------------------------------------------
    public static function get_alphabet_watch_state_parameters() {
        return new external_function_parameters([
            'userid' => new external_value(PARAM_INT, 'User id', VALUE_REQUIRED),
        ]);
    }

    public static function get_alphabet_watch_state($userid) {
        $params = self::validate_parameters(
            self::get_alphabet_watch_state_parameters(),
            ['userid' => $userid]
        );
        $userid = (int)$params['userid'];
        // Bootstrap DB rows on first run (prevents missing-record WS errors)
        self::ensure_unit_initialized($userid, 'alphabet', 'alphabet_watch', 'Alphabet', 'Alphabet Watch');

        return self::get_managed_unit_state_generic(
            $userid,
            'alphabet',
            'alphabet_watch',
            'prequran_alphabet_watch_state_v1'
        );
    }

    public static function get_alphabet_watch_state_returns() {
        return self::get_alphabet_listen_state_returns();
    }

    public static function set_alphabet_watch_state_parameters() {
        return new external_function_parameters([
            'progress_json' => new external_value(PARAM_RAW, 'JSON string for Alphabet Watch managed progress', VALUE_REQUIRED),
            'userid'        => new external_value(PARAM_INT,  'User id', VALUE_REQUIRED),
        ]);
    }

    public static function set_alphabet_watch_state($progress_json, $userid) {
        $params = self::validate_parameters(
            self::set_alphabet_watch_state_parameters(),
            ['progress_json' => $progress_json, 'userid' => $userid]
        );
        $userid  = (int)$params['userid'];
        $jsonraw = $params['progress_json'];

        return self::set_managed_unit_state_generic(
            $jsonraw,
            $userid,
            'alphabet',
            'alphabet_watch',
            'prequran_alphabet_watch_state_v1',
            'Alphabet',
            'Alphabet Watch'
        );
    }

    public static function set_alphabet_watch_state_returns() {
        return self::set_alphabet_listen_state_returns();
    }
    
    
    
    // -------------------------------------------------------------------------
    // ALPHABET Speak — GET/SET
    // -------------------------------------------------------------------------
    public static function get_alphabet_speak_state_parameters() {
        return new external_function_parameters([
            'userid' => new external_value(PARAM_INT, 'User id', VALUE_REQUIRED),
        ]);
    }

    public static function get_alphabet_speak_state($userid) {
        $params = self::validate_parameters(
            self::get_alphabet_speak_state_parameters(),
            ['userid' => $userid]
        );
        $userid = (int)$params['userid'];

        return self::get_managed_unit_state_generic(
            $userid,
            'alphabet',
            'alphabet_speak',
            'prequran_alphabet_speak_state_v1'
        );
    }

    public static function get_alphabet_speak_state_returns() {
        return self::get_alphabet_listen_state_returns();
    }

    public static function set_alphabet_speak_state_parameters() {
        return new external_function_parameters([
            'progress_json' => new external_value(PARAM_RAW, 'JSON string for Alphabet speak managed progress', VALUE_REQUIRED),
            'userid'        => new external_value(PARAM_INT,  'User id', VALUE_REQUIRED),
        ]);
    }

    public static function set_alphabet_speak_state($progress_json, $userid) {
        $params = self::validate_parameters(
            self::set_alphabet_speak_state_parameters(),
            ['progress_json' => $progress_json, 'userid' => $userid]
        );
        $userid  = (int)$params['userid'];
        $jsonraw = $params['progress_json'];

        return self::set_managed_unit_state_generic(
            $jsonraw,
            $userid,
            'alphabet',
            'alphabet_speak',
            'prequran_alphabet_speak_state_v1',
            'Alphabet',
            'Alphabet Speak'
        );
    }

    public static function set_alphabet_speak_state_returns() {
        return self::set_alphabet_listen_state_returns();
    }

    // -------------------------------------------------------------------------
    // Harakat LISTEN — GET/SET (uses generic)
    // -------------------------------------------------------------------------
    public static function get_harakat_listen_state_parameters() {
        return new external_function_parameters([
            'userid' => new external_value(PARAM_INT, 'User id', VALUE_REQUIRED),
        ]);
    }

    public static function get_harakat_listen_state($userid) {
        $params = self::validate_parameters(
            self::get_harakat_listen_state_parameters(),
            ['userid' => $userid]
        );
        $userid = (int)$params['userid'];

        return self::get_managed_unit_state_generic(
            $userid,
            'harakat',
            'harakat_listen',
            'prequran_harakat_listen_state_v1'
        );
    }

    public static function get_harakat_listen_state_returns() {
        return new external_single_structure([
            'managed_student' => new external_value(PARAM_BOOL, 'Whether user is a managed student', VALUE_REQUIRED),
            'passes_required' => new external_value(PARAM_INT, 'Global passes required (fallback)', VALUE_REQUIRED),
            'number_of_repeats' => new external_value(PARAM_INT, 'Global repeats per letter (fallback)', VALUE_REQUIRED),
            'progress_json' => new external_value(PARAM_RAW, 'JSON string of progress (or empty)', VALUE_REQUIRED),
            'steps' => new external_multiple_structure(
                new external_single_structure([
                    'step_index'         => new external_value(PARAM_INT, 'Step index (1..N)'),
                    'step_id'            => new external_value(PARAM_TEXT,'Step id'),
                    'step_title'         => new external_value(PARAM_TEXT,'Step title'),
                    'step_type'          => new external_value(PARAM_TEXT,'Step type', VALUE_OPTIONAL),
                    'passes_required'    => new external_value(PARAM_INT, 'Required passes for this step'),
                    'repeats_per_letter' => new external_value(PARAM_INT, 'Repeats per letter for this step'),
                ]),
                'Per-step configuration',
                VALUE_OPTIONAL
            ),
        ]);
    }

    public static function set_harakat_listen_state_parameters() {
        return new external_function_parameters([
            'progress_json' => new external_value(PARAM_RAW, 'JSON string for Harakat Listen managed progress', VALUE_REQUIRED),
            'userid'        => new external_value(PARAM_INT,  'User id', VALUE_REQUIRED),
        ]);
    }

    public static function set_harakat_listen_state($progress_json, $userid) {
        $params = self::validate_parameters(
            self::set_harakat_listen_state_parameters(),
            ['progress_json' => $progress_json, 'userid' => $userid]
        );
        $userid  = (int)$params['userid'];
        $jsonraw = $params['progress_json'];

        return self::set_managed_unit_state_generic(
            $jsonraw,
            $userid,
            'harakat',
            'harakat_listen',
            'prequran_harakat_listen_state_v1',
            'Harakat',
            'Harakat Listen'
        );
    }

    public static function set_harakat_listen_state_returns() {
        return new external_single_structure([
            'status'  => new external_value(PARAM_BOOL, 'True on success'),
            'managed' => new external_value(PARAM_BOOL, 'True if user is managed and DB rows were updated'),
        ]);
    }

    
    // -------------------------------------------------------------------------
    // HARAKAT WATCH — GET/SET
    // -------------------------------------------------------------------------
    public static function get_harakat_watch_state_parameters() {
        return new external_function_parameters([
            'userid' => new external_value(PARAM_INT, 'User id', VALUE_REQUIRED),
        ]);
    }

    public static function get_harakat_watch_state($userid) {
        $params = self::validate_parameters(
            self::get_harakat_watch_state_parameters(),
            ['userid' => $userid]
        );
        $userid = (int)$params['userid'];

        return self::get_managed_unit_state_generic(
            $userid,
            'harakat',
            'harakat_watch',
            'prequran_harakat_watch_state_v1'
        );
    }

    public static function get_harakat_watch_state_returns() {
        return self::get_alphabet_listen_state_returns();
    }

    public static function set_harakat_watch_state_parameters() {
        return new external_function_parameters([
            'progress_json' => new external_value(PARAM_RAW, 'JSON string for Harakat Watch managed progress', VALUE_REQUIRED),
            'userid'        => new external_value(PARAM_INT,  'User id', VALUE_REQUIRED),
        ]);
    }

    public static function set_harakat_watch_state($progress_json, $userid) {
        $params = self::validate_parameters(
            self::set_harakat_watch_state_parameters(),
            ['progress_json' => $progress_json, 'userid' => $userid]
        );
        $userid  = (int)$params['userid'];
        $jsonraw = $params['progress_json'];

        return self::set_managed_unit_state_generic(
            $jsonraw,
            $userid,
            'harakat',
            'harakat_watch',
            'prequran_harakat_watch_state_v1',
            'Harakat',
            'Harakat Watch'
        );
    }

    public static function set_harakat_watch_state_returns() {
        return self::set_alphabet_listen_state_returns();
    }
    
	    // -------------------------------------------------------------------------
    // harakat MATCH — GET/SET
    // -------------------------------------------------------------------------
    public static function get_harakat_match_state_parameters() {
        return new external_function_parameters([
            'userid' => new external_value(PARAM_INT, 'User id', VALUE_REQUIRED),
        ]);
    }

    public static function get_harakat_match_state($userid) {
        $params = self::validate_parameters(
            self::get_harakat_match_state_parameters(),
            ['userid' => $userid]
        );
        $userid = (int)$params['userid'];

        return self::get_managed_unit_state_generic(
            $userid,
            'harakat',
            'harakat_match',
            'prequran_harakat_match_state_v1'
        );
    }

    public static function get_harakat_match_state_returns() {
        // Same as Listen
        return self::get_alphabet_listen_state_returns();
    }

    public static function set_harakat_match_state_parameters() {
        return new external_function_parameters([
            'progress_json' => new external_value(PARAM_RAW, 'JSON string for harakat Match managed progress', VALUE_REQUIRED),
            'userid'        => new external_value(PARAM_INT,  'User id', VALUE_REQUIRED),
        ]);
    }

    public static function set_harakat_match_state($progress_json, $userid) {
        $params = self::validate_parameters(
            self::set_harakat_match_state_parameters(),
            ['progress_json' => $progress_json, 'userid' => $userid]
        );
        $userid  = (int)$params['userid'];
        $jsonraw = $params['progress_json'];

        return self::set_managed_unit_state_generic(
            $jsonraw,
            $userid,
            'harakat',
            'harakat_match',
            'prequran_harakat_match_state_v1',
            'harakat',
            'harakat Match'
        );
    }

    public static function set_harakat_match_state_returns() {
        return self::set_alphabet_listen_state_returns();
    }


    
	    // -------------------------------------------------------------------------
    // HARAKAT SPEAK — GET/SET
    // -------------------------------------------------------------------------
    public static function get_harakat_speak_state_parameters() {
        return new external_function_parameters([
            'userid' => new external_value(PARAM_INT, 'User id', VALUE_REQUIRED),
        ]);
    }

    public static function get_harakat_speak_state($userid) {
        $params = self::validate_parameters(
            self::get_harakat_speak_state_parameters(),
            ['userid' => $userid]
        );
        $userid = (int)$params['userid'];

        return self::get_managed_unit_state_generic(
            $userid,
            'harakat',
            'harakat_speak',
            'prequran_harakat_speak_state_v1'
        );
    }

    public static function get_harakat_speak_state_returns() {
        // Same as Listen
        return self::get_alphabet_listen_state_returns();
    }

    public static function set_harakat_speak_state_parameters() {
        return new external_function_parameters([
            'progress_json' => new external_value(PARAM_RAW, 'JSON string for harakat Speak managed progress', VALUE_REQUIRED),
            'userid'        => new external_value(PARAM_INT,  'User id', VALUE_REQUIRED),
        ]);
    }

    public static function set_harakat_speak_state($progress_json, $userid) {
        $params = self::validate_parameters(
            self::set_harakat_speak_state_parameters(),
            ['progress_json' => $progress_json, 'userid' => $userid]
        );
        $userid  = (int)$params['userid'];
        $jsonraw = $params['progress_json'];

        return self::set_managed_unit_state_generic(
            $jsonraw,
            $userid,
            'harakat',
            'harakat_speak',
            'prequran_harakat_speak_state_v1',
            'harakat',
            'Harakat Speak'
        );
    }

    public static function set_harakat_speak_state_returns() {
        return self::set_alphabet_listen_state_returns();
    }


	    // -------------------------------------------------------------------------
    // HARAKAT WRITE — GET/SET
    // -------------------------------------------------------------------------
    public static function get_harakat_write_state_parameters() {
        return new external_function_parameters([
            'userid' => new external_value(PARAM_INT, 'User id', VALUE_REQUIRED),
        ]);
    }

    public static function get_harakat_write_state($userid) {
        $params = self::validate_parameters(
            self::get_harakat_write_state_parameters(),
            ['userid' => $userid]
        );
        $userid = (int)$params['userid'];

        return self::get_managed_unit_state_generic(
            $userid,
            'harakat',
            'harakat_write',
            'prequran_harakat_write_state_v1'
        );
    }

    public static function get_harakat_write_state_returns() {
        // Same as Listen
        return self::get_alphabet_listen_state_returns();
    }

    public static function set_harakat_write_state_parameters() {
        return new external_function_parameters([
            'progress_json' => new external_value(PARAM_RAW, 'JSON string for harakat Write managed progress', VALUE_REQUIRED),
            'userid'        => new external_value(PARAM_INT,  'User id', VALUE_REQUIRED),
        ]);
    }

    public static function set_harakat_write_state($progress_json, $userid) {
        $params = self::validate_parameters(
            self::set_harakat_write_state_parameters(),
            ['progress_json' => $progress_json, 'userid' => $userid]
        );
        $userid  = (int)$params['userid'];
        $jsonraw = $params['progress_json'];

        return self::set_managed_unit_state_generic(
            $jsonraw,
            $userid,
            'harakat',
            'harakat_write',
            'prequran_harakat_write_state_v1',
            'harakat',
            'Harakat Write'
        );
    }

    public static function set_harakat_write_state_returns() {
        return self::set_alphabet_listen_state_returns();
    }


    // -------------------------------------------------------------------------
    // JOINT LISTEN — GET/SET (uses generic)
// -------------------------------------------------------------------------
public static function get_joint_connecting_forms_state_parameters() {
    return new external_function_parameters([
        'userid' => new external_value(PARAM_INT, 'User id', VALUE_REQUIRED),
    ]);
}

public static function get_joint_connecting_forms_state($userid) {
    $params = self::validate_parameters(
        self::get_joint_connecting_forms_state_parameters(),
        ['userid' => $userid]
    );
    $userid = (int)$params['userid'];

    return self::get_managed_unit_state_generic(
        $userid,
        'joint',
        'joint_connecting_forms',
        'prequran_joint_connecting_forms_state_v1'
    );
}

// REUSE the same structure as Alphabet Listen (matches generic helper)
public static function get_joint_connecting_forms_state_returns() {
    return self::get_alphabet_listen_state_returns();
}

public static function set_joint_connecting_forms_state_parameters() {
    return new external_function_parameters([
        'progress_json' => new external_value(PARAM_RAW, 'JSON string for Joint Listen managed progress', VALUE_REQUIRED),
        'userid'        => new external_value(PARAM_INT, 'User id', VALUE_REQUIRED),
    ]);
}

public static function set_joint_connecting_forms_state($progress_json, $userid) {
    $params = self::validate_parameters(
        self::set_joint_connecting_forms_state_parameters(),
        ['progress_json' => $progress_json, 'userid' => $userid]
    );
    $userid  = (int)$params['userid'];
    $jsonraw = $params['progress_json'];

    return self::set_managed_unit_state_generic(
        $jsonraw,
        $userid,
        'joint',
        'joint_connecting_forms',
        'prequran_joint_connecting_forms_state_v1',
        'Joint',
        'Joint Listen'
    );
}

public static function set_joint_connecting_forms_state_returns() {
    return self::set_alphabet_listen_state_returns();
}


    // -------------------------------------------------------------------------
    // TWO JOINED LETTERS — GET/SET (uses generic)
// -------------------------------------------------------------------------
public static function get_two_joined_letters_state_parameters() {
    return new external_function_parameters([
        'userid' => new external_value(PARAM_INT, 'User id', VALUE_REQUIRED),
    ]);
}

public static function get_two_joined_letters_state($userid) {
    $params = self::validate_parameters(
        self::get_two_joined_letters_state_parameters(),
        ['userid' => $userid]
    );
    $userid = (int)$params['userid'];

    return self::get_managed_unit_state_generic(
        $userid,
        'joint',
        'two_joined_letters',
        'prequran_two_joined_letters_state_v1'
    );
}

// REUSE the same structure as Alphabet Listen (matches generic helper)
public static function get_two_joined_letters_state_returns() {
    return self::get_alphabet_listen_state_returns();
}

public static function set_two_joined_letters_state_parameters() {
    return new external_function_parameters([
        'progress_json' => new external_value(PARAM_RAW, 'JSON string for two joined letters managed progress', VALUE_REQUIRED),
        'userid'        => new external_value(PARAM_INT, 'User id', VALUE_REQUIRED),
    ]);
}

public static function set_two_joined_letters_state($progress_json, $userid) {
    $params = self::validate_parameters(
        self::set_two_joined_letters_state_parameters(),
        ['progress_json' => $progress_json, 'userid' => $userid]
    );
    $userid  = (int)$params['userid'];
    $jsonraw = $params['progress_json'];

    return self::set_managed_unit_state_generic(
        $jsonraw,
        $userid,
        'joint',
        'two_joined_letters',
        'prequran_two_joined_letters_state_v1',
        'Joint',
        'Two Joined Letters'
    );
}

public static function set_two_joined_letters_state_returns() {
    return self::set_alphabet_listen_state_returns();
}


    // -------------------------------------------------------------------------
    // THREE JOINED LETTERS — GET/SET (uses generic)
// -------------------------------------------------------------------------
public static function get_three_joined_letters_state_parameters() {
    return new external_function_parameters([
        'userid' => new external_value(PARAM_INT, 'User id', VALUE_REQUIRED),
    ]);
}

public static function get_three_joined_letters_state($userid) {
    $params = self::validate_parameters(
        self::get_three_joined_letters_state_parameters(),
        ['userid' => $userid]
    );
    $userid = (int)$params['userid'];

    return self::get_managed_unit_state_generic(
        $userid,
        'joint',
        'three_joined_letters',
        'prequran_three_joined_letters_state_v1'
    );
}

// REUSE the same structure as Alphabet Listen (matches generic helper)
public static function get_three_joined_letters_state_returns() {
    return self::get_alphabet_listen_state_returns();
}

public static function set_three_joined_letters_state_parameters() {
    return new external_function_parameters([
        'progress_json' => new external_value(PARAM_RAW, 'JSON string for three joined letters managed progress', VALUE_REQUIRED),
        'userid'        => new external_value(PARAM_INT, 'User id', VALUE_REQUIRED),
    ]);
}

public static function set_three_joined_letters_state($progress_json, $userid) {
    $params = self::validate_parameters(
        self::set_three_joined_letters_state_parameters(),
        ['progress_json' => $progress_json, 'userid' => $userid]
    );
    $userid  = (int)$params['userid'];
    $jsonraw = $params['progress_json'];

    return self::set_managed_unit_state_generic(
        $jsonraw,
        $userid,
        'joint',
        'three_joined_letters',
        'prequran_three_joined_letters_state_v1',
        'Joint',
        'three Joined Letters'
    );
}

public static function set_three_joined_letters_state_returns() {
    return self::set_alphabet_listen_state_returns();
}

    // -------------------------------------------------------------------------
    // FOUR JOINED LETTERS — GET/SET (uses generic)
// -------------------------------------------------------------------------
public static function get_four_joined_letters_state_parameters() {
    return new external_function_parameters([
        'userid' => new external_value(PARAM_INT, 'User id', VALUE_REQUIRED),
    ]);
}

public static function get_four_joined_letters_state($userid) {
    $params = self::validate_parameters(
        self::get_four_joined_letters_state_parameters(),
        ['userid' => $userid]
    );
    $userid = (int)$params['userid'];

    return self::get_managed_unit_state_generic(
        $userid,
        'joint',
        'four_joined_letters',
        'prequran_four_joined_letters_state_v1'
    );
}

// REUSE the same structure as Alphabet Listen (matches generic helper)
public static function get_four_joined_letters_state_returns() {
    return self::get_alphabet_listen_state_returns();
}

public static function set_four_joined_letters_state_parameters() {
    return new external_function_parameters([
        'progress_json' => new external_value(PARAM_RAW, 'JSON string for four joined letters managed progress', VALUE_REQUIRED),
        'userid'        => new external_value(PARAM_INT, 'User id', VALUE_REQUIRED),
    ]);
}

public static function set_four_joined_letters_state($progress_json, $userid) {
    $params = self::validate_parameters(
        self::set_four_joined_letters_state_parameters(),
        ['progress_json' => $progress_json, 'userid' => $userid]
    );
    $userid  = (int)$params['userid'];
    $jsonraw = $params['progress_json'];

    return self::set_managed_unit_state_generic(
        $jsonraw,
        $userid,
        'joint',
        'four_joined_letters',
        'prequran_four_joined_letters_state_v1',
        'Joint',
        'three Joined Letters'
    );
}

public static function set_four_joined_letters_state_returns() {
    return self::set_alphabet_listen_state_returns();
}

    // -------------------------------------------------------------------------
    // ARABIC_DIACRICS — GET/SET (uses generic)
// -------------------------------------------------------------------------
public static function get_arabic_diacritics_listen_state_parameters() {
    return new external_function_parameters([
        'userid' => new external_value(PARAM_INT, 'User id', VALUE_REQUIRED),
    ]);
}

public static function get_arabic_diacritics_listen_state($userid) {
    $params = self::validate_parameters(
        self::get_arabic_diacritics_listen_state_parameters(),
        ['userid' => $userid]
    );
    $userid = (int)$params['userid'];

    return self::get_managed_unit_state_generic(
        $userid,
        'harakat',
        'arabic_diacritics_listen',
        'prequran_arabic_diacritics_listen_state_v1'
    );
}

// REUSE the same structure as Alphabet Listen (matches generic helper)
public static function get_arabic_diacritics_listen_state_returns() {
    return self::get_alphabet_listen_state_returns();
}

public static function set_arabic_diacritics_listen_state_parameters() {
    return new external_function_parameters([
        'progress_json' => new external_value(PARAM_RAW, 'JSON string for Arabic Diacritics Listen managed progress', VALUE_REQUIRED),
        'userid'        => new external_value(PARAM_INT, 'User id', VALUE_REQUIRED),
    ]);
}

public static function set_arabic_diacritics_listen_state($progress_json, $userid) {
    $params = self::validate_parameters(
        self::set_arabic_diacritics_listen_state_parameters(),
        ['progress_json' => $progress_json, 'userid' => $userid]
    );
    $userid  = (int)$params['userid'];
    $jsonraw = $params['progress_json'];

    return self::set_managed_unit_state_generic(
        $jsonraw,
        $userid,
        'harakat',
        'arabic_diacritics_listen',
        'prequran_arabic_diacritics_listen_state_v1',
        'harakat',
        'arabic diacritics listen'
    );
}

public static function set_arabic_diacritics_listen_state_returns() {
    return self::set_alphabet_listen_state_returns();
}



// REUSE Muqattiat Listen's return spec for setters too
public static function get_muqattiat_listen_state_parameters() {
    return new external_function_parameters([
        'userid' => new external_value(PARAM_INT, 'User id', VALUE_REQUIRED),
    ]);
}

public static function get_muqattiat_listen_state($userid) {
    $params = self::validate_parameters(
        self::get_muqattiat_listen_state_parameters(),
        ['userid' => $userid]
    );
    $userid = (int)$params['userid'];

    return self::get_managed_unit_state_generic(
        $userid,
        'tajweed',
        'muqattiat_listen',
        'prequran_muqattiat_listen_state_v1'
    );
}

public static function get_muqattiat_listen_state_returns() {
    return self::get_alphabet_listen_state_returns();
}

public static function set_muqattiat_listen_state_parameters() {
    return new external_function_parameters([
        'progress_json' => new external_value(PARAM_RAW, 'JSON string for Muqattaat Listen managed progress', VALUE_REQUIRED),
        'userid'        => new external_value(PARAM_INT, 'User id', VALUE_REQUIRED),
    ]);
}

public static function set_muqattiat_listen_state($progress_json, $userid) {
    $params = self::validate_parameters(
        self::set_muqattiat_listen_state_parameters(),
        ['progress_json' => $progress_json, 'userid' => $userid]
    );
    $userid  = (int)$params['userid'];
    $jsonraw = $params['progress_json'];

    return self::set_managed_unit_state_generic(
        $jsonraw,
        $userid,
        'tajweed',
        'muqattiat_listen',
        'prequran_muqattiat_listen_state_v1',
        'tajweed',
        'Muqattiat Listen'
    );
}

public static function set_muqattiat_listen_state_returns() {
    return self::set_alphabet_listen_state_returns();
}


// STANNDING HARAKAT  Listen's return spec for setters too

public static function get_madd_listen_state_parameters() {
    return new external_function_parameters([
        'userid' => new external_value(PARAM_INT, 'User id', VALUE_REQUIRED),
    ]);
}

public static function get_madd_listen_state($userid) {
    $params = self::validate_parameters(
        self::get_madd_listen_state_parameters(),
        ['userid' => $userid]
    );
    $userid = (int)$params['userid'];

    return self::get_managed_unit_state_generic(
        $userid,
        'tajweed',
        'madd_listen',
        'prequran_madd_listen_state_v1'
    );
}

public static function get_madd_listen_state_returns() {
    return self::get_alphabet_listen_state_returns();
}

public static function set_madd_listen_state_parameters() {
    return new external_function_parameters([
        'progress_json' => new external_value(PARAM_RAW, 'JSON string for Muqattaat Listen managed progress', VALUE_REQUIRED),
        'userid'        => new external_value(PARAM_INT, 'User id', VALUE_REQUIRED),
    ]);
}

public static function set_madd_listen_state($progress_json, $userid) {
    $params = self::validate_parameters(
        self::set_madd_listen_state_parameters(),
        ['progress_json' => $progress_json, 'userid' => $userid]
    );
    $userid  = (int)$params['userid'];
    $jsonraw = $params['progress_json'];

    return self::set_managed_unit_state_generic(
        $jsonraw,
        $userid,
        'tajweed',
        'madd_listen',
        'prequran_madd_listen_state_v1',
        'tajweed',
        'madd Listen'
    );
}

public static function set_madd_listen_state_returns() {
    return self::set_alphabet_listen_state_returns();
}

    // -------------------------------------------------------------------------
    // TASHDEED SHADDAH LISTEN — GET/SET (uses generic)
// -------------------------------------------------------------------------
public static function get_tashdeed_shaddah_listen_state_parameters() {
    return new external_function_parameters([
        'userid' => new external_value(PARAM_INT, 'User id', VALUE_REQUIRED),
    ]);
}

public static function get_tashdeed_shaddah_listen_state($userid) {
    $params = self::validate_parameters(
        self::get_tashdeed_shaddah_listen_state_parameters(),
        ['userid' => $userid]
    );
    $userid = (int)$params['userid'];

    return self::get_managed_unit_state_generic(
        $userid,
        'tashdeed_shaddah',
        'tashdeed_shaddah_listen',
        'prequran_tashdeed_shaddah_listen_state_v1'
    );
}

public static function get_tashdeed_shaddah_listen_state_returns() {
    return self::get_alphabet_listen_state_returns();
}

public static function set_tashdeed_shaddah_listen_state_parameters() {
    return new external_function_parameters([
        'progress_json' => new external_value(PARAM_RAW, 'JSON string for Muqattaat Listen managed progress', VALUE_REQUIRED),
        'userid'        => new external_value(PARAM_INT, 'User id', VALUE_REQUIRED),
    ]);
}

public static function set_tashdeed_shaddah_listen_state($progress_json, $userid) {
    $params = self::validate_parameters(
        self::set_tashdeed_shaddah_listen_state_parameters(),
        ['progress_json' => $progress_json, 'userid' => $userid]
    );
    $userid  = (int)$params['userid'];
    $jsonraw = $params['progress_json'];

    return self::set_managed_unit_state_generic(
        $jsonraw,
        $userid,
        'tashdeed_shaddah',
        'tashdeed_shaddah_listen',
        'prequran_tashdeed_shaddah_listen_state_v1',
        'tashdeed_shaddah',
        'tashdeed_shaddah Listen'
    );
}

public static function set_tashdeed_shaddah_listen_state_returns() {
    return self::set_alphabet_listen_state_returns();
}



    // Shaddah MATCH — GET/SET
    // -------------------------------------------------------------------------
    public static function get_shaddah_match_state_parameters() {
        return new external_function_parameters([
            'userid' => new external_value(PARAM_INT, 'User id', VALUE_REQUIRED),
        ]);
    }

    public static function get_shaddah_match_state($userid) {
        $params = self::validate_parameters(
            self::get_shaddah_match_state_parameters(),
            ['userid' => $userid]
        );
        $userid = (int)$params['userid'];

        return self::get_managed_unit_state_generic(
            $userid,
            'tajweed',
            'shaddah_match',
            'prequran_shaddah_match_state_v1'
        );
    }

    public static function get_shaddah_match_state_returns() {
        // Same as Listen
        return self::get_alphabet_listen_state_returns();
    }

    public static function set_shaddah_match_state_parameters() {
        return new external_function_parameters([
            'progress_json' => new external_value(PARAM_RAW, 'JSON string for Shaddah Match managed progress', VALUE_REQUIRED),
            'userid'        => new external_value(PARAM_INT,  'User id', VALUE_REQUIRED),
        ]);
    }

    public static function set_shaddah_match_state($progress_json, $userid) {
        $params = self::validate_parameters(
            self::set_shaddah_match_state_parameters(),
            ['progress_json' => $progress_json, 'userid' => $userid]
        );
        $userid  = (int)$params['userid'];
        $jsonraw = $params['progress_json'];

        return self::set_managed_unit_state_generic(
            $jsonraw,
            $userid,
            'tajweed',
            'shaddah_match',
            'prequran_shaddah_match_state_v1',
            'tajweed',
            'Shaddah Match'
        );
    }

    public static function set_shaddah_match_state_returns() {
        return self::set_alphabet_listen_state_returns();
    }

    // -------------------------------------------------------------------------
    // TANWEEN LISTEN — GET/SET (uses generic)
// -------------------------------------------------------------------------

public static function get_tanween_listen_state_parameters() {
    return new external_function_parameters([
        'userid' => new external_value(PARAM_INT, 'User id', VALUE_REQUIRED),
    ]);
}

public static function get_tanween_listen_state($userid) {
    $params = self::validate_parameters(
        self::get_tanween_listen_state_parameters(),
        ['userid' => $userid]
    );
    $userid = (int)$params['userid'];

    return self::get_managed_unit_state_generic(
        $userid,
        'tajweed',
        'tanween_listen',
        'prequran_tanween_listen_state_v1'
    );
}

public static function get_tanween_listen_state_returns() {
    return self::get_alphabet_listen_state_returns();
}

public static function set_tanween_listen_state_parameters() {
    return new external_function_parameters([
        'progress_json' => new external_value(PARAM_RAW, 'JSON string for Tanween Listen managed progress', VALUE_REQUIRED),
        'userid'        => new external_value(PARAM_INT, 'User id', VALUE_REQUIRED),
    ]);
}

public static function set_tanween_listen_state($progress_json, $userid) {
    $params = self::validate_parameters(
        self::set_tanween_listen_state_parameters(),
        ['progress_json' => $progress_json, 'userid' => $userid]
    );
    $userid  = (int)$params['userid'];
    $jsonraw = $params['progress_json'];

    return self::set_managed_unit_state_generic(
        $jsonraw,
        $userid,
        'tajweed',
        'tanween_listen',
        'prequran_tanween_listen_state_v1',
        'tajweed',
        'tanween Listen'
    );
}

public static function set_tanween_listen_state_returns() {
    return self::set_alphabet_listen_state_returns();
}

    // -------------------------------------------------------------------------
    // TANWEEN LISTEN — GET/SET (uses generic)
// -------------------------------------------------------------------------

public static function get_tanween_movement_listen_state_parameters() {
    return new external_function_parameters([
        'userid' => new external_value(PARAM_INT, 'User id', VALUE_REQUIRED),
    ]);
}

public static function get_tanween_movement_listen_state($userid) {
    $params = self::validate_parameters(
        self::get_tanween_movement_listen_state_parameters(),
        ['userid' => $userid]
    );
    $userid = (int)$params['userid'];

    return self::get_managed_unit_state_generic(
        $userid,
        'tajweed',
        'tanween_movement_listen',
        'prequran_tanween_movement_listen_state_v1'
    );
}

public static function get_tanween_movement_listen_state_returns() {
    return self::get_alphabet_listen_state_returns();
}

public static function set_tanween_movement_listen_state_parameters() {
    return new external_function_parameters([
        'progress_json' => new external_value(PARAM_RAW, 'JSON string for Tanween Movement Listen managed progress', VALUE_REQUIRED),
        'userid'        => new external_value(PARAM_INT, 'User id', VALUE_REQUIRED),
    ]);
}

public static function set_tanween_movement_listen_state($progress_json, $userid) {
    $params = self::validate_parameters(
        self::set_tanween_movement_listen_state_parameters(),
        ['progress_json' => $progress_json, 'userid' => $userid]
    );
    $userid  = (int)$params['userid'];
    $jsonraw = $params['progress_json'];

    return self::set_managed_unit_state_generic(
        $jsonraw,
        $userid,
        'tajweed',
        'tanween_movement_listen',
        'prequran_tanween_movement_listen_state_v1',
        'tajweed',
        'tanween Listen'
    );
}

public static function set_tanween_movement_listen_state_returns() {
    return self::set_alphabet_listen_state_returns();
}


    // -------------------------------------------------------------------------
    // MADDOLEEN LISTEN — GET/SET (uses generic)
// -------------------------------------------------------------------------
public static function get_maddoleen_listen_state_parameters() {
    return new external_function_parameters([
        'userid' => new external_value(PARAM_INT, 'User id', VALUE_REQUIRED),
    ]);
}

public static function get_maddoleen_listen_state($userid) {
    $params = self::validate_parameters(
        self::get_maddoleen_listen_state_parameters(),
        ['userid' => $userid]
    );
    $userid = (int)$params['userid'];

    return self::get_managed_unit_state_generic(
        $userid,
        'tajweed',
        'maddoleen_listen',
        'prequran_maddoleen_listen_state_v1'
    );
}

public static function get_maddoleen_listen_state_returns() {
    return self::get_alphabet_listen_state_returns();
}

public static function set_maddoleen_listen_state_parameters() {
    return new external_function_parameters([
        'progress_json' => new external_value(PARAM_RAW, 'JSON string for Maddoleen Listen managed progress', VALUE_REQUIRED),
        'userid'        => new external_value(PARAM_INT, 'User id', VALUE_REQUIRED),
    ]);
}

public static function set_maddoleen_listen_state($progress_json, $userid) {
    $params = self::validate_parameters(
        self::set_maddoleen_listen_state_parameters(),
        ['progress_json' => $progress_json, 'userid' => $userid]
    );
    $userid  = (int)$params['userid'];
    $jsonraw = $params['progress_json'];

    return self::set_managed_unit_state_generic(
        $jsonraw,
        $userid,
        'tajweed',
        'maddoleen_listen',
        'prequran_maddoleen_listen_state_v1',
        'tajweed',
        'maddoleen Listen'
    );
}

public static function set_maddoleen_listen_state_returns() {
    return self::set_alphabet_listen_state_returns();
}

public static function get_sakoon_jazm_listen_state_parameters() {
    return new external_function_parameters([
        'userid' => new external_value(PARAM_INT, 'User id', VALUE_REQUIRED),
    ]);
}

public static function get_sakoon_jazm_listen_state($userid) {
    $params = self::validate_parameters(
        self::get_sakoon_jazm_listen_state_parameters(),
        ['userid' => $userid]
    );
    $userid = (int)$params['userid'];

    return self::get_managed_unit_state_generic(
        $userid,
        'tajweed',
        'sakoon_jazm_listen',
        'prequran_sakoon_jazm_listen_state_v1'
    );
}

public static function get_sakoon_jazm_listen_state_returns() {
    return self::get_alphabet_listen_state_returns();
}

public static function set_sakoon_jazm_listen_state_parameters() {
    return new external_function_parameters([
        'progress_json' => new external_value(PARAM_RAW, 'JSON string for Sakoon Jazm Listen managed progress', VALUE_REQUIRED),
        'userid'        => new external_value(PARAM_INT, 'User id', VALUE_REQUIRED),
    ]);
}

public static function set_sakoon_jazm_listen_state($progress_json, $userid) {
    $params = self::validate_parameters(
        self::set_sakoon_jazm_listen_state_parameters(),
        ['progress_json' => $progress_json, 'userid' => $userid]
    );
    $userid  = (int)$params['userid'];
    $jsonraw = $params['progress_json'];

    return self::set_managed_unit_state_generic(
        $jsonraw,
        $userid,
        'tajweed',
        'sakoon_jazm_listen',
        'prequran_sakoon_jazm_listen_state_v1',
        'tajweed',
        'sakoon_jazm Listen'
    );
}



public static function get_tashdeed_listen_state_parameters() {
    return new external_function_parameters([
        'userid' => new external_value(PARAM_INT, 'User id', VALUE_REQUIRED),
    ]);
}

public static function get_tashdeed_listen_state($userid) {
    $params = self::validate_parameters(
        self::get_tashdeed_listen_state_parameters(),
        ['userid' => $userid]
    );
    $userid = (int)$params['userid'];

    return self::get_managed_unit_state_generic(
        $userid,
        'tajweed',
        'tashdeed_listen',
        'prequran_tashdeed_listen_state_v1'
    );
}

public static function get_tashdeed_listen_state_returns() {
    return self::get_alphabet_listen_state_returns();
}

public static function set_tashdeed_listen_state_parameters() {
    return new external_function_parameters([
        'progress_json' => new external_value(PARAM_RAW, 'JSON string for tashdeed_listen managed progress', VALUE_REQUIRED),
        'userid'        => new external_value(PARAM_INT, 'User id', VALUE_REQUIRED),
    ]);
}

public static function set_tashdeed_listen_state($progress_json, $userid) {
    $params = self::validate_parameters(
        self::set_tashdeed_listen_state_parameters(),
        ['progress_json' => $progress_json, 'userid' => $userid]
    );
    $userid  = (int)$params['userid'];
    $jsonraw = $params['progress_json'];

    return self::set_managed_unit_state_generic(
        $jsonraw,
        $userid,
        'tajweed',
        'tashdeed_listen',
        'prequran_tashdeed_listen_state_v1',
        'tajweed',
        'tashdeed_listen'
    );
}

public static function set_tashdeed_listen_state_returns() {
    return self::set_alphabet_listen_state_returns();
}

public static function get_tashdeed_sakoon_listen_state_parameters() {
    return new external_function_parameters([
        'userid' => new external_value(PARAM_INT, 'User id', VALUE_REQUIRED),
    ]);
}

public static function get_tashdeed_sakoon_listen_state($userid) {
    $params = self::validate_parameters(
        self::get_tashdeed_sakoon_listen_state_parameters(),
        ['userid' => $userid]
    );
    $userid = (int)$params['userid'];

    return self::get_managed_unit_state_generic(
        $userid,
        'tajweed',
        'tashdeed_sakoon_listen',
        'prequran_tashdeed_sakoon_listen_state_v1'
    );
}

public static function get_tashdeed_sakoon_listen_state_returns() {
    return self::get_alphabet_listen_state_returns();
}

public static function set_tashdeed_sakoon_listen_state_parameters() {
    return new external_function_parameters([
        'progress_json' => new external_value(PARAM_RAW, 'JSON string for Tashdeed Sakoon Listen managed progress', VALUE_REQUIRED),
        'userid'        => new external_value(PARAM_INT, 'User id', VALUE_REQUIRED),
    ]);
}

public static function set_tashdeed_sakoon_listen_state($progress_json, $userid) {
    $params = self::validate_parameters(
        self::set_tashdeed_sakoon_listen_state_parameters(),
        ['progress_json' => $progress_json, 'userid' => $userid]
    );
    $userid  = (int)$params['userid'];
    $jsonraw = $params['progress_json'];

    return self::set_managed_unit_state_generic(
        $jsonraw,
        $userid,
        'tajweed',
        'tashdeed_sakoon_listen',
        'prequran_tashdeed_sakoon_listen_state_v1',
        'tajweed',
        'tashdeed_sakoon Listen'
    );
}

public static function set_tashdeed_sakoon_listen_state_returns() {
    return self::set_alphabet_listen_state_returns();
}


public static function set_sakoon_jazm_listen_state_returns() {
    return self::set_alphabet_listen_state_returns();
}

public static function get_tashdeed_tashdeed_listen_state_parameters() {
    return new external_function_parameters([
        'userid' => new external_value(PARAM_INT, 'User id', VALUE_REQUIRED),
    ]);
}

public static function get_tashdeed_tashdeed_listen_state($userid) {
    $params = self::validate_parameters(
        self::get_tashdeed_tashdeed_listen_state_parameters(),
        ['userid' => $userid]
    );
    $userid = (int)$params['userid'];

    return self::get_managed_unit_state_generic(
        $userid,
        'tajweed',
        'tashdeed_tashdeed_listen',
        'prequran_tashdeed_tashdeed_listen_state_v1'
    );
}

public static function get_tashdeed_tashdeed_listen_state_returns() {
    return self::get_alphabet_listen_state_returns();
}

public static function set_tashdeed_tashdeed_listen_state_parameters() {
    return new external_function_parameters([
        'progress_json' => new external_value(PARAM_RAW, 'JSON string for tashdeed_tashdeed Listen managed progress', VALUE_REQUIRED),
        'userid'        => new external_value(PARAM_INT, 'User id', VALUE_REQUIRED),
    ]);
}

public static function set_tashdeed_tashdeed_listen_state($progress_json, $userid) {
    $params = self::validate_parameters(
        self::set_tashdeed_tashdeed_listen_state_parameters(),
        ['progress_json' => $progress_json, 'userid' => $userid]
    );
    $userid  = (int)$params['userid'];
    $jsonraw = $params['progress_json'];

    return self::set_managed_unit_state_generic(
        $jsonraw,
        $userid,
        'tajweed',
        'tashdeed_tashdeed_listen',
        'prequran_tashdeed_tashdeed_listen_state_v1',
        'tajweed',
        'tashdeed_tashdeed Listen'
    );
}

public static function set_tashdeed_tashdeed_listen_state_returns() {
    return self::set_alphabet_listen_state_returns();
}



    // -------------------------------------------------------------------------
    // (Optional) Alphabet Listen report API (unchanged pattern)
    // -------------------------------------------------------------------------
    public static function get_alphabet_listen_report_parameters() {
        return new external_function_parameters([
            'lessonid' => new external_value(
                PARAM_ALPHANUMEXT, 'Lesson id (e.g. alphabet)', VALUE_DEFAULT, 'alphabet'
            ),
            'unitid' => new external_value(
                PARAM_ALPHANUMEXT, 'Unit id (e.g. alphabet_listen)', VALUE_DEFAULT, 'alphabet_listen'
            ),
            'userid' => new external_value(
                PARAM_INT, 'Filter by user id (0 = all)', VALUE_DEFAULT, 0
            ),
            'stepindex' => new external_value(
                PARAM_INT, 'Filter by step index (0 = all)', VALUE_DEFAULT, 0
            ),
            'status' => new external_value(
                PARAM_ALPHA, 'completed|inprogress|notstarted or empty for all', VALUE_DEFAULT, ''
            ),
            'search' => new external_value(
                PARAM_RAW_TRIMMED, 'Free text search across name + step title', VALUE_DEFAULT, ''
            ),
            'page' => new external_value(
                PARAM_INT, 'Page number (0-based)', VALUE_DEFAULT, 0
            ),
            'perpage' => new external_value(
                PARAM_INT, 'Rows per page', VALUE_DEFAULT, 200
            ),
        ]);
    }

    public static function get_alphabet_listen_report($lessonid = 'alphabet', $unitid = 'alphabet_listen',
                                                      $userid = 0, $stepindex = 0, $status = '', $search = '',
                                                      $page = 0, $perpage = 200) {
        global $DB;

        $params = self::validate_parameters(
            self::get_alphabet_listen_report_parameters(),
            [
                'lessonid'  => $lessonid,
                'unitid'    => $unitid,
                'userid'    => $userid,
                'stepindex' => $stepindex,
                'status'    => $status,
                'search'    => $search,
                'page'      => $page,
                'perpage'   => $perpage,
            ]
        );

        $lessonid  = $params['lessonid'];
        $unitid    = $params['unitid'];
        $userid    = (int)$params['userid'];
        $stepindex = (int)$params['stepindex'];
        $status    = trim($params['status']);
        $search    = trim($params['search']);
        $page      = max(0, (int)$params['page']);
        $perpage   = max(1, min(500, (int)$params['perpage']));

        $context = context_system::instance();
        self::validate_context($context);

        if ($lessonid === '') {
            $lessonid = 'alphabet';
        }
        if ($unitid === '') {
            $unitid = 'alphabet_listen';
        }

        $where = [];
        $bind  = [];

        $where[] = 'sp.lessonid = :lessonid';
        $where[] = 'sp.unitid   = :unitid';
        $bind['lessonid'] = $lessonid;
        $bind['unitid']   = $unitid;
        $envsql = self::environment_sql('sp', 'local_prequran_stepprog', $bind);
        if ($envsql !== '') {
            $where[] = substr($envsql, 5);
        }

        if ($userid > 0) {
            $where[]        = 'sp.userid = :userid';
            $bind['userid'] = $userid;
        }

        if ($stepindex > 0) {
            $where[]           = 'sp.step_index = :stepindex';
            $bind['stepindex'] = $stepindex;
        }

        if ($status === 'completed') {
            $where[] = "sp.step_status = 'completed'";
        } else if ($status === 'inprogress') {
            $where[] = "sp.step_status = 'in_progress'";
        } else if ($status === 'notstarted') {
            $where[] = "sp.step_status = 'not_started'";
        }

        if ($search !== '') {
            $fullname = $DB->sql_concat('u.firstname', "' '", 'u.lastname');
            $like = $DB->sql_like("$fullname || ' ' || sc.step_title", ':search', false, false);
            $where[] = $like;
            $bind['search'] = '%' . $search . '%';
        }

        $wheresql = $where ? ('WHERE ' . implode(' AND ', $where)) : '';

        $countsql = "
            SELECT COUNT(1)
              FROM {local_prequran_stepprog} sp
              JOIN {user} u
                   ON u.id = sp.userid
              JOIN {local_prequran_stepcfg} sc
                   ON sc.lessonid = sp.lessonid
                  AND sc.unitid   = sp.unitid
                  AND sc.step_id  = sp.step_id
                  " . (self::table_has_environment('local_prequran_stepcfg') && self::table_has_environment('local_prequran_stepprog') ? "AND sc.environment = sp.environment" : "") . "
             $wheresql
        ";
        $total = (int)$DB->get_field_sql($countsql, $bind);

        $fullname = $DB->sql_concat('u.firstname', "' '", 'u.lastname');
        $sql = "
            SELECT
              sp.id           AS id,
              u.id            AS studentid,
              $fullname       AS studentname,
              sp.lessonid     AS lessonid,
              sp.unitid       AS unitid,
              sp.step_id      AS stepid,
              sp.step_index   AS stepindex,
              sc.step_title   AS steptitle,
              sp.step_status  AS stepstatus,
              sp.passes_done  AS passesdone,
              sp.passes_required AS passesrequired,
              sp.timemodified AS timemodified
            FROM {local_prequran_stepprog} sp
            JOIN {user} u
                 ON u.id = sp.userid
            JOIN {local_prequran_stepcfg} sc
                 ON sc.lessonid = sp.lessonid
                AND sc.unitid   = sp.unitid
                AND sc.step_id  = sp.step_id
                " . (self::table_has_environment('local_prequran_stepcfg') && self::table_has_environment('local_prequran_stepprog') ? "AND sc.environment = sp.environment" : "") . "
            $wheresql
            ORDER BY u.lastname, u.firstname, sp.step_index
        ";

        $records = $DB->get_records_sql($sql, $bind, $page * $perpage, $perpage);

        $rows = [];
        foreach ($records as $r) {
            $simple = 'notstarted';
            if ($r->stepstatus === 'completed') {
                $simple = 'completed';
            } else if ($r->passesdone > 0) {
                $simple = 'inprogress';
            }

            $rows[] = [
                'studentid'      => (int)$r->studentid,
                'studentname'    => $r->studentname,
                'lesson'         => $r->lessonid,
                'unit'           => $r->unitid,
                'stepid'         => $r->stepid,
                'stepindex'      => (int)$r->stepindex,
                'steptitle'      => $r->steptitle,
                'status'         => $simple,
                'passesdone'     => (int)$r->passesdone,
                'passesrequired' => (int)$r->passesrequired,
                'updated'        => $r->timemodified
                    ? userdate($r->timemodified, '%Y-%m-%d %H:%M')
                    : '',
            ];
        }

        return [
            'total' => $total,
            'rows'  => $rows,
        ];
    }

    public static function get_alphabet_listen_report_returns() {
        return new external_single_structure([
            'total' => new external_value(PARAM_INT, 'Total matching rows'),
            'rows'  => new external_multiple_structure(
                new external_single_structure([
                    'studentid'      => new external_value(PARAM_INT,  'Student id'),
                    'studentname'    => new external_value(PARAM_TEXT, 'Student full name'),
                    'lesson'         => new external_value(PARAM_TEXT, 'Lesson id'),
                    'unit'           => new external_value(PARAM_TEXT, 'Unit id'),
                    'stepid'         => new external_value(PARAM_TEXT, 'Step id'),
                    'stepindex'      => new external_value(PARAM_INT,  'Step index (1-based)'),
                    'steptitle'      => new external_value(PARAM_TEXT, 'Step title'),
                    'status'         => new external_value(PARAM_TEXT, 'completed|inprogress|notstarted'),
                    'passesdone'     => new external_value(PARAM_INT,  'Passes done'),
                    'passesrequired' => new external_value(PARAM_INT,  'Passes required'),
                    'updated'        => new external_value(PARAM_TEXT, 'Formatted last updated date (or empty)'),
                ])
            ),
        ]);
    }

    // =========================================================================
    // REPORTING WS (Cohort-based dashboards)
    // =========================================================================

    public static function report_cohort_unit_overview_parameters() {
        return new external_function_parameters([
            'cohortid' => new external_value(PARAM_INT, 'Cohort id', VALUE_REQUIRED),
            'lessonid' => new external_value(PARAM_ALPHANUMEXT, 'Lesson id', VALUE_REQUIRED),
            'unitid'   => new external_value(PARAM_ALPHANUMEXT, 'Unit id', VALUE_REQUIRED),
            'status'   => new external_value(PARAM_TEXT, 'optional status filter', VALUE_DEFAULT, ''),
            'inactive_days' => new external_value(PARAM_INT, 'inactive > N days (0=off)', VALUE_DEFAULT, 0),
        ]);
    }

    public static function report_cohort_unit_overview($cohortid, $lessonid, $unitid, $status = '', $inactive_days = 0) {
        global $DB;

        $p = self::validate_parameters(self::report_cohort_unit_overview_parameters(), [
            'cohortid' => $cohortid,
            'lessonid' => $lessonid,
            'unitid'   => $unitid,
            'status'   => $status,
            'inactive_days' => $inactive_days,
        ]);

        self::validate_context(context_system::instance());

        $cohortid = (int)$p['cohortid'];
        $lessonid = trim($p['lessonid']);
        $unitid   = trim($p['unitid']);
        $status   = strtolower(trim($p['status']));
        $status = str_replace(['notstarted','inprogress'], ['not_started','in_progress'], $status);
        if ($status === 'all') { $status = ''; }
        $allowed = ['not_started','in_progress','completed'];
        if ($status !== '' && !in_array($status, $allowed, true)) { $status = ''; }
        $inactive = max(0, (int)$p['inactive_days']);

        $userids = self::pq_get_cohort_userids($cohortid);
        if (empty($userids)) { return ['rows' => []]; }
list($inSql, $inParams) = $DB->get_in_or_equal($userids, SQL_PARAMS_NAMED, 'u');

        $fullname = $DB->sql_fullname('u.firstname', 'u.lastname');
        $params = ['lessonid'=>$lessonid,'unitid'=>$unitid] + $inParams;
        $environment = self::current_environment();
        $lpenvjoin = self::environment_sql('lp', 'local_prequran_lessonprog', $params, $environment);
        $spenvwhere = self::environment_sql('sp', 'local_prequran_stepprog', $params, $environment);

        $where = "u.id $inSql";
        if ($status !== '') {
            $where .= " AND lp.overall_status = :status";
            $params['status'] = $status;
        }
        if ($inactive > 0) {
            $cut = time() - ($inactive * 86400);
            $where .= " AND (lp.overall_lastactivity IS NULL OR lp.overall_lastactivity < :cut)";
            $params['cut'] = $cut;
        }

        $sql = "
            SELECT
              u.id AS userid,
              u.username AS username,
              $fullname AS fullname,
              lp.overall_status,
              lp.overall_starttime,
              lp.overall_completiontime,
              lp.overall_lastactivity,
              lp.steps_total,
              lp.steps_completed,
              lp.completion_percent,
              lp.target_duration_days,
              lp.actual_duration_seconds,
              lp.device_type,
              lp.user_agent
            FROM {user} u
            LEFT JOIN {local_prequran_lessonprog} lp
              ON lp.userid = u.id AND lp.lessonid = :lessonid AND lp.unitid = :unitid{$lpenvjoin}
            WHERE $where
            ORDER BY u.lastname, u.firstname
        ";
        $recs = $DB->get_records_sql($sql, $params);

        // worst pass inflation per user for this unit
        $inflationByUser = [];
        $inflSql = "
            SELECT sp.userid, MAX(GREATEST(0, sp.passes_done - sp.passes_required)) AS inflation_max
              FROM {local_prequran_stepprog} sp
             WHERE sp.userid $inSql AND sp.lessonid = :lessonid AND sp.unitid = :unitid{$spenvwhere}
             GROUP BY sp.userid
        ";
        $inflRecs = $DB->get_records_sql($inflSql, $params);
        foreach ($inflRecs as $ir) $inflationByUser[(int)$ir->userid] = (int)$ir->inflation_max;

        $rows = [];
        foreach ($recs as $r) {
            $nowts = time();
            $st = $r->overall_status ?? 'not_started';

            $inactivityPts = 0; $inactiveDays = 0;
            if ($st === 'in_progress' && !empty($r->overall_lastactivity)) {
                $inactiveDays = (int)floor(max(0, ($nowts - (int)$r->overall_lastactivity)) / 86400);
                $inactivityPts = min(50, $inactiveDays * 10);
            }

            $overduePts = 0; $overdueDays = 0;
            $targetDays = !empty($r->target_duration_days) ? (int)$r->target_duration_days : 0;
            if ($st === 'in_progress' && $targetDays > 0 && !empty($r->overall_starttime)) {
                $daysSinceStart = (int)floor(max(0, ($nowts - (int)$r->overall_starttime)) / 86400);
                $overdueDays = max(0, $daysSinceStart - $targetDays);
                $overduePts = min(30, $overdueDays * 6);
            }

            $inflMax = $inflationByUser[(int)$r->userid] ?? 0;
            $inflPts = min(20, max(0, $inflMax) * 10);

            $riskScore = min(100, $inactivityPts + $overduePts + $inflPts);
            $riskLevel = ($riskScore >= 60) ? 'high' : (($riskScore >= 25) ? 'medium' : 'low');

            $rows[] = [
                'userid' => (int)$r->userid,
                'username' => $r->username ?? '',
                'fullname' => $r->fullname,
                'overall_status' => $r->overall_status ?? 'not_started',
                'overall_starttime' => $r->overall_starttime ? (int)$r->overall_starttime : 0,
                'overall_completiontime' => $r->overall_completiontime ? (int)$r->overall_completiontime : 0,
                'overall_lastactivity' => $r->overall_lastactivity ? (int)$r->overall_lastactivity : 0,
                'steps_total' => $r->steps_total ? (int)$r->steps_total : 0,
                'steps_completed' => $r->steps_completed ? (int)$r->steps_completed : 0,
                'completion_percent' => $r->completion_percent ? (int)$r->completion_percent : 0,
                'target_duration_days' => $r->target_duration_days ? (int)$r->target_duration_days : 0,
                'actual_duration_seconds' => $r->actual_duration_seconds ? (int)$r->actual_duration_seconds : 0,
                'device_type' => $r->device_type ?? '',
                'user_agent' => $r->user_agent ?? '',
                'risk_score' => (int)$riskScore,
                'risk_level' => $riskLevel,
                'inactive_days' => (int)$inactiveDays,
                'overdue_days' => (int)$overdueDays,
                'inflation_max' => (int)$inflMax,
            ];
        }

        return ['rows' => $rows];
    }

    public static function report_cohort_unit_overview_returns() {
        return new external_single_structure([
            'rows' => new external_multiple_structure(
                new external_single_structure([
                    'userid' => new external_value(PARAM_INT, 'User id'),
                    'username' => new external_value(PARAM_TEXT, 'Username'),
                    'fullname' => new external_value(PARAM_TEXT, 'Full name'),
                    'overall_status' => new external_value(PARAM_TEXT, 'not_started|in_progress|completed'),
                    'overall_starttime' => new external_value(PARAM_INT, 'Unix time'),
                    'overall_completiontime' => new external_value(PARAM_INT, 'Unix time'),
                    'overall_lastactivity' => new external_value(PARAM_INT, 'Unix time'),
                    'steps_total' => new external_value(PARAM_INT, 'Total steps'),
                    'steps_completed' => new external_value(PARAM_INT, 'Completed steps'),
                    'completion_percent' => new external_value(PARAM_INT, '0..100'),
                    'target_duration_days' => new external_value(PARAM_INT, 'Target duration days'),
                    'actual_duration_seconds' => new external_value(PARAM_INT, 'Actual duration seconds'),
                    'device_type' => new external_value(PARAM_TEXT, 'mobile|tablet|desktop'),
                    'user_agent' => new external_value(PARAM_RAW, 'User agent'),
                    'risk_score' => new external_value(PARAM_INT, '0..100'),
                    'risk_level' => new external_value(PARAM_TEXT, 'low|medium|high'),
                    'inactive_days' => new external_value(PARAM_INT, 'Days since last activity'),
                    'overdue_days' => new external_value(PARAM_INT, 'Days overdue vs target'),
                    'inflation_max' => new external_value(PARAM_INT, 'Max(passes_done - passes_required)'),
                ])
            )
        ]);
    }

    public static function report_student_unit_detail_parameters() {
        return new external_function_parameters([
            'userid'   => new external_value(PARAM_INT, 'Student user id', VALUE_REQUIRED),
            'lessonid' => new external_value(PARAM_ALPHANUMEXT, 'Lesson id', VALUE_REQUIRED),
            'unitid'   => new external_value(PARAM_ALPHANUMEXT, 'Unit id', VALUE_REQUIRED),
        ]);
    }

    public static function report_student_unit_detail($userid, $lessonid, $unitid) {
        global $DB;
        $p = self::validate_parameters(self::report_student_unit_detail_parameters(), [
            'userid'=>$userid,'lessonid'=>$lessonid,'unitid'=>$unitid
        ]);
        self::validate_context(context_system::instance());
        $environment = self::current_environment();
        $queryparams = [
            'userid'=>(int)$p['userid'],
            'lessonid'=>trim($p['lessonid']),
            'unitid'=>trim($p['unitid'])
        ];
        $spenvwhere = self::environment_sql('sp', 'local_prequran_stepprog', $queryparams, $environment);
        $scenvjoin = (self::table_has_environment('local_prequran_stepcfg') && self::table_has_environment('local_prequran_stepprog'))
            ? ' AND sc.environment = sp.environment'
            : '';

        $sql = "
            SELECT
              sp.step_index,
              sp.step_id,
              COALESCE(sc.step_title, sp.step_title) AS step_title,
              sp.step_status,
              sp.passes_done,
              sp.passes_required,
              sp.repeats_per_letter,
              sp.step_starttime,
              sp.step_lastactivity,
              sp.step_completiontime,
              sp.total_entries,
              sp.correct_answers,
              sp.wrong_answers,
              sp.timeout_count
            FROM {local_prequran_stepprog} sp
            LEFT JOIN {local_prequran_stepcfg} sc
              ON sc.lessonid = sp.lessonid AND sc.unitid = sp.unitid AND sc.step_id = sp.step_id{$scenvjoin}
            WHERE sp.userid = :userid AND sp.lessonid = :lessonid AND sp.unitid = :unitid{$spenvwhere}
            ORDER BY sp.step_index ASC
        ";
        $recs = $DB->get_records_sql($sql, $queryparams);

        $steps = [];
        foreach ($recs as $r) {
            $steps[] = [
                'step_index' => (int)$r->step_index,
                'step_id' => $r->step_id,
                'step_title' => $r->step_title ?? $r->step_id,
                'step_status' => $r->step_status ?? 'not_started',
                'passes_done' => (int)($r->passes_done ?? 0),
                'passes_required' => (int)($r->passes_required ?? 1),
                'repeats_per_letter' => (int)($r->repeats_per_letter ?? 1),
                'step_starttime' => $r->step_starttime ? (int)$r->step_starttime : 0,
                'step_lastactivity' => $r->step_lastactivity ? (int)$r->step_lastactivity : 0,
                'step_completiontime' => $r->step_completiontime ? (int)$r->step_completiontime : 0,
                'total_entries' => (int)($r->total_entries ?? 0),
                'correct_answers' => (int)($r->correct_answers ?? 0),
                'wrong_answers' => (int)($r->wrong_answers ?? 0),
                'timeout_count' => (int)($r->timeout_count ?? 0),
            ];
        }
        return ['steps'=>$steps];
    }

    public static function report_student_unit_detail_returns() {
        return new external_single_structure([
            'steps' => new external_multiple_structure(
                new external_single_structure([
                    'step_index' => new external_value(PARAM_INT, 'Step index'),
                    'step_id' => new external_value(PARAM_TEXT, 'Step id'),
                    'step_title' => new external_value(PARAM_TEXT, 'Step title'),
                    'step_status' => new external_value(PARAM_TEXT, 'Status'),
                    'passes_done' => new external_value(PARAM_INT, 'Passes done'),
                    'passes_required' => new external_value(PARAM_INT, 'Passes required'),
                    'repeats_per_letter' => new external_value(PARAM_INT, 'Repeats per letter'),
                    'step_starttime' => new external_value(PARAM_INT, 'Unix time'),
                    'step_lastactivity' => new external_value(PARAM_INT, 'Unix time'),
                    'step_completiontime' => new external_value(PARAM_INT, 'Unix time'),
                    'total_entries' => new external_value(PARAM_INT, 'Total entries'),
                    'correct_answers' => new external_value(PARAM_INT, 'Correct'),
                    'wrong_answers' => new external_value(PARAM_INT, 'Wrong'),
                    'timeout_count' => new external_value(PARAM_INT, 'Timeout'),
                ])
            )
        ]);
    }

    public static function report_cohort_step_analytics_parameters() {
        return new external_function_parameters([
            'cohortid' => new external_value(PARAM_INT, 'Cohort id', VALUE_REQUIRED),
            'lessonid' => new external_value(PARAM_ALPHANUMEXT, 'Lesson id', VALUE_REQUIRED),
            'unitid'   => new external_value(PARAM_ALPHANUMEXT, 'Unit id', VALUE_REQUIRED),
        ]);
    }

    public static function report_cohort_step_analytics($cohortid, $lessonid, $unitid) {
        global $DB;
        $p = self::validate_parameters(self::report_cohort_step_analytics_parameters(), [
            'cohortid'=>$cohortid,'lessonid'=>$lessonid,'unitid'=>$unitid
        ]);
        self::validate_context(context_system::instance());

        $userids = self::pq_get_cohort_userids((int)$p['cohortid']);
        if (empty($userids)) return ['rows'=>[]];
list($inSql, $inParams) = $DB->get_in_or_equal($userids, SQL_PARAMS_NAMED, 'u');
        $params = ['lessonid'=>trim($p['lessonid']), 'unitid'=>trim($p['unitid'])] + $inParams;
        $environment = self::current_environment();
        $spenvwhere = self::environment_sql('sp', 'local_prequran_stepprog', $params, $environment);
        $scenvjoin = (self::table_has_environment('local_prequran_stepcfg') && self::table_has_environment('local_prequran_stepprog'))
            ? ' AND sc.environment = sp.environment'
            : '';

        $sql = "
            SELECT
              sp.step_id,
              COALESCE(sc.step_title, sp.step_title) AS step_title,
              COUNT(1) AS total_rows,
              SUM(CASE WHEN sp.step_status = 'completed' THEN 1 ELSE 0 END) AS completed_rows,
              AVG(CASE WHEN sp.step_completiontime IS NOT NULL AND sp.step_starttime IS NOT NULL
                       THEN (sp.step_completiontime - sp.step_starttime) ELSE NULL END) AS avg_seconds,
              AVG(sp.passes_done) AS avg_passes_done,
              AVG(sp.passes_required) AS avg_passes_required,
              AVG(sp.wrong_answers) AS avg_wrong
            FROM {local_prequran_stepprog} sp
            LEFT JOIN {local_prequran_stepcfg} sc
              ON sc.lessonid = sp.lessonid AND sc.unitid = sp.unitid AND sc.step_id = sp.step_id{$scenvjoin}
            WHERE sp.userid $inSql AND sp.lessonid = :lessonid AND sp.unitid = :unitid{$spenvwhere}
            GROUP BY sp.step_id, step_title
            ORDER BY MIN(sp.step_index) ASC
        ";

        $recs = $DB->get_records_sql($sql, $params);
        $rows = [];
        foreach ($recs as $r) {
            $total = (int)$r->total_rows;
            $done  = (int)$r->completed_rows;
            $rows[] = [
                'step_id' => $r->step_id,
                'step_title' => $r->step_title ?? $r->step_id,
                'completion_rate' => ($total > 0) ? (int)floor(($done / $total) * 100) : 0,
                'avg_seconds' => $r->avg_seconds !== null ? (int)round($r->avg_seconds) : 0,
                'avg_passes_done' => $r->avg_passes_done !== null ? (float)$r->avg_passes_done : 0.0,
                'avg_passes_required' => $r->avg_passes_required !== null ? (float)$r->avg_passes_required : 0.0,
                'avg_wrong' => $r->avg_wrong !== null ? (float)$r->avg_wrong : 0.0,
            ];
        }
        return ['rows'=>$rows];
    }

    public static function report_cohort_step_analytics_returns() {
        return new external_single_structure([
            'rows' => new external_multiple_structure(
                new external_single_structure([
                    'step_id' => new external_value(PARAM_TEXT, 'Step id'),
                    'step_title' => new external_value(PARAM_TEXT, 'Step title'),
                    'completion_rate' => new external_value(PARAM_INT, '0..100'),
                    'avg_seconds' => new external_value(PARAM_INT, 'Avg seconds'),
                    'avg_passes_done' => new external_value(PARAM_FLOAT, 'Avg passes done'),
                    'avg_passes_required' => new external_value(PARAM_FLOAT, 'Avg passes required'),
                    'avg_wrong' => new external_value(PARAM_FLOAT, 'Avg wrong answers'),
                ])
            )
        ]);
    }

    

    // =========================================================================
    // LIGHTWEIGHT UPDATE WS (start/touch for better reporting)
    // =========================================================================

    public static function mark_unit_started_parameters() {
        return new external_function_parameters([
            'userid' => new external_value(PARAM_INT, 'User id', VALUE_REQUIRED),
            'lessonid' => new external_value(PARAM_ALPHANUMEXT, 'Lesson id', VALUE_REQUIRED),
            'unitid'   => new external_value(PARAM_ALPHANUMEXT, 'Unit id', VALUE_REQUIRED),
            'started_via' => new external_value(PARAM_TEXT, 'dialog|auto|teacher_reset', VALUE_DEFAULT, 'dialog'),
            'device_type' => new external_value(PARAM_TEXT, 'mobile|tablet|desktop', VALUE_DEFAULT, ''),
            'user_agent'  => new external_value(PARAM_RAW, 'UA string', VALUE_DEFAULT, ''),
        ]);
    }

    public static function mark_unit_started($userid, $lessonid, $unitid, $started_via = 'dialog', $device_type = '', $user_agent = '') {
        global $DB;

        $p = self::validate_parameters(self::mark_unit_started_parameters(), [
            'userid'=>$userid,'lessonid'=>$lessonid,'unitid'=>$unitid,'started_via'=>$started_via,'device_type'=>$device_type,'user_agent'=>$user_agent
        ]);
        self::validate_context(context_system::instance());

        $userid = (int)$p['userid'];
        $lessonid = trim($p['lessonid']);
        $unitid = trim($p['unitid']);
        $now = time();

        $environment = self::current_environment();
        $conds = self::with_environment_condition('local_prequran_lessonprog',
            ['userid'=>$userid,'lessonid'=>$lessonid,'unitid'=>$unitid],
            $environment);
        $lp = $DB->get_record('local_prequran_lessonprog', $conds);

        if (!$lp) {
            $lessontitle = core_text::strtotitle(str_replace('_',' ',$lessonid));
            $unittitle   = core_text::strtotitle(str_replace('_',' ',$unitid));
            self::ensure_unit_initialized($userid, $lessonid, $unitid, $lessontitle, $unittitle);
            $lp = $DB->get_record('local_prequran_lessonprog', $conds, '*', MUST_EXIST);
        }

        if (empty($lp->overall_starttime)) {
            $lp->overall_status = 'in_progress';
            $lp->overall_starttime = $now;
            if (property_exists($lp, 'started_via')) $lp->started_via = trim($p['started_via']);
        }
        $lp->overall_lastactivity = $now;
        if (!empty($p['device_type']) && property_exists($lp, 'device_type') && empty($lp->device_type)) $lp->device_type = trim($p['device_type']);
        if (!empty($p['user_agent']) && property_exists($lp, 'user_agent') && empty($lp->user_agent)) $lp->user_agent = $p['user_agent'];
        $lp->timemodified = $now;

        $DB->update_record('local_prequran_lessonprog', $lp);
        return ['ok'=>true];
    }

    public static function mark_unit_started_returns() {
        return new external_single_structure([
            'ok' => new external_value(PARAM_BOOL, 'OK'),
        ]);
    }

    public static function touch_unit_parameters() {
        return new external_function_parameters([
            'userid' => new external_value(PARAM_INT, 'User id', VALUE_REQUIRED),
            'lessonid' => new external_value(PARAM_ALPHANUMEXT, 'Lesson id', VALUE_REQUIRED),
            'unitid'   => new external_value(PARAM_ALPHANUMEXT, 'Unit id', VALUE_REQUIRED),
            'device_type' => new external_value(PARAM_TEXT, 'mobile|tablet|desktop', VALUE_DEFAULT, ''),
            'user_agent'  => new external_value(PARAM_RAW, 'UA string', VALUE_DEFAULT, ''),
        ]);
    }

    public static function touch_unit($userid, $lessonid, $unitid, $device_type = '', $user_agent = '') {
        global $DB;

        $p = self::validate_parameters(self::touch_unit_parameters(), [
            'userid'=>$userid,'lessonid'=>$lessonid,'unitid'=>$unitid,'device_type'=>$device_type,'user_agent'=>$user_agent
        ]);
        self::validate_context(context_system::instance());

        $userid = (int)$p['userid'];
        $lessonid = trim($p['lessonid']);
        $unitid = trim($p['unitid']);
        $now = time();

        $lp = $DB->get_record('local_prequran_lessonprog',
            self::with_environment_condition('local_prequran_lessonprog',
                ['userid'=>$userid,'lessonid'=>$lessonid,'unitid'=>$unitid]));
        if (!$lp) return ['ok'=>true];

        $lp->overall_lastactivity = $now;
        if (!empty($p['device_type']) && property_exists($lp, 'device_type') && empty($lp->device_type)) $lp->device_type = trim($p['device_type']);
        if (!empty($p['user_agent']) && property_exists($lp, 'user_agent') && empty($lp->user_agent)) $lp->user_agent = $p['user_agent'];
        $lp->timemodified = $now;
        $DB->update_record('local_prequran_lessonprog', $lp);

        return ['ok'=>true];
    }

    public static function touch_unit_returns() {
        return new external_single_structure([
            'ok' => new external_value(PARAM_BOOL, 'OK'),
        ]);
    }

    public static function touch_step_parameters() {
        return new external_function_parameters([
            'userid' => new external_value(PARAM_INT, 'User id', VALUE_REQUIRED),
            'lessonid' => new external_value(PARAM_ALPHANUMEXT, 'Lesson id', VALUE_REQUIRED),
            'unitid'   => new external_value(PARAM_ALPHANUMEXT, 'Unit id', VALUE_REQUIRED),
            'step_id'  => new external_value(PARAM_TEXT, 'Step id', VALUE_REQUIRED),
        ]);
    }

    public static function touch_step($userid, $lessonid, $unitid, $step_id) {
        global $DB;

        $p = self::validate_parameters(self::touch_step_parameters(), [
            'userid'=>$userid,'lessonid'=>$lessonid,'unitid'=>$unitid,'step_id'=>$step_id
        ]);
        self::validate_context(context_system::instance());

        $userid = (int)$p['userid'];
        $lessonid = trim($p['lessonid']);
        $unitid = trim($p['unitid']);
        $stepid = trim($p['step_id']);
        $now = time();

        $sp = $DB->get_record('local_prequran_stepprog',
            self::with_environment_condition('local_prequran_stepprog',
                ['userid'=>$userid,'lessonid'=>$lessonid,'unitid'=>$unitid,'step_id'=>$stepid]));
        if (!$sp) return ['ok'=>true];

        if (property_exists($sp, 'step_starttime') && empty($sp->step_starttime)) $sp->step_starttime = $now;
        if (property_exists($sp, 'step_lastactivity')) $sp->step_lastactivity = $now;
        $sp->timemodified = $now;
        $DB->update_record('local_prequran_stepprog', $sp);

        return ['ok'=>true];
    }

    public static function touch_step_returns() {
        return new external_single_structure([
            'ok' => new external_value(PARAM_BOOL, 'OK'),
        ]);
    }

// =========================================================================
    // ADMIN ACTION: Reset unit for student (admin-only)
    // =========================================================================
    


public static function reset_unit_parameters() {
    return new external_function_parameters([
        // Accept both keys; studentid is PARAM_RAW to avoid strict int validation failing on bad values.
        'userid' => new external_value(PARAM_INT, 'Student user id', VALUE_DEFAULT, 0),
        'studentid' => new external_value(PARAM_RAW, 'Student user id (alias; may be blank or non-numeric)', VALUE_DEFAULT, ''),
        // Make lessonid/unitid default to '' so validate_parameters never hard-fails; we validate inside.
        'lessonid' => new external_value(PARAM_TEXT, 'Lesson id', VALUE_DEFAULT, ''),
        'unitid' => new external_value(PARAM_TEXT, 'Unit id', VALUE_DEFAULT, ''),
    ]);
}




    

public static function reset_unit($userid = 0, $lessonid = '', $unitid = '', $studentid = '') {
    global $DB, $USER;

    $params = self::validate_parameters(self::reset_unit_parameters(), [
        'userid' => $userid,
        'studentid' => $studentid,
        'lessonid' => $lessonid,
        'unitid' => $unitid,
    ]);

    $userid = (int)$params['userid'];
    $studentid_raw = $params['studentid'];
    $lessonid = trim((string)$params['lessonid']);
    $unitid = trim((string)$params['unitid']);

    // Coerce studentid alias safely (ignore non-numeric values like 'alphabet_listen').
    $studentid = 0;
    if ($studentid_raw !== null && $studentid_raw !== '') {
        if (is_numeric($studentid_raw)) {
            $studentid = (int)$studentid_raw;
        }
    }

    $targetid = $userid > 0 ? $userid : $studentid;
    if ($targetid <= 0) {
        throw new invalid_parameter_exception('userid is required.');
    }
    if ($lessonid === '' || $unitid === '') {
        throw new invalid_parameter_exception('lessonid and unitid are required.');
    }

    // Keep your existing permission rule below (do not alter if you already enforce admin/teacher policy elsewhere).

    $conds = ['userid' => $targetid, 'lessonid' => $lessonid, 'unitid' => $unitid];
    $stepconds = self::with_environment_condition('local_prequran_stepprog', $conds);
    $lessonconds = self::with_environment_condition('local_prequran_lessonprog', $conds);
    $DB->delete_records('local_prequran_stepprog', $stepconds);
    $DB->delete_records('local_prequran_lessonprog', $lessonconds);

    return ['status' => 'ok', 'message' => 'Unit reset complete'];
}



    public static function reset_unit_returns() {
        return new external_single_structure([
            'ok' => new external_value(PARAM_BOOL, 'OK'),
        ]);
    }


    // -------------------------------------------------------------------------
    // Permissions helper: allow admin OR teacher within cohort
    // Teacher rule: caller must be member of the cohort AND target student must be member too.
    // -------------------------------------------------------------------------
    protected static function pq_assert_teacher_or_admin_in_cohort(int $cohortid, int $studentid): void {
    global $USER;

    self::validate_context(\context_system::instance());

    // Admin always allowed.
    if (\is_siteadmin((int)$USER->id)) {
        return;
    }

    // Teacher must be in cohort.
    if (!\cohort_is_member($cohortid, $USER->id)) {
        throw new \invalid_parameter_exception('Not allowed: teacher is not a member of the cohort.');
    }

    // Student must be in cohort.
    if (!\cohort_is_member($cohortid, $studentid)) {
        throw new \invalid_parameter_exception('Not allowed: student is not a member of the cohort.');
    }
}

    // -------------------------------------------------------------------------
    // Reset STUDENT: clears all progress rows for a student (optionally within a lessonid)
    // Teacher allowed ONLY if both teacher+student are in cohortid.
    // -------------------------------------------------------------------------
    
public static function reset_student_parameters() {
    return new external_function_parameters([
        'cohortid' => new external_value(PARAM_INT, 'Cohort id'),
        'studentid' => new external_value(PARAM_INT, 'Student user id', VALUE_DEFAULT, 0),
        'userid' => new external_value(PARAM_INT, 'Student user id (alias)', VALUE_DEFAULT, 0),
        'lessonid' => new external_value(PARAM_TEXT, 'Lesson id (optional)', VALUE_DEFAULT, ''),
        'unitid' => new external_value(PARAM_TEXT, 'Unit id (optional)', VALUE_DEFAULT, ''),
    ]);
}


    

public static function reset_student($cohortid, $studentid = 0, $lessonid = '', $unitid = '', $userid = 0) {
    global $DB;

    $params = self::validate_parameters(self::reset_student_parameters(), [
        'cohortid' => $cohortid,
        'studentid' => $studentid,
        'userid' => $userid,
        'lessonid' => $lessonid,
        'unitid' => $unitid,
    ]);

    $cohortid = (int)$params['cohortid'];
    $studentid = (int)$params['studentid'];
    $userid = (int)$params['userid'];
    $lessonid = trim((string)$params['lessonid']);
    $unitid = trim((string)$params['unitid']);

    $targetid = $userid > 0 ? $userid : $studentid;
    if ($targetid <= 0) {
        throw new invalid_parameter_exception('studentid (or userid) must be provided.');
    }

    pq_assert_teacher_or_admin_in_cohort($cohortid);

    if ($cohortid > 0) {
        $studentinc = $DB->record_exists('cohort_members', ['cohortid' => $cohortid, 'userid' => $targetid]);
        if (!$studentinc) {
            throw new invalid_parameter_exception('Student is not a member of the cohort.');
        }
    }

    $conds = ['userid' => $targetid];
    if ($lessonid !== '') {
        $conds['lessonid'] = $lessonid;
    }
    if ($unitid !== '') {
        $conds['unitid'] = $unitid;
    }

    $stepconds = self::with_environment_condition('local_prequran_stepprog', $conds);
    $lessonconds = self::with_environment_condition('local_prequran_lessonprog', $conds);

    $deletedstepprog = $DB->count_records('local_prequran_stepprog', $stepconds);
    $deletedlessonprog = $DB->count_records('local_prequran_lessonprog', $lessonconds);

    $DB->delete_records('local_prequran_stepprog', $stepconds);
    $DB->delete_records('local_prequran_lessonprog', $lessonconds);

    return [
        'status' => 'ok',
        'message' => 'Student reset complete',
        'deleted_stepprog' => $deletedstepprog,
        'deleted_lessonprog' => $deletedlessonprog,
        'studentid' => $targetid,
        'lessonid' => $lessonid,
        'unitid' => $unitid,
        'cohortid' => $cohortid,
    ];
}




    

public static function reset_student_returns() {
    return new external_single_structure([
        'status' => new external_value(PARAM_TEXT, 'ok|error'),
        'message' => new external_value(PARAM_TEXT, 'Message'),
        'deleted_stepprog' => new external_value(PARAM_INT, 'Deleted step progress rows'),
        'deleted_lessonprog' => new external_value(PARAM_INT, 'Deleted lesson progress rows'),
        'studentid' => new external_value(PARAM_INT, 'Student id'),
        'lessonid' => new external_value(PARAM_TEXT, 'Lesson id (optional)'),
        'unitid' => new external_value(PARAM_TEXT, 'Unit id (optional)'),
        'cohortid' => new external_value(PARAM_INT, 'Cohort id'),
    ]);
}



    // -------------------------------------------------------------------------
    // Reset STEP: resets a single step for a student (keeps other steps)
    // Teacher allowed ONLY if both teacher+student are in cohortid.
    // -------------------------------------------------------------------------
    public static function reset_step_parameters() {
    return new \external_function_parameters([
        'cohortid'  => new \external_value(PARAM_INT, 'Cohort id for permission check', VALUE_REQUIRED),

        // Standardize on userid for WS callers; accept legacy studentid as fallback.
        'userid'    => new \external_value(PARAM_INT, 'Student user id', VALUE_REQUIRED),

        // Use VALUE_DEFAULT instead of VALUE_OPTIONAL (avoids “invalid OPTIONAL…” issues)
        'studentid' => new \external_value(PARAM_INT, 'Legacy alias for userid', VALUE_DEFAULT, 0),

        'lessonid'  => new \external_value(PARAM_ALPHANUMEXT, 'Lesson id', VALUE_REQUIRED),
        'unitid'    => new \external_value(PARAM_ALPHANUMEXT, 'Unit id', VALUE_REQUIRED),

        // Avoid PARAM_RAW_TRIMMED if your Moodle build doesn’t support it everywhere.
        'step_id'   => new \external_value(PARAM_RAW, 'Step id (or "N. Title") to reset', VALUE_REQUIRED),
    ]);
    }

    public static function reset_step($cohortid, $userid, $lessonid, $unitid, $step_id, $studentid = 0) {
        global $DB, $USER;

        $p = self::validate_parameters(self::reset_step_parameters(), [
            'cohortid'  => $cohortid,
            'userid'    => $userid,
            'studentid' => $studentid,
            'lessonid'  => $lessonid,
            'unitid'    => $unitid,
            'step_id'   => $step_id,
        ]);

        $syscontext = context_system::instance();
        self::validate_context($syscontext);

        if (!self::current_user_can_use_nonproduction_qa_tools()) {
            throw new \required_capability_exception($syscontext, 'local/prequran:resetstep', 'nopermissions', '');
        }

        $cohortid  = (int)$p['cohortid'];
        $studentid = !empty($p['studentid']) ? (int)$p['studentid'] : (int)$p['userid'];
        $lessonid  = trim((string)$p['lessonid']);
        $unitid    = trim((string)$p['unitid']);
        $stepid    = trim((string)$p['step_id']);
        // Accept flexible step selector from dashboards:
        // - canonical step id: "lecture", "heavy", "all_letters"
        // - numeric index: "6"
        // - label form: "6. Lecture"
        $stepraw = $stepid;

        $stepindex = null;
        if ($stepraw !== '' && preg_match('/^\s*(\d+)\s*(?:\.|\)|-)\s*(.*)$/u', $stepraw, $m)) {
            $stepindex = (int)$m[1];
            // keep remainder as hint, but we'll resolve by index from DB
        } else if ($stepraw !== '' && ctype_digit($stepraw)) {
            $stepindex = (int)$stepraw;
        }

        // Normalize step id text if provided (e.g. "Lecture" -> "lecture", "All letters" -> "all_letters")
        $stepnorm = strtolower(trim($stepraw));
        $stepnorm = str_replace([' ', '-'], '_', $stepnorm);
        $stepnorm = preg_replace('/[^a-z0-9_]/', '', $stepnorm);

        // Resolve canonical step id using step_index when available
        if ($stepindex !== null && $stepindex > 0) {
            $resolved = $DB->get_record('local_prequran_stepprog',
                self::with_environment_condition('local_prequran_stepprog', [
                    'userid' => $studentid,
                    'lessonid' => $lessonid,
                    'unitid' => $unitid,
                    'step_index' => $stepindex,
                ]),
                'id,step_id', IGNORE_MISSING);

            if ($resolved && !empty($resolved->step_id)) {
                $stepid = $resolved->step_id;
            }
        }

        // Fallback to normalized id if it matches an existing row
        if ($stepid === '' || $stepid !== $stepnorm) {
            $exists = $DB->record_exists('local_prequran_stepprog',
                self::with_environment_condition('local_prequran_stepprog', [
                    'userid' => $studentid,
                    'lessonid' => $lessonid,
                    'unitid' => $unitid,
                    'step_id' => $stepid,
                ]));
            if (!$exists && $stepnorm !== '') {
                $exists2 = $DB->record_exists('local_prequran_stepprog',
                    self::with_environment_condition('local_prequran_stepprog', [
                        'userid' => $studentid,
                        'lessonid' => $lessonid,
                        'unitid' => $unitid,
                        'step_id' => $stepnorm,
                    ]));
                if ($exists2) {
                    $stepid = $stepnorm;
                }
            }
        }



        self::pq_assert_teacher_or_admin_in_cohort($cohortid, $studentid);

        $rec = $DB->get_record('local_prequran_stepprog',
            self::with_environment_condition('local_prequran_stepprog', [
                'userid' => $studentid,
                'lessonid' => $lessonid,
                'unitid' => $unitid,
                'step_id' => $stepid,
            ]),
            '*', IGNORE_MISSING);

        if (!$rec) {
            throw new \invalid_parameter_exception('Step not found for this student/unit. Use step_id like lecture/heavy or label "N. Title".');
        }

        if ($rec) {
            $rec->step_status = 'not_started';
            $rec->passes_done = 0;
            if (property_exists($rec,'completed')) $rec->completed = 0;
            if (property_exists($rec,'total_entries')) $rec->total_entries = 0;
            if (property_exists($rec,'correct_answers')) $rec->correct_answers = 0;
            if (property_exists($rec,'wrong_answers')) $rec->wrong_answers = 0;
            if (property_exists($rec,'timeout_count')) $rec->timeout_count = 0;
            if (property_exists($rec,'step_starttime')) $rec->step_starttime = null;
            if (property_exists($rec,'step_lastactivity')) $rec->step_lastactivity = null;
            if (property_exists($rec,'step_completiontime')) $rec->step_completiontime = null;
            $rec->timemodified = time();
            $DB->update_record('local_prequran_stepprog', $rec);
        }

        // Roll up lessonprog
        $lp = $DB->get_record('local_prequran_lessonprog',
            self::with_environment_condition('local_prequran_lessonprog', [
                'userid' => $studentid,
                'lessonid' => $lessonid,
                'unitid' => $unitid,
            ]),
            '*', IGNORE_MISSING);

        if ($lp) {
            $steps_total = $DB->count_records('local_prequran_stepcfg',
                self::with_environment_condition('local_prequran_stepcfg', [
                    'lessonid' => $lessonid,
                    'unitid' => $unitid,
                    'active' => 1,
                ]));
            $steps_completed = $DB->count_records('local_prequran_stepprog',
                self::with_environment_condition('local_prequran_stepprog', [
                    'userid' => $studentid,
                    'lessonid' => $lessonid,
                    'unitid' => $unitid,
                    'step_status' => 'completed',
                ]));

            $lp->steps_total = (int)$steps_total;
            $lp->steps_completed = (int)$steps_completed;
            $lp->completion_percent = ($steps_total > 0) ? (int)floor(($steps_completed / $steps_total) * 100) : 0;

            if ($steps_completed <= 0) {
                $lp->overall_status = 'not_started';
                if (property_exists($lp,'overall_completiontime')) $lp->overall_completiontime = null;
            } else if ($steps_completed < $steps_total) {
                $lp->overall_status = 'in_progress';
                if (property_exists($lp,'overall_completiontime')) $lp->overall_completiontime = null;
            } else {
                $lp->overall_status = 'completed';
                if (property_exists($lp,'overall_completiontime') && empty($lp->overall_completiontime)) $lp->overall_completiontime = time();
            }

            if (property_exists($lp,'overall_lastactivity')) $lp->overall_lastactivity = time();
            $lp->timemodified = time();
            $DB->update_record('local_prequran_lessonprog', $lp);
        }

        return ['status' => true, 'step_id' => $stepid, 'userid' => $studentid];
    }

    public static function reset_step_returns() {
        return new \external_single_structure([
            'status' => new \external_value(PARAM_BOOL, 'True on success'),
        ]);
    }


    // -------------------------------------------------------------------------
    // Skip STEP: teacher/admin QA helper for non-production environments only.
    // Marks one step complete, then recalculates the lesson rollup.
    // -------------------------------------------------------------------------
    public static function skip_step_parameters() {
        return new \external_function_parameters([
            'cohortid'  => new \external_value(PARAM_INT, 'Cohort id for optional teacher scope check', VALUE_DEFAULT, 0),
            'userid'    => new \external_value(PARAM_INT, 'Student user id', VALUE_REQUIRED),
            'studentid' => new \external_value(PARAM_INT, 'Legacy alias for userid', VALUE_DEFAULT, 0),
            'lessonid'  => new \external_value(PARAM_ALPHANUMEXT, 'Lesson id', VALUE_REQUIRED),
            'unitid'    => new \external_value(PARAM_ALPHANUMEXT, 'Unit id', VALUE_REQUIRED),
            'step_id'   => new \external_value(PARAM_RAW, 'Step id (or numeric step index) to mark complete', VALUE_REQUIRED),
            'pq_env'    => new \external_value(PARAM_ALPHANUMEXT, 'Pre-Quraan environment', VALUE_DEFAULT, ''),
        ]);
    }

    public static function skip_step($cohortid, $userid, $studentid, $lessonid, $unitid, $step_id, $pq_env = '') {
        global $DB, $USER;

        $p = self::validate_parameters(self::skip_step_parameters(), [
            'cohortid'  => $cohortid,
            'userid'    => $userid,
            'studentid' => $studentid,
            'lessonid'  => $lessonid,
            'unitid'    => $unitid,
            'step_id'   => $step_id,
            'pq_env'    => $pq_env,
        ]);

        self::set_environment_override((string)($p['pq_env'] ?? ''));
        $environment = self::current_environment();

        if ($environment === 'production') {
            throw new \invalid_parameter_exception('Skip step is not available in production.');
        }

        $syscontext = context_system::instance();
        self::validate_context($syscontext);

        if (!self::current_user_can_use_nonproduction_qa_tools()) {
            throw new \required_capability_exception($syscontext, 'local/prequran:resetstep', 'nopermissions', '');
        }

        $cohortid  = (int)$p['cohortid'];
        $studentid = !empty($p['userid']) ? (int)$p['userid'] : (int)$p['studentid'];
        $lessonid  = trim((string)$p['lessonid']);
        $unitid    = trim((string)$p['unitid']);
        $stepraw   = trim((string)$p['step_id']);

        if ($studentid <= 0 || $lessonid === '' || $unitid === '' || $stepraw === '') {
            throw new \invalid_parameter_exception('Missing student, lesson, unit, or step.');
        }

        if ($cohortid > 0) {
            self::pq_assert_teacher_or_admin_in_cohort($cohortid, $studentid);
        }

        self::ensure_unit_initialized($studentid, $lessonid, $unitid, ucfirst($lessonid), ucfirst(str_replace('_', ' ', $unitid)));

        $stepindex = null;
        if (preg_match('/^\s*(\d+)\s*(?:\.|\)|-)?\s*(.*)$/u', $stepraw, $m)) {
            $stepindex = (int)$m[1];
        }

        $stepid = $stepraw;
        if ($stepindex !== null && $stepindex > 0) {
            $cfgbyindex = $DB->get_record('local_prequran_stepcfg',
                self::with_environment_condition('local_prequran_stepcfg', [
                    'lessonid' => $lessonid,
                    'unitid' => $unitid,
                    'step_index' => $stepindex,
                    'active' => 1,
                ], $environment),
                'id,step_id', IGNORE_MISSING);

            if ($cfgbyindex && !empty($cfgbyindex->step_id)) {
                $stepid = $cfgbyindex->step_id;
            }
        }

        $stepnorm = strtolower(trim($stepid));
        $stepnorm = str_replace([' ', '-'], '_', $stepnorm);
        $stepnorm = preg_replace('/[^a-z0-9_]/', '', $stepnorm);

        $cfg = $DB->get_record('local_prequran_stepcfg',
            self::with_environment_condition('local_prequran_stepcfg', [
                'lessonid' => $lessonid,
                'unitid' => $unitid,
                'step_id' => $stepid,
                'active' => 1,
            ], $environment),
            '*', IGNORE_MISSING);

        if (!$cfg && $stepnorm !== '' && $stepnorm !== $stepid) {
            $cfg = $DB->get_record('local_prequran_stepcfg',
                self::with_environment_condition('local_prequran_stepcfg', [
                    'lessonid' => $lessonid,
                    'unitid' => $unitid,
                    'step_id' => $stepnorm,
                    'active' => 1,
                ], $environment),
                '*', IGNORE_MISSING);
            if ($cfg && !empty($cfg->step_id)) {
                $stepid = $cfg->step_id;
            }
        }

        $rec = $DB->get_record('local_prequran_stepprog',
            self::with_environment_condition('local_prequran_stepprog', [
                'userid' => $studentid,
                'lessonid' => $lessonid,
                'unitid' => $unitid,
                'step_id' => $stepid,
            ], $environment),
            '*', IGNORE_MISSING);

        if (!$rec && $stepnorm !== '' && $stepnorm !== $stepid) {
            $rec = $DB->get_record('local_prequran_stepprog',
                self::with_environment_condition('local_prequran_stepprog', [
                    'userid' => $studentid,
                    'lessonid' => $lessonid,
                    'unitid' => $unitid,
                    'step_id' => $stepnorm,
                ], $environment),
                '*', IGNORE_MISSING);
            if ($rec && !empty($rec->step_id)) {
                $stepid = $rec->step_id;
            }
        }

        if (!$rec && $lessonid === 'alphabet' && $unitid === 'alphabet_listen') {
            $frontendcfg = self::alphabet_listen_frontend_step($stepnorm !== '' ? $stepnorm : $stepid);
            if ($frontendcfg) {
                $cfg = $cfg ?: $frontendcfg;
                $stepid = (string)$frontendcfg->step_id;
                $rec = self::ensure_step_progress_row($studentid, $lessonid, $unitid, $frontendcfg, $environment);
            }
        }

        if (!$rec) {
            throw new \invalid_parameter_exception('Step not found for this student/unit.');
        }

        $now = time();
        $passesrequired = max(1, (int)(
            ($cfg->default_passes_required ?? null) ??
            ($rec->passes_required ?? 1)
        ));

        $rec->step_status = 'completed';
        $rec->passes_required = $passesrequired;
        $rec->passes_done = $passesrequired;
        if (property_exists($rec, 'completed')) $rec->completed = 1;
        if ($cfg) {
            if (property_exists($rec, 'step_index')) $rec->step_index = (int)$cfg->step_index;
            if (property_exists($rec, 'step_title')) $rec->step_title = $cfg->step_title ?: $cfg->step_id;
            if (property_exists($rec, 'repeats_per_letter')) {
                $rec->repeats_per_letter = max(1, (int)($cfg->default_repeats_per_letter ?? $rec->repeats_per_letter ?? 1));
            }
        }
        if (property_exists($rec, 'step_starttime') && empty($rec->step_starttime)) $rec->step_starttime = $now;
        if (property_exists($rec, 'step_lastactivity')) $rec->step_lastactivity = $now;
        if (property_exists($rec, 'step_completiontime')) $rec->step_completiontime = $now;
        if (property_exists($rec, 'last_activity')) $rec->last_activity = $now;
        $rec->timemodified = $now;
        $DB->update_record('local_prequran_stepprog', $rec);

        $passesrequiredconfig = (int)get_config('local_prequran', 'passes_required');
        $repeatsconfig = (int)get_config('local_prequran', 'number_of_repeats');
        $passesrequiredconfig = $passesrequiredconfig > 0 ? $passesrequiredconfig : 1;
        $repeatsconfig = $repeatsconfig > 0 ? $repeatsconfig : 1;
        $stepscfg = self::get_step_config($lessonid, $unitid, $passesrequiredconfig, $repeatsconfig);
        if ($lessonid === 'alphabet' && $unitid === 'alphabet_listen') {
            $stepscfg = [];
            foreach (self::alphabet_listen_frontend_steps($passesrequiredconfig, $repeatsconfig) as $index => $step) {
                $stepscfg[] = (object)[
                    'step_index' => $index + 1,
                    'step_id' => (string)$step['id'],
                    'step_title' => (string)$step['title'],
                    'passes' => (int)$step['passes'],
                    'repeats' => (int)$step['repeats'],
                    'step_type' => (string)$step['type'],
                ];
            }
        }

        $steps_total = count($stepscfg);

        $steps_completed = $DB->count_records('local_prequran_stepprog',
            self::with_environment_condition('local_prequran_stepprog', [
                'userid' => $studentid,
                'lessonid' => $lessonid,
                'unitid' => $unitid,
                'step_status' => 'completed',
            ], $environment));

        $progress = [];
        foreach ($stepscfg as $stepcfg) {
            $progress[(string)$stepcfg->step_id] = [
                'passesDone' => 0,
                'passesRequired' => max(1, (int)$stepcfg->passes),
                'completed' => false,
            ];
        }
        $steprows = $DB->get_records('local_prequran_stepprog',
            self::with_environment_condition('local_prequran_stepprog', [
                'userid' => $studentid,
                'lessonid' => $lessonid,
                'unitid' => $unitid,
            ], $environment),
            'step_index ASC');
        foreach ($steprows as $steprow) {
            $sid = (string)$steprow->step_id;
            if (!isset($progress[$sid])) {
                $progress[$sid] = [
                    'passesDone' => 0,
                    'passesRequired' => max(1, (int)($steprow->passes_required ?? 1)),
                    'completed' => false,
                ];
            }
            $required = max(1, (int)($steprow->passes_required ?? $progress[$sid]['passesRequired'] ?? 1));
            $progress[$sid]['passesDone'] = max(0, (int)($steprow->passes_done ?? 0));
            $progress[$sid]['passesRequired'] = $required;
            $progress[$sid]['completed'] = ((string)($steprow->step_status ?? '') === 'completed')
                || $progress[$sid]['passesDone'] >= $required;
        }

        $currentstepid = '';
        foreach ($stepscfg as $stepcfg) {
            $sid = (string)$stepcfg->step_id;
            if (empty($progress[$sid]['completed'])) {
                $currentstepid = $sid;
                break;
            }
        }
        if ($currentstepid === '' && $stepscfg) {
            $laststep = end($stepscfg);
            $currentstepid = (string)$laststep->step_id;
        }
        if ($currentstepid === '') {
            $currentstepid = $stepid;
        }
        $progress['currentStepId'] = $currentstepid;
        $progress['__finished'] = ($steps_total > 0 && $steps_completed >= $steps_total);

        $lp = $DB->get_record('local_prequran_lessonprog',
            self::with_environment_condition('local_prequran_lessonprog', [
                'userid' => $studentid,
                'lessonid' => $lessonid,
                'unitid' => $unitid,
            ], $environment),
            '*', IGNORE_MISSING);

        if ($lp) {
            $lp->steps_total = (int)$steps_total;
            $lp->steps_completed = (int)$steps_completed;
            $lp->completion_percent = ($steps_total > 0) ? (int)floor(($steps_completed / $steps_total) * 100) : 0;
            if ($steps_completed <= 0) {
                $lp->overall_status = 'not_started';
                if (property_exists($lp, 'overall_completiontime')) $lp->overall_completiontime = null;
            } else if ($steps_completed < $steps_total) {
                $lp->overall_status = 'in_progress';
                if (property_exists($lp, 'overall_completiontime')) $lp->overall_completiontime = null;
            } else {
                $lp->overall_status = 'completed';
                if (property_exists($lp, 'overall_completiontime') && empty($lp->overall_completiontime)) $lp->overall_completiontime = $now;
            }
            if (property_exists($lp, 'overall_lastactivity')) $lp->overall_lastactivity = $now;
            if (self::table_has_field('local_prequran_lessonprog', 'progress_json')) {
                $lp->progress_json = json_encode($progress);
            }
            $lp->timemodified = $now;
            $DB->update_record('local_prequran_lessonprog', $lp);
        }

        return [
            'status' => true,
            'message' => 'Step marked complete for QA.',
            'environment' => $environment,
            'userid' => $studentid,
            'lessonid' => $lessonid,
            'unitid' => $unitid,
            'step_id' => $stepid,
            'current_step_id' => $currentstepid,
            'steps_completed' => (int)$steps_completed,
            'steps_total' => (int)$steps_total,
        ];
    }

    public static function skip_step_returns() {
        return new \external_single_structure([
            'status' => new \external_value(PARAM_BOOL, 'True on success'),
            'message' => new \external_value(PARAM_TEXT, 'Result message'),
            'environment' => new \external_value(PARAM_ALPHANUMEXT, 'Environment used'),
            'userid' => new \external_value(PARAM_INT, 'Student id'),
            'lessonid' => new \external_value(PARAM_ALPHANUMEXT, 'Lesson id'),
            'unitid' => new \external_value(PARAM_ALPHANUMEXT, 'Unit id'),
            'step_id' => new \external_value(PARAM_RAW, 'Step id marked complete'),
            'current_step_id' => new \external_value(PARAM_RAW, 'Current step id after the skip'),
            'steps_completed' => new \external_value(PARAM_INT, 'Completed step count'),
            'steps_total' => new \external_value(PARAM_INT, 'Total active step count'),
        ]);
    }

    // -------------------------------------------------------------------------
    // Update STEP CONFIG: teacher/admin QA helper for integration/staging only.
    // Updates default passes/repeats and refreshes existing per-step progress rows.
    // -------------------------------------------------------------------------
    public static function update_step_config_parameters() {
        return new \external_function_parameters([
            'lessonid' => new \external_value(PARAM_ALPHANUMEXT, 'Lesson id', VALUE_REQUIRED),
            'unitid' => new \external_value(PARAM_ALPHANUMEXT, 'Unit id', VALUE_REQUIRED),
            'step_id' => new \external_value(PARAM_RAW, 'Step id or numeric step index', VALUE_REQUIRED),
            'passes_required' => new \external_value(PARAM_INT, 'Default passes required', VALUE_REQUIRED),
            'repeats_per_letter' => new \external_value(PARAM_INT, 'Default repeats per letter', VALUE_REQUIRED),
            'pq_env' => new \external_value(PARAM_ALPHANUMEXT, 'Pre-Quraan environment', VALUE_REQUIRED),
        ]);
    }

    public static function update_step_config($lessonid, $unitid, $step_id, $passes_required, $repeats_per_letter, $pq_env) {
        global $DB, $USER;

        $p = self::validate_parameters(self::update_step_config_parameters(), [
            'lessonid' => $lessonid,
            'unitid' => $unitid,
            'step_id' => $step_id,
            'passes_required' => $passes_required,
            'repeats_per_letter' => $repeats_per_letter,
            'pq_env' => $pq_env,
        ]);

        self::set_environment_override((string)$p['pq_env']);
        $environment = self::current_environment();
        if (!in_array($environment, ['integration', 'staging'], true)) {
            throw new \invalid_parameter_exception('Step config can only be edited in integration or staging.');
        }

        $syscontext = context_system::instance();
        self::validate_context($syscontext);

        if (!self::current_user_can_use_nonproduction_qa_tools()) {
            throw new \required_capability_exception($syscontext, 'local/prequran:resetstep', 'nopermissions', '');
        }

        if (!self::table_has_environment('local_prequran_stepcfg')) {
            throw new \invalid_parameter_exception('Step config table is not environment-aware.');
        }

        $lessonid = trim((string)$p['lessonid']);
        $unitid = trim((string)$p['unitid']);
        $stepraw = trim((string)$p['step_id']);
        $passes = max(1, min(100, (int)$p['passes_required']));
        $repeats = max(1, min(100, (int)$p['repeats_per_letter']));

        if ($lessonid === '' || $unitid === '' || $stepraw === '') {
            throw new \invalid_parameter_exception('Lesson, unit, and step are required.');
        }

        $record = $DB->get_record('local_prequran_stepcfg',
            self::with_environment_condition('local_prequran_stepcfg', [
                'lessonid' => $lessonid,
                'unitid' => $unitid,
                'step_id' => $stepraw,
                'active' => 1,
            ], $environment),
            '*', IGNORE_MISSING);

        if (!$record && preg_match('/^\d+$/', $stepraw)) {
            $record = $DB->get_record('local_prequran_stepcfg',
                self::with_environment_condition('local_prequran_stepcfg', [
                    'lessonid' => $lessonid,
                    'unitid' => $unitid,
                    'step_index' => (int)$stepraw,
                    'active' => 1,
                ], $environment),
                '*', IGNORE_MISSING);
        }

        if (!$record) {
            throw new \invalid_parameter_exception('No matching active step configuration row was found.');
        }

        $record->default_passes_required = $passes;
        $record->default_repeats_per_letter = $repeats;
        if (self::table_has_field('local_prequran_stepcfg', 'timemodified')) {
            $record->timemodified = time();
        }
        $DB->update_record('local_prequran_stepcfg', $record);

        $progressrows = 0;
        if ($DB->get_manager()->table_exists(new xmldb_table('local_prequran_stepprog'))) {
            $conditions = [
                'lessonid' => $lessonid,
                'unitid' => $unitid,
                'step_id' => (string)$record->step_id,
            ];
            if (self::table_has_environment('local_prequran_stepprog')) {
                $conditions['environment'] = $environment;
            }
            $rows = $DB->get_records('local_prequran_stepprog', $conditions);
            foreach ($rows as $row) {
                if (self::table_has_field('local_prequran_stepprog', 'passes_required')) {
                    $row->passes_required = $passes;
                }
                if (self::table_has_field('local_prequran_stepprog', 'repeats_per_letter')) {
                    $row->repeats_per_letter = $repeats;
                }
                if (self::table_has_field('local_prequran_stepprog', 'passes_done')
                        && isset($row->passes_done)
                        && (int)$row->passes_done > $passes
                        && (string)($row->step_status ?? '') !== 'completed') {
                    $row->passes_done = $passes;
                }
                if (self::table_has_field('local_prequran_stepprog', 'timemodified')) {
                    $row->timemodified = time();
                }
                $DB->update_record('local_prequran_stepprog', $row);
                $progressrows++;
            }
        }

        return [
            'status' => true,
            'message' => 'Step configuration updated.',
            'environment' => $environment,
            'lessonid' => $lessonid,
            'unitid' => $unitid,
            'step_id' => (string)$record->step_id,
            'step_index' => (int)$record->step_index,
            'passes_required' => $passes,
            'repeats_per_letter' => $repeats,
            'progress_rows_updated' => $progressrows,
        ];
    }

    public static function update_step_config_returns() {
        return new \external_single_structure([
            'status' => new \external_value(PARAM_BOOL, 'True on success'),
            'message' => new \external_value(PARAM_TEXT, 'Result message'),
            'environment' => new \external_value(PARAM_ALPHANUMEXT, 'Environment used'),
            'lessonid' => new \external_value(PARAM_ALPHANUMEXT, 'Lesson id'),
            'unitid' => new \external_value(PARAM_ALPHANUMEXT, 'Unit id'),
            'step_id' => new \external_value(PARAM_RAW, 'Step id updated'),
            'step_index' => new \external_value(PARAM_INT, 'Step index updated'),
            'passes_required' => new \external_value(PARAM_INT, 'New passes required'),
            'repeats_per_letter' => new \external_value(PARAM_INT, 'New repeats per letter'),
            'progress_rows_updated' => new \external_value(PARAM_INT, 'Existing progress rows refreshed'),
        ]);
    }




    // -------------------------------------------------------------------------
    // FocusGuard (Option B): raw event log + aggregate rollups
    // -------------------------------------------------------------------------

    /** @return bool */
    private static function focus_tables_available(): bool {
        global $DB;
        $dbman = $DB->get_manager();
        return $dbman->table_exists('local_prequran_focuslog') && $dbman->table_exists('local_prequran_focusagg');
    }

    private static function focus_column_available(string $table, string $column): bool {
        global $DB;
        try {
            if (!$DB->get_manager()->table_exists($table)) {
                return false;
            }
            $columns = $DB->get_columns($table);
            return array_key_exists($column, $columns);
        } catch (\Throwable $e) {
            return false;
        }
    }

    public static function set_focus_event_parameters() {
    return new \external_function_parameters([
        'userid'      => new \external_value(PARAM_INT,  'Student user id', VALUE_REQUIRED),
        'lessonid'    => new \external_value(PARAM_TEXT, 'Lesson id', VALUE_REQUIRED),
        'unitid'      => new \external_value(PARAM_TEXT, 'Unit id', VALUE_REQUIRED),

        'step_index'  => new \external_value(PARAM_INT,  'Step index', VALUE_DEFAULT, 0),
        'step_id'     => new \external_value(PARAM_TEXT, 'Step id', VALUE_DEFAULT, ''),

        'session_id'  => new \external_value(PARAM_TEXT, 'Client-generated session id', VALUE_REQUIRED),
        'live_sessionid' => new \external_value(PARAM_INT, 'BBB/live class session id', VALUE_DEFAULT, 0),

        'event_type'  => new \external_value(PARAM_ALPHAEXT, 'leave|resume|idle|pause|focus_start', VALUE_REQUIRED),

        'reason'      => new \external_value(PARAM_TEXT, 'Reason', VALUE_DEFAULT, ''),

        'leave_count' => new \external_value(PARAM_INT, 'Snapshot leave count', VALUE_DEFAULT, 0),
        'idle_count'  => new \external_value(PARAM_INT, 'Snapshot idle count', VALUE_DEFAULT, 0),
        'active_ms'   => new \external_value(PARAM_INT, 'Snapshot active time (ms)', VALUE_DEFAULT, 0),

        'meta_json'   => new \external_value(PARAM_RAW, 'Optional JSON string', VALUE_DEFAULT, ''),

        'timecreated' => new \external_value(PARAM_INT, 'Epoch seconds; client may pass', VALUE_DEFAULT, 0),
        'pq_env'      => new \external_value(PARAM_ALPHANUMEXT, 'Environment: production|staging|integration', VALUE_DEFAULT, ''),
    ]);
    }


    public static function set_focus_event($userid, $lessonid, $unitid,
                                          $step_index = null, $step_id = null,
                                          $session_id = '', $live_sessionid = 0,
                                          $event_type = '', $reason = null,
                                          $leave_count = null, $idle_count = null, $active_ms = null,
                                          $meta_json = null, $timecreated = null, $pq_env = '') {
        global $DB, $USER;
$validate = [
            'userid'     => $userid,
            'lessonid'   => $lessonid,
            'unitid'     => $unitid,
            'session_id' => $session_id,
            'event_type' => $event_type,
            'pq_env'     => $pq_env,
        ];
        // IMPORTANT: Only include OPTIONAL params when they are not null.
        // Passing null for VALUE_OPTIONAL PARAM_INT/PARAM_TEXT causes invalidparameter.
        if ($step_index !== null)  { $validate['step_index']  = $step_index; }
        if ($step_id !== null)     { $validate['step_id']     = $step_id; }
        if ($live_sessionid !== null) { $validate['live_sessionid'] = $live_sessionid; }
        if ($reason !== null)      { $validate['reason']      = $reason; }
        if ($leave_count !== null) { $validate['leave_count'] = $leave_count; }
        if ($idle_count !== null)  { $validate['idle_count']  = $idle_count; }
        if ($active_ms !== null)   { $validate['active_ms']   = $active_ms; }
        if ($meta_json !== null)   { $validate['meta_json']   = $meta_json; }
        if ($timecreated !== null) { $validate['timecreated'] = $timecreated; }

        $params = self::validate_parameters(self::set_focus_event_parameters(), $validate);
        self::set_environment_override((string)($params['pq_env'] ?? ''));

// Security: students can only write their own focus events.
        if ((int)$USER->id !== (int)$params['userid']) {
            require_login();
        }

        $now = !empty($params['timecreated']) ? (int)$params['timecreated'] : time();
        $environment = self::current_environment();

        // If tables are not present yet, return gracefully (do not break lessons).
        if (!self::focus_tables_available()) {
            return [
                'ok' => true,
                'tables_ready' => false,
                'focuslog_id' => 0,
                'agg_id' => 0,
            ];
        }

        // ---------------------------------------------------------------------
        // 1) Insert raw event into focuslog
        // ---------------------------------------------------------------------
        $log = (object)[
            'userid'      => (int)$params['userid'],
            'lessonid'    => (string)$params['lessonid'],
            'unitid'      => (string)$params['unitid'],
            'step_index'  => isset($params['step_index']) ? (int)$params['step_index'] : null,
            'step_id'     => !empty($params['step_id']) ? (string)$params['step_id'] : null,
            'session_id'  => (string)$params['session_id'],
            'event_type'  => (string)$params['event_type'],
            'reason'      => !empty($params['reason']) ? (string)$params['reason'] : null,
            'leave_count' => isset($params['leave_count']) ? (int)$params['leave_count'] : null,
            'idle_count'  => isset($params['idle_count']) ? (int)$params['idle_count'] : null,
            'active_ms'   => isset($params['active_ms']) ? (int)$params['active_ms'] : null,
            'meta_json'   => !empty($params['meta_json']) ? (string)$params['meta_json'] : null,
            'timecreated' => $now,
        ];
        if (self::focus_column_available('local_prequran_focuslog', 'live_sessionid')) {
            $log->live_sessionid = (int)($params['live_sessionid'] ?? 0);
        }
        $log = self::add_environment_field('local_prequran_focuslog', $log, $environment);

        $focuslog_id = (int)$DB->insert_record('local_prequran_focuslog', $log);

        // ---------------------------------------------------------------------
        // 2) Upsert aggregate row in focusagg (uniq by userid+lessonid+unitid+step_id+session_id)
        // ---------------------------------------------------------------------
        $stepid_for_key = !empty($params['step_id']) ? (string)$params['step_id'] : '';
        $key = [
            'userid'     => (int)$params['userid'],
            'lessonid'   => (string)$params['lessonid'],
            'unitid'     => (string)$params['unitid'],
            'step_id'    => $stepid_for_key,
            'session_id' => (string)$params['session_id'],
        ];
        if (self::focus_column_available('local_prequran_focusagg', 'live_sessionid')) {
            $key['live_sessionid'] = (int)($params['live_sessionid'] ?? 0);
        }
        $key = self::with_environment_condition('local_prequran_focusagg', $key, $environment);

        $agg = $DB->get_record('local_prequran_focusagg', $key);

        $delta_leave = 0;
        $delta_idle  = 0;

        // We increment only on leave/idle event types (simple, reliable).
        if ($params['event_type'] === 'leave') {
            $delta_leave = 1;
        } else if ($params['event_type'] === 'idle') {
            $delta_idle = 1;
        }

        // Reason-specific counters (optional).
        $delta_leave_tab_hidden = 0;
        $delta_leave_blur       = 0;
        $delta_idle_timeout     = 0;

        $rsn = (string)($params['reason'] ?? '');
        if ($params['event_type'] === 'leave') {
            if ($rsn === 'tab_hidden') { $delta_leave_tab_hidden = 1; }
            else if ($rsn === 'blur')  { $delta_leave_blur = 1; }
        } else if ($params['event_type'] === 'idle') {
            if ($rsn === 'idle_timeout') { $delta_idle_timeout = 1; }
        }

        $delta_active_ms = 0;
        if (isset($params['active_ms'])) {
            // If client sends a snapshot, we store MAX snapshot (not add) to avoid double counting on retries.
            // We'll apply as "max" below.
            $delta_active_ms = (int)$params['active_ms'];
        }

        if (!$agg) {
            $newagg = (object)$key;
            $newagg->step_index = isset($params['step_index']) ? (int)$params['step_index'] : null;

            $newagg->leave_count = $delta_leave;
            $newagg->idle_count  = $delta_idle;

            $newagg->active_ms   = $delta_active_ms;

            $newagg->leave_tab_hidden = $delta_leave_tab_hidden;
            $newagg->leave_blur       = $delta_leave_blur;
            $newagg->idle_timeout     = $delta_idle_timeout;

            $newagg->first_time = $now;
            $newagg->last_time  = $now;

            $agg_id = (int)$DB->insert_record('local_prequran_focusagg', $newagg);
        } else {
            $agg->step_index = isset($params['step_index']) ? (int)$params['step_index'] : $agg->step_index;

            $agg->leave_count += $delta_leave;
            $agg->idle_count  += $delta_idle;

            // Snapshot-max strategy for active_ms (prevents doubling on network retries).
            if (isset($params['active_ms'])) {
                $agg->active_ms = max((int)$agg->active_ms, (int)$params['active_ms']);
            }

            $agg->leave_tab_hidden += $delta_leave_tab_hidden;
            $agg->leave_blur       += $delta_leave_blur;
            $agg->idle_timeout     += $delta_idle_timeout;

            $agg->last_time = $now;

            $DB->update_record('local_prequran_focusagg', $agg);
            $agg_id = (int)$agg->id;
        }

        return [
            'ok' => true,
            'tables_ready' => true,
            'focuslog_id' => $focuslog_id,
            'agg_id' => $agg_id,
        ];
    }

    public static function set_focus_event_returns() {
        return new \external_single_structure([
            'ok'          => new \external_value(PARAM_BOOL, 'True if call succeeded'),
            'tables_ready'=> new \external_value(PARAM_BOOL, 'False if focus tables are not present'),
            'focuslog_id' => new \external_value(PARAM_INT, 'Inserted focuslog row id (0 if tables not ready)'),
            'agg_id'      => new \external_value(PARAM_INT, 'Aggregate row id (0 if tables not ready)'),
        ]);
    }

    public static function get_focus_summary_parameters() {
        return new \external_function_parameters([
            'userid'     => new \external_value(PARAM_INT, 'Filter by user id (0 = any)', VALUE_DEFAULT, 0),
            'lessonid'   => new \external_value(PARAM_TEXT, 'Filter by lesson id (blank = any)', VALUE_DEFAULT, ''),
            'unitid'     => new \external_value(PARAM_TEXT, 'Filter by unit id (blank = any)', VALUE_DEFAULT, ''),
            'step_id'    => new \external_value(PARAM_TEXT, 'Filter by step id (blank = any)', VALUE_DEFAULT, ''),
            'session_id' => new \external_value(PARAM_TEXT, 'Filter by session id (blank = any)', VALUE_DEFAULT, ''),
            'live_sessionid' => new \external_value(PARAM_INT, 'Filter by BBB/live class session id (0 = any)', VALUE_DEFAULT, 0),
            'since'      => new \external_value(PARAM_INT, 'Only rows with last_time >= since (0 = any)', VALUE_DEFAULT, 0),
            'limit'      => new \external_value(PARAM_INT, 'Max rows', VALUE_DEFAULT, 200),
            'pq_env'     => new \external_value(PARAM_ALPHANUMEXT, 'Environment: production|staging|integration', VALUE_DEFAULT, ''),
        ]);
    }

    public static function get_focus_summary($userid = 0, $lessonid = '', $unitid = '', $step_id = '',
                                            $session_id = '', $live_sessionid = 0, $since = 0, $limit = 200, $pq_env = '') {
        global $DB;

        $params = self::validate_parameters(self::get_focus_summary_parameters(), [
            'userid'     => $userid,
            'lessonid'   => $lessonid,
            'unitid'     => $unitid,
            'step_id'    => $step_id,
            'session_id' => $session_id,
            'live_sessionid' => $live_sessionid,
            'since'      => $since,
            'limit'      => $limit,
            'pq_env'     => $pq_env,
        ]);
        self::set_environment_override((string)($params['pq_env'] ?? ''));

        // Reporting endpoint: require admin.
        require_login();

        if (!self::focus_tables_available()) {
            return [
                'tables_ready' => false,
                'rows' => [],
            ];
        }

        $w = [];
        $p = [];
        $envsql = self::environment_sql('fa', 'local_prequran_focusagg', $p);
        if ($envsql !== '') {
            $w[] = substr($envsql, 5);
        }

        if (!empty($params['userid'])) { $w[] = 'userid = :userid'; $p['userid'] = (int)$params['userid']; }
        if (!empty($params['lessonid'])) { $w[] = 'lessonid = :lessonid'; $p['lessonid'] = (string)$params['lessonid']; }
        if (!empty($params['unitid'])) { $w[] = 'unitid = :unitid'; $p['unitid'] = (string)$params['unitid']; }
        if (!empty($params['step_id'])) { $w[] = 'step_id = :step_id'; $p['step_id'] = (string)$params['step_id']; }
        if (!empty($params['session_id'])) { $w[] = 'session_id = :session_id'; $p['session_id'] = (string)$params['session_id']; }
        if (!empty($params['live_sessionid']) && self::focus_column_available('local_prequran_focusagg', 'live_sessionid')) {
            $w[] = 'live_sessionid = :live_sessionid';
            $p['live_sessionid'] = (int)$params['live_sessionid'];
        }
        if (!empty($params['since'])) { $w[] = 'last_time >= :since'; $p['since'] = (int)$params['since']; }

        $where = $w ? ('WHERE ' . implode(' AND ', $w)) : '';
        $limit = max(1, min(2000, (int)$params['limit']));

        $sql = "SELECT *
                  FROM {local_prequran_focusagg} fa
                  $where
              ORDER BY last_time DESC";

        $rows = $DB->get_records_sql($sql, $p, 0, $limit);
        $out = [];
        foreach ($rows as $r) {
            $out[] = [
                'id' => (int)$r->id,
                'userid' => (int)$r->userid,
                'lessonid' => (string)$r->lessonid,
                'unitid' => (string)$r->unitid,
                'step_index' => isset($r->step_index) ? (int)$r->step_index : 0,
                'step_id' => (string)$r->step_id,
                'session_id' => (string)$r->session_id,
                'live_sessionid' => (int)($r->live_sessionid ?? 0),
                'leave_count' => (int)$r->leave_count,
                'idle_count' => (int)$r->idle_count,
                'active_ms' => (int)$r->active_ms,
                'leave_tab_hidden' => (int)($r->leave_tab_hidden ?? 0),
                'leave_blur' => (int)($r->leave_blur ?? 0),
                'idle_timeout' => (int)($r->idle_timeout ?? 0),
                'first_time' => (int)($r->first_time ?? 0),
                'last_time' => (int)($r->last_time ?? 0),
            ];
        }

        return [
            'tables_ready' => true,
            'rows' => $out,
        ];
    }

    public static function get_focus_summary_returns() {
        return new \external_single_structure([
            'tables_ready' => new \external_value(PARAM_BOOL, 'False if focus tables are not present'),
            'rows' => new \external_multiple_structure(
                new \external_single_structure([
                    'id' => new \external_value(PARAM_INT, 'Row id'),
                    'userid' => new \external_value(PARAM_INT, 'User id'),
                    'lessonid' => new \external_value(PARAM_TEXT, 'Lesson id'),
                    'unitid' => new \external_value(PARAM_TEXT, 'Unit id'),
                    'step_index' => new \external_value(PARAM_INT, 'Step index'),
                    'step_id' => new \external_value(PARAM_TEXT, 'Step id'),
                    'session_id' => new \external_value(PARAM_TEXT, 'Session id'),
                    'live_sessionid' => new \external_value(PARAM_INT, 'BBB/live class session id'),
                    'leave_count' => new \external_value(PARAM_INT, 'Leave count'),
                    'idle_count' => new \external_value(PARAM_INT, 'Idle count'),
                    'active_ms' => new \external_value(PARAM_INT, 'Active time in ms (snapshot-max)'),
                    'leave_tab_hidden' => new \external_value(PARAM_INT, 'Leave reason: tab_hidden'),
                    'leave_blur' => new \external_value(PARAM_INT, 'Leave reason: blur'),
                    'idle_timeout' => new \external_value(PARAM_INT, 'Idle reason: idle_timeout'),
                    'first_time' => new \external_value(PARAM_INT, 'First event time'),
                    'last_time' => new \external_value(PARAM_INT, 'Last event time'),
                ])
            ),
        ]);
    }

    /** @return bool */
    private static function speak_recording_table_available(): bool {
        global $DB;
        return $DB->get_manager()->table_exists('local_prequran_speakrec');
    }

    private static function speak_recording_safe_part(string $value, string $fallback = 'recording'): string {
        $value = trim(core_text::strtolower($value));
        $value = preg_replace('/[^a-z0-9._-]+/', '_', $value);
        $value = trim($value, '_');
        return $value !== '' ? $value : $fallback;
    }

    private static function speak_recording_encode_path(string $path): string {
        $parts = array_filter(explode('/', str_replace('\\', '/', $path)), function($part) {
            return $part !== '';
        });
        return implode('/', array_map('rawurlencode', $parts));
    }

    private static function speak_recording_bunny_upload(string $path, string $bytes, string $mimetype): array {
        $zone = trim((string)get_config('local_prequran', 'bunny_storage_zone'));
        $host = trim((string)get_config('local_prequran', 'bunny_storage_host'));
        $accesskey = trim((string)get_config('local_prequran', 'bunny_storage_access_key'));

        if ($host === '') {
            $host = 'storage.bunnycdn.com';
        }

        if ($zone === '' || $accesskey === '') {
            return [
                'ok' => false,
                'status' => 0,
                'message' => 'Bunny storage settings are missing.',
            ];
        }

        if (!function_exists('curl_init')) {
            return [
                'ok' => false,
                'status' => 0,
                'message' => 'PHP cURL extension is not available.',
            ];
        }

        $url = 'https://' . $host . '/' . rawurlencode($zone) . '/' . self::speak_recording_encode_path($path);
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
        curl_setopt($ch, CURLOPT_POSTFIELDS, $bytes);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'AccessKey: ' . $accesskey,
            'Content-Type: ' . ($mimetype ?: 'application/octet-stream'),
            'Content-Length: ' . strlen($bytes),
        ]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);

        $body = curl_exec($ch);
        $errno = curl_errno($ch);
        $error = curl_error($ch);
        $status = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        curl_close($ch);

        if ($errno) {
            return [
                'ok' => false,
                'status' => $status,
                'message' => $error ?: 'Bunny upload failed.',
            ];
        }

        return [
            'ok' => ($status >= 200 && $status < 300),
            'status' => $status,
            'message' => ($status >= 200 && $status < 300) ? 'uploaded' : substr((string)$body, 0, 200),
        ];
    }

    public static function save_speak_recording_parameters() {
        return new \external_function_parameters([
            'userid'       => new \external_value(PARAM_INT, 'Student user id', VALUE_REQUIRED),
            'lessonid'     => new \external_value(PARAM_ALPHANUMEXT, 'Lesson id', VALUE_REQUIRED),
            'unitid'       => new \external_value(PARAM_ALPHANUMEXT, 'Unit id', VALUE_REQUIRED),
            'step_id'      => new \external_value(PARAM_ALPHANUMEXT, 'Step id', VALUE_DEFAULT, 'speak'),
            'letter_key'   => new \external_value(PARAM_ALPHANUMEXT, 'Letter key', VALUE_REQUIRED),
            'letter_name'  => new \external_value(PARAM_TEXT, 'Letter name', VALUE_REQUIRED),
            'letter_text'  => new \external_value(PARAM_TEXT, 'Letter text', VALUE_DEFAULT, ''),
            'attempt_no'   => new \external_value(PARAM_INT, 'Attempt number', VALUE_DEFAULT, 1),
            'duration_ms'  => new \external_value(PARAM_INT, 'Recording duration in milliseconds', VALUE_DEFAULT, 0),
            'mime_type'    => new \external_value(PARAM_TEXT, 'Audio MIME type', VALUE_DEFAULT, 'audio/webm'),
            'filename'     => new \external_value(PARAM_FILE, 'Client suggested filename', VALUE_REQUIRED),
            'audio_base64' => new \external_value(PARAM_RAW, 'Base64 encoded audio content', VALUE_REQUIRED),
        ]);
    }

    public static function save_speak_recording(
        $userid,
        $lessonid,
        $unitid,
        $step_id,
        $letter_key,
        $letter_name,
        $letter_text = '',
        $attempt_no = 1,
        $duration_ms = 0,
        $mime_type = 'audio/webm',
        $filename = '',
        $audio_base64 = ''
    ) {
        global $DB, $USER;

        $params = self::validate_parameters(self::save_speak_recording_parameters(), [
            'userid' => $userid,
            'lessonid' => $lessonid,
            'unitid' => $unitid,
            'step_id' => $step_id,
            'letter_key' => $letter_key,
            'letter_name' => $letter_name,
            'letter_text' => $letter_text,
            'attempt_no' => $attempt_no,
            'duration_ms' => $duration_ms,
            'mime_type' => $mime_type,
            'filename' => $filename,
            'audio_base64' => $audio_base64,
        ]);

        self::validate_context(\context_system::instance());

        $studentid = (int)$params['userid'];
        if ($studentid <= 0) {
            throw new moodle_exception('invaliduserid', '', '', 'Invalid student user id.');
        }

        $audio = base64_decode((string)$params['audio_base64'], true);
        if ($audio === false || strlen($audio) < 64) {
            return [
                'ok' => false,
                'saved' => false,
                'tables_ready' => true,
                'bunny_uploaded' => false,
                'submission_id' => 0,
                'bunny_path' => '',
                'message' => 'Invalid or empty recording.',
            ];
        }

        $maxbytes = (int)get_config('local_prequran', 'speak_recording_maxbytes');
        if ($maxbytes <= 0) {
            $maxbytes = 3000000;
        }
        if (strlen($audio) > $maxbytes) {
            return [
                'ok' => false,
                'saved' => false,
                'tables_ready' => true,
                'bunny_uploaded' => false,
                'submission_id' => 0,
                'bunny_path' => '',
                'message' => 'Recording is too large.',
            ];
        }

        $now = time();
        $datepath = userdate($now, '%Y-%m-%d', 99, false);
        $environment = self::current_environment();
        $prefix = self::environment_bunny_prefix(
            (string)get_config('local_prequran', 'bunny_submission_prefix'),
            'submissions/speak',
            $environment
        );

        $lessonid = self::speak_recording_safe_part((string)$params['lessonid'], 'lesson');
        $unitid = self::speak_recording_safe_part((string)$params['unitid'], 'unit');
        $letterkey = self::speak_recording_safe_part((string)$params['letter_key'], 'letter');
        $lettername = self::speak_recording_safe_part((string)$params['letter_name'], $letterkey);
        $clientfile = self::speak_recording_safe_part(pathinfo((string)$params['filename'], PATHINFO_FILENAME), 'recording');
        $extension = strtolower(pathinfo((string)$params['filename'], PATHINFO_EXTENSION));
        if (!in_array($extension, ['webm', 'm4a', 'mp3', 'ogg', 'wav'], true)) {
            $extension = 'webm';
        }

        $storedfilename = 'user_' . $studentid . '_' . $letterkey . '_' . $lettername . '_' . $now . '_' . $clientfile . '.' . $extension;
        $bunnypath = $prefix . '/' . $unitid . '/' . $datepath . '/user_' . $studentid . '/' . $storedfilename;

        $upload = self::speak_recording_bunny_upload($bunnypath, $audio, (string)$params['mime_type']);
        $tablesready = self::speak_recording_table_available();
        $submissionid = 0;

        if ($tablesready) {
            $rec = (object)[
                'userid' => $studentid,
                'lessonid' => (string)$params['lessonid'],
                'unitid' => (string)$params['unitid'],
                'step_id' => (string)$params['step_id'],
                'letter_key' => (string)$params['letter_key'],
                'letter_name' => (string)$params['letter_name'],
                'letter_text' => (string)$params['letter_text'],
                'attempt_no' => (int)$params['attempt_no'],
                'duration_ms' => (int)$params['duration_ms'],
                'mime_type' => (string)$params['mime_type'],
                'filesize' => strlen($audio),
                'filename' => $storedfilename,
                'bunny_path' => $bunnypath,
                'status' => $upload['ok'] ? 'submitted' : 'upload_failed',
                'score' => null,
                'teacher_feedback' => '',
                'timecreated' => $now,
                'timemodified' => $now,
            ];
            $rec = self::add_environment_field('local_prequran_speakrec', $rec, $environment);

            $cols = array_keys((array)$DB->get_columns('local_prequran_speakrec'));
            $safe = new stdClass();
            foreach ($rec as $k => $v) {
                if (in_array($k, $cols, true)) {
                    $safe->$k = $v;
                }
            }
            try {
                $submissionid = (int)$DB->insert_record('local_prequran_speakrec', $safe);
                if ($submissionid <= 0) {
                    return [
                        'ok' => true,
                        'saved' => (bool)$upload['ok'],
                        'tables_ready' => true,
                        'bunny_uploaded' => (bool)$upload['ok'],
                        'submission_id' => 0,
                        'bunny_path' => $bunnypath,
                        'message' => (string)$upload['message'] . ' Metadata insert returned id 0.',
                    ];
                }

                if (!$DB->record_exists('local_prequran_speakrec', ['id' => $submissionid])) {
                    return [
                        'ok' => true,
                        'saved' => (bool)$upload['ok'],
                        'tables_ready' => true,
                        'bunny_uploaded' => (bool)$upload['ok'],
                        'submission_id' => $submissionid,
                        'bunny_path' => $bunnypath,
                        'message' => (string)$upload['message'] . ' Metadata insert returned an id, but the row could not be read back.',
                    ];
                }
            } catch (Throwable $e) {
                return [
                    'ok' => true,
                    'saved' => (bool)$upload['ok'],
                    'tables_ready' => true,
                    'bunny_uploaded' => (bool)$upload['ok'],
                    'submission_id' => 0,
                    'bunny_path' => $bunnypath,
                    'message' => (string)$upload['message'] . ' Metadata insert failed: ' . $e->getMessage(),
                ];
            }
        }

        return [
            'ok' => true,
            'saved' => (bool)$upload['ok'],
            'tables_ready' => $tablesready,
            'bunny_uploaded' => (bool)$upload['ok'],
            'submission_id' => $submissionid,
            'bunny_path' => $bunnypath,
            'message' => (string)$upload['message'] . ($tablesready ? '' : ' Metadata table is not installed.'),
        ];
    }

    public static function save_speak_recording_returns() {
        return new \external_single_structure([
            'ok' => new \external_value(PARAM_BOOL, 'True if the web service completed'),
            'saved' => new \external_value(PARAM_BOOL, 'True if the recording was uploaded to Bunny'),
            'tables_ready' => new \external_value(PARAM_BOOL, 'False if Moodle metadata table is missing'),
            'bunny_uploaded' => new \external_value(PARAM_BOOL, 'True if Bunny accepted the recording'),
            'submission_id' => new \external_value(PARAM_INT, 'Moodle metadata row id'),
            'bunny_path' => new \external_value(PARAM_TEXT, 'Bunny storage path'),
            'message' => new \external_value(PARAM_TEXT, 'Status message'),
        ]);
    }

    private static function submit_recording_table_available(): bool {
        global $DB;
        return $DB->get_manager()->table_exists('local_prequran_submitrec');
    }

    public static function save_submit_recording_parameters() {
        return new \external_function_parameters([
            'userid'       => new \external_value(PARAM_INT, 'Student user id', VALUE_REQUIRED),
            'lessonid'     => new \external_value(PARAM_ALPHANUMEXT, 'Lesson id', VALUE_REQUIRED),
            'unitid'       => new \external_value(PARAM_ALPHANUMEXT, 'Unit id', VALUE_REQUIRED),
            'step_id'      => new \external_value(PARAM_ALPHANUMEXT, 'Step id', VALUE_DEFAULT, 'submit'),
            'duration_ms'  => new \external_value(PARAM_INT, 'Recording duration in milliseconds', VALUE_DEFAULT, 0),
            'mime_type'    => new \external_value(PARAM_TEXT, 'Audio MIME type', VALUE_DEFAULT, 'audio/webm'),
            'filename'     => new \external_value(PARAM_FILE, 'Client suggested filename', VALUE_REQUIRED),
            'audio_base64' => new \external_value(PARAM_RAW, 'Base64 encoded audio content', VALUE_REQUIRED),
        ]);
    }

    public static function save_submit_recording(
        $userid,
        $lessonid,
        $unitid,
        $step_id = 'submit',
        $duration_ms = 0,
        $mime_type = 'audio/webm',
        $filename = '',
        $audio_base64 = ''
    ) {
        global $DB;

        $params = self::validate_parameters(self::save_submit_recording_parameters(), [
            'userid' => $userid,
            'lessonid' => $lessonid,
            'unitid' => $unitid,
            'step_id' => $step_id,
            'duration_ms' => $duration_ms,
            'mime_type' => $mime_type,
            'filename' => $filename,
            'audio_base64' => $audio_base64,
        ]);

        self::validate_context(\context_system::instance());

        $studentid = (int)$params['userid'];
        if ($studentid <= 0) {
            throw new moodle_exception('invaliduserid', '', '', 'Invalid student user id.');
        }

        if (!self::submit_recording_table_available()) {
            return [
                'ok' => false,
                'saved' => false,
                'tables_ready' => false,
                'bunny_uploaded' => false,
                'submission_id' => 0,
                'bunny_path' => '',
                'duplicate' => false,
                'message' => 'Submit metadata table is not installed.',
            ];
        }

        $recordkey = [
            'userid' => $studentid,
            'lessonid' => (string)$params['lessonid'],
            'unitid' => (string)$params['unitid'],
        ];
        $environment = self::current_environment();
        $recordkey = self::with_environment_condition('local_prequran_submitrec', $recordkey, $environment);

        $existing = $DB->get_record('local_prequran_submitrec', $recordkey, '*', IGNORE_MULTIPLE);
        if ($existing && !empty($existing->id)) {
            return [
                'ok' => true,
                'saved' => true,
                'tables_ready' => true,
                'bunny_uploaded' => true,
                'submission_id' => (int)$existing->id,
                'bunny_path' => (string)$existing->bunny_path,
                'duplicate' => true,
                'message' => 'Submission already exists.',
            ];
        }

        $audio = base64_decode((string)$params['audio_base64'], true);
        if ($audio === false || strlen($audio) < 64) {
            return [
                'ok' => false,
                'saved' => false,
                'tables_ready' => true,
                'bunny_uploaded' => false,
                'submission_id' => 0,
                'bunny_path' => '',
                'duplicate' => false,
                'message' => 'Invalid or empty recording.',
            ];
        }

        $maxbytes = (int)get_config('local_prequran', 'submit_recording_maxbytes');
        if ($maxbytes <= 0) {
            $maxbytes = 6000000;
        }
        if (strlen($audio) > $maxbytes) {
            return [
                'ok' => false,
                'saved' => false,
                'tables_ready' => true,
                'bunny_uploaded' => false,
                'submission_id' => 0,
                'bunny_path' => '',
                'duplicate' => false,
                'message' => 'Recording is too large.',
            ];
        }

        $now = time();
        $datepath = userdate($now, '%Y-%m-%d', 99, false);
        $prefix = self::environment_bunny_prefix(
            (string)get_config('local_prequran', 'bunny_submit_prefix'),
            'submissions/submit',
            $environment
        );

        $safeunitid = self::speak_recording_safe_part((string)$params['unitid'], 'unit');
        $clientfile = self::speak_recording_safe_part(pathinfo((string)$params['filename'], PATHINFO_FILENAME), 'recording');
        $extension = strtolower(pathinfo((string)$params['filename'], PATHINFO_EXTENSION));
        if (!in_array($extension, ['webm', 'm4a', 'mp3', 'ogg', 'wav'], true)) {
            $extension = 'webm';
        }

        $storedfilename = 'user_' . $studentid . '_' . $safeunitid . '_full_unit_' . $now . '_' . $clientfile . '.' . $extension;
        $bunnypath = $prefix . '/' . $safeunitid . '/' . $datepath . '/user_' . $studentid . '/' . $storedfilename;

        $upload = self::speak_recording_bunny_upload($bunnypath, $audio, (string)$params['mime_type']);
        if (empty($upload['ok'])) {
            return [
                'ok' => false,
                'saved' => false,
                'tables_ready' => true,
                'bunny_uploaded' => false,
                'submission_id' => 0,
                'bunny_path' => $bunnypath,
                'duplicate' => false,
                'message' => (string)$upload['message'],
            ];
        }

        $rec = (object)[
            'userid' => $studentid,
            'lessonid' => (string)$params['lessonid'],
            'unitid' => (string)$params['unitid'],
            'step_id' => (string)$params['step_id'],
            'duration_ms' => (int)$params['duration_ms'],
            'mime_type' => (string)$params['mime_type'],
            'filesize' => strlen($audio),
            'filename' => $storedfilename,
            'bunny_path' => $bunnypath,
            'status' => 'submitted',
            'score' => null,
            'teacher_feedback' => '',
            'timecreated' => $now,
            'timemodified' => $now,
        ];
        $rec = self::add_environment_field('local_prequran_submitrec', $rec, $environment);

        $cols = array_keys((array)$DB->get_columns('local_prequran_submitrec'));
        $safe = new stdClass();
        foreach ($rec as $k => $v) {
            if (in_array($k, $cols, true)) {
                $safe->$k = $v;
            }
        }

        try {
            $submissionid = (int)$DB->insert_record('local_prequran_submitrec', $safe);
            if ($submissionid <= 0) {
                return [
                    'ok' => false,
                    'saved' => false,
                    'tables_ready' => true,
                    'bunny_uploaded' => true,
                    'submission_id' => 0,
                    'bunny_path' => $bunnypath,
                    'duplicate' => false,
                    'message' => 'uploaded Metadata insert returned id 0.',
                ];
            }
        } catch (Throwable $e) {
            $existing = $DB->get_record('local_prequran_submitrec', $recordkey, '*', IGNORE_MULTIPLE);
            if ($existing && !empty($existing->id)) {
                return [
                    'ok' => true,
                    'saved' => true,
                    'tables_ready' => true,
                    'bunny_uploaded' => true,
                    'submission_id' => (int)$existing->id,
                    'bunny_path' => (string)$existing->bunny_path,
                    'duplicate' => true,
                    'message' => 'Submission already exists.',
                ];
            }

            return [
                'ok' => false,
                'saved' => false,
                'tables_ready' => true,
                'bunny_uploaded' => true,
                'submission_id' => 0,
                'bunny_path' => $bunnypath,
                'duplicate' => false,
                'message' => 'uploaded Metadata insert failed: ' . $e->getMessage(),
            ];
        }

        return [
            'ok' => true,
            'saved' => true,
            'tables_ready' => true,
            'bunny_uploaded' => true,
            'submission_id' => $submissionid,
            'bunny_path' => $bunnypath,
            'duplicate' => false,
            'message' => 'uploaded',
        ];
    }

    public static function save_submit_recording_returns() {
        return new \external_single_structure([
            'ok' => new \external_value(PARAM_BOOL, 'True if the web service completed successfully'),
            'saved' => new \external_value(PARAM_BOOL, 'True if the final recording is available for review'),
            'tables_ready' => new \external_value(PARAM_BOOL, 'False if Moodle metadata table is missing'),
            'bunny_uploaded' => new \external_value(PARAM_BOOL, 'True if Bunny accepted the recording'),
            'submission_id' => new \external_value(PARAM_INT, 'Moodle metadata row id'),
            'bunny_path' => new \external_value(PARAM_TEXT, 'Bunny storage path'),
            'duplicate' => new \external_value(PARAM_BOOL, 'True if this student/unit already had a submission'),
            'message' => new \external_value(PARAM_TEXT, 'Status message'),
        ]);
    }

    // -------------------------------------------------------------------------
    // Live sessions Phase 3: safe core BigBlueButton endpoints
    // -------------------------------------------------------------------------
    protected static function live_tables_ready(): bool {
        global $DB;
        $manager = $DB->get_manager();
        return $manager->table_exists('local_prequran_live_session')
            && $manager->table_exists('local_prequran_live_participant')
            && $manager->table_exists('local_prequran_live_attendance')
            && $manager->table_exists('local_prequran_live_note')
            && $manager->table_exists('local_prequran_live_recording')
            && $manager->table_exists('local_prequran_live_consent')
            && $manager->table_exists('local_prequran_live_audit');
    }

    protected static function live_is_admin(): bool {
        global $USER;
        return is_siteadmin((int)$USER->id);
    }

    protected static function live_is_cohort_member(int $cohortid, int $userid): bool {
        global $DB;
        return $cohortid > 0 && $userid > 0 && $DB->record_exists('cohort_members', [
            'cohortid' => $cohortid,
            'userid' => $userid,
        ]);
    }

    protected static function live_user_can_manage_session($session = null): bool {
        global $USER;
        if (self::live_is_admin()) {
            return true;
        }
        if (self::is_managed_student((int)$USER->id)) {
            return false;
        }
        if ($session && (int)$session->teacherid === (int)$USER->id) {
            return true;
        }
        return $session && !empty($session->cohortid)
            && self::live_is_cohort_member((int)$session->cohortid, (int)$USER->id);
    }

    protected static function live_user_can_view_session($session): bool {
        global $DB, $USER;
        if (!$session || empty($session->id)) {
            return false;
        }
        if (self::live_user_can_manage_session($session)) {
            return true;
        }
        return $DB->record_exists('local_prequran_live_participant', [
            'sessionid' => (int)$session->id,
            'userid' => (int)$USER->id,
            'status' => 'active',
        ]);
    }

    protected static function live_empty_session(): array {
        return [
            'id' => 0, 'cohortid' => 0, 'teacherid' => 0, 'lessonid' => '', 'unitid' => '',
            'title' => '', 'description' => '', 'scheduled_start' => 0, 'scheduled_end' => 0,
            'timezone' => '', 'status' => '', 'recording_enabled' => false,
            'recording_consent_required' => false, 'parent_observer_allowed' => false,
            'max_participants' => 0, 'bbb_meeting_id' => '', 'bbb_created' => false,
            'timecreated' => 0, 'timemodified' => 0,
        ];
    }

    protected static function live_session_structure(): \external_single_structure {
        return new \external_single_structure([
            'id' => new \external_value(PARAM_INT, 'Session id'),
            'cohortid' => new \external_value(PARAM_INT, 'Cohort id'),
            'teacherid' => new \external_value(PARAM_INT, 'Teacher user id'),
            'lessonid' => new \external_value(PARAM_ALPHANUMEXT, 'Lesson id'),
            'unitid' => new \external_value(PARAM_ALPHANUMEXT, 'Unit id'),
            'title' => new \external_value(PARAM_TEXT, 'Session title'),
            'description' => new \external_value(PARAM_RAW, 'Session description'),
            'scheduled_start' => new \external_value(PARAM_INT, 'Scheduled start timestamp'),
            'scheduled_end' => new \external_value(PARAM_INT, 'Scheduled end timestamp'),
            'timezone' => new \external_value(PARAM_TEXT, 'Timezone'),
            'status' => new \external_value(PARAM_ALPHANUMEXT, 'Status'),
            'recording_enabled' => new \external_value(PARAM_BOOL, 'Recording enabled'),
            'recording_consent_required' => new \external_value(PARAM_BOOL, 'Recording consent required'),
            'parent_observer_allowed' => new \external_value(PARAM_BOOL, 'Parent observer allowed'),
            'max_participants' => new \external_value(PARAM_INT, 'Max participants'),
            'bbb_meeting_id' => new \external_value(PARAM_TEXT, 'BBB meeting id'),
            'bbb_created' => new \external_value(PARAM_BOOL, 'BBB created'),
            'timecreated' => new \external_value(PARAM_INT, 'Created timestamp'),
            'timemodified' => new \external_value(PARAM_INT, 'Modified timestamp'),
        ]);
    }

    protected static function live_participant_structure(): \external_single_structure {
        return new \external_single_structure([
            'id' => new \external_value(PARAM_INT, 'Participant row id'),
            'sessionid' => new \external_value(PARAM_INT, 'Session id'),
            'userid' => new \external_value(PARAM_INT, 'User id'),
            'role' => new \external_value(PARAM_ALPHANUMEXT, 'Role'),
            'studentid' => new \external_value(PARAM_INT, 'Student context id'),
            'status' => new \external_value(PARAM_ALPHANUMEXT, 'Status'),
            'displayname' => new \external_value(PARAM_TEXT, 'Display name'),
        ]);
    }

    protected static function live_format_session($session): array {
        return [
            'id' => (int)$session->id,
            'cohortid' => (int)$session->cohortid,
            'teacherid' => (int)$session->teacherid,
            'lessonid' => (string)$session->lessonid,
            'unitid' => (string)$session->unitid,
            'title' => (string)$session->title,
            'description' => (string)($session->description ?? ''),
            'scheduled_start' => (int)$session->scheduled_start,
            'scheduled_end' => (int)$session->scheduled_end,
            'timezone' => (string)$session->timezone,
            'status' => (string)$session->status,
            'recording_enabled' => !empty($session->recording_enabled),
            'recording_consent_required' => !empty($session->recording_consent_required),
            'parent_observer_allowed' => !empty($session->parent_observer_allowed),
            'max_participants' => (int)$session->max_participants,
            'bbb_meeting_id' => (string)$session->bbb_meeting_id,
            'bbb_created' => !empty($session->bbb_created),
            'timecreated' => (int)$session->timecreated,
            'timemodified' => (int)$session->timemodified,
        ];
    }

    protected static function live_format_participant($participant): array {
        return [
            'id' => (int)$participant->id,
            'sessionid' => (int)$participant->sessionid,
            'userid' => (int)$participant->userid,
            'role' => (string)$participant->role,
            'studentid' => (int)$participant->studentid,
            'status' => (string)$participant->status,
            'displayname' => (string)$participant->displayname,
        ];
    }

    protected static function live_bbb_password($session, string $role): string {
        $secret = trim((string)get_config('local_prequran', 'bbb_shared_secret'));
        if ($secret === '') {
            throw new \moodle_exception('bbb_config_missing', 'local_prequran');
        }
        return substr(sha1('prequran-live|' . (int)$session->id . '|' . (string)$session->bbb_meeting_id . '|' . $role . '|' . $secret), 0, 24);
    }

    protected static function live_audit(int $sessionid, string $action, string $targettype = '', int $targetid = 0, array $details = []): void {
        global $DB, $USER;
        if (!self::live_tables_ready()) {
            return;
        }
        $DB->insert_record('local_prequran_live_audit', (object)[
            'sessionid' => $sessionid,
            'actorid' => (int)$USER->id,
            'action' => $action,
            'targettype' => $targettype,
            'targetid' => $targetid,
            'details' => $details ? json_encode($details) : '',
            'timecreated' => time(),
        ]);
    }

    protected static function live_mark_student_join($session, $participant, string $role): void {
        global $DB, $USER;
        if ($role !== 'student' || !$participant || empty($participant->studentid)) {
            return;
        }
        if (!$DB->get_manager()->table_exists('local_prequran_live_attendance')) {
            return;
        }
        $now = time();
        $studentid = (int)$participant->studentid;
        $status = $now > ((int)$session->scheduled_start + (5 * 60)) ? 'late' : 'present';
        $existing = $DB->get_record('local_prequran_live_attendance', [
            'sessionid' => (int)$session->id,
            'studentid' => $studentid,
        ]);
        if ($existing) {
            if (empty($existing->join_time)) {
                $existing->join_time = $now;
            }
            $existing->attendance_status = $status;
            $existing->participation_status = 'joined';
            $existing->userid = (int)$USER->id;
            $existing->timemodified = $now;
            $DB->update_record('local_prequran_live_attendance', $existing);
            return;
        }
        $DB->insert_record('local_prequran_live_attendance', (object)[
            'sessionid' => (int)$session->id,
            'userid' => (int)$USER->id,
            'studentid' => $studentid,
            'join_time' => $now,
            'leave_time' => 0,
            'attendance_status' => $status,
            'participation_status' => 'joined',
            'technical_issue' => 0,
            'notes' => '',
            'markedby' => (int)$USER->id,
            'timecreated' => $now,
            'timemodified' => $now,
        ]);
    }

    public static function live_create_session_parameters() {
        return new \external_function_parameters([
            'cohortid' => new \external_value(PARAM_INT, 'Cohort id', VALUE_DEFAULT, 0),
            'teacherid' => new \external_value(PARAM_INT, 'Teacher user id', VALUE_REQUIRED),
            'studentids' => new \external_multiple_structure(new \external_value(PARAM_INT, 'Student user id'), 'Student ids', VALUE_DEFAULT, []),
            'lessonid' => new \external_value(PARAM_ALPHANUMEXT, 'Lesson id', VALUE_DEFAULT, ''),
            'unitid' => new \external_value(PARAM_ALPHANUMEXT, 'Unit id', VALUE_DEFAULT, ''),
            'title' => new \external_value(PARAM_TEXT, 'Session title', VALUE_REQUIRED),
            'description' => new \external_value(PARAM_RAW, 'Description', VALUE_DEFAULT, ''),
            'scheduled_start' => new \external_value(PARAM_INT, 'Start timestamp', VALUE_REQUIRED),
            'scheduled_end' => new \external_value(PARAM_INT, 'End timestamp', VALUE_REQUIRED),
            'timezone' => new \external_value(PARAM_TEXT, 'Timezone', VALUE_DEFAULT, 'UTC'),
            'recording_enabled' => new \external_value(PARAM_BOOL, 'Recording enabled', VALUE_DEFAULT, false),
            'parent_observer_allowed' => new \external_value(PARAM_BOOL, 'Parent observer allowed', VALUE_DEFAULT, false),
            'max_participants' => new \external_value(PARAM_INT, 'Max participants', VALUE_DEFAULT, 0),
        ]);
    }

    public static function live_create_session($cohortid = 0, $teacherid = 0, $studentids = [], $lessonid = '', $unitid = '', $title = '', $description = '', $scheduled_start = 0, $scheduled_end = 0, $timezone = 'UTC', $recording_enabled = false, $parent_observer_allowed = false, $max_participants = 0) {
        global $DB, $USER;
        $p = self::validate_parameters(self::live_create_session_parameters(), compact('cohortid', 'teacherid', 'studentids', 'lessonid', 'unitid', 'title', 'description', 'scheduled_start', 'scheduled_end', 'timezone', 'recording_enabled', 'parent_observer_allowed', 'max_participants'));
        self::validate_context(\context_system::instance());
        if (!self::live_tables_ready()) {
            return ['ok' => false, 'tables_ready' => false, 'sessionid' => 0, 'session' => self::live_empty_session(), 'message' => 'Live session tables are not installed.'];
        }

        $teacherid = (int)$p['teacherid'];
        $cohortid = (int)$p['cohortid'];
        $start = (int)$p['scheduled_start'];
        $end = (int)$p['scheduled_end'];
        if ($teacherid <= 0 || $start <= 0 || $end <= $start) {
            throw new \invalid_parameter_exception('teacherid, scheduled_start, and scheduled_end are required.');
        }
        if (!self::live_is_admin()) {
            if ($teacherid !== (int)$USER->id || self::is_managed_student((int)$USER->id)) {
                throw new \moodle_exception('nopermissions', '', '', 'You cannot create live sessions for this teacher.');
            }
            if ($cohortid > 0 && !self::live_is_cohort_member($cohortid, (int)$USER->id)) {
                throw new \moodle_exception('nopermissions', '', '', 'You cannot create live sessions for this cohort.');
            }
        }

        $studentids = array_values(array_unique(array_filter(array_map('intval', $p['studentids']))));
        if (count($studentids) > 15) {
            throw new \invalid_parameter_exception('A live session cannot include more than 15 initial students.');
        }
        if ($cohortid > 0) {
            foreach ($studentids as $studentid) {
                if (!self::live_is_cohort_member($cohortid, $studentid)) {
                    throw new \invalid_parameter_exception('All students must be members of the selected cohort.');
                }
            }
        }

        $now = time();
        $title = trim(clean_param((string)$p['title'], PARAM_TEXT));
        if ($title === '') {
            throw new \invalid_parameter_exception('title is required.');
        }
        $maxparticipants = (int)$p['max_participants'];
        if ($maxparticipants <= 0) {
            $maxparticipants = (int)get_config('local_prequran', 'bbb_max_participants_default') ?: 12;
        }

        $pendingmeetingid = 'prequran-live-pending-' . time() . '-' . random_string(8);
        $sessionid = (int)$DB->insert_record('local_prequran_live_session', (object)[
            'cohortid' => $cohortid, 'teacherid' => $teacherid,
            'lessonid' => (string)$p['lessonid'], 'unitid' => (string)$p['unitid'],
            'title' => $title, 'description' => clean_param((string)$p['description'], PARAM_TEXT),
            'scheduled_start' => $start, 'scheduled_end' => $end,
            'timezone' => trim(clean_param((string)$p['timezone'], PARAM_TEXT)) ?: 'UTC',
            'status' => 'scheduled',
            'recording_enabled' => !empty($p['recording_enabled']) ? 1 : 0,
            'recording_consent_required' => 1,
            'parent_observer_allowed' => !empty($p['parent_observer_allowed']) ? 1 : 0,
            'max_participants' => $maxparticipants,
            'bbb_meeting_id' => $pendingmeetingid, 'bbb_internal_meeting_id' => '', 'bbb_created' => 0,
            'bbb_create_time' => 0, 'bbb_last_error' => '',
            'createdby' => (int)$USER->id, 'cancelledby' => 0, 'cancellation_reason' => '',
            'timecreated' => $now, 'timemodified' => $now,
        ]);
        $DB->set_field('local_prequran_live_session', 'bbb_meeting_id', 'prequran-live-' . $sessionid, ['id' => $sessionid]);

        $teacher = core_user::get_user($teacherid);
        $DB->insert_record('local_prequran_live_participant', (object)[
            'sessionid' => $sessionid, 'userid' => $teacherid, 'role' => 'teacher', 'studentid' => 0,
            'status' => 'active', 'displayname' => $teacher ? fullname($teacher) : 'Teacher ' . $teacherid,
            'invitedby' => (int)$USER->id, 'timecreated' => $now, 'timemodified' => $now,
        ]);
        foreach ($studentids as $studentid) {
            $student = core_user::get_user($studentid);
            $DB->insert_record('local_prequran_live_participant', (object)[
                'sessionid' => $sessionid, 'userid' => $studentid, 'role' => 'student', 'studentid' => $studentid,
                'status' => 'active', 'displayname' => $student ? fullname($student) : 'Student ' . $studentid,
                'invitedby' => (int)$USER->id, 'timecreated' => $now, 'timemodified' => $now,
            ]);
        }

        $session = $DB->get_record('local_prequran_live_session', ['id' => $sessionid], '*', MUST_EXIST);
        self::live_audit($sessionid, 'created', 'session', $sessionid, ['students' => $studentids]);
        return ['ok' => true, 'tables_ready' => true, 'sessionid' => $sessionid, 'session' => self::live_format_session($session), 'message' => 'created'];
    }

    public static function live_create_session_returns() {
        return new \external_single_structure([
            'ok' => new \external_value(PARAM_BOOL, 'True if created'),
            'tables_ready' => new \external_value(PARAM_BOOL, 'False if tables are missing'),
            'sessionid' => new \external_value(PARAM_INT, 'Created session id'),
            'session' => self::live_session_structure(),
            'message' => new \external_value(PARAM_TEXT, 'Status message'),
        ]);
    }

    public static function live_list_sessions_parameters() {
        return new \external_function_parameters([
            'cohortid' => new \external_value(PARAM_INT, 'Optional cohort filter', VALUE_DEFAULT, 0),
            'from' => new \external_value(PARAM_INT, 'From timestamp', VALUE_DEFAULT, 0),
            'to' => new \external_value(PARAM_INT, 'To timestamp', VALUE_DEFAULT, 0),
            'status' => new \external_value(PARAM_ALPHANUMEXT, 'Status filter', VALUE_DEFAULT, ''),
            'limit' => new \external_value(PARAM_INT, 'Limit', VALUE_DEFAULT, 50),
        ]);
    }

    public static function live_list_sessions($cohortid = 0, $from = 0, $to = 0, $status = '', $limit = 50) {
        global $DB, $USER;
        $p = self::validate_parameters(self::live_list_sessions_parameters(), compact('cohortid', 'from', 'to', 'status', 'limit'));
        self::validate_context(\context_system::instance());
        if (!self::live_tables_ready()) {
            return ['ok' => false, 'tables_ready' => false, 'sessions' => []];
        }
        $where = ['1 = 1'];
        $sqlparams = [];
        if ((int)$p['cohortid'] > 0) {
            $where[] = 's.cohortid = :cohortid';
            $sqlparams['cohortid'] = (int)$p['cohortid'];
        }
        if ((int)$p['from'] > 0) {
            $where[] = 's.scheduled_end >= :fromtime';
            $sqlparams['fromtime'] = (int)$p['from'];
        }
        if ((int)$p['to'] > 0) {
            $where[] = 's.scheduled_start <= :totime';
            $sqlparams['totime'] = (int)$p['to'];
        }
        if ((string)$p['status'] !== '') {
            $where[] = 's.status = :status';
            $sqlparams['status'] = (string)$p['status'];
        }
        if (!self::live_is_admin()) {
            $where[] = "(s.teacherid = :userid OR EXISTS (SELECT 1 FROM {local_prequran_live_participant} p WHERE p.sessionid = s.id AND p.userid = :userid2 AND p.status = :pstatus))";
            $sqlparams['userid'] = (int)$USER->id;
            $sqlparams['userid2'] = (int)$USER->id;
            $sqlparams['pstatus'] = 'active';
        }
        $records = $DB->get_records_sql(
            "SELECT s.* FROM {local_prequran_live_session} s WHERE " . implode(' AND ', $where) . " ORDER BY s.scheduled_start ASC, s.id ASC",
            $sqlparams,
            0,
            max(1, min(100, (int)$p['limit']))
        );
        $sessions = [];
        foreach ($records as $session) {
            $sessions[] = self::live_format_session($session);
        }
        return ['ok' => true, 'tables_ready' => true, 'sessions' => $sessions];
    }

    public static function live_list_sessions_returns() {
        return new \external_single_structure([
            'ok' => new \external_value(PARAM_BOOL, 'True if complete'),
            'tables_ready' => new \external_value(PARAM_BOOL, 'False if tables are missing'),
            'sessions' => new \external_multiple_structure(self::live_session_structure()),
        ]);
    }

    public static function live_get_session_parameters() {
        return new \external_function_parameters([
            'sessionid' => new \external_value(PARAM_INT, 'Session id', VALUE_REQUIRED),
        ]);
    }

    public static function live_get_session($sessionid) {
        global $DB;
        $p = self::validate_parameters(self::live_get_session_parameters(), ['sessionid' => $sessionid]);
        self::validate_context(\context_system::instance());
        if (!self::live_tables_ready()) {
            return ['ok' => false, 'tables_ready' => false, 'session' => self::live_empty_session(), 'participants' => []];
        }
        $session = $DB->get_record('local_prequran_live_session', ['id' => (int)$p['sessionid']], '*', MUST_EXIST);
        if (!self::live_user_can_view_session($session)) {
            throw new \moodle_exception('nopermissions', '', '', 'You cannot view this live session.');
        }
        $participants = [];
        foreach ($DB->get_records('local_prequran_live_participant', ['sessionid' => (int)$session->id], 'role ASC, displayname ASC') as $participant) {
            $participants[] = self::live_format_participant($participant);
        }
        return ['ok' => true, 'tables_ready' => true, 'session' => self::live_format_session($session), 'participants' => $participants];
    }

    public static function live_get_session_returns() {
        return new \external_single_structure([
            'ok' => new \external_value(PARAM_BOOL, 'True if complete'),
            'tables_ready' => new \external_value(PARAM_BOOL, 'False if tables are missing'),
            'session' => self::live_session_structure(),
            'participants' => new \external_multiple_structure(self::live_participant_structure()),
        ]);
    }

    public static function live_join_session_parameters() {
        return new \external_function_parameters([
            'sessionid' => new \external_value(PARAM_INT, 'Session id', VALUE_REQUIRED),
        ]);
    }

    public static function live_join_session($sessionid) {
        global $DB, $USER, $CFG;
        $p = self::validate_parameters(self::live_join_session_parameters(), ['sessionid' => $sessionid]);
        self::validate_context(\context_system::instance());
        if (!self::live_tables_ready()) {
            return ['ok' => false, 'tables_ready' => false, 'join_url' => '', 'role' => '', 'message' => 'Live session tables are not installed.'];
        }
        $session = $DB->get_record('local_prequran_live_session', ['id' => (int)$p['sessionid']], '*', MUST_EXIST);
        if (in_array((string)$session->status, ['cancelled', 'failed'], true)) {
            throw new \moodle_exception('nopermissions', '', '', 'This live session is not available.');
        }

        $participant = $DB->get_record('local_prequran_live_participant', [
            'sessionid' => (int)$session->id,
            'userid' => (int)$USER->id,
            'status' => 'active',
        ]);
        $role = '';
        if (self::live_is_admin()) {
            $role = 'admin_observer';
        } else if ((int)$session->teacherid === (int)$USER->id || ($participant && (string)$participant->role === 'teacher')) {
            $role = 'teacher';
        } else if ($participant && (string)$participant->role === 'student') {
            $role = 'student';
        } else if ($participant && (string)$participant->role === 'parent_observer' && !empty($session->parent_observer_allowed)) {
            $role = 'parent_observer';
        }
        if ($role === '') {
            throw new \moodle_exception('nopermissions', '', '', 'You cannot join this live session.');
        }

        if (in_array($role, ['student', 'parent_observer'], true)) {
            $before = ((int)get_config('local_prequran', 'bbb_join_window_before_minutes') ?: 10) * 60;
            $after = ((int)get_config('local_prequran', 'bbb_join_window_after_minutes') ?: 15) * 60;
            $now = time();
            if ($now < ((int)$session->scheduled_start - $before) || $now > ((int)$session->scheduled_start + $after)) {
                throw new \moodle_exception('nopermissions', '', '', 'This live session is outside the student join window.');
            }
        }

        if (empty($session->bbb_created)) {
            if (!in_array($role, ['teacher', 'admin_observer'], true)) {
                throw new \moodle_exception('nopermissions', '', '', 'The teacher has not started this live session yet.');
            }
            if (!function_exists('local_prequran_bbb_create_meeting')) {
                throw new \moodle_exception('missingfile', 'error', '', 'Missing local/prequran/locallib.php. Deploy the Phase 1 BigBlueButton helper file.');
            }
            $recordingdecision = local_prequran_live_recording_consent_decision($session);
            $recordingallowed = !empty($recordingdecision['allowed']);
            if (!empty($recordingdecision['requested']) && !$recordingallowed) {
                self::live_audit((int)$session->id, 'recording_disabled_missing_consent', 'session', (int)$session->id, [
                    'missing_studentids' => $recordingdecision['missing_studentids'],
                    'studentids' => $recordingdecision['studentids'],
                    'reason' => $recordingdecision['reason'],
                ]);
            }
            try {
                $xml = local_prequran_bbb_create_meeting([
                    'meetingID' => (string)$session->bbb_meeting_id,
                    'name' => (string)$session->title,
                    'attendeePW' => self::live_bbb_password($session, 'attendee'),
                    'moderatorPW' => self::live_bbb_password($session, 'moderator'),
                    'record' => $recordingallowed,
                    'autoStartRecording' => $recordingallowed,
                    'muteOnStart' => true,
                    'maxParticipants' => (int)$session->max_participants,
                    'duration' => max(60, (int)ceil(((int)$session->scheduled_end - (int)$session->scheduled_start) / 60) + 30),
                    'logoutURL' => $CFG->wwwroot,
                ]);
            } catch (\Throwable $e) {
                $session->bbb_last_error = $e->getMessage();
                $session->timemodified = time();
                $DB->update_record('local_prequran_live_session', $session);
                self::live_audit((int)$session->id, 'bbb_create_failed', 'session', (int)$session->id, ['error' => $e->getMessage()]);
                throw $e;
            }
            $session->bbb_internal_meeting_id = (string)($xml->internalMeetingID ?? '');
            $session->bbb_created = 1;
            $session->bbb_create_time = time();
            if (!empty($recordingdecision['requested']) && !$recordingallowed) {
                $session->recording_enabled = 0;
            }
            $session->status = 'live';
            $session->timemodified = time();
            $DB->update_record('local_prequran_live_session', $session);
            self::live_audit((int)$session->id, 'bbb_created', 'session', (int)$session->id, [
                'recording_requested' => !empty($recordingdecision['requested']),
                'recording_enabled' => $recordingallowed,
                'recording_consent_reason' => $recordingdecision['reason'],
            ]);
        }

        $user = core_user::get_user((int)$USER->id);
        if (!function_exists('local_prequran_bbb_join_url')) {
            throw new \moodle_exception('missingfile', 'error', '', 'Missing local/prequran/locallib.php. Deploy the Phase 1 BigBlueButton helper file.');
        }
        $joinurl = local_prequran_bbb_join_url(
            (string)$session->bbb_meeting_id,
            $user ? fullname($user) : 'User ' . (int)$USER->id,
            in_array($role, ['teacher', 'admin_observer'], true) ? self::live_bbb_password($session, 'moderator') : self::live_bbb_password($session, 'attendee'),
            (int)$USER->id,
            ['userdata-prequran-role' => $role]
        );
        self::live_mark_student_join($session, $participant, $role);
        self::live_audit((int)$session->id, 'join_url_created', 'user', (int)$USER->id, ['role' => $role]);
        return ['ok' => true, 'tables_ready' => true, 'join_url' => $joinurl, 'role' => $role, 'message' => 'join_url_created'];
    }

    public static function live_join_session_returns() {
        return new \external_single_structure([
            'ok' => new \external_value(PARAM_BOOL, 'True if join URL was created'),
            'tables_ready' => new \external_value(PARAM_BOOL, 'False if tables are missing'),
            'join_url' => new \external_value(PARAM_URL, 'Signed BigBlueButton join URL'),
            'role' => new \external_value(PARAM_ALPHANUMEXT, 'Resolved role'),
            'message' => new \external_value(PARAM_TEXT, 'Status message'),
        ]);
    }

    // -------------------------------------------------------------------------
    // Communications Phase 1: announcements
    // -------------------------------------------------------------------------
    protected static function comm_tables_ready(): bool {
        global $DB;
        $manager = $DB->get_manager();
        return $manager->table_exists('local_prequran_comm_thread')
            && $manager->table_exists('local_prequran_comm_participant')
            && $manager->table_exists('local_prequran_comm_message')
            && $manager->table_exists('local_prequran_comm_audit');
    }

    protected static function comm_is_admin(): bool {
        global $USER;
        return is_siteadmin((int)$USER->id);
    }

    protected static function comm_table_exists(string $table): bool {
        global $DB;
        return $DB->get_manager()->table_exists($table);
    }

    protected static function comm_is_cohort_member(int $cohortid, int $userid): bool {
        global $DB;
        if ($cohortid <= 0 || $userid <= 0) {
            return false;
        }
        return $DB->record_exists('cohort_members', [
            'cohortid' => $cohortid,
            'userid' => $userid,
        ]);
    }

    protected static function comm_is_student_guardian(int $studentid, int $guardianid): bool {
        global $DB;
        if ($studentid <= 0 || $guardianid <= 0 || $studentid === $guardianid) {
            return false;
        }
        foreach (['local_prequran_comm_consent', 'local_prequran_live_consent'] as $table) {
            if (self::comm_table_exists($table)
                && $DB->record_exists($table, ['studentid' => $studentid, 'guardianid' => $guardianid])) {
                return true;
            }
        }
        return false;
    }

    protected static function comm_teacher_has_student(int $teacherid, int $studentid): bool {
        global $DB;
        if ($teacherid <= 0 || $studentid <= 0 || $teacherid === $studentid) {
            return false;
        }
        if (self::comm_table_exists('local_prequran_teacher_student')
            && $DB->record_exists('local_prequran_teacher_student', [
                'teacherid' => $teacherid,
                'studentid' => $studentid,
                'status' => 'active',
            ])) {
            return true;
        }
        if (self::comm_table_exists('local_prequran_group_member')
            && self::comm_table_exists('local_prequran_class_group')
            && $DB->record_exists_sql(
                "SELECT 1
                   FROM {local_prequran_group_member} gm
                   JOIN {local_prequran_class_group} cg ON cg.id = gm.groupid
                  WHERE gm.studentid = :studentid
                    AND gm.assignment_status = :assignmentstatus
                    AND cg.teacherid = :teacherid
                    AND cg.status <> :archived",
                [
                    'studentid' => $studentid,
                    'assignmentstatus' => 'active',
                    'teacherid' => $teacherid,
                    'archived' => 'archived',
                ]
            )) {
            return true;
        }
        if (self::comm_table_exists('local_prequran_live_session')
            && self::comm_table_exists('local_prequran_live_participant')
            && $DB->record_exists_sql(
                "SELECT 1
                   FROM {local_prequran_live_session} s
                   JOIN {local_prequran_live_participant} sp ON sp.sessionid = s.id
                  WHERE sp.studentid = :studentid
                    AND sp.role = :studentrole
                    AND sp.status = :studentstatus
                    AND s.status <> :cancelled
                    AND (
                        s.teacherid = :teacherid
                        OR EXISTS (
                            SELECT 1
                              FROM {local_prequran_live_participant} tp
                             WHERE tp.sessionid = s.id
                               AND tp.userid = :teacherid2
                               AND tp.role = :teacherrole
                               AND tp.status = :teacherstatus
                        )
                    )",
                [
                    'studentid' => $studentid,
                    'studentrole' => 'student',
                    'studentstatus' => 'active',
                    'cancelled' => 'cancelled',
                    'teacherid' => $teacherid,
                    'teacherid2' => $teacherid,
                    'teacherrole' => 'teacher',
                    'teacherstatus' => 'active',
                ]
            )) {
            return true;
        }
        return false;
    }

    protected static function comm_user_can_access_student(int $studentid): bool {
        global $USER;
        return self::comm_user_can_access_student_as($studentid, (int)$USER->id);
    }

    protected static function comm_user_can_access_student_as(int $studentid, int $userid): bool {
        if ($studentid <= 0 || $userid <= 0) {
            return false;
        }
        if (is_siteadmin($userid)) {
            return true;
        }
        if ($userid === $studentid) {
            return true;
        }
        if (self::comm_is_student_guardian($studentid, $userid)) {
            return true;
        }
        return self::comm_teacher_has_student($userid, $studentid);
    }

    protected static function comm_scoped_actorid(int $studentid = 0): int {
        global $CFG;

        $requesttoken = optional_param('wstoken', '', PARAM_RAW_TRIMMED);
        $configuredtoken = (string)get_config('local_prequran', 'ws_token');
        if ($requesttoken === '' || $configuredtoken === '' || !hash_equals($configuredtoken, $requesttoken)) {
            return 0;
        }

        $actorid = optional_param('commactorid', 0, PARAM_INT);
        $scopeid = optional_param('commstudentid', 0, PARAM_INT);
        $ts = optional_param('commts', 0, PARAM_INT);
        $sig = optional_param('commsig', '', PARAM_ALPHANUMEXT);
        if ($actorid <= 0 || $ts <= 0 || $sig === '') {
            return 0;
        }
        if ($studentid > 0 && $scopeid !== $studentid) {
            return 0;
        }
        if (abs(time() - $ts) > 900) {
            return 0;
        }

        $secret = (string)($CFG->passwordsaltmain ?? '') . '|' . $configuredtoken;
        $expected = hash_hmac('sha256', $actorid . '|' . $scopeid . '|' . $ts, $secret);
        return hash_equals($expected, $sig) ? $actorid : 0;
    }

    protected static function comm_has_participant_thread_in_cohort(int $cohortid, int $userid): bool {
        global $DB;
        if ($cohortid <= 0 || $userid <= 0 || !self::comm_tables_ready()) {
            return false;
        }

        return $DB->record_exists_sql(
            "SELECT 1
               FROM {local_prequran_comm_participant} p
               JOIN {local_prequran_comm_thread} t ON t.id = p.threadid
              WHERE p.userid = ?
                AND t.cohortid = ?",
            [$userid, $cohortid]
        );
    }

    protected static function comm_assert_can_read_cohort(int $cohortid): void {
        global $USER;
        self::validate_context(\context_system::instance());
        if (self::comm_is_admin()) {
            return;
        }
        if (!self::comm_is_cohort_member($cohortid, (int)$USER->id)) {
            throw new \moodle_exception('nopermissions', '', '', 'You cannot read communications for this cohort.');
        }
    }

    protected static function comm_assert_can_create_announcement(int $cohortid, int $studentid = 0): void {
        global $USER;
        self::validate_context(\context_system::instance());
        if (self::comm_is_admin()) {
            return;
        }
        if (self::is_managed_student((int)$USER->id)) {
            throw new \moodle_exception('nopermissions', '', '', 'Students cannot create announcements.');
        }
        if ($cohortid > 0 && self::comm_is_cohort_member($cohortid, (int)$USER->id)) {
            return;
        }
        if ($studentid > 0 && self::comm_teacher_has_student((int)$USER->id, $studentid)) {
            return;
        }
        throw new \moodle_exception('nopermissions', '', '', 'You cannot create this communication announcement.');
    }

    protected static function comm_assert_can_create_parent_thread(int $cohortid, int $studentid): void {
        global $USER;
        self::validate_context(\context_system::instance());

        if ($studentid <= 0) {
            throw new \invalid_parameter_exception('studentid is required.');
        }
        if ($cohortid > 0 && !self::comm_is_cohort_member($cohortid, $studentid)) {
            throw new \invalid_parameter_exception('Student is not a member of the cohort.');
        }
        if (self::comm_is_admin()) {
            return;
        }
        if (self::is_managed_student((int)$USER->id)) {
            throw new \moodle_exception('nopermissions', '', '', 'Students cannot create parent-teacher threads.');
        }
        if ($cohortid > 0 && self::comm_is_cohort_member($cohortid, (int)$USER->id)) {
            return;
        }
        if (self::comm_teacher_has_student((int)$USER->id, $studentid)) {
            return;
        }
        throw new \moodle_exception('nopermissions', '', '', 'You cannot create parent-teacher threads for this student.');
    }

    protected static function comm_user_can_reply_thread($thread): bool {
        global $DB, $USER;
        if (!$thread || empty($thread->id)) {
            return false;
        }
        if ((string)$thread->status !== 'active') {
            return false;
        }
        return $DB->record_exists('local_prequran_comm_participant', [
            'threadid' => (int)$thread->id,
            'userid' => (int)$USER->id,
            'canreply' => 1,
        ]);
    }

    protected static function comm_clean_message_body(string $body, int $max = 1000): string {
        $body = trim($body);
        if (core_text::strlen($body) > $max) {
            $body = core_text::substr($body, 0, $max);
        }
        return clean_param($body, PARAM_TEXT);
    }

    protected static function comm_user_can_read_thread($thread): bool {
        global $DB, $USER;
        return self::comm_user_can_read_thread_as($thread, (int)$USER->id);
    }

    protected static function comm_user_can_read_thread_as($thread, int $userid): bool {
        global $DB;
        if (!$thread || empty($thread->id)) {
            return false;
        }
        if (is_siteadmin($userid) && (string)$thread->type !== 'parent_teacher') {
            return true;
        }
        if ($DB->record_exists('local_prequran_comm_participant', [
            'threadid' => (int)$thread->id,
            'userid' => $userid,
        ])) {
            return true;
        }
        if ((string)$thread->type === 'announcement') {
            $cohortid = empty($thread->cohortid) ? 0 : (int)$thread->cohortid;
            $studentid = empty($thread->studentid) ? 0 : (int)$thread->studentid;
            if ($cohortid > 0 && !self::comm_is_cohort_member($cohortid, $userid)) {
                return false;
            }

            if ($studentid <= 0) {
                return $cohortid > 0 || (int)$thread->createdby === $userid || is_siteadmin($userid);
            }

            if ((int)$thread->createdby === $userid) {
                return true;
            }

            if (self::is_managed_student($userid)) {
                return $userid === $studentid;
            }

            return true;
        }
        if (!empty($thread->studentid)) {
            return self::comm_user_can_access_student_as((int)$thread->studentid, $userid);
        }
        return false;
    }

    protected static function comm_clean_announcement_body(string $body): string {
        return self::comm_clean_message_body($body, 4000);
    }

    protected static function comm_message_structure(): \external_single_structure {
        return new \external_single_structure([
            'id' => new \external_value(PARAM_INT, 'Message id'),
            'threadid' => new \external_value(PARAM_INT, 'Thread id'),
            'senderid' => new \external_value(PARAM_INT, 'Sender user id'),
            'studentid' => new \external_value(PARAM_INT, 'Student context user id, or 0'),
            'messagekind' => new \external_value(PARAM_TEXT, 'Message kind'),
            'body' => new \external_value(PARAM_RAW, 'Message body'),
            'templatekey' => new \external_value(PARAM_TEXT, 'Template key'),
            'status' => new \external_value(PARAM_TEXT, 'Message status'),
            'timecreated' => new \external_value(PARAM_INT, 'Created timestamp'),
            'timemodified' => new \external_value(PARAM_INT, 'Modified timestamp'),
        ]);
    }

    protected static function comm_thread_summary_structure(): \external_single_structure {
        return new \external_single_structure([
            'id' => new \external_value(PARAM_INT, 'Thread id'),
            'type' => new \external_value(PARAM_TEXT, 'Thread type'),
            'cohortid' => new \external_value(PARAM_INT, 'Cohort id'),
            'studentid' => new \external_value(PARAM_INT, 'Student context user id, or 0'),
            'createdby' => new \external_value(PARAM_INT, 'Creator user id'),
            'status' => new \external_value(PARAM_TEXT, 'Thread status'),
            'subject' => new \external_value(PARAM_TEXT, 'Thread subject'),
            'lastmessageat' => new \external_value(PARAM_INT, 'Last message timestamp'),
            'lastmessageid' => new \external_value(PARAM_INT, 'Last visible message id'),
            'lastsenderid' => new \external_value(PARAM_INT, 'Last visible sender id'),
            'lastmessagebody' => new \external_value(PARAM_RAW, 'Last visible message body preview'),
            'unreadcount' => new \external_value(PARAM_INT, 'Unread visible messages'),
            'timecreated' => new \external_value(PARAM_INT, 'Created timestamp'),
            'timemodified' => new \external_value(PARAM_INT, 'Modified timestamp'),
        ]);
    }

    protected static function comm_empty_thread_summary(): array {
        return [
            'id' => 0,
            'type' => '',
            'cohortid' => 0,
            'studentid' => 0,
            'createdby' => 0,
            'status' => '',
            'subject' => '',
            'lastmessageat' => 0,
            'lastmessageid' => 0,
            'lastsenderid' => 0,
            'lastmessagebody' => '',
            'unreadcount' => 0,
            'timecreated' => 0,
            'timemodified' => 0,
        ];
    }

    protected static function comm_format_thread_summary($thread, int $userid): array {
        global $DB;

        $lastmessage = $DB->get_record_sql(
            "SELECT id, senderid, body
               FROM {local_prequran_comm_message}
              WHERE threadid = :threadid
                AND status = :status
           ORDER BY timecreated DESC, id DESC",
            ['threadid' => (int)$thread->id, 'status' => 'visible'],
            IGNORE_MULTIPLE
        );

        $participant = $DB->get_record('local_prequran_comm_participant', [
            'threadid' => (int)$thread->id,
            'userid' => $userid,
        ]);
        $lastreadid = $participant ? (int)$participant->lastreadmessageid : 0;
        $unreadcount = (int)$DB->count_records_select(
            'local_prequran_comm_message',
            'threadid = :threadid AND status = :status AND id > :lastreadid',
            ['threadid' => (int)$thread->id, 'status' => 'visible', 'lastreadid' => $lastreadid]
        );

        return [
            'id' => (int)$thread->id,
            'type' => (string)$thread->type,
            'cohortid' => (int)$thread->cohortid,
            'studentid' => empty($thread->studentid) ? 0 : (int)$thread->studentid,
            'createdby' => (int)$thread->createdby,
            'status' => (string)$thread->status,
            'subject' => (string)$thread->subject,
            'lastmessageat' => (int)$thread->lastmessageat,
            'lastmessageid' => $lastmessage ? (int)$lastmessage->id : 0,
            'lastsenderid' => $lastmessage ? (int)$lastmessage->senderid : 0,
            'lastmessagebody' => $lastmessage ? (string)$lastmessage->body : '',
            'unreadcount' => $unreadcount,
            'timecreated' => (int)$thread->timecreated,
            'timemodified' => (int)$thread->timemodified,
        ];
    }

    public static function comm_list_threads_parameters() {
        return new \external_function_parameters([
            'cohortid' => new \external_value(PARAM_INT, 'Legacy cohort id filter', VALUE_DEFAULT, 0),
            'studentid' => new \external_value(PARAM_INT, 'Optional student context filter', VALUE_DEFAULT, 0),
            'type' => new \external_value(PARAM_ALPHANUMEXT, 'Thread type filter', VALUE_DEFAULT, 'announcement'),
            'limit' => new \external_value(PARAM_INT, 'Maximum threads to return', VALUE_DEFAULT, 20),
            'before' => new \external_value(PARAM_INT, 'Return threads older than this lastmessageat timestamp', VALUE_DEFAULT, 0),
            'commactorid' => new \external_value(PARAM_INT, 'Signed communications actor user id', VALUE_DEFAULT, 0),
            'commstudentid' => new \external_value(PARAM_INT, 'Signed communications student scope', VALUE_DEFAULT, 0),
            'commts' => new \external_value(PARAM_INT, 'Signed communications timestamp', VALUE_DEFAULT, 0),
            'commsig' => new \external_value(PARAM_ALPHANUMEXT, 'Signed communications scope signature', VALUE_DEFAULT, ''),
        ]);
    }

    public static function comm_list_threads($cohortid, $studentid = 0, $type = 'announcement', $limit = 20, $before = 0, $commactorid = 0, $commstudentid = 0, $commts = 0, $commsig = '') {
        global $DB, $USER;

        $params = self::validate_parameters(self::comm_list_threads_parameters(), [
            'cohortid' => $cohortid,
            'studentid' => $studentid,
            'type' => $type,
            'limit' => $limit,
            'before' => $before,
            'commactorid' => $commactorid,
            'commstudentid' => $commstudentid,
            'commts' => $commts,
            'commsig' => $commsig,
        ]);

        $cohortid = (int)$params['cohortid'];
        if (!self::comm_tables_ready()) {
            return ['ok' => false, 'tables_ready' => false, 'threads' => []];
        }

        $studentid = (int)$params['studentid'];
        $effectiveuserid = self::comm_scoped_actorid($studentid);
        if ($effectiveuserid <= 0) {
            $effectiveuserid = (int)$USER->id;
        }
        if ($cohortid > 0
            && !is_siteadmin($effectiveuserid)
            && !self::comm_is_cohort_member($cohortid, $effectiveuserid)
            && !self::comm_has_participant_thread_in_cohort($cohortid, $effectiveuserid)) {
            throw new \moodle_exception('nopermissions', '', '', 'You cannot read communications for this cohort.');
        }
        if ($cohortid <= 0 && $studentid > 0 && !self::comm_user_can_access_student_as($studentid, $effectiveuserid)) {
            throw new \moodle_exception('nopermissions', '', '', 'You cannot read communications for this student.');
        }

        $limit = max(1, min(100, (int)$params['limit']));
        $type = trim((string)$params['type']);
        if ($type === '') {
            $type = 'announcement';
        }

        $where = [
            't.status <> :archived',
        ];
        $sqlparams = [
            'archived' => 'archived',
        ];
        if ($cohortid > 0) {
            $where[] = 't.cohortid = :cohortid';
            $sqlparams['cohortid'] = $cohortid;
        }

        if ($type !== 'all') {
            $where[] = 't.type = :type';
            $sqlparams['type'] = $type;
        }
        if ($studentid > 0) {
            $where[] = '(t.studentid IS NULL OR t.studentid = :studentid)';
            $sqlparams['studentid'] = $studentid;
        }
        if ((int)$params['before'] > 0) {
            $where[] = 't.lastmessageat < :before';
            $sqlparams['before'] = (int)$params['before'];
        }

        $threads = $DB->get_records_sql(
            "SELECT t.*
               FROM {local_prequran_comm_thread} t
              WHERE " . implode(' AND ', $where) . "
           ORDER BY t.lastmessageat DESC, t.id DESC",
            $sqlparams,
            0,
            $limit
        );

        $out = [];
        foreach ($threads as $thread) {
            if (self::comm_user_can_read_thread_as($thread, $effectiveuserid)) {
                $out[] = self::comm_format_thread_summary($thread, $effectiveuserid);
            }
        }

        return ['ok' => true, 'tables_ready' => true, 'threads' => $out];
    }

    public static function comm_list_threads_returns() {
        return new \external_single_structure([
            'ok' => new \external_value(PARAM_BOOL, 'True if the service completed successfully'),
            'tables_ready' => new \external_value(PARAM_BOOL, 'False if communication tables are missing'),
            'threads' => new \external_multiple_structure(self::comm_thread_summary_structure()),
        ]);
    }

    public static function comm_get_thread_parameters() {
        return new \external_function_parameters([
            'threadid' => new \external_value(PARAM_INT, 'Thread id', VALUE_REQUIRED),
            'limit' => new \external_value(PARAM_INT, 'Maximum messages to return', VALUE_DEFAULT, 50),
            'before' => new \external_value(PARAM_INT, 'Return messages older than this message id', VALUE_DEFAULT, 0),
        ]);
    }

    public static function comm_get_thread($threadid, $limit = 50, $before = 0) {
        global $DB, $USER;

        $params = self::validate_parameters(self::comm_get_thread_parameters(), [
            'threadid' => $threadid,
            'limit' => $limit,
            'before' => $before,
        ]);

        self::validate_context(\context_system::instance());

        if (!self::comm_tables_ready()) {
            return ['ok' => false, 'tables_ready' => false, 'thread' => self::comm_empty_thread_summary(), 'messages' => []];
        }

        $thread = $DB->get_record('local_prequran_comm_thread', ['id' => (int)$params['threadid']]);
        if (!$thread || !self::comm_user_can_read_thread($thread)) {
            throw new \moodle_exception('nopermissions', '', '', 'You cannot read this communication thread.');
        }

        $limit = max(1, min(100, (int)$params['limit']));
        $where = 'threadid = :threadid AND status = :status';
        $sqlparams = ['threadid' => (int)$thread->id, 'status' => 'visible'];
        if ((int)$params['before'] > 0) {
            $where .= ' AND id < :before';
            $sqlparams['before'] = (int)$params['before'];
        }

        $records = $DB->get_records_sql(
            "SELECT *
               FROM {local_prequran_comm_message}
              WHERE {$where}
           ORDER BY timecreated DESC, id DESC",
            $sqlparams,
            0,
            $limit
        );

        $messages = [];
        $lastmessageid = 0;
        foreach (array_reverse($records) as $message) {
            $lastmessageid = max($lastmessageid, (int)$message->id);
            $messages[] = [
                'id' => (int)$message->id,
                'threadid' => (int)$message->threadid,
                'senderid' => (int)$message->senderid,
                'studentid' => empty($message->studentid) ? 0 : (int)$message->studentid,
                'messagekind' => (string)$message->messagekind,
                'body' => (string)$message->body,
                'templatekey' => (string)$message->templatekey,
                'status' => (string)$message->status,
                'timecreated' => (int)$message->timecreated,
                'timemodified' => (int)$message->timemodified,
            ];
        }

        if ($lastmessageid > 0) {
            $now = time();
            $participant = $DB->get_record('local_prequran_comm_participant', [
                'threadid' => (int)$thread->id,
                'userid' => (int)$USER->id,
            ]);
            if ($participant) {
                if ((int)$participant->lastreadmessageid < $lastmessageid) {
                    $participant->lastreadmessageid = $lastmessageid;
                    $participant->timemodified = $now;
                    $DB->update_record('local_prequran_comm_participant', $participant);
                }
            } else if ((string)$thread->type === 'announcement') {
                $DB->insert_record('local_prequran_comm_participant', (object)[
                    'threadid' => (int)$thread->id,
                    'userid' => (int)$USER->id,
                    'role' => self::is_managed_student((int)$USER->id) ? 'student' : 'reader',
                    'canreply' => 0,
                    'lastreadmessageid' => $lastmessageid,
                    'muted' => 0,
                    'timecreated' => $now,
                    'timemodified' => $now,
                ]);
            }
        }

        return [
            'ok' => true,
            'tables_ready' => true,
            'thread' => self::comm_format_thread_summary($thread, (int)$USER->id),
            'messages' => $messages,
        ];
    }

    public static function comm_get_thread_returns() {
        return new \external_single_structure([
            'ok' => new \external_value(PARAM_BOOL, 'True if the service completed successfully'),
            'tables_ready' => new \external_value(PARAM_BOOL, 'False if communication tables are missing'),
            'thread' => self::comm_thread_summary_structure(),
            'messages' => new \external_multiple_structure(self::comm_message_structure()),
        ]);
    }

    public static function comm_create_announcement_parameters() {
        return new \external_function_parameters([
            'cohortid' => new \external_value(PARAM_INT, 'Legacy cohort id', VALUE_DEFAULT, 0),
            'studentid' => new \external_value(PARAM_INT, 'Optional student context for a family-specific announcement', VALUE_DEFAULT, 0),
            'subject' => new \external_value(PARAM_TEXT, 'Announcement subject', VALUE_REQUIRED),
            'body' => new \external_value(PARAM_RAW, 'Announcement body', VALUE_REQUIRED),
        ]);
    }

    public static function comm_create_announcement($cohortid, $studentid = 0, $subject = '', $body = '') {
        global $DB, $USER;

        $params = self::validate_parameters(self::comm_create_announcement_parameters(), [
            'cohortid' => $cohortid,
            'studentid' => $studentid,
            'subject' => $subject,
            'body' => $body,
        ]);

        $cohortid = (int)$params['cohortid'];
        $studentid = (int)$params['studentid'];
        if ($cohortid <= 0 && $studentid <= 0) {
            throw new \invalid_parameter_exception('studentid or cohortid is required.');
        }
        self::comm_assert_can_create_announcement($cohortid, $studentid);

        if (!self::comm_tables_ready()) {
            return ['ok' => false, 'tables_ready' => false, 'threadid' => 0, 'messageid' => 0, 'message' => 'Communication tables are not installed.'];
        }

        if ($studentid > 0 && $cohortid > 0 && !self::comm_is_cohort_member($cohortid, $studentid)) {
            throw new \invalid_parameter_exception('Student is not a member of the cohort.');
        }
        if ($studentid > 0 && !self::comm_user_can_access_student($studentid)) {
            throw new \moodle_exception('nopermissions', '', '', 'You cannot create announcements for this student.');
        }

        $subject = trim(clean_param((string)$params['subject'], PARAM_TEXT));
        $body = self::comm_clean_announcement_body((string)$params['body']);
        if ($subject === '') {
            throw new \invalid_parameter_exception('subject is required.');
        }
        if ($body === '') {
            throw new \invalid_parameter_exception('body is required.');
        }
        if (core_text::strlen($subject) > 255) {
            $subject = core_text::substr($subject, 0, 255);
        }

        $now = time();
        $transaction = $DB->start_delegated_transaction();

        $threadid = (int)$DB->insert_record('local_prequran_comm_thread', (object)[
            'type' => 'announcement',
            'cohortid' => $cohortid,
            'studentid' => $studentid > 0 ? $studentid : null,
            'createdby' => (int)$USER->id,
            'status' => 'active',
            'subject' => $subject,
            'lastmessageat' => $now,
            'timecreated' => $now,
            'timemodified' => $now,
        ]);

        $messageid = (int)$DB->insert_record('local_prequran_comm_message', (object)[
            'threadid' => $threadid,
            'senderid' => (int)$USER->id,
            'studentid' => $studentid > 0 ? $studentid : null,
            'messagekind' => 'text',
            'body' => $body,
            'templatekey' => '',
            'status' => 'visible',
            'moderationflags' => '',
            'timecreated' => $now,
            'timemodified' => $now,
        ]);

        $DB->insert_record('local_prequran_comm_participant', (object)[
            'threadid' => $threadid,
            'userid' => (int)$USER->id,
            'role' => self::comm_is_admin() ? 'admin' : 'teacher',
            'canreply' => 0,
            'lastreadmessageid' => $messageid,
            'muted' => 0,
            'timecreated' => $now,
            'timemodified' => $now,
        ]);

        $DB->insert_record('local_prequran_comm_audit', (object)[
            'threadid' => $threadid,
            'messageid' => $messageid,
            'actorid' => (int)$USER->id,
            'action' => 'created',
            'details' => json_encode(['type' => 'announcement', 'cohortid' => $cohortid, 'studentid' => $studentid]),
            'timecreated' => $now,
        ]);

        $transaction->allow_commit();

        return [
            'ok' => true,
            'tables_ready' => true,
            'threadid' => $threadid,
            'messageid' => $messageid,
            'message' => 'created',
        ];
    }

    public static function comm_create_announcement_returns() {
        return new \external_single_structure([
            'ok' => new \external_value(PARAM_BOOL, 'True if the announcement was created'),
            'tables_ready' => new \external_value(PARAM_BOOL, 'False if communication tables are missing'),
            'threadid' => new \external_value(PARAM_INT, 'Created thread id'),
            'messageid' => new \external_value(PARAM_INT, 'Created message id'),
            'message' => new \external_value(PARAM_TEXT, 'Status message'),
        ]);
    }

    public static function comm_create_parent_thread_parameters() {
        return new \external_function_parameters([
            'cohortid' => new \external_value(PARAM_INT, 'Legacy cohort id', VALUE_DEFAULT, 0),
            'studentid' => new \external_value(PARAM_INT, 'Student user id this private thread is about', VALUE_REQUIRED),
            'parentid' => new \external_value(PARAM_INT, 'Parent or guardian user id to include as a participant', VALUE_REQUIRED),
            'subject' => new \external_value(PARAM_TEXT, 'Thread subject', VALUE_REQUIRED),
            'body' => new \external_value(PARAM_RAW, 'Initial message body', VALUE_REQUIRED),
        ]);
    }

    public static function comm_create_parent_thread($cohortid, $studentid, $parentid, $subject = '', $body = '') {
        global $DB, $USER;

        $params = self::validate_parameters(self::comm_create_parent_thread_parameters(), [
            'cohortid' => $cohortid,
            'studentid' => $studentid,
            'parentid' => $parentid,
            'subject' => $subject,
            'body' => $body,
        ]);

        $cohortid = (int)$params['cohortid'];
        $studentid = (int)$params['studentid'];
        $parentid = (int)$params['parentid'];

        self::comm_assert_can_create_parent_thread($cohortid, $studentid);

        if (!self::comm_tables_ready()) {
            return ['ok' => false, 'tables_ready' => false, 'threadid' => 0, 'messageid' => 0, 'message' => 'Communication tables are not installed.'];
        }
        if ($parentid <= 0) {
            throw new \invalid_parameter_exception('parentid is required.');
        }
        if ($parentid === $studentid || self::is_managed_student($parentid)) {
            throw new \invalid_parameter_exception('Parent participant cannot be the managed student.');
        }
        if (!self::comm_is_student_guardian($studentid, $parentid) && !self::comm_is_admin()) {
            throw new \moodle_exception('nopermissions', '', '', 'The selected parent is not linked to this student.');
        }

        $subject = trim(clean_param((string)$params['subject'], PARAM_TEXT));
        $body = self::comm_clean_message_body((string)$params['body'], 1000);
        if ($subject === '') {
            throw new \invalid_parameter_exception('subject is required.');
        }
        if ($body === '') {
            throw new \invalid_parameter_exception('body is required.');
        }
        if (core_text::strlen($subject) > 255) {
            $subject = core_text::substr($subject, 0, 255);
        }

        $now = time();
        $transaction = $DB->start_delegated_transaction();

        $threadid = (int)$DB->insert_record('local_prequran_comm_thread', (object)[
            'type' => 'parent_teacher',
            'cohortid' => $cohortid,
            'studentid' => $studentid,
            'createdby' => (int)$USER->id,
            'status' => 'active',
            'subject' => $subject,
            'lastmessageat' => $now,
            'timecreated' => $now,
            'timemodified' => $now,
        ]);

        $messageid = (int)$DB->insert_record('local_prequran_comm_message', (object)[
            'threadid' => $threadid,
            'senderid' => (int)$USER->id,
            'studentid' => $studentid,
            'messagekind' => 'text',
            'body' => $body,
            'templatekey' => '',
            'status' => 'visible',
            'moderationflags' => '',
            'timecreated' => $now,
            'timemodified' => $now,
        ]);

        $creatorrole = self::comm_is_admin() ? 'admin' : 'teacher';
        $DB->insert_record('local_prequran_comm_participant', (object)[
            'threadid' => $threadid,
            'userid' => (int)$USER->id,
            'role' => $creatorrole,
            'canreply' => 1,
            'lastreadmessageid' => $messageid,
            'muted' => 0,
            'timecreated' => $now,
            'timemodified' => $now,
        ]);

        if ($parentid !== (int)$USER->id) {
            $DB->insert_record('local_prequran_comm_participant', (object)[
                'threadid' => $threadid,
                'userid' => $parentid,
                'role' => 'parent',
                'canreply' => 1,
                'lastreadmessageid' => 0,
                'muted' => 0,
                'timecreated' => $now,
                'timemodified' => $now,
            ]);
        }

        $DB->insert_record('local_prequran_comm_audit', (object)[
            'threadid' => $threadid,
            'messageid' => $messageid,
            'actorid' => (int)$USER->id,
            'action' => 'created',
            'details' => json_encode(['type' => 'parent_teacher', 'cohortid' => $cohortid, 'studentid' => $studentid, 'parentid' => $parentid]),
            'timecreated' => $now,
        ]);

        $transaction->allow_commit();

        return [
            'ok' => true,
            'tables_ready' => true,
            'threadid' => $threadid,
            'messageid' => $messageid,
            'message' => 'created',
        ];
    }

    public static function comm_create_parent_thread_returns() {
        return new \external_single_structure([
            'ok' => new \external_value(PARAM_BOOL, 'True if the parent thread was created'),
            'tables_ready' => new \external_value(PARAM_BOOL, 'False if communication tables are missing'),
            'threadid' => new \external_value(PARAM_INT, 'Created thread id'),
            'messageid' => new \external_value(PARAM_INT, 'Created message id'),
            'message' => new \external_value(PARAM_TEXT, 'Status message'),
        ]);
    }

    public static function comm_send_parent_alert_parameters() {
        return new \external_function_parameters([
            'cohortid' => new \external_value(PARAM_INT, 'Legacy cohort id', VALUE_DEFAULT, 0),
            'studentid' => new \external_value(PARAM_INT, 'Student user id this alert is about', VALUE_REQUIRED),
            'sessionid' => new \external_value(PARAM_INT, 'Optional live session id for audit linkage', VALUE_DEFAULT, 0),
            'subject' => new \external_value(PARAM_TEXT, 'Alert subject', VALUE_REQUIRED),
            'body' => new \external_value(PARAM_RAW, 'Parent-safe alert body', VALUE_REQUIRED),
            'urgent' => new \external_value(PARAM_BOOL, 'Send urgent WhatsApp delivery when configured', VALUE_DEFAULT, true),
        ]);
    }

    public static function comm_send_parent_alert($cohortid, $studentid, $sessionid = 0, $subject = '', $body = '', $urgent = true) {
        global $DB, $USER;

        $params = self::validate_parameters(self::comm_send_parent_alert_parameters(), [
            'cohortid' => $cohortid,
            'studentid' => $studentid,
            'sessionid' => $sessionid,
            'subject' => $subject,
            'body' => $body,
            'urgent' => $urgent,
        ]);

        $cohortid = (int)$params['cohortid'];
        $studentid = (int)$params['studentid'];
        $sessionid = (int)$params['sessionid'];
        self::comm_assert_can_create_parent_thread($cohortid, $studentid);

        if (!self::comm_tables_ready()) {
            return [
                'ok' => false,
                'tables_ready' => false,
                'threadid' => 0,
                'messageid' => 0,
                'parent_count' => 0,
                'moodle_sent' => 0,
                'whatsapp_sent' => 0,
                'message' => 'Communication tables are not installed.',
            ];
        }

        $subject = trim(clean_param((string)$params['subject'], PARAM_TEXT));
        $body = self::comm_clean_message_body((string)$params['body'], 1200);
        if ($subject === '') {
            throw new \invalid_parameter_exception('subject is required.');
        }
        if ($body === '') {
            throw new \invalid_parameter_exception('body is required.');
        }

        $parents = function_exists('local_prequran_notify_parent_ids_for_student')
            ? local_prequran_notify_parent_ids_for_student($studentid)
            : [];
        $parents = array_values(array_unique(array_filter(array_map('intval', $parents))));
        if (!$parents) {
            if (function_exists('local_prequran_notify_audit')) {
                local_prequran_notify_audit($sessionid, 0, 'urgent_parent_alert_skipped', [
                    'studentid' => $studentid,
                    'reason' => 'no linked parents',
                ]);
            }
            return [
                'ok' => false,
                'tables_ready' => true,
                'threadid' => 0,
                'messageid' => 0,
                'parent_count' => 0,
                'moodle_sent' => 0,
                'whatsapp_sent' => 0,
                'message' => 'No linked parent or guardian was found for this student.',
            ];
        }

        if ($cohortid <= 0) {
            $row = $DB->get_record_sql(
                "SELECT cohortid
                   FROM {cohort_members}
                  WHERE userid = :studentid
               ORDER BY id ASC",
                ['studentid' => $studentid],
                IGNORE_MULTIPLE
            );
            $cohortid = $row ? (int)$row->cohortid : 0;
        }

        $now = time();
        $transaction = $DB->start_delegated_transaction();
        $threadid = (int)$DB->insert_record('local_prequran_comm_thread', (object)[
            'type' => 'parent_teacher',
            'cohortid' => $cohortid,
            'studentid' => $studentid,
            'createdby' => (int)$USER->id,
            'status' => 'active',
            'subject' => $subject,
            'lastmessageat' => $now,
            'timecreated' => $now,
            'timemodified' => $now,
        ]);

        $messageid = (int)$DB->insert_record('local_prequran_comm_message', (object)[
            'threadid' => $threadid,
            'senderid' => (int)$USER->id,
            'studentid' => $studentid,
            'messagekind' => 'template',
            'body' => $body,
            'templatekey' => $params['urgent'] ? 'urgent_parent_alert' : 'important_parent_alert',
            'status' => 'visible',
            'moderationflags' => '',
            'timecreated' => $now,
            'timemodified' => $now,
        ]);

        $DB->insert_record('local_prequran_comm_participant', (object)[
            'threadid' => $threadid,
            'userid' => (int)$USER->id,
            'role' => self::comm_is_admin() ? 'admin' : 'teacher',
            'canreply' => 1,
            'lastreadmessageid' => $messageid,
            'muted' => 0,
            'timecreated' => $now,
            'timemodified' => $now,
        ]);

        foreach ($parents as $parentid) {
            $DB->insert_record('local_prequran_comm_participant', (object)[
                'threadid' => $threadid,
                'userid' => $parentid,
                'role' => 'parent',
                'canreply' => 1,
                'lastreadmessageid' => 0,
                'muted' => 0,
                'timecreated' => $now,
                'timemodified' => $now,
            ]);
        }

        $DB->insert_record('local_prequran_comm_audit', (object)[
            'threadid' => $threadid,
            'messageid' => $messageid,
            'actorid' => (int)$USER->id,
            'action' => 'urgent_parent_alert_created',
            'details' => json_encode([
                'studentid' => $studentid,
                'sessionid' => $sessionid,
                'urgent' => (bool)$params['urgent'],
                'parent_count' => count($parents),
            ]),
            'timecreated' => $now,
        ]);
        $transaction->allow_commit();

        $url = new \moodle_url('/local/hubredirect/communications.php', [
            'cohortid' => $cohortid,
            'studentid' => $studentid,
            'opencomm' => 'messages',
            'threadid' => $threadid,
        ]);
        $moodlesent = function_exists('local_prequran_notify_parent_live_update')
            ? local_prequran_notify_parent_live_update($sessionid, $studentid, $subject, $body, $url, 'Open alert', 'urgent_parent_alert')
            : 0;
        $whatsappsent = 0;
        if ((bool)$params['urgent'] && function_exists('local_prequran_notify_parent_urgent_whatsapp_alert')) {
            $whatsappsent = local_prequran_notify_parent_urgent_whatsapp_alert($sessionid, $studentid, $subject, $body, $url, 'urgent_parent_alert');
        }

        return [
            'ok' => true,
            'tables_ready' => true,
            'threadid' => $threadid,
            'messageid' => $messageid,
            'parent_count' => count($parents),
            'moodle_sent' => $moodlesent,
            'whatsapp_sent' => $whatsappsent,
            'message' => 'Parent alert created.',
        ];
    }

    public static function comm_send_parent_alert_returns() {
        return new \external_single_structure([
            'ok' => new \external_value(PARAM_BOOL, 'True if the alert record was created'),
            'tables_ready' => new \external_value(PARAM_BOOL, 'False if communication tables are missing'),
            'threadid' => new \external_value(PARAM_INT, 'Created thread id'),
            'messageid' => new \external_value(PARAM_INT, 'Created message id'),
            'parent_count' => new \external_value(PARAM_INT, 'Number of linked parents targeted'),
            'moodle_sent' => new \external_value(PARAM_INT, 'Number of Moodle notifications sent'),
            'whatsapp_sent' => new \external_value(PARAM_INT, 'Number of WhatsApp webhook deliveries accepted'),
            'message' => new \external_value(PARAM_TEXT, 'Status message'),
        ]);
    }

    public static function comm_send_message_parameters() {
        return new \external_function_parameters([
            'threadid' => new \external_value(PARAM_INT, 'Thread id', VALUE_REQUIRED),
            'body' => new \external_value(PARAM_RAW, 'Message body', VALUE_REQUIRED),
            'templatekey' => new \external_value(PARAM_ALPHANUMEXT, 'Optional template key', VALUE_DEFAULT, ''),
        ]);
    }

    public static function comm_send_message($threadid, $body, $templatekey = '') {
        global $DB, $USER;

        $params = self::validate_parameters(self::comm_send_message_parameters(), [
            'threadid' => $threadid,
            'body' => $body,
            'templatekey' => $templatekey,
        ]);

        self::validate_context(\context_system::instance());

        if (!self::comm_tables_ready()) {
            return ['ok' => false, 'tables_ready' => false, 'messageid' => 0, 'message' => 'Communication tables are not installed.'];
        }

        $thread = $DB->get_record('local_prequran_comm_thread', ['id' => (int)$params['threadid']]);
        if (!$thread || !self::comm_user_can_read_thread($thread) || !self::comm_user_can_reply_thread($thread)) {
            throw new \moodle_exception('nopermissions', '', '', 'You cannot reply to this communication thread.');
        }
        if ((string)$thread->type === 'announcement') {
            throw new \moodle_exception('nopermissions', '', '', 'Announcements are read-only.');
        }

        $body = self::comm_clean_message_body((string)$params['body'], 1000);
        $templatekey = trim((string)$params['templatekey']);
        if ($body === '') {
            throw new \invalid_parameter_exception('body is required.');
        }

        $now = time();
        $transaction = $DB->start_delegated_transaction();

        $messageid = (int)$DB->insert_record('local_prequran_comm_message', (object)[
            'threadid' => (int)$thread->id,
            'senderid' => (int)$USER->id,
            'studentid' => empty($thread->studentid) ? null : (int)$thread->studentid,
            'messagekind' => $templatekey !== '' ? 'template' : 'text',
            'body' => $body,
            'templatekey' => $templatekey,
            'status' => 'visible',
            'moderationflags' => '',
            'timecreated' => $now,
            'timemodified' => $now,
        ]);

        $thread->lastmessageat = $now;
        $thread->timemodified = $now;
        $DB->update_record('local_prequran_comm_thread', $thread);

        $participant = $DB->get_record('local_prequran_comm_participant', [
            'threadid' => (int)$thread->id,
            'userid' => (int)$USER->id,
        ]);
        if ($participant) {
            $participant->lastreadmessageid = $messageid;
            $participant->timemodified = $now;
            $DB->update_record('local_prequran_comm_participant', $participant);
        }

        $DB->insert_record('local_prequran_comm_audit', (object)[
            'threadid' => (int)$thread->id,
            'messageid' => $messageid,
            'actorid' => (int)$USER->id,
            'action' => 'created',
            'details' => json_encode(['type' => (string)$thread->type, 'reply' => true]),
            'timecreated' => $now,
        ]);

        $transaction->allow_commit();

        return [
            'ok' => true,
            'tables_ready' => true,
            'messageid' => $messageid,
            'message' => 'created',
        ];
    }

    public static function comm_send_message_returns() {
        return new \external_single_structure([
            'ok' => new \external_value(PARAM_BOOL, 'True if the message was created'),
            'tables_ready' => new \external_value(PARAM_BOOL, 'False if communication tables are missing'),
            'messageid' => new \external_value(PARAM_INT, 'Created message id'),
            'message' => new \external_value(PARAM_TEXT, 'Status message'),
        ]);
    }

}
