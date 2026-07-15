<?php
declare(strict_types=1);

require(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/public_pages.php');

$PAGE->set_url('/local/ehelhome/features.php');
$PAGE->set_context(context_system::instance());
$PAGE->set_pagelayout('embedded');
$PAGE->set_title('Quran Learning Features');
$PAGE->set_heading('Quran Learning Features');
$PAGE->set_cacheable(false);

$features = [
    ['Multi-Lingual Support', 'Families and institutions can be supported across languages so instructions, feedback, and communication are easier to understand.'],
    ['Media-Rich Lessons', 'Audio, video, visuals, repetition, and interactive activities help students hear, see, practice, and remember.'],
    ['Gamified Practice', 'Stars, focused practice, quizzes, activities, and progress signals help students stay motivated while teachers still guide the learning.'],
    ['Self-Evaluation', 'Students can reflect on practice, confidence, quiz outcomes, homework, and next steps so they learn to recognize what needs review.'],
    ['Learning Monitoring', 'Student activity, focus, homework, and lesson progress can be reviewed so teachers and parents know when support is needed.'],
    ['Student Rooms', 'Student rooms support supervised practice, homework blocks, listening, correction, and monitored self-learning outside regular class time.'],
    ['Teacher-Parent Rooms', 'Teachers and families can meet in shared rooms for placement, learner goals, progress review, support plans, and follow-up.'],
    ['Live Chat Support', 'Families can reach the academy team from the public site for enrollment, placement, account help, scheduling, and general questions.'],
    ['Safe Communication', 'Family messaging, teacher feedback, live chat, consent, access, and reporting are organized around student privacy and protection.'],
    ['WhatsApp Alerts', 'Urgent parent alerts and important follow-up can be delivered through WhatsApp where family contact settings allow it.'],
    ['Institution Programs', 'Schools, masjids, and community organizations can coordinate learners, courses, live sessions, reports, and teacher follow-up.'],
    ['Quality Review', 'Live classes, feedback, teacher follow-up, recordings, and improvement actions can be reviewed for quality and consistency.'],
    ['Practice Coach', 'Teacherless practice can be supported with short prompts, activity checks, and summaries that help teachers and parents follow up.'],
];
echo $OUTPUT->header();
echo ehp_styles();
?>
<main class="ehp-shell">
  <?php echo ehp_header('features'); ?>
  <section class="ehp-main">
    <div class="ehp-wrap">
      <div class="ehp-hero ehp-hero--image ehp-hero--features">
        <p class="ehp-eyebrow">Academy features</p>
        <h1 class="ehp-title">Human teaching supported by thoughtful technology</h1>
        <p class="ehp-intro">The academy blends teacher care, structure, supervised practice, family and institutional visibility, privacy, media assets, live rooms, and reporting to create a protected and measurable Quran learning journey.</p>
      </div>
      <div class="ehp-grid">
        <?php foreach ($features as $feature): ?>
          <article class="ehp-card"><h2><?php echo s($feature[0]); ?></h2><p><?php echo s($feature[1]); ?></p></article>
        <?php endforeach; ?>
      </div>
    </div>
  </section>
  <?php echo ehp_footer(); ?>
</main>
<?php echo $OUTPUT->footer(); ?>
