<?php
// Syllabus authoring and approval, served from the school's own domain.
//
// This replaces the Bunny-hosted portal page for staff use: every other admin
// tool in this workspace is a native /local/hubredirect page, and routing the
// syllabus through the CDN meant a launch token, a cross-origin fetch, and a
// CDN cache in front of an internal form. All the logic already lives in
// syllabus_portallib.php -- this page just renders it server-side.
//
// syllabus_view.php (public, read-only) and syllabus_pdf.php are unchanged and
// remain the learner/parent-facing surfaces.
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/syllabus_portallib.php');

$requestedworkspaceid = optional_param('workspaceid', 0, PARAM_INT);
$workspaceid = pqh_current_workspace_id((int)$USER->id, $requestedworkspaceid);
$consumercontext = pqh_requested_consumer_context();
$urlparams = [];
if (!empty($consumercontext->consumerslug)) {
    $urlparams['consumer'] = (string)$consumercontext->consumerslug;
}
if ($workspaceid > 0) {
    $urlparams['workspaceid'] = $workspaceid;
}

// Teachers author their own courses, managers author any and approve. Anyone
// without a teaching role in the workspace has no business here at all.
if ($workspaceid <= 0 || !pqh_user_can_teach_in_workspace((int)$USER->id, $workspaceid)) {
    pqh_access_denied(
        'Only teachers and workspace administrators can work on syllabi.',
        new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams),
        'Syllabus access required'
    );
}

$workspace = $DB->get_record('local_prequran_workspace', ['id' => $workspaceid], '*', IGNORE_MISSING);
if (!$workspace) {
    pqh_access_denied(
        'The selected workspace was not found.',
        new moodle_url('/local/hubredirect/workspace_dashboard.php'),
        'Workspace not found'
    );
}
pqh_enforce_role_domain($consumercontext, $workspaceid, (int)$USER->id);

$ready = pqsyl_ready();
$canapprove = $ready ? pqsyl_can_approve((int)$USER->id, $workspaceid) : false;
$courses = $ready ? pqsyl_workspace_courses($workspaceid) : [];
$year = optional_param('year', $ready ? pqsyl_current_year($workspaceid) : (int)date('Y'), PARAM_INT);
$courseid = optional_param('courseid', 0, PARAM_INT);
if ($courseid <= 0 && $courses) {
    $courseid = (int)$courses[0]['courseid'];
}

// Never let a courseid from the query string reach the library unless it
// genuinely belongs to this workspace.
$courseknown = false;
foreach ($courses as $candidate) {
    if ((int)$candidate['courseid'] === $courseid) {
        $courseknown = true;
        break;
    }
}
if (!$courseknown) {
    $courseid = 0;
}
$canauthor = ($ready && $courseid > 0) ? pqsyl_can_author((int)$USER->id, $workspaceid, $courseid) : false;

