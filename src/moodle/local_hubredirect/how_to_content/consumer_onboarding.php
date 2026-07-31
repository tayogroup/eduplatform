<?php
declare(strict_types=1);

defined('MOODLE_INTERNAL') || die();
?>
<style>
  :root{
    --paper:#f7f4ec;
    --paper-raised:#fffdf8;
    --ink:#16261f;
    --ink-soft:#4d6358;
    --ink-faint:#7c8d81;
    --line:#ddd5bf;
    --line-strong:#c9bd9d;
    --green:#2f6f4e;
    --green-soft:#e4efe6;
    --gold:#a5741e;
    --gold-soft:#f4e6c8;
    --slate:#3f5872;
    --slate-soft:#e4eaf0;
    --red:#9a3d2d;
    --red-soft:#f6e2dc;
    --radius:10px;
    --serif:Iowan Old Style,Palatino Linotype,Palatino,Georgia,serif;
    --sans:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;
    --mono:ui-monospace,SFMono-Regular,Menlo,Consolas,"Liberation Mono",monospace;
  }
  @media (prefers-color-scheme: dark){
    :root{
      --paper:#121d17;
      --paper-raised:#16241c;
      --ink:#e8e3d3;
      --ink-soft:#9fb0a4;
      --ink-faint:#6d7f73;
      --line:#2a3a30;
      --line-strong:#3a4c40;
      --green:#74c096;
      --green-soft:#1c3327;
      --gold:#dcaa54;
      --gold-soft:#3a301a;
      --slate:#8ba7c4;
      --slate-soft:#1e2c3a;
      --red:#e08876;
      --red-soft:#3a2420;
    }
  }
  :root[data-theme="dark"]{
    --paper:#121d17;
    --paper-raised:#16241c;
    --ink:#e8e3d3;
    --ink-soft:#9fb0a4;
    --ink-faint:#6d7f73;
    --line:#2a3a30;
    --line-strong:#3a4c40;
    --green:#74c096;
    --green-soft:#1c3327;
    --gold:#dcaa54;
    --gold-soft:#3a301a;
    --slate:#8ba7c4;
    --slate-soft:#1e2c3a;
    --red:#e08876;
    --red-soft:#3a2420;
  }
  :root[data-theme="light"]{
    --paper:#f7f4ec;
    --paper-raised:#fffdf8;
    --ink:#16261f;
    --ink-soft:#4d6358;
    --ink-faint:#7c8d81;
    --line:#ddd5bf;
    --line-strong:#c9bd9d;
    --green:#2f6f4e;
    --green-soft:#e4efe6;
    --gold:#a5741e;
    --gold-soft:#f4e6c8;
    --slate:#3f5872;
    --slate-soft:#e4eaf0;
    --red:#9a3d2d;
    --red-soft:#f6e2dc;
  }

  *{box-sizing:border-box}
  body{
    margin:0;
    background:var(--paper);
    color:var(--ink);
    font-family:var(--sans);
    font-size:15px;
    line-height:1.6;
    -webkit-font-smoothing:antialiased;
  }
  .wrap{max-width:860px;margin:0 auto;padding:52px 24px 100px}

  .masthead{margin-bottom:44px}
  .eyebrow{
    font-family:var(--mono);
    font-size:11.5px;
    letter-spacing:.09em;
    text-transform:uppercase;
    color:var(--green);
    display:flex;align-items:center;gap:10px;
    margin-bottom:14px;
  }
  .eyebrow::before{content:"";width:20px;height:1px;background:var(--green)}
  h1{
    font-family:var(--serif);
    font-weight:600;
    font-size:clamp(30px,4vw,42px);
    line-height:1.12;
    margin:0 0 14px;
    text-wrap:balance;
    letter-spacing:-.01em;
  }
  .dek{
    max-width:62ch;
    color:var(--ink-soft);
    font-size:16.5px;
    line-height:1.65;
    margin:0 0 26px;
  }
  .legend{
    display:flex;flex-wrap:wrap;gap:8px;
    padding-top:20px;border-top:1px solid var(--line);
  }
  .tag{
    display:inline-flex;align-items:center;gap:7px;
    font-family:var(--mono);font-size:11.5px;letter-spacing:.03em;
    padding:5px 10px 5px 8px;border-radius:999px;
    border:1px solid var(--line-strong);color:var(--ink-soft);
    background:var(--paper-raised);
  }
  .dot{width:7px;height:7px;border-radius:50%;flex:none}
  .dot.platform{background:var(--green)}
  .dot.external{background:var(--slate)}
  .dot.consumer{background:var(--gold)}
  .dot.system{background:var(--ink-faint)}

  .phase{
    display:grid;
    grid-template-columns:56px 1fr;
    gap:22px;
    padding:30px 0;
    border-top:1px solid var(--line);
  }
  .phase:first-of-type{border-top:2px solid var(--line-strong)}
  .phase-num{
    font-family:var(--serif);
    font-size:30px;
    color:var(--line-strong);
    line-height:1;
    padding-top:2px;
    font-variant-numeric:tabular-nums;
  }
  .phase-head{display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;margin-bottom:8px}
  .phase-title{font-family:var(--serif);font-size:23px;font-weight:600;margin:0;letter-spacing:-.005em}
  .phase-intro{color:var(--ink-soft);margin:0 0 18px;max-width:62ch}

  .step{
    display:grid;
    grid-template-columns:128px 1fr;
    gap:16px;
    padding:14px 0;
    border-top:1px solid var(--line);
  }
  .step:first-child{border-top:none;padding-top:2px}
  .actor{
    font-family:var(--mono);font-size:11px;letter-spacing:.04em;text-transform:uppercase;
    color:var(--ink-faint);padding-top:2px;
  }
  .actor b{display:block;color:var(--ink-soft);font-weight:600;font-size:11.5px;margin-bottom:3px}
  .step-body p{margin:0 0 6px;max-width:60ch}
  .step-body p:last-child{margin-bottom:0}
  .ref{
    font-family:var(--mono);font-size:12.5px;color:var(--green);
    background:var(--green-soft);border-radius:5px;padding:1px 6px;
    white-space:nowrap;
  }
  a.ref{text-decoration:none}
  a.ref:hover{text-decoration:underline}
  code{font-family:var(--mono);font-size:12.5px;background:var(--paper-raised);border:1px solid var(--line);border-radius:5px;padding:1px 6px}

  .fork{
    margin:18px 0 6px;
    border:1px solid var(--line-strong);
    border-radius:var(--radius);
    overflow:hidden;
    background:var(--paper-raised);
  }
  .fork-label{
    font-family:var(--mono);font-size:11px;letter-spacing:.06em;text-transform:uppercase;
    color:var(--ink-faint);padding:10px 16px;border-bottom:1px solid var(--line);
  }
  .fork-branches{display:grid;grid-template-columns:1fr 1fr}
  .branch{padding:16px;border-left:1px solid var(--line)}
  .branch:first-child{border-left:none}
  .branch.ok{background:linear-gradient(var(--green-soft),transparent 70%)}
  .branch.bad{background:linear-gradient(var(--red-soft),transparent 70%)}
  .branch.warn{background:linear-gradient(var(--gold-soft),transparent 70%)}
  .branch-head{
    display:flex;align-items:center;gap:7px;
    font-family:var(--mono);font-size:12px;font-weight:600;letter-spacing:.02em;
    margin-bottom:8px;
  }
  .branch-head.ok{color:var(--green)}
  .branch-head.bad{color:var(--red)}
  .branch-head.warn{color:var(--gold)}
  .branch p{margin:0 0 5px;font-size:14px;color:var(--ink-soft)}
  .branch p:last-child{margin-bottom:0}
  .branch p.result{color:var(--ink);font-weight:500}

  .callout{
    margin:14px 0 4px;
    padding:13px 16px;
    border:1px dashed var(--line-strong);
    border-radius:var(--radius);
    background:var(--slate-soft);
    font-size:13.5px;
    color:var(--ink-soft);
  }
  .callout b{color:var(--slate);font-family:var(--mono);font-size:11px;letter-spacing:.04em;text-transform:uppercase;display:block;margin-bottom:5px}

  .pill{
    display:inline-flex;font-family:var(--mono);font-size:11.5px;
    padding:1px 7px;border-radius:999px;border:1px solid var(--line-strong);
    color:var(--ink-soft);
  }

  .codeblock{
    margin:14px 0 6px;
    padding:14px 16px;
    background:var(--paper-raised);
    border:1px solid var(--line);
    border-radius:var(--radius);
    overflow-x:auto;
  }
  .codeblock pre{margin:0;font-family:var(--mono);font-size:12.5px;line-height:1.65;color:var(--ink-soft);white-space:pre}
  .codeblock .added{color:var(--green);font-weight:600}
  .codeblock .caption{
    font-family:var(--mono);font-size:11px;letter-spacing:.04em;text-transform:uppercase;
    color:var(--ink-faint);margin-bottom:9px;
  }

  footer{
    margin-top:50px;padding-top:22px;border-top:1px solid var(--line);
    color:var(--ink-faint);font-size:12.5px;font-family:var(--mono);
  }

  @media (max-width:640px){
    .phase{grid-template-columns:1fr}
    .phase-num{display:none}
    .step{grid-template-columns:1fr}
    .fork-branches{grid-template-columns:1fr}
    .branch:first-child{border-left:none;border-bottom:1px solid var(--line)}
  }
