<?php
declare(strict_types=1);

// Live group board — the query library.
//
// One live teacher runs two groups of nine out of phase: while one group is
// taught, the other works in the app unsupervised by a human. This assembles
// what the teacher needs to glance at on entering each room — who has stopped
// moving, who left the page, who is burning their tutor allowance.
//
// It is READ-ONLY and derives everything from signals other parts of the
// platform already write. Nothing here is a new measurement:
//
//   local_prequran_progress      the reduced unit state the app's gateway
//                                ingests. timemodified is the heartbeat: it is
//                                rewritten on every POST for that unit, so it
//                                answers "when did this learner last report
//                                anything", which is the board's headline.
//   local_prequran_live_audit    course_focus_break / course_left_early, from
//                                course_focus_event.php. Timestamped, so these
//                                are the only signals that can be windowed.
//   local_hubredirect_wehel_time the AI tutor's daily ledger, a user preference
//                                shaped "YYYYMMDD|used|last|tokens|weighted".
//   local_prequran_class_group   the groups themselves; max_students already
//   local_prequran_group_member  defaults to 9, and studentid is a Moodle
//                                userid (gm.studentid = sp.userid).
//
// TWO LIMITS ARE STRUCTURAL, and the UI must not imply otherwise.
//
// 1. The progress document is REDUCED, and per-block counts needed the gateway
//    to record event times before they could exist. It now does:
//    externallib_progress.php keeps `_activity`, a bounded ring of
//    [timestamp, kind, section] appended only where the state actually changed.
//    sectionsDone and checkpoints still carry no times of their own — they say
//    WHAT, the ring says WHEN — so a count must come from the ring and never
//    from their length.
//
//    The ring starts when that unit first records something, which is why
//    `_activitySince` exists and why this file carries a `covered` flag
//    through to the tile. A window that opened before counting began can only
//    report "at least N", and reporting a bare 0 there would point a teacher
//    at a learner who is fine.
//
// 2. Wehel is reported as minutes USED, never minutes left. The daily
//    allowance is a spec held byte-equal across wehel_chat.php,
//    shell/wehel.js and tools/lib/wehel-dev-chat.js by check:wehel-contract,
//    and a fourth copy here would be a copy that gate cannot see. `used` comes
//    straight out of the ledger and needs no band table.
//
// Requires: local/hubredirect/accesslib.php loaded first.

defined('MOODLE_INTERNAL') || die();

define('PQLGB_STALE_WARN_SECONDS', 6 * 60);
define('PQLGB_STALE_ALERT_SECONDS', 12 * 60);
define('PQLGB_DEFAULT_WINDOW_MINUTES', 40);

// How recently a learner must have asked Wehel something to read as IN it
// right now. Deliberately longer than one exchange: a learner reads a reply,
// thinks, and types again, and a window shorter than that would flicker the
// flag off between every question. It is presence, not activity.
define('PQLGB_WEHEL_LIVE_SECONDS', 180);

// The learner's daily target, MIRRORED from local_prequran's own
// LEARN_DAILY_MINUTES. A board is a read-only surface, so this copy can only
// ever be wrong in the display -- but a second number that disagrees with the
// one being enforced is exactly the Wehel-timer failure this repo already
// records, so pqlgb_learn_daily_minutes() reads the real constant when the
// class is loadable and falls back to this only if it is not.
define('PQLGB_LEARN_DAILY_MINUTES_FALLBACK', 210);

function pqlgb_table_exists(string $table): bool {
    global $DB;
    try {
        return $DB->get_manager()->table_exists($table);
    } catch (Throwable $e) {
        return false;
    }
}

function pqlgb_table_has_field(string $table, string $field): bool {
    global $DB;
    if (!pqlgb_table_exists($table)) {
        return false;
    }
    try {
        return array_key_exists($field, $DB->get_columns($table));
    } catch (Throwable $e) {
        return false;
    }
}

/**
 * The board needs the groups and their members. Everything else degrades to a
 * blank column rather than an error, so those two are the only hard schema
 * requirement.
 */
function pqlgb_schema_ready(): bool {
    return pqlgb_table_exists('local_prequran_class_group')
        && pqlgb_table_exists('local_prequran_group_member');
}

function pqlgb_window_choices(): array {
    return [15 => 'Last 15 min', 40 => 'This cycle (40 min)', 240 => 'Today so far'];
}

function pqlgb_clean_window(int $minutes): int {
    $choices = pqlgb_window_choices();
    return isset($choices[$minutes]) ? $minutes : PQLGB_DEFAULT_WINDOW_MINUTES;
}

function pqlgb_clean_env(string $env): string {
    $env = strtolower(trim($env));
    return in_array($env, ['production', 'staging', 'integration'], true) ? $env : 'production';
}

/**
 * The active class groups this teacher runs. teacherid on class_group is a
 * Moodle userid (live_grouping.php writes $teacher->userid into it).
 */
