<?php
require(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/../hubredirect/accesslib.php');

function local_ehelhome_current_custom_consumer_url(): ?moodle_url {
    global $DB;

    $host = strtolower((string)($_SERVER['HTTP_HOST'] ?? ''));
    $host = preg_replace('/:\d+$/', '', $host);
    $host = trim((string)$host, " \t\n\r\0\x0B.");
    if ($host === '') {
        return null;
    }

    try {
        $dbman = $DB->get_manager();
        if (!$dbman->table_exists('local_prequran_consumer_domain') || !$dbman->table_exists('local_prequran_consumer')) {
            return null;
        }
        $consumer = $DB->get_record_sql(
            "SELECT d.workspaceid, c.slug, c.consumer_type, c.defaultpublicpath
               FROM {local_prequran_consumer_domain} d
               JOIN {local_prequran_consumer} c ON c.id = d.consumerid
              WHERE d.domain = :domain
                AND d.status = :domainstatus
                AND c.status = :consumerstatus",
            [
                'domain' => $host,
                'domainstatus' => 'active',
                'consumerstatus' => 'active',
            ],
            IGNORE_MULTIPLE
        );
    } catch (Throwable $e) {
        return null;
    }

    if (!$consumer) {
        return null;
    }

    $path = trim((string)($consumer->defaultpublicpath ?? ''));
    if ((string)$consumer->consumer_type === 'platform_foundation') {
        $path = '/local/hubredirect/platform_landing.php';
    }
    if ($path === '/local/ehelhome/index.php') {
        return null;
    }
    if ($path === '' || $path === '/') {
        $path = '/local/hubredirect/consumer_landing.php';
    }

    $params = ['consumer' => (string)$consumer->slug];
    if ((int)$consumer->workspaceid > 0) {
        $params['workspaceid'] = (int)$consumer->workspaceid;
    }
    return new moodle_url($path, $params);
}

if (!isloggedin() || isguestuser()) {
    $consumerurl = local_ehelhome_current_custom_consumer_url();
    if ($consumerurl) {
        redirect($consumerurl);
    }
}

if (isloggedin() && !isguestuser()) {
    redirect(new moodle_url('/local/hubredirect/dashboard.php'));
}

$quraancontext = pqh_consumer_context_by_slug('quraan-academy');
$quraanbrandname = trim((string)($quraancontext->consumername ?? '')) ?: 'Ehel Quraan Academy';
$quraancopy = json_decode((string)($quraancontext->copyjson ?? ''), true);
if (!is_array($quraancopy)) {
    $quraancopy = [];
}
$quraanlogo = trim((string)($quraancontext->logourl ?? ''));
if ($quraanlogo === '') {
    $quraanlogo = $CFG->wwwroot . '/local/ehelhome/pix/ehelquraanacademy_logo.svg';
}
$quraanbrandsub = trim((string)($quraancopy['brand_subtitle'] ?? 'Online Quran and Arabic learning academy'));
$quraanhero = trim((string)($quraancopy['hero_title'] ?? 'Learn Quran and Arabic with guidance, care, and confidence'));
$quraanintro = trim((string)($quraancopy['hero_copy'] ?? 'Ehel Quraan Academy combines live teacher-led sessions, supervised practice, self-learning, homework support, and parent visibility so children can build Quran and Arabic skills with structure, protection, and encouragement.'));
$quraankicker = trim((string)($quraancopy['hero_kicker'] ?? 'Online Quran and Arabic learning for families and institutions'));

$PAGE->set_url('/local/ehelhome/index.php');
$PAGE->set_context(context_system::instance());
$PAGE->set_pagelayout('embedded');
$PAGE->set_title($quraanbrandname . ' home');
$PAGE->set_heading($quraanbrandname . ' home');
$PAGE->set_cacheable(false);

$sessionexpired = optional_param('sessionexpired', 0, PARAM_BOOL);

echo $OUTPUT->header();
echo $OUTPUT->render_from_template('local_ehelhome/landing', [
    'logintoken' => \core\session\manager::get_login_token(),
    'sessionexpired' => $sessionexpired,
    'config' => [
        'wwwroot' => $CFG->wwwroot,
        'brandname' => $quraanbrandname,
        'brandlogo' => $quraanlogo,
        'brandsubtitle' => $quraanbrandsub,
        'herokicker' => $quraankicker,
        'herotitle' => $quraanhero,
        'herocopy' => $quraanintro,
        'loginurl' => (new moodle_url('/login/index.php'))->out(false),
        'forgoturl' => (new moodle_url('/login/forgot_password.php'))->out(false),
        'studentappurl' => (new moodle_url('/local/hubredirect/issue.php'))->out(false),
        'dashboardurl' => (new moodle_url('/local/hubredirect/dashboard.php'))->out(false),
        'enrollurl' => (new moodle_url('/local/hubredirect/public_intake.php'))->out(false),
        'contacturl' => (new moodle_url('/local/ehelhome/contact.php'))->out(false),
        'inquiryurl' => (new moodle_url('/local/ehelhome/inquiry.php'))->out(false),
        'abouturl' => (new moodle_url('/local/ehelhome/about.php'))->out(false),
        'coursesurl' => (new moodle_url('/local/ehelhome/courses.php'))->out(false),
        'liveurl' => (new moodle_url('/local/ehelhome/live-sessions.php'))->out(false),
        'dashboardsurl' => (new moodle_url('/local/ehelhome/dashboards.php'))->out(false),
        'reportsurl' => (new moodle_url('/local/ehelhome/reports.php'))->out(false),
        'featuresurl' => (new moodle_url('/local/ehelhome/features.php'))->out(false),
        'pricingurl' => (new moodle_url('/local/ehelhome/pricing.php'))->out(false),
    ],
]);
echo $OUTPUT->footer();
