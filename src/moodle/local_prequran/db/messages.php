<?php
defined('MOODLE_INTERNAL') || die();

$messageproviders = [
    'live_session_update' => [],
    'transcript_update' => [],
    'finance_update' => [],
    // Academic milestones: certificate earned, course grade published, level
    // advanced. Previously NO provider fired for any of these.
    'achievement_update' => [],
];
