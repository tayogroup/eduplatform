<?php
declare(strict_types=1);

defined('MOODLE_INTERNAL') || die();

function xmldb_local_prequran_install(): void {
    global $CFG;

    require_once($CFG->dirroot . '/local/prequran/db/upgradelib.php');
    xmldb_local_prequran_ensure_school_principal_role();
    xmldb_local_prequran_ensure_sqa_tester_role();
    xmldb_local_prequran_ensure_live_schema();
    xmldb_local_prequran_ensure_workspace_schema();
    xmldb_local_prequran_ensure_consumer_schema();
    xmldb_local_prequran_ensure_consumer_website_schema();
    xmldb_local_prequran_ensure_organization_group_schema();
    xmldb_local_prequran_seed_organization_operating_model();
    xmldb_local_prequran_ensure_intake_request_schema();
    xmldb_local_prequran_ensure_intake_guardian_contact_schema();
    xmldb_local_prequran_ensure_teacher_marketplace_schema();
    xmldb_local_prequran_ensure_teacher_intake_request_schema();
    xmldb_local_prequran_ensure_institution_data_scoping_schema();
    xmldb_local_prequran_ensure_quiz_schema();
    xmldb_local_prequran_ensure_referral_schema();
    xmldb_local_prequran_ensure_referrer_contact_schema();
    xmldb_local_prequran_ensure_virtual_tutor_schema();
    xmldb_local_prequran_ensure_consumer_scope_schema();
    xmldb_local_prequran_ensure_course_offering_schema();
    xmldb_local_prequran_ensure_student_finance_schema();
    xmldb_local_prequran_ensure_finance_policy_schema();
    xmldb_local_prequran_ensure_invoice_schema();
    xmldb_local_prequran_ensure_payment_schema();
    xmldb_local_prequran_ensure_finance_correction_schema();
    xmldb_local_prequran_ensure_finance_hold_schema();
    xmldb_local_prequran_ensure_finance_notification_schema();
    xmldb_local_prequran_ensure_payment_gateway_schema();
    xmldb_local_prequran_ensure_payment_plan_schema();
    xmldb_local_prequran_ensure_finance_assistance_schema();
    xmldb_local_prequran_ensure_finance_api_schema();
    xmldb_local_prequran_ensure_transcript_policy_schema();
    xmldb_local_prequran_ensure_transcript_document_schema();
    xmldb_local_prequran_ensure_admissions_schema();
    xmldb_local_prequran_ensure_academic_calendar_schema();
    xmldb_local_prequran_ensure_attendance_operations_schema();
    xmldb_local_prequran_ensure_gradebook_schema();
    xmldb_local_prequran_ensure_homework_schema();
    xmldb_local_prequran_ensure_learning_path_schema();
    xmldb_local_prequran_ensure_operations_layer_schema();
    xmldb_local_prequran_ensure_admin_document_schema();
    xmldb_local_prequran_ensure_roles_portal_schema();
    xmldb_local_prequran_ensure_governance_analytics_schema();
    xmldb_local_prequran_ensure_certificates_placement_schema();
    xmldb_local_prequran_ensure_mobile_localization_schema();
    xmldb_local_prequran_ensure_data_operations_schema();
    xmldb_local_prequran_ensure_support_schema();
    xmldb_local_prequran_ensure_sqa_tracker_schema();
}
