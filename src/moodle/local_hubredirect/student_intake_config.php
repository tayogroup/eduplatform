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
        'alphabet' => 'Alphabet',
        'alphabet, level 1' => 'Alphabet, Level 1',
        'level 1' => 'Level 1',
        'level 2' => 'Level 2',
        'level 3' => 'Level 3',
        'placement_needed' => 'Placement needed',
    ],
    'learning_bases' => [
        'new learner' => 'New learner',
        'knows letters' => 'Knows letters',
        'new learner, knows letters' => 'New learner, knows letters',
        'can blend sounds' => 'Can blend sounds',
        'can read short words' => 'Can read short words',
        'needs assessment' => 'Needs assessment',
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
    'availability_time_windows' => [
        '08:00' => '8:00 AM',
        '09:00' => '9:00 AM',
        '10:00' => '10:00 AM',
        '11:00' => '11:00 AM',
        '12:00' => '12:00 PM',
        '13:00' => '1:00 PM',
        '14:00' => '2:00 PM',
        '15:00' => '3:00 PM',
        '16:00' => '4:00 PM',
        '17:00' => '5:00 PM',
        '18:00' => '6:00 PM',
        '19:00' => '7:00 PM',
        '20:00' => '8:00 PM',
        '21:00' => '9:00 PM',
        '22:00' => '10:00 PM',
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
