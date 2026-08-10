<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/course_offeringlib.php');

$consumer = pqh_requested_consumer_context();
$slug = (string)$consumer->consumerslug;
$ismarketplace = pqh_consumer_feature_enabled($consumer, 'teacher_marketplace');
$isinstitution = (string)($consumer->consumer_type ?? '') === 'institution';
$isacademy = (string)($consumer->consumer_type ?? '') === 'academy_consumer';
$isprofileconsumer = $isinstitution || $isacademy;
$workspaceid = (int)($consumer->workspaceid ?? 0);
$brand = (string)$consumer->consumername;
$brandlogo = trim((string)($consumer->logourl ?? ''));
$theme = pqh_consumer_theme($consumer);
$copy = pqh_consumer_copy($consumer);
$brandinitial = pqh_consumer_brand_initials($consumer, 'W');
$heroimage = pqh_consumer_hero_image_url($consumer);
$primarycolor = (string)$theme['primary_color'];
$accentcolor = (string)$theme['accent_color'];
$tagline = $isinstitution
    ? 'A branded teaching workspace for students, teachers, live sessions, reporting, and custom-domain access.'
    : ($ismarketplace
        ? 'A marketplace and operating workspace for independent teachers, tutors, parents, and learning institutions.'
        : 'Online learning operations, live sessions, student intake, and teacher services in one managed workspace.');
$headline = trim((string)($copy['landing_headline'] ?? ''));
if ($headline === '') {
    $headline = $brand;
}
$customsubtitle = trim((string)($copy['landing_subtitle'] ?? ''));
if ($customsubtitle !== '') {
    $tagline = $customsubtitle;
}
$support = trim((string)($consumer->supportemail ?? ''));
$externalwebsiteurl = trim((string)($consumer->externalwebsiteurl ?? ''));
$useexternalintake = (string)($consumer->intakelocation ?? '') === 'external_website' && $externalwebsiteurl !== '';
$consumerparams = ['consumer' => $slug];
$teachersubmitted = optional_param('teacher_submitted', 0, PARAM_BOOL);
$workspaceparams = $consumerparams;
if ($workspaceid > 0) {
    $workspaceparams['workspaceid'] = $workspaceid;
}

// Every Enroll CTA on this page goes through the explainer guide first, which
// offers the walkthrough video in English or Somali and hands the same scope
// straight on to public_intake.php -- or is skipped in one tap. The guide
// cannot block the form: its Continue link needs no script and no video.
//
// Marketplace consumers keep the direct link. Their CTA asks for teacher
// services, and the guide is written for a parent enrolling a child.
$studentintakepath = $ismarketplace
    ? '/local/hubredirect/public_intake.php'
    : '/local/hubredirect/public_intake_guide.php';
$studenturl = new moodle_url($studentintakepath, $workspaceparams);
$studenthref = $useexternalintake ? $externalwebsiteurl : $studenturl->out(false);
$teacherurl = new moodle_url($ismarketplace ? '/local/hubredirect/public_teacher_intake.php' : '/local/hubredirect/teacher_intake.php', $workspaceparams);
$marketurl = new moodle_url('/local/hubredirect/teacher_marketplace.php', $consumerparams);
$roleurl = new moodle_url('/local/hubredirect/role_redirect.php', $workspaceparams);
$loginurl = new moodle_url('/local/hubredirect/consumer_login.php', [
    'consumer' => $slug,
    'wantsurl' => $roleurl->out(false),
]);
$profileurl = new moodle_url('/local/hubredirect/institution_profile.php', $workspaceparams);
$inquiryurl = new moodle_url('/local/hubredirect/institution_profile.php', $workspaceparams + ['contact' => 1]);
$howtourl = new moodle_url('/local/hubredirect/how_to.php', $workspaceparams);
$catalogurl = new moodle_url('/local/hubredirect/course_catalog_browse.php', $workspaceparams);

// "Dashboard" and "Workplace" must route to different pages per viewer role
// -- role_redirect.php alone isn't right for either link, since its own
// per-role landing choice mixes dashboard-tier and workspace-tier pages
// (e.g. it sends parents straight to workspace_parent.php and teachers
// straight to teacher_workspace.php). Compute both tiers explicitly here so
// each role's "Dashboard" nav link goes to their overview page and
// "Workplace" goes to their deeper workspace/tools page, matching the
// student_dashboard.php/student_workplace.php pattern. Falls back to
// role_redirect.php when the viewer's workspace role can't be determined
// (e.g. no fixed workspace for this consumer, or no role assigned yet).
$viewerworkspacerole = $workspaceid > 0 ? pqh_user_workspace_role((int)$USER->id, $workspaceid) : '';
$dashboardtierpaths = [
    'student' => '/local/hubredirect/student_dashboard.php',
    'teacher' => '/local/hubredirect/dashboard.php',
    'assistant_teacher' => '/local/hubredirect/dashboard.php',
    'parent' => '/local/hubredirect/dashboard.php',
    'owner' => '/local/hubredirect/workspace_dashboard.php',
    'admin' => '/local/hubredirect/workspace_dashboard.php',
    'platform_admin' => '/local/hubredirect/workspace_dashboard.php',
    'coordinator' => '/local/hubredirect/workspace_dashboard.php',
    'auditor' => '/local/hubredirect/workspace_dashboard.php',
];
$workspacetierpaths = [
    'student' => '/local/hubredirect/student_workplace.php',
    'teacher' => '/local/hubredirect/teacher_workspace.php',
    'assistant_teacher' => '/local/hubredirect/teacher_workspace.php',
    'parent' => '/local/hubredirect/workspace_parent.php',
    'owner' => '/local/hubredirect/admin_workspace.php',
    'admin' => '/local/hubredirect/admin_workspace.php',
    'platform_admin' => '/local/hubredirect/admin_workspace.php',
    'coordinator' => '/local/hubredirect/admin_workspace.php',
    'auditor' => '/local/hubredirect/admin_workspace.php',
];
$dashboardurl = isset($dashboardtierpaths[$viewerworkspacerole])
    ? new moodle_url($dashboardtierpaths[$viewerworkspacerole], $workspaceparams)
    : $roleurl;
$workplaceurl = isset($workspacetierpaths[$viewerworkspacerole])
    ? new moodle_url($workspacetierpaths[$viewerworkspacerole], $workspaceparams)
    : $roleurl;
$logouturl = new moodle_url('/local/hubredirect/logout.php');
$fontbase = (new moodle_url('/local/hubredirect/pix/fonts/'))->out(false);

