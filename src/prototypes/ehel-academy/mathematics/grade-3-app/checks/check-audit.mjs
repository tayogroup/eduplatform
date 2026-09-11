import { chromium } from "playwright";
import { pathToFileURL } from "url";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const L = (f) => path.join(HERE, f);

const bad = [];

/* The 53 Stage 3 codes are read out of the framework rather than retyped, so a
   code this audit invents cannot pass.

   FROM THE COMMITTED EXTRACTION, src/curriculum/cambridge-mathematics-0096.json -
   the file audit-stage-coverage.py and every other Mathematics gate reads. This
   used to need fw.txt, a pdftotext dump of Cambridge's PDF that is deliberately
   NOT committed (the repo holds structured extractions, never a reproduction of
   the source document), so it could run on one machine and exited 2 everywhere
   else: the 2026-09-11 validation found it unable to run. fw.txt is still read
   when it is here, and must then AGREE with the JSON - two readings of one
   framework that disagree mean one of them is wrong, and this says so.

   Exit 2, not 1: this is "the check could not run", which is neither a pass nor
   a finding. A gate that cannot read its target and reports green is green
   about nothing. */
const FW = path.resolve(HERE, "../../../../../curriculum/cambridge-mathematics-0096.json");
if (!fs.existsSync(FW)) {
  console.error("cannot run: no framework at " + FW);
  process.exit(2);
}
const codes = [...new Set((JSON.parse(fs.readFileSync(FW, "utf8")).objectivesByStage["3"] || []).map((o) => o.code))].sort();
if (codes.length !== 53) {
  console.error("cannot run: the framework gave " + codes.length + " Stage 3 codes, not 53.");
  process.exit(2);
}
if (fs.existsSync(L("fw.txt"))) {
  const fw = fs.readFileSync(L("fw.txt"), "utf8").split(/\r?\n/).slice(834, 1003).join("\n");
  const fromPdf = [...new Set(fw.match(/3[A-Za-z][a-z]\.\d\d/g))].sort();
  if (fromPdf.join() !== codes.join()) {
    console.error("cannot run: fw.txt and " + path.basename(FW) + " disagree about the Stage 3 codes.");
    process.exit(2);
  }
}

const b = await chromium.launch();

for (const theme of ["light", "dark"]) {
  const ctx = await b.newContext({ viewport: { width: 1200, height: 1000 }, colorScheme: theme });
  const p = await ctx.newPage();
  const errors = [];
  p.on("pageerror", (e) => errors.push(String(e)));
  await p.goto(pathToFileURL(L("stage-3-coverage-audit.html")).href);

  const g = await p.evaluate(() => {
    const rows = [...document.querySelectorAll("tbody tr")].filter((tr) => /^3[A-Za-z][a-z]\.\d\d$/.test(tr.cells[0].textContent.trim())).map((tr) => ({
      code: tr.cells[0].textContent.trim(),
      obj: tr.cells[1].textContent.trim().length,
      status: tr.cells[2].textContent.trim(),
      where: tr.cells[3].textContent.trim().length,
    }));
    const cs = getComputedStyle(document.body);
    const px = (s) => s.split(",").slice(0, 3).map((n) => parseInt(n.replace(/\D+/g, ""), 10));
    return {
      rows,
      title: document.title,
      cards: document.querySelectorAll(".card").length,
      counts: [...document.querySelectorAll(".count .n")].map((x) => x.textContent),
      bg: cs.backgroundColor, fg: cs.color,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      pills: [...new Set([...document.querySelectorAll("td .pill")].map((x) => x.textContent.trim()))],
    };
  });

  if (theme === "light") {
    console.log({ title: g.title, rows: g.rows.length, cards: g.cards, counts: g.counts, pills: g.pills });
    const seen = g.rows.map((r) => r.code).sort();
    const missing = codes.filter((c) => !seen.includes(c));
    const extra = seen.filter((c) => !codes.includes(c));
    if (missing.length) bad.push("objectives missing from the audit: " + missing.join(", "));
    if (extra.length) bad.push("rows that are not Stage 3 codes: " + extra.join(", "));
    if (seen.length !== new Set(seen).size) bad.push("a code is listed twice");
    if (g.rows.length !== 53) bad.push("rows " + g.rows.length + " want 53");
    if (g.cards !== 8) bad.push("finding cards " + g.cards);
    const filled = g.rows.filter((r) => r.status === "filled").map((r) => r.code);
    if (filled.length !== 8) bad.push("filled rows " + filled.length + ": " + filled.join(","));
    console.log("filled:", filled.join(", "));
    g.rows.forEach((r) => {
      if (r.obj < 25) bad.push(r.code + ": objective text too short");
      if (r.where < 12) bad.push(r.code + ": no evidence cited");
      if (!["covered", "filled"].includes(r.status)) bad.push(r.code + ": status '" + r.status + "'");
    });
    if (Number(g.counts[0]) !== 53) bad.push("headline count says " + g.counts[0]);
    if (Number(g.counts[1]) !== filled.length) bad.push("headline gap count " + g.counts[1] + " != " + filled.length);
  }

  // both themes must actually resolve, and body must paint its own ground
  const lum = (c) => { const n = c.match(/\d+/g).map(Number); return 0.2126 * n[0] + 0.7152 * n[1] + 0.0722 * n[2]; };
  const bgL = lum(g.bg), fgL = lum(g.fg);
  if (/rgba\(0, 0, 0, 0\)/.test(g.bg)) bad.push(theme + ": body has no background of its own");
  if (Math.abs(bgL - fgL) < 90) bad.push(`${theme}: text and ground too close (${g.bg} on ${g.fg})`);
  if (theme === "light" && bgL < 128) bad.push("light theme has a dark ground");
  if (theme === "dark" && bgL > 128) bad.push("dark theme has a light ground");
  if (g.overflow > 0) bad.push(theme + ": page scrolls sideways by " + g.overflow);
  if (errors.length) bad.push(theme + ": " + errors.join("; "));

  await p.setViewportSize({ width: 375, height: 900 });
  const narrow = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (narrow > 0) bad.push(theme + ": overflows 375px by " + narrow);

  await p.setViewportSize({ width: 1200, height: 1200 });
  await p.screenshot({ path: "shot-audit-" + theme + ".png" });
  await ctx.close();
}

console.log("bad =", bad);
await b.close();