function pqlgb_teacher_groups(int $teacherid, int $workspaceid): array {
    global $DB;
    if ($teacherid <= 0 || !pqlgb_table_exists('local_prequran_class_group')) {
        return [];
    }
    $where = 'teacherid = :teacherid';
    $params = ['teacherid' => $teacherid];
    if (pqlgb_table_has_field('local_prequran_class_group', 'status')) {
        $where .= " AND status <> 'archived'";
    }
    if ($workspaceid > 0 && pqlgb_table_has_field('local_prequran_class_group', 'workspaceid')) {
        $where .= ' AND workspaceid = :workspaceid';
        $params['workspaceid'] = $workspaceid;
    }
    try {
        return $DB->get_records_select('local_prequran_class_group', $where, $params, 'title ASC, id ASC');
    } catch (Throwable $e) {
        return [];
    }
}

/**
 * groupid => [userid, ...] for the active assignments only. A withdrawn learner
 * stays in the table with assignment_status set away from 'active'; showing
 * them would put a permanently quiet tile on the board.
 */
function pqlgb_group_roster(array $groupids): array {
    global $DB;
    $roster = [];
    if (!$groupids || !pqlgb_table_exists('local_prequran_group_member')) {
        return $roster;
    }
    [$insql, $params] = $DB->get_in_or_equal($groupids, SQL_PARAMS_NAMED, 'grp');
    try {
        $rows = $DB->get_records_select('local_prequran_group_member',
            "groupid $insql AND assignment_status = 'active'", $params, 'id ASC', 'id, groupid, studentid');
    } catch (Throwable $e) {
        return $roster;
    }
    foreach ($rows as $row) {
        $userid = (int)$row->studentid;
        if ($userid > 0) {
            $roster[(int)$row->groupid][] = $userid;
        }
    }
    return $roster;
}

/**
 * The teachers a manager can open a board for: userid => name.
 *
 * DERIVED, never a list of everyone with a teacher role. Only teachers who
 * actually OWN at least one non-archived group in this workspace are offered,
 * because a picker entry that opens an empty board is a dead end — the same
 * defect the tutoring section picker had when it offered Books with no topics
 * behind it. Offered here means "picking this shows you something".
 *
 * Returns [] for a manager of a workspace where nobody owns a group, which is
 * the honest answer: there is no board to look at yet.
 */
function pqlgb_board_teachers(int $workspaceid): array {
    global $DB;
    if (!pqlgb_table_exists('local_prequran_class_group')) {
        return [];
    }
    $where = 'cg.teacherid > 0';
    $params = [];
    if (pqlgb_table_has_field('local_prequran_class_group', 'status')) {
        $where .= " AND cg.status <> 'archived'";
    }
    if ($workspaceid > 0 && pqlgb_table_has_field('local_prequran_class_group', 'workspaceid')) {
        $where .= ' AND cg.workspaceid = :workspaceid';
        $params['workspaceid'] = $workspaceid;
    }
    try {
        $rows = $DB->get_records_sql(
            "SELECT cg.teacherid, COUNT(DISTINCT cg.id) AS groups,
                    u.firstname, u.lastname, u.firstnamephonetic, u.lastnamephonetic,
                    u.middlename, u.alternatename
               FROM {local_prequran_class_group} cg
               JOIN {user} u ON u.id = cg.teacherid AND u.deleted = 0
              WHERE $where
           GROUP BY cg.teacherid, u.firstname, u.lastname, u.firstnamephonetic,
                    u.lastnamephonetic, u.middlename, u.alternatename
           ORDER BY u.firstname ASC, u.lastname ASC",
            $params
        );
    } catch (Throwable $e) {
        return [];
    }
    $teachers = [];
    foreach ($rows as $row) {
        $teachers[(int)$row->teacherid] = fullname($row)
            . ' (' . (int)$row->groups . ' group' . ((int)$row->groups === 1 ? '' : 's') . ')';
    }
    return $teachers;
}

function pqlgb_learner_names(array $userids): array {
    global $DB;
    $names = [];
    if (!$userids) {
        return $names;
    }
    [$insql, $params] = $DB->get_in_or_equal($userids, SQL_PARAMS_NAMED, 'usr');
    // fullname() reads the phonetic/middle/alternate fields too, so they have
    // to be selected even though the board only ever prints the result.
    $fields = 'id, firstname, lastname, firstnamephonetic, lastnamephonetic, middlename, alternatename';
    try {
        $users = $DB->get_records_select('user', "id $insql", $params, '', $fields);
    } catch (Throwable $e) {
        return $names;
    }
    foreach ($users as $user) {
        $names[(int)$user->id] = fullname($user);
    }
    return $names;
}

function pqlgb_initials(string $name): string {
    $parts = preg_split('/\s+/', trim($name)) ?: [];
    $letters = '';
    foreach ($parts as $part) {
        if ($part !== '') {
            $letters .= mb_strtoupper(mb_substr($part, 0, 1));
        }
        if (mb_strlen($letters) >= 2) {
            break;
        }
    }
    return $letters !== '' ? $letters : '?';
}

