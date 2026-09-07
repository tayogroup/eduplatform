import { chromium } from "playwright";
import { pathToFileURL } from "url";
import { residualErrors, notImported } from "./_platform-modules.mjs";
import path from "path";
import { fileURLToPath } from "url";
/* the lessons sit one level up from checks/ - resolve against THIS file so the
   checker works from anywhere, not only when the shell happens to be cd'd into
   the lesson directory */
const L = (f) => path.join(path.dirname(fileURLToPath(import.meta.url)), "..", f);
const LESSON = "rows-and-rules.html";

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1100, height: 900 } });
const errors = [];
p.on("pageerror", (e) => errors.push("PAGEERROR " + e.message));
p.on("console", (m) => { if (m.type() === "error") errors.push("CONSOLE " + m.text()); });
await p.goto(pathToFileURL(L(LESSON)).href);

const bad = [];
async function go(i) { await p.click(`#dots button[data-i="${i}"]`); }
async function waitLive(id) {
  await p.waitForFunction((sel) => {
    const el = document.getElementById(sel);
    if (!el || el.dataset.live !== "1") return false;
    const b = el.querySelector(".choice");
    return !!b && !b.disabled;
  }, id, { timeout: 15000 });
}
async function answer(id) {
  const right = await p.evaluate((s) => document.getElementById(s).dataset.right, id);
  const n = await p.evaluate((a) => document.querySelectorAll(`#${a[0]} .choice[data-v="${a[1]}"]`).length, [id, right]);
  if (n !== 1) { bad.push(`${id}: correct answer "${right}" appears ${n} times among the options`); return null; }
  await p.click(`#${id} .choice[data-v="${right.replace(/"/g, '\\"')}"]`);
  return right;
}

const info = await p.evaluate(() => ({
  slides: document.querySelectorAll(".slide").length,
  dots: document.querySelectorAll("#dots button").length,
  heads: [...document.querySelectorAll(".slide-head h2")].map((h) => h.textContent),
  explains: [...document.querySelectorAll(".slide")].filter((s) => (s.dataset.explain || "").length > 40).length,
  explainBtns: document.querySelectorAll(".say button.explain").length,
}));
console.log(info);
if (info.slides !== 14) bad.push("slides " + info.slides);
if (info.explains !== 14) bad.push("data-explain on " + info.explains);
if (info.explainBtns !== 14) bad.push("explain buttons " + info.explainBtns);

for (let i = 0; i < 14; i++) {
  await go(i);
  const st = await p.evaluate(() => { const s = document.querySelector(".slide.active"); return { h: s.querySelector("h2").textContent, n: s.querySelector(".stage").innerHTML.trim().length }; });
  if (st.n < 20) bad.push(`slide ${i + 1} "${st.h}" empty`);
}

// 1 arrays: dot count must equal rows x cols
await go(0);
for (const act of ["r1", "c1", "r1", "c-1", "r-1", "c1"]) {
  await p.click(`#ctl1 button[data-a="${act}"]`);
  const g = await p.evaluate(() => ({ dots: document.querySelectorAll("#arr1 i").length, lab: document.getElementById("lab1").textContent, tot: Number(document.querySelector("#lab1 b").textContent), cols: getComputedStyle(document.getElementById("arr1")).gridTemplateColumns.split(" ").length }));
  const m = g.lab.match(/^(\d+) × (\d+)/);
  if (!m) { bad.push("s1 label " + g.lab); break; }
  const [r, c, t] = [Number(m[1]), Number(m[2]), g.tot];
  if (r * c !== t) bad.push(`s1 ${r}x${c} labelled ${t}`);
  if (g.dots !== t) bad.push(`s1 ${t} claimed but ${g.dots} dots drawn`);
  if (g.cols !== c) bad.push(`s1 ${c} columns claimed but grid has ${g.cols}`);
}