/** Upcoming, open course offerings for the school's public landing page. */
function pqhcl_upcoming_offerings(int $workspaceid, int $limit = 6): array {
    global $DB;

    if ($workspaceid <= 0 || !pqco_table_ready()) {
        return [];
    }
    try {
        $offerings = $DB->get_records_sql(
            "SELECT *
               FROM {local_prequran_course_offering}
              WHERE workspaceid = :workspaceid
                AND status = :status
                AND visibility = :visibility
           ORDER BY startdate ASC, title ASC",
            ['workspaceid' => $workspaceid, 'status' => 'published', 'visibility' => 'institution_public']
        );
    } catch (Throwable $e) {
        return [];
    }
    $counts = pqco_offering_counts(array_map(static fn($o) => (int)$o->id, $offerings));
    $rows = [];
    foreach ($offerings as $offering) {
        if (pqco_offering_has_ended($offering)) {
            continue;
        }
        $rows[] = $offering;
        if (count($rows) >= $limit) {
            break;
        }
    }
    return array_map(static function($offering) use ($counts) {
        return [
            'title' => trim((string)$offering->title) ?: (string)$offering->course_key,
            'summary' => trim((string)$offering->summary),
            'startdate' => (int)$offering->startdate,
            'seats' => pqco_open_seats($offering, $counts),
            'capacity' => (int)$offering->capacity,
        ];
    }, $rows);
}

/**
 * Public school events (open houses, term dates, enrollment deadlines) — NOT the
 * operational live-class schedule. local_prequran_live_session has no public/private
 * visibility flag (unlike course offerings), so individual class instances — including
 * private 1:1 and internal review sessions — must never be queried onto this
 * unauthenticated page. Enrolled users see their real live-class calendar after
 * logging in, via the dashboard. This reads school-level events from the same
 * admin-editable copyjson field that already powers announcements/policies.
 */
function pqhcl_upcoming_events(array $copy, int $limit = 6): array {
    $events = array_filter((array)($copy['events'] ?? []));
    $now = time();
    $upcoming = [];
    foreach ($events as $event) {
        $start = (int)($event['date'] ?? 0);
        if ($start > 0 && $start < $now) {
            continue;
        }
        $upcoming[] = [
            'title' => trim((string)($event['title'] ?? '')),
            'body' => trim((string)($event['body'] ?? '')),
            'start' => $start,
        ];
    }
    usort($upcoming, static fn($a, $b) => $a['start'] <=> $b['start']);
    return array_slice($upcoming, 0, $limit);
}

/** Every configured event falling in a given year/month, keyed by day-of-month, for marking the calendar grid. */
function pqhcl_calendar_month_events(array $copy, int $year, int $month): array {
    $events = array_filter((array)($copy['events'] ?? []));
    $bymonthday = [];
    foreach ($events as $event) {
        $start = (int)($event['date'] ?? 0);
        if ($start <= 0 || (int)date('Y', $start) !== $year || (int)date('n', $start) !== $month) {
            continue;
        }
        $bymonthday[(int)date('j', $start)][] = [
            'title' => trim((string)($event['title'] ?? '')),
            'start' => $start,
        ];
    }
    return $bymonthday;
}

/** Sun-Sat month grid: weeks of 7 cells, each ['day' => int|null, 'events' => array, 'istoday' => bool]. */
function pqhcl_calendar_grid(array $bymonthday, int $year, int $month, int $now): array {
    $firstweekday = (int)date('w', mktime(0, 0, 0, $month, 1, $year));
    $dayscount = (int)date('t', mktime(0, 0, 0, $month, 1, $year));
    $todayymd = (int)date('Ymd', $now);

    $cells = array_fill(0, $firstweekday, null);
    for ($d = 1; $d <= $dayscount; $d++) {
        $cells[] = $d;
    }
    while (count($cells) % 7 !== 0) {
        $cells[] = null;
    }

    $grid = [];
    foreach (array_chunk($cells, 7) as $week) {
        $row = [];
        foreach ($week as $day) {
            if ($day === null) {
                $row[] = ['day' => null, 'events' => [], 'istoday' => false];
                continue;
            }
            $row[] = [
                'day' => $day,
                'events' => $bymonthday[$day] ?? [],
                'istoday' => (int)date('Ymd', mktime(0, 0, 0, $month, $day, $year)) === $todayymd,
            ];
        }
        $grid[] = $row;
    }
    return $grid;
}

$hubcourses = $isinstitution ? pqhcl_upcoming_offerings($workspaceid) : [];
$hubevents = $isinstitution ? pqhcl_upcoming_events($copy) : [];
$calnow = time();
$calyear = (int)date('Y', $calnow);
$calmonth = (int)date('n', $calnow);
$calmonthevents = $isinstitution ? pqhcl_calendar_month_events($copy, $calyear, $calmonth) : [];
$calgrid = $isinstitution ? pqhcl_calendar_grid($calmonthevents, $calyear, $calmonth, $calnow) : [];
$calmonthlabel = userdate(mktime(0, 0, 0, $calmonth, 1, $calyear), '%B %Y');
$hubannouncements = $isinstitution ? array_filter((array)($copy['announcements'] ?? [])) : [];
if ($hubannouncements) {
    usort($hubannouncements, static fn($a, $b) => (int)($b['date'] ?? 0) <=> (int)($a['date'] ?? 0));
    $hubannouncements = array_slice($hubannouncements, 0, 5);
}
$hubemergency = $isinstitution ? trim((string)($copy['emergency_notice'] ?? '')) : '';
$hubpolicies = $isinstitution ? array_filter((array)($copy['policies'] ?? [])) : [];

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/consumer_landing.php', $consumerparams));
$PAGE->set_pagelayout('standard');
$PAGE->set_title($brand);
$PAGE->set_heading($brand);
$PAGE->add_body_class('pqh-consumer-landing-page');
if (method_exists($PAGE, 'set_cacheable')) {
    $PAGE->set_cacheable(false);
}

function pqhcl_service_cards(bool $ismarketplace, bool $isinstitution, string $brand): array {
    if ($isinstitution) {
        return [
            ['Branded workspace', 'Use your own institution identity and custom domain while keeping operations in the shared learning platform.'],
            ['Student and teacher management', 'Coordinate students, teachers, parent contacts, courses, assignments, and workspace membership.'],
            ['Live sessions', 'Schedule recurring classes, track upcoming sessions, manage attendance, and review live-class activity.'],
            ['Reports and operations', 'Review workspace reports, teaching load, student progress, materials, and operational follow-up.'],
        ];
    }
    if ($ismarketplace) {
        return [
            ['For independent teachers', 'Create a public profile, receive parent inquiries, manage students and courses, and run live sessions from one workspace.'],
            ['For parents', 'Browse teacher profiles, request services, and submit student learning needs through a guided intake form.'],
            ['For institutions', 'Find qualified teachers to hire, refer students for tutoring, and request extra learning support through the ' . $brand . ' marketplace.'],
            ['For live learning', 'Use scheduling, session materials, recordings, consent controls, and follow-up tools built for recurring instruction.'],
        ];
    }
    return [
        ['Student intake', 'Collect student, parent, placement, consent, language, and schedule information before enrollment.'],
        ['Teacher operations', 'Onboard teachers, publish marketplace profiles, and manage teaching responsibilities.'],
        ['Live sessions', 'Create recurring live sessions, attach materials, manage recordings, and review quality.'],
        ['Workspace management', 'Coordinate students, teachers, courses, parent communication, reports, and academy operations.'],
    ];
}

