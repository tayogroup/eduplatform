<?php
declare(strict_types=1);

defined('MOODLE_INTERNAL') || die();

require_once(__DIR__ . '/accesslib.php');

function pqgp_gradebook_ready(): bool {
    return pqh_table_exists_safe('local_prequran_grade_category')
        && pqh_table_exists_safe('local_prequran_assessment')
        && pqh_table_exists_safe('local_prequran_grade')
        && pqh_table_exists_safe('local_prequran_course_grade')
        && pqh_table_exists_safe('local_prequran_grade_audit');
}

function pqgp_learning_path_ready(): bool {
    return pqh_table_exists_safe('local_prequran_skill')
        && pqh_table_exists_safe('local_prequran_skill_mastery')
        && pqh_table_exists_safe('local_prequran_student_path')
        && pqh_table_exists_safe('local_prequran_intervention');
}

function pqgp_json(array $data): string {
    return json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) ?: '{}';
}

function pqgp_money_float(string $value): float {
    $clean = preg_replace('/[^0-9.\\-]/', '', trim($value)) ?? '';
    return is_numeric($clean) ? (float)$clean : 0.0;
}

function pqgp_letter(float $percent): string {
    if ($percent >= 90) {
        return 'A';
    }
    if ($percent >= 80) {
        return 'B';
    }
    if ($percent >= 70) {
        return 'C';
    }
    if ($percent >= 60) {
        return 'D';
    }
    return 'F';
}

function pqgp_audit(int $workspaceid, string $action, array $old, array $new, int $actorid, array $ids = [], string $reason = ''): void {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_grade_audit')) {
        return;
    }
    $DB->insert_record('local_prequran_grade_audit', (object)[
        'workspaceid' => $workspaceid,
        'offeringid' => (int)($ids['offeringid'] ?? 0),
        'assessmentid' => (int)($ids['assessmentid'] ?? 0),
        'gradeid' => (int)($ids['gradeid'] ?? 0),
        'coursegradeid' => (int)($ids['coursegradeid'] ?? 0),
        'studentid' => (int)($ids['studentid'] ?? 0),
        'actorid' => $actorid,
        'action' => core_text::substr($action, 0, 80),
        'oldvaluejson' => pqgp_json($old),
        'newvaluejson' => pqgp_json($new),
        'reason' => $reason,
        'timecreated' => time(),
    ]);
}

function pqgp_student_options(int $workspaceid): array {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_workspace_member')) {
        return [];
    }
    return array_values($DB->get_records_sql(
        "SELECT u.id, u.firstname, u.lastname, u.email
           FROM {local_prequran_workspace_member} wm
           JOIN {user} u ON u.id = wm.userid
          WHERE wm.workspaceid = :workspaceid
            AND wm.workspace_role = :role
            AND wm.status = :status
       ORDER BY u.lastname ASC, u.firstname ASC",
        ['workspaceid' => $workspaceid, 'role' => 'student', 'status' => 'active']
    ));
}

function pqgp_weighted_course_grade(int $workspaceid, int $offeringid, int $studentid): array {
    global $DB;
    if (!pqgp_gradebook_ready() || $workspaceid <= 0 || $offeringid <= 0 || $studentid <= 0) {
        return ['percent' => null, 'letter' => '', 'categories' => []];
    }
    $categories = $DB->get_records('local_prequran_grade_category', ['workspaceid' => $workspaceid, 'offeringid' => $offeringid, 'status' => 'active'], 'id ASC');
    $weighted = 0.0;
    $weighttotal = 0.0;
    $details = [];
    foreach ($categories as $category) {
        $grades = $DB->get_records_sql(
            "SELECT g.id, g.score_percent
               FROM {local_prequran_grade} g
               JOIN {local_prequran_assessment} a ON a.id = g.assessmentid
              WHERE g.workspaceid = :workspaceid
                AND g.offeringid = :offeringid
                AND g.studentid = :studentid
                AND a.categoryid = :categoryid
                AND g.status IN ('reviewed','published')",
            ['workspaceid' => $workspaceid, 'offeringid' => $offeringid, 'studentid' => $studentid, 'categoryid' => (int)$category->id]
        );
        $scores = [];
        foreach ($grades as $grade) {
            if ((string)$grade->score_percent !== '') {
                $scores[] = pqgp_money_float((string)$grade->score_percent);
            }
        }
        sort($scores);
        $drop = max(0, (int)pqgp_money_float((string)$category->drop_lowest_count));
        while ($drop > 0 && count($scores) > 1) {
            array_shift($scores);
            $drop--;
        }
        $categorypercent = $scores ? array_sum($scores) / count($scores) : null;
        $weight = max(0.0, pqgp_money_float((string)$category->weight_percent));
        if ($categorypercent !== null && $weight > 0) {
            $weighted += $categorypercent * $weight;
            $weighttotal += $weight;
        }
        $details[] = [
            'categoryid' => (int)$category->id,
            'title' => (string)$category->title,
            'weight' => $weight,
            'score_count' => count($scores),
            'percent' => $categorypercent,
        ];
    }
    $percent = $weighttotal > 0 ? round($weighted / $weighttotal, 2) : null;
    return ['percent' => $percent, 'letter' => $percent !== null ? pqgp_letter($percent) : '', 'categories' => $details];
}

