-- Safe Exam Browser exams (Phase 2): teacher-created exams, student
-- assignments, and attempts. Run in phpMyAdmin against ehelacad_quraantest.
-- Idempotent: CREATE TABLE IF NOT EXISTS only, no data changes.

CREATE TABLE IF NOT EXISTS mdlgx_local_prequran_seb_exam (
    id BIGINT(10) NOT NULL AUTO_INCREMENT,
    workspaceid BIGINT(10) NOT NULL DEFAULT 0,
    createdby BIGINT(10) NOT NULL DEFAULT 0,
    title VARCHAR(255) NOT NULL DEFAULT '',
    description TEXT NULL,
    embedurl TEXT NULL,
    mode VARCHAR(20) NOT NULL DEFAULT 'seb',
    proctoring TINYINT(1) NOT NULL DEFAULT 0,
    duration_minutes BIGINT(10) NOT NULL DEFAULT 30,
    quitpassword VARCHAR(100) NOT NULL DEFAULT '',
    window_start BIGINT(10) NOT NULL DEFAULT 0,
    window_end BIGINT(10) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    allowjson TEXT NULL,
    timecreated BIGINT(10) NOT NULL DEFAULT 0,
    timemodified BIGINT(10) NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY idx_seb_exam_workspace (workspaceid),
    KEY idx_seb_exam_createdby (createdby),
    KEY idx_seb_exam_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mdlgx_local_prequran_seb_exam_student (
    id BIGINT(10) NOT NULL AUTO_INCREMENT,
    examid BIGINT(10) NOT NULL,
    studentid BIGINT(10) NOT NULL,
    timecreated BIGINT(10) NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uq_seb_exam_student (examid, studentid),
    KEY idx_seb_exam_student_student (studentid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mdlgx_local_prequran_seb_attempt (
    id BIGINT(10) NOT NULL AUTO_INCREMENT,
    examid BIGINT(10) NOT NULL,
    userid BIGINT(10) NOT NULL,
    timestarted BIGINT(10) NOT NULL DEFAULT 0,
    timefinished BIGINT(10) NOT NULL DEFAULT 0,
    sebverified TINYINT(1) NOT NULL DEFAULT 0,
    focus_breaks BIGINT(10) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'in_progress',
    timecreated BIGINT(10) NOT NULL DEFAULT 0,
    timemodified BIGINT(10) NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uq_seb_attempt (examid, userid),
    KEY idx_seb_attempt_user (userid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Adults-only webcam-snapshot and audio voice-activity proctoring events for
-- focus-mode exams. imagedata holds a small base64 JPEG for snapshots; voice
-- events store only a level, never audio. Purged after the retention window.
CREATE TABLE IF NOT EXISTS mdlgx_local_prequran_seb_proctor (
    id BIGINT(10) NOT NULL AUTO_INCREMENT,
    examid BIGINT(10) NOT NULL,
    userid BIGINT(10) NOT NULL,
    attemptid BIGINT(10) NOT NULL DEFAULT 0,
    type VARCHAR(20) NOT NULL DEFAULT '',
    detail TEXT NULL,
    imagedata LONGTEXT NULL,
    level BIGINT(10) NOT NULL DEFAULT 0,
    timecreated BIGINT(10) NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY idx_seb_proctor_examuser (examid, userid),
    KEY idx_seb_proctor_time (timecreated)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT 'seb exam tables ready' AS result;
