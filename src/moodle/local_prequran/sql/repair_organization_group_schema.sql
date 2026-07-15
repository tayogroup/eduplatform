-- Repair organization-group tables directly in phpMyAdmin.
-- This script assumes the production prefix is mdlgx_. If your prefix differs,
-- replace mdlgx_ with the prefix shown by the verification candidate queries.

CREATE TABLE IF NOT EXISTS mdlgx_local_prequran_org_group (
    id BIGINT(20) NOT NULL AUTO_INCREMENT,
    slug VARCHAR(120) NOT NULL DEFAULT '',
    name VARCHAR(255) NOT NULL DEFAULT '',
    group_type VARCHAR(40) NOT NULL DEFAULT 'owned_group',
    parentconsumerid BIGINT(20) NOT NULL DEFAULT 0,
    status VARCHAR(40) NOT NULL DEFAULT 'active',
    policyjson LONGTEXT NULL,
    createdby BIGINT(20) NOT NULL DEFAULT 0,
    timecreated BIGINT(20) NOT NULL DEFAULT 0,
    timemodified BIGINT(20) NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY preqorggrp_slug_uix (slug),
    KEY preqorggrp_type_ix (group_type, status),
    KEY preqorggrp_cons_ix (parentconsumerid, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mdlgx_local_prequran_org_group_member (
    id BIGINT(20) NOT NULL AUTO_INCREMENT,
    groupid BIGINT(20) NOT NULL DEFAULT 0,
    member_type VARCHAR(40) NOT NULL DEFAULT 'workspace',
    memberid BIGINT(20) NOT NULL DEFAULT 0,
    relationship_type VARCHAR(40) NOT NULL DEFAULT 'owned_branch',
    group_role VARCHAR(40) NOT NULL DEFAULT 'member',
    access_scope VARCHAR(40) NOT NULL DEFAULT 'governance',
    inherit_sensitive_access TINYINT(1) NOT NULL DEFAULT 0,
    status VARCHAR(40) NOT NULL DEFAULT 'active',
    notes LONGTEXT NULL,
    createdby BIGINT(20) NOT NULL DEFAULT 0,
    timecreated BIGINT(20) NOT NULL DEFAULT 0,
    timemodified BIGINT(20) NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY preqorgmem_member_uix (groupid, member_type, memberid, group_role),
    KEY preqorgmem_group_ix (groupid, member_type, status),
    KEY preqorgmem_member_ix (member_type, memberid, status),
    KEY preqorgmem_rel_ix (relationship_type, access_scope, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT 'organization_group_repair_complete' AS check_name;
