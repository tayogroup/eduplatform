<?php
// Platform-course-roster query library for the token-gated portal endpoint.
// The page-defined helpers of local_hubredirect/platform_course_roster.php are
// extracted VERBATIM here (the pqpcr_ prefix stays reserved and is unique to
// that page) so the portal handler can call them query-for-query. Shared helpers
// the page merely calls (pqh_table_exists_safe, pqco_status_options,
// pqco_visibility_options, …) live in accesslib/course_offeringlib and are NOT
// copied. The legacy page keeps its own inline copies and stays untouched
// (parallel-run). Requires: local/hubredirect/accesslib.php loaded first.

defined('MOODLE_INTERNAL') || die();

function pqpcr_ready(): bool {
    return pqh_table_exists_safe('local_prequran_course_offering')
        && pqh_table_exists_safe('local_prequran_course_enrol_req')
        && pqh_table_exists_safe('local_prequran_workspace');
}

function pqpcr_consumer_options(): array {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_consumer')) {
        return [];
    }
    return array_values($DB->get_records_select(
        'local_prequran_consumer',
        "consumer_type <> ?",
        ['platform_foundation'],
        'name ASC',
        'id,name,slug,consumer_type,status'
    ));
}

function pqpcr_workspace_options(): array {
    global $DB;
    if (!pqh_table_exists_safe('local_prequran_workspace')) {
        return [];
    }
    return array_values($DB->get_records('local_prequran_workspace', null, 'name ASC', 'id,name,slug,workspace_type,status'));
}

function pqpcr_date_label(int $time): string {
    return $time > 0 ? userdate($time, get_string('strftimedate')) : 'Not set';
}

function pqpcr_short(string $value, int $limit = 140): string {
    $value = trim($value);
    if ($value === '') {
        return '';
    }
    return core_text::strlen($value) > $limit ? core_text::substr($value, 0, $limit) . '...' : $value;
}

function pqpcr_status_class(string $status): string {
    return preg_replace('/[^a-z0-9_-]/i', '', strtolower($status !== '' ? $status : 'unknown'));
}

