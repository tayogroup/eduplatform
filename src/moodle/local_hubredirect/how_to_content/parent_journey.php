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
  .dot.parent{background:var(--gold)}
  .dot.staff{background:var(--green)}
  .dot.child{background:var(--slate)}
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
  .fork-branches.three{grid-template-columns:1fr 1fr 1fr}
  .branch{padding:16px;border-left:1px solid var(--line)}
  .branch:first-child{border-left:none}
  .branch.ok{background:linear-gradient(var(--green-soft),transparent 70%)}
  .branch.bad{background:linear-gradient(var(--red-soft),transparent 70%)}
  .branch.warn{background:linear-gradient(var(--gold-soft),transparent 70%)}
  .branch.info{background:linear-gradient(var(--slate-soft),transparent 70%)}
  .branch-head{
    display:flex;align-items:center;gap:7px;
    font-family:var(--mono);font-size:12px;font-weight:600;letter-spacing:.02em;
    margin-bottom:8px;
  }
  .branch-head.ok{color:var(--green)}
  .branch-head.bad{color:var(--red)}
  .branch-head.warn{color:var(--gold)}
  .branch-head.info{color:var(--slate)}
  .branch p{margin:0 0 5px;font-size:14px;color:var(--ink-soft)}
  .branch p:last-child{margin-bottom:0}
  .branch p.result{color:var(--ink);font-weight:500}

  .callout{
    margin:14px 0 4px;
    padding:13px 16px;
    border:1px dashed var(--line-strong);
    border-radius:var(--radius);
    background:var(--gold-soft);
    font-size:13.5px;
    color:var(--ink-soft);
  }
  .callout b{color:var(--gold);font-family:var(--mono);font-size:11px;letter-spacing:.04em;text-transform:uppercase;display:block;margin-bottom:5px}

  .pill{
    display:inline-flex;font-family:var(--mono);font-size:11.5px;
    padding:1px 7px;border-radius:999px;border:1px solid var(--line-strong);
    color:var(--ink-soft);
  }

  .statusline{
    display:flex;flex-wrap:wrap;gap:6px;align-items:center;
    margin:14px 0 4px;font-size:13px;
  }
  .statusline .pill{background:var(--paper-raised)}
  .statusline .arrow{color:var(--line-strong)}

  .policies{margin-top:56px}
  .policies-head{margin-bottom:22px}
  .policies-head h2{font-family:var(--serif);font-size:26px;font-weight:600;margin:0 0 8px;letter-spacing:-.005em}
  .policies-head p{color:var(--ink-soft);margin:0;max-width:62ch}
  .policy-table{width:100%;border-collapse:collapse;font-size:13.5px}
  .policy-table-wrap{overflow-x:auto;border:1px solid var(--line);border-radius:var(--radius);background:var(--paper-raised)}
  .policy-table th{
    text-align:left;font-family:var(--mono);font-size:10.5px;letter-spacing:.05em;text-transform:uppercase;
    color:var(--ink-faint);font-weight:600;padding:12px 14px;border-bottom:1px solid var(--line-strong);
    white-space:nowrap;
  }
  .policy-table td{padding:13px 14px;border-bottom:1px solid var(--line);vertical-align:top;color:var(--ink-soft)}
  .policy-table tr:last-child td{border-bottom:none}
  .policy-table td.what{color:var(--ink);font-weight:600;width:15%;white-space:nowrap}
  .policy-table td.governs{width:32%}
  .policy-table td.where{width:28%}
  .policy-table td.ref-cell{font-family:var(--mono);font-size:11.5px;color:var(--green);width:25%}
  .policy-table td.ref-cell span{display:block;margin-bottom:2px}

  footer{
    margin-top:50px;padding-top:22px;border-top:1px solid var(--line);
    color:var(--ink-faint);font-size:12.5px;font-family:var(--mono);
  }

  @media (max-width:640px){
    .phase{grid-template-columns:1fr}
    .phase-num{display:none}
    .step{grid-template-columns:1fr}
    .fork-branches,.fork-branches.three{grid-template-columns:1fr}
    .branch:first-child{border-left:none;border-bottom:1px solid var(--line)}
  }
</style>

