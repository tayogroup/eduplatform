#!/usr/bin/env node
// The Student-resources print sheets, checked through Chrome's REAL print engine.
//
//   npm run check:print-sheets                 # every grade, every unit
//   node tools/check-print-sheets.mjs --quick  # unit 1 of every grade
//   node tools/check-print-sheets.mjs --grade 4 --unit 1
//
// WHY THIS EXISTS. `printCursiveWorksheet` was the repo's only print path for a
// long time, and the lesson it left is in CLAUDE.md: `break-inside: avoid`
// cannot hold an element taller than the page, so a page counter that assumes
// every item is unsplittable runs short. Three more print paths shipped in v390
// — Core words by week, the Unit plan, the Grade plan — and nothing read any of
// them. Their pagination was verified once, by hand, against one grade.
//
// It renders the WORKING TREE, not the CDN. Every content path in the app is
// relative (`gradeRootUrl` is `./grade-N/` against location.href), so a static
// server over src/prototypes/ehel-academy boots the whole course offline. A gate
// pointed at the CDN would only ever describe the last release, which is the one
// moment you no longer need it.
//
// WHAT IT CANNOT SEE, stated because a gate that hides its blind spot is worse
// than one that has none. Whether Chrome actually REPRINTS a table's column
// header at the top of a continuation page is paged-media behaviour with no DOM
// representation: it is absent from CSS multicolumn (same fragmenter, but header
// repetition is print-only) and from paged.js (a polyfill that does not
// implement it at all — trusting it produced two false defects on 2026-09-02).
// It was verified by hand that day against Chrome's real print output, on all
// eight grades: 14 continuation pages, 10 reprinting the header and 4 opening a
// new week with its own, and none opening on a bare data row. That is browser
// behaviour and is not ours to regress. What IS ours is the structure it hangs
// on — a real <thead> and the four CSS rules — so those are asserted here, and
// the observation is recorded rather than re-run.
import { chromium } from "playwright";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = path.join(REPO, "src", "prototypes", "ehel-academy");
const SHEETS = ["core-words-weeks", "unit-plan", "grade-plan"];
// Sheets whose length is fixed by their shape rather than by how much content a
// unit happens to carry. Core words is deliberately absent: it grows with the
// word list and legitimately runs to three pages.
const SINGLE_PAGE = new Set(["unit-plan", "grade-plan"]);
// A4 portrait less the sheet's own 14mm margin, in CSS px (1mm = 96/25.4).
const MM = 96 / 25.4;
const PAGE_W = Math.round(182 * MM);
const PAGE_H = Math.round(269 * MM);
// Below this the run has not exercised the thing it claims to check. A gate that
// passes having compared nothing is the failure this repo keeps writing down.
const MIN_SHEETS = 12;

let GRADES = [1, 2, 3, 4, 5, 6, 7, 8];
let UNITS = null; // null = every unit the grade offers
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  const arg = argv[i];
  if (arg === "--quick") { UNITS = [1]; continue; }
  if (arg === "--grade") { GRADES = [Number(argv[++i])]; continue; }
  if (arg === "--unit") { UNITS = [Number(argv[++i])]; continue; }
  console.error(`Unrecognised argument: ${arg}`);
  console.error("Usage: check-print-sheets.mjs [--quick] [--grade N] [--unit N]");
  process.exit(2);
}
if (GRADES.some((g) => !Number.isInteger(g) || g < 1 || g > 8)) { console.error("--grade must be 1-8"); process.exit(2); }
if (UNITS && UNITS.some((u) => !Number.isInteger(u) || u < 1)) { console.error("--unit must be a positive integer"); process.exit(2); }

const findings = [];
const fail = (where, msg) => findings.push(`${where}: ${msg}`);

// ---------------------------------------------------------------- static host
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".svg": "image/svg+xml",
  ".webp": "image/webp", ".mp3": "audio/mpeg", ".mp4": "video/mp4", ".woff2": "font/woff2" };
const server = http.createServer((req, res) => {
  const rel = decodeURIComponent(req.url.split("?")[0]).replace(/^\/+/, "");
  const file = path.join(ROOT, rel);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});

// ------------------------------------------------------------------ the rules
// Each is a rule the sheets' pagination actually rests on, with the failure it
// prevents. Dropping any one of them is a silent regression on paper only.
const REQUIRED_CSS = [
  [/@page\s*\{[^}]*size:\s*A4/i, "@page size: A4 — without it the sheet paginates to the printer's default"],
  [/thead\s*\{[^}]*table-header-group/i, "thead display: table-header-group — the column header reprint on a continuation page"],
  [/(^|\})\s*tr\s*\{[^}]*break-inside:\s*avoid/im, "tr break-inside: avoid — stops a word's row splitting across two pages"],
  [/\.ps-week[^{]*\{[^}]*break-after:\s*avoid/i, "h2.ps-week break-after: avoid — stops a week heading stranding at a page foot"],
];

