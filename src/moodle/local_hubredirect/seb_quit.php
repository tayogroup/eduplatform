<?php
declare(strict_types=1);

// The configured SEB quitURL. Safe Exam Browser quits the moment it navigates
// here, so this page must never be reachable except as a deliberate release —
// seb_release.php redirects to it only once the exit condition is satisfied.
// It intentionally requires no session: SEB has no Moodle cookie of its own.

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/seb_lib.php');

$reason = optional_param('reason', '', PARAM_ALPHA);

try {
    if (pqh_table_exists_safe('local_prequran_live_audit')) {
        $DB->insert_record('local_prequran_live_audit', (object)[
            'sessionid' => 0,
            'actorid' => 0,
            'action' => 'seb_course_released',
            'targettype' => 'seb_course',
            'targetid' => 0,
            'details' => json_encode(['reason' => $reason], JSON_UNESCAPED_SLASHES),
            'timecreated' => time(),
        ]);
    }
} catch (Throwable $e) {
    // Audit is best effort; releasing must never fail because of it.
}

header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: private, no-store');
echo '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Lesson finished</title></head>'
    . '<body style="font-family:system-ui,-apple-system,Segoe UI,Arial,sans-serif;'
    . 'max-width:520px;margin:16vh auto;padding:0 20px;text-align:center;color:#17324a">'
    . '<h1 style="font-size:22px;font-weight:600;margin:0 0 8px">Well done — lesson finished</h1>'
    . '<p style="color:#5a6b7d">You can close this window.</p>'
    . '</body></html>';
