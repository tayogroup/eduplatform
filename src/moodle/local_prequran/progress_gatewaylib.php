<?php
// Auth bridge (Phase B) — signed launch tokens for the Bunny-hosted apps.
//
// course_launch (or progress_token.php) mints a short-lived HS256 JWT while the
// user still has a Moodle session; the stateless gateway (progress_gateway.php)
// verifies it on every call. The apps never hold Moodle WS tokens and the
// studentid in the URL is display-only — identity comes from the token.
//
// Secret: auto-generated on first use into config local_prequran/
// progress_launch_secret (rotate by blanking it). Allowed CORS origins come from
// config local_prequran/progress_allowed_origins (whitespace/comma-separated),
// defaulting to the Ehel CDN + custom domain.

defined('MOODLE_INTERNAL') || die();

const PQPG_TOKEN_TTL = 43200; // 12 hours — covers a school day; re-launch renews.

function pqpg_b64url(string $bytes): string {
    return rtrim(strtr(base64_encode($bytes), '+/', '-_'), '=');
}

function pqpg_b64url_decode(string $value) {
    return base64_decode(strtr($value, '-_', '+/'));
}

function pqpg_secret(): string {
    $secret = (string)get_config('local_prequran', 'progress_launch_secret');
    if ($secret === '') {
        $secret = bin2hex(random_bytes(32));
        set_config('progress_launch_secret', $secret, 'local_prequran');
    }
    return $secret;
}

/** Mint a launch token binding a learner to a course (and optionally an env). */
function pqpg_mint_token(int $userid, string $coursekey, string $env = '', int $ttl = PQPG_TOKEN_TTL): string {
    global $DB;

    $now = time();
    // jti enables per-token/per-user revocation (pqpg_revoke_user_tokens);
    // tokens minted before the registry existed stay valid until expiry.
    $jti = bin2hex(random_bytes(8));
    $header = pqpg_b64url(json_encode(['alg' => 'HS256', 'typ' => 'JWT'], JSON_UNESCAPED_SLASHES));
    $payload = pqpg_b64url(json_encode([
        'sub' => $userid, 'course' => $coursekey, 'env' => $env, 'iat' => $now, 'exp' => $now + $ttl, 'jti' => $jti,
    ], JSON_UNESCAPED_SLASHES));
    $signature = hash_hmac('sha256', "{$header}.{$payload}", pqpg_secret(), true);
    try {
        if ($DB->get_manager()->table_exists(new xmldb_table('local_prequran_token_issue'))) {
            $DB->insert_record('local_prequran_token_issue', (object)[
                'userid' => $userid,
                'jti' => $jti,
                'scope' => core_text::substr($coursekey, 0, 100),
                'issuedat' => $now,
                'expiresat' => $now + $ttl,
                'revokedat' => 0,
                'revokedby' => 0,
                'timecreated' => $now,
            ]);
        }
    } catch (Throwable $e) {
        // Registry is best-effort: minting must never fail because of it.
    }
    return "{$header}.{$payload}." . pqpg_b64url($signature);
}

/**
 * Decompose an EHEL catalog course key (ehel-<subject>-{g|l}NN) into the Bunny
 * app routing parts, or null if it is not an EHEL course. Single source of truth
 * for the app subdir, the grade/stage/level value, and which query param carries
 * it. Shared by progress_token.php, course_launch.php, seb_config.php,
 * and seb_release.php — all of which used to carry their
 * own copy of a three-subject regex and so disagreed with the catalog. Returning
 * non-null here is what makes a course launchable, so adding a subject is
 * this one edit.
 */
function pqpg_ehel_app_base(string $coursekey): ?array {
    // slug => [app directory, the URL param that carries the level, the letter
    // the course key numbers with]. The app directory matches the Bunny deploy
    // target in tools/upload-app-to-bunny.js (app/<dir>), and the param matches
    // that subject's `param:` in shell/subjects/<dir>.js — English routes by
    // ?grade=, Intensive English by ?level=, everything else by ?stage=. Get
    // either wrong and the app opens on its default stage instead of the
    // learner's, which looks like working software.
    $subjects = [
        'eng'  => ['english', 'grade', 'g'],
        'math' => ['mathematics', 'stage', 'g'],
        'sci'  => ['science', 'stage', 'g'],
        'comp' => ['computing', 'stage', 'g'],
        'gp'   => ['global-perspectives', 'stage', 'g'],
        // Intensive English is published by the catalog as ehel-intensive-eng-lNN
        // and that is the canonical form, because this function is looked up by
        // a Moodle course idnumber and that is what catalog_sync writes. The
        // app's own courseKey() emits ehel-ien-lNN instead — a known, deliberate
        // mismatch that is an open data decision, NOT a typo to correct here.
        // Both are accepted so a launch resolves whichever form reaches it;
        // resolving the mismatch is a separate call about the catalog.
        'intensive-eng' => ['intensive-english', 'level', 'l'],
        'ien'  => ['intensive-english', 'level', 'l'],
    ];
    if (!preg_match('/^ehel-([a-z-]+)-([gl])(\d{2})$/', $coursekey, $m)) {
        return null;
    }
    if (!isset($subjects[$m[1]])) {
        return null;
    }
    [$subjectdir, $levelparam, $letter] = $subjects[$m[1]];
    // The letter is part of the subject's identity, not decoration: accepting
    // ehel-eng-l01 would resolve a level to a grade and launch the wrong thing.
    if ($m[2] !== $letter) {
        return null;
    }
    return [
        'subjectdir' => $subjectdir,
        'stage' => (int)$m[3],
        'levelparam' => $levelparam,
        'appurl' => 'https://ehelacademy.b-cdn.net/Ehel%20Primary/app/' . $subjectdir . '/index.html',
    ];
}

