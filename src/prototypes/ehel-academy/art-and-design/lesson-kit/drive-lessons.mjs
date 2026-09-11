/* Drive every step of every lesson of an Art & Design build to completion in
 * a real browser, the way a child would - and say what did not finish.
 *
 *   node ../lesson-kit/drive-lessons.mjs --app .              # all lessons, desktop
 *   node ../lesson-kit/drive-lessons.mjs --app . --only 3     # one lesson
 *   node ../lesson-kit/drive-lessons.mjs --app . --width 375  # phone width, and check overflow
 *   node ../lesson-kit/drive-lessons.mjs --app . --keyboard   # the marks step by keyboard alone
 *
 * THE MARKS STEP IS PLAYED TWO WAYS. At desktop width by drawing on the
 * paper with the mouse; at phone width (or with --keyboard) with the KEYBOARD
 * alone - focus "Choose the mark", press Enter, pick a wrong mark first and
 * then the right one, then stamp a mark in the free round - so the two
 * routine runs between them prove both routes finish every round.
 *
 * AND THREE THINGS THAT ARE NOT A LESSON STEP, checked once per run after the
 * lessons (skipped with --only): "Stop for today" at the end of Lesson 1's
 * journal leaves for the hub with the NEXT step kept as the place to resume;
 * every lesson's make-at-home sheet prints to PDF on its own, on one or two
 * A4 pages, with the lesson hidden; and the starting check, answered all right
 * and then all wrong, reports the right band, keeps its result on the device,
 * links its review lessons, and shows up on the hub's card.
 *
 * WHY THIS EXISTS. The gates read the shipped bytes and re-compute every
 * relationship, and they cannot see a renderer that never calls finish(), a
 * button that is drawn disabled, or a stroke judge that no real pointer can
 * satisfy. The Global Perspectives build found its worst defect (a know board
 * that pushed `undefined` and never finished) by driving, not by reading.
 * This is that driver for this kit: one player per step kind, each playing
 * the step CORRECTLY from the page's own LESSON data (the mix the pots make,
 * the bin the item belongs in, the material that fits), so that "every dot
 * ticked" at the end is a statement about the renderers, not about luck.
 *
 * It serves the working tree off tools/serve-src-preview.js on its own port,
 * so nothing here touches a deployed page. Exit 0 when every lesson ends at
 * 100% with every sticker; 1 otherwise; 2 when it could not run.
 */
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { chromium } from "playwright";

const argv = process.argv.slice(2);
const arg = (k, d) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
const APP = path.resolve(process.cwd(), arg("--app", "."));
const ONLY = arg("--only", null);
const WIDTH = Number(arg("--width", "1100"));
const PORT = Number(arg("--port", "4310"));
const PAR = Number(arg("--parallel", "4"));
/* --trace <file>: also press Explain on every step, and write every sentence
   the page spoke (window.__artNarrationLog, recorded by lib/art.js) to <file>,
   with how many spoken lines were fully covered by recorded clips. It is the
   list narrate.mjs records from, and the measurement of how much of a lesson
   is heard in the recorded voice. */
