<?php
// Paste this logic into Moodle config.php where $CFG->wwwroot is currently set.
// Keep every shared-root Moodle host here so Moodle can keep the requested
// host in links, sessions, redirects, and form posts.
// EduPlatform is the foundation fallback; quraantest.academy is only the
// Quraan Academy app/test consumer domain.

$customdomainhost = strtolower((string)($_SERVER['HTTP_HOST'] ?? ''));
$customdomainhost = preg_replace('/:\d+$/', '', $customdomainhost);
$customdomainhost = trim((string)$customdomainhost, " \t\n\r\0\x0B.");

$customdomainallowedhosts = [
    'eduplatform.ai',
    'www.eduplatform.ai',
    'app.eduplatform.ai',
    'quraantest.academy',
    'quraan.academy',
    'quraanacademy.info',
    'www.quraanacademy.info',
    'edufortomorrow.com',
    'www.edufortomorrow.com',
    'app.edufortomorrow.com',
];

if (in_array($customdomainhost, $customdomainallowedhosts, true)) {
    $CFG->wwwroot = 'https://' . $customdomainhost;
} else {
    $CFG->wwwroot = 'https://eduplatform.ai';
}
