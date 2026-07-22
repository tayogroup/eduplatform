<?php
// Progress web service (P1.4) — the Moodle side of docs/progress-event-contract.md.
// Two endpoints the learner app (or the edge) calls:
//   local_prequran_progress_ingest  — accept a batch of contract events (write)
//   local_prequran_progress_get      — return the hydrate state document (read)
//
// Deliberately a SEPARATE external class (not the externallib_v4.php monolith),
// registered in db/services.php with its own classpath — so it can ship and be
// reviewed on its own, and nudges the eventual monolith split. Follows the
// plugin's conventions: a pq_env override, an assert_*_allowed() gate, and a
// self::table_exists() soft-guard that returns ok=false instead of throwing when
// the schema is not installed yet.
//
// The server keeps ONE reduced state row per (environment, user, course, unit)
// in local_prequran_progress — the same reduction the app's local backend does —
// so hydrate is a straight read. Durable events are de-duplicated by their
// client id; state events are last-write-wins by their `at` timestamp.

defined('MOODLE_INTERNAL') || die();

require_once($CFG->libdir . '/externallib.php');

class local_prequran_progress_external extends external_api {

    /** Keep at most this many recent durable ids per unit for idempotency. */
    const MAX_APPLIED_IDS = 250;

    // ---- shared helpers ----------------------------------------------------

    private static function set_environment_override(string $env): void {
        // Mirror the monolith's behaviour without hard-depending on it: if the
        // helper exists (externallib_v4 loaded), defer to it; otherwise no-op.
        if (is_callable(['local_prequran_external', 'set_environment_override'])) {
            call_user_func(['local_prequran_external', 'set_environment_override'], $env);
        }
    }

    private static function normalise_env(string $env): string {
        $env = strtolower(trim($env));
        return in_array($env, ['production', 'staging', 'integration'], true) ? $env : 'production';
    }

    private static function table_exists(string $table): bool {
        global $DB;
        try {
            return $DB->get_manager()->table_exists($table);
        } catch (\Throwable $e) {
            return false;
        }
    }

    /**
     * A learner may write/read their own progress; site admins may act for anyone.
     * Teacher/guardian delegation is intentionally left as a follow-up (align with
     * local_prequran_external::assert_quiz_save_allowed once this ships) so the
     * first cut cannot leak another learner's data.
     */
    private static function assert_progress_allowed(int $userid): void {
        global $USER;
        if ((int)$USER->id === $userid) {
            return;
        }
        if (is_siteadmin()) {
            return;
        }
        throw new required_capability_exception(
            context_system::instance(),
            'moodle/site:config',
            'nopermissions',
            ''
        );
    }

    // ---- reduce (mirror of the app's applyEvent) ---------------------------

    private static function empty_unit_state(): array {
        return [
            'sectionsDone' => [],
            'resume' => null,
            'checkpoints' => new stdClass(),
            'xp' => 0,
            'knownWords' => [],
            'drafts' => new stdClass(),
            'completed' => false,
            '_lastAt' => '',
            '_appliedIds' => [],
        ];
    }

