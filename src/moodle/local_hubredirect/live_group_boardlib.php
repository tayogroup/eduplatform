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
function pqlgb_wehel_minutes(array $userids): array {
    $minutes = [];
    $today = date('Ymd');
    foreach ($userids as $userid) {
        $userid = (int)$userid;
        $ledger = explode('|', (string)get_user_preferences('local_hubredirect_wehel_time', '', $userid));
        $minutes[$userid] = (($ledger[0] ?? '') === $today) ? (int)floor(max(0, (int)($ledger[1] ?? 0)) / 60) : 0;
    }
    return $minutes;
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
    $wehel = pqlgb_wehel_minutes($userids);
    $hands = pqlgb_hand_state($userids);

    $board = ['generated' => $now, 'window' => $windowminutes, 'env' => $env, 'groups' => [], 'totals' => [
        'learners' => 0, 'quiet' => 0, 'breaks' => 0, 'leftearly' => 0, 'hands' => 0,
        'donewindow' => 0,
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
                'wehelminutes' => (int)($wehel[$userid] ?? 0),
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
