-- Fixes the leftover "Ehel Primary School" text living inside consumer id 8's
-- (slug ehel-k12) copyjson.landing_headline / landing_subtitle -- free-text
-- fields typed once by an admin, which the earlier name/workspace renames
-- never touch (see find_remaining_ehel_primary_school_text.sql, check #1).
--
-- Uses JSON_SET so only these two keys change -- every other copyjson key
-- (features, hero_image_url, brand_initials, etc.) is left exactly as-is.
-- Hardcoded to the real database (ehelacad_quraantest); swap mdlgx_ for
-- your real table prefix if different.

-- 1. See the FULL current text first (phpMyAdmin truncates long values in
--    the grid view) -- read both before deciding the replacement wording.
SELECT id, slug,
       JSON_UNQUOTE(JSON_EXTRACT(copyjson, '$.landing_headline')) AS landing_headline,
       JSON_UNQUOTE(JSON_EXTRACT(copyjson, '$.landing_subtitle')) AS landing_subtitle
  FROM mdlgx_local_prequran_consumer
 WHERE id = 8;

-- 2. Replace landing_headline with the corrected name. Adjust the literal
--    text below if you'd rather it read differently than a plain repeat of
--    the school name (e.g. re-add a tagline) -- whatever you put here is
--    exactly what renders in the page's <h1>.
UPDATE mdlgx_local_prequran_consumer
SET copyjson = JSON_SET(copyjson, '$.landing_headline', 'Ehel Primary & Secondary'),
    timemodified = UNIX_TIMESTAMP()
WHERE id = 8;

-- 3. If step 1's landing_subtitle also mentioned "Primary School", uncomment
--    and edit this before running (left out by default since we haven't
--    seen its contents yet):
-- UPDATE mdlgx_local_prequran_consumer
-- SET copyjson = JSON_SET(copyjson, '$.landing_subtitle', '<replacement text>'),
--     timemodified = UNIX_TIMESTAMP()
-- WHERE id = 8;

-- 4. Confirm it took.
SELECT id, slug,
       JSON_UNQUOTE(JSON_EXTRACT(copyjson, '$.landing_headline')) AS landing_headline,
       JSON_UNQUOTE(JSON_EXTRACT(copyjson, '$.landing_subtitle')) AS landing_subtitle
  FROM mdlgx_local_prequran_consumer
 WHERE id = 8;
