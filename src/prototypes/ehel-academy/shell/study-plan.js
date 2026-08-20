// Shared Study Plan page for the course-app shell — the year at a
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
// Weeks are the school calendar's real teaching weeks — SCHOOL_CALENDAR below
// — allocated evenly across a term's units with the remainder given to the
// earlier units. Units are grouped into terms by their manifest termId when
// the data names all three terms; a subject whose manifest carries no term
// metadata (Global Perspectives) or spans fewer terms than the school year
// (some Computing stages) gets its units distributed evenly across the three
// school terms instead, because the calendar is the school's, not the pack's.

// The school's academic calendar as published for 2026-27, half terms
// included. A term's teaching weeks are the Mondays from its opening week to
// its closing week with the half-term week removed — so the three terms
// really hold 14, 11 and 10 teaching weeks, not a nominal 12. English's own
// renderers import these too, so every plan reads one calendar. When the
// school publishes the next year's dates, this constant is the one place to
// change.
export const SCHOOL_CALENDAR = {
  yearLabel: "2026–27",
  terms: [
    { termNo: 1, opens: "2026-08-25", ends: "2026-12-04", halfTerm: { from: "2026-10-12", to: "2026-10-16" } },
    { termNo: 2, opens: "2027-01-05", ends: "2027-03-25", halfTerm: { from: "2027-02-15", to: "2027-02-19" } },
    { termNo: 3, opens: "2027-04-20", ends: "2027-07-02", halfTerm: { from: "2027-05-24", to: "2027-05-28" } },
  ],
};
const WEEK_MS = 7 * 24 * 3600 * 1000;
function mondayOf(iso) {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
  return date;
}
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export function formatDay(date, { long = false } = {}) {
  return `${date.getUTCDate()} ${long ? MONTH_NAMES[date.getUTCMonth()] : MONTH_NAMES[date.getUTCMonth()].slice(0, 3)}`;
}
// { ...term, weeks: [Monday, …] teaching weeks only, halfIndex: how many
// teaching weeks come before the half-term break } — or null for a term
// number the calendar does not know.
export function calendarTerm(termNo) {
  const term = SCHOOL_CALENDAR.terms.find((entry) => entry.termNo === Number(termNo));
  if (!term) return null;
  const halfMonday = mondayOf(term.halfTerm.from).getTime();
  const end = new Date(`${term.ends}T00:00:00Z`);
  const weeks = [];
  let halfIndex = null;
  for (let date = mondayOf(term.opens); date <= end; date = new Date(date.getTime() + WEEK_MS)) {
    if (date.getTime() === halfMonday) { halfIndex = weeks.length; continue; }
    weeks.push(date);
  }
  return { ...term, weeks, halfIndex };
}
export function termDatesLabel(termNo) {
  const term = SCHOOL_CALENDAR.terms.find((entry) => entry.termNo === Number(termNo));
  if (!term) return "";
  const opens = new Date(`${term.opens}T00:00:00Z`);
  const ends = new Date(`${term.ends}T00:00:00Z`);
  return `${formatDay(opens, { long: true })} – ${formatDay(ends, { long: true })} ${ends.getUTCFullYear()}`;
}
export function halfTermRow(termNo, columns) {
  const cal = calendarTerm(termNo);
  if (!cal || cal.halfIndex === null) return "";
  const from = new Date(`${cal.halfTerm.from}T00:00:00Z`);
  const to = new Date(`${cal.halfTerm.to}T00:00:00Z`);
  return `<tr><td>—</td><td><strong>Half term</strong> — ${formatDay(from)} to ${formatDay(to)}: no lessons this week</td>${columns > 2 ? "<td>—</td>" : ""}</tr>`;
}
// Fallback for a term number outside the published calendar.
const FALLBACK_TERM_WEEKS = 12;
export function termWeekTotal(termNo) {
  return calendarTerm(termNo)?.weeks.length ?? FALLBACK_TERM_WEEKS;
}

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