</style>

<div class="wrap">

  <div class="masthead">
    <div class="eyebrow">EduPlatform &middot; Operations Reference</div>
    <h1>From a name and a domain to a live consumer</h1>
    <p class="dek">Bringing a new academy, institution, marketplace, or teacher workspace onto EduPlatform &mdash; from the wizard that creates its record, through DNS and SSL, optionally grouping it under (or linking it to) a parent that owns other consumers, to the first admin signing in on their own branded domain.</p>
    <div class="legend">
      <span class="tag"><span class="dot platform"></span>Platform admin</span>
      <span class="tag"><span class="dot external"></span>DNS / hosting (external)</span>
      <span class="tag"><span class="dot consumer"></span>Consumer's own admin</span>
      <span class="tag"><span class="dot system"></span>System</span>
    </div>
  </div>

  <!-- PHASE 1 -->
  <section class="phase">
    <div class="phase-num">1</div>
    <div>
      <div class="phase-head"><h2 class="phase-title">Create the consumer record</h2></div>
      <p class="phase-intro">A four-step wizard that a platform admin runs once, entirely inside EduPlatform.</p>

      <div class="step">
        <div class="actor"><b>Platform admin</b>opens</div>
        <div class="step-body">
          <p>The Consumer Creation Wizard, reached from Platform Consumers.</p>
          <p><a class="ref" href="https://eduplatform.ai/local/hubredirect/consumer_wizard.php" target="_blank" rel="noopener">https://eduplatform.ai/local/hubredirect/consumer_wizard.php</a></p>
        </div>
      </div>
      <div class="step">
        <div class="actor"><b>Platform admin</b>steps through</div>
        <div class="step-body">
          <p><strong>Consumer type</strong> &mdash; academy brand, institution, marketplace, or teacher workspace.<br>
          <strong>Identity &amp; admin</strong> &mdash; name, workspace, and the first owner (existing user, or a new one created on the spot).<br>
          <strong>Branding &amp; landing</strong> &mdash; logo, colors, support email, plan limits, and starting courses.</p>
        </div>
      </div>

      <div class="step">
        <div class="actor"><b>Platform admin</b>website &amp; domains</div>
        <div class="step-body">
          <p>The one choice that changes everything downstream: does this consumer's public face live on EduPlatform, or do they already have their own website? <span class="ref">pqhi_consumer_website_profile()</span> locks or frees the rest of these fields based on that single answer.</p>
        </div>
      </div>

      <div class="fork">
        <div class="fork-label">Website mode</div>
        <div class="fork-branches" style="grid-template-columns:1fr">
          <div class="branch" style="border-left:none">
            <div class="branch-head" style="color:var(--ink-soft)">EduPlatform hosted website</div>
            <p><strong>publicdomain</strong> required &mdash; this domain serves EduPlatform's own generated landing page.<br>
            <strong>appdomain</strong> required &mdash; the separate learning-portal subdomain.<br>
            <strong>externalwebsiteurl</strong> cleared, unused.<br>
            Branding source, intake location, and integration method are all force-set to the EduPlatform defaults &mdash; nothing left to configure.</p>
          </div>
        </div>
      </div>

      <div class="fork">
        <div class="fork-label">Website mode &mdash; consumer already has their own site</div>
        <div class="fork-branches">
          <div class="branch">
            <div class="branch-head" style="color:var(--gold)">External website</div>
            <p><strong>externalwebsiteurl</strong> required &mdash; their real site, e.g. <code>https://www.myacademy.org</code>. Saving fails without it.</p>
            <p><strong>appdomain</strong> still required &mdash; dashboards and course access still live on an EduPlatform subdomain even when the landing page doesn't.</p>
            <p><strong>publicdomain</strong> no longer the public face &mdash; their existing site is.</p>
            <p><strong>brandingsource</strong>: EduPlatform defaults, or <em>match the external website's</em> colors and logo.</p>
            <p><strong>intakelocation</strong>: EduPlatform-hosted intake, or a page on their own site.</p>
            <p><strong>integrationmethod</strong>: plain links, embedded widgets, or API.</p>
            <p><strong>returnurl</strong>: where EduPlatform sends a visitor back to on their site once intake finishes &mdash; e.g. a "thank you" page.</p>
          </div>
          <div class="branch">
            <div class="branch-head" style="color:var(--gold)">External, with embeds</div>
            <p>Same <strong>externalwebsiteurl</strong> requirement as above.</p>
            <p><strong>intakelocation</strong> and <strong>integrationmethod</strong> are force-set to <em>embedded</em> &mdash; EduPlatform's own intake form and widgets render directly inside their pages via iframe, not linked out to.</p>
            <p><strong>brandingsource</strong> stays a free choice.</p>
          </div>
        </div>
      </div>

      <div class="callout"><b>What makes embedding actually work</b>An iframe of EduPlatform content is normally blocked by <code>X-Frame-Options</code>. In embedded mode, the platform instead sets a <code>Content-Security-Policy: frame-ancestors</code> scoped to the exact scheme and host of that one <code>externalwebsiteurl</code> &mdash; framing opens for that consumer's own site only, never generally. <span class="ref">pqh_apply_consumer_embed_headers()</span></div>

      <div class="step">
        <div class="actor"><b>System</b>on save</div>
        <div class="step-body">
          <p>Creates the workspace, the consumer record, the owner/admin membership, and rows for each domain &mdash; all in one transaction.</p>
          <p><span class="ref">pqhi_create_workspace_for_consumer()</span> &middot; <span class="ref">pqhi_upsert_consumer_app()</span> &middot; <span class="ref">pqhi_sync_consumer_domain()</span></p>
        </div>
      </div>
      <div class="callout"><b>Not live yet</b>The domain rows exist in the database, but nothing resolves at that address until DNS actually points there. The record is ready; the address isn't &mdash; and for a consumer using their own existing site, only the <code>appdomain</code> needs DNS pointed at the platform at all; their main domain keeps resolving wherever it already does.</div>
      <div class="callout"><b>Setting up a parent that owns other consumers?</b>Run this wizard once per entity &mdash; the parent first, then each child &mdash; before touching DNS. Each one is still a fully independent consumer with its own domain, workspace, and admin; the parent/child relationship itself is a separate step, in Phase 7.</div>
    </div>
  </section>

  <!-- PHASE 2 -->
  <section class="phase">
    <div class="phase-num">2</div>
    <div>
      <div class="phase-head"><h2 class="phase-title">Point DNS at the platform</h2></div>
      <p class="phase-intro">Outside EduPlatform entirely &mdash; at the registrar or DNS host the consumer's domain actually uses. Every host from this phase has to be right before AutoSSL in Phase 3 has any chance of succeeding.</p>

      <div class="step">
        <div class="actor"><b>Platform admin</b>finds the target IP</div>
        <div class="step-body">
          <p>Don't guess the hosting server's address &mdash; look it up from a domain that's already working.</p>
          <div class="codeblock">
            <div class="caption">confirm the known-good target</div>
            <pre>nslookup quraantest.academy
