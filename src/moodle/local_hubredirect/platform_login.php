<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');

redirect(new moodle_url('/local/hubredirect/consumer_login.php', ['consumer' => 'eduplatform']));