// 2 commutative: total preserved by turning
await go(1);
for (let r = 0; r < 6; r++) {
  const before = await p.evaluate(() => ({ dots: document.querySelectorAll("#arr2 i").length, lab: document.getElementById("lab2").textContent, tot: Number(document.querySelector("#lab2 b").textContent) }));
  await p.click("#turn2");
  const after = await p.evaluate(() => ({ dots: document.querySelectorAll("#arr2 i").length, lab: document.getElementById("lab2").textContent, tot: Number(document.querySelector("#lab2 b").textContent), fb: document.getElementById("fb2").textContent }));
  const t1 = before.tot, t2 = after.tot;
  if (t1 !== t2) bad.push(`s2 turning changed the total ${t1} -> ${t2}`);
  if (after.dots !== t2) bad.push(`s2 ${t2} claimed but ${after.dots} dots`);
  const d1 = before.lab.match(/^(\d+) × (\d+)/), d2 = after.lab.match(/^(\d+) × (\d+)/);
  if (d1[1] !== d2[2] || d1[2] !== d2[1]) bad.push(`s2 not a true turn: ${before.lab} -> ${after.lab}`);
  await p.click("#new2");
}

// 3 tables
await go(2);
for (let r = 0; r < 14; r++) {
  const g = await p.evaluate(() => ({ q: document.getElementById("q3").textContent, right: Number(document.getElementById("ch3").dataset.right) }));
  const m = g.q.match(/(\d+) × (\d+)/);
  if (Number(m[1]) * Number(m[2]) !== g.right) bad.push(`s3 ${g.q} right=${g.right}`);
  await answer("ch3"); await waitLive("ch3");
}

// 4 fact family: every true sentence must be arithmetically true
await go(3);
for (let r = 0; r < 3; r++) {
  const say = await p.evaluate(() => document.getElementById("say4").textContent);
  const m = say.match(/(\d+) × (\d+)/);
  const a = Number(m[1]), bb = Number(m[2]), prod = a * bb;
  const dotsN = await p.evaluate(() => document.querySelectorAll("#arr4 i").length);
  if (dotsN !== prod) bad.push(`s4 ${a}x${bb} drew ${dotsN} dots`);
  // click the four true ones
  for (let k = 0; k < 8; k++) {
    const cards = await p.evaluate(() => [...document.querySelectorAll("#fam4 div")].map((d) => ({ t: d.dataset.t, on: d.classList.contains("on"), spent: !!d.dataset.spent })));
    const target = cards.find((c) => !c.on && !c.spent && isTrue(c.t, a, bb, prod));
    if (!target) break;
    await p.click(`#fam4 div[data-t="${target.t}"]`);
  }
  const done4 = await p.evaluate(() => document.querySelectorAll("#fam4 div.on").length);
  if (done4 !== 4) bad.push(`s4 only ${done4} true sentences found for ${a}x${bb}`);
  await p.waitForTimeout(2600);
}
function isTrue(t, a, b, p2) {
  let m = t.match(/^(\d+) × (\d+) = (\d+)$/);
  if (m) return Number(m[1]) * Number(m[2]) === Number(m[3]);
  m = t.match(/^(\d+) ÷ (\d+) = (\d+)$/);
  if (m) return Number(m[2]) !== 0 && Number(m[1]) / Number(m[2]) === Number(m[3]);
  m = t.match(/^(\d+) \+ (\d+) = (\d+)$/);
  if (m) return Number(m[1]) + Number(m[2]) === Number(m[3]);
  return false;
}

// 5 distributive
await go(4);
for (let r = 0; r < 10; r++) {
  const g = await p.evaluate(() => ({ q: document.getElementById("q5").textContent, sp: document.getElementById("sp5").textContent, right: Number(document.getElementById("ch5").dataset.right) }));
  const m = g.q.match(/(\d+) × (\d+)/);
  const n = Number(m[1]), mm = Number(m[2]);
  if (n * mm !== g.right) bad.push(`s5 ${g.q} right=${g.right}`);
  const t = Math.floor(n / 10) * 10, o = n % 10;
  if (!g.sp.includes(`${t} × ${mm} = ${t * mm}`) || !g.sp.includes(`${o} × ${mm} = ${o * mm}`)) bad.push(`s5 split panel wrong for ${n}x${mm}: ${g.sp}`);
  await answer("ch5"); await waitLive("ch5");
}

