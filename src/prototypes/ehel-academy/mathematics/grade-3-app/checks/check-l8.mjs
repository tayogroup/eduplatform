import { chromium } from "playwright";
import { pathToFileURL } from "url";
import { residualErrors, notImported } from "./_platform-modules.mjs";
import path from "path";
import { fileURLToPath } from "url";
/* the lessons sit one level up from checks/ - resolve against THIS file so the
   checker works from anywhere, not only when the shell happens to be cd'd into
   the lesson directory */
const L = (f) => path.join(path.dirname(fileURLToPath(import.meta.url)), "..", f);
const LESSON = "ask-count-chart.html";
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
const N = 13;
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
if (info.ssmlOpen !== info.ssmlClose) bad.push(`SSML unbalanced ${info.ssmlOpen}/${info.ssmlClose}`);
for (let i = 0; i < N; i++) {
  await go(i);
  const st = await p.evaluate(() => { const s = document.querySelector(".slide.active"); return { h: s.querySelector("h2").textContent, n: s.querySelector(".stage").innerHTML.trim().length }; });
  if (st.n < 20) bad.push(`slide ${i + 1} "${st.h}" empty`);
}

// 1 statistical question
await go(0);
const PLAIN = ["How many legs has a spider?", "How many days are there in a week?", "What is 7 × 8?", "How many sides has a hexagon?"];
for (let r = 0; r < 10; r++) {
  const g = await p.evaluate(() => ({ right: document.getElementById("ch1").dataset.right, opts: [...document.querySelectorAll("#ch1 .choice")].map((c) => c.dataset.v) }));
  if (PLAIN.includes(g.right)) bad.push(`s1 marked a non-statistical question as the answer: "${g.right}"`);
  if (g.opts.filter((o) => !PLAIN.includes(o)).length !== 1) bad.push(`s1 should offer exactly one statistical question: ${JSON.stringify(g.opts)}`);
  await answer("ch1"); await waitLive("ch1");
}

// 2 tally: the marks drawn must equal the total claimed
await go(1);
for (let r = 0; r < 10; r++) {
  const g = await p.evaluate(() => ({
    rows: [...document.querySelectorAll("#tb2 tr")].slice(1).map((tr) => ({ marks: tr.cells[1].textContent.trim(), n: tr.cells[2].textContent.trim() })),
    say: document.getElementById("say2").textContent,
    right: Number(document.getElementById("ch2").dataset.right),
  }));
  g.rows.forEach((row) => {
    const bundles = (row.marks.match(/卌/g) || []).length;
    const singles = (row.marks.match(/\|/g) || []).length;
    const total = bundles * 5 + singles;
    if (singles >= 5) bad.push(`s2 ${singles} single marks left unbundled`);
    if (row.n !== "?" && Number(row.n) !== total) bad.push(`s2 marks show ${total} but the table says ${row.n}`);
    if (row.n === "?" && total !== g.right) bad.push(`s2 the asked row draws ${total} but right=${g.right}`);
  });
  await answer("ch2"); await waitLive("ch2");
}

// 3 pictogram: pictures x key must equal the answer
await go(2);
for (let r = 0; r < 10; r++) {
  const g = await p.evaluate(() => ({
    key: document.getElementById("key3").textContent,
    rows: [...document.querySelectorAll("#pg3 .pictorow")].map((x) => ({ who: x.querySelector(".who").textContent, ics: x.querySelector(".ics").textContent })),
    say: document.getElementById("say3").textContent,
    right: Number(document.getElementById("ch3").dataset.right),
  }));
  const per = Number(g.key.match(/=\s*(\d+) children/)[1]);
  const who = g.say.match(/chose\s+(\w+)/)[1];
  const row = g.rows.find((x) => x.who === who);
  if (!row) { bad.push("s3 asked row not found: " + who); break; }
  const whole = [...row.ics].filter((c) => c === "🍎").length;
  const half = [...row.ics].filter((c) => c === "🌗").length;
  const want = whole * per + half * (per / 2);
  if (want !== g.right) bad.push(`s3 ${whole} whole + ${half} half at key ${per} is ${want} but right=${g.right}`);
  await answer("ch3"); await waitLive("ch3");
}