function weekRows(units, weekTotal) {
  const base = Math.floor(weekTotal / units.length);
  const extra = weekTotal - base * units.length;
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
  const termTable = (term) => {
    const cal = calendarTerm(term.termNo);
    const weekTotal = cal?.weeks.length ?? FALLBACK_TERM_WEEKS;
    const rows = weekRows(term.units, weekTotal);
    const isFirstTerm = term.termNo === terms[0].termNo;
    const isLastTerm = term.termNo === terms[terms.length - 1].termNo;
    // Week numbers carry their real week-commencing dates, and the half-term
    // break is drawn as its own row at its calendar position — inside a
    // unit's span when that is where it falls.
    const weekLabel = (row) => {
      const range = row.from === row.to ? `Week ${row.from}` : `Weeks ${row.from}–${row.to}`;
      if (!cal) return range;
      return `${range}<br><small>${formatDay(cal.weeks[row.from - 1])} – ${formatDay(new Date(cal.weeks[row.to - 1].getTime() + 4 * 24 * 3600 * 1000))}</small>`;
    };
    const columns = hasDetail ? 3 : 2;
    const rowsHtml = rows.map((row) => {
      const unitRow = `<tr><td>${weekLabel(row)}</td><td><strong>Unit ${row.unit.number}: ${ui.escapeHtml(row.unit.title)}</strong></td>${hasDetail ? `<td>${ui.escapeHtml(String(options.unitDetail(row.unit) ?? "—"))}</td>` : ""}</tr>`;
      // The break lands after teaching week `halfIndex`; draw it under the
      // unit row whose span contains that boundary.
      const breakHere = cal && cal.halfIndex !== null && row.from <= cal.halfIndex && cal.halfIndex <= row.to && (row === rows[rows.length - 1] || cal.halfIndex < rows[rows.indexOf(row) + 1].from);
      return unitRow + (breakHere ? halfTermRow(term.termNo, columns) : "");
    }).join("");
    return `<section class="panel">
      <span class="eyebrow">Term ${term.termNo}${cal ? ` · ${termDatesLabel(term.termNo)}` : ""}</span>
      <div class="teacher-table-scroll"><table class="teacher-table"><thead><tr><th>Weeks</th><th>Unit</th>${hasDetail ? `<th>${ui.escapeHtml(detailHeader)}</th>` : ""}</tr></thead><tbody>
        ${isFirstTerm ? `<tr><td>Week 1${cal ? `<br><small>from ${formatDay(cal.weeks[0])}</small>` : ""}</td><td><strong>${ui.escapeHtml(options.examLabel())}</strong> — finds your starting point before Unit ${options.firstUnitNumber}; it is never a fail</td>${hasDetail ? "<td>—</td>" : ""}</tr>` : ""}
        ${rowsHtml}
        ${isLastTerm && finalRow ? `<tr><td>Week ${weekTotal}${cal ? `<br><small>from ${formatDay(cal.weeks[weekTotal - 1])}</small>` : ""}</td><td><strong>${ui.escapeHtml(finalRow.title)}</strong>${finalRow.note ? ` — ${ui.escapeHtml(finalRow.note)}` : ""}</td>${hasDetail ? "<td>—</td>" : ""}</tr>` : ""}
      </tbody></table></div>
    </section>`;
  };
  ui.$("#app").innerHTML = `${ui.pageHeader(
    `${options.stageLabel} · Prerequisite unit`,
    `${options.stageLabel} ${options.subjectLabel} Study Plan`,
    `Your ${SCHOOL_CALENDAR.yearLabel} year at a glance: ${terms.length} terms, ${allUnits.length} units, and where each one falls. The dates follow the school calendar, half terms included.`,
    // "Stage Study Plan" for the staged subjects, "Level Study Plan" for
    // Intensive English — each subject passes its own word.
    options.planName || "Study Plan",
  )}
    <div class="final-quiz-intro">
      <section class="panel">
        <div class="final-quiz-facts"><span><strong>${SCHOOL_CALENDAR.yearLabel}</strong> school year</span><span><strong>${allUnits.length}</strong> units</span><span><strong>${terms.length}</strong> terms</span><span><strong>5</strong> short sessions a week</span></div>
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
    const row = weekRows(term.units, termWeekTotal(term.termNo)).find((entry) => Number(entry.unit.number) === Number(options.unitNumber));
    if (row) { span = { termNo: term.termNo, from: row.from, to: row.to, cal: calendarTerm(term.termNo) }; break; }
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
  // Each week names its real week-commencing date from the school calendar,
  // and a week that follows straight after the half-term break says so.
  const weekEyebrow = (weekIndex) => {
    if (!span) return `Week ${weekIndex + 1}`;
    const weekNo = span.from + weekIndex;
    let label = `Week ${weekNo} · Term ${span.termNo}`;
    if (span.cal) {
      label += ` · week of ${formatDay(span.cal.weeks[weekNo - 1])}`;
      if (span.cal.halfIndex === weekNo - 1) label += " (after half term)";
    }
    return label;
  };
  const weekPanel = (weekIndex) => `<section class="panel">
      <span class="eyebrow">${weekEyebrow(weekIndex)}</span>
      <ol class="path-list">
        ${dayLines.slice(weekIndex * 5, weekIndex * 5 + 5).map((what, dayIndex) => `<li>${ui.icon("circle-check-big")}<span><strong>Day ${dayIndex + 1}:</strong> ${what}</span></li>`).join("")}
      </ol>
    </section>`;
  ui.$("#app").innerHTML = `${ui.pageHeader(
    `${options.stageLabel} · Unit ${options.unitNumber}`,
    `Your plan for ${ui.escapeHtml(options.unitTitle)}`,
    span
      ? `This unit takes ${weekCount} week${weekCount === 1 ? "" : "s"} — week${weekCount === 1 ? ` ${span.from}` : `s ${span.from} to ${span.to}`} of Term ${span.termNo}${span.cal ? ` (${formatDay(span.cal.weeks[span.from - 1])} – ${formatDay(new Date(span.cal.weeks[span.to - 1].getTime() + 4 * 24 * 3600 * 1000))})` : ""}. Five short days a week; here is what each one brings.`
      : `Five short days a week; here is what each one brings.`,
    "Unit Study Plan",
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
