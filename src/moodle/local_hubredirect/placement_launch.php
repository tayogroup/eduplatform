<?php
declare(strict_types=1);

// Launch the Prerequisite unit (unit -1 — the placement exam) under Safe Exam
// Browser.
//
// The course app is static on the CDN and cannot mint a .seb config or a
// signed ticket, so when a learner reaches the exam in an ordinary tab the app
// sends them here with the progress token it was launched with. This endpoint
// is the enforceable half of that gate: it verifies the token, checks real
// enrolment, and only then hands the exam to SEB.
//
// Three outcomes:
//   * already inside SEB     → straight to the app on unit -1 (no loop)
//   * SEB is the way in      → the sebs:// handover page
//   * SEB cannot be used     → focus mode, the install-free fallback
//
// Focus mode is the fallback because Safe Exam Browser has no Android build at
// all, and a placement exam that cannot be taken on the family's only device is
// a child who cannot be placed. It is deterrence and evidence, not prevention,
// and the launch records which of the two was used.

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/seb_lib.php');
require_once($CFG->dirroot . '/local/prequran/progress_gatewaylib.php');

$dashboardurl = new moodle_url('/local/hubredirect/student_dashboard.php');

// --- who, and for which course -------------------------------------------
// The app carries a progress token, not a Moodle session cookie it can rely on
// (it is on another origin). The token already binds one learner to one course
// and is signed and revocable, so it is the right credential here. A logged-in
// staff member without a token can still reach this with ?course=.
$token = optional_param('token', '', PARAM_RAW_TRIMMED);
$learnerid = 0;
$coursekey = '';
if ($token !== '') {
    $claims = pqpg_verify_token($token);
    if ($claims === null) {
        pqh_access_denied('This exam link has expired. Open your course again from your dashboard.',
            $dashboardurl, 'Link expired');
    }
    $learnerid = (int)($claims['sub'] ?? 0);
    $coursekey = (string)($claims['course'] ?? '');
}
if ($learnerid <= 0) {
    require_login();
    $learnerid = (int)$USER->id;
    $coursekey = optional_param('course', '', PARAM_ALPHANUMEXT);
}
// pqpg_ehel_app_base is the single source of truth for which course keys have
// an app to launch. Asking it here (rather than repeating its regex) is what
// makes every subject in that map get placement automatically.
if ($coursekey === '' || pqpg_ehel_app_base($coursekey) === null) {
    pqh_access_denied('That course has no placement exam.', $dashboardurl, 'Exam unavailable');
}

$courseid = (int)$DB->get_field('course', 'id', ['idnumber' => $coursekey]);
if ($courseid <= 0) {
    pqh_access_denied('That course does not exist.', $dashboardurl, 'Course unavailable');
}
if (!is_enrolled(context_course::instance($courseid), $learnerid, '', true) && !is_siteadmin($learnerid)) {
    pqh_access_denied('You are not enrolled in this course.', $dashboardurl, 'Not enrolled');
}

// Host from the request, path and scheme from wwwroot. See
// pqh_seb_request_base() — building this by hand as scheme . HTTP_HOST dropped
// wwwroot's path, so a subdirectory install got release URLs that 404'd.
$base = pqh_seb_request_base();
$authority = pqh_seb_request_authority();   // host+path, for the sebs:// handoff

// NOTE: there is deliberately NO "already inside SEB, so let them through"
// shortcut here. A course launch also opens SEB, under the free-exit lesson
// profile, and a learner arriving from one must still be handed the exam
// profile — otherwise the exam silently runs on lesson terms, which is exactly
// what this whole path exists to stop. Sending them the sebs:// handover below
// makes SEB reconfigure onto the exam profile.
//
// This cannot loop: the handover starts the app with sessionKind=exam, and the
// app's gate accepts that, so it never comes back here.

// --- lockdown switched off site-wide --------------------------------------
// Send the learner to the exam plainly, carrying sebExempt=1. That flag is what
// stops an infinite bounce: the app gates the exam whenever it sees an ordinary
// tab, so without the server saying "this one may run open" the app would send
// them straight back here and this endpoint would send them straight back to
// the app. It is NOT a security boundary — a learner can add it to the URL
// themselves — but nothing on a CDN-served page is, and the progress token is
// what makes a result count.
if (!pqh_seb_placement_enabled()) {
    $plain = pqpg_ehel_launch_url($learnerid, $coursekey, '', $base, -1);
    if ($plain === '') {
        pqh_access_denied('This course has no placement exam app.', $dashboardurl, 'Exam unavailable');
    }
    redirect(new moodle_url($plain . '&sebExempt=1'));
}