/**
 * Subject label and stage off the coursekey, reusing the gateway's own parser
 * rather than a second regex. Returns [label, stage] and falls back to the raw
 * key so an unrecognised course still names itself on the tile.
 */
function pqlgb_course_label(string $coursekey): array {
    if (preg_match('/^ehel-([a-z-]+)-([gl])(\d{2})$/', $coursekey, $m)) {
        $map = function_exists('pqpg_ehel_subject_map') ? pqpg_ehel_subject_map() : [];
        $subject = $map[$m[1]] ?? null;
        if ($subject) {
            $word = $m[2] === 'l' ? 'Level' : ucfirst((string)$subject['param']);
            return [(string)$subject['label'], $word . ' ' . (int)$m[3]];
        }
    }
    return [$coursekey !== '' ? $coursekey : 'Unknown course', ''];
}

/**
 * One snapshot per learner, taken from the unit row they touched most recently.
 *
 * "Most recently" is by timemodified, which the gateway rewrites on every
 * ingest for that unit — so it tracks the unit the learner is actually working
 * in, not the furthest one they have ever opened.
 */
function pqlgb_progress_snapshot(array $userids, string $env, int $since = 0): array {
    global $DB;
    $snapshot = [];
    if (!$userids || !pqlgb_table_exists('local_prequran_progress')) {
        return $snapshot;
    }
    [$insql, $params] = $DB->get_in_or_equal($userids, SQL_PARAMS_NAMED, 'usr');
    $params['env'] = $env;
    try {
        $rows = $DB->get_records_select('local_prequran_progress',
            "userid $insql AND environment = :env", $params, 'timemodified ASC');
    } catch (Throwable $e) {
        return $snapshot;
    }

    foreach ($rows as $row) {
        $userid = (int)$row->userid;
        $state = json_decode((string)$row->statejson, true);
        $state = is_array($state) ? $state : [];
        $sections = isset($state['sectionsDone']) && is_array($state['sectionsDone']) ? $state['sectionsDone'] : [];

        if (!isset($snapshot[$userid])) {
            $snapshot[$userid] = [
                'lastprogress' => 0,
                'coursekey' => '',
                'unit' => '',
                'sectionsdone' => 0,
                'lastsection' => '',
                'resumedone' => false,
                'resumelabel' => '',
                // Where the learner IS, as opposed to what they last finished.
                // Emitted by the shared shell on navigation; empty for any
                // learner whose app predates that, which the board reports as
                // unknown rather than falling back to lastsection -- those are
                // different claims and only one of them was measured.
                'resume' => '',
                'unitscompleted' => 0,
                'checkpoint' => null,
                // Counted across ALL of the learner's units, not just the one
                // they are in now: a learner who finishes a unit mid-cycle and
                // opens the next one did that work in this block too.
                'donewindow' => 0,
                'quizwindow' => 0,
                'countingsince' => 0,
            ];
        }

        // The ring is internal to the reducer (public_state strips it), and the
        // board reads statejson straight from the row, so it is visible here
        // and never to the app.
        if ($since > 0 && !empty($state['_activity']) && is_array($state['_activity'])) {
            foreach ($state['_activity'] as $entry) {
                if (!is_array($entry) || count($entry) < 2 || (int)$entry[0] < $since) {
                    continue;
                }
                if ((string)$entry[1] === 'c') {
                    $snapshot[$userid]['quizwindow']++;
                } else {
                    $snapshot[$userid]['donewindow']++;
                }
            }
        }
        $startedat = (int)($state['_activitySince'] ?? 0);
        if ($startedat > 0) {
            // The EARLIEST across their units — the window is only fully
            // covered if counting had begun everywhere before it opened.
            $snapshot[$userid]['countingsince'] = $snapshot[$userid]['countingsince'] > 0
                ? max($snapshot[$userid]['countingsince'], $startedat)
                : $startedat;
        }
        if ((int)$row->timemodified >= $snapshot[$userid]['lastprogress']) {
            // Rows are ordered by timemodified, so the last one to land here is
            // the learner's current unit.
            $snapshot[$userid]['lastprogress'] = (int)$row->timemodified;
            $snapshot[$userid]['coursekey'] = (string)$row->coursekey;
            $snapshot[$userid]['unit'] = (string)$row->unit;
            $snapshot[$userid]['sectionsdone'] = count($sections);
            $snapshot[$userid]['lastsection'] = $sections ? (string)end($sections) : '';
            // Taken from the SAME unit as lastsection, inside this branch, so
            // the two always describe one unit. Read outside it, a learner with
            // two units on the go would show a section from one beside a unit
            // name from the other.
            $snapshot[$userid]['resume'] = is_string($state['resume'] ?? null)
                ? (string)$state['resume'] : '';
            // Prefer the caption the learner is actually looking at. English's
            // `dictionary` route is titled "Vocabulary" on their screen, so a
            // tile printing the id names a section the teacher cannot find --
            // it reads as a stale board even when the position is correct.
            // Falls back to the id for any app that predates sending it.
            $snapshot[$userid]['resumelabel'] = is_string($state['resumeLabel'] ?? null)
                && $state['resumeLabel'] !== ''
                ? (string)$state['resumeLabel']
                : $snapshot[$userid]['resume'];
            // WORKING ON IT, or JUST FINISHED IT. `resume` alone cannot say:
            // it is only a position, so a learner who completes a section and
            // has not yet moved reads identically to one still labouring in it,
            // and those call for opposite responses from a teacher. The
            // completed list is already here, so the answer is a lookup rather
            // than anything new on the wire.
            $snapshot[$userid]['resumedone'] = $snapshot[$userid]['resume'] !== ''
                && in_array($snapshot[$userid]['resume'], $sections, true);
            $snapshot[$userid]['checkpoint'] = pqlgb_weakest_checkpoint($state);
        }
        if (!empty($state['completed'])) {
            $snapshot[$userid]['unitscompleted']++;
        }
    }
    return $snapshot;
}

