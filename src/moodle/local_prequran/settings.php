<?php
defined('MOODLE_INTERNAL') || die();

if ($hassiteconfig) {
    $settings = new admin_settingpage('local_prequran', get_string('pluginname', 'local_prequran'));

    $settings->add(new admin_setting_heading(
        'local_prequran/environment_heading',
        'EduPlatform environments',
        'Controls which Bunny path Moodle launches by default. Production remains the default and existing data is treated as production data.'
    ));

    $settings->add(new admin_setting_configselect(
        'local_prequran/bunny_environment',
        'Default Bunny environment',
        'Default environment for Moodle launch routes.',
        'production',
        [
            'production' => 'Production',
            'staging' => 'Staging',
            'integration' => 'Integration',
        ]
    ));

    $settings->add(new admin_setting_configtext(
        'local_prequran/bunny_app_base_url',
        'App base URL',
        'Legacy app base URL used by older launch routes. Leave blank so Moodle uses the EduPlatform shared resource CDN.',
        '',
        PARAM_URL
    ));

    $settings->add(new admin_setting_configtext(
        'local_prequran/bunny_shared_cdn_base_url',
        'EduPlatform shared resource CDN base URL',
        'Shared public CDN origin used by EduPlatform and all institution consumers. Do not set this to a consumer-specific host.',
        '',
        PARAM_URL
    ));

    $settings->add(new admin_setting_heading(
        'local_prequran/bunny_storage_heading',
        'Bunny storage',
        'Server-side Bunny Storage settings used for private uploads such as workspace materials and learner recordings.'
    ));

    $settings->add(new admin_setting_configtext(
        'local_prequran/bunny_storage_zone',
        'Bunny storage zone',
        'Storage zone name used by Bunny Storage API uploads.',
        '',
        PARAM_ALPHANUMEXT
    ));

    $settings->add(new admin_setting_configtext(
        'local_prequran/bunny_storage_host',
        'Bunny storage host',
        'Bunny Storage API host. Use storage.bunnycdn.com unless your storage zone requires a regional host.',
        'storage.bunnycdn.com',
        PARAM_HOST
    ));

    $settings->add(new admin_setting_configpasswordunmask(
        'local_prequran/bunny_storage_access_key',
        'Bunny storage access key',
        'Server-side Bunny Storage API access key. Never place this key in static Bunny JavaScript.',
        ''
    ));

    $settings->add(new admin_setting_configtext(
        'local_prequran/bunny_workspace_material_prefix',
        'Workspace material storage prefix',
        'Folder prefix inside the Bunny storage zone for uploaded workspace materials.',
        'pre_quraan/workspace_materials',
        PARAM_TEXT
    ));

    $settings->add(new admin_setting_configtext(
        'local_prequran/bunny_live_session_slides_prefix',
        'Live-session slide storage prefix',
        'Folder prefix inside the Bunny storage zone for session-specific agenda slide decks.',
        'pre_quraan/live-session-slides',
        PARAM_TEXT
    ));

    $settings->add(new admin_setting_configtext(
        'local_prequran/bunny_live_session_agenda_template_path',
        'Live-session agenda template storage path',
        'Bunny storage path for the default agenda template copied into each new live session.',
        'pre_quraan/live-session-templates/live-session-agenda-template.pptx',
        PARAM_TEXT
    ));

    $settings->add(new admin_setting_heading(
        'local_prequran/onlyoffice_heading',
        'Online agenda editor',
        'Optional ONLYOFFICE Docs integration for browser-based editing of live-session PowerPoint agenda decks.'
    ));

    $settings->add(new admin_setting_configtext(
        'local_prequran/onlyoffice_document_server_url',
        'ONLYOFFICE document server URL',
        'Base URL of the ONLYOFFICE Docs document server, for example https://office.example.com. Leave blank to hide the online editor.',
        '',
        PARAM_URL
    ));

    $settings->add(new admin_setting_configpasswordunmask(
        'local_prequran/onlyoffice_jwt_secret',
        'ONLYOFFICE JWT secret',
        'Optional JWT secret shared with ONLYOFFICE Docs when token validation is enabled on the document server.',
        ''
    ));

    $settings->add(new admin_setting_configtext(
        'local_prequran/bunny_base_production',
        'Production Bunny base path',
        'Public base path for production assets.',
        '/pre_quraan/',
        PARAM_TEXT
    ));

    $settings->add(new admin_setting_configtext(
        'local_prequran/bunny_base_staging',
        'Staging Bunny base path',
        'Public base path for staging assets.',
        '/pre_quraan_staging/',
        PARAM_TEXT
    ));

    $settings->add(new admin_setting_configtext(
        'local_prequran/bunny_base_integration',
        'Integration Bunny base path',
        'Public base path for integration assets.',
        '/pre_quraan_integration/',
        PARAM_TEXT
    ));

    $settings->add(new admin_setting_configcheckbox(
        'local_prequran/allow_nonproduction_launch',
        'Allow non-production launch override',
        'When enabled, users may launch Moodle routes with pq_env=integration or pq_env=staging. Site admins can always use the override.',
        0
    ));

    $settings->add(new admin_setting_configcheckbox(
        'local_prequran/redirect_moodle_dashboard',
        'Redirect EduPlatform users from Moodle dashboard',
        'When enabled, students who reach /my/ are sent to the EduPlatform app launcher, while parents and teachers are sent to the EduPlatform dashboard. Site administrators and unknown accounts remain on Moodle.',
        1
    ));

    $settings->add(new admin_setting_heading(
        'local_prequran/whatsapp_alerts_heading',
        'Urgent parent WhatsApp alerts',
        'Optional Meta WhatsApp Cloud API delivery for urgent parent alerts. Moodle remains the system of record; WhatsApp is only a fast delivery channel for important child-related situations.'
    ));

    $settings->add(new admin_setting_configcheckbox(
        'local_prequran/whatsapp_alerts_enabled',
        'Enable urgent WhatsApp alerts',
        'When enabled, urgent parent alerts can be sent to linked guardians with a phone or WhatsApp number. Leave disabled until Meta WhatsApp Cloud API credentials and an approved template are configured.',
        0
    ));

    $settings->add(new admin_setting_configselect(
        'local_prequran/whatsapp_delivery_provider',
        'WhatsApp delivery provider',
        'Use Meta Cloud API for direct delivery from Moodle. The generic webhook option remains available for a future external integration service.',
        'meta_cloud',
        [
            'meta_cloud' => 'Meta WhatsApp Cloud API',
            'webhook' => 'Generic webhook',
        ]
    ));

    $settings->add(new admin_setting_configtext(
        'local_prequran/whatsapp_meta_graph_version',
        'Meta Graph API version',
        'Graph API version used for Cloud API calls, for example v20.0. Update this during Meta API version upgrades.',
        'v20.0',
        PARAM_TEXT
    ));

    $settings->add(new admin_setting_configtext(
        'local_prequran/whatsapp_meta_phone_number_id',
        'Meta phone number ID',
        'The WhatsApp Business Platform phone_number_id from Meta Business Manager. This is not the display phone number.',
        '',
        PARAM_ALPHANUMEXT
    ));

    $settings->add(new admin_setting_configpasswordunmask(
        'local_prequran/whatsapp_meta_access_token',
        'Meta permanent access token',
        'Server-side WhatsApp Cloud API token with permission to send messages for the configured phone number ID.',
        ''
    ));

    $settings->add(new admin_setting_configtext(
        'local_prequran/whatsapp_meta_template_name',
        'Meta urgent alert template name',
        'Approved WhatsApp message template name. Recommended variables: parent name, student name, alert message, and parent message link.',
        'parent_urgent_alert',
        PARAM_ALPHANUMEXT
    ));

    $settings->add(new admin_setting_configtext(
        'local_prequran/whatsapp_meta_template_language',
        'Meta template language code',
        'Language code for the approved template, for example en_US.',
        'en_US',
        PARAM_TEXT
    ));

    $settings->add(new admin_setting_configtext(
        'local_prequran/whatsapp_webhook_url',
        'WhatsApp webhook URL',
        'Advanced fallback only. HTTPS endpoint owned by an external integration service. Used only when WhatsApp delivery provider is set to Generic webhook.',
        '',
        PARAM_URL
    ));

    $settings->add(new admin_setting_configpasswordunmask(
        'local_prequran/whatsapp_webhook_token',
        'WhatsApp webhook bearer token',
        'Advanced fallback only. Optional bearer token sent to the generic webhook as Authorization: Bearer <token>. Keep this server-side only.',
        ''
    ));

    $settings->add(new admin_setting_configtext(
        'local_prequran/whatsapp_from',
        'WhatsApp sender',
        'Advanced fallback only. Optional provider sender identifier for generic webhook integrations.',
        '',
        PARAM_TEXT
    ));

    $settings->add(new admin_setting_heading(
        'local_prequran/support_heading',
        'Live chat and help desk',
        'EduPlatform-level support settings inherited by institutional consumers unless an explicit consumer or workspace support policy overrides them.'
    ));

    $settings->add(new admin_setting_configcheckbox(
        'local_prequran/support_livechat_enabled',
        'Enable live chat globally',
        'Master switch for near-real-time support chat entry points across EduPlatform and institutional consumers.',
        1
    ));

    $settings->add(new admin_setting_configcheckbox(
        'local_prequran/support_async_enabled',
        'Enable asynchronous support globally',
        'Allows support conversations across EduPlatform and institutional consumers unless an explicit scoped policy disables them.',
        1
    ));

    $settings->add(new admin_setting_configcheckbox(
        'local_prequran/support_student_helpdesk_enabled',
        'Enable student to help desk support globally',
        'Allows student-help-desk conversations for institutional consumers, subject to relationship and permission checks.',
        1
    ));

    $settings->add(new admin_setting_configcheckbox(
        'local_prequran/support_student_teacher_enabled',
        'Enable student to teacher support globally',
        'Allows student-teacher conversations for institutional consumers, subject to assigned-teacher checks.',
        1
    ));

    $settings->add(new admin_setting_configcheckbox(
        'local_prequran/support_parent_teacher_enabled',
        'Enable parent to teacher support globally',
        'Keeps the existing parent-teacher communication path available for support policy resolution.',
        1
    ));

    $settings->add(new admin_setting_configselect(
        'local_prequran/support_student_free_text_policy',
        'Default student free-text policy',
        'Default support message policy used when a workspace has no explicit support policy.',
        'topic_only',
        [
            'disabled' => 'Disabled',
            'topic_only' => 'Topic choices only',
            'moderated' => 'Moderated free text',
            'enabled' => 'Enabled',
        ]
    ));

    $settings->add(new admin_setting_configcheckbox(
        'local_prequran/support_parent_visible_default',
        'Parent visible by default',
        'When enabled, student-created support conversations default to parent-visible.',
        1
    ));

    $settings->add(new admin_setting_configtext(
        'local_prequran/support_business_timezone',
        'Default support business timezone',
        'Timezone used for default SLA calculations until workspace support hours are configured.',
        'UTC',
        PARAM_TEXT
    ));

    $settings->add(new admin_setting_configtext(
        'local_prequran/support_retention_days',
        'Default support retention days',
        'Retention target for support records. Destructive purge remains disabled until a later reviewed phase.',
        365,
        PARAM_INT
    ));

    $settings->add(new admin_setting_heading(
        'local_prequran/finance_payment_heading',
        'Finance hosted payments',
        'Platform-level hosted payment defaults. Workspace or consumer provider configuration can override these values when enabled.'
    ));

    $settings->add(new admin_setting_configcheckbox(
        'local_prequran/finance_payment_enabled',
        'Enable hosted payments',
        'When enabled and a checkout base URL plus webhook secret are configured, hosted invoice pages can create payment sessions.',
        0
    ));

    $settings->add(new admin_setting_configselect(
        'local_prequran/finance_payment_mode',
        'Payment mode',
        'Use test mode until provider sandbox webhooks have been verified.',
        'test',
        [
            'test' => 'Test',
            'live' => 'Live',
        ]
    ));

    $settings->add(new admin_setting_configtext(
        'local_prequran/finance_payment_provider',
        'Payment provider',
        'Provider key for hosted payment sessions. The Phase 11 implementation supports generic_hosted webhooks.',
        'generic_hosted',
        PARAM_ALPHANUMEXT
    ));

    $settings->add(new admin_setting_configtext(
        'local_prequran/finance_payment_account_id',
        'Provider account ID',
        'Platform-level payment provider account identifier.',
        '',
        PARAM_TEXT
    ));

    $settings->add(new admin_setting_configtext(
        'local_prequran/finance_payment_checkout_base_url',
        'Checkout base URL',
        'Provider hosted checkout URL. Moodle appends session, invoice, amount, currency, return, and cancel parameters.',
        '',
        PARAM_URL
    ));

    $settings->add(new admin_setting_configpasswordunmask(
        'local_prequran/finance_payment_api_key',
        'Payment API key',
        'Reserved server-side provider API key for later direct session creation. It is not exposed to hosted invoice pages.',
        ''
    ));

    $settings->add(new admin_setting_configpasswordunmask(
        'local_prequran/finance_payment_webhook_secret',
        'Webhook signing secret',
        'Shared HMAC secret used to verify payment webhook signatures.',
        ''
    ));

    $settings->add(new admin_setting_heading(
        'local_prequran/quiz_tts_heading',
        'Chatbot and coach voice',
        'Server-side ElevenLabs text-to-speech settings for child quiz chatbots and the Chatbot Practice Coach. Keep the API key server-side only.'
    ));

    $settings->add(new admin_setting_configpasswordunmask(
        'local_prequran/elevenlabs_api_key',
        'ElevenLabs API key',
        'API key used by the Moodle server-side voice proxy. Never place this key in Bunny/static JavaScript.',
        ''
    ));

    $settings->add(new admin_setting_configcheckbox(
        'local_prequran/practice_coach_enabled',
        'Enable Chatbot Practice Coach',
        'When enabled, teacherless supervised-practice sessions can receive real-time coaching prompts based on lesson focus events.',
        1
    ));

    $settings->add(new admin_setting_configcheckbox(
        'local_prequran/practice_coach_autospeak',
        'Practice Coach speaks automatically',
        'When enabled, Practice Coach prompts request ElevenLabs audio immediately. Browsers may still require the learner to tap Listen first.',
        1
    ));

    $settings->add(new admin_setting_configcheckbox(
        'local_prequran/practice_coach_ai_rewrite_enabled',
        'Practice Coach AI message rewrite',
        'Optional. When enabled, the server asks AI to rewrite approved Practice Coach templates into short, child-safe wording. The template intent remains fixed.',
        0
    ));

    $settings->add(new admin_setting_configpasswordunmask(
        'local_prequran/practice_coach_openai_api_key',
        'Practice Coach OpenAI API key',
        'Optional server-side key for safe template rewrites and summary wording. Leave blank to keep the coach fully rule-based.',
        ''
    ));

    $settings->add(new admin_setting_configtext(
        'local_prequran/practice_coach_openai_model',
        'Practice Coach OpenAI model',
        'Model used only when AI rewrite is enabled. Output is constrained to a short coaching sentence.',
        'gpt-4.1-mini',
        PARAM_TEXT
    ));

    $settings->add(new admin_setting_configtext(
        'local_prequran/quiz_tts_voice_id',
        'Quiz chatbot ElevenLabs voice ID',
        'Voice ID used for the child-friendly quiz chatbot voice.',
        'B5xxC4eQoOFJnY4R5XkI',
        PARAM_ALPHANUMEXT
    ));

    $settings->add(new admin_setting_configtext(
        'local_prequran/practice_coach_voice_id',
        'Practice Coach ElevenLabs voice ID',
        'Voice ID used by the Chatbot Practice Coach. Leave blank to reuse the quiz chatbot voice.',
        'B5xxC4eQoOFJnY4R5XkI',
        PARAM_ALPHANUMEXT
    ));

    $settings->add(new admin_setting_configtext(
        'local_prequran/quiz_tts_model_id',
        'Quiz chatbot ElevenLabs model ID',
        'Model ID used for quiz chatbot text-to-speech.',
        'eleven_multilingual_v2',
        PARAM_ALPHANUMEXT
    ));

    $settings->add(new admin_setting_configtext(
        'local_prequran/practice_coach_model_id',
        'Practice Coach ElevenLabs model ID',
        'Model ID used for Practice Coach text-to-speech. Leave blank to reuse the quiz chatbot model.',
        'eleven_multilingual_v2',
        PARAM_ALPHANUMEXT
    ));

    $settings->add(new admin_setting_heading(
        'local_prequran/bbb_heading',
        get_string('bbb_heading', 'local_prequran'),
        get_string('bbb_heading_desc', 'local_prequran')
    ));

    $settings->add(new admin_setting_configtext(
        'local_prequran/bbb_base_url',
        get_string('bbb_base_url', 'local_prequran'),
        get_string('bbb_base_url_desc', 'local_prequran'),
        '',
        PARAM_URL
    ));

    $settings->add(new admin_setting_configpasswordunmask(
        'local_prequran/bbb_shared_secret',
        get_string('bbb_shared_secret', 'local_prequran'),
        get_string('bbb_shared_secret_desc', 'local_prequran'),
        ''
    ));

    $settings->add(new admin_setting_configselect(
        'local_prequran/bbb_record_default',
        get_string('bbb_record_default', 'local_prequran'),
        get_string('bbb_record_default_desc', 'local_prequran'),
        'consent',
        [
            'consent' => get_string('bbb_record_default_consent', 'local_prequran'),
            'off' => get_string('bbb_record_default_off', 'local_prequran'),
            'on' => get_string('bbb_record_default_on', 'local_prequran'),
        ]
    ));

    $settings->add(new admin_setting_configtext(
        'local_prequran/bbb_join_window_before_minutes',
        get_string('bbb_join_window_before_minutes', 'local_prequran'),
        get_string('bbb_join_window_before_minutes_desc', 'local_prequran'),
        10,
        PARAM_INT
    ));

    $settings->add(new admin_setting_configtext(
        'local_prequran/bbb_join_window_after_minutes',
        get_string('bbb_join_window_after_minutes', 'local_prequran'),
        get_string('bbb_join_window_after_minutes_desc', 'local_prequran'),
        15,
        PARAM_INT
    ));

    $settings->add(new admin_setting_configtext(
        'local_prequran/bbb_max_participants_default',
        get_string('bbb_max_participants_default', 'local_prequran'),
        get_string('bbb_max_participants_default_desc', 'local_prequran'),
        12,
        PARAM_INT
    ));

    $settings->add(new admin_setting_configtext(
        'local_prequran/bbb_recording_retention_days',
        get_string('bbb_recording_retention_days', 'local_prequran'),
        get_string('bbb_recording_retention_days_desc', 'local_prequran'),
        90,
        PARAM_INT
    ));

    $settings->add(new admin_setting_configtext(
        'local_prequran/bbb_recording_sync_lookback_days',
        get_string('bbb_recording_sync_lookback_days', 'local_prequran'),
        get_string('bbb_recording_sync_lookback_days_desc', 'local_prequran'),
        14,
        PARAM_INT
    ));

    $settings->add(new admin_setting_configtext(
        'local_prequran/bbb_recording_sync_limit',
        get_string('bbb_recording_sync_limit', 'local_prequran'),
        get_string('bbb_recording_sync_limit_desc', 'local_prequran'),
        30,
        PARAM_INT
    ));

    $settings->add(new admin_setting_configtext(
        'local_prequran/bbb_recording_expiry_reminder_days',
        get_string('bbb_recording_expiry_reminder_days', 'local_prequran'),
        get_string('bbb_recording_expiry_reminder_days_desc', 'local_prequran'),
        7,
        PARAM_INT
    ));

    $settings->add(new admin_setting_heading(
        'local_prequran/parent_trust_heading',
        get_string('parent_trust_heading', 'local_prequran'),
        get_string('parent_trust_heading_desc', 'local_prequran')
    ));

    $settings->add(new admin_setting_configtext(
        'local_prequran/parent_trust_retention_days',
        get_string('parent_trust_retention_days', 'local_prequran'),
        get_string('parent_trust_retention_days_desc', 'local_prequran'),
        365,
        PARAM_INT
    ));

    $settings->add(new admin_setting_configcheckbox(
        'local_prequran/parent_trust_purge_requires_export',
        get_string('parent_trust_purge_requires_export', 'local_prequran'),
        get_string('parent_trust_purge_requires_export_desc', 'local_prequran'),
        1
    ));

    $settings->add(new admin_setting_configcheckbox(
        'local_prequran/parent_trust_purge_approval_required',
        get_string('parent_trust_purge_approval_required', 'local_prequran'),
        get_string('parent_trust_purge_approval_required_desc', 'local_prequran'),
        1
    ));

    $settings->add(new admin_setting_heading(
        'local_prequran/ehel_academy_heading',
        'Ehel Academy catalog & enrolment',
        'Static sources the catalog-sync and cohort-sync scheduled tasks read to create courses, grade items, and pilot enrolments.'
    ));

    $settings->add(new admin_setting_configtextarea(
        'local_prequran/catalog_source_url',
        'Catalog URLs (one per school)',
        'catalog.json URLs the catalog-sync task reads to create categories, courses (by idnumber) and grade items — ONE PER LINE, one per consumer school (Ehel Academy, Quraan Academy, …). Leave blank to disable the task.',
        'https://ehelacademy.b-cdn.net/Ehel%20Primary/catalog.json',
        PARAM_RAW_TRIMMED
    ));

    $settings->add(new admin_setting_configtextarea(
        'local_prequran/cohorts_source_url',
        'Cohort roster URLs (one per school)',
        'cohorts.json URLs the cohort-sync task reads to enrol learners into the synced courses — ONE PER LINE, one per consumer school. Leave blank to disable the task.',
        'https://ehelacademy.b-cdn.net/Ehel%20Primary/cohorts.json',
        PARAM_RAW_TRIMMED
    ));

    $settings->add(new admin_setting_configtext(
        'local_prequran/term_start',
        'Academic term start (YYYY-MM-DD)',
        'When set, catalog-sync stamps this as the start date on the Ehel courses it manages (create + drift-update). Blank = do not manage course dates.',
        '',
        PARAM_RAW_TRIMMED
    ));

    $settings->add(new admin_setting_configtext(
        'local_prequran/term_end',
        'Academic term end (YYYY-MM-DD)',
        'When set, catalog-sync stamps this as the end date on the Ehel courses it manages. Blank = no end date.',
        '',
        PARAM_RAW_TRIMMED
    ));

    $reconcilemodes = ['' => 'Off', 'report' => 'Report only (log, change nothing)', 'enforce' => 'Enforce'];
    $settings->add(new admin_setting_configselect(
        'local_prequran/teacher_reconcile_mode',
        'Teacher enrolment reconcile',
        'Nightly diff of expected vs actual teacher enrolments on offering-linked courses (fixes one-way drift: removed teacher↔student assignments never unenrolled the teacher). Start with Report and read the task log before enforcing.',
        '',
        $reconcilemodes
    ));

    $settings->add(new admin_setting_configselect(
        'local_prequran/parent_observer_mode',
        'Parent observer role sync',
        'Nightly assignment of the ehel_parent role in each student\'s user context for every guardian↔student consent pair (the native Moodle equivalent of Canvas observers). Start with Report.',
        '',
        $reconcilemodes
    ));

    $settings->add(new admin_setting_configselect(
        'local_prequran/finance_hold_suspend_mode',
        'Finance-hold enrolment suspension',
        'Nightly: students with an ACTIVE finance hold (policy actions below) get their course enrolments SUSPENDED — roster row and grades kept, access closed (Canvas "inactive"). Cleared holds auto-restore only suspensions this task applied. Start with Report.',
        '',
        $reconcilemodes
    ));

    $settings->add(new admin_setting_configtext(
        'local_prequran/finance_hold_suspend_policyactions',
        'Hold policy actions that suspend access',
        'Comma-separated finance-hold policyaction values that should suspend course access (e.g. suspend_access,blocker). Holds with other policy actions (warning_only, certificate blocks) never touch enrolment.',
        'suspend_access',
        PARAM_RAW_TRIMMED
    ));

    $settings->add(new admin_setting_configselect(
        'local_prequran/enrol_conclude_mode',
        'Term-end enrolment conclude',
        'Nightly: enrolled requests whose offering end date passed (plus grace) are concluded — Moodle enrolment suspended (grades and roster kept, access closed) and the request marked completed. The Canvas end-of-term pattern. Start with Report.',
        '',
        $reconcilemodes
    ));

    $settings->add(new admin_setting_configtext(
        'local_prequran/enrol_conclude_grace',
        'Conclude grace period (days)',
        'Days after the offering end date before an enrolment is concluded.',
        '7',
        PARAM_INT
    ));

    $settings->add(new admin_setting_configcheckbox(
        'local_prequran/teacher_require_vetting_for_assignment',
        'Require approved vetting for student assignment',
        'When on, a teacher must have vetting_status = approved before they can be assigned a student (workspace-people and teacher-administration). Teachers with REJECTED vetting are always blocked regardless of this setting.',
        0
    ));

    $settings->add(new admin_setting_configselect(
        'local_prequran/teacher_vetting_mode',
        'Teacher vetting expiry sweep',
        'Nightly: approved vettings older than the window below flip back to needs_update so they resurface in the review queue (periodic re-vetting). Also reports marketplace-published teachers whose vetting lapsed. Start with Report.',
        '',
        $reconcilemodes
    ));

    $settings->add(new admin_setting_configtext(
        'local_prequran/teacher_vetting_expiry_days',
        'Vetting validity window (days)',
        'How long an approved vetting stays valid before re-review is required.',
        '365',
        PARAM_INT
    ));

    $settings->add(new admin_setting_configtext(
        'local_prequran/qa_learner_rating_weight',
        'Learner rating weight in QA blend (%)',
        'How much the learner star-rating average (as a percentage) counts in the blended teacher score on Quality Analytics. 0 = QA checklist only; 100 = ratings only. Default 30.',
        '30',
        PARAM_INT
    ));

    $settings->add(new admin_setting_configselect(
        'local_prequran/student_risk_mode',
        'Student at-risk scan',
        'Nightly early-warning scan of active students: login inactivity, unexcused absences (30d), missing homework. Enforce writes at_risk_flagged audit rows (visible in the at-risk report history), deduped weekly. Start with Report.',
        '',
        $reconcilemodes
    ));

    $settings->add(new admin_setting_configselect(
        'local_prequran/homework_reminder_mode',
        'Homework due/missed reminders',
        'Nightly: homework due within 24h → reminder to the student and linked parents; homework newly overdue (48h window) → missed notice. Deduped per submission; parents with revoked links are excluded. Start with Report.',
        '',
        $reconcilemodes
    ));

    $settings->add(new admin_setting_configtext(
        'local_prequran/risk_inactive_days',
        'At-risk: inactivity threshold (days)',
        'Flag students who have not logged in for this many days.',
        '14',
        PARAM_INT
    ));

    $settings->add(new admin_setting_configtext(
        'local_prequran/risk_absence_count',
        'At-risk: absence threshold (30 days)',
        'Flag students with at least this many recorded absences in the last 30 days.',
        '3',
        PARAM_INT
    ));

    $settings->add(new admin_setting_configtext(
        'local_prequran/risk_missing_homework',
        'At-risk: missing homework threshold',
        'Flag students with at least this many past-due unsubmitted homework items.',
        '3',
        PARAM_INT
    ));

    $settings->add(new admin_setting_configtext(
        'local_prequran/risk_grade_decline',
        'At-risk: grade-decline threshold (points)',
        'Flag a student when their latest published course grade drops by at least this many points versus their previous published grade in the same course. 0 disables the grade-decline signal.',
        '0',
        PARAM_INT
    ));

    $settings->add(new admin_setting_configtext(
        'local_prequran/risk_grade_low',
        'At-risk: low-grade threshold (percent)',
        'Flag a student whose latest published course grade is below this percent. 0 disables the low-grade signal.',
        '0',
        PARAM_INT
    ));

    $settings->add(new admin_setting_configselect(
        'local_prequran/parent_digest_mode',
        'Weekly parent digest',
        'Once a week, linked parents receive a per-child snapshot: upcoming live classes, attendance, homework due/overdue, new teacher notes. Honors revoked links and the parent_email_enabled opt-out. Start with Report.',
        '',
        $reconcilemodes
    ));

    $settings->add(new admin_setting_configtext(
        'local_prequran/parent_digest_day',
        'Parent digest day (1=Mon … 7=Sun)',
        'ISO weekday on which the weekly parent digest goes out.',
        '1',
        PARAM_INT
    ));

    $settings->add(new admin_setting_configselect(
        'local_prequran/admin_review_mode',
        'Privileged-access review',
        'Nightly governance sweep: siteadmins/school_principals with no active workspace membership (offboarded-but-still-privileged), suspended accounts holding manager roles, and failing scheduled tasks. Never revokes anything itself — flags for human review. Start with Report.',
        '',
        $reconcilemodes
    ));

    $settings->add(new admin_setting_configselect(
        'local_prequran/classroom_hygiene_mode',
        'Classroom hygiene sweep',
        'Nightly: no-show sessions (never started, stuck in scheduled) moved to review, stale awaiting-review sessions re-flagged weekly, zero-attendance ended sessions flagged, late starts and short-notice cancels reported, grading-SLA reminders sent to teachers. Start with Report.',
        '',
        $reconcilemodes
    ));

    $settings->add(new admin_setting_configtext(
        'local_prequran/grading_sla_days',
        'Homework grading SLA (days)',
        'Submissions sitting in "Awaiting review" longer than this trigger a teacher reminder (classroom hygiene sweep, deduped every 3 days).',
        '3',
        PARAM_INT
    ));

    $settings->add(new admin_setting_configtext(
        'local_prequran/session_cancel_notice_hours',
        'Session cancellation notice window (hours)',
        'Cancelling or rescheduling a session closer to its start than this is recorded as a SHORT-NOTICE change (audited per teacher; reported by the hygiene sweep). Changes are never blocked — emergencies happen.',
        '24',
        PARAM_INT
    ));

    $settings->add(new admin_setting_configselect(
        'local_prequran/finance_dunning_mode',
        'Finance dunning (invoice reminders)',
        'Nightly: due-soon and overdue invoice notices to families (existing templates + secure links), stale payment-plan recalcs, abandoned checkout-session expiry, and hold-candidate reporting. Start with Report.',
        '',
        $reconcilemodes
    ));

    $settings->add(new admin_setting_configtext(
        'local_prequran/dunning_due_soon_days',
        'Due-soon reminder window (days)',
        'Families are reminded when an unpaid invoice is due within this many days (once per invoice).',
        '3',
        PARAM_INT
    ));

    $settings->add(new admin_setting_configtext(
        'local_prequran/dunning_overdue_repeat_days',
        'Overdue reminder repeat (days)',
        'Overdue invoice notices repeat at this interval while a balance remains.',
        '7',
        PARAM_INT
    ));

    $settings->add(new admin_setting_configselect(
        'local_prequran/identity_offboard_mode',
        'Identity offboard mode',
        'Off: offboarding leaves the Moodle account loginable (legacy). Report: offboarding audits account-suspension candidates and the nightly reconcile lists active memberships held by suspended/deleted accounts. Enforce: offboarding SUSPENDS the account when the person has no active presence elsewhere (sessions killed, portal tokens revoked), and the reconcile deactivates dead-account memberships. Platform-privileged accounts are never touched.',
        '',
        $reconcilemodes
    ));

    $settings->add(new admin_setting_configtext(
        'local_prequran/gradebook_uncategorized_weight',
        'Uncategorized grade weight',
        'Weight (percent) applied to homework and any grade whose assessment has no category, folded into the weighted course grade. Default 100 makes homework count; set 0 to exclude uncategorized grades (legacy behaviour). Named categories keep their own configured weights.',
        '100',
        PARAM_RAW_TRIMMED
    ));

    $settings->add(new admin_setting_configselect(
        'local_prequran/achievement_notify_mode',
        'Achievement notifications',
        'Off: publishing a course grade or issuing a certificate sends nothing (legacy). Enforce: the student and their consented parents are notified of the milestone. Best-effort; never blocks the write.',
        '',
        ['' => 'Off', 'enforce' => 'Notify student + parents']
    ));

    $settings->add(new admin_setting_configselect(
        'local_prequran/course_seb_launch_mode',
        'Launch enrolled courses in Safe Exam Browser',
        'Enabled: starting a course you are enrolled in hands over a .seb config, so the course opens inside Safe Exam Browser instead of a normal tab. '
        . 'Off: courses open directly in the browser (legacy). '
        . 'NOTE: SEB must be installed on the device and there is no Android build — with this enabled, learners on Android phones/tablets cannot open a course at all. '
        . 'The allow-list already covers the consumer host and the CDN that serves the app.',
        'enabled',
        ['' => 'Off (open in browser)', 'enabled' => 'Enabled (open in SEB)']
    ));

    $settings->add(new admin_setting_configtext(
        'local_prequran/course_seb_quit_password',
        'Course SEB quit password',
        'Leave BLANK (default) so learners can quit Safe Exam Browser freely — a course is a lesson, not an exam. '
        . 'Set a password only if you deliberately want to stop learners leaving mid-lesson. Exams are unaffected: they keep their own per-exam quit password.',
        '',
        PARAM_RAW_TRIMMED
    ));

    $settings->add(new admin_setting_configselect(
        'local_prequran/live_seb_launch_mode',
        'Launch live classes in Safe Exam Browser',
        'Enabled: joining a scheduled live class hands the room to Safe Exam Browser instead of opening it in the ordinary browser. '
        . 'Applies to learners only — teachers and observers keep the normal browser join. '
        . 'The live-class config never carries a quit password: a learner must always be able to leave a class. '
        . 'Same device caveat as courses: SEB must be installed and there is no Android build.',
        '',
        ['' => 'Off (join in browser)', 'enabled' => 'Enabled (join in SEB)']
    ));

    $settings->add(new admin_setting_configselect(
        'local_prequran/course_seb_lock_mode',
        'Conditional exit lock for course SEB sessions',
        'Enabled: the learner CANNOT quit Safe Exam Browser manually during a lesson. They are released automatically on whichever comes first — the learning-time target, no outstanding homework, or the hard cap. '
        . 'Requires a quit password to be set (staff can always release with it). '
        . 'SAFETY: do not enable until the lesson app can reach the release endpoint, or a learner will have no exit path at all. '
        . 'This locks children into a kiosk browser — review your safeguarding position before switching it on.',
        '',
        ['' => 'Off (learner may quit freely)', 'enabled' => 'Enabled (conditional exit)']
    ));

    $settings->add(new admin_setting_configtext(
        'local_prequran/course_seb_learn_minutes',
        'Learning minutes that earn release',
        'Minutes of lesson time after which the learner may exit. Default 120, capped at 480.',
        '120',
        PARAM_INT
    ));

    $settings->add(new admin_setting_configtext(
        'local_prequran/course_seb_max_minutes',
        'Hard cap — always release after (minutes)',
        'The safety net: release ALWAYS happens by this point regardless of the condition, so a failed check cannot strand a learner. Default 180. Never lower than the learning target.',
        '180',
        PARAM_INT
    ));


    $settings->add(new admin_setting_configtext(
        'local_prequran/seb_proctor_retention_days',
        'Proctor snapshot retention (days)',
        'How long webcam snapshot frames from proctored exams are kept before the nightly data-retention task deletes them. Clamped to 1–90; default 30. These are children-adjacent biometric frames — keep this as short as your review workflow allows.',
        '30',
        PARAM_INT
    ));

    $settings->add(new admin_setting_configtext(
        'local_prequran/audit_retention_days',
        'Operational audit retention (days)',
        'When greater than 0, the nightly data-retention task trims operational course-audit rows older than this many days. 0 keeps them forever. Financial, grade, safeguarding and governance audit trails are never trimmed by this setting.',
        '0',
        PARAM_INT
    ));

    $settings->add(new admin_setting_configpasswordunmask(
        'local_prequran/intake_form_secret',
        'Public-intake form secret',
        'Dedicated HMAC key for the public intake anti-abuse form tokens. Set this so rotating the launch-token signing key does not affect intake, and vice versa. Leave blank to keep sharing the launch secret (legacy behaviour).',
        ''
    ));

    $settings->add(new admin_setting_configpasswordunmask(
        'local_prequran/finance_payment_webhook_secret_global',
        'Global payment webhook secret',
        'Secret used to verify payment webhooks that carry no resolvable checkout session. Without it, session-less webhooks fail verification (the safe default) — a caller can no longer have the payload choose which workspace secret validates it.',
        ''
    ));

    $settings->add(new admin_setting_configtext(
        'local_prequran/marketplace_commission_percent',
        'Marketplace commission percent',
        'Default platform commission percentage applied to a tutor marketplace payout when no explicit fee is entered. A per-tutor override (teacher profile) takes precedence. 0 = no automatic commission (fees stay manual).',
        '0',
        PARAM_RAW_TRIMMED
    ));

    $settings->add(new admin_setting_configtext(
        'local_prequran/workspace_material_maxbytes',
        'Workspace material upload size limit (bytes)',
        'Maximum size for a teacher-uploaded workspace material. Default 52428800 (50 MB). Uploads are also restricted to a documents/media file-type allow-list.',
        '52428800',
        PARAM_INT
    ));

    $settings->add(new admin_setting_configselect(
        'local_prequran/marketplace_review_moderation_mode',
        'Marketplace review moderation',
        'Auto: written tutor reviews publish immediately (star-only ratings always do). Manual: a written review starts pending and only appears on the public tutor profile after a manager approves it.',
        'auto',
        ['auto' => 'Auto-publish written reviews', 'manual' => 'Require approval before publishing']
    ));

    $settings->add(new admin_setting_configselect(
        'local_prequran/grade_moderation_mode',
        'Grade moderation mode',
        'Off: a grade can be published by the marker alone (legacy — the "reviewed" status is the same teacher self-attesting). Require: each counting grade must be signed off by an INDEPENDENT second marker before the course grade can be published.',
        '',
        ['' => 'Off (single marker)', 'require' => 'Require independent moderation']
    ));

    $settings->add(new admin_setting_configselect(
        'local_prequran/analytics_snapshot_mode',
        'Analytics snapshot mode',
        'Off: dashboards recompute live only; no history is captured. Enabled: a nightly per-workspace snapshot (grade distribution, pass rate, attendance, completion) is stored so metrics can be trended over time.',
        '',
        ['' => 'Off', 'enabled' => 'Capture nightly snapshots']
    ));

    $settings->add(new admin_setting_configselect(
        'local_prequran/completion_award_mode',
        'Completion-award scan mode',
        'Off: no automatic certificate candidates. Report: the nightly scan logs students with a published passing course grade but no certificate. Enforce: the scan creates DRAFT award candidates for registrar review (never auto-issued).',
        '',
        $reconcilemodes
    ));

    $settings->add(new admin_setting_configtext(
        'local_prequran/completion_award_pass_percent',
        'Completion-award pass percent',
        'Minimum published course grade percent that makes a student a completion-certificate candidate.',
        '60',
        PARAM_RAW_TRIMMED
    ));

    $settings->add(new admin_setting_configselect(
        'local_prequran/parent_link_confirm_mode',
        'Guardian link mode',
        'Off: admin-created parent links activate instantly (legacy). Notify: links activate instantly and the parent is notified a link was made in their name. Confirm: links start PENDING (no visibility, no consents) until the parent confirms on the Student & Parent Portal.',
        '',
        ['' => 'Instant (no notification)', 'notify' => 'Instant + notify the parent', 'confirm' => 'Pending until the parent confirms']
    ));

    $settings->add(new admin_setting_configtext(
        'local_prequran/platform_fee_percent',
        'Platform fee percent (settlement default)',
        'Default platform fee percentage applied when generating EduPlatform settlement statements for consumer schools. 0 keeps statements informational (no fee). Editable per statement while draft.',
        '0',
        PARAM_RAW_TRIMMED
    ));

    $settings->add(new admin_setting_configtextarea(
        'local_prequran/progress_allowed_origins',
        'Progress gateway allowed origins',
        'Origins (one per line) permitted to call the progress gateway from the browser. Blank = the Ehel CDN + app.ehelacademy.org defaults. The launch-token signing secret auto-generates into progress_launch_secret; blank that config to rotate it.',
        '',
        PARAM_RAW_TRIMMED
    ));

    $ADMIN->add('localplugins', $settings);
}
