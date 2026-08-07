// Shared Prerequisite-unit (placement exam) UI for the course-app shell.
// Every subject's Prerequisite is unit -1: a placement exam over the previous
// stages' essential outcomes, described entirely by that grade's
// placement-exam.json (questions, banding thresholds, per-section remediation
// links). This module renders the three placement pages — overview, exam,
// teacher view — from that data; subjects supply their own chrome (labels,
// URLs, progress plumbing) through the factory options, so English's
// hand-rolled implementation and the four shell subjects stay behaviourally
// identical without four more copies of this logic.
//
// The exam is read, not narrated: no voiceButton/data-speak markup is emitted
// here, so the per-subject audio-coverage checks see no new Listen buttons.

import { requireExamLockdown, finishExamSession } from "../shared/exam-lockdown.js?v=20260808a";

export const PREREQ_UNIT = -1;

export function loadPlacementStore(storageKey) {
  const defaults = { answers: {}, attempts: [], currentIndex: 0, completed: false, band: null, submitted: false, startedAt: null };
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(storageKey) || "{}") };
  } catch {
    return { ...defaults };
  }
}

// options:
//   storageKey     — localStorage key for the exam state (per stage)
//   stageLabel     — "Stage 5" / "Grade 5", used in learner-facing copy
//   stageWord      — "Stage" or "Grade", for remediation-link and source labels
//   deps()         — late-bound shell services: { $, $$, escapeHtml, icon,
//                    pageHeader, toast, navigate, complete, emitProgress }
//   exam()         — the loaded placement-exam.json
//   hrefForUnit(stage, unit, route) — URL of a unit (stage null = current)
//   defaultUnitHref(route)          — URL of the first regular unit
//   tutorHref()    — URL of the AI tutor on the first regular unit (optional)
//   frameworkLabel — curriculum line for the teacher panel
export function createPlacementUnit(options) {
  const store = loadPlacementStore(options.storageKey);
  let questionIndex = 0;

  const save = () => localStorage.setItem(options.storageKey, JSON.stringify(store));

  function remediationHref(item) {
    if (item.href) return new URL(item.href, location.href).href;
    return options.hrefForUnit(item.grade ?? null, item.unit, "overview");
  }

  function remediationLabel(item) {
    if (item.href) return item.title || "Foundation course";
    const stagePart = item.grade != null ? `${options.stageWord || "Stage"} ${item.grade}, ` : "";
    return `${stagePart}Unit ${item.unit}: ${item.title}`;
  }

  function band(percent, sectionScores) {
    const exam = options.exam();
    const banding = exam.banding || {};
    const ready = banding.ready || {};
    const review = banding.readyWithReview || {};
    const criticalRule = banding.criticalSection;
    const critical = criticalRule && sectionScores.find((item) => item.id === criticalRule.sectionId);
    if (percent < (review.minOverallPercent ?? 50) || (critical && critical.percent <= (criticalRule.maxFailPercent ?? 40))) return "notReady";
    if (percent >= (ready.minOverallPercent ?? 80) && sectionScores.every((item) => item.percent >= (ready.minSectionPercent ?? 60))) return "ready";
    return "readyWithReview";
  }

  function results(answers = store.answers) {
    const exam = options.exam();
    const answered = exam.questions.filter((question) => answers[question.questionId]);
    const correct = answered.filter((question) => answers[question.questionId].selected === question.correctAnswer);
    const sectionScores = exam.sections.map((section) => {
      const questions = exam.questions.filter((question) => question.sectionId === section.sectionId);
      const score = questions.filter((question) => answers[question.questionId]?.selected === question.correctAnswer).length;
      return { id: section.sectionId, label: section.title, score, total: questions.length, percent: questions.length ? Math.round((score / questions.length) * 100) : 0, remediation: section.remediation || [] };
    });
    const areaNames = [...new Set(exam.questions.map((question) => question.curriculumArea))];
    const areaScores = areaNames.map((area) => {
      const questions = exam.questions.filter((question) => question.curriculumArea === area);
      const score = questions.filter((question) => answers[question.questionId]?.selected === question.correctAnswer).length;
      return { id: area, label: area, score, total: questions.length, percent: questions.length ? Math.round((score / questions.length) * 100) : 0 };
    });
    const percent = Math.round((correct.length / exam.totalMarks) * 100);
    return { answered: answered.length, score: correct.length, total: exam.totalMarks, percent, sectionScores, areaScores, band: band(percent, sectionScores) };
  }

  function finalize() {
    const ui = options.deps();
    const exam = options.exam();
    const outcome = results();
    if (!store.submitted) {
      store.attempts.push({
        attempt: store.attempts.length + 1,
        startedAt: store.startedAt,
        submittedAt: new Date().toISOString(),
        answers: { ...store.answers },
        score: outcome.score,
        total: outcome.total,
        percent: outcome.percent,
        band: outcome.band,
        sectionScores: outcome.sectionScores,
        areaScores: outcome.areaScores,
      });
    }
    store.currentIndex = exam.questions.length;
    store.completed = true;
    store.band = outcome.band;
    store.submitted = true;
    save();
    ui.complete("placement");
    ui.emitProgress({ type: "checkpoint.result", unit: "prereq", section: "placement-exam", score: outcome.percent, passed: outcome.band !== "notReady", attempt: store.attempts.length });
    renderResults(outcome);
    // In SEB the exam is over, so release the learner. Deliberately AFTER the
    // report is painted and the progress write is away: finishExamSession waits
    // before navigating, so the child sees their result and the score reaches
    // Moodle before the locked browser closes.
    finishExamSession();
  }

  function renderOverview() {
    const ui = options.deps();
    const exam = options.exam();
    const isReadiness = exam.kind === "readiness";
    const bandInfo = store.submitted && store.band ? (exam.banding[store.band] || {}) : null;
    ui.$("#app").innerHTML = `${ui.pageHeader(`${options.stageLabel} · Prerequisite unit`, exam.title, exam.description, isReadiness ? "Readiness check" : "Placement exam")}
      <div class="final-quiz-intro">
        <section class="panel final-quiz-hero"><div class="final-quiz-mark">${ui.icon("compass")}</div><span class="eyebrow">Before Unit 1</span><h2>${isReadiness ? "Let's see what you already know." : "Show what you remember — we'll find your perfect start."}</h2><p>${ui.escapeHtml(exam.attemptsAllowed || "You can try as many times as you like.")} Your answers save on this device after every question.</p><div class="final-quiz-facts"><span><strong>${exam.questionCount}</strong> questions</span><span><strong>${exam.estimatedMinutes}</strong> minutes</span><span><strong>${exam.sections.length}</strong> sections</span></div>
        ${bandInfo
          ? `<div class="audio-actions"><button class="button gold" data-go="placement" type="button">${ui.icon("chart-no-axes-column-increasing")} View my placement report</button><a class="button secondary" href="${options.defaultUnitHref("overview")}">Go to Unit 1 →</a></div>`
          : `<div class="audio-actions"><button class="button gold" data-go="placement" type="button">${isReadiness ? "Start readiness check" : "Start placement exam"} →</button><a class="button secondary" href="${options.defaultUnitHref("overview")}">Skip for now — open Unit 1</a></div>`}
        </section>
        <div class="final-section-grid">${exam.sections.map((section) => `<article class="panel final-section-card"><span>${String(section.sequence).padStart(2, "0")}</span><h3>${ui.escapeHtml(section.title)}</h3><p>${ui.escapeHtml(section.description)}</p><small>${section.questionCount} questions</small></article>`).join("")}</div>
        <section class="panel"><h3>How placement works</h3><ol class="path-list">
          <li><span>1</span><span><strong>Ready:</strong> you move straight on to Unit 1.</span></li>
          <li><span>2</span><span><strong>Ready with review:</strong> you start Unit 1 and warm up with a few review lessons.</span></li>
          <li><span>3</span><span><strong>Build strong roots first:</strong> we suggest the best course to grow from — a grown-up or teacher can help you choose.</span></li>
        </ol></section>
      </div>`;
    ui.$$("[data-go]").forEach((button) => button.addEventListener("click", () => ui.navigate(button.dataset.go)));
  }

  function renderExam() {
    const ui = options.deps();
    const exam = options.exam();
    if (store.submitted) return renderResults(results());
    // Exam-grade lockdown. The report and the overview stay reachable in an
    // ordinary tab; only the questions require Safe Exam Browser (or the
    // focus-mode fallback the server picks for devices that cannot run it).
    if (!requireExamLockdown({
      mount: ui.$("#app"),
      stageLabel: options.stageLabel,
      examTitle: exam.title,
      backHref: options.defaultUnitHref("overview"),
    })) return;
    const hasStarted = Object.keys(store.answers).length > 0 || store.startedAt;
    if (!hasStarted) {
      store.startedAt = new Date().toISOString();
      store.currentIndex = 0;
      save();
      questionIndex = 0;
      drawQuestion();
      return;
    }
    questionIndex = Math.min(store.currentIndex || 0, exam.questions.length - 1);
    drawQuestion();
  }

  function drawQuestion() {
    const ui = options.deps();
    const exam = options.exam();
    const question = exam.questions[questionIndex];
    if (!question) return finalize();
    const section = exam.sections.find((item) => item.sectionId === question.sectionId);
    const savedAnswer = store.answers[question.questionId];
    const choices = question.options.split(" | ");
    const sectionQuestionNumber = exam.questions.filter((item) => item.sectionId === question.sectionId && item.sequence <= question.sequence).length;
    const sourceNote = question.sourceGrade ? `From ${options.stageWord || "Stage"} ${question.sourceGrade}${question.sourceUnitNo ? ` · Unit ${question.sourceUnitNo}` : ""}` : "Getting-ready skills";
    ui.$("#app").innerHTML = `${ui.pageHeader(`Section ${section.sequence} of ${exam.sections.length}`, section.title, section.description, `Question ${questionIndex + 1} of ${exam.questionCount}`)}
      <section class="panel quiz-shell final-quiz-shell">
        <div class="quiz-top"><span>${sectionQuestionNumber} of ${section.questionCount} in this section</span><strong>${Object.keys(store.answers).length} answers saved</strong></div>
        <div class="progress-track"><span style="width:${(questionIndex / exam.questionCount) * 100}%"></span></div>
        <div class="final-question-meta"><span>${ui.escapeHtml(sourceNote)}</span></div>
        <h2 class="quiz-question">${ui.escapeHtml(question.question)}</h2>
        <div class="quiz-options">${choices.map((option) => {
          const isSelected = savedAnswer?.selected === option;
          const state = savedAnswer ? (option === question.correctAnswer ? "correct" : isSelected ? "wrong" : "") : "";
          return `<button class="quiz-option ${state}" data-placement-option="${ui.escapeHtml(option)}" type="button" ${savedAnswer ? "disabled" : ""}>${ui.escapeHtml(option)}</button>`;
        }).join("")}</div>
        <div id="placement-feedback" role="status" aria-live="polite" aria-atomic="true">${savedAnswer ? `<p class="feedback ${savedAnswer.correct ? "good" : "try"}"><span class="status-note">${savedAnswer.correct ? "Correct!" : "Not quite."}</span> ${ui.escapeHtml(question.explanation)}</p>` : ""}</div>
        <div class="final-quiz-actions"><span>Answers save on this device</span><button class="button primary" id="next-placement-question" type="button" ${savedAnswer ? "" : "hidden"}>${questionIndex === exam.questionCount - 1 ? "Finish and see my report" : "Next question"} →</button></div>
      </section>`;
    ui.$$("[data-placement-option]").forEach((button) => button.addEventListener("click", () => {
      if (store.answers[question.questionId]) return;
      const selected = button.dataset.placementOption;
      store.answers[question.questionId] = { selected, correct: selected === question.correctAnswer, answeredAt: new Date().toISOString() };
      store.currentIndex = questionIndex;
      save();
      drawQuestion();
    }));
    if (savedAnswer) ui.$("#next-placement-question").addEventListener("click", () => {
      if (questionIndex >= exam.questionCount - 1) return finalize();
      questionIndex += 1;
      store.currentIndex = questionIndex;
      save();
      drawQuestion();
    });
  }

  function renderResults(outcome) {
    const ui = options.deps();
    const exam = options.exam();
    const banding = exam.banding || {};
    const bandInfo = banding[outcome.band] || {};
    const minSectionPercent = banding.ready?.minSectionPercent ?? 60;
    const weakSections = outcome.sectionScores.filter((item) => item.percent < minSectionPercent);
    const reviewSections = weakSections.length ? weakSections : outcome.sectionScores.filter((item) => item.percent < (banding.ready?.minOverallPercent ?? 80));
    const recommendation = banding.notReady?.recommendation;
    const heroActions = outcome.band === "notReady"
      ? `<div class="audio-actions">${recommendation ? `<a class="button gold" href="${recommendation.href ? new URL(recommendation.href, location.href).href : options.hrefForUnit(recommendation.grade, null, "overview")}">Start ${ui.escapeHtml(recommendation.label || "the recommended course")}</a>` : ""}<button class="button secondary" id="retry-placement" type="button">↻ Try again</button><a class="button secondary" href="${options.defaultUnitHref("overview")}">My teacher says continue to ${ui.escapeHtml(options.stageLabel)} →</a></div>`
      : `<div class="audio-actions"><a class="button gold" href="${options.defaultUnitHref("overview")}">Start ${ui.escapeHtml(options.stageLabel)}, Unit 1 →</a><button class="button secondary" id="retry-placement" type="button">↻ Try again</button></div>`;
    ui.$("#app").innerHTML = `${ui.pageHeader("Your placement report", bandInfo.label || "Placement report", exam.title, `${outcome.percent}% overall`)}
      <div class="final-results-layout">
        <section class="panel final-result-summary"><div class="score-ring">${outcome.score}/${outcome.total}</div><span class="eyebrow">${outcome.percent}% overall</span><h2>${ui.escapeHtml(bandInfo.label || "Your report is ready")}</h2><p>${ui.escapeHtml(bandInfo.message || "Here is how you did in each section.")}</p>${heroActions}</section>
        <section class="panel"><h2>Section scores</h2><div class="result-bars">${outcome.sectionScores.map((item) => `<div class="result-bar"><div><strong>${ui.escapeHtml(item.label)}</strong><span>${item.score}/${item.total}</span></div><div class="progress-track"><span style="width:${item.percent}%"></span></div></div>`).join("")}</div></section>
        <section class="panel"><h2>Skills report</h2><div class="skill-score-grid">${outcome.areaScores.map((item) => `<div><span>${ui.escapeHtml(item.label)}</span><strong>${item.percent}%</strong><small>${item.score} of ${item.total}</small></div>`).join("")}</div></section>
        <section class="panel"><h2>${reviewSections.length ? "Your review plan" : "Every section is secure"}</h2>${reviewSections.length
          ? `<p>These lessons rebuild exactly what each section tests. Do them in order, then try the exam again.</p><div class="review-list">${reviewSections.flatMap((item) => (item.remediation || []).map((entry) => `<a href="${remediationHref(entry)}"><span><strong>${ui.escapeHtml(remediationLabel(entry))}</strong><small>Rebuilds: ${ui.escapeHtml(item.label)} (${item.percent}%)</small></span>↗</a>`)).join("")}</div>`
          : `<p>You met the target in every section. ${ui.escapeHtml(options.stageLabel)} is the right place for you.</p>`}
        </section>
        ${options.tutorHref ? `<section class="panel"><h2>Need help understanding your report?</h2><p>Wehel Tutor can explain any question you found hard, and a grown-up or teacher can help you choose your path.</p><a class="button secondary" href="${options.tutorHref()}">Ask Wehel Tutor</a></section>` : ""}
      </div>`;
    ui.$("#retry-placement")?.addEventListener("click", () => {
      store.answers = {};
      store.currentIndex = 0;
      store.completed = false;
      store.band = null;
      store.submitted = false;
      store.startedAt = null;
      save();
      questionIndex = 0;
      renderExam();
    });
  }

  function renderTeacher() {
    const ui = options.deps();
    const exam = options.exam();
    const latest = store.attempts[store.attempts.length - 1];
    const bandLabel = (name) => (exam.banding?.[name]?.label) || name || "—";
    ui.$("#app").innerHTML = `${ui.pageHeader("Teacher view", `${options.stageLabel} placement exam`, "Placement evidence for entry to this stage, with per-section remediation guidance.", "Placement diagnostics")}
      <div class="section-stack">
        <section class="panel approval-banner"><h2>Purpose</h2><p>The prerequisite unit measures readiness for ${ui.escapeHtml(options.frameworkLabel || options.stageLabel)}. Bands are advisory: a teacher or parent can override the recommendation. Thresholds live in placement-exam.json.</p></section>
        ${latest ? `<section class="panel"><h2>Latest attempt</h2><div class="teacher-assessment-summary"><div><strong>${latest.percent}%</strong><span>${latest.score}/${latest.total} marks</span></div><div><strong>${ui.escapeHtml(bandLabel(latest.band))}</strong><span>Attempt ${latest.attempt} of ${store.attempts.length}</span></div><div><strong>${new Date(latest.submittedAt).toLocaleDateString()}</strong><span>Latest submission</span></div></div>
        <div class="teacher-table-scroll"><table class="teacher-table"><thead><tr><th>Section</th><th>Score</th><th>Percent</th><th>Teaching response</th></tr></thead><tbody>${latest.sectionScores.map((item) => `<tr><td>${ui.escapeHtml(item.label)}</td><td>${item.score}/${item.total}</td><td>${item.percent}%</td><td>${item.percent >= (exam.banding?.ready?.minSectionPercent ?? 60) ? "Secure for entry." : "Re-teach via the section's linked review units before or alongside Unit 1."}</td></tr>`).join("")}</tbody></table></div></section>` : `<section class="panel"><h2>No attempt yet</h2><p>No submitted attempt is stored on this device. The exam holds ${exam.questionCount} questions across ${exam.sections.length} sections and reports one of three bands: Ready, Ready with review, or a recommendation to start from ${ui.escapeHtml(exam.banding?.notReady?.recommendation?.label || "an earlier course")}.</p></section>`}
      </div>`;
  }

  return { store, results, renderOverview, renderExam, renderTeacher };
}

