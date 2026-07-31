-- READ-ONLY. The syllabus portal page loads from https://ehelacademy.b-cdn.net
-- but fetches its data from https://k-12.ehelacademy.org/local/prequran/portal_data.php.
-- That endpoint answers correctly when called directly, so the "Could not reach
-- the server" message is the browser refusing the cross-origin read: the CDN
-- origin is not in the CORS allowlist.
--
-- pqpg_allowed_origin() (local_prequran/progress_gatewaylib.php) reads the
-- plugin setting "progress_allowed_origins". If that setting is EMPTY it falls
-- back to a built-in default that already allows the CDN:
--     https://ehelacademy.b-cdn.net https://app.ehelacademy.org
-- If the setting has a value, that value REPLACES the default entirely -- so a
-- configured list missing the CDN origin is what breaks the page.
--
-- Hardcoded to the real database (ehelacad_quraantest); swap mdlgx_ for your
-- real table prefix if different.

-- 1. The decisive value. No row, or an empty value, means the default applies
--    and CORS should already work. Any other value must literally contain
--    https://ehelacademy.b-cdn.net (space or comma separated).
SELECT id, plugin, name, value
FROM ehelacad_quraantest.mdlgx_config_plugins
WHERE plugin = 'local_prequran'
  AND name = 'progress_allowed_origins';

-- 2. Every local_prequran setting, for context on how this plugin is configured.
SELECT name, value
FROM ehelacad_quraantest.mdlgx_config_plugins
WHERE plugin = 'local_prequran'
ORDER BY name;
