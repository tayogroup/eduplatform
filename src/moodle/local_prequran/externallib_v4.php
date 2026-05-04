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
        if (is_siteadmin($USER)) {
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
require_once($CFG->dirroot . '/user/profile/lib.php');
require_once($CFG->dirroot . '/cohort/lib.php');

// PQ_FOCUS_PATCH_VER: 20251224_4


/**
 * Web service functions for local_prequran.
 */
class local_prequran_external extends external_api {

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

    // -------------------------------------------------------------------------
    // Helper: fetch step configuration for a lesson/unit from DB or simple fallback
    // -------------------------------------------------------------------------
    protected static function get_step_config(string $lessonid, string $unitid,
                                              int $globalpasses, int $globalrepeats): array {
        global $DB;

        $steps = [];

        // DB-configured steps.
        $records = $DB->get_records('local_prequran_stepcfg',
            ['lessonid' => $lessonid, 'unitid' => $unitid, 'active' => 1],
            'step_index ASC');

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

        $conditions = ['userid' => $userid, 'lessonid' => $lessonid, 'unitid' => $unitid];
        $lessonprog = $DB->get_record('local_prequran_lessonprog', $conditions);

        $now = time();
        if (!$lessonprog) {
            $rec = (object)[
                'userid' => $userid,
                'lessonid' => $lessonid,
                'unitid' => $unitid,
                'lessonprog_id' => (int)$lessonprog->id,
                'attempt_no' => 1,
                'step_index' => (int)($s->step_index ?? 0),
                'lessonprog_id' => (int)$lessonprog->id,
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
        $stepscfg = $DB->get_records('local_prequran_stepcfg', [
            'lessonid' => $lessonid,
            'unitid' => $unitid,
            'active' => 1
        ], 'step_index ASC');

        if (!$stepscfg) return;

        $existing = $DB->get_records('local_prequran_stepprog', $conditions, '', 'id,step_id');
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
                'passes_required' => (int)($s->default_passes_required ?? 1),
                'repeats_per_letter' => (int)($s->default_repeats_per_letter ?? 1),
                'step_status' => 0,
                'step_starttime' => $now,
                'step_lastactivity' => null,
                'passes_required' => (int)($s->default_passes_required ?? 1),
                'repeats_per_letter' => (int)($s->default_repeats_per_letter ?? 1),
                'step_status' => 0,
                'step_starttime' => $now,
                'passes_done' => 0,
                'completed' => 0,
                'last_activity' => null,
                'progress_json' => '',
                'timecreated' => $now,
                'timemodified' => $now,
            ];

            $safe = new stdClass();
            foreach ($rec as $k => $v) {
                if (in_array($k, $cols, true)) $safe->$k = $v;
            }
            $DB->insert_record('local_prequran_stepprog', $safe);
        }
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

        // Do not hard-fail if Moodle user record isn't found (prevents new-user WS crashes).
        // Some flows may call the WS before the profile record is fully available.
        $user = core_user::get_user($userid);

        // 1) Is this a managed student?
        $managed = self::is_managed_student($userid);

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
        $steprows = $DB->get_records('local_prequran_stepprog', [
            'userid'   => $userid,
            'lessonid' => $lessonid,
            'unitid'   => $unitid,
        ], 'step_index ASC');

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
            $rawprogress = '';
        }

        // Total stars = completed steps across all units for this user.
        // Reward rule: 1 star per completed step.
        $totalstars = (int)$DB->get_field_sql(
            "SELECT COALESCE(SUM(steps_completed), 0)
               FROM {local_prequran_lessonprog}
              WHERE userid = ?",
            [$userid]
        );

        // Completed units = units whose overall status is completed.
        $completedunits = (int)$DB->count_records_sql(
            "SELECT COUNT(*)
               FROM {local_prequran_lessonprog}
              WHERE userid = ?
                AND overall_status = ?",
            [$userid, 'completed']
        );

        return [
            'managed_student'   => (bool)$managed,
            'passes_required'   => $passes_required,
            'number_of_repeats' => $number_of_repeats,
            'progress_json'     => $rawprogress,
            'steps'             => $stepsout,
            'totalstars'        => $totalstars,
            'completedunits'    => $completedunits,
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
        $conditions = ['userid' => $userid, 'lessonid' => $lessonid, 'unitid' => $unitid];
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
                if (property_exists($steprec, 'step_lastactivity') && ($passesdone > 0 || $completed)) {
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
            'lessonid' => new external_value(PARAM_ALPHANUMEXT, 'Lesson id (e.g. alphabet)', VALUE_REQUIRED),
            'unitid'   => new external_value(PARAM_ALPHANUMEXT, 'Unit id (e.g. alphabet_listen or alphabet_watch)', VALUE_REQUIRED),
            'userid'   => new external_value(PARAM_INT, 'User id', VALUE_REQUIRED),
        ]);
    }

    public static function get_unit_state($lessonid, $unitid, $userid) {
        $params = self::validate_parameters(
            self::get_unit_state_parameters(),
            ['lessonid' => $lessonid, 'unitid' => $unitid, 'userid' => $userid]
        );

        $lessonid = trim($params['lessonid']);
        $unitid   = trim($params['unitid']);
        $userid   = (int)$params['userid'];

        // Use a consistent preference key per unit.
        $prefkey = 'prequran_' . $lessonid . '_' . $unitid . '_state_v1';
        // Bootstrap DB rows on first run (prevents missing-record WS errors)
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
        ]);
    }

    public static function set_unit_state($lessonid, $unitid, $userid, $progress_json) {
        $params = self::validate_parameters(
            self::set_unit_state_parameters(),
            ['lessonid' => $lessonid, 'unitid' => $unitid, 'userid' => $userid, 'progress_json' => $progress_json]
        );

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
    public static function get_alphabet_listen_state_parameters() {
        return new external_function_parameters([
            'userid' => new external_value(PARAM_INT, 'User id', VALUE_REQUIRED),
        ]);
    }

    public static function get_alphabet_listen_state($userid) {
        // IMPORTANT: validate_parameters must receive the requested userid (not 0),
        // otherwise WS may read/write the wrong user's progress.

        $params = self::validate_parameters(
            self::get_alphabet_listen_state_parameters(),
            ['userid' => $userid]
        );
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
        ]);
    }

    public static function set_alphabet_listen_state_parameters() {
        return new external_function_parameters([
            'progress_json' => new external_value(PARAM_RAW, 'JSON string for Alphabet Listen managed progress', VALUE_REQUIRED),
            'userid'        => new external_value(PARAM_INT,  'User id', VALUE_REQUIRED),
        ]);
    }

    public static function set_alphabet_listen_state($progress_json, $userid) {
        $params = self::validate_parameters(
            self::set_alphabet_listen_state_parameters(),
            ['progress_json' => $progress_json, 'userid' => $userid]
        );
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
              ON lp.userid = u.id AND lp.lessonid = :lessonid AND lp.unitid = :unitid
            WHERE $where
            ORDER BY u.lastname, u.firstname
        ";
        $recs = $DB->get_records_sql($sql, $params);

        // worst pass inflation per user for this unit
        $inflationByUser = [];
        $inflSql = "
            SELECT sp.userid, MAX(GREATEST(0, sp.passes_done - sp.passes_required)) AS inflation_max
              FROM {local_prequran_stepprog} sp
             WHERE sp.userid $inSql AND sp.lessonid = :lessonid AND sp.unitid = :unitid
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
              ON sc.lessonid = sp.lessonid AND sc.unitid = sp.unitid AND sc.step_id = sp.step_id
            WHERE sp.userid = :userid AND sp.lessonid = :lessonid AND sp.unitid = :unitid
            ORDER BY sp.step_index ASC
        ";
        $recs = $DB->get_records_sql($sql, [
            'userid'=>(int)$p['userid'],
            'lessonid'=>trim($p['lessonid']),
            'unitid'=>trim($p['unitid'])
        ]);

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
              ON sc.lessonid = sp.lessonid AND sc.unitid = sp.unitid AND sc.step_id = sp.step_id
            WHERE sp.userid $inSql AND sp.lessonid = :lessonid AND sp.unitid = :unitid
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

        $conds = ['userid'=>$userid,'lessonid'=>$lessonid,'unitid'=>$unitid];
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

        $lp = $DB->get_record('local_prequran_lessonprog', ['userid'=>$userid,'lessonid'=>$lessonid,'unitid'=>$unitid]);
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

        $sp = $DB->get_record('local_prequran_stepprog', ['userid'=>$userid,'lessonid'=>$lessonid,'unitid'=>$unitid,'step_id'=>$stepid]);
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
    $DB->delete_records('local_prequran_stepprog', $conds);
    $DB->delete_records('local_prequran_lessonprog', $conds);

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
    if (\is_siteadmin($USER)) {
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

    $deletedstepprog = $DB->count_records('local_prequran_stepprog', $conds);
    $deletedlessonprog = $DB->count_records('local_prequran_lessonprog', $conds);

    $DB->delete_records('local_prequran_stepprog', $conds);
    $DB->delete_records('local_prequran_lessonprog', $conds);

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

        if (!is_siteadmin($USER)) {
            require_capability('local/prequran:resetstep', $syscontext);
        }

        $cohortid  = (int)$p['cohortid'];
        $studentid = !empty($p['userid']) ? (int)$p['userid'] : (int)$p['studentid'];
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
            $resolved = $DB->get_record('local_prequran_stepprog', [
                'userid' => $studentid,
                'lessonid' => $lessonid,
                'unitid' => $unitid,
                'step_index' => $stepindex,
            ], 'id,step_id', IGNORE_MISSING);

            if ($resolved && !empty($resolved->step_id)) {
                $stepid = $resolved->step_id;
            }
        }

        // Fallback to normalized id if it matches an existing row
        if ($stepid === '' || $stepid !== $stepnorm) {
            $exists = $DB->record_exists('local_prequran_stepprog', [
                'userid' => $studentid,
                'lessonid' => $lessonid,
                'unitid' => $unitid,
                'step_id' => $stepid,
            ]);
            if (!$exists && $stepnorm !== '') {
                $exists2 = $DB->record_exists('local_prequran_stepprog', [
                    'userid' => $studentid,
                    'lessonid' => $lessonid,
                    'unitid' => $unitid,
                    'step_id' => $stepnorm,
                ]);
                if ($exists2) {
                    $stepid = $stepnorm;
                }
            }
        }



        self::pq_assert_teacher_or_admin_in_cohort($cohortid, $studentid);

        $rec = $DB->get_record('local_prequran_stepprog', [
            'userid' => $studentid,
            'lessonid' => $lessonid,
            'unitid' => $unitid,
            'step_id' => $stepid,
        ], '*', IGNORE_MISSING);

        if (!$rec) {
            throw new \invalid_parameter_exception('Step not found for this student/unit. Use step_id like lecture/heavy or label "N. Title".');
        }

        if ($rec) {
            $rec->step_status = 'not_started';
            $rec->passes_done = 0;
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
        $lp = $DB->get_record('local_prequran_lessonprog', [
            'userid' => $studentid,
            'lessonid' => $lessonid,
            'unitid' => $unitid,
        ], '*', IGNORE_MISSING);

        if ($lp) {
            $steps_total = $DB->count_records('local_prequran_stepcfg', [
                'lessonid' => $lessonid,
                'unitid' => $unitid,
                'active' => 1,
            ]);
            $steps_completed = $DB->count_records('local_prequran_stepprog', [
                'userid' => $studentid,
                'lessonid' => $lessonid,
                'unitid' => $unitid,
                'step_status' => 'completed',
            ]);

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
    // FocusGuard (Option B): raw event log + aggregate rollups
    // -------------------------------------------------------------------------

    /** @return bool */
    private static function focus_tables_available(): bool {
        global $DB;
        $dbman = $DB->get_manager();
        return $dbman->table_exists('local_prequran_focuslog') && $dbman->table_exists('local_prequran_focusagg');
    }

    public static function set_focus_event_parameters() {
    return new \external_function_parameters([
        'userid'      => new \external_value(PARAM_INT,  'Student user id', VALUE_REQUIRED),
        'lessonid'    => new \external_value(PARAM_TEXT, 'Lesson id', VALUE_REQUIRED),
        'unitid'      => new \external_value(PARAM_TEXT, 'Unit id', VALUE_REQUIRED),

        'step_index'  => new \external_value(PARAM_INT,  'Step index', VALUE_DEFAULT, 0),
        'step_id'     => new \external_value(PARAM_TEXT, 'Step id', VALUE_DEFAULT, ''),

        'session_id'  => new \external_value(PARAM_TEXT, 'Client-generated session id', VALUE_REQUIRED),

        'event_type'  => new \external_value(PARAM_ALPHAEXT, 'leave|resume|idle|pause|focus_start', VALUE_REQUIRED),

        'reason'      => new \external_value(PARAM_TEXT, 'Reason', VALUE_DEFAULT, ''),

        'leave_count' => new \external_value(PARAM_INT, 'Snapshot leave count', VALUE_DEFAULT, 0),
        'idle_count'  => new \external_value(PARAM_INT, 'Snapshot idle count', VALUE_DEFAULT, 0),
        'active_ms'   => new \external_value(PARAM_INT, 'Snapshot active time (ms)', VALUE_DEFAULT, 0),

        'meta_json'   => new \external_value(PARAM_RAW, 'Optional JSON string', VALUE_DEFAULT, ''),

        'timecreated' => new \external_value(PARAM_INT, 'Epoch seconds; client may pass', VALUE_DEFAULT, 0),
    ]);
    }


    public static function set_focus_event($userid, $lessonid, $unitid,
                                          $step_index = null, $step_id = null,
                                          $session_id = '', $event_type = '', $reason = null,
                                          $leave_count = null, $idle_count = null, $active_ms = null,
                                          $meta_json = null, $timecreated = null) {
        global $DB, $USER;
$validate = [
            'userid'     => $userid,
            'lessonid'   => $lessonid,
            'unitid'     => $unitid,
            'session_id' => $session_id,
            'event_type' => $event_type,
        ];
        // IMPORTANT: Only include OPTIONAL params when they are not null.
        // Passing null for VALUE_OPTIONAL PARAM_INT/PARAM_TEXT causes invalidparameter.
        if ($step_index !== null)  { $validate['step_index']  = $step_index; }
        if ($step_id !== null)     { $validate['step_id']     = $step_id; }
        if ($reason !== null)      { $validate['reason']      = $reason; }
        if ($leave_count !== null) { $validate['leave_count'] = $leave_count; }
        if ($idle_count !== null)  { $validate['idle_count']  = $idle_count; }
        if ($active_ms !== null)   { $validate['active_ms']   = $active_ms; }
        if ($meta_json !== null)   { $validate['meta_json']   = $meta_json; }
        if ($timecreated !== null) { $validate['timecreated'] = $timecreated; }

        $params = self::validate_parameters(self::set_focus_event_parameters(), $validate);

// Security: students can only write their own focus events.
        if ((int)$USER->id !== (int)$params['userid']) {
            require_login();
        }

        $now = !empty($params['timecreated']) ? (int)$params['timecreated'] : time();

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
            'since'      => new \external_value(PARAM_INT, 'Only rows with last_time >= since (0 = any)', VALUE_DEFAULT, 0),
            'limit'      => new \external_value(PARAM_INT, 'Max rows', VALUE_DEFAULT, 200),
        ]);
    }

    public static function get_focus_summary($userid = 0, $lessonid = '', $unitid = '', $step_id = '',
                                            $session_id = '', $since = 0, $limit = 200) {
        global $DB;

        $params = self::validate_parameters(self::get_focus_summary_parameters(), [
            'userid'     => $userid,
            'lessonid'   => $lessonid,
            'unitid'     => $unitid,
            'step_id'    => $step_id,
            'session_id' => $session_id,
            'since'      => $since,
            'limit'      => $limit,
        ]);

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

        if (!empty($params['userid'])) { $w[] = 'userid = :userid'; $p['userid'] = (int)$params['userid']; }
        if (!empty($params['lessonid'])) { $w[] = 'lessonid = :lessonid'; $p['lessonid'] = (string)$params['lessonid']; }
        if (!empty($params['unitid'])) { $w[] = 'unitid = :unitid'; $p['unitid'] = (string)$params['unitid']; }
        if (!empty($params['step_id'])) { $w[] = 'step_id = :step_id'; $p['step_id'] = (string)$params['step_id']; }
        if (!empty($params['session_id'])) { $w[] = 'session_id = :session_id'; $p['session_id'] = (string)$params['session_id']; }
        if (!empty($params['since'])) { $w[] = 'last_time >= :since'; $p['since'] = (int)$params['since']; }

        $where = $w ? ('WHERE ' . implode(' AND ', $w)) : '';
        $limit = max(1, min(2000, (int)$params['limit']));

        $sql = "SELECT *
                  FROM {local_prequran_focusagg}
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

}
