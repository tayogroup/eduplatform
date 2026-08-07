<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');
require_login();
require_once($CFG->dirroot . '/user/profile/lib.php');
require_once(__DIR__ . '/course_catalog.php');

$pqcl_consumercontext = pqh_requested_consumer_context();
$pqcl_brand = trim((string)($pqcl_consumercontext->consumername ?? 'EduPlatform'));
if ($pqcl_brand === '') {
    $pqcl_brand = 'EduPlatform';
}
$pqcl_initials = strtoupper(substr(preg_replace('/[^a-z0-9]/i', '', $pqcl_brand) ?: 'EP', 0, 2));

function pqcl_is_managed_student(int $userid): bool {
    if ($userid <= 0) {
        return false;
    }
    try {
        $profile = profile_user_record($userid, false);
    } catch (Throwable $e) {
        return false;
    }
    foreach (['managed_student', 'managedstudent', 'managed'] as $field) {
        if (isset($profile->{$field})) {
            $value = strtolower(trim((string)$profile->{$field}));
            return in_array($value, ['1', 'yes', 'true', 'on'], true);
        }
    }
    return false;
}

function pqcl_default_environment(): string {
    global $CFG;
    $requested = strtolower(trim(optional_param('pq_env', '', PARAM_ALPHANUMEXT)));
    if (in_array($requested, ['integration', 'staging', 'production'], true)) {
        return $requested;
    }
    $configured = strtolower(trim((string)get_config('local_prequran', 'bunny_environment')));
    if (in_array($configured, ['integration', 'staging', 'production'], true)) {
        return $configured;
    }
    $host = strtolower((string)(parse_url((string)$CFG->wwwroot, PHP_URL_HOST) ?: ''));
    if ($host !== '' && (strpos($host, 'test') !== false || preg_match('/(^|[.\-])(integration|qa)([.\-]|$)/', $host))) {
        return 'integration';
    }
    if ($host !== '' && preg_match('/(^|[.\-])staging([.\-]|$)/', $host)) {
        return 'staging';
    }
    return 'production';
}

function pqcl_normalize_environment(string $value): string {
    $value = strtolower(trim($value));
    if (in_array($value, ['integration', 'staging', 'production'], true)) {
        return $value;
    }
    return 'production';
}

function pqcl_bunny_environment_base_path(string $env): string {
    $env = pqcl_normalize_environment($env);
    $configured = '';
    try {
        $configured = trim((string)get_config('local_prequran', 'bunny_base_' . $env));
    } catch (Throwable $e) {
        $configured = '';
    }
    if ($configured !== '') {
        $path = parse_url($configured, PHP_URL_PATH);
        $configured = $path !== null && $path !== false && $path !== '' ? $path : $configured;
    }
    if ($configured === '') {
        $configured = [
            'integration' => '/pre_quraan_integration/',
            'staging' => '/pre_quraan_staging/',
            'production' => '/pre_quraan/',
        ][$env];
    }
    $configured = '/' . trim($configured, '/') . '/';
    return $configured;
}

function pqcl_cdn_base_url(string $env): string {
    $env = pqcl_normalize_environment($env);
    return pqh_shared_resource_cdn_base_url($env);
}

function pqcl_course_main_menu_url(string $env, int $targetuserid, bool $managed): string {
    global $CFG;

    $env = pqcl_normalize_environment($env);
    $base = pqcl_cdn_base_url($env) . pqcl_bunny_environment_base_path($env) . 'app/index.html';
    $params = [
        'course' => 'pre_quraan',
        'managed_student' => $managed ? 1 : 0,
        'pq_env' => $env,
        'moodle_origin' => rtrim((string)$CFG->wwwroot, '/'),
        'pq_lang' => 'en',
        'pq_lang_scope' => 'both',
    ];
    if ($targetuserid > 0) {
        $params['studentid'] = $targetuserid;
    }
    return $base . '?' . http_build_query($params, '', '&', PHP_QUERY_RFC3986);
}

