<?php
defined('MOODLE_INTERNAL') || die();

$countrytimezoneoptions = require(__DIR__ . '/country_timezones.php');
$countrycityoptions = require(__DIR__ . '/country_cities.php');

return [
    'course_types' => [
        'pre_quraan' => 'Pre-Quraan',
        'tarbiyah_kids' => 'Tarbiyah Kids',
        'essential_arabic' => 'Essential Arabic',
        'quran_reading' => 'Quran Reading',
        'quran_tafsir' => 'Quran Tafsir',
        'quraan_memorization' => 'Quran Memorization',
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
        'level_0' => 'Level 0',
        'level_1' => 'Level 1',
        'level_2' => 'Level 2',
        'level_3' => 'Level 3',
        'level_4' => 'Level 4',
    ],
    'student_access_types' => [
        'managed' => 'Managed Student',
        'unmanaged' => 'Unmanaged Student',
    ],
    'tajweed_sub_levels' => [
        'beginner' => 'Beginner',
        'middle' => 'Middle',
        'advanced' => 'Advanced',
    ],
    'level_definitions' => [
        'pre_quraan' => [
            'level_0' => 'New to Arabic letters, sounds, or harakat.',
            'level_1' => 'Can recognize, pronounce, and write the Arabic alphabet.',
            'level_2' => 'Can write 2 joined letters, 3 joined letters, 4 joined letters, and 5 joined letters.',
            'level_3' => 'Tajweed level - Beginner, Middle, or Advanced.',
            'level_4' => 'Can read simple Arabic words and is preparing to read the Quran fluently.',
        ],
        'tarbiyah_kids' => [
            'level 1' => 'Needs basic Islamic manners, habits, stories, and daily routines.',
            'level 2' => 'Understands simple values and can discuss guided stories or examples.',
            'level 3' => 'Can reflect on manners, choices, and Islamic values with more independence.',
        ],
        'essential_arabic' => [
            'level 1' => 'Beginning Arabic letters, sounds, basic words, and simple writing.',
            'level 2' => 'Can read and write simple words and is building vocabulary and sentences.',
            'level 3' => 'Can read short passages and is developing comprehension and expression.',
        ],
        'quran_reading' => [
            'level 1' => 'Can read short Arabic or Quran words with support.',
            'level 2' => 'Can read short passages but needs fluency, correction, and confidence.',
            'level 3' => 'Reads longer passages and needs tajweed, pace, and consistency support.',
        ],
        'quran_tafsir' => [
            'level 1' => 'Ready for simple meanings, vocabulary, stories, and guided reflection.',
            'level 2' => 'Can discuss short surahs or themes with teacher guidance.',
            'level 3' => 'Can connect meanings, lessons, and reflections across longer passages.',
        ],
        'quraan_memorization' => [
            'level 1' => 'Starting short surahs or needs a first memorization routine.',
            'level 2' => 'Has memorized some surahs and needs revision structure and listening.',
            'level 3' => 'Has ongoing memorization and needs stronger retention, review, and targets.',
        ],
    ],
    'learning_bases' => [
        'new learner' => 'New learner',
        'some_prior_learning' => 'Some prior learning',
        'can_read_basic_arabic' => 'Can read basic Arabic',
        'can_write_basic_arabic' => 'Can write basic Arabic',
        'can_understand_basic_arabic' => 'Can understand basic Arabic',
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
