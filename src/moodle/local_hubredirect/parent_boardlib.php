<?php
// Parent board — the query library.
//
// The teacher's live group board answers "who do I go to next" across two
// groups of nine. A parent's question is different and smaller: how are MY
// children doing, and can I say something to their teacher. So this is the
// board's shape with the board's own vocabulary, narrowed to one family.
//
// IT REUSES live_group_boardlib's HELPERS RATHER THAN RESTATING THEM. What
// "quiet" means, how a course key becomes a subject and a stage, how
// participation and words-known are read out of the progress document, what
// counts as this week — all of that has one definition already, and a second
// copy here would be two boards that disagree about the same child. This file
// adds only what is genuinely different: which learners a GUARDIAN may see,
// and a totals row asking a parent's question instead of a teacher's.
//
// WHAT IT DELIBERATELY DOES NOT CARRY: focus breaks. They are on the teacher's
// board and they stay there. For a teacher two rooms away "left the page x4"
// answers who to walk over to; on a parent's screen it is a surveillance
// figure about a child in their own house, it is not reliable as behaviour (a
// blur fires when you call them to dinner), and reporting it home would make
// an opt-in setting adversarial. The child's own typed reason for stopping
// early IS shown, because the child chose to write it.

declare(strict_types=1);
defined('MOODLE_INTERNAL') || die();

require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/live_group_boardlib.php');
require_once(__DIR__ . '/progress_rolluplib.php');
// pqlgb_course_label() turns `ehel-eng-g01` into "English" and "Grade 1" by
// asking pqpg_ehel_subject_map(), and it is written to FALL BACK to the raw
// key when that function is absent rather than fail. So a page that does not
// load the gateway library gets a tile labelled `ehel-eng-g01` and no error -
// which is what this board shipped with. The teacher's board requires it from
// the PAGE; requiring it here means the page and the poll endpoint cannot
// disagree, and a third caller cannot arrive without it.
// $CFG->dirroot, NOT a __DIR__-relative hop to a sibling directory. The REPO
// nests these plugins as src/moodle/local_prequran and
// src/moodle/local_hubredirect; every SERVER nests them as local/prequran and
// local/hubredirect, without the prefix. A relative hop between them therefore
// resolves on a developer's machine and on no install anywhere — which is what
// shipped on 2026-09-08, and the check meant to catch it was a realpath()
// against the repo: a true fact about the wrong filesystem. It fails at
// RUNTIME, not at php -l, because a require path is resolved when the line
// runs. check-php-syntax.mjs now refuses that shape across the repo.
// Cross-plugin requires go through dirroot, the way the teacher's board does.
global $CFG;
require_once($CFG->dirroot . '/local/prequran/progress_gatewaylib.php');

/** How far back "working now" looks, in seconds. The board's own warn line. */
const PQPB_ACTIVE_SECONDS = 360;

/**
 * The children a guardian may see, as user ids.
 *
 * ONE DEFINITION, shared with parent_teacher_chat.php, which authorises the
 * family's side of the chat by exactly this question. Two copies of "who is
 * this person's child" is the kind of drift that ends with one surface showing
 * a family a child and another refusing to talk about them.
 *
 * The two links are the ones workspace_parent.php already uses: a consent row
 * naming the guardian, or an existing parent participant row on a thread about
 * the child.
 */
function pqpb_parent_children(int $parentid): array {
    global $DB;
    $ids = [];
    if ($parentid <= 0) {
        return $ids;
    }
    foreach (['local_prequran_comm_consent', 'local_prequran_live_consent'] as $table) {
        if (!pqh_table_exists_safe($table)) {
            continue;
        }
        try {
            foreach ($DB->get_records($table, ['guardianid' => $parentid], '', 'id, studentid') as $row) {
                if ((int)$row->studentid > 0) {
                    $ids[(int)$row->studentid] = (int)$row->studentid;
                }
            }
        } catch (Throwable $e) {
            continue;   // a missing column is not a reason to lose the other link
        }
    }
    if (pqh_table_exists_safe('local_prequran_comm_thread')
            && pqh_table_exists_safe('local_prequran_comm_participant')) {
        try {
            $rows = $DB->get_records_sql(
                "SELECT DISTINCT t.studentid
                   FROM {local_prequran_comm_thread} t
                   JOIN {local_prequran_comm_participant} p ON p.threadid = t.id
                  WHERE p.userid = :parentid AND p.role = 'parent' AND t.studentid > 0",
                ['parentid' => $parentid]);
            foreach ($rows as $row) {
                $ids[(int)$row->studentid] = (int)$row->studentid;
            }
        } catch (Throwable $e) {
            // fall through with whatever the consent tables gave
        }
    }
    return array_values($ids);
}

/** Is this child one of this guardian's? The chat door's question too. */
function pqpb_parent_owns_child(int $parentid, int $studentid): bool {
    return $studentid > 0 && in_array($studentid, pqpb_parent_children($parentid), true);
}

/**
 * The child's own words when they chose to stop a lesson early.
 *
 * The ONLY focus signal a family sees — see the note at the top of this file
 * for why the break count is not one. Bounded, newest first.
 */