// EHEL level-aware Bunny launch (per-grade/stage/level catalog courses).
// These are real Moodle courses created by catalog_sync (idnumber ehel-eng-gNN);
// the dashboard links them as course=moodle_<courseid> (or the idnumber directly).
// They are NOT in pqh_course_catalog(), so without this they would be rejected
// below. When the course resolves to an EHEL key and the learner is enrolled, we
// mint a progress token and redirect straight to the level-aware Bunny app.
// (Wires the launch flow the code previously deferred as "P1.8".)
//
// Which keys qualify is pqpg_ehel_app_base's answer. It used to be a regex
// naming English, Mathematics and Science, which is why Computing, Global
// Perspectives and Intensive English could not be launched into the app at all
// even after they were in the catalog. Asking the map means a subject added
// there becomes launchable here without a second edit — the two must never
// disagree about what an EHEL course is.
require_once($CFG->dirroot . '/local/prequran/progress_gatewaylib.php');
$pqcl_rawcourse = optional_param('course', '', PARAM_ALPHANUMEXT);
$pqcl_ehelkey = '';
$pqcl_ehelcourseid = 0;
if (pqpg_ehel_app_base($pqcl_rawcourse) !== null) {
    $pqcl_ehelkey = $pqcl_rawcourse;
    $pqcl_ehelcourseid = (int)$DB->get_field('course', 'id', ['idnumber' => $pqcl_ehelkey]);
} else if (preg_match('/^moodle_(\d+)$/', $pqcl_rawcourse, $pqcl_mm)) {
    $pqcl_cid = (int)$pqcl_mm[1];
    $pqcl_idn = (string)$DB->get_field('course', 'idnumber', ['id' => $pqcl_cid]);
    if (pqpg_ehel_app_base($pqcl_idn) !== null) {
        $pqcl_ehelkey = $pqcl_idn;
        $pqcl_ehelcourseid = $pqcl_cid;
    }
}
if ($pqcl_ehelkey !== '' && $pqcl_ehelcourseid > 0) {
    $pqcl_target = optional_param('studentid', 0, PARAM_INT);
    $pqcl_target = $pqcl_target > 0 ? $pqcl_target : (int)$USER->id;
    $pqcl_ctx = context_course::instance($pqcl_ehelcourseid, IGNORE_MISSING);
    $pqcl_callerenrolled = $pqcl_ctx && is_enrolled($pqcl_ctx, $USER, '', true);
    $pqcl_ok = is_siteadmin()
        || ($pqcl_target === (int)$USER->id && $pqcl_callerenrolled)
        || ($pqcl_callerenrolled && $pqcl_ctx && is_enrolled($pqcl_ctx, $pqcl_target, '', true));
    if (!$pqcl_ok) {
        redirect(new moodle_url('/local/hubredirect/access_denied.php', ['course' => $pqcl_ehelkey]));
    }
    // Safe Exam Browser: starting an enrolled course opens it inside SEB. A
    // normal browser gets the .seb config (which launches SEB and comes back
    // here); a request already coming FROM SEB falls through to the app, so
    // there is no redirect loop.
    // The learner's own On/Off choice on the dashboard wins over the site
    // default (Safe Exam Browser cannot run on Android at all, so this is the
    // escape hatch). Course launches only — exams keep their own enforcement.
    require_once($CFG->dirroot . '/local/hubredirect/seb_lib.php');
    $pqcl_sebpref = pqh_seb_launch_pref((int)$USER->id);
    if (pqh_seb_course_launch_enabled() && $pqcl_sebpref === 'seb' && !pqh_seb_request_is_seb()) {
        // Hand straight to SEB via its sebs:// protocol handler so the learner
        // never has to find and open a downloaded file. SEB fetches the config
        // itself over HTTPS, authenticated by a short-lived signed ticket
        // (it has no Moodle session of its own). The .seb download is kept as
        // a visible fallback for devices where the handler is not registered.
        $pqcl_ticket = pqh_seb_course_ticket($pqcl_target, $pqcl_ehelkey);
        $pqcl_host = (string)($_SERVER['HTTP_HOST'] ?? '');
        if (!preg_match('/^[A-Za-z0-9.\-]+(:\d+)?$/', $pqcl_host)) {
            $pqcl_host = (string)parse_url((string)$CFG->wwwroot, PHP_URL_HOST);
        }
        $pqcl_path = '/local/hubredirect/seb_config.php?course=' . rawurlencode($pqcl_ehelkey)
            . '&k=' . rawurlencode($pqcl_ticket);
        $pqcl_sebs = 'sebs://' . $pqcl_host . $pqcl_path;
        $pqcl_dl = 'https://' . $pqcl_host . $pqcl_path;

        // Where this tab goes once SEB has been handed the launch: back to the
        // dashboard, so closing SEB returns the learner somewhere useful rather
        // than to this hand-off page. location.replace keeps it out of history,
        // so Back does not land here either.
        $pqcl_slug = trim((string)($pqcl_consumercontext->consumerslug ?? ''));
        $pqcl_dash = 'https://' . $pqcl_host . '/local/hubredirect/student_dashboard.php'
            . ($pqcl_slug !== '' ? '?consumer=' . rawurlencode($pqcl_slug) : '');

        header('Content-Type: text/html; charset=utf-8');
        header('Cache-Control: private, no-store');
        echo '<!doctype html><html lang="en"><head><meta charset="utf-8">'
            . '<meta name="viewport" content="width=device-width,initial-scale=1">'
            . '<title>Opening your course</title>'
            . '</head><body style="font-family:system-ui,-apple-system,Segoe UI,Arial,sans-serif;'
            . 'max-width:560px;margin:14vh auto;padding:0 20px;text-align:center;color:#17324a">'
            . '<h1 style="font-size:22px;font-weight:600;margin:0 0 10px">Opening your course…</h1>'
            . '<p style="color:#5a6b7d;margin:0 0 22px">Safe Exam Browser is starting. '
            . 'If your browser asks for permission to open it, choose <b>Open</b>.<br>'
            . 'This page will return to your dashboard.</p>'
            . '<p><a href="' . s($pqcl_sebs) . '" style="display:inline-block;padding:12px 22px;'
            . 'background:#1f5fa8;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">'
            . 'Start now</a></p>'
            . '<p style="margin-top:26px;font-size:13px;color:#7a8794">Nothing happening? '
            . '<a href="' . s($pqcl_dl) . '" style="color:#1f5fa8">Download the config file</a> '
            . 'and open it, or turn Safe Exam Browser off on your dashboard.</p>'
            . '<script>(function(){var s=' . json_encode($pqcl_sebs) . ',d=' . json_encode($pqcl_dash) . ';'
            // Fire the protocol handler first.
            . 'setTimeout(function(){location.href=s;},60);'
            // Then step aside. The delay leaves room for the browser permission
            // prompt to be answered; if the tab is backgrounded (SEB took over)
            // we go as soon as it is looked at again.
            . 'var gone=false,go=function(){if(gone){return;}gone=true;location.replace(d);};'
            . 'setTimeout(go,6000);'
            . 'document.addEventListener("visibilitychange",function(){'
            . 'if(document.visibilityState==="visible"){setTimeout(go,400);}});'
            . '})();</script>'
            . '</body></html>';
        exit;
    }

    $pqcl_env = optional_param('pq_env', '', PARAM_ALPHANUMEXT);
    // Build against the host the learner actually reached us on, not wwwroot.
    $pqcl_lhost = (string)($_SERVER['HTTP_HOST'] ?? '');
    if (!preg_match('/^[A-Za-z0-9.\-]+(:\d+)?$/', $pqcl_lhost)) {
        $pqcl_lhost = (string)parse_url((string)$CFG->wwwroot, PHP_URL_HOST);
    }
    $pqcl_base = 'https://' . $pqcl_lhost;
    $pqcl_url = pqpg_ehel_launch_url($pqcl_target, $pqcl_ehelkey, $pqcl_env, $pqcl_base);
    if ($pqcl_url !== '') {
        // Focus mode: ordinary tab, but the app requests fullscreen and reports
        // tab-switches / blur / fullscreen exits so a teacher sees the pattern.
        // Deterrence and evidence — a web page cannot prevent leaving.
        if ($pqcl_sebpref === 'focus') {
            // Focus mode does NOT go through seb_config.php, so it must supply
            // the same session params itself — without exitUrl the session bar
            // never mounts and focus mode silently does nothing at all.
            // back=1: there is no SEB to quit here, so release returns the
            // learner to their dashboard rather than the SEB quit page.
            $pqcl_rel = $pqcl_base . '/local/hubredirect/seb_release.php?course=' . rawurlencode($pqcl_ehelkey)
                . '&back=1&k=' . rawurlencode(pqh_seb_course_ticket($pqcl_target, $pqcl_ehelkey, 8 * HOURSECS));
            $pqcl_url .= '&focusMode=1'
                . '&focusEndpoint=' . rawurlencode($pqcl_base . '/local/hubredirect/course_focus_event.php')
                . '&exitUrl=' . rawurlencode($pqcl_rel)
                . '&learnAfter=' . (pqh_seb_learn_minutes() * 60)
                . '&exitAfter=' . (pqh_seb_cap_minutes() * 60)
                . '&lockOn=0';
        }
        redirect(new moodle_url($pqcl_url));
    }
}

