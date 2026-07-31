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
 * Decompose an EHEL catalog course key (ehel-{eng|math|sci}-gNN) into the Bunny
 * app routing parts, or null if it is not an EHEL course. Single source of truth
 * for the app subdir, the grade/stage value, and which query param carries it
 * (English routes by ?grade=, math/science by ?stage=). Shared by
 * progress_token.php and course_launch.php.
 */
function pqpg_ehel_app_base(string $coursekey): ?array {
    if (!preg_match('/^ehel-(eng|math|sci)-g(\d{2})$/', $coursekey, $m)) {
        return null;
    }
    $subjectdir = ['eng' => 'english', 'math' => 'mathematics', 'sci' => 'science'][$m[1]];
    return [
        'subjectdir' => $subjectdir,
        'stage' => (int)$m[2],
        'levelparam' => $m[1] === 'eng' ? 'grade' : 'stage',
        'appurl' => 'https://ehelacademy.b-cdn.net/Ehel%20Primary/app/' . $subjectdir . '/index.html',
    ];
}

/**
 * Full grade-aware Bunny launch URL for an EHEL course, with a freshly minted
 * progress token bound to $userid appended, or '' if $coursekey is not EHEL.
 */
function pqpg_ehel_launch_url(int $userid, string $coursekey, string $env, string $wwwroot): string {
    $base = pqpg_ehel_app_base($coursekey);
    if ($base === null) {
        return '';
    }
    $token = pqpg_mint_token($userid, $coursekey, $env);
    $endpoint = rtrim($wwwroot, '/') . '/local/prequran/progress_gateway.php';
    $launchparams = 'pwsEndpoint=' . urlencode($endpoint) . '&pwsToken=' . urlencode($token) . '&studentid=' . $userid;
    return $base['appurl'] . '?' . $base['levelparam'] . '=' . $base['stage'] . '&unit=1&' . $launchparams;
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
