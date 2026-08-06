<?php
// Progress rollup helpers (pqpr_*) — the one definition of how the reduced
// learner-app progress state in {local_prequran_progress} is turned into
// something a human reads.
//
// The apps emit contract events (docs/progress-event-contract.md); the ingest
// reduces them to one JSON state row per (environment, user, course, unit),
// where every quiz lands in `checkpoints` as {score, passed, attempt}. Both the
// student/parent portal and the teacher portal render those, so the labelling,
// the exclusions and the aggregation live here rather than in two copies that
// can drift.

declare(strict_types=1);

defined('MOODLE_INTERNAL') || die();

require_once(__DIR__ . '/accesslib.php');

/** Only production progress reaches a portal; staging/integration is test data. */
const PQPR_ENVIRONMENT = 'production';

/** A checkpoint section that is NOT a score out of 100. See pqpr_checkpoints_from_state(). */
const PQPR_NON_PERCENT_SECTIONS = ['games'];

/** `u03` -> `Unit 3`; the fixed unit keys keep their own names. */
function pqpr_unit_label(string $unit): string {
    if (preg_match('/^u(\d+)$/', $unit, $m)) {
        return 'Unit ' . (int)$m[1];
    }
    $known = ['capstone' => 'Capstone', 'final' => 'Final', 'prereq' => 'Placement', '_' => 'Course'];
    return $known[$unit] ?? ucfirst(str_replace('-', ' ', $unit));
}

/** `course-quiz` -> `Course quiz`. */
function pqpr_section_label(string $section): string {
    $known = [
        'quiz' => 'Quiz', 'course-quiz' => 'Course quiz', 'placement-exam' => 'Placement exam',
        'assessment' => 'Assessment', 'challenge' => 'Challenge', '_' => 'Checkpoint',
    ];
    return $known[$section] ?? ucfirst(str_replace('-', ' ', $section));
}

/**
 * Every quiz result inside one unit's reduced state, as flat display rows.
 *
 * Two kinds of checkpoint are dropped: one with no score (nothing to show), and
 * the `games` section — the Quran app emits a star count there and the matching
 * `total` is not part of the reduced state, so it cannot honestly be printed
 * beside a percentage.
 */
function pqpr_checkpoints_from_state(array $state, string $unit, int $unitupdated): array {
    $out = [];
    foreach ((array)($state['checkpoints'] ?? []) as $section => $cp) {
        $section = (string)$section;
        if (!is_array($cp) || in_array($section, PQPR_NON_PERCENT_SECTIONS, true)) {
            continue;
        }
        if (!isset($cp['score']) || $cp['score'] === null) {
            continue;
        }
        $out[] = [
            'unit' => $unit,
            'section' => $section,
            'label' => pqpr_unit_label($unit) . ' · ' . pqpr_section_label($section),
            'score' => (int)$cp['score'],
            'passed' => !empty($cp['passed']),
            'attempt' => isset($cp['attempt']) ? (int)$cp['attempt'] : 1,
            'unit_updated' => $unitupdated,
        ];
    }
    return $out;
}

/** Newest unit first, then a stable unit/section order within a unit. */
function pqpr_sort_checkpoints(array $checkpoints): array {
    usort($checkpoints, static function (array $a, array $b): int {
        return [$b['unit_updated'], $a['unit'], $a['section']] <=> [$a['unit_updated'], $b['unit'], $b['section']];
    });
    return $checkpoints;
}

/** taken / passed / average across a set of checkpoints (average null when empty). */
function pqpr_summarise(array $checkpoints): array {
    $passed = 0;
    $total = 0;
    foreach ($checkpoints as $cp) {
        $total += (int)$cp['score'];
        if (!empty($cp['passed'])) {
            $passed++;
        }
    }
    $taken = count($checkpoints);
    return [
        'quizzes_taken' => $taken,
        'quizzes_passed' => $passed,
        'average_score' => $taken > 0 ? (int)round($total / $taken) : null,
    ];
}

/**
 * Production progress rows for these learners, in one query. Returns [] when
 * the schema is not installed, so callers need no table guard of their own.
 */
function pqpr_progress_rows(array $userids, int $limit = 5000): array {
    global $DB;
    $userids = array_values(array_unique(array_filter(array_map('intval', $userids))));
    if (!$userids || !pqh_table_exists_safe('local_prequran_progress')) {
        return [];
    }
    [$insql, $inparams] = $DB->get_in_or_equal($userids, SQL_PARAMS_NAMED, 'pu');
    return array_values($DB->get_records_select('local_prequran_progress',
        "environment = :env AND userid $insql",
        array_merge(['env' => PQPR_ENVIRONMENT], $inparams),
        'timemodified DESC',
        'id,userid,coursekey,unit,statejson,timemodified',
        0,
        $limit));
}

/**
 * coursekey => ['subject' => …, 'stage' => int, 'unitcount' => int] from the
 * curriculum map, in one query instead of one per course. Unmapped keys are
 * absent; callers fall back to the raw key.
 */
function pqpr_course_labels(array $coursekeys): array {
    global $DB;
    $coursekeys = array_values(array_unique(array_filter(array_map('strval', $coursekeys))));
    if (!$coursekeys || !pqh_table_exists_safe('local_prequran_curriculum_map')) {
        return [];
    }
    [$insql, $inparams] = $DB->get_in_or_equal($coursekeys, SQL_PARAMS_NAMED, 'ck');
    $rows = $DB->get_records_select('local_prequran_curriculum_map',
        "idnumber $insql", $inparams, '', 'id,idnumber,subject,stage,unitcount');
    $out = [];
    foreach ($rows as $row) {
        $out[(string)$row->idnumber] = [
            'subject' => (string)$row->subject !== '' ? (string)$row->subject : (string)$row->idnumber,
            'stage' => (int)$row->stage,
            'unitcount' => (int)$row->unitcount,
        ];
    }
    return $out;
}

/** "Science · Stage 3" for a coursekey, falling back to the key itself. */
function pqpr_course_title(string $coursekey, array $labels): string {
    $map = $labels[$coursekey] ?? null;
    $subject = $map ? $map['subject'] : $coursekey;
    return $map && $map['stage'] > 0 ? $subject . ' · Stage ' . $map['stage'] : $subject;
}
