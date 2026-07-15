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

    // -------------------------------------------------------------------------
    // Course transcript services.
    // -------------------------------------------------------------------------
    'local_prequran_transcript_preview' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'transcript_preview',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Course transcripts: resolve an unofficial transcript preview with warnings.',
        'type'        => 'read',
        'ajax'        => true,
    ],
    'local_prequran_transcript_issue_official' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'transcript_issue_official',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Course transcripts: issue an official transcript snapshot.',
        'type'        => 'write',
        'ajax'        => true,
    ],
    'local_prequran_transcript_document' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'transcript_document',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Course transcripts: return an authenticated export URL for an official transcript.',
        'type'        => 'read',
        'ajax'        => true,
    ],
    'local_prequran_transcript_verify' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'transcript_verify',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Course transcripts: verify an official transcript document ID and signed code.',
        'type'        => 'read',
        'ajax'        => true,
    ],
    'local_prequran_transcript_manage' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'transcript_manage',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Course transcripts: manage holds, revocation, and reissue.',
        'type'        => 'write',
        'ajax'        => true,
    ],

    // -------------------------------------------------------------------------
    // Finance APIs, hardening, and scale controls.
    // -------------------------------------------------------------------------
    'local_prequran_finance_summary' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'finance_summary',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Finance: return workspace billing metrics for authorized finance admins.',
        'type'        => 'read',
        'ajax'        => true,
    ],
    'local_prequran_finance_invoice_action' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'finance_invoice_action',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Finance: perform idempotent invoice actions such as payment recording, hosted checkout creation, and secure-link revocation.',
        'type'        => 'write',
        'ajax'        => true,
    ],
    'local_prequran_finance_hardening_status' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'finance_hardening_status',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Finance: return API hardening and scale-control status for a workspace.',
        'type'        => 'read',
        'ajax'        => true,
    ],

    // -------------------------------------------------------------------------
    // Live sessions (BigBlueButton production MVP)
    // -------------------------------------------------------------------------
    'local_prequran_live_create_session' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'live_create_session',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Live sessions: create a scheduled BigBlueButton review session.',
        'type'        => 'write',
        'ajax'        => true,
    ],
    'local_prequran_live_list_sessions' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'live_list_sessions',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Live sessions: list visible scheduled sessions for the current user.',
        'type'        => 'read',
        'ajax'        => true,
    ],
    'local_prequran_live_get_session' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'live_get_session',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Live sessions: get one visible session with participants.',
        'type'        => 'read',
        'ajax'        => true,
    ],
    'local_prequran_live_join_session' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'live_join_session',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Live sessions: validate access and return a BigBlueButton join URL.',
        'type'        => 'write',
        'ajax'        => true,
    ],

    
    
    'local_prequran_reset_step' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'reset_step',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Teacher/admin: reset a single step for a student.',
        'type'        => 'write',
                'capabilities'=> 'local/prequran:resetstep,prequran:resetstep',