// 6 estimate then multiply
await go(5);
for (let r = 0; r < 8; r++) {
  const g = await p.evaluate(() => ({ q: document.getElementById("q6").textContent, est: document.getElementById("est6").textContent, right: Number(document.getElementById("ch6").dataset.right) }));
  const m = g.q.match(/(\d+) × (\d+)/);
  const n = Number(m[1]), mm = Number(m[2]);
  if (n * mm !== g.right) bad.push(`s6 ${g.q} right=${g.right}`);
  const near = Math.round(n / 10) * 10;
  if (!g.est.includes(`${near} × ${mm} = ${near * mm}`)) bad.push(`s6 estimate line wrong: ${g.est}`);
  await answer("ch6"); await waitLive("ch6");
}

// 7 sharing: total = groups*each + remainder, and remainder < groups
await go(6);
for (let r = 0; r < 10; r++) {
  const g = await p.evaluate(() => ({
    q: document.getElementById("q7").textContent,
    say: document.getElementById("say7").textContent,
    groups: document.querySelectorAll("#sb7 .grp").length,
    per: [...document.querySelectorAll("#sb7 .grp")].map((d) => d.querySelectorAll("i").length),
    left: document.querySelectorAll("#lo7 i").length,
    right: Number(document.getElementById("ch7").dataset.right),
  }));
  const m = g.q.match(/(\d+) ÷ (\d+)/);
  const total = Number(m[1]), gs = Number(m[2]);
  if (!/expect about/.test(g.say)) bad.push("s7 no estimate offered before dividing (3Ni.09): " + g.say);
  if (g.groups !== gs) bad.push(`s7 ${g.q}: ${g.groups} groups drawn`);
  if (new Set(g.per).size !== 1) bad.push(`s7 unequal groups ${g.per}`);
  if (g.per[0] !== g.right) bad.push(`s7 drew ${g.per[0]} each but right=${g.right}`);
  if (gs * g.per[0] + g.left !== total) bad.push(`s7 ${gs}x${g.per[0]}+${g.left} != ${total}`);
  if (g.left >= gs) bad.push(`s7 remainder ${g.left} not smaller than ${gs} groups`);
  await answer("ch7"); await waitLive("ch7");
}

// 8 multiples: the grid must light exactly the multiples
await go(7);
for (const w of [2, 5, 10]) {
  await p.click(`#which8 button[data-v="${w}"]`);
  await p.waitForTimeout(120);
  const cells = await p.evaluate(() => [...document.querySelectorAll("#g8 button")].map((x) => Number(x.dataset.v)));
  const want = cells.filter((v) => v % w === 0);
  for (const v of want) await p.click(`#g8 button[data-v="${v}"]`);
  const g = await p.evaluate(() => ({ on: [...document.querySelectorAll("#g8 button.on")].map((x) => Number(x.dataset.v)), miss: document.querySelectorAll("#g8 button.miss").length, fb: document.getElementById("fb8").textContent }));
  if (g.on.length !== want.length) bad.push(`s8 multiples of ${w}: lit ${g.on.length} want ${want.length}`);
  if (g.on.some((v) => v % w !== 0)) bad.push(`s8 multiples of ${w}: lit a non-multiple`);
  if (g.miss !== 0) bad.push(`s8 multiples of ${w}: ${g.miss} marked wrong though all were multiples`);
  await p.waitForTimeout(2800);
}

// 9 sequence rule
await go(8);
for (let r = 0; r < 10; r++) {
  const g = await p.evaluate(() => ({ seq: [...document.querySelectorAll("#seq9 span:not(.gap)")].map((x) => Number(x.textContent)), right: document.getElementById("ch9").dataset.right }));
  if (g.seq.length !== 4) bad.push("s9 seq len " + g.seq.length);
  const step = g.seq[1] - g.seq[0];
  for (let k = 2; k < g.seq.length; k++) if (g.seq[k] - g.seq[k - 1] !== step) bad.push(`s9 not linear: ${g.seq}`);
  const want = (step > 0 ? "add " : "take away ") + Math.abs(step);
  if (g.right !== want) bad.push(`s9 ${g.seq}: right="${g.right}" want "${want}"`);
  if (g.seq.some((v) => v < 0)) bad.push(`s9 negative term ${g.seq}`);
  await answer("ch9"); await waitLive("ch9");
}

