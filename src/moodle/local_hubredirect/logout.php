<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');

$consumercontext = pqh_requested_consumer_context();
$params = [];
if (!empty($consumercontext->consumerslug)) {
    $params['consumer'] = (string)$consumercontext->consumerslug;
}
if ((int)($consumercontext->workspaceid ?? 0) > 0) {
    $params['workspaceid'] = (int)$consumercontext->workspaceid;
}

$landingpath = (string)($consumercontext->defaultpublicpath ?? '/local/hubredirect/platform_landing.php');
if ((string)($consumercontext->consumer_type ?? '') === 'platform_foundation') {
    $landingpath = '/local/hubredirect/platform_landing.php';
}
if ($landingpath === '' || $landingpath === '/') {
    $landingpath = '/local/hubredirect/platform_landing.php';
}
$landingurl = new moodle_url($landingpath, $params);

if (!isloggedin() || isguestuser()) {
    redirect($landingurl);
}

require_logout();

redirect($landingurl);
