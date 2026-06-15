<?php
defined('MOODLE_INTERNAL') || die();

if ($hassiteconfig) {
    $settings = new admin_settingpage('local_prequran', get_string('pluginname', 'local_prequran'));

    $settings->add(new admin_setting_heading(
        'local_prequran/environment_heading',
        'Pre-Quraan environments',
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
        'Base URL used by Moodle launch routes. Leave blank to use app.quraan.academy in production and the Moodle wwwroot on test, staging, integration, or QA hosts.',
        '',
        PARAM_URL
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
        'Redirect Pre-Quraan users from Moodle dashboard',
        'When enabled, students who reach /my/ are sent to the Pre-Quraan app launcher, while parents and teachers are sent to the Pre-Quraan dashboard. Site administrators and unknown accounts remain on Moodle.',
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
        'local_prequran/quiz_tts_heading',
        'Quiz chatbot voice',
        'Server-side ElevenLabs text-to-speech settings for child quiz chatbots. Keep the API key server-side only.'
    ));

    $settings->add(new admin_setting_configpasswordunmask(
        'local_prequran/elevenlabs_api_key',
        'ElevenLabs API key',
        'API key used by the Moodle server-side quiz voice proxy. Never place this key in Bunny/static JavaScript.',
        ''
    ));

    $settings->add(new admin_setting_configtext(
        'local_prequran/quiz_tts_voice_id',
        'Quiz chatbot ElevenLabs voice ID',
        'Voice ID used for the child-friendly quiz chatbot voice.',
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

    $ADMIN->add('localplugins', $settings);
}
