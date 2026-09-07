import { chromium } from "playwright";
import { pathToFileURL } from "url";
import path from "path";
import { residualErrors, notImported } from "../checks/_platform-modules.mjs";

import fs from "fs";
import { fileURLToPath } from "url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const L = (f) => path.join(HERE, "..", f);
const G1 = (f) => path.join(HERE, "..", "..", "grade-1-app", f);

/* Grade 3's five lessons carry the step and are always checked.

   The Grade 1 five are a different matter. The step was built and verified
   against copies downloaded from the CDN, and the REPO copies are ahead of
   those by a template-alignment block that was never deployed - so the step
   has deliberately not been applied here, and applying it belongs to whoever
   owns that lane. This checker therefore looks, says plainly what it found,
   and never counts a missing step as a pass: an absent Grade 1 half is
   reported as NOT CHECKED, which is neither green nor a finding. */
const G3_LESSONS = [
  [L("up-to-a-thousand.html"), 20],
  [L("rows-and-rules.html"), 14],
  [L("equal-parts.html"), 12],
  [L("sides-sizes-seconds.html"), 20],
  [L("ask-count-chart.html"), 13],
];
const G1_LESSONS = [
  [G1("up-to-twenty.html"), 32],
  [G1("what-comes-next.html"), 17],
  [G1("halves-and-wholes.html"), 11],
  [G1("shapes-and-sizes.html"), 17],
  [G1("asking-and-sorting.html"), 14],
];
const g1Landed = G1_LESSONS.filter(([f]) => fs.existsSync(f) && /id="clW"/.test(fs.readFileSync(f, "utf8")));
const LESSONS = G3_LESSONS.concat(g1Landed);
if (g1Landed.length === 0) {
  console.log("Grade 1: the step is not on the repo copies - NOT CHECKED (see the README).");
} else if (g1Landed.length !== G1_LESSONS.length) {
  console.log(`Grade 1: ${g1Landed.length} of ${G1_LESSONS.length} carry the step - the rest are NOT CHECKED.`);
}
const CHEERS = /^(Yes!|Well done!|Super!|That.s it!|Brilliant!)/;

const b = await chromium.launch();
const bad = [];
let totalItems = 0;

async function state(p) {
  return p.evaluate(() => ({
    claim: document.getElementById("clW").textContent,
    opts: [...document.querySelectorAll("#chW .choice")].map((c) => ({ v: c.dataset.v, txt: c.textContent, dis: c.disabled })),
    say: document.getElementById("sayW").textContent,
  }));
}
async function settled(p) {
  await p.waitForFunction(() => {
    const c = document.querySelectorAll("#chW .choice");
    return c.length === 3 && ![...c].some((x) => x.disabled);
  }, null, { timeout: 12000 });
}

