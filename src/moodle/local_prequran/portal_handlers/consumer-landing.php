<?php
// ---- report: consumer-landing (public consumer/tenant marketing landing; read-only) ----
// Ported from local_hubredirect/consumer_landing.php. That page is PUBLIC — it
// has no require_login and renders fully for guests; it is a branded marketing
// landing per consumer (institution / marketplace / academy variants). The only
// dynamic input is the resolved consumer context (?consumer=/?workspaceid=) plus
// a teacher_submitted GET flag that toggles a thank-you banner. There are no
// page-defined functions except pqhcl_service_cards, extracted verbatim into
// consumer_landing_portallib; every other value comes from shared accesslib
// helpers, so this handler mirrors the page's derivations exactly.
//
// Included from portal_data.php AFTER token auth: $claims verified, $USER set to
// the token user, JSON exception handler installed, headers sent — so behind the
// dispatcher this public page still requires a valid portal token. The legacy
// consumer context is resolved from ?consumer=/?workspaceid= like the sibling
// public endpoints (platform-landing.php, institution-profile.php); the CDN host
// the portal page is served from carries no consumer meaning.
//
// (consumer_landing.php has no pqh_live_security_audit calls — none to keep.)
//
// GET  = brand/theme, hero + kicker + copy, the four service cards, and every
//        CTA target URL, all built with the same accesslib helpers and moodle_url
//        paths as the legacy page so the marketing shell links exactly where it
//        did. (The static marketing prose lives in the HTML shell, verbatim.)
// POST = 400 (the legacy landing is read-only; it performs no writes —
//        teacher_submitted is only a GET banner flag).

defined('MOODLE_INTERNAL') || die();

global $CFG, $DB, $USER;
require_once($CFG->dirroot . '/local/hubredirect/accesslib.php');
require_once($CFG->dirroot . '/local/hubredirect/consumer_landing_portallib.php');

$userid = (int)($claims['sub'] ?? 0);

// The legacy landing is read-only — no form posts. Mirror the read-only siblings:
// reject writes with a 400.
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    pqpd_fail(400, 'The consumer landing page is read-only.');
}

// -- consumer context: resolved from ?consumer=/?workspaceid= exactly like the
//    sibling public endpoints. Defaults to the current (host-derived) context. --
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

// -- derived context: verbatim from the legacy page's top-of-file block. --
$slug = (string)$consumer->consumerslug;
$ismarketplace = pqh_consumer_feature_enabled($consumer, 'teacher_marketplace');
$isinstitution = (string)($consumer->consumer_type ?? '') === 'institution';
$isacademy = (string)($consumer->consumer_type ?? '') === 'academy_consumer';
$isprofileconsumer = $isinstitution || $isacademy;
$workspaceid = (int)($consumer->workspaceid ?? 0);
$brand = (string)$consumer->consumername;
$brandlogo = trim((string)($consumer->logourl ?? ''));
$theme = pqh_consumer_theme($consumer);
$copy = pqh_consumer_copy($consumer);
$brandinitial = pqh_consumer_brand_initials($consumer, 'W');
$heroimage = pqh_consumer_hero_image_url($consumer);
$primarycolor = (string)$theme['primary_color'];
$accentcolor = (string)$theme['accent_color'];
$tagline = $isinstitution
    ? 'A branded teaching workspace for students, teachers, live sessions, reporting, and custom-domain access.'
    : ($ismarketplace
        ? 'A marketplace and operating workspace for independent teachers, tutors, parents, and learning institutions.'
        : 'Online learning operations, live sessions, student intake, and teacher services in one managed workspace.');
$headline = trim((string)($copy['landing_headline'] ?? ''));
if ($headline === '') {
    $headline = $brand;
}
$customsubtitle = trim((string)($copy['landing_subtitle'] ?? ''));
if ($customsubtitle !== '') {
    $tagline = $customsubtitle;
}
$support = trim((string)($consumer->supportemail ?? ''));
$externalwebsiteurl = trim((string)($consumer->externalwebsiteurl ?? ''));
$useexternalintake = (string)($consumer->intakelocation ?? '') === 'external_website' && $externalwebsiteurl !== '';
$consumerparams = ['consumer' => $slug];
$teachersubmitted = optional_param('teacher_submitted', 0, PARAM_BOOL);
$workspaceparams = $consumerparams;
if ($workspaceid > 0) {
    $workspaceparams['workspaceid'] = $workspaceid;
}

