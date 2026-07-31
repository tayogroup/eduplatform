<?php
// Content authoring library: learning-objective ingestion/management (the
// content JSON's rich outcomes never reached Moodle), a content review/approval
// register + trail, and objective coverage. Requires accesslib.php.
defined('MOODLE_INTERNAL') || die();

function pqcon_objective_ready(): bool {
    return pqh_table_exists_safe('local_prequran_objective');
}

function pqcon_review_ready(): bool {
    return pqh_table_exists_safe('local_prequran_content_review');
}

/**
 * Tenant guard: confirm a Moodle courseid is backed by an offering in this
 * workspace before objectives may be written to / read from it. Objectives are
 * keyed on a bare courseid, so without this a workspace admin could address
 * another tenant's course.
 */
function pqcon_course_in_workspace(int $workspaceid, int $courseid): bool {
    global $DB;
    if ($courseid <= 0 || $workspaceid <= 0) {
        return false;
    }
    if (pqh_table_exists_safe('local_prequran_course_offering')
            && $DB->record_exists('local_prequran_course_offering',
                ['workspaceid' => $workspaceid, 'moodlecourseid' => $courseid])) {
        return true;
    }
    // Catalog/cohort courses (catalog_sync) have NO offering row at all, so the
    // only server-side link to a workspace is where its own members are
    // enrolled. Without this the guard silently locks catalog schools out of
    // their own objectives.
    if (!pqh_table_exists_safe('local_prequran_workspace_member')) {
        return false;
    }
    try {
        return $DB->record_exists_sql(
            "SELECT 1
               FROM {local_prequran_workspace_member} wm
               JOIN {user_enrolments} ue ON ue.userid = wm.userid
               JOIN {enrol} e ON e.id = ue.enrolid
              WHERE wm.workspaceid = :ws AND wm.status = 'active' AND e.courseid = :cid",
            ['ws' => $workspaceid, 'cid' => $courseid]);
    } catch (Throwable $e) {
        return false;
    }
}

/** Courses (offerings) in a workspace, for the objective/review pickers. */
function pqcon_workspace_courses(int $workspaceid): array {
    global $DB;
    $out = [];
    if (!pqh_table_exists_safe('local_prequran_course_offering')) {
        return $out;
    }
    $rows = $DB->get_records('local_prequran_course_offering', ['workspaceid' => $workspaceid], 'title ASC', 'id,title,moodlecourseid,course_key', 0, 300);
    foreach ($rows as $r) {
        $out[] = [
            'offeringid' => (int)$r->id,
            'courseid' => (int)$r->moodlecourseid,
            'title' => (string)$r->title,
            'course_key' => (string)$r->course_key,
        ];
    }
    return $out;
}

/**
 * Permission-checked entry point used by the portal. CLI importers, which run
 * with an operator-asserted workspace, call pqcon_store_objective() directly.
 */
function pqcon_save_objective(int $workspaceid, int $actorid, array $data): int {
    $courseid = (int)($data['courseid'] ?? 0);
    if ($courseid > 0 && !pqcon_course_in_workspace($workspaceid, $courseid)) {
        throw new invalid_parameter_exception('That course is not part of this workspace.');
    }
    return pqcon_store_objective($workspaceid, $actorid, $data);
}

/** Raw upsert by (courseid, objective_code). No workspace-membership check. */
function pqcon_store_objective(int $workspaceid, int $actorid, array $data): int {
    global $DB;
    if (!pqcon_objective_ready()) {
        throw new invalid_parameter_exception('Objective schema is not ready. Run the local_prequran upgrade first.');
    }
    $courseid = (int)($data['courseid'] ?? 0);
    $code = trim((string)($data['objective_code'] ?? ''));
    $outcome = trim((string)($data['learning_outcome'] ?? ''));
    if ($courseid <= 0 || $code === '' || $outcome === '') {
        throw new invalid_parameter_exception('A course, objective code, and learning outcome are required.');
    }
    $now = time();
    $existing = $DB->get_record('local_prequran_objective', ['courseid' => $courseid, 'objective_code' => $code], '*', IGNORE_MISSING);
    $record = (object)[
        'workspaceid' => $workspaceid,
        'courseid' => $courseid,
        'course_idnumber' => core_text::substr(trim((string)($data['course_idnumber'] ?? '')), 0, 120),
        'unit_number' => max(0, (int)($data['unit_number'] ?? 0)),
        'unit_title' => core_text::substr(trim((string)($data['unit_title'] ?? '')), 0, 255),
        'objective_code' => core_text::substr($code, 0, 100),
        'sequence' => max(0, (int)($data['sequence'] ?? 0)),
        'learning_outcome' => core_text::substr($outcome, 0, 2000),
        'bloom_level' => core_text::substr(trim((string)($data['bloom_level'] ?? '')), 0, 60),
        'evidence' => core_text::substr(trim((string)($data['evidence'] ?? '')), 0, 2000),
        'framework_code' => core_text::substr(trim((string)($data['framework_code'] ?? '')), 0, 60),
        'status' => in_array((string)($data['status'] ?? 'active'), ['active', 'retired'], true) ? (string)($data['status'] ?? 'active') : 'active',
        'timemodified' => $now,
    ];
    if ($existing) {
        $record->id = (int)$existing->id;
        $DB->update_record('local_prequran_objective', $record);
        return (int)$existing->id;
    }
    $record->createdby = $actorid;
    $record->timecreated = $now;
    return (int)$DB->insert_record('local_prequran_objective', $record);
}

