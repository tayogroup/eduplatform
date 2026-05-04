<?php
defined('MOODLE_INTERNAL') || die();

/**
 * local/prequran/db/services.php
 *
 * Registers all Web Service functions used by:
 * - Unit players (Alphabet/Harakat Listen & Watch)
 * - Generic unit state (lessonid+unitid)
 * - Reporting dashboards (cohort overview, student detail, step analytics)
 * - Start/touch tracking
 * - Admin-only reset
 *
 * After deploying this file:
 * 1) bump local/prequran/version.php
 * 2) run Admin -> Notifications
 * 3) Purge caches
 */

// -----------------------------------------------------------------------------
// Functions
// -----------------------------------------------------------------------------
$functions = [

    
    
    'local_prequran_reset_step' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'reset_step',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Teacher/admin: reset a single step for a student.',
        'type'        => 'write',
                'capabilities'=> 'local/prequran:resetstep,prequran:resetstep',
'ajax'        => true,
    ],

'local_prequran_reset_student' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'reset_student',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Teacher/admin: reset all progress for a student (optionally within a lesson).',
        'type'        => 'write',
                'capabilities'=> 'local/prequran:resetstudent,prequran:resetstudent',
'ajax'        => true,
    ],

// -------------------------------------------------------------------------
    // Generic unit WS (recommended shared path)
    // -------------------------------------------------------------------------
    'local_prequran_get_unit_state' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'get_unit_state',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Get managed state for any (lessonid, unitid).',
        'type'        => 'read',
        'ajax'        => true,
    ],
    'local_prequran_set_unit_state' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'set_unit_state',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Set managed state for any (lessonid, unitid).',
        'type'        => 'write',
        'ajax'        => true,
    ],

    // -------------------------------------------------------------------------
    // Unit-specific WS (kept for backwards compatibility with existing unit pages)
    // -------------------------------------------------------------------------
    'local_prequran_get_alphabet_listen_state' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'get_alphabet_listen_state',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Get Alphabet Listen managed state.',
        'type'        => 'read',
        'ajax'        => true,
    ],
    'local_prequran_set_alphabet_listen_state' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'set_alphabet_listen_state',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Set Alphabet Listen managed state.',
        'type'        => 'write',
        'ajax'        => true,
    ],
    'local_prequran_get_alphabet_watch_state' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'get_alphabet_watch_state',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Get Alphabet Watch managed state.',
        'type'        => 'read',
        'ajax'        => true,
    ],
    'local_prequran_set_alphabet_watch_state' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'set_alphabet_watch_state',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Set Alphabet Watch managed state.',
        'type'        => 'write',
        'ajax'        => true,
    ],	
    'local_prequran_get_alphabet_match_state' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'get_alphabet_match_state',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Get Alphabet Match managed state.',
        'type'        => 'read',
        'ajax'        => true,
    ],
    'local_prequran_set_alphabet_match_state' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'set_alphabet_match_state',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Set Alphabet Match managed state.',
        'type'        => 'write',
        'ajax'        => true,
    ],
    'local_prequran_get_alphabet_speak_state' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'get_alphabet_speak_state',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Get Alphabet Speak managed state.',
        'type'        => 'read',
        'ajax'        => true,
    ],
    'local_prequran_set_alphabet_speak_state' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'set_alphabet_speak_state',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Set Alphabet Spak managed state.',
        'type'        => 'write',
        'ajax'        => true,
    ],
    'local_prequran_get_alphabet_write_state' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'get_alphabet_write_state',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Get Alphabet Write managed state.',
        'type'        => 'read',
        'ajax'        => true,
    ],
    'local_prequran_set_alphabet_write_state' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'set_alphabet_write_state',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Set Alphabet Write managed state.',
        'type'        => 'write',
        'ajax'        => true,
    ],
    'local_prequran_get_harakat_listen_state' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'get_harakat_listen_state',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Get Harakat Listen managed state.',
        'type'        => 'read',
        'ajax'        => true,
    ],
    'local_prequran_set_harakat_listen_state' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'set_harakat_listen_state',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Set Harakat Listen managed state.',
        'type'        => 'write',
        'ajax'        => true,
    ],
    'local_prequran_get_harakat_watch_state' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'get_harakat_watch_state',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Get Harakat Watch managed state.',
        'type'        => 'read',
        'ajax'        => true,
    ],
    'local_prequran_set_harakat_watch_state' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'set_harakat_watch_state',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Set Harakat Watch managed state.',
        'type'        => 'write',
        'ajax'        => true,
    ],
	'local_prequran_get_harakat_match_state' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'get_harakat_match_state',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Get Harakat Match managed state.',
        'type'        => 'read',
        'ajax'        => true,
    ],
    'local_prequran_set_harakat_match_state' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'set_harakat_match_state',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Set Harakat Match managed state.',
        'type'        => 'write',
        'ajax'        => true,
    ],
	'local_prequran_get_harakat_speak_state' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'get_harakat_speak_state',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Get Harakat Speak managed state.',
        'type'        => 'read',
        'ajax'        => true,
    ],
    'local_prequran_set_harakat_speak_state' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'set_harakat_speak_state',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Set Harakat Speak managed state.',
        'type'        => 'write',
        'ajax'        => true,
    ],
	'local_prequran_get_harakat_write_state' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'get_harakat_write_state',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Get Harakat Write managed state.',
        'type'        => 'read',
        'ajax'        => true,
    ],
    'local_prequran_set_harakat_write_state' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'set_harakat_write_state',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Set Harakat Write managed state.',
        'type'        => 'write',
        'ajax'        => true,
    ],
	'local_prequran_get_joint_connecting_forms_state' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'get_joint_connecting_forms_state',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Get Joint Connecting Forms managed state.',
        'type'        => 'read',
        'ajax'        => true,
    ],
    'local_prequran_set_joint_connecting_forms_state' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'set_joint_connecting_forms_state',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Set Joint Connecting Forms managed state.',
        'type'        => 'write',
        'ajax'        => true,
    ],
    
    
	'local_prequran_get_two_joined_letters_state' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'get_two_joined_letters_state',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Get two joined letters managed state.',
        'type'        => 'read',
        'ajax'        => true,
    ],
    'local_prequran_set_two_joined_letters_state' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'set_two_joined_letters_state',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Set two joined letters managed state.',
        'type'        => 'write',
        'ajax'        => true,
    ],
    
    
	'local_prequran_get_three_joined_letters_state' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'get_three_joined_letters_state',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Get three joined letters managed state.',
        'type'        => 'read',
        'ajax'        => true,
    ],
    'local_prequran_set_three_joined_letters_state' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'set_three_joined_letters_state',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Set three joined letters managed state.',
        'type'        => 'write',
        'ajax'        => true,
    ],
    
    'local_prequran_get_four_joined_letters_state' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'get_four_joined_letters_state',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Get four joined letters managed state.',
        'type'        => 'read',
        'ajax'        => true,
    ],
    'local_prequran_set_four_joined_letters_state' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'set_four_joined_letters_state',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Set four joined letters managed state.',
        'type'        => 'write',
        'ajax'        => true,
    ],
    
	'local_prequran_get_arabic_diacritics_listen_state' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'get_arabic_diacritics_listen_state',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Get arabic_diacritics_listen managed state.',
        'type'        => 'read',
        'ajax'        => true,
    ],
    'local_prequran_set_arabic_diacritics_listen_state' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'set_arabic_diacritics_listen_state',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Set arabic_diacritics_listen managed state.',
        'type'        => 'write',
        'ajax'        => true,
    ],
    
    'local_prequran_get_muqattiat_listen_state' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'get_muqattiat_listen_state',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Get Muqattiat Listen managed state.',
        'type'        => 'read',
        'ajax'        => true,
    ],
    'local_prequran_set_muqattiat_listen_state' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'set_muqattiat_listen_state',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Set Muqattiat Listen managed state.',
        'type'        => 'write',
        'ajax'        => true,
    ],
       'local_prequran_get_tanween_listen_state' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'get_tanween_listen_state',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Get tanween Listen managed state.',
        'type'        => 'read',
        'ajax'        => true,
    ],
    'local_prequran_set_tanween_listen_state' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'set_tanween_listen_state',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Set Tanween Listen managed state.',
        'type'        => 'write',
        'ajax'        => true,
    ],
    'local_prequran_get_tanween_movement_listen_state' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'get_tanween_movement_listen_state',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Get Tanween Movement Listen managed state.',
        'type'        => 'read',
        'ajax'        => true,
    ],
    'local_prequran_set_tanween_movement_listen_state' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'set_tanween_movement_listen_state',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Set Tanween Movement Listen managed state.',
        'type'        => 'write',
        'ajax'        => true,
    ],
    'local_prequran_get_madd_listen_state' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'get_madd_listen_state',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Get Madd Listen managed state.',
        'type'        => 'read',
        'ajax'        => true,
    ],
    'local_prequran_set_madd_listen_state' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'set_madd_listen_state',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Set Madd Listen managed state.',
        'type'        => 'write',
        'ajax'        => true,
    ],
    'local_prequran_get_maddoleen_listen_state' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'get_maddoleen_listen_state',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Get MaddoLeen Listen managed state.',
        'type'        => 'read',
        'ajax'        => true,
    ],
    'local_prequran_set_maddoleen_listen_state' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'set_maddoleen_listen_state',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Set MaddoLeen Listen managed state.',
        'type'        => 'write',
        'ajax'        => true,
    ],
    
    'local_prequran_get_sakoon_jazm_listen_state' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'get_sakoon_jazm_listen_state',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Get Sakoon Jazm Listen managed state.',
        'type'        => 'read',
        'ajax'        => true,
    ],
    
    'local_prequran_set_sakoon_jazm_listen_state' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'set_sakoon_jazm_listen_state',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Set Sakoon Jazm Listen managed state.',
        'type'        => 'write',
        'ajax'        => true,
    ],
    'local_prequran_get_tashdeed_listen_state' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'get_tashdeed_listen_state',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Get tashdeed managed state.',
        'type'        => 'read',
        'ajax'        => true,
    ],
    
    'local_prequran_set_tashdeed_listen_state' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'set_tashdeed_listen_state',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Set tashdeed Listen managed state.',
        'type'        => 'write',
        'ajax'        => true,
    ],
    'local_prequran_get_shaddah_match_state' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'get_shaddah_match_state',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Get Shaddah Match managed state.',
        'type'        => 'read',
        'ajax'        => true,
    ],
    'local_prequran_set_shaddah_match_state' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'set_shaddah_match_state',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Set Shaddah Match managed state.',
        'type'        => 'write',
        'ajax'        => true,
    ],
    
    
    // -------------------------------------------------------------------------
    // Reporting dashboards
    // -------------------------------------------------------------------------
    'local_prequran_report_cohort_unit_overview' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'report_cohort_unit_overview',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Dashboard: cohort overview for one unit.',
        'type'        => 'read',
        'ajax'        => true,
    ],
    'local_prequran_report_student_unit_detail' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'report_student_unit_detail',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Dashboard: student drilldown for one unit.',
        'type'        => 'read',
        'ajax'        => true,
    ],
    'local_prequran_report_cohort_step_analytics' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'report_cohort_step_analytics',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Dashboard: cohort step analytics for one unit.',
        'type'        => 'read',
        'ajax'        => true,
    ],

    // -------------------------------------------------------------------------
    // Start / touch tracking (for reliable lastactivity reporting)
    // -------------------------------------------------------------------------
    'local_prequran_mark_unit_started' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'mark_unit_started',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Mark unit started (start dialog).',
        'type'        => 'write',
        'ajax'        => true,
    ],
    'local_prequran_touch_unit' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'touch_unit',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Update overall_lastactivity/device/useragent.',
        'type'        => 'write',
        'ajax'        => true,
    ],
    'local_prequran_touch_step' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'touch_step',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Update step_lastactivity and step_starttime.',
        'type'        => 'write',
        'ajax'        => true,
    ],

    // -------------------------------------------------------------------------
    // Admin-only reset
    // -------------------------------------------------------------------------
    'local_prequran_reset_unit' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'reset_unit',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Admin-only: reset a unit for a student.',
        'type'        => 'write',
        'ajax'        => true,
    ],


    'local_prequran_set_focus_event' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'set_focus_event',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Managed-only: record a FocusGuard event and update focus aggregates.',
        'type'        => 'write',
        'ajax'        => true,
    ],

    'local_prequran_get_focus_summary' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'get_focus_summary',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Admin/teacher: get FocusGuard aggregate summaries for reporting.',
        'type'        => 'read',
        'ajax'        => true,
    ],


];

// -----------------------------------------------------------------------------
// Services
// -----------------------------------------------------------------------------
$services = [
    'PreQuran Web Services' => [
        'functions' => array_keys($functions),
        'restrictedusers' => 0,
        'enabled' => 1,
        'shortname' => 'prequran_ws',
        'downloadfiles' => 0,
        'uploadfiles' => 0,
    ],
];
