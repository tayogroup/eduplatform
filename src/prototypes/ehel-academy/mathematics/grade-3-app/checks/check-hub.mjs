import { chromium } from "playwright";
import { pathToFileURL } from "url";
import { residualErrors } from "./_platform-modules.mjs";
import path from "path";
import { fileURLToPath } from "url";
/* the lessons sit one level up from checks/ - resolve against THIS file so the
   checker works from anywhere, not only when the shell happens to be cd'd into
   the lesson directory */
const L = (f) => path.join(path.dirname(fileURLToPath(import.meta.url)), "..", f);
import fs from "fs";

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1200, height: 1000 } });
const p = await ctx.newPage();
const errors = [];
p.on("pageerror", (e) => errors.push("PAGEERROR " + e.message));
p.on("console", (m) => { if (m.type() === "error") errors.push("CONSOLE " + m.text()); });
const bad = [];

await p.goto(pathToFileURL(L("index.html")).href);
const cards = await p.evaluate(() => [...document.querySelectorAll("a.lesson")].map((a) => ({
  href: a.getAttribute("href"),
  title: a.querySelector("h2").textContent,
  strand: a.querySelector(".strand").textContent,
  steps: a.querySelector(".steps").textContent,
  covers: a.querySelector(".covers").textContent.length,
  mark: !!a.querySelector(".mark svg"),
})));
console.log(cards.map((c) => c.title + " -> " + c.href + " (" + c.steps + ")"));
if (cards.length !== 5) bad.push("cards " + cards.length);

for (const c of cards) {
  if (!c.mark) bad.push(c.title + ": no mark icon");
  if (c.covers < 80) bad.push(c.title + ": covers text too short");
  if (!/\?from=g3$/.test(c.href)) bad.push(c.title + ": href missing ?from=g3 -> " + c.href);
  const file = c.href.split("?")[0];
  if (!fs.existsSync(file)) { bad.push(c.title + ": " + file + " does not exist"); continue; }

  // the step count on the card must match the lesson's real teaching slides
  const q = await ctx.newPage();
  await q.goto(pathToFileURL(L(file)).href);
  const g = await q.evaluate(() => ({
    slides: document.querySelectorAll(".slide").length,
    heads: [...document.querySelectorAll(".slide-head .n")].map((x) => x.textContent),
    title: document.title,
    eyebrow: document.querySelector(".eyebrow").textContent,
    back: !!document.querySelector(".lesson-back"),
  }));
  const teaching = g.heads.filter((h) => /^\d+$/.test(h)).length;
  const claimed = Number(c.steps.match(/^(\d+) steps/)[1]);
  if (teaching !== claimed) bad.push(`${c.title}: card says ${claimed} steps, lesson has ${teaching}`);
  if (g.slides !== teaching + 3) bad.push(`${c.title}: ${g.slides} slides for ${teaching} teaching steps (want check + how-do-you-know + stickers)`);
  if (g.title !== c.title) bad.push(`${c.title}: <title> is "${g.title}"`);
  if (!/Grade 3/.test(g.eyebrow)) bad.push(`${c.title}: eyebrow does not say Grade 3 -> ${g.eyebrow}`);
  await q.close();

  // arriving with ?from=g3 must add the back link; arriving without must not.
  // Keyed on .lesson-back, which wire-navigation.py adds. It used to be
  // .g1-back - a second, identical back link inherited from the Grade 1 build
  // this one was copied from, so a learner with ?from=g3 saw the same link
  // twice. That one is gone; the property this asserts is unchanged.
  const r = await ctx.newPage();
  await r.goto(pathToFileURL(L(file)).href + "?from=g3");
  const withBack = await r.evaluate(() => { const a = document.querySelector(".lesson-back"); return a ? { href: a.getAttribute("href"), text: a.textContent.trim() } : null; });
  if (!withBack) bad.push(`${c.title}: no back link with ?from=g3`);
  else {
    if (withBack.href !== "index.html") bad.push(`${c.title}: back link points at ${withBack.href}`);
    if (!/Grade 3 Maths/.test(withBack.text)) bad.push(`${c.title}: back link says "${withBack.text}" - should name Grade 3`);
  }
  await r.close();
  const s = await ctx.newPage();
  await s.goto(pathToFileURL(L(file)).href);
  const noBack = await s.evaluate(() => !!document.querySelector(".lesson-back"));
  if (noBack) bad.push(`${c.title}: back link present without ?from=g3`);
  await s.close();
}

// no lesson file left unlinked
/* build inputs (_head, _foot, lN-slides) are not lessons */
const onDisk = fs.readdirSync(".").filter((f) => /\.html$/.test(f) && f !== "index.html" && !/^_/.test(f) && !/^l\d+-slides\.html$/.test(f));
const linked = cards.map((c) => c.href.split("?")[0]);
onDisk.forEach((f) => { if (!linked.includes(f)) bad.push("orphan lesson not on the hub: " + f); });

await p.setViewportSize({ width: 375, height: 900 });
const over = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
console.log("overflow375:", over);
if (over > 0) bad.push("hub overflows 375px by " + over);

await p.setViewportSize({ width: 1200, height: 1400 });
await p.screenshot({ path: "shot-hub.png", fullPage: true });
console.log("bad =", bad);
console.log("errors =", residualErrors(errors));
await b.close();
