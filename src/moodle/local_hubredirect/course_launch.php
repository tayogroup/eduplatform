<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');
require_login();
require_once($CFG->dirroot . '/user/profile/lib.php');
require_once(__DIR__ . '/course_catalog.php');
require_once(__DIR__ . '/course_offeringlib.php');

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

$coursekey = pqh_normalize_course_key(optional_param('course', '', PARAM_ALPHANUMEXT));
$studentid = optional_param('studentid', 0, PARAM_INT);
$catalog = pqh_course_catalog();
if ($coursekey === '' || !isset($catalog[$coursekey])) {
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
    } catch (Throwable $e) {
        $canviewtarget = false;
    }
}

$haslegacycourseaccess = pqh_user_can_access_course($targetuserid, $coursekey);
$hasofferingrequest = pqco_user_has_course_offering_request($targetuserid, $coursekey);
$hasmoodleofferingaccess = pqco_user_has_moodle_offering_access($targetuserid, $coursekey);
if (!$canviewtarget
    || (!is_siteadmin((int)$USER->id)
        && (!$haslegacycourseaccess || ($hasofferingrequest && !$hasmoodleofferingaccess)))) {
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
      This course is connected to Moodle enrollment and access control. The external TypeScript app can be attached here when it is ready.
    </div>
    <div class="pqh-placeholder__actions pqh-workspace-actions">
      <a class="pqh-placeholder__btn" href="<?php echo (new moodle_url('/local/hubredirect/dashboard.php'))->out(false); ?>">Back to dashboard</a>
      <a class="pqh-placeholder__btn pqh-placeholder__btn--light" href="<?php echo (new moodle_url('/local/hubredirect/live_schedule.php', ['childid' => (int)$USER->id]))->out(false); ?>">Live schedule</a>
    </div>
  </section>
</main>
<?php
echo $OUTPUT->footer();
