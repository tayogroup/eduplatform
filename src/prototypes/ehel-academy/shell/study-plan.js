// Shared Student Study Plan page for the course-app shell — the year at a
// glance, drawn from the course manifest at render time so it can never
// disagree with the course it describes. English grew the page first
// (subjects/english.js :: renderYearPlan) and the other subjects share this
// one; the shape is identical, the data per subject comes in through the
// factory options the same way placement.js takes its chrome.
//
// It lives in the Prerequisite unit, under Overview and the exam entry,
// because it is read before the year is walked. It is a reference page, not a
// step: subjects must keep its route ("year-plan") out of anything countable.
//
// Weeks are per-term teaching weeks on the standing school calendar — three
// terms of three months, ~12 teaching weeks each — allocated evenly across a
// term's units with the remainder given to the earlier units. Units are
// grouped into terms by their manifest termId when the data names all three
// terms; a subject whose manifest carries no term metadata (Global
// Perspectives) or spans fewer terms than the school year (some Computing
// stages) gets its units distributed evenly across the three school terms
// instead, because the calendar is the school's, not the pack's.

const TERM_WEEKS = 12;

function groupIntoTerms(units) {
  const byTerm = new Map();
  for (const unit of units) {
    const termNo = Number(String(unit.termId || "").replace(/\D/g, "")) || 0;
    if (!byTerm.has(termNo)) byTerm.set(termNo, []);
    byTerm.get(termNo).push(unit);
  }
  if (byTerm.size === 3 && !byTerm.has(0)) {
    return [...byTerm.entries()].sort(([a], [b]) => a - b).map(([, termUnits], index) => ({ termNo: index + 1, units: termUnits }));
  }
  // Near-equal thirds, remainder to the earlier terms: 4 units read 2+1+1, not
  // 2+2+0 — the school year has three terms whatever the pack's shape.
  const base = Math.floor(units.length / 3);
  const extra = units.length % 3;
  let start = 0;
  return [0, 1, 2]
    .map((index) => {
      const size = base + (index < extra ? 1 : 0);
      const termUnits = units.slice(start, start + size);
      start += size;
      return { termNo: index + 1, units: termUnits };
    })
    .filter((term) => term.units.length);
}

function weekRows(units) {
  const base = Math.floor(TERM_WEEKS / units.length);
  const extra = TERM_WEEKS - base * units.length;
  let start = 1;
  return units.map((unit, index) => {
    const span = Math.max(1, base + (index < extra ? 1 : 0));
    const row = { unit, from: start, to: start + span - 1 };
    start += span;
    return row;
  });
}

