<?php
// ---- report: institution-profile (public institution/academy profile; read + public inquiry write) ----
// Ported from local_hubredirect/institution_profile.php. That page is PUBLIC —
// it has no require_login and runs as guest; abuse-facing state is a single
// honeypot-guarded inquiry email. There are no page-defined functions to
// extract, so institution_profile_portallib is a guard-only marker.
// Included from portal_data.php AFTER token auth: $claims verified, $USER set to
// the token user, JSON exception handler installed, headers sent — so behind the
// dispatcher this public page still requires a valid portal token, and the
// legacy consumer-type gate becomes pqpd_fail(403, same message).
// GET  = the consumer's public profile (branding, headline, about, services).
// POST = do=send_inquiry (verbatim public-profile inquiry email; honeypot +
//        validation preserved; confirm_sesskey() dropped — token auth replaces
//        the session key; legacy's redirect(?sent=1) becomes an ok JSON reply).

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/institutionlib.php');
require_once($CFG->dirroot . '/local/hubredirect/institution_profile_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

// -- consumer context: resolved from ?consumer=/?workspaceid= exactly like the
//    sibling public endpoint (public_intake_data.php). The CDN host the portal
//    page is served from carries no consumer meaning, so the branding is driven
//    by the query params the launch link forwards. --
$consumer = pqh_requested_consumer_context();
$requestedslug = trim(optional_param('consumer', '', PARAM_ALPHANUMEXT));
$requestedworkspaceid = optional_param('workspaceid', 0, PARAM_INT);
if ($requestedslug !== '' && (string)($consumer->consumerslug ?? '') !== $requestedslug) {
    $slugcontext = pqh_consumer_context_by_slug($requestedslug);
    if ((string)($slugcontext->consumerslug ?? '') === $requestedslug
        && ($requestedworkspaceid <= 0 || (int)($slugcontext->workspaceid ?? 0) === $requestedworkspaceid)) {
        $consumer = $slugcontext;
    }
}
if ($requestedworkspaceid > 0 && (int)($consumer->workspaceid ?? 0) !== $requestedworkspaceid) {
    $workspacecontext = pqh_consumer_context_by_workspace($requestedworkspaceid);
    if ($workspacecontext) {
        $consumer = $workspacecontext;
    }
}

// -- access: legacy in_array(consumer_type, ['institution','academy_consumer'])
//    gate, with pqh_access_denied's redirect replaced by pqpd_fail(403, same). --
$slug = (string)$consumer->consumerslug;
$consumertype = (string)($consumer->consumer_type ?? '');
$isprofileconsumer = in_array($consumertype, ['institution', 'academy_consumer'], true);
if (!$isprofileconsumer) {
    pqpd_fail(403, 'Choose an institution or academy before opening the public profile.');
}

$workspaceid = (int)($consumer->workspaceid ?? 0);
$brand = (string)$consumer->consumername;

// Legacy re-fetches the raw consumer row for the email helpers (verbatim).
$emailconsumer = $consumer;
if ((int)($consumer->consumerid ?? 0) > 0 && pqh_table_exists_safe('local_prequran_consumer')) {
    $emailconsumer = $DB->get_record('local_prequran_consumer', ['id' => (int)$consumer->consumerid], '*', IGNORE_MISSING) ?: $consumer;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    $body = json_decode((string)file_get_contents('php://input'), true);
    $do = is_array($body) ? (string)($body['do'] ?? '') : '';

    // -- write: send_inquiry (legacy public-profile POST, verbatim) --
    if ($do === 'send_inquiry') {
        // Honeypot: legacy silently redirect()s to ?sent=1 (pretends success and
        // never sends). Mirror that with the same success reply.
        if (trim(clean_param((string)($body['website'] ?? ''), PARAM_TEXT)) !== '') {
            echo json_encode(['ok' => true, 'message' => 'Your inquiry was sent.'], JSON_UNESCAPED_SLASHES);
            exit;
        }
        $inquirername = trim(clean_param((string)($body['inquirer_name'] ?? ''), PARAM_TEXT));
        $inquireremail = trim(clean_param((string)($body['inquirer_email'] ?? ''), PARAM_EMAIL));
        $inquirerphone = trim(clean_param((string)($body['inquirer_phone'] ?? ''), PARAM_TEXT));
        $interest = trim(clean_param((string)($body['interest'] ?? ''), PARAM_TEXT));
        $inquirymessage = trim(clean_param((string)($body['inquiry_message'] ?? ''), PARAM_TEXT));
        if ($inquirername === '' || $inquireremail === '' || !validate_email($inquireremail) || $inquirymessage === '') {
            pqpd_fail(400, 'Name, valid email, and message are required.');
        }
        $params = ['consumer' => $slug];
        if ($workspaceid > 0) {
            $params['workspaceid'] = $workspaceid;
        }
        $recipient = pqhi_support_recipient_for_consumer($emailconsumer);
        $text = "New public profile inquiry for {$brand}\n\n"
            . "Name: {$inquirername}\n"
            . "Email: {$inquireremail}\n"
            . "Phone: {$inquirerphone}\n"
            . "Interest: {$interest}\n\n"
            . "Message:\n{$inquirymessage}\n\n"
            . "Profile: " . (new moodle_url('/local/hubredirect/institution_profile.php', $params))->out(false);
        $html = '<p>New public profile inquiry for <strong>' . s($brand) . '</strong></p>'
            . '<p><strong>Name:</strong> ' . s($inquirername) . '<br>'
            . '<strong>Email:</strong> ' . s($inquireremail) . '<br>'
            . '<strong>Phone:</strong> ' . s($inquirerphone) . '<br>'
            . '<strong>Interest:</strong> ' . s($interest) . '</p>'
            . '<p>' . nl2br(s($inquirymessage)) . '</p>';
        if (!pqhi_send_consumer_email($recipient, $emailconsumer, 'Public profile inquiry', $text, $html)) {
            pqpd_fail(400, 'The inquiry could not be sent.');
        }
        echo json_encode(['ok' => true, 'message' => 'Your inquiry was sent.'], JSON_UNESCAPED_SLASHES);
        exit;
    }

    pqpd_fail(400, 'Unknown institution-profile action.');
}

// -- GET: the same display fields the legacy page renders (branding + copy). --
$theme = pqh_consumer_theme($consumer);
$copy = pqh_consumer_copy($consumer);
$primary = (string)$theme['primary_color'];
$accent = (string)$theme['accent_color'];
$heroimage = pqh_consumer_hero_image_url($consumer);
$logo = trim((string)($consumer->logourl ?? ''));
$initials = pqh_consumer_brand_initials($consumer, 'I');
$headline = trim((string)($copy['landing_headline'] ?? '')) ?: $brand;
$subtitle = trim((string)($copy['landing_subtitle'] ?? '')) ?: 'A branded teaching workspace for students, teachers, live sessions, reporting, and custom-domain access.';
$body = trim((string)($copy['landing_body'] ?? ''));
if ($body === '') {
    $body = $brand . ' uses a dedicated institution workspace for student intake, teacher management, live sessions, assignments, and operational reports.';
}
$courses = trim((string)($copy['initial_courses'] ?? 'Pre-Quraan'));
$courselist = array_values(array_filter(array_map('trim', preg_split('/[\r\n,]+/', $courses))));
$support = trim((string)($consumer->supportemail ?? ''));

echo json_encode([
    'ok' => true, 'ready' => true,
    'consumer_type' => $consumertype,
    'is_academy' => $consumertype === 'academy_consumer',
    'kicker' => $consumertype === 'academy_consumer' ? 'Academy profile' : 'Institution profile',
    'slug' => $slug,
    'workspaceid' => $workspaceid,
    'brand' => $brand,
    'primary' => $primary,
    'accent' => $accent,
    'heroimage' => $heroimage,
    'logo' => $logo,
    'initials' => $initials,
    'headline' => $headline,
    'subtitle' => $subtitle,
    'body' => $body,
    'courses' => $courselist,
    'support' => $support,
    'services' => [
        'Student and parent intake',
        'Teacher onboarding and assignment',
        'Live classes and recurring schedules',
        'Materials, attendance, and progress reporting',
    ],
    'legacyurl' => $CFG->wwwroot . '/local/hubredirect/institution_profile.php'
        . '?' . http_build_query($workspaceid > 0 ? ['consumer' => $slug, 'workspaceid' => $workspaceid] : ['consumer' => $slug]),
    'names' => pqpd_names([]),
], JSON_UNESCAPED_SLASHES);
exit;
