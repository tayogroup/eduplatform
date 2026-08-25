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

/**
 * Who is launching, as one of 'admin', 'teacher' or 'student'.
 *
 * Site admins first, then anyone who can edit a course anywhere they are
 * enrolled — the app only needs the coarse answer, because the one thing it
 * decides is whether staff-only chrome is drawn.
 *
 * Capability is read against the user's own enrolments rather than a course
 * context, because the launch is for an EHEL course on the Bunny app, which has
 * no Moodle course of its own to ask about.
 */
function pqpg_launch_role(int $userid): string {
    if (is_siteadmin($userid)) {
        return 'admin';
    }
    try {
        foreach (enrol_get_all_users_courses($userid, true) as $course) {
            if (has_capability('moodle/course:update', context_course::instance($course->id), $userid)) {
                return 'teacher';
            }
        }
    } catch (Throwable $e) {
        // A role we cannot determine is a learner: the safe default is the one
        // that shows the least.
    }
    return 'student';
}

/**
 * The learner's category, or null for a regular student.
 *
 * 'tutoring' marks the tutoring-support learners (owner decision 2026-08-25):
 * children at other schools whose families use Ehel as tutoring. They are real
 * accounts in the `ehel-tutoring` cohort inside the ehel-k12 consumer — the
 * cohort IS the category, so membership is the whole test. The claim rides in
 * the signed token beside `role` and carries the same weight: the app reads it
 * to draw the subject-first tutoring UI (Get-help as the home page, school-run
 * chrome hidden, English's sequential gate down); entitlement stays with
 * enrolment. A missing cohort or a lookup failure returns null — a learner we
 * cannot categorise is a regular student, the UI that assumes the least.
 */
function pqpg_launch_category(int $userid): ?string {
    global $DB;
    try {
        $cohortid = (int)$DB->get_field('cohort', 'id', ['idnumber' => 'ehel-tutoring'], IGNORE_MISSING);
        if ($cohortid > 0 && $DB->record_exists('cohort_members', ['cohortid' => $cohortid, 'userid' => $userid])) {
            return 'tutoring';
        }
    } catch (Throwable $e) {
        // Fall through: uncategorised is the safe answer.
    }
    return null;
}

/**
 * Whether an admin has suspended sequential locking for this course.
 *
 * Settings are per English grade (local_prequran/gating_suspend_eng_gNN), so the
 * course key decides which one is read. Any course the settings do not cover —
 * every non-English subject today — answers false and keeps its own behaviour.
 *
 * Returned as a claim rather than written to the CDN: Moodle holds no Bunny
 * credential, and the token is already the channel the app trusts for identity.
 * The cost is that it reaches a learner at their NEXT launch, which the admin
 * screen says plainly.
 */
function pqpg_gating_suspended(string $coursekey): bool {
    if (!preg_match('/^ehel-eng-g(\d{2})$/', $coursekey, $m)) {
        return false;
    }
    return (bool)get_config('local_prequran', 'gating_suspend_eng_g' . $m[1]);
}

