import { chromium } from "playwright";
import { pathToFileURL } from "url";
import path from "path";
import { fileURLToPath } from "url";
/* the lessons sit one level up from checks/ - resolve against THIS file so the
   checker works from anywhere, not only when the shell happens to be cd'd into
   the lesson directory */
const L = (f) => path.join(path.dirname(fileURLToPath(import.meta.url)), "..", f);

const LESSONS = [
  ["up-to-a-thousand.html", 14],
  ["adding-and-money.html", 9],
  ["rows-and-rules.html", 14],
  ["equal-parts.html", 12],
  ["shapes-and-symmetry.html", 11],
  ["measure-it.html", 8],
  ["time-and-direction.html", 7],
  ["ask-count-chart.html", 13],
  ["index.html", 0],
];

const b = await chromium.launch();
const findings = [];
const note = (f, s, msg) => findings.push(`${f}${s === null ? "" : " s" + (s + 1)}: ${msg}`);

for (const [file, slides] of LESSONS) {
  const ctx = await b.newContext({ viewport: { width: 1200, height: 1000 } });
  const p = await ctx.newPage();
  await p.goto(pathToFileURL(L(file)).href);

  // ---------- page-level ----------
  const page = await p.evaluate(() => {
    const out = {};
    out.h1 = document.querySelectorAll("h1").length;
    out.headings = [...document.querySelectorAll("h1,h2,h3")].map((h) => Number(h.tagName[1]));
    out.svgNoLabel = [...document.querySelectorAll("svg")].filter((s) => {
      if (s.closest("button, a")) return false;                      // decorative inside a labelled control
      if (s.getAttribute("aria-hidden") === "true") return false;
      return !(s.getAttribute("role") === "img" && (s.getAttribute("aria-label") || "").length > 3);
    }).map((s) => s.id || s.className.baseVal || "svg");
    out.reducedMotion = [...document.styleSheets].some((sh) => { try { return [...sh.cssRules].some((r) => r.conditionText && /prefers-reduced-motion/.test(r.conditionText)); } catch (e) { return false; } });
    return out;
  });
  if (page.h1 !== 1) note(file, null, `${page.h1} <h1> elements`);
  for (let i = 1; i < page.headings.length; i++) {
    if (page.headings[i] - page.headings[i - 1] > 1) { note(file, null, `heading level jumps h${page.headings[i - 1]} -> h${page.headings[i]}`); break; }
  }
  page.svgNoLabel.forEach((s) => note(file, null, `svg "${s}" has no role="img" + aria-label and is not aria-hidden`));
  if (!page.reducedMotion) note(file, null, "no prefers-reduced-motion rule anywhere in the stylesheet");

  const N = slides || 1;
  for (let i = 0; i < N; i++) {
    if (slides) await p.click(`#dots button[data-i="${i}"]`);

    const g = await p.evaluate(() => {
      const scope = document.querySelector(".slide.active") || document.body;
      const vis = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
      const focusable = "a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex='-1'])";
      const nameOf = (el) => (el.getAttribute("aria-label") || el.textContent || "").trim();

      // anything the CSS invites a click on, that the keyboard cannot reach
      const pointer = [...scope.querySelectorAll("*")].filter((el) => {
        if (!vis(el)) return false;
        if (getComputedStyle(el).cursor !== "pointer") return false;
        return !el.matches(focusable) && !el.closest(focusable);
      }).map((el) => (el.tagName.toLowerCase() + (el.id ? "#" + el.id : "") + (el.className.baseVal !== undefined ? "." + el.className.baseVal : el.className ? "." + String(el.className).split(" ")[0] : "")));

      const controls = [...scope.querySelectorAll(focusable)].filter(vis);
      const unnamed = controls.filter((el) => nameOf(el).length === 0).map((el) => el.tagName.toLowerCase() + (el.id ? "#" + el.id : "") + "." + String(el.className));
      const small = controls.filter((el) => { const r = el.getBoundingClientRect(); return r.width < 24 || r.height < 24; })
        .map((el) => (el.id || el.className || el.tagName) + " " + Math.round(el.getBoundingClientRect().width) + "x" + Math.round(el.getBoundingClientRect().height));

      // feedback that changes without being announced
      const fb = [...scope.querySelectorAll(".fb, .score")].filter(vis).filter((el) => {
        const live = el.closest("[aria-live]");
        return !live;
      }).map((el) => el.id || "fb");

      // contrast of every visible text node against the ground actually painted behind it
      /* composite every translucent layer down to the first opaque one - a
         rgba(255,255,255,.07) panel is NOT a white background */
      const bgOf = (el) => {
        const layers = [];
        let n = el;
        while (n) {
          const c = getComputedStyle(n).backgroundColor;
          const m = c && c.match(/[\d.]+/g);
          if (m) {
            const a = m.length > 3 ? Number(m[3]) : 1;
            if (a > 0) { layers.push([Number(m[0]), Number(m[1]), Number(m[2]), a]); if (a >= 0.999) break; }
          }
          n = n.parentElement;
        }
        layers.push([255, 255, 255, 1]);
        let out = layers[layers.length - 1].slice(0, 3);
        for (let k = layers.length - 2; k >= 0; k--) {
          const [r, g2, b2, a] = layers[k];
          out = [r * a + out[0] * (1 - a), g2 * a + out[1] * (1 - a), b2 * a + out[2] * (1 - a)];
        }
        return "rgb(" + out.map(Math.round).join(", ") + ")";
      };
      const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
      const L = (c) => { const n = c.match(/[\d.]+/g).map(Number); return 0.2126 * lin(n[0]) + 0.7152 * lin(n[1]) + 0.0722 * lin(n[2]); };
      const ratio = (a, bb) => { const l1 = L(a), l2 = L(bb); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };
      const low = [];
      [...scope.querySelectorAll("*")].forEach((el) => {
        if (!vis(el)) return;
        const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
        if (!own) return;
        const cs = getComputedStyle(el);
        const size = parseFloat(cs.fontSize), weight = Number(cs.fontWeight) || 400;
        const large = size >= 24 || (size >= 18.66 && weight >= 700);
        const fg = (function () { const m = cs.color.match(/[\d.]+/g); if (!m || m.length < 4 || Number(m[3]) >= 0.999) return cs.color; const a = Number(m[3]); const bb = bgOf(el).match(/[\d.]+/g).map(Number); return "rgb(" + [0,1,2].map((k) => Math.round(Number(m[k]) * a + bb[k] * (1 - a))).join(", ") + ")"; })();
        const r = ratio(fg, bgOf(el));
        if (r < (large ? 3 : 4.5)) low.push((el.id || el.className || el.tagName) + " " + r.toFixed(2) + ":1 @" + Math.round(size) + "px");
      });
      return { pointer: [...new Set(pointer)], unnamed, small, fb: [...new Set(fb)], low: [...new Set(low)], nControls: controls.length };
    });

    g.pointer.forEach((s) => note(file, slides ? i : null, `clickable but not keyboard-reachable: ${s}`));
    g.unnamed.forEach((s) => note(file, slides ? i : null, `control with no accessible name: ${s}`));
    g.small.forEach((s) => note(file, slides ? i : null, `touch target under 24px: ${s}`));
    g.low.forEach((s) => note(file, slides ? i : null, `contrast below WCAG AA: ${s}`));
    if (g.fb.length) note(file, slides ? i : null, `feedback not in a live region: ${g.fb.join(", ")}`);
  }

  // keyboard: tab for real and see where focus actually lands
  if (slides) {
    await p.click('#dots button[data-i="0"]');
    await p.evaluate(() => document.body.focus());
    let onHidden = 0, stops = 0;
    for (let k = 0; k < 90; k++) {
      await p.keyboard.press("Tab");
      const w = await p.evaluate(() => {
        const a = document.activeElement;
        if (!a || a === document.body) return null;
        const s = a.closest(".slide");
        return { hidden: !!(s && !s.classList.contains("active")), id: a.id || String(a.className).slice(0, 24) };
      });
      if (!w) break;
      stops++;
      if (w.hidden) onHidden++;
    }
    if (onHidden) note(file, null, `${onHidden} of ${stops} tab stops land on a hidden slide`);
    if (stops < 4) note(file, null, `only ${stops} tab stops on the opening slide`);
  }
  await ctx.close();
}

console.log("findings: " + findings.length);
const byKind = {};
findings.forEach((f) => { const k = f.replace(/^[^:]+: /, "").replace(/:.*$/, "").replace(/ [\d.]+.*/, ""); byKind[k] = (byKind[k] || 0) + 1; });
console.log(byKind);
console.log("---");
findings.slice(0, 60).forEach((f) => console.log(" " + f));
if (findings.length > 60) console.log(` ... and ${findings.length - 60} more`);
await b.close();