// --- focus-mode fallback --------------------------------------------------
// Chosen when the learner asked for it (their device cannot run SEB) or when
// their saved launch preference is focus. The exam still runs; it is simply
// honest about being weaker.
$fallback = optional_param('fallback', '', PARAM_ALPHA);
$pref = pqh_seb_launch_pref($learnerid);
if ($fallback === 'focus' || $pref !== 'seb') {
    $url = pqpg_ehel_launch_url($learnerid, $coursekey, '', $base, -1);
    if ($url === '') {
        pqh_access_denied('This course has no placement exam app.', $dashboardurl, 'Exam unavailable');
    }
    // Focus mode does not go through seb_config.php, so it supplies its own
    // session params. back=1: there is no SEB to quit here, so release returns
    // the learner to their dashboard rather than the SEB quit page.
    $release = $base . '/local/hubredirect/seb_release.php?placement=1&back=1&course='
        . rawurlencode($coursekey) . '&k='
        . rawurlencode(pqh_seb_course_ticket($learnerid,
            pqh_seb_placement_ticket_key($coursekey), 8 * HOURSECS));
    $url .= '&focusMode=1&sessionKind=exam'
        // course_focus_event.php, NOT seb_focus_event.php: the app authenticates
        // focus reports with the launch token it already holds, which is what
        // this endpoint verifies. The seb_ one belongs to the scheduled-exam
        // system and expects an exam attempt instead.
        . '&focusEndpoint=' . rawurlencode($base . '/local/hubredirect/course_focus_event.php')
        . '&exitUrl=' . rawurlencode($release)
        . '&exitAfter=' . (pqh_seb_placement_cap_minutes() * 60)
        . '&learnAfter=0&lockOn=0';
    pqh_seb_placement_mark_start($learnerid);
    redirect(new moodle_url($url));
}

// --- the SEB handover -----------------------------------------------------
// sebs:// makes SEB fetch the config itself over HTTPS, so the learner never
// has to find and open a downloaded file. SEB carries no Moodle session, hence
// the short-lived signed ticket. The .seb download stays as a visible fallback
// for devices where the protocol handler is not registered.
$ticket = pqh_seb_course_ticket($learnerid, pqh_seb_placement_ticket_key($coursekey));
$path = '/local/hubredirect/seb_config.php?placement=' . rawurlencode($coursekey)
    . '&k=' . rawurlencode($ticket);
// $authority is host+path, so both of these keep wwwroot's subdirectory. The
// download link reuses $base rather than hardcoding https:// — on a plain-HTTP
// dev install a hardcoded scheme makes the fallback unreachable.
$sebs = 'sebs://' . $authority . $path;
$download = $base . $path;
$focusurl = $base . '/local/hubredirect/placement_launch.php?fallback=focus'
    . ($token !== '' ? '&token=' . rawurlencode($token) : '&course=' . rawurlencode($coursekey));

header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: private, no-store');
echo '<!doctype html><html lang="en"><head><meta charset="utf-8">'
    . '<meta name="viewport" content="width=device-width,initial-scale=1">'
    . '<title>Opening your exam</title>'
    . '</head><body style="font-family:system-ui,-apple-system,Segoe UI,Arial,sans-serif;'
    . 'max-width:560px;margin:14vh auto;padding:0 20px;text-align:center;color:#17324a">'
    . '<h1 style="font-size:22px;font-weight:600;margin:0 0 10px">Opening your exam…</h1>'
    . '<p style="color:#5a6b7d;margin:0 0 22px">Safe Exam Browser is starting. '
    . 'If your browser asks for permission to open it, choose <b>Open</b>.<br>'
    . 'The exam closes on its own when you finish it.</p>'
    . '<p><a href="' . s($sebs) . '" style="display:inline-block;padding:12px 22px;'
    . 'background:#1f5fa8;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">'
    . 'Start my exam</a></p>'
    . '<p style="margin-top:26px;font-size:13px;color:#7a8794">Nothing happening? '
    . '<a href="' . s($download) . '" style="color:#1f5fa8">Download the exam file</a> and open it, '
    . 'or <a href="' . s($focusurl) . '" style="color:#1f5fa8">take it in focus mode</a> '
    . 'if this device cannot run Safe Exam Browser.</p>'
    // Fire the protocol handler, then leave the tab on a page worth returning
    // to. No auto-redirect to the dashboard here: unlike a lesson launch, a
    // learner who cannot start needs the fallback links above to still be
    // on screen.
    . '<script>setTimeout(function(){location.href=' . json_encode($sebs) . ';},60);</script>'
    . '</body></html>';
