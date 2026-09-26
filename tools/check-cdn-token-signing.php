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
 * Bunny has TWO schemes. V1 is a bare sha256 of key+path+expires; V2 is
 * hmac-sha256 with an "HS256-" prefix. They differ for identical inputs, and
 * prose about "the" algorithm does not say which. This pins V2.
 *
 * NOT covered here, and it cannot be: whether the EDGE accepts the token. No
 * published vector combines token_path with token_ignore_params -- our exact
 * combination -- so agreement with the reference proves the arithmetic and not
 * the contract. That needs one real 200-then-403 against the zone; the runbook
 * says how. A green run here means the helper still computes what it computed
 * when the edge was last observed to accept it.
 */

define('MOODLE_INTERNAL', true);

$KEY = 'SecurityKey';
$GLOBALS['__pqpg_cfg'] = ['ehel_cdn_token_key' => $KEY];
function get_config($plugin, $name) {
    return $GLOBALS['__pqpg_cfg'][$name] ?? false;
}

require __DIR__ . '/../src/moodle/local_prequran/progress_gatewaylib.php';

$DIR   = '/Ehel%20Primary/app/computing/grade-4-v2/';
$HOST  = 'https://ehelacademy.b-cdn.net';
$FIXED = 1598024587;
// Bunny's own signer, for token_path=$DIR, ignore_params=true, no IP, at $FIXED.
$EXPECTED = 'HS256-FwMHLLZwzy1BTSJjvnUoUjshxam5-y0vucMIy5ZFhGQ';

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
$live = $HOST . $DIR . 'index.html?stage=4&unit=1'
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
