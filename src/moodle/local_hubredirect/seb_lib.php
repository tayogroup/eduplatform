<?php
declare(strict_types=1);

// Safe Exam Browser (SEB) support for EduPlatform exams (Phase 1 pilot).
//
// The model: an exam page (seb_exam.php) refuses to render its content unless
// the request carries SEB's Config Key hash header, which only a genuine SEB
// session launched from our generated .seb config can produce. The config
// pins the start URL to the exam page, allows only our domains (plus the
// Bunny CDN that serves unit media), and defines a quit URL so the student
// is released cleanly when the exam ends.
//
// The Config Key math (canonicalising the config into a hash) is deliberately
// NOT reimplemented here: Moodle core ships it in quizaccess_seb, and this
// library reuses those classes. Requires Moodle 3.9+ (we run 5.0).
//
// Exams are defined in the pqh_seb_exams() registry below for the pilot;
// Phase 2 replaces the registry with teacher-created exams.

function pqh_seb_exams(): array {
    return [
        // Pilot exam wired to the existing alphabet quiz unit, which the
        // lesson player can serve today for any enrolled student.
        'quraan-alphabet-quiz' => [
            'title' => 'Alphabet Quiz - Supervised Exam',
            'description' => 'Pilot Safe Exam Browser assessment using the alphabet quiz unit.',
            'embedurl' => '/local/hubredirect/issue_child.php?goto=alphabet_quiz&managed_student=0',
            'duration' => 30,
            'quitpassword' => 'ehel-unlock',
            'allow' => ['*.b-cdn.net/*'],
        ],
        // English and Mathematics exams: set embedurl to the production URL
        // of the assessment experience once it is decided where those
        // programs are served. The launch page explains the gap until then.
        'english-grade1-exam' => [
            'title' => 'English Grade 1 - Term Exam',
            'description' => 'Safe Exam Browser assessment for the English grade 1 program.',
            'embedurl' => '',
            'duration' => 40,
            'quitpassword' => 'ehel-unlock',
            'allow' => ['*.b-cdn.net/*'],
        ],
        'math-grade1-exam' => [
            'title' => 'Mathematics Grade 1 - Term Exam',
            'description' => 'Safe Exam Browser assessment for the Mathematics grade 1 program.',
            'embedurl' => '',
            'duration' => 40,
            'quitpassword' => 'ehel-unlock',
            'allow' => ['*.b-cdn.net/*'],
        ],
    ];
}

function pqh_seb_exam(string $examid): ?array {
    $exams = pqh_seb_exams();
    return $exams[$examid] ?? null;
}

function pqh_seb_exam_url(string $examid): moodle_url {
    return new moodle_url('/local/hubredirect/seb_exam.php', ['examid' => $examid]);
}

function pqh_seb_config_download_url(string $examid): moodle_url {
    return new moodle_url('/local/hubredirect/seb_config.php', ['examid' => $examid]);
}

function pqh_seb_quit_url(string $examid): string {
    return (new moodle_url('/local/hubredirect/seb_exam_unlock.php', ['examid' => $examid]))->out(false);
}

// ---------------------------------------------------------------------------
// Config (.seb plist) generation. Deterministic for a given exam + wwwroot,
// so the Config Key can be recomputed statelessly on every request.
// ---------------------------------------------------------------------------

function pqh_seb_plist_value($value): string {
    if (is_bool($value)) {
        return $value ? '<true/>' : '<false/>';
    }
    if (is_int($value)) {
        return '<integer>' . $value . '</integer>';
    }
    if (is_array($value)) {
        $islist = array_keys($value) === range(0, count($value) - 1);
        if ($islist) {
            $out = "<array>";
            foreach ($value as $item) {
                $out .= pqh_seb_plist_value($item);
            }
            return $out . "</array>";
        }
        $out = "<dict>";
        foreach ($value as $key => $item) {
            $out .= '<key>' . htmlspecialchars((string)$key, ENT_XML1) . '</key>' . pqh_seb_plist_value($item);
        }
        return $out . "</dict>";
    }
    return '<string>' . htmlspecialchars((string)$value, ENT_XML1) . '</string>';
}

function pqh_seb_config_xml(string $examid): string {
    global $CFG;
    $exam = pqh_seb_exam($examid);
    if (!$exam) {
        throw new invalid_parameter_exception('Unknown SEB exam.');
    }
    $host = parse_url($CFG->wwwroot, PHP_URL_HOST) ?: '';

    $rules = [];
    $allowexpressions = array_merge([$host . '/*'], (array)($exam['allow'] ?? []));
    foreach ($allowexpressions as $expression) {
        $rules[] = [
            'action' => 1,
            'active' => true,
            'expression' => (string)$expression,
        ];
    }

    $config = [
        'originatorVersion' => 'EduPlatform_SEB_1.0',
        'startURL' => pqh_seb_exam_url($examid)->out(false),
        'sendBrowserExamKey' => true,
        'quitURL' => pqh_seb_quit_url($examid),
        'quitURLConfirm' => false,
        'allowQuit' => true,
        'hashedQuitPassword' => hash('sha256', (string)($exam['quitpassword'] ?? 'ehel-unlock')),
        'URLFilterEnable' => true,
        'URLFilterEnableContentFilter' => false,
        'URLFilterRules' => $rules,
        'browserWindowAllowReload' => true,
        'showReloadButton' => true,
        'showTime' => true,
    ];

    return '<?xml version="1.0" encoding="UTF-8"?>'
        . '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">'
        . '<plist version="1.0">'
        . pqh_seb_plist_value($config)
        . '</plist>';
}

function pqh_seb_engine_ready(): bool {
    return class_exists('\quizaccess_seb\config_key');
}

function pqh_seb_config_key(string $examid): string {
    if (!pqh_seb_engine_ready()) {
        throw new moodle_exception('generalexceptionmessage', 'error', '',
            'Moodle SEB engine (quizaccess_seb) is not available on this installation.');
    }
    return \quizaccess_seb\config_key::generate(pqh_seb_config_xml($examid))->get_hash();
}

// ---------------------------------------------------------------------------
// Request verification. SEB sends X-SafeExamBrowser-ConfigKeyHash =
// SHA256(absolute request URL without fragment . configKey) on every request.
// ---------------------------------------------------------------------------

function pqh_seb_header_hash(): string {
    return strtolower(trim((string)($_SERVER['HTTP_X_SAFEEXAMBROWSER_CONFIGKEYHASH'] ?? '')));
}

function pqh_seb_request_verified(string $examid): bool {
    $header = pqh_seb_header_hash();
    if ($header === '') {
        return false;
    }
    $url = qualified_me();
    if ($url === false || $url === '') {
        return false;
    }
    try {
        $configkey = pqh_seb_config_key($examid);
    } catch (Throwable $e) {
        return false;
    }
    return hash_equals(hash('sha256', $url . $configkey), $header);
}

// ---------------------------------------------------------------------------
// Audit: reuse the live-audit table (sessionid 0, seb_* actions) so exam
// activity sits in the same trail as everything else on the platform.
// ---------------------------------------------------------------------------

function pqh_seb_audit(string $action, string $examid, array $details = []): void {
    global $DB, $USER;
    if (!function_exists('pqh_table_exists_safe') || !pqh_table_exists_safe('local_prequran_live_audit')) {
        return;
    }
    $DB->insert_record('local_prequran_live_audit', (object)[
        'sessionid' => 0,
        'actorid' => (int)$USER->id,
        'action' => $action,
        'targettype' => 'seb_exam',
        'targetid' => 0,
        'details' => json_encode(['examid' => $examid] + $details),
        'timecreated' => time(),
    ]);
}
