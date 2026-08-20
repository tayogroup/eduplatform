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