<div class="wrap">

  <div class="masthead">
    <div class="eyebrow">EduPlatform &middot; Operations Reference</div>
    <h1>Everything a parent controls, sees, and is asked to decide</h1>
    <p class="dek">The guardian side of a consumer workspace: gaining access to a child's account, granting the consents that unlock everything else, paying for courses, watching progress, and staying in the loop &mdash; almost all of it managed one linked child at a time, not once for the whole family.</p>
    <div class="legend">
      <span class="tag"><span class="dot parent"></span>Parent / guardian</span>
      <span class="tag"><span class="dot staff"></span>Workspace admin / staff</span>
      <span class="tag"><span class="dot child"></span>Linked child</span>
      <span class="tag"><span class="dot system"></span>System</span>
    </div>
  </div>

  <!-- PHASE 1 -->
  <section class="phase">
    <div class="phase-num">1</div>
    <div>
      <div class="phase-head"><h2 class="phase-title">Get an account</h2></div>
      <p class="phase-intro">Almost always created alongside the child's, not on its own.</p>

      <div class="step">
        <div class="actor"><b>Parent</b>appears at intake</div>
        <div class="step-body">
          <p>Public intake asks for a parent contact as part of applying a child; if that contact doesn't already have an account, one is created for them in the same submission.</p>
          <p><span class="ref">pqsi_create_user()</span></p>
        </div>
      </div>
      <div class="step">
        <div class="actor"><b>System</b>links them</div>
        <div class="step-body">
          <p>The parent is added to the workspace with the parent role and linked to that specific child &mdash; the relationship the rest of this guide runs on.</p>
        </div>
      </div>
      <div class="callout"><b>One relationship per child</b>A parent with two children in the same workspace has two separate parent-child links. Consent, portal access, and notifications below are almost all scoped to one child at a time &mdash; approving something for one doesn't touch the other.</div>
    </div>
  </section>

  <!-- PHASE 2 -->
  <section class="phase">
    <div class="phase-num">2</div>
    <div>
      <div class="phase-head"><h2 class="phase-title">Grant consent</h2></div>
      <p class="phase-intro">The parent's actual gatekeeping power &mdash; three separate yes/no decisions, not one blanket approval.</p>

      <div class="step">
        <div class="actor"><b>Parent</b>approves enrollment</div>
        <div class="step-body">
          <p>Where required, the child's account exists but stays locked out of lessons until the parent confirms &mdash; sent as a link at intake.</p>
          <p><span class="ref">pqsi_enrollment_already_approved()</span></p>
        </div>
      </div>

      <div class="fork">
        <div class="fork-label">Two more consents, captured separately</div>
        <div class="fork-branches">
          <div class="branch">
            <div class="branch-head" style="color:var(--gold)">Live session participation</div>
            <p>Whether the child may join live classes at all.</p>
          </div>
          <div class="branch">
            <div class="branch-head" style="color:var(--gold)">Recording</div>
            <p>Whether a live session the child is in may be video/audio recorded &mdash; independent of the consent above. A parent can allow live classes and still decline recording.</p>
          </div>
        </div>
      </div>

      <div class="step">
        <div class="actor"><b>Parent</b>sets messaging rules</div>
        <div class="step-body">
          <p>Whether this child can message a teacher directly, whether they can type free text or only pick from set options, and &mdash; the one that matters most &mdash; whether every message stays visible to the parent.</p>
          <p><span class="ref">local_prequran_comm_consent</span></p>
        </div>
      </div>
    </div>
  </section>

  <!-- PHASE 3 -->
  <section class="phase">
    <div class="phase-num">3</div>
    <div>
      <div class="phase-head"><h2 class="phase-title">Set up the child's device</h2></div>
      <p class="phase-intro">The parent's own technical setup, done per device the child actually uses.</p>

      <div class="step">
        <div class="actor"><b>Parent</b>enrolls each device</div>
        <div class="step-body">
          <p>Phone, tablet, laptop &mdash; each one gets its own client ID and a downloadable install profile. An un-enrolled device isn't filtered at all, on any network, including a hotspot.</p>
          <p><span class="ref">safenet.php</span></p>
        </div>
      </div>

      <div class="fork">
        <div class="fork-label">Device profile formats actually generated</div>
        <div class="fork-branches">
          <div class="branch">
            <div class="branch-head" style="color:var(--ink-soft)">Apple devices</div>
            <p>A <code>.mobileconfig</code> profile, installed like any other configuration profile.</p>
          </div>
          <div class="branch">
            <div class="branch-head" style="color:var(--ink-soft)">Windows</div>
            <p>A <code>.bat</code> script that applies the DNS settings.</p>
          </div>
        </div>
      </div>

      <div class="callout"><b>What it actually blocks</b>VPN, proxy, and alternative-DNS bypass domains are blocked outright &mdash; the easy escapes a child might try don't work. If an enrolled device goes quiet during class or homework hours, the parent gets an email; that's usually a VPN, a removed setting, or a switch to an un-enrolled device.</div>

      <div class="step">
        <div class="actor"><b>Parent</b>sets exam mode</div>
        <div class="step-body">
          <p>For a managed child's account, the exam-mode preference &mdash; locked Safe Exam Browser, browser focus mode, or off &mdash; lives on that child's own dashboard, set by whoever is operating the account.</p>
        </div>
      </div>

      <div class="callout"><b>Hardware &amp; software</b>No formal requirements page exists. The two real constraints: Safe Exam Browser has no Android build at all, and device filtering profiles are only generated for Apple devices and Windows PCs.</div>
    </div>
  </section>

  <!-- PHASE 4 -->
  <section class="phase">
    <div class="phase-num">4</div>
    <div>
      <div class="phase-head"><h2 class="phase-title">Pay</h2></div>
      <p class="phase-intro">The parent is the financial actor for a linked child, almost always.</p>

      <div class="step">
        <div class="actor"><b>System</b>invoices</div>
        <div class="step-body">
          <p>Tuition, registration fee, materials fee &mdash; built straight from the course offering's own pricing the moment an enrollment request needs one.</p>
        </div>
      </div>

      <div class="fork">
        <div class="fork-label">How the balance actually gets paid</div>
        <div class="fork-branches three">
          <div class="branch info">
            <div class="branch-head info">Hosted checkout</div>
            <p>Handed off to a payment gateway's own page and returned to the invoice afterward, paid or not.</p>
          </div>
          <div class="branch info">
            <div class="branch-head info">Payment plan</div>
            <p>The balance splits into installments, each payable on its own schedule.</p>
          </div>
          <div class="branch ok">
            <div class="branch-head ok">Staff records it manually</div>
            <p>Cash, check, a bank transfer &mdash; recorded by an admin against the same invoice.</p>
          </div>
        </div>
      </div>

      <div class="step">
        <div class="actor"><b>Parent</b>tracks it</div>
        <div class="step-body">
          <p>Invoices, payments, and any active payment plan for every linked child, all in one place.</p>
          <p><span class="ref">student_parent_portal.php</span></p>
        </div>
      </div>
    </div>
  </section>

  <!-- PHASE 5 -->
  <section class="phase">
    <div class="phase-num">5</div>
    <div>
      <div class="phase-head"><h2 class="phase-title">Watch progress</h2></div>
      <p class="phase-intro">Read access to almost everything the school side tracks &mdash; the Family Portal is the one-stop version, Parent View the roster-style one.</p>

      <div class="step">
        <div class="actor"><b>Parent</b>opens the family portal</div>
        <div class="step-body">
          <p>Courses, grades, attendance, transcripts, invoices, and secure downloads for one child.</p>
          <p><span class="ref">student_parent_portal.php</span></p>
        </div>
      </div>
      <div class="step">
        <div class="actor"><b>Parent</b>checks across children</div>
        <div class="step-body">
          <p>Every linked child, their attendance, notes, materials, and recordings in one roster view.</p>
          <p><span class="ref">workspace_parent.php</span></p>
        </div>
      </div>

      <div class="fork">
        <div class="fork-label">What repeated absence triggers</div>
        <div class="fork-branches three">
          <div class="branch">
            <div class="branch-head" style="color:var(--ink-soft)">Below threshold</div>
            <p>Visible in the portal, nothing more.</p>
          </div>
          <div class="branch warn">
            <div class="branch-head warn">&#9679; Warning count reached</div>
            <p>An academic standing flag is set.</p>
          </div>
          <div class="branch bad">
            <div class="branch-head bad">&#9679; Hold count reached</div>
            <p>A finance hold opens automatically &mdash; the same mechanism an unpaid invoice triggers.</p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- PHASE 6 -->
  <section class="phase">
    <div class="phase-num">6</div>
    <div>
      <div class="phase-head"><h2 class="phase-title">Live class safety</h2></div>
      <p class="phase-intro">Not a one-time setting &mdash; a page a parent can come back to and actually change.</p>

      <div class="step">
        <div class="actor"><b>Parent</b>revisits consent</div>
        <div class="step-body">
          <p>The same live-session and recording consents from Phase 2, editable later rather than locked in at intake &mdash; per child.</p>
          <p><span class="ref">live_trust.php</span> &middot; <span class="ref">pqlt_save_parent_consent()</span></p>
        </div>
      </div>
      <div class="step">
        <div class="actor"><b>Parent</b>watches a recording</div>
        <div class="step-body">
          <p>Only sessions explicitly marked visible to the parent show up &mdash; a recording existing doesn't automatically mean it's reachable here.</p>
          <p><span class="ref">visible_to_parent</span></p>
        </div>
      </div>
    </div>
  </section>

  <!-- PHASE 7 -->
  <section class="phase">
    <div class="phase-num">7</div>
    <div>
      <div class="phase-head"><h2 class="phase-title">Communicate &amp; get help</h2></div>
      <p class="phase-intro">Two different channels for two different needs.</p>

      <div class="step">
        <div class="actor"><b>Parent</b>messages a teacher</div>
        <div class="step-body">
          <p>Direct threads, plus workspace-wide announcements &mdash; scoped to the specific child.</p>
          <p><span class="ref">communications.php</span></p>
        </div>
      </div>
      <div class="step">
        <div class="actor"><b>Parent</b>gets stuck</div>
        <div class="step-body">
          <p>A separate helpdesk channel from ordinary messaging, for when something is actually broken rather than just a question for the teacher.</p>
          <p><span class="ref">support.php</span></p>
        </div>
      </div>
    </div>
  </section>

  <section class="policies">
    <div class="policies-head">
      <h2>Policies in effect throughout</h2>
      <p>Every row here is a decision the parent themselves makes or directly controls &mdash; not something imposed on them.</p>
    </div>
    <div class="policy-table-wrap">
      <table class="policy-table">
        <thead>
          <tr><th>Policy</th><th>Governs</th><th>Captured / enforced</th><th>Reference</th></tr>
        </thead>
        <tbody>
          <tr>
            <td class="what">Enrollment approval</td>
            <td class="governs">Whether the child's account can actually access lessons.</td>
            <td class="where">Granted at intake, checked before access unlocks &mdash; Phase 2.</td>
            <td class="ref-cell"><span>pqsi_enrollment_already_approved()</span></td>
          </tr>
          <tr>
            <td class="what">Live session consent</td>
            <td class="governs">Whether the child may join live classes.</td>
            <td class="where">Set at intake, editable later &mdash; Phases 2 &amp; 6.</td>
            <td class="ref-cell"><span>live_consent</span><span>type = live_session</span></td>
          </tr>
          <tr>
            <td class="what">Recording consent</td>
            <td class="governs">Whether a live session with the child may be recorded.</td>
            <td class="where">Independent of the consent above; revisitable anytime.</td>
            <td class="ref-cell"><span>live_consent</span><span>type = recording</span></td>
          </tr>
          <tr>
            <td class="what">Recording retention</td>
            <td class="governs">How long a recording is kept before automatic deletion.</td>
            <td class="where">Workspace-configured window; early deletion has its own approval trail.</td>
            <td class="ref-cell"><span>parent_trust_retention_days</span></td>
          </tr>
          <tr>
            <td class="what">Communications</td>
            <td class="governs">Whether the child can message directly, use free text, and whether it stays visible to the parent.</td>
            <td class="where">Set by the parent, per child &mdash; Phase 2.</td>
            <td class="ref-cell"><span>local_prequran_comm_consent</span></td>
          </tr>
          <tr>
            <td class="what">Attendance</td>
            <td class="governs">Absence thresholds that escalate to a standing flag, then a finance hold.</td>
            <td class="where">Workspace-configured; visible in the portal, enforced automatically &mdash; Phase 5.</td>
            <td class="ref-cell"><span>pqatt_apply_rule_actions()</span></td>
          </tr>
          <tr>
            <td class="what">Grading &amp; completion</td>
            <td class="governs">What counts as passing, and what can hold an official transcript.</td>
            <td class="where">Workspace-configured, visible in the family portal.</td>
            <td class="ref-cell"><span>pqct_default_transcript_policy()</span></td>
          </tr>
          <tr>
            <td class="what">Monitoring</td>
            <td class="governs">Device-level filtering alerts, and on-screen monitoring during proctored coursework.</td>
            <td class="where">Continuous once a device is enrolled or an exam mode is chosen &mdash; Phase 3.</td>
            <td class="ref-cell"><span>safenet.php</span><span>focus mode</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <footer>local_hubredirect / local_prequran &middot; public_intake.php, student_intake.php, safenet.php, seb_lib.php, finance_lib.php, student_parent_portal.php, workspace_parent.php, live_trust.php, communications.php, support.php, attendance_operations.php, course_transcriptlib.php</footer>

</div>