// -- CTA target URLs: built with the same moodle_url paths as the legacy page so
//    the marketing shell links exactly where the PHP page did. --
$studenturl = new moodle_url('/local/hubredirect/public_intake.php', $workspaceparams);
$studenthref = $useexternalintake ? $externalwebsiteurl : $studenturl->out(false);
$teacherurl = new moodle_url($ismarketplace ? '/local/hubredirect/public_teacher_intake.php' : '/local/hubredirect/teacher_intake.php', $workspaceparams);
$marketurl = new moodle_url('/local/hubredirect/teacher_marketplace.php', $consumerparams);
$dashboardpath = (string)($consumer->defaultdashboardpath ?: '/local/hubredirect/dashboard.php');
$dashboardurl = new moodle_url($dashboardpath, $workspaceparams);
$roleurl = new moodle_url('/local/hubredirect/role_redirect.php', $workspaceparams);
$loginurl = new moodle_url('/local/hubredirect/consumer_login.php', [
    'consumer' => $slug,
    'wantsurl' => $roleurl->out(false),
]);
$profileurl = new moodle_url('/local/hubredirect/institution_profile.php', $workspaceparams);
$inquiryurl = new moodle_url('/local/hubredirect/institution_profile.php', $workspaceparams + ['contact' => 1]);
$landingurl = new moodle_url('/local/hubredirect/consumer_landing.php', $consumerparams);

// -- service cards: the ONE page-defined function, verbatim via the portallib. --
$cards = [];
foreach (pqhcl_service_cards($ismarketplace, $isinstitution, $brand) as $card) {
    $cards[] = ['title' => $card[0], 'body' => $card[1]];
}

$kicker = $isinstitution ? 'Institution workspace' : ($ismarketplace ? 'Independent teaching platform' : 'Academy learning platform');
$splitheading = $isinstitution
    ? 'Your workspace, under your institution identity.'
    : ($ismarketplace ? 'One platform, many teaching businesses.' : 'Structured operations for live online learning.');
$splitbody = $isinstitution
    ? $brand . ' can use this public entry point for intake and login while staff continue into the dedicated workspace for students, teachers, live sessions, and reports.'
    : ($ismarketplace
        ? $brand . ' is designed so independent teachers can offer services publicly while parents and institutions can find qualified teachers, request tutoring, and refer students for extra learning support.'
        : $brand . ' uses the shared EduPlatform foundation to coordinate student intake, teacher onboarding, live sessions, marketplace profiles, and parent communication.');
$splitrow3 = $isinstitution
    ? 'Logged-in staff continue into the institution workspace dashboard with the correct workspace selected.'
    : 'Logged-in clients continue into dashboards, live sessions, courses, and student management.';

echo json_encode([
    'ok' => true,
    'ready' => true,
    'slug' => $slug,
    'workspaceid' => $workspaceid,
    'consumer_type' => (string)($consumer->consumer_type ?? ''),
    'is_marketplace' => $ismarketplace,
    'is_institution' => $isinstitution,
    'is_academy' => $isacademy,
    'is_profile_consumer' => $isprofileconsumer,
    'brand' => $brand,
    'brand_logo' => $brandlogo,
    'brand_initial' => $brandinitial,
    'primary' => $primarycolor,
    'accent' => $accentcolor,
    'heroimage' => $heroimage,
    'kicker' => $kicker,
    'headline' => $headline,
    'tagline' => $tagline,
    'support' => $support,
    'external_website' => $externalwebsiteurl,
    'use_external_intake' => $useexternalintake,
    'teacher_submitted' => (bool)$teachersubmitted,
    'cards' => $cards,
    // CTA / hero button labels, computed exactly as the legacy page does.
    'labels' => [
        'student_primary' => $useexternalintake ? 'Apply on Institution Website' : ($isinstitution ? 'Submit Student Intake' : 'Request Teacher Services'),
        'student_panel' => $useexternalintake ? 'Apply on Institution Website' : ($ismarketplace ? 'Request Teacher Services' : 'Parent / Student Intake'),
        'teacher_hero' => $isinstitution ? 'Teacher Onboarding' : 'Teacher Profile Intake',
        'teacher_panel' => $isinstitution ? 'Teacher Onboarding' : 'Independent Teacher Intake',
        'profile' => $isacademy ? 'Academy Profile' : 'Institution Profile',
        'contact' => $isacademy ? 'Contact Academy' : 'Contact Institution',
        'dashboard' => $isinstitution ? 'Workspace Dashboard' : 'Client Dashboard',
    ],
    'split_heading' => $splitheading,
    'split_body' => $splitbody,
    'split_rows' => [
        'Public pages route visitors into the correct brand or workspace context.',
        'Teachers and parents can start through intake forms without needing to know the underlying system.',
        $splitrow3,
    ],
    // The page's CTA targets, built with the same moodle_url paths as the legacy
    // page so the marketing shell links exactly where the PHP page did.
    'urls' => [
        'landing' => $landingurl->out(false),
        'student' => $studenthref,
        'teacher' => $teacherurl->out(false),
        'market' => $marketurl->out(false),
        'dashboard' => $dashboardurl->out(false),
        'login' => $loginurl->out(false),
        'profile' => $profileurl->out(false),
        'profile_contact' => $profileurl->out(false) . '#contact',
        'inquiry' => $inquiryurl->out(false),
    ],
    'legacyurl' => $CFG->wwwroot . '/local/hubredirect/consumer_landing.php'
        . '?' . http_build_query($workspaceid > 0 ? ['consumer' => $slug, 'workspaceid' => $workspaceid] : ['consumer' => $slug]),
], JSON_UNESCAPED_SLASHES);
exit;