    /** Apply one event onto a unit-state array. Returns [changed, isDurable]. */
    private static function apply_event(array &$state, array $ev): array {
        $type = $ev['type'] ?? '';
        $durable = in_array($type, ['checkpoint.result', 'unit.completed', 'capstone.submitted', 'section.completed'], true);
        $isstate = in_array($type, ['progress.summary', 'draft.saved'], true);

        // Idempotency: a durable event already applied is a no-op.
        if ($durable && !empty($ev['id'])) {
            if (in_array($ev['id'], $state['_appliedIds'], true)) {
                return [false, true];
            }
        }
        // Last-write-wins for state events: ignore anything older than what we have.
        if ($isstate && !empty($ev['at']) && $state['_lastAt'] !== '' && $ev['at'] < $state['_lastAt']) {
            return [false, false];
        }

        $checkpoints = (array)$state['checkpoints'];
        $drafts = (array)$state['drafts'];

        switch ($type) {
            case 'section.completed':
                if (!empty($ev['section']) && !in_array($ev['section'], $state['sectionsDone'], true)) {
                    $state['sectionsDone'][] = $ev['section'];
                }
                break;
            case 'checkpoint.result':
                $checkpoints[$ev['section'] ?? '_'] = [
                    'score' => isset($ev['score']) ? (int)$ev['score'] : null,
                    'passed' => !empty($ev['passed']),
                    'attempt' => isset($ev['attempt']) ? (int)$ev['attempt'] : 1,
                ];
                break;
            case 'unit.completed':
                $state['completed'] = true;
                break;
            case 'capstone.submitted':
                $state['capstone'] = [
                    'artifactRef' => $ev['artifactRef'] ?? null,
                    'rubricSelfScore' => $ev['rubricSelfScore'] ?? null,
                    'at' => $ev['at'] ?? null,
                ];
                break;
            case 'progress.summary':
                if (!empty($ev['sectionsDone']) && is_array($ev['sectionsDone'])) {
                    foreach ($ev['sectionsDone'] as $s) {
                        if (!in_array($s, $state['sectionsDone'], true)) {
                            $state['sectionsDone'][] = $s;
                        }
                    }
                }
                if (array_key_exists('resume', $ev)) {
                    $state['resume'] = $ev['resume'];
                }
                if (isset($ev['xp'])) {
                    $state['xp'] = (int)$ev['xp'];
                }
                if (!empty($ev['knownWords']) && is_array($ev['knownWords'])) {
                    $state['knownWords'] = array_values($ev['knownWords']);
                }
                break;
            case 'draft.saved':
                $drafts[$ev['section'] ?? '_'] = [
                    'text' => $ev['text'] ?? '',
                    'blobRef' => $ev['blobRef'] ?? null,
                    'words' => isset($ev['words']) ? (int)$ev['words'] : null,
                    'at' => $ev['at'] ?? null,
                ];
                break;
            default:
                return [false, false]; // ephemeral: never persisted
        }

        $state['checkpoints'] = $checkpoints;
        $state['drafts'] = $drafts;
        if (!empty($ev['at'])) {
            $state['_lastAt'] = max($state['_lastAt'], $ev['at']);
        }
        if ($durable && !empty($ev['id'])) {
            $state['_appliedIds'][] = $ev['id'];
            if (count($state['_appliedIds']) > self::MAX_APPLIED_IDS) {
                $state['_appliedIds'] = array_slice($state['_appliedIds'], -self::MAX_APPLIED_IDS);
            }
        }
        return [true, $durable];
    }

    /** Strip internal bookkeeping keys before returning state to a client. */
    private static function public_state(array $state): array {
        unset($state['_lastAt'], $state['_appliedIds']);
        return $state;
    }

    /**
     * Push a durable checkpoint into the Moodle gradebook. Gated: resolves the
     * course + grade item by the catalog idnumber (`coursekey`) and only writes
     * when both exist, otherwise soft-skips. The idnumber convention and grade
     * items are produced by the catalog sync (P1.7); until that lands this is a
     * no-op, which is correct — no course, no grade to write.
     */
    private static function push_gradebook(int $userid, string $coursekey, string $unit, array $checkpoint): void {
        global $CFG, $DB;
        require_once($CFG->libdir . '/gradelib.php');
        $course = $DB->get_record('course', ['idnumber' => $coursekey]);
        if (!$course) {
            return; // catalog not synced yet — nothing to grade against
        }
        $itemnumber = 0;
        $grade = ['userid' => $userid, 'rawgrade' => $checkpoint['score']];
        grade_update(
            'local/prequran',
            $course->id,
            'mod',
            'local_prequran',
            $unit === 'final' ? 0 : (int)preg_replace('/\D/', '', $unit),
            $itemnumber,
            $grade,
            ['itemname' => "Progress: {$unit}"]
        );
    }

    // ---- ingest ------------------------------------------------------------

