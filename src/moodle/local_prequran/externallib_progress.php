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
    // One cycle of the live teaching model is 40 minutes and a learner completes
    // a handful of sections in it; 80 covers a whole day per unit and keeps the
    // ring a few hundred bytes of JSON.
    const MAX_ACTIVITY = 80;
    // The learner's DAY, not Wehel's allowance. One number because the school
    // states one: "students will be learning 3 to 4 hours a day" applies to
    // every grade, so a band table here would invent a policy nobody set. This
    // is the single place to change it.
    const LEARN_DAILY_MINUTES = 210;
    // Deliberately NOT Wehel's 60. Wehel charges per QUESTION, which is a
    // frequent event; progress events are section completions and navigations,
    // and a learner legitimately reads one section for ten minutes. A 60-second
    // cap would bank one minute of that ten and make the figure meaningless.
    // Five minutes still gives the property that matters: a learner who walks
    // away with the tab open is charged one gap for the absence, not the
    // afternoon.
    const LEARN_IDLE_GAP_SECONDS = 300;
    const MAX_TUTORING_SESSIONS = 20;

    /**
     * The stored shape of a tutoring help session, from an untrusted client
     * payload. Whitelist only: a field this does not name does not exist,
     * which is what keeps a session structurally incapable of smuggling a
     * score — the record carries COUNTS (3 of 5 right), and turning counts
     * into a grade is a decision no client gets to make. Counts are clamped
     * into their totals the way sanitise_attempted() clamps answered, and a
     * payload with neither a topic nor a summary is noise, not a session.
     */
    private static function sanitise_tutoring_session($ev): ?array {
        if (!is_array($ev)) {
            return null;
        }
        // Plain mb_substr, not core_text: this method runs inside
        // check-progress-attempted.php's minimal harness, which loads the real
        // class without Moodle's core — a dependency here is a dependency the
        // gate has to fake, and a gate running against fakes proves less.
        $text = static function ($v, int $max): string {
            if (!is_scalar($v)) {
                return '';
            }
            $s = trim((string)$v);
            return function_exists('mb_substr') ? mb_substr($s, 0, $max) : substr($s, 0, $max);
        };
        $count = static function ($v, int $cap = 50): int {
            return max(0, min($cap, (int)(is_scalar($v) ? $v : 0)));
        };
        $topic = $text($ev['topic'] ?? '', 200);
        $summary = $text($ev['summary'] ?? '', 2000);
        if ($topic === '' && $summary === '') {
            return null;
        }
        $beforetotal = $count($ev['beforeTotal'] ?? 0);
        $aftertotal = $count($ev['afterTotal'] ?? 0);
        $practicetotal = $count($ev['practiceTotal'] ?? 0);
        return [
            'topic' => $topic,
            'query' => $text($ev['query'] ?? '', 120),
            'stage' => $count($ev['stage'] ?? 0, 12),
            'unit' => $count($ev['unit'] ?? 0, 99),
            'unitTitle' => $text($ev['unitTitle'] ?? '', 200),
            'scored' => !empty($ev['scored']),
            'before' => min($count($ev['before'] ?? 0), $beforetotal),
            'beforeTotal' => $beforetotal,
            'after' => min($count($ev['after'] ?? 0), $aftertotal),
            'afterTotal' => $aftertotal,
            'attempted' => $count($ev['attempted'] ?? 0),
            'practiceRight' => min($count($ev['practiceRight'] ?? 0), $practicetotal),
            'practiceTotal' => $practicetotal,
            'startedAt' => $text($ev['startedAt'] ?? '', 32),
            'finishedAt' => $text($ev['finishedAt'] ?? '', 32),
            'summary' => $summary,
        ];
    }

    /** Cap on how many sections one `attempted` map may carry. See sanitise_attempted(). */
    const MAX_ATTEMPTED_SECTIONS = 20;

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
            // Written-answer counts, {section: {answered, total}}. stdClass, not
            // [], so an untouched unit encodes as {} rather than a JSON array —
            // same reason checkpoints and drafts above are objects.
            'attempted' => new stdClass(),
            'completed' => false,
            '_lastAt' => '',
            '_appliedIds' => [],
            // WHEN work happened, which nothing else in this document records.
            // sectionsDone is an append-ordered list of ids and checkpoints is a
            // map — both say WHAT a learner has done and neither says when, so
            // "how much did this child do in the last 15 minutes" was
            // underivable and the live group board could only show running
            // totals. A bounded ring of [timestamp, kind, section] answers it
            // without a second table: 's' a section completed, 'c' a checkpoint
            // scored.
            //
            // Stamped with the SERVER's clock, not the event's own `at`. The
            // board's headline (minutes quiet) comes from the row's
            // timemodified, also server-side, and two numbers on one tile drawn
            // from different clocks disagree the moment a learner's device is
            // skewed — "4 done this cycle" beside "quiet for 20 minutes" is the
            // shape of that bug. The cost is that work queued offline is
            // stamped when it arrives rather than when it happened; that is the
            // honest reading of "we learned of it now", and it matches what the
            // teacher can act on.
            '_activity' => [],
            // When recording STARTED for this unit, so a board can tell "no
            // work this cycle" from "we were not counting yet". Without it
            // every unit reads 0 for the first cycle after this ships, which is
            // a false negative pointing a teacher at a learner who is fine.
            '_activitySince' => 0,
        ];
    }

    /**
     * Written-answer counts off a progress.summary: {section: {answered, total}}.
     *
     * Global Perspectives is the only sender. Its 315 assessment questions are
     * all self-marked free text, so it has no score to report and sends how much
     * was WRITTEN instead — a count, never a percentage, and deliberately not a
     * pass flag. It must not reach the gradebook: push_gradebook() is driven by
     * checkpoint.result and nothing here feeds it.
     *
     * Sanitised rather than stored as it arrives, because this lands in
     * statejson and two portals render it. A client is not trusted to bound its
     * own payload: section names are restricted, counts are cast and clamped,
     * and the map is capped. `answered` is clamped to `total` so nothing
     * downstream can be handed a figure that reads as more than everything.
     * A section claiming no questions is dropped — the app already omits those,
     * so seeing one means the payload is wrong rather than merely empty.
     */
    private static function sanitise_attempted($raw): array {
        if (!is_array($raw)) {
            return [];
        }
        $out = [];
        foreach ($raw as $section => $counts) {
            if (count($out) >= self::MAX_ATTEMPTED_SECTIONS) {
                break;
            }
            $section = (string)$section;
            if (!preg_match('/^[a-z0-9][a-z0-9_-]{0,39}$/i', $section) || !is_array($counts)) {
                continue;
            }
            $total = max(0, (int)($counts['total'] ?? 0));
            if ($total <= 0) {
                continue;
            }
            $out[$section] = [
                'answered' => min(max(0, (int)($counts['answered'] ?? 0)), $total),
                'total' => $total,
            ];
        }
        return $out;
    }

    /** Apply one event onto a unit-state array. Returns [changed, isDurable]. */
    private static function apply_event(array &$state, array $ev): array {
        $type = $ev['type'] ?? '';
        $durable = in_array($type, ['checkpoint.result', 'unit.completed', 'capstone.submitted', 'section.completed', 'tutoring.session'], true);
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
                    self::record_activity($state, 's', (string)$ev['section']);
                }
                break;
            case 'checkpoint.result':
                $checkpoints[$ev['section'] ?? '_'] = [
                    'score' => isset($ev['score']) ? (int)$ev['score'] : null,
                    'passed' => !empty($ev['passed']),
                    'attempt' => isset($ev['attempt']) ? (int)$ev['attempt'] : 1,
                ];
                self::record_activity($state, 'c', (string)($ev['section'] ?? '_'));
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
                            // A section can reach the server through a summary
                            // alone — the durable section.completed is dropped
                            // when a tab closes before it flushes, and the next
                            // summary carries it. Recording only the durable
                            // event would undercount exactly the learner whose
                            // connection is worst.
                            self::record_activity($state, 's', (string)$s);
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
                // Whole-map last-write-wins, like xp and knownWords: the sender
                // always reports every written section it has, so a partial
                // merge would strand a section the learner has since cleared.
                // Out-of-order summaries are already dropped by the _lastAt
                // guard at the top of this method, so this cannot go backwards.
                if (array_key_exists('attempted', $ev)) {
                    $attempted = self::sanitise_attempted($ev['attempted']);
                    if ($attempted) {
                        $state['attempted'] = $attempted;
                    }
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
            case 'tutoring.session':
                // A finished help session of the tutoring-support category —
                // the record a parent's report and a human-tutor handoff read.
                // Only the sanitiser's whitelist is stored (counts, never a
                // percentage — the session may be the unscored attempted-only
                // kind), idempotent by event id like every durable event, and
                // capped so one enthusiastic learner cannot grow the row
                // without bound.
                $session = self::sanitise_tutoring_session($ev);
                if ($session === null) {
                    return [false, false];
                }
                $sessions = isset($state['tutoringSessions']) && is_array($state['tutoringSessions']) ? $state['tutoringSessions'] : [];
                $sessions[] = $session;
                if (count($sessions) > self::MAX_TUTORING_SESSIONS) {
                    $sessions = array_slice($sessions, -self::MAX_TUTORING_SESSIONS);
                }
                $state['tutoringSessions'] = $sessions;
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

    /**
     * Append one [timestamp, kind, section] to the unit's activity ring.
     *
     * Called only where the state actually CHANGED — a section already in
     * sectionsDone records nothing, so re-opening a finished section is not
     * counted as work and a replayed durable event cannot inflate the ring
     * (apply_event returns early on a duplicate id before reaching here).
     */
    private static function record_activity(array &$state, string $kind, string $section): void {
        if (!isset($state['_activity']) || !is_array($state['_activity'])) {
            $state['_activity'] = [];
        }
        $now = time();
        if (empty($state['_activitySince'])) {
            $state['_activitySince'] = $now;
        }
        $state['_activity'][] = [$now, $kind, mb_substr($section, 0, 60)];
        if (count($state['_activity']) > self::MAX_ACTIVITY) {
            $state['_activity'] = array_slice($state['_activity'], -self::MAX_ACTIVITY);
        }
    }

    /** Strip internal bookkeeping keys before returning state to a client. */
    private static function public_state(array $state): array {
        unset($state['_lastAt'], $state['_appliedIds'], $state['_activity'], $state['_activitySince']);
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
    /**
     * Charge the learner's day, in wall-clock seconds between their OWN reports.
     *
     * Same shape and the same reasons as the Wehel ledger it is modelled on: a
     * user preference rather than a table (no schema, survives sessions, resets
     * itself at midnight), and time derived server-side from timestamps rather
     * than from anything the client claims about itself.
     *
     * `YYYYMMDD|used|last`. The first report of the day charges nothing, because
     * there is no gap to charge yet.
     *
     * WHAT IT MEASURES IS A FLOOR, and the board must say so. A learner reading
     * one long section reports nothing until they move, so any stretch longer
     * than LEARN_IDLE_GAP_SECONDS is charged at the cap. Time used is therefore
     * never overstated and time REMAINING is never understated -- the safe
     * direction for a figure a teacher reads as "this child still has work in
     * them", since it errs toward keeping them working rather than sending them
     * away early.
     */
    private static function charge_learning_time(int $userid): void {
        if ($userid <= 0) {
            return;
        }
        // NEVER let this break an ingest. This runs on the path every learner's
        // progress takes, ahead of the schema guard, so an exception here would
        // stop progress saving platform-wide -- and it would do so to maintain a
        // supervision figure, which is not worth one learner's lost work, let
        // alone everyone's. set_user_preference() throws on a user record it
        // cannot resolve, and the ingest's own caller has already decided the
        // token is good; this is the difference between those two judgements.
        //
        // Same rule the app applies to its own emit path ("never break the
        // lesson"). A dropped charge costs the board a few minutes of accuracy
        // on one tile.
        try {
            $today = date('Ymd');
            $now = time();
            $ledger = explode('|', (string)get_user_preferences('local_prequran_learn_time', '', $userid));
            $sameday = ($ledger[0] ?? '') === $today;
            $used = $sameday ? max(0, (int)($ledger[1] ?? 0)) : 0;
            $last = $sameday ? max(0, (int)($ledger[2] ?? 0)) : 0;
            if ($last > 0 && $now > $last) {
                $used += min($now - $last, self::LEARN_IDLE_GAP_SECONDS);
            }
            set_user_preference('local_prequran_learn_time', $today . '|' . $used . '|' . $now, $userid);
        } catch (Throwable $e) {
            // Deliberately silent: there is no learner-visible consequence and
            // nothing here is worth a log line on every failed ingest.
            return;
        }
    }

    public static function ingest_events(int $userid, string $coursekey, array $events, string $env): array {
        global $DB;
        $env = self::normalise_env($env);

        // Charged BEFORE the work and outside the schema guard, for the reason
        // the Wehel clock is written before its API call: the learner spent
        // that time whether or not this batch could be stored.
        self::charge_learning_time($userid);

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
