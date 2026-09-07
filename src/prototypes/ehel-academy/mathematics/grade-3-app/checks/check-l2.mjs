import { chromium } from "playwright";
import { pathToFileURL } from "url";
import { residualErrors, notImported } from "./_platform-modules.mjs";
import path from "path";
import { fileURLToPath } from "url";
/* the lessons sit one level up from checks/ - resolve against THIS file so the
   checker works from anywhere, not only when the shell happens to be cd'd into
   the lesson directory */
const L = (f) => path.join(path.dirname(fileURLToPath(import.meta.url)), "..", f);
const SLIDES = 9;   // the split changed the deck size; kept explicit so a wrong one is a finding
const LESSON = "adding-and-money.html";

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

// ---- slide 12: complements ----
await go(0);
for (let r = 0; r < 12; r++) {
  const g = await p.evaluate(() => ({ sum: document.getElementById("bar12").querySelector(".sum").textContent, right: Number(document.getElementById("ch12").dataset.right) }));
  const m = g.sum.match(/(\d+)\s*\+\s*\?\s*=\s*(\d+)/);
  if (!m) { bad.push("s12 unreadable: " + g.sum); break; }
  const want = Number(m[2]) - Number(m[1]);
  if (g.right !== want) bad.push(`s12 ${g.sum}: right=${g.right} want ${want}`);
  await p.click(`#ch12 .choice[data-v="${g.right}"]`);
  await waitLive("ch12");
}

// ---- slide 17: change ----
await go(5);
for (let r = 0; r < 10; r++) {
  const g = await p.evaluate(() => {
    const tags = [...document.querySelectorAll("#shop17 .tag b")].map((x) => x.textContent.replace("sh ", ""));
    return { price: Number(tags[0]), paid: Number(tags[1]), right: document.getElementById("ch17").dataset.right };
  });
  const want = (Math.round((g.paid - g.price) * 100) / 100).toFixed(2);
  if (g.right !== want) bad.push(`s17 ${g.price}/${g.paid}: right=${g.right} want ${want}`);
  if (g.paid < g.price) bad.push(`s17 paid less than price`);
  await p.click(`#ch17 .choice[data-v="${g.right}"]`);
  await waitLive("ch17");
}

// ---- slide 18: the check, answer every question ----
await go(6);
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
  if (g.n !== 8) bad.push("stickers " + g.n);
  if (g.got < 2) bad.push("earned only " + g.got + " stickers after answering correctly throughout");
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
