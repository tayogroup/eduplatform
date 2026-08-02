// Wehel — the Ehel Academy AI subject expert, shared by every subject module.
// One chat panel + one transport, so the six subjects differ only in the meta
// they pass (subject key, quick prompts, canned fallback). The prompt itself is
// server-side (local_hubredirect/wehel_prompt.json via wehel_chat.php, or the
// dev twin /api/wehel-chat on port 4287); the client only ships the unit JSON
// the browser has already loaded for the lesson, so no secret crosses here.

const IS_LOCAL_DEV = ["localhost", "127.0.0.1"].includes(location.hostname);
// serve-src-preview.js hosts the /api/* twins and defaults to port 4287, but
// autoPort can move it — so treat every localhost port as dev EXCEPT the two
// servers that have no API routes (vite on 5173, the bunny dist preview on
// 4173) and bare 80/443, which would be a local Moodle.
const DEV_API = IS_LOCAL_DEV && !["", "80", "443", "5173", "4173"].includes(location.port);
export const WEHEL_CHAT_ENDPOINT = DEV_API ? "/api/wehel-chat" : "/local/hubredirect/wehel_chat.php";
export const WEHEL_STT_ENDPOINT = DEV_API ? "/api/elevenlabs-stt" : "/local/hubredirect/quiz_stt.php";

const HISTORY_LIMIT = 12;

// One line per unit of the loaded course manifest, so Wehel knows where the
// open unit sits in the year and can point ahead or back. Titles only — the
// full content still travels for the current unit alone.
export function outlineFromManifest(manifest) {
  const units = Array.isArray(manifest?.units) ? manifest.units : [];
  return units
    .map((unit) => `Unit ${unit.number}: ${unit.title}${unit.skill ? ` (skill: ${unit.skill})` : ""}`)
    .join("\n");
}

// Merge consecutive same-role turns: the Anthropic API requires strict
// user/assistant alternation, and a failed exchange can leave two learner
// messages in a row in the stored transcript.
function apiMessages(stored) {
  const merged = [];
  for (const item of stored.slice(-HISTORY_LIMIT)) {
    const role = item.role === "assistant" ? "assistant" : "user";
    const content = String(item.text || "").trim();
    if (!content) continue;
    if (merged.length && merged[merged.length - 1].role === role) merged[merged.length - 1].content += `\n${content}`;
    else merged.push({ role, content });
  }
  while (merged.length && merged[0].role !== "user") merged.shift();
  return merged;
}

// Fetches a sibling unit's JSON from the same tree the lesson loads its own
// data from, gated on the manifest so Wehel can only ask for units that exist.
export function unitFetcher(manifest, dataRootUrl) {
  return async (unitNo) => {
    const units = Array.isArray(manifest?.units) ? manifest.units : [];
    if (!units.some((unit) => Number(unit.number) === Number(unitNo))) return null;
    const response = await fetch(new URL(`units/unit-${Number(unitNo)}.json`, dataRootUrl));
    if (!response.ok) throw new Error(`Unit ${unitNo} could not be loaded (${response.status}).`);
    return response.json();
  };
}

// --- cross-academy lookups ---------------------------------------------------
// Every course's data sits on the same origin as the page: in dev the subjects
// are siblings under /ehel-academy/, and on the CDN every course reads
// ../../content/<subject>/gNN/ relative to its own base — the same convention
// course-app.js uses for the current course. So the browser can resolve any
// (subject, grade) to a data root without server help.
const ACADEMY_SUBJECTS = ["science", "mathematics", "computing", "english", "global-perspectives", "intensive-english"];
const pad2 = (n) => String(n).padStart(2, "0");

function courseDataRoot(subjectKey, grade) {
  const marker = "/ehel-academy/";
  const at = location.pathname.indexOf(marker);
  if (IS_LOCAL_DEV && at !== -1) {
    const stageDir = subjectKey === "intensive-english" ? `level-${grade}` : `grade-${grade}`;
    return new URL(`${location.pathname.slice(0, at + marker.length)}${subjectKey}/${stageDir}/data/`, location.origin);
  }
  return new URL(`../../content/${subjectKey}/g${pad2(grade)}/`, document.baseURI);
}

