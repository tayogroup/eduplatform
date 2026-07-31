-- Fixes the recurrence of the same bug found earlier this session:
-- defaultpublicpath holding the literal domain string
-- "/primary.ehelacademy.org" instead of a real local Moodle route. This is
-- what caused the malformed post-logout redirect
-- (https://app.k-12.ehelacademy.org/primary.ehelacademy.org?...).
-- Hardcoded to the real database (ehelacad_quraantest); swap mdlgx_ for your
-- real table prefix if different.

UPDATE mdlgx_local_prequran_consumer
SET defaultpublicpath = '/local/hubredirect/consumer_landing.php',
    timemodified = UNIX_TIMESTAMP()
WHERE id = 8
  AND slug = 'ehel-k12';

SELECT id, slug, defaultpublicpath FROM mdlgx_local_prequran_consumer WHERE id = 8;
