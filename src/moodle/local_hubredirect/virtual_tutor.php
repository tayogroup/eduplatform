<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();

$studentid = optional_param('studentid', optional_param('childid', 0, PARAM_INT), PARAM_INT);
$sessionid = optional_param('sessionid', 0, PARAM_INT);
$livesessionid = optional_param('livesessionid', optional_param('live_sessionid', 0, PARAM_INT), PARAM_INT);
$embed = optional_param('embed', 0, PARAM_BOOL);
$panel = optional_param('panel', 0, PARAM_BOOL);
$floating = optional_param('floating', 0, PARAM_BOOL);
$popup = optional_param('popup', 0, PARAM_BOOL);
$launch = optional_param('launch', 0, PARAM_BOOL);
$returnurl = optional_param('returnurl', '', PARAM_LOCALURL);

$params = [];
if ($livesessionid > 0) {
    $params['sessionid'] = $livesessionid;
} else if ($sessionid > 0) {
    $params['sessionid'] = $sessionid;
}
if ($studentid > 0) {
    $params['studentid'] = $studentid;
}
foreach (['embed' => $embed, 'panel' => $panel, 'floating' => $floating, 'popup' => $popup, 'launch' => $launch] as $key => $value) {
    if ($value) {
        $params[$key] = 1;
    }
}
if ($returnurl !== '') {
    $params['returnurl'] = $returnurl;
}

redirect(new moodle_url('/local/hubredirect/live_virtual_tutor.php', $params));
