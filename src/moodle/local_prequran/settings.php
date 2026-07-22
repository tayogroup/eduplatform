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

    $settings->add(new admin_setting_configtext(
        'local_prequran/catalog_source_url',
        'Ehel catalog URL',
        'catalog.json that the catalog-sync task reads to create categories, courses (by idnumber) and grade items. Leave blank to disable the task.',
        'https://ehelacademy.b-cdn.net/Ehel%20Primary/catalog.json',
        PARAM_URL
    ));

    $settings->add(new admin_setting_configtext(
        'local_prequran/cohorts_source_url',
        'Ehel cohorts URL',
        'cohorts.json that the cohort-sync task reads to enrol pilot learners into the synced courses. Leave blank to disable the task.',
        'https://ehelacademy.b-cdn.net/Ehel%20Primary/cohorts.json',
        PARAM_URL
    ));

    $ADMIN->add('localplugins', $settings);
}