// options:
//   deps()          — late-bound shell services: { $, $$, escapeHtml, icon,
//                     pageHeader, navigate }
//   stageLabel      — "Stage 5" / "Grade 5" / "Level 1: Foundation"
//   subjectLabel    — "Science", used in the page title
//   units()         — the manifest units to schedule, already filtered to what
//                     a learner walks (no withdrawn units, no planned stubs)
//   examLabel()     — "Placement exam" or "Readiness check"
//   firstUnitNumber — the unit the course opens at
//   firstUnitHref(route) — URL of that unit
//   rhythm          — [[day, name, what], …] the subject's five-day pattern
//   unitDetailHeader / unitDetail(unit) — optional third table column
//   finalRow()      — optional { title, note } drawn in the last term's final
//                     week (a course final quiz or grade capstone)
//   headerNote()    — optional sentence under the facts strip
export function renderStudyPlan(options) {
  const ui = options.deps();
  const terms = groupIntoTerms(options.units());
  const allUnits = terms.flatMap((term) => term.units);
  const hasDetail = Boolean(options.unitDetail);
  const detailHeader = options.unitDetailHeader || "";
  const finalRow = options.finalRow ? options.finalRow() : null;
  const headerNote = options.headerNote ? options.headerNote() : null;
  const weekLabel = (row) => (row.from === row.to ? `Week ${row.from}` : `Weeks ${row.from}–${row.to}`);
  const termTable = (term) => {
    const rows = weekRows(term.units);
    const isFirstTerm = term.termNo === terms[0].termNo;
    const isLastTerm = term.termNo === terms[terms.length - 1].termNo;
    return `<section class="panel">
      <span class="eyebrow">Term ${term.termNo} · Months ${(term.termNo - 1) * 3 + 1}–${term.termNo * 3}</span>
      <div class="teacher-table-scroll"><table class="teacher-table"><thead><tr><th>Weeks</th><th>Unit</th>${hasDetail ? `<th>${ui.escapeHtml(detailHeader)}</th>` : ""}</tr></thead><tbody>
        ${isFirstTerm ? `<tr><td>Week 1</td><td><strong>${ui.escapeHtml(options.examLabel())}</strong> — finds your starting point before Unit ${options.firstUnitNumber}; it is never a fail</td>${hasDetail ? "<td>—</td>" : ""}</tr>` : ""}
        ${rows.map((row) => `<tr><td>${weekLabel(row)}</td><td><strong>Unit ${row.unit.number}: ${ui.escapeHtml(row.unit.title)}</strong></td>${hasDetail ? `<td>${ui.escapeHtml(String(options.unitDetail(row.unit) ?? "—"))}</td>` : ""}</tr>`).join("")}
        ${isLastTerm && finalRow ? `<tr><td>Week ${TERM_WEEKS}</td><td><strong>${ui.escapeHtml(finalRow.title)}</strong>${finalRow.note ? ` — ${ui.escapeHtml(finalRow.note)}` : ""}</td>${hasDetail ? "<td>—</td>" : ""}</tr>` : ""}
      </tbody></table></div>
    </section>`;
  };
  ui.$("#app").innerHTML = `${ui.pageHeader(
    `${options.stageLabel} · Prerequisite unit`,
    `${options.stageLabel} ${options.subjectLabel} Student Study Plan`,
    `Your year at a glance: ${terms.length} terms of three months, ${allUnits.length} units, and where each one falls. Every term is about ${TERM_WEEKS} teaching weeks, so there is room for holidays.`,
    "Student Study Plan",
  )}
    <div class="final-quiz-intro">
      <section class="panel">
        <div class="final-quiz-facts"><span><strong>${allUnits.length}</strong> units</span><span><strong>${terms.length}</strong> terms</span><span><strong>5</strong> short sessions a week</span></div>
        ${headerNote ? `<p>${ui.escapeHtml(headerNote)}</p>` : ""}
      </section>
      ${terms.map(termTable).join("")}
      <section class="panel"><h3>The weekly rhythm</h3><p>Every unit runs on the same five-day pattern, so you always know what kind of work today brings.</p><ol class="path-list">
        ${options.rhythm.map(([day, name, what]) => `<li>${ui.icon("circle-check-big")}<span><strong>${ui.escapeHtml(day)} · ${ui.escapeHtml(name)}:</strong> ${ui.escapeHtml(what)}</span></li>`).join("")}
      </ol></section>
      <div class="audio-actions"><button class="button gold" data-go="placement" type="button">Start the ${ui.escapeHtml(options.examLabel().toLowerCase())} ${ui.icon("arrow-right")}</button><a class="button secondary" href="${options.firstUnitHref("overview")}">Open Unit ${options.firstUnitNumber} ${ui.icon("arrow-right")}</a></div>
    </div>`;
  for (const button of ui.$$("[data-go]")) button.addEventListener("click", () => ui.navigate(button.dataset.go));
}

