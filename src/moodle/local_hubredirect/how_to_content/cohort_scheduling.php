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
    <h1>Cross-timezone cohorts: from availability to a scheduled class</h1>
    <p class="dek">How the platform turns captured availability into teaching groups when students and teachers sit in different time zones &mdash; capture, the session requirement, computed cohort proposals, shift-aware teacher matching, and one-click approval that schedules a DST-safe term of live sessions.</p>
    <div class="legend">
      <span class="tag"><span class="dot admin"></span>Workspace admin</span>
      <span class="tag"><span class="dot person"></span>Student / teacher</span>
      <span class="tag"><span class="dot system"></span>System (EduPlatform)</span>
    </div>
  </div>

  <!-- PHASE 1 -->
  <section class="phase">
    <div class="phase-num">1</div>
    <div>
      <div class="phase-head"><h2 class="phase-title">Capture availability &mdash; both sides</h2></div>
      <p class="phase-intro">Matching is only as good as its inputs. Every intake path now stores the <em>structured</em> weekly grid (day + hour + time zone), not just a text note.</p>

      <div class="step">
        <div class="actor"><b>Student/parent</b>ticks slots</div>
        <div class="step-body">
          <p>The public enrollment form and the admin student-intake form both carry the weekly grid (&ldquo;select all recurring times that could work&rdquo;) plus the family&rsquo;s <strong>time zone</strong> and desired <strong>sessions per week</strong>. Hours are the family&rsquo;s own local time.</p>
          <p><span class="ref">public_intake.php</span> &middot; <span class="ref">student_intake.php</span></p>
        </div>
      </div>
      <div class="step">
        <div class="actor"><b>System</b>persists</div>
        <div class="step-body">
          <p>The grid is saved as structured data on the student profile (<span class="pill">availability_json</span>). Transferring a public request into a real student carries the slots across automatically. To <em>change</em> a student&rsquo;s availability later, re-run Student Intake for that student &mdash; the same grid edits the same record.</p>
          <p><span class="ref">student_profile.availability_json</span> &middot; <span class="ref">pqav_student_intervals()</span></p>
        </div>
      </div>
      <div class="step">
        <div class="actor"><b>Teacher</b>applies</div>
        <div class="step-body">
          <p>The educator application captures the same weekly grid in the teacher&rsquo;s local time. When an admin converts the application, the slots become structured availability rows; teachers maintain them afterwards on the availability calendar.</p>
          <p><span class="ref">public_teacher_intake.php</span> &middot; <span class="ref">teacher_intake.php</span> &middot; <span class="ref">live_availability.php</span></p>
        </div>
      </div>
      <div class="step">
        <div class="actor"><b>Admin</b>assigns a shift</div>
        <div class="step-body">
          <p>On the teacher profile, <strong>Teaching shift</strong> caps when a teacher can be matched, regardless of what they declared:</p>
          <p><span class="pill">Shift 1</span> 10:00&ndash;20:00 EAT &mdash; Africa daytime, Europe afternoon, Asia/Oceania evening.<br>
             <span class="pill">Shift 2</span> 20:00&ndash;06:00 EAT &mdash; Europe evening, Americas evening.</p>
          <p>Matching uses declared hours <em>intersected</em> with the shift window &mdash; a shift never grants hours the teacher didn&rsquo;t declare. &ldquo;No shift restriction&rdquo; leaves declared hours as-is. Rotation is a one-field change; every later proposal recomputes.</p>
          <p><span class="ref">teacher_intake.php &rarr; Teaching shift</span></p>
        </div>
      </div>

      <div class="step">
        <div class="actor"><b>System</b>thinks in UTC</div>
        <div class="step-body">
          <p><strong>How matching thinks.</strong> Everything converts to shared UTC hours before comparison. Time-zone <em>names</em> are display-only: a Nairobi teacher and a Moscow student (both UTC+3) overlap perfectly despite different zone names, while Nairobi and Lagos (2h apart, both &ldquo;Africa/&hellip;&rdquo;) don&rsquo;t overlap just because the names look similar. The one question asked: <em>do these people&rsquo;s hours actually intersect, enough to host the required sessions?</em></p>
          <p>Known coverage hole with the two shifts: 03:00&ndash;07:00 UTC &mdash; late evening for US Pacific families. Proposals say so explicitly when demand lands there.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- PHASE 2 -->
  <section class="phase">
    <div class="phase-num">2</div>
    <div>
      <div class="phase-head"><h2 class="phase-title">State the session requirement on the offering</h2></div>
      <p class="phase-intro">&ldquo;3 &times; 60 minutes per week&rdquo; is a property of the course offering, and matching has to satisfy it &mdash; on distinct days.</p>

      <div class="step">
        <div class="actor"><b>Admin</b>sets</div>
        <div class="step-body">
          <p>On the offering form, beside Seats: <strong>Live sessions per week</strong> and <strong>Session length (minutes)</strong>. Leave at 0 for courses with no live-session requirement &mdash; matching then only asks for any shared hour.</p>
          <p><span class="ref">course_offerings.php &rarr; Create/Edit Offering</span></p>
        </div>
      </div>
    </div>
  </section>

  <!-- PHASE 3 -->
  <section class="phase">
    <div class="phase-num">3</div>
    <div>
      <div class="phase-head"><h2 class="phase-title">Propose cohorts</h2></div>
      <p class="phase-intro">The system clusters the offering&rsquo;s students by real overlap and shows groups you can approve &mdash; plus, just as important, who it <em>couldn&rsquo;t</em> place and why.</p>

      <div class="step">
        <div class="actor"><b>Admin</b>opens</div>
        <div class="step-body">
          <p>Live grouping &rarr; <strong>Cohort Proposals</strong> &rarr; choose the course offering. Students considered: those with enrollment requests (pending / approved / enrolled) not already placed in a cohort for this offering &mdash; re-running proposals never double-groups anyone.</p>
          <p><span class="ref">live_grouping.php &rarr; Cohort Proposals</span></p>
        </div>
      </div>
      <div class="step">
        <div class="actor"><b>System</b>clusters</div>
        <div class="step-body">
          <p>Most-constrained student first: whoever has the fewest available hours seeds a cohort, and others join only while the group&rsquo;s <em>common</em> windows can still host the required sessions on distinct days. Flexible students can&rsquo;t strand tightly-constrained ones.</p>
          <p>Example: ten Grade&nbsp;2 requests &mdash; five families in Nairobi (evenings), five in New York (evenings) &mdash; split into two cohorts automatically. Their windows never touch.</p>
        </div>
      </div>
      <div class="step">
        <div class="actor"><b>System</b>reports the leftovers</div>
        <div class="step-body">
          <p>A <strong>Not placed</strong> table lists every student the engine couldn&rsquo;t seat, each with a reason: <em>no availability recorded</em> (fix: re-run Student Intake and tick the grid) or <em>own availability cannot host the required sessions</em> (fix: more slots, or fewer sessions/week on the offering).</p>
        </div>
      </div>
    </div>
  </section>

  <!-- PHASE 4 -->
  <section class="phase">
    <div class="phase-num">4</div>
    <div>
      <div class="phase-head"><h2 class="phase-title">Teacher matching &mdash; shift-aware, load-balanced</h2></div>
      <p class="phase-intro">For each proposed cohort the system ranks teachers by whether they can actually host the sessions inside the cohort&rsquo;s common windows.</p>

      <div class="step">
        <div class="actor"><b>System</b>ranks</div>
        <div class="step-body">
          <p>Order: <strong>viability</strong> first (can this teacher&rsquo;s shift-capped hours host N sessions of D minutes inside the cohort windows), then <strong>lowest current weekly teaching load</strong>, then spare overlap. Two equally-viable teachers alternate cohorts instead of the first absorbing everything; the proposal shows each teacher&rsquo;s current load (&ldquo;current load 3h/wk&rdquo;).</p>
        </div>
      </div>
      <div class="step">
        <div class="actor"><b>System</b>flags dead ends</div>
        <div class="step-body">
          <p>When no teacher fits, the proposal says exactly what would: <em>&ldquo;No teacher with recorded availability can host these windows &mdash; recruit for Mon 21:00&ndash;23:00 UTC or adjust student hours.&rdquo;</em> That is the hiring signal, caught before any family is promised a class.</p>
          <p>Note: a teacher who hasn&rsquo;t filled in their availability calendar never appears in rankings &mdash; &ldquo;no viable teacher&rdquo; can also mean &ldquo;teachers haven&rsquo;t recorded hours yet&rdquo;.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- PHASE 5 -->
  <section class="phase">
    <div class="phase-num">5</div>
    <div>
      <div class="phase-head"><h2 class="phase-title">Approve &mdash; group, members, and a term of sessions</h2></div>
      <p class="phase-intro">One click per cohort. Everything downstream is created for you.</p>

      <div class="step">
        <div class="actor"><b>Admin</b>approves</div>
        <div class="step-body">
          <p>Optionally rename the cohort, then <strong>Approve cohort</strong>. A cohort with no viable teacher can still be approved teacher-less (&ldquo;Approve cohort without teacher&rdquo;) to reserve the grouping while you recruit.</p>
        </div>
      </div>
      <div class="step">
        <div class="actor"><b>System</b>creates</div>
        <div class="step-body">
          <p>A class group <em>linked to the course offering</em>, its student members, and &mdash; when a teacher and session requirement exist &mdash; the actual live sessions across the offering&rsquo;s date range (capped at 26 weeks; 12 weeks when no end date), with the teacher and every student attached as participants.</p>
          <p><span class="ref">local_prequran_class_group.offeringid</span> &middot; <span class="ref">pqav_generate_session_times()</span></p>
        </div>
      </div>
      <div class="step">
        <div class="actor"><b>System</b>keeps clocks honest</div>
        <div class="step-body">
          <p>Sessions are anchored to the <strong>teacher&rsquo;s time zone</strong> (recorded on each session): when a student&rsquo;s country changes its clocks and the teacher&rsquo;s doesn&rsquo;t, the class keeps its teacher-local hour and the family sees the shift &mdash; the deliberate policy for teacher-led classes. Occurrences that would double-book the teacher are <strong>skipped and reported</strong>, never silently stacked.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- PHASE 6 -->
  <section class="phase">
    <div class="phase-num">6</div>
    <div>
      <div class="phase-head"><h2 class="phase-title">Ongoing &mdash; changes, conflicts, rotation</h2></div>
      <p class="phase-intro">The rules that keep the schedule true after day one.</p>

      <div class="step">
        <div class="actor"><b>Admin</b>updates availability</div>
        <div class="step-body">
          <p>Student schedules change: re-run <strong>Student Intake</strong> for that student and tick the new grid. Teacher hours change: the teacher edits their availability calendar. Shift rotation: change the one <strong>Teaching shift</strong> field. Existing sessions stand; future proposals use the new data.</p>
        </div>
      </div>
      <div class="step">
        <div class="actor"><b>System</b>guards manual scheduling</div>
        <div class="step-body">
          <p>Creating one-off sessions by hand (live sessions page, creation wizard) checks the teacher&rsquo;s availability <em>time-zone-correctly</em>, honours their shift window, and blocks real double-bookings (teacher or student overlap) unless explicitly overridden with a reason. A teacher scheduling their own session bypasses the availability advisory but never real overlaps.</p>
          <p><span class="ref">live_sessions.php</span> &middot; <span class="ref">live_create_wizard.php</span></p>
        </div>
      </div>
    </div>
  </section>

  <footer>local_hubredirect / local_prequran &middot; availabilitylib.php, live_grouping.php, course_offerings.php, student_intake.php, teacher_intake.php, live_sessions.php, live_create_wizard.php</footer>
</div>
