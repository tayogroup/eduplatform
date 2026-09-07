import { chromium } from "playwright";
import { pathToFileURL } from "url";
import { residualErrors, notImported } from "./_platform-modules.mjs";
import path from "path";
import { fileURLToPath } from "url";
/* the lessons sit one level up from checks/ - resolve against THIS file so the
   checker works from anywhere, not only when the shell happens to be cd'd into
   the lesson directory */
const L = (f) => path.join(path.dirname(fileURLToPath(import.meta.url)), "..", f);
const LESSON = "sides-sizes-seconds.html";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1100, height: 1000 } });
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
const N = 20;
const info = await p.evaluate(() => ({
  slides: document.querySelectorAll(".slide").length,
  explains: [...document.querySelectorAll(".slide")].filter((s) => (s.dataset.explain || "").length > 40).length,
  explainBtns: document.querySelectorAll(".say button.explain").length,
  ssmlOpen: [...document.querySelectorAll(".slide")].reduce((n, s) => n + ((s.dataset.explain || "").match(/<mstts:express-as/g) || []).length, 0),
  ssmlClose: [...document.querySelectorAll(".slide")].reduce((n, s) => n + ((s.dataset.explain || "").match(/<\/mstts:express-as>/g) || []).length, 0),
}));
console.log(info);
if (info.slides !== N) bad.push("slides " + info.slides);
if (info.explains !== N) bad.push("explains " + info.explains);
if (info.explainBtns !== N) bad.push("explain buttons " + info.explainBtns);
if (info.ssmlOpen !== info.ssmlClose) bad.push(`SSML tags unbalanced: ${info.ssmlOpen} open, ${info.ssmlClose} closed`);
for (let i = 0; i < N; i++) {
  await go(i);
  const st = await p.evaluate(() => { const s = document.querySelector(".slide.active"); return { h: s.querySelector("h2").textContent, n: s.querySelector(".stage").innerHTML.trim().length }; });
  if (st.n < 20) bad.push(`slide ${i + 1} "${st.h}" empty`);
}

// 1 naming shapes: the drawn polygon must have as many points as the name claims
const SIDES = { triangle: 3, quadrilateral: 4, pentagon: 5, hexagon: 6, octagon: 8 };
await go(0);
for (let r = 0; r < 12; r++) {
  const g = await p.evaluate(() => ({ pts: document.querySelector("#g1 polygon").getAttribute("points").trim().split(/\s+/).length, right: document.getElementById("ch1").dataset.right }));
  if (SIDES[g.right] !== g.pts) bad.push(`s1 named "${g.right}" but drew ${g.pts} points`);
  await answer("ch1"); await waitLive("ch1");
}

// 2 regular: exactly one card, and its polygon really has equal sides
await go(1);
for (let r = 0; r < 8; r++) {
  const g = await p.evaluate(() => [...document.querySelectorAll("#sg2 .pick")].map((c) => ({ reg: c.dataset.r, pts: c.querySelector("polygon").getAttribute("points").trim().split(/\s+/).map((s) => s.split(",").map(Number)) })));
  if (g.filter((c) => c.reg === "1").length !== 1) bad.push("s2 not exactly one regular");
  const sideLens = (pts) => pts.map((pt, i) => { const q = pts[(i + 1) % pts.length]; return Math.hypot(pt[0] - q[0], pt[1] - q[1]); });
  g.forEach((c) => {
    const L = sideLens(c.pts), spread = Math.max(...L) - Math.min(...L);
    if (c.reg === "1" && spread > 0.6) bad.push(`s2 "regular" card has unequal sides (spread ${spread.toFixed(2)})`);
    if (c.reg === "0" && spread < 3) bad.push(`s2 "irregular" card looks regular (spread ${spread.toFixed(2)})`);
  });
  if (new Set(g.map((c) => c.pts.length)).size !== 1) bad.push("s2 cards have different side counts");
  await p.click('#sg2 .pick[data-r="1"]');
  await p.waitForTimeout(2500);
}

