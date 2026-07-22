<?php
// ---- report: teacher-marketplace (public marketplace browse; read-only) ----
// Ported from local_hubredirect/teacher_marketplace.php via
// teacher_marketplace_portallib (pqtml_*). Included from portal_data.php AFTER
// token auth: $claims verified, $USER set to the token user, JSON exception
// handler installed, headers sent.
// GET  = the published/approved teacher cards matching the q/course/language
//        filters, scoped to the requested consumer — query logic verbatim.
// POST = none: the legacy page defines no write blocks (pure GET search page,
//        no data_submitted/sesskey handling), so POST is rejected.

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/teacher_marketplace_portallib.php');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    pqpd_fail(400, 'The teacher marketplace report is read-only.');
}

// -- GET: same resolution order as the page (no entry access check on the
// legacy page: it is public; the token only proves how the portal was opened).
$consumercontext = pqh_requested_consumer_context();
$consumerparams = ['consumer' => (string)$consumercontext->consumerslug];
$brandname = (string)$consumercontext->consumername;
$loggedin = isloggedin() && !isguestuser();

$query = trim(optional_param('q', '', PARAM_TEXT));
$course = trim(optional_param('course', '', PARAM_TEXT));
$language = trim(optional_param('language', '', PARAM_TEXT));
$ready = pqtml_ready();
$teachers = [];

if ($ready) {
    $where = [
        'tp.status = :activestatus',
        'tp.marketplace_visible = 1',
        'tp.marketplace_status = :marketstatus',
        'tp.vetting_status = :vettingstatus',
        'u.deleted = 0',
        'u.suspended = 0',
    ];
    $params = [
        'activestatus' => 'active',
        'marketstatus' => 'published',
        'vettingstatus' => 'approved',
    ];
    if (pqtml_column_exists('local_prequran_teacher_profile', 'consumerid') && (int)$consumercontext->consumerid > 0) {
        $where[] = 'tp.consumerid = :consumerid';
        $params['consumerid'] = (int)$consumercontext->consumerid;
    }
    if ($query !== '') {
        $like = '%' . $DB->sql_like_escape($query) . '%';
        $where[] = '(' . $DB->sql_like('tp.teacher_display_name', ':qname', false)
            . ' OR ' . $DB->sql_like('tp.marketplace_bio', ':qbio', false)
            . ' OR ' . $DB->sql_like('tp.marketplace_skills', ':qskills', false)
            . ' OR ' . $DB->sql_like('tp.marketplace_experience', ':qexp', false) . ')';
        $params['qname'] = $like;
        $params['qbio'] = $like;
        $params['qskills'] = $like;
        $params['qexp'] = $like;
    }
    if ($course !== '') {
        $where[] = '(' . $DB->sql_like('tp.courses_taught', ':course', false)
            . ' OR ' . $DB->sql_like('tp.marketplace_courses', ':marketcourse', false) . ')';
        $params['course'] = '%' . $DB->sql_like_escape($course) . '%';
        $params['marketcourse'] = '%' . $DB->sql_like_escape($course) . '%';
    }
    if ($language !== '') {
        $where[] = '(tp.primary_language = :language OR ' . $DB->sql_like('tp.other_languages', ':otherlanguage', false) . ')';
        $params['language'] = $language;
        $params['otherlanguage'] = '%' . $DB->sql_like_escape($language) . '%';
    }
    $teachers = array_values($DB->get_records_sql(
        "SELECT tp.*, u.firstname, u.lastname
           FROM {local_prequran_teacher_profile} tp
           JOIN {user} u ON u.id = tp.userid
          WHERE " . implode(' AND ', $where) . "
       ORDER BY tp.vetting_reviewedat DESC, tp.timemodified DESC",
        $params,
        0,
        100
    ));
}

// Project each row down to exactly the fields the page renders (name fallback,
// pqtml_short truncation, profile/request URLs) — the query selects tp.* for
// verbatim parity but vetting/contact columns must not reach the client.
$cards = [];
foreach ($teachers as $teacher) {
    $name = trim((string)$teacher->teacher_display_name) !== '' ? (string)$teacher->teacher_display_name : fullname($teacher);
    $cards[] = [
        'userid' => (int)$teacher->userid,
        'name' => $name,
        'primary_language' => (string)$teacher->primary_language,
        'timezone' => (string)$teacher->timezone,
        'courses' => (string)$teacher->courses_taught !== '' ? pqtml_short((string)$teacher->courses_taught, 130) : '',
        'skills' => (string)$teacher->marketplace_skills !== '' ? pqtml_short((string)$teacher->marketplace_skills, 150) : '',
        'bio' => (string)$teacher->marketplace_bio !== '' ? pqtml_short((string)$teacher->marketplace_bio) : '',
        'profileurl' => pqh_teacher_public_profile_url($teacher, $consumercontext)->out(false),
        'requesturl' => (new moodle_url('/local/hubredirect/teacher_marketplace_request.php', ['teacherid' => (int)$teacher->userid] + $consumerparams))->out(false),
    ];
}

echo json_encode([
    'ok' => true,
    'ready' => $ready,
    'brandname' => $brandname,
    'consumer' => (string)$consumercontext->consumerslug,
    'loggedin' => $loggedin,
    'filters' => ['q' => $query, 'course' => $course, 'language' => $language],
    'teachers' => $cards,
    // The legacy header action links (My requests / Dashboard / Log in) stay
    // on the Moodle host during the parallel run.
    'myrequestsurl' => (new moodle_url('/local/hubredirect/teacher_marketplace_requests.php', $consumerparams))->out(false),
    'dashboardurl' => (new moodle_url('/local/hubredirect/dashboard.php'))->out(false),
    'loginurl' => (new moodle_url('/login/index.php', $consumerparams))->out(false),
], JSON_UNESCAPED_SLASHES);
exit;
