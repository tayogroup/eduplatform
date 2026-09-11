/* Drive every step of every lesson of a Computing build to completion in a
 * real browser, the way a child would - and, with --record, prove that what
 * the child finished reaches the school's record.
 *
 *   node ../lesson-kit/drive-lessons.mjs --app .               # every lesson, then a 375 px overflow sweep
 *   node ../lesson-kit/drive-lessons.mjs --app . --only 3      # one lesson (repeat --only for more)
 *   node ../lesson-kit/drive-lessons.mjs --app . --record      # on a copy of the DEPLOYED layout:
 *                                                              # the stored record and resume, per lesson
 *
 * THE PLAYERS. One per step kind, each playing the step CORRECTLY from the
 * page's own LESSON data (the bin the item belongs in, the square Robo stops
 * on, the fix block), so "every dot ticked" at the end is a statement about
 * the renderers, not about luck. They were written as each stage of the kit
 * was built and found, among others, a Robo square that could not be tapped
 * under its own emoji and a two-bug debug round that never released its lock.
 *
 * WHY --record EXISTS. The plain drive serves the source tree, where the five
 * platform modules deploy.mjs puts BESIDE the lessons do not exist - they 404
 * by design, and the progress module with them. So the plain drive can prove
 * every dot ticks and can never prove a finished lesson reaches the school.
 * That blind spot hid a real defect in every Computing lesson from the first
 * release (found by the Grade 1 validation, 2026-09-11): two shell steps
 * ticked themselves during page load, before the progress module existed, so
 * a lesson finished to 100% on screen was stored as 14 of 16 steps and never
 * recorded complete, and a reopened lesson always opened at step 1.
 * --record builds the deployed layout in a temporary directory exactly as
 * deploy.mjs does, at the depth it is served from (the hub as index.html, the
 * five modules beside the pages with their imports flattened, the crest in
 * app/shared/), serves it, and after each lesson reads the
 * record the page itself wrote: every step in sectionsDone, completed set.
 * Then, in a fresh browser, it moves to step 4, reloads, and requires the
 * page to open on step 4 - with nothing ticked on the fresh open.
 *
 * Exit 0 when every lesson ends at 100% (and, with --record, every record is
 * complete and every resume lands); 1 otherwise; 2 when it could not run.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { spawn } from "node:child_process";
import { chromium } from "playwright";

const argv = process.argv.slice(2);
const arg = (k, d) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const REPO = path.resolve(HERE, "../../../../..");
const APP = path.resolve(process.cwd(), arg("--app", "."));
const RECORD = argv.includes("--record");
const PORT = Number(arg("--port", RECORD ? "4331" : "4330"));
const PAR = Number(arg("--parallel", "8"));
const ONLY = argv.map((a, i) => (a === "--only" ? Number(argv[i + 1]) : 0)).filter(Boolean);

const die = (msg) => { console.error("COULD NOT RUN: " + msg); process.exit(2); };
if (!fs.existsSync(path.join(APP, "app.config.json"))) die("no app.config.json in " + APP + "; pass --app <grade dir>");
const cfg = JSON.parse(fs.readFileSync(path.join(APP, "app.config.json"), "utf8"));
const COURSE = cfg.courseKey;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const lessonData = (file) => {
  const s = fs.readFileSync(path.join(APP, file), "utf8");
  const m = /\n  const LESSON = (\{[\s\S]*?\n  \});\n/.exec(s);
  if (!m) throw new Error("no LESSON block in " + file);
  return JSON.parse(m[1]);
};

/* the rules the players need, mirrored from lib/computing.js */
const REPEATS = { repeat2: 2, repeat3: 3, repeat4: 4 };
const FOREVER_CYCLES = 2;
const expand = (ids) => { const out = []; for (let i = 0; i < ids.length; i++) { const n = REPEATS[ids[i]]; if (n) { const nx = ids[i + 1]; if (nx && !REPEATS[nx]) { for (let j = 0; j < n; j++) out.push(nx); i++; } } else out.push(ids[i]); } return out; };
const expandLoop = (before, body, times, after) => { const out = (before || []).slice(); for (let i = 0; i < times; i++) out.push(...body); return out.concat(after || []); };
const flattenAlgo = (blocks) => { const out = []; blocks.forEach((bl) => { if (bl.kind === "repeat") { for (let t = 0; t < bl.times; t++) bl.body.forEach((st) => out.push(st.id)); } else if (bl.kind === "forever") { for (let t = 0; t < FOREVER_CYCLES; t++) bl.body.forEach((st) => out.push(st.id)); out.push("stop"); } else out.push(bl.id); }); return out; };
const subExpand = (main, subs) => { const out = []; main.forEach((bl) => { if (bl.kind === "call") { out.push("call:" + bl.sub); subs[bl.sub].forEach((st) => out.push(st.id)); } else out.push(bl.id); }); return out; };
const branchRun = (rd, id) => (rd.before || []).concat(id === rd.inputs[0].id ? rd.yes : rd.no, rd.after || []).map((st) => st.id);
const caesarShift = (text, shift) => String(text).toLowerCase().split("").filter((c) => c >= "a" && c <= "z").map((c) => String.fromCharCode(((c.charCodeAt(0) - 97 + shift) % 26 + 26) % 26 + 97)).join("");

