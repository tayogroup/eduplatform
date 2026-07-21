const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};
globalThis.document = { addEventListener() {}, get visibilityState() { return "visible"; } };
globalThis.window = { addEventListener() {} };

const MOD = "./progress-client.js";
const { createProgressClient, classOf } = await import(MOD);
let fail = 0;
const ok = (c, m) => { if (!c) { console.log("  ✗ " + m); fail++; } else console.log("  ✓ " + m); };

console.log("== LOCAL backend ==");
const p = createProgressClient({ course: "ehel-eng-g03", student: 48213, backend: "local" });
ok(classOf("checkpoint.result") === "durable" && classOf("progress.summary") === "state" && classOf("section.viewed") === "ephemeral", "class taxonomy");
const e1 = p.emit({ type: "section.completed", unit: "u03", section: "reading" });
ok(!!e1.id && e1.seq === 1 && e1._k === undefined, "durable event: id+seq, no internal _k leaked");
p.emit({ type: "checkpoint.result", unit: "u03", section: "challenge", score: 92, passed: true, attempt: 1 });
p.emit({ type: "progress.summary", unit: "u03", sectionsDone: ["reading","challenge"], resume: { section: "writing", pos: 0 }, xp: 120 });
p.emit({ type: "draft.saved", unit: "u03", section: "writing", text: "My family is...", words: 3 });
p.emit({ type: "progress.summary", unit: "u03", knownWords: ["respect","duty"] });
const eph = p.emit({ type: "section.viewed", unit: "u03", section: "games", dwellMs: 8400 });
ok(!eph.id, "ephemeral event got no id");
ok(JSON.parse(localStorage.getItem("ehel-progress-outbox:ehel-eng-g03:48213") || "[]").length === 0, "local backend never uses the outbox");
const s = await p.hydrate(); const u = s.units.u03;
ok(u.sectionsDone.filter(x=>x==="challenge").length === 1 && u.sectionsDone.includes("reading"), "sectionsDone merged, deduped");
ok(u.checkpoints.challenge?.score === 92 && u.checkpoints.challenge.passed, "checkpoint captured");
ok(u.resume?.section === "writing", "resume captured");
ok(u.xp === 120, "xp captured");
ok(u.knownWords.join(",") === "respect,duty", "knownWords captured");
ok(u.drafts?.writing?.text.startsWith("My family"), "draft captured");
ok(s.stateVersion === 5, "stateVersion=5 (ephemeral not persisted); actual=" + s.stateVersion);

console.log("\n== REMOTE backend (mock fetch) ==");
const batches = []; let failNext = 0;
globalThis.fetch = async (url, opts) => {
  if (opts?.method === "POST") {
    if (failNext > 0) { failNext--; return { ok: false, status: 503 }; }
    batches.push(JSON.parse(opts.body));
    return { ok: true, status: 200, json: async () => ({ accepted: JSON.parse(opts.body).events.length, ok: true }) };
  }
  return { ok: true, status: 200, json: async () => ({ course: "c", student: 1, stateVersion: 0, units: {} }) };
};
const r = createProgressClient({ course: "ehel-math-g03", student: 7, backend: "remote", endpoint: "https://edge.test", token: "tok" });
// durable flushes immediately
await r.emit({ type: "checkpoint.result", unit: "u01", section: "challenge", score: 80, passed: true, attempt: 1 });
await new Promise(r => setTimeout(r, 5));
ok(batches.length === 1 && batches[0].events.length === 1, "durable flushed one batch");
ok(batches[0].events[0]._k === undefined, "_k stripped from wire payload");
ok(batches[0].contract === "1.0" && batches[0].student === 7 && batches[0].course === "ehel-math-g03", "envelope has contract+scope");
ok(!("_k" in batches[0].events[0]) && batches[0].events[0].id, "durable id present on wire");
// ephemeral dropped (not queued, not sent)
r.emit({ type: "media.played", unit: "u01", mediaId: "x", ms: 100 });
await new Promise(r => setTimeout(r, 5));
ok(batches.length === 1, "ephemeral not sent to remote");
// failure keeps it queued; retry sends it
failNext = 1;
await r.emit({ type: "unit.completed", unit: "u01", sectionsDone: 5, total: 5 });
await new Promise(res => setTimeout(res, 5));
const outboxAfterFail = JSON.parse(localStorage.getItem("ehel-progress-outbox:ehel-math-g03:7") || "[]");
ok(outboxAfterFail.length === 1, "failed durable stays queued (len=" + outboxAfterFail.length + ")");
await r.flush();
ok(batches.length === 2 && batches[1].events.some(e => e.type === "unit.completed"), "retry flush delivered the queued event");
ok(JSON.parse(localStorage.getItem("ehel-progress-outbox:ehel-math-g03:7") || "[]").length === 0, "outbox drained after success");

console.log(fail === 0 ? "\nALL PASS" : `\n${fail} FAILED`);
process.exit(fail === 0 ? 0 : 1);