// 3 symmetry: recompute the fold from the polygon itself
await go(2);
for (let r = 0; r < 16; r++) {
  const g = await p.evaluate(() => ({
    pts: document.querySelector("#g3 polygon").getAttribute("points").trim().split(/\s+/).map((s) => s.split(",").map(Number)),
    line: { x1: +document.querySelector("#g3 line").getAttribute("x1"), y1: +document.querySelector("#g3 line").getAttribute("y1"), x2: +document.querySelector("#g3 line").getAttribute("x2"), y2: +document.querySelector("#g3 line").getAttribute("y2") },
    right: document.getElementById("ch3").dataset.right,
    say: document.getElementById("say3").textContent,
  }));
  const vertical = g.line.x1 === g.line.x2;
  const axis = vertical ? g.line.x1 : g.line.y1;
  const key = (pt) => pt[0].toFixed(1) + "," + pt[1].toFixed(1);
  const set = new Set(g.pts.map(key));
  const mirrored = g.pts.map((pt) => (vertical ? [2 * axis - pt[0], pt[1]] : [pt[0], 2 * axis - pt[1]]));
  const sym = mirrored.every((pt) => set.has(key(pt)));
  const want = sym ? "yes" : "no";
  if (g.right !== want) bad.push(`s3 ${g.say.slice(0, 60)}: right="${g.right}" but geometry says "${want}"`);
  if (vertical !== /vertical/.test(g.say)) bad.push("s3 line orientation does not match the wording");
  await answer("ch3"); await waitLive("ch3");
}

// 4 reflection: the true mirror image, in BOTH orientations (3Gp.02)
await go(3);
const seenMirror = new Set();
for (let r = 0; r < 10; r++) {
  const g = await p.evaluate(() => {
    const l = document.querySelector("#g4 line");
    return {
      cells: [...document.querySelectorAll("#g4 rect")].map((x) => ({ c: +x.dataset.c, r: +x.dataset.r, on: x.classList.contains("on"), t: x.dataset.t === "1" })),
      x1: +l.getAttribute("x1"), x2: +l.getAttribute("x2"), y1: +l.getAttribute("y1"),
      say: document.getElementById("say4").textContent,
    };
  });
  const vertical = g.x1 === g.x2;
  seenMirror.add(vertical ? "vertical" : "horizontal");
  if (vertical !== /vertical/.test(g.say)) bad.push("s4 wording does not match the drawn mirror: " + g.say);
  const axis = vertical ? Math.round((g.x1 - 12) / 34) : Math.round((g.y1 - 20) / 34);
  const on = g.cells.filter((x) => x.on);
  const targets = g.cells.filter((x) => x.t);
  if (on.length !== targets.length) bad.push(`s4 ${on.length} shaded but ${targets.length} targets`);
  on.forEach((x) => {
    const wc = vertical ? 2 * axis - 1 - x.c : x.c;
    const wr = vertical ? x.r : 2 * axis - 1 - x.r;
    if (!targets.some((t) => t.c === wc && t.r === wr)) bad.push(`s4 cell (${x.c},${x.r}) has no mirror at (${wc},${wr})`);
  });
  if (on.some((x) => (vertical ? x.c >= axis : x.r >= axis))) bad.push("s4 shape crosses the mirror");
  if (targets.some((x) => (vertical ? x.c < axis : x.r < axis))) bad.push("s4 a target lies on the shape's side");
  for (const t of targets) await p.click(`#g4 rect[data-c="${t.c}"][data-r="${t.r}"]`);
  await p.waitForTimeout(2700);
}
if (seenMirror.size !== 2) bad.push("s4 3Gp.02 names a horizontal OR vertical mirror; only saw: " + [...seenMirror].join(","));

