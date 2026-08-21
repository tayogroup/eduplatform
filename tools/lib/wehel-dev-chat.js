// The local Wehel chat endpoint, shared by BOTH dev servers: serve-src-preview
// mounts it at /api/wehel-chat, and vite.config.js mounts it at the production
// path /local/hubredirect/wehel_chat.php (vite's convention is emulating the
// prod endpoints, as it already does for quiz_tts/quiz_stt). One module, so the
// prompt-assembly logic cannot drift between the two — the only remaining
// mirror is the real PHP in wehel_chat.php.
//
// The prompt itself is the single source in local_hubredirect/wehel_prompt.json;
// change wording there, never here.

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { phrasesForSubject, normalisePhrase, PROMPT_FILE } = require("./ehel-wehel-phrases.js");

// Homework attachments — mirrors of the wehel_chat.php constants; the contract
// gate holds the daily limit equal across the three files.
const ATTACH_DAILY_LIMIT = 5;
const ATTACH_PER_MESSAGE = 2;
const ATTACH_MAX_BASE64 = 2800000; // ≈2MB decoded, per file
const ATTACH_MEDIA_TYPES = {
  image: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  document: ["application/pdf"],
};
// Dev has one anonymous learner, so the ledger is a module-level day + hash
// set — the same shape the PHP keeps in a user preference.
const attachLedger = { day: "", hashes: new Set() };

// Validate one image/document block; returns its content hash — what the daily
// allowance counts, so a retry (or a tool-loop round re-posting the same
// conversation) is free. Mirrors pqh_wehel_validate_attachment.
function validateAttachment(block) {
  const allowed = ATTACH_MEDIA_TYPES[block.type] || [];
  const source = block.source || {};
  if (source.type !== "base64") throw Object.assign(new Error("Malformed attachment."), { status: 400 });
  if (!allowed.includes(String(source.media_type))) {
    throw Object.assign(new Error("Only JPG, PNG, WEBP or GIF photos and PDF files can be attached."), { status: 400 });
  }
  const data = String(source.data || "");
  if (!data || data.length > ATTACH_MAX_BASE64) {
    throw Object.assign(new Error("An attachment is empty or too large — about 2MB is the limit."), { status: 400 });
  }
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(data)) {
    throw Object.assign(new Error("An attachment could not be decoded."), { status: 400 });
  }
  return crypto.createHash("sha1").update(data).digest("hex");
}

// Snap reply sentences that nearly match a stock phrase back to its canonical
// text, so the on-screen sentence and the pre-recorded clip share one hash.
// Mirrored in wehel_chat.php — keep the two in step.
function canonicaliseWehelReply(reply, phrases) {
  const canon = new Map(phrases.map((phrase) => [normalisePhrase(phrase), phrase]));
  return String(reply).split(/(?<=[.!?…])\s+/).map((sentence) => canon.get(normalisePhrase(sentence)) || sentence).join(" ");
}

/**
 * Build an (req, res) handler for the Wehel chat route. Works as a raw
 * node:http handler and as a connect middleware alike.
 *
 * @param {{ apiKey: () => string|undefined, model?: () => string|undefined }} options
 *   Key/model getters, so each server reads its own env (process.env for
 *   serve-src-preview, vite's loadEnv result for vite.config.js).
 */
