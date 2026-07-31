<?php
// Course syllabus library (pqsyl_*). Requires accesslib.php.
//
// Canvas's key design decision, adopted deliberately: a syllabus has two halves.
// The teacher writes a NARRATIVE once (what this course is, policies, contact).
// Everything with a date or a sequence — units, learning outcomes, assessment
// deadlines, term dates, grade structure — is GENERATED from platform data at
// render time. The half that rots is never typed, so a syllabus cannot drift
// out of step with the course it describes.
//
// Workflow: teacher authors -> submits -> school administrator approves.
// Only an approved syllabus may be published, and EDITING AN APPROVED SYLLABUS
// RETURNS IT TO DRAFT — otherwise "approved" would be a claim nobody checked.

defined('MOODLE_INTERNAL') || die();

function pqsyl_ready(): bool {
    return pqh_table_exists_safe('local_prequran_syllabus');
}

/**
 * The academic year to default to: 2026 means 2026-27.
 *
 * Prefer the school's OWN calendar — the term containing today, else the next
 * term due to start — because a hard-coded month boundary disagrees with real
 * schools. Only when no terms are defined does it fall back to the calendar,
 * rolling in July so that the summer gap defaults to the year about to begin
 * rather than the one that just ended.
 */
function pqsyl_current_year(int $workspaceid = 0): int {
    global $DB;

    $now = time();
    $fromstamp = static function (int $ts): int {
        $y = (int)date('Y', $ts);
        return ((int)date('n', $ts) >= 7) ? $y : $y - 1;
    };

    if ($workspaceid > 0 && pqh_table_exists_safe('local_prequran_acad_term')) {
        try {
            $rows = $DB->get_records_select('local_prequran_acad_term',
                "workspaceid = :ws AND status <> 'archived' AND startdate > 0",
                ['ws' => $workspaceid], 'startdate ASC', 'id,startdate,enddate', 0, 40);
            foreach ($rows as $r) {
                if ((int)$r->startdate <= $now && ((int)$r->enddate === 0 || (int)$r->enddate >= $now)) {
                    return $fromstamp((int)$r->startdate);
                }
            }
            foreach ($rows as $r) {
                if ((int)$r->startdate > $now) {
                    return $fromstamp((int)$r->startdate);
                }
            }
        } catch (Throwable $e) {
            // Fall through to the calendar.
        }
    }
    return $fromstamp($now);
}

function pqsyl_year_label(int $year): string {
    return $year . '-' . substr((string)($year + 1), 2);
}

function pqsyl_visibility_options(): array {
    return [
        'staff' => 'Staff only',
        'enrolled' => 'Students and parents',
        'public' => 'Public (anyone, including prospective families)',
    ];
}

function pqsyl_status_options(): array {
    return [
        'draft' => 'Draft',
        'in_review' => 'Awaiting approval',
        'approved' => 'Approved',
        'retired' => 'Retired',
    ];
}

/**
 * Policy headings every syllabus carries. Structured rather than one free-text
 * box so every course in the school answers the same questions, and so a parent
 * comparing two courses is reading like for like.
 */
/**
 * Free-text blocks stored inside policies_json. Adding a key here is all that
 * is needed to make a new block save, decode and render -- no schema change,
 * and rows written before the key existed simply decode to ''.
 *
 * PQSYL_PREREQ_KEY lives in here for that plumbing, but it is NOT a policy:
 * both renderers pull it out and present it as course information, above the
 * policy list. Keep it out of any loop that prints "Course policies".
 */
const PQSYL_PREREQ_KEY = 'prerequisites';

function pqsyl_policy_blocks(): array {
    return [
        PQSYL_PREREQ_KEY => 'Prerequisites',
        'materials' => 'Materials and equipment',
        'attendance' => 'Attendance',
        'homework' => 'Homework',
        'assessment' => 'Assessment and grading',
        'behaviour' => 'Behaviour and participation',
        'support' => 'Support and communication',
    ];
}

/** Policy blocks only -- prerequisites removed. Use for "Course policies" UI. */
function pqsyl_policy_blocks_only(): array {
    $blocks = pqsyl_policy_blocks();
    unset($blocks[PQSYL_PREREQ_KEY]);
    return $blocks;
}