// 8 draw it (3Gg.04): the rectangle drawn must be the one asked for
await go(7);
for (let r = 0; r < 8; r++) {
  const say = await p.evaluate(() => document.getElementById("say8d").textContent);
  const sq = /square with sides of (\d+)/.exec(say);
  const rect = /(\d+) squares wide and (\d+) squares tall/.exec(say);
  if (!sq && !rect) { bad.push("s8d unreadable prompt: " + say); break; }
  const w = sq ? Number(sq[1]) : Number(rect[1]);
  const h = sq ? Number(sq[1]) : Number(rect[2]);
  if (!(w >= 2 && h >= 2 && w <= 8 && h <= 6)) bad.push(`s8d asked for ${w} by ${h}, which will not fit the grid`);
  await p.click('#g8d rect[data-c="0"][data-r="0"]');
  await p.click(`#g8d rect[data-c="${w - 1}"][data-r="${h - 1}"]`);
  const fb = await p.evaluate(() => document.getElementById("fb8d").textContent);
  if (!/^(Yes!|Well done!|Super!|That.s it!|Brilliant!)/.test(fb)) bad.push(`s8d drew ${w} by ${h} as asked but was marked wrong: ${fb.slice(0, 80)}`);
  if (fb.indexOf("= " + 2 * (w + h) + " squares") < 0) bad.push(`s8d perimeter wrong for ${w} by ${h}: ${fb}`);
  if (fb.indexOf("= " + w * h + " squares") < 0) bad.push(`s8d area wrong for ${w} by ${h}: ${fb}`);
  await p.waitForTimeout(3100);
}

// 5 solids
await go(4);
for (let r = 0; r < 12; r++) {
  const g = await p.evaluate(() => ({ clue: document.getElementById("clue5").textContent, right: document.getElementById("ch5").dataset.right }));
  const TRUE = { cube: [6, 12, 8], cuboid: [6, 12, 8], cylinder: [3, 2, 0], cone: [2, 1, 1], sphere: [1, 0, 0], "square-based pyramid": [5, 8, 5] };
  const m = g.clue.match(/(\d+) faces?, (\d+) edges?, (\d+) corners?/);
  if (!m) bad.push("s5 clue unreadable: " + g.clue);
  else {
    const want = TRUE[g.right];
    if (!want) bad.push("s5 unknown solid " + g.right);
    else if (want[0] !== +m[1] || want[1] !== +m[2] || want[2] !== +m[3]) bad.push(`s5 ${g.right} clue says ${m[1]}/${m[2]}/${m[3]} want ${want.join("/")}`);
  }
  await answer("ch5"); await waitLive("ch5");
}

// 6 perimeter
await go(5);
for (let r = 0; r < 12; r++) {
  const g = await p.evaluate(() => ({ say: document.getElementById("say6").textContent, right: Number(document.getElementById("ch6").dataset.right) }));
  const m = g.say.match(/(\d+) cm.*?(\d+) cm/);
  const w = Number(m[1]), h = Number(m[2]);
  if (g.right !== 2 * (w + h)) bad.push(`s6 ${w}x${h}: right=${g.right} want ${2 * (w + h)}`);
  await answer("ch6"); await waitLive("ch6");
}

// 7 area: the answer must equal the number of shaded grid squares
await go(6);
for (let r = 0; r < 12; r++) {
  const g = await p.evaluate(() => ({ on: document.querySelectorAll("#g7 rect.on").length, right: Number(document.getElementById("ch7").dataset.right) }));
  if (g.on !== g.right) bad.push(`s7 ${g.on} squares shaded but right=${g.right}`);
  await answer("ch7"); await waitLive("ch7");
}

// 8, 9, 10 units
const UNITS = [[8, "q8", "ch8", { m: 100 }], [9, "q9", "ch9", { kg: 1000 }], [10, "q10", "ch10", { l: 1000 }]];
for (const [idx, qid, chid, conv] of UNITS) {
  await go(idx);
  for (let r = 0; r < 12; r++) {
    const g = await p.evaluate((a) => ({ q: document.getElementById(a[0]).textContent, right: document.getElementById(a[1]).dataset.right }), [qid, chid]);
    const m = g.q.match(/^(\d+) (\w+) = \? (\w+)$/);
    if (m) {
      const big = Object.keys(conv)[0], per = conv[big];
      const from = m[2], to = m[3], n = Number(m[1]);
      const want = from === big ? n * per : n / per;
      if (Number(g.right) !== want) bad.push(`s${idx + 1} ${g.q} right=${g.right} want ${want}`);
    }
    await answer(chid); await waitLive(chid);
  }
}