/* ------------------------------------------------------------ serving */
const EXPECTED_404 = ["learner-controls.js", "wehel.js", "course-shell.js", "seb-session.js", "progress-client.js"];

async function waitFor(port) {
  for (let i = 0; i < 50; i++) {
    await sleep(200);
    const ok = await new Promise((r) => { const q = http.get(`http://127.0.0.1:${port}/`, (res) => { res.resume(); r(true); }); q.on("error", () => r(false)); });
    if (ok) return;
  }
  die("the server on port " + port + " did not start");
}

async function serveSource() {
  const tool = path.join(REPO, "tools/serve-src-preview.js");
  if (!fs.existsSync(tool)) die("tools/serve-src-preview.js not found from " + REPO);
  const child = spawn("node", [tool], { env: { ...process.env, PORT: String(PORT) }, stdio: "ignore" });
  await waitFor(PORT);
  const rel = path.relative(path.join(REPO, "src"), APP).split(path.sep).join("/");
  return { base: `http://127.0.0.1:${PORT}/${rel}/`, close: () => child.kill() };
}

/* The deployed layout, exactly as deploy.mjs writes it, AT THE DEPTH it is
   served from: the hub as index.html, every lesson under its own name, and the
   five modules beside them with their imports flattened to ./x.js, all under
   the app.config.json `remote` (Ehel Primary/app/computing/grade-N-v2).
   The depth is not decoration. The header bar's crest is
   ../../shared/ehel-academy-logo.png, which resolves to app/shared/ live and
   to nothing in a replica served from its own root - the first --record run
   reported that 404 on every lesson. So every reference that leaves the
   directory is copied from the source tree (app/X is src/prototypes/
   ehel-academy/X), and one the tree does not have 404s here as it would there.
   Keep MODULES in step with mathematics/lesson-app-tools/deploy.mjs - a module
   missing here is a 404 here and nowhere else. */
