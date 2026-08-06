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

/**
 * Below this average, a learner or a quiz is flagged as needing support. Same
 * number the teacher portal's low-score parent alert already uses for a
 * published grade, so the two do not disagree about what "low" means.
 */
const PQPR_SUPPORT_THRESHOLD = 70;

/**
 * Level values that say nothing the stage does not already say, so they are
 * left out of a course title. Compared lowercase. See pqpr_course_title().
 */
const PQPR_GENERIC_LEVELS = ['primary', 'lower secondary', 'upper secondary'];

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
 * The other way round: checkpoints indexed per learner, regrouped into one row
 * per quiz with everybody who sat it — so a class can be read down a column
 * instead of student by student.
 *
 * $bystudent is studentid => checkpoint rows (each carrying `coursekey` and
 * `course` on top of what pqpr_checkpoints_from_state() returns); $names is
 * studentid => display name. A learner holds at most one checkpoint per
 * (course, unit, section), so nobody can appear twice in one quiz.
 */
function pqpr_class_quizzes(array $bystudent, array $names, int $limit = 40): array {
    $index = [];
    foreach ($bystudent as $studentid => $checkpoints) {
        $studentid = (int)$studentid;
        foreach ($checkpoints as $cp) {
            $key = ($cp['coursekey'] ?? '') . '|' . $cp['unit'] . '|' . $cp['section'];
            if (!isset($index[$key])) {
                $index[$key] = [
                    'coursekey' => (string)($cp['coursekey'] ?? ''),
                    'course' => (string)($cp['course'] ?? ''),
                    'label' => (string)$cp['label'],
                    'unit' => (string)$cp['unit'],
                    'section' => (string)$cp['section'],
                    'last_activity' => 0,
                    'results' => [],
                ];
            }
            $index[$key]['last_activity'] = max($index[$key]['last_activity'], (int)$cp['unit_updated']);
            $index[$key]['results'][] = [
                'studentid' => $studentid,
                'name' => $names[$studentid] ?? ('Student #' . $studentid),
                'score' => (int)$cp['score'],
                'passed' => !empty($cp['passed']),
                'attempt' => (int)$cp['attempt'],
            ];
        }
    }

    $out = [];
    foreach ($index as $quiz) {
        // Lowest score first — whoever is stuck is the teacher's next move.
        // Ties fall back to name so the order is stable between loads.
        usort($quiz['results'], static function (array $a, array $b): int {
            return [$a['score'], $a['name']] <=> [$b['score'], $b['name']];
        });
        $summary = pqpr_summarise($quiz['results']);
        $quiz['attempts'] = $summary['quizzes_taken'];
        $quiz['passed'] = $summary['quizzes_passed'];
        $quiz['average_score'] = $summary['average_score'];
        $quiz['needs_support'] = $summary['average_score'] !== null && $summary['average_score'] < PQPR_SUPPORT_THRESHOLD;
        $out[] = $quiz;
    }
    // Most recently active quiz first, then a stable course/unit/section order.
    usort($out, static function (array $a, array $b): int {
        return [$b['last_activity'], $a['course'], $a['unit'], $a['section']]
            <=> [$a['last_activity'], $b['course'], $b['unit'], $b['section']];
    });
    return array_slice($out, 0, $limit);
}

/**
 * The quizzes a cohort is finding hardest: lowest class average first. A low
 * average across twelve learners outranks the same average across one, so
 * attempts break the tie before the label does. Quizzes nobody has a score for
 * are left out — there is nothing to rank them by.
 */
function pqpr_lowest_average(array $classquizzes, int $limit = 6): array {
    $ranked = array_values(array_filter($classquizzes, static function (array $quiz): bool {
        return $quiz['average_score'] !== null;
    }));
    usort($ranked, static function (array $a, array $b): int {
        return [$a['average_score'], $b['attempts'], $a['course'], $a['label']]
            <=> [$b['average_score'], $a['attempts'], $b['course'], $b['label']];
    });
    return array_slice($ranked, 0, $limit);
}

/**
 * How a whole group is doing across every quiz its learners have sat:
 * learners with a score, results counted, the average over all of them, and how
 * many learners are averaging below the support threshold.
 */
function pqpr_cohort_summary(array $bystudent): array {
    $results = [];
    $needssupport = 0;
    $learners = 0;
    foreach ($bystudent as $checkpoints) {
        if (!$checkpoints) {
            continue;
        }
        $learners++;
        $summary = pqpr_summarise($checkpoints);
        if ($summary['average_score'] !== null && $summary['average_score'] < PQPR_SUPPORT_THRESHOLD) {
            $needssupport++;
        }
        $results = array_merge($results, $checkpoints);
    }
    $overall = pqpr_summarise($results);
    return [
        'learners' => $learners,
        'quizzes_sat' => $overall['quizzes_taken'],
        'quizzes_passed' => $overall['quizzes_passed'],
        'average_score' => $overall['average_score'],
        'needs_support' => $needssupport,
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
 * coursekey => ['subject' => …, 'stage' => int, 'level' => …, 'unitcount' => int]
 * from the curriculum map, in one query instead of one per course. Unmapped
 * keys are absent; callers fall back to the raw key.
 */
function pqpr_course_labels(array $coursekeys): array {
    global $DB;
    $coursekeys = array_values(array_unique(array_filter(array_map('strval', $coursekeys))));
    if (!$coursekeys || !pqh_table_exists_safe('local_prequran_curriculum_map')) {
        return [];
    }
    [$insql, $inparams] = $DB->get_in_or_equal($coursekeys, SQL_PARAMS_NAMED, 'ck');
    $rows = $DB->get_records_select('local_prequran_curriculum_map',
        "idnumber $insql", $inparams, '', 'id,idnumber,subject,stage,level,unitcount');
    $out = [];
    foreach ($rows as $row) {
        $out[(string)$row->idnumber] = [
            'subject' => (string)$row->subject !== '' ? (string)$row->subject : (string)$row->idnumber,
            'stage' => (int)$row->stage,
            'level' => trim((string)$row->level),
            'unitcount' => (int)$row->unitcount,
        ];
    }
    return $out;
}

/**
 * "Science · Stage 3" for a coursekey, falling back to the key itself.
 *
 * Subject and stage alone are not unique: the catalog files Intensive English
 * under subject "English" at stages 1-2, exactly where Primary English already
 * sits, so both courses came out as "English · Stage 1" and a family could not
 * tell which child's course was which. `level` is the field that separates
 * them — but only when it names a distinct programme. The school phases carry
 * nothing the stage does not already say, and the Quran catalog stores a bare
 * `0`, so both are ignored. Where the level already contains the subject
 * ("Intensive English"), it replaces the subject rather than trailing after it.
 */
function pqpr_course_title(string $coursekey, array $labels): string {
    $map = $labels[$coursekey] ?? null;
    if (!$map) {
        return $coursekey;
    }
    $subject = $map['subject'];
    $level = (string)($map['level'] ?? '');
    $generic = $level === ''
        || is_numeric($level)
        || in_array(core_text::strtolower($level), PQPR_GENERIC_LEVELS, true);

    $name = $subject;
    $qualifier = '';
    if (!$generic) {
        if (core_text::strpos(core_text::strtolower($level), core_text::strtolower($subject)) !== false) {
            $name = $level;
        } else {
            $qualifier = ' · ' . $level;
        }
    }
    return $name . ($map['stage'] > 0 ? ' · Stage ' . $map['stage'] : '') . $qualifier;
}
