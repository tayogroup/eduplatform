<?php
declare(strict_types=1);

require(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/public_pages.php');

$PAGE->set_url('/local/ehelhome/dashboards.php');
$PAGE->set_context(context_system::instance());
$PAGE->set_pagelayout('embedded');
$PAGE->set_title('Student, Parent, Teacher, and Admin Dashboards');
$PAGE->set_heading('Student, Parent, Teacher, and Admin Dashboards');
$PAGE->set_cacheable(false);

$urls = ehp_page_urls();
echo $OUTPUT->header();
echo ehp_styles();
?>
<main class="ehp-shell">
  <?php echo ehp_header('dashboards'); ?>
  <section class="ehp-main">
    <div class="ehp-wrap">
      <div class="ehp-hero ehp-hero--image ehp-hero--dashboards ehp-dashboard-hero">
        <p class="ehp-eyebrow">Dashboards</p>
        <h1 class="ehp-title">Role-based dashboards for students, parents, teachers, and academy staff</h1>
        <p class="ehp-intro">Each user sees the right learning tools after login. Students see enrolled courses and next activities, parents see connected children, teachers see assigned learners and live-session work, and admins see operational controls.</p>
        <div class="ehp-actions">
          <a class="ehp-btn" href="<?php echo s($urls['dashboard']); ?>">Open Dashboard</a>
          <a class="ehp-btn ehp-btn-light" href="<?php echo s($urls['reports']); ?>">View Reports</a>
        </div>
      </div>
      <div class="ehp-grid">
        <article class="ehp-card"><h2>Student Dashboard</h2><p>Students see only their enrolled courses, live sessions, assignments, practice activities, feedback, and next steps.</p></article>
        <article class="ehp-card"><h2>Parent Dashboard</h2><p>Parents can follow linked children, review course access, check updates, see teacher feedback, and join approved family support areas.</p></article>
        <article class="ehp-card"><h2>Teacher Dashboard</h2><p>Teachers can access assigned classes, student follow-up, live sessions, feedback tools, schedules, and class records.</p></article>
        <article class="ehp-card"><h2>Admin Dashboard</h2><p>Academy staff can manage intake, access, grouping, live sessions, course visibility, reports, support, and quality review.</p></article>
        <article class="ehp-card"><h2>Course Access</h2><p>Dashboard course cards are based on Moodle enrollment, so a learner only sees courses they are approved and enrolled in.</p></article>
        <article class="ehp-card"><h2>Family Visibility</h2><p>Dashboards connect learning activity, teacher feedback, live sessions, and follow-up so families know what is happening.</p></article>
        <article class="ehp-card"><h2>Student Rooms</h2><p>Students can find supervised practice rooms, homework blocks, and live-session access from the same protected learning area.</p></article>
        <article class="ehp-card"><h2>Teacher-Parent Rooms</h2><p>Parents and teachers can use shared rooms for support planning, learner goals, progress review, and follow-up.</p></article>
        <article class="ehp-card"><h2>Gamification</h2><p>Progress signals, quiz outcomes, stars, and practice activity help students see momentum while teachers keep the learning purposeful.</p></article>
        <article class="ehp-card"><h2>Self-Evaluation</h2><p>Students can review confidence, practice results, homework, and teacher feedback so they know what to repeat or ask about next.</p></article>
        <article class="ehp-card"><h2>Live Chat</h2><p>Families can reach the academy team for enrollment, placement, account help, and live-session questions from public support pages.</p></article>
      </div>
    </div>
  </section>
  <?php echo ehp_footer(); ?>
</main>
<?php echo $OUTPUT->footer(); ?>