// 10 growing shapes: drawn squares must match the stated counts
const seenDir = new Set();
await go(9);
for (let r = 0; r < 16; r++) {
  const g = await p.evaluate(() => ({
    figs: [...document.querySelectorAll("#sh10 .fig")].map((f) => ({ n: f.querySelectorAll("i").length, cap: f.querySelector(".cap").textContent })),
    right: Number(document.getElementById("ch10").dataset.right),
  }));
  const shown = g.figs.slice(0, 3);
  shown.forEach((f) => { if (String(f.n) !== f.cap) bad.push(`s10 caption ${f.cap} but ${f.n} squares`); });
  const step = shown[1].n - shown[0].n;
  if (shown[2].n - shown[1].n !== step) bad.push(`s10 not constant: ${shown.map((f) => f.n)}`);
  if (g.right !== shown[2].n + step) bad.push(`s10 right=${g.right} want ${shown[2].n + step}`);
  if (g.right < 1) bad.push(`s10 next picture would have ${g.right} squares`);
  seenDir.add(step > 0 ? "grow" : "shrink");
  await answer("ch10"); await waitLive("ch10");
}

if (seenDir.size !== 2) bad.push("s10 3Nc.06 asks for adding AND subtracting a constant; only saw: " + [...seenDir].join(","));

// 11 mystery box: the revealed number must satisfy the sentence
await go(10);
for (let r = 0; r < 10; r++) {
  const before = await p.evaluate(() => document.getElementById("my11").textContent.replace(/\s+/g, " ").trim());
  const right = await answer("ch11");
  const after = await p.evaluate(() => document.getElementById("my11").textContent.replace(/\s+/g, " ").trim());
  const solved = after.replace("?", right).replace(/\s*([+−])\s*/g, " $1 ").replace(/\s+/g, " ").trim();
  const m = solved.match(/^(\d+) ([+−]) (\d+) = (\d+)$/);
  if (!m) bad.push(`s11 unreadable "${solved}" (from "${before}")`);
  else {
    const [x, op, y, z] = [Number(m[1]), m[2], Number(m[3]), Number(m[4])];
    const ok = op === "+" ? x + y === z : x - y === z;
    if (!ok) bad.push(`s11 false sentence: ${solved}`);
    if (op === "−" && x - y < 0) bad.push(`s11 goes below zero: ${solved}`);
  }
  await waitLive("ch11");
}

// 12 check
await go(11);
for (let r = 0; r < 12; r++) {
  const n = await p.evaluate(() => document.querySelectorAll("#ch12 .choice").length);
  if (!n) break;
  await answer("ch12");
  await p.waitForTimeout(2100);
}
{
  const fb = await p.evaluate(() => document.getElementById("fb12").textContent);
  if (!/Finished/.test(fb)) bad.push("s12 did not finish: " + fb);
}

// the sticker shelf is the LAST slide, and paintStickers() runs only while it
// is showing. Derive its index - a written-down one goes stale the moment a
// step is inserted, and the symptom is a lesson that looks broken.
await go((await p.evaluate(() => document.querySelectorAll(".slide").length)) - 1);
{
  const g = await p.evaluate(() => ({ n: document.querySelectorAll("#stickers .sticker").length, got: document.querySelectorAll("#stickers .sticker.got").length }));
  console.log("stickers:", g);
  if (g.n !== 13) bad.push("stickers " + g.n);
  if (g.got < 9) bad.push("only " + g.got + " stickers earned");
}

await p.setViewportSize({ width: 375, height: 800 });
const over = await p.evaluate(() => ({ page: document.documentElement.scrollWidth - document.documentElement.clientWidth }));
console.log("overflow375:", over.page);
if (over.page > 0) bad.push("overflows 375px by " + over.page);

console.log("bad =", bad);
const missing = notImported(L(LESSON));
if (missing.length) bad.push("page does not import: " + missing.join(", "));
console.log("errors =", residualErrors(errors, L(LESSON)));
await b.close();