'ajax'        => true,
    ],

    'local_prequran_skip_step' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'skip_step',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Teacher/admin: mark one step complete for non-production QA.',
        'type'        => 'write',
        'capabilities'=> 'local/prequran:resetstep,prequran:resetstep',
        'ajax'        => true,
    ],

    'local_prequran_update_step_config' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'update_step_config',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Teacher/admin: update step passes and repeats for non-production QA.',
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
    'local_prequran_get_most_used_words_state' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'get_most_used_words_state',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Get Most Used Words managed state.',
        'type'        => 'read',
        'ajax'        => true,
    ],
    'local_prequran_set_most_used_words_state' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'set_most_used_words_state',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Set Most Used Words managed state.',
        'type'        => 'write',
        'ajax'        => true,
    ],
    'local_prequran_get_names_of_allah_state' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'get_names_of_allah_state',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Get Names of Allah managed state.',
        'type'        => 'read',
        'ajax'        => true,
    ],
    'local_prequran_set_names_of_allah_state' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'set_names_of_allah_state',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Set Names of Allah managed state.',
        'type'        => 'write',
        'ajax'        => true,
    ],
    'local_prequran_get_pillars_of_islam_state' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'get_pillars_of_islam_state',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Get Pillars of Islam managed state.',
        'type'        => 'read',
        'ajax'        => true,
    ],
    'local_prequran_set_pillars_of_islam_state' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'set_pillars_of_islam_state',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Set Pillars of Islam managed state.',
        'type'        => 'write',
        'ajax'        => true,
    ],
    'local_prequran_get_pillars_of_faith_state' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'get_pillars_of_faith_state',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Get Pillars of Faith managed state.',
        'type'        => 'read',
        'ajax'        => true,
    ],
    'local_prequran_set_pillars_of_faith_state' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'set_pillars_of_faith_state',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Set Pillars of Faith managed state.',
        'type'        => 'write',
        'ajax'        => true,
    ],
    'local_prequran_get_manners_akhlaq_state' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'get_manners_akhlaq_state',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Get Manners Akhlaq managed state.',
        'type'        => 'read',
        'ajax'        => true,
    ],
    'local_prequran_set_manners_akhlaq_state' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'set_manners_akhlaq_state',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Set Manners Akhlaq managed state.',
        'type'        => 'write',
        'ajax'        => true,
    ],
    'local_prequran_save_speak_recording' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'save_speak_recording',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Save a student Speak-step recording for teacher review.',
        'type'        => 'write',
        'ajax'        => true,
    ],
    'local_prequran_save_submit_recording' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'save_submit_recording',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Save one final full-unit Submit-step audio recording for teacher review.',
        'type'        => 'write',
        'ajax'        => true,
    ],
    'local_prequran_save_quiz_event' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'save_quiz_event',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Save quiz chatbot attempt, pass, and question analytics events.',
        'type'        => 'write',
        'ajax'        => true,
    ],
    'local_prequran_get_quiz_report' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'get_quiz_report',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Get quiz chatbot reporting data for an allowed student.',
        'type'        => 'read',
        'ajax'        => true,
    ],

    // -------------------------------------------------------------------------
    // Communications Phase 1 (announcements)
    // -------------------------------------------------------------------------
    'local_prequran_comm_list_threads' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'comm_list_threads',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Communications: list visible announcement/message threads for the current user.',
        'type'        => 'read',
        'ajax'        => true,
    ],
    'local_prequran_comm_get_thread' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'comm_get_thread',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Communications: get one thread and its visible messages.',
        'type'        => 'read',
        'ajax'        => true,
    ],
    'local_prequran_comm_create_announcement' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'comm_create_announcement',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Communications: create a cohort or student-family announcement.',
        'type'        => 'write',
        'ajax'        => true,
    ],
    'local_prequran_comm_create_parent_thread' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'comm_create_parent_thread',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Communications: create a private teacher-parent thread linked to one student.',
        'type'        => 'write',
        'ajax'        => true,
    ],
    'local_prequran_comm_send_parent_alert' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'comm_send_parent_alert',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Communications: create an important parent alert and optionally send urgent WhatsApp delivery.',
        'type'        => 'write',
        'ajax'        => true,
    ],
    'local_prequran_comm_send_message' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'comm_send_message',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Communications: send a message to a thread where the caller is an allowed participant.',
        'type'        => 'write',
        'ajax'        => true,
    ],

    // -------------------------------------------------------------------------
    // Support Phase 2 (asynchronous conversations)
    // -------------------------------------------------------------------------
    'local_prequran_support_start_conversation' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'support_start_conversation',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Support: start an allowed asynchronous support conversation.',
        'type'        => 'write',
        'ajax'        => true,
    ],
    'local_prequran_support_send_message' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'support_send_message',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Support: send a visible message to an allowed support conversation.',
        'type'        => 'write',
        'ajax'        => true,
    ],
    'local_prequran_support_mark_read' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'support_mark_read',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Support: mark a support conversation read for the current user.',
        'type'        => 'write',
        'ajax'        => true,
    ],
    'local_prequran_support_list_conversations' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'support_list_conversations',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Support: list allowed asynchronous support conversations.',
        'type'        => 'read',
        'ajax'        => true,
    ],
    'local_prequran_support_get_conversation' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'support_get_conversation',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Support: get one support conversation and visible messages.',
        'type'        => 'read',
        'ajax'        => true,
    ],

    // -------------------------------------------------------------------------
    // Support Phase 7 (near-real-time live chat polish)
    // -------------------------------------------------------------------------
    'local_prequran_support_live_poll' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'support_live_poll',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Support: poll conversations, active messages, availability, and live indicators.',
        'type'        => 'write',
        'ajax'        => true,
    ],

    // -------------------------------------------------------------------------
    // Support Phase 4 (ticket conversion and lifecycle)
    // -------------------------------------------------------------------------
    'local_prequran_support_convert_to_ticket' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'support_convert_to_ticket',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Support: convert a support conversation into a tracked ticket with attached history.',
        'type'        => 'write',
        'capabilities'=> 'local/prequran:supportconvert',
        'ajax'        => true,
    ],
    'local_prequran_support_update_ticket' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'support_update_ticket',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Support: update ticket lifecycle, priority, category, assignment, and staff notes.',
        'type'        => 'write',
        'capabilities'=> 'local/prequran:supportupdateticket',
        'ajax'        => true,
    ],
    'local_prequran_support_list_tickets' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'support_list_tickets',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Support: list tracked tickets for authorized support staff.',
        'type'        => 'read',
        'capabilities'=> 'local/prequran:supportviewqueue',
        'ajax'        => true,
    ],
    'local_prequran_support_get_ticket' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'support_get_ticket',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Support: get one ticket with linked conversation messages and event timeline.',
        'type'        => 'read',
        'capabilities'=> 'local/prequran:supportviewqueue',
        'ajax'        => true,
    ],

    // -------------------------------------------------------------------------
    // Support Phase 5 (SLA, routing, canned replies, supervisor operations)
    // -------------------------------------------------------------------------
    'local_prequran_support_list_queues' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'support_list_queues',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Support: list operational queues for authorized support staff.',
        'type'        => 'read',
        'capabilities'=> 'local/prequran:supportviewqueue',
        'ajax'        => true,
    ],
    'local_prequran_support_refresh_sla' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'support_refresh_sla',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Support: recalculate SLA due dates for one ticket or an active ticket set.',
        'type'        => 'write',
        'capabilities'=> 'local/prequran:supportmanagesla',
        'ajax'        => true,
    ],
    'local_prequran_support_route_ticket' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'support_route_ticket',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Support: route or transfer a ticket to a queue and assignee.',
        'type'        => 'write',
        'capabilities'=> 'local/prequran:supportassignticket',
        'ajax'        => true,
    ],
    'local_prequran_support_list_canned_responses' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'support_list_canned_responses',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Support: list active canned responses visible to the current staff user.',
        'type'        => 'read',
        'capabilities'=> 'local/prequran:supportreply',
        'ajax'        => true,
    ],
    'local_prequran_support_save_canned_response' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'support_save_canned_response',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Support: create or update a canned response.',
        'type'        => 'write',
        'capabilities'=> 'local/prequran:supportmanagesla',
        'ajax'        => true,
    ],
    'local_prequran_support_send_canned_reply' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'support_send_canned_reply',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Support: send a canned public reply to a linked ticket conversation.',
        'type'        => 'write',
        'capabilities'=> 'local/prequran:supportreply',
        'ajax'        => true,
    ],
    'local_prequran_support_supervisor_summary' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'support_supervisor_summary',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Support: return supervisor queue, SLA risk, and workload summary counts.',
        'type'        => 'read',
        'capabilities'=> 'local/prequran:supportreports',
        'ajax'        => true,
    ],

    // -------------------------------------------------------------------------
    // Support Phase 6 (reports, search, export, satisfaction, quality review)
    // -------------------------------------------------------------------------
    'local_prequran_support_search' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'support_search',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Support: search tickets by text, filters, users, and message content.',
        'type'        => 'read',
        'capabilities'=> 'local/prequran:supportviewqueue',
        'ajax'        => true,
    ],
    'local_prequran_support_reports' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'support_reports',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Support: return supervisor and admin report aggregates.',
        'type'        => 'read',
        'capabilities'=> 'local/prequran:supportreports',
        'ajax'        => true,
    ],
    'local_prequran_support_export_csv' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'support_export_csv',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Support: export ticket report rows as CSV content.',
        'type'        => 'read',
        'capabilities'=> 'local/prequran:supportreports',
        'ajax'        => true,
    ],
    'local_prequran_support_rate_ticket' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'support_rate_ticket',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Support: submit a requester satisfaction rating for a resolved or closed ticket.',
        'type'        => 'write',
        'ajax'        => true,
    ],
    'local_prequran_support_quality_queue' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'support_quality_queue',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Support: list tickets needing quality review.',
        'type'        => 'read',
        'capabilities'=> 'local/prequran:supportaudit',
        'ajax'        => true,
    ],
    'local_prequran_support_quality_review' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'support_quality_review',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Support: record a staff-only quality review for a ticket.',
        'type'        => 'write',
        'capabilities'=> 'local/prequran:supportaudit',
        'ajax'        => true,
    ],

    // -------------------------------------------------------------------------
    // Support Phase 8 (safety hardening, audit review, pilot launch)
    // -------------------------------------------------------------------------
    'local_prequran_support_audit_log' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'support_audit_log',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Support: review support audit rows and ticket timeline events for pilot safety review.',
        'type'        => 'read',
        'capabilities'=> 'local/prequran:supportaudit',
        'ajax'        => true,
    ],
    'local_prequran_support_pilot_readiness' => [
        'classname'   => 'local_prequran_external',
        'methodname'  => 'support_pilot_readiness',
        'classpath'   => 'local/prequran/externallib_v4.php',
        'description' => 'Support: return pilot readiness gates, metrics, and rollback summary.',
        'type'        => 'read',
        'capabilities'=> 'local/prequran:supportaudit',
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