// ===================== per-unit study plan ===================================
// The unit-level companion to the grade plan above: that one says WHERE each
// unit falls in the year; this one, an entry in the unit's own sidebar, says
// what the learner does on each day of the weeks they are inside it. English
// plans by naming the unit's items (word groups, story titles — its data
// carries real names for everything); the five shared subjects' unit shapes
// differ too much for that, so this plans by the unit's own teaching SECTIONS
// — the sidebar walk the learner already follows, in its own order — spread
// across the unit's calendar weeks, five days a week. The week span comes from
// the same groupIntoTerms()/weekRows() the grade plan uses, so the two pages
// cannot disagree about the calendar.
//
// options:
//   deps()          — as renderStudyPlan
//   stageLabel      — "Stage 5" / "Level 1"
//   unitNumber      — the open unit's number
//   unitTitle       — its title
//   units()         — the manifest units the grade plan schedules (same list)
//   planSections()  — the unit's teaching sections to spread, in walk order,
//                     as [id, icon, label] tuples — pass the subject's own
//                     visible list minus its non-teaching entries, so a
//                     section this unit does not offer is never scheduled
export function renderUnitStudyPlan(options) {
  const ui = options.deps();
  let span = null;
  for (const term of groupIntoTerms(options.units())) {
    const row = weekRows(term.units).find((entry) => Number(entry.unit.number) === Number(options.unitNumber));
    if (row) { span = { termNo: term.termNo, from: row.from, to: row.to }; break; }
  }
  const weekCount = span ? span.to - span.from + 1 : 2;
  const parts = options.planSections();
  // One line per day, computed over the WHOLE unit rather than week by week.
  // Two shapes, chosen by which side is scarcer:
  //  - more parts than days → several parts share a day, named together;
  //  - more days than parts (a guided Global Perspectives unit offers four
  //    parts across six weeks) → each part gets a RUN of days — "Start /
  //    Carry on with / Finish" — because a Mini-Project genuinely spans
  //    weeks. The first cut of this page gave every part one day and filled
  //    the rest with "go back over" lines, which read as five empty weeks.
  // The unit's final day is always the look-back.
  const totalDays = weekCount * 5;
  const dayLines = (() => {
    const lines = [];
    if (parts.length >= totalDays) {
      const base = Math.floor(parts.length / totalDays);
      const extra = parts.length % totalDays;
      let start = 0;
      for (let day = 0; day < totalDays; day += 1) {
        const size = base + (day < extra ? 1 : 0);
        lines.push(parts.slice(start, start + size).map((part) => `<strong>${ui.escapeHtml(part[2])}</strong>`).join(" · "));
        start += size;
      }
      return lines;
    }
    if (!parts.length) {
      while (lines.length < totalDays - 1) lines.push("Go back over what was new this week.");
      lines.push("Look back over the whole unit before you move on.");
      return lines;
    }
    const workDays = Math.max(parts.length, totalDays - 1);
    const base = Math.floor(workDays / parts.length);
    const extra = workDays % parts.length;
    for (let index = 0; index < parts.length; index += 1) {
      const label = `<strong>${ui.escapeHtml(parts[index][2])}</strong>`;
      const spanDays = base + (index < extra ? 1 : 0);
      for (let day = 0; day < spanDays; day += 1) {
        if (spanDays === 1) lines.push(label);
        else if (day === 0) lines.push(`Start ${label}.`);
        else if (day === spanDays - 1) lines.push(`Finish ${label}.`);
        else lines.push(`Carry on with ${label}.`);
      }
    }
    while (lines.length < totalDays - 1) lines.push("Go back over what was new this week.");
    lines.push("Look back over the whole unit before you move on.");
    return lines.slice(0, totalDays);
  })();
  const weekPanel = (weekIndex) => `<section class="panel">
      <span class="eyebrow">${span ? `Week ${span.from + weekIndex} · Term ${span.termNo}` : `Week ${weekIndex + 1}`}</span>
      <ol class="path-list">
        ${dayLines.slice(weekIndex * 5, weekIndex * 5 + 5).map((what, dayIndex) => `<li>${ui.icon("circle-check-big")}<span><strong>Day ${dayIndex + 1}:</strong> ${what}</span></li>`).join("")}
      </ol>
    </section>`;
  ui.$("#app").innerHTML = `${ui.pageHeader(
    `${options.stageLabel} · Unit ${options.unitNumber}`,
    `Your plan for ${ui.escapeHtml(options.unitTitle)}`,
    span
      ? `This unit takes ${weekCount} week${weekCount === 1 ? "" : "s"} — week${weekCount === 1 ? ` ${span.from}` : `s ${span.from} to ${span.to}`} of Term ${span.termNo}. Five short days a week; here is what each one brings.`
      : `Five short days a week; here is what each one brings.`,
    "Student Study Plan",
  )}
    <div class="final-quiz-intro">
      <section class="panel">
        <div class="final-quiz-facts"><span><strong>${weekCount}</strong> week${weekCount === 1 ? "" : "s"}</span><span><strong>${parts.length}</strong> parts</span><span><strong>5</strong> short sessions a week</span></div>
      </section>
      ${Array.from({ length: weekCount }, (_, index) => weekPanel(index)).join("")}
      <div class="audio-actions"><button class="button gold" data-go="${parts.length ? parts[0][0] : "overview"}" type="button">Start with ${parts.length ? ui.escapeHtml(parts[0][2]) : "the overview"} ${ui.icon("arrow-right")}</button><button class="button secondary" data-go="overview" type="button">Back to the overview</button></div>
    </div>`;
  for (const button of ui.$$("[data-go]")) button.addEventListener("click", () => ui.navigate(button.dataset.go));
}