function pqpb_leaving_notes(array $userids, int $limit = 6): array {
    global $DB;
    $out = [];
    if (!$userids || !pqh_table_exists_safe('local_prequran_live_audit')) {
        return $out;
    }
    [$insql, $params] = $DB->get_in_or_equal($userids, SQL_PARAMS_NAMED, 'usr');
    $params['action'] = 'course_left_early';
    try {
        $rows = $DB->get_records_select('local_prequran_live_audit',
            "actorid $insql AND action = :action", $params,
            'timecreated DESC', 'id, actorid, details, timecreated', 0, $limit * count($userids));
    } catch (Throwable $e) {
        return $out;
    }
    foreach ($rows as $row) {
        $details = json_decode((string)$row->details, true);
        $reason = is_array($details) ? trim((string)($details['reason'] ?? '')) : '';
        if ($reason === '') {
            continue;   // the bare event is the teacher's business; the words are the family's
        }
        $out[] = [
            'userid' => (int)$row->actorid,
            'at' => (int)$row->timecreated,
            'reason' => $reason,
        ];
    }
    return $out;
}

/**
 * The board a parent reads: one tile per child, and a totals row asking their
 * question rather than a teacher's.
 *
 * Every per-child fact comes from live_group_boardlib and progress_rolluplib,
 * so a parent and a teacher looking at the same child at the same moment see
 * the same numbers.
 */
function pqpb_build(int $parentid, string $env = 'production'): array {
    $now = time();
    $childids = pqpb_parent_children($parentid);
    $board = [
        'ok' => true,
        'generated' => $now,
        'env' => $env,
        'children' => [],
        'totals' => ['children' => 0, 'working' => 0, 'weekdone' => 0, 'minutes' => 0],
    ];
    if (!$childids) {
        return $board;
    }

    $weekstart = pqpr_week_start($now);
    $names = pqlgb_learner_names($childids);
    // The window the SNAPSHOT counts over is this week, not the teacher's
    // 40-minute cycle: a parent looks once a day, not once a swap.
    $snapshot = pqlgb_progress_snapshot($childids, $env, $weekstart);
    $notes = pqpb_leaving_notes($childids);

    foreach ($childids as $userid) {
        $snap = $snapshot[$userid] ?? null;
        $lastprogress = $snap ? (int)$snap['lastprogress'] : 0;
        $quiet = $lastprogress > 0 ? max(0, $now - $lastprogress) : 0;
        [$subject, $stage] = pqlgb_course_label($snap ? (string)$snap['coursekey'] : '');
        $day = pqpr_learning_day($userid);
        $mine = [];
        foreach ($notes as $note) {
            if ((int)$note['userid'] === $userid) {
                $mine[] = ['at' => $note['at'], 'reason' => $note['reason']];
            }
        }

        $tile = [
            'userid' => $userid,
            'name' => $names[$userid] ?? ('Child ' . $userid),
            'initials' => pqlgb_initials($names[$userid] ?? ''),
            'state' => pqlgb_state_for($quiet, $lastprogress > 0),
            'quietseconds' => $quiet,
            'lastprogress' => $lastprogress,
            'subject' => $snap ? $subject : '',
            'stage' => $snap ? $stage : '',
            'unit' => $snap ? (string)$snap['unit'] : '',
            'sectionsdone' => $snap ? (int)$snap['sectionsdone'] : 0,
            'resume' => $snap ? (string)$snap['resume'] : '',
            'resumedone' => $snap ? !empty($snap['resumedone']) : false,
            'resumelabel' => $snap ? (string)$snap['resumelabel'] : '',
            // How far into the activity they are standing in, where the app
            // reports it — the same {answered, total} the teacher's tile shows.
            'activity' => $snap ? $snap['activity'] : null,
            'knownwords' => $snap ? (int)$snap['knownwords'] : 0,
            'checkscount' => $snap ? (int)$snap['checkscount'] : 0,
            'checksavg' => $snap ? (int)$snap['checksavg'] : 0,
            'checkpoint' => $snap ? $snap['checkpoint'] : null,
            'weekdone' => $snap ? ((int)$snap['donewindow'] + (int)$snap['quizwindow']) : 0,
            // False means the count is a FLOOR or there is no ring at all, and
            // the tile must say so rather than print a zero about a week
            // nobody measured — the group board's own rule.
            'weekcovered' => $snap && (int)$snap['countingsince'] > 0
                && (int)$snap['countingsince'] <= $weekstart,
            'weekcounted' => $snap && (int)$snap['countingsince'] > 0,
            'minutestoday' => (int)round(((int)$day['used']) / 60),
            'daycounted' => !empty($day['counted']),
            'leaving' => $mine,
        ];
        $board['children'][] = $tile;
        $board['totals']['children']++;
        if ($lastprogress > 0 && ($now - $lastprogress) <= PQPB_ACTIVE_SECONDS) {
            $board['totals']['working']++;
        }
        $board['totals']['weekdone'] += $tile['weekdone'];
        $board['totals']['minutes'] += $tile['minutestoday'];
    }

    // Quietest first, then never-started, then by name — the board's ordering,
    // for the board's reason: the child who needs a word comes first.
    usort($board['children'], static function ($a, $b) {
        $rank = ['alert' => 0, 'warn' => 1, 'ok' => 2, 'nodata' => 3];
        if ($rank[$a['state']] !== $rank[$b['state']]) {
            return $rank[$a['state']] <=> $rank[$b['state']];
        }
        if ($a['quietseconds'] !== $b['quietseconds']) {
            return $b['quietseconds'] <=> $a['quietseconds'];
        }
        return strcasecmp((string)$a['name'], (string)$b['name']);
    });

    return $board;
}
