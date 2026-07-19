<?php
// Teacher home. The teacher dashboard logic lives in dashboard.php; this
// wrapper gives it its own URL while dashboard.php redirects teachers here.
define('PQH_TEACHER_DASHBOARD_WRAPPER', true);
require __DIR__ . '/dashboard.php';