function createWehelChatHandler({ apiKey, model: modelOverride = () => undefined }) {
  return async function handleWehelChat(req, res) {
    const fail = (status, message) => {
      res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
      res.end(JSON.stringify({ ok: false, message }));
    };
    try {
      if (req.method !== "POST") return fail(405, "Use POST.");
      let body = "";
      for await (const chunk of req) {
        body += chunk;
        // Matches wehel_chat.php: raised from 600KB for homework attachments.
        if (body.length > 8 * 1024 * 1024) return fail(413, "The request is too large.");
      }
      const payload = JSON.parse(body || "{}");
      const promptData = JSON.parse(fs.readFileSync(PROMPT_FILE, "utf8"));

      const subject = String(payload.subject || "");
      if (!promptData.subjectNotes[subject]) return fail(400, "Unknown subject.");
      const grade = Number(payload.grade);
      if (!Number.isInteger(grade) || grade < 1 || grade > 9) return fail(400, "Unknown grade.");
      const channel = payload.channel === "voice" ? "voice" : "text";
      const clean = (value, max) => String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
      // Any advertised tool with a definition in the prompt source gets defined
      // for the model; the client resolves the calls, so nothing else is
      // server-side.
      const toolDefs = (Array.isArray(payload.tools) ? payload.tools : [])
        .filter((name) => typeof name === "string" && promptData.tools?.[name])
        .map((name) => ({ name, ...promptData.tools[name] }));
      const useUnitTool = toolDefs.length > 0;

      const messages = Array.isArray(payload.messages) ? payload.messages.slice(-30) : [];
      // Content is either a plain string or an array of API content blocks —
      // the client's tool loop sends tool_use/tool_result turns as blocks, and
      // a homework attachment rides its message as image/document blocks.
      const attachmentHashes = [];
      const conversation = messages.map((message) => {
        const role = message.role === "assistant" ? "assistant" : "user";
        const content = message.content ?? message.text ?? "";
        if (Array.isArray(content)) {
          const files = content.filter((block) => block && (block.type === "image" || block.type === "document"));
          if (files.length > ATTACH_PER_MESSAGE) {
            throw Object.assign(new Error(`Up to ${ATTACH_PER_MESSAGE} files can go with one message.`), { status: 400 });
          }
          files.forEach((block) => attachmentHashes.push(validateAttachment(block)));
          // The 200k ceiling guards the text/tool blocks; attachments carry
          // their own per-block cap and are excluded from this measure.
          const plain = content.filter((block) => !files.includes(block));
          if (JSON.stringify(plain).length > 200000) throw new Error("A chat message is too large.");
          return { role, content };
        }
        const text = String(content).trim().slice(0, 4000);
        return text ? { role, content: text } : null;
      }).filter(Boolean);
      if (!conversation.length || conversation[conversation.length - 1].role !== "user") {
        return fail(400, "The last message must be from the learner.");
      }
      // Daily allowance, hash-deduped — mirrors wehel_chat.php's user-preference
      // ledger, keyed to the one dev learner.
      if (attachmentHashes.length) {
        const today = new Date().toISOString().slice(0, 10);
        if (attachLedger.day !== today) { attachLedger.day = today; attachLedger.hashes.clear(); }
        for (const hash of new Set(attachmentHashes)) {
          if (attachLedger.hashes.has(hash)) continue;
          if (attachLedger.hashes.size >= ATTACH_DAILY_LIMIT) {
            res.writeHead(429, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
            res.end(JSON.stringify({ ok: false, code: "attach-limit", message: `You have used all ${ATTACH_DAILY_LIMIT} homework uploads for today — type the question instead, and the uploads come back tomorrow.` }));
            return;
          }
          attachLedger.hashes.add(hash);
        }
      }

      let unitContent = "";
      if (payload.unit !== undefined) {
        unitContent = JSON.stringify(payload.unit);
        // Matches UNIT_JSON_LIMIT in shell/wehel.js and the cap in
        // wehel_chat.php — the client strips audio descriptors before sending,
        // and at 120000 the cut hid every English unit's readings, grammar and
        // quizzes behind its word lists.
        if (unitContent.length > 200000) unitContent = `${unitContent.slice(0, 200000)} …(unit content truncated)`;
      }
      if (!unitContent) {
        unitContent = "(The unit content was not provided. Teach from the unit title and general Cambridge knowledge for this grade, and say when you are unsure what the lesson on screen shows.)";
      }

      // Focus — the module of this unit the learner picked in the chat panel.
      // It narrows the tutor's attention only: UNIT CONTENT, the year outline
      // and the tools all still travel. Unset, the replacement is the empty
      // string, so the prompt builds exactly as it did before Focus existed.
      // Mirrored in wehel_chat.php.
      const focusLabel = clean(payload.focus && payload.focus.label, 80);
      const focusBlock = focusLabel && Array.isArray(promptData.focusBlock) && promptData.focusBlock.length
        ? `\n${promptData.focusBlock.join("\n").split("{{FOCUS_LABEL}}").join(focusLabel)}\n`
        : "";

      const replacements = {
        "{{LEARNER_NAME}}": clean(payload.learnerName, 40) || "the learner",
        "{{SUBJECT}}": clean(payload.subjectLabel, 60) || subject,
        "{{GRADE}}": String(grade),
        "{{STAGE_BAND}}": promptData.stageBands[String(grade)] || "upper-primary",
        "{{CAMBRIDGE_CODE}}": clean(payload.cambridgeCode, 60) || "curriculum",
        "{{UNIT_NO}}": clean(payload.unitNo, 8) || "?",
        "{{UNIT_TITLE}}": clean(payload.unitTitle, 160) || "this unit",
        "{{CHANNEL}}": channel,
        "{{SUBJECT_NOTES}}": promptData.subjectNotes[subject].join("\n"),
        "{{STOCK_PHRASES}}": phrasesForSubject(subject, promptData.phraseBank).map((phrase) => `- ${phrase}`).join("\n"),
        "{{OTHER_UNITS_NOTE}}": (promptData.otherUnitsNotes || {})[useUnitTool ? "withTool" : "withoutTool"] || "",
        "{{COURSE_OUTLINE}}": String(payload.courseOutline || "").replace(/[^\S\n]+/g, " ").trim().slice(0, 4000)
          || "(The course outline was not provided; you know only the current unit.)",
        "{{UNIT_CONTENT}}": unitContent,
        "{{FOCUS}}": focusBlock,
      };
      let system = promptData.template.join("\n").replace(/\{\{[A-Z_]+\}\}/g, (token) => replacements[token] ?? token);
      // Everything appended from here is the VOLATILE tail — it varies between
      // questions in the same unit, so it stays out of the cached block above.
      // Mirrored in wehel_chat.php.
      let volatileTail = "";
      // A hint is one string, or an array of lines for the long ones (the
      // virtual-teacher playbook). Mirrored in wehel_chat.php.
      const modeHint = (promptData.modeHints || {})[String(payload.mode || "")];
      if (modeHint) volatileTail += `\n\n${Array.isArray(modeHint) ? modeHint.join("\n") : modeHint}`;
      // Preferred teaching language — only languages the prompt source defines
      // are honoured, and the block itself (e.g. Somali-for-vocabulary-only)
      // lives in wehel_prompt.json. Mirrored in wehel_chat.php.
      const languageBlock = (promptData.languageSupport || {})[String(payload.teachingLanguage || "").toLowerCase()];
      if (Array.isArray(languageBlock)) volatileTail += `\n\n${languageBlock.join("\n")}`;
      // The learner's real assigned homework — formatted client-side by
      // homeworkContextText. Multi-line by design, like the course outline.
      // Mirrored in wehel_chat.php; the cap matches HOMEWORK_CONTEXT_LIMIT in
      // shell/wehel.js and the contract gate holds the three equal.
      let homeworkContext = String(payload.homework || "").replace(/[^\S\n]+/g, " ").trim();
      if (homeworkContext.length > 6000) homeworkContext = `${homeworkContext.slice(0, 6000)} …`;
      if (homeworkContext && Array.isArray(promptData.homeworkBlock) && promptData.homeworkBlock.length) {
        volatileTail += `\n\n${promptData.homeworkBlock.join("\n").split("{{HOMEWORK_LIST}}").join(homeworkContext)}`;
      }
      // Where the learner is standing right now. The dock opens over any
      // lesson page, so "I don't get this" has a referent.
      const sectionHint = clean(payload.sectionHint, 80);
      if (sectionHint) volatileTail += `\n\nThe learner is on the "${sectionHint}" page of this unit right now — useful context for what they may mean, but their own words always come first: answer what they asked, not the page.`;
      // The exact item on screen (a deck's current slide) — what "this
      // activity" means to the virtual teacher. Mirrored in wehel_chat.php.
      const activityHint = clean(payload.activityHint, 200);
      if (activityHint) volatileTail += `\n\nThe exact item on their screen right now is: "${activityHint}".`;
      // The stable block is cached; a learner's later questions in the same
      // unit read ~30k tokens from cache instead of re-sending them.
      const systemBlocks = [{ type: "text", text: system, cache_control: { type: "ephemeral" } }];
      if (volatileTail.trim()) systemBlocks.push({ type: "text", text: volatileTail });

      const key = apiKey();
      if (!key) return fail(503, "ANTHROPIC_API_KEY is not configured in the local .env file.");
      const model = modelOverride() || promptData.model || "claude-sonnet-5";
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens: Math.max(200, Math.min(2000, Number(promptData.maxTokens) || 700)),
          system: systemBlocks,
          ...(toolDefs.length ? { tools: toolDefs } : {}),
          messages: conversation,
        }),
      });
      if (!response.ok) return fail(502, `Anthropic ${response.status}: ${(await response.text()).slice(0, 240)}`);
      const result = await response.json();
      // A tool call goes back to the client, which holds the course data and
      // will re-post with the tool_result appended.
      const toolUse = (result.content || []).find((block) => block.type === "tool_use");
      if (toolUse) {
        res.writeHead(200, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
        res.end(JSON.stringify({ ok: true, toolUse: { id: toolUse.id, name: toolUse.name, input: toolUse.input }, assistantContent: result.content, model }));
        return;
      }
      const reply = (result.content || []).filter((block) => block.type === "text").map((block) => block.text).join("").trim();
      if (!reply) return fail(502, "Wehel could not answer just now.");
      const canonical = canonicaliseWehelReply(reply, phrasesForSubject(subject, promptData.phraseBank));
      res.writeHead(200, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
      res.end(JSON.stringify({ ok: true, reply: canonical, model }));
    } catch (error) {
      // Validation errors carry their own status (400s from the attachment
      // checks); anything else is the generic 503.
      fail(error.status || 503, error.message || "Wehel is unavailable right now.");
    }
  };
}

/**
 * Local twin of local_hubredirect/wehel_homework.php. Production reads the
 * learner's real assignments out of Moodle; dev has no Moodle, so this serves
 * a small sample list ONLY when WEHEL_DEV_HOMEWORK is set in the environment —
 * unset, it answers the empty list a learner without homework gets, so normal
 * dev sessions never send fake homework context to the real API.
 */
function createWehelHomeworkHandler({ enabled = () => process.env.WEHEL_DEV_HOMEWORK } = {}) {
  return async function handleWehelHomework(req, res) {
    const homework = enabled()
      ? [
        { source: "workspace", title: "Fractions practice sheet", course: "Mathematics", text: "Complete questions 1 to 10 on adding fractions with different denominators. Show your working.", dueLabel: "22 Aug 2026", status: "assigned", points: 20 },
        { source: "live-class", title: "Read pages 4-6 of the reading booklet and underline five new words.", classTitle: "English live class (18 Aug)", text: "", dueLabel: "21 Aug 2026", priority: "high", unitid: "unit-3" },
      ]
      : [];
    res.writeHead(200, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
    res.end(JSON.stringify({ ok: true, homework }));
  };
}

module.exports = { createWehelChatHandler, createWehelHomeworkHandler, canonicaliseWehelReply };
