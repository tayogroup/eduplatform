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

  /* masthead */
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
  .dot.admin{background:var(--green)}
  .dot.person{background:var(--gold)}
  .dot.system{background:var(--ink-faint)}

  /* phase structure */
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

  /* fork / decision block */
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

  /* status pill helper inline in prose */
  .pill{
    display:inline-flex;font-family:var(--mono);font-size:11.5px;
    padding:1px 7px;border-radius:999px;border:1px solid var(--line-strong);
    color:var(--ink-soft);
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
    <h1>From empty workspace to a student in a seat</h1>
    <p class="dek">The full course lifecycle inside a consumer workspace — creating a course, publishing it as an offering, and carrying a student through request, approval, and access. No step here requires touching the platform's own admin screens.</p>
    <div class="legend">
      <span class="tag"><span class="dot admin"></span>Workspace admin</span>
      <span class="tag"><span class="dot person"></span>Student / parent</span>
      <span class="tag"><span class="dot system"></span>System (EduPlatform)</span>
    </div>
  </div>

  <!-- PHASE 1 -->
  <section class="phase">
    <div class="phase-num">1</div>
    <div>
      <div class="phase-head"><h2 class="phase-title">Create the course</h2></div>
      <p class="phase-intro">One form does double duty: it creates the real course shell <em>and</em> the offering listing in a single save.</p>

      <div class="step">
        <div class="actor"><b>Admin</b>opens</div>
        <div class="step-body">
          <p>From the workspace dashboard, <strong>Course Offerings</strong> &rarr; <strong>Create Offering</strong>.</p>
          <p><span class="ref">course_offerings.php</span></p>
        </div>
      </div>
      <div class="step">
        <div class="actor"><b>Admin</b>chooses</div>
        <div class="step-body">
          <p><strong>Course track</strong>: pick a catalog subject, or <strong>Custom / other subject</strong> and type any title &mdash; Grade 3 English, a tutoring block, anything.</p>
          <p><strong>Course action</strong>: <strong>Create new course</strong>.</p>
        </div>
      </div>
      <div class="step">
        <div class="actor"><b>Admin</b>fills in</div>
        <div class="step-body">
          <p>Title, summary, syllabus, prerequisites, start/end dates, seat capacity, tuition, fees, refund policy, and starting status &mdash; usually <span class="pill">draft</span> while it's still being set up.</p>
          <p>For live-taught courses, also set <strong>Live sessions per week</strong> and <strong>Session length</strong> &mdash; cohort matching and session generation are driven by these (see the <em>Cross-Timezone Cohorts &amp; Live Scheduling</em> guide).</p>
        </div>
      </div>
      <div class="step">
        <div class="actor"><b>System</b>on save</div>
        <div class="step-body">
          <p>Creates the course, files it under this institution's own auto-created category, and switches on manual enrollment &mdash; then writes the offering row linking to it.</p>
          <p><span class="ref">pqco_create_moodle_course_for_offering()</span> &middot; <span class="ref">pqco_consumer_category_id()</span></p>
        </div>
      </div>
    </div>
  </section>

  <!-- PHASE 2 -->
  <section class="phase">
    <div class="phase-num">2</div>
    <div>
      <div class="phase-head"><h2 class="phase-title">Publish the offering</h2></div>
      <p class="phase-intro">A course only becomes requestable once it leaves draft.</p>

      <div class="step">
        <div class="actor"><b>Admin</b>sets status</div>
        <div class="step-body">
          <p>Edit the offering, change status to <span class="pill">published</span>. Choose visibility: workspace members only, or listed on the institution's public portal.</p>
        </div>
      </div>
      <div class="step">
        <div class="actor"><b>System</b>surfaces it</div>
        <div class="step-body">
          <p>Only <span class="pill">published</span> and <span class="pill">closed</span> offerings are ever learner-visible &mdash; <span class="pill">draft</span> and <span class="pill">archived</span> stay hidden from the catalog.</p>
          <p><span class="ref">pqco_learner_visible_statuses()</span></p>
        </div>
      </div>
    </div>
  </section>

  <!-- PHASE 3 -->
  <section class="phase">
    <div class="phase-num">3</div>
    <div>
      <div class="phase-head"><h2 class="phase-title">Discovery &amp; request</h2></div>
      <p class="phase-intro">The student or parent side of the desk.</p>

      <div class="step">
        <div class="actor"><b>Student/parent</b>browses</div>
        <div class="step-body">
          <p>The workspace's course catalog lists every published offering with seats open, dates, and price.</p>
          <p><span class="ref">course_catalog_browse.php</span></p>
        </div>
      </div>
      <div class="step">
        <div class="actor"><b>Student/parent</b>requests</div>
        <div class="step-body">
          <p>One click files an enrollment request at <span class="pill">pending</span> &mdash; no account action yet, just a record waiting on review.</p>
        </div>
      </div>
      <div class="step">
        <div class="actor"><b>System</b>notifies</div>
        <div class="step-body">
          <p>Every workspace admin gets a notification: who requested, which course.</p>
          <p><span class="ref">pqco_notify_new_enrollment_request()</span></p>
        </div>
      </div>
    </div>
  </section>

  <!-- PHASE 4 -->
  <section class="phase">
    <div class="phase-num">4</div>
    <div>
      <div class="phase-head"><h2 class="phase-title">Review</h2></div>
      <p class="phase-intro">The one real decision point in the whole flow.</p>

      <div class="step">
        <div class="actor"><b>Admin</b>checks</div>
        <div class="step-body">
          <p>Before a decision is even offered: is the offering still <span class="pill">published</span>? Has it ended? Are there open seats? If any fail, the request can't be approved yet.</p>
        </div>
      </div>

      <div class="fork">
        <div class="fork-label">Admin decides</div>
        <div class="fork-branches">
          <div class="branch ok">
            <div class="branch-head ok">&#10003; Approve</div>
            <p>Real enrollment is attempted immediately &mdash; manual enrol, access window matched to the offering's start/end dates.</p>
            <p class="result">Succeeds &rarr; <span class="pill">enrolled</span>. The student's assigned teachers are auto-enrolled too; student and parents are notified access is ready.</p>
            <p><span class="ref">pqco_enrol_student_in_moodle_course()</span></p>
          </div>
          <div class="branch bad">
            <div class="branch-head bad">&#10007; Reject</div>
            <p>Status becomes <span class="pill">rejected</span>, with an optional note explaining why.</p>
            <p class="result">Student and parents are notified, including the note if one was left.</p>
          </div>
        </div>
      </div>

      <div class="fork">
        <div class="fork-label">If approval's enrollment sync fails</div>
        <div class="fork-branches">
          <div class="branch warn">
            <div class="branch-head warn">&#9888; Stuck at approved</div>
            <p>Status holds at <span class="pill">approved</span> rather than silently failing. Admins are notified the sync didn't complete &mdash; usually a missing manual-enrollment method on the linked course.</p>
          </div>
          <div class="branch ok">
            <div class="branch-head ok">&#8635; Retry sync</div>
            <p>One button re-attempts the same enrollment once the underlying issue is fixed &mdash; no need to re-approve from scratch.</p>
            <p><span class="ref">retry_moodle_enrollment</span></p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- PHASE 5 -->
  <section class="phase">
    <div class="phase-num">5</div>
    <div>
      <div class="phase-head"><h2 class="phase-title">Access</h2></div>
      <p class="phase-intro">What the student actually sees.</p>

      <div class="step">
        <div class="actor"><b>Student</b>opens dashboard</div>
        <div class="step-body">
          <p>The newly enrolled course appears as its own card, sourced straight from the real enrollment &mdash; not a placeholder.</p>
          <p><span class="ref">student_dashboard.php</span></p>
        </div>
      </div>
      <div class="step">
        <div class="actor"><b>Student</b>clicks Continue</div>
        <div class="step-body">
          <p>Launch routing depends on what kind of course it is:</p>
          <p>&mdash; Pre-Quraan &rarr; its bespoke learning app<br>
             &mdash; an Ehel Academy grade course &rarr; its bespoke learning app<br>
             &mdash; anything created through Course Offerings (including every custom-subject course) &rarr; straight into that course's own page</p>
          <p><span class="ref">course_launch.php</span></p>
        </div>
      </div>
    </div>
  </section>

  <!-- PHASE 6 -->
  <section class="phase">
    <div class="phase-num">6</div>
    <div>
      <div class="phase-head"><h2 class="phase-title">Ongoing</h2></div>
      <p class="phase-intro">The lifecycle doesn't end at enrollment.</p>

      <div class="step">
        <div class="actor"><b>Student</b>can drop</div>
        <div class="step-body">
          <p>A drop request goes through the same admin review pattern &mdash; approve unenrolls, reject leaves the enrollment active.</p>
        </div>
      </div>
      <div class="step">
        <div class="actor"><b>Admin</b>runs it forward</div>
        <div class="step-body">
          <p><strong>Clone</strong> an offering to stand up the next cohort as a fresh draft, dates rolled forward three months. <strong>Archive</strong> retires one that's done for good.</p>
        </div>
      </div>
      <div class="step">
        <div class="actor"><b>System</b>keeps the record</div>
        <div class="step-body">
          <p>Every creation, approval, rejection, drop, and retry is written to an audit log the admin can review later.</p>
          <p><span class="ref">pqco_course_audit()</span></p>
        </div>
      </div>
    </div>
  </section>

  <footer>local_hubredirect / local_prequran &middot; course_offerings.php, course_offeringlib.php, course_catalog_browse.php, course_launch.php</footer>

</div>
