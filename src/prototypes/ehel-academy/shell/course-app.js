// Unified course-app shell (P1.5). One data-driven core that every subject plugs
// into via a config module, replacing the three near-duplicate course-ui.js
// scaffoldings. The core owns the whole lifecycle — boot/route, data load, nav,
// the ElevenLabs voice engine, progress (localStorage + ProgressClient), and the
// page layout — and dispatches section rendering to the subject's registry.
//
// A subject module exports { config, bind }:
//   config = { subjectKey, subjectLabel, param, maxStage, maxUnit, keys,
//              progressDefaults, gradeDefaults, courseKey, mediaSubject,
//              ttsPurpose, sections, nonCountable, gradeSections, renderers,
//              load(ctx), onReady(ctx), extendSummary?(progress, base),
//              staticVoiceUrl?(text), isSectionDone?(id), stageDir?(stage) }
//   bind(ctx) — populates the module's shell-provided `let` bindings so the
//   renderer bodies (kept verbatim from the original apps) run unchanged.
//
// createCourseApp(config) wires it all and boots.

import { escapeHtml as sharedEscapeHtml, icon as sharedIcon, pageHeader as sharedPageHeader, sectionNavigation } from "../shared/course-shell.js?v=20260721a";
import { createProgressClient } from "../shared/progress-client.js?v=20260722a";
// Self-mounting: renders the countdown/finish bar only on an SEB launch.
import "../shared/seb-session.js?v=20260724a";
// Welcome gate (adopted from PreQuraan): one tap into fullscreen, every launch.
import { mountLessonGate } from "../shared/lesson-gate.js?v=20260724a";
import { mountWehelChat } from "./wehel.js?v=wehel-2";

const pad2 = (n) => String(n).padStart(2, "0");

// Storage can be UNAVAILABLE rather than merely empty. Every course runs inside
// a cross-origin iframe (Moodle -> CDN, see local_hubredirect/issue_child.php),
// and a browser that blocks third-party storage throws SecurityError on the
// `localStorage` property itself — not on the call. That is the default in
// Chrome Incognito, Safari's cross-site tracking prevention and Firefox strict.
//
// The reads inside loadProgress()/loadGradeProgress() were already guarded, but
// the property access at setup was not, and it runs BEFORE init() — so the
// throw escaped the one try/catch that would have shown "We could not prepare
// the lesson", and the learner got a stuck loading pane with no message at all.
// The writes were unguarded too, so a blocked device threw on every save.
//
// Guarding here means a blocked device loses persistence and nothing else: the
// lesson boots, plays and scores; only resume-where-you-left-off is gone. Same
// shape as the guards wehel.js applies to its own accesses — though note that
// file was not fully covered either: its read-aloud toggle had no guard until
// this pass, so don't read it as the worked example.
const storageGet = (key) => { try { return localStorage.getItem(key); } catch { return null; } };
const storageSet = (key, value) => { try { localStorage.setItem(key, value); } catch { /* progress stays per-session on this device */ } };

