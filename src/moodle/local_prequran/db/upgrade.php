<?php
declare(strict_types=1);

defined('MOODLE_INTERNAL') || die();

function xmldb_local_prequran_upgrade($oldversion): bool {
    global $CFG;

    require_once($CFG->dirroot . '/local/prequran/db/upgradelib.php');

    if ($oldversion < 2026051201) {
        xmldb_local_prequran_ensure_live_schema();
        upgrade_plugin_savepoint(true, 2026051201, 'local', 'prequran');
    }

    if ($oldversion < 2026051301) {
        xmldb_local_prequran_ensure_grouping_schema();
        upgrade_plugin_savepoint(true, 2026051301, 'local', 'prequran');
    }

    if ($oldversion < 2026051302) {
        xmldb_local_prequran_ensure_grouping_schema();
        upgrade_plugin_savepoint(true, 2026051302, 'local', 'prequran');
    }

    if ($oldversion < 2026051303) {
        xmldb_local_prequran_ensure_grouping_schema();
        xmldb_local_prequran_ensure_intake_request_schema();
        upgrade_plugin_savepoint(true, 2026051303, 'local', 'prequran');
    }

    if ($oldversion < 2026052101) {
        upgrade_plugin_savepoint(true, 2026052101, 'local', 'prequran');
    }

    if ($oldversion < 2026052102) {
        xmldb_local_prequran_ensure_environment_schema();
        upgrade_plugin_savepoint(true, 2026052102, 'local', 'prequran');
    }

    if ($oldversion < 202605240003) {
        xmldb_local_prequran_ensure_live_schema();
        xmldb_local_prequran_ensure_grouping_schema();
        xmldb_local_prequran_ensure_intake_request_schema();
        upgrade_plugin_savepoint(true, 202605240003, 'local', 'prequran');
    }

    if ($oldversion < 2026061101) {
        xmldb_local_prequran_ensure_live_focus_schema();
        upgrade_plugin_savepoint(true, 2026061101, 'local', 'prequran');
    }

    if ($oldversion < 202606120002) {
        xmldb_local_prequran_ensure_quiz_schema();
        upgrade_plugin_savepoint(true, 202606120002, 'local', 'prequran');
    }

    if ($oldversion < 202606120003) {
        xmldb_local_prequran_ensure_quiz_schema();
        upgrade_plugin_savepoint(true, 202606120003, 'local', 'prequran');
    }

    if ($oldversion < 202606160001) {
        xmldb_local_prequran_ensure_grouping_schema();
        upgrade_plugin_savepoint(true, 202606160001, 'local', 'prequran');
    }

    if ($oldversion < 202606160002) {
        xmldb_local_prequran_ensure_live_schema();
        upgrade_plugin_savepoint(true, 202606160002, 'local', 'prequran');
    }

    if ($oldversion < 202606170001) {
        xmldb_local_prequran_ensure_practice_coach_schema();
        upgrade_plugin_savepoint(true, 202606170001, 'local', 'prequran');
    }

    if ($oldversion < 202606170002) {
        xmldb_local_prequran_ensure_practice_coach_schema();
        upgrade_plugin_savepoint(true, 202606170002, 'local', 'prequran');
    }

    if ($oldversion < 202606200001) {
        xmldb_local_prequran_ensure_school_principal_role();
        upgrade_plugin_savepoint(true, 202606200001, 'local', 'prequran');
    }

    if ($oldversion < 202606200002) {
        xmldb_local_prequran_ensure_referral_schema();
        upgrade_plugin_savepoint(true, 202606200002, 'local', 'prequran');
    }

    if ($oldversion < 202606200003) {
        xmldb_local_prequran_ensure_workspace_schema();
        upgrade_plugin_savepoint(true, 202606200003, 'local', 'prequran');
    }

    if ($oldversion < 202606200004) {
        xmldb_local_prequran_ensure_workspace_schema();
        upgrade_plugin_savepoint(true, 202606200004, 'local', 'prequran');
    }

    if ($oldversion < 202606200005) {
        xmldb_local_prequran_ensure_workspace_schema();
        upgrade_plugin_savepoint(true, 202606200005, 'local', 'prequran');
    }

    if ($oldversion < 202606200006) {
        xmldb_local_prequran_ensure_workspace_schema();
        upgrade_plugin_savepoint(true, 202606200006, 'local', 'prequran');
    }

    if ($oldversion < 202606210001) {
        upgrade_plugin_savepoint(true, 202606210001, 'local', 'prequran');
    }

    if ($oldversion < 202606210002) {
        upgrade_plugin_savepoint(true, 202606210002, 'local', 'prequran');
    }

    if ($oldversion < 202606210003) {
        xmldb_local_prequran_ensure_teacher_marketplace_schema();
        upgrade_plugin_savepoint(true, 202606210003, 'local', 'prequran');
    }

    if ($oldversion < 202606250001) {
        xmldb_local_prequran_ensure_live_agenda_slide_schema();
        upgrade_plugin_savepoint(true, 202606250001, 'local', 'prequran');
    }

    if ($oldversion < 202606270001) {
        xmldb_local_prequran_ensure_virtual_tutor_schema();
        upgrade_plugin_savepoint(true, 202606270001, 'local', 'prequran');
    }

    if ($oldversion < 202606270002) {
        xmldb_local_prequran_ensure_sqa_tester_role();
        upgrade_plugin_savepoint(true, 202606270002, 'local', 'prequran');
    }

    if ($oldversion < 202606280001) {
        xmldb_local_prequran_ensure_grouping_schema();
        xmldb_local_prequran_ensure_intake_request_schema();
        upgrade_plugin_savepoint(true, 202606280001, 'local', 'prequran');
    }

    if ($oldversion < 202606290001) {
        xmldb_local_prequran_ensure_workspace_schema();
        xmldb_local_prequran_ensure_consumer_schema();
        upgrade_plugin_savepoint(true, 202606290001, 'local', 'prequran');
    }

    if ($oldversion < 202606290002) {
        xmldb_local_prequran_ensure_workspace_schema();
        xmldb_local_prequran_ensure_consumer_schema();
        upgrade_plugin_savepoint(true, 202606290002, 'local', 'prequran');
    }

    if ($oldversion < 202606290003) {
        xmldb_local_prequran_ensure_workspace_schema();
        xmldb_local_prequran_ensure_consumer_schema();
        upgrade_plugin_savepoint(true, 202606290003, 'local', 'prequran');
    }

    if ($oldversion < 202606290004) {
        xmldb_local_prequran_ensure_workspace_schema();
        xmldb_local_prequran_ensure_consumer_schema();
        upgrade_plugin_savepoint(true, 202606290004, 'local', 'prequran');
    }

    if ($oldversion < 202606290005) {
        xmldb_local_prequran_ensure_workspace_schema();
        xmldb_local_prequran_ensure_consumer_schema();
        xmldb_local_prequran_ensure_intake_request_schema();
        xmldb_local_prequran_ensure_teacher_marketplace_schema();
        xmldb_local_prequran_ensure_consumer_scope_schema();
        upgrade_plugin_savepoint(true, 202606290005, 'local', 'prequran');
    }

    if ($oldversion < 202606290006) {
        xmldb_local_prequran_ensure_workspace_schema();
        xmldb_local_prequran_ensure_consumer_schema();
        xmldb_local_prequran_ensure_teacher_intake_request_schema();
        upgrade_plugin_savepoint(true, 202606290006, 'local', 'prequran');
    }

    if ($oldversion < 202606290007) {
        xmldb_local_prequran_ensure_workspace_schema();
        xmldb_local_prequran_ensure_consumer_schema();
        xmldb_local_prequran_ensure_teacher_intake_request_schema();
        upgrade_plugin_savepoint(true, 202606290007, 'local', 'prequran');
    }

    if ($oldversion < 202607010001) {
        xmldb_local_prequran_ensure_workspace_schema();
        xmldb_local_prequran_ensure_consumer_schema();
        xmldb_local_prequran_ensure_consumer_scope_schema();
        upgrade_plugin_savepoint(true, 202607010001, 'local', 'prequran');
    }

    if ($oldversion < 202607010002) {
        xmldb_local_prequran_ensure_consumer_schema();
        upgrade_plugin_savepoint(true, 202607010002, 'local', 'prequran');
    }

    if ($oldversion < 202607020001) {
        xmldb_local_prequran_ensure_workspace_schema();
        xmldb_local_prequran_ensure_consumer_schema();
        xmldb_local_prequran_ensure_grouping_schema();
        xmldb_local_prequran_ensure_course_offering_schema();
        upgrade_plugin_savepoint(true, 202607020001, 'local', 'prequran');
    }

    if ($oldversion < 202607020003) {
        xmldb_local_prequran_ensure_course_offering_schema();
        upgrade_plugin_savepoint(true, 202607020003, 'local', 'prequran');
    }

    if ($oldversion < 202607030003) {
        xmldb_local_prequran_ensure_transcript_policy_schema();
        upgrade_plugin_savepoint(true, 202607030003, 'local', 'prequran');
    }

    if ($oldversion < 202607030004) {
        xmldb_local_prequran_ensure_transcript_document_schema();
        upgrade_plugin_savepoint(true, 202607030004, 'local', 'prequran');
    }

    if ($oldversion < 202607030005) {
        xmldb_local_prequran_ensure_transcript_document_schema();
        upgrade_plugin_savepoint(true, 202607030005, 'local', 'prequran');
    }

    if ($oldversion < 202607030006) {
        xmldb_local_prequran_ensure_transcript_document_schema();
        upgrade_plugin_savepoint(true, 202607030006, 'local', 'prequran');
    }

    if ($oldversion < 202607030008) {
        upgrade_plugin_savepoint(true, 202607030008, 'local', 'prequran');
    }

    if ($oldversion < 202607030009) {
        xmldb_local_prequran_ensure_transcript_document_schema();
        upgrade_plugin_savepoint(true, 202607030009, 'local', 'prequran');
    }

    if ($oldversion < 202607030010) {
        xmldb_local_prequran_ensure_student_finance_schema();
        upgrade_plugin_savepoint(true, 202607030010, 'local', 'prequran');
    }

    if ($oldversion < 202607030011) {
        xmldb_local_prequran_ensure_student_finance_schema();
        xmldb_local_prequran_ensure_finance_policy_schema();
        upgrade_plugin_savepoint(true, 202607030011, 'local', 'prequran');
    }

    if ($oldversion < 202607030012) {
        xmldb_local_prequran_ensure_student_finance_schema();
        xmldb_local_prequran_ensure_finance_policy_schema();
        xmldb_local_prequran_ensure_invoice_schema();
        upgrade_plugin_savepoint(true, 202607030012, 'local', 'prequran');
    }

    if ($oldversion < 202607030013) {
        xmldb_local_prequran_ensure_course_offering_schema();
        xmldb_local_prequran_ensure_student_finance_schema();
        xmldb_local_prequran_ensure_finance_policy_schema();
        xmldb_local_prequran_ensure_invoice_schema();
        upgrade_plugin_savepoint(true, 202607030013, 'local', 'prequran');
    }

    if ($oldversion < 202607030014) {
        xmldb_local_prequran_ensure_course_offering_schema();
        upgrade_plugin_savepoint(true, 202607030014, 'local', 'prequran');
    }

    if ($oldversion < 202607030015) {
        xmldb_local_prequran_ensure_invoice_schema();
        xmldb_local_prequran_ensure_payment_schema();
        upgrade_plugin_savepoint(true, 202607030015, 'local', 'prequran');
    }

    if ($oldversion < 202607030016) {
        xmldb_local_prequran_ensure_invoice_schema();
        xmldb_local_prequran_ensure_payment_schema();
        xmldb_local_prequran_ensure_finance_correction_schema();
        upgrade_plugin_savepoint(true, 202607030016, 'local', 'prequran');
    }

    if ($oldversion < 202607030017) {
        xmldb_local_prequran_ensure_invoice_schema();
        xmldb_local_prequran_ensure_payment_schema();
        xmldb_local_prequran_ensure_finance_correction_schema();
        xmldb_local_prequran_ensure_finance_hold_schema();
        upgrade_plugin_savepoint(true, 202607030017, 'local', 'prequran');
    }

    if ($oldversion < 202607030018) {
        xmldb_local_prequran_ensure_invoice_schema();
        xmldb_local_prequran_ensure_payment_schema();
        xmldb_local_prequran_ensure_finance_correction_schema();
        xmldb_local_prequran_ensure_finance_hold_schema();
        upgrade_plugin_savepoint(true, 202607030018, 'local', 'prequran');
    }

    if ($oldversion < 202607030019) {
        xmldb_local_prequran_ensure_invoice_schema();
        xmldb_local_prequran_ensure_payment_schema();
        xmldb_local_prequran_ensure_finance_correction_schema();
        xmldb_local_prequran_ensure_finance_hold_schema();
        xmldb_local_prequran_ensure_finance_notification_schema();
        upgrade_plugin_savepoint(true, 202607030019, 'local', 'prequran');
    }

    if ($oldversion < 202607030020) {
        xmldb_local_prequran_ensure_invoice_schema();
        xmldb_local_prequran_ensure_payment_schema();
        xmldb_local_prequran_ensure_finance_correction_schema();
        xmldb_local_prequran_ensure_finance_hold_schema();
        xmldb_local_prequran_ensure_finance_notification_schema();
        xmldb_local_prequran_ensure_payment_gateway_schema();
        upgrade_plugin_savepoint(true, 202607030020, 'local', 'prequran');
    }

    if ($oldversion < 202607030021) {
        xmldb_local_prequran_ensure_invoice_schema();
        xmldb_local_prequran_ensure_payment_schema();
        xmldb_local_prequran_ensure_finance_correction_schema();
        xmldb_local_prequran_ensure_finance_hold_schema();
        xmldb_local_prequran_ensure_finance_notification_schema();
        xmldb_local_prequran_ensure_payment_gateway_schema();
        xmldb_local_prequran_ensure_payment_plan_schema();
        upgrade_plugin_savepoint(true, 202607030021, 'local', 'prequran');
    }

    if ($oldversion < 202607030022) {
        xmldb_local_prequran_ensure_invoice_schema();
        xmldb_local_prequran_ensure_payment_schema();
        xmldb_local_prequran_ensure_finance_correction_schema();
        xmldb_local_prequran_ensure_finance_hold_schema();
        xmldb_local_prequran_ensure_finance_notification_schema();
        xmldb_local_prequran_ensure_payment_gateway_schema();
        xmldb_local_prequran_ensure_payment_plan_schema();
        xmldb_local_prequran_ensure_finance_assistance_schema();
        upgrade_plugin_savepoint(true, 202607030022, 'local', 'prequran');
    }

    if ($oldversion < 202607030023) {
        xmldb_local_prequran_ensure_invoice_schema();
        xmldb_local_prequran_ensure_payment_schema();
        xmldb_local_prequran_ensure_finance_correction_schema();
        xmldb_local_prequran_ensure_finance_hold_schema();
        xmldb_local_prequran_ensure_finance_notification_schema();
        xmldb_local_prequran_ensure_payment_gateway_schema();
        xmldb_local_prequran_ensure_payment_plan_schema();
        xmldb_local_prequran_ensure_finance_assistance_schema();
        xmldb_local_prequran_ensure_finance_api_schema();
        upgrade_plugin_savepoint(true, 202607030023, 'local', 'prequran');
    }

    if ($oldversion < 202607030024) {
        xmldb_local_prequran_ensure_invoice_schema();
        xmldb_local_prequran_ensure_payment_schema();
        xmldb_local_prequran_ensure_finance_correction_schema();
        xmldb_local_prequran_ensure_finance_hold_schema();
        xmldb_local_prequran_ensure_finance_notification_schema();
        xmldb_local_prequran_ensure_payment_gateway_schema();
        xmldb_local_prequran_ensure_payment_plan_schema();
        xmldb_local_prequran_ensure_finance_assistance_schema();
        xmldb_local_prequran_ensure_finance_api_schema();
        upgrade_plugin_savepoint(true, 202607030024, 'local', 'prequran');
    }

    if ($oldversion < 202607030025) {
        xmldb_local_prequran_ensure_admissions_schema();
        xmldb_local_prequran_ensure_academic_calendar_schema();
        xmldb_local_prequran_ensure_attendance_operations_schema();
        upgrade_plugin_savepoint(true, 202607030025, 'local', 'prequran');
    }

    if ($oldversion < 202607030026) {
        xmldb_local_prequran_ensure_gradebook_schema();
        xmldb_local_prequran_ensure_learning_path_schema();
        upgrade_plugin_savepoint(true, 202607030026, 'local', 'prequran');
    }

    if ($oldversion < 202607030027) {
        xmldb_local_prequran_ensure_operations_layer_schema();
        upgrade_plugin_savepoint(true, 202607030027, 'local', 'prequran');
    }

    if ($oldversion < 202607030028) {
        xmldb_local_prequran_ensure_admin_document_schema();
        upgrade_plugin_savepoint(true, 202607030028, 'local', 'prequran');
    }

    if ($oldversion < 202607030029) {
        xmldb_local_prequran_ensure_roles_portal_schema();
        upgrade_plugin_savepoint(true, 202607030029, 'local', 'prequran');
    }

    if ($oldversion < 202607030030) {
        xmldb_local_prequran_ensure_governance_analytics_schema();
        upgrade_plugin_savepoint(true, 202607030030, 'local', 'prequran');
    }

    if ($oldversion < 202607030031) {
        xmldb_local_prequran_ensure_certificates_placement_schema();
        upgrade_plugin_savepoint(true, 202607030031, 'local', 'prequran');
    }

    if ($oldversion < 202607030032) {
        xmldb_local_prequran_ensure_finance_assistance_schema();
        upgrade_plugin_savepoint(true, 202607030032, 'local', 'prequran');
    }

    if ($oldversion < 202607030033) {
        xmldb_local_prequran_ensure_mobile_localization_schema();
        upgrade_plugin_savepoint(true, 202607030033, 'local', 'prequran');
    }

    if ($oldversion < 202607030034) {
        xmldb_local_prequran_ensure_data_operations_schema();
        upgrade_plugin_savepoint(true, 202607030034, 'local', 'prequran');
    }

    if ($oldversion < 202607030035) {
        xmldb_local_prequran_ensure_support_schema();
        upgrade_plugin_savepoint(true, 202607030035, 'local', 'prequran');
    }

    if ($oldversion < 202607030036) {
        xmldb_local_prequran_ensure_support_schema();
        upgrade_plugin_savepoint(true, 202607030036, 'local', 'prequran');
    }

    if ($oldversion < 202607030037) {
        xmldb_local_prequran_ensure_support_schema();
        upgrade_plugin_savepoint(true, 202607030037, 'local', 'prequran');
    }

    if ($oldversion < 202607030038) {
        xmldb_local_prequran_ensure_support_schema();
        upgrade_plugin_savepoint(true, 202607030038, 'local', 'prequran');
    }

    if ($oldversion < 202607030039) {
        xmldb_local_prequran_ensure_support_schema();
        upgrade_plugin_savepoint(true, 202607030039, 'local', 'prequran');
    }

    if ($oldversion < 202607030040) {
        xmldb_local_prequran_ensure_support_schema();
        upgrade_plugin_savepoint(true, 202607030040, 'local', 'prequran');
    }

    if ($oldversion < 202607030041) {
        xmldb_local_prequran_ensure_support_schema();
        upgrade_plugin_savepoint(true, 202607030041, 'local', 'prequran');
    }

    if ($oldversion < 202607030042) {
        xmldb_local_prequran_ensure_sqa_tracker_schema();
        upgrade_plugin_savepoint(true, 202607030042, 'local', 'prequran');
    }

    if ($oldversion < 202607030043) {
        xmldb_local_prequran_ensure_organization_group_schema();
        upgrade_plugin_savepoint(true, 202607030043, 'local', 'prequran');
    }

    if ($oldversion < 202607030044) {
        xmldb_local_prequran_ensure_organization_group_schema();
        upgrade_plugin_savepoint(true, 202607030044, 'local', 'prequran');
    }

    if ($oldversion < 202607030045) {
        xmldb_local_prequran_repair_organization_group_schema();
        upgrade_plugin_savepoint(true, 202607030045, 'local', 'prequran');
    }

    if ($oldversion < 202607030046) {
        xmldb_local_prequran_seed_organization_operating_model();
        upgrade_plugin_savepoint(true, 202607030046, 'local', 'prequran');
    }

    if ($oldversion < 202607030047) {
        xmldb_local_prequran_ensure_institution_data_scoping_schema();
        upgrade_plugin_savepoint(true, 202607030047, 'local', 'prequran');
    }

    if ($oldversion < 202607030048) {
        xmldb_local_prequran_ensure_intake_guardian_contact_schema();
        upgrade_plugin_savepoint(true, 202607030048, 'local', 'prequran');
    }

    if ($oldversion < 202607030049) {
        xmldb_local_prequran_ensure_referrer_contact_schema();
        upgrade_plugin_savepoint(true, 202607030049, 'local', 'prequran');
    }

    if ($oldversion < 202607100001) {
        xmldb_local_prequran_repair_teacher_student_workspace_key();
        upgrade_plugin_savepoint(true, 202607100001, 'local', 'prequran');
    }

    if ($oldversion < 202607120001) {
        xmldb_local_prequran_ensure_consumer_schema();
        upgrade_plugin_savepoint(true, 202607120001, 'local', 'prequran');
    }

    if ($oldversion < 202607120002) {
        xmldb_local_prequran_ensure_primary_education_intake_schema();
        upgrade_plugin_savepoint(true, 202607120002, 'local', 'prequran');
    }

    if ($oldversion < 202607120003) {
        xmldb_local_prequran_ensure_consumer_classification_schema();
        upgrade_plugin_savepoint(true, 202607120003, 'local', 'prequran');
    }

    if ($oldversion < 202607120004) {
        xmldb_local_prequran_ensure_islamic_studies_intake_schema();
        upgrade_plugin_savepoint(true, 202607120004, 'local', 'prequran');
    }

    if ($oldversion < 202607120005) {
        xmldb_local_prequran_ensure_consumer_classification_schema();
        upgrade_plugin_savepoint(true, 202607120005, 'local', 'prequran');
    }

    if ($oldversion < 202607120006) {
        xmldb_local_prequran_ensure_christian_studies_intake_schema();
        upgrade_plugin_savepoint(true, 202607120006, 'local', 'prequran');
    }

    if ($oldversion < 202607120007) {
        xmldb_local_prequran_ensure_higher_education_intake_schema();
        upgrade_plugin_savepoint(true, 202607120007, 'local', 'prequran');
    }

    if ($oldversion < 202607120008) {
        xmldb_local_prequran_ensure_technical_training_intake_schema();
        upgrade_plugin_savepoint(true, 202607120008, 'local', 'prequran');
    }

    if ($oldversion < 202607120009) {
        xmldb_local_prequran_ensure_professional_development_intake_schema();
        upgrade_plugin_savepoint(true, 202607120009, 'local', 'prequran');
    }

    if ($oldversion < 202607120010) {
        xmldb_local_prequran_ensure_adult_learning_intake_schema();
        upgrade_plugin_savepoint(true, 202607120010, 'local', 'prequran');
    }

    if ($oldversion < 202607130001) {
        xmldb_local_prequran_ensure_homework_schema();
        upgrade_plugin_savepoint(true, 202607130001, 'local', 'prequran');
    }

    if ($oldversion < 202607130002) {
        xmldb_local_prequran_ensure_homework_schema();
        upgrade_plugin_savepoint(true, 202607130002, 'local', 'prequran');
    }

    if ($oldversion < 202607150001) {
        xmldb_local_prequran_ensure_consumer_website_schema();
        upgrade_plugin_savepoint(true, 202607150001, 'local', 'prequran');
    }

    if ($oldversion < 202607190001) {
        xmldb_local_prequran_ensure_safenet_schema();
        upgrade_plugin_savepoint(true, 202607190001, 'local', 'prequran');
    }

    if ($oldversion < 202607210001) {
        xmldb_local_prequran_ensure_safenet_schedule_fields();
        upgrade_plugin_savepoint(true, 202607210001, 'local', 'prequran');
    }

    return true;
}