$message = '';
$error = '';
if ($ready && $courseid > 0 && $_SERVER['REQUEST_METHOD'] === 'POST') {
    require_sesskey();
    $action = optional_param('action', '', PARAM_ALPHANUMEXT);
    try {
        if (in_array($action, ['save', 'submit'], true) && !$canauthor) {
            throw new moodle_exception('nopermissions', 'error', '', 'You do not teach this course.');
        }
        if (in_array($action, ['approve', 'reject', 'retire', 'visibility'], true) && !$canapprove) {
            throw new moodle_exception('nopermissions', 'error', '', 'Only workspace administrators can do that.');
        }
        if ($action === 'save') {
            $data = [
                'overview' => optional_param('overview', '', PARAM_TEXT),
                'teacher_intro' => optional_param('teacher_intro', '', PARAM_TEXT),
                'contact' => optional_param('contact', '', PARAM_TEXT),
            ];
            foreach (array_keys(pqsyl_policy_blocks()) as $policykey) {
                $data['policy_' . $policykey] = optional_param('policy_' . $policykey, '', PARAM_TEXT);
            }
            pqsyl_save($workspaceid, $consumercontext, $courseid, $year, (int)$USER->id, $data);
            $message = 'Syllabus saved as a draft.';
        } else if ($action === 'submit') {
            pqsyl_transition($workspaceid, $courseid, $year, (int)$USER->id, 'submit');
            $message = 'Sent to the school administrator for approval.';
        } else if ($action === 'approve') {
            pqsyl_transition($workspaceid, $courseid, $year, (int)$USER->id, 'approve', optional_param('note', '', PARAM_TEXT));
            $message = 'Syllabus approved.';
        } else if ($action === 'reject') {
            pqsyl_transition($workspaceid, $courseid, $year, (int)$USER->id, 'reject', optional_param('note', '', PARAM_TEXT));
            $message = 'Returned to the teacher with your note.';
        } else if ($action === 'retire') {
            pqsyl_transition($workspaceid, $courseid, $year, (int)$USER->id, 'retire');
            $message = 'Syllabus retired.';
        } else if ($action === 'visibility') {
            pqsyl_set_visibility($workspaceid, $courseid, $year, (int)$USER->id, optional_param('visibility', 'enrolled', PARAM_ALPHANUMEXT));
            $message = 'Visibility updated.';
        } else {
            throw new moodle_exception('invalidaction', 'error', '', 'Choose a valid syllabus action.');
        }
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
}

$row = ($ready && $courseid > 0) ? pqsyl_get($workspaceid, $courseid, $year) : null;
$policies = pqsyl_decode_policies($row);
$generated = ($ready && $courseid > 0)
    ? pqsyl_generated($workspaceid, $courseid)
    : ['alignment' => null, 'units' => [], 'assessments' => [], 'terms' => [], 'unit_source' => ''];
$status = $row ? (string)$row->status : 'draft';
$statuslabel = pqsyl_status_options()[$status] ?? ucwords(str_replace('_', ' ', $status));
$coursetitle = '';
foreach ($courses as $candidate) {
    if ((int)$candidate['courseid'] === $courseid) {
        $coursetitle = (string)$candidate['title'];
        break;
    }
}

$context = context_system::instance();
$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/syllabus.php', $urlparams));
$PAGE->set_pagelayout('standard');
$pagetitle = trim((string)$workspace->name) !== '' ? $workspace->name . ' Syllabus' : 'Syllabus';
$PAGE->set_title($pagetitle);
$PAGE->set_heading($pagetitle);
$PAGE->add_body_class('pqsy-page');

echo $OUTPUT->header();
?>
<style>
body.pqsy-page header,body.pqsy-page footer,body.pqsy-page nav.navbar,body.pqsy-page #page-header,body.pqsy-page #page-footer,body.pqsy-page .drawer,body.pqsy-page .drawer-toggles,body.pqsy-page .block-region,body.pqsy-page [data-region="drawer"],body.pqsy-page [data-region="right-hand-drawer"]{display:none!important}
body.pqsy-page #page,body.pqsy-page #page-content,body.pqsy-page #region-main,body.pqsy-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqsy-shell{min-height:100vh;padding:28px 18px 56px;background:#fff;color:#173044;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6}
.pqsy-wrap{max-width:1080px;margin:0 auto}
.pqsy-top,.pqsy-panel{padding:20px 22px;border:1px solid var(--pqh-line,#e4e9ef);border-radius:14px;background:var(--pqh-surface,#fff);box-shadow:0 1px 2px rgba(15,34,55,.05),0 10px 28px -16px rgba(15,34,55,.14);margin-bottom:14px}
.pqsy-title{margin:0;color:var(--pqh-ink,#0f2237);font-size:26px;font-weight:800;letter-spacing:-.02em}
.pqsy-sub{margin:7px 0 0;color:var(--pqh-muted,#5b6b7c);font-size:14px;font-weight:500}
.pqsy-panel h2{margin:0 0 12px;color:var(--pqh-ink,#0f2237);font-size:17px;font-weight:750}
/* Section heading -- must stay visually distinct from .pqsy-field label below.
   Both were previously 11px/700/uppercase/faint, so a grouping heading such as
   "Course policies" read as a field label whose input had failed to render. */
.pqsy-panel h3{margin:28px 0 14px;padding-top:16px;border-top:1px solid var(--pqh-line,#e4e9ef);color:var(--pqh-ink,#0f2237);font-size:15px;font-weight:750;text-transform:none;letter-spacing:-.01em}
.pqsy-panel h3:first-child{margin-top:0;padding-top:0;border-top:0}
.pqsy-bar{display:flex;flex-wrap:wrap;gap:10px 14px;align-items:end;margin-bottom:4px}
.pqsy-field{display:grid;gap:5px;min-width:170px}
.pqsy-field--wide{flex:1 1 100%}
.pqsy-field label{color:var(--pqh-faint,#8494a5);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.04em}
.pqsy-help{display:block;margin:-1px 0 3px;color:var(--pqh-muted,#5b6b7c);font-size:12.5px;font-weight:450;line-height:1.45}
.pqsy-textarea::placeholder,.pqsy-input::placeholder{color:var(--pqh-faint,#8494a5);opacity:.75}
.pqsy-input,.pqsy-select,.pqsy-textarea{width:100%;min-height:38px;border:1px solid var(--pqh-line,#e4e9ef);border-radius:10px;padding:8px 11px;background:var(--pqh-surface,#fff);color:var(--pqh-ink,#0f2237);font:inherit;font-size:14px;box-sizing:border-box}
.pqsy-textarea{min-height:110px;line-height:1.5}
.pqsy-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 14px;border:1px solid var(--pqh-line,#e4e9ef);border-radius:10px;background:var(--pqh-surface,#fff);color:var(--pqh-ink,#0f2237)!important;text-decoration:none;font-size:13.5px;font-weight:650;cursor:pointer}
.pqsy-btn:hover{background:var(--pqh-tint,#edf3fc);border-color:var(--pqh-tint-2,#e0ebfa)}
.pqsy-btn--primary{background:var(--pqh-primary,#2166d1);border-color:var(--pqh-primary,#2166d1);color:#fff!important}
.pqsy-btn--primary:hover{background:var(--pqh-primary-ink,#17498f);border-color:var(--pqh-primary-ink,#17498f)}
.pqsy-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}
.pqsy-pill{display:inline-flex;min-height:25px;align-items:center;padding:0 9px;border-radius:999px;background:var(--pqh-tint,#edf3fc);color:var(--pqh-primary-ink,#17498f);font-size:12px;font-weight:700}
.pqsy-pill--approved{background:#e8f4ec;color:#2e7d4f}
.pqsy-pill--review{background:#faf1dd;color:#b7791f}
.pqsy-pill--retired{background:#fbe9e7;color:#c0392b}
.pqsy-alert{padding:12px 14px;margin-bottom:12px;border-radius:10px;font-weight:600}
.pqsy-alert--ok{background:#e8f4ec;color:#2e7d4f}
.pqsy-alert--bad{background:#fbe9e7;color:#c0392b}
.pqsy-empty{padding:18px;border:1px dashed var(--pqh-line,#e4e9ef);border-radius:12px;color:var(--pqh-muted,#5b6b7c);font-weight:550}
.pqsy-note{margin:10px 0 0;padding:10px 12px;border-radius:10px;background:var(--pqh-bg,#f4f6f9);color:var(--pqh-muted,#5b6b7c);font-size:13px}
.pqsy-table{width:100%;border-collapse:separate;border-spacing:0;font-size:13.5px}
.pqsy-table th,.pqsy-table td{padding:8px 10px;border-bottom:1px solid var(--pqh-line,#e4e9ef);text-align:left;vertical-align:top}
.pqsy-table th{color:var(--pqh-faint,#8494a5);font-size:11px;font-weight:700;text-transform:uppercase}
<?php echo pqh_design_shell_css('.pqsy-shell'); ?>
</style>
<style><?php echo pqh_openproject_skin_css('pqsy', 'pqsy-page'); ?></style>
<style><?php echo pqh_viewer_chrome_css('.pqsy-shell'); ?></style>
<main class="pqsy-shell">
<?php
echo pqh_design_shell_html('pqsy-shell', 'workspace', [
    'title' => $pagetitle,
    'appbar' => [
        ['Workspace', new moodle_url('/local/hubredirect/admin_workspace.php', $urlparams)],
        ['Dashboard', new moodle_url('/local/hubredirect/workspace_dashboard.php', $urlparams)],
    ],
]);
?>
  <div class="pqsy-wrap">
    <section class="pqsy-top">
      <h1 class="pqsy-title">Course Syllabus</h1>
      <p class="pqsy-sub">Teachers write the narrative; a school administrator approves it. The schedule, units, and assessment sections are generated from live platform data and cannot be edited here.</p>
    </section>

    <?php if ($message !== ''): ?><div class="pqsy-alert pqsy-alert--ok"><?php echo s($message); ?></div><?php endif; ?>
    <?php if ($error !== ''): ?><div class="pqsy-alert pqsy-alert--bad"><?php echo s($error); ?></div><?php endif; ?>

    <?php if (!$ready): ?>
      <section class="pqsy-panel"><div class="pqsy-empty">The syllabus tables are not installed yet. Run the local_prequran plugin upgrade, then reload this page.</div></section>
    <?php elseif (!$courses): ?>
      <section class="pqsy-panel"><div class="pqsy-empty">No courses are linked to this workspace yet, so there is nothing to write a syllabus for.</div></section>
    <?php else: ?>
      <section class="pqsy-panel">
        <form class="pqsy-bar" method="get">
          <?php foreach ($urlparams as $key => $value): ?>
            <input type="hidden" name="<?php echo s((string)$key); ?>" value="<?php echo s((string)$value); ?>">
          <?php endforeach; ?>
          <div class="pqsy-field" style="flex:1 1 320px">
            <label for="pqsy-course">Course</label>
            <select class="pqsy-select" id="pqsy-course" name="courseid" onchange="this.form.submit()">
              <?php foreach ($courses as $candidate): ?>
                <option value="<?php echo (int)$candidate['courseid']; ?>"<?php echo (int)$candidate['courseid'] === $courseid ? ' selected' : ''; ?>><?php echo s((string)$candidate['title']); ?></option>
              <?php endforeach; ?>
            </select>
          </div>
          <div class="pqsy-field">
            <label for="pqsy-year">Academic year</label>
            <select class="pqsy-select" id="pqsy-year" name="year" onchange="this.form.submit()">
              <?php for ($y = pqsyl_current_year($workspaceid) - 2; $y <= pqsyl_current_year($workspaceid) + 2; $y++): ?>
                <option value="<?php echo (int)$y; ?>"<?php echo (int)$y === $year ? ' selected' : ''; ?>><?php echo s(pqsyl_year_label($y)); ?></option>
              <?php endfor; ?>
            </select>
          </div>
          <span class="pqsy-pill<?php echo $status === 'approved' ? ' pqsy-pill--approved' : ($status === 'in_review' ? ' pqsy-pill--review' : ($status === 'retired' ? ' pqsy-pill--retired' : '')); ?>"><?php echo s($statuslabel); ?></span>
          <noscript><button class="pqsy-btn" type="submit">Show</button></noscript>
        </form>
        <?php if ($row && trim((string)$row->review_note) !== ''): ?>
          <div class="pqsy-note"><strong>Reviewer note:</strong> <?php echo s((string)$row->review_note); ?></div>
        <?php endif; ?>
        <?php if (!$canauthor && !$canapprove): ?>
          <div class="pqsy-note">You can read this syllabus, but only the assigned teacher or a workspace administrator can change it.</div>
        <?php endif; ?>
      </section>

      <section class="pqsy-panel">
        <h2>Narrative<?php echo $coursetitle !== '' ? ' &mdash; ' . s($coursetitle) : ''; ?></h2>
        <form method="post">
          <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
          <input type="hidden" name="action" value="save">
          <input type="hidden" name="courseid" value="<?php echo (int)$courseid; ?>">
          <input type="hidden" name="year" value="<?php echo (int)$year; ?>">
          <div class="pqsy-field pqsy-field--wide">
            <label for="pqsy-overview">About this course</label>
            <span class="pqsy-help">The first thing a parent reads. Say what the course covers this year, what learners are assumed to know already, and how often it runs.</span>
            <textarea class="pqsy-textarea" id="pqsy-overview" name="overview" maxlength="8000" placeholder="Example: Grade 4 Mathematics covers place value to 10,000, written methods for all four operations, fractions, measurement and data handling. Learners should already be confident with times tables to 10. Lessons run three times a week, with a problem-solving session every Thursday."<?php echo $canauthor ? '' : ' disabled'; ?>><?php echo s($row ? (string)$row->overview : ''); ?></textarea>
          </div>
          <div class="pqsy-field pqsy-field--wide">
            <label for="pqsy-prerequisites">Prerequisites</label>
            <span class="pqsy-help">What a learner needs before starting: prior grade or course, assumed skills, or any placement check. Write &ldquo;None&rdquo; if the course is open to all &mdash; that is more reassuring to families than a blank section.</span>
            <textarea class="pqsy-textarea" id="pqsy-prerequisites" name="policy_<?php echo s(PQSYL_PREREQ_KEY); ?>" maxlength="4000" placeholder="Example: Completion of Grade 1 English, or a placement conversation with the class teacher. Learners should be able to read simple sentences aloud and write short words unaided."<?php echo $canauthor ? '' : ' disabled'; ?>><?php echo s((string)($policies[PQSYL_PREREQ_KEY] ?? '')); ?></textarea>
          </div>
          <div class="pqsy-field pqsy-field--wide">
            <label for="pqsy-teacher">Your teacher</label>
            <span class="pqsy-help">A short introduction so families know who teaches their child: your name, your background in the subject, and how you like to work.</span>
            <textarea class="pqsy-textarea" id="pqsy-teacher" name="teacher_intro" maxlength="4000" placeholder="Example: I am Ms Amina Yusuf. I have taught primary mathematics for nine years and hold a BEd from the University of Nairobi. My lessons are practical and discussion-led, and I check in with every learner individually each week."<?php echo $canauthor ? '' : ' disabled'; ?>><?php echo s($row ? (string)$row->teacher_intro : ''); ?></textarea>
          </div>
          <div class="pqsy-field pqsy-field--wide">
            <label for="pqsy-contact">How to get in touch</label>
            <span class="pqsy-help">One route families should use, and how quickly they can expect a reply. Use a school channel rather than a personal phone number.</span>
            <input class="pqsy-input" id="pqsy-contact" name="contact" maxlength="1000" placeholder="Example: Message me through the parent portal. I reply within two school days, Sunday to Thursday." value="<?php echo s($row ? (string)$row->contact : ''); ?>"<?php echo $canauthor ? '' : ' disabled'; ?>>
          </div>
          <h3>Course policies</h3>
          <?php
            // Keyed to pqsyl_policy_blocks(); a block with no entry here simply
            // renders without guidance rather than breaking.
            $policyguidance = [
                'materials' => [
                    'What families need to provide, and what the school supplies.',
                    'Example: Each learner needs an exercise book, a ruler and coloured pencils. The school lends textbooks for the year; a replacement fee applies if one is lost or damaged.',
                ],
                'attendance' => [
                    'Expected attendance, how families report an absence, and what happens after repeated absence.',
                    'Example: Attendance is taken at the start of every lesson. Please tell the office before 8:00am if your child will be absent. After three unexplained absences we will contact you to agree a catch-up plan.',
                ],
                'homework' => [
                    'How much, how often, when it is due, and what happens when it is late.',
                    'Example: Two short tasks a week, about 20 minutes each, set on Sunday and due Wednesday. Late work is accepted for two days; after that it is recorded as incomplete.',
                ],
                'assessment' => [
                    'How the final mark is made up, and when families see grades.',
                    'Example: Continuous assessment 40%, mid-term test 20%, end-of-term examination 40%. Grades are published at the end of each term with a written comment on progress.',
                ],
                'behaviour' => [
                    'What good participation looks like in your class, and the response when expectations are not met.',
                    'Example: Learners arrive on time, come prepared, and let others speak. Disruption is handled with a reminder, then a conversation after class, then a call home.',
                ],
                'support' => [
                    'How learners who fall behind or need more challenge are helped, and how you keep families informed.',
                    'Example: Extra help runs on Tuesday afternoons. I contact families early if a learner is falling behind rather than waiting for the report, and extension work is available on request.',
                ],
            ];
          ?>
          <?php // Prerequisites is rendered above as course information, so it
                // is excluded here -- see PQSYL_PREREQ_KEY in the library. ?>
          <?php foreach (pqsyl_policy_blocks_only() as $policykey => $policylabel): ?>
            <?php $guidance = $policyguidance[$policykey] ?? ['', '']; ?>
            <div class="pqsy-field pqsy-field--wide">
              <label for="pqsy-policy-<?php echo s((string)$policykey); ?>"><?php echo s((string)$policylabel); ?></label>
              <?php if ($guidance[0] !== ''): ?><span class="pqsy-help"><?php echo s($guidance[0]); ?></span><?php endif; ?>
              <textarea class="pqsy-textarea" id="pqsy-policy-<?php echo s((string)$policykey); ?>" name="policy_<?php echo s((string)$policykey); ?>" maxlength="4000" placeholder="<?php echo s($guidance[1]); ?>"<?php echo $canauthor ? '' : ' disabled'; ?>><?php echo s((string)($policies[$policykey] ?? '')); ?></textarea>
            </div>
          <?php endforeach; ?>
          <?php if ($canauthor): ?>
            <div class="pqsy-actions">
              <button class="pqsy-btn pqsy-btn--primary" type="submit">Save draft</button>
            </div>
            <p class="pqsy-sub" style="margin-top:8px">Editing an approved syllabus returns it to draft and clears the approval.</p>
          <?php endif; ?>
        </form>
      </section>

      <?php if ($canauthor || $canapprove): ?>
        <section class="pqsy-panel">
          <h2>Approval</h2>
          <div class="pqsy-actions">
            <?php if ($canauthor): ?>
              <form method="post" style="display:inline-flex;margin:0">
                <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
                <input type="hidden" name="action" value="submit">
                <input type="hidden" name="courseid" value="<?php echo (int)$courseid; ?>">
                <input type="hidden" name="year" value="<?php echo (int)$year; ?>">
                <button class="pqsy-btn" type="submit">Submit for approval</button>
              </form>
            <?php endif; ?>
            <?php if ($canapprove): ?>
              <form method="post" style="display:inline-flex;margin:0">
                <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
                <input type="hidden" name="action" value="retire">
                <input type="hidden" name="courseid" value="<?php echo (int)$courseid; ?>">
                <input type="hidden" name="year" value="<?php echo (int)$year; ?>">
                <button class="pqsy-btn" type="submit">Retire</button>
              </form>
            <?php endif; ?>
          </div>
          <?php if ($canapprove): ?>
            <form method="post" style="margin-top:14px">
              <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
              <input type="hidden" name="courseid" value="<?php echo (int)$courseid; ?>">
              <input type="hidden" name="year" value="<?php echo (int)$year; ?>">
              <div class="pqsy-field pqsy-field--wide">
                <label for="pqsy-note">Reviewer note</label>
                <span class="pqsy-help">Shown to the teacher, and kept on the record. When returning work, say specifically what needs changing.</span>
                <input class="pqsy-input" id="pqsy-note" name="note" maxlength="1000" placeholder="Example: Please add the assessment weightings and confirm the homework due day before this goes out to families.">
              </div>
              <div class="pqsy-actions">
                <button class="pqsy-btn pqsy-btn--primary" type="submit" name="action" value="approve">Approve</button>
                <button class="pqsy-btn" type="submit" name="action" value="reject">Return to teacher</button>
              </div>
            </form>
            <form method="post" style="margin-top:14px">
              <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
              <input type="hidden" name="action" value="visibility">
              <input type="hidden" name="courseid" value="<?php echo (int)$courseid; ?>">
              <input type="hidden" name="year" value="<?php echo (int)$year; ?>">
              <div class="pqsy-bar">
                <div class="pqsy-field">
                  <label for="pqsy-visibility">Who can see it</label>
                  <select class="pqsy-select" id="pqsy-visibility" name="visibility">
                    <?php foreach (pqsyl_visibility_options() as $viskey => $vislabel): ?>
                      <option value="<?php echo s((string)$viskey); ?>"<?php echo $row && (string)$row->visibility === (string)$viskey ? ' selected' : ''; ?>><?php echo s((string)$vislabel); ?></option>
                    <?php endforeach; ?>
                  </select>
                </div>
                <button class="pqsy-btn" type="submit">Update visibility</button>
              </div>
            </form>
          <?php endif; ?>
        </section>
      <?php endif; ?>

      <section class="pqsy-panel">
        <h2>Generated sections</h2>
        <p class="pqsy-sub" style="margin:0 0 12px">Built from curriculum mapping, course units, and the academic calendar. These update themselves &mdash; there is nothing to fill in.</p>
        <?php if (!empty($generated['units'])): ?>
          <h3>What learners will cover<?php echo trim((string)($generated['unit_source'] ?? '')) !== '' ? ' (' . s((string)$generated['unit_source']) . ')' : ''; ?></h3>
          <table class="pqsy-table"><tbody>
            <?php foreach ($generated['units'] as $unit): ?>
              <tr><td><?php echo s(is_array($unit) ? (string)($unit['title'] ?? reset($unit)) : (string)$unit); ?></td></tr>
            <?php endforeach; ?>
          </tbody></table>
        <?php endif; ?>
        <?php if (!empty($generated['assessments'])): ?>
          <h3>Assessment schedule</h3>
          <table class="pqsy-table"><tbody>
            <?php foreach ($generated['assessments'] as $assessment): ?>
              <tr><td><?php echo s(is_array($assessment) ? (string)($assessment['title'] ?? reset($assessment)) : (string)$assessment); ?></td></tr>
            <?php endforeach; ?>
          </tbody></table>
        <?php endif; ?>
        <?php if (!empty($generated['terms'])): ?>
          <h3>Term dates</h3>
          <table class="pqsy-table"><tbody>
            <?php foreach ($generated['terms'] as $term): ?>
              <tr><td><?php echo s(is_array($term) ? (string)($term['title'] ?? reset($term)) : (string)$term); ?></td></tr>
            <?php endforeach; ?>
          </tbody></table>
        <?php endif; ?>
        <?php if (empty($generated['units']) && empty($generated['assessments']) && empty($generated['terms'])): ?>
          <div class="pqsy-empty">Nothing generated yet. Curriculum mapping, course units, and academic calendar terms all feed these sections.</div>
        <?php endif; ?>
      </section>

      <?php $statusrows = pqsyl_workspace_status($workspaceid, $year); ?>
      <section class="pqsy-panel">
        <h2>Syllabus Status &mdash; <?php echo s(pqsyl_year_label($year)); ?></h2>
        <p class="pqsy-sub" style="margin:0 0 12px">Where every course in this workspace stands for the selected year. Filter to <strong>Not started</strong> to find courses with no syllabus written yet.</p>
        <?php if (!$statusrows): ?>
          <div class="pqsy-empty">No courses to report on yet.</div>
        <?php else: ?>
          <?php
            $statuslabels = ['not_started' => 'Not started'] + pqsyl_status_options();
            $statuscounts = [];
            foreach ($statusrows as $statusrow) {
                $key = (string)$statusrow['status'];
                $statuscounts[$key] = ($statuscounts[$key] ?? 0) + 1;
            }
            $visibilitylabels = pqsyl_visibility_options();
          ?>
          <div class="pqsy-bar" style="margin-bottom:12px">
            <div class="pqsy-field" style="flex:1 1 260px">
              <label for="pqsy-status-search">Search courses</label>
              <input class="pqsy-input" id="pqsy-status-search" type="search" placeholder="Course name or status">
            </div>
            <div class="pqsy-field">
              <label for="pqsy-status-filter">Status</label>
              <select class="pqsy-select" id="pqsy-status-filter">
                <option value="">All statuses</option>
                <?php foreach ($statuslabels as $statuskey => $statustext): ?>
                  <?php if (!isset($statuscounts[$statuskey])) { continue; } ?>
                  <option value="<?php echo s((string)$statuskey); ?>"><?php echo s((string)$statustext); ?> (<?php echo (int)$statuscounts[$statuskey]; ?>)</option>
                <?php endforeach; ?>
              </select>
            </div>
            <span class="pqsy-sub" style="margin:0 0 8px auto"><?php echo (int)($statuscounts['approved'] ?? 0); ?> approved / <?php echo count($statusrows); ?> course<?php echo count($statusrows) === 1 ? '' : 's'; ?></span>
          </div>
          <table class="pqsy-table" id="pqsy-status-table">
            <thead><tr><th>Course</th><th>Status</th><th>Visibility</th><th>Last updated</th><th>Approved by</th><th>Open</th></tr></thead>
            <tbody>
              <?php foreach ($statusrows as $statusrow): ?>
                <?php
                  $rowstatus = (string)$statusrow['status'];
                  $rowstatuslabel = $statuslabels[$rowstatus] ?? ucwords(str_replace('_', ' ', $rowstatus));
                  $rowpill = 'pqsy-pill';
                  if ($rowstatus === 'approved') {
                      $rowpill .= ' pqsy-pill--approved';
                  } else if ($rowstatus === 'in_review') {
                      $rowpill .= ' pqsy-pill--review';
                  } else if ($rowstatus === 'retired') {
                      $rowpill .= ' pqsy-pill--retired';
                  }
                  $rowurl = new moodle_url('/local/hubredirect/syllabus.php', $urlparams + [
                      'courseid' => (int)$statusrow['courseid'],
                      'year' => (int)$year,
                  ]);
                ?>
                <tr data-filter="<?php echo s(strtolower((string)$statusrow['title'] . ' ' . $rowstatuslabel)); ?>" data-status="<?php echo s($rowstatus); ?>">
                  <td><?php echo s((string)$statusrow['title']); ?></td>
                  <td><span class="<?php echo s($rowpill); ?>"><?php echo s($rowstatuslabel); ?></span></td>
                  <td><?php echo (string)$statusrow['visibility'] !== '' ? s($visibilitylabels[(string)$statusrow['visibility']] ?? (string)$statusrow['visibility']) : '<span class="pqsy-sub">&mdash;</span>'; ?></td>
                  <td><?php echo (int)$statusrow['timemodified'] > 0 ? s(userdate((int)$statusrow['timemodified'], get_string('strftimedate'))) : '<span class="pqsy-sub">&mdash;</span>'; ?></td>
                  <td><?php echo (string)$statusrow['approvedbyname'] !== '' ? s((string)$statusrow['approvedbyname']) : '<span class="pqsy-sub">&mdash;</span>'; ?></td>
                  <td><a class="pqsy-btn" href="<?php echo $rowurl->out(false); ?>">Open</a></td>
                </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        <?php endif; ?>
      </section>
    <?php endif; ?>
  </div>
</main>
<script>
(function() {
  var search = document.getElementById('pqsy-status-search');
  var statusSelect = document.getElementById('pqsy-status-filter');
  var table = document.getElementById('pqsy-status-table');
  if (!search || !table) {
    return;
  }
  function apply() {
    var needle = search.value.toLowerCase().trim();
    var status = statusSelect ? statusSelect.value : '';
    table.querySelectorAll('tbody tr').forEach(function(row) {
      var haystack = row.getAttribute('data-filter') || '';
      var matchesText = needle === '' || haystack.indexOf(needle) !== -1;
      var matchesStatus = status === '' || row.getAttribute('data-status') === status;
      row.style.display = (matchesText && matchesStatus) ? '' : 'none';
    });
  }
  search.addEventListener('input', apply);
  if (statusSelect) {
    statusSelect.addEventListener('change', apply);
  }
}());
</script>
<?php
echo $OUTPUT->footer();
