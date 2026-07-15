<?php
declare(strict_types=1);

require(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/public_pages.php');

$PAGE->set_url('/local/ehelhome/live-sessions.php');
$PAGE->set_context(context_system::instance());
$PAGE->set_pagelayout('embedded');
$PAGE->set_title('Live Quran Classes and Supervised Practice');
$PAGE->set_heading('Live Quran Classes and Supervised Practice');
$PAGE->set_cacheable(false);

echo $OUTPUT->header();
echo ehp_styles();
?>
<main class="ehp-shell">
  <?php echo ehp_header('live'); ?>
  <section class="ehp-main">
    <div class="ehp-wrap">
      <div class="ehp-hero ehp-hero--image ehp-hero--live ehp-dashboard-hero">
        <p class="ehp-eyebrow">Live sessions</p>
        <h1 class="ehp-title">Teacher-led Quran learning with supervision between classes</h1>
        <p class="ehp-intro">Live sessions give students real teacher attention, correction, encouragement, and accountability. Between sessions, students can continue with structured self-learning, homework, practice coach prompts, and monitored activities.</p>
      </div>
      <ul class="ehp-list">
        <li>Live teacher-led classes with attendance, scheduling, and follow-up.</li>
        <li>Parent rooms for orientation, family support, progress conversations, and community sessions.</li>
        <li>Teacher-parent rooms for learner planning, placement support, goals, and follow-up meetings.</li>
        <li>Student rooms for supervised practice, homework blocks, listening, correction, and monitored self-learning.</li>
        <li>Live chat support for families who need enrollment, schedule, account, or class-access help.</li>
        <li>Self-evaluation prompts and practice summaries that help students recognize what needs review.</li>
        <li>Gamified practice signals, quizzes, and progress feedback to keep children motivated between live classes.</li>
        <li>Strategic use of audio, video, and interactive media to support different learning styles.</li>
      </ul>
    </div>
  </section>
  <?php echo ehp_footer(); ?>
</main>
<?php echo $OUTPUT->footer(); ?>
