import { chromium } from "playwright";
import { pathToFileURL } from "url";
import { residualErrors, notImported } from "./_platform-modules.mjs";
import path from "path";
import { fileURLToPath } from "url";
/* the lessons sit one level up from checks/ - resolve against THIS file so the
   checker works from anywhere, not only when the shell happens to be cd'd into
   the lesson directory */
const L = (f) => path.join(path.dirname(fileURLToPath(import.meta.url)), "..", f);
const LESSON = "equal-parts.html";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1100, height: 950 } });
const errors = [];
p.on("pageerror", (e) => errors.push("PAGEERROR " + e.message));
p.on("console", (m) => { if (m.type() === "error") errors.push("CONSOLE " + m.text()); });
await p.goto(pathToFileURL(L(LESSON)).href);
const bad = [];
async function go(i) { await p.click(`#dots button[data-i="${i}"]`); }
async function waitLive(id) {
  await p.waitForFunction((s) => { const el = document.getElementById(s); if (!el || el.dataset.live !== "1") return false; const c = el.querySelector(".choice"); return !!c && !c.disabled; }, id, { timeout: 15000 });
}
async function answer(id) {
  const g = await p.evaluate((s) => { const el = document.getElementById(s); return { right: el.dataset.right, opts: [...el.querySelectorAll(".choice")].map((c) => c.dataset.v) }; }, id);
  if (new Set(g.opts).size !== g.opts.length) bad.push(`${id}: duplicate options ${JSON.stringify(g.opts)}`);
  if (!g.opts.includes(g.right)) { bad.push(`${id}: right "${g.right}" not offered among ${JSON.stringify(g.opts)}`); return null; }
  await p.click(`#${id} .choice[data-v="${g.right.replace(/"/g, '\\"')}"]`);
  return g.right;
}

const info = await p.evaluate(() => ({
  slides: document.querySelectorAll(".slide").length,
  explains: [...document.querySelectorAll(".slide")].filter((s) => (s.dataset.explain || "").length > 40).length,
  explainBtns: document.querySelectorAll(".say button.explain").length,
}));
console.log(info);
if (info.slides !== 12) bad.push("slides " + info.slides);
if (info.explains !== 12) bad.push("explains " + info.explains);
if (info.explainBtns !== 12) bad.push("explain buttons " + info.explainBtns);
for (let i = 0; i < 12; i++) {
  await go(i);
  const st = await p.evaluate(() => { const s = document.querySelector(".slide.active"); return { h: s.querySelector("h2").textContent, n: s.querySelector(".stage").innerHTML.trim().length }; });
  if (st.n < 20) bad.push(`slide ${i + 1} "${st.h}" empty`);
}

// 1 equal parts
await go(0);
for (let r = 0; r < 8; r++) {
  const g = await p.evaluate(() => [...document.querySelectorAll("#sh1 .fcard")].map((c) => ({ eq: c.dataset.eq, n: c.querySelectorAll("path").length })));
  if (g.filter((c) => c.eq === "1").length !== 1) bad.push("s1 not exactly one equal card: " + JSON.stringify(g));
  if (new Set(g.map((c) => c.n)).size !== 1) bad.push("s1 cards have different piece counts " + JSON.stringify(g.map((c) => c.n)));
  await p.click('#sh1 .fcard[data-eq="1"]');
  await p.waitForTimeout(2100);
}