const TRACE = arg("--trace", null);
const KEYBOARD = argv.includes("--keyboard") || WIDTH <= 480;
const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const REPO = path.resolve(HERE, "../../../../..");
const cfgPath = path.join(APP, "app.config.json");
if (!fs.existsSync(cfgPath)) { console.error("no app.config.json in " + APP); process.exit(2); }
const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
const rel = path.relative(path.join(REPO, "src"), APP).split(path.sep).join("/");
const PLATFORM_404 = /learner-controls\.js|wehel\.js|course-shell\.js|seb-session\.js|progress-client\.js/;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rx = (s) => new RegExp("^" + String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$");

/* the page's own data, read from the shipped bytes exactly as the gate does */
function lessonData(file) {
  const s = fs.readFileSync(path.join(APP, file), "utf8");
  const m = /\n  const LESSON = (\{.*?\n  \});\n/s.exec(s);
  if (!m) throw new Error(file + ": no LESSON block");
  return JSON.parse(m[1]);
}

/* the same tables the page carries, for playing a step correctly */
const MIX = { "blue+red": "purple", "red+yellow": "orange", "blue+yellow": "green", "black+white": "grey" };
const TINT = { red: "pink", yellow: "light yellow", blue: "light blue", orange: "light orange", purple: "light purple", green: "light green", white: "white", black: "grey" };
const SHADE = { red: "dark red", yellow: "dark yellow", blue: "dark blue", orange: "dark orange", purple: "dark purple", green: "dark green", black: "black", white: "grey" };
const mixOf = (a, b) => a === b ? a : (MIX[[a, b].sort().join("+")] || (a === "white" || b === "white" ? TINT[a === "white" ? b : a] : (a === "black" || b === "black" ? SHADE[a === "black" ? b : a] : null)));
const TEXTURE = { rice: "bumpy", flour: "thick", sugar: "gritty", water: "runny", sand: "rough", glue: "shiny" };
const period = (seq) => { for (let p = 1; p <= 4; p++) if (seq.length >= 2 * p && seq.every((v, i) => v === seq[i % p])) return p; return null; };

/* ---- the players, one per kind ---------------------------------------- */
async function stroke(page, cv, pts) {
  /* mouse events land in viewport coordinates and do not scroll, so bring
     the paper on screen first - at 375px it sits below the fold */
  await cv.scrollIntoViewIfNeeded(); await sleep(150);
  const box = await cv.boundingBox();
  const at = (p) => [box.x + p[0] / 320 * box.width, box.y + p[1] / 220 * box.height];
  const [x0, y0] = at(pts[0]);
  await page.mouse.move(x0, y0); await page.mouse.down();
  for (const p of pts.slice(1)) { const [x, y] = at(p); await page.mouse.move(x, y, { steps: 2 }); }
  await page.mouse.up();
}
const SHAPES = {
  straight: () => Array.from({ length: 12 }, (_, k) => [40 + k * 20, 110]),
  long: () => Array.from({ length: 15 }, (_, k) => [15 + k * 20.5, 100]),
  short: () => [[100, 100], [110, 102], [120, 104], [130, 106]],
  wavy: () => Array.from({ length: 49 }, (_, k) => [40 + k * 5, 110 + Math.sin(k / 4) * 32]),
  zigzag: () => [[30, 60], [60, 160], [90, 60], [120, 160], [150, 60], [180, 160], [210, 60], [240, 160]],
  round: () => Array.from({ length: 41 }, (_, k) => { const a = k / 40 * Math.PI * 2; return [160 + Math.cos(a) * 55, 110 + Math.sin(a) * 55]; }),
  thick: () => Array.from({ length: 10 }, (_, k) => [60 + k * 20, 120]),
  thin: () => Array.from({ length: 10 }, (_, k) => [60 + k * 20, 120]),
};

const PLAY = {
  overview: async () => {},
  world: async () => {},
  /* with a video the child watches (or presses I watched it); the transcript
     is behind a <details>, so it is opened and played through too, which is
     what proves the recorded Listen lines play */
  lecture: async (page, st, n, d) => {
    if (d.video) { await page.click("#stage" + n + " .lec-read summary"); await sleep(200); }
    for (let k = 0; k < d.parts.length; k++) { await page.click("#stage" + n + "lnext"); await sleep(200); }
    if (d.video) { const w = page.locator("#stage" + n + "lwatched"); if (await w.count()) { await w.click(); await sleep(200); } }
  },
  words: async (page, st, n, d) => {
    for (let k = 0; k < d.items.length; k++) { await page.click('#stage' + n + 'wg .wordcard[data-k="' + k + '"]'); await sleep(150); }
    await page.click("#stage" + n + "wgo"); await sleep(300);
    for (let k = 0; k < d.items.length; k++) { await page.click('#ch' + n + ' .wordbtn[data-ok="1"]'); await sleep(2600); }
  },
  explore: async (page, st, n, d) => {
    const need = Math.min(d.need || d.items.length, d.items.length);
    for (let k = 0; k < need; k++) { await page.click('#stage' + n + ' .tapcard[data-k="' + k + '"]'); await sleep(120); }
    if (d.then) { await sleep(2700); await page.click('#ch' + n + ' .choice[data-ok="1"]'); await sleep(2900); }
    else await sleep(300);
  },
  sort: async (page, st, n, d) => {
    for (let k = 0; k < d.items.length; k++) {
      const label = (await page.textContent("#stage" + n + " .sortnow .lab")).trim();
      const it = d.items.find((x) => x.label === label);
      if (!it) throw new Error("sort: no item " + label);
      await page.click('#stage' + n + ' .bin[data-b="' + it.bin + '"]'); await sleep(2300);
    }
  },
  order: async (page, st, n, d) => { for (let k = 0; k < d.items.length; k++) { await page.click('#stage' + n + ' .tapcard[data-k="' + k + '"]'); await sleep(320); } await sleep(2400); },
  tone: async (page, st, n, d) => PLAY.order(page, st, n, d),
  demo: async (page, st, n, d) => { for (let k = 0; k < d.frames.length - 1; k++) { await page.click("#stage" + n + "next"); await sleep(250); } await sleep(2800); },
  source: async (page, st, n, d) => {
    const need = Math.min(d.need || d.spots.length, d.spots.length);
    for (let k = 0; k < need; k++) { await page.locator('#stage' + n + ' [data-spot="' + d.spots[k].id + '"]').click(); await sleep(200); }
    await sleep(2800); await page.click('#ch' + n + ' .choice[data-ok="1"]'); await sleep(2900);
  },
  mix: async (page, st, n, d) => {
    for (const rd of d.rounds) {
      await page.click('#ch' + n + ' .choice[data-c="' + mixOf(rd.a, rd.b) + '"]'); await sleep(300);
      await page.click('#stage' + n + ' .pot[data-p="' + rd.a + '"]'); await sleep(350);
      await page.click('#stage' + n + ' .pot[data-p="' + rd.b + '"]'); await sleep(4500);
    }
    await page.click('#stage' + n + ' .pot[data-p="' + d.pots[0].id + '"]'); await sleep(350);
    await page.click('#stage' + n + ' .pot[data-p="' + d.pots[1].id + '"]'); await sleep(700);
    await page.click("#stage" + n + "done"); await sleep(300);
  },
  marks: async (page, st, n, d) => {
    if (KEYBOARD) {
      const key = async (sel) => { await page.focus(sel); await page.keyboard.press("Enter"); };
      for (const [k, rd] of d.rounds.entries()) {
        await key("#stage" + n + ' [data-alt]'); await sleep(300);
        const focused = await page.evaluate(() => (document.activeElement && document.activeElement.className) || "");
        if (!/markopt/.test(focused)) throw new Error("Choose the mark did not move focus to the marks (" + focused + ")");
        if (k === 0) {   /* a wrong pick first, once: it must say so and leave the round open */
          const wrong = await page.locator("#stage" + n + ' .markopt[data-w]:not([data-w="' + rd.want + '"])').first().getAttribute("data-w");
          await key("#stage" + n + ' .markopt[data-w="' + wrong + '"]'); await sleep(500);
          const fb = (await page.textContent("#fb" + n)).trim();
          if (!/^That is /.test(fb)) throw new Error("a wrong mark by keyboard said " + JSON.stringify(fb));
        }
        await key("#stage" + n + ' .markopt[data-w="' + rd.want + '"]');
        await sleep(rd.want === "dots" ? 2000 : 1400);
        const fb = (await page.textContent("#fb" + n)).trim();
        if (!/That is /.test(fb) || /Look for/.test(fb)) throw new Error("round " + (k + 1) + " (" + rd.want + ") by keyboard ended on " + JSON.stringify(fb));
        await sleep(3200);
      }
      await key("#stage" + n + ' .markopt[data-stamp="round"]'); await sleep(1500);
      await key("#stage" + n + "stick"); await sleep(300);
      return;
    }
    for (const rd of d.rounds) {
      await page.click('#stage' + n + ' .toolbtn[data-t="' + rd.tool + '"]'); await sleep(200);
      const cv = page.locator("#stage" + n + "cv");
      if (rd.want === "dots") { for (let k = 0; k < 7; k++) { await stroke(page, cv, [[60 + k * 30, 100]]); await sleep(120); } }
      else await stroke(page, cv, SHAPES[rd.want]());
      await sleep(3300);
    }
    await stroke(page, page.locator("#stage" + n + "cv"), SHAPES.wavy()); await sleep(300);
    await page.click("#stage" + n + "stick"); await sleep(300);
  },
  pattern: async (page, st, n, d) => {
    for (const rd of d.rounds) {
      const p = period(rd.seq);
      for (let j = 0; j < rd.ask_n; j++) { await page.click('#stage' + n + ' .palbtn[data-t="' + rd.seq[(rd.show + j) % p] + '"]'); await sleep(350); }
      await sleep(2600);
    }
    for (let j = 0; j < (d.ownMin || 6); j++) { await page.click('#stage' + n + ' .palbtn[data-t="' + d.tiles[j % 2].id + '"]'); await sleep(200); }
    await page.click("#stage" + n + "check"); await sleep(4200);
  },
  choose: async (page, st, n, d) => {
    for (const rd of d.rounds) { const m = d.materials.find((x) => (x.props || []).includes(rd.needs)); await page.click('#stage' + n + ' [data-m="' + m.id + '"]'); await sleep(4100); }
  },
  experiment: async (page, st, n, d) => {
    for (const rd of d.rounds) {
      await page.click('#ch' + n + ' .choice'); await sleep(300);
      await page.click("#stage" + n + "add"); await sleep(400);
      await page.click('#ch' + n + ' .choice[data-t="' + TEXTURE[rd.additive] + '"]'); await sleep(4900);
    }
  },
  compare: async (page, st, n, d) => {
    for (let k = 0; k < d.cards.length; k++) {
      const t = (await page.textContent("#stage" + n + " .sortnow .lab")).trim();
      const c = d.cards.find((x) => x.t === t); if (!c) throw new Error("compare: no card " + t);
      const ia = d.a.features.includes(c.about), ib = d.b.features.includes(c.about);
      await page.click('#stage' + n + ' .bin[data-b="' + (ia && ib ? "both" : "one") + '"]'); await sleep(2700);
    }
    await page.click('#ch' + n + ' .choice'); await sleep(3500);
  },
  comment: async (page, st, n, d) => {
    for (const rd of d.rounds) { const w = d.works.find((x) => x.id === rd.work); const o = rd.opts.find((x) => w.features.includes(x.about)); await page.click('#ch' + n + ' .choice[data-about="' + o.about + '"]'); await sleep(3900); }
  },
  refine: async (page, st, n, d) => {
    for (const rd of d.rounds) { const c = rd.changes.find((x) => x.effect === rd.needs); await page.click('#stage' + n + ' [data-c="' + c.id + '"]'); await sleep(4300); }
  },
  journal: async (page, st, n, d) => {
    const cards = await page.locator("#stage" + n + " .journalcard[data-k]").count();
    for (let k = 0; k < cards; k++) { await page.click('#stage' + n + ' .journalcard[data-k="' + k + '"]'); await sleep(350); }
    if (cards) await sleep(2700);
    await page.click('#stage' + n + ' .journalcard[data-j="0"]'); await sleep(400);
    await page.click('#ch' + n + ' .choice'); await sleep(3700);
    /* the stop card: drawn at the end of exactly the journal that carries it */
    const card = await page.locator("#stage" + n + " .pausecard").count();
    if (card !== (d.pause ? 1 : 0)) throw new Error("the journal drew " + card + " stop cards, the data asks for " + (d.pause ? 1 : 0));
    if (d.pause) {
      await page.click("#stage" + n + " .pausecard [data-go]"); await sleep(300);
      const at = await page.evaluate(() => [...document.querySelectorAll(".slide")].findIndex((x) => x.classList.contains("active")));
      if (at !== n) throw new Error("Keep going opened slide " + (at + 1) + ", not the next step " + (n + 1));
    }
  },
  questions: async (page, st, n, d) => { for (let k = 0; k < d.items.length; k++) { await page.click('#ch' + n + ' .choice[data-ok="1"]'); await sleep(2900); } },
  quiz: async (page, st, n, d) => PLAY.questions(page, st, n, d),
  home: async (page, st, n) => { await page.click("#stage" + n + "hfin"); await sleep(200); },
  resources: async (page, st, n) => { await page.click('#stage' + n + ' [data-res="words"]'); await sleep(300); await page.click(".res-reader .book-close"); await sleep(200); },
  games: async (page, st, n, d) => {
    const need = Math.min(d.mastery || 2, d.games.length);
    for (let g = 0; g < need; g++) {
      const game = d.games[g];
      await page.click('#stage' + n + ' [data-game="' + g + '"]'); await sleep(400);
      const ov = page.locator(".game-overlay");
      for (const round of game.rounds) {
        if (game.type === "choice") { await ov.locator("#gameCh .choice").filter({ hasText: rx(round.answer) }).first().click(); await sleep(1300); }
        else if (game.type === "spelling") {
          for (const ch of String(round.answer).replace(/[^A-Za-z]/g, "").split("")) {
            await ov.locator("#gameTiles [data-tile]:not([disabled])").filter({ hasText: rx(ch) }).first().click(); await sleep(120);
          }
          await ov.locator("#gameCheck").click(); await sleep(1300);
        } else {
          for (const pr of round.pairs) {
            /* a tile's text is its "?" back plus its face, so match the face alone -
               and a `has` locator must be page-rooted, or it matches nothing */
            await ov.locator("#gameGrid .pairtile:not(.matched)").filter({ has: page.locator(".face", { hasText: rx(pr[0]) }) }).first().click(); await sleep(120);
            await ov.locator("#gameGrid .pairtile:not(.matched)").filter({ has: page.locator(".face", { hasText: rx(pr[1]) }) }).first().click(); await sleep(250);
          }
          await sleep(1300);
        }
      }
      await ov.locator("#gameOut").click(); await sleep(300);
    }
  },
};

async function drive(browser, file, base) {
  const t0 = Date.now();
  const data = lessonData(file);
  const ctx = await browser.newContext({ viewport: { width: WIDTH, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  page.on("console", (m) => { if (m.type() === "error" && !PLATFORM_404.test(m.text()) && !PLATFORM_404.test((m.location() || {}).url || "")) errors.push("console: " + m.text() + " @ " + ((m.location() || {}).url || "")); });
  /* Playwright's Chromium ships without H.264/AAC, so it aborts the lecture
     video's request; that is this browser, not the page (playback is checked
     in Edge - see the kit README). Any other failed request is a finding. */
  page.on("requestfailed", (r) => { if (PLATFORM_404.test(r.url())) return; if (/\/media\/lecture\/[^/]+\.mp4$/.test(r.url()) && /ABORTED/.test((r.failure() || {}).errorText || "")) return; /* a recorded clip cut off by the next line (a child moving on mid-sentence) is aborted by design */ if (/\/media\/tts\/[0-9a-f]+\.mp3$/.test(r.url()) && /ABORTED/.test((r.failure() || {}).errorText || "")) return; errors.push("request: " + r.url() + " " + ((r.failure() || {}).errorText || "")); });
  await page.goto(base + file + "?from=" + cfg.fromParam, { waitUntil: "load" });
  await sleep(600);
  const steps = data.steps;
  /* a renderer that throws during the draw pass leaves no dot rail, and the
     click that follows would time out saying nothing about why */
  const dots = await page.locator("#dots button").count();
  if (dots !== steps.length + 1) { const e = new Error("the page painted " + dots + " dots for " + (steps.length + 1) + " slides"); e.pageErrors = errors.slice(); await ctx.close(); throw e; }
  const goTo = (i) => page.evaluate((k) => { document.querySelector('#dots button[data-i="' + k + '"]').click(); }, i);
  let overflow = [];
  for (let i = 0; i < steps.length; i++) {
    const st = steps[i], n = i + 1;
    await goTo(i); await sleep(250);
    if (WIDTH <= 480) {
      const wide = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
      if (wide) overflow.push(n);
    }
    if (TRACE) { try { await page.click(".slide.active .explain", { timeout: 3000 }); await sleep(150); } catch (_) { /* a step with no Explain */ } }
    const play = PLAY[st.kind];
    if (!play) throw new Error("no player for kind " + st.kind);
    try { await play(page, st, n, st.data); }
    catch (e) { errors.push("step " + n + " (" + st.kind + "): " + e.message.split("\n")[0]); }
  }
  await goTo(steps.length); await sleep(400);
  const got = await page.locator("#stickers .sticker.got").count();
  const shelf = (await page.textContent("#fbstick")).trim();
  const pct = (await page.textContent("#ehPct")).trim();
  const doneDots = await page.locator("#dots button.done").count();
  const narration = TRACE ? await page.evaluate(() => window.__artNarrationLog || []) : [];
  await ctx.close();
  const ok = got === steps.length && /Every sticker/.test(shelf) && pct === "100%" && errors.length === 0 && overflow.length === 0;
  return { file, ok, got, steps: steps.length, shelf, pct, doneDots, errors, overflow, narration, secs: Math.round((Date.now() - t0) / 1000) };
}

/* ---- the things that are not a lesson step ------------------------------ */
async function extras(browser, base) {
  const out = [];
  const pdfPages = (buf) => (buf.toString("latin1").match(/\/Type\s*\/Page(?!s)/g) || []).length;
  const newPage = async () => { const ctx = await browser.newContext({ viewport: { width: WIDTH, height: 900 } }); const page = await ctx.newPage(); const errs = []; page.on("pageerror", (e) => errs.push(e.message)); return { ctx, page, errs }; };

  /* 1. Stop for today, at the end of Lesson 1's journal */
  {
    const file = cfg.lessons[0].file, data = lessonData(file);
    const j = data.steps.findIndex((x) => x.kind === "journal" && x.data.pause);
    const { ctx, page, errs } = await newPage();
    await page.goto(base + file + "?from=" + cfg.fromParam, { waitUntil: "load" }); await sleep(600);
    await page.evaluate((k) => document.querySelector('#dots button[data-i="' + k + '"]').click(), j); await sleep(300);
    await PLAY.journal(page, data.steps[j], j + 1, Object.assign({}, data.steps[j].data, { pause: false })).catch(() => {});
    const stop = page.locator("#stage" + (j + 1) + " .pausecard [data-stop]");
    let msg = "";
    if (!(await stop.count())) msg = "no Stop for today on the journal";
    else {
      /* The progress module is not served by the preview (it is deployed
         beside the pages), so what is measured is the hook every navigation
         reports the resume place through - the deck's show() calls
         window.__ehelAt(cur), and the progress block turns that into
         `resume`. Recorded in sessionStorage so it survives leaving. */
      await page.evaluate(() => { window.__ehelAt = (i) => sessionStorage.setItem("__ehelAtLast", String(i)); });
      await Promise.all([page.waitForURL(/\/index\.html/, { timeout: 5000 }).catch(() => null), stop.click()]);
      const url = page.url();
      const last = await page.evaluate(() => sessionStorage.getItem("__ehelAtLast"));
      if (!/\/index\.html/.test(url)) msg = "Stop for today stayed on " + url;
      else if (last !== String(j + 1)) msg = "the place reported last is step " + (Number(last) + 1) + ", not the next step " + (j + 2);
    }
    out.push({ what: "stop for today", ok: !msg && !errs.length, note: msg || "left for the hub, resume kept at the next step", errs });
    await ctx.close();
  }

  /* 2. every lesson's make-at-home sheet, printed */
  {
    const counts = [];
    let msg = "";
    for (const l of cfg.lessons) {
      const data = lessonData(l.file);
      const h = data.steps.findIndex((x) => x.kind === "home");
      const { ctx, page, errs } = await newPage();
      await page.goto(base + l.file + "?from=" + cfg.fromParam, { waitUntil: "load" }); await sleep(500);
      await page.evaluate(() => { window.print = () => {}; });
      await page.evaluate((k) => document.querySelector('#dots button[data-i="' + k + '"]').click(), h); await sleep(250);
      await page.click("#stage" + (h + 1) + "hprint"); await sleep(200);
      await page.emulateMedia({ media: "print" });
      const seen = await page.evaluate(() => ({ cls: document.body.classList.contains("printing-home"), wrap: getComputedStyle(document.querySelector(".wrap")).display,
        sheet: getComputedStyle(document.getElementById("printsheet")).display, projects: document.querySelectorAll("#printsheet .ps-proj").length, h1: (document.querySelector("#printsheet h1") || {}).textContent || "" }));
      const pdf = await page.pdf({ format: "A4", preferCSSPageSize: true });
      const pages = pdfPages(pdf);
      counts.push(pages);
      const want = data.steps[h].data.items.length;
      if (!seen.cls || seen.wrap !== "none" || seen.sheet !== "block") msg = msg || l.file + ": the lesson shows through the print (" + JSON.stringify(seen) + ")";
      else if (seen.projects !== want || seen.h1.indexOf(data.title) < 0) msg = msg || l.file + ": the sheet has " + seen.projects + " of " + want + " projects, heading " + JSON.stringify(seen.h1);
      else if (pages < 1 || pages > 2) msg = msg || l.file + ": the sheet printed on " + pages + " pages";
      if (errs.length) msg = msg || l.file + ": " + errs[0];
      await ctx.close();
    }
    out.push({ what: "make-at-home sheets", ok: !msg, note: msg || "all " + counts.length + " print alone, on " + [...new Set(counts)].sort().join(" or ") + " A4 page(s): " + counts.join(","), errs: [] });
  }

  /* 3. the starting check, all right then all wrong, and the hub's card */
  if (cfg.startingCheck) {
    const sc = cfg.startingCheck;
    const exam = JSON.parse(fs.readFileSync(path.resolve(APP, sc.data), "utf8"));
    const { ctx, page, errs } = await newPage();
    let msg = "";
    await page.goto(base + sc.file + "?from=" + cfg.fromParam, { waitUntil: "load" }); await sleep(600);
    /* the page has no header bar to tame the lesson eyebrow, which is how it
       first ran past the screen edge at phone width */
    const wideAt = async (what) => { if (WIDTH <= 480 && await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)) msg = msg || "horizontal overflow on the " + what; };
    await wideAt("intro");
    const run = async (right) => {
      await page.click("#stage1go"); await sleep(300);
      for (const q of [...exam.questions].sort((a, b) => a.sequence - b.sequence)) {
        const opts = q.options.split("|").map((x) => x.trim());
        const pick = right ? q.correctAnswer : opts.find((o) => o !== q.correctAnswer);
        await page.click('#ch1 .rc-opt[data-t="' + pick.replace(/"/g, '\\"') + '"]'); await sleep(3000);
      }
      await sleep(300);
      return { band: (await page.textContent("#stage1 .rc-band")).trim(), links: await page.$$eval("#stage1 .rc-rev a", (as) => as.map((a) => a.getAttribute("href"))) };
    };
    const good = await run(true);
    await wideAt("report");
    if (good.band !== exam.banding.ready.label) msg = "all right gave " + JSON.stringify(good.band);
    const stored = await page.evaluate((c) => JSON.parse(localStorage.getItem("ehel-art-starting-check:" + c + ":local") || "null"), cfg.courseKey);
    if (!msg && (!stored || stored.band !== "ready" || stored.percent !== 100)) msg = "the result kept on the device is " + JSON.stringify(stored);
    await page.click("#stage1again"); await sleep(300);
    const bad = await run(false);
    if (!msg && bad.band !== exam.banding.notReady.label) msg = "all wrong gave " + JSON.stringify(bad.band);
    const files = new Set(cfg.lessons.map((l) => l.file));
    if (!msg && (!bad.links.length || !bad.links.every((h) => files.has(h.split("?")[0]) && /[?&]from=/.test(h)))) msg = "the review links are " + JSON.stringify(bad.links);
    await page.goto(base + cfg.hub + "?from=" + cfg.fromParam, { waitUntil: "load" }); await sleep(400);
    const meta = ((await page.textContent("#rcMeta").catch(() => "")) || "").trim();
    if (!msg && meta !== "Done: " + exam.banding.notReady.label) msg = "the hub's card says " + JSON.stringify(meta);
    out.push({ what: "starting check", ok: !msg && !errs.length, note: msg || "ready when all right, not ready when all wrong, " + bad.links.length + " review links, the hub shows the result", errs });
    await ctx.close();
  }
  return out;
}

async function main() {
  const server = spawn(process.execPath, [path.join(REPO, "tools", "serve-src-preview.js")], { env: { ...process.env, PORT: String(PORT) }, stdio: "ignore" });
  const base = "http://127.0.0.1:" + PORT + "/" + rel + "/";
  let up = false;
  for (let k = 0; k < 40 && !up; k++) { try { const r = await fetch(base + cfg.hub); up = r.ok; } catch (_) { await sleep(250); } }
  if (!up) { console.error("the preview server did not come up on " + PORT); server.kill(); process.exit(2); }
  const browser = await chromium.launch();
  const files = cfg.lessons.map((l) => l.file).filter((f, k) => !ONLY || String(k + 1) === ONLY);
  console.log("\n  Driving " + files.length + " lesson(s) of " + cfg.subjectLabel + " " + cfg.gradeLabel + " at " + WIDTH + "px, " + PAR + " at a time\n");
  const results = [];
  let next = 0;
  const worker = async () => { while (next < files.length) { const f = files[next++]; try { results.push(await drive(browser, f, base)); } catch (e) { results.push({ file: f, ok: false, errors: ["driver: " + e.message.split("\n")[0]].concat(e.pageErrors || []), secs: 0 }); } } };
  await Promise.all(Array.from({ length: Math.min(PAR, files.length) }, worker));
  const extra = ONLY ? [] : await extras(browser, base).catch((e) => [{ what: "extras", ok: false, note: e.message.split("\n")[0], errs: [] }]);
  await browser.close(); server.kill();
  results.sort((a, b) => files.indexOf(a.file) - files.indexOf(b.file));
  let bad = 0;
  for (const r of results) {
    if (!r.ok) bad++;
    console.log("  " + (r.ok ? "ok  " : "FAIL") + " " + r.file.padEnd(28) + (r.steps ? r.got + "/" + r.steps + " stickers  " + r.pct + "  " : "") + r.secs + "s" + (r.overflow && r.overflow.length ? "  overflow at steps " + r.overflow.join(",") : ""));
    for (const e of r.errors || []) console.log("       " + e);
  }
  for (const x of extra) {
    if (!x.ok) bad++;
    console.log("  " + (x.ok ? "ok  " : "FAIL") + " " + x.what.padEnd(28) + x.note);
    for (const e of x.errs || []) console.log("       pageerror: " + e);
  }
  if (TRACE) {
    const sentences = new Set(); let calls = 0, covered = 0;
    const byLesson = {};
    for (const r of results) {
      let c = 0, k = 0;
      for (const e of r.narration || []) { calls++; c++; if (e.ok) { covered++; k++; } for (const x of e.s) sentences.add(x); }
      byLesson[r.file] = { lines: c, recorded: k };
    }
    fs.writeFileSync(TRACE, JSON.stringify({ width: WIDTH, lines: calls, recorded: covered, byLesson, sentences: [...sentences].sort() }, null, 1) + "\n");
    console.log("\n  narration: " + calls + " spoken lines, " + covered + " (" + (calls ? Math.round(covered * 100 / calls) : 0) + "%) fully recorded; " + sentences.size + " distinct sentences -> " + TRACE);
  }
  console.log(bad ? "\n  " + bad + " lesson(s) or check(s) did not finish clean\n" : "\n  every lesson ended at 100% with every sticker, no console errors" + (WIDTH <= 480 ? ", no horizontal overflow" : "") + (KEYBOARD ? "; the marks were played by keyboard" : "; the marks were drawn with the mouse") + "\n");
  process.exitCode = bad ? 1 : 0;
}
main().catch((e) => { console.error(e); process.exitCode = 2; });
