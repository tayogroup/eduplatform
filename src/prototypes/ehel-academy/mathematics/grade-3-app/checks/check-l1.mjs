import { chromium } from "playwright";
import { pathToFileURL } from "url";
import { residualErrors, notImported } from "./_platform-modules.mjs";
import path from "path";
import { fileURLToPath } from "url";
/* the lessons sit one level up from checks/ - resolve against THIS file so the
   checker works from anywhere, not only when the shell happens to be cd'd into
   the lesson directory */
const L = (f) => path.join(path.dirname(fileURLToPath(import.meta.url)), "..", f);
const SLIDES = 14;   // the split changed the deck size; kept explicit so a wrong one is a finding
const LESSON = "up-to-a-thousand.html";

const ONESW = ["zero","one","two","three","four","five","six","seven","eight","nine","ten","eleven","twelve","thirteen","fourteen","fifteen","sixteen","seventeen","eighteen","nineteen"];
const TENSW = ["","","twenty","thirty","forty","fifty","sixty","seventy","eighty","ninety"];
function words(n){ if(n<20) return ONESW[n]; if(n<100){const t=Math.floor(n/10),o=n%10;return TENSW[t]+(o?"-"+ONESW[o]:"");} const h=Math.floor(n/100),r=n%100; return ONESW[h]+" hundred"+(r?" and "+words(r):""); }
const cap = (s)=>s.charAt(0).toUpperCase()+s.slice(1);

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1100, height: 900 } });
const errors = [];
p.on("pageerror", (e) => errors.push("PAGEERROR " + e.message));
p.on("console", (m) => { if (m.type() === "error") errors.push("CONSOLE " + m.text()); });
await p.goto(pathToFileURL(L(LESSON)).href);
// silence speech so rounds are not gated on audio
await p.evaluate(() => { try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch (e) {} });

const bad = [];
const info = await p.evaluate(() => ({
  slides: document.querySelectorAll(".slide").length,
  dots: document.querySelectorAll("#dots button").length,
  heads: [...document.querySelectorAll(".slide-head h2")].map((h) => h.textContent),
  explains: [...document.querySelectorAll(".slide")].filter((s) => (s.dataset.explain || "").length > 40).length,
  says: [...document.querySelectorAll(".slide")].filter((s) => (s.dataset.say || "").length > 5).length,
  speakBtns: document.querySelectorAll(".speak").length,
  explainBtns: document.querySelectorAll(".say button.explain").length,
}));
console.log(info);
if (info.slides !== SLIDES) bad.push("slides " + info.slides);
if (info.dots !== SLIDES) bad.push("dots " + info.dots);
if (info.explains !== SLIDES) bad.push("slides with data-explain: " + info.explains);
if (info.says !== SLIDES) bad.push("slides with data-say: " + info.says);
if (info.explainBtns !== SLIDES) bad.push("explain buttons injected: " + info.explainBtns);

// every slide's stage must render something
for (let i = 0; i < SLIDES; i++) {
  await p.click(`#dots button[data-i="${i}"]`);
  const st = await p.evaluate(() => {
    const s = document.querySelector(".slide.active");
    return { id: s.querySelector("h2").textContent, stage: s.querySelector(".stage").innerHTML.trim().length };
  });
  if (st.stage < 20) bad.push(`slide ${i + 1} "${st.id}" stage nearly empty (${st.stage})`);
}

async function go(i) { await p.click(`#dots button[data-i="${i}"]`); }
async function uniqueOpts(id) {
  const opts = await p.evaluate((x) => [...document.querySelectorAll("#" + x + " .choice")].map((c) => c.dataset.v), id);
  if (new Set(opts).size !== opts.length) bad.push(`${id}: duplicate options ${JSON.stringify(opts)}`);
}
async function waitLive(id) {
  await p.waitForFunction((sel) => {
    const el = document.getElementById(sel);
    if (!el || el.dataset.live !== "1") return false;
    const b = el.querySelector(".choice");
    return !!b && !b.disabled;
  }, id, { timeout: 15000 });
}