echo $OUTPUT->header();
?>
<style>
body.pqh-consumer-landing-page header,
body.pqh-consumer-landing-page footer,
body.pqh-consumer-landing-page nav.navbar,
body.pqh-consumer-landing-page #page-header,
body.pqh-consumer-landing-page #page-footer,
body.pqh-consumer-landing-page .drawer,
body.pqh-consumer-landing-page .drawer-toggles,
body.pqh-consumer-landing-page .block-region,
body.pqh-consumer-landing-page [data-region="drawer"],
body.pqh-consumer-landing-page [data-region="right-hand-drawer"]{display:none!important}
body.pqh-consumer-landing-page #page,
body.pqh-consumer-landing-page #page-content,
body.pqh-consumer-landing-page #region-main,
body.pqh-consumer-landing-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqhcl-shell{min-height:100vh;background:#f4f8fb;color:#173044;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}
.pqhcl-nav{position:sticky;top:0;z-index:5;background:rgba(255,255,255,.94);border-bottom:1px solid rgba(23,48,68,.1);backdrop-filter:blur(10px)}
.pqhcl-nav-inner{max-width:1180px;margin:0 auto;min-height:64px;padding:0 18px;display:flex;align-items:center;justify-content:space-between;gap:16px}
.pqhcl-brand{display:flex;align-items:center;gap:11px;font-weight:950;color:#172d3d;text-decoration:none}
.pqhcl-mark{display:grid;place-items:center;width:38px;height:38px;border-radius:10px;background:var(--pqh-primary,#2f6f4e);color:#fff;font-weight:950;overflow:hidden}
.pqhcl-mark img{display:block;width:100%;height:100%;object-fit:cover}
.pqhcl-links{display:flex;align-items:center;gap:9px;flex-wrap:wrap;justify-content:flex-end}
.pqhcl-btn{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:0 14px;border-radius:8px;border:1px solid rgba(23,48,68,.13);background:#eef4f6;color:#173044!important;text-decoration:none;font-size:14px;font-weight:950}
.pqhcl-btn--primary{background:var(--pqh-accent,#d99a26);border-color:var(--pqh-accent,#d99a26);color:#1b1409!important;box-shadow:0 12px 22px rgba(217,154,38,.22)}
.pqhcl-alert{max-width:1180px;margin:18px auto 0;padding:14px 18px;border-radius:8px;background:#edf9ef;color:#245c35;border:1px solid rgba(36,92,53,.12);font-weight:950}
.pqhcl-hero{position:relative;overflow:hidden;min-height:560px;display:flex;align-items:center;background:linear-gradient(90deg,rgba(9,37,32,.92),rgba(16,74,60,.76) 54%,rgba(16,74,60,.28)),var(--pqh-hero-image) center/cover no-repeat;color:#fff}
.pqhcl-hero-inner{max-width:1180px;width:100%;margin:0 auto;padding:72px 18px 92px}
.pqhcl-kicker{display:inline-flex;align-items:center;min-height:30px;padding:0 10px;border-radius:999px;background:rgba(255,216,140,.16);border:1px solid rgba(255,216,140,.34);color:#ffd88c;font-size:13px;font-weight:950;text-transform:uppercase}
.pqhcl-title{max-width:800px;margin:18px 0 0;font-size:64px;line-height:.98;font-weight:950;color:#fff;letter-spacing:0;text-shadow:0 10px 30px rgba(0,0,0,.28)}
.pqhcl-sub{max-width:760px;margin:18px 0 0;color:rgba(255,255,255,.9);font-size:19px;font-weight:800;line-height:1.55}
.pqhcl-hero-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:28px}
.pqhcl-hero .pqhcl-btn{background:rgba(255,255,255,.92);border-color:rgba(255,255,255,.18)}
.pqhcl-hero .pqhcl-btn--primary{background:var(--pqh-accent,#d99a26);border-color:var(--pqh-accent,#d99a26)}
.pqhcl-band{max-width:1180px;margin:-46px auto 0;padding:0 18px 58px;position:relative;z-index:2}
.pqhcl-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
.pqhcl-card{background:#fff;border:1px solid rgba(23,48,68,.12);border-radius:8px;padding:18px;box-shadow:0 14px 34px rgba(23,48,68,.09)}
.pqhcl-card h2{margin:0;color:#241b24;font-size:18px;line-height:1.18;font-weight:950}
.pqhcl-card p{margin:10px 0 0;color:#536978;font-size:14px;line-height:1.48;font-weight:760}
.pqhcl-section{max-width:1180px;margin:0 auto;padding:0 18px 64px}
.pqhcl-split{display:grid;grid-template-columns:1.05fr .95fr;gap:28px;align-items:start}
.pqhcl-copy h2{margin:0;color:#241b24;font-size:34px;line-height:1.08;font-weight:950}
.pqhcl-copy p{margin:13px 0 0;color:#536978;font-size:16px;line-height:1.62;font-weight:760}
.pqhcl-list{display:grid;gap:10px;margin-top:18px}
.pqhcl-row{display:grid;grid-template-columns:32px minmax(0,1fr);gap:10px;align-items:start;color:#173044;font-size:15px;font-weight:850}
.pqhcl-dot{display:grid;place-items:center;width:30px;height:30px;border-radius:8px;background:#edf9ef;color:#245c35;font-weight:950}
.pqhcl-panel{background:#fff;border:1px solid rgba(23,48,68,.12);border-radius:8px;padding:22px;box-shadow:0 14px 34px rgba(23,48,68,.08)}
.pqhcl-panel h2{margin:0 0 14px;color:#241b24;font-size:22px;line-height:1.16;font-weight:950}
.pqhcl-panel-actions{display:grid;gap:10px}
.pqhcl-panel .pqhcl-btn{width:100%}
.pqhcl-muted{margin-top:14px;color:#6b7e8b;font-size:12px;font-weight:800;line-height:1.45}
@media(max-width:920px){.pqhcl-title{font-size:44px}.pqhcl-grid,.pqhcl-split{grid-template-columns:1fr 1fr}.pqhcl-band{margin-top:-32px}}
@media(max-width:680px){.pqhcl-nav-inner{display:block;padding:12px 14px}.pqhcl-links{justify-content:flex-start;margin-top:10px}.pqhcl-hero{min-height:500px}.pqhcl-title{font-size:34px}.pqhcl-sub{font-size:16px}.pqhcl-grid,.pqhcl-split{grid-template-columns:1fr}.pqhcl-band{padding-bottom:44px}.pqhcl-copy h2{font-size:28px}}

/* ============================================================
   Community-hub variant (institution consumers) — ported from the
   real ehelacademy.org marketing site's design system (same tokens,
   type, buttons, cards). The site's decorative/motion layer (WebGL
   hero canvas, Lenis smooth-scroll, scroll-triggered reveals) is
   deliberately NOT ported: this is an authenticated Moodle page, and
   that layer adds real complexity for no benefit here.
   ============================================================ */
@font-face{font-family:'Fraunces';font-style:normal;font-weight:300 700;font-display:swap;src:url('<?php echo s($fontbase); ?>Fraunces-normal-300-700.woff2') format('woff2')}
@font-face{font-family:'Fraunces';font-style:italic;font-weight:300 700;font-display:swap;src:url('<?php echo s($fontbase); ?>Fraunces-italic-300-700.woff2') format('woff2')}
@font-face{font-family:'Inter';font-style:normal;font-weight:300 700;font-display:swap;src:url('<?php echo s($fontbase); ?>Inter-normal-300-700.woff2') format('woff2')}
@font-face{font-family:'IBM Plex Mono';font-style:normal;font-weight:400;font-display:swap;src:url('<?php echo s($fontbase); ?>IBMPlexMono-normal-400.woff2') format('woff2')}
@font-face{font-family:'IBM Plex Mono';font-style:normal;font-weight:500;font-display:swap;src:url('<?php echo s($fontbase); ?>IBMPlexMono-normal-500.woff2') format('woff2')}

.pqhclh-shell{
  --white:#fff;--paper:#f6fafd;--tint:#ecf5fc;--ink:#0f2b47;--ink-soft:rgba(15,43,71,.62);
  --sky:#2e8fd6;--sky-deep:#1b6fae;--sky-glow:#8ecdf8;--night:#0a1c31;--ice:#e6f2fb;--ice-soft:rgba(230,242,251,.65);
  --line:rgba(15,43,71,.1);--radius:22px;
  --font-display:'Inter',system-ui,sans-serif;--font-serif:'Fraunces',Georgia,serif;--font-mono:'IBM Plex Mono',ui-monospace,monospace;
  background:var(--paper);color:var(--ink);font-family:var(--font-display)
}
.pqhclh-shell em{font-family:var(--font-serif);font-style:italic;font-weight:480;color:var(--sky)}
.pqhclh-wrap{max-width:1280px;margin:0 auto;padding:0 clamp(20px,5vw,72px)}
.pqhclh-eyebrow{font-family:var(--font-mono);font-size:.6875rem;font-weight:500;letter-spacing:.22em;text-transform:uppercase;color:var(--sky-deep)}
.pqhclh-hero .pqhclh-eyebrow{font-size:1.273rem;font-weight:700}

.pqhclh-nav{position:sticky;top:0;z-index:5;background:var(--sky-deep);border-bottom:1px solid var(--line);box-shadow:0 2px 12px rgba(15,43,71,.12)}
.pqhclh-nav .pqhclh-brand-name{color:#fff}
.pqhclh-nav .pqhclh-navlink{color:var(--ice-soft)!important}
.pqhclh-nav .pqhclh-navlink:hover{color:#fff!important}
.pqhclh-nav-inner{max-width:1280px;margin:0 auto;min-height:76px;padding:14px clamp(20px,5vw,72px);display:flex;align-items:center;justify-content:space-between;gap:16px}
.pqhclh-brand{display:flex;align-items:center;gap:.6em;text-decoration:none;color:var(--ink)!important}
.pqhclh-brand-mark{display:flex;flex:0 0 auto;width:44px;height:44px;border-radius:8px;overflow:hidden}
.pqhclh-brand-mark img{display:block;width:100%;height:100%;object-fit:contain}
.pqhclh-mark{display:none}
.pqhclh-brand-name{font-weight:750;font-size:1.2rem;letter-spacing:-.02em;color:var(--ink)}
.pqhclh-brand-sub{font-family:var(--font-mono);font-size:.58rem;font-weight:500;letter-spacing:.3em;color:var(--ink-soft);text-transform:uppercase}
.pqhclh-links{display:flex;align-items:center;gap:clamp(14px,2vw,28px);flex-wrap:wrap;justify-content:flex-end}
.pqhclh-navlink{font-size:.9rem;font-weight:500;color:var(--ink-soft)!important;text-decoration:none;transition:color .25s ease}
.pqhclh-navlink:hover{color:var(--ink)!important}
.pqhclh-btn{display:inline-flex;align-items:center;justify-content:center;gap:.5em;min-height:44px;padding:0 1.7em;border-radius:100px;font-size:.9rem;font-weight:600;letter-spacing:-.01em;text-decoration:none;border:1px solid transparent;white-space:nowrap}
.pqhclh-btn--primary{background:var(--sky);color:#fff!important;box-shadow:0 10px 26px rgba(46,143,214,.3)}
.pqhclh-btn--ghost{background:transparent;color:var(--ink)!important;border-color:rgba(15,43,71,.2)}
.pqhclh-btn--light{background:#fff;color:var(--night)!important}
.pqhclh-btn--small{min-height:38px;padding:0 1.2em;font-size:.82rem}

.pqhclh-banner{background:#7a2020;color:#fff}
.pqhclh-banner-inner{max-width:1280px;margin:0 auto;padding:.9em clamp(20px,5vw,72px);font-weight:600;font-size:.88rem}

.pqhclh-hero{padding:clamp(48px,8vh,84px) 0 clamp(28px,5vh,48px)}
.pqhclh-title{max-width:18ch;margin:18px 0 0;font-size:clamp(2.2rem,4.6vw,3.6rem);line-height:1.04;font-weight:700;letter-spacing:-.035em;color:var(--ink)}
.pqhclh-sub{max-width:56ch;margin:18px 0 0;color:var(--ink-soft);font-size:clamp(1rem,1.2vw,1.15rem);line-height:1.7}
.pqhclh-actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:28px}

.pqhclh-stats{list-style:none;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-top:clamp(20px,3vh,34px)}
.pqhclh-stat{background:rgba(255,255,255,.7);border:1px solid var(--line);border-radius:16px;padding:18px 20px}
.pqhclh-stat b{display:block;font-size:clamp(1.3rem,2vw,1.7rem);font-weight:700;letter-spacing:-.03em;color:var(--sky-deep)}
.pqhclh-stat span{color:var(--ink-soft);font-size:.8rem;line-height:1.4}

.pqhclh-section{padding:clamp(56px,9vh,100px) 0}
.pqhclh-section--tint{background:var(--tint)}
.pqhclh-section-head{margin-bottom:clamp(28px,5vh,48px);display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap}
.pqhclh-section-head h2{font-family:var(--font-display);font-weight:650;font-size:clamp(1.7rem,3.4vw,2.6rem);line-height:1.06;letter-spacing:-.03em;margin-top:14px;color:var(--ink)}
.pqhclh-section-head a{font-family:var(--font-mono);font-size:.72rem;font-weight:500;letter-spacing:.12em;text-transform:uppercase;color:var(--sky-deep);text-decoration:none}

.pqhclh-columns{display:grid;grid-template-columns:1fr 340px;gap:clamp(24px,3vw,40px);align-items:start}
.pqhclh-col-side{position:sticky;top:92px;display:flex;flex-direction:column;gap:20px;background:var(--tint);border-radius:var(--radius);padding:20px}
.pqhclh-block{margin-bottom:clamp(40px,6vh,64px)}
.pqhclh-block:last-child{margin-bottom:0}

.pqhclh-grid3{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:clamp(14px,1.8vw,22px)}
.pqhclh-grid4{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:clamp(14px,1.8vw,22px)}
.pqhclh-card{background:#fff;border:1px solid var(--line);border-radius:var(--radius);padding:clamp(22px,2.2vw,30px);box-shadow:0 2px 10px rgba(15,43,71,.03);transition:transform .3s ease,border-color .3s ease,box-shadow .3s ease}
.pqhclh-card:hover{transform:translateY(-6px);border-color:rgba(46,143,214,.5);box-shadow:0 18px 44px rgba(15,43,71,.09)}
.pqhclh-card--course{position:relative}
.pqhclh-num{display:block;font-family:var(--font-serif);font-style:italic;font-size:1.2rem;color:var(--sky);margin-bottom:2px}
.pqhclh-card h3{margin:0;font-size:1.05rem;font-weight:700;letter-spacing:-.02em;color:var(--ink)}
.pqhclh-card p{margin:10px 0 0;color:var(--ink-soft);font-size:.9rem;line-height:1.6}
.pqhclh-card a{display:inline-block;margin-top:14px;font-family:var(--font-mono);font-size:.68rem;font-weight:500;letter-spacing:.14em;text-transform:uppercase;color:var(--sky-deep);text-decoration:none}
.pqhclh-badge{display:inline-flex;min-height:26px;padding:0 12px;border-radius:100px;background:var(--tint);color:var(--sky-deep);font-family:var(--font-mono);font-size:.66rem;font-weight:500;letter-spacing:.1em;text-transform:uppercase;align-items:center;margin-top:12px}

.pqhclh-empty{background:#fff;border:1px dashed rgba(15,43,71,.22);border-radius:var(--radius);padding:26px;color:var(--ink-soft);font-size:.9rem;line-height:1.6}
.pqhclh-empty a{color:var(--sky-deep);font-weight:600;text-decoration:none}

.pqhclh-day{margin:26px 0 10px;font-family:var(--font-mono);font-size:.72rem;font-weight:500;letter-spacing:.14em;text-transform:uppercase;color:var(--sky-deep)}
.pqhclh-day:first-child{margin-top:0}
.pqhclh-list{list-style:none}
.pqhclh-row{display:grid;grid-template-columns:clamp(40px,5vw,60px) 1fr;gap:clamp(12px,2vw,26px);padding:18px 0;border-top:1px solid var(--line)}
.pqhclh-row:last-child{border-bottom:1px solid var(--line)}
.pqhclh-row .pqhclh-num{font-size:1.05rem}
.pqhclh-row b{display:block;font-size:.98rem;font-weight:700;color:var(--ink);letter-spacing:-.01em}
.pqhclh-row span{display:block;margin-top:4px;color:var(--ink-soft);font-size:.86rem;line-height:1.55}

.pqhclh-audience{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:clamp(14px,1.8vw,22px)}

.pqhclh-side-card{background:#fff;border:1px solid var(--line);border-radius:var(--radius);padding:clamp(20px,2vw,26px)}
.pqhclh-cal-head{display:flex;align-items:center;justify-content:space-between;margin-top:14px}
.pqhclh-cal-title{font-weight:700;font-size:.95rem;letter-spacing:-.02em;color:var(--ink)}
.pqhclh-cal-dow{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-top:14px}
.pqhclh-cal-dow span{text-align:center;font-family:var(--font-mono);font-size:.58rem;font-weight:500;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-soft)}
.pqhclh-cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-top:6px}
.pqhclh-cal-day{position:relative;aspect-ratio:1;display:flex;align-items:center;justify-content:center;border-radius:8px;font-size:.78rem;font-weight:600;color:var(--ink)}
.pqhclh-cal-day--pad{visibility:hidden}
.pqhclh-cal-day--today{background:var(--ink);color:#fff}
.pqhclh-cal-day--event:not(.pqhclh-cal-day--today){background:var(--tint);color:var(--sky-deep)}
.pqhclh-cal-day--event::after{content:'';position:absolute;bottom:3px;left:50%;transform:translateX(-50%);width:4px;height:4px;border-radius:50%;background:var(--sky)}
.pqhclh-cal-day--today.pqhclh-cal-day--event::after{background:var(--sky-glow)}
.pqhclh-cal-upcoming{margin-top:16px;padding-top:16px;border-top:1px solid var(--line);display:grid;gap:12px}
.pqhclh-cal-empty{margin-top:14px;color:var(--ink-soft);font-size:.82rem;line-height:1.5}
.pqhclh-side-item{padding:12px 0;border-top:1px solid var(--line)}
.pqhclh-side-item:first-child{border-top:0;padding-top:0}
.pqhclh-side-item b,
.pqhclh-cal-upcoming b{display:block;font-size:.84rem;font-weight:700;color:var(--ink);letter-spacing:-.01em}
.pqhclh-side-item span,
.pqhclh-cal-upcoming span{display:block;margin-top:3px;font-size:.78rem;color:var(--ink-soft);line-height:1.5}
.pqhclh-side-date{font-family:var(--font-mono);font-size:.62rem!important;letter-spacing:.08em;text-transform:uppercase;color:var(--sky-deep)!important;margin-top:6px!important}

.pqhclh-footer{border-top:1px solid var(--line);padding:clamp(36px,6vh,60px) 0 clamp(20px,3vh,32px)}
.pqhclh-footer-grid{display:grid;grid-template-columns:2fr repeat(2,1fr);gap:clamp(24px,4vw,48px)}
.pqhclh-footer-label{font-family:var(--font-mono);font-size:.64rem;font-weight:500;letter-spacing:.2em;text-transform:uppercase;color:var(--sky-deep);margin-bottom:8px;display:block}
.pqhclh-footer-col{display:flex;flex-direction:column;gap:10px}
.pqhclh-footer-col a{font-size:.88rem;color:var(--ink-soft);text-decoration:none}
.pqhclh-footer-col a:hover{color:var(--sky-deep)}
.pqhclh-footer-brand p{margin-top:10px;color:var(--ink-soft);font-size:.86rem;line-height:1.6;max-width:32ch}
.pqhclh-footer-base{margin-top:clamp(24px,4vh,40px);padding-top:18px;border-top:1px solid var(--line);font-family:var(--font-mono);font-size:.68rem;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-soft)}

@media(max-width:960px){.pqhclh-columns{grid-template-columns:1fr}.pqhclh-col-side{position:static;top:auto}}
@media(max-width:920px){.pqhclh-title{font-size:2.4rem}.pqhclh-stats{grid-template-columns:1fr 1fr}.pqhclh-footer-grid{grid-template-columns:1fr 1fr}}
@media(max-width:680px){.pqhclh-title{font-size:1.9rem}.pqhclh-sub{font-size:1rem}.pqhclh-stats{grid-template-columns:1fr}.pqhclh-footer-grid{grid-template-columns:1fr}}
</style>
<main class="pqhcl-shell<?php echo $isinstitution ? ' pqhclh-shell' : ''; ?>" style="--pqh-primary: <?php echo s($primarycolor); ?>; --pqh-accent: <?php echo s($accentcolor); ?>; --pqh-hero-image: url('<?php echo s($heroimage); ?>');">
  <?php if ($isinstitution): ?>
  <nav class="pqhclh-nav">
    <div class="pqhclh-nav-inner">
      <a class="pqhclh-brand" href="<?php echo (new moodle_url('/local/hubredirect/consumer_landing.php', $consumerparams))->out(false); ?>">
        <?php if ($brandlogo !== ''): ?>
          <span class="pqhclh-brand-mark"><img src="<?php echo s($brandlogo); ?>" alt="<?php echo s($brand); ?>"></span>
        <?php endif; ?>
        <span class="pqhclh-brand-name"><?php echo s($brand); ?></span>
      </a>
      <div class="pqhclh-links">
        <a class="pqhclh-navlink" href="<?php echo $dashboardurl->out(false); ?>">Dashboard</a>
        <a class="pqhclh-navlink" href="<?php echo $workplaceurl->out(false); ?>">Workplace</a>
        <a class="pqhclh-navlink" href="#courses">Courses</a>
        <a class="pqhclh-navlink" href="#events">Calendar</a>
        <a class="pqhclh-navlink" href="#events">Events</a>
        <a class="pqhclh-navlink" href="#announcements">Announcements</a>
        <a class="pqhclh-navlink" href="#policies">Policies</a>
        <?php if ($externalwebsiteurl !== ''): ?>
          <a class="pqhclh-navlink" href="<?php echo s($externalwebsiteurl); ?>">Institution Website</a>
        <?php endif; ?>
        <a class="pqhclh-btn pqhclh-btn--primary pqhclh-btn--small" href="<?php echo $logouturl->out(false); ?>">Logout</a>
      </div>
    </div>
  </nav>
  <?php else: ?>
  <nav class="pqhcl-nav">
    <div class="pqhcl-nav-inner">
      <a class="pqhcl-brand" href="<?php echo (new moodle_url('/local/hubredirect/consumer_landing.php', $consumerparams))->out(false); ?>">
        <span class="pqhcl-mark">
          <?php if ($brandlogo !== ''): ?>
            <img src="<?php echo s($brandlogo); ?>" alt="<?php echo s($brand); ?>">
          <?php else: ?>
            <?php echo s($brandinitial); ?>
          <?php endif; ?>
        </span>
        <span><?php echo s($brand); ?></span>
      </a>
      <div class="pqhcl-links">
        <?php if ($externalwebsiteurl !== ''): ?>
          <a class="pqhcl-btn" href="<?php echo s($externalwebsiteurl); ?>">Institution Website</a>
        <?php endif; ?>
        <a class="pqhcl-btn" href="<?php echo $marketurl->out(false); ?>">Browse Teachers</a>
        <?php if ($isprofileconsumer): ?>
          <a class="pqhcl-btn" href="<?php echo $profileurl->out(false); ?>">Profile</a>
          <a class="pqhcl-btn" href="<?php echo $profileurl->out(false); ?>#contact">Contact</a>
        <?php endif; ?>
        <a class="pqhcl-btn pqhcl-btn--primary" href="<?php echo $loginurl->out(false); ?>">Log In</a>
      </div>
    </div>
  </nav>
  <?php endif; ?>
  <?php if ($teachersubmitted): ?>
    <div class="pqhcl-alert">Thank you. Your teacher application was received and <?php echo s($brand); ?> will review it.</div>
  <?php endif; ?>

  <?php if ($isinstitution): ?>
  <?php if ($hubemergency !== ''): ?>
    <div class="pqhclh-banner"><div class="pqhclh-banner-inner"><?php echo s($hubemergency); ?></div></div>
  <?php endif; ?>
  <section class="pqhclh-hero">
    <div class="pqhclh-wrap">
      <p class="pqhclh-eyebrow">School community hub</p>
      <p class="pqhclh-sub"><?php echo s($tagline); ?></p>
      <div class="pqhclh-actions">
        <a class="pqhclh-btn pqhclh-btn--primary" href="#courses">View Courses &amp; Programs</a>
        <a class="pqhclh-btn pqhclh-btn--ghost" href="#events">Upcoming Events</a>
      </div>
      <div class="pqhclh-stats">
        <div class="pqhclh-stat"><b><?php echo count($hubcourses); ?></b><span>Open courses &amp; programs</span></div>
        <div class="pqhclh-stat"><b><?php echo count($hubevents); ?></b><span>Upcoming school events</span></div>
        <div class="pqhclh-stat"><b><?php echo count($hubannouncements); ?></b><span>Announcements</span></div>
      </div>
    </div>
  </section>

  <section class="pqhclh-section">
    <div class="pqhclh-wrap">
      <div class="pqhclh-columns">
        <div class="pqhclh-col-main">

          <div class="pqhclh-block" id="courses">
            <div class="pqhclh-section-head">
              <div><p class="pqhclh-eyebrow">The mechanics</p><h2>Courses &amp; Programs</h2></div>
              <a href="<?php echo $catalogurl->out(false); ?>">View full course catalog &rarr;</a>
            </div>
            <?php if ($hubcourses): ?>
              <div class="pqhclh-grid3">
                <?php foreach ($hubcourses as $i => $course): ?>
                  <article class="pqhclh-card pqhclh-card--course">
                    <span class="pqhclh-num"><?php echo s(str_pad((string)($i + 1), 2, '0', STR_PAD_LEFT)); ?></span>
                    <p class="pqhclh-eyebrow"><?php echo s($course['startdate'] > 0 ? 'Starts ' . userdate($course['startdate'], '%d %b %Y') : 'Ongoing enrollment'); ?></p>
                    <h3><?php echo s($course['title']); ?></h3>
                    <?php if ($course['summary'] !== ''): ?>
                      <p><?php echo s(core_text::substr($course['summary'], 0, 140)); ?><?php echo core_text::strlen($course['summary']) > 140 ? '…' : ''; ?></p>
                    <?php endif; ?>
                    <span class="pqhclh-badge"><?php echo s($course['capacity'] > 0 ? ($course['seats'] > 0 ? $course['seats'] . ' seats open' : 'Full') : 'Open enrollment'); ?></span>
                    <br><a href="<?php echo s($studenthref); ?>">Request enrollment &rarr;</a>
                  </article>
                <?php endforeach; ?>
              </div>
            <?php else: ?>
              <div class="pqhclh-empty">No courses are published for public enrollment right now. Check back soon, or <a href="<?php echo s($studenthref); ?>">submit an intake request</a> and staff will follow up.</div>
            <?php endif; ?>
          </div>

          <div class="pqhclh-block" id="policies">
            <div class="pqhclh-section-head"><div><p class="pqhclh-eyebrow">The fine print</p><h2>School Policies &amp; Training</h2></div></div>
            <div class="pqhclh-grid4">
              <?php if ($hubpolicies): ?>
                <?php foreach ($hubpolicies as $i => $policy): ?>
                  <article class="pqhclh-card">
                    <span class="pqhclh-num"><?php echo s(str_pad((string)($i + 1), 2, '0', STR_PAD_LEFT)); ?></span>
                    <h3><?php echo s(trim((string)($policy['title'] ?? ''))); ?></h3>
                    <p><?php echo s(trim((string)($policy['body'] ?? ''))); ?></p>
                  </article>
                <?php endforeach; ?>
              <?php else: ?>
                <article class="pqhclh-card"><span class="pqhclh-num">01</span><h3>Attendance &amp; Enrollment</h3><p>Enrollment requests are reviewed by staff before a seat is confirmed; capacity and open seats are shown on each course above.</p></article>
                <article class="pqhclh-card"><span class="pqhclh-num">02</span><h3>Live-Class Safety</h3><p>Live sessions require recorded consent from students or a parent/guardian, and recordings are available for review.</p></article>
                <article class="pqhclh-card"><span class="pqhclh-num">03</span><h3>Quality &amp; Coaching</h3><p>Sessions go through an internal quality review process, with coaching and follow-up when standards aren't met.</p></article>
                <article class="pqhclh-card"><span class="pqhclh-num">04</span><h3>Training &amp; Resources</h3><p>Staff and teachers can find step-by-step operating guides after logging in.</p><a href="<?php echo $howtourl->out(false); ?>">Open how-to guides &rarr;</a></article>
              <?php endif; ?>
            </div>
          </div>

          <div class="pqhclh-block">
            <div class="pqhclh-section-head"><div><p class="pqhclh-eyebrow">Everyone in one place</p><h2>For Everyone at <?php echo s($brand); ?></h2></div></div>
            <div class="pqhclh-audience">
              <article class="pqhclh-card"><span class="pqhclh-num">01</span><h3>Students &amp; Parents</h3><p>Submit an intake request, track enrollment, and follow live-class schedules and progress.</p><a href="<?php echo s($studenthref); ?>">Start intake &rarr;</a></article>
              <article class="pqhclh-card"><span class="pqhclh-num">02</span><h3>Teachers</h3><p>Apply to teach, then manage classes, attendance, and grading from the teacher workspace.</p><a href="<?php echo $teacherurl->out(false); ?>">Teacher onboarding &rarr;</a></article>
              <article class="pqhclh-card"><span class="pqhclh-num">03</span><h3>Admins &amp; Staff</h3><p>Run enrollment, courses, reporting, and day-to-day school operations from the workspace dashboard.</p><a href="<?php echo $dashboardurl->out(false); ?>">Open workspace &rarr;</a></article>
              <article class="pqhclh-card"><span class="pqhclh-num">04</span><h3>Everyone Else</h3><p>Have a question before applying or enrolling? Reach out and staff will follow up directly.</p><a href="<?php echo $inquiryurl->out(false); ?>">Contact <?php echo s($brand); ?> &rarr;</a></article>
            </div>
          </div>

        </div>

        <aside class="pqhclh-col-side">
          <div class="pqhclh-side-card" id="announcements">
            <p class="pqhclh-eyebrow">Announcements</p>
            <?php if ($hubannouncements): ?>
              <?php foreach ($hubannouncements as $note): ?>
                <?php $notedate = (int)($note['date'] ?? 0); ?>
                <div class="pqhclh-side-item">
                  <b><?php echo s(trim((string)($note['title'] ?? ''))); ?></b>
                  <span><?php echo s(trim((string)($note['body'] ?? ''))); ?></span>
                  <?php if ($notedate > 0): ?><span class="pqhclh-side-date"><?php echo s(userdate($notedate, '%d %b %Y')); ?></span><?php endif; ?>
                </div>
              <?php endforeach; ?>
            <?php else: ?>
              <p class="pqhclh-cal-empty">No announcements posted right now. Enrolled families and staff also receive updates through the workspace and by email.</p>
            <?php endif; ?>
          </div>

          <div class="pqhclh-side-card" id="events">
            <p class="pqhclh-eyebrow">Calendar</p>
            <div class="pqhclh-cal-head"><span class="pqhclh-cal-title"><?php echo s($calmonthlabel); ?></span></div>
            <div class="pqhclh-cal-dow"><span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span></div>
            <div class="pqhclh-cal-grid">
              <?php foreach ($calgrid as $week): ?>
                <?php foreach ($week as $cell): ?>
                  <?php if ($cell['day'] === null): ?>
                    <span class="pqhclh-cal-day pqhclh-cal-day--pad"></span>
                  <?php else: ?>
                    <?php
                      $cellclass = 'pqhclh-cal-day';
                      if ($cell['istoday']) { $cellclass .= ' pqhclh-cal-day--today'; }
                      if ($cell['events']) { $cellclass .= ' pqhclh-cal-day--event'; }
                      $celltitle = $cell['events'] ? implode(', ', array_map(static fn($e) => $e['title'], $cell['events'])) : '';
                    ?>
                    <span class="<?php echo s($cellclass); ?>"<?php echo $celltitle !== '' ? ' title="' . s($celltitle) . '"' : ''; ?>><?php echo (int)$cell['day']; ?></span>
                  <?php endif; ?>
                <?php endforeach; ?>
              <?php endforeach; ?>
            </div>
            <?php if ($hubevents): ?>
              <div class="pqhclh-cal-upcoming">
                <?php foreach (array_slice($hubevents, 0, 3) as $event): ?>
                  <div>
                    <b><?php echo s($event['title']); ?></b>
                    <span>
                      <?php echo s($event['start'] > 0 ? userdate($event['start'], '%d %b') : 'Date TBA'); ?><?php if ($event['body'] !== ''): ?> &mdash; <?php echo s($event['body']); ?><?php endif; ?>
                    </span>
                  </div>
                <?php endforeach; ?>
              </div>
            <?php else: ?>
              <p class="pqhclh-cal-empty">No upcoming school events posted right now.</p>
            <?php endif; ?>
          </div>
        </aside>

      </div>
    </div>
  </section>

  <footer class="pqhclh-footer">
    <div class="pqhclh-wrap">
      <div class="pqhclh-footer-grid">
        <div class="pqhclh-footer-brand">
          <span class="pqhclh-brand-name"><?php echo s($brand); ?></span>
          <p>A school community hub for students, teachers, parents, and staff.</p>
        </div>
        <nav class="pqhclh-footer-col">
          <span class="pqhclh-footer-label">This Page</span>
          <a href="#courses">Courses</a>
          <a href="#events">Events</a>
          <a href="#announcements">Announcements</a>
          <a href="#policies">Policies</a>
        </nav>
        <nav class="pqhclh-footer-col">
          <span class="pqhclh-footer-label">Access</span>
          <a href="<?php echo $dashboardurl->out(false); ?>">Dashboard</a>
          <a href="<?php echo $workplaceurl->out(false); ?>">Workplace</a>
          <a href="<?php echo $howtourl->out(false); ?>">How-To Guides</a>
        </nav>
      </div>
      <div class="pqhclh-footer-base">Ehel Academy</div>
    </div>
  </footer>
  <?php else: ?>

  <section class="pqhcl-hero">
    <div class="pqhcl-hero-inner">
      <div class="pqhcl-kicker"><?php echo s($ismarketplace ? 'Independent teaching platform' : 'Academy learning platform'); ?></div>
      <h1 class="pqhcl-title"><?php echo s($headline); ?></h1>
      <p class="pqhcl-sub"><?php echo s($tagline); ?></p>
      <div class="pqhcl-hero-actions">
        <a class="pqhcl-btn pqhcl-btn--primary" href="<?php echo s($studenthref); ?>"><?php echo s($useexternalintake ? 'Apply on Institution Website' : 'Request Teacher Services'); ?></a>
        <a class="pqhcl-btn" href="<?php echo $teacherurl->out(false); ?>">Teacher Profile Intake</a>
        <?php if ($isprofileconsumer): ?>
          <a class="pqhcl-btn" href="<?php echo $profileurl->out(false); ?>"><?php echo s($isacademy ? 'Academy Profile' : 'Institution Profile'); ?></a>
        <?php endif; ?>
        <a class="pqhcl-btn" href="<?php echo $marketurl->out(false); ?>">Explore Marketplace</a>
      </div>
    </div>
  </section>

  <section class="pqhcl-band">
    <div class="pqhcl-grid">
      <?php foreach (pqhcl_service_cards($ismarketplace, $isinstitution, $brand) as $card): ?>
        <article class="pqhcl-card">
          <h2><?php echo s($card[0]); ?></h2>
          <p><?php echo s($card[1]); ?></p>
        </article>
      <?php endforeach; ?>
    </div>
  </section>

  <section class="pqhcl-section">
    <div class="pqhcl-split">
      <div class="pqhcl-copy">
        <h2><?php echo s($ismarketplace ? 'One platform, many teaching businesses.' : 'Structured operations for live online learning.'); ?></h2>
        <p><?php echo s($ismarketplace
            ? $brand . ' is designed so independent teachers can offer services publicly while parents and institutions can find qualified teachers, request tutoring, and refer students for extra learning support.'
            : $brand . ' uses the shared EduPlatform foundation to coordinate student intake, teacher onboarding, live sessions, marketplace profiles, and parent communication.'); ?></p>
        <div class="pqhcl-list">
          <div class="pqhcl-row"><span class="pqhcl-dot">1</span><span>Public pages route visitors into the correct brand or workspace context.</span></div>
          <div class="pqhcl-row"><span class="pqhcl-dot">2</span><span>Teachers and parents can start through intake forms without needing to know the underlying system.</span></div>
          <div class="pqhcl-row"><span class="pqhcl-dot">3</span><span>Logged-in clients continue into dashboards, live sessions, courses, and student management.</span></div>
        </div>
      </div>
      <aside class="pqhcl-panel">
        <h2>Get Started</h2>
        <div class="pqhcl-panel-actions">
          <a class="pqhcl-btn pqhcl-btn--primary" href="<?php echo s($studenthref); ?>"><?php echo s($useexternalintake ? 'Apply on Institution Website' : ($ismarketplace ? 'Request Teacher Services' : 'Parent / Student Intake')); ?></a>
          <a class="pqhcl-btn" href="<?php echo $teacherurl->out(false); ?>">Independent Teacher Intake</a>
          <?php if (!$isacademy): ?>
            <a class="pqhcl-btn" href="<?php echo $marketurl->out(false); ?>">Teacher Marketplace</a>
          <?php endif; ?>
          <?php if ($isprofileconsumer): ?>
            <a class="pqhcl-btn" href="<?php echo $profileurl->out(false); ?>"><?php echo s($isacademy ? 'Academy Profile' : 'Institution Profile'); ?></a>
            <a class="pqhcl-btn" href="<?php echo $profileurl->out(false); ?>#contact">Contact <?php echo s($isacademy ? 'Academy' : 'Institution'); ?></a>
          <?php endif; ?>
          <a class="pqhcl-btn" href="<?php echo $dashboardurl->out(false); ?>">Client Dashboard</a>
        </div>
        <?php if ($support !== ''): ?>
          <p class="pqhcl-muted">Support: <?php echo s($support); ?></p>
        <?php endif; ?>
      </aside>
    </div>
  </section>
  <?php endif; ?>
</main>
<?php
echo $OUTPUT->footer();
