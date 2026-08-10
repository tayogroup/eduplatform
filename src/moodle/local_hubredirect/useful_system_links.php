<?php
declare(strict_types=1);

require_once(__DIR__ . '/../../config.php');
require_login();
require_once(__DIR__ . '/accesslib.php');

pqh_require_platform_operations('Only platform administrators can manage useful system links.');

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/hubredirect/useful_system_links.php'));
$PAGE->set_pagelayout('standard');
$PAGE->set_title('Useful System Links');
$PAGE->set_heading('Useful System Links');
$PAGE->add_body_class('pqusl-page');

const PQUSL_CONFIG_KEY = 'useful_system_links';

function pqusl_default_store(): array {
    return [
        'next_id' => 2,
        'links' => [
            [
                'id' => 1,
                'title' => 'Sample new consumer setup',
                'url' => 'https://eduplatform.ai/local/hubredirect/consumer_wizard.php',
                'description' => 'https://eduplatform.ai/local/hubredirect/consumer_wizard.php',
                'timecreated' => time(),
            ],
        ],
    ];
}

function pqusl_load_store(): array {
    $raw = (string)get_config('local_prequran', PQUSL_CONFIG_KEY);
    if ($raw === '') {
        $store = pqusl_default_store();
        pqusl_save_store($store);
        return $store;
    }
    $decoded = json_decode($raw, true);
    if (!is_array($decoded) || !isset($decoded['links']) || !is_array($decoded['links'])) {
        return ['next_id' => 1, 'links' => []];
    }
    return [
        'next_id' => (int)($decoded['next_id'] ?? (count($decoded['links']) + 1)),
        'links' => array_values($decoded['links']),
    ];
}

function pqusl_save_store(array $store): void {
    set_config(PQUSL_CONFIG_KEY, json_encode($store, JSON_UNESCAPED_SLASHES), 'local_prequran');
}

$store = pqusl_load_store();
$error = '';
$message = '';

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    require_sesskey();
    $action = optional_param('action', 'add', PARAM_ALPHA);
    try {
        if ($action === 'delete') {
            $deleteid = optional_param('linkid', 0, PARAM_INT);
            $store['links'] = array_values(array_filter($store['links'], static fn($link) => (int)$link['id'] !== $deleteid));
            pqusl_save_store($store);
            $message = 'Link removed.';
        } else {
            $title = trim(optional_param('title', '', PARAM_TEXT));
            $url = trim(optional_param('url', '', PARAM_URL));
            $description = trim(optional_param('description', '', PARAM_TEXT));
            if ($title === '' || $url === '') {
                throw new invalid_parameter_exception('Title and URL are both required.');
            }
            $store['links'][] = [
                'id' => (int)$store['next_id'],
                'title' => $title,
                'url' => $url,
                'description' => $description !== '' ? $description : $url,
                'timecreated' => time(),
            ];
            $store['next_id'] = (int)$store['next_id'] + 1;
            pqusl_save_store($store);
            $message = 'Link added.';
        }
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
}