$pqcl_rawcourseparam = optional_param('course', '', PARAM_ALPHANUMEXT);
$coursekey = pqh_normalize_course_key($pqcl_rawcourseparam);
$studentid = optional_param('studentid', 0, PARAM_INT);
$catalog = pqh_course_catalog();

// Generic (non-catalog, non-Ehel) real Moodle course — reached the same way
// the dashboard links any real enrolment: course=moodle_<courseid>. This is
// what a course created via the workspace "Create new Moodle course"
// self-service flow (course_offerings.php) launches as. If the course's
// name/idnumber matches a catalog subject, fall through to the existing
// catalog-driven launch below so e.g. Pre-Quraan keeps its bespoke app
// experience; otherwise it is a plain Moodle course with no separate app, so
// launch it straight into Moodle's own course page instead of rejecting it.
$pqcl_genericcourseid = 0;
if ($coursekey === '' && preg_match('/^moodle_(\d+)$/', $pqcl_rawcourseparam, $pqcl_genericmm)) {
    $pqcl_genericcandidateid = (int)$pqcl_genericmm[1];
    $pqcl_genericcourse = $DB->get_record('course', ['id' => $pqcl_genericcandidateid], 'id,fullname,shortname,idnumber', IGNORE_MISSING);
    if ($pqcl_genericcourse) {
        $pqcl_genericmatches = pqh_course_catalog_moodle_matches($pqcl_genericcourse);
        if ($pqcl_genericmatches) {
            $coursekey = $pqcl_genericmatches[0];
        } else {
            $pqcl_genericcourseid = $pqcl_genericcandidateid;
        }
    }
}

