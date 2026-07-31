<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/accesslib.php');

$consumercontext = pqh_requested_consumer_context();
$requestedworkspaceid = optional_param('workspaceid', 0, PARAM_INT);
if ($requestedworkspaceid <= 0 && (int)($consumercontext->workspaceid ?? 0) > 0) {
    $requestedworkspaceid = (int)$consumercontext->workspaceid;
}
$workspaceid = pqh_current_workspace_id((int)$USER->id, $requestedworkspaceid);
$urlparams = [];
if (!empty($consumercontext->consumerslug)) {
    $urlparams['consumer'] = (string)$consumercontext->consumerslug;
}
if ($workspaceid > 0) {
    $urlparams['workspaceid'] = $workspaceid;
}

function pqht_guides(): array {
    return [
        'consumer_onboarding' => [
            'title' => 'Consumer Onboarding',
            'summary' => 'Bringing a new academy, institution, marketplace, or teacher workspace onto EduPlatform — from the creation wizard through DNS, SSL, optionally grouping it under a parent that owns other consumers, and hand-off to its own admin.',
            'file' => 'consumer_onboarding.php',
        ],
        'course_lifecycle' => [
            'title' => 'Course Creation, Offering & Enrollment',
            'summary' => 'Creating a course, publishing it as an offering, and carrying a student through request, approval, and access.',
            'file' => 'course_lifecycle.php',
        ],
        'cohort_scheduling' => [
            'title' => 'Cross-Timezone Cohorts & Live Scheduling',
            'summary' => 'Turning captured availability into teaching groups across time zones — the weekly grids, teacher shifts, the session requirement on the offering, computed cohort proposals with explicit unplaced reasons, load-balanced teacher matching, and one-click approval that schedules a DST-safe term of live sessions.',
            'file' => 'cohort_scheduling.php',
        ],
        'admin_journey' => [
            'title' => 'Admin Journey: Empty Workspace to Running School',
            'summary' => 'The administrator\'s side of a workspace — getting the role, standing the school up before anyone arrives, admitting and staffing it, the recurring work of a term, closing the books, and the governance underneath. Plus the enforced rules that surprise admins the first time.',
            'file' => 'admin_journey.php',
        ],
        'admissions_review' => [
            'title' => 'Admissions: Reviewing Intake to Enrolled Student',
            'summary' => 'The reviewer\'s side of admissions — what a public enquiry actually creates, reaching the queue and why workspace admins can be refused, how class groups are proposed and weighted, working the five statuses, and the moment accounts come into existence.',
            'file' => 'admissions_review.php',
        ],
        'syllabus_authoring' => [
            'title' => 'Syllabus: Authoring, Approval & Publication',
            'summary' => 'The written half and the generated half, who may touch each, the draft/review/approved/retired track, why approval does not survive an edit, and how approval and visibility are separate switches.',
            'file' => 'syllabus_authoring.php',
        ],
        'student_journey' => [
            'title' => 'Student Journey: Intake to Transcript',
            'summary' => 'Public intake, placement, account conversion, payment, device setup, coursework, attendance, and transcript — plus the policies governing each step.',
            'file' => 'student_journey.php',
        ],
        'teacher_journey' => [
            'title' => 'Teacher Journey: Application to Classroom',
            'summary' => 'Application, vetting, assignment, exam-mode and recording setup, and the day-to-day: attendance, proctoring review, grading, and communication.',
            'file' => 'teacher_journey.php',
        ],
        'parent_journey' => [
            'title' => 'Parent/Guardian Journey: Consent to Classroom',
            'summary' => 'Account access, consent, device setup, payment, progress visibility, live-class safety, and communication — plus the policies governing each, per linked child.',
            'file' => 'parent_journey.php',
        ],
        'ehel_k12_qa_testing' => [
            'title' => 'Controlled Testing: Ehel K-12 QA Accounts',
            'summary' => 'Creating a disposable, tagged batch of Ehel K-12 test students/teachers, exercising dashboards and student grouping, and fully tearing everything down afterward.',
            'file' => 'ehel_k12_qa_testing.php',
        ],
    ];
}