function pqgp_recalculate_course_grade(int $workspaceid, int $offeringid, int $studentid, int $actorid, bool $publish = false): int {
    global $DB;
    $calc = pqgp_weighted_course_grade($workspaceid, $offeringid, $studentid);
    if ($calc['percent'] === null) {
        return 0;
    }
    $existing = $DB->get_record('local_prequran_course_grade', ['workspaceid' => $workspaceid, 'offeringid' => $offeringid, 'studentid' => $studentid], '*', IGNORE_MISSING);
    $now = time();
    $record = (object)[
        'workspaceid' => $workspaceid,
        'offeringid' => $offeringid,
        'studentid' => $studentid,
        'final_percent' => (string)$calc['percent'],
        'letter_grade' => (string)$calc['letter'],
        'status' => $publish ? 'published' : (string)($existing->status ?? 'draft'),
        'calculation_json' => pqgp_json($calc),
        'calculatedat' => $now,
        'publishedby' => $publish ? $actorid : (int)($existing->publishedby ?? 0),
        'publishedat' => $publish ? $now : (int)($existing->publishedat ?? 0),
        'timecreated' => (int)($existing->timecreated ?? $now),
        'timemodified' => $now,
    ];
    if ($existing) {
        $record->id = (int)$existing->id;
        $DB->update_record('local_prequran_course_grade', $record);
        $id = (int)$existing->id;
    } else {
        $id = (int)$DB->insert_record('local_prequran_course_grade', $record);
    }
    pqgp_audit($workspaceid, $publish ? 'course_grade_published' : 'course_grade_calculated', $existing ? (array)$existing : [], (array)$record, $actorid, [
        'offeringid' => $offeringid,
        'coursegradeid' => $id,
        'studentid' => $studentid,
    ]);
    return $id;
}

function pqgp_mastery_summary(int $workspaceid, int $studentid): array {
    global $DB;
    if (!pqgp_learning_path_ready() || $studentid <= 0) {
        return ['count' => 0, 'average' => 0, 'mastered' => 0];
    }
    $rows = $DB->get_records('local_prequran_skill_mastery', ['workspaceid' => $workspaceid, 'studentid' => $studentid]);
    $total = 0.0;
    $mastered = 0;
    foreach ($rows as $row) {
        $pct = pqgp_money_float((string)$row->mastery_percent);
        $total += $pct;
        if (in_array((string)$row->mastery_status, ['mastered', 'advanced'], true) || $pct >= 80) {
            $mastered++;
        }
    }
    $count = count($rows);
    return ['count' => $count, 'average' => $count > 0 ? round($total / $count, 1) : 0, 'mastered' => $mastered];
}

function pqgp_recommend_next_course(int $workspaceid, int $studentid, string $currentlevel): array {
    global $DB;
    $summary = pqgp_mastery_summary($workspaceid, $studentid);
    $rule = null;
    if (pqh_table_exists_safe('local_prequran_adv_rule') && $currentlevel !== '') {
        $rule = $DB->get_record('local_prequran_adv_rule', ['workspaceid' => $workspaceid, 'from_level' => $currentlevel, 'status' => 'active'], '*', IGNORE_MULTIPLE);
    }
    if ($rule && (float)$summary['average'] >= pqgp_money_float((string)$rule->required_mastery_percent)) {
        return [
            'status' => 'ready_to_advance',
            'next_level' => (string)$rule->to_level,
            'course_key' => (string)$rule->recommended_course_key,
            'reason' => 'Mastery average meets advancement rule.',
        ];
    }
    return [
        'status' => 'continue_practice',
        'next_level' => $currentlevel,
        'course_key' => $rule ? (string)$rule->recommended_course_key : '',
        'reason' => 'Continue current skill map until mastery threshold is met.',
    ];
}