// 2 bar: shading must match the printed fraction, and a full bar must say one whole
await go(1);
for (const d of [2, 3, 4, 5, 10]) {
  await p.click(`#den2 button[data-v="${d}"]`);
  const cells = await p.evaluate(() => document.querySelectorAll("#bar2 i").length);
  if (cells !== d) bad.push(`s2 chose ${d} but ${cells} pieces drawn`);
  for (let k = 1; k <= d; k++) {
    await p.click("#bar2");
    const g = await p.evaluate(() => ({ on: document.querySelectorAll("#bar2 i.on").length, num: Number(document.querySelector("#show2 .num").textContent), den: Number(document.querySelector("#show2 .den").textContent) }));
    if (g.on !== k) bad.push(`s2 d=${d} tapped ${k} but ${g.on} shaded`);
    if (g.num !== k || g.den !== d) bad.push(`s2 shows ${g.num}/${g.den} want ${k}/${d}`);
  }
  const whole = await p.evaluate(() => document.getElementById("show2").textContent);
  if (!/1 whole/.test(whole)) bad.push(`s2 filling all ${d} did not report one whole`);
}

// 3 same fraction, different shape
await go(2);
for (let r = 0; r < 5; r++) {
  const cards = await p.evaluate(() => [...document.querySelectorAll("#sh3 .fcard")].map((c) => ({ m: c.dataset.m, parts: c.querySelectorAll("path").length, on: c.querySelectorAll("path.on").length })));
  if (cards.filter((c) => c.m === "1").length !== 3) bad.push("s3 not exactly 3 matching cards");
  const uniq = new Set(cards.filter((c) => c.m === "1").map((c) => c.on + "/" + c.parts));
  if (uniq.size !== 1) bad.push("s3 matching cards disagree: " + [...uniq].join(","));
  cards.filter((c) => c.m === "0").forEach((c) => { if (uniq.has(c.on + "/" + c.parts)) bad.push("s3 a non-match shows the same fraction " + c.on + "/" + c.parts); });
  for (let k = 0; k < 3; k++) await p.click('#sh3 .fcard[data-m="1"]:not([data-spent])');
  await p.waitForTimeout(2700);
}

// 4 fraction of a set
await go(3);
for (let r = 0; r < 10; r++) {
  const g = await p.evaluate(() => ({
    num: Number(document.querySelector("#say4 .num").textContent),
    den: Number(document.querySelector("#say4 .den").textContent),
    say: document.getElementById("say4").textContent,
    total: document.querySelectorAll("#set4 i").length,
    on: document.querySelectorAll("#set4 i.on").length,
    right: Number(document.getElementById("ch4").dataset.right),
  }));
  if (g.total % g.den !== 0) bad.push(`s4 ${g.total} not divisible by ${g.den}`);
  const want = (g.total / g.den) * g.num;
  if (g.right !== want) bad.push(`s4 ${g.num}/${g.den} of ${g.total}: right=${g.right} want ${want}`);
  if (g.on !== want) bad.push(`s4 shaded ${g.on} want ${want}`);
  await answer("ch4"); await waitLive("ch4");
}

// 5 fraction as division
await go(4);
for (let r = 0; r < 8; r++) {
  const g = await p.evaluate(() => ({ n: Number(document.querySelector("#q5 .num").textContent), d: Number(document.querySelector("#q5 .den").textContent), right: document.getElementById("ch5").dataset.right }));
  if (g.right !== `${g.n} ÷ ${g.d}`) bad.push(`s5 ${g.n}/${g.d} right="${g.right}"`);
  if (![[1, 2], [1, 4], [3, 4]].some((x) => x[0] === g.n && x[1] === g.d)) bad.push(`s5 ${g.n}/${g.d} is outside 3Nf.04 (half, quarter, three-quarters)`);
  await answer("ch5"); await waitLive("ch5");
}

// 6 fraction as operator
await go(5);
for (let r = 0; r < 12; r++) {
  const g = await p.evaluate(() => ({ n: Number(document.querySelector("#q6 .num").textContent), d: Number(document.querySelector("#q6 .den").textContent), q: document.getElementById("q6").textContent, right: Number(document.getElementById("ch6").dataset.right) }));
  const tot = Number(g.q.match(/of\s*(\d+)/)[1]);
  if (tot % g.d !== 0) bad.push(`s6 ${tot} not divisible by ${g.d}`);
  const want = (tot / g.d) * g.n;
  if (g.right !== want) bad.push(`s6 ${g.n}/${g.d} of ${tot}: right=${g.right} want ${want}`);
  if (![[1, 2], [1, 4], [3, 4], [1, 3], [1, 10]].some((x) => x[0] === g.n && x[1] === g.d)) bad.push(`s6 ${g.n}/${g.d} is outside 3Nf.05`);
  await answer("ch6"); await waitLive("ch6");
}