function buildReplica() {
  const EH = path.resolve(REPO, "src/prototypes/ehel-academy");
  const MODULES = ["shell/learner-controls.js", "shell/wehel.js", "shared/course-shell.js", "shared/progress-client.js", "shared/seb-session.js"];
  const flatten = (s) => s
    .replace(/from\s*(["'])\.\.\/shared\/([A-Za-z0-9_-]+\.js)(\?[^"']*)?\1/g, 'from "./$2"')
    .replace(/from\s*(["'])\.\/([A-Za-z0-9_-]+\.js)(\?[^"']*)?\1/g, 'from "./$2"');
  const sub = String(cfg.remote || "").replace(/^Ehel Primary\//, "");
  if (!/^app\/[a-z-]+\/[A-Za-z0-9_-]+$/.test(sub)) die("app.config.json remote " + JSON.stringify(cfg.remote) + " is not Ehel Primary/app/<subject>/<dir>");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "computing-replica-"));
  const out = path.join(dir, ...sub.split("/"));
  fs.mkdirSync(out, { recursive: true });
  for (const [from, to] of [[cfg.hub, "index.html"], ...cfg.lessons.map((l) => [l.file, l.file])]) {
    fs.copyFileSync(path.join(APP, from), path.join(out, to));
    for (const m of fs.readFileSync(path.join(APP, from), "utf8").matchAll(/(?:src|href)="(\.\.\/[^"?#]+)"/g)) {
      const rel = path.posix.join(sub, m[1]);                 // app/shared/ehel-academy-logo.png
      if (!rel.startsWith("app/")) continue;                  // outside the app tier: not the pipeline's
      const src = path.join(EH, ...rel.slice(4).split("/"));
      const dst = path.join(dir, ...rel.split("/"));
      if (fs.existsSync(src) && !fs.existsSync(dst)) { fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.copyFileSync(src, dst); }
    }
  }
  for (const m of MODULES) {
    const src = path.join(EH, m);
    if (!fs.existsSync(src)) die("module " + m + " not found; the replica would not be the deployed layout");
    fs.writeFileSync(path.join(out, path.basename(m)), flatten(fs.readFileSync(src, "utf8")));
  }
  return { dir, sub };
}

async function serveReplica() {
  const { dir, sub } = buildReplica();
  const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
    ".png": "image/png", ".svg": "image/svg+xml", ".json": "application/json", ".woff2": "font/woff2", ".mp3": "audio/mpeg" };
  const server = http.createServer((req, res) => {
    const u = decodeURIComponent(new URL(req.url, "http://x").pathname);
    const f = path.join(dir, u.endsWith("/") ? u + "index.html" : u);
    if (!f.startsWith(dir) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end("not found"); return; }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(f)] || "application/octet-stream", "Cache-Control": "no-store" });
    fs.createReadStream(f).pipe(res);
  });
  await new Promise((r) => server.listen(PORT, "127.0.0.1", r));
  return { base: `http://127.0.0.1:${PORT}/${sub}/`, close: () => { server.close(); fs.rmSync(dir, { recursive: true, force: true }); } };
}

/* ------------------------------------------------------------ players */
const S = (n, suffix) => `#stage${n}${suffix || ""}`;
async function click(page, sel, opts) {
  const el = page.locator(sel).first();
  await el.waitFor({ state: "visible", timeout: 8000 });
  await el.click(opts);
}
async function clickIf(page, sel) {
  const el = page.locator(sel).first();
  if (await el.count() && await el.isVisible()) { await el.click(); return true; }
  return false;
}

async function driveStep(page, n, st, log) {
  const d = st.data, k = st.kind;
  const okChoice = `#ch${n} .choice[data-ok="1"]`;
  if (k === "overview") {
    /* the warm-up is optional for the child; the driver plays it to prove it works */
    for (let i = 0; i < (d.warmup || []).length; i++) { await click(page, `${S(n)} .warmup .choice[data-ok="1"]`); await sleep(2700); }
    return;
  }
  if (k === "world") return;
  if (k === "lecture") { for (let i = 0; i < d.parts.length; i++) { await click(page, S(n, "lnext")); await sleep(250); } return; }
  if (k === "words") {
    for (let i = 0; i < d.items.length; i++) { await click(page, `${S(n)} .wordcard[data-k="${i}"]`); await sleep(150); }
    await click(page, S(n, "wgo"));
    for (let i = 0; i < d.items.length; i++) { await click(page, `#ch${n} .wordbtn[data-ok="1"]`); await sleep(2600); }
    return;
  }
  if (k === "explore" || k === "context") {
    const need = Math.min(d.need || d.items.length, d.items.length);
    for (let i = 0; i < need; i++) { await click(page, `${S(n)} .tapcard[data-k="${i}"]`); await sleep(120); }
    if (d.then) { await sleep(2700); await click(page, okChoice); await sleep(2900); }
    return;
  }
  if (k === "sort") {
    for (let i = 0; i < d.items.length; i++) {
      const label = (await page.locator(`${S(n)} .sortnow .lab`).first().textContent()).trim();
      const it = d.items.find((x) => x.label === label);
      await click(page, `${S(n)} .bin[data-b="${it.bin}"]`); await sleep(2300);
    }
    return;
  }
  if (k === "order") { for (let i = 0; i < d.items.length; i++) { await click(page, `${S(n)} .tapcard[data-k="${i}"]`); await sleep(350); } await sleep(2500); return; }
  if (k === "demo") { for (let i = 0; i < d.frames.length - 1; i++) { await click(page, S(n, "next")); await sleep(250); } await sleep(2900); return; }
  if (k === "follow") { for (let i = 0; i < d.steps.length; i++) { await click(page, `${S(n)} .act[data-k="${i}"]`); await sleep(350); } await sleep(2700); return; }
  if (k === "bugs") {
    for (const rd of d.rounds) {
      await click(page, `${S(n)} .algostep[data-k="${rd.wrong}"]`); await sleep(2900);
      if (rd.fix) { await click(page, okChoice); await sleep(2900); }
      await sleep(rd.steps.length * 900 + 3400);
    }
    await sleep(200); return;
  }
  if (k === "remix") {
    const steps = d.steps.map((s) => s.id);
    for (const rd of d.rounds) {
      const ok = rd.opts.find((o) => o.ok);
      if (rd.kind !== "add") { const idx = steps.indexOf(rd.change); await click(page, `${S(n)} .algostep[data-k="${idx}"]`); await sleep(2500); steps[idx] = ok.id; }
      else steps.push(ok.id);
      await click(page, okChoice); await sleep(4400);
    }
    return;
  }
  if (k === "robot") {
    for (const lv of d.levels) {
      if (lv.predict) { const prog = lv.loop ? expandLoop(lv.before, lv.loop.body, lv.loop.times, lv.after) : lv.program; await click(page, `${S(n)} .cell[data-c="${lv.answer[0]}"][data-r="${lv.answer[1]}"]`); await sleep(200); await click(page, S(n, "go")); await sleep(prog.length * 560 + 3800); }
      else { for (const c of lv.solution) { await click(page, `${S(n)} [data-cmd="${c}"]`); await sleep(80); } await click(page, S(n, "go")); await sleep(lv.solution.length * 560 + 3800); }
    }
    return;
  }
  if (k === "program") {
    for (const rd of d.rounds) {
      if (rd.given) { await click(page, okChoice); await sleep(300); await click(page, S(n, "run")); await sleep(expand(rd.given).length * 720 + 4200); }
      else { for (const id of rd.expect) { await click(page, `${S(n)} [data-add="${id}"]`); await sleep(80); } await click(page, S(n, "run")); await sleep(expand(rd.expect).length * 720 + 3900); }
    }
    return;
  }
  if (k === "debug") {
    for (const rd of d.rounds) {
      const program = rd.program.slice();
      const bugs = rd.bugs || [rd.bug];
      await click(page, S(n, "run")); await sleep(expand(program).length * 720 + 1500);
      for (;;) {
        const left = bugs.filter((b) => program[b] !== rd.expect[b]);
        if (!left.length) break;
        const b = left[0];
        await click(page, `${S(n)} .script [data-k="${b}"]`); await sleep(2900);
        const fix = (rd.fixes && rd.fixes[b]) || rd.fix;
        const ok = fix.opts.find((o) => o.ok);
        await click(page, `#ch${n} [data-id="${ok.id}"]`); program[b] = ok.id; await sleep(3000);
        await click(page, S(n, "run")); await sleep(expand(program).length * 720 + 1500);
      }
      await sleep(3600);
    }
    return;
  }
  if (k === "precise") { for (let i = 0; i < d.rounds.length; i++) { await click(page, okChoice); await sleep(3100); } return; }
  if (k === "chart") {
    for (let c = 0; c < d.columns.length; c++) for (let v = 0; v < d.columns[c].value; v++) { await click(page, `${S(n)} [data-k="${c}"]`); await sleep(90); }
    await sleep(2200); await click(page, okChoice); await sleep(3100); return;
  }
  if (k === "survey") {
    for (let i = 0; i < d.ways.length; i++) { await click(page, `${S(n)} [data-way="${i}"]`); await sleep(400); }
    await sleep(3400); await click(page, S(n, "svgo")); await sleep(d.people.length * 900 + 3800);
    await click(page, okChoice); await sleep(3000); return;
  }
  if (k === "label") {
    for (let i = 0; i < d.parts.length; i++) {
      const ask = await page.locator(`#ask${n}`).textContent();
      const part = d.parts.find((p) => ask.includes(p.label));
      await click(page, `${S(n)} [data-part="${part.id}"]`); await sleep(2900);
    }
    return;
  }
  if (k === "race") {
    for (const rd of d.rounds) { await click(page, `#ch${n} .choice[data-t="${rd.answer}"]`); await sleep(700); }
    await sleep(4600); await click(page, okChoice); await sleep(3000); return;
  }
  if (k === "form") { for (const p of d.people) { await click(page, `${S(n)} .opt[data-id="${p.answer}"]`); await click(page, S(n, "sub")); await sleep(2100); } return; }
  if (k === "table") { for (let i = 0; i < d.items.length; i++) { await click(page, okChoice); await sleep(2900); } return; }
  if (k === "sorter") { for (const w of d.ways) { await click(page, `${S(n)} [data-way="${w.id}"]`); await sleep(3600); } if (d.then) { await click(page, okChoice); await sleep(2900); } return; }
  if (k === "ask") { for (const qn of d.questions) { await click(page, `#ch${n} [data-way="${qn.answer}"]`); await sleep(4600); } return; }
  if (k === "network") {
    for (const dev of d.devices) { if (dev.id === d.hub) continue; await click(page, `${S(n)} [data-dev="${dev.id}"]`); await sleep(150); await click(page, `${S(n)} [data-dev="${d.hub}"]`); await sleep(400); }
    await sleep(5600);
    for (const t of d.send) { await click(page, `${S(n)} [data-dev="${t.from}"]`); await sleep(150); await click(page, `${S(n)} [data-dev="${t.to}"]`); await sleep(650 * 3 + 700 + 3200); }
    return;
  }
  if (k === "offline") {
    await click(page, S(n, "w")); await sleep(2600);
    for (const a of d.apps) { await click(page, `#ch${n} [data-g="${a.needs ? 0 : 1}"]`); await sleep(300); await click(page, S(n, "try")); await sleep(3900); }
    await click(page, S(n, "w")); await sleep(300); return;
  }
  if (k === "io") {
    const need = Math.min(d.need || d.devices.length, d.devices.length);
    for (let i = 0; i < need; i++) { await click(page, `${S(n)} .iodev[data-id="${d.devices[i].id}"]`); await sleep(2900); }
    for (let i = 0; i < 3; i++) {
      const ask = await page.locator(`#ask${n}`).textContent();
      const dev = d.devices.find((x) => ask.includes(x.label));
      await click(page, `#ch${n} [data-kind="${dev.kind}"]`); await sleep(3100);
    }
    return;
  }
  if (k === "apps") {
    const need = Math.min(d.need || d.apps.length, d.apps.length);
    for (let i = 0; i < need; i++) { await click(page, `${S(n)} [data-app="${d.apps[i].id}"]`); await sleep(400); if (i < need - 1) await click(page, S(n, "home")); }
    await sleep(3900); await clickIf(page, S(n, "home"));
    if (d.then) { await click(page, okChoice); await sleep(2900); }
    return;
  }
  /* ---- Stage 3 ---- */
  if (k === "trim") {
    const waste = d.steps.map((s2, i) => (s2.waste ? i : -1)).filter((i) => i >= 0);
    for (const i of waste) { await click(page, `${S(n)} .algostep[data-k="${i}"]`); await sleep(500); }
    const kept = d.steps.filter((s2) => !s2.waste).length;
    await sleep(2200 + (kept + 1) * 560 + 1500); return;
  }
  if (k === "loopspot") {
    for (let j = 0; j < d.run.length; j++) { await click(page, `${S(n)} .algostep[data-k="${d.run.start + j}"]`); await sleep(300); }
    await sleep(1800 + 3600 + 600); await click(page, okChoice); await sleep(2900); return;
  }
  if (k === "whatif") {
    for (const rd of d.rounds) {
      await click(page, okChoice); await sleep(2700);
      const len = d.steps.length + (rd.change.kind === "insert" ? 1 : rd.change.kind === "remove" ? -1 : 0);
      await sleep((len + 1) * 520 + 1800 + 800);
    }
    return;
  }
  if (k === "inout") {
    for (const rd of d.rounds) {
      for (let i = 0; i < rd.steps.length; i++) { await click(page, `${S(n)} .tapcard[data-k="${i}"]`); await sleep(250); }
      await sleep(2300);
      for (const x of rd.inputs) { await click(page, `${S(n)} .chip[data-in="${x}"]`); await sleep((rd.steps.length + 1) * 520 + 900); }
      await sleep(2400); await click(page, okChoice); await sleep(2900);
    }
    return;
  }
  if (k === "tidy") {
    for (const rd of d.rounds) {
      const local = rd.program.slice();
      let guard = 0;
      while (local.includes("wait") && guard++ < 10) {
        const i = local.indexOf("wait");
        await click(page, `${S(n)} .script [data-k="${i}"]`); await sleep(250); await click(page, `#ch${n} [data-do="delete"]`); await sleep(300);
        local.splice(i, 1);
      }
      for (let i = 0; i < local.length && guard++ < 30;) {
        let run = 1; while (local[i + run] === local[i]) run++;
        if (run >= 2 && run <= 4 && !REPEATS[local[i]]) {
          await click(page, `${S(n)} .script [data-k="${i}"]`); await sleep(250); await click(page, `#ch${n} [data-do="fold"]`); await sleep(300);
          local.splice(i, run, "repeat" + run, local[i]); i += 2;
        } else i++;
      }
      await click(page, S(n, "run")); await sleep(expand(local).length * 720 + 4000);
    }
    return;
  }
  if (k === "parallel") {
    for (const rd of d.rounds) {
      let longest = 0;
      for (let obj = 0; obj < d.sprites.length; obj++) {
        await click(page, `${S(n)} [data-obj="${obj}"]`); await sleep(200);
        for (const id of rd.scripts[obj].expect) { await click(page, `${S(n)} [data-add="${id}"]`); await sleep(80); }
        longest = Math.max(longest, expand(rd.scripts[obj].expect).length);
      }
      await click(page, S(n, "run")); await sleep(longest * 720 + 4300);
    }
    return;
  }
  if (k === "tweak") {
    for (const rd of d.rounds) {
      for (let i = 0; i < rd.program.length; i++) {
        const from = Number(rd.program[i].n), to = Number(rd.expect[i].n);
        if (rd.program[i].id === "jump" || from === to) continue;
        const taps = ((to - from) % 4 + 4) % 4;
        for (let t = 0; t < taps; t++) { await click(page, `${S(n)} .numchip[data-k="${i}"]`); await sleep(120); }
      }
      const moves = rd.expect.reduce((a, b) => a + (b.id === "jump" ? 1 : Number(b.n)), 0);
      await click(page, S(n, "run")); await sleep(moves * 720 + 4000);
    }
    return;
  }
  if (k === "device") {
    const INPUT = { whenA: "A", whenShake: "shake", whenClap: "clap", whenHot: "hot", whenDark: "dark" };
    const DREP = { repeat2: 2, repeat3: 3, repeat4: 4 };
    for (const rd of d.rounds) {
      for (const id of rd.expect) { await click(page, `${S(n)} [data-add="${id}"]`); await sleep(80); }
      /* the plan the page runs: repeats unrolled; everything after a forever loops */
      let plan = 0, foreverAt = -1;
      const outs = rd.expect.slice(1);
      for (let i = 0; i < outs.length; i++) { if (outs[i] === "forever") { foreverAt = plan; continue; } if (DREP[outs[i]]) { plan += DREP[outs[i]]; i++; continue; } plan++; }
      await click(page, `${S(n)} [data-in="${INPUT[rd.expect[0]]}"]`);
      if (foreverAt >= 0) { await sleep(400 + plan * 800 + (plan - foreverAt) * 800 * 2 + 400); await click(page, `${S(n)} [data-stop]`); await sleep(1200 + 4000); }
      else await sleep(400 + plan * 800 + 4000);
    }
    return;
  }
  if (k === "views") {
    for (const v of ["table", "bar", "picto"]) { await click(page, `${S(n)} [data-view="${v}"]`); await sleep(350); }
    await sleep(2600);
    for (let i = 0; i < d.questions.length; i++) { await click(page, okChoice); await sleep(2900); }
    return;
  }
  if (k === "sheet") {
    const cells = Object.assign({}, d.cells);
    for (const t of d.tasks) {
      if (t.kind === "find") { const name = Object.keys(cells).find((c) => String(cells[c]) === String(t.value)); await click(page, `${S(n)} [data-cell="${name}"]`); }
      else if (t.kind === "enter") { await click(page, `${S(n)} [data-cell="${t.cell}"]`); await sleep(300); await click(page, `#ch${n} [data-val="${t.value}"]`); cells[t.cell] = t.value; }
      else { await click(page, `${S(n)} [${t.target.length === 1 ? "data-col" : "data-cell"}="${t.target}"]`); await sleep(300); await click(page, `#ch${n} [data-fmt="${t.format}"]`); }
      await sleep(3100);
    }
    return;
  }
  if (k === "filter") {
    for (const t of d.tasks) {
      await click(page, `${S(n)} [data-field="${t.spec.field}"]`); await sleep(200);
      if (t.spec.op && t.spec.op !== "eq") { await click(page, `${S(n)} [data-op="${t.spec.op}"]`); await sleep(200); }
      await click(page, `${S(n)} [data-value="${t.spec.value}"]`); await sleep(200);
      await click(page, S(n, "go")); await sleep(2900);
      await click(page, okChoice); await sleep(2900);
    }
    return;
  }
  if (k === "cipher") {
    for (const rd of d.rounds) {
      const mode = rd.mode || "number";
      const keys = mode === "caesar" ? (rd.kind === "decode" ? rd.answer : caesarShift(rd.word, rd.shift)).split("")
        : mode === "pigpen" ? (rd.kind === "decode" ? rd.answer : rd.word).split("")
        : rd.kind === "decode" ? rd.answer.split("") : rd.answer.map(String);
      for (const key of keys) { await click(page, `${S(n)} .key[data-key="${key}"]`); await sleep(90); }
      await sleep(3400);
    }
    return;
  }
  /* ---- Stage 4 ---- */
  if (k === "loopalgo") {
    for (const rd of d.rounds) {
      if (rd.mode === "follow") {
        for (const id of flattenAlgo(rd.blocks)) { await click(page, `${S(n)} .act[data-id="${id}"]`); await sleep(300); }
        await sleep(2700);
      } else {
        await click(page, `${S(n)} .algostep[data-b="${rd.wrong[0]}"][data-j="${rd.wrong[1]}"]`); await sleep(2700);
        await click(page, okChoice); await sleep(2900);
        await sleep(flattenAlgo(rd.blocks).filter((x) => x !== "stop").length * 560 + 2200);
      }
    }
    return;
  }
  if (k === "compare") { for (const rd of d.rounds) { await click(page, `${S(n)} [data-algo="${rd.answer}"]`); await sleep(3500); } return; }
  if (k === "subroutine") {
    for (const rd of d.rounds) { for (const id of subExpand(rd.main, rd.subs)) { await click(page, `${S(n)} .act[data-id="${id}"]`); await sleep(300); } await sleep(2700); }
    return;
  }
  if (k === "branch") {
    for (const rd of d.rounds) {
      for (const inp of rd.inputs) {
        await click(page, `${S(n)} [data-input="${inp.id}"]`); await sleep(400);
        for (const id of branchRun(rd, inp.id)) { await click(page, `${S(n)} .act[data-id="${id}"]`); await sleep(300); }
        await sleep(3700);
      }
    }
    return;
  }
  if (k === "loopbuild") {
    for (const rd of d.rounds) {
      for (const id of rd.expect.body) { await click(page, `${S(n)} [data-add="${id}"]`); await sleep(150); }
      for (let t = 1; t < rd.expect.times; t++) { await click(page, S(n, "n")); await sleep(120); }
      await click(page, S(n, "run")); await sleep(3800);
    }
    return;
  }
  if (k === "comment") {
    for (let ci = 0; ci < d.comments.length; ci++) { await click(page, `${S(n)} [data-c="${ci}"]`); await sleep(200); await click(page, `${S(n)} .block[data-k="${d.comments[ci].block}"]`); await sleep(400); }
    await sleep(2400); await click(page, okChoice); await sleep(2900); return;
  }
  if (k === "inputprog") {
    for (const rd of d.rounds) {
      for (const inp of d.inputs) { await click(page, `${S(n)} [data-tab="${inp.id}"]`); await sleep(150); for (const id of rd.scripts[inp.id].expect) { await click(page, `${S(n)} [data-add="${id}"]`); await sleep(80); } }
      for (const inp of d.inputs) { await click(page, `${S(n)} [data-in="${inp.id}"]`); await sleep(expand(rd.scripts[inp.id].expect).length * 720 + 900); }
      await sleep(3400);
    }
    return;
  }
  if (k === "plan") { for (let i = 0; i < d.rounds.length * 2; i++) { await click(page, okChoice); await sleep(2900); } return; }
  if (k === "parttest") {
    for (const rd of d.rounds) {
      for (let pi = 0; pi < rd.parts.length; pi++) {
        const p = rd.parts[pi];
        await click(page, `${S(n)} [data-run="${pi}"]`); await sleep(expand(p.program).length * 720 + 900);
        if (p.bug != null) {
          await click(page, `${S(n)} .block[data-p="${pi}"][data-k="${p.bug}"]`); await sleep(400);
          const ok = p.fix.opts.find((o) => o.ok);
          await click(page, `#ch${n} [data-id="${ok.id}"]`); await sleep(400);
          await click(page, `${S(n)} [data-run="${pi}"]`); await sleep(expand(p.expect).length * 720 + 900);
        }
      }
      await sleep(3400);
    }
    return;
  }
  if (k === "datasort") {
    for (const t of d.tasks) {
      await click(page, `${S(n)} [data-field="${t.field}"]`); await sleep(200); await click(page, `${S(n)} [data-dir="${t.dir}"]`); await sleep(200);
      await click(page, S(n, "go")); await sleep(3300); await click(page, okChoice); await sleep(2900);
    }
    return;
  }
  if (k === "tableparts") {
    for (const t of d.tasks) {
      if (t.kind === "record") await click(page, `${S(n)} [data-record="${t.target}"]`);
      else if (t.kind === "field") await click(page, `${S(n)} [data-field="${t.target}"]`);
      else await click(page, `${S(n)} [data-cell="${t.target[0]}|${t.target[1]}"]`);
      await sleep(3000);
    }
    return;
  }
  if (k === "questions" || k === "quiz") { for (let i = 0; i < d.items.length; i++) { await click(page, okChoice); await sleep(2900); } return; }
  if (k === "games") {
    const games = d.games;
    let played = 0;
    for (const g of games) {
      if (played >= 2) break;
      if (g.type === "spelling") continue;
      const idx = games.indexOf(g);
      await click(page, `${S(n)} [data-game="${idx}"]`); await sleep(400);
      for (const round of g.rounds) {
        if (g.type === "choice") { await click(page, `#gameCh .choice[data-c="${round.answer.replace(/"/g, "&quot;")}"]`); await sleep(1300); }
        else if (g.type === "pairs") {
          const exact = (t) => new RegExp("^\\??" + t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$");
          for (const [a, b] of round.pairs) {
            await page.locator("#gameGrid .pairtile:not(.matched)").filter({ hasText: exact(a) }).first().click();
            await page.locator("#gameGrid .pairtile:not(.matched)").filter({ hasText: exact(b) }).first().click();
            await sleep(250);
          }
          await sleep(1300);
        }
      }
      await sleep(300); await click(page, "#gameOut"); await sleep(300); played++;
    }
    return;
  }
  if (k === "home") { await click(page, S(n, "hfin")); return; }
  if (k === "resources") { await click(page, `${S(n)} [data-res="words"]`); await sleep(300); await click(page, ".book-close"); return; }
  log.push("UNKNOWN KIND " + k);
}

/* ------------------------------------------------------------ one lesson */
async function readRecord(page, unit) {
  return page.evaluate(({ course, unit }) => {
    const k = Object.keys(localStorage).find((x) => x.startsWith("ehel-progress:" + course + ":"));
    if (!k) return null;
    const u = (JSON.parse(localStorage.getItem(k)).units || {})[unit] || {};
    return { sectionsDone: u.sectionsDone || [], completed: !!u.completed, resume: u.resume || null };
  }, { course: COURSE, unit });
}

async function driveLesson(browser, base, n, file) {
  const data = lessonData(file);
  const ctx = await browser.newContext({ viewport: { width: 1100, height: 900 } });
  const page = await ctx.newPage();
  const errors = [], log = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push("PAGEERROR " + e.message));
  page.on("response", (r) => { if (r.status() >= 400) errors.push("HTTP " + r.status() + " " + r.url()); });
  await page.goto(base + file + "?from=drive", { waitUntil: "load" });
  await page.evaluate(() => { try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch (e) { /* none */ } });
  const t0 = Date.now();
  for (let i = 0; i < data.steps.length; i++) {
    const st = data.steps[i];
    /* an overlay a step left open would swallow the next dot click */
    while (await page.locator(".book-reader .book-close").count()) { await page.locator(".book-reader .book-close").first().click(); await sleep(200); }
    await page.locator(`#dots button[data-i="${i}"]`).click({ timeout: 8000 });
    await sleep(150);
    try { await driveStep(page, i + 1, st, log); }
    catch (e) { log.push(`step ${i + 1} (${st.kind} "${st.title}") FAILED: ${e.message.split("\n")[0]}`); }
    /* the current step's dot reads "now", never "done": move on first, then look back */
    await page.locator(`#dots button[data-i="${i + 1}"]`).click({ timeout: 8000 });
    await sleep(120);
    const done = await page.locator(`#dots button[data-i="${i}"].done`).count();
    if (!done) log.push(`step ${i + 1} (${st.kind} "${st.title}") did not tick`);
  }
  await page.locator(`#dots button[data-i="${data.steps.length}"]`).click();
  await sleep(400);
  const ticks = await page.locator("#dots button.done").count();
  const pct = await page.locator("#ehPct").textContent().catch(() => "n/a");
  const stickers = (await page.locator("#fbstick").textContent()).trim();
  const unit = "l" + String(n).padStart(2, "0");
  let record = null, resume = null;
  if (RECORD) {
    await sleep(2500);                                   // the summary is flushed on navigation; give it a beat
    const r = await readRecord(page, unit);
    const want = data.steps.map((_, i) => "step-" + String(i + 1).padStart(2, "0"));
    record = r ? { stored: r.sectionsDone.length, of: want.length, missing: want.filter((x) => !r.sectionsDone.includes(x)), completed: r.completed } : { stored: 0, of: want.length, missing: want, completed: false, none: true };
    resume = await resumeCheck(browser, base, file, unit);
  }
  await ctx.close();
  const real = RECORD ? errors : errors.filter((e) => !EXPECTED_404.some((m) => e.includes(m)) && !/404|Failed to load resource/.test(e));
  return { n, file, steps: data.steps.length, ticks, pct, stickers, seconds: Math.round((Date.now() - t0) / 1000), errors: real, expected404: errors.length - real.length, log, record, resume };
}

/* Fresh browser: nothing ticked on a fresh open; move to step 4, reload, and
   the page must open on step 4. */
async function resumeCheck(browser, base, file, unit) {
  const ctx = await browser.newContext({ viewport: { width: 1100, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(base + file + "?from=drive", { waitUntil: "load" }); await sleep(1500);
  const freshDone = await page.locator("#dots button.done").count();
  await page.locator('#dots button[data-i="3"]').click(); await sleep(2500);
  const r = await readRecord(page, unit);
  await page.reload({ waitUntil: "load" }); await sleep(2500);
  const landed = await page.evaluate(() => { const b = document.querySelector("#dots button.now"); return b ? Number(b.dataset.i) + 1 : null; });
  await ctx.close();
  return { freshDone, storedResume: r && r.resume, landedOn: landed };
}

async function overflowSweep(browser, base, file) {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 740 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto(base + file + "?from=drive", { waitUntil: "load" });
  const count = await page.locator("#dots button").count();
  const bad = [];
  for (let i = 0; i < count; i++) {
    await page.locator(`#dots button[data-i="${i}"]`).click();
    await sleep(120);
    const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (over > 0) bad.push(`step ${i + 1}: +${over}px`);
  }
  await ctx.close();
  return bad;
}

async function pool(items, width, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(width, items.length) }, async () => {
    while (next < items.length) { const i = next++; try { out[i] = { ok: true, v: await fn(items[i]) }; } catch (e) { out[i] = { ok: false, e }; } }
  }));
  return out;
}

/* ------------------------------------------------------------ main */
const lessons = cfg.lessons.map((l, i) => ({ n: i + 1, file: l.file })).filter((l) => !ONLY.length || ONLY.includes(l.n));
if (!lessons.length) die("no lesson matches --only " + ONLY.join(", "));
const server = RECORD ? await serveReplica() : await serveSource();
const browser = await chromium.launch();
let bad = 0;
try {
  console.log(`\n  ${cfg.subjectLabel} ${cfg.gradeLabel}: driving ${lessons.length} lesson(s) on ${RECORD ? "a copy of the deployed layout (--record)" : "the source tree"}\n`);
  const results = await pool(lessons, PAR, (l) => driveLesson(browser, server.base, l.n, l.file));
  results.forEach((res, i) => {
    const l = lessons[i];
    if (!res.ok) { bad++; console.log(`Lesson ${l.n} ${l.file}: DRIVER FAILED: ${String(res.e && res.e.message).split("\n")[0]}`); return; }
    const r = res.v;
    const full = r.ticks === r.steps && /100%/.test(r.pct || "") && !r.errors.length;
    let line = `Lesson ${r.n} ${r.file}: ${r.ticks}/${r.steps} ticks, header ${r.pct}, ${r.seconds}s, ${r.errors.length} error(s)` + (RECORD ? "" : `, ${r.expected404} expected 404s`);
    let ok = full;
    if (RECORD) {
      const rec = r.record, rs = r.resume;
      const recOk = rec && !rec.missing.length && rec.completed;
      const resOk = rs && rs.freshDone === 0 && rs.landedOn === 4;
      line += ` | record ${rec.stored}/${rec.of} stored, ${rec.completed ? "complete" : "NOT complete"}` + (rec.missing.length ? ` (missing ${rec.missing.join(", ")})` : "") +
        ` | fresh open ${rs.freshDone} ticked, reload lands on step ${rs.landedOn}`;
      ok = ok && recOk && resOk;
    }
    if (!ok) bad++;
    console.log((ok ? "  ok   " : "  FAIL ") + line);
    if (r.stickers && !/Every sticker/.test(r.stickers)) console.log("       stickers: " + r.stickers);
    for (const e of r.errors) console.log("       ERROR " + e);
    for (const x of r.log) console.log("       NOTE " + x);
  });
  if (!RECORD) {
    console.log("\n  375 px overflow sweep:");
    for (const l of lessons) {
      const over = await overflowSweep(browser, server.base, l.file);
      if (over.length) bad++;
      console.log(`  ${over.length ? "FAIL" : "ok  "} ${l.file}: ${over.length ? over.join(", ") : "no horizontal overflow on any step"}`);
    }
  }
} finally {
  await browser.close();
  server.close();
}
console.log(bad ? `\n  ${bad} problem(s)` : "\n  every lesson ended at 100%" + (RECORD ? ", every record complete, every resume landed" : ""));
process.exitCode = bad ? 1 : 0;
