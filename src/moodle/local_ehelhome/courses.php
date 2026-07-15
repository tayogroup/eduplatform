<?php
declare(strict_types=1);

require(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/public_pages.php');

$PAGE->set_url('/local/ehelhome/courses.php');
$PAGE->set_context(context_system::instance());
$PAGE->set_pagelayout('embedded');
$PAGE->set_title('Online Quran and Arabic Courses');
$PAGE->set_heading('Online Quran and Arabic Courses');
$PAGE->set_cacheable(false);

$courses = [
    ['Pre-Quraan', 'Foundational Arabic letters, sounds, harakat, joining, listening, speaking, writing, and child-friendly practice for new learners.'],
    ['Tarbiyah Kids', 'Character, manners, daily Islamic values, family activities, stories, reflection, and supervised habits for young learners.'],
    ['Essential Arabic', 'Basic Arabic reading, writing, vocabulary, sentence understanding, and comprehension for students building language confidence.'],
    ['Quran Reading', 'Guided reading fluency, pronunciation, rhythm, tajweed readiness, passage practice, correction, and confidence building.'],
    ['Quran Tafsir', 'Age-appropriate Quran meanings, vocabulary, stories, discussion, reflection, and practical lessons for daily life.'],
    ['Quran Memorization', 'Surah targets, memorization plans, revision schedules, teacher listening, mistake tracking, and family-supported review.'],
];
$urls = ehp_page_urls();
echo $OUTPUT->header();
echo ehp_styles();
?>
<main class="ehp-shell">
  <?php echo ehp_header('courses'); ?>
  <section class="ehp-main">
    <div class="ehp-wrap">
      <div class="ehp-hero ehp-hero--image ehp-hero--courses">
        <p class="ehp-eyebrow">Learning paths</p>
        <h1 class="ehp-title">Online Quran and Arabic courses for children, families, and institutions</h1>
        <p class="ehp-intro">Families and institutions can choose one course or combine courses as the learner grows. Each course is designed with clear goals, teacher guidance, practice activities, gamified motivation, self-evaluation, placement support, and progress visibility.</p>
      </div>
      <div class="ehp-grid">
        <?php foreach ($courses as $course): ?>
          <article class="ehp-card"><h2><?php echo s($course[0]); ?></h2><p><?php echo s($course[1]); ?></p></article>
        <?php endforeach; ?>
      </div>
      <div class="ehp-actions">
        <a class="ehp-btn" href="<?php echo s($urls['enroll']); ?>">Request Enrollment</a>
        <a class="ehp-btn ehp-btn-light" href="<?php echo s($urls['inquiry']); ?>">Ask About Courses</a>
      </div>
    </div>
  </section>
  <?php echo ehp_footer(); ?>
</main>
<?php echo $OUTPUT->footer(); ?>