&hellip;
Addresses:  <span class="added">198.38.90.19</span></pre>
          </div>
          <p>That address is the target every new consumer host below should resolve to.</p>
        </div>
      </div>

      <div class="step">
        <div class="actor"><b>External</b>DNS records</div>
        <div class="step-body">
          <p>At the registrar or DNS host the domain actually uses, set an <code>A</code> record for each host this consumer needs &mdash; typically the bare domain, <code>www</code>, and <code>app</code>:</p>
          <div class="codeblock">
            <div class="caption">example &mdash; three A records, one target</div>
            <pre>quraanacademy.org       A   198.38.90.19
www.quraanacademy.org   A   198.38.90.19
app.quraanacademy.org   A   198.38.90.19</pre>
          </div>
        </div>
      </div>

      <div class="callout"><b>Check the spelling before anything else</b>A one-letter typo in the domain (<code>quraan<u>c</u>ademy.org</code> instead of <code>quraan<u>a</u>cademy.org</code>) produces a plain <code>DNS_PROBE_FINISHED_NXDOMAIN</code> in the browser with no other clue &mdash; it looks like a platform failure but is just a misspelled host. Confirm the exact string in every record, in cPanel, and in every link, before troubleshooting anything else.</div>

      <div class="step">
        <div class="actor"><b>Platform admin</b>cPanel</div>
        <div class="step-body">
          <p>Add the domain(s) under Domains, pointing at the same document root every other consumer shares. No redirect to another consumer's domain.</p>
        </div>
      </div>

      <div class="fork">
        <div class="fork-label">If the domain's DNS is managed through Cloudflare</div>
        <div class="fork-branches">
          <div class="branch bad">
            <div class="branch-head bad">&#10007; Proxied (orange cloud)</div>
            <p>The A record points at Cloudflare's edge, not the server &mdash; SSL validation and every downstream step fail. This is exactly what happened in practice:</p>
            <div class="codeblock">
              <pre>nslookup quraanacademy.org