export function createCourseApp(config) {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const params = new URLSearchParams(location.search);
  const stageNumber = Number(params.get(config.param) || params.get("stage") || params.get("grade") || document.documentElement.dataset[config.param] || document.documentElement.dataset.stage || document.documentElement.dataset.grade || 2);
  const unitNumber = Number(params.get("unit") ?? (config.defaultUnit ? config.defaultUnit(stageNumber) : 1));

  // Welcome gate: mounted immediately, before any data load, so the learner sees
  // it instantly rather than after a fetch.
  mountLessonGate({ subjectKey: config.subjectKey, stage: stageNumber });

  // Subjects whose stage axis is not a school grade name their folders
  // themselves (Kiswahili's stages are competency tracks, not grades).
  const stageDir = config.stageDir ? config.stageDir(stageNumber) : `grade-${stageNumber}`;
  const stageRootUrl = new URL(`./${stageDir}/`, location.href);
  const IS_LOCAL_DEV = ["localhost", "127.0.0.1"].includes(location.hostname);
  const dataRootUrl = IS_LOCAL_DEV
    ? new URL("data/", stageRootUrl)
    : new URL(`../../content/${config.subjectKey}/g${pad2(stageNumber)}/`, document.baseURI);

  const keys = config.keys(stageNumber, unitNumber);
  const STORAGE_KEY = keys.progress;
  const STAGE_STORAGE_KEY = keys.grade;
  // serve-src-preview.js hosts /api/elevenlabs-tts and defaults to port 4287,
  // but autoPort can move it — treat every localhost port as dev except the
  // two servers with no API routes (vite 5173, bunny dist preview 4173) and
  // bare 80/443, which would be a local Moodle. Mirrors shell/wehel.js.
  const ELEVENLABS_ENDPOINT = IS_LOCAL_DEV && !["", "80", "443", "5173", "4173"].includes(location.port) ? "/api/elevenlabs-tts" : "/local/hubredirect/quiz_tts.php";
  const ELEVENLABS_VOICE_ID = "XfNU2rGpBa01ckF309OY";

  const sections = config.sections;
  const nonCountable = config.nonCountable || ["overview"];
  const gradeSections = config.gradeSections || [];

  // --- state ---------------------------------------------------------------
  let manifest, course, gradeCapstone;
  let route = location.hash.slice(1) || "overview";
  let currentPageNarration = "";
  let speakingButton = null;
  let voiceRequestId = 0;
  const voicePlayer = typeof Audio === "function" ? new Audio() : null;
  const voiceAudioCache = new Map();
  const voiceAudioPending = new Map();
  const voiceSupported = Boolean(voicePlayer && typeof fetch === "function");
  let voiceEnabled = storageGet(`${STORAGE_KEY}-voice-enabled`) !== "false";

  const loadProgress = () => {
    try { return { ...config.progressDefaults, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || (keys.legacyProgress && localStorage.getItem(keys.legacyProgress)) || "{}") }; }
    catch { return { ...config.progressDefaults }; }
  };
  const loadGradeProgress = () => {
    if (!STAGE_STORAGE_KEY) return { ...(config.gradeDefaults || {}) };
    try { return { ...config.gradeDefaults, ...JSON.parse(localStorage.getItem(STAGE_STORAGE_KEY) || (keys.legacyGrade && localStorage.getItem(keys.legacyGrade)) || "{}") }; }
    catch { return { ...config.gradeDefaults }; }
  };
  const progress = loadProgress();
  const gradeProgress = loadGradeProgress();

  // --- progress web service (P1.4) -----------------------------------------
  const PROGRESS_COURSE = config.courseKey(stageNumber);
  const PROGRESS_STUDENT = params.get("studentid") || "local";
  const PROGRESS_UNIT = `u${pad2(unitNumber)}`;
  // Launch URLs travel through chat/email copy-paste, which injects invisible
  // Unicode (zero-width chars, smart punctuation) that makes fetch() reject the
  // Authorization header outright. Strip anything outside the JWT alphabet.
  const launchEndpoint = (params.get("pwsEndpoint") || "").trim();
  const launchToken = (params.get("pwsToken") || "").replace(/[^A-Za-z0-9._-]/g, "");
  const progressWS = createProgressClient({
    course: PROGRESS_COURSE, student: PROGRESS_STUDENT,
    backend: launchEndpoint ? "remote" : "local",
    endpoint: launchEndpoint || undefined,
    token: launchToken || undefined,
  });
  let unitCompletedSent = false;
  const emitProgress = (event) => { try { progressWS.emit(event); } catch { /* never break the lesson */ } };
  const emitProgressSummary = () => {
    const base = {
      type: "progress.summary", unit: PROGRESS_UNIT,
      sectionsDone: [...(progress.completed || [])],
      xp: Object.values(progress.games || {}).reduce((s, g) => s + (g.xp || 0), 0) || undefined,
    };
    emitProgress(config.extendSummary ? config.extendSummary(progress, base) : base);
  };

  const saveProgress = () => { storageSet(STORAGE_KEY, JSON.stringify(progress)); updateProgress(); emitProgressSummary(); };
  const saveGradeProgress = () => { if (STAGE_STORAGE_KEY) storageSet(STAGE_STORAGE_KEY, JSON.stringify(gradeProgress)); renderNav(); };
  const completeGradeSection = (section, message) => {
    if (!gradeProgress.completed.includes(section)) gradeProgress.completed.push(section);
    saveGradeProgress();
    if (message) toast(message);
  };
  const unitSectionIds = () => (config.visibleSections ? config.visibleSections() : sections).map(([id]) => id).filter((id) => !nonCountable.includes(id));

  const escapeHtml = (v = "") => sharedEscapeHtml(v);
  const icon = (name, label = "") => sharedIcon(name, label);
  const voiceButton = (text, label = "Listen") => `<button class="button secondary voice-button" data-speak="${escapeHtml(text)}" type="button" aria-label="${escapeHtml(label)}">${icon("volume-2")} <span>${escapeHtml(label)}</span></button>`;

  // --- voice engine (shared) ------------------------------------------------
  function cyrb53(str, seed = 0) {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (let i = 0; i < str.length; i += 1) { const ch = str.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
  }
  const staticVoiceKey = (text) => cyrb53(String(text || "").replace(/\s+/g, " ").trim());
  const staticVoiceMisses = new Set();
  const staticVoicePath = (key) => IS_LOCAL_DEV
    ? new URL(`./media/audio/tts/${key}.mp3`, document.baseURI).href
    : new URL(`../../media/${config.mediaSubject}/g${pad2(stageNumber)}/audio/tts/${key}.mp3`, document.baseURI).href;
  const defaultStaticVoiceUrl = async (text) => {
    const clean = String(text || "").replace(/\s+/g, " ").trim();
    if (!clean) return null;
    const key = staticVoiceKey(clean);
    if (staticVoiceMisses.has(key)) return null;
    const url = staticVoicePath(key);
    try { const r = await fetch(url, { method: "HEAD" }); if (r.ok) return url; } catch (e) { /* runtime fallback */ }
    staticVoiceMisses.add(key);
    return null;
  };
  const staticVoiceUrl = config.staticVoiceUrl || defaultStaticVoiceUrl;

  function stopVoice() {
    voiceRequestId += 1;
    if (voicePlayer) { voicePlayer.pause(); voicePlayer.removeAttribute("src"); voicePlayer.load(); }
    if (speakingButton) { speakingButton.classList.remove("is-playing"); speakingButton.setAttribute("aria-label", speakingButton.dataset.voiceLabel || "Listen"); speakingButton.title = "ElevenLabs · approved Ehel voice"; }
    speakingButton = null;
  }
  function paceNumberSequences(text) {
    const number = "\\b\\d+(?:st|nd|rd|th)?\\b";
    const sequence = new RegExp(`${number}(?:\\s*(?:,|;|and|or)?\\s*${number}){2,}`, "gi");
    return String(text || "").replace(sequence, (match) => (match.match(new RegExp(number, "gi")) || []).join(' <break time="0.40s" /> '));
  }
  const containsNumberSequence = (text) => (String(text || "").match(/\b\d+(?:st|nd|rd|th)?\b/gi) || []).length >= 3;
  function narrationChunks(text, maximum = 2600) {
    const lines = String(text || "").split(/\n+/).map((line) => line.replace(/\s+/g, " ").trim()).filter(Boolean);
    if (!lines.length) return [];
    const pacedLines = lines.flatMap((line) => {
      const pieces = [];
      for (let start = 0; start < line.length; start += 2200) pieces.push(line.slice(start, start + 2200));
      return pieces.map((piece) => {
        const isCounting = containsNumberSequence(piece);
        const pacedPiece = paceNumberSequences(piece);
        return { text: `${/[.!?;:]$/.test(pacedPiece) ? pacedPiece : `${pacedPiece}.`} <break time="0.65s" />`, speed: isCounting ? 0.78 : 0.90, isCounting };
      });
    });
    const chunks = [];
    let current = "";
    for (const line of pacedLines) {
      if (line.isCounting) { if (current) chunks.push({ text: current, speed: 0.90 }); current = ""; chunks.push({ text: line.text, speed: line.speed }); }
      else if (`${current} ${line.text}`.trim().length <= maximum) current = `${current} ${line.text}`.trim();
      else { if (current) chunks.push({ text: current, speed: 0.90 }); current = line.text; }
    }
    if (current) chunks.push({ text: current, speed: 0.90 });
    return chunks;
  }
  function collectPageNarration() {
    // On a both-designs page the deck below repeats the section word for word,
    // so reading #app would say the whole thing twice. The original half is the
    // page; the deck is a second view of it.
    const source = $("#classic-design") || $("#app");
    if (!source) return currentPageNarration;
    const copy = source.cloneNode(true);
    copy.querySelectorAll(".voice-button, .audio-source, .status-chip, script, style, [hidden], [aria-hidden='true'], details:not([open]) > *:not(summary)").forEach((el) => el.remove());
    copy.querySelectorAll("input, textarea, select").forEach((el) => { const d = el.getAttribute("aria-label") || el.getAttribute("placeholder") || ""; if (d) el.replaceWith(document.createTextNode(d)); else el.remove(); });
    const blockTags = new Set(["ADDRESS", "ARTICLE", "ASIDE", "BLOCKQUOTE", "BUTTON", "DD", "DETAILS", "DIV", "DL", "DT", "FIGCAPTION", "FIGURE", "FOOTER", "H1", "H2", "H3", "H4", "HEADER", "LABEL", "LI", "MAIN", "NAV", "OL", "P", "SECTION", "SUMMARY", "TABLE", "TBODY", "TD", "TFOOT", "TH", "THEAD", "TR", "UL"]);
    const readNode = (node) => {
      if (node.nodeType === Node.TEXT_NODE) return node.nodeValue || "";
      if (node.nodeType !== Node.ELEMENT_NODE) return "";
      if (node.tagName === "BR") return "\n";
      const content = [...node.childNodes].map(readNode).join("");
      return blockTags.has(node.tagName) ? `\n${content}\n` : content;
    };
    return readNode(copy).replace(/[✓★▶△◫☁▣⚑]/g, " ").replace(/→/g, " then ").replace(/·/g, ". ").split(/\n+/).map((line) => line.replace(/\s+/g, " ").trim()).filter(Boolean).join("\n");
  }
  async function elevenLabsAudioUrl(text, speed = 0.90) {
    const clean = String(text || "").replace(/\s+/g, " ").trim();
    if (!clean) throw new Error("There is nothing to read.");
    const safeSpeed = Math.max(0.70, Math.min(1, Number(speed) || 0.90));
    const cacheKey = `${safeSpeed.toFixed(2)}\n${clean}`;
    if (voiceAudioCache.has(cacheKey)) return voiceAudioCache.get(cacheKey);
    if (voiceAudioPending.has(cacheKey)) return voiceAudioPending.get(cacheKey);
    const pending = fetch(ELEVENLABS_ENDPOINT, {
      method: "POST", headers: { Accept: "audio/mpeg", "Content-Type": "application/json" },
      body: JSON.stringify({ text: clean, purpose: config.ttsPurpose, voiceId: ELEVENLABS_VOICE_ID, speed: safeSpeed }),
    }).then(async (response) => {
      if (!response.ok) throw new Error((await response.text()) || `ElevenLabs voice failed (${response.status}).`);
      const blob = await response.blob();
      if (!blob.size || !/^audio\//i.test(blob.type || "audio/mpeg")) throw new Error("The voice service returned invalid audio.");
      const url = URL.createObjectURL(blob);
      voiceAudioCache.set(cacheKey, url);
      if (voiceAudioCache.size > 30) { const oldest = voiceAudioCache.keys().next().value; URL.revokeObjectURL(voiceAudioCache.get(oldest)); voiceAudioCache.delete(oldest); }
      return url;
    }).finally(() => voiceAudioPending.delete(cacheKey));
    voiceAudioPending.set(cacheKey, pending);
    return pending;
  }
  function playVoiceSource(source, requestId) {
    return new Promise((resolve, reject) => {
      if (requestId !== voiceRequestId) return resolve();
      voicePlayer.src = source; voicePlayer.onended = resolve; voicePlayer.onemptied = resolve;
      voicePlayer.onerror = () => reject(new Error("The ElevenLabs recording could not be played."));
      voicePlayer.play().catch(reject);
    });
  }
  async function speakText(text, button) {
    if (!voiceEnabled) return toast("Turn on Voice Guide first.");
    if (!voiceSupported) return toast("ElevenLabs Voice Guide is not supported by this browser.");
    if (speakingButton === button) { stopVoice(); return; }
    stopVoice();
    const requestId = voiceRequestId;
    speakingButton = button;
    button.classList.add("is-playing");
    button.setAttribute("aria-label", "Stop ElevenLabs narration");
    try {
      const staticUrl = await staticVoiceUrl(text);
      if (staticUrl) { if (requestId !== voiceRequestId) return; await playVoiceSource(staticUrl, requestId); }
      else {
        // Sentence-level mix: a text with no clip of its own may still contain
        // pre-recorded sentences — Wehel's stock phrases, or a quoted practice
        // question that lesson narration already paid for. Resolve each
        // sentence separately and buy TTS only for the gaps. Capped at 12
        // sentences so a whole-page narration doesn't fire dozens of HEAD
        // probes; chat replies are far below the cap.
        let chunks = null;
        const sentences = String(text || "").split(/(?<=[.!?…])\s+/).map((part) => part.trim()).filter(Boolean);
        if (sentences.length > 1 && sentences.length <= 12) {
          const urls = await Promise.all(sentences.map((sentence) => staticVoiceUrl(sentence)));
          if (requestId !== voiceRequestId) return;
          if (urls.some(Boolean)) {
            chunks = [];
            let gap = [];
            const flush = () => { if (gap.length) { chunks.push(...narrationChunks(gap.join(" "))); gap = []; } };
            sentences.forEach((sentence, index) => { if (urls[index]) { flush(); chunks.push({ url: urls[index] }); } else gap.push(sentence); });
            flush();
          }
        }
        if (!chunks) chunks = narrationChunks(text);
        for (let index = 0; index < chunks.length; index += 1) {
          if (requestId !== voiceRequestId) return;
          button.title = `ElevenLabs narration ${index + 1} of ${chunks.length}`;
          const source = chunks[index].url || await elevenLabsAudioUrl(chunks[index].text, chunks[index].speed);
          await playVoiceSource(source, requestId);
        }
      }
    } catch (error) { if (requestId === voiceRequestId) toast("ElevenLabs voice is unavailable. Please try again."); }
    finally {
      if (requestId === voiceRequestId) { button.classList.remove("is-playing"); button.setAttribute("aria-label", button.dataset.voiceLabel || "Listen"); button.title = "ElevenLabs · approved Ehel voice"; speakingButton = null; }
    }
  }
  function bindVoiceControls() {
    [...$$('[data-page-voice]'), ...$$('[data-speak]')].forEach((button) => {
      if (button.dataset.voiceBound) return;
      button.dataset.voiceBound = "true";
      button.dataset.voiceLabel = button.getAttribute("aria-label") || "Listen";
      button.disabled = !voiceSupported || !voiceEnabled;
      button.addEventListener("click", () => speakText(button.hasAttribute("data-page-voice") ? collectPageNarration() : button.dataset.speak, button));
    });
  }
  function updateVoiceUI() {
    const toggle = $("#voice-toggle");
    if (!toggle) return;
    toggle.innerHTML = voiceEnabled ? icon("volume-2") : icon("volume-x");
    toggle.disabled = !voiceSupported;
    toggle.setAttribute("aria-label", voiceSupported ? (voiceEnabled ? "Turn ElevenLabs Voice Guide off" : "Turn ElevenLabs Voice Guide on") : "ElevenLabs Voice Guide unavailable");
    toggle.title = voiceSupported ? (voiceEnabled ? "ElevenLabs Voice Guide is on" : "ElevenLabs Voice Guide is off") : "ElevenLabs Voice Guide unavailable";
    $$('[data-page-voice], [data-speak]').forEach((button) => { button.disabled = !voiceSupported || !voiceEnabled; });
    // This button rewrites its own icon on every toggle, outside any render, so
    // it needs its own sweep — it was the one <i data-lucide> still surviving in
    // the topbar of all four shell-voice subjects after renderRoute and
    // renderNav had already run.
    paintIcons();
  }

  const pageHeader = (kicker, title, description, status = "Approved content") => {
    currentPageNarration = `${title}. ${description}`;
    queueMicrotask(() => { bindVoiceControls(); updateVoiceUI(); });
    return sharedPageHeader({ kicker: escapeHtml(kicker), title: escapeHtml(title), description: escapeHtml(description), status: escapeHtml(status) });
  };
  function toast(message) {
    const el = $("#toast");
    el.textContent = message; el.classList.add("show");
    clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove("show"), 2400);
  }

  function complete(section, message) {
    if (!progress.completed.includes(section)) progress.completed.push(section);
    emitProgress({ type: "section.completed", unit: PROGRESS_UNIT, section });
    saveProgress();
    renderNav();
    if (message) toast(message);
  }
  // navSections() lets a subject vary the nav list at runtime (english gates
  // `games` on a loaded gamePack and appends a unit-10-only `final-quiz`).
  const navSections = () => (config.visibleSections ? config.visibleSections() : sections);
  function updateProgress() {
    const countable = unitSectionIds();
    const done = countable.filter((id) => progress.completed.includes(id)).length;
    const value = countable.length ? Math.round(done / countable.length * 100) : 0;
    const valueEl = $("#progress-value"); if (valueEl) valueEl.textContent = `${value}%`;
    const fill = $("#progress-fill"); if (fill) fill.style.width = `${value}%`;
    const track = $(".progress-track"); if (track) { track.setAttribute("aria-valuenow", value); track.setAttribute("aria-valuetext", `${value} percent of this unit complete`); }
    if (value >= 100 && !unitCompletedSent) { unitCompletedSent = true; emitProgress({ type: "unit.completed", unit: PROGRESS_UNIT, sectionsDone: done, total: countable.length }); }
  }
  const isSectionDone = config.isSectionDone || ((id) => (gradeSections.includes(id) ? gradeProgress.completed.includes(id) : progress.completed.includes(id)));

  // --- unit guide: "how this unit works", drawn from what the shell already
  // knows ---------------------------------------------------------------------
  // The one place a learner is told what finishing a unit means. It reads the
  // SAME lists updateProgress() divides by — navSections() minus nonCountable —
  // so the checklist, the progress bar and the unit.completed event can never
  // disagree about which sections count. Overview itself is never listed: it is
  // the page this panel sits on.
  //
  // Returns HTML only. The button carries `data-go`, which every subject's
  // overview already binds (english completes Overview on it before navigating,
  // the others just navigate), so the panel inherits each subject's own rule for
  // leaving the overview rather than adding a second one.
  //
  // `isUnlocked(id)` is the hook for a subject that walks its sections in order
  // (english's section chain); the default treats every section as open.
  // `hints` is an optional {id: text} map of one-line "what to do here" notes.
  // `howToUse` is the unit's OWN instructions — a short array of learner-voice
  // sentences authored on the unit (`unit.howToUse`) for the few units whose
  // shape the generic checklist cannot explain: a capstone with no video, a
  // reading list where two texts are for listening. Most units carry none, and
  // the panel is complete without it.
  function unitGuide({ heading = "How this unit works", intro, rule, isUnlocked = () => true, hints = {}, howToUse = [], startLabel } = {}) {
    const rows = navSections().filter(([id]) => !nonCountable.includes(id) && id !== "overview");
    const done = rows.filter(([id]) => isSectionDone(id)).length;
    const next = rows.find(([id]) => !isSectionDone(id) && isUnlocked(id)) || null;
    const total = rows.length;
    const status = !total ? ""
      : done === total ? "All done! Every section has a tick."
      : done === 0 ? `There are ${total} sections to finish.`
      : `You have finished ${done} of ${total} sections.`;
    // Locked looks locked even when finished — the same rule the english nav
    // paints (paintSectionLocks): a tick inside a padlocked run reads as the
    // lock being broken. The completion still counts, and the row says so for
    // a screen reader.
    const items = rows.map(([id, sectionIcon, label]) => {
      const finished = isSectionDone(id);
      const locked = !isUnlocked(id);
      const current = next && next[0] === id;
      const state = locked ? "locked" : finished ? "done" : current ? "next" : "todo";
      const spoken = locked ? (finished ? "finished, opens again in order" : "locked, opens in order") : finished ? "finished" : current ? "up next" : "to do";
      const mark = locked ? "🔒" : finished ? "✓" : current ? "▶" : "";
      return `<li class="unit-guide-row is-${state}" data-guide-section="${escapeHtml(id)}">
        <span class="unit-guide-mark" aria-hidden="true">${mark}</span>
        ${icon(sectionIcon)}
        <span class="unit-guide-label">${escapeHtml(label)}<span class="sr-only">, ${spoken}</span>${hints[id] ? `<small>${escapeHtml(hints[id])}</small>` : ""}</span>
      </li>`;
    }).join("");
    const button = next
      ? `<button class="button primary" data-go="${escapeHtml(next[0])}" type="button">${escapeHtml(startLabel || (done ? `Continue with ${next[2]}` : `Start with ${next[2]}`))} ${icon("arrow-right")}</button>`
      : "";
    return `<section class="panel unit-guide" aria-labelledby="unit-guide-heading">
      <h2 id="unit-guide-heading">${escapeHtml(heading)}</h2>
      <p>${escapeHtml(intro || "Work through the sections below, one at a time. Each one gets a tick when it is finished.")}${rule ? ` ${escapeHtml(rule)}` : ""}</p>
      ${howToUse.length ? `<h3 class="unit-guide-subheading">Just for this unit</h3><ul class="unit-guide-howto">${howToUse.map((line) => `<li>${icon("info")}<span>${escapeHtml(line)}</span></li>`).join("")}</ul>` : ""}
      <ol class="unit-guide-list">${items}</ol>
      <p class="unit-guide-status"><strong>${escapeHtml(status)}</strong></p>
      ${button}
    </section>`;
  }

  function renderNav() {
    $("#section-nav").innerHTML = sectionNavigation(navSections().map(([id, sectionIcon, label]) => ({ id, iconName: sectionIcon, label, active: route === id, done: isSectionDone(id) })));
    $$('[data-route]').forEach((button) => button.addEventListener("click", () => navigate(button.dataset.route)));
    const teacherSwitch = $("#teacher-switch");
    if (teacherSwitch) {
      teacherSwitch.classList.toggle("active", route === "teacher");
      if (!teacherSwitch.dataset.bound) { teacherSwitch.dataset.bound = "true"; teacherSwitch.addEventListener("click", () => navigate("teacher")); }
    }
    if (config.onNavRendered) config.onNavRendered();
    // The nav repaints on its own — completing a section calls renderNav()
    // without a route change — so it cannot rely on renderRoute's sweep.
    paintIcons();
  }
  // --- focus mode: the lesson content owns the whole screen -----------------
  // (topbar + sidebar hidden via body.focus-mode; the floating Menu button or
  // Escape restores the navigation without changing the route).
  //
  // Focus mode is entered by a LEFT-NAV CLICK and nothing else. Not by the
  // lesson gate's Start tile, which lands the learner on the overview where
  // the grade and unit pickers still need to be reachable — the gate takes
  // the browser fullscreen, this layout waits for the learner to choose a
  // section. (The reverse coupling is real: leaving fullscreen always drops
  // focus mode, so the two can never strand the learner in a page with no
  // navigation and no browser chrome.)
  function exitFocusMode() {
    document.body.classList.remove("focus-mode");
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
  }
  // The Menu button is the only way back while the lesson gate's Keyboard Lock
  // is swallowing Escape, so it has to exist before the navigation disappears.
  function ensureFocusChrome() {
    if (document.getElementById("focus-exit")) return;
    const exitButton = document.createElement("button");
    exitButton.id = "focus-exit";
    exitButton.className = "focus-exit";
    exitButton.type = "button";
    exitButton.setAttribute("aria-label", "Show the menu and unit navigation");
    exitButton.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg><span>Menu</span>';
    exitButton.addEventListener("click", exitFocusMode);
    document.body.appendChild(exitButton);
    document.addEventListener("keydown", (event) => { if (event.key === "Escape") exitFocusMode(); });
  }
  function enterFocusMode() {
    ensureFocusChrome();
    document.body.classList.add("focus-mode");
    // True fullscreen: the nav click is a user gesture, so the request is
    // allowed. Browsers that refuse (e.g. iPhone Safari) keep the CSS-only
    // full-viewport mode — the catch is deliberate.
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
  }
  // Leaving browser fullscreen (the gate's Escape, browser UI, F11) restores
  // the navigation, so the two states never drift apart. Bound once at boot,
  // not lazily on first entry into focus mode: fullscreen can begin at the
  // gate, long before any nav click, and a listener registered afterwards
  // would have missed the exit that mattered.
  document.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement) document.body.classList.remove("focus-mode");
  });
  function navigate(next) {
    if (config.onNavigate) config.onNavigate();
    stopVoice(); route = next; location.hash = next;
    enterFocusMode();
    renderNav(); renderRoute();
    $("#content")?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  // shared/course-shell.js :: icon() emits <i data-lucide> for EVERY subject, and
  // the runtime replaces those elements in place — so it has to run after
  // anything that paints, and a subject that never calls it shows blank icons
  // wherever the shell drew one. English called it from its own module and the
  // other four never did, which is why their sidebars and page headers were
  // empty. Calling it here covers whatever the shell renders, for every subject;
  // English's own sweep still runs and is harmless, since createIcons only ever
  // converts what is still an <i>.
  // A declaration, not a const: renderNav() sweeps too, and it is defined and
  // reachable earlier in this closure than this line runs.
  function paintIcons() { window.lucide?.createIcons({ attrs: { "stroke-width": 2.2 } }); }

  function renderRoute() {
    if (config.onBeforeRender) config.onBeforeRender();
    $("#app").innerHTML = "";
    (config.renderers[route] || config.renderers.overview)();
    if (!config.disableShellVoice) bindVoiceControls();
    if (config.onAfterRender) config.onAfterRender();
    paintIcons();
  }

  // --- Wehel dock ----------------------------------------------------------
  // The tutor is most useful mid-struggle — stuck on a practice question,
  // lost halfway through an explainer — but as a nav section it can only be
  // reached by leaving the page you are stuck on, and focus mode hides the nav
  // altogether. The dock puts the same chat one tap from every page. It mounts
  // over the SAME store as the section, so the two are one conversation, and
  // it tells Wehel which page the learner is on so "I don't get this" has a
  // referent.
  //
  // Deliberately quiet: no proactive popups, no attract animation, no
  // unsolicited messages. It sits still until a learner reaches for it.
  const DOCK_STYLE = `
  .wehel-dock-button{position:fixed;right:18px;bottom:18px;z-index:70;display:inline-flex;align-items:center;gap:8px;
    padding:11px 16px;border:0;border-radius:999px;cursor:pointer;font:inherit;font-size:.95rem;font-weight:600;
    color:#fff;background:linear-gradient(135deg,#7c3aed,#4f46e5);box-shadow:0 6px 20px rgba(49,46,129,.34)}
  .wehel-dock-button:hover{transform:translateY(-1px)}
  .wehel-dock-button:focus-visible{outline:3px solid #c4b5fd;outline-offset:2px}
  .wehel-dock-button[hidden]{display:none}
  .wehel-dock-backdrop{position:fixed;inset:0;z-index:71;background:rgba(15,23,42,.45);border:0;padding:0;cursor:pointer}
  .wehel-drawer{position:fixed;top:0;right:0;bottom:0;z-index:72;width:min(420px,100vw);display:flex;flex-direction:column;
    background:var(--surface,#fff);color:inherit;box-shadow:-8px 0 30px rgba(15,23,42,.22);border-left:1px solid rgba(15,23,42,.12)}
  .wehel-drawer-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:14px 16px;
    border-bottom:1px solid rgba(15,23,42,.12)}
  .wehel-drawer-head h2{margin:0;font-size:calc(1.02rem - 1px);line-height:1.25}
  .wehel-drawer-head small{display:block;font-weight:400;opacity:.7;font-size:calc(.8rem - 1px)}
  .wehel-drawer-close{border:0;background:transparent;color:inherit;font-size:1.5rem;line-height:1;cursor:pointer;padding:4px 8px;border-radius:8px}
  .wehel-drawer-close:hover{background:rgba(15,23,42,.08)}
  .wehel-drawer-body{flex:1;overflow-y:auto;padding:14px 16px;font-size:calc(1rem - 1px)}
  .wehel-drawer-body button,.wehel-drawer-body input{font:inherit}
  .wehel-drawer-body .ai-prompts button{font-size:13px}
  .wehel-drawer-body .ai-message strong{font-size:12px}
  @media (max-width:640px){
    .wehel-drawer{width:100vw;top:auto;height:88vh;border-left:0;border-top-left-radius:16px;border-top-right-radius:16px}
    .wehel-dock-button span{display:none}
    .wehel-dock-button{padding:14px;border-radius:50%}
  }
  @media print{.wehel-dock-button,.wehel-drawer,.wehel-dock-backdrop{display:none}}`;

  const SPARKLE_ICON = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"/></svg>';

  function mountWehelDock() {
    if (!config.wehelOptions) return;
    const style = document.createElement("style");
    style.textContent = DOCK_STYLE;
    document.head.appendChild(style);

    const button = document.createElement("button");
    button.type = "button";
    button.className = "wehel-dock-button";
    button.setAttribute("aria-label", "Ask Wehel Tutor");
    button.innerHTML = `${SPARKLE_ICON}<span>Wehel Tutor</span>`;

    let drawer = null, backdrop = null, chatPanel = null;
    // The section label for the route the learner is on — what the drawer
    // reports to Wehel as context. Read at send time, not at mount time, so it
    // stays right as the learner moves around with the drawer open.
    const sectionHint = () => {
      const match = (config.visibleSections ? config.visibleSections() : sections).find(([id]) => id === route);
      return match ? match[2] : "";
    };

    function close() {
      if (!drawer) return;
      drawer.remove(); backdrop?.remove();
      drawer = null; backdrop = null; chatPanel = null;
      button.hidden = false;
      button.focus();
    }

    function open() {
      if (drawer) return;
      backdrop = document.createElement("button");
      backdrop.type = "button";
      backdrop.className = "wehel-dock-backdrop";
      backdrop.setAttribute("aria-label", "Close Wehel Tutor");
      backdrop.addEventListener("click", close);

      drawer = document.createElement("aside");
      drawer.className = "wehel-drawer";
      drawer.setAttribute("role", "dialog");
      drawer.setAttribute("aria-label", "Wehel Tutor");
      drawer.innerHTML = `<div class="wehel-drawer-head">
          <h2>Wehel Tutor<small>Ask about anything on this page</small></h2>
          <button type="button" class="wehel-drawer-close" aria-label="Close Wehel Tutor">&times;</button>
        </div><div class="wehel-drawer-body"></div>`;
      drawer.querySelector(".wehel-drawer-close").addEventListener("click", close);

      document.body.append(backdrop, drawer);
      button.hidden = true;
      // A subject edge case (a stub unit, a data shape this page doesn't
      // carry) must degrade to a closed drawer, never a dead button.
      try {
        chatPanel = mountWehelChat({
          container: drawer.querySelector(".wehel-drawer-body"),
          sectionHint,
          ...config.wehelOptions(),
        });
      } catch (error) {
        console.error(error);
        close();
        toast("Wehel Tutor is not available on this page.");
        return;
      }
      drawer.querySelector("#wehel-input")?.focus();
    }

    button.addEventListener("click", open);
    document.addEventListener("keydown", (event) => { if (event.key === "Escape" && drawer) close(); });
    document.body.appendChild(button);
  }

  // --- ctx: the surface the subject's renderers close over ------------------
  const ctx = {
    $, $$, escapeHtml, icon, voiceButton, pageHeader, toast,
    complete, completeGradeSection, saveProgress, saveGradeProgress,
    // speakText: a word card's ♪ button narrates on demand rather than through
    // a voiceButton, so the renderer calls this directly. It was missing here,
    // which made science's Science Words listen button a ReferenceError in
    // every shell release since v110 — it worked in the standalone copy only
    // because speakText was a module-scope function there.
    // stopVoice: a slide deck silences the current narration when the learner
    // swipes to the next slide. navigate() already does this on a route change,
    // but a deck changes what is on screen without changing route.
    navigate, emitProgress, bindVoiceControls, updateVoiceUI, renderNav, renderRoute, speakText, stopVoice,
    unitSectionIds, updateProgress, unitGuide, stageNumber, unitNumber, params, dataRootUrl,
    STORAGE_KEY, STAGE_STORAGE_KEY, PROGRESS_UNIT,
    progress, gradeProgress,
    manifest: undefined, course: undefined, gradeCapstone: undefined,
    // Every unit the server knows about, keyed as `u00`…`u10`, or null when the
    // course is running per-device. The resume below only needs the unit being
    // opened; a subject that gates on whether EARLIER units are finished needs
    // them all, and localStorage cannot answer that on a device the learner has
    // not used before. Populated before config.load() so a subject can decide
    // what to fetch from it.
    remoteUnits: null,
    get route() { return route; },
  };

  // Remote resume (cross-device): in remote mode, pull the server's state
  // document on boot and seed the local progress store from it before first
  // render — completed sections, known words, and (empty-slot-only) drafts
  // follow the learner to this device. Offline or gateway-down degrades
  // silently to the local per-device resume.
  async function hydrateRemoteResume() {
    if (progressWS.backend !== "remote") return;
    try {
      const doc = await progressWS.hydrate();
      // Published before the early return below. A learner opening a unit they
      // have never touched has no record for it, and that is exactly the case a
      // unit gate has to reason about — bailing here would hand the subject
      // nothing precisely when it needs the other units most.
      ctx.remoteUnits = (doc && doc.units) || null;
      const unit = doc && doc.units && doc.units[PROGRESS_UNIT];
      if (!unit) return;
      let changed = false;
      for (const s of unit.sectionsDone || []) {
        if (!progress.completed.includes(s)) { progress.completed.push(s); changed = true; }
      }
      if (Array.isArray(unit.knownWords) && unit.knownWords.length && Array.isArray(progress.knownWords)) {
        for (const w of unit.knownWords) if (!progress.knownWords.includes(w)) { progress.knownWords.push(w); changed = true; }
      }
      // Drafts: fill only slots this device has no local draft for (local edits win).
      if (unit.drafts && progress.writing && typeof progress.writing === "object") {
        for (const [key, draft] of Object.entries(unit.drafts)) {
          const id = key.startsWith("writing:") ? key.slice(8) : key;
          if (draft && draft.text && !progress.writing[id]) { progress.writing[id] = draft.text; changed = true; }
        }
      }
      if (changed) storageSet(STORAGE_KEY, JSON.stringify(progress));
    } catch (e) { /* offline / gateway unreachable → per-device resume */ }
  }

  async function init() {
    try {
      // Hydration runs BEFORE the data load, not after. It reads nothing the
      // load produces (progressWS, the progress store and PROGRESS_UNIT are all
      // ready at boot), and load() is the point where a subject decides what to
      // fetch — english's Grade 1 unit gate skips a locked unit's data
      // entirely, so it has to know the server's answer first. Both were
      // already awaited before the first render, so the order costs no time.
      await hydrateRemoteResume();
      const loaded = await config.load(ctx); // { manifest, course, gradeCapstone? }
      manifest = loaded.manifest; course = loaded.course; gradeCapstone = loaded.gradeCapstone;
      ctx.manifest = manifest; ctx.course = course; ctx.gradeCapstone = gradeCapstone; // concrete refs for renderers
      config.bind(ctx);
      await config.onReady(ctx); // title, pickers
      $("#loading")?.remove();
      $("#app").hidden = false;
      renderNav(); updateProgress(); renderRoute();
      mountWehelDock();
    } catch (error) {
      console.error(error);
      const target = $("#loading") || $("#app");
      target.hidden = false;
      target.innerHTML = `<p><span class="status-note">We could not prepare the lesson.</span><br>${escapeHtml(error.message)}</p>`;
    }
  }

  window.addEventListener("hashchange", () => {
    const next = location.hash.slice(1);
    if (next && next !== route) { route = next; renderNav(); renderRoute(); }
  });
  // Subjects with their own audio engine (english: file-based reading + TTS/STT)
  // opt out of the shell voice UI entirely via config.disableShellVoice.
  if (!config.disableShellVoice) {
    const voiceToggle = $("#voice-toggle");
    if (voiceToggle) voiceToggle.addEventListener("click", () => {
      voiceEnabled = !voiceEnabled;
      storageSet(`${STORAGE_KEY}-voice-enabled`, String(voiceEnabled));
      if (!voiceEnabled) stopVoice();
      updateVoiceUI();
      toast(voiceEnabled ? "Voice Guide is on." : "Voice Guide is off.");
    });
    updateVoiceUI();
  }
  init();

  return ctx;
}
