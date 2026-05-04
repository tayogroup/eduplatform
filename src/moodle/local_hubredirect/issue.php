<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once($CFG->dirroot . '/user/profile/lib.php');

$userid = (int)$USER->id;

/* A) Build user payload for your exchange.php */
$custom = profile_user_record($userid, false);

$payload = [
    'name'        => fullname($USER),
    'email'       => $USER->email ?? '',
    'parent_name' => $custom->parent_name ?? '',
    'lang'        => $USER->lang ?? '',
];

/* B) Create short-lived Moodle token (used by /exchange.php) */
$mtoken = bin2hex(random_bytes(16));

$DB->insert_record('local_hubredirect_tok', (object) [
    'token'       => $mtoken,
    'payloadjson' => json_encode($payload, JSON_UNESCAPED_UNICODE),
    'expires'     => time() + 120,
    'consumed'    => 0,
    'timecreated' => time(),
]);

/* C) Redirect to app entry point on Bunny custom hostname */
$appBase = 'https://app.quraan.academy';
$appPath = '/pre_quraan/scripts/index_v030.html';

$dest = $appBase . $appPath . '?mtoken=' . urlencode($mtoken);

redirect($dest);