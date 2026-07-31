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
    <h1>Controlled testing with disposable Ehel K-12 accounts</h1>
    <p class="dek">Standing up a batch of tagged, disposable student/teacher accounts for Ehel K-12 School, exercising the platform end-to-end &mdash; dashboards, role routing, student grouping &mdash; and fully tearing everything down afterward without ever touching a real account.</p>
    <div class="legend">
      <span class="tag"><span class="dot platform"></span>Ops / Developer</span>
      <span class="tag"><span class="dot consumer"></span>QA Tester</span>
      <span class="tag"><span class="dot system"></span>System</span>
    </div>
  </div>

  <!-- PHASE 1 -->
  <section class="phase">
    <div class="phase-num">1</div>
    <div>
      <div class="phase-head"><h2 class="phase-title">Confirm the target install</h2></div>
      <p class="phase-intro">This server hosts several Moodle installs side by side. Get the wrong one and the scripts below run somewhere harmless but useless &mdash; or worse, somewhere that isn't harmless.</p>

      <div class="step">
        <div class="actor"><b>Ops / Developer</b>checks dbname</div>
        <div class="step-body">
          <p>Every script and SQL statement in this guide targets the <code>ehelacad_quraantest</code> database. Confirm which install folder actually points there before running anything.</p>
          <div class="codeblock">
            <div class="caption">confirm the right install</div>
            <pre>grep dbname /home/ehelacad/quraantest.academy/config.php
<span class="added">$CFG->dbname    = 'ehelacad_quraantest';</span>   &larr; this one</pre>
          </div>
        </div>
      </div>

      <div class="callout"><b>Deployment is separate from git</b>This server is not a git clone of the repository &mdash; code changes reach it through whatever manual/upload process is already in use outside of this guide. Confirm the two scripts below are actually present in <code>local/prequran/cli/</code> on the server before running them; a missing file means the deploy step hasn't happened yet, not that the path is wrong.</div>
    </div>
  </section>

  <!-- PHASE 2 -->
  <section class="phase">
    <div class="phase-num">2</div>
    <div>
      <div class="phase-head"><h2 class="phase-title">Create the QA test accounts</h2></div>
      <p class="phase-intro">One command creates 30 tagged test students and 3 tagged test teachers, scoped to Ehel K-12 School (workspace 23).</p>

      <div class="step">
        <div class="actor"><b>Ops / Developer</b>dry run first</div>
        <div class="step-body">
          <p>Always preview before creating anything.</p>
          <div class="codeblock">
            <div class="caption">preview, changes nothing</div>
            <pre>cd /home/ehelacad/quraantest.academy
