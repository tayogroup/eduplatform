import { chromium } from "playwright";
import { pathToFileURL } from "url";
import path from "path";
import { fileURLToPath } from "url";

/* Which coloured chips does Grade 3 actually draw, and what is painted behind
   the text on them?

   align-g1v2-to-template.py warns in its own header that colouring text for a
   background it does not sit on is how its first pass broke two things it had
   not measured. Grade 3 has different components from Grade 1, so the chip half
   of that change cannot be copied across on faith. This walks every slide of
   every lesson, finds each candidate selector, and reports the computed colour,
   the ground actually composited behind it, and the contrast. */

const HERE = path.dirname(fileURLToPath(import.meta.url));
const L = (f) => path.join(HERE, "..", f);
const LESSONS = [
  ["up-to-a-thousand.html", 14],
  ["adding-and-money.html", 9],
  ["rows-and-rules.html", 14],
  ["equal-parts.html", 12],
  ["shapes-and-symmetry.html", 11],
  ["measure-it.html", 8],
  ["time-and-direction.html", 7],
  ["ask-count-chart.html", 13],
];
const SELECTORS = [".slide-head .n", ".say button", ".big.teal", ".chiprow button.on", ".grid100 button.on", ".likely button.on", ".compass .mid"];

const b = await chromium.launch();
const seen = new Map();

for (const [file, n] of LESSONS) {
  for (const theme of ["light", "dark"]) {
    const ctx = await b.newContext({ viewport: { width: 1200, height: 1000 }, colorScheme: theme });
    const p = await ctx.newPage();
    await p.goto(pathToFileURL(L(file)).href);
    for (let i = 0; i < n; i++) {
      await p.click(`#dots button[data-i="${i}"]`);
      const rows = await p.evaluate((sels) => {
        const bgOf = (el) => {
          const layers = [];
          let node = el;
          while (node) {
            const c = getComputedStyle(node).backgroundColor;
            const m = c && c.match(/[\d.]+/g);
            if (m) {
              const a = m.length > 3 ? Number(m[3]) : 1;
              if (a > 0) { layers.push([Number(m[0]), Number(m[1]), Number(m[2]), a]); if (a >= 0.999) break; }
            }
            node = node.parentElement;
          }
          layers.push([255, 255, 255, 1]);
          let out = layers[layers.length - 1].slice(0, 3);
          for (let k = layers.length - 2; k >= 0; k--) {
            const [r, g, bb, a] = layers[k];
            out = [r * a + out[0] * (1 - a), g * a + out[1] * (1 - a), bb * a + out[2] * (1 - a)];
          }
          return out.map(Math.round);
        };
        const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
        const lum = (c) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
        const out = [];
        const scope = document.querySelector(".slide.active") || document.body;
        for (const sel of sels) {
          for (const el of scope.querySelectorAll(sel)) {
            const r = el.getBoundingClientRect();
            if (!r.width || !r.height) continue;
            if (!el.textContent.trim()) continue;
            const cs = getComputedStyle(el);
            const fg = (cs.color.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
            const bg = bgOf(el);
            const l1 = lum(fg), l2 = lum(bg);
            out.push({
              sel,
              fg: cs.color,
              bg: "rgb(" + bg.join(", ") + ")",
              bgLum: Number(l2.toFixed(3)),
              ratio: Number(((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)).toFixed(2)),
            });
          }
        }
        return out;
      }, SELECTORS);
      for (const r of rows) {
        const key = `${r.sel} | ${theme} | fg ${r.fg} on ${r.bg}`;
        if (!seen.has(key)) seen.set(key, { ...r, theme, where: `${file} s${i + 1}`, count: 0 });
        seen.get(key).count++;
      }
    }
    await ctx.close();
  }
}
await b.close();

const rows = [...seen.values()].sort((a, b2) => a.sel.localeCompare(b2.sel) || a.ratio - b2.ratio);
if (!rows.length) { console.log("none of these selectors draws visible text anywhere in Grade 3."); process.exit(0); }
console.log("sel".padEnd(22), "theme".padEnd(6), "ratio".padEnd(7), "bg-luminance", " colour on ground");
for (const r of rows) {
  const light = r.bgLum > 0.35 ? "LIGHT chip" : r.bgLum < 0.12 ? "dark" : "mid";
  console.log(
    r.sel.padEnd(22), r.theme.padEnd(6), String(r.ratio).padEnd(7), String(r.bgLum).padEnd(12),
    light.padEnd(11), r.fg, "on", r.bg, ` (${r.count}x, first ${r.where})`
  );
}
const fails = rows.filter((r) => r.ratio < 4.5);
console.log("\nbelow 4.5:1 today:", fails.length);
