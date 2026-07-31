<?php
defined('MOODLE_INTERNAL') || die();

$observers = [
    [
        'eventname' => '\core\event\user_created',
        'callback' => '\local_prequran\observer::user_created',
    ],
    // Identity trail: authentication + privilege events land in the plugin
    // audit table so compliance review does not stop at the identity layer.
    [
        'eventname' => '\core\event\user_login_failed',
        'callback' => '\local_prequran\observer::user_login_failed',
    ],
    [
        'eventname' => '\core\event\user_password_updated',
        'callback' => '\local_prequran\observer::user_password_updated',
    ],
    [
        'eventname' => '\core\event\role_assigned',
        'callback' => '\local_prequran\observer::role_assigned',
    ],
    [
        'eventname' => '\core\event\role_unassigned',
        'callback' => '\local_prequran\observer::role_unassigned',
    ],
];