    public static function progress_ingest_parameters() {
        return new external_function_parameters([
            'userid' => new external_value(PARAM_INT, 'Student user id', VALUE_REQUIRED),
            'course' => new external_value(PARAM_RAW_TRIMMED, 'Catalog course idnumber (e.g. ehel-eng-g03)', VALUE_REQUIRED),
            'contract' => new external_value(PARAM_RAW_TRIMMED, 'Contract version (e.g. 1.0)', VALUE_DEFAULT, '1.0'),
            'events_json' => new external_value(PARAM_RAW, 'JSON array of contract events', VALUE_REQUIRED),
            'pq_env' => new external_value(PARAM_ALPHANUMEXT, 'Environment: production|staging|integration', VALUE_DEFAULT, ''),
        ]);
    }

    public static function progress_ingest($userid, $course, $contract, $events_json, $pq_env = '') {
        $params = self::validate_parameters(self::progress_ingest_parameters(), [
            'userid' => $userid, 'course' => $course, 'contract' => $contract,
            'events_json' => $events_json, 'pq_env' => $pq_env,
        ]);
        self::set_environment_override((string)($params['pq_env'] ?? ''));
        $userid = (int)$params['userid'];
        $coursekey = (string)$params['course'];
        self::assert_progress_allowed($userid);

        $events = json_decode((string)$params['events_json'], true);
        if (!is_array($events)) {
            throw new invalid_parameter_exception('events_json must be a JSON array of events.');
        }

        return self::ingest_events($userid, $coursekey, $events, (string)($params['pq_env'] ?? ''));
    }

    /**
     * The authoritative ingest path, shared by the WS above (after its
     * self/siteadmin assert) and the launch-token gateway (after JWT verify).
     * Callers MUST have authorised $userid before calling.
     */
    public static function ingest_events(int $userid, string $coursekey, array $events, string $env): array {
        global $DB;
        $env = self::normalise_env($env);

        if (!self::table_exists('local_prequran_progress')) {
            return ['ok' => false, 'message' => 'Progress schema is not installed yet.', 'accepted' => 0, 'durable' => 0, 'dropped' => 0, 'stateversion' => 0];
        }

        // Group events by unit; order within a unit by seq then at.
        $byunit = [];
        foreach ($events as $ev) {
            if (!is_array($ev) || empty($ev['type'])) {
                continue;
            }
            $unit = (string)($ev['unit'] ?? '_');
            $byunit[$unit][] = $ev;
        }

        $now = time();
        $accepted = 0; $durablecount = 0; $dropped = 0; $maxversion = 0;
        $gradepushes = [];

        foreach ($byunit as $unit => $unitevents) {
            usort($unitevents, function ($a, $b) {
                return ((int)($a['seq'] ?? 0)) <=> ((int)($b['seq'] ?? 0));
            });

            $existing = $DB->get_record('local_prequran_progress', [
                'environment' => $env, 'userid' => $userid, 'coursekey' => $coursekey, 'unit' => $unit,
            ]);
            $state = $existing ? (array)json_decode($existing->statejson, true) : self::empty_unit_state();
            $state = array_merge(self::empty_unit_state(), $state); // heal missing keys

            foreach ($unitevents as $ev) {
                [$changed, $isdurable] = self::apply_event($state, $ev);
                if ($changed) {
                    $accepted++;
                    if ($isdurable) {
                        $durablecount++;
                        if (($ev['type'] ?? '') === 'checkpoint.result' && isset($ev['score'])) {
                            $gradepushes[] = ['unit' => $unit, 'checkpoint' => [
                                'score' => (int)$ev['score'], 'passed' => !empty($ev['passed']),
                            ]];
                        }
                    }
                } else {
                    $dropped++;
                }
            }

            $version = ($existing ? (int)$existing->version : 0) + 1;
            $maxversion = max($maxversion, $version);
            $record = (object)[
                'environment' => $env,
                'userid' => $userid,
                'coursekey' => $coursekey,
                'unit' => $unit,
                'statejson' => json_encode($state, JSON_UNESCAPED_SLASHES),
                'version' => $version,
                'timemodified' => $now,
            ];
            if ($existing) {
                $record->id = $existing->id;
                $DB->update_record('local_prequran_progress', $record);
            } else {
                $record->timecreated = $now;
                $DB->insert_record('local_prequran_progress', $record);
            }
        }

        // Gradebook writes are best-effort and must never fail the ingest.
        foreach ($gradepushes as $gp) {
            try {
                self::push_gradebook($userid, $coursekey, $gp['unit'], $gp['checkpoint']);
            } catch (\Throwable $e) {
                debugging('progress gradebook push failed: ' . $e->getMessage(), DEBUG_DEVELOPER);
            }
        }

        return ['ok' => true, 'message' => 'Progress ingested.', 'accepted' => $accepted, 'durable' => $durablecount, 'dropped' => $dropped, 'stateversion' => $maxversion];
    }