function checkStructure(sheet, where, html) {
  const style = html.match(/<style>([\s\S]*?)<\/style>/);
  if (!style) { fail(where, "no <style> block — the sheet carries no print rules at all"); return; }
  for (const [re, why] of REQUIRED_CSS) {
    // grade-plan and unit-plan draw no week headings, so that rule is theirs only
    if (re.source.includes("ps-week") && !/ps-week/.test(html)) continue;
    if (!re.test(style[1])) fail(where, `missing rule — ${why}`);
  }
  // A repeated header is a property of a real <thead>. A hand-rolled header row
  // in <tbody> looks identical on screen and silently stops reprinting.
  const tables = html.match(/<table[\s\S]*?<\/table>/g) || [];
  if (!tables.length) { fail(where, "no <table> found — the parser matched nothing, so nothing was checked"); return; }
  tables.forEach((t, i) => {
    const heads = (t.match(/<thead>/g) || []).length;
    if (heads !== 1) fail(where, `table ${i + 1} has ${heads} <thead> elements, expected 1`);
    if (!/<thead>[\s\S]*?<th[\s>]/.test(t)) fail(where, `table ${i + 1} has no <th> inside its <thead>`);
  });
}

// PDF page count, read two independent ways so a Chrome output change that
// breaks one parser is caught rather than quietly believed.
// The page tree is NESTED once a document is long enough: a 20-page PDF carries
// /Count values [8, 8, 4, 20] — three subtrees and the root. Reading the FIRST
// one gives a subtree's size and is wrong by however Chrome chose to split the
// tree, which is why this took the maximum only after a mutation run reported
// "/Count 8 but 41 page objects" on a deliberately tall document. The object
// count was right both times; the declared one was not.
function pdfPageCount(buf, where) {
  const s = buf.toString("latin1");
  const declared = [...s.matchAll(/\/Count\s+(\d+)/g)].map((m) => Number(m[1]));
  const objects = (s.match(/\/Type\s*\/Page[^s]/g) || []).length;
  if (!declared.length) { fail(where, "no /Count in the PDF — page count unverifiable, so nothing here is evidence"); return null; }
  if (!objects) { fail(where, "no /Type /Page objects in the PDF — the parser matched nothing"); return null; }
  const root = Math.max(...declared);
  if (root !== objects) fail(where, `PDF disagrees with itself: page tree says ${root}, ${objects} page objects`);
  return objects;
}