// 7 equivalence: both bars must shade the same proportion
await go(6);
for (let r = 0; r < 12; r++) {
  const g = await p.evaluate(() => ({
    a: { n: document.querySelectorAll("#barA7 i.on").length, d: document.querySelectorAll("#barA7 i").length },
    b: { n: document.querySelectorAll("#barB7 i.on").length, d: document.querySelectorAll("#barB7 i").length },
    right: document.getElementById("ch7").dataset.right,
  }));
  const STAGE3 = [2, 3, 4, 5, 10];
  if (!STAGE3.includes(g.a.d) || !STAGE3.includes(g.b.d)) bad.push(`s7 denominator outside Stage 3: ${g.a.d} / ${g.b.d}`);
  if (Math.abs(g.a.n / g.a.d - g.b.n / g.b.d) > 1e-9) bad.push(`s7 bars are not equivalent: ${g.a.n}/${g.a.d} vs ${g.b.n}/${g.b.d}`);
  if (g.right !== `${g.b.n}/${g.b.d}`) bad.push(`s7 right="${g.right}" but bar B shows ${g.b.n}/${g.b.d}`);
  await answer("ch7"); await waitLive("ch7");
}

// 8 add / subtract within one whole
await go(7);
for (let r = 0; r < 12; r++) {
  const g = await p.evaluate(() => {
    const f = [...document.querySelectorAll("#q8 .frac")].map((x) => ({ n: Number(x.querySelector(".num").textContent), d: Number(x.querySelector(".den").textContent) }));
    return { q: document.getElementById("q8").textContent, f, right: document.getElementById("ch8").dataset.right, cells: document.querySelectorAll("#bar8 i").length };
  });
  const adding = g.q.indexOf("+") >= 0;
  const A = g.f[0], B = g.f[1];
  if (A.d !== B.d) bad.push(`s8 different denominators ${A.d} and ${B.d}`);
  const want = adding ? A.n + B.n : A.n - B.n;
  if (want < 0 || want > A.d) bad.push(`s8 result ${want}/${A.d} falls outside one whole`);
  if (g.right !== `${want}/${A.d}`) bad.push(`s8 right="${g.right}" want ${want}/${A.d}`);
  if (g.cells !== A.d) bad.push(`s8 bar has ${g.cells} pieces, want ${A.d}`);
  await answer("ch8"); await waitLive("ch8");
}

