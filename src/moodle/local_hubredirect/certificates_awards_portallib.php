<?php
// Certificates-and-awards portal library — companion to the token-gated
// portal_handlers/certificates-awards.php endpoint (parallel-run of
// local_hubredirect/certificates_awards.php, which stays untouched).
//
// The legacy page defines NO functions of its own: every helper it uses is
// already shared (pqcp_* in certificates_placementlib.php, pqh_* in
// accesslib.php). There is therefore nothing to extract here — this file is a
// guard-only placeholder kept for naming symmetry with the other *_portallib
// files. The handler require_once()s the shared libs directly.

defined('MOODLE_INTERNAL') || die();