for (const [file, want] of LESSONS) {
  const name = path.basename(file);
  const ctx = await b.newContext({ viewport: { width: 1200, height: 1000 } });
  const p = await ctx.newPage();
  const errors = [];
  p.on("pageerror", (e) => errors.push(String(e)));
  p.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  await p.goto(pathToFileURL(path.resolve(file)).href);

  const shape = await p.evaluate(() => {
    const slides = [...document.querySelectorAll(".slide")];
    const host = document.getElementById("clW");
    const mine = host ? host.closest(".slide") : null;
    return {
      n: slides.length,
      idx: mine ? slides.indexOf(mine) : -1,
      penultimate: mine ? slides.indexOf(mine) === slides.length - 2 : false,
      head: mine ? mine.querySelector("h2").textContent : null,
      explain: mine ? (mine.dataset.explain || "").length : 0,
      dots: document.querySelectorAll("#dots button").length,
      speak: mine ? mine.querySelectorAll(".speak").length : 0,
      live: mine ? mine.querySelectorAll("[aria-live]").length : 0,
    };
  });
  if (shape.n !== want) bad.push(`${name}: ${shape.n} slides, want ${want}`);
  if (shape.idx < 0) { bad.push(`${name}: the step is not there at all`); await ctx.close(); continue; }
  if (!shape.penultimate) bad.push(`${name}: sits at ${shape.idx}, not immediately before the sticker shelf`);
  if (shape.head !== "How do you know?") bad.push(`${name}: heading is "${shape.head}"`);
  if (shape.explain < 200) bad.push(`${name}: no narration script`);
  if (shape.dots !== shape.n) bad.push(`${name}: ${shape.dots} dots for ${shape.n} slides`);
  if (shape.speak !== 1) bad.push(`${name}: ${shape.speak} speak buttons on the step`);
  if (shape.live < 2) bad.push(`${name}: feedback not announced (only ${shape.live} live regions)`);

  await p.click(`#dots button[data-i="${shape.idx}"]`);
  await settled(p);

  const answer = new Map();   // claim -> the reason the page marks right
  let rightSeen = 0, wrongSeen = 0;

  // pass one: click a different option each time, and check the page marks it honestly
  for (let r = 0; r < 18; r++) {
    const g = await state(p);
    if (g.opts.length !== 3) { bad.push(`${name}: ${g.opts.length} reasons offered, want 3`); break; }
    if (new Set(g.opts.map((o) => o.v)).size !== 3) bad.push(`${name}: duplicate reasons for "${g.claim.slice(0, 40)}"`);
    if (g.claim.length < 10) bad.push(`${name}: claim too short: "${g.claim}"`);
    if (!g.say.startsWith(g.claim)) bad.push(`${name}: spoken line does not carry the claim`);
    g.opts.forEach((o) => { if (o.txt.trim() !== o.v) bad.push(`${name}: option text and value differ`); });

    const pick = g.opts[r % 3].v;
    await p.click(`#chW .choice[data-v="${pick.replace(/"/g, '\\"')}"]`);
    const after = await p.evaluate(() => ({
      right: [...document.querySelectorAll("#chW .choice.right")].map((c) => c.dataset.v),
      wrong: [...document.querySelectorAll("#chW .choice.wrong")].map((c) => c.dataset.v),
      fb: document.getElementById("fbW").textContent,
      sc: document.getElementById("scW").textContent,
      allDisabled: [...document.querySelectorAll("#chW .choice")].every((c) => c.disabled),
    }));
    if (after.right.length !== 1) bad.push(`${name}: ${after.right.length} reasons marked right for "${g.claim.slice(0, 40)}"`);
    if (!after.allDisabled) bad.push(`${name}: options still live after answering`);
    if (after.fb.length < 25) bad.push(`${name}: feedback too thin: "${after.fb}"`);

    const correct = after.right[0];
    if (answer.has(g.claim) && answer.get(g.claim) !== correct) bad.push(`${name}: "${g.claim.slice(0, 30)}" changed its right answer between rounds`);
    answer.set(g.claim, correct);

    if (pick === correct) {
      rightSeen++;
      if (!CHEERS.test(after.fb)) bad.push(`${name}: right answer not praised: "${after.fb.slice(0, 50)}"`);
      if (after.wrong.length) bad.push(`${name}: a right answer also marked wrong`);
    } else {
      wrongSeen++;
      if (CHEERS.test(after.fb)) bad.push(`${name}: wrong answer praised: "${after.fb.slice(0, 50)}"`);
      if (!after.wrong.includes(pick)) bad.push(`${name}: wrong pick not marked wrong`);
    }
    const m = after.sc.match(/^(\d+) right out of (\d+)/);
    if (!m) bad.push(`${name}: score line unreadable: "${after.sc}"`);
    else if (Number(m[1]) !== rightSeen || Number(m[2]) !== r + 1) bad.push(`${name}: score says ${after.sc} after ${r + 1} rounds with ${rightSeen} right`);
    await settled(p);
  }
  totalItems += answer.size;
  if (answer.size < 6) bad.push(`${name}: only ${answer.size} distinct claims in 18 rounds`);
  if (rightSeen === 0 || wrongSeen === 0) bad.push(`${name}: never exercised both outcomes (${rightSeen} right, ${wrongSeen} wrong)`);

  // the step must be able to earn its sticker
  for (let r = 0; r < 8; r++) {
    const g = await state(p);
    const correct = answer.get(g.claim);
    if (!correct) { await p.click(`#chW .choice[data-v="${g.opts[0].v.replace(/"/g, '\\"')}"]`); await settled(p); continue; }
    await p.click(`#chW .choice[data-v="${correct.replace(/"/g, '\\"')}"]`);
    await settled(p);
  }
  const earned = await p.evaluate((i) => {
    const before = document.querySelectorAll("#dots button");
    before[before.length - 1].click();
    // paintDots() replaces #dots wholesale, so the list has to be read again
    const after = document.querySelectorAll("#dots button");
    return {
      lit: after[i].classList.contains("done"),
      stickers: document.querySelectorAll("#stickers .sticker").length,
      got: document.querySelectorAll("#stickers .sticker.got").length,
      slides: document.querySelectorAll(".slide").length,
    };
  }, shape.idx);
  if (!earned.lit) bad.push(`${name}: the step never registered as finished`);
  if (earned.stickers !== earned.slides - 1) bad.push(`${name}: ${earned.stickers} stickers for ${earned.slides} slides (want ${earned.slides - 1})`);
  if (earned.got < 1) bad.push(`${name}: no sticker earned`);

  const missing = /grade-3-app/.test(file) ? notImported(file) : [];
  if (missing.length) bad.push(`${name}: page does not import: ${missing.join(", ")}`);
  const real = residualErrors(errors, file);
  if (real.length) bad.push(`${name}: ${real.join("; ")}`);
  await ctx.close();
}

console.log(`distinct claims exercised across the ${LESSONS.length} lesson(s) checked:`, totalItems);
console.log("bad =", bad);
await b.close();
