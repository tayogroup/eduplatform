import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { residualErrors, notImported } from "./_platform-modules.mjs";

/* Every lesson, over HTTP, walked slide by slide.
 *
 * This exists because of the 2026-09-07 split. Not one teaching step was
 * rewritten, but each one moved file, so the risks the split introduced are
 * exactly the ones a per-step maths assertion does NOT cover:
 *
 *   - a step reporting the wrong finish() index, so the wrong sticker lights
 *   - a helper left behind in the other half (SHAPES, SOLIDS and `two` are all
 *     defined inside step blocks and used by check questions), which is a
 *     ReferenceError at runtime and invisible to any static read
 *   - a check question bank that no longer matches its lesson
 *   - the newly authored check questions simply being wrong
 *
 * OVER HTTP, NOT file://. The pages import four platform modules, and an ES
 * module import is impossible from a file:// page whatever is on disk - so a
 * file:// run cannot see a ReferenceError thrown by module code at all. Serve
 * src/ first (tools/serve-src-preview.js, port 4287) and stage the modules
 * (node checks/stage-local-modules.mjs).
 *
 * It answers the check step with the page's OWN dataset.right, which is
 * deliberately weaker than the bespoke checkers: it proves the step runs, scores
 * and completes, not that the maths is right. The per-step arithmetic is
 * check-l*.mjs's job.
 */
const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = path.resolve(HERE, "..");
const BASE = process.env.G3_BASE || "http://localhost:4287/prototypes/ehel-academy/mathematics/grade-3-app/";
const cfg = JSON.parse(fs.readFileSync(path.join(APP, "app.config.json"), "utf8"));

const b = await chromium.launch();
const bad = [];

for (const [unit, lesson] of cfg.lessons.entries()) {
  const ctx = await b.newContext({ viewport: { width: 1200, height: 1000 } });
  const p = await ctx.newPage();
  const errors = [];
  p.on("pageerror", (e) => errors.push("PAGEERROR " + e.message));
  p.on("console", (m) => { if (m.type() === "error") errors.push("CONSOLE " + m.text()); });

  const res = await p.goto(BASE + lesson.file);
  if (!res || !res.ok()) { bad.push(`${lesson.file}: ${res ? res.status() : "no response"} - is the server running?`); await ctx.close(); continue; }

  const missing = notImported(path.join(APP, lesson.file));
  if (missing.length) bad.push(`${lesson.file}: does not import ${missing.join(", ")}`);

  const shape = await p.evaluate(() => ({
    slides: document.querySelectorAll(".slide").length,
    dots: document.querySelectorAll("#dots button").length,
    stickers: document.querySelectorAll("#stickers .sticker").length,
    heads: [...document.querySelectorAll(".slide-head h2")].map((h) => h.textContent),
  }));
  if (shape.dots !== shape.slides) bad.push(`${lesson.file}: ${shape.dots} dots for ${shape.slides} slides`);
  /* the sticker count is NOT read here: paintStickers() runs only while the
     shelf is the active slide, so counting on load reports 0 for every lesson.
     It is asserted at the shelf, below. */
  if (shape.heads.at(-2) !== "How do you know?") bad.push(`${lesson.file}: the Convincing step is not second from last`);

  // every slide draws something
  for (let i = 0; i < shape.slides; i++) {
    await p.click(`#dots button[data-i="${i}"]`);
    const st = await p.evaluate(() => {
      const s = document.querySelector(".slide.active");
      return { h: s.querySelector("h2").textContent, n: s.querySelector(".stage") ? s.querySelector(".stage").innerHTML.trim().length : 0 };
    });
    if (st.n < 20) bad.push(`${lesson.file} slide ${i + 1} "${st.h}": nearly empty (${st.n})`);
  }

  /* The check step: answer with whatever the page marks right and confirm it
     scores, finishes, and lights its own sticker. A bank whose helper was left
     in the other lesson throws here rather than quietly asking nothing. */
  const checkIdx = shape.slides - 3;
  await p.click(`#dots button[data-i="${checkIdx}"]`);
  const chId = await p.evaluate(() => { const el = document.querySelector(".slide.active .choices"); return el ? el.id : null; });
  if (!chId) { bad.push(`${lesson.file}: no choices on the check step`); }
  else {
    let asked = 0;
    for (let r = 0; r < 24; r++) {
      const right = await p.evaluate((id) => { const el = document.getElementById(id); return el && el.children.length ? el.dataset.right : null; }, chId);
      if (right === null) break;
      const clicked = await p.evaluate(([id, v]) => {
        const btn = [...document.getElementById(id).querySelectorAll(".choice")].find((x) => x.dataset.v === String(v));
        if (btn) btn.click();
        return !!btn;
      }, [chId, right]);
      if (!clicked) { bad.push(`${lesson.file}: the check offers no option matching its own right answer "${right}"`); break; }
      asked++;
      await p.waitForTimeout(2150);
    }
    if (asked < 3) bad.push(`${lesson.file}: the check only asked ${asked} question(s)`);
    /* the check slide carries TWO .fb elements - the QUESTION (q17) and the
       feedback (fb17) - and querySelector(".fb") returns the question. Worse,
       finishing clears the question to "", so reading it looked exactly like a
       check that never ran. Ask for the feedback by id. */
    const fb = await p.evaluate(() => {
      const s = document.querySelector(".slide.active");
      const el = s.querySelector('[id^="fb"]');
      return el ? el.textContent : "";
    });
    if (!/Finished/.test(fb)) bad.push(`${lesson.file}: the check did not finish - "${fb.slice(0, 60)}"`);
  }

  const shelf = await p.evaluate((n) => {
    document.querySelector(`#dots button[data-i="${n - 1}"]`).click();
    const after = document.querySelectorAll("#dots button");
    return { lit: [...after].filter((x) => x.classList.contains("done")).length, got: document.querySelectorAll("#stickers .sticker.got").length, stickers: document.querySelectorAll("#stickers .sticker").length };
  }, shape.slides);
  if (shelf.got < 1) bad.push(`${lesson.file}: finishing the check earned no sticker`);
  if (shelf.stickers !== shape.slides - 1) bad.push(`${lesson.file}: ${shelf.stickers} stickers for ${shape.slides} slides`);

  const real = residualErrors(errors, path.join(APP, lesson.file));
  if (real.length) bad.push(`${lesson.file}: ${real.slice(0, 3).join("; ")}`);

  console.log(`  unit ${unit + 1}  ${lesson.file.padEnd(26)} ${shape.slides} slides, ${shelf.stickers} stickers, ${shelf.got} earned`);
  await ctx.close();
}

console.log("\nbad =", bad);
await b.close();
process.exitCode = bad.length ? 1 : 0;