echo $OUTPUT->header();
?>
<style>
body.pqusl-page header,body.pqusl-page footer,body.pqusl-page nav.navbar,body.pqusl-page #page-header,body.pqusl-page #page-footer,body.pqusl-page .drawer,body.pqusl-page .drawer-toggles,body.pqusl-page .block-region,body.pqusl-page [data-region="drawer"],body.pqusl-page [data-region="right-hand-drawer"]{display:none!important}
body.pqusl-page #page,body.pqusl-page #page-content,body.pqusl-page #region-main,body.pqusl-page .main-inner{margin:0!important;padding:0!important;max-width:none!important;border:0!important}
.pqusl-shell{min-height:100vh;padding:28px 18px 56px;background:#f6f8fb;color:#173044;font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif}.pqusl-wrap{max-width:960px;margin:0 auto}.pqusl-top,.pqusl-panel{padding:18px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#fff;box-shadow:0 12px 28px rgba(23,48,68,.06)}.pqusl-top{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;margin-bottom:14px}.pqusl-title{margin:0;color:#221b22;font-size:28px;font-weight:950}.pqusl-sub{margin:7px 0 0;color:#5e7280;font-size:14px;font-weight:800}.pqusl-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.pqusl-btn{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border:1px solid rgba(23,48,68,.12);border-radius:8px;background:#eef4f6;color:#173044!important;text-decoration:none;font-size:12px;font-weight:950;cursor:pointer}.pqusl-btn--primary{background:#2f6f4e;color:#fff!important;border-color:#2f6f4e}.pqusl-alert{padding:12px 14px;margin-bottom:12px;border-radius:8px;font-weight:850}.pqusl-alert--ok{background:#edf9ef;color:#245c35}.pqusl-alert--bad{background:#fff0ed;color:#883526}.pqusl-formgrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-bottom:10px}.pqusl-field{display:grid;gap:5px}.pqusl-field label{font-size:11px;font-weight:950;color:#415665;text-transform:uppercase}.pqusl-input{width:100%;min-height:38px;padding:0 10px;border:1px solid rgba(23,48,68,.18);border-radius:8px;background:#fbfdff;color:#173044;font-size:13px;font-weight:800;box-sizing:border-box}.pqusl-list{display:grid;gap:10px;margin-top:14px}.pqusl-row{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;padding:12px;border:1px solid rgba(23,48,68,.1);border-radius:8px;background:#fbfdff}.pqusl-name{display:block;color:#221b22;font-size:15px;font-weight:950;text-decoration:none}.pqusl-name:hover{text-decoration:underline}.pqusl-meta{display:block;margin-top:4px;color:#667886;font-size:12px;font-weight:800;word-break:break-all}.pqusl-empty{padding:14px;border:1px dashed rgba(23,48,68,.24);border-radius:8px;background:#fff;color:#667886;font-weight:900}
@media(max-width:700px){.pqusl-top,.pqusl-row{grid-template-columns:1fr}.pqusl-formgrid{grid-template-columns:1fr}.pqusl-actions{justify-content:flex-start}}
</style>
<style><?php echo pqh_openproject_skin_css('pqusl', 'pqusl-page'); ?></style>
<main class="pqusl-shell">
  <div class="pqusl-wrap">
    <section class="pqusl-top">
      <div>
        <h1 class="pqusl-title">Useful System Links</h1>
        <p class="pqusl-sub">Quick links to admin tools and reference pages platform administrators use often.</p>
      </div>
      <nav class="pqusl-actions">
        <a class="pqusl-btn" href="<?php echo (new moodle_url('/local/hubredirect/platform_dashboard.php'))->out(false); ?>">Dashboard</a>
      </nav>
    </section>
    <?php if ($message !== ''): ?><div class="pqusl-alert pqusl-alert--ok"><?php echo s($message); ?></div><?php endif; ?>
    <?php if ($error !== ''): ?><div class="pqusl-alert pqusl-alert--bad"><?php echo s($error); ?></div><?php endif; ?>
    <section class="pqusl-panel">
      <h2>Add a link</h2>
      <form method="post">
        <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
        <input type="hidden" name="action" value="add">
        <div class="pqusl-formgrid">
          <div class="pqusl-field"><label>Title</label><input class="pqusl-input" name="title" required></div>
          <div class="pqusl-field"><label>URL</label><input class="pqusl-input" name="url" type="url" required placeholder="https://..."></div>
          <div class="pqusl-field"><label>Description</label><input class="pqusl-input" name="description" placeholder="optional"></div>
        </div>
        <button class="pqusl-btn pqusl-btn--primary" type="submit">Add link</button>
      </form>
    </section>
    <section class="pqusl-panel">
      <h2>Links</h2>
      <?php if (!$store['links']): ?>
        <div class="pqusl-empty">No links yet.</div>
      <?php else: ?>
        <div class="pqusl-list">
          <?php foreach ($store['links'] as $link): ?>
            <div class="pqusl-row">
              <div>
                <a class="pqusl-name" href="<?php echo s((string)$link['url']); ?>" target="_blank" rel="noopener"><?php echo s((string)$link['title']); ?></a>
                <span class="pqusl-meta"><?php echo s((string)$link['description']); ?></span>
              </div>
              <form method="post">
                <input type="hidden" name="sesskey" value="<?php echo sesskey(); ?>">
                <input type="hidden" name="action" value="delete">
                <input type="hidden" name="linkid" value="<?php echo (int)$link['id']; ?>">
                <button class="pqusl-btn" type="submit">Remove</button>
              </form>
            </div>
          <?php endforeach; ?>
        </div>
      <?php endif; ?>
    </section>
  </div>
</main>
<?php
echo $OUTPUT->footer();