/** Mint a launch token binding a learner to a course (and optionally an env). */
function pqpg_mint_token(int $userid, string $coursekey, string $env = '', int $ttl = PQPG_TOKEN_TTL): string {
    global $DB;

    $now = time();
    // jti enables per-token/per-user revocation (pqpg_revoke_user_tokens);
    // tokens minted before the registry existed stay valid until expiry.
    $jti = bin2hex(random_bytes(8));
    $header = pqpg_b64url(json_encode(['alg' => 'HS256', 'typ' => 'JWT'], JSON_UNESCAPED_SLASHES));
    // `role` rides in the signed payload so the app reads it from the token
    // rather than from a query string a learner could edit. The app cannot
    // VERIFY the signature — it has no secret — so this decides presentation
    // only; anything that must actually be enforced is enforced at the gateway.
    $payload = pqpg_b64url(json_encode([
        'sub' => $userid, 'course' => $coursekey, 'env' => $env, 'iat' => $now, 'exp' => $now + $ttl, 'jti' => $jti,
        'role' => pqpg_launch_role($userid),
        // 'tutoring' for the tutoring-support cohort, null for everyone else —
        // the app draws the subject-first tutoring UI on it (see
        // pqpg_launch_category). Same presentation-only weight as role.
        'category' => pqpg_launch_category($userid),
        // Present only when an admin has suspended this course, so a token
        // minted before the setting existed simply has no opinion and the
        // app falls through to gating.json.
        'gate' => pqpg_gating_suspended($coursekey) ? 'suspended' : null,
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
        // a Moodle course idnumber and that is what catalog_sync writes.
        'intensive-eng' => ['intensive-english', 'level', 'l'],
        // The app emitted ehel-ien-lNN until 2026-08-21, which missed both the
        // curriculum-map join and the Moodle course lookup — a family saw the
        // raw key with an inflated percent, and push_gradebook() soft-skipped
        // every score. shell/subjects/intensive-english.js now emits the
        // canonical form above, and sql/merge_intensive_english_coursekey.sql
        // moves the rows written before that.
        //
        // This alias STAYS. It is what resolves a launch URL minted before the
        // fix, or one from a browser still holding the old app bundle, and both
        // outlive the release. It costs one array entry; dropping it turns an
        // old link into a course that opens on its default level.
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
 * The subject slug of a tutoring umbrella course key, or null.
 *
 * The six umbrella courses (idnumber ehel-tutoring-<slug>) are the enrolment
 * unit of the tutoring-support category: one course per subject, no stage in
 * the key, because a tutoring learner's stage is a property of the LEARNER
 * (their declared school year), not of the course. The slugs are exactly the
 * ones pqpg_ehel_app_base() knows, so a subject added there becomes
 * tutoring-launchable by creating its umbrella course and nothing else.
 */
function pqpg_tutoring_subject(string $coursekey): ?string {
    if (!preg_match('/^ehel-tutoring-([a-z-]+)$/', $coursekey, $m)) {
        return null;
    }
    // Proved against the same map the launch resolves through: a slug the app
    // base cannot resolve is not a subject, whatever the course tree says.
    $letter = $m[1] === 'intensive-eng' ? 'l' : 'g';
    return pqpg_ehel_app_base('ehel-' . $m[1] . '-' . $letter . '01') !== null ? $m[1] : null;
}

/**
 * The stage a tutoring learner's launch anchors on — their declared school
 * year, read from the student profile the intake fills (current_grade).
 *
 * This is the anchor of the app's ±2 help window, refined later by the
 * placement exam; a profile the intake has not filled yet anchors mid-range
 * rather than at Stage 1, because a wrong-but-central anchor still shows the
 * child's material inside the default window.
 *
 * Two subject quirks are absorbed here rather than in the app: Global
 * Perspectives Stage 5 is withdrawn (two of six skills exist), so a year-5
 * child anchors at 6 — their age cohort's next stage — instead of landing on
 * the withdrawal notice; Intensive English's axis is CEFR levels, not school
 * years, so it always opens at Level 1 and its own placement moves the learner.
 */
function pqpg_tutoring_stage(int $userid, string $slug): int {
    global $DB;
    if ($slug === 'intensive-eng') {
        return 1;
    }
    $declared = 0;
    try {
        $grade = (string)$DB->get_field('local_prequran_student_profile', 'current_grade', ['userid' => $userid], IGNORE_MISSING);
        if (preg_match('/(\d+)/', $grade, $m)) {
            $declared = (int)$m[1];
        }
    } catch (Throwable $e) {
        // No profile table or unreadable value — fall through to the default.
    }
    $stage = ($declared >= 1 && $declared <= 8) ? $declared : 4;
    if ($slug === 'gp' && $stage === 5) {
        $stage = 6;
    }
    return $stage;
}

/**
 * Full grade-aware Bunny launch URL for an EHEL course, with a freshly minted
 * progress token bound to $userid appended, or '' if $coursekey is not EHEL.
 *
 * $unit selects which unit the app opens on, defaulting to 1 — the first
 * teaching unit, which is what a course launch wants. Every current caller
 * takes the default.
 *
 * A tutoring umbrella key (ehel-tutoring-<slug>) launches the SAME subject app
 * at the learner's own declared stage, but the token is minted with the
 * umbrella key — and the gateway enforces token course == posted course, so
 * everything a tutoring learner does is recorded under the tutoring course.
 * That one line is the separation the category promises: school-course
 * gradebooks and rosters never see them, while the umbrella course's own
 * record is what their parents' reports read.
 */
function pqpg_ehel_launch_url(int $userid, string $coursekey, string $env, string $wwwroot, int $unit = 1): string {
    $tutoringslug = pqpg_tutoring_subject($coursekey);
    if ($tutoringslug !== null) {
        $stage = pqpg_tutoring_stage($userid, $tutoringslug);
        $letter = $tutoringslug === 'intensive-eng' ? 'l' : 'g';
        // A synthetic stage key resolves the app URL through the one existing
        // map — no second copy of the subject table to drift.
        $base = pqpg_ehel_app_base('ehel-' . $tutoringslug . '-' . $letter . str_pad((string)$stage, 2, '0', STR_PAD_LEFT));
        if ($base === null) {
            return '';
        }
        $token = pqpg_mint_token($userid, $coursekey, $env);
        $endpoint = rtrim($wwwroot, '/') . '/local/prequran/progress_gateway.php';
        return $base['appurl'] . '?' . $base['levelparam'] . '=' . $base['stage'] . '&unit=' . $unit
            . '&pwsEndpoint=' . urlencode($endpoint) . '&pwsToken=' . urlencode($token) . '&studentid=' . $userid;
    }
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