/**
 * Courses belonging to a workspace, across BOTH course systems: offerings carry
 * the link explicitly, while catalog/cohort courses have no offering row at all
 * — for those the link is derived from where the workspace's own members are
 * actually enrolled.
 */
function pqsyl_workspace_courses(int $workspaceid, int $limit = 200): array {
    global $DB;

    $courses = [];
    if (pqh_table_exists_safe('local_prequran_course_offering')) {
        try {
            $rows = $DB->get_records_select('local_prequran_course_offering',
                'workspaceid = :ws AND moodlecourseid > 0', ['ws' => $workspaceid],
                'title ASC', 'id,moodlecourseid,title', 0, $limit);
            foreach ($rows as $r) {
                $courses[(int)$r->moodlecourseid] = (string)$r->title;
            }
        } catch (Throwable $e) {
            // Fall through to the enrolment-derived list.
        }
    }
    // Prefer the institution's own course categories. The enrolment-derived
    // fallback below asks "what is any member enrolled in", which on a shared
    // Moodle drags in whatever unrelated courses an admin happens to be
    // enrolled in from another tenant, while hiding the school's real courses
    // until somebody enrols. When the institution has a bound category that
    // category is authoritative, so the fallback is skipped entirely.
    $categoryids = pqh_workspace_course_category_ids($workspaceid);
    if ($categoryids) {
        try {
            [$catsql, $catparams] = $DB->get_in_or_equal($categoryids, SQL_PARAMS_NAMED, 'syllabcat');
            $rows = $DB->get_records_select('course', "category {$catsql}", $catparams, 'fullname ASC', 'id,fullname', 0, $limit);
            foreach ($rows as $r) {
                if ((int)$r->id !== SITEID && !isset($courses[(int)$r->id])) {
                    $courses[(int)$r->id] = (string)$r->fullname;
                }
            }
        } catch (Throwable $e) {
            // Fall through to the enrolment-derived list.
        }
    }
    if (!$categoryids && pqh_table_exists_safe('local_prequran_workspace_member')) {
        try {
            $rows = $DB->get_records_sql(
                "SELECT DISTINCT c.id, c.fullname
                   FROM {local_prequran_workspace_member} wm
                   JOIN {user_enrolments} ue ON ue.userid = wm.userid
                   JOIN {enrol} e ON e.id = ue.enrolid
                   JOIN {course} c ON c.id = e.courseid
                  WHERE wm.workspaceid = :ws AND wm.status = 'active'
               ORDER BY c.fullname ASC", ['ws' => $workspaceid], 0, $limit);
            foreach ($rows as $r) {
                if (!isset($courses[(int)$r->id])) {
                    $courses[(int)$r->id] = (string)$r->fullname;
                }
            }
        } catch (Throwable $e) {
            // Best effort: an empty list is better than a broken page.
        }
    }
    $out = [];
    foreach ($courses as $cid => $name) {
        $out[] = ['courseid' => $cid, 'title' => $name];
    }
    return $out;
}

/** May this user WRITE the syllabus for this course? Teacher of it, or workspace manager. */
function pqsyl_can_author(int $userid, int $workspaceid, int $courseid): bool {
    global $DB;

    if (pqh_user_can_manage_workspace($userid, $workspaceid)) {
        return true;
    }
    if ($courseid <= 0) {
        return false;
    }
    try {
        $ctx = context_course::instance($courseid, IGNORE_MISSING);
        if (!$ctx) {
            return false;
        }
        foreach (['editingteacher', 'teacher'] as $shortname) {
            $roleid = (int)$DB->get_field('role', 'id', ['shortname' => $shortname]);
            if ($roleid > 0 && user_has_role_assignment($userid, $roleid, $ctx->id)) {
                return true;
            }
        }
    } catch (Throwable $e) {
        return false;
    }
    return false;
}

/** Approval is a school-administrator act, never the author's own. */
function pqsyl_can_approve(int $userid, int $workspaceid): bool {
    return pqh_user_can_manage_workspace($userid, $workspaceid);
}

// ---------------------------------------------------------------------------
// The generated half.
// ---------------------------------------------------------------------------

/**
 * Assemble everything the platform already knows about a course. No storage of
 * its own: this is read fresh every time, so it cannot go stale.
 */
function pqsyl_generated(int $workspaceid, int $courseid): array {
    global $DB;

    $out = ['alignment' => null, 'units' => [], 'assessments' => [], 'terms' => [], 'unit_source' => ''];
    if ($courseid <= 0) {
        return $out;
    }

    if (pqh_table_exists_safe('local_prequran_curriculum_map')) {
        try {
            $map = $DB->get_record('local_prequran_curriculum_map', ['courseid' => $courseid],
                'id,subject,stage,level,cambridge_code,framework,unitcount', IGNORE_MISSING);
            if ($map) {
                $out['alignment'] = [
                    'subject' => (string)$map->subject,
                    'stage' => (int)$map->stage,
                    'level' => (string)$map->level,
                    'cambridge_code' => (string)$map->cambridge_code,
                    'framework' => (string)$map->framework,
                    'unitcount' => (int)$map->unitcount,
                ];
            }
        } catch (Throwable $e) {
            $out['alignment'] = null;
        }
    }

    // Unit titles: catalog_sync pre-creates one gradebook item per unit with
    // iteminstance = the unit number, which is the only SERVER-side source for
    // unit names (the catalog JSON itself lives on the CDN).
    $unittitles = [];
    try {
        $items = $DB->get_records_select('grade_items',
            "courseid = :cid AND itemmodule = 'local_prequran'", ['cid' => $courseid],
            'iteminstance ASC', 'id,iteminstance,itemname', 0, 100);
        foreach ($items as $item) {
            $n = (int)$item->iteminstance;
            $name = trim((string)$item->itemname);
            if ($n > 0 && $name !== '') {
                $unittitles[$n] = $name;
            }
        }
    } catch (Throwable $e) {
        $unittitles = [];
    }

    // Units + learning outcomes.
    if (pqh_table_exists_safe('local_prequran_objective')) {
        try {
            $rows = $DB->get_records_select('local_prequran_objective',
                "courseid = :cid AND status = 'active'", ['cid' => $courseid],
                'unit_number ASC, sequence ASC', '*', 0, 2000);
            $byunit = [];
            $bytitle = [];
            foreach ($rows as $r) {
                $u = (int)$r->unit_number;
                if (!isset($byunit[$u])) {
                    $byunit[$u] = [];
                }
                $owntitle = trim((string)($r->unit_title ?? ''));
                if ($owntitle !== '' && empty($bytitle[$u])) {
                    $bytitle[$u] = $owntitle;
                }
                $byunit[$u][] = [
                    'code' => (string)$r->objective_code,
                    'outcome' => (string)$r->learning_outcome,
                    'bloom' => (string)$r->bloom_level,
                    'evidence' => (string)$r->evidence,
                ];
            }
            ksort($byunit);
            foreach ($byunit as $u => $objectives) {
                $out['units'][] = [
                    'number' => $u,
                    // The objective's own title wins: gradebook item names put
                    // unit 0 and the course 'final' item on the same key.
                    'title' => $bytitle[$u] ?? ($unittitles[$u] ?? ('Unit ' . $u)),
                    'objectives' => $objectives,
                ];
            }
            if ($out['units']) {
                $out['unit_source'] = 'objectives';
            }
        } catch (Throwable $e) {
            $out['units'] = [];
        }
    }
    // No objectives imported yet — still show the unit spine from the gradebook,
    // so a syllabus is useful before anyone maps outcomes.
    if (!$out['units'] && $unittitles) {
        ksort($unittitles);
        foreach ($unittitles as $u => $title) {
            $out['units'][] = ['number' => $u, 'title' => $title, 'objectives' => []];
        }
        $out['unit_source'] = 'gradebook';
    }

    if (pqh_table_exists_safe('local_prequran_homework')) {
        try {
            $rows = $DB->get_records_select('local_prequran_homework',
                "moodlecourseid = :cid AND status = 'published'", ['cid' => $courseid],
                'duedate ASC, id ASC', 'id,title,duedate,maxpoints', 0, 200);
            foreach ($rows as $r) {
                $out['assessments'][] = [
                    'title' => (string)$r->title,
                    'duedate' => (int)$r->duedate,
                    'maxpoints' => (string)$r->maxpoints,
                ];
            }
        } catch (Throwable $e) {
            $out['assessments'] = [];
        }
    }

    if (pqh_table_exists_safe('local_prequran_acad_term')) {
        try {
            $rows = $DB->get_records_select('local_prequran_acad_term',
                "workspaceid = :ws AND status <> 'archived'", ['ws' => $workspaceid],
                'startdate ASC', 'id,title,startdate,enddate', 0, 20);
            foreach ($rows as $r) {
                $out['terms'][] = [
                    'title' => (string)$r->title,
                    'startdate' => (int)$r->startdate,
                    'enddate' => (int)$r->enddate,
                ];
            }
        } catch (Throwable $e) {
            $out['terms'] = [];
        }
    }

    return $out;
}

// ---------------------------------------------------------------------------
// The authored half.
// ---------------------------------------------------------------------------

function pqsyl_get(int $workspaceid, int $courseid, int $year): ?stdClass {
    global $DB;
    if (!pqsyl_ready() || $courseid <= 0) {
        return null;
    }
    $row = $DB->get_record('local_prequran_syllabus',
        ['workspaceid' => $workspaceid, 'moodlecourseid' => $courseid, 'academicyear' => $year],
        '*', IGNORE_MISSING);
    return $row ?: null;
}

/**
 * One row per workspace course for the given academic year, carrying that
 * course's syllabus status.
 *
 * Courses with no syllabus row at all are returned with status 'not_started'
 * rather than being omitted: those are exactly the ones an administrator needs
 * to chase, and a query over the syllabus table alone would hide them.
 *
 * 'not_started' is deliberately not a stored status -- nothing writes it, and
 * it is absent from pqsyl_status_options(). It exists only in this report.
 */
/**
 * Moodle course ids in the workspace that have an approved syllabus, keyed by
 * course id for cheap isset() lookups.
 *
 * Pass a year to ask about one academic year; omit it (0) to mean "has ever
 * been approved for any year", which is what a soft warning wants -- a course
 * approved last year is not the same problem as one never written at all.
 */
function pqsyl_approved_course_ids(int $workspaceid, int $year = 0): array {
    global $DB;

    if ($workspaceid <= 0 || !pqsyl_ready()) {
        return [];
    }
    $conditions = ['workspaceid' => $workspaceid, 'status' => 'approved'];
    if ($year > 0) {
        $conditions['academicyear'] = $year;
    }
    try {
        $rows = $DB->get_records('local_prequran_syllabus', $conditions, '', 'id,moodlecourseid');
    } catch (Throwable $e) {
        return [];
    }
    $ids = [];
    foreach ($rows as $row) {
        $courseid = (int)$row->moodlecourseid;
        if ($courseid > 0) {
            $ids[$courseid] = true;
        }
    }
    return $ids;
}

function pqsyl_workspace_status(int $workspaceid, int $year): array {
    global $DB;

    if (!pqsyl_ready()) {
        return [];
    }
    $courses = pqsyl_workspace_courses($workspaceid);
    if (!$courses) {
        return [];
    }

    $rows = [];
    try {
        $rows = $DB->get_records('local_prequran_syllabus',
            ['workspaceid' => $workspaceid, 'academicyear' => $year],
            '', 'id,moodlecourseid,status,visibility,review_note,approvedby,approvedat,timemodified');
    } catch (Throwable $e) {
        $rows = [];
    }
    $bycourse = [];
    foreach ($rows as $row) {
        $bycourse[(int)$row->moodlecourseid] = $row;
    }

    $approvernames = [];
    $approverids = array_values(array_unique(array_filter(array_map(static function($row): int {
        return (int)($row->approvedby ?? 0);
    }, $rows))));
    if ($approverids) {
        try {
            [$insql, $params] = $DB->get_in_or_equal($approverids, SQL_PARAMS_NAMED, 'syllabappr');
            $namefields = 'id,firstname,lastname,middlename,alternatename,firstnamephonetic,lastnamephonetic';
            foreach ($DB->get_records_select('user', "id {$insql}", $params, '', $namefields) as $user) {
                $approvernames[(int)$user->id] = fullname($user);
            }
        } catch (Throwable $e) {
            $approvernames = [];
        }
    }

    $out = [];
    foreach ($courses as $course) {
        $courseid = (int)$course['courseid'];
        $row = $bycourse[$courseid] ?? null;
        $status = 'not_started';
        if ($row) {
            $status = trim((string)$row->status) !== '' ? trim((string)$row->status) : 'draft';
        }
        $approvedby = $row ? (int)$row->approvedby : 0;
        $out[] = [
            'courseid' => $courseid,
            'title' => (string)$course['title'],
            'status' => $status,
            'visibility' => $row ? (string)$row->visibility : '',
            'review_note' => $row ? (string)$row->review_note : '',
            'timemodified' => $row ? (int)$row->timemodified : 0,
            'approvedby' => $approvedby,
            'approvedbyname' => $approvedby > 0 ? ($approvernames[$approvedby] ?? '') : '',
            'approvedat' => $row ? (int)$row->approvedat : 0,
        ];
    }

    // Most-actionable first: work waiting on an approver, then courses with
    // nothing written, then drafts in progress, with settled rows last.
    $order = ['in_review' => 1, 'not_started' => 2, 'draft' => 3, 'retired' => 4, 'approved' => 5];
    usort($out, static function(array $a, array $b) use ($order): int {
        $ao = $order[$a['status']] ?? 9;
        $bo = $order[$b['status']] ?? 9;
        if ($ao !== $bo) {
            return $ao <=> $bo;
        }
        return strcasecmp($a['title'], $b['title']);
    });
    return $out;
}

function pqsyl_decode_policies($row): array {
    $out = [];
    $json = is_object($row) ? (string)($row->policies_json ?? '') : '';
    if (trim($json) !== '') {
        $decoded = json_decode($json, true);
        if (is_array($decoded)) {
            $out = $decoded;
        }
    }
    $clean = [];
    foreach (array_keys(pqsyl_policy_blocks()) as $key) {
        $clean[$key] = (string)($out[$key] ?? '');
    }
    return $clean;
}

/**
 * Create or update the narrative. Editing an APPROVED syllabus sends it back to
 * draft: the approval attached to the previous words cannot silently carry over
 * to new ones.
 */
function pqsyl_save(int $workspaceid, $consumercontext, int $courseid, int $year, int $actorid, array $data): int {
    global $DB;

    if (!pqsyl_ready()) {
        throw new invalid_parameter_exception('Syllabus schema is not ready. Run the local_prequran upgrade first.');
    }
    if ($courseid <= 0) {
        throw new invalid_parameter_exception('Choose a course.');
    }
    if (!$DB->record_exists('course', ['id' => $courseid])) {
        throw new invalid_parameter_exception('That course does not exist.');
    }

    $policies = [];
    foreach (array_keys(pqsyl_policy_blocks()) as $key) {
        $policies[$key] = core_text::substr(trim((string)($data['policy_' . $key] ?? '')), 0, 4000);
    }

    $now = time();
    $existing = pqsyl_get($workspaceid, $courseid, $year);
    $record = (object)[
        'consumerid' => (int)($consumercontext->consumerid ?? 0),
        'workspaceid' => $workspaceid,
        'moodlecourseid' => $courseid,
        'academicyear' => $year,
        'overview' => core_text::substr(trim((string)($data['overview'] ?? '')), 0, 8000),
        'teacher_intro' => core_text::substr(trim((string)($data['teacher_intro'] ?? '')), 0, 4000),
        'contact' => core_text::substr(trim((string)($data['contact'] ?? '')), 0, 1000),
        'policies_json' => json_encode($policies, JSON_UNESCAPED_SLASHES),
        'modifiedby' => $actorid,
        'timemodified' => $now,
    ];

    if ($existing) {
        $record->id = (int)$existing->id;
        // Any edit invalidates a prior approval.
        if ((string)$existing->status === 'approved') {
            $record->status = 'draft';
            $record->approvedby = 0;
            $record->approvedat = 0;
            $record->review_note = 'Reopened for editing after approval.';
        }
        $DB->update_record('local_prequran_syllabus', $record);
        $id = (int)$existing->id;
    } else {
        $record->status = 'draft';
        $record->visibility = 'enrolled';
        $record->createdby = $actorid;
        $record->timecreated = $now;
        $id = (int)$DB->insert_record('local_prequran_syllabus', $record);
    }
    pqsyl_audit($workspaceid, $courseid, $id, 'syllabus_saved', ['year' => $year], $actorid);
    return $id;
}

/**
 * Move a syllabus through the workflow. Submitting is the author's act;
 * approving and rejecting are the administrator's.
 */
function pqsyl_transition(int $workspaceid, int $courseid, int $year, int $actorid, string $action, string $note = ''): void {
    global $DB;

    $row = pqsyl_get($workspaceid, $courseid, $year);
    if (!$row) {
        throw new invalid_parameter_exception('There is no syllabus to update yet.');
    }
    $current = (string)$row->status;
    $now = time();
    $update = (object)['id' => (int)$row->id, 'timemodified' => $now, 'modifiedby' => $actorid];

    if ($action === 'submit') {
        if (!in_array($current, ['draft', 'retired'], true)) {
            throw new invalid_parameter_exception('Only a draft can be sent for approval.');
        }
        if (trim((string)$row->overview) === '') {
            throw new invalid_parameter_exception('Write the course overview before sending it for approval.');
        }
        $update->status = 'in_review';
        $update->submittedby = $actorid;
        $update->submittedat = $now;
    } else if ($action === 'approve') {
        if (!pqsyl_can_approve($actorid, $workspaceid)) {
            throw new invalid_parameter_exception('Only a school administrator can approve a syllabus.');
        }
        if ($current !== 'in_review') {
            throw new invalid_parameter_exception('Only a syllabus awaiting approval can be approved.');
        }
        $update->status = 'approved';
        $update->approvedby = $actorid;
        $update->approvedat = $now;
        $update->review_note = core_text::substr(trim($note), 0, 1000);
    } else if ($action === 'reject') {
        if (!pqsyl_can_approve($actorid, $workspaceid)) {
            throw new invalid_parameter_exception('Only a school administrator can return a syllabus.');
        }
        if ($current !== 'in_review') {
            throw new invalid_parameter_exception('Only a syllabus awaiting approval can be returned.');
        }
        $update->status = 'draft';
        $update->review_note = core_text::substr(trim($note), 0, 1000);
    } else if ($action === 'retire') {
        if (!pqsyl_can_approve($actorid, $workspaceid)) {
            throw new invalid_parameter_exception('Only a school administrator can retire a syllabus.');
        }
        $update->status = 'retired';
    } else {
        throw new invalid_parameter_exception('Unknown syllabus action.');
    }

    $DB->update_record('local_prequran_syllabus', $update);
    pqsyl_audit($workspaceid, $courseid, (int)$row->id, 'syllabus_' . $action,
        ['from' => $current, 'to' => (string)($update->status ?? $current), 'year' => $year], $actorid);
}

/** Visibility is an administrator decision — public means anyone, unauthenticated. */
function pqsyl_set_visibility(int $workspaceid, int $courseid, int $year, int $actorid, string $visibility): void {
    global $DB;

    if (!pqsyl_can_approve($actorid, $workspaceid)) {
        throw new invalid_parameter_exception('Only a school administrator can change who may see a syllabus.');
    }
    if (!isset(pqsyl_visibility_options()[$visibility])) {
        throw new invalid_parameter_exception('Unknown visibility.');
    }
    $row = pqsyl_get($workspaceid, $courseid, $year);
    if (!$row) {
        throw new invalid_parameter_exception('There is no syllabus to update yet.');
    }
    $DB->update_record('local_prequran_syllabus', (object)[
        'id' => (int)$row->id, 'visibility' => $visibility,
        'modifiedby' => $actorid, 'timemodified' => time(),
    ]);
    pqsyl_audit($workspaceid, $courseid, (int)$row->id, 'syllabus_visibility', ['visibility' => $visibility], $actorid);
}

// ---------------------------------------------------------------------------
// Reading a syllabus outside the portal: one access rule and one renderer,
// shared by the web view and the PDF so the two can never drift apart.
// ---------------------------------------------------------------------------

/**
 * Resolve a course reference (idnumber like ehel-eng-g01, or a numeric id) to a
 * course record. Accepting the idnumber keeps public URLs readable.
 */
function pqsyl_resolve_course(string $ref): ?stdClass {
    global $DB;

    $ref = trim($ref);
    if ($ref === '') {
        return null;
    }
    if (preg_match('/^\d+$/', $ref)) {
        return $DB->get_record('course', ['id' => (int)$ref], 'id,fullname,shortname,idnumber', IGNORE_MISSING) ?: null;
    }
    if (!preg_match('/^[A-Za-z0-9_\-]{1,120}$/', $ref)) {
        return null;
    }
    return $DB->get_record('course', ['idnumber' => $ref], 'id,fullname,shortname,idnumber', IGNORE_MISSING) ?: null;
}

/**
 * May the CURRENT viewer read this syllabus? Returns
 * [bool $allowed, bool $ispublic, ?stdClass $row].
 *
 * Order matters. A syllabus that is approved AND public is readable by anyone,
 * with no session at all — that is the admissions case. Anything else requires
 * a logged-in viewer who is enrolled in the course, or workspace staff (who may
 * also preview an unapproved draft). Everything else is refused with the SAME
 * message, so the page never reveals which courses exist.
 */
function pqsyl_can_read(int $courseid, int $year, int $viewerid): array {
    global $DB;

    if (!pqsyl_ready() || $courseid <= 0) {
        return [false, false, null];
    }
    $row = $DB->get_record('local_prequran_syllabus',
        ['moodlecourseid' => $courseid, 'academicyear' => $year], '*', IGNORE_MISSING);
    if (!$row) {
        return [false, false, null];
    }

    $approved = (string)$row->status === 'approved';
    if ($approved && (string)$row->visibility === 'public') {
        return [true, true, $row];
    }
    if ($viewerid <= 0) {
        return [false, false, null];
    }

    $workspaceid = (int)$row->workspaceid;
    if (pqsyl_can_author($viewerid, $workspaceid, $courseid) || pqsyl_can_approve($viewerid, $workspaceid)) {
        return [true, false, $row]; // staff may preview a draft
    }
    if (!$approved || (string)$row->visibility === 'staff') {
        return [false, false, null];
    }
    try {
        $ctx = context_course::instance($courseid, IGNORE_MISSING);
        if ($ctx && is_enrolled($ctx, $viewerid, '', true)) {
            return [true, false, $row];
        }
    } catch (Throwable $e) {
        return [false, false, null];
    }
    return [false, false, null];
}

/**
 * The syllabus as HTML. One function feeds the web view and the PDF.
 *
 * $opts['public'] omits the assessment schedule: deadlines are operational
 * detail for enrolled families and add nothing for a prospective one, so the
 * public copy discloses the minimum that still answers "what will my child
 * learn here?".
 */
function pqsyl_render_html(stdClass $row, stdClass $course, array $opts = []): string {
    $ispublic = !empty($opts['public']);
    $workspaceid = (int)$row->workspaceid;
    $courseid = (int)$course->id;
    $generated = pqsyl_generated($workspaceid, $courseid);
    $policies = pqsyl_decode_policies($row);
    $para = static function (string $text): string {
        return '<p>' . nl2br(s($text)) . '</p>';
    };

    $h = '';
    $h .= '<h1>' . s((string)$course->fullname) . '</h1>';
    $h .= '<p class="meta">Syllabus · academic year ' . s(pqsyl_year_label((int)$row->academicyear));
    if ((string)$row->status === 'approved' && (int)$row->approvedat > 0) {
        $h .= ' · approved ' . s(userdate((int)$row->approvedat, '%e %B %Y'));
    } else {
        $h .= ' · <strong>draft — not yet approved</strong>';
    }
    $h .= '</p>';

    if (trim((string)$row->overview) !== '') {
        $h .= '<h2>About this course</h2>' . $para((string)$row->overview);
    }
    if (trim((string)$row->teacher_intro) !== '') {
        $h .= '<h2>Your teacher</h2>' . $para((string)$row->teacher_intro);
    }

    if (!empty($generated['alignment'])) {
        $a = $generated['alignment'];
        $rows = '';
        foreach ([
            'Subject' => (string)$a['subject'],
            'Stage' => $a['stage'] > 0 ? (string)$a['stage'] : '',
            'Level' => (string)$a['level'],
            'Cambridge code' => (string)$a['cambridge_code'],
            'Framework' => (string)$a['framework'],
        ] as $label => $value) {
            if (trim($value) !== '') {
                $rows .= '<tr><th>' . s($label) . '</th><td>' . s($value) . '</td></tr>';
            }
        }
        if ($rows !== '') {
            $h .= '<h2>Curriculum alignment</h2><table class="kv">' . $rows . '</table>';
        }
    }

    if (!empty($generated['units'])) {
        $h .= '<h2>What your child will learn</h2>';
        foreach ($generated['units'] as $unit) {
            $h .= '<div class="unit"><h3>Unit ' . s((string)$unit['number']) . ' · ' . s((string)$unit['title']) . '</h3>';
            if (!empty($unit['objectives'])) {
                $h .= '<ul>';
                foreach ($unit['objectives'] as $objective) {
                    $h .= '<li>' . s((string)$objective['outcome']);
                    if (trim((string)$objective['bloom']) !== '') {
                        $h .= ' <span class="tag">' . s((string)$objective['bloom']) . '</span>';
                    }
                    $h .= '</li>';
                }
                $h .= '</ul>';
            }
            $h .= '</div>';
        }
    }

    // Prerequisites is course information, not a policy: it answers "can my
    // child take this?", so it belongs above the policy list rather than
    // buried inside it.
    $prerequisites = trim((string)($policies[PQSYL_PREREQ_KEY] ?? ''));
    if ($prerequisites !== '') {
        $h .= '<h2>Prerequisites</h2>' . $para($prerequisites);
    }

    $policyblocks = pqsyl_policy_blocks_only();
    $anypolicy = false;
    foreach ($policyblocks as $key => $label) {
        if (trim((string)($policies[$key] ?? '')) !== '') {
            $anypolicy = true;
            break;
        }
    }
    if ($anypolicy) {
        $h .= '<h2>Course policies</h2>';
        foreach ($policyblocks as $key => $label) {
            $value = trim((string)($policies[$key] ?? ''));
            if ($value !== '') {
                $h .= '<h3>' . s($label) . '</h3>' . $para($value);
            }
        }
    }

    if (!$ispublic && !empty($generated['assessments'])) {
        $h .= '<h2>Assessment schedule</h2><table class="grid"><tr><th>Task</th><th>Due</th><th>Points</th></tr>';
        foreach ($generated['assessments'] as $item) {
            $h .= '<tr><td>' . s((string)$item['title']) . '</td><td>'
                . ((int)$item['duedate'] > 0 ? s(userdate((int)$item['duedate'], '%e %b %Y')) : '—')
                . '</td><td>' . s((string)$item['maxpoints']) . '</td></tr>';
        }
        $h .= '</table>';
    }

    if (!empty($generated['terms'])) {
        $h .= '<h2>Term dates</h2><table class="grid"><tr><th>Term</th><th>Starts</th><th>Ends</th></tr>';
        foreach ($generated['terms'] as $term) {
            $h .= '<tr><td>' . s((string)$term['title']) . '</td><td>'
                . ((int)$term['startdate'] > 0 ? s(userdate((int)$term['startdate'], '%e %b %Y')) : '—') . '</td><td>'
                . ((int)$term['enddate'] > 0 ? s(userdate((int)$term['enddate'], '%e %b %Y')) : '—') . '</td></tr>';
        }
        $h .= '</table>';
    }

    if (trim((string)$row->contact) !== '') {
        $h .= '<h2>Contact</h2>' . $para((string)$row->contact);
    }

    return $h;
}

function pqsyl_audit(int $workspaceid, int $courseid, int $id, string $action, array $details, int $actorid): void {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_course_audit')) {
        return;
    }
    try {
        $DB->insert_record('local_prequran_course_audit', (object)[
            'consumerid' => 0, 'workspaceid' => $workspaceid, 'offeringid' => 0, 'requestid' => 0,
            'studentid' => 0, 'actorid' => $actorid, 'action' => $action,
            'targettype' => 'syllabus', 'targetid' => $id,
            'details' => json_encode($details + ['courseid' => $courseid], JSON_UNESCAPED_SLASHES),
            'timecreated' => time(),
        ]);
    } catch (Throwable $e) {
        // Audit is best-effort.
    }
}