/**
 * The checkpoint worth showing is the one the learner did WORST on, because a
 * tile has room for one number and that is the one that asks for a
 * conversation. There are no timestamps in the checkpoints map, so "latest"
 * is not available to prefer instead.
 */
function pqlgb_weakest_checkpoint(array $state): ?array {
    $checkpoints = isset($state['checkpoints']) ? (array)$state['checkpoints'] : [];
    $weakest = null;
    foreach ($checkpoints as $section => $result) {
        $result = (array)$result;
        if (!isset($result['score']) || $result['score'] === null) {
            continue;
        }
        $score = (int)$result['score'];
        if ($weakest === null || $score < $weakest['score']) {
            $weakest = [
                'section' => (string)$section,
                'score' => $score,
                'passed' => !empty($result['passed']),
            ];
        }
    }
    return $weakest;
}

/**
 * Focus breaks and early departures inside the window, plus the most recent
 * audit timestamp of any kind.
 *
 * This is the only windowed signal on the board, because live_audit rows carry
 * their own timecreated. It is EVIDENCE, not prevention — a web page can report
 * that a learner left it and cannot stop them.
 */
function pqlgb_focus_signals(array $userids, int $since): array {
    global $DB;
    $signals = [];
    if (!$userids || !pqlgb_table_exists('local_prequran_live_audit')) {
        return $signals;
    }
    [$insql, $params] = $DB->get_in_or_equal($userids, SQL_PARAMS_NAMED, 'usr');
    $params['since'] = $since;
    try {
        $rows = $DB->get_records_select('local_prequran_live_audit',
            "actorid $insql AND timecreated >= :since AND action IN ('course_focus_break', 'course_left_early')",
            $params, 'timecreated ASC', 'id, actorid, action, details, timecreated');
    } catch (Throwable $e) {
        return $signals;
    }
    foreach ($rows as $row) {
        $userid = (int)$row->actorid;
        if (!isset($signals[$userid])) {
            $signals[$userid] = ['breaks' => 0, 'leftearly' => 0, 'reason' => '', 'lastsignal' => 0];
        }
        if ((string)$row->action === 'course_left_early') {
            $signals[$userid]['leftearly']++;
            $details = json_decode((string)$row->details, true);
            if (is_array($details) && !empty($details['reason'])) {
                $signals[$userid]['reason'] = (string)$details['reason'];
            }
        } else {
            $signals[$userid]['breaks']++;
        }
        $signals[$userid]['lastsignal'] = max($signals[$userid]['lastsignal'], (int)$row->timecreated);
    }
    return $signals;
}

/**
 * Minutes of AI tutor used TODAY, from the ledger preference. Never minutes
 * left — see the header note: the allowance table is a three-way gated spec and
 * this file must not become a fourth copy of it.
 */
/**
 * Wehel, per learner: minutes used today AND whether they are in it right now.
 *
 * Both come out of the same ledger the tutor itself writes
 * (`YYYYMMDD|used|last|tokens|weighted`) -- field 2 is seconds charged today,
 * field 3 is the timestamp of their last question. Presence is therefore
 * derived from the tutor's own record of being asked something, not from a
 * second signal that could disagree with it.
 *
 * Minutes are reported as USED, never as remaining: the allowance is a spec
 * held byte-equal across three files by check:wehel-contract, and a fourth copy
 * here would be one that gate cannot see.
 */
function pqlgb_wehel_state(array $userids): array {
    $state = [];
    $today = date('Ymd');
    $now = time();
    foreach ($userids as $userid) {
        $userid = (int)$userid;
        $ledger = explode('|', (string)get_user_preferences('local_hubredirect_wehel_time', '', $userid));
        $sameday = ($ledger[0] ?? '') === $today;
        $last = $sameday ? max(0, (int)($ledger[2] ?? 0)) : 0;
        $state[$userid] = [
            'minutes' => $sameday ? (int)floor(max(0, (int)($ledger[1] ?? 0)) / 60) : 0,
            'last' => $last,
            'live' => $last > 0 && ($now - $last) <= PQLGB_WEHEL_LIVE_SECONDS,
        ];
    }
    return $state;
}

