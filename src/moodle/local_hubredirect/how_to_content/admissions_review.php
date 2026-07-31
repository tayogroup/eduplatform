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
    <h1>From an anonymous enquiry to an enrolled student</h1>
    <p class="dek">The reviewer's side of admissions: what a public form actually creates, how the queue is worked, how the platform proposes a class group and why, and the moment real accounts come into existence. The Student Journey guide covers the same ground from the family's seat &mdash; this one is for whoever decides.</p>
    <div class="legend">
      <span class="tag"><span class="dot family"></span>Prospective family</span>
      <span class="tag"><span class="dot admin"></span>Reviewer / admin</span>
      <span class="tag"><span class="dot system"></span>System</span>
      <span class="tag"><span class="dot teacher"></span>Teacher</span>
    </div>
  </div>

  <!-- PHASE 1 -->
  <section class="phase">
    <div class="phase-num">1</div>
    <div>
      <div class="phase-head"><h2 class="phase-title">What the public form creates</h2></div>
      <p class="phase-intro">Less than people expect &mdash; and that is the point.</p>

      <div class="step">
        <div class="actor"><b>Family</b>submits an enquiry</div>
        <div class="step-body">
          <p>No account, no login. The form is filled in by someone who does not exist on the platform yet, so it is guarded against abuse rather than by authentication: a hidden trap field, a minimum completion time, a per-session cooldown, and a signed form token.</p>
          <p><span class="ref">public_intake.php</span></p>
        </div>
      </div>
      <div class="step">
        <div class="actor"><b>System</b>writes one row</div>
        <div class="step-body">
          <p>A single request record. No user account, no enrolment, no invoice, no group membership. Nothing that would need cleaning up if the enquiry goes nowhere.</p>
          <p><span class="ref">local_prequran_intake_request</span></p>
          <div class="statusline"><span class="pill">new</span></div>
        </div>
      </div>

      <div class="callout">
        <b>A request is not a student.</b>
        <p>Everything the family typed sits in that one row until a reviewer acts. This is why the queue can be triaged, rejected or ignored without any tidy-up, and why an abandoned enquiry never becomes a half-created account.</p>
      </div>
    </div>
  </section>

  <!-- PHASE 2 -->
  <section class="phase">
    <div class="phase-num">2</div>
    <div>
      <div class="phase-head"><h2 class="phase-title">Reach the queue</h2></div>
      <p class="phase-intro">Check this before anything else &mdash; the page sits at a different permission level from the rest of school administration.</p>

      <div class="step">
        <div class="actor"><b>Admin</b>opens the queue</div>
        <div class="step-body">
          <p>Every request, filterable by status.</p>
          <p><span class="ref">intake_requests.php</span></p>
        </div>
      </div>
      <div class="step">
        <div class="actor"><b>System</b>checks two things</div>
        <div class="step-body">
          <p>First that you hold platform operations rights &mdash; site admin or school principal, <em>not</em> workspace management. Then, per request, that it belongs to the consumer you are currently working in; a request from another school is refused even to someone who passed the first check.</p>
          <p><span class="ref">pqh_require_academy_operations()</span> &middot; <span class="ref">pqireq_request_in_consumer_scope()</span></p>
        </div>
      </div>

      <div class="callout">
        <b>A workspace admin may be refused here.</b>
        <p>Someone who runs the whole school day to day &mdash; people, courses, finance, transcripts &mdash; can still be turned away from this one page, because intake requests can arrive before a workspace is settled and so the queue sits above any single school. If a school-level administrator needs to triage admissions, that is a role grant, not a settings change.</p>
      </div>
    </div>
  </section>

  <!-- PHASE 3 -->
  <section class="phase">
    <div class="phase-num">3</div>
    <div>
      <div class="phase-head"><h2 class="phase-title">Let the platform propose a group</h2></div>
      <p class="phase-intro">Ranked suggestions with stated reasons, so a placement decision can be explained afterwards.</p>

      <div class="step">
        <div class="actor"><b>System</b>scores each class group</div>
        <div class="step-body">
          <p>Every candidate group is scored against what the family asked for, and the matching reasons are shown alongside the score rather than hidden behind it.</p>
          <p><span class="ref">pqireq_group_suggestions()</span></p>
        </div>
      </div>
      <div class="step">
        <div class="actor"><b>System</b>weights what matters most</div>
        <div class="step-body">
          <p>Time zone carries the most weight, because a class at an impossible hour fails regardless of how well everything else fits. Course, language and level follow; learning base, age, gender and country refine the ordering.</p>
          <div class="statusline">
            <span class="pill">timezone 28</span>
            <span class="pill">course 20</span>
            <span class="pill">language 20</span>
            <span class="pill">level 20</span>
            <span class="pill">base 12</span>
            <span class="pill">age 10</span>
            <span class="pill">gender 5</span>
            <span class="pill">country 3</span>
          </div>
        </div>
      </div>
      <div class="step">
        <div class="actor"><b>Admin</b>decides</div>
        <div class="step-body">
          <p>The suggestion is advice. The reviewer may pick any group, or none, and record why in the admin notes &mdash; which is what a colleague reads later when asked how this placement was reached.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- PHASE 4 -->
  <section class="phase">
    <div class="phase-num">4</div>
    <div>
      <div class="phase-head"><h2 class="phase-title">Work the queue</h2></div>
      <p class="phase-intro">Two different actions, easily confused: recording a decision, and actually converting.</p>

      <div class="fork">
        <div class="fork-label">What the reviewer does next</div>
        <div class="fork-branches">
          <div class="branch info">
            <div class="branch-head info">Save the review</div>
            <p>Updates status, matched group and notes, and stays in the queue. Use this to triage now and convert later, or to close a request that will not proceed.</p>
            <p><span class="ref">save_review</span></p>
          </div>
          <div class="branch ok">
            <div class="branch-head ok">Convert to a student</div>
            <p>Marks the request as under review, carries everything the family typed into the intake form, and moves you there. Nothing is created yet &mdash; this is a handoff, not a commitment.</p>
            <p><span class="ref">load_intake</span></p>
          </div>
        </div>
      </div>

      <div class="step">
        <div class="actor"><b>Admin</b>moves it along its track</div>
        <div class="step-body">
          <p>Five states. Three of them are endings.</p>
          <div class="statusline">
            <span class="pill">new</span><span class="arrow">&rarr;</span>
            <span class="pill">reviewing</span><span class="arrow">&rarr;</span>
            <span class="pill">transferred</span><span class="arrow">/</span>
            <span class="pill">needs_alternative</span><span class="arrow">/</span>
            <span class="pill">rejected</span>
          </div>
          <p><b>needs_alternative</b> is not a rejection &mdash; it means the school wants this learner but not on what they asked for. Keep it distinct from <b>rejected</b> so the follow-up conversation is obvious months later.</p>
        </div>
      </div>
      <div class="step">
        <div class="actor"><b>System</b>records every touch</div>
        <div class="step-body">
          <p>Who reviewed it and when are stamped onto the request, and each action is written to the audit trail with the status it moved from and to.</p>
          <p><span class="ref">reviewedby</span> &middot; <span class="ref">reviewedat</span> &middot; <span class="ref">pqireq_audit()</span></p>
        </div>
      </div>
    </div>
  </section>

  <!-- PHASE 5 -->
  <section class="phase">
    <div class="phase-num">5</div>
    <div>
      <div class="phase-head"><h2 class="phase-title">Create the accounts</h2></div>
      <p class="phase-intro">The first moment real people exist on the platform.</p>

      <div class="step">
        <div class="actor"><b>System</b>pre-fills the form</div>
        <div class="step-body">
          <p>Names, contact details, location, language, level and the availability grid all carry across, so nobody retypes what the family already provided &mdash; and so the record matches what was actually asked for.</p>
          <p><span class="ref">pqireq_prefill()</span> &rarr; <span class="ref">student_intake.php</span></p>
        </div>
      </div>
      <div class="step">
        <div class="actor"><b>Admin</b>reviews and creates</div>
        <div class="step-body">
          <p>The pre-filled values are editable &mdash; correct a misspelled name or a wrong time zone here, not afterwards. Student and parent accounts are created together and linked.</p>
        </div>
      </div>
      <div class="step">
        <div class="actor"><b>System</b>closes the request</div>
        <div class="step-body">
          <p>Only once the accounts actually exist is the originating request marked <b>transferred</b>. Abandoning the intake form part-way leaves it at <em>reviewing</em>, so it stays in the queue rather than silently disappearing.</p>
          <div class="statusline">
            <span class="pill">reviewing</span><span class="arrow">&rarr;</span>
            <span class="pill">transferred</span>
          </div>
        </div>
      </div>

      <div class="callout">
        <b>The status reflects reality, not intent.</b>
        <p>Because <em>transferred</em> is written by the intake form on success rather than by the queue on handoff, a request marked transferred always has accounts behind it. A stalled conversion is visible instead of lost.</p>
      </div>
    </div>
  </section>

  <!-- PHASE 6 -->
  <section class="phase">
    <div class="phase-num">6</div>
    <div>
      <div class="phase-head"><h2 class="phase-title">Finish the enrolment</h2></div>
      <p class="phase-intro">An account is not a place in a class. Admissions hands over here.</p>

      <div class="step">
        <div class="actor"><b>Admin</b>places and approves</div>
        <div class="step-body">
          <p>Assign the learner to a teacher, add them to the class group, and approve the course enrolment request against the offering's available seats.</p>
          <p><span class="ref">workspace_people.php</span> &middot; <span class="ref">enrollment_approval.php</span> &middot; see the Course Lifecycle guide</p>
        </div>
      </div>
      <div class="step">
        <div class="actor"><b>Admin</b>assesses where needed</div>
        <div class="step-body">
          <p>Where the level was self-reported on a public form, confirm it before the first lesson rather than after.</p>
          <p><span class="ref">placement_tests.php</span> &middot; <span class="ref">learning_path.php</span></p>
        </div>
      </div>
      <div class="step">
        <div class="actor"><b>Family</b>is billed and starts</div>
        <div class="step-body">
          <p>Invoicing, payment, consent and device setup follow the ordinary student path from here.</p>
          <p>See the Student Journey and Parent Journey guides</p>
        </div>
      </div>
    </div>
  </section>

  <section class="policies">
    <div class="policies-head">
      <h2>Rules enforced in code</h2>
      <p>Each of these is a deliberate constraint rather than an oversight, and several explain behaviour that otherwise looks like a fault.</p>
    </div>
    <div class="policy-table-wrap">
      <table class="policy-table">
        <thead>
          <tr><th>Rule</th><th>What it means</th><th>Why</th><th>Reference</th></tr>
        </thead>
        <tbody>
          <tr>
            <td class="what">The queue sits above workspace admin</td>
            <td class="governs">Reviewing intake requires site-admin or school-principal rights, not workspace management.</td>
            <td class="where">Requests can arrive before a workspace is settled, so triage cannot belong to one school.</td>
            <td class="ref-cell"><span>pqh_require_academy_operations()</span></td>
          </tr>
          <tr>
            <td class="what">Requests are consumer-scoped</td>
            <td class="governs">A request may only be acted on from the consumer it belongs to.</td>
            <td class="where">Prevents one school triaging another school's applicants.</td>
            <td class="ref-cell"><span>pqireq_request_in_consumer_scope()</span></td>
          </tr>
          <tr>
            <td class="what">A public form creates one row</td>
            <td class="governs">No account, enrolment, invoice or group membership is created by submitting.</td>
            <td class="where">Anonymous input must never produce real people or money.</td>
            <td class="ref-cell"><span>local_prequran_intake_request</span></td>
          </tr>
          <tr>
            <td class="what">Transferred means accounts exist</td>
            <td class="governs">The status is set by the intake form on success, not by the queue at handoff.</td>
            <td class="where">An abandoned conversion stays visible in the queue instead of appearing done.</td>
            <td class="ref-cell"><span>student_intake.php</span></td>
          </tr>
          <tr>
            <td class="what">Suggestions are advice</td>
            <td class="governs">The reviewer may choose any group, or none, regardless of score.</td>
            <td class="where">Scoring cannot know everything about a family; the decision stays human.</td>
            <td class="ref-cell"><span>pqireq_group_suggestions()</span></td>
          </tr>
          <tr>
            <td class="what">Time zone outweighs everything</td>
            <td class="governs">Time zone is the heaviest single factor in group matching.</td>
            <td class="where">A class at an unworkable hour fails no matter how well the rest fits.</td>
            <td class="ref-cell"><span>pqireq_group_score()</span></td>
          </tr>
          <tr>
            <td class="what">Every action is audited</td>
            <td class="governs">Reviewer, timestamp, and the status moved from and to are all recorded.</td>
            <td class="where">Admissions decisions must be explainable long after the reviewer has forgotten them.</td>
            <td class="ref-cell"><span>pqireq_audit()</span></td>
          </tr>
          <tr>
            <td class="what">Public forms are rate-limited, not authenticated</td>
            <td class="governs">Trap field, minimum completion time, session cooldown and a signed form token.</td>
            <td class="where">The submitter has no account by definition, so abuse control cannot rely on login.</td>
            <td class="ref-cell"><span>public_intake.php</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

</div>
