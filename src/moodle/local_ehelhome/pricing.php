<?php
declare(strict_types=1);

require(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/public_pages.php');

$PAGE->set_url('/local/ehelhome/pricing.php');
$PAGE->set_context(context_system::instance());
$PAGE->set_pagelayout('embedded');
$PAGE->set_title('Quran Academy Pricing Plans');
$PAGE->set_heading('Quran Academy Pricing Plans');
$PAGE->set_cacheable(false);

$plans = [
    ['Starter', 'Self-learning plus 1 live session per week', '$49 / month', 'Best for new learners who need light teacher guidance and structured weekly accountability.'],
    ['Guided', 'Self-learning plus 2 live sessions per week', '$89 / month', 'A steady option for families who want regular correction, homework review, and progress follow-up.'],
    ['Growth', 'Self-learning plus 3 live sessions per week', '$129 / month', 'Designed for students who need more frequent live teaching, practice support, and parent visibility.'],
    ['Intensive', 'Self-learning plus 4 live sessions per week', '$169 / month', 'For learners who benefit from close teacher support, stronger routine, and faster weekly progress.'],
    ['Accelerated', 'Self-learning plus 5 live sessions per week', '$199 / month', 'A high-support plan for students with ambitious reading, Arabic, tafsir, or memorization goals.'],
];
$urls = ehp_page_urls();
echo $OUTPUT->header();
echo ehp_styles();
?>
<main class="ehp-shell">
  <?php echo ehp_header('pricing'); ?>
  <section class="ehp-main">
    <div class="ehp-wrap">
      <div class="ehp-hero ehp-hero--pricing">
        <p class="ehp-eyebrow">Pricing</p>
        <h1 class="ehp-title">Flexible Quran learning plans for families and institutions</h1>
        <p class="ehp-intro">These are sample pricing plans for planning and review. Each plan combines self-learning access with weekly live teacher-led sessions, practice activities, progress visibility, and family support. Final pricing, placement, and schedule availability can be confirmed by the academy team.</p>
        <div class="ehp-actions">
          <a class="ehp-btn" href="<?php echo s($urls['enroll']); ?>">Request Enrollment</a>
          <a class="ehp-btn ehp-btn-light" href="<?php echo s($urls['inquiry']); ?>">Ask About Pricing</a>
        </div>
      </div>
      <div class="ehp-grid">
        <?php foreach ($plans as $plan): ?>
          <article class="ehp-card">
            <h2><?php echo s($plan[0]); ?></h2>
            <p><strong><?php echo s($plan[2]); ?></strong></p>
            <p><?php echo s($plan[1]); ?></p>
            <p><?php echo s($plan[3]); ?></p>
          </article>
        <?php endforeach; ?>
      </div>
      <ul class="ehp-list">
        <li>All plans include access to assigned self-learning activities and course materials.</li>
        <li>Plans can include gamified practice, self-evaluation, student rooms, teacher-parent rooms, live chat support, and parent-visible reports where enabled.</li>
        <li>Live sessions are scheduled based on teacher availability, placement level, time zone, family preference, or institutional group needs.</li>
        <li>Institutions should contact Ehel Quraan Academy for institution pricing, cohort setup, scheduling, reporting, and program support.</li>
        <li>Pricing is placeholder information and can be adjusted before publication.</li>
      </ul>
    </div>
  </section>
  <?php echo ehp_footer(); ?>
</main>
<?php echo $OUTPUT->footer(); ?>
