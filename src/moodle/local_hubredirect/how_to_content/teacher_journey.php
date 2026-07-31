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
    <h1>From an application to a roster of students</h1>
    <p class="dek">The teacher side of a consumer workspace: applying with no account, getting vetted, being assigned to actual teaching work &mdash; institution classes or marketplace matches &mdash; configuring exam mode and recordings, and running a classroom day to day: attendance, proctoring review, grading, and communication.</p>
    <div class="legend">
      <span class="tag"><span class="dot teacher"></span>Teacher applicant / teacher</span>
      <span class="tag"><span class="dot admin"></span>Workspace admin</span>
      <span class="tag"><span class="dot family"></span>Parent / student</span>
      <span class="tag"><span class="dot system"></span>System</span>
    </div>
  </div>

  <!-- PHASE 1 -->
  <section class="phase">
    <div class="phase-num">1</div>
    <div>
      <div class="phase-head"><h2 class="phase-title">Public application</h2></div>
      <p class="phase-intro">Same shape as the family's public intake &mdash; no account, no login, guarded against abuse.</p>

      <div class="step">
        <div class="actor"><b>Teacher</b>applies</div>
        <div class="step-body">
          <p>Subjects, teaching style, availability, online presence &mdash; whatever this workspace asks for in its public application.</p>
          <p><span class="ref">public_teacher_intake.php</span></p>
        </div>
      </div>
      <div class="step">
        <div class="actor"><b>System</b>records it</div>
        <div class="step-body">
          <p>Writes one application row, nothing more &mdash; no account exists for this person yet.</p>
          <p><span class="ref">local_prequran_teacher_intake_request</span></p>
        </div>
      </div>
    </div>
  </section>

  <!-- PHASE 2 -->
  <section class="phase">
    <div class="phase-num">2</div>
    <div>
      <div class="phase-head"><h2 class="phase-title">Review the application</h2></div>
      <p class="phase-intro">A request-level status, separate from the account and separate from vetting proper.</p>

      <div class="step">
        <div class="actor"><b>Admin</b>works the queue</div>
        <div class="step-body">
          <p>Every application queued in one list, moved along its own status track.</p>
          <p><span class="ref">teacher_intake_requests.php</span></p>
          <div class="statusline">
            <span class="pill">new</span><span class="arrow">&rarr;</span>
            <span class="pill">reviewing</span><span class="arrow">&rarr;</span>
            <span class="pill">approved</span><span class="arrow">/</span>
            <span class="pill">needs update</span><span class="arrow">/</span>
            <span class="pill">rejected</span>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- PHASE 3 -->
  <section class="phase">
    <div class="phase-num">3</div>
    <div>
      <div class="phase-head"><h2 class="phase-title">Convert &amp; vet</h2></div>
      <p class="phase-intro">Two things happen on the same screen, but they're not the same gate.</p>

      <div class="step">
        <div class="actor"><b>Admin</b>converts</div>
        <div class="step-body">
          <p>Opens the staff intake form pre-filled straight from the application, and saves it &mdash; creating the account and a teacher profile in one action.</p>
          <p><span class="ref">teacher_intake.php</span></p>
        </div>
      </div>
      <div class="step">
        <div class="actor"><b>Admin</b>vets</div>
        <div class="step-body">
          <p>The profile carries its own independent vetting field, reviewer, and timestamp &mdash; an account existing doesn't mean it's been vetted.</p>
          <div class="statusline">
            <span class="pill">not reviewed</span><span class="arrow">&rarr;</span>
            <span class="pill">in review</span><span class="arrow">&rarr;</span>
            <span class="pill" style="border-color:var(--green);color:var(--green)">approved</span><span class="arrow">/</span>
            <span class="pill">needs update</span><span class="arrow">/</span>
            <span class="pill">rejected</span>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- PHASE 4 -->
  <section class="phase">
    <div class="phase-num">4</div>
    <div>
      <div class="phase-head"><h2 class="phase-title">The gate</h2></div>
      <p class="phase-intro">Nothing teaching-facing turns on until vetting says so &mdash; explicitly, not by inference.</p>

      <div class="fork">
        <div class="fork-label">Requires status = active AND vetting_status = approved</div>
        <div class="fork-branches">
          <div class="branch bad">
            <div class="branch-head bad">&#10007; Not yet approved</div>
            <p>No marketplace listing. No assignment to a student, session, or course &mdash; blocked outright, not just hidden.</p>
          </div>
          <div class="branch ok">
            <div class="branch-head ok">&#10003; Approved &amp; active</div>
            <p class="result">Both paths in Phase 5 open up.</p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- PHASE 5 -->
  <section class="phase">
    <div class="phase-num">5</div>
    <div>
      <div class="phase-head"><h2 class="phase-title">Get assigned</h2></div>
      <p class="phase-intro">Two different routes into an actual classroom, depending on how this workspace works.</p>

      <div class="fork">
        <div class="fork-label">Two assignment paths</div>
        <div class="fork-branches">
          <div class="branch">
            <div class="branch-head" style="color:var(--green)">Institution-employed</div>
            <p>Added as a workspace member with the teacher role, then linked to specific students directly or through a class group.</p>
            <p><span class="ref">pqco_teacher_ids_for_student()</span></p>
          </div>
          <div class="branch">
            <div class="branch-head" style="color:var(--gold)">Marketplace</div>
            <p>Profile published publicly; a family requests this specific teacher; the parent confirms the match before it's finalized.</p>
            <p><span class="ref">pqtma_assign_teacher_request()</span></p>
          </div>
        </div>
      </div>

      <div class="callout"><b>The moment a course actually opens up</b>A teacher doesn't need a separate enrollment step to gain access to a course &mdash; the instant one of their assigned students is approved into a course offering, that teacher is enrolled into the same course automatically. Assignment to the student is what matters; the course access follows from it.</div>
    </div>
  </section>

  <!-- PHASE 6 -->
  <section class="phase">
    <div class="phase-num">6</div>
    <div>
      <div class="phase-head"><h2 class="phase-title">Set up the classroom</h2></div>
      <p class="phase-intro">Configuration a teacher does once per exam or session, not once per career &mdash; and the one place the "no Android" gap from the student's own setup comes back around.</p>

      <div class="step">
        <div class="actor"><b>Teacher</b>configures exam mode</div>
        <div class="step-body">
          <p>Creating a proctored assessment means choosing how it opens: locked Safe Exam Browser, or browser focus mode where SEB can't reach a device at all &mdash; plus whether proctoring evidence gets captured during the attempt.</p>
        </div>
      </div>

      <div class="step">
        <div class="actor"><b>Staff</b>can help with filtering</div>
        <div class="step-body">
          <p>Content filtering enrollment is normally a parent's own action, but staff have standing access to view and manage a family's enrolled devices directly &mdash; useful when a family is stuck, not a routine teacher task.</p>
          <p><span class="ref">pqsn_user_may_touch()</span></p>
        </div>
      </div>

      <div class="callout"><b>Hardware &amp; software, teacher side</b>No separate requirements page here either &mdash; hosting a live session is a plain browser with microphone and camera permission granted (WebRTC). The one real device gap is still the student's: Safe Exam Browser has no Android build, so a proctored assessment simply isn't available to a student on that platform, regardless of anything the teacher configures.</div>
    </div>
  </section>

  <!-- PHASE 7 -->
  <section class="phase">
    <div class="phase-num">7</div>
    <div>
      <div class="phase-head"><h2 class="phase-title">Teach</h2></div>
      <p class="phase-intro">The day-to-day work, and where the numbers behind a student's transcript actually come from.</p>

      <div class="step">
        <div class="actor"><b>Teacher</b>runs class</div>
        <div class="step-body">
          <p>Today's sessions and a working view of every assigned student.</p>
          <p><span class="ref">teacher_workspace.php</span> &middot; <span class="ref">teacher_portal.php</span></p>
        </div>
      </div>

      <div class="step">
        <div class="actor"><b>Teacher</b>takes attendance</div>
        <div class="step-body">
          <p>Present, absent, late, or excused, per session &mdash; the same record that escalates to an academic-standing flag and eventually an automatic finance hold if absences keep piling up.</p>
        </div>
      </div>

      <div class="step">
        <div class="actor"><b>Teacher</b>controls recording</div>
        <div class="step-body">
          <p>Starting or stopping the session recording is a live toggle, not an always-on default &mdash; and where a workspace requires recording consent, a session simply won't record without it.</p>
          <p><span class="ref">recording_enabled</span> &middot; <span class="ref">recording_consent_required</span></p>
        </div>
      </div>

      <div class="step">
        <div class="actor"><b>Teacher</b>reviews proctoring evidence</div>
        <div class="step-body">
          <p>For a proctored exam: a snapshot and voice-activity timeline for that one student's attempt, with unusual moments &mdash; no face detected, more than one face, a voice flag &mdash; marked for a human to look at.</p>
          <p><span class="ref">seb_proctor_review.php</span></p>
          <p>The evidence itself is temporary: it's deleted automatically after a set number of days, and the review page says so outright &mdash; these are signals worth checking, not proof of anything on their own.</p>
        </div>
      </div>

      <div class="step">
        <div class="actor"><b>Teacher</b>grades</div>
        <div class="step-body">
          <p>Homework, notes, progress updates &mdash; written into the built-in gradebook and completion tracking, the same records the student's transcript reads back out of later.</p>
          <p><span class="ref">teacher_office.php</span></p>
        </div>
      </div>

      <div class="step">
        <div class="actor"><b>Teacher</b>communicates</div>
        <div class="step-body">
          <p>Direct threads with a parent or a student, plus the same helpdesk a family uses when something's actually stuck &mdash; not just one inbox for everything.</p>
          <p><span class="ref">communications.php</span> &middot; <span class="ref">support.php</span></p>
        </div>
      </div>
    </div>
  </section>

  <section class="policies">
    <div class="policies-head">
      <h2>Policies in effect throughout</h2>
      <p>Not one-time steps &mdash; each governs the phases above continuously, and several exist on the student's side of the relationship but constrain what a teacher can actually do.</p>
    </div>
    <div class="policy-table-wrap">
      <table class="policy-table">
        <thead>
          <tr><th>Policy</th><th>Governs</th><th>Captured / enforced</th><th>Reference</th></tr>
        </thead>
        <tbody>
          <tr>
            <td class="what">Vetting</td>
            <td class="governs">Whether this teacher can be assigned to any student, session, or marketplace listing at all.</td>
            <td class="where">A hard gate, independent of the account existing &mdash; see Phase 4.</td>
            <td class="ref-cell"><span>vetting_status</span></td>
          </tr>
          <tr>
            <td class="what">Recording consent</td>
            <td class="governs">Whether a live session can actually be recorded &mdash; set by the student's own guardian, not the teacher.</td>
            <td class="where">Checked when a teacher tries to start a session recording; without it, recording simply doesn't start.</td>
            <td class="ref-cell"><span>recording_consent_required</span></td>
          </tr>
          <tr>
            <td class="what">Recording retention</td>
            <td class="governs">How long a session recording is kept before automatic deletion.</td>
            <td class="where">Workspace-configured window; early deletion runs through its own approval trail.</td>
            <td class="ref-cell"><span>parent_trust_retention_days</span></td>
          </tr>
          <tr>
            <td class="what">Proctoring evidence retention</td>
            <td class="governs">How long snapshot and voice-activity evidence from a proctored exam survives.</td>
            <td class="where">Default 30 days, workspace-configurable, but hard-capped at 90 &mdash; enforced automatically even if no one ever opens the review page.</td>
            <td class="ref-cell"><span>pqh_seb_proctor_retention_days()</span></td>
          </tr>
          <tr>
            <td class="what">Communications consent</td>
            <td class="governs">Whether a student can be messaged directly, and whether that message is visible to their parent.</td>
            <td class="where">Set by the guardian at the student's own intake &mdash; a teacher doesn't control this, only operates within it.</td>
            <td class="ref-cell"><span>local_prequran_comm_consent</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>

  <footer>local_hubredirect &middot; public_teacher_intake.php, teacher_intake_requests.php, teacher_intake.php, teacher_marketplace_admin.php, teacher_workspace.php, seb_lib.php, seb_proctor_review.php, live_recordings_admin.php, communications.php, support.php</footer>

</div>