// ------------------------------------------------------------------- the run
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}`;

let browser;
try {
  browser = await chromium.launch();
} catch (err) {
  console.error("Could not launch Chromium — this gate cannot run, so it is not reporting a pass.");
  console.error(String(err).split("\n")[0]);
  console.error("Install it with: npx playwright install chromium");
  server.close();
  process.exit(2);
}

let checked = 0;
const pageCounts = [];
const page = await browser.newPage();

for (const grade of GRADES) {
  // Ask the app which units this grade offers rather than assuming ten.
  let units = UNITS;
  if (!units) {
    const manifest = path.join(ROOT, "english", `grade-${grade}`, "data", "course-manifest.json");
    if (!fs.existsSync(manifest)) { fail(`grade ${grade}`, "no course-manifest.json — cannot enumerate units"); continue; }
    const doc = JSON.parse(fs.readFileSync(manifest, "utf8"));
    units = (doc.units || []).map((u) => u.unit ?? u.number).filter((n) => Number.isInteger(n) && n > 0);
    if (!units.length) { fail(`grade ${grade}`, "course-manifest.json lists no units"); continue; }
  }

  for (const unit of units) {
    const where = `grade ${grade} unit ${unit}`;
    try {
      await page.goto(`${base}/english/index.html?grade=${grade}&unit=${unit}#teacher`, { waitUntil: "domcontentloaded" });
      await page.waitForFunction(
        () => document.querySelectorAll("#section-nav .nav-button[data-route]").length > 0,
        null, { timeout: 30000 },
      );
      await page.evaluate(() => {
        window.__sheets = {};
        window.open = function () {
          let buf = "";
          return {
            document: { open() {}, write(s) { buf += s; }, close() {}, readyState: "complete", fonts: { ready: Promise.resolve() } },
            focus() {}, addEventListener() {},
            print() { window.__sheets[window.__k] = buf; },
          };
        };
      });
      await page.evaluate(() => { location.hash = "#student"; });
      await page.waitForSelector("[data-print]", { timeout: 20000 });

      for (const sheet of SHEETS) {
        if (!(await page.$(`[data-print="${sheet}"]`))) continue; // not offered here
        await page.evaluate((k) => { window.__k = k; }, sheet);
        await page.click(`[data-print="${sheet}"]`);
        await page.waitForFunction((k) => window.__sheets[k], sheet, { timeout: 15000 });
        const html = await page.evaluate((k) => window.__sheets[k], sheet);
        const at = `${where} ${sheet}`;
        checked++;

        checkStructure(sheet, at, html);

        const sub = await browser.newPage();
        // Lay the sheet out at the PRINT width. A default 1280px viewport wraps
        // text differently from a 182mm page box, so row heights measured there
        // describe a page nobody prints — and the row-height assertion below is
        // the one thing standing in for break-inside: avoid's real limit.
        await sub.setViewportSize({ width: PAGE_W, height: PAGE_H });
        await sub.setContent(html, { waitUntil: "load" });
        await sub.evaluate(() => document.fonts.ready);

        // 1. Chrome's real print path.
        const pdf = await sub.pdf({ preferCSSPageSize: true, printBackground: true });
        const pages = pdfPageCount(pdf, at);
        if (pages !== null) {
          pageCounts.push({ grade, unit, sheet, pages });
          if (SINGLE_PAGE.has(sheet) && pages !== 1) {
            fail(at, `runs to ${pages} pages — this sheet is meant to fit one, and a second page here means a stranded heading or a split table`);
          }
          if (pages < 1) fail(at, "printed no pages");
        }

        // 2. Row heights against the page box. This is printCursiveWorksheet's
        //    lesson: break-inside: avoid is not honoured for an element taller
        //    than the page, so such a row splits however the rule is written.
        const tall = await sub.evaluate((h) => {
          return [...document.querySelectorAll("tr")]
            .map((r) => ({ h: Math.round(r.getBoundingClientRect().height), t: r.textContent.trim().slice(0, 40) }))
            .filter((r) => r.h > h);
        }, PAGE_H);
        for (const r of tall) fail(at, `a row is ${r.h}px against a ${PAGE_H}px page — taller than the page, so break-inside cannot hold it ("${r.t}…")`);

        // NOT CHECKED HERE, and the reason is worth more than the check would be.
        //
        // "Is a week heading left on a different page from its rows, and does a
        // row split across the boundary" needs real page fragmentation. The
        // tempting proxy is CSS multicolumn — Chrome fragments it with the same
        // engine as print — and it was written that way first. It is WRONG, and
        // measurably so: print reprints a spanning table's <thead> on the
        // continuation page and multicol does not, so content sits at different
        // offsets and headings fall on different sides of the boundary. On
        // 2026-09-02 that version reported 8 orphaned headings across grades
        // 2-8, and Chrome's own print output was checked by hand against all of
        // them: every one was fine, Grade 4 Unit 1's page 3 opening exactly as
        // it should with "Week 4 — 10 words" above its own header and rows.
        //
        // Answering it faithfully means reading text out of the PDF, and Chrome
        // writes one glyph id per Tj against a per-font ToUnicode CMap — a real
        // PDF parser or a pdfjs dependency, for a question whose two causes
        // (the two break rules) are already asserted above and whose third (a
        // row taller than the page) is measured directly. So it is left out
        // rather than approximated. A check that reports false failures is worse
        // than an absent one: it gets routed around, and then so does the rest.
        await sub.close();
      }
    } catch (err) {
      fail(where, `could not render — ${String(err).split("\n")[0].slice(0, 140)}`);
    }
  }
}

await browser.close();
server.close();

// ------------------------------------------------------------------- verdict
const byCount = pageCounts.reduce((acc, r) => { (acc[r.sheet] = acc[r.sheet] || []).push(r.pages); return acc; }, {});
for (const [sheet, counts] of Object.entries(byCount)) {
  console.log(`${sheet.padEnd(18)} ${counts.length} printed | pages ${Math.min(...counts)}-${Math.max(...counts)}`);
}
console.log(`\n${checked} sheet(s) rendered through Chrome's print engine.`);

// Findings are printed whatever else is wrong. Reporting them only once the
// floor is satisfied would let a run that came up short hide real defects
// behind a complaint about its own coverage.
if (findings.length) {
  console.error(`\n${findings.length} finding(s):`);
  for (const f of findings) console.error(`  ✗ ${f}`);
}
if (checked < MIN_SHEETS) {
  console.error(`\nOnly ${checked} sheets were checked, below the floor of ${MIN_SHEETS}.`);
  console.error("Something stopped the sweep reaching the content; this run is not evidence of anything.");
  console.error("(--grade/--unit narrow on purpose; the floor is for a full run that came up short.)");
  process.exitCode = 2;
} else if (findings.length) {
  process.exitCode = 1;
} else {
  console.log("✓ every sheet fits the page it is meant to, no row is taller than the page,");
  console.log("  and each keeps the four print rules and the <thead> its pagination rests on.");
  console.log("  Not observed: that Chrome reprints a header on a continuation page — see the");
  console.log("  note in this file for why that is asserted structurally rather than measured.");
}
