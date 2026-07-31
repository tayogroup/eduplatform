<?php
// Dynamic Moodle URL for all trusted consumer domains.
$customdomainhost = strtolower(trim((string)($_SERVER['HTTP_HOST'] ?? '')));
$customdomainhost = preg_replace('/:\d+$/', '', $customdomainhost);
$customdomainhost = rtrim((string)$customdomainhost, '.');

$customdomainallowedhosts = [
    'eduplatform.ai',
    'www.eduplatform.ai',
    'app.eduplatform.ai',

    'ehelacademy.org',
    'www.ehelacademy.org',
    'app.ehelacademy.org',

    'quraanacademy.org',
    'www.quraanacademy.org',
    'app.quraanacademy.org',

    'quraantest.academy',
    'quraan.academy',
    'quraanacademy.info',
    'www.quraanacademy.info',
    'uniso.site',
    'www.uniso.site',

    'edufortomorrow.com',
    'www.edufortomorrow.com',
    'app.edufortomorrow.com',

    'k-12.ehelacademy.org',
    'app.k-12.ehelacademy.org',
    'students.k-12.ehelacademy.org',
    'teachers.k-12.ehelacademy.org',
    'parents.k-12.ehelacademy.org',
    'admins.k-12.ehelacademy.org',
    'finance.k-12.ehelacademy.org',

    'languages.ehelacademy.org',
    'app.languages.ehelacademy.org',
    'students.languages.ehelacademy.org',
    'teachers.languages.ehelacademy.org',
    'parents.languages.ehelacademy.org',
    'admins.languages.ehelacademy.org',
    'finance.languages.ehelacademy.org',

    'skills.ehelacademy.org',
    'app.skills.ehelacademy.org',
    'students.skills.ehelacademy.org',
    'teachers.skills.ehelacademy.org',
    'parents.skills.ehelacademy.org',
    'admins.skills.ehelacademy.org',
    'finance.skills.ehelacademy.org',

    'tech.ehelacademy.org',
    'app.tech.ehelacademy.org',
    'students.tech.ehelacademy.org',
    'teachers.tech.ehelacademy.org',
    'parents.tech.ehelacademy.org',
    'admins.tech.ehelacademy.org',
    'finance.tech.ehelacademy.org',

    'adult.ehelacademy.org',
    'app.adult.ehelacademy.org',
    'students.adult.ehelacademy.org',
    'teachers.adult.ehelacademy.org',
    'parents.adult.ehelacademy.org',
    'admins.adult.ehelacademy.org',
    'finance.adult.ehelacademy.org',
];

if ($customdomainhost !== ''
        && in_array($customdomainhost, $customdomainallowedhosts, true)) {
    $CFG->wwwroot = 'https://' . $customdomainhost;
} else {
    $CFG->wwwroot = 'https://eduplatform.ai';
}

// Share one session across every role-portal subdomain of the same school
// (app./students./teachers./parents./admins./finance.<school>.ehelacademy.org)
// so pqh_enforce_role_domain() sending a user from one to another doesn't
// look like a brand new, logged-out browser. Without this, PHP scopes the
// session cookie to the exact host that set it, so a cookie set on
// app.k-12.ehelacademy.org is never sent to students.k-12.ehelacademy.org --
// Moodle then (correctly, from its own point of view) sees no session there
// and asks the user to log in again.
//
// A plain ini_set('session.cookie_domain', ...) is NOT enough here -- Moodle
// manages the session cookie itself and applies its own cookie parameters
// when starting the session, overriding php.ini-level values. The supported
// way is Moodle's own $CFG->sessioncookiedomain setting (see config-dist.php
// in Moodle core), which its session manager reads when issuing the cookie.
$eduplatformrolelabels = ['app', 'students', 'teachers', 'parents', 'admins', 'finance'];
$eduplatformhostlabels = explode('.', $customdomainhost);
if (count($eduplatformhostlabels) > 2 && in_array($eduplatformhostlabels[0], $eduplatformrolelabels, true)) {
    $CFG->sessioncookiedomain = implode('.', array_slice($eduplatformhostlabels, 1));
}
// Renames the session cookie (MoodleSession -> MoodleSessionep1) so that
// stale host-only MoodleSession cookies left in browsers from before the
// sessioncookiedomain change above are simply ignored instead of colliding
// with the new domain-wide cookie -- that collision shows up to users as
// ERR_TOO_MANY_REDIRECTS with no obvious fix. One-time cost when first
// deployed: every existing session is invalidated, so everyone signs in
// again once. Do not change this suffix again casually -- every change logs
// all users out the same way.
$CFG->sessioncookie = 'ep1';

$CFG->dataroot = '/home/ehelacad/moodledata_quraantest';
$CFG->admin = 'admin';

$CFG->directorypermissions = 0777;
$CFG->enablewebservices = 1;

require_once(__DIR__ . '/lib/setup.php');

// There is no php closing tag in this file,
// it is intentional because it prevents trailing whitespace problems!
