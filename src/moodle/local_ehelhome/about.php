<?php
declare(strict_types=1);

require(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/public_pages.php');

$PAGE->set_url('/local/ehelhome/about.php');
$PAGE->set_context(context_system::instance());
$PAGE->set_pagelayout('embedded');
$PAGE->set_title('About Ehel Quraan Academy');
$PAGE->set_heading('About Ehel Quraan Academy');
$PAGE->set_cacheable(false);

$urls = ehp_page_urls();
echo $OUTPUT->header();
echo ehp_styles();
?>
<main class="ehp-shell">
  <?php echo ehp_header('about'); ?>
  <section class="ehp-main">
    <div class="ehp-wrap">
      <div class="ehp-hero">
        <p class="ehp-eyebrow">About the academy</p>
        <h1 class="ehp-title">A Quran learning environment built for children, families, institutions, and teachers</h1>
        <p class="ehp-intro">Ehel Quraan Academy helps children, families, and institutions learn Quran through live teaching, guided practice, student rooms, teacher-parent rooms, supervised self-learning, parent visibility, and safe communication. Our mission is to make Quran learning accessible, structured, protected, and motivating from home, school, masjid, or community setting.</p>
        <div class="ehp-actions">
          <a class="ehp-btn" href="<?php echo s($urls['enroll']); ?>">Request Enrollment</a>
          <a class="ehp-btn ehp-btn-light" href="<?php echo s($urls['inquiry']); ?>">General Inquiry</a>
        </div>
      </div>
      <div class="ehp-grid">
        <article class="ehp-card"><h2>Mission</h2><p>To help students grow in recitation, Arabic readiness, understanding, memorization, manners, and confidence through structured online learning.</p></article>
        <article class="ehp-card"><h2>Vision</h2><p>To become a trusted online Quran academy where learners can study anywhere with teacher care, family and institutional support, and measurable progress.</p></article>
        <article class="ehp-card"><h2>Institution Support</h2><p>Schools, masjids, and community organizations can coordinate learners, courses, live sessions, progress reports, and teacher follow-up.</p></article>
        <article class="ehp-card"><h2>What Makes Us Unique</h2><p>Live teacher-led classes, student rooms, teacher-parent rooms, supervised homework, gamified practice, self-evaluation, practice coach support, multimedia lessons, parent dashboards, privacy controls, live chat, and quality review work together.</p></article>
      </div>
    </div>
  </section>
  <?php echo ehp_footer(); ?>
</main>
<?php echo $OUTPUT->footer(); ?>