/**
 * Full grade-aware Bunny launch URL for an EHEL course, with a freshly minted
 * progress token bound to $userid appended, or '' if $coursekey is not EHEL.
 *
 * $unit selects which unit the app opens on, defaulting to 1 — the first
 * teaching unit, which is what a course launch wants. Every current caller
 * takes the default.
 */
function pqpg_ehel_launch_url(int $userid, string $coursekey, string $env, string $wwwroot, int $unit = 1): string {
    $base = pqpg_ehel_app_base($coursekey);
    if ($base === null) {
        return '';
    }
    $token = pqpg_mint_token($userid, $coursekey, $env);
    $endpoint = rtrim($wwwroot, '/') . '/local/prequran/progress_gateway.php';
    $launchparams = 'pwsEndpoint=' . urlencode($endpoint) . '&pwsToken=' . urlencode($token) . '&studentid=' . $userid;
    return $base['appurl'] . '?' . $base['levelparam'] . '=' . $base['stage']
        . '&unit=' . $unit . '&' . $launchparams;
}

/** Revoke every unexpired token minted for a user. Returns the count revoked. */
function pqpg_revoke_user_tokens(int $userid, int $revokedby = 0): int {
    global $DB;

    try {
        if (!$DB->get_manager()->table_exists(new xmldb_table('local_prequran_token_issue'))) {
            return 0;
        }
        $now = time();
        $rows = $DB->get_records_select('local_prequran_token_issue',
            'userid = :userid AND revokedat = 0 AND expiresat > :now',
            ['userid' => $userid, 'now' => $now], '', 'id');
        foreach ($rows as $row) {
            $DB->update_record('local_prequran_token_issue', (object)[
                'id' => (int)$row->id, 'revokedat' => $now, 'revokedby' => $revokedby,
            ]);
        }
        return count($rows);
    } catch (Throwable $e) {
        return 0;
    }
}

/** Verify signature + expiry; returns the claims array or null. */
function pqpg_verify_token(string $token): ?array {
    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        return null;
    }
    [$header, $payload, $signature] = $parts;
    $expected = pqpg_b64url(hash_hmac('sha256', "{$header}.{$payload}", pqpg_secret(), true));
    if (!hash_equals($expected, $signature)) {
        return null;
    }
    $claims = json_decode((string)pqpg_b64url_decode($payload), true);
    if (!is_array($claims) || (int)($claims['exp'] ?? 0) < time()) {
        return null;
    }
    // Per-token revocation: a jti-carrying token dies the moment its registry
    // row is revoked. Legacy tokens (no jti) and registry outages fail OPEN so
    // the classroom never breaks on an auxiliary table.
    $jti = (string)($claims['jti'] ?? '');
    if ($jti !== '') {
        global $DB;
        try {
            if ($DB->get_manager()->table_exists(new xmldb_table('local_prequran_token_issue'))) {
                $revoked = $DB->get_field('local_prequran_token_issue', 'revokedat', ['jti' => $jti]);
                if ((int)$revoked > 0) {
                    return null;
                }
            }
        } catch (Throwable $e) {
            // Fail open by design.
        }
    }
    return $claims;
}

/** Echo back the origin if it is allowed for CORS, else null. */
function pqpg_allowed_origin(?string $origin): ?string {
    if ($origin === null || $origin === '') {
        return null;
    }
    $configured = trim((string)get_config('local_prequran', 'progress_allowed_origins'));
    $source = $configured !== '' ? $configured : "https://ehelacademy.b-cdn.net https://app.ehelacademy.org";
    foreach (preg_split('/[\s,]+/', $source, -1, PREG_SPLIT_NO_EMPTY) as $allowed) {
        if (rtrim($allowed, '/') === rtrim($origin, '/')) {
            return $origin;
        }
    }
    return null;
}