/**
 * The learner's day: seconds banked today, and what remains of the target.
 *
 * Reads `local_prequran_learn_time`, which
 * local_prequran_progress_external::ingest_events() charges on every report the
 * learner's app makes. Read-only here.
 *
 * `used` IS A FLOOR. A learner reading one long section reports nothing until
 * they move, so any stretch beyond the ingest's idle-gap cap is charged at the
 * cap. So `remaining` is a CEILING, and the board must not present it as a
 * countdown to a hard stop -- nothing stops at zero, and nothing should: this
 * is a supervision signal, not an allowance like Wehel's.
 */
function pqlgb_learning_time(array $userids): array {
    $out = [];
    $today = date('Ymd');
    $targetseconds = pqlgb_learn_daily_minutes() * 60;
    foreach ($userids as $userid) {
        $userid = (int)$userid;
        $ledger = explode('|', (string)get_user_preferences('local_prequran_learn_time', '', $userid));
        $sameday = ($ledger[0] ?? '') === $today;
        $used = $sameday ? max(0, (int)($ledger[1] ?? 0)) : 0;
        $out[$userid] = [
            'used' => $used,
            'remaining' => max(0, $targetseconds - $used),
            'target' => $targetseconds,
            // Nothing banked today and no ledger at all are different claims:
            // the first is a learner who has not started, the second is one
            // whose app has never reported since this shipped. Saying "3h 30m
            // left" to both is a confident statement about a day nobody
            // measured -- the same mistake the activity ring's "not counted
            // yet" exists to avoid.
            'counted' => $sameday && ($ledger[2] ?? '') !== '',
        ];
    }
    return $out;
}

/**
 * The daily target, preferring local_prequran's own constant over our fallback,
 * so the board cannot quietly display a different number from the one recorded.
 */
function pqlgb_learn_daily_minutes(): int {
    if (class_exists('local_prequran_progress_external')
            && defined('local_prequran_progress_external::LEARN_DAILY_MINUTES')) {
        return (int)constant('local_prequran_progress_external::LEARN_DAILY_MINUTES');
    }
    return PQLGB_LEARN_DAILY_MINUTES_FALLBACK;
}

/**
 * Is this learner in an active class group with a teacher on it?
 *
 * Decides whether the app mounts a Raise hand button at all. A tutoring learner
 * working alone at nine at night has nobody on the other end, and a button that
 * cannot reach anyone is worse than no button — the child waits instead of
 * trying Wehel or the worked example.
 */
function pqlgb_learner_is_watched(int $userid): bool {
    global $DB;
    if ($userid <= 0 || !pqlgb_schema_ready()) {
        return false;
    }
    $where = 'gm.studentid = :userid AND gm.assignment_status = :active AND cg.teacherid > 0';
    if (pqlgb_table_has_field('local_prequran_class_group', 'status')) {
        $where .= " AND cg.status <> 'archived'";
    }
    try {
        return $DB->record_exists_sql(
            "SELECT 1
               FROM {local_prequran_group_member} gm
               JOIN {local_prequran_class_group} cg ON cg.id = gm.groupid
              WHERE $where",
            ['userid' => $userid, 'active' => 'active']
        );
    } catch (Throwable $e) {
        return false;
    }
}

/**
 * userid => ['up' => bool, 'since' => ts, 'by' => teacherid].
 *
 * The hand is the LATEST of course_hand_raised / course_hand_lowered, and it is
 * deliberately NOT windowed the way focus breaks are: a hand raised twenty
 * minutes ago is still up, and a window would quietly drop the learner who has
 * been waiting longest — the exact person the board exists to surface.
 *
 * Bounded to the last 24 hours so the query cannot walk the whole audit table,
 * and because a hand still up from yesterday is a stale row rather than a child
 * with their arm in the air.
 */
function pqlgb_hand_state(array $userids): array {
    global $DB;
    $hands = [];
    if (!$userids || !pqlgb_table_exists('local_prequran_live_audit')) {
        return $hands;
    }
    [$insql, $params] = $DB->get_in_or_equal($userids, SQL_PARAMS_NAMED, 'usr');
    $params['since'] = time() - DAYSECS;
    try {
        $rows = $DB->get_records_select('local_prequran_live_audit',
            "actorid $insql AND timecreated >= :since AND action IN ('course_hand_raised', 'course_hand_lowered')",
            $params, 'timecreated ASC, id ASC', 'id, actorid, action, details, timecreated');
    } catch (Throwable $e) {
        return $hands;
    }
    foreach ($rows as $row) {
        $details = json_decode((string)$row->details, true);
        $hands[(int)$row->actorid] = [
            'up' => (string)$row->action === 'course_hand_raised',
            'since' => (int)$row->timecreated,
            'by' => is_array($details) ? (int)($details['by'] ?? 0) : 0,
        ];
    }
    return $hands;
}

/**
 * The teacher answering a hand from the board. Written with the LEARNER as
 * actorid so pqlgb_hand_state() stays a single-actor query, and the teacher
 * recorded in details instead.
 */
