<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');

$context = context_system::instance();
$consumercontext = pqh_requested_consumer_context();
$consumerparams = ['consumer' => (string)$consumercontext->consumerslug];
$teacherid = optional_param('teacherid', 0, PARAM_INT);

$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/hubredirect/teacher_marketplace_request.php', ['teacherid' => $teacherid] + $consumerparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Request Teacher');
$PAGE->set_heading('Request Teacher');

require_login();

if ($teacherid <= 0) {
    redirect(new moodle_url('/local/hubredirect/teacher_marketplace.php', $consumerparams));
}

$profileurl = (new moodle_url('/local/hubredirect/teacher_marketplace_profile.php', ['teacherid' => $teacherid] + $consumerparams))->out(false);
redirect($profileurl . '#request-teacher');