// 11 scale
await go(11);
for (let r = 0; r < 12; r++) {
  const g = await p.evaluate(() => {
    const svg = document.querySelector("#g11");
    const labels = [...svg.querySelectorAll("text.n")].map((t) => ({ x: +t.getAttribute("x"), v: Number(t.textContent) }));
    const ptr = svg.querySelector("polygon.ptr").getAttribute("points").split(" ")[0].split(",")[0];
    return { labels, ptrX: Number(ptr), right: document.getElementById("ch11").dataset.right };
  });
  if (g.labels.length < 2) bad.push("s11 fewer than two printed numbers");
  else {
    const a = g.labels[0], b2 = g.labels[1];
    const perPx = (b2.v - a.v) / (b2.x - a.x);
    const want = a.v + (g.ptrX - a.x) * perPx;
    const got = Number(String(g.right).replace(/[^\d.-]/g, ""));
    if (Math.abs(got - want) > 0.51) bad.push(`s11 arrow sits at ${want.toFixed(2)} but answer is ${g.right}`);
  }
  await answer("ch11"); await waitLive("ch11");
}

// 12 right angles: recompute the angle from the two drawn arms
await go(12);
for (let r = 0; r < 12; r++) {
  const g = await p.evaluate(() => {
    const arms = [...document.querySelectorAll("#g12 line.arm")].map((l) => ({ x1: +l.getAttribute("x1"), y1: +l.getAttribute("y1"), x2: +l.getAttribute("x2"), y2: +l.getAttribute("y2") }));
    return { arms, right: document.getElementById("ch12").dataset.right };
  });
  const v = (a) => [a.x2 - a.x1, a.y2 - a.y1];
  const [u, w] = g.arms.map(v);
  const dot = u[0] * w[0] + u[1] * w[1];
  const deg = Math.acos(dot / (Math.hypot(...u) * Math.hypot(...w))) * 180 / Math.PI;
  const want = Math.abs(deg - 90) < 0.5 ? "exactly a right angle" : deg < 90 ? "smaller than a right angle" : "bigger than a right angle";
  if (g.right !== want) bad.push(`s12 angle is ${deg.toFixed(1)}° but answer is "${g.right}"`);
  await answer("ch12"); await waitLive("ch12");
}

// 13 clock: recompute the time from the hand angles
await go(13);
for (let r = 0; r < 14; r++) {
  const g = await p.evaluate(() => {
    const arms = [...document.querySelectorAll("#g13 line.arm")];
    const ang = (l) => { const dx = +l.getAttribute("x2") - 100, dy = +l.getAttribute("y2") - 100; return (Math.atan2(dy, dx) * 180 / Math.PI + 90 + 360) % 360; };
    return { hourA: ang(arms[0]), minA: ang(arms[1]), right: document.getElementById("ch13").dataset.right };
  });
  const mm = Math.round(g.minA / 6) % 60;
  let hh = Math.round(((g.hourA - mm * 0.5 + 360) % 360) / 30) % 12;
  hh = hh === 0 ? 12 : hh;
  const want = hh + ":" + (mm < 10 ? "0" : "") + mm;
  if (g.right !== want) bad.push(`s13 hands show ${want} but answer is ${g.right}`);
  await answer("ch13"); await waitLive("ch13");
}