// ---- slide 1: place value ----
await go(0);
await p.click('#pv1 .pvc:nth-child(1) .pvbtn button:nth-child(2)');
await p.click('#pv1 .pvc:nth-child(2) .pvbtn button:nth-child(2)');
await p.click('#pv1 .pvc:nth-child(3) .pvbtn button:nth-child(2)');
{
  const g = await p.evaluate(() => ({ big: document.getElementById("big1").textContent, worth: document.getElementById("worth1").textContent, blocksH: document.querySelectorAll("#pv1 .blk.h").length }));
  if (g.big !== "111") bad.push("s1 big=" + g.big);
  if (!g.worth.includes("100 + 10 + 1 = 111")) bad.push("s1 worth=" + g.worth);
  if (g.blocksH !== 1) bad.push("s1 hundred blocks=" + g.blocksH);
}

// ---- slide 2: number words (20 rounds, answer must equal words(n)) ----
await go(1);
for (let r = 0; r < 20; r++) {
  const g = await p.evaluate(() => ({ n: Number(document.getElementById("num2").textContent), right: document.getElementById("ch2").dataset.right, opts: [...document.querySelectorAll("#ch2 .choice")].map((c) => c.dataset.v) }));
  const want = cap(words(g.n));
  if (g.right !== want) bad.push(`s2 ${g.n}: right="${g.right}" want "${want}"`);
  if (!g.opts.includes(want)) bad.push(`s2 ${g.n}: correct answer not offered`);
  if (new Set(g.opts).size !== g.opts.length) bad.push(`s2 ${g.n}: duplicate options`);
  await p.click(`#ch2 .choice[data-v="${g.right.replace(/"/g, '\\"')}"]`);
  await waitLive("ch2");
}

// ---- slide 6: counting in steps (each of the six steps) ----
await go(5);
for (let s = 0; s < 6; s++) {
  await p.click(`#step6 button:nth-child(${s + 1})`);
  await p.waitForTimeout(60);
  for (let r = 0; r < 3; r++) {
    const g = await p.evaluate(() => ({
      step: Number(document.querySelector("#step6 button.on").dataset.v),
      seq: [...document.querySelectorAll("#seq6 span:not(.gap)")].map((x) => Number(x.textContent)),
      right: Number(document.getElementById("ch6").dataset.right),
      opts: [...document.querySelectorAll("#ch6 .choice")].map((c) => Number(c.dataset.v)),
    }));
    if (g.seq.length !== 3) bad.push("s6 seq len " + g.seq.length);
    const d1 = g.seq[1] - g.seq[0], d2 = g.seq[2] - g.seq[1];
    if (d1 !== g.step || d2 !== g.step) bad.push(`s6 step ${g.step}: sequence ${g.seq} not constant`);
    if (g.right !== g.seq[2] + g.step) bad.push(`s6 step ${g.step}: right ${g.right} want ${g.seq[2] + g.step}`);
    if (!g.opts.includes(g.right)) bad.push("s6 right not offered");
    if (g.opts.some((v) => v < 0)) bad.push("s6 negative option " + g.opts);
    await p.click(`#ch6 .choice[data-v="${g.right}"]`);
    await waitLive("ch6");
  }
}

// ---- slide 7: odd/even ----
await go(6);
for (let r = 0; r < 12; r++) {
  const g = await p.evaluate(() => ({ n: Number(document.getElementById("num7").textContent), right: document.getElementById("ch7").dataset.right }));
  const want = g.n % 2 === 0 ? "even" : "odd";
  if (g.right !== want) bad.push(`s7 ${g.n} right=${g.right} want ${want}`);
  await p.click(`#ch7 .choice[data-v="${g.right}"]`);
  await waitLive("ch7");
}

