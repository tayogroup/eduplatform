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
  .dot.family{background:var(--gold)}
  .dot.admin{background:var(--green)}
  .dot.external{background:var(--slate)}
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
    <h1>From a public form to a finished transcript</h1>
    <p class="dek">The full family-facing journey through a consumer workspace: applying with no account at all, becoming a student, registering for a course, paying for it, setting up the devices it's taken on, finishing it &mdash; sessions, progress, attendance, help &mdash; and walking away with a certificate and a transcript.</p>
    <div class="legend">
      <span class="tag"><span class="dot family"></span>Prospective family / student / parent</span>
      <span class="tag"><span class="dot admin"></span>Workspace admin</span>
      <span class="tag"><span class="dot external"></span>Payment gateway</span>
      <span class="tag"><span class="dot system"></span>System</span>
    </div>
  </div>

  <!-- PHASE 1 -->
  <section class="phase">
    <div class="phase-num">1</div>
    <div>
      <div class="phase-head"><h2 class="phase-title">Public intake</h2></div>
      <p class="phase-intro">No account, no login &mdash; this is the form a family fills out before they're anyone in the system yet.</p>

      <div class="step">
        <div class="actor"><b>Family</b>applies</div>
        <div class="step-body">
          <p>The public intake form, reachable with no session at all &mdash; on the institution's own site if they use one, or an EduPlatform-hosted page otherwise.</p>
          <p><span class="ref">public_intake.php</span></p>
        </div>
      </div>
      <div class="step">
        <div class="actor"><b>System</b>guards it</div>
        <div class="step-body">
          <p>A public unauthenticated form is also the one surface open to abuse: a minimum fill time, a submission cooldown, and a cap on repeat submissions from the same contact within an hour all run before anything is saved.</p>
        </div>
      </div>
      <div class="step">
        <div class="actor"><b>System</b>records it</div>
        <div class="step-body">
          <p>Writes a single application/intake row, scoped to this consumer and workspace &mdash; nothing else exists yet. No account, no course access.</p>
          <p><span class="ref">local_prequran_intake_request</span> / <span class="ref">local_prequran_admission_app</span></p>
        </div>
      </div>
    </div>
  </section>

  <!-- PHASE 2 -->
  <section class="phase">
    <div class="phase-num">2</div>
    <div>
      <div class="phase-head"><h2 class="phase-title">Review &amp; decide</h2></div>
      <p class="phase-intro">The application gets a human look before anything is created &mdash; and, where the workspace runs one, a placement test before that look is even finished.</p>

      <div class="step">
        <div class="actor"><b>Admin</b>opens the queue</div>
        <div class="step-body">
          <p>Application details and any uploaded documents.</p>
          <p><span class="ref">admissions.php</span></p>
          <div class="statusline">
            <span class="pill">submitted</span><span class="arrow">&rarr;</span>
            <span class="pill">in review</span><span class="arrow">&rarr;</span>
            <span class="pill" style="border-color:var(--gold);color:var(--gold)">placement assessment</span><span class="arrow">&rarr;</span>
            <span class="pill" style="border-color:var(--green);color:var(--green)">accepted</span><span class="arrow">/</span>
            <span class="pill">waitlisted</span><span class="arrow">/</span>
            <span class="pill">declined</span>
          </div>
        </div>
      </div>

      <div class="step">
        <div class="actor"><b>Admin</b>runs placement</div>
        <div class="step-body">
          <p>A level or placement test, tracked on its own separate status &mdash; independent of the overall application stage above.</p>
          <div class="statusline">
            <span class="pill">not assessed</span><span class="arrow">&rarr;</span>
            <span class="pill">scheduled</span><span class="arrow">&rarr;</span>
            <span class="pill">in progress</span><span class="arrow">&rarr;</span>
            <span class="pill">ready for review</span><span class="arrow">&rarr;</span>
            <span class="pill" style="border-color:var(--green);color:var(--green)">placed</span>
          </div>
          <p>The result is written back onto the application itself &mdash; including, where it matters, which specific course or level the student is actually placed into. That can end up different from whatever the family originally requested.</p>
        </div>
      </div>

      <div class="fork">
        <div class="fork-label">Decision</div>
        <div class="fork-branches">
          <div class="branch ok">
            <div class="branch-head ok">&#10003; Accepted</div>
            <p class="result">Ready to convert into an actual account.</p>
          </div>
          <div class="branch warn">
            <div class="branch-head warn">&#9679; Waitlisted / rejected</div>
            <p>Stays a record only &mdash; no account, no seat held. Can be revisited later without the family re-applying.</p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- PHASE 3 -->
  <section class="phase">
    <div class="phase-num">3</div>
    <div>
      <div class="phase-head"><h2 class="phase-title">Convert to an account</h2></div>
      <p class="phase-intro">One admin action turns paperwork into a real student.</p>

      <div class="step">
        <div class="actor"><b>Admin</b>converts</div>
        <div class="step-body">
          <p>One click on an accepted application does four things at once: creates or finds the account, adds workspace membership, writes the student profile, and opens a family billing account.</p>
          <p><span class="ref">pqadm_convert_application()</span></p>
        </div>
      </div>
      <div class="callout"><b>If a course was named on the application</b>Conversion enrolls the student into that course immediately &mdash; whichever course ended up on the application, including one swapped in by a placement result rather than whatever the family first requested. The family never has to separately browse the catalog and file a request. Anyone converted without a named course, or wanting a second course later, picks it up at the course-offerings request flow instead.</div>
    </div>
  </section>

  <!-- PHASE 4 -->
  <section class="phase">
    <div class="phase-num">4</div>
    <div>
      <div class="phase-head"><h2 class="phase-title">Pay</h2></div>
      <p class="phase-intro">Where this sits in the sequence is a workspace policy choice, not a fixed rule &mdash; it can be required before approval, before enrollment, before the first live session, or simply reviewed after the fact.</p>

      <div class="step">
        <div class="actor"><b>System</b>invoices</div>
        <div class="step-body">
          <p>A draft invoice is built straight from the course offering's own pricing: tuition, registration fee, materials fee, currency, and whether installments or a scholarship apply.</p>
          <p><span class="ref">pqfin_create_invoice_from_enrollment_request()</span></p>
        </div>
      </div>

      <div class="fork">
        <div class="fork-label">How the balance gets paid</div>
        <div class="fork-branches three">
          <div class="branch info">
            <div class="branch-head info">Hosted checkout</div>
            <p>The family is handed off to a payment gateway's own checkout page and returned to their invoice afterward, paid or not.</p>
            <p><span class="ref">pqfin_create_hosted_payment_session()</span></p>
          </div>
          <div class="branch info">
            <div class="branch-head info">Payment plan</div>
            <p>The balance is split into installments; each one becomes payable on its own schedule.</p>
          </div>
          <div class="branch ok">
            <div class="branch-head ok">Manual record</div>
            <p>An admin records a payment taken outside the system &mdash; cash, check, a bank transfer &mdash; against the same invoice.</p>
          </div>
        </div>
      </div>

      <div class="step">
        <div class="actor"><b>System</b>closes the loop</div>
        <div class="step-body">
          <p>A receipt is generated and the family is notified, regardless of which path the payment took.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- PHASE 5 -->
  <section class="phase">
    <div class="phase-num">5</div>
    <div>
      <div class="phase-head"><h2 class="phase-title">Set up the device</h2></div>
      <p class="phase-intro">Two things a family configures once, independent of any specific course &mdash; before or alongside everything below.</p>

      <div class="step">
        <div class="actor"><b>Parent</b>enrolls each device</div>
        <div class="step-body">
          <p>Content filtering runs at the network level, not in-browser: every device the child actually uses &mdash; phone, tablet, laptop &mdash; gets its own client ID and a downloadable install profile.</p>
          <p><span class="ref">safenet.php</span></p>
          <p>An un-enrolled device isn't filtered at all, on any network, including a phone hotspot &mdash; enrollment is per device, not per account.</p>
        </div>
      </div>
      <div class="step">
        <div class="actor"><b>System</b>enforces &amp; watches</div>
        <div class="step-body">
          <p>VPN, proxy, and alternative-DNS bypass domains are blocked outright. If an enrolled device goes quiet during class or homework hours &mdash; the sign of a VPN, a removed setting, or a switch to an un-enrolled device &mdash; the parent gets an email.</p>
        </div>
      </div>

      <div class="step">
        <div class="actor"><b>Student</b>sets exam mode</div>
        <div class="step-body">
          <p>A per-student preference, not a workspace-wide setting: how proctored coursework actually opens.</p>
        </div>
      </div>

      <div class="fork">
        <div class="fork-label">Exam mode preference</div>
        <div class="fork-branches three">
          <div class="branch ok">
            <div class="branch-head ok">Safe Exam Browser</div>
            <p class="result">Default. A locked-down browser required for the session; handed off via its own protocol so the student never hunts for a downloaded file.</p>
          </div>
          <div class="branch warn">
            <div class="branch-head warn">Focus mode</div>
            <p>An ordinary tab that requests fullscreen and reports tab-switches, blur, and fullscreen exits back to the teacher. Deterrence, not prevention &mdash; the fallback where SEB itself can't run.</p>
          </div>
          <div class="branch">
            <div class="branch-head" style="color:var(--ink-soft)">Off</div>
            <p>No lock, no monitoring. Available where a workspace doesn't require either.</p>
          </div>
        </div>
      </div>

      <div class="callout"><b>The one real hardware constraint</b>Safe Exam Browser has no Android build at all &mdash; a phone or tablet running Android is limited to focus mode or off, full stop. Everything else about the platform is a plain browser experience with no separate hardware or software requirements page; this SEB gap is the actual, specific constraint in practice.</div>
    </div>
  </section>

  <!-- PHASE 6 -->
  <section class="phase">
    <div class="phase-num">6</div>
    <div>
      <div class="phase-head"><h2 class="phase-title">Take the course</h2></div>
      <p class="phase-intro">The part that actually looks like school.</p>

      <div class="step">
        <div class="actor"><b>Student</b>accesses</div>
        <div class="step-body">
          <p>The course appears on the dashboard the moment real enrollment lands; opening it routes to whichever experience that course actually is.</p>
          <p><span class="ref">student_dashboard.php</span> &middot; <span class="ref">course_launch.php</span></p>
        </div>
      </div>
      <div class="step">
        <div class="actor"><b>Student</b>works through it</div>
        <div class="step-body">
          <p>Live sessions, homework, quizzes &mdash; each one feeds either the built-in gradebook and completion tracking, or a local progress record where that completion tracking isn't set up for that course.</p>
        </div>
      </div>

      <div class="step">
        <div class="actor"><b>Student</b>joins live sessions</div>
        <div class="step-body">
          <p>Scheduled class times appear on the dashboard; joining opens the live room directly, no separate meeting link to track down. Missed a session? The recording is there afterward instead.</p>
          <p><span class="ref">live_sessions.php</span></p>
        </div>
      </div>

      <div class="step">
        <div class="actor"><b>System</b>tracks progress</div>
        <div class="step-body">
          <p>A weighted course grade recalculates from every graded piece, rolled up into a mastery summary the student, parent, and teacher can all see &mdash; not just a single course average.</p>
          <p><span class="ref">pqgp_weighted_course_grade()</span> &middot; <span class="ref">pqgp_mastery_summary()</span></p>
          <p>Strong mastery can surface its own next step: the system can recommend the next course in sequence directly off that summary.</p>
          <p><span class="ref">pqgp_recommend_next_course()</span></p>
        </div>
      </div>

      <div class="step">
        <div class="actor"><b>Teacher</b>tracks attendance</div>
        <div class="step-body">
          <p>Present, absent, late, or excused &mdash; recorded per live session and counted against thresholds each workspace sets for itself.</p>
        </div>
      </div>

      <div class="fork">
        <div class="fork-label">What repeated absence triggers</div>
        <div class="fork-branches three">
          <div class="branch">
            <div class="branch-head" style="color:var(--ink-soft)">Below threshold</div>
            <p>Nothing beyond the record itself. Attendance is visible, not yet actionable.</p>
          </div>
          <div class="branch warn">
            <div class="branch-head warn">&#9679; Warning count reached</div>
            <p>An academic standing flag is set on the student.</p>
          </div>
          <div class="branch bad">
            <div class="branch-head bad">&#9679; Hold count reached</div>
            <p>A finance hold opens automatically &mdash; warning-only, or blocking enrollment and services outright, by workspace policy. The same hold mechanism the unpaid-invoice case uses elsewhere.</p>
            <p><span class="ref">pqatt_apply_rule_actions()</span></p>
          </div>
        </div>
      </div>

      <div class="step">
        <div class="actor"><b>Family / teacher</b>communicates</div>
        <div class="step-body">
          <p>Direct message threads between a parent and their child's teacher, plus workspace-wide announcements &mdash; both scoped to the specific student, not a generic inbox.</p>
          <p><span class="ref">communications.php</span></p>
        </div>
      </div>

      <div class="step">
        <div class="actor"><b>Family</b>gets help</div>
        <div class="step-body">
          <p>A separate helpdesk from ordinary messaging, split by who's actually stuck: the student's own support line, a student-teacher thread, or a parent-teacher one.</p>
          <p><span class="ref">support.php</span></p>
        </div>
      </div>

      <div class="step">
        <div class="actor"><b>System</b>issues a certificate</div>
        <div class="step-body">
          <p>A per-achievement credential, separate from the transcript below &mdash; each one carries its own verification code that anyone can check independently, without needing an account.</p>
          <p><span class="ref">pqcp_register_certificate_document()</span> &middot; <span class="ref">certificate_verify.php</span></p>
        </div>
      </div>
    </div>
  </section>

  <!-- PHASE 7 -->
  <section class="phase">
    <div class="phase-num">7</div>
    <div>
      <div class="phase-head"><h2 class="phase-title">Grades &amp; transcript</h2></div>
      <p class="phase-intro">Where the course's progress becomes a document someone can hand to another school.</p>

      <div class="step">
        <div class="actor"><b>System</b>determines pass/fail</div>
        <div class="step-body">
          <p>By workspace policy, completion is read from the built-in tracking first and the local progress record second; passing by default means completion <em>or</em> a grade at or above 60%.</p>
          <p><span class="ref">pqct_default_transcript_policy()</span></p>
        </div>
      </div>

      <div class="fork">
        <div class="fork-label">Who can pull what</div>
        <div class="fork-branches">
          <div class="branch">
            <div class="branch-head" style="color:var(--gold)">Family / teacher</div>
            <p>An unofficial copy of grades and progress &mdash; a working report, not a credential.</p>
          </div>
          <div class="branch">
            <div class="branch-head" style="color:var(--green)">Workspace admin</div>
            <p>The official transcript &mdash; the version meant to travel outside this workspace.</p>
          </div>
        </div>
      </div>

      <div class="callout"><b>Where payment comes back in</b>Workspace policy can hold the <em>official</em> transcript &mdash; warning only, or blocking issue outright &mdash; while an invoice is still unpaid. A finished course doesn't always mean a releasable transcript.</div>
    </div>
  </section>

  <section class="policies">
    <div class="policies-head">
      <h2>Policies in effect throughout</h2>
      <p>None of these are one-time steps &mdash; each governs the phases above continuously, from the moment consent is captured at intake to every session, message, and grade after it.</p>
    </div>
    <div class="policy-table-wrap">
      <table class="policy-table">
        <thead>
          <tr><th>Policy</th><th>Governs</th><th>Captured / enforced</th><th>Reference</th></tr>
        </thead>
        <tbody>
          <tr>
            <td class="what">Guardian consent</td>
            <td class="governs">Whether a parent/guardian must approve before a child's enrollment actually activates.</td>
            <td class="where">Checked at intake (Phase 1); blocks access until granted where required.</td>
            <td class="ref-cell"><span>pqsi_enrollment_already_approved()</span></td>
          </tr>
          <tr>
            <td class="what">Live session consent</td>
            <td class="governs">Whether the child may join live classes at all &mdash; independent of the recording question below.</td>
            <td class="where">A distinct guardian consent, captured once at intake.</td>
            <td class="ref-cell"><span>local_prequran_live_consent</span><span>type = live_session</span></td>
          </tr>
          <tr>
            <td class="what">Recording consent</td>
            <td class="governs">Whether a live session may be video/audio recorded &mdash; a guardian can allow live participation but decline recording.</td>
            <td class="where">A second, separate consent from the same intake form.</td>
            <td class="ref-cell"><span>local_prequran_live_consent</span><span>type = recording</span></td>
          </tr>
          <tr>
            <td class="what">Recording retention</td>
            <td class="governs">How long a recorded session is kept before deletion, and how an early deletion request gets approved.</td>
            <td class="where">A workspace-configured retention window; early purge runs through its own request &rarr; approve/reject audit trail, exportable as a compliance review pack.</td>
            <td class="ref-cell"><span>parent_trust_retention_days</span><span>live_parent_trust_review_pack.php</span></td>
          </tr>
          <tr>
            <td class="what">Communications</td>
            <td class="governs">Whether the student can message directly, use free text, and whether every message stays visible to the parent.</td>
            <td class="where">Guardian-controlled, set per student; governs the messaging in Phase 6.</td>
            <td class="ref-cell"><span>local_prequran_comm_consent</span></td>
          </tr>
          <tr>
            <td class="what">Attendance</td>
            <td class="governs">Absence thresholds that escalate from a visible record, to an academic standing flag, to an automatic finance hold.</td>
            <td class="where">Workspace-configured rule, enforced live every session &mdash; see Phase 6.</td>
            <td class="ref-cell"><span>pqatt_apply_rule_actions()</span></td>
          </tr>
          <tr>
            <td class="what">Grading &amp; completion</td>
            <td class="governs">What actually counts as passing &mdash; completion, a minimum grade, or either &mdash; and what an official transcript can be held for.</td>
            <td class="where">Workspace-configured policy, read at every grade recalculation and at transcript issuance &mdash; see Phase 7.</td>
            <td class="ref-cell"><span>pqct_default_transcript_policy()</span></td>
          </tr>
          <tr>
            <td class="what">Monitoring</td>
            <td class="governs">Device-level content-filtering alerts, and on-screen monitoring during proctored coursework.</td>
            <td class="where">Continuous and automatic once a device is enrolled or an exam mode is chosen &mdash; see Phase 5.</td>
            <td class="ref-cell"><span>safenet.php</span><span>focus mode, Phase 5</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <footer>local_hubredirect / local_prequran &middot; public_intake.php, admissions.php + admissionslib.php, finance_lib.php, safenet.php, seb_lib.php, gradebook_progresslib.php, attendance_operations.php, communications.php, support.php, certificates_placementlib.php, course_launch.php, course_transcriptlib.php, live_parent_trust_review_pack.php</footer>

</div>
