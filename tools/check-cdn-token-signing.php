<?php
/**
 * Gate on pqpg_cdn_sign_dir_url(): Bunny CDN launch-URL signing.
 *
 *   /c/xampp/php/php tools/check-cdn-token-signing.php      (npm run check:cdn-token)
 *
 * WHY A KNOWN-ANSWER TEST AND NOT A RE-IMPLEMENTATION. A gate that computes the
 * expected token the same way the code does is a gate that agrees with any bug
 * it shares. The expected value below was produced by BunnyWay's OWN signer
 * (BunnyCDN.TokenAuthentication, php/url_signing.php), which was first proved
 * against that repository's published test vectors, 15 of 15. So this frozen
 * string is Bunny's answer, not ours, and nothing here can drift it.
 *
 * Bunny has TWO schemes and the edge accepts BOTH (measured). V1 is base64 of a
 * raw md5 over key+path+expires; V2 is hmac-sha256 with an "HS256-" prefix.
 * They differ for identical inputs and prose about "the" algorithm does not say
 * which. This pins V2.
 *
 * THE EDGE IS THE AUTHORITY, AND IT HAS SPOKEN. On 2026-09-26 this exact
 * construction was verified against a live Bunny zone -- a throwaway pull zone
 * on the same storage, so no learner could be affected. One directory token
 * served index.html, a sibling lesson page, ./course-shell.js, ./wehel.js, the
 * lecture-video/ subdirectory and a request carrying extra query params, while a
 * path outside token_path and an expired token were both refused. 8 of 8.
 *
 * That run also OVERTURNED this file's previous expected value, which is the
 * lesson worth keeping. The path must be signed PERCENT-DECODED --
 * "/Ehel Primary/..." and not "/Ehel%20Primary/..." -- because the edge decodes
 * before it checks. The old frozen token came from Bunny's reference signer,
 * which takes its path from parse_url() and so was faithfully signing the
 * ENCODED path it had been handed. Gate and helper therefore agreed with each
 * other while the edge refused both with a 403. A known-answer test is only as
 * good as the input that was frozen, and nothing but the edge could tell.
 */

define('MOODLE_INTERNAL', true);

$KEY = 'SecurityKey';
$GLOBALS['__pqpg_cfg'] = ['ehel_cdn_token_key' => $KEY];
function get_config($plugin, $name) {
    return $GLOBALS['__pqpg_cfg'][$name] ?? false;
}

require __DIR__ . '/../src/moodle/local_prequran/progress_gatewaylib.php';

$DIR   = '/Ehel Primary/app/computing/grade-4-v2/';   // DECODED: the form the edge signs
$HOST  = 'https://ehelacademy.b-cdn.net';
$FIXED = 1598024587;
// Bunny's own signer, for token_path=$DIR, ignore_params=true, no IP, at $FIXED.
$EXPECTED = 'HS256-3b3muIQDhsOpdtNqjWgopThhg0bcQ-o2bJz8_g0rEXg';

$fail = [];

function qp(string $url, string $k): ?string {
    $q = parse_url($url, PHP_URL_QUERY);
    if ($q === null || $q === false) { return null; }
    parse_str($q, $p);
    return $p[$k] ?? null;
}

// 1. Known answer. Time is the one input we cannot fix from outside, so the
//    helper is called and its own expiry is read back, then the token is
//    recomputed for the frozen instant by the same code path.
$live = $HOST . '/Ehel%20Primary/app/computing/grade-4-v2/index.html?stage=4&unit=1'
      . '&pwsEndpoint=' . urlencode('https://quraantest.academy/local/prequran/progress_gateway.php')
      . '&pwsToken=aaa.bbb.ccc&studentid=1330';
$signed = pqpg_cdn_sign_dir_url($live, PQPG_TOKEN_TTL);
$expires = (int)qp($signed, 'expires');
if ($expires <= time()) {
    $fail[] = 'expiry is not in the future';
}
// Re-sign at the frozen instant by moving the TTL, which is the only lever the
// signature's clock has.
$frozen = pqpg_cdn_sign_dir_url($live, $FIXED - time());
if (qp($frozen, 'token') !== $EXPECTED) {
    $fail[] = "token differs from Bunny's reference\n      want " . $EXPECTED
            . "\n      got  " . qp($frozen, 'token');
}

