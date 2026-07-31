-- Ehel Academy's login page (local_hubredirect/consumer_login.php) renders in
-- whatever primary_color/accent_color are stored in the consumer's themejson
-- (see pqh_consumer_theme() in accesslib.php) -- the page background gradient,
-- input focus ring, submit button, and links all derive from --pqh-primary /
-- --pqh-accent, which come straight from these two fields. Currently green;
-- this sets both to the platform's standard blue (#2166d1 / #4d8be0, the same
-- fallback used when a consumer has no theme override at all).
--
-- Scoped to the Ehel Academy parent consumer only (slug 'ehel-academy'), not
-- its child schools -- see project memory on org_group theme inheritance:
-- a child school's own themejson (if it sets these keys locally) overrides
-- whatever the parent has, so this alone won't change a child school's login
-- page if that school has its own primary_color/accent_color set.
--
-- Swap mdlgx_ below for your real table prefix if different.

-- 1. Confirm before: current themejson for the Ehel Academy consumer.
SELECT id, name, slug, themejson
  FROM mdlgx_local_prequran_consumer
 WHERE slug = 'ehel-academy' OR name = 'Ehel Academy';

-- 2. Set primary_color and accent_color to blue, preserving every other key
--    already stored in themejson.
UPDATE mdlgx_local_prequran_consumer
   SET themejson = JSON_SET(
         COALESCE(themejson, '{}'),
         '$.primary_color', '#2166d1',
         '$.accent_color', '#4d8be0'
       ),
       timemodified = UNIX_TIMESTAMP()
 WHERE slug = 'ehel-academy' OR name = 'Ehel Academy';

-- 3. Confirm after.
SELECT id, name, slug, themejson
  FROM mdlgx_local_prequran_consumer
 WHERE slug = 'ehel-academy' OR name = 'Ehel Academy';