// ---- slide 8: comparison ----
await go(7);
for (let r = 0; r < 14; r++) {
  const g = await p.evaluate(() => {
    const nums = [...document.querySelectorAll("#cmp8 span")].map((x) => x.textContent);
    return { a: Number(nums[0]), c: Number(nums[2]), right: document.getElementById("ch8").dataset.right };
  });
  const want = g.a > g.c ? ">" : g.a < g.c ? "<" : "=";
  if (g.right !== want) bad.push(`s8 ${g.a} ? ${g.c} right=${g.right} want ${want}`);
  await p.click(`#ch8 .choice[data-v="${g.right}"]`);
  await waitLive("ch8");
}

// ---- slide 10: rounding ----
await go(9);
for (let r = 0; r < 14; r++) {
  const g = await p.evaluate(() => ({
    say: document.getElementById("say10").textContent,
    n: Number(document.querySelector("#line10 .mark").textContent),
    right: Number(document.getElementById("ch10").dataset.right),
    opts: [...document.querySelectorAll("#ch10 .choice")].map((c) => Number(c.dataset.v)),
  }));
  const to = /nearest 100/.test(g.say) ? 100 : 10;
  const lo = Math.floor(g.n / to) * to, hi = lo + to, mid = lo + to / 2;
  const want = g.n % to === 0 ? g.n : (g.n >= mid ? hi : lo);
  if (g.right !== want) bad.push(`s10 ${g.n} to ${to}: right=${g.right} want ${want}`);
  if (!g.opts.includes(want)) bad.push(`s10 ${g.n}: answer not offered`);
  await p.click(`#ch10 .choice[data-v="${g.right}"]`);
  await waitLive("ch10");
}

// ---- slide 18: the check, answer every question ----
await go(11);
for (let r = 0; r < 12; r++) {
  const live = await p.evaluate(() => document.querySelectorAll("#ch18 .choice").length);
  if (!live) break;
  await uniqueOpts("ch18");
  const right = await p.evaluate(() => document.getElementById("ch18").dataset.right);
  const n = await p.evaluate((v) => document.querySelectorAll(`#ch18 .choice[data-v="${v}"]`).length, right);
  if (n !== 1) { bad.push(`ch18: right answer "${right}" appears ${n} times`); break; }
  await p.click(`#ch18 .choice[data-v="${right.replace(/"/g, '\\"')}"]`);
  await p.waitForTimeout(2100);
}
{
  const g = await p.evaluate(() => ({ fb: document.getElementById("fb18").textContent }));
  if (!/Finished/.test(g.fb)) bad.push("s18 did not finish: " + g.fb);
}

// ---- stickers ----
// the sticker shelf is the LAST slide, and paintStickers() runs only while it
// is showing. Derive its index - a written-down one goes stale the moment a
// step is inserted, and the symptom is a lesson that looks broken.
await go((await p.evaluate(() => document.querySelectorAll(".slide").length)) - 1);
{
  const g = await p.evaluate(() => ({ n: document.querySelectorAll("#stickers .sticker").length, got: document.querySelectorAll("#stickers .sticker.got").length, fb: document.getElementById("fb19").textContent }));
  console.log("stickers:", g);
  if (g.n !== 13) bad.push("stickers " + g.n);
  if (g.got < 5) bad.push("earned only " + g.got + " stickers after answering correctly throughout");
}

// ---- responsive ----
await p.setViewportSize({ width: 375, height: 800 });
const over = await p.evaluate(() => ({
  page: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  slides: [...document.querySelectorAll(".slide")].filter((s) => s.scrollWidth - s.clientWidth > 1).map((s) => s.querySelector("h2").textContent),
}));
console.log("overflow375:", over.page, over.slides);
if (over.page > 0) bad.push("page overflows at 375px by " + over.page);

console.log("bad =", bad);
const missing = notImported(L(LESSON));
if (missing.length) bad.push("page does not import: " + missing.join(", "));
console.log("errors =", residualErrors(errors, L(LESSON)));
await b.close();