    public static function progress_ingest_returns() {
        return new external_single_structure([
            'ok' => new external_value(PARAM_BOOL, 'Whether the batch was accepted'),
            'message' => new external_value(PARAM_TEXT, 'Status message'),
            'accepted' => new external_value(PARAM_INT, 'Events applied'),
            'durable' => new external_value(PARAM_INT, 'Durable events applied'),
            'dropped' => new external_value(PARAM_INT, 'Events ignored (dedup / stale / ephemeral)'),
            'stateversion' => new external_value(PARAM_INT, 'Highest unit state version after this batch'),
        ]);
    }

    // ---- get / hydrate -----------------------------------------------------

    public static function progress_get_parameters() {
        return new external_function_parameters([
            'userid' => new external_value(PARAM_INT, 'Student user id', VALUE_REQUIRED),
            'course' => new external_value(PARAM_RAW_TRIMMED, 'Catalog course idnumber', VALUE_REQUIRED),
            'pq_env' => new external_value(PARAM_ALPHANUMEXT, 'Environment: production|staging|integration', VALUE_DEFAULT, ''),
        ]);
    }

    public static function progress_get($userid, $course, $pq_env = '') {
        $params = self::validate_parameters(self::progress_get_parameters(), [
            'userid' => $userid, 'course' => $course, 'pq_env' => $pq_env,
        ]);
        self::set_environment_override((string)($params['pq_env'] ?? ''));
        $userid = (int)$params['userid'];
        $coursekey = (string)$params['course'];
        self::assert_progress_allowed($userid);

        $doc = self::state_document($userid, $coursekey, (string)($params['pq_env'] ?? ''));
        return ['ok' => true, 'course' => $coursekey, 'student' => $userid, 'stateversion' => (int)$doc['stateVersion'], 'state_json' => json_encode($doc, JSON_UNESCAPED_SLASHES)];
    }

    /**
     * The hydrate document (contract shape), shared by the WS above and the
     * launch-token gateway. Callers MUST have authorised $userid first.
     */
    public static function state_document(int $userid, string $coursekey, string $env): array {
        global $DB;
        $env = self::normalise_env($env);

        $units = new stdClass();
        $stateversion = 0;
        if (self::table_exists('local_prequran_progress')) {
            $rows = $DB->get_records('local_prequran_progress', [
                'environment' => $env, 'userid' => $userid, 'coursekey' => $coursekey,
            ]);
            foreach ($rows as $row) {
                $state = (array)json_decode($row->statejson, true);
                $units->{$row->unit} = self::public_state(array_merge(self::empty_unit_state(), $state));
                $stateversion = max($stateversion, (int)$row->version);
            }
        }

        return ['course' => $coursekey, 'student' => $userid, 'stateVersion' => $stateversion, 'units' => $units];
    }

    public static function progress_get_returns() {
        return new external_single_structure([
            'ok' => new external_value(PARAM_BOOL, 'Whether the lookup succeeded'),
            'course' => new external_value(PARAM_TEXT, 'Course idnumber'),
            'student' => new external_value(PARAM_INT, 'Student user id'),
            'stateversion' => new external_value(PARAM_INT, 'Highest unit state version'),
            'state_json' => new external_value(PARAM_RAW, 'Hydrate document JSON (contract shape)'),
        ]);
    }
}