// A callout for the first regular unit's overview page. The Prerequisite's
// picker entry alone is easy to miss — English proved the pattern with its
// gold panel — so every subject advertises the exam where a new learner
// lands, until that learner has completed it on this device.
export function placementCallout({ escapeHtml, storageKey, stageLabel, href, unitNo, firstUnitNo = 1 }) {
  if (Number(unitNo) !== Number(firstUnitNo)) return "";
  if (loadPlacementStore(storageKey).completed) return "";
  return `<section class="panel final-quiz-callout"><span class="eyebrow">New to ${escapeHtml(stageLabel)}?</span><h3>Prerequisite: placement exam</h3><p>A short exam over your earlier learning finds your perfect starting point and suggests review lessons if you need them.</p><a class="button gold" href="${href}">Take the placement exam →</a></section>`;
}

// The synthetic course object a prereq-mode load() returns: just enough for
// the shared chrome (labels, screen-reader announcements, teacher banner).
export function placementCourseShell(manifest, exam, termLabel = "Before you begin") {
  return {
    grade: manifest.grade || manifest.stage,
    stage: manifest.stage || manifest.grade,
    subject: manifest.subject,
    term: { label: termLabel },
    unit: { unitNo: "P", unitTitle: exam.shortTitle || "Prerequisite" },
    visual: {},
  };
}