// Both handlers answer with plain prose on any miss — a 404 for a course that
// was never built is a normal answer for the model, not an error.
function resolveCourseRef(meta, input) {
  const subject = input?.subject ? String(input.subject) : meta.subject;
  const grade = input?.grade !== undefined && input?.grade !== null ? Number(input.grade) : Number(meta.grade);
  if (!ACADEMY_SUBJECTS.includes(subject)) return { error: `Unknown subject "${subject}". Available: ${ACADEMY_SUBJECTS.join(", ")}.` };
  if (!Number.isInteger(grade) || grade < 1 || grade > 9) return { error: `Grade ${input?.grade} is not a valid grade (1-8).` };
  return { subject, grade };
}

async function handleGetUnit(meta, fetchUnit, input) {
  const ref = resolveCourseRef(meta, input);
  if (ref.error) return ref.error;
  const unitNo = Number(input?.unitNo);
  const label = `Unit ${input?.unitNo} of ${ref.subject} grade ${ref.grade}`;
  if (ref.subject === meta.subject && ref.grade === Number(meta.grade) && fetchUnit) {
    const unit = await fetchUnit(unitNo);
    return unit ? JSON.stringify(unit).slice(0, 120000) : `${label} does not exist — only the units in the year outline.`;
  }
  const response = await fetch(new URL(`units/unit-${unitNo}.json`, courseDataRoot(ref.subject, ref.grade)));
  if (!response.ok) return `${label} is not available.`;
  return JSON.stringify(await response.json()).slice(0, 120000);
}

async function handleGetCourseOutline(meta, input) {
  const ref = resolveCourseRef(meta, input);
  if (ref.error) return ref.error;
  const response = await fetch(new URL("course-manifest.json", courseDataRoot(ref.subject, ref.grade)));
  if (!response.ok) return `The ${ref.subject} grade ${ref.grade} course is not available.`;
  const manifest = await response.json();
  return `${ref.subject} grade ${ref.grade} units:\n${outlineFromManifest(manifest)}`.slice(0, 6000);
}

export async function askWehel({ meta, messages, channel = "text", mode = "", fetchUnit = null }) {
  const wstoken = new URLSearchParams(location.search).get("wstoken") || undefined;
  const post = async (conversation) => {
    const response = await fetch(WEHEL_CHAT_ENDPOINT, {
      method: "POST",
      credentials: DEV_API ? "same-origin" : "include",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: meta.subject,
        subjectLabel: meta.subjectLabel,
        grade: meta.grade,
        cambridgeCode: meta.cambridgeCode || "",
        unitNo: meta.unitNo,
        unitTitle: meta.unitTitle,
        learnerName: meta.learnerName || "",
        courseOutline: meta.courseOutline || "",
        unit: meta.unit,
        channel,
        mode: mode || undefined,
        wstoken,
        tools: fetchUnit ? ["get_unit", "get_course_outline"] : [],
        messages: conversation,
      }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.ok) throw new Error(result.message || `Wehel is unavailable (${response.status}).`);
    return result;
  };

  // Tool loop: when the model asks for another unit, fetch it HERE — the
  // browser already has same-origin access to the course data tree, so the
  // endpoint stays stateless and never has to reach into the CDN. The tool
  // exchange lives only in this call; the stored transcript keeps plain text.
  const conversation = apiMessages(messages);
  for (let round = 0; round < 4; round += 1) {
    const result = await post(conversation);
    if (result.reply) return String(result.reply);
    if (!result.toolUse || !fetchUnit) break;
    const { id, name, input } = result.toolUse;
    let content;
    try {
      if (name === "get_unit") content = await handleGetUnit(meta, fetchUnit, input);
      else if (name === "get_course_outline") content = await handleGetCourseOutline(meta, input);
      else content = `Unknown tool ${name}.`;
    } catch (error) {
      content = "That could not be looked up right now.";
    }
    conversation.push({ role: "assistant", content: result.assistantContent });
    conversation.push({ role: "user", content: [{ type: "tool_result", tool_use_id: id, content }] });
  }
  throw new Error("Wehel could not answer just now.");
}

