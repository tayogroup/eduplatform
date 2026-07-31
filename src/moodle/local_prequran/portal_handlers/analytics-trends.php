<?php
// Portal handler: analytics-trends (workspace admin). Reads the nightly
// analytics snapshots back as a TIME SERIES (they were write-only), plus a live
// per-course academic breakdown (cohort/class comparison) and curriculum
// coverage from the previously write-only curriculum_map.
defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');

$userid = (int)($claims['sub'] ?? 0);
$consumercontext = pqh_requested_consumer_context();
$workspaceid = pqh_current_workspace_id($userid, optional_param('workspaceid', (int)($consumercontext->workspaceid ?? 0), PARAM_INT));

if ($workspaceid <= 0 || !pqh_user_can_manage_workspace($userid, $workspaceid)) {
    pqpd_fail(403, 'Analytics trends require workspace administrator access.');
}

// -- Trend series: nightly_academic snapshots over time (the write-only fix) --
$trend = [];
if (pqh_table_exists_safe('local_prequran_analytics_snap')) {
    $rows = $DB->get_records_select('local_prequran_analytics_snap',
        "workspaceid = :ws AND snapshot_type = 'nightly_academic'",
        ['ws' => $workspaceid], 'period_end ASC', '*', 0, 180);
    foreach ($rows as $r) {
        $m = json_decode((string)$r->metricsjson, true);
        if (!is_array($m)) {
            continue;
        }
        $trend[] = [
            'date' => (int)$r->period_end,
            'pass_rate' => $m['pass_rate'] ?? null,
            'attendance_rate' => $m['attendance_rate'] ?? null,
            'unit_completion_rate' => $m['unit_completion_rate'] ?? null,
            'graded_students' => (int)($m['graded_students'] ?? 0),
            'grade_distribution' => $m['grade_distribution'] ?? null,
        ];
    }
}

// -- Live per-course academic breakdown (cohort/class comparison) -------------
$passpercent = (float)preg_replace('/[^0-9.]/', '', (string)get_config('local_prequran', 'completion_award_pass_percent'));
if ($passpercent <= 0) {
    $passpercent = 60.0;
}
$courses = [];
if (pqh_table_exists_safe('local_prequran_course_grade') && pqh_table_exists_safe('local_prequran_course_offering')) {
    $offerings = $DB->get_records('local_prequran_course_offering', ['workspaceid' => $workspaceid], 'title ASC', 'id,title,moodlecourseid', 0, 200);
    // Single pass over the workspace's published grades (was an N+1: one query
    // per offering). final_percent is a varchar with possible non-numeric
    // characters, so the pass/average maths stays in PHP to preserve semantics.
    $agg = [];
    if ($offerings) {
        $grades = $DB->get_records_select('local_prequran_course_grade',
            "workspaceid = :ws AND status = 'published'",
            ['ws' => $workspaceid], 'offeringid ASC', 'id,offeringid,final_percent', 0, 50000);
        foreach ($grades as $g) {
            $oid = (int)$g->offeringid;
            if (!isset($agg[$oid])) {
                $agg[$oid] = ['sum' => 0.0, 'passed' => 0, 'n' => 0];
            }
            $p = (float)preg_replace('/[^0-9.]/', '', (string)$g->final_percent);
            $agg[$oid]['sum'] += $p;
            $agg[$oid]['n']++;
            if ($p >= $passpercent) {
                $agg[$oid]['passed']++;
            }
        }
    }
    foreach ($offerings as $off) {
        $oid = (int)$off->id;
        if (empty($agg[$oid]) || $agg[$oid]['n'] === 0) {
            continue;
        }
        $n = $agg[$oid]['n'];
        $courses[] = [
            'title' => (string)$off->title,
            'students' => $n,
            'avg_grade' => round($agg[$oid]['sum'] / $n, 1),
            'pass_rate' => round(100 * $agg[$oid]['passed'] / $n, 1),
        ];
    }
}

// -- Curriculum coverage (surfacing the write-only curriculum_map) ------------
$curriculum = [];
if (pqh_table_exists_safe('local_prequran_curriculum_map') && pqh_table_exists_safe('local_prequran_course_offering')) {
    $offerings = $DB->get_records('local_prequran_course_offering', ['workspaceid' => $workspaceid], 'title ASC', 'id,title,moodlecourseid', 0, 200);
    // Resolve every curriculum_map in ONE query keyed by moodlecourseid (was a
    // per-offering point lookup).
    $courseids = [];
    foreach ($offerings as $off) {
        if ((int)$off->moodlecourseid > 0) {
            $courseids[(int)$off->moodlecourseid] = (int)$off->moodlecourseid;
        }
    }
    $maps = [];
    if ($courseids) {
        list($insql, $params) = $DB->get_in_or_equal(array_values($courseids), SQL_PARAMS_NAMED, 'c');
        $maps = $DB->get_records_select('local_prequran_curriculum_map', "courseid $insql", $params, '',
            'id,courseid,subject,stage,level,cambridge_code,framework,unitcount');
        // Index by courseid for O(1) join.
        $byid = [];
        foreach ($maps as $m) {
            $byid[(int)$m->courseid] = $m;
        }
        $maps = $byid;
    }
    foreach ($offerings as $off) {
        $cid = (int)$off->moodlecourseid;
        if ($cid <= 0 || empty($maps[$cid])) {
            continue;
        }
        $map = $maps[$cid];
        $curriculum[] = [
            'course' => (string)$off->title,
            'subject' => (string)$map->subject,
            'stage' => (int)$map->stage,
            'level' => (string)$map->level,
            'cambridge_code' => (string)$map->cambridge_code,
            'framework' => (string)$map->framework,
            'unitcount' => (int)$map->unitcount,
        ];
    }
}

echo json_encode([
    'ok' => true, 'ready' => true,
    'workspaceid' => $workspaceid,
    'trend' => $trend,
    'courses' => $courses,
    'curriculum' => $curriculum,
    'snapshot_mode' => (string)get_config('local_prequran', 'analytics_snapshot_mode'),
    'pass_threshold' => $passpercent,
], JSON_UNESCAPED_SLASHES);
exit;
