<?php
// ---- report: teacher-marketplace-request (request-teacher chooser; read-only) --
// Ported from local_hubredirect/teacher_marketplace_request.php via
// teacher_marketplace_portallib (pqtml_*; that page defines no functions of its
// own — its profile lookup is inline and is ported verbatim below). Included
// from portal_data.php AFTER token auth: $claims verified, $USER set to the
// token user, JSON exception handler installed, headers sent.
// GET  = the chooser state for one teacherid. The legacy page navigates with
//        redirect(); each redirect becomes a JSON state + target URL:
//          teacherid <= 0      -> state=choose_teacher, redirect=marketplace
//          no published profile -> state=not_available,  redirect=marketplace
//          logged in            -> state=enroll_redirect, redirect=enrollment
//          otherwise            -> state=options (log in / start new request)
// POST = none: the legacy page defines no write blocks (pure GET chooser,
//        no data_submitted/sesskey handling), so POST is rejected.

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/teacher_marketplace_portallib.php');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    pqpd_fail(400, 'The teacher marketplace request report is read-only.');
}

// -- GET: same resolution order as the page (no entry access check on the
// legacy page: it is public; the token only proves how the portal was opened).
$consumercontext = pqh_requested_consumer_context();
$consumerparams = ['consumer' => (string)$consumercontext->consumerslug];
$brandname = trim((string)($consumercontext->consumername ?? '')) ?: 'the marketplace';
$teacherid = optional_param('teacherid', 0, PARAM_INT);
$requesturl = new moodle_url('/local/hubredirect/teacher_marketplace_request.php', ['teacherid' => $teacherid] + $consumerparams);
$marketplaceurl = new moodle_url('/local/hubredirect/teacher_marketplace.php', $consumerparams);

if ($teacherid <= 0) {
    // Legacy: redirect(teacher_marketplace.php).
    echo json_encode([
        'ok' => true,
        'state' => 'choose_teacher',
        'brandname' => $brandname,
        'redirect' => $marketplaceurl->out(false),
    ], JSON_UNESCAPED_SLASHES);
    exit;
}

// Profile lookup — inline block from the legacy page, verbatim.
$profile = null;
if ($DB->get_manager()->table_exists('local_prequran_teacher_profile')) {
    $profilecolumns = $DB->get_columns('local_prequran_teacher_profile');
    $conditions = ['userid' => $teacherid, 'status' => 'active'];
    if (array_key_exists('marketplace_visible', $profilecolumns)) {
        $conditions['marketplace_visible'] = 1;
    }
    if (array_key_exists('marketplace_status', $profilecolumns)) {
        $conditions['marketplace_status'] = 'published';
    }
    if (array_key_exists('vetting_status', $profilecolumns)) {
        $conditions['vetting_status'] = 'approved';
    }
    if (array_key_exists('consumerid', $profilecolumns)
            && (int)$consumercontext->consumerid > 0) {
        $conditions['consumerid'] = (int)$consumercontext->consumerid;
    }
    $profiles = $DB->get_records('local_prequran_teacher_profile', $conditions, 'timemodified DESC', '*', 0, 1);
    $profile = $profiles ? reset($profiles) : null;
}
if (!$profile) {
    // Legacy: redirect(teacher_marketplace.php).
    echo json_encode([
        'ok' => true,
        'state' => 'not_available',
        'brandname' => $brandname,
        'redirect' => $marketplaceurl->out(false),
    ], JSON_UNESCAPED_SLASHES);
    exit;
}
$profileurl = $profile
    ? pqh_teacher_public_profile_url($profile, $consumercontext)
    : new moodle_url('/local/hubredirect/teacher_marketplace_profile.php', ['teacherid' => $teacherid] + $consumerparams);

$teachername = trim((string)($profile->teacher_display_name ?? ''));
if ($teachername === '') {
    $teachername = 'this teacher';
}
$loginurl = new moodle_url('/local/hubredirect/consumer_login.php', [
    'consumer' => (string)$consumercontext->consumerslug,
    'intent' => 'login',
    'wantsurl' => $requesturl->out(false),
]);
$newrequesturl = new moodle_url('/local/hubredirect/marketplace_enrollment.php', ['teacherid' => $teacherid] + $consumerparams);

// Legacy: logged-in non-guest users are redirected straight to the required
// marketplace enrollment. Under token auth $USER is the token user, so portal
// viewers always take this branch; the anonymous two-option state is kept for
// parity with the page's code path.
$state = (isloggedin() && !isguestuser()) ? 'enroll_redirect' : 'options';

echo json_encode([
    'ok' => true,
    'state' => $state,
    'brandname' => $brandname,
    'teacherid' => $teacherid,
    'teachername' => $teachername,
    'profileurl' => $profileurl->out(false),
    'loginurl' => $loginurl->out(false),
    'newrequesturl' => $newrequesturl->out(false),
    'marketplaceurl' => $marketplaceurl->out(false),
    'redirect' => $state === 'enroll_redirect' ? $newrequesturl->out(false) : '',
], JSON_UNESCAPED_SLASHES);
exit;