function pqpcr_fetch_rows(array $filters): array {
    global $DB;
    if (!pqpcr_ready()) {
        return [];
    }

    $where = ['1 = 1'];
    $params = [];
    if ((int)$filters['consumerid'] > 0) {
        $where[] = '(o.consumerid = :consumerid OR ci.id = :consumeridbyid OR cw.id = :consumeridbyworkspace)';
        $params['consumerid'] = (int)$filters['consumerid'];
        $params['consumeridbyid'] = (int)$filters['consumerid'];
        $params['consumeridbyworkspace'] = (int)$filters['consumerid'];
    }
    if ((int)$filters['workspaceid'] > 0) {
        $where[] = 'o.workspaceid = :workspaceid';
        $params['workspaceid'] = (int)$filters['workspaceid'];
    }
    if ((string)$filters['status'] !== '') {
        $where[] = 'o.status = :status';
        $params['status'] = (string)$filters['status'];
    }
    if ((string)$filters['visibility'] !== '') {
        $where[] = 'o.visibility = :visibility';
        $params['visibility'] = (string)$filters['visibility'];
    }
    $q = trim((string)$filters['q']);
    if ($q !== '') {
        $like = '%' . $DB->sql_like_escape($q) . '%';
        $parts = [
            $DB->sql_like('o.title', ':qtitle', false),
            $DB->sql_like('o.course_key', ':qkey', false),
            $DB->sql_like('w.name', ':qworkspace', false),
            $DB->sql_like('ci.name', ':qconsumerid', false),
            $DB->sql_like('cw.name', ':qconsumerworkspace', false),
            $DB->sql_like('mc.fullname', ':qmoodlefull', false),
            $DB->sql_like('mc.shortname', ':qmoodleshort', false),
        ];
        $params['qtitle'] = $like;
        $params['qkey'] = $like;
        $params['qworkspace'] = $like;
        $params['qconsumerid'] = $like;
        $params['qconsumerworkspace'] = $like;
        $params['qmoodlefull'] = $like;
        $params['qmoodleshort'] = $like;
        if (ctype_digit($q)) {
            $parts[] = 'o.id = :qofferingid';
            $parts[] = 'o.moodlecourseid = :qmoodleid';
            $params['qofferingid'] = (int)$q;
            $params['qmoodleid'] = (int)$q;
        }
        $where[] = '(' . implode(' OR ', $parts) . ')';
    }

    $sql = "SELECT o.id AS offeringid, o.consumerid AS offeringconsumerid, o.workspaceid, o.moodlecourseid,
                   o.course_key, o.title, o.summary, o.syllabus, o.prerequisites, o.startdate, o.enddate,
                   o.capacity, o.visibility, o.approval_mode, o.status, o.timemodified,
                   w.name AS workspacename, w.slug AS workspaceslug, w.workspace_type, w.status AS workspacestatus,
                   COALESCE(ci.id, cw.id, 0) AS consumerid,
                   COALESCE(ci.name, cw.name, '') AS consumername,
                   COALESCE(ci.slug, cw.slug, '') AS consumerslug,
                   COALESCE(ci.consumer_type, cw.consumer_type, '') AS consumer_type,
                   COALESCE(ci.status, cw.status, '') AS consumerstatus,
                   mc.fullname AS moodlefullname, mc.shortname AS moodleshortname, mc.visible AS moodlevisible,
                   cc.name AS moodlecategory,
                   COUNT(CASE WHEN r.status IN ('approved', 'enrolled') THEN 1 END) AS approvedcount,
                   COUNT(CASE WHEN r.status = 'pending' THEN 1 END) AS pendingcount,
                   COUNT(CASE WHEN r.status = 'drop_requested' THEN 1 END) AS droprequestedcount,
                   COUNT(CASE WHEN r.status = 'dropped' THEN 1 END) AS droppedcount,
                   COUNT(CASE WHEN r.status = 'rejected' THEN 1 END) AS rejectedcount,
                   COUNT(CASE WHEN r.status = 'cancelled' THEN 1 END) AS cancelledcount,
                   COUNT(r.id) AS requestcount
              FROM {local_prequran_course_offering} o
         LEFT JOIN {local_prequran_workspace} w ON w.id = o.workspaceid
         LEFT JOIN {local_prequran_consumer} ci ON ci.id = o.consumerid
         LEFT JOIN {local_prequran_consumer} cw ON cw.primaryworkspaceid = o.workspaceid
         LEFT JOIN {course} mc ON mc.id = o.moodlecourseid
         LEFT JOIN {course_categories} cc ON cc.id = mc.category
         LEFT JOIN {local_prequran_course_enrol_req} r ON r.offeringid = o.id
             WHERE " . implode(' AND ', $where) . "
          GROUP BY o.id, o.consumerid, o.workspaceid, o.moodlecourseid, o.course_key, o.title, o.summary, o.syllabus,
                   o.prerequisites, o.startdate, o.enddate, o.capacity, o.visibility, o.approval_mode, o.status, o.timemodified,
                   w.name, w.slug, w.workspace_type, w.status,
                   ci.id, ci.name, ci.slug, ci.consumer_type, ci.status,
                   cw.id, cw.name, cw.slug, cw.consumer_type, cw.status,
                   mc.fullname, mc.shortname, mc.visible, cc.name
          ORDER BY consumername ASC, w.name ASC, o.status ASC, o.startdate ASC, o.title ASC, o.id ASC";
    return array_values($DB->get_records_sql($sql, $params, 0, 500));
}

function pqpcr_open_seats($row): string {
    $capacity = (int)($row->capacity ?? 0);
    if ($capacity <= 0) {
        return 'Unlimited';
    }
    $open = $capacity - (int)($row->approvedcount ?? 0);
    return $open <= 0 ? 'Full' : (string)$open;
}

function pqpcr_url_params(array $filters, array $extra = []): array {
    $params = [];
    foreach (['consumerid', 'workspaceid'] as $key) {
        if ((int)$filters[$key] > 0) {
            $params[$key] = (int)$filters[$key];
        }
    }
    foreach (['status', 'visibility', 'q'] as $key) {
        if ((string)$filters[$key] !== '') {
            $params[$key] = (string)$filters[$key];
        }
    }
    return array_merge($params, $extra);
}
