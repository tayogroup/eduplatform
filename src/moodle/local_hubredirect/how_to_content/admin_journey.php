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
  .dot.teacher{background:var(--gold)}
  .dot.admin{background:var(--green)}
  .dot.family{background:var(--slate)}
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
    <h1>From an empty workspace to a school that runs itself</h1>
    <p class="dek">The administrator's side of a consumer workspace: getting the keys, standing the school up before anyone arrives, admitting and staffing it, running the term, closing the books &mdash; and the governance that sits underneath all of it.</p>
    <div class="legend">
      <span class="tag"><span class="dot admin"></span>Workspace admin / owner</span>
      <span class="tag"><span class="dot teacher"></span>Teacher</span>
      <span class="tag"><span class="dot family"></span>Parent / student</span>
      <span class="tag"><span class="dot system"></span>System</span>
    </div>
  </div>

  <!-- PHASE 1 -->
  <section class="phase">
    <div class="phase-num">1</div>
    <div>
      <div class="phase-head"><h2 class="phase-title">Getting the keys</h2></div>
      <p class="phase-intro">An admin never signs themselves up. The role arrives one of two ways, and which one you came through decides what you can reach.</p>

      <div class="fork">
        <div class="fork-label">How the role was granted</div>
        <div class="fork-branches">
          <div class="branch info">
            <div class="branch-head info">Handed over at onboarding</div>
            <p>The consumer wizard created the workspace and named its first owner. That account starts with full management rights over this workspace and nothing outside it.</p>
            <p><span class="ref">consumer_wizard.php</span> &middot; see the Consumer Onboarding guide</p>
          </div>
          <div class="branch info">
            <div class="branch-head info">Added by an existing admin</div>
            <p>An owner adds a member and sets their workspace role. This is the normal route for a second administrator, a coordinator, or a registrar.</p>
            <p><span class="ref">workspace_people.php</span></p>
          </div>
        </div>
      </div>

      <div class="callout">
        <b>Workspace admin is not platform admin.</b>
        <p>Managing a workspace lets you run <em>your</em> school. A few pages sit deliberately above that line and need platform-operations rights instead &mdash; onboarding a brand-new institution, the platform consumer list, cross-tenant diagnostics. If one of those refuses you, that is why, and the fix is a platform operator running it rather than a permission change.</p>
      </div>
    </div>
  </section>

  <!-- PHASE 2 -->
  <section class="phase">
    <div class="phase-num">2</div>
    <div>
      <div class="phase-head"><h2 class="phase-title">Where you work</h2></div>
      <p class="phase-intro">Two surfaces, deliberately split. Knowing which one answers which question saves a lot of hunting.</p>

      <div class="step">
        <div class="actor"><b>Admin</b>reads the dashboard</div>
        <div class="step-body">
          <p>Headcounts, upcoming sessions, recent members, seven-day activity, what needs attention. Come here to find out <em>how the school is doing</em>.</p>
          <p><span class="ref">workspace_dashboard.php</span></p>
        </div>
      </div>
      <div class="step">
        <div class="actor"><b>Admin</b>opens the workspace</div>
        <div class="step-body">
          <p>Every operating page in the school, grouped as cards. Come here to <em>do</em> something.</p>
          <p><span class="ref">admin_workspace.php</span></p>
        </div>
      </div>
      <div class="step">
        <div class="actor"><b>System</b>keeps you on your domain</div>
        <div class="step-body">
          <p>Where role portals are configured, an admin is held on the admin subdomain on every page, not just at login. Landing on the wrong host redirects rather than failing.</p>
          <p><span class="ref">pqh_enforce_role_domain()</span></p>
        </div>
      </div>
    </div>
  </section>

  <!-- PHASE 3 -->
  <section class="phase">
    <div class="phase-num">3</div>
    <div>
      <div class="phase-head"><h2 class="phase-title">Stand the school up</h2></div>
      <p class="phase-intro">Do all of this before admitting anyone. Each step is depended on by something later, and retrofitting it once students have arrived is materially harder.</p>

      <div class="step">
        <div class="actor"><b>Admin</b>sets the institution</div>
        <div class="step-body">
          <p>Name, logo, colours, domains, support email, landing copy, default courses. Every public page and every notification inherits from here.</p>
          <p><span class="ref">institution_settings.php</span></p>
        </div>
      </div>
      <div class="step">
        <div class="actor"><b>Admin</b>defines the year</div>
        <div class="step-body">
          <p>Terms, holidays, blackout dates, enrolment windows, deadlines. Scheduling and attendance both read from this, so an empty calendar produces confusing behaviour downstream rather than an obvious error.</p>
          <p><span class="ref">academic_calendar.php</span></p>
        </div>
      </div>
      <div class="step">
        <div class="actor"><b>Admin</b>publishes what is on offer</div>
        <div class="step-body">
          <p>Courses become <em>offerings</em>: dates, seats, syllabus, prerequisites, pricing. Only a published offering can be requested by a family.</p>
          <p><span class="ref">course_offerings.php</span> &middot; see the Course Lifecycle guide</p>
        </div>
      </div>
      <div class="step">
        <div class="actor"><b>Teacher</b>writes the syllabus</div>
        <div class="step-body">
          <p>The teacher authors the narrative; the admin approves it. Two different people by design.</p>
          <p><span class="ref">syllabus.php</span></p>
          <div class="statusline">
            <span class="pill">draft</span><span class="arrow">&rarr;</span>
            <span class="pill">in_review</span><span class="arrow">&rarr;</span>
            <span class="pill">approved</span><span class="arrow">&rarr;</span>
            <span class="pill">retired</span>
          </div>
        </div>
      </div>

      <div class="callout">
        <b>Editing an approved syllabus sends it back to draft.</b>
        <p>An approval attaches to the words that were approved, so it cannot silently carry over to new ones. Expect to re-approve after any edit &mdash; this is intended, not a fault.</p>
      </div>
    </div>
  </section>

  <!-- PHASE 4 -->
  <section class="phase">
    <div class="phase-num">4</div>
    <div>
      <div class="phase-head"><h2 class="phase-title">Admit the students</h2></div>
      <p class="phase-intro">A public enquiry is not a student. Nothing real is created until someone decides.</p>

      <div class="step">
        <div class="actor"><b>Family</b>applies</div>
        <div class="step-body">
          <p>Anonymous, no account. Writes one request row and nothing else.</p>
          <p><span class="ref">public_intake.php</span> &rarr; <span class="ref">local_prequran_intake_request</span></p>
        </div>
      </div>
      <div class="step">
        <div class="actor"><b>Admin</b>works the queue</div>
        <div class="step-body">
          <p>Review each request, consider the suggested class groups, then convert &mdash; which hands off into student intake pre-filled with everything the family already typed.</p>
          <p><span class="ref">intake_requests.php</span></p>
          <div class="statusline">
            <span class="pill">new</span><span class="arrow">&rarr;</span>
            <span class="pill">reviewing</span><span class="arrow">&rarr;</span>
            <span class="pill">transferred</span><span class="arrow">/</span>
            <span class="pill">needs_alternative</span><span class="arrow">/</span>
            <span class="pill">rejected</span>
          </div>
        </div>
      </div>
      <div class="step">
        <div class="actor"><b>Admin</b>creates the accounts</div>
        <div class="step-body">
          <p>Student and parent accounts are created together and linked. This is the first moment a person exists on the platform.</p>
          <p><span class="ref">student_intake.php</span></p>
        </div>
      </div>
      <div class="step">
        <div class="actor"><b>Admin</b>places the learner</div>
        <div class="step-body">
          <p>Where placement is a decision rather than an assumption: assessment, level, recommended next course.</p>
          <p><span class="ref">placement_tests.php</span> &middot; <span class="ref">learning_path.php</span></p>
        </div>
      </div>

      <div class="callout">
        <b>The intake queue sits above workspace admin.</b>
        <p>Reviewing public intake requests requires site-admin or school-principal rights, not workspace management. A school-level admin can be refused here while still being able to run everything else in this guide. Worth knowing before you go looking for the page.</p>
      </div>
    </div>
  </section>

  <!-- PHASE 5 -->
  <section class="phase">
    <div class="phase-num">5</div>
    <div>
      <div class="phase-head"><h2 class="phase-title">Staff it</h2></div>
      <p class="phase-intro">Teachers arrive through their own pipeline; the admin decides who teaches whom.</p>

      <div class="step">
        <div class="actor"><b>Admin</b>reviews applicants</div>
        <div class="step-body">
          <p>The teacher-side queue, then account creation and workspace membership.</p>
          <p><span class="ref">teacher_intake_requests.php</span> &rarr; <span class="ref">teacher_intake.php</span> &middot; see the Teacher Journey guide</p>
        </div>
      </div>
      <div class="step">
        <div class="actor"><b>Admin</b>assigns students to teachers</div>
        <div class="step-body">
          <p>The link most reporting depends on: a teacher's dashboard, at-risk lists and gradebook scope all follow from this assignment.</p>
          <p><span class="ref">workspace_people.php</span></p>
        </div>
      </div>
      <div class="step">
        <div class="actor"><b>Admin</b>manages the teaching side</div>
        <div class="step-body">
          <p>Availability, load, contracts, rates, substitutes, payout readiness.</p>
          <p><span class="ref">teacher_administration.php</span></p>
        </div>
      </div>
    </div>
  </section>

  <!-- PHASE 6 -->
  <section class="phase">
    <div class="phase-num">6</div>
    <div>
      <div class="phase-head"><h2 class="phase-title">Run the term</h2></div>
      <p class="phase-intro">The recurring work. Most days an admin lives in one of these.</p>

      <div class="step">
        <div class="actor"><b>Admin</b>clears the queues</div>
        <div class="step-body">
          <p>Admissions, finance, registrar, teacher and support queues with approvals, escalations, notes and an audit trail. The closest thing to a daily to-do list.</p>
          <p><span class="ref">admin_workflow.php</span></p>
        </div>
      </div>
      <div class="step">
        <div class="actor"><b>Admin</b>watches attendance</div>
        <div class="step-body">
          <p>Late, excused, absent, make-up. Feeds academic standing actions and, where configured, finance holds.</p>
          <p><span class="ref">attendance_operations.php</span></p>
        </div>
      </div>
      <div class="step">
        <div class="actor"><b>Admin</b>keeps classes running</div>
        <div class="step-body">
          <p>Scheduling, capacity, room readiness, recordings, reminders, parent visibility.</p>
          <p><span class="ref">live_ops.php</span> &middot; <span class="ref">live_sessions.php</span></p>
        </div>
      </div>
      <div class="step">
        <div class="actor"><b>Admin</b>communicates</div>
        <div class="step-body">
          <p>Messaging, announcements, templates, consent, delivery logs, per-student case history.</p>
          <p><span class="ref">communications_center.php</span></p>
        </div>
      </div>
      <div class="step">
        <div class="actor"><b>System</b>surfaces risk early</div>
        <div class="step-body">
          <p>Configurable early-warning rules with intervention notes, rather than waiting for a report at term end.</p>
          <p><span class="ref">at_risk_report.php</span> &middot; <span class="ref">workspace_reports.php</span></p>
        </div>
      </div>
    </div>
  </section>

  <!-- PHASE 7 -->
  <section class="phase">
    <div class="phase-num">7</div>
    <div>
      <div class="phase-head"><h2 class="phase-title">Money</h2></div>
      <p class="phase-intro">Runs in parallel with the term, not after it.</p>

      <div class="step">
        <div class="actor"><b>Admin</b>runs the ledger</div>
        <div class="step-body">
          <p>Open invoices, overdue balances, payments, exceptions, holds, reconciliation, CSV export.</p>
          <p><span class="ref">finance_operations.php</span></p>
        </div>
      </div>
      <div class="step">
        <div class="actor"><b>Admin</b>handles assistance</div>
        <div class="step-body">
          <p>Scholarship intake, review, waitlists, awards, and conversion into finance.</p>
          <p><span class="ref">scholarship_portal.php</span></p>
        </div>
      </div>
      <div class="step">
        <div class="actor"><b>Admin</b>manages funders</div>
        <div class="step-body">
          <p>Donor pledges, sponsor commitments, invoice allocation, donor privacy.</p>
          <p><span class="ref">sponsor_donor_portal.php</span></p>
        </div>
      </div>
    </div>
  </section>

  <!-- PHASE 8 -->
  <section class="phase">
    <div class="phase-num">8</div>
    <div>
      <div class="phase-head"><h2 class="phase-title">Close the term</h2></div>
      <p class="phase-intro">Turning a term of activity into a record that leaves the school.</p>

      <div class="step">
        <div class="actor"><b>Admin</b>finalises grades</div>
        <div class="step-body">
          <p>Weighted categories, grade review, publishing, disputes, corrections, audit history.</p>
          <p><span class="ref">gradebook_assessment.php</span></p>
        </div>
      </div>
      <div class="step">
        <div class="actor"><b>Admin</b>clears blockers first</div>
        <div class="step-body">
          <p>Find missing grades, data-quality problems and holds <em>before</em> issuing anything. Far cheaper than reissuing afterwards.</p>
          <p><span class="ref">transcript_readiness.php</span> &middot; <span class="ref">transcript_controls.php</span></p>
        </div>
      </div>
      <div class="step">
        <div class="actor"><b>Admin</b>issues the record</div>
        <div class="step-body">
          <p>Official transcripts with issue metadata and hashes; certificates and completion awards from templates.</p>
          <p><span class="ref">course_transcript_official.php</span> &middot; <span class="ref">certificates_awards.php</span></p>
        </div>
      </div>
      <div class="step">
        <div class="actor"><b>Admin</b>reports upward</div>
        <div class="step-body">
          <p>Enrolment funnel, revenue, AR aging, retention, utilisation, course profitability.</p>
          <p><span class="ref">executive_dashboard.php</span></p>
        </div>
      </div>
    </div>
  </section>

  <!-- PHASE 9 -->
  <section class="phase">
    <div class="phase-num">9</div>
    <div>
      <div class="phase-head"><h2 class="phase-title">Governance</h2></div>
      <p class="phase-intro">Less a phase than a standing duty. Review on a schedule, not when something has already gone wrong.</p>

      <div class="step">
        <div class="actor"><b>Admin</b>controls access</div>
        <div class="step-body">
          <p>Registrar, finance, teacher, parent, sponsor and support capabilities; isolation audits; support access.</p>
          <p><span class="ref">roles_permissions.php</span></p>
        </div>
      </div>
      <div class="step">
        <div class="actor"><b>Admin</b>meets obligations</div>
        <div class="step-body">
          <p>Retention, privacy workflows, consent history, export/delete/anonymise review, audit reports.</p>
          <p><span class="ref">compliance_governance.php</span></p>
        </div>
      </div>
      <div class="step">
        <div class="actor"><b>Admin</b>proves recoverability</div>
        <div class="step-body">
          <p>Backup evidence, restore-test dates, DR findings, runbooks, recurring checks. Evidence that a restore was <em>tested</em>, not merely that a backup exists.</p>
          <p><span class="ref">backup_dr_checks.php</span></p>
        </div>
      </div>
      <div class="step">
        <div class="actor"><b>Admin</b>moves data in bulk</div>
        <div class="step-body">
          <p>Validate member CSVs, commit imports, export operational datasets, review processing history.</p>
          <p><span class="ref">bulk_import_export.php</span></p>
        </div>
      </div>
    </div>
  </section>

  <section class="policies">
    <div class="policies-head">
      <h2>Rules that catch admins out</h2>
      <p>Behaviours that are deliberate but surprising the first time. Each is enforced in code, so working around them is not an option &mdash; knowing them in advance is.</p>
    </div>
    <div class="policy-table-wrap">
      <table class="policy-table">
        <thead>
          <tr><th>Rule</th><th>What it means</th><th>Why</th><th>Reference</th></tr>
        </thead>
        <tbody>
          <tr>
            <td class="what">Approval does not survive an edit</td>
            <td class="governs">Editing an approved syllabus returns it to draft, and it must be approved again.</td>
            <td class="where">An approval attaches to specific words; it cannot silently transfer to different ones.</td>
            <td class="ref-cell"><span>pqsyl_save()</span></td>
          </tr>
          <tr>
            <td class="what">Author and approver are different people</td>
            <td class="governs">The teacher writes the syllabus narrative; approving it requires workspace management rights.</td>
            <td class="where">Separation of duties &mdash; whoever writes the promise is not the person who ratifies it.</td>
            <td class="ref-cell"><span>pqsyl_can_author() / pqsyl_can_approve()</span></td>
          </tr>
          <tr>
            <td class="what">Intake review sits above workspace admin</td>
            <td class="governs">Reviewing public intake requests needs site-admin or school-principal rights.</td>
            <td class="where">Requests can arrive before a workspace is settled, so the queue sits above any one school.</td>
            <td class="ref-cell"><span>pqh_require_academy_operations()</span></td>
          </tr>
          <tr>
            <td class="what">A request is not a student</td>
            <td class="governs">Nothing exists on the platform until an admin converts a request into accounts.</td>
            <td class="where">An anonymous public form must not be able to create real people.</td>
            <td class="ref-cell"><span>local_prequran_intake_request</span></td>
          </tr>
          <tr>
            <td class="what">Role portals redirect continuously</td>
            <td class="governs">Where configured, each role is held on its own subdomain on every page, not only at login.</td>
            <td class="where">A bookmark or a shared link must not quietly leave someone on the wrong portal.</td>
            <td class="ref-cell"><span>pqh_enforce_role_domain()</span></td>
          </tr>
          <tr>
            <td class="what">Teacher scope follows assignment</td>
            <td class="governs">A teacher sees only their assigned students; admins and owners see everyone.</td>
            <td class="where">Assignment in People is what most per-teacher reporting is derived from.</td>
            <td class="ref-cell"><span>workspace_people.php</span></td>
          </tr>
          <tr>
            <td class="what">Publishing gates enrolment</td>
            <td class="governs">Only a published offering can be requested; an unpublished course is invisible to families.</td>
            <td class="where">Stops half-configured courses being enrolled into.</td>
            <td class="ref-cell"><span>course_offerings.php</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

</div>
