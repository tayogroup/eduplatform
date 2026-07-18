<?php
// Renamed 2026-07-18: the teacher live-class workspace now lives at
// teacher_workspace.php. This stub keeps old links, bookmarks, and
// previously sent reminder emails working by forwarding the request
// with its query parameters intact.
require_once(__DIR__ . '/../../config.php');

$params = [];
foreach ($_GET as $key => $value) {
    if (is_scalar($value)) {
        $params[clean_param($key, PARAM_ALPHANUMEXT)] = clean_param((string)$value, PARAM_RAW);
    }
}
redirect(new moodle_url('/local/hubredirect/teacher_workspace.php', $params));