export async function transcribeForWehel(blob) {
  const audioBase64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result).split(",")[1] || ""));
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsDataURL(blob);
  });
  const wstoken = new URLSearchParams(location.search).get("wstoken") || undefined;
  const response = await fetch(WEHEL_STT_ENDPOINT, {
    method: "POST",
    credentials: DEV_API ? "same-origin" : "include",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ audioBase64, mimeType: blob.type || "audio/webm", purpose: "wehel", wstoken }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.ok) throw new Error(result.message || "Speech recognition is unavailable.");
  return String(result.text || "").trim();
}

// mountWehelChat renders the conversation into `container` and owns the whole
// exchange loop. The caller provides the surrounding page (header, asides) and
// re-mounts on route changes; state lives in the caller's progress store so a
// conversation survives reloads exactly like the old canned panel did.
//
// options:
//   container      — element to render into
//   meta           — { subject, subjectLabel, grade, cambridgeCode, unitNo,
//                      unitTitle, unit, learnerName? }
//   store          — object whose `key` array holds {role, text, offline?}
//   key            — property name on store (default "aiMessages")
//   ui             — { $, escapeHtml, toast, voiceButton?, bindVoiceControls? }
//   tutorLabel     — bubble label (default "Wehel")
//   greeting       — first bubble when the transcript is empty
//   placeholder    — input placeholder
//   quickPrompts   — [{ label, message }]
//   mode           — optional mode hint forwarded to the server
//   fetchUnit      — optional (unitNo) => unit JSON, enables the get_unit tool
//   fallbackReply  — (message) => canned text when Wehel is unreachable
//   onExchange     — (exchangeCount) => void, for section completion
//   onSaved        — persist the store (called after every append)
export function mountWehelChat(options) {
  const { container, meta, store, ui } = options;
  const key = options.key || "aiMessages";
  const escapeHtml = ui.escapeHtml;
  const tutorLabel = options.tutorLabel || "Wehel";
  const greeting = options.greeting || `Hi! I am ${tutorLabel}, your ${meta.subjectLabel} companion. What would you like to do with Unit ${meta.unitNo}: ${meta.unitTitle}?`;
  if (!Array.isArray(store[key])) store[key] = [];
  const messages = store[key];
  const micSupported = Boolean(navigator.mediaDevices?.getUserMedia && typeof MediaRecorder === "function");
  let busy = false;
  let recorder = null;
  let recordedChunks = [];

  const bubble = (item) => {
    const speak = ui.voiceButton ? ui.voiceButton(item.text, item.role === "user" ? "Listen again" : `Listen to ${tutorLabel}`) : "";
    const label = item.role === "user" ? "You" : (item.offline ? `${tutorLabel} (offline hint)` : tutorLabel);
    return `<article class="ai-message ${item.role}"><strong>${escapeHtml(label)}</strong>${escapeHtml(item.text)}${speak}</article>`;
  };

  function render() {
    container.innerHTML = `
      <div class="ai-conversation" id="wehel-conversation" aria-live="polite">
        ${messages.length ? messages.map(bubble).join("") : bubble({ role: "assistant", text: greeting })}
        ${busy ? `<article class="ai-message assistant is-thinking"><strong>${escapeHtml(tutorLabel)}</strong><em>is thinking…</em></article>` : ""}
      </div>
      <div class="ai-prompts">${(options.quickPrompts || []).map((prompt) => `<button data-wehel-prompt="${escapeHtml(prompt.message)}" type="button" ${busy ? "disabled" : ""}>${escapeHtml(prompt.label)}</button>`).join("")}</div>
      <form class="ai-compose" id="wehel-form">
        <label class="sr-only" for="wehel-input">Ask ${escapeHtml(tutorLabel)}</label>
        <input id="wehel-input" maxlength="500" placeholder="${escapeHtml(options.placeholder || `Ask about ${meta.unitTitle}…`)}" ${busy ? "disabled" : ""} autocomplete="off">
        ${micSupported ? `<button class="button secondary" id="wehel-mic" type="button" aria-label="Ask by voice" title="Ask by voice" ${busy ? "disabled" : ""}>🎤</button>` : ""}
        <button class="button primary" type="submit" ${busy ? "disabled" : ""}>Send</button>
      </form>`;
    if (ui.bindVoiceControls) ui.bindVoiceControls();
    container.querySelectorAll("[data-wehel-prompt]").forEach((button) => button.addEventListener("click", () => submit(button.dataset.wehelPrompt, "text")));
    container.querySelector("#wehel-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const input = container.querySelector("#wehel-input");
      if (input.value.trim()) submit(input.value.trim(), "text");
    });
    const mic = container.querySelector("#wehel-mic");
    if (mic) mic.addEventListener("click", () => toggleMic(mic));
    const conversation = container.querySelector("#wehel-conversation");
    conversation.scrollTop = conversation.scrollHeight;
  }

  function append(item) {
    messages.push(item);
    if (messages.length > 40) messages.splice(0, messages.length - 40);
    if (options.onSaved) options.onSaved();
  }

  async function submit(text, channel) {
    if (busy) return;
    append({ role: "user", text });
    busy = true;
    render();
    let reply;
    let offline = false;
    try {
      reply = await askWehel({ meta, messages, channel, mode: options.mode, fetchUnit: options.fetchUnit || null });
    } catch (error) {
      offline = true;
      reply = options.fallbackReply
        ? options.fallbackReply(text)
        : "I cannot reach my thinking engine right now. Please try again in a moment.";
      if (ui.toast) ui.toast("Wehel is offline right now — showing a built-in hint instead.");
    }
    append({ role: "assistant", text: reply, offline });
    busy = false;
    render();
    const exchanges = messages.filter((item) => item.role === "assistant" && !item.offline).length;
    if (!offline && options.onExchange) options.onExchange(exchanges);
    // A voice question gets a voice answer: press the reply's own Listen button
    // so playback goes through the caller's voice engine (static clip or TTS).
    if (channel === "voice" && !offline && ui.voiceButton) {
      const buttons = container.querySelectorAll(".ai-message.assistant .voice-button");
      const last = buttons[buttons.length - 1];
      if (last && !last.disabled) last.click();
    }
  }

  async function toggleMic(button) {
    if (recorder && recorder.state === "recording") { recorder.stop(); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordedChunks = [];
      recorder = new MediaRecorder(stream);
      recorder.addEventListener("dataavailable", (event) => { if (event.data.size) recordedChunks.push(event.data); });
      recorder.addEventListener("stop", async () => {
        stream.getTracks().forEach((track) => track.stop());
        button.classList.remove("is-recording");
        button.textContent = "🎤";
        const blob = new Blob(recordedChunks, { type: recorder.mimeType || "audio/webm" });
        recorder = null;
        if (!blob.size) return;
        if (ui.toast) ui.toast("Listening back…");
        try {
          const text = await transcribeForWehel(blob);
          if (!text) { if (ui.toast) ui.toast("I could not hear any words. Please try again."); return; }
          submit(text, "voice");
        } catch (error) {
          if (ui.toast) ui.toast(error.message || "Speech recognition is unavailable.");
        }
      });
      recorder.start();
      button.classList.add("is-recording");
      button.textContent = "⏹";
      if (ui.toast) ui.toast("Recording — press again to stop.");
    } catch (error) {
      if (ui.toast) ui.toast("The microphone is not available.");
    }
  }

  render();
  return { render, submit };
}