/**
 * Bulk-ingest objectives from the content JSON's outcomes[] shape (as pasted
 * or fetched): [{outcomeId, sequence, learningOutcome, bloomLevel,
 * evidenceOfLearning, unitId|unit_number}]. Upsert by objective_code. Returns
 * the count imported.
 */
/**
 * Unit number for an outcome. Prefer an explicit unit_number; otherwise read the
 * trailing -uNN segment of the unitId. (Stripping every non-digit from
 * "eng-g01-t01-u01" gives 10101, which silently scattered objectives across
 * units that do not exist.)
 */
function pqcon_unit_number_from(array $o): int {
    if (array_key_exists('unit_number', $o) && $o['unit_number'] !== '' && $o['unit_number'] !== null) {
        return max(0, (int)$o['unit_number']);
    }
    if (preg_match('/-u(\d+)/i', (string)($o['unitId'] ?? ''), $m)) {
        return max(0, (int)$m[1]);
    }
    return 0;
}

function pqcon_import_objectives(int $workspaceid, int $courseid, string $courseidnumber, int $actorid, array $outcomes): int {
    $count = 0;
    foreach ($outcomes as $o) {
        if (!is_array($o)) {
            continue;
        }
        $code = trim((string)($o['outcomeId'] ?? $o['objective_code'] ?? ''));
        $text = trim((string)($o['learningOutcome'] ?? $o['learning_outcome'] ?? ''));
        if ($code === '' || $text === '') {
            continue;
        }
        pqcon_save_objective($workspaceid, $actorid, [
            'courseid' => $courseid,
            'course_idnumber' => $courseidnumber,
            'unit_number' => pqcon_unit_number_from($o),
            'unit_title' => (string)($o['unit_title'] ?? ''),
            'objective_code' => $code,
            'sequence' => (int)($o['sequence'] ?? 0),
            'learning_outcome' => $text,
            'bloom_level' => (string)($o['bloomLevel'] ?? $o['bloom_level'] ?? ''),
            'evidence' => (string)($o['evidenceOfLearning'] ?? $o['evidence'] ?? ''),
            'framework_code' => (string)($o['frameworkCode'] ?? ''),
        ]);
        $count++;
    }
    return $count;
}

function pqcon_objectives_for_course(int $workspaceid, int $courseid, int $limit = 500): array {
    global $DB;
    if (!pqcon_objective_ready() || $courseid <= 0) {
        return [];
    }
    if (!pqcon_course_in_workspace($workspaceid, $courseid)) {
        return [];
    }
    return array_values($DB->get_records('local_prequran_objective', ['courseid' => $courseid], 'unit_number ASC, sequence ASC', '*', 0, $limit));
}

/**
 * Objective coverage per course: how many objectives each course has by unit.
 * Set-based — one grouped query over the workspace's courses instead of two
 * count queries per course (was an N+1 across the offering list).
 */
