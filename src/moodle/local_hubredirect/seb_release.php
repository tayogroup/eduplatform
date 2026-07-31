<?php
declare(strict_types=1);

// Conditional exit gate for a locked SEB lesson. The lesson app sends the
// learner here when they ask to finish; this decides whether they have earned
// release and only then redirects to the quitURL (which makes SEB quit).
//
// Release happens on WHICHEVER COMES FIRST:
//   * the learning-time target,
//   * no outstanding homework for the course,
//   * the hard cap — the safety net, so a failed condition check can never
//     strand a child in a browser they cannot quit.
//
// Ticket-authenticated: SEB carries no Moodle session, so the same short-lived
// signed ticket used for the config authenticates this call.

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/seb_lib.php');

$coursekey = optional_param('course', '', PARAM_ALPHANUMEXT);
$ticket = optional_param('k', '', PARAM_RAW_TRIMMED);

$learnerid = 0;
$claims = $ticket !== '' ? pqh_seb_course_ticket_verify($ticket) : null;
if ($claims !== null) {
    $learnerid = (int)$claims['userid'];
    if ($coursekey === '') {
        $coursekey = (string)$claims['course'];
    }
}
if ($learnerid <= 0) {
    require_login();
    $learnerid = (int)$USER->id;
}
if ($claims !== null && (string)$claims['course'] !== $coursekey) {
    throw new moodle_exception('invalidrequest', 'error', '', null, 'Ticket is not valid for this course.');
}

$courseid = 0;
if (preg_match('/^ehel-(?:eng|math|sci)-g\d{2}$/', $coursekey)) {
    $courseid = (int)$DB->get_field('course', 'id', ['idnumber' => $coursekey]);
} else if (preg_match('/^moodle_(\d+)$/', $coursekey, $mm)) {
    $courseid = (int)$mm[1];
}

[$release, $reason, $secondsleft] = pqh_seb_release_decision($learnerid, $courseid);

// The lock being off means there is nothing to hold them in: always release.
if (!pqh_seb_course_lock_enabled()) {
    $release = true;
    $reason = 'unlocked';
}

if ($release) {
    // Clear the session stamp so the next lesson starts a fresh clock.
    unset_user_preference('local_prequran_seb_started', $learnerid);
    // Focus mode / ordinary browser: there is no SEB to quit, so send the
    // learner back to their dashboard instead of the SEB quit page.
    if (optional_param('back', 0, PARAM_BOOL)) {
        redirect(new moodle_url('/local/hubredirect/student_dashboard.php'));
    }
    redirect(new moodle_url('/local/hubredirect/seb_quit.php', ['reason' => $reason]));
}

// Not yet, in a browser session (back=1, i.e. focus/normal mode — no SEB to
// hold them): send them to the courses page anyway with a "not finished"
// notice. Nothing physically stops leaving in these modes, so pretending
// otherwise just strands them on an interstitial.
if (optional_param('back', 0, PARAM_BOOL)) {
    redirect(new moodle_url('/local/hubredirect/student_dashboard.php', ['sebnotice' => 'keepgoing']));
}

// Not yet — show what is left. No exit from this page by design; the app keeps
// running behind it and the learner returns to the lesson.
$mins = (int)ceil($secondsleft / 60);
$outstanding = $courseid > 0 ? pqh_seb_outstanding_homework($learnerid, $courseid) : 0;

header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: private, no-store');
echo '<!doctype html><html lang="en"><head><meta charset="utf-8">'
    . '<meta name="viewport" content="width=device-width,initial-scale=1">'
    . '<title>Keep going</title></head>'
    . '<body style="font-family:system-ui,-apple-system,Segoe UI,Arial,sans-serif;'
    . 'max-width:560px;margin:12vh auto;padding:0 20px;text-align:center;color:#17324a">'
    . '<h1 style="font-size:22px;font-weight:600;margin:0 0 10px">Keep going — you are not finished yet</h1>'
    . '<p style="color:#5a6b7d;margin:0 0 6px">About <b>' . (int)$mins . ' minute' . ($mins === 1 ? '' : 's')
    . '</b> of learning left.</p>'
    . ($outstanding > 0
        ? '<p style="color:#5a6b7d;margin:0 0 22px">Or finish your <b>' . (int)$outstanding
          . ' homework task' . ($outstanding === 1 ? '' : 's') . '</b> to end early.</p>'
        : '<p style="color:#5a6b7d;margin:0 0 22px">Finish your homework to end early.</p>')
    . '<p><a href="javascript:history.back()" style="display:inline-block;padding:12px 22px;'
    . 'background:#1f5fa8;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">'
    . 'Back to my lesson</a></p>'
    . '<p style="margin-top:26px;font-size:13px;color:#7a8794">If you need to stop now, ask your teacher.</p>'
    . '</body></html>';