if ($pqcl_genericcourseid <= 0 && ($coursekey === '' || !isset($catalog[$coursekey]))) {
    pqh_access_denied(
        'Choose a valid course before launching the learning app.',
        new moodle_url('/local/hubredirect/dashboard.php'),
        'Course launch unavailable'
    );
}

$targetuserid = $studentid > 0 ? $studentid : (int)$USER->id;

$canviewtarget = $targetuserid === (int)$USER->id || is_siteadmin((int)$USER->id);
if ($canviewtarget && !pqh_user_belongs_to_consumer_context($targetuserid, $pqcl_consumercontext)) {
    $canviewtarget = false;
}
if (!$canviewtarget) {
    try {
        if ($DB->get_manager()->table_exists('local_prequran_comm_consent')
            && $DB->record_exists('local_prequran_comm_consent', ['guardianid' => (int)$USER->id, 'studentid' => $targetuserid])) {
            $canviewtarget = true;
        }
        if (!$canviewtarget
            && $DB->get_manager()->table_exists('local_prequran_live_consent')
            && $DB->record_exists('local_prequran_live_consent', ['guardianid' => (int)$USER->id, 'studentid' => $targetuserid])) {
            $canviewtarget = true;
        }
        if (!$canviewtarget
            && $DB->get_manager()->table_exists('local_prequran_teacher_student')
            && $DB->record_exists('local_prequran_teacher_student', [
                'teacherid' => (int)$USER->id,
                'studentid' => $targetuserid,
                'status' => 'active',
            ])) {
            $canviewtarget = true;
        }
        if (!$canviewtarget
            && $DB->get_manager()->table_exists('local_prequran_group_member')
            && $DB->get_manager()->table_exists('local_prequran_class_group')
            && $DB->record_exists_sql(
                "SELECT 1
                   FROM {local_prequran_group_member} gm
                   JOIN {local_prequran_class_group} cg ON cg.id = gm.groupid
                  WHERE gm.studentid = :studentid
                    AND gm.assignment_status = :assignmentstatus
                    AND cg.teacherid = :teacherid
                    AND cg.status <> :archived",
                [
                    'studentid' => $targetuserid,
                    'assignmentstatus' => 'active',
                    'teacherid' => (int)$USER->id,
                    'archived' => 'archived',
                ]
            )) {
            $canviewtarget = true;
        }
        if (!$canviewtarget
            && $DB->get_manager()->table_exists('local_prequran_workspace_member')
            && $DB->record_exists_sql(
                "SELECT 1
                   FROM {local_prequran_workspace_member} teacherwm
                   JOIN {local_prequran_workspace_member} studentwm
                     ON studentwm.workspaceid = teacherwm.workspaceid
                    AND studentwm.userid = :studentid
                    AND studentwm.workspace_role = :studentrole
                    AND studentwm.status = :studentstatus
                  WHERE teacherwm.userid = :teacherid
                    AND teacherwm.status = :teacherstatus
                    AND teacherwm.workspace_role IN (:teacherrole, :assistantrole)",
                [
                    'studentid' => $targetuserid,
                    'studentrole' => 'student',
                    'studentstatus' => 'active',
                    'teacherid' => (int)$USER->id,
                    'teacherstatus' => 'active',
                    'teacherrole' => 'teacher',
                    'assistantrole' => 'assistant_teacher',
                ]
            )) {
            $canviewtarget = true;
        }
    } catch (Throwable $e) {
        $canviewtarget = false;
    }
}