// 15 time: clock intervals, choosing a unit (3Gt.01), long intervals (3Gt.04)
await go(14);
const UNITW = {
  "brushing your teeth": "minutes", "blinking": "seconds", "a night's sleep": "hours",
  "the school holidays": "weeks", "growing from a baby to a grown-up": "years", "a football match": "hours",
  "waiting for your next birthday": "months", "boiling a kettle": "minutes",
};
const MON = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const seenTime = new Set();
for (let r = 0; r < 26; r++) {
  const g = await p.evaluate(() => ({
    clocks: document.getElementById("cw14").style.display !== "none",
    a: document.getElementById("t14a").textContent, b: document.getElementById("t14b").textContent,
    q: document.getElementById("q14").textContent,
    right: document.getElementById("ch14").dataset.right,
  }));
  if (g.clocks) {
    seenTime.add("clock");
    const mins = (t) => { const q = t.split(":").map(Number); return q[0] * 60 + q[1]; };
    const d = mins(g.b) - mins(g.a);
    if (d <= 0) bad.push(`s15 end ${g.b} is not after start ${g.a}`);
    const fmt = (t) => t >= 60 ? (Math.floor(t / 60) + " hour" + (Math.floor(t / 60) === 1 ? "" : "s") + (t % 60 ? " " + (t % 60) + " minutes" : "")) : t + " minutes";
    if (g.right !== fmt(d)) bad.push(`s15 ${g.a} to ${g.b} is ${fmt(d)} but answer is "${g.right}"`);
  } else if (/Which unit/.test(g.q)) {
    seenTime.add("unit");
    const what = g.q.replace("Which unit would you use to measure ", "").replace("?", "");
    if (UNITW[what] === undefined) bad.push("s15 unknown activity: " + what);
    else if (g.right !== UNITW[what]) bad.push(`s15 "${what}" should be ${UNITW[what]} but answer is ${g.right}`);
  } else {
    seenTime.add("long");
    let want = null;
    let m = /How many days are there in (\d+) weeks/.exec(g.q);
    if (m) want = Number(m[1]) * 7;
    m = /How many months are there in (\d+) years/.exec(g.q);
    if (m) want = Number(m[1]) * 12;
    m = /from (\w+) to (\w+) in the same year/.exec(g.q);
    if (m) want = MON.indexOf(m[2]) - MON.indexOf(m[1]);
    if (want === null) bad.push("s15 unreadable long-interval question: " + g.q);
    else if (Number(g.right) !== want) bad.push(`s15 "${g.q}" right=${g.right} want ${want}`);
  }
  await answer("ch14"); await waitLive("ch14");
}
if (seenTime.size !== 3) bad.push("s15 wanted clock intervals, unit choice (3Gt.01) and long intervals (3Gt.04); saw: " + [...seenTime].join(","));

// 16 timetable: times must increase down every column
await go(15);
for (let r = 0; r < 12; r++) {
  const g = await p.evaluate(() => {
    const rows = [...document.querySelectorAll("#tt15 tr")].slice(1).map((tr) => [...tr.querySelectorAll("td")].map((td) => td.textContent));
    return { rows, say: document.getElementById("say15").textContent, right: document.getElementById("ch15").dataset.right };
  });
  const mins = (s) => { const [h, m] = s.split(":").map(Number); return h * 60 + m; };
  for (let c = 0; c < g.rows[0].length; c++) {
    for (let k = 1; k < g.rows.length; k++) {
      if (mins(g.rows[k][c]) < mins(g.rows[k - 1][c])) bad.push(`s15 column ${c + 1} goes backwards: ${g.rows[k - 1][c]} then ${g.rows[k][c]}`);
    }
  }
  await answer("ch15"); await waitLive("ch15");
}

// 17 compass
await go(16);
for (let r = 0; r < 6; r++) {
  const say = await p.evaluate(() => document.getElementById("say16").textContent);
  const seq = (say.match(/north|south|east|west/g) || []).map((w) => w[0].toUpperCase());
  if (!seq.length) { bad.push("s16 no directions asked for: " + say); break; }
  for (const d of seq) await p.click(`#cp16 button[data-d="${d}"]`);
  const fb = await p.evaluate(() => document.getElementById("fb16").textContent);
  if (!/North is up/.test(fb)) bad.push("s16 sequence not accepted: " + fb);
  await p.waitForTimeout(2500);
}

// 18 check
await go(17);
for (let r = 0; r < 12; r++) {
  const n = await p.evaluate(() => document.querySelectorAll("#ch17 .choice").length);
  if (!n) break;
  await answer("ch17");
  await p.waitForTimeout(2200);
}
{
  const fb = await p.evaluate(() => document.getElementById("fb17").textContent);
  if (!/Finished/.test(fb)) bad.push("s17 did not finish: " + fb);
}

// the sticker shelf is the LAST slide, and paintStickers() runs only while it
// is showing. Derive its index - a written-down one goes stale the moment a
// step is inserted, and the symptom is a lesson that looks broken.
await go((await p.evaluate(() => document.querySelectorAll(".slide").length)) - 1);
{
  const g = await p.evaluate(() => ({ n: document.querySelectorAll("#stickers .sticker").length, got: document.querySelectorAll("#stickers .sticker.got").length }));
  console.log("stickers:", g);
  if (g.n !== 19) bad.push("stickers " + g.n);
  if (g.got < 13) bad.push("only " + g.got + " stickers earned");
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
