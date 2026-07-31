<?php
declare(strict_types=1);

// The syllabus as a page. ONE url for every audience:
//
//   approved + public      -> anyone, no login at all (the admissions case)
//   approved + enrolled    -> the course's students and their staff
//   anything else          -> workspace staff only, as a draft preview
//
// Every refusal returns the SAME wording so the page can never be used to
// enumerate which courses a school runs.
//
//   /local/hubredirect/syllabus_view.php?course=ehel-eng-g01[&year=2026]

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/accesslib.php');
require_once(__DIR__ . '/syllabus_portallib.php');

$courseref = optional_param('course', '', PARAM_RAW_TRIMMED);
$year = optional_param('year', 0, PARAM_INT);

$viewerid = isloggedin() && !isguestuser() ? (int)$USER->id : 0;

// Anonymous traffic is throttled per IP: this endpoint is reachable without a
// session, so it must not become a cheap way to probe the install.
if ($viewerid <= 0 && pqh_ip_rate_limited('syllabus_public', 60, 60)) {
    http_response_code(429);
    echo 'Too many requests. Please try again in a minute.';
    exit;
}

$consumer = pqh_resolve_consumer_context();
$brand = trim((string)($consumer->consumername ?? '')) !== ''
    ? (string)$consumer->consumername : 'EduPlatform';

$course = pqsyl_resolve_course($courseref);
if ($year <= 0) {
    $year = pqsyl_current_year($course ? (int)($DB->get_field('local_prequran_syllabus', 'workspaceid',
        ['moodlecourseid' => (int)$course->id], IGNORE_MULTIPLE) ?: 0) : 0);
}

$allowed = false;
$ispublic = false;
$row = null;
if ($course) {
    [$allowed, $ispublic, $row] = pqsyl_can_read((int)$course->id, $year, $viewerid);
}

$title = $allowed && $course ? ($course->fullname . ' · Syllabus') : 'Syllabus';

header('Content-Type: text/html; charset=utf-8');
if ($allowed && $ispublic) {
    // A public syllabus is a marketing document: let it be cached and indexed.
    header('Cache-Control: public, max-age=600');
} else {
    header('Cache-Control: private, no-store');
    header('X-Robots-Tag: noindex');
}

$body = '';
if ($allowed && $course && $row) {
    $body = pqsyl_render_html($row, $course, ['public' => $ispublic]);
    $pdfurl = new moodle_url('/local/hubredirect/syllabus_pdf.php',
        ['course' => (string)($course->idnumber !== '' ? $course->idnumber : $course->id), 'year' => $year]);
    $body .= '<p class="actions"><a class="btn" href="' . s($pdfurl->out(false)) . '">Download PDF</a>'
        . ' <button class="btn" type="button" onclick="window.print()">Print</button></p>';
} else {
    $body = '<h1>Syllabus not available</h1>'
        . '<p>This syllabus has not been published. If you are a parent or student at this school, '
        . 'please sign in first — or ask the school office.</p>';
    if ($viewerid <= 0) {
        $loginurl = new moodle_url('/login/index.php');
        $body .= '<p class="actions"><a class="btn" href="' . s($loginurl->out(false)) . '">Sign in</a></p>';
    }
}
?><!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title><?php echo s($title); ?></title>
<style>
  :root{--ink:#12263a;--ink2:#3f5872;--muted:#6b7f93;--line:#d8e2ec;--bg:#f4f7fa;--card:#fff;--blue:#17324d;--blue2:#2a6cb0;--sky:#e8f1fa}
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.6 system-ui,-apple-system,"Segoe UI",Arial,sans-serif}
  header.top{background:var(--blue);color:#fff;padding:16px 0}
  .wrap{width:min(880px,calc(100% - 32px));margin:0 auto}
  .brand{font-weight:800;font-size:18px}
  .brand small{display:block;font-weight:600;font-size:12px;color:#b9cbdd;margin-top:2px}
  main{padding:26px 0 60px}
  .sheet{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:28px 32px}
  h1{margin:0 0 4px;font-size:26px;line-height:1.25}
  h2{margin:26px 0 8px;font-size:18px;color:var(--blue)}
  h3{margin:14px 0 4px;font-size:15px}
  p{margin:0 0 12px}
  p.meta{color:var(--muted);font-size:13px;margin-bottom:18px}
  table{width:100%;border-collapse:collapse;margin:8px 0 4px}
  table.kv th{width:190px;text-align:left;color:var(--ink2);font-size:13px;font-weight:700;padding:6px 8px 6px 0;vertical-align:top}
  table.kv td{padding:6px 0;font-size:14px}
  table.grid th,table.grid td{border-bottom:1px solid var(--line);padding:8px;text-align:left;font-size:14px}
  table.grid th{font-size:11px;text-transform:uppercase;letter-spacing:.4px;color:var(--ink2)}
  .unit{border-left:3px solid var(--sky);padding:2px 0 2px 14px;margin:10px 0}
  .unit ul{margin:6px 0 0;padding-left:20px}
  .unit li{margin-bottom:4px;font-size:15px}
  .tag{display:inline-block;padding:2px 8px;border-radius:999px;background:var(--sky);color:var(--ink2);font-size:11px;font-weight:700}
  .actions{margin-top:28px}
  .btn{display:inline-block;padding:9px 16px;border:1px solid var(--line);border-radius:8px;background:var(--sky);color:var(--blue2);text-decoration:none;font-weight:700;font-size:14px;cursor:pointer;margin-right:6px}
  @media print{header.top{background:none;color:#000;padding:0 0 12px;border-bottom:1px solid #999}
    .brand small{color:#444}body{background:#fff}.sheet{border:0;padding:0}.actions{display:none}}
</style>
</head>
<body>
<header class="top"><div class="wrap">
  <div class="brand"><?php echo s($brand); ?><small>Course syllabus</small></div>
</div></header>
<main class="wrap"><div class="sheet">
<?php echo $body; ?>
</div></main>
</body>
</html>
