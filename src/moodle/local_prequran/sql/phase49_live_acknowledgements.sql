-- Phase 49: Parent schedule acknowledgement and read receipts.
-- Replace mdlgx_ with your Moodle database prefix if needed.

CREATE TABLE IF NOT EXISTS mdlgx_local_prequran_live_ack (
    id BIGINT(20) NOT NULL AUTO_INCREMENT,
    seriesid BIGINT(20) NOT NULL,
    studentid BIGINT(20) NOT NULL,
    parentid BIGINT(20) NOT NULL,
    ack_status VARCHAR(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
    ack_message LONGTEXT COLLATE utf8mb4_unicode_ci NULL,
    acknowledgedat BIGINT(20) NOT NULL DEFAULT 0,
    lastchangeat BIGINT(20) NOT NULL DEFAULT 0,
    remindedat BIGINT(20) NOT NULL DEFAULT 0,
    timecreated BIGINT(20) NOT NULL,
    timemodified BIGINT(20) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY mdlgx_preq_live_ack_unique (seriesid, studentid, parentid),
    KEY mdlgx_preq_live_ack_series_ix (seriesid, ack_status, acknowledgedat),
    KEY mdlgx_preq_live_ack_parent_ix (parentid, studentid, lastchangeat)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