&hellip;
Addresses:  104.21.7.19
            172.67.155.99   &larr; Cloudflare, not the server</pre>
            </div>
          </div>
          <div class="branch ok">
            <div class="branch-head ok">&#10003; DNS-only (grey cloud)</div>
            <p>Toggle the record to DNS-only in Cloudflare's dashboard. Traffic then reaches <code>198.38.90.19</code> directly, matching every other working consumer host.</p>
          </div>
        </div>
      </div>

      <div class="step">
        <div class="actor"><b>Platform admin</b>confirms</div>
        <div class="step-body">
          <p>Before moving to Phase 3, re-run the same lookup against the new host and check the address matches the target from step one exactly &mdash; not a Cloudflare range, not a registrar parking page.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- PHASE 3 -->
  <section class="phase">
    <div class="phase-num">3</div>
    <div>
      <div class="phase-head"><h2 class="phase-title">Issue SSL</h2></div>
      <p class="phase-intro">Gated entirely on Phase 2 landing correctly.</p>

      <div class="fork">
        <div class="fork-label">AutoSSL domain control validation</div>
        <div class="fork-branches">
          <div class="branch bad">
            <div class="branch-head bad">&#10007; Fails</div>
            <p>Usually the DNS-vs-server-IP mismatch from Phase 2, or a missing DNS TXT record. The error names the wrong IP it found.</p>
            <p class="result">Fix the DNS, then re-run AutoSSL.</p>
          </div>
          <div class="branch ok">
            <div class="branch-head ok">&#10003; Succeeds</div>
            <p>A certificate is issued covering the bare, <code>www</code>, and <code>app</code> hosts.</p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- PHASE 4 -->
  <section class="phase">
    <div class="phase-num">4</div>
    <div>
      <div class="phase-head"><h2 class="phase-title">Whitelist the host in the platform's config</h2></div>
      <p class="phase-intro">A direct edit to the live <code>config.php</code> on the server &mdash; the one step in this whole runbook that isn't done through a EduPlatform screen.</p>

      <div class="step">
        <div class="actor"><b>Platform admin</b>locates the lines</div>
        <div class="step-body">
          <p>Before editing blind on production, a read-only diagnostic prints just the host/wwwroot-related lines of the live <code>config.php</code> &mdash; credentials are filtered out, never shown.</p>
          <p><a class="ref" href="https://eduplatform.ai/local/hubredirect/config_host_check.php" target="_blank" rel="noopener">https://eduplatform.ai/local/hubredirect/config_host_check.php</a><code>?k=&lt;key&gt;</code></p>
          <p class="phase-intro" style="margin:6px 0 0">The <code>k</code> value is a secret access key, not shown here &mdash; get it from wherever your team keeps that credential.</p>
        </div>
      </div>
      <div class="step">
        <div class="actor"><b>Platform admin</b>edits config.php</div>
        <div class="step-body">
          <p>Add every host from Phase 2 to the allow-list that decides <code>$CFG->wwwroot</code> per request.</p>
          <div class="codeblock">
            <div class="caption">config.php &mdash; host allow-list</div>
            <pre>$customdomainallowedhosts = [
    'eduplatform.ai',
    'www.eduplatform.ai',
    'app.eduplatform.ai',
    'quraantest.academy',
    'quraan.academy',
    'quraanacademy.info',
    'edufortomorrow.com',
    'www.edufortomorrow.com',
    'app.edufortomorrow.com',
    <span class="added">'quraanacademy.org',        // new</span>
    <span class="added">'app.quraanacademy.org',    // new</span>
];</pre>
          </div>
        </div>
      </div>
      <div class="callout"><b>Why this matters</b>Without it, every absolute link the platform builds on that domain quietly falls back to the foundation domain instead &mdash; a workspace admin can end up looking at the platform's own dashboard instead of their institution's, even while browsing on their own address. This bit <code>app.quraanacademy.org</code> in practice: links kept redirecting to eduplatform.ai until this array was updated.</div>
    </div>
  </section>

  <!-- PHASE 5 -->
  <section class="phase">
    <div class="phase-num">5</div>
    <div>
      <div class="phase-head"><h2 class="phase-title">Register the domain as trusted</h2></div>
      <p class="phase-intro">The step that lets EduPlatform recognize which consumer a visitor landed on.</p>

      <div class="step">
        <div class="actor"><b>Platform admin</b>adds domain</div>
        <div class="step-body">
          <p>On the consumer's row in Platform Consumers, use <strong>Add domain</strong> for each host from Phase 2.</p>
          <p><a class="ref" href="https://eduplatform.ai/local/hubredirect/platform_consumers.php" target="_blank" rel="noopener">https://eduplatform.ai/local/hubredirect/platform_consumers.php</a> &middot; <span class="ref">pqpc_add_domain()</span></p>
        </div>
      </div>
      <div class="step">
        <div class="actor"><b>System</b>marks trusted</div>
        <div class="step-body">
          <p>The host is now resolvable to this exact consumer and workspace &mdash; every branded page, login, and redirect on that domain now works as intended.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- PHASE 6 -->
  <section class="phase">
    <div class="phase-num">6</div>
    <div>
      <div class="phase-head"><h2 class="phase-title">Verify</h2></div>
      <p class="phase-intro">Confirm every host resolves the way it should before handing anything off.</p>

      <div class="step">
        <div class="actor"><b>Platform admin</b>probes</div>
        <div class="step-body">
          <p>Visit each host and confirm <code>trusted_domain=yes</code> and the expected <code>consumer_slug</code>.</p>
          <p><code>https://&lt;host&gt;/local/hubredirect/consumer_probe.php</code> &middot; <code>https://&lt;host&gt;/local/hubredirect/platform_diagnostics.php</code></p>
          <p class="phase-intro" style="margin:6px 0 0">Run against every host from Phase 2 in turn &mdash; e.g. <a class="ref" href="https://quraantest.academy/local/hubredirect/consumer_probe.php" target="_blank" rel="noopener">https://quraantest.academy/local/hubredirect/consumer_probe.php</a> &mdash; not one fixed domain.</p>
        </div>
      </div>
      <div class="step">
        <div class="actor"><b>Platform admin</b>walks the routes</div>
        <div class="step-body">
          <p>Public landing, branded login, dashboard, session-expired, access-denied &mdash; each should show this consumer's branding, never raw system chrome.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- PHASE 7 -->
  <section class="phase">
    <div class="phase-num">7</div>
    <div>
      <div class="phase-head"><h2 class="phase-title">Group owned schools under a parent</h2></div>
      <p class="phase-intro">Optional &mdash; only when one consumer actually owns others, e.g. an academy brand with several schools underneath it. Each consumer from Phase 1 already exists independently; this step is purely about linking them.</p>

      <div class="step">
        <div class="actor"><b>Platform admin</b>creates the group</div>
        <div class="step-body">
          <p>On <a class="ref" href="https://eduplatform.ai/local/hubredirect/workspaces.php" target="_blank" rel="noopener">https://eduplatform.ai/local/hubredirect/workspaces.php</a>, the "Operating group" section: name it, set type to <strong>Owned schools</strong>, and set the parent consumer to the one that owns the others.</p>
          <p><span class="ref">pqw_upsert_org_group()</span></p>
        </div>
      </div>
      <div class="step">
        <div class="actor"><b>Platform admin</b>links each child</div>
        <div class="step-body">
          <p>Add each child consumer's workspace to the group with relationship <strong>Owned branch</strong>.</p>
          <p><span class="ref">pqh_org_group_relationship_types()</span></p>
        </div>
      </div>

      <div class="callout"><b>What this actually does today</b>An owned-branch child automatically inherits the parent's branding theme &mdash; that's the one behavior really wired up. The access-scope and "inherit sensitive access" checkboxes on the same form get saved, but nothing in real access control reads them yet: linking a school this way does not currently give the parent's admins any actual operational or audit access into it beyond what they'd have as a separate consumer's admin. Branding, not oversight, is the honest scope of this step right now.</div>
    </div>
  </section>

  <!-- PHASE 8 -->
  <section class="phase">
    <div class="phase-num">8</div>
    <div>
      <div class="phase-head"><h2 class="phase-title">Hand off</h2></div>
      <p class="phase-intro">Where the consumer's own admin takes over.</p>

      <div class="step">
        <div class="actor"><b>Consumer admin</b>signs in</div>
        <div class="step-body">
          <p>On their own domain, using the branded login &mdash; never through eduplatform.ai, never through the platform's own admin screens.</p>
        </div>
      </div>
      <div class="step">
        <div class="actor"><b>Consumer admin</b>polishes branding</div>
        <div class="step-body">
          <p>Reviews logo, colors, support email, and landing copy from their own workspace settings.</p>
          <p><code>https://&lt;their-own-domain&gt;/local/hubredirect/institution_settings.php</code> &mdash; on their domain, not eduplatform.ai.</p>
        </div>
      </div>
      <div class="step">
        <div class="actor"><b>Consumer admin</b>opens for business</div>
        <div class="step-body">
          <p>Publishes their first course offering &mdash; the point where this runbook hands off to the course lifecycle: creation, offering, and enrollment.</p>
        </div>
      </div>
    </div>
  </section>

  <footer>local_hubredirect / local_prequran &middot; consumer_wizard.php, platform_consumers.php, config-custom-domains-snippet.php, config_host_check.php, consumer_probe.php, workspaces.php, accesslib.php (pqh_org_group_*)</footer>

</div>
