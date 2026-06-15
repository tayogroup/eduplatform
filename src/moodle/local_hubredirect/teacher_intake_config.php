<?php
defined('MOODLE_INTERNAL') || die();

$countrytimezoneoptions = require(__DIR__ . '/country_timezones.php');
$countrycityoptions = require(__DIR__ . '/country_cities.php');

return [
    'course_types' => [
        'pre_quraan' => 'Pre-quraan Course',
        'quraan_memorization' => 'Quraan Memorization Course',
    ],
    'countries' => ($countrytimezoneoptions['countries'] ?? []) + ['Other' => 'Other'],
    'cities' => ($countrycityoptions['cities'] ?? []) + ['Other' => 'Other city not listed'],
    'country_cities' => $countrycityoptions['country_cities'] ?? [],
    'timezones' => $countrytimezoneoptions['timezones'] ?? [],
    'country_timezones' => $countrytimezoneoptions['country_timezones'] ?? [],
    'primary_languages' => [
        'Somali' => 'Somali',
        'English' => 'English',
        'Arabic' => 'Arabic',
        'Swahili' => 'Swahili',
        'Other' => 'Other',
    ],
    'other_languages' => [
        'English' => 'English',
        'Arabic' => 'Arabic',
        'Somali' => 'Somali',
        'Swahili' => 'Swahili',
        'French' => 'French',
        'Other' => 'Other',
    ],
    'current_levels' => [
        'Pre-quraan Course' => 'Pre-quraan Course',        
    ],
    'availability_days' => [
        'mon' => 'Monday',
        'tue' => 'Tuesday',
        'wed' => 'Wednesday',
        'thu' => 'Thursday',
        'fri' => 'Friday',
        'sat' => 'Saturday',
        'sun' => 'Sunday',
    ],
    'availability_slot_minutes' => 120,
    'availability_time_windows' => [
        '00:00' => '2:00 AM',
        '02:00' => '4:00 AM',
        '04:00' => '6:00 AM',
        '06:00' => '8:00 AM',
        '08:00' => '10:00 AM',
        '10:00' => '12:00 PM',
        '12:00' => '14:00 PM',
        '14:00' => '16:00 PM',
        '16:00' => '18:00 PM',
        '18:00' => '20:00 PM',
        '20:00' => '22:00 PM',
        '22:00' => '24:00 PM',
    ],
    'session_counts' => [
        '1' => '1 session per week',
        '2' => '2 sessions per week',
        '3' => '3 sessions per week',
        '4' => '4 sessions per week',
        '5' => '5 sessions per week',
        '6' => '6 sessions per week',
    ],
];
