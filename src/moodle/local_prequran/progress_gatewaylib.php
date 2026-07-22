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
    $now = time();
    $header = pqpg_b64url(json_encode(['alg' => 'HS256', 'typ' => 'JWT'], JSON_UNESCAPED_SLASHES));
    $payload = pqpg_b64url(json_encode([
        'sub' => $userid, 'course' => $coursekey, 'env' => $env, 'iat' => $now, 'exp' => $now + $ttl,
    ], JSON_UNESCAPED_SLASHES));
    $signature = hash_hmac('sha256', "{$header}.{$payload}", pqpg_secret(), true);
    return "{$header}.{$payload}." . pqpg_b64url($signature);
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