function pqcon_objective_coverage(int $workspaceid): array {
    global $DB;
    $out = [];
    if (!pqcon_objective_ready()) {
        return $out;
    }
    $courses = pqcon_workspace_courses($workspaceid);
    $courseids = [];
    $titles = [];
    foreach ($courses as $c) {
        if ((int)$c['courseid'] > 0) {
            $courseids[(int)$c['courseid']] = (int)$c['courseid'];
            $titles[(int)$c['courseid']] = (string)$c['title'];
        }
    }
    if (!$courseids) {
        return $out;
    }
    list($insql, $params) = $DB->get_in_or_equal(array_values($courseids), SQL_PARAMS_NAMED, 'c');
    $rows = $DB->get_records_sql(
        "SELECT courseid, COUNT(*) AS objectives, COUNT(DISTINCT unit_number) AS units
           FROM {local_prequran_objective}
          WHERE status = 'active' AND courseid $insql
       GROUP BY courseid", $params);
    foreach ($rows as $r) {
        $cid = (int)$r->courseid;
        $out[] = ['course' => $titles[$cid] ?? ('Course #' . $cid), 'courseid' => $cid,
            'objectives' => (int)$r->objectives, 'units' => (int)$r->units];
    }
    return $out;
}

// ---- Content review register ----------------------------------------------

function pqcon_review_status_options(): array {
    return ['draft' => 'Draft', 'in_review' => 'In review', 'approved' => 'Approved',
        'needs_revision' => 'Needs revision', 'retired' => 'Retired'];
}

function pqcon_save_content_review(int $workspaceid, $consumercontext, int $actorid, array $data): int {
    global $DB;
    if (!pqcon_review_ready()) {
        throw new invalid_parameter_exception('Content review schema is not ready. Run the local_prequran upgrade first.');
    }
    $ref = trim((string)($data['content_ref'] ?? ''));
    $title = trim((string)($data['title'] ?? ''));
    if ($ref === '' || $title === '') {
        throw new invalid_parameter_exception('A content reference and title are required.');
    }
    $status = (string)($data['review_status'] ?? 'draft');
    if (!isset(pqcon_review_status_options()[$status])) {
        $status = 'draft';
    }
    $type = in_array((string)($data['content_type'] ?? 'unit'), ['unit', 'course', 'lesson', 'quiz', 'material', 'other'], true)
        ? (string)($data['content_type'] ?? 'unit') : 'unit';
    $now = time();
    $existing = $DB->get_record('local_prequran_content_review',
        ['workspaceid' => $workspaceid, 'content_type' => $type, 'content_ref' => core_text::substr($ref, 0, 255)], '*', IGNORE_MISSING);
    $record = (object)[
        'consumerid' => (int)($consumercontext->consumerid ?? 0),
        'workspaceid' => $workspaceid,
        'content_type' => $type,
        'content_ref' => core_text::substr($ref, 0, 255),
        'title' => core_text::substr($title, 0, 255),
        'review_status' => $status,
        'content_version' => core_text::substr(trim((string)($data['content_version'] ?? '')), 0, 60),
        'notes' => core_text::substr(trim((string)($data['notes'] ?? '')), 0, 4000),
        'timemodified' => $now,
    ];
    if (in_array($status, ['approved', 'needs_revision', 'retired'], true)) {
        $record->reviewedby = $actorid;
        $record->reviewedat = $now;
    }
    $prev = $existing ? (string)$existing->review_status : '(new)';
    if ($existing) {
        $record->id = (int)$existing->id;
        $DB->update_record('local_prequran_content_review', $record);
        $id = (int)$existing->id;
    } else {
        $record->createdby = $actorid;
        $record->timecreated = $now;
        $id = (int)$DB->insert_record('local_prequran_content_review', $record);
    }
    // Approval trail: every status change is audited (who approved which content).
    if (pqh_table_exists_safe('local_prequran_course_audit')) {
        try {
            $DB->insert_record('local_prequran_course_audit', (object)[
                'consumerid' => 0, 'workspaceid' => $workspaceid, 'offeringid' => 0, 'requestid' => 0,
                'studentid' => 0, 'actorid' => $actorid, 'action' => 'content_review_' . $status,
                'targettype' => 'content_review', 'targetid' => $id,
                'details' => json_encode(['ref' => $ref, 'from' => $prev, 'to' => $status], JSON_UNESCAPED_SLASHES),
                'timecreated' => $now,
            ]);
        } catch (Throwable $e) {
            // Audit best-effort.
        }
    }
    return $id;
}

function pqcon_content_reviews(int $workspaceid, int $limit = 500): array {
    global $DB;
    if (!pqcon_review_ready()) {
        return [];
    }
    return array_values($DB->get_records('local_prequran_content_review', ['workspaceid' => $workspaceid],
        "CASE WHEN review_status = 'approved' THEN 1 ELSE 0 END ASC, timemodified DESC", '*', 0, $limit));
}