// 4 bar chart: bar heights must be in proportion to the values
await go(3);
for (let r = 0; r < 10; r++) {
  const g = await p.evaluate(() => ({
    cols: [...document.querySelectorAll("#bc4 .col")].map((c) => ({ t: c.querySelector(".cap").textContent, v: Number(c.querySelector(".val").textContent), h: parseFloat(c.querySelector(".bar").style.height) })),
    say: document.getElementById("say4").textContent,
    right: Number(document.getElementById("ch4").dataset.right),
  }));
  const who = g.say.match(/chose\s+(\w+)/)[1];
  const col = g.cols.find((c) => c.t === who);
  if (!col) bad.push("s4 column not found " + who);
  else if (col.v !== g.right) bad.push(`s4 ${who} shows ${col.v} but right=${g.right}`);
  const ratios = g.cols.filter((c) => c.v > 0).map((c) => c.h / c.v);
  if (Math.max(...ratios) - Math.min(...ratios) > 0.9) bad.push(`s4 bar heights are not proportional: ${JSON.stringify(g.cols)}`);
  await answer("ch4"); await waitLive("ch4");
}

// 5 Venn: the lit zone must match the two tests
await go(4);
for (let r = 0; r < 12; r++) {
  const g = await p.evaluate(() => ({ n: Number(document.getElementById("q5").textContent), say: document.getElementById("say5").textContent }));
  const tests = { "even": (n) => n % 2 === 0, "odd": (n) => n % 2 === 1, "more than 20": (n) => n > 20, "more than 25": (n) => n > 25, "less than 15": (n) => n < 15, "a multiple of 5": (n) => n % 5 === 0, "a multiple of 10": (n) => n % 10 === 0 };
  const m = g.say.match(/Is <?b?>?\d+<?\/?b?>? (.+?)\? Is it (.+?)\?/) || g.say.match(/Is (\d+) (.+?)\? Is it (.+?)\?/);
  const parts = g.say.replace(/\s+/g, " ").match(/Is \d+ (.+?)\? Is it (.+?)\? Tap/);
  if (!parts) { bad.push("s5 unreadable prompt: " + g.say); break; }
  const fa = tests[parts[1]], fb = tests[parts[2]];
  if (!fa || !fb) { bad.push(`s5 unknown test "${parts[1]}" / "${parts[2]}"`); break; }
  const zone = fa(g.n) && fb(g.n) ? "both" : fa(g.n) ? "a" : fb(g.n) ? "b" : "none";
  await p.click(`#vn5 .zone[data-z="${zone}"]`);
  const fbtxt = await p.evaluate(() => document.getElementById("fb5").textContent);
  if (!/^(Yes!|Well done!|Super!|That's it!|Brilliant!)/.test(fbtxt)) bad.push(`s5 ${g.n} (${parts[1]} / ${parts[2]}): zone "${zone}" was marked wrong - "${fbtxt.slice(0, 70)}"`);
  await p.waitForTimeout(3000);
}

// 6 Carroll
await go(5);
for (let r = 0; r < 12; r++) {
  const g = await p.evaluate(() => ({ n: Number(document.getElementById("q6").textContent), say: document.getElementById("say6").textContent.replace(/\s+/g, " ") }));
  const tests = { "even": (n) => n % 2 === 0, "odd": (n) => n % 2 === 1, "more than 20": (n) => n > 20, "more than 25": (n) => n > 25, "less than 15": (n) => n < 15, "a multiple of 5": (n) => n % 5 === 0, "a multiple of 10": (n) => n % 10 === 0 };
  const parts = g.say.match(/Is \d+ (.+?)\? Is it (.+?)\? Tap/);
  if (!parts) { bad.push("s6 unreadable prompt: " + g.say); break; }
  const fa = tests[parts[1]], fb = tests[parts[2]];
  if (!fa || !fb) { bad.push(`s6 unknown test "${parts[1]}" / "${parts[2]}"`); break; }
  const key = (fa(g.n) ? "a" : "na") + "-" + (fb(g.n) ? "b" : "nb");
  await p.click(`#cr6 td[data-k="${key}"]`);
  const fbtxt = await p.evaluate(() => document.getElementById("fb6").textContent);
  if (!/^(Yes!|Well done!|Super!|That's it!|Brilliant!)/.test(fbtxt)) bad.push(`s6 ${g.n}: box "${key}" was marked wrong - "${fbtxt.slice(0, 70)}"`);
  await p.waitForTimeout(3100);
}

// 7 interpret
await go(6);
for (let r = 0; r < 12; r++) {
  const g = await p.evaluate(() => ({
    cols: [...document.querySelectorAll("#bc7 .col")].map((c) => ({ t: c.querySelector(".cap").textContent, v: Number(c.querySelector(".val").textContent) })),
    say: document.getElementById("say7").textContent,
    right: document.getElementById("ch7").dataset.right,
  }));
  const sorted = g.cols.slice().sort((a, b2) => b2.v - a.v);
  let want = null;
  if (/chosen most/.test(g.say)) want = sorted[0].t;
  else if (/chosen least/.test(g.say)) want = sorted[sorted.length - 1].t;
  else if (/altogether/.test(g.say)) want = String(g.cols.reduce((s, c) => s + c.v, 0));
  else if (/how many more/i.test(g.say)) want = String(sorted[0].v - sorted[sorted.length - 1].v);
  if (want !== null && g.right !== want) bad.push(`s7 "${g.say}" right=${g.right} want ${want}`);
  await answer("ch7"); await waitLive("ch7");
}

// 8 choosing a representation (3Ss.02 "choose and explain which to use")
await go(7);
const FORMS = ["a tally chart", "a bar chart", "a pictogram", "a Venn diagram", "a Carroll diagram", "a frequency table"];
const RIGHT = {
  "You are standing by the road counting cars as they drive past, as fast as they come.": "a tally chart",
  "You have the totals already, and you want to see at a glance which fruit was most popular.": "a bar chart",
  "You want to show how many children chose each drink, using one picture to stand for five children.": "a pictogram",
  "Some children play football, some play chess, and you especially want the ones who do both to stand out.": "a Venn diagram",
  "You want to sort numbers by two yes-or-no questions, with a box for every combination including neither.": "a Carroll diagram",
  "You have finished counting and want the totals written down neatly, ready to read off.": "a frequency table",
};
const seenForms = new Set();
for (let r = 0; r < 16; r++) {
  const g = await p.evaluate(() => ({ q: document.getElementById("q8c").textContent, right: document.getElementById("ch8c").dataset.right, opts: [...document.querySelectorAll("#ch8c .choice")].map((c) => c.dataset.v) }));
  if (RIGHT[g.q] === undefined) { bad.push("s8 unknown situation: " + g.q); break; }
  if (g.right !== RIGHT[g.q]) bad.push(`s8 "${g.q.slice(0, 40)}..." right=${g.right} want ${RIGHT[g.q]}`);
  if (!g.opts.includes(g.right)) bad.push("s8 right not offered");
  g.opts.forEach((o) => { if (!FORMS.includes(o)) bad.push("s8 option is not one of the six named forms: " + o); });
  seenForms.add(g.right);
  await answer("ch8c"); await waitLive("ch8c");
}
if (seenForms.size < 4) bad.push("s8 only " + seenForms.size + " of the six representations were ever the answer");

// 9 chance language
await go(8);
const CH = { "The sun will come up tomorrow morning.": "it will happen", "It will rain at some point next month.": "it might happen", "A cat will do your homework tonight.": "it will not happen", "You will roll a 7 on an ordinary six-sided dice.": "it will not happen", "You will roll a number less than 7 on an ordinary dice.": "it will happen", "The next car to pass will be red.": "it might happen", "December will come after November this year.": "it will happen", "You will grow younger next year.": "it will not happen", "Your teacher will wear blue tomorrow.": "it might happen", "A tossed coin will land on heads.": "it might happen" };
for (let r = 0; r < 14; r++) {
  const t = await p.evaluate(() => document.getElementById("q8").textContent);
  const want = CH[t];
  if (!want) { bad.push("s8 unknown statement: " + t); break; }
  await p.click(`#lk8 button[data-v="${want}"]`);
  const fbtxt = await p.evaluate(() => document.getElementById("fb8").textContent);
  if (!/^(Yes!|Well done!|Super!|That's it!|Brilliant!)/.test(fbtxt)) bad.push(`s8 "${t}" -> "${want}" marked wrong`);
  await p.waitForTimeout(3000);
}

// 10 spinner: the counts must add up to the spins, and the big sector must win over many spins
await go(9);
for (let k = 0; k < 12; k++) await p.click("#spin9x");
{
  const g = await p.evaluate(() => ({ txt: document.getElementById("tot9").textContent, secs: document.querySelectorAll("#sp9 path.sec").length }));
  const m = [...g.txt.matchAll(/(red|blue|gold|spins):\s*(\d+)/g)].reduce((o, x) => (o[x[1]] = Number(x[2]), o), {});
  if (g.secs !== 3) bad.push("s9 spinner has " + g.secs + " sectors");
  if (m.red + m.blue + m.gold !== m.spins) bad.push(`s9 counts ${m.red}+${m.blue}+${m.gold} do not add to ${m.spins} spins`);
  if (m.spins < 200) bad.push("s9 too few spins to judge: " + m.spins);
  else if (!(m.red > m.gold)) bad.push(`s9 over ${m.spins} spins red (${m.red}) did not beat gold (${m.gold}) - half the wheel losing to a sixth`);
  console.log("spinner:", m);
}

// 11 check
await go(10);
for (let r = 0; r < 12; r++) {
  const n = await p.evaluate(() => document.querySelectorAll("#ch10 .choice").length);
  if (!n) break;
  await answer("ch10");
  await p.waitForTimeout(2300);
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
  if (g.n !== 12) bad.push("stickers " + g.n);
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
