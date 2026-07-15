-- Student grouping foundation for Quraan Academy live sessions.
-- Replace mdlgx_ with your Moodle database prefix if needed.

CREATE TABLE IF NOT EXISTS mdlgx_local_prequran_student_profile (
    id BIGINT(20) NOT NULL AUTO_INCREMENT,
    userid BIGINT(20) NOT NULL,
    student_display_name VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    student_middle_name VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    student_access_type VARCHAR(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'managed',
    date_of_birth VARCHAR(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    timezone VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'UTC',
    primary_language VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    preferred_teaching_language VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    language VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    age_years BIGINT(10) NOT NULL DEFAULT 0,
    age_band VARCHAR(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    current_grade VARCHAR(80) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    school_curriculum VARCHAR(120) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    current_school_name VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    student_lives_with VARCHAR(80) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    primary_learning_goal VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    medical_safety_notes LONGTEXT COLLATE utf8mb4_unicode_ci NULL,
    preferred_class_format VARCHAR(80) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    preferred_group_size VARCHAR(80) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    preferred_teacher_gender VARCHAR(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    school_term VARCHAR(80) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    islamic_program_interest VARCHAR(80) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    quran_reading_level VARCHAR(80) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    tajweed_level VARCHAR(80) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    memorization_status VARCHAR(80) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    memorized_portion VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    arabic_reading_ability VARCHAR(80) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    prior_islamic_studies LONGTEXT COLLATE utf8mb4_unicode_ci NULL,
    islamic_learning_goal VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    previous_learning_method VARCHAR(80) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    tafsir_level VARCHAR(80) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    islamic_notes LONGTEXT COLLATE utf8mb4_unicode_ci NULL,
    christian_program_interest VARCHAR(80) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    bible_reading_level VARCHAR(80) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    bible_knowledge_level VARCHAR(80) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    christian_studies_level VARCHAR(80) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    prior_christian_studies LONGTEXT COLLATE utf8mb4_unicode_ci NULL,
    christian_previous_learning_method VARCHAR(80) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    christian_learning_goal VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    christian_notes LONGTEXT COLLATE utf8mb4_unicode_ci NULL,
    higher_application_level VARCHAR(80) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    higher_program_field VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    higher_specialization VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    higher_highest_qualification VARCHAR(80) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    higher_previous_institution VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    higher_qualification_title VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    higher_completion_year VARCHAR(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    higher_academic_result VARCHAR(120) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    higher_academic_status VARCHAR(80) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    higher_admission_route VARCHAR(80) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    higher_transfer_credits VARCHAR(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    higher_study_mode VARCHAR(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    higher_study_load VARCHAR(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    higher_preferred_intake VARCHAR(120) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    higher_research_interest LONGTEXT COLLATE utf8mb4_unicode_ci NULL,
    higher_funding_method VARCHAR(80) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    higher_financial_aid_interest VARCHAR(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    higher_support_needs LONGTEXT COLLATE utf8mb4_unicode_ci NULL,
    technical_program VARCHAR(80) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    technical_specialization VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    technical_training_level VARCHAR(80) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    technical_previous_experience VARCHAR(80) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    technical_previous_learning_method VARCHAR(80) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    technical_experience_duration VARCHAR(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    technical_employment_status VARCHAR(80) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    technical_employer_workshop VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    technical_training_goal VARCHAR(80) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    technical_certification_sought VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    technical_training_format VARCHAR(80) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    technical_training_schedule VARCHAR(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    technical_tools_experience LONGTEXT COLLATE utf8mb4_unicode_ci NULL,
    technical_tool_access VARCHAR(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    technical_digital_skill_level VARCHAR(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    technical_safety_training VARCHAR(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    technical_protective_equipment VARCHAR(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    technical_support_needs LONGTEXT COLLATE utf8mb4_unicode_ci NULL,
    technical_notes LONGTEXT COLLATE utf8mb4_unicode_ci NULL,
    professional_area VARCHAR(80) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    professional_topic_skill VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    professional_current_role VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    professional_industry VARCHAR(80) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    professional_employment_status VARCHAR(80) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    professional_employer VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    professional_experience_years VARCHAR(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    professional_responsibility_level VARCHAR(80) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    professional_development_goal VARCHAR(80) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    professional_skill_level VARCHAR(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    professional_credential_sought VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    professional_certification_deadline VARCHAR(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    professional_learning_format VARCHAR(80) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    professional_learning_schedule VARCHAR(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    professional_course_intensity VARCHAR(80) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    professional_employer_sponsored VARCHAR(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    professional_cpd_required VARCHAR(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    professional_cpd_credits VARCHAR(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    professional_workplace_outcome LONGTEXT COLLATE utf8mb4_unicode_ci NULL,
    professional_support_needs LONGTEXT COLLATE utf8mb4_unicode_ci NULL,
    professional_notes LONGTEXT COLLATE utf8mb4_unicode_ci NULL,
    adult_learning_area VARCHAR(80) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    adult_subject_skill VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    adult_education_level VARCHAR(80) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    adult_literacy_level VARCHAR(80) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    adult_numeracy_level VARCHAR(80) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    adult_digital_skill_level VARCHAR(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    adult_previous_experience VARCHAR(80) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    adult_previous_learning_method VARCHAR(80) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    adult_learning_goal VARCHAR(80) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    adult_employment_status VARCHAR(80) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    adult_learning_format VARCHAR(80) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    adult_learning_pace VARCHAR(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    adult_class_arrangement VARCHAR(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    adult_childcare_impact VARCHAR(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    adult_work_impact VARCHAR(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    adult_access_limitations VARCHAR(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    adult_learning_confidence VARCHAR(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    adult_support_needs LONGTEXT COLLATE utf8mb4_unicode_ci NULL,
    adult_notes LONGTEXT COLLATE utf8mb4_unicode_ci NULL,
    current_level VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    tajweed_sub_level VARCHAR(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    learning_base VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    country VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    city VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    gender VARCHAR(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    special_needs VARCHAR(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'no',
    course_type VARCHAR(60) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pre_quraan',
    parent_name VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    parent_email VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    parent_phone VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    parent_email_enabled TINYINT(1) NOT NULL DEFAULT 1,
    live_class_consent TINYINT(1) NOT NULL DEFAULT 0,
    recording_consent TINYINT(1) NOT NULL DEFAULT 0,
    consent_notes LONGTEXT COLLATE utf8mb4_unicode_ci NULL,
    availability LONGTEXT COLLATE utf8mb4_unicode_ci NULL,
    parent_preferences LONGTEXT COLLATE utf8mb4_unicode_ci NULL,
    enrollment_approval_status VARCHAR(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'approved',
    enrollment_approvedby BIGINT(20) NOT NULL DEFAULT 0,
    enrollment_approvedat BIGINT(20) NOT NULL DEFAULT 0,
    enrollment_approval_notes LONGTEXT COLLATE utf8mb4_unicode_ci NULL,
    status VARCHAR(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
    createdby BIGINT(20) NOT NULL DEFAULT 0,
    timecreated BIGINT(20) NOT NULL DEFAULT 0,
    timemodified BIGINT(20) NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY mdlgx_preqstudprof_user_uix (userid),
    KEY mdlgx_preqstudprof_match_ix (status, course_type, timezone, language, current_level),
    KEY mdlgx_preqstudprof_parent_ix (parent_email),
    KEY mdlgx_preqstudprof_cons_ix (live_class_consent, recording_consent),
    KEY mdlgx_preqstudprof_enroll_ix (enrollment_approval_status, enrollment_approvedat),
    KEY mdlgx_preqstudprof_age_ix (age_band, gender),
    KEY mdlgx_preqstudprof_place_ix (country, city)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mdlgx_local_prequran_group_pool (
    id BIGINT(20) NOT NULL AUTO_INCREMENT,
    title VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    course_type VARCHAR(60) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pre_quraan',
    timezone VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'UTC',
    language VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    age_min BIGINT(10) NOT NULL DEFAULT 0,
    age_max BIGINT(10) NOT NULL DEFAULT 99,
    level_min VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    level_max VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    learning_base VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    country VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    city VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    gender_policy VARCHAR(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'flexible',
    schedule_preferences LONGTEXT COLLATE utf8mb4_unicode_ci NULL,
    rule_notes LONGTEXT COLLATE utf8mb4_unicode_ci NULL,
    max_students BIGINT(10) NOT NULL DEFAULT 9,
    status VARCHAR(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
    createdby BIGINT(20) NOT NULL DEFAULT 0,
    timecreated BIGINT(20) NOT NULL DEFAULT 0,
    timemodified BIGINT(20) NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY mdlgx_preqgrpool_match_ix (status, course_type, timezone, language, gender_policy),
    KEY mdlgx_preqgrpool_level_ix (learning_base, level_min, level_max)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mdlgx_local_prequran_class_group (
    id BIGINT(20) NOT NULL AUTO_INCREMENT,
    poolid BIGINT(20) NOT NULL DEFAULT 0,
    teacherid BIGINT(20) NOT NULL DEFAULT 0,
    title VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    course_type VARCHAR(60) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pre_quraan',
    timezone VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'UTC',
    language VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    current_level VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    learning_base VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    country VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    city VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    age_min BIGINT(10) NOT NULL DEFAULT 0,
    age_max BIGINT(10) NOT NULL DEFAULT 99,
    gender_policy VARCHAR(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'flexible',
    schedule_summary LONGTEXT COLLATE utf8mb4_unicode_ci NULL,
    max_students BIGINT(10) NOT NULL DEFAULT 9,
    status VARCHAR(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'open',
    createdby BIGINT(20) NOT NULL DEFAULT 0,
    timecreated BIGINT(20) NOT NULL DEFAULT 0,
    timemodified BIGINT(20) NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY mdlgx_preqclassgrp_pool_ix (poolid, status),
    KEY mdlgx_preqclassgrp_teacher_ix (teacherid, status),
    KEY mdlgx_preqclassgrp_match_ix (status, course_type, timezone, language, current_level),
    KEY mdlgx_preqclassgrp_place_ix (country, city)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mdlgx_local_prequran_group_member (
    id BIGINT(20) NOT NULL AUTO_INCREMENT,
    groupid BIGINT(20) NOT NULL DEFAULT 0,
    poolid BIGINT(20) NOT NULL DEFAULT 0,
    studentid BIGINT(20) NOT NULL DEFAULT 0,
    match_score BIGINT(10) NOT NULL DEFAULT 0,
    match_status VARCHAR(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'suggested',
    assignment_status VARCHAR(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
    match_details LONGTEXT COLLATE utf8mb4_unicode_ci NULL,
    assignedby BIGINT(20) NOT NULL DEFAULT 0,
    timecreated BIGINT(20) NOT NULL DEFAULT 0,
    timemodified BIGINT(20) NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY mdlgx_preqgrmem_uix (groupid, studentid),
    KEY mdlgx_preqgrmem_student_ix (studentid, assignment_status),
    KEY mdlgx_preqgrmem_pool_ix (poolid, match_status),
    KEY mdlgx_preqgrmem_score_ix (match_score, match_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET @sql = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE mdlgx_local_prequran_live_session ADD COLUMN groupid BIGINT(20) NOT NULL DEFAULT 0',
        'SELECT ''mdlgx_local_prequran_live_session.groupid already exists'' AS skipped'
    )
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'mdlgx_local_prequran_live_session'
      AND COLUMN_NAME = 'groupid'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE mdlgx_local_prequran_live_session ADD INDEX mdlgx_preqlive_sess_group_ix (groupid, scheduled_start)',
        'SELECT ''mdlgx_preqlive_sess_group_ix already exists'' AS skipped'
    )
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'mdlgx_local_prequran_live_session'
      AND INDEX_NAME = 'mdlgx_preqlive_sess_group_ix'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE mdlgx_local_prequran_live_series ADD COLUMN groupid BIGINT(20) NOT NULL DEFAULT 0',
        'SELECT ''mdlgx_local_prequran_live_series.groupid already exists'' AS skipped'
    )
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'mdlgx_local_prequran_live_series'
      AND COLUMN_NAME = 'groupid'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE mdlgx_local_prequran_live_series ADD INDEX mdlgx_preqlive_series_group_ix (groupid, date_start)',
        'SELECT ''mdlgx_preqlive_series_group_ix already exists'' AS skipped'
    )
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'mdlgx_local_prequran_live_series'
      AND INDEX_NAME = 'mdlgx_preqlive_series_group_ix'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