php local/prequran/cli/create_ehel_k12_qa_accounts.php --dry-run</pre>
          </div>
          <p>Confirm it reports workspace <strong>#23 &ldquo;Ehel K-12 School&rdquo;</strong> and lists <code>ehelk12-qa-student01</code> through <code>student30</code> plus <code>ehelk12-qa-teacher01</code> through <code>teacher03</code> as &ldquo;would create.&rdquo;</p>
        </div>
      </div>

      <div class="step">
        <div class="actor"><b>Ops / Developer</b>creates for real</div>
        <div class="step-body">
          <div class="codeblock">
            <div class="caption">actually creates the accounts</div>
            <pre>php local/prequran/cli/create_ehel_k12_qa_accounts.php</pre>
          </div>
          <p>Prints every created <code>userid</code> and the shared password (<code>EhelK12Qa#2026</code> by default) at the end &mdash; save that output.</p>
        </div>
      </div>

      <div class="step">
        <div class="actor"><b>System</b>per account</div>
        <div class="step-body">
          <p>Creates the Moodle login via <span class="ref">user_create_user()</span> (correct password hashing &mdash; never raw SQL against <code>mdl_user</code>), an active <span class="ref">local_prequran_workspace_member</span> row, and a <span class="ref">local_prequran_student_profile</span> / <span class="ref">teacher_profile</span> row.</p>
        </div>
      </div>

      <div class="step">
        <div class="actor"><b>Ops / Developer</b>options</div>
        <div class="step-body">
          <div class="codeblock">
            <div class="caption">flags</div>
            <pre>--dry-run       report only, change nothing
--password=     override the default account password
--students=     how many test students (default 30)
--teachers=     how many test teachers (default 3)</pre>
          </div>
        </div>
      </div>

      <div class="callout"><b>Safe by construction</b>Every account is tagged with the <code>ehelk12-qa-</code> username prefix. Both this script and its teardown counterpart refuse to touch anything that doesn't match it &mdash; it's structurally impossible for this process to create, modify, or delete a real account. Re-running the create script is also safe: existing accounts are left alone, not duplicated.</div>
    </div>
  </section>

  <!-- PHASE 3 -->
  <section class="phase">
    <div class="phase-num">3</div>
    <div>
      <div class="phase-head"><h2 class="phase-title">Know the course_type landmine</h2></div>
      <p class="phase-intro"><span class="ref">local_prequran_student_profile.course_type</span> has a database-level default of <code>pre_quraan</code> &mdash; a leftover from before this platform supported non-Quran curricula. Any profile insert that doesn't explicitly set it will silently show a &ldquo;Pre-Quraan&rdquo; course card on that student's dashboard, with zero connection to real enrollment.</p>

      <div class="fork">
        <div class="fork-label">Which batch are you looking at?</div>
        <div class="fork-branches">
          <div class="branch ok">
            <div class="branch-head ok">&#10003; Created with the current script</div>
            <p>Already sets <code>course_type = ''</code> explicitly on every new profile row.</p>
            <p class="result">Nothing to do &mdash; dashboards won't show a stray course.</p>
          </div>
          <div class="branch warn">
            <div class="branch-head warn">&#9888; Created before the fix</div>
            <p>Profile rows already exist with <code>course_type = 'pre_quraan'</code> from the schema default.</p>
            <p class="result">Correct them directly, scoped to the known userid range.</p>
          </div>
        </div>
      </div>

      <div class="step">
        <div class="actor"><b>Ops / Developer</b>corrects existing rows</div>
        <div class="step-body">
          <div class="codeblock">
            <div class="caption">phpMyAdmin, scoped to the batch's userid range</div>
            <pre>UPDATE mdlgx_local_prequran_student_profile
SET course_type = '', timemodified = UNIX_TIMESTAMP()
WHERE userid BETWEEN &lt;first_new_userid&gt; AND &lt;last_new_userid&gt;;

-- confirm:
SELECT userid, student_display_name, course_type
FROM mdlgx_local_prequran_student_profile
WHERE userid BETWEEN &lt;first_new_userid&gt; AND &lt;last_new_userid&gt;;</pre>
          </div>
        </div>
      </div>

      <div class="callout"><b>Not test-specific</b>This is a platform-wide schema quirk, not something particular to QA accounts. Worth keeping in mind if this exact symptom &mdash; a course showing up with no real enrollment behind it &mdash; ever surfaces for a real student.</div>
    </div>
  </section>

  <!-- PHASE 4 -->
  <section class="phase">
    <div class="phase-num">4</div>
    <div>
      <div class="phase-head"><h2 class="phase-title">Teachers before students</h2></div>
      <p class="phase-intro">Not just convention &mdash; the platform's own student grouping tool is built around it.</p>

      <div class="step">
        <div class="actor"><b>System</b>how matching works</div>
        <div class="step-body">
          <p><span class="ref">live_grouping.php</span> ranks a student's placement criteria &mdash; timezone, language, level, availability &mdash; <strong>against an existing pool of teacher profiles</strong>, scored by capacity (<span class="ref">max_students_per_class</span>, <span class="ref">max_weekly_hours</span>) via <span class="ref">pqlgrp_ranked_teacher_options()</span>.</p>
          <p>If no teacher profiles exist yet for the workspace, there is nothing to recommend &mdash; the tool shows &ldquo;No active teacher profiles found.&rdquo;</p>
        </div>
      </div>

      <div class="step">
        <div class="actor"><b>Ops / Developer</b>practical order</div>
        <div class="step-body">
          <p>Teacher accounts + profiles exist first (already true after Phase 2 &mdash; the 3 QA teachers were created with active profiles). Students come in next. Grouping/assignment &mdash; which creates the actual <span class="ref">local_prequran_teacher_student</span> link &mdash; happens last, derived from the match rather than enrollment order.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- PHASE 5 -->
  <section class="phase">
    <div class="phase-num">5</div>
    <div>
      <div class="phase-head"><h2 class="phase-title">Verify end to end</h2></div>
      <p class="phase-intro">Log in as a few of the test accounts and confirm the platform behaves as expected.</p>

      <div class="step">
        <div class="actor"><b>QA Tester</b>student login</div>
        <div class="step-body">
          <p><code>ehelk12-qa-student01</code> / the shared password lands on <span class="ref">dashboard.php</span> via <span class="ref">role_redirect.php</span>, with no course card once Phase 3 is handled.</p>
        </div>
      </div>

      <div class="step">
        <div class="actor"><b>QA Tester</b>teacher login</div>
        <div class="step-body">
          <p><code>ehelk12-qa-teacher01</code> / same password lands on <span class="ref">teacher_workspace.php</span>.</p>
        </div>
      </div>

      <div class="step">
        <div class="actor"><b>QA Tester</b>grouping tool</div>
        <div class="step-body">
          <p><span class="ref">live_grouping.php</span>, reachable from the workspace dashboard as a manager/admin, should show all 3 QA teachers as ranked options when pulling up a QA student for placement.</p>
        </div>
      </div>

      <div class="callout"><b>Role-portal subdomains won't redirect yet</b>K-12's <code>students.</code>/<code>teachers.</code>/<code>parents.</code>/<code>admins.</code>/<code>finance.k-12.ehelacademy.org</code> rows exist but are <code>status = 'pending'</code> until DNS + AutoSSL are actually set up for them. Logging in should keep you on <code>k-12.ehelacademy.org</code> until then &mdash; that's expected, not a bug. Re-test with these same accounts once those subdomains go active.</div>

      <div class="callout"><b>Finance role not included by default</b>None of the 33 QA accounts have the <code>finance</code> workspace role &mdash; only <code>student</code>/<code>teacher</code>. Add a <span class="ref">local_prequran_workspace_member</span> row with <code>workspace_role = 'finance'</code> for one of the test teacher accounts if that path needs testing too.</div>
    </div>
  </section>

  <!-- PHASE 6 -->
  <section class="phase">
    <div class="phase-num">6</div>
    <div>
      <div class="phase-head"><h2 class="phase-title">Tear everything down</h2></div>
      <p class="phase-intro">Removes the accounts and every related row &mdash; not just the bare Moodle login.</p>

      <div class="step">
        <div class="actor"><b>Ops / Developer</b>dry run (default)</div>
        <div class="step-body">
          <div class="codeblock">
            <div class="caption">reports table-by-table row counts, changes nothing</div>
            <pre>php local/prequran/cli/delete_ehel_k12_qa_accounts.php</pre>
          </div>
          <p>Defaults to dry-run &mdash; the opposite of most other scripts in this repo, deliberately, because this one's blast radius is much larger: workspace membership, profiles, course enrolments, grades, invoices/payments, communications, consent, live-session/attendance, referrals &mdash; every table keyed by these specific userids.</p>
        </div>
      </div>

      <div class="step">
        <div class="actor"><b>Ops / Developer</b>actually deletes</div>
        <div class="step-body">
          <div class="codeblock">
            <div class="caption">after reviewing the row counts above</div>
            <pre>php local/prequran/cli/delete_ehel_k12_qa_accounts.php --dry-run=0</pre>
          </div>
        </div>
      </div>

      <div class="step">
        <div class="actor"><b>System</b>deletion order</div>
        <div class="step-body">
          <p>Plugin-table rows first, then the Moodle accounts last, via <span class="ref">delete_user()</span> &mdash; never raw SQL against <code>mdl_user</code>.</p>
        </div>
      </div>

      <div class="callout"><b>Subject columns only</b>Only deletes rows where a QA account is the <em>subject</em> of the row (<code>studentid</code>/<code>teacherid</code>/etc.), never rows where a QA account merely acted as creator/approver on someone else's record &mdash; so it can't reach into real data even if a QA account touched something during testing.</div>
    </div>
  </section>

  <footer>local_prequran/cli/create_ehel_k12_qa_accounts.php, delete_ehel_k12_qa_accounts.php &middot; local_hubredirect/live_grouping.php, dashboard.php, course_catalog.php, role_redirect.php, accesslib.php (pqh_enforce_role_domain, pqh_user_workspace_role)</footer>

</div>