// 2. The parameters the edge reads must all be present and correctly shaped.
if (qp($signed, 'token_path') !== $DIR) {
    $fail[] = 'token_path is not the app directory: ' . var_export(qp($signed, 'token_path'), true);
}
// The regression guard for the bug this gate shipped with. token_path must be
// the DECODED directory; a percent-encoded one signs a path the edge never
// computes, and every lesson 403s while every local check stays green.
if (strpos((string)qp($signed, 'token_path'), '%') !== false) {
    $fail[] = 'token_path is still percent-encoded (' . qp($signed, 'token_path')
            . '); the edge decodes before checking, so this signs a path no request carries';
}
if (qp($signed, 'token_ignore_params') !== 'true') {
    $fail[] = 'token_ignore_params is not set, so the signature covers the query '
            . 'string and the first in-app click invalidates it';
}

// 3. The launch must survive signing. A signed URL that has dropped pwsToken
//    renders a lesson that reports nothing to the school -- and looks fine.
foreach (['stage=4', 'unit=1', 'pwsEndpoint=', 'pwsToken=aaa.bbb.ccc', 'studentid=1330'] as $need) {
    if (strpos($signed, $need) === false) {
        $fail[] = 'signing dropped a launch parameter: ' . $need;
    }
}

// 4. Everything a lesson page fetches must be UNDER the signed directory, or it
//    is a file the edge will refuse once the zone rule covers this prefix. The
//    shared logo is deliberately outside and is listed as such: the edge rule
//    protects exactly the signed prefix, so app/shared/ stays public. If that
//    rule is ever widened to app/, this list is what tells you what breaks.
$inside = ['course-shell.js', 'learner-controls.js', 'seb-session.js', 'wehel.js',
           'lecture-video/film.mp4', 'lecture-video/film.vtt', 'lecture-video/film.jpg',
           'bitsy-loops.html', 'index.html'];
$outside = ['../shared/ehel-academy-logo.png'];
foreach ($inside as $rel) {
    if (strpos(resolve($DIR . $rel), $DIR) !== 0) {
        $fail[] = 'a lesson subresource is NOT covered by the directory token: ' . $rel;
    }
}
foreach ($outside as $rel) {
    if (strpos(resolve($DIR . $rel), $DIR) === 0) {
        $fail[] = 'expected ' . $rel . ' to sit outside the signed directory; it no longer does, '
                . 'so this gate has stopped describing the layout';
    }
}

function resolve(string $path): string {
    while (strpos($path, '/../') !== false) {
        $next = preg_replace('~/[^/]+/\.\./~', '/', $path, 1);
        if ($next === $path) { break; }
        $path = $next;
    }
    return $path;
}

// 4b. An encoded slash in the FILENAME must not become a directory boundary.
//     dirname runs on the encoded path and only then decodes; the reverse order
//     computes ".../grade-4-v2/weird/" and signs a path no request carries.
//     Every ordinary path is identical under both orderings, so without this
//     case the mutation is invisible -- it survived the suite once for exactly
//     that reason.
$odd = pqpg_cdn_sign_dir_url($HOST . '/Ehel%20Primary/app/computing/grade-4-v2/weird%2Fname.html', PQPG_TOKEN_TTL);
if (qp($odd, 'token_path') !== $DIR) {
    $fail[] = 'an encoded slash in the filename moved the directory boundary: '
            . var_export(qp($odd, 'token_path'), true) . ' (expected ' . $DIR . ')';
}

// 5. Blank key is the off switch, and it must be exact. Anything else here is a
//    partial rollback that 403s learners.
$GLOBALS['__pqpg_cfg'] = [];
if (pqpg_cdn_sign_dir_url($live, PQPG_TOKEN_TTL) !== $live) {
    $fail[] = 'with no key configured the URL was modified; blank must be a no-op';
}

if ($fail) {
    echo "CDN token signing: FAIL\n";
    foreach ($fail as $f) { echo '  - ' . $f . "\n"; }
    exit(1);
}
echo "CDN token signing: ok (known answer, edge params, launch preserved, "
   . count($inside) . " subresources covered, blank key inert)\n";
exit(0);