// 9 compare AND order (3Nf.08 names both)
await go(8);
const seenMode = new Set();
for (let r = 0; r < 20; r++) {
  const isOrder = await p.evaluate(() => document.getElementById("ord9").style.display !== "none");
  if (isOrder) {
    seenMode.add("order");
    const o = await p.evaluate(() => ({
      rows: [...document.querySelectorAll("#ord9 .frac")].map((x) => [Number(x.querySelector(".num").textContent), Number(x.querySelector(".den").textContent)]),
      bars: [...document.querySelectorAll("#ord9 .fbar")].map((bb) => [bb.querySelectorAll("i.on").length, bb.querySelectorAll("i").length]),
      right: document.getElementById("ch9").dataset.right,
    }));
    if (o.rows.length !== 3) bad.push("s9 order mode shows " + o.rows.length + " fractions");
    o.rows.forEach((f, i) => { if (o.bars[i][0] !== f[0] || o.bars[i][1] !== f[1]) bad.push(`s9 order bar ${i} is ${o.bars[i]} not ${f}`); });
    const asc = o.rows.slice().sort((a, bb) => a[0] / a[1] - bb[0] / bb[1]).map((f) => f[0] + "/" + f[1]).join(" < ");
    if (o.right !== asc) bad.push(`s9 order: right="${o.right}" want "${asc}"`);
    const dens = new Set(o.rows.map((f) => f[1])), nums = new Set(o.rows.map((f) => f[0]));
    if (!(dens.size === 1 || (nums.size === 1 && [...nums][0] === 1))) bad.push("s9 order set is neither same-denominator nor unit fractions: " + JSON.stringify(o.rows));
    await answer("ch9"); await waitLive("ch9");
    continue;
  }
  seenMode.add("compare");
  const g = await p.evaluate(() => {
    const f = [...document.querySelectorAll("#cmp9 .frac")].map((x) => ({ n: Number(x.querySelector(".num").textContent), d: Number(x.querySelector(".den").textContent) }));
    return { f, right: document.getElementById("ch9").dataset.right, A: { n: document.querySelectorAll("#cmpA9 i.on").length, d: document.querySelectorAll("#cmpA9 i").length }, B: { n: document.querySelectorAll("#cmpB9 i.on").length, d: document.querySelectorAll("#cmpB9 i").length } };
  });
  const A = g.f[0], B = g.f[1];
  const v1 = A.n / A.d, v2 = B.n / B.d;
  const want = v1 > v2 ? ">" : v1 < v2 ? "<" : "=";
  if (g.right !== want) bad.push(`s9 ${A.n}/${A.d} ? ${B.n}/${B.d}: right="${g.right}" want "${want}"`);
  if (g.A.n !== A.n || g.A.d !== A.d) bad.push(`s9 bar A shows ${g.A.n}/${g.A.d} not ${A.n}/${A.d}`);
  if (g.B.n !== B.n || g.B.d !== B.d) bad.push(`s9 bar B shows ${g.B.n}/${g.B.d} not ${B.n}/${B.d}`);
  if (!(A.d === B.d || (A.n === 1 && B.n === 1))) bad.push(`s9 outside 3Nf.08 (unit fractions or same denominator): ${A.n}/${A.d} vs ${B.n}/${B.d}`);
  await answer("ch9"); await waitLive("ch9");
}

if (seenMode.size !== 2) bad.push("s9 3Nf.08 asks to compare AND order; only saw: " + [...seenMode].join(","));

// 10 check
await go(9);
for (let r = 0; r < 12; r++) {
  const n = await p.evaluate(() => document.querySelectorAll("#ch10 .choice").length);
  if (!n) break;
  await answer("ch10");
  await p.waitForTimeout(2200);
}
{
  const fb = await p.evaluate(() => document.getElementById("fb10").textContent);
  if (!/Finished/.test(fb)) bad.push("s10 did not finish: " + fb);
}

// the sticker shelf is the LAST slide, and paintStickers() runs only while it
// is showing. Derive its index - a written-down one goes stale the moment a
// step is inserted, and the symptom is a lesson that looks broken.
await go((await p.evaluate(() => document.querySelectorAll(".slide").length)) - 1);
{
  const g = await p.evaluate(() => ({ n: document.querySelectorAll("#stickers .sticker").length, got: document.querySelectorAll("#stickers .sticker.got").length }));
  console.log("stickers:", g);
  if (g.n !== 11) bad.push("stickers " + g.n);
  if (g.got < 8) bad.push("only " + g.got + " stickers earned");
}

await p.setViewportSize({ width: 375, height: 800 });
const over = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
console.log("overflow375:", over);
if (over > 0) bad.push("overflows 375px by " + over);
console.log("bad =", bad);
const missing = notImported(L(LESSON));
if (missing.length) bad.push("page does not import: " + missing.join(", "));
console.log("errors =", residualErrors(errors, L(LESSON)));
await b.close();