function pqlgb_lower_hand(int $userid, int $teacherid): bool {
    global $DB;
    if ($userid <= 0 || !pqlgb_table_exists('local_prequran_live_audit')) {
        return false;
    }
    $state = pqlgb_hand_state([$userid])[$userid] ?? ['up' => false];
    if (empty($state['up'])) {
        return true; // Already down; answering twice is not an error.
    }
    try {
        $DB->insert_record('local_prequran_live_audit', (object)[
            'sessionid' => 0,
            'actorid' => $userid,
            'action' => 'course_hand_lowered',
            'targettype' => 'course_hand',
            'targetid' => 0,
            'details' => json_encode(['by' => $teacherid], JSON_UNESCAPED_SLASHES),
            'timecreated' => time(),
        ]);
        return true;
    } catch (Throwable $e) {
        return false;
    }
}

function pqlgb_state_for(int $quietseconds, bool $hasprogress): string {
    if (!$hasprogress) {
        return 'nodata';
    }
    if ($quietseconds >= PQLGB_STALE_ALERT_SECONDS) {
        return 'alert';
    }
    if ($quietseconds >= PQLGB_STALE_WARN_SECONDS) {
        return 'warn';
    }
    return 'ok';
}

/**
 * The whole board: two (or more) groups, each a list of learner tiles sorted
 * with the quietest first.
 *
 * The sort is the point. A learner who has reported nothing for twelve minutes
 * is the one to look at, and that single ordering catches three different
 * problems the teacher cannot tell apart from the other room — stuck, gone, and
 * disconnected.
 */
/**
 * groupid => the session "Go live" should open, or null.
 *
 * The administrator schedules the classes (recurring, via the wizard, which
 * stamps groupid on every session it creates) and the teacher's job is to
 * START the one that is due -- so this prefers the session whose window covers
 * now, else the next one still to come TODAY. Tomorrow's class is not offered:
 * a Go live button that opens something twenty hours early reads as the wrong
 * class, and the create-now fallback covers the genuinely unscheduled day.
 *
 * Not filtered by teacherid: the group's class is the group's class, and the
 * join action enforces who may enter far more carefully than this lookup
 * could. Dead statuses are excluded so a cancelled class does not eat the slot
 * of the replacement scheduled beside it.
 */
function pqlgb_group_next_session(array $groupids): array {
    global $DB;
    $out = [];
    if (!$groupids || !pqlgb_table_exists('local_prequran_live_session')
            || !pqlgb_table_has_field('local_prequran_live_session', 'groupid')) {
        return $out;
    }
    $now = time();
    $endofday = $now + DAYSECS;
    // THE JOIN'S OWN CONFIG, not constants. The first version hardcoded a
    // ten-minute lead and the owner's first real class caught it: the pill
    // said "Join class" while live_sessions.php said "outside the student
    // join window" -- two rules for one fact. These are the exact values and
    // the exact expression the join action denies on, so the pill and the
    // door cannot disagree again.
    $before = ((int)get_config('local_prequran', 'bbb_join_window_before_minutes') ?: 10) * MINSECS;
    $after = ((int)get_config('local_prequran', 'bbb_join_window_after_minutes') ?: 15) * MINSECS;
    $hasbbbcreated = pqlgb_table_has_field('local_prequran_live_session', 'bbb_created');
    [$insql, $params] = $DB->get_in_or_equal($groupids, SQL_PARAMS_NAMED, 'lgs');
    try {
        $rows = $DB->get_records_select('local_prequran_live_session',
            // Approval-pending states are excluded too: the join denies them
            // for everyone, so offering one is offering a refusal. And a
            // status='live' session is admitted whatever its scheduled date:
            // the teacher going live on a future-dated (recurring) session is
            // a real class actually running, found on production 2026-08-29 --
            // the room everyone was in was scheduled for two days later and
            // the today-only window made the board blind to it. Bounded by
            // scheduled_end + after like everything else, which is the same
            // boundary the join door itself enforces.
            "groupid $insql
             AND status NOT IN ('cancelled', 'failed', 'rejected', 'completed', 'closed',
                                'pending_institution_approval', 'pending_marketplace_approval')
             AND scheduled_end + :aft > :now AND (scheduled_start < :eod OR status = 'live')",
            array_merge($params, ['aft' => $after, 'now' => $now, 'eod' => $endofday]),
            'scheduled_start ASC',
            'id, groupid, title, scheduled_start, scheduled_end, status, teacherid'
                . ($hasbbbcreated ? ', bbb_created' : ''));
    } catch (Throwable $e) {
        return $out;
    }
    foreach ($rows as $row) {
        $gid = (int)$row->groupid;
        // live_sessions.php's student rule, verbatim in shape: a student is
        // refused when now > end + after, or when the teacher has not started
        // the room AND now < start - before. Teacher-started means bbb_created
        // set and status 'live' -- once the teacher is in, a student may join
        // early.
        $teacherstarted = $hasbbbcreated
            && !empty($row->bbb_created) && (string)$row->status === 'live';
        // Earliest wins -- except that a RUNNING room beats anything merely
        // scheduled: a group with an upcoming slot today AND a live room on a
        // future-dated session must report the room people are actually in.
        if (isset($out[$gid]) && !($teacherstarted && empty($out[$gid]['live']))) {
            continue;
        }
        // A session past its scheduled end is only ON if the room is still
        // live (overtime -- the teacher has not left). The configured
        // after-window (here 180 minutes) keeps the JOIN DOOR open that long,
        // and mirroring it faithfully made the pill say "Join class" three
        // hours after a forty-minute class ended, over a dead room in
        // awaiting_review. The door answers "would you be admitted"; the pill
        // and the board answer "is there a class" -- and an ended class with
        // nobody in the room is not one. Skipped entirely, so the teacher's
        // header falls back to Go live and the child's pill disappears.
        if ($now > (int)$row->scheduled_end && !$teacherstarted) {
            continue;
        }
        $joinable = !($now > ((int)$row->scheduled_end + $after))
            && !(!$teacherstarted && $now < ((int)$row->scheduled_start - $before));
        $out[$gid] = [
            'id' => (int)$row->id,
            'title' => (string)$row->title,
            'start' => (int)$row->scheduled_start,
            'end' => (int)$row->scheduled_end,
            // The teacher's "Start class" lead: they should be in the room
            // BEFORE the join window opens for children. Board-facing only.
            'due' => (int)$row->scheduled_start <= ($now + 10 * MINSECS),
            // The learner's red pill: red ONLY when the join action would say
            // yes right now.
            'joinable' => $joinable,
            // The room is actually running (teacher in). What the board's
            // attendance flags hang off: attendance is only worth showing
            // while there is a class to be in.
            'live' => $teacherstarted,
        ];
    }
    return $out;
}

