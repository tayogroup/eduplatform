-- Phase 8 verification: safety hardening, audit review, and pilot launch.
-- Run after Moodle upgrade/cache purge. Replace the mdlgx_ prefix if your site uses a different one.

SELECT 'support_phase8_services' AS check_name, name, classname, methodname, classpath, component
FROM mdlgx_external_functions
WHERE name IN (
    'local_prequran_support_audit_log',
    'local_prequran_support_pilot_readiness'
)
ORDER BY name;

SELECT 'support_phase8_version' AS check_name, plugin, version
FROM mdlgx_config_plugins
WHERE plugin = 'local_prequran'
  AND name = 'version';

SELECT 'support_audit_coverage' AS check_name, action, COUNT(*) AS total
FROM mdlgx_local_prequran_support_audit
GROUP BY action
ORDER BY total DESC, action ASC;

SELECT 'support_event_coverage' AS check_name, eventtype, visibility, COUNT(*) AS total
FROM mdlgx_local_prequran_support_event
GROUP BY eventtype, visibility
ORDER BY total DESC, eventtype ASC;

SELECT 'pilot_active_risk_counts' AS check_name,
       SUM(CASE WHEN status NOT IN ('resolved', 'closed') THEN 1 ELSE 0 END) AS open_tickets,
       SUM(CASE WHEN status NOT IN ('resolved', 'closed') AND assigneeid = 0 THEN 1 ELSE 0 END) AS unassigned_tickets,
       SUM(CASE WHEN status NOT IN ('resolved', 'closed') AND sla_resolution_due > 0 AND sla_resolution_due < UNIX_TIMESTAMP() THEN 1 ELSE 0 END) AS breached_tickets,
       SUM(CASE WHEN visibility = 'restricted' THEN 1 ELSE 0 END) AS restricted_tickets
FROM mdlgx_local_prequran_support_ticket;

SELECT 'pilot_workspace_policy_flags' AS check_name,
       workspaceid,
       consumerid,
       livechat_enabled,
       async_enabled,
       student_helpdesk_enabled,
       student_teacher_enabled,
       parent_teacher_enabled,
       student_free_text_policy,
       parent_visible_default,
       status
FROM mdlgx_local_prequran_support_policy
ORDER BY workspaceid, consumerid, id;
