// Local twin of local_hubredirect/course_group_chat.php for the TUTORING
// category, so the learner's tutor-chat panel can be exercised on the dev
// servers without a Moodle. In-memory, one thread per token; any non-empty
// token is accepted. Mirrors the production door's contract: verbs {body},
// {since}, {attachment: {name, data}}, {screenshot}, {file, thread}; the
// contact-details refusal; the magic-byte type check and the size caps. A
// fake tutor replies two seconds after each learner text so the tutor bubble
// renders; nothing here touches a network.
//
// Mounted at the production path (/local/hubredirect/course_group_chat.php)
// by tools/serve-src-preview.js and vite.config.js. Open a subject with
//   ?category=tutoring&pwsToken=dev&pwsEndpoint=http://127.0.0.1:1/
// (pwsEndpoint only has to be non-empty for the panel to mount).

const IMAGE_MAX = 640000;
const DOC_MAX = 3145728;
const CONTACT_RE = /(https?:\/\/|www\.|[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}|\+?\d[\d\s().-]{7,}|@[A-Z0-9_.-]+)/i;

const threads = new Map(); // token -> { messages: [], files: Map(id -> {name, mime, bytes}) }
let nextId = 1;

function threadFor(token) {
  if (!threads.has(token)) threads.set(token, { messages: [], files: new Map() });
  return threads.get(token);
}

function checkAttachment(attachment) {
  const data = String(attachment.data || "").replace(/^data:[^;]+;base64,/, "");
  const raw = Buffer.from(data, "base64");
  if (raw.length < 100) return { rejected: "unreadable" };
  const name = String(attachment.name || "").replace(/[^A-Za-z0-9 _.-]+/g, "");
  let ext = (name.split(".").pop() || "").toLowerCase();
  let mime = "";
  if (raw[0] === 0xff && raw[1] === 0xd8) { mime = "image/jpeg"; ext = "jpg"; }
  else if (raw.slice(0, 4).toString("binary") === "\x89PNG") { mime = "image/png"; ext = "png"; }
  else if (raw.slice(0, 4).toString("binary") === "%PDF") { mime = "application/pdf"; ext = "pdf"; }
  else if (raw.slice(0, 4).toString("binary") === "PK\x03\x04" && (ext === "docx" || ext === "pptx")) {
    mime = ext === "docx"
      ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      : "application/vnd.openxmlformats-officedocument.presentationml.presentation";
  } else return { rejected: "type" };
  if (raw.length > (mime.startsWith("image/") ? IMAGE_MAX : DOC_MAX)) return { rejected: "too-big" };
  const base = (name.replace(/\.[^.]*$/, "").trim() || "homework").slice(0, 80);
  return { bytes: raw, filename: `${base}.${ext}`, mime };
}

function createTutoringChatDevHandler() {
  return async function handle(req, res) {
    const send = (status, body) => {
      res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "access-control-allow-origin": "*" });
      res.end(JSON.stringify(body));
    };
    if (req.method === "OPTIONS") { res.writeHead(204, { "access-control-allow-origin": "*", "access-control-allow-headers": "Authorization, Content-Type, Accept", "access-control-allow-methods": "POST, OPTIONS" }); res.end(); return; }
    if (req.method !== "POST") return send(405, { ok: false });
    let body = "";
    for await (const chunk of req) { body += chunk; if (body.length > 6 * 1024 * 1024) return send(413, { ok: false, filerejected: "too-big" }); }
    let payload;
    try { payload = JSON.parse(body || "{}"); } catch { return send(400, { ok: false }); }
    const token = String(payload.token || "");
    if (!token) return send(401, { ok: false });
    const t = threadFor(token);
    const me = 1001;
    const studentName = "Amina";

    if (payload.file) {
      const f = t.files.get(Number(payload.file));
      if (!f) return send(200, { ok: true, gone: true });
      return send(200, { ok: true, gone: false, name: f.name, mime: f.mime, base64: f.bytes.toString("base64") });
    }

    const now = () => Math.floor(Date.now() / 1000);
    let refused = "";
    let filerejected = "";
    const text = String(payload.body || "").trim();
    if (text) {
      if (CONTACT_RE.test(text)) refused = "contact-details";
      else {
        t.messages.push({ id: nextId++, senderid: me, name: studentName, teacher: false, body: text.slice(0, 1200), kind: "text", file: null, screenshot: false, at: now() });
        // The fake tutor, so the staff bubble can be seen without a Moodle.
        setTimeout(() => {
          t.messages.push({ id: nextId++, senderid: 7, name: "Tutor", teacher: true, body: `Thanks — I can see your question about "${text.slice(0, 40)}". Give me a moment to look at it.`, kind: "text", file: null, screenshot: false, at: now() });
        }, 2000);
      }
    }
    let attachment = null;
    let kind = "file";
    if (payload.screenshot) { attachment = { name: "screenshot.jpg", data: payload.screenshot }; kind = "screenshot"; }
    else if (payload.attachment && typeof payload.attachment === "object") attachment = payload.attachment;
    if (attachment) {
      const checked = checkAttachment(attachment);
      if (checked.rejected) filerejected = checked.rejected;
      else {
        const id = nextId++;
        t.files.set(id, { name: checked.filename, mime: checked.mime, bytes: checked.bytes });
        t.messages.push({ id, senderid: me, name: studentName, teacher: false, body: checked.filename, kind, file: { name: checked.filename, mime: checked.mime }, screenshot: kind === "screenshot", at: now() });
      }
    }
    const since = Number(payload.since || 0);
    const messages = t.messages.filter((m) => m.id > since).map((m) => ({ ...m, mine: m.senderid === me, toteacheronly: false, announcement: false, quote: null }));
    const lastStudent = Math.max(0, ...t.messages.filter((m) => m.senderid === me).map((m) => m.id));
    const lastStaff = Math.max(0, ...t.messages.filter((m) => m.senderid !== me).map((m) => m.id));
    return send(200, {
      ok: true, enabled: true, tutoring: true, threadid: 1, subject: "sci", subjectlabel: "Science",
      studentid: me, tutorcount: 2, unanswered: lastStudent > lastStaff, refused, filerejected, messages, servertime: now(),
    });
  };
}

module.exports = { createTutoringChatDevHandler };
