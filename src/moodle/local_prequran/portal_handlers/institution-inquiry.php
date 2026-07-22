<?php
// ---- report: institution-inquiry (public institution contact form; write-first) ----
// Ported from local_hubredirect/institution_inquiry.php. That page is PUBLIC —
// it has no require_login and runs as guest; its only side effect is a single
// support-inbox inquiry email. There are no page-defined functions to extract,
// so institution_inquiry_portallib is a guard-only marker.
// Included from portal_data.php AFTER token auth: $claims verified, $USER set to
// the token user, JSON exception handler installed, headers sent — so behind the
// dispatcher this public page still requires a valid portal token, and the
// legacy consumer-type gate becomes pqpd_fail(403, same message).
// GET  = the consumer's branding + the interest option list the form renders.
// POST = do=send_inquiry (verbatim public inquiry email; confirm_sesskey()
//        dropped — token auth replaces the session key; on success the legacy
//        cleared-form + confirmation message becomes an ok JSON reply).

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/institutionlib.php');
require_once($CFG->dirroot . '/local/hubredirect/institution_inquiry_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

// The legacy page's fixed interest option list (verbatim order).
$interestoptions = ['Student enrollment', 'Teacher services', 'Institution partnership', 'Technical support', 'Other'];

// -- consumer context: resolved from ?consumer=/?workspaceid= exactly like the
//    sibling public endpoint (public_intake_data.php). --
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

// -- access: legacy consumer_type === 'institution' gate, with pqh_access_denied's
//    redirect replaced by pqpd_fail(403, same message). --
$slug = (string)$consumer->consumerslug;
$isinstitution = (string)($consumer->consumer_type ?? '') === 'institution';
if (!$isinstitution) {
    pqpd_fail(403, 'Choose an institution before sending an inquiry.');
}

$workspaceid = (int)($consumer->workspaceid ?? 0);
$brand = (string)$consumer->consumername;
$support = trim((string)($consumer->supportemail ?? ''));

// Verbatim inline branding (the legacy page reads themejson/copyjson directly,
// not through pqh_consumer_theme).
$theme = json_decode((string)($consumer->themejson ?? ''), true);
$theme = is_array($theme) ? $theme : [];
$copy = json_decode((string)($consumer->copyjson ?? ''), true);
$copy = is_array($copy) ? $copy : [];
$primary = preg_match('/^#[0-9a-fA-F]{6}$/', (string)($theme['primary_color'] ?? '')) ? (string)$theme['primary_color'] : '#2f6f4e';
$accent = preg_match('/^#[0-9a-fA-F]{6}$/', (string)($theme['accent_color'] ?? '')) ? (string)$theme['accent_color'] : '#d99a26';
$initials = strtoupper(substr(trim((string)($copy['brand_initials'] ?? '')), 0, 6));
if ($initials === '') {
    $initials = strtoupper(substr(preg_replace('/[^a-z0-9]/i', '', $brand) ?: 'I', 0, 1));
}

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    $body = json_decode((string)file_get_contents('php://input'), true);
    $do = is_array($body) ? (string)($body['do'] ?? '') : '';

    // -- write: send_inquiry (legacy public inquiry POST, verbatim) --
    if ($do === 'send_inquiry') {
        $form = [
            'name' => trim(clean_param((string)($body['name'] ?? ''), PARAM_TEXT)),
            'email' => clean_param(trim(clean_param((string)($body['email'] ?? ''), PARAM_TEXT)), PARAM_EMAIL),
            'phone' => trim(clean_param((string)($body['phone'] ?? ''), PARAM_TEXT)),
            'interest' => trim(clean_param((string)($body['interest'] ?? ''), PARAM_TEXT)),
            'details' => trim(clean_param((string)($body['details'] ?? ''), PARAM_TEXT)),
        ];
        if ($form['name'] === '' || $form['email'] === '' || !validate_email($form['email']) || $form['details'] === '') {
            pqpd_fail(400, 'Please enter your name, a valid email, and inquiry details.');
        }
        $supportuser = pqhi_support_recipient_for_consumer($consumer);
        $subject = 'Public inquiry';
        $lines = [
            'New public institution inquiry',
            '',
            'Institution: ' . $brand,
            'Name: ' . $form['name'],
            'Email: ' . $form['email'],
            'Phone: ' . $form['phone'],
            'Interest: ' . $form['interest'],
            '',
            $form['details'],
        ];
        $emailbody = implode("\n", $lines);
        $sent = pqhi_send_consumer_email($supportuser, $consumer, $subject, $emailbody, nl2br(s($emailbody)));
        echo json_encode([
            'ok' => true,
            'sent' => (bool)$sent,
            'message' => $sent
                ? 'Inquiry sent. The institution team can follow up from the support mailbox.'
                : 'Inquiry received, but email delivery was not confirmed.',
        ], JSON_UNESCAPED_SLASHES);
        exit;
    }

    pqpd_fail(400, 'Unknown institution-inquiry action.');
}

// -- GET: the branding + option list the legacy form renders. --
echo json_encode([
    'ok' => true, 'ready' => true,
    'slug' => $slug,
    'workspaceid' => $workspaceid,
    'brand' => $brand,
    'support' => $support,
    'primary' => $primary,
    'accent' => $accent,
    'initials' => $initials,
    'interests' => $interestoptions,
    'legacyurl' => $CFG->wwwroot . '/local/hubredirect/institution_inquiry.php'
        . '?' . http_build_query($workspaceid > 0 ? ['consumer' => $slug, 'workspaceid' => $workspaceid] : ['consumer' => $slug]),
    'names' => pqpd_names([]),
], JSON_UNESCAPED_SLASHES);
exit;
