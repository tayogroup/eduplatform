<?php
declare(strict_types=1);

require_once(__DIR__ . '/../config.php');
require_once(__DIR__ . '/../local/hubredirect/accesslib.php');

$consumercontext = pqh_requested_consumer_context();
redirect(pqh_consumer_url('/local/hubredirect/teacher_marketplace.php', $consumercontext));