function pqlgb_build(int $teacherid, int $workspaceid, int $windowminutes, string $env = 'production'): array {
    $now = time();
    $windowminutes = pqlgb_clean_window($windowminutes);
    $env = pqlgb_clean_env($env);
    $since = $now - ($windowminutes * 60);

    $groups = pqlgb_teacher_groups($teacherid, $workspaceid);
    $roster = pqlgb_group_roster(array_map('intval', array_keys($groups)));

    $userids = [];
    foreach ($roster as $members) {
        foreach ($members as $userid) {
            $userids[$userid] = $userid;
        }
    }
    $userids = array_values($userids);

    $names = pqlgb_learner_names($userids);
    $snapshot = pqlgb_progress_snapshot($userids, $env, $since);
    $signals = pqlgb_focus_signals($userids, $since);
    $wehel = pqlgb_wehel_state($userids);
    $learning = pqlgb_learning_time($userids);
    $hands = pqlgb_hand_state($userids);
    $nextsessions = pqlgb_group_next_session(array_map('intval', array_keys($groups)));
    // Who has JOINED each live room, from the attendance rows the join action
    // writes (pql_mark_student_join). JOINED is the measured fact -- BBB does
    // not reliably report leaving -- so the tile says joined-at, never
    // claims "still in". Only queried for rooms that are actually live.
    $liveattendance = [];
    if (pqlgb_table_exists('local_prequran_live_attendance')) {
        foreach ($nextsessions as $gid => $sess) {
            if (empty($sess['live'])) {
                continue;
            }
            try {
                foreach ($DB->get_records('local_prequran_live_attendance',
                        ['sessionid' => (int)$sess['id']], '', 'id, studentid, join_time, leave_time') as $arow) {
                    $liveattendance[$gid][(int)$arow->studentid] = [
                        'joined' => (int)$arow->join_time,
                        'left' => (int)$arow->leave_time,
                    ];
                }
            } catch (Throwable $e) {
                // attendance is decoration on the board; never break the build
            }
        }
    }

    $board = ['generated' => $now, 'window' => $windowminutes, 'env' => $env, 'groups' => [], 'totals' => [
        'learners' => 0, 'quiet' => 0, 'breaks' => 0, 'leftearly' => 0, 'hands' => 0,
        'donewindow' => 0, 'inwehel' => 0,
    ]];

    foreach ($groups as $group) {
        $groupid = (int)$group->id;
        $tiles = [];
        foreach ($roster[$groupid] ?? [] as $userid) {
            $snap = $snapshot[$userid] ?? null;
            $signal = $signals[$userid] ?? ['breaks' => 0, 'leftearly' => 0, 'reason' => '', 'lastsignal' => 0];
            $hand = $hands[$userid] ?? ['up' => false, 'since' => 0];
            $lastprogress = $snap ? (int)$snap['lastprogress'] : 0;
            $quiet = $lastprogress > 0 ? max(0, $now - $lastprogress) : 0;
            $state = pqlgb_state_for($quiet, $lastprogress > 0);
            [$subject, $stage] = pqlgb_course_label($snap ? (string)$snap['coursekey'] : '');

            $tiles[] = [
                'userid' => $userid,
                'name' => $names[$userid] ?? ('User ' . $userid),
                'initials' => pqlgb_initials($names[$userid] ?? ''),
                'state' => $state,
                'quietseconds' => $quiet,
                'lastprogress' => $lastprogress,
                'activeinwindow' => $lastprogress >= $since,
                'subject' => $snap ? $subject : '',
                'stage' => $snap ? $stage : '',
                'unit' => $snap ? (string)$snap['unit'] : '',
                'sectionsdone' => $snap ? (int)$snap['sectionsdone'] : 0,
                'lastsection' => $snap ? (string)$snap['lastsection'] : '',
                'unitscompleted' => $snap ? (int)$snap['unitscompleted'] : 0,
                'checkpoint' => $snap ? $snap['checkpoint'] : null,
                'breaks' => (int)$signal['breaks'],
                'leftearly' => (int)$signal['leftearly'],
                'reason' => (string)$signal['reason'],
                'wehelminutes' => (int)($wehel[$userid]['minutes'] ?? 0),
                'wehellive' => !empty($wehel[$userid]['live']),
                'resume' => $snap ? (string)$snap['resume'] : '',
                'resumedone' => $snap ? !empty($snap['resumedone']) : false,
                'resumelabel' => $snap ? (string)$snap['resumelabel'] : '',
                'learnused' => (int)($learning[$userid]['used'] ?? 0),
                'learnremaining' => (int)($learning[$userid]['remaining'] ?? 0),
                'learntarget' => (int)($learning[$userid]['target'] ?? 0),
                'learncounted' => !empty($learning[$userid]['counted']),
                // null = no live room for this group right now; otherwise the
                // learner's attendance in it (joined 0 = has not joined yet).
                'liveclass' => !empty($nextsessions[$groupid]['live'])
                    ? ($liveattendance[$groupid][$userid] ?? ['joined' => 0, 'left' => 0])
                    : null,
                'handup' => !empty($hand['up']),
                'handsince' => !empty($hand['up']) ? (int)$hand['since'] : 0,
                'donewindow' => $snap ? (int)$snap['donewindow'] : 0,
                'quizwindow' => $snap ? (int)$snap['quizwindow'] : 0,
                // False means the count is a floor, not a total: this unit
                // started recording after the window opened, so the honest
                // reading is "at least N".
                'windowcovered' => $snap && (int)$snap['countingsince'] > 0
                    && (int)$snap['countingsince'] <= $since,
            ];

            $board['totals']['learners']++;
            $board['totals']['breaks'] += (int)$signal['breaks'];
            $board['totals']['leftearly'] += (int)$signal['leftearly'];
            if (!empty($hand['up'])) {
                $board['totals']['hands']++;
            }
            if (!empty($wehel[$userid]['live'])) {
                $board['totals']['inwehel']++;
            }
            $board['totals']['donewindow'] += $snap ? (int)$snap['donewindow'] : 0;
            if ($state === 'alert' || $state === 'warn') {
                $board['totals']['quiet']++;
            }
        }

        // Quietest first, then never-seen, then by name. A learner with no
        // progress row at all sorts under the quiet ones rather than above
        // them: "has not started" is a different conversation from "has
        // stopped", and it is usually a launch problem, not a learner.
        usort($tiles, function ($a, $b) {
            // A raised hand outranks every inferred signal, and it is the one
            // thing on this board the learner said out loud. Staleness is a
            // guess about who needs help; this is a request for it. Longest
            // wait first among them, because the ladder promises the teacher
            // takes them at the swap and the one waiting longest has been
            // through the other three steps already.
            if ($a['handup'] !== $b['handup']) {
                return $a['handup'] ? -1 : 1;
            }
            if ($a['handup'] && $a['handsince'] !== $b['handsince']) {
                return $a['handsince'] <=> $b['handsince'];
            }
            $rank = ['alert' => 0, 'warn' => 1, 'ok' => 2, 'nodata' => 3];
            if ($rank[$a['state']] !== $rank[$b['state']]) {
                return $rank[$a['state']] <=> $rank[$b['state']];
            }
            if ($a['quietseconds'] !== $b['quietseconds']) {
                return $b['quietseconds'] <=> $a['quietseconds'];
            }
            return strcasecmp($a['name'], $b['name']);
        });

        $board['groups'][] = [
            'id' => $groupid,
            'session' => $nextsessions[$groupid] ?? null,
            'title' => (string)($group->title ?? ('Group ' . $groupid)),
            'capacity' => (int)($group->max_students ?? 9),
            'level' => (string)($group->current_level ?? ''),
            'tiles' => $tiles,
        ];
    }

    return $board;
}

function pqlgb_relative_minutes(int $seconds): string {
    if ($seconds < 60) {
        return 'just now';
    }
    $minutes = (int)floor($seconds / 60);
    if ($minutes < 60) {
        return $minutes . ' min';
    }
    $hours = (int)floor($minutes / 60);
    return $hours . 'h ' . ($minutes % 60) . 'm';
}