$guides = pqht_guides();
$doc = optional_param('doc', '', PARAM_ALPHANUMEXT);
$active = isset($guides[$doc]) ? $doc : '';

$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/how_to.php', $urlparams + ($active !== '' ? ['doc' => $active] : [])));
$PAGE->set_pagelayout('standard');
$PAGE->set_title($active !== '' ? $guides[$active]['title'] : 'How To');
$PAGE->set_heading($active !== '' ? $guides[$active]['title'] : 'How To');
$PAGE->add_body_class('pqht-page');

echo $OUTPUT->header();

if ($active !== '') {
    ?>
<style>
body.pqht-page header,body.pqht-page footer,body.pqht-page nav.navbar,body.pqht-page #page-header,body.pqht-page #page-footer,body.pqht-page .drawer,body.pqht-page .drawer-toggles,body.pqht-page .block-region,body.pqht-page [data-region="drawer"],body.pqht-page [data-region="right-hand-drawer"]{display:none!important}
body.pqht-page #page,body.pqht-page #page-content,body.pqht-page #region-main,body.pqht-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqht-back{position:sticky;top:0;z-index:5;background:#16261f;padding:10px 16px}
.pqht-back a{color:#f7f4ec!important;text-decoration:none;font:600 13px system-ui,-apple-system,"Segoe UI",Arial,sans-serif}
.pqht-back a:hover{text-decoration:underline}
</style>
<div class="pqht-back"><a href="<?php echo (new moodle_url('/local/hubredirect/how_to.php', $urlparams))->out(false); ?>">&larr; All how-to guides</a></div>
    <?php
    require(__DIR__ . '/how_to_content/' . $guides[$active]['file']);
} else {
    ?>
<style>
body.pqht-page header,body.pqht-page footer,body.pqht-page nav.navbar,body.pqht-page #page-header,body.pqht-page #page-footer,body.pqht-page .drawer,body.pqht-page .drawer-toggles,body.pqht-page .block-region,body.pqht-page [data-region="drawer"],body.pqht-page [data-region="right-hand-drawer"]{display:none!important}
body.pqht-page #page,body.pqht-page #page-content,body.pqht-page #region-main,body.pqht-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqht-shell{min-height:100vh;padding:28px 18px 56px;background:#f6f8fb;color:#173044;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}
.pqht-wrap{max-width:960px;margin:0 auto}
.pqht-top{padding:20px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff;box-shadow:0 12px 28px rgba(23,48,68,.06);margin-bottom:16px}
.pqht-title{margin:0 0 6px;color:#221b22;font-size:28px;font-weight:950}
.pqht-sub{margin:0;color:#5e7280;font-size:14px;font-weight:800}
.pqht-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
.pqht-card{display:block;padding:18px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff;box-shadow:0 12px 28px rgba(23,48,68,.06);text-decoration:none;color:inherit}
.pqht-card:hover{border-color:#2f6f4e}
.pqht-card h2{margin:0 0 8px;color:#221b22;font-size:18px;font-weight:950}
.pqht-card p{margin:0;color:#5e7280;font-size:13px;font-weight:700;line-height:1.5}
@media(max-width:720px){.pqht-grid{grid-template-columns:1fr}}
</style>
<main class="pqht-shell">
  <div class="pqht-wrap">
    <section class="pqht-top">
      <h1 class="pqht-title">How To</h1>
      <p class="pqht-sub">Step-by-step reference guides for how this platform actually works, end to end.</p>
    </section>
    <div class="pqht-grid">
      <?php foreach ($guides as $key => $guide): ?>
        <a class="pqht-card" href="<?php echo (new moodle_url('/local/hubredirect/how_to.php', $urlparams + ['doc' => $key]))->out(false); ?>">
          <h2><?php echo s($guide['title']); ?></h2>
          <p><?php echo s($guide['summary']); ?></p>
        </a>
      <?php endforeach; ?>
    </div>
  </div>
</main>
    <?php
}

echo $OUTPUT->footer();
