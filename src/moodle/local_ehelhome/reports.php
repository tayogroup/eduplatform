<?php
declare(strict_types=1);

require(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/public_pages.php');

$PAGE->set_url('/local/ehelhome/reports.php');
$PAGE->set_context(context_system::instance());
$PAGE->set_pagelayout('embedded');
$PAGE->set_title('Student Dashboards and Parent Reports');
$PAGE->set_heading('Student Dashboards and Parent Reports');
$PAGE->set_cacheable(false);

echo $OUTPUT->header();
echo ehp_styles();
?>
<main class="ehp-shell">
  <?php echo ehp_header('reports'); ?>
  <section class="ehp-main">
    <div class="ehp-wrap">
      <div class="ehp-hero ehp-hero--image ehp-hero--reports ehp-dashboard-hero">
        <p class="ehp-eyebrow">Dashboards and reports</p>
        <h1 class="ehp-title">Clear visibility for students, parents, teachers, and academy staff</h1>
        <p class="ehp-intro">Dashboards and reports help families, institutions, and teachers understand enrollment, course access, live-session attendance, lesson progress, homework, quiz results, teacher feedback, and follow-up needs.</p>
      </div>
      <div class="ehp-grid">
        <article class="ehp-card"><h2>Student Dashboard</h2><p>Students see enrolled courses, live sessions, assignments, practice activities, feedback, and next learning steps.</p></article>
        <article class="ehp-card"><h2>Parent Reports</h2><p>Parents can review progress, attendance, teacher feedback, homework, recordings, focus signals, and follow-up notes.</p></article>
        <article class="ehp-card"><h2>Teacher Tools</h2><p>Teachers can monitor classes, review student work, prepare live sessions, track progress, and communicate with families.</p></article>
        <article class="ehp-card"><h2>Live Monitoring</h2><p>Academy staff can follow session status, practice activity, recordings, follow-ups, and support needs.</p></article>
        <article class="ehp-card"><h2>Course Visibility</h2><p>Each student sees only the courses they are enrolled in, while parents and teachers see connected students.</p></article>
        <article class="ehp-card"><h2>Family Follow-Up</h2><p>Parents can receive important updates, teacher notes, urgent alerts, and guided next steps through organized channels.</p></article>
        <article class="ehp-card"><h2>Self-Evaluation</h2><p>Students can reflect on confidence, quiz outcomes, practice effort, and homework completion so reports lead to better next steps.</p></article>
        <article class="ehp-card"><h2>Gamified Progress</h2><p>Stars, activity signals, quiz performance, and completion patterns help motivate students and give teachers useful review context.</p></article>
        <article class="ehp-card"><h2>Room Activity</h2><p>Student rooms and teacher-parent rooms can be connected to attendance, follow-up, support planning, and academy quality review.</p></article>
      </div>
    </div>
  </section>
  <?php echo ehp_footer(); ?>
</main>
<?php echo $OUTPUT->footer(); ?>