if ($pqcl_genericcourseid > 0) {
    $pqcl_genericctx = context_course::instance($pqcl_genericcourseid, IGNORE_MISSING);
    $pqcl_genericenrolled = $pqcl_genericctx && is_enrolled($pqcl_genericctx, $targetuserid, '', true);
    if (!$canviewtarget || (!is_siteadmin((int)$USER->id) && !$pqcl_genericenrolled)) {
        redirect(new moodle_url('/local/hubredirect/access_denied.php', ['course' => $pqcl_rawcourseparam]));
    }
    redirect(new moodle_url('/course/view.php', ['id' => $pqcl_genericcourseid]));
}

$haslegacycourseaccess = pqh_user_can_access_course($targetuserid, $coursekey);
if (!$canviewtarget
    || (!is_siteadmin((int)$USER->id)
        && !$haslegacycourseaccess)) {
    redirect(new moodle_url('/local/hubredirect/access_denied.php', ['course' => $coursekey]));
}

if ($coursekey === 'pre_quraan') {
    redirect(pqcl_course_main_menu_url(
        pqcl_default_environment(),
        $targetuserid,
        pqcl_is_managed_student($targetuserid)
    ));
}

$course = $catalog[$coursekey];
$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/course_launch.php', ['course' => $coursekey]));
$PAGE->set_pagelayout('standard');
$PAGE->set_title($course['title']);
$PAGE->set_heading($course['title']);
$PAGE->add_body_class($coursekey === 'pre_quraan' ? 'pqh-course-main-page' : 'pqh-course-placeholder-page');

pqh_enforce_role_domain($pqcl_consumercontext, pqh_current_workspace_id((int)$USER->id), (int)$USER->id);

echo $OUTPUT->header();

