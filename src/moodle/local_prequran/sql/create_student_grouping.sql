-- Student grouping foundation for Quraan Academy live sessions.
-- Replace mdlgx_ with your Moodle database prefix if needed.

CREATE TABLE IF NOT EXISTS mdlgx_local_prequran_student_profile (
    id BIGINT(20) NOT NULL AUTO_INCREMENT,
    userid BIGINT(20) NOT NULL,
    student_display_name VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    date_of_birth VARCHAR(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    timezone VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'UTC',
    primary_language VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    language VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    age_years BIGINT(10) NOT NULL DEFAULT 0,
    age_band VARCHAR(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    current_level VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    learning_base VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    country VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    city VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    gender VARCHAR(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    special_needs VARCHAR(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'no',
    course_type VARCHAR(60) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pre_quraan',
    parent_name VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    parent_email VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    parent_phone VARCHAR(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
    live_class_consent TINYINT(1) NOT NULL DEFAULT 0,
    recording_consent TINYINT(1) NOT NULL DEFAULT 0,
    consent_notes LONGTEXT COLLATE utf8mb4_unicode_ci NULL,
    availability LONGTEXT COLLATE utf8mb4_unicode_ci NULL,
    parent_preferences LONGTEXT COLLATE utf8mb4_unicode_ci NULL,
    status VARCHAR(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
    createdby BIGINT(20) NOT NULL DEFAULT 0,
    timecreated BIGINT(20) NOT NULL DEFAULT 0,
    timemodified BIGINT(20) NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY mdlgx_preqstudprof_user_uix (userid),
    KEY mdlgx_preqstudprof_match_ix (status, course_type, timezone, language, current_level),
    KEY mdlgx_preqstudprof_parent_ix (parent_email),
    KEY mdlgx_preqstudprof_cons_ix (live_class_consent, recording_consent),
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

ALTER TABLE mdlgx_local_prequran_live_session
    ADD COLUMN groupid BIGINT(20) NOT NULL DEFAULT 0;

ALTER TABLE mdlgx_local_prequran_live_session
    ADD INDEX mdlgx_preqlive_sess_group_ix (groupid, scheduled_start);

ALTER TABLE mdlgx_local_prequran_live_series
    ADD COLUMN groupid BIGINT(20) NOT NULL DEFAULT 0;

ALTER TABLE mdlgx_local_prequran_live_series
    ADD INDEX mdlgx_preqlive_series_group_ix (groupid, date_start);
