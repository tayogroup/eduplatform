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
    <h1>One course, one promise, signed off before it is published</h1>
    <p class="dek">The syllabus is half written and half generated: a teacher writes the narrative, the platform supplies the schedule and units, and a school administrator approves the result before any family can read it. This is how those halves fit together, who may touch which, and why an approval does not survive an edit.</p>
    <div class="legend">
      <span class="tag"><span class="dot teacher"></span>Teacher (author)</span>
      <span class="tag"><span class="dot admin"></span>Workspace admin (approver)</span>
      <span class="tag"><span class="dot family"></span>Parent / student</span>
      <span class="tag"><span class="dot system"></span>System</span>
    </div>
  </div>

  <!-- PHASE 1 -->
  <section class="phase">
    <div class="phase-num">1</div>
    <div>
      <div class="phase-head"><h2 class="phase-title">Two halves, one page</h2></div>
      <p class="phase-intro">Understanding the split explains most of what follows &mdash; including why several sections cannot be edited.</p>

      <div class="fork">
        <div class="fork-label">What makes up a syllabus</div>
        <div class="fork-branches">
          <div class="branch ok">
            <div class="branch-head ok">Written by the teacher</div>
            <p>The narrative: what this course is, who teaches it, how to reach them, and the policies families are agreeing to. Free text, and the only part anyone edits.</p>
            <p><span class="ref">syllabus.php</span></p>
          </div>
          <div class="branch info">
            <div class="branch-head info">Generated by the platform</div>
            <p>Units, the assessment schedule and term dates, read from live course data. Deliberately not editable here &mdash; changing them means changing the course, not the document.</p>
            <p><span class="ref">pqsyl_generated()</span></p>
          </div>
        </div>
      </div>

      <div class="callout">
        <b>Units come from whichever source the course actually has.</b>
        <p>If the course is aligned to a curriculum framework, units are built from its objectives. If not, they fall back to gradebook categories. The page states which source it used, so an unexpected unit list usually means the alignment is missing rather than the syllabus being wrong.</p>
      </div>
    </div>
  </section>

  <!-- PHASE 2 -->
  <section class="phase">
    <div class="phase-num">2</div>
    <div>
      <div class="phase-head"><h2 class="phase-title">Write the narrative</h2></div>
      <p class="phase-intro">Nine fields, in the order a parent reads them. Every course in the school answers the same questions, so two courses can be compared like for like.</p>

      <div class="step">
        <div class="actor"><b>Teacher</b>opens the course and year</div>
        <div class="step-body">
          <p>A syllabus belongs to one course in one academic year. Changing either selector opens a different document, not a different view of the same one.</p>
          <p><span class="ref">syllabus.php?courseid=&hellip;&amp;year=&hellip;</span></p>
        </div>
      </div>
      <div class="step">
        <div class="actor"><b>Teacher</b>writes the opening</div>
        <div class="step-body">
          <p><b>About this course</b> &mdash; the first thing a parent reads. <b>Prerequisites</b> &mdash; prior grade, assumed skills, or a placement check; write &ldquo;None&rdquo; rather than leaving it blank if the course is open to all. <b>Your teacher</b> and <b>How to get in touch</b> &mdash; a name, a route, and a realistic reply time.</p>
        </div>
      </div>
      <div class="step">
        <div class="actor"><b>Teacher</b>completes the policies</div>
        <div class="step-body">
          <p>Six blocks under the <em>Course policies</em> heading: materials and equipment, attendance, homework, assessment and grading, behaviour and participation, support and communication.</p>
        </div>
      </div>
      <div class="step">
        <div class="actor"><b>System</b>stores them together</div>
        <div class="step-body">
          <p>Prerequisites and the six policy blocks are saved as one structured field rather than free text, which is what keeps every course answering the same set of questions.</p>
          <p><span class="ref">policies_json</span></p>
        </div>
      </div>

      <div class="callout">
        <b>&ldquo;Course policies&rdquo; is a heading, not a field.</b>
        <p>It groups the six policy boxes beneath it and has no input of its own. If it looks like a field whose input failed to render, that is what you are seeing.</p>
      </div>
    </div>
  </section>

  <!-- PHASE 3 -->
  <section class="phase">
    <div class="phase-num">3</div>
    <div>
      <div class="phase-head"><h2 class="phase-title">Send it for approval</h2></div>
      <p class="phase-intro">The author cannot approve their own work. That separation is enforced, not conventional.</p>

      <div class="step">
        <div class="actor"><b>Teacher</b>submits</div>
        <div class="step-body">
          <p>Only a draft (or a retired syllabus being revived) can be sent for approval, and only once the course overview has been written &mdash; an empty overview is refused.</p>
          <div class="statusline">
            <span class="pill">draft</span><span class="arrow">&rarr;</span>
            <span class="pill">in_review</span>
          </div>
        </div>
      </div>
      <div class="step">
        <div class="actor"><b>Admin</b>approves or sends it back</div>
        <div class="step-body">
          <p>Approval requires workspace management rights and only applies to a syllabus that is awaiting approval. A reviewer note can be left for the teacher either way.</p>
          <div class="statusline">
            <span class="pill">in_review</span><span class="arrow">&rarr;</span>
            <span class="pill">approved</span><span class="arrow">/</span>
            <span class="pill">draft</span>
          </div>
        </div>
      </div>
      <div class="step">
        <div class="actor"><b>System</b>records who signed it</div>
        <div class="step-body">
          <p>Approval stamps the approving user and the moment of approval onto the row, and the action is written to the audit trail.</p>
          <p><span class="ref">approvedby</span> &middot; <span class="ref">approvedat</span> &middot; <span class="ref">pqsyl_audit()</span></p>
        </div>
      </div>
    </div>
  </section>

  <!-- PHASE 4 -->
  <section class="phase">
    <div class="phase-num">4</div>
    <div>
      <div class="phase-head"><h2 class="phase-title">Decide who may read it</h2></div>
      <p class="phase-intro">Approval and visibility are separate switches. Approving does not publish.</p>

      <div class="fork">
        <div class="fork-label">Visibility</div>
        <div class="fork-branches three">
          <div class="branch">
            <div class="branch-head">Staff only</div>
            <p>Internal. Useful while a course is still being shaped.</p>
          </div>
          <div class="branch ok">
            <div class="branch-head ok">Students and parents</div>
            <p>The normal setting once a course is running.</p>
          </div>
          <div class="branch warn">
            <div class="branch-head warn">Public</div>
            <p>Anyone, including prospective families with no account. Only takes effect once the syllabus is <em>approved</em>.</p>
          </div>
        </div>
      </div>

      <div class="step">
        <div class="actor"><b>System</b>enforces both conditions</div>
        <div class="step-body">
          <p>A syllabus is readable without logging in only when it is approved <em>and</em> set to public. Staff who can author or approve may always preview a draft; everyone else is refused identically, so a refusal never reveals whether a document exists.</p>
          <p><span class="ref">pqsyl_can_read()</span></p>
        </div>
      </div>
      <div class="step">
        <div class="actor"><b>Family</b>reads it</div>
        <div class="step-body">
          <p>The rendered page, or a PDF of the same content for printing and record-keeping.</p>
          <p><span class="ref">syllabus_view.php</span> &middot; <span class="ref">syllabus_pdf.php</span></p>
        </div>
      </div>
    </div>
  </section>

  <!-- PHASE 5 -->
  <section class="phase">
    <div class="phase-num">5</div>
    <div>
      <div class="phase-head"><h2 class="phase-title">Change it later</h2></div>
      <p class="phase-intro">The single behaviour that surprises people most.</p>

      <div class="step">
        <div class="actor"><b>Teacher</b>edits an approved syllabus</div>
        <div class="step-body">
          <p>Saving any change to an approved document returns it to <b>draft</b> and clears the recorded approver and approval time. It must go through review again.</p>
          <div class="statusline">
            <span class="pill">approved</span><span class="arrow">&rarr;</span>
            <span class="pill">draft</span><span class="arrow">&rarr;</span>
            <span class="pill">in_review</span><span class="arrow">&rarr;</span>
            <span class="pill">approved</span>
          </div>
        </div>
      </div>
      <div class="step">
        <div class="actor"><b>Admin</b>retires an old year</div>
        <div class="step-body">
          <p>Retiring keeps the document for the record without presenting it as current. A retired syllabus can be sent back through approval if it is revived.</p>
          <div class="statusline">
            <span class="pill">approved</span><span class="arrow">&rarr;</span>
            <span class="pill">retired</span>
          </div>
        </div>
      </div>

      <div class="callout">
        <b>Why the approval is dropped rather than kept.</b>
        <p>An approval is a statement about specific words. If those words change, the approval no longer describes what a parent would read, so carrying it over would make the sign-off meaningless. Plan for re-approval whenever a syllabus is corrected mid-year.</p>
      </div>
    </div>
  </section>

  <!-- PHASE 6 -->
  <section class="phase">
    <div class="phase-num">6</div>
    <div>
      <div class="phase-head"><h2 class="phase-title">Watch the whole school</h2></div>
      <p class="phase-intro">Per-course editing is one thing; knowing which courses still have no syllabus is another.</p>

      <div class="step">
        <div class="actor"><b>Admin</b>reviews coverage</div>
        <div class="step-body">
          <p>Every course in the workspace with its syllabus status, ordered so the ones needing attention surface first: awaiting approval, then not started, then draft, then retired, with approved last.</p>
          <p><span class="ref">pqsyl_workspace_status()</span></p>
        </div>
      </div>
      <div class="step">
        <div class="actor"><b>Admin</b>chases the gaps</div>
        <div class="step-body">
          <p>A course with no syllabus row at all shows as <em>not started</em> &mdash; the most common state at the beginning of a year, and the one worth clearing before enrolment opens.</p>
          <div class="statusline">
            <span class="pill">in_review</span><span class="arrow">&rarr;</span>
            <span class="pill">not_started</span><span class="arrow">&rarr;</span>
            <span class="pill">draft</span><span class="arrow">&rarr;</span>
            <span class="pill">retired</span><span class="arrow">&rarr;</span>
            <span class="pill">approved</span>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="policies">
    <div class="policies-head">
      <h2>Rules enforced in code</h2>
      <p>None of these can be worked around from the interface. Knowing them prevents most of the confusion around syllabus sign-off.</p>
    </div>
    <div class="policy-table-wrap">
      <table class="policy-table">
        <thead>
          <tr><th>Rule</th><th>What it means</th><th>Why</th><th>Reference</th></tr>
        </thead>
        <tbody>
          <tr>
            <td class="what">Editing drops the approval</td>
            <td class="governs">Saving an approved syllabus returns it to draft and clears the approver and approval time.</td>
            <td class="where">An approval describes specific words and cannot transfer to different ones.</td>
            <td class="ref-cell"><span>pqsyl_save()</span></td>
          </tr>
          <tr>
            <td class="what">Author cannot approve</td>
            <td class="governs">Writing requires authoring rights on that course; approving requires workspace management.</td>
            <td class="where">Separation of duties between the promise and its ratification.</td>
            <td class="ref-cell"><span>pqsyl_can_author() / pqsyl_can_approve()</span></td>
          </tr>
          <tr>
            <td class="what">An empty overview cannot be submitted</td>
            <td class="governs">Sending for approval is refused until the course overview has been written.</td>
            <td class="where">Stops blank documents consuming an approver's time.</td>
            <td class="ref-cell"><span>pqsyl_transition()</span></td>
          </tr>
          <tr>
            <td class="what">Only a draft may be submitted</td>
            <td class="governs">Submission is allowed from draft or retired; nothing else.</td>
            <td class="where">Keeps the status track linear and auditable.</td>
            <td class="ref-cell"><span>pqsyl_transition()</span></td>
          </tr>
          <tr>
            <td class="what">Approval alone does not publish</td>
            <td class="governs">Public reading needs approved status <em>and</em> public visibility, together.</td>
            <td class="where">Sign-off and publication are separate decisions, often made by different people at different times.</td>
            <td class="ref-cell"><span>pqsyl_can_read()</span></td>
          </tr>
          <tr>
            <td class="what">Refusals are uniform</td>
            <td class="governs">Everyone without access is refused the same way, whether or not a syllabus exists.</td>
            <td class="where">A refusal must not disclose which courses exist.</td>
            <td class="ref-cell"><span>pqsyl_can_read()</span></td>
          </tr>
          <tr>
            <td class="what">Generated sections are read-only</td>
            <td class="governs">Units, assessment schedule and term dates cannot be edited on this page.</td>
            <td class="where">They are views of live course data; editing the document would put it out of step with the course.</td>
            <td class="ref-cell"><span>pqsyl_generated()</span></td>
          </tr>
          <tr>
            <td class="what">One course, one year</td>
            <td class="governs">A syllabus is unique to a course and academic year; changing year opens a different document.</td>
            <td class="where">Last year's promise stays on last year's record.</td>
            <td class="ref-cell"><span>local_prequran_syllabus</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

</div>