if ($coursekey === 'pre_quraan') {
    $ismycourse = $targetuserid === (int)$USER->id;
    $childparams = $targetuserid > 0 ? ['childid' => $targetuserid] : [];
    $studentparams = $targetuserid > 0 ? ['studentid' => $targetuserid] : [];
    $lessonparams = [
        'goto' => 'alphabet_listen',
        'managed_student' => pqcl_is_managed_student($targetuserid) ? 1 : 0,
        'pq_env' => pqcl_default_environment(),
    ];
    if ($targetuserid > 0 && !$ismycourse) {
        $lessonparams['studentid'] = $targetuserid;
    }
    $quizparams = [
        'pq_env' => 'integration',
        'lessonid' => 'alphabet',
        'unitid' => 'alphabet_quiz',
    ];
    if ($targetuserid > 0) {
        $quizparams['userid'] = $targetuserid;
    }
    $lessonurl = new moodle_url('/local/hubredirect/issue_child.php', $lessonparams);
    $cards = [
        [
            'title' => 'Current Lesson',
            'text' => 'Open the learner\'s current Pre-Quraan lesson and continue from the managed step map.',
            'url' => $lessonurl,
            'primary' => true,
        ],
        [
            'title' => 'Live Sessions',
            'text' => 'Join scheduled review classes and live learning rooms.',
            'url' => new moodle_url('/local/hubredirect/live_sessions.php'),
            'primary' => false,
        ],
        [
            'title' => 'Live Schedule',
            'text' => 'Check upcoming class times, availability, and review sessions.',
            'url' => new moodle_url('/local/hubredirect/live_schedule.php', $childparams),
            'primary' => false,
        ],
        [
            'title' => 'Class Series',
            'text' => 'View recurring class programs and schedule changes.',
            'url' => new moodle_url('/local/hubredirect/live_series_schedule.php', $childparams),
            'primary' => false,
        ],
        [
            'title' => 'Live Calendar',
            'text' => 'See this month\'s classes and add sessions to a calendar.',
            'url' => new moodle_url('/local/hubredirect/live_calendar.php', $childparams),
            'primary' => false,
        ],
        [
            'title' => 'Progress Report',
            'text' => 'Review lessons, focus, practice, quiz, and live-class progress.',
            'url' => new moodle_url('/local/hubredirect/managed_reports.php', $studentparams),
            'primary' => false,
        ],
        [
            'title' => 'Quiz Reports',
            'text' => 'Review alphabet quiz scores, passes, and missed skills.',
            'url' => new moodle_url('/local/hubredirect/quiz_report.php', $quizparams),
            'primary' => false,
        ],
        [
            'title' => 'Speak Recordings',
            'text' => 'Listen to approved Speak practice recordings.',
            'url' => new moodle_url('/local/hubredirect/recordings.php', $childparams),
            'primary' => false,
        ],
        [
            'title' => 'Messages',
            'text' => 'Open teacher messages and academy announcements.',
            'url' => new moodle_url('/local/hubredirect/communications.php', $studentparams + ['opencomm' => 'messages']),
            'primary' => false,
        ],
    ];
    ?>
<style>
body.pqh-course-main-page header,body.pqh-course-main-page footer,body.pqh-course-main-page nav.navbar,body.pqh-course-main-page #page-header,body.pqh-course-main-page #page-footer,body.pqh-course-main-page .drawer,body.pqh-course-main-page .drawer-toggles,body.pqh-course-main-page .block-region{display:none!important}
body.pqh-course-main-page #page,body.pqh-course-main-page #page-content,body.pqh-course-main-page #region-main,body.pqh-course-main-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqh-course-main{min-height:100vh;padding:42px 18px;background:linear-gradient(180deg,#effceb 0%,#fffaf0 100%);color:#17324a;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}
.pqh-course-main__inner{width:min(1160px,100%);margin:0 auto}
.pqh-course-main__top{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:14px 18px;border-radius:16px;background:#f3fff0;border:1px solid rgba(63,138,85,.16);box-shadow:0 12px 32px rgba(23,50,74,.07)}
.pqh-course-main__brand{display:flex;align-items:center;gap:12px;color:#4d3522;font-weight:950}
.pqh-course-main__mark{display:grid;place-items:center;width:46px;height:46px;border-radius:12px;background:#6f4e32;color:#fff}
.pqh-course-main__nav{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}
.pqh-course-main__nav a{display:inline-flex;align-items:center;min-height:36px;padding:0 13px;border-radius:999px;background:#fff7e6;color:#4d3522!important;text-decoration:none;font-size:13px;font-weight:900;border:1px solid rgba(111,78,50,.15)}
.pqh-course-main__hero{margin-top:24px;padding:28px;border-radius:18px;background:linear-gradient(135deg,#fff 0%,#fff9ed 100%);border:1px solid rgba(111,78,50,.14);box-shadow:0 18px 46px rgba(23,50,74,.10)}
.pqh-course-main__kicker{margin:0 0 8px;color:#3f8a55;font-size:13px;font-weight:950;text-transform:uppercase}
.pqh-course-main__title{margin:0;color:#4d3522;font-size:clamp(32px,5vw,52px);line-height:1.04;font-weight:950;letter-spacing:0}
.pqh-course-main__text{max-width:760px;margin:14px 0 0;color:#55705a;font-size:17px;line-height:1.55;font-weight:750}
.pqh-course-main__actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:20px}
.pqh-course-main__btn{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 16px;border-radius:10px;background:#3f8a55;color:#fff!important;text-decoration:none;font-size:14px;font-weight:950}
.pqh-course-main__btn--light{background:#f7fff4;color:#4d3522!important;border:1px solid rgba(111,78,50,.16)}
.pqh-course-main__grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-top:18px}
.pqh-course-main__card{display:flex;flex-direction:column;gap:9px;min-height:150px;padding:20px;border-radius:14px;background:#fff;border:1px solid rgba(63,138,85,.18);box-shadow:0 12px 28px rgba(23,50,74,.07);text-decoration:none}
.pqh-course-main__card strong{color:#0d3a33;font-size:21px;line-height:1.15;font-weight:950}
.pqh-course-main__card span{color:#61705d;font-size:14px;line-height:1.45;font-weight:750}
.pqh-course-main__card em{margin-top:auto;color:#3f8a55;font-style:normal;font-size:13px;font-weight:950}
.pqh-course-main__card--primary{background:#f4fff0;border-color:rgba(63,138,85,.34)}
@media (max-width:900px){.pqh-course-main__top{align-items:flex-start;flex-direction:column}.pqh-course-main__grid{grid-template-columns:1fr}.pqh-course-main{padding:18px 12px}.pqh-course-main__hero{padding:22px}}
<?php echo pqh_dashboard_header_css(); ?>
</style>
<main class="pqh-course-main">
  <div class="pqh-course-main__inner">
    <header class="pqh-course-main__top pqh-workspace-top">
      <div class="pqh-course-main__brand"><span class="pqh-course-main__mark"><?php echo s($pqcl_initials); ?></span><span><?php echo s($pqcl_brand); ?></span></div>
      <nav class="pqh-course-main__nav" aria-label="Course navigation">
        <a href="<?php echo (new moodle_url('/local/hubredirect/dashboard.php'))->out(false); ?>">Dashboard</a>
        <a href="<?php echo (new moodle_url('/local/hubredirect/live_sessions.php'))->out(false); ?>">Live Sessions</a>
        <a href="<?php echo (new moodle_url('/local/hubredirect/communications.php', $studentparams + ['opencomm' => 'messages']))->out(false); ?>">Messages</a>
      </nav>
    </header>
    <section class="pqh-course-main__hero">
      <p class="pqh-course-main__kicker">Course Home</p>
      <h1 class="pqh-course-main__title pqh-workspace-title"><?php echo s((string)$course['title']); ?></h1>
      <p class="pqh-course-main__text"><?php echo s((string)$course['summary']); ?> Use this page to choose lessons, live classes, reports, recordings, and communication tools.</p>
      <div class="pqh-course-main__actions pqh-workspace-actions">
        <a class="pqh-course-main__btn" href="<?php echo $lessonurl->out(false); ?>">Open Current Lesson</a>
        <a class="pqh-course-main__btn pqh-course-main__btn--light" href="<?php echo (new moodle_url('/local/hubredirect/dashboard.php'))->out(false); ?>">Back to Dashboard</a>
      </div>
    </section>
    <section class="pqh-course-main__grid" aria-label="Pre-Quraan course tools">
      <?php foreach ($cards as $card): ?>
        <a class="pqh-course-main__card<?php echo !empty($card['primary']) ? ' pqh-course-main__card--primary' : ''; ?>" href="<?php echo $card['url']->out(false); ?>">
          <strong><?php echo s($card['title']); ?></strong>
          <span><?php echo s($card['text']); ?></span>
          <em>Open</em>
        </a>
      <?php endforeach; ?>
    </section>
  </div>
</main>
<?php
    echo $OUTPUT->footer();
    exit;
}
?>
<style>
body.pqh-course-placeholder-page header,body.pqh-course-placeholder-page footer,body.pqh-course-placeholder-page nav.navbar,body.pqh-course-placeholder-page #page-header,body.pqh-course-placeholder-page #page-footer,body.pqh-course-placeholder-page .drawer,body.pqh-course-placeholder-page .drawer-toggles,body.pqh-course-placeholder-page .block-region{display:none!important}
body.pqh-course-placeholder-page #page,body.pqh-course-placeholder-page #page-content,body.pqh-course-placeholder-page #region-main,body.pqh-course-placeholder-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqh-placeholder{min-height:100vh;display:grid;place-items:center;padding:36px 18px;background:#f4f8f5;color:#17324a;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}
.pqh-placeholder__card{width:min(760px,100%);padding:28px;border-radius:14px;background:#fff;border:1px solid rgba(111,78,50,.14);box-shadow:0 18px 46px rgba(23,50,74,.10)}
.pqh-placeholder__mark{display:inline-grid;place-items:center;width:52px;height:52px;border-radius:13px;background:#6f4e32;color:#fff;font-weight:950;margin-bottom:14px}
.pqh-placeholder__kicker{margin:0 0 7px;color:#3f8a55;font-size:13px;font-weight:950;text-transform:uppercase}
.pqh-placeholder__title{margin:0;color:#4d3522;font-size:34px;line-height:1.1;font-weight:950}
.pqh-placeholder__text{margin:12px 0 0;color:#64745a;font-size:16px;line-height:1.5;font-weight:750}
.pqh-placeholder__panel{margin:18px 0 0;padding:15px;border-radius:10px;background:#f7fff4;border:1px dashed rgba(63,138,85,.26);font-weight:850;color:#36533e}
.pqh-placeholder__actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:20px}
.pqh-placeholder__btn{display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:0 15px;border-radius:9px;background:#6f4e32;color:#fff!important;text-decoration:none;font-size:14px;font-weight:950}
.pqh-placeholder__btn--light{background:#f4fff0;color:#4d3522!important;border:1px solid rgba(111,78,50,.16)}
<?php echo pqh_dashboard_header_css(); ?>
</style>
<main class="pqh-placeholder">
  <section class="pqh-placeholder__card">
    <div class="pqh-placeholder__mark">QA</div>
    <p class="pqh-placeholder__kicker">Course access confirmed</p>
    <h1 class="pqh-placeholder__title pqh-workspace-title"><?php echo s((string)$course['title']); ?></h1>
    <p class="pqh-placeholder__text"><?php echo s((string)$course['summary']); ?></p>
    <div class="pqh-placeholder__panel">
      This course is connected to enrollment and access control. The external TypeScript app can be attached here when it is ready.
    </div>
    <div class="pqh-placeholder__actions pqh-workspace-actions">
      <a class="pqh-placeholder__btn" href="<?php echo (new moodle_url('/local/hubredirect/dashboard.php'))->out(false); ?>">Back to dashboard</a>
      <a class="pqh-placeholder__btn pqh-placeholder__btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_schedule.php', ['childid' => (int)$USER->id]))->out(false); ?>">Live schedule</a>
    </div>
  </section>
</main>
<?php
echo $OUTPUT->footer();
