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
const { phrasesForSubject, normalisePhrase, PROMPT_FILE } = require("./ehel-wehel-phrases.js");

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
        if (body.length > 600 * 1024) return fail(413, "The request is too large.");
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
      // the client's tool loop sends tool_use/tool_result turns as blocks.
      const conversation = messages.map((message) => {
        const role = message.role === "assistant" ? "assistant" : "user";
        const content = message.content ?? message.text ?? "";
        if (Array.isArray(content)) {
          if (JSON.stringify(content).length > 200000) throw new Error("A chat message is too large.");
          return { role, content };
        }
        const text = String(content).trim().slice(0, 4000);
        return text ? { role, content: text } : null;
      }).filter(Boolean);
      if (!conversation.length || conversation[conversation.length - 1].role !== "user") {
        return fail(400, "The last message must be from the learner.");
      }

      let unitContent = "";
      if (payload.unit !== undefined) {
        unitContent = JSON.stringify(payload.unit);
        if (unitContent.length > 120000) unitContent = `${unitContent.slice(0, 120000)} …(unit content truncated)`;
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
      const modeHint = (promptData.modeHints || {})[String(payload.mode || "")];
      if (modeHint) volatileTail += `\n\n${modeHint}`;
      // Preferred teaching language — only languages the prompt source defines
      // are honoured, and the block itself (e.g. Somali-for-vocabulary-only)
      // lives in wehel_prompt.json. Mirrored in wehel_chat.php.
      const languageBlock = (promptData.languageSupport || {})[String(payload.teachingLanguage || "").toLowerCase()];
      if (Array.isArray(languageBlock)) volatileTail += `\n\n${languageBlock.join("\n")}`;
      // Where the learner is standing right now. The dock opens over any
      // lesson page, so "I don't get this" has a referent.
      const sectionHint = clean(payload.sectionHint, 80);
      if (sectionHint) volatileTail += `\n\nThe learner is on the "${sectionHint}" page of this unit right now — useful context for what they may mean, but their own words always come first: answer what they asked, not the page.`;
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
      fail(503, error.message || "Wehel is unavailable right now.");
    }
  };
}

module.exports = { createWehelChatHandler, canonicaliseWehelReply };
