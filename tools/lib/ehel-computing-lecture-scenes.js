/* The browser half of tools/create-ehel-computing-unit-lecture.js.
 *
 * One function matters: window.EHEL_FILM.frame(t) paints the whole 1280x720
 * composition for the absolute time t, and returns nothing. Nothing here
 * animates itself - no CSS transition, no requestAnimationFrame - because the
 * renderer screenshots frames one at a time and a self-animating page would
 * hand it whatever the clock happened to say. Every moving thing is a pure
 * function of t, so frame(12.5) draws the same pixels on the tenth run as on
 * the first.
 *
 * The engine (the timeline, the speech cues, the chrome, the caption band,
 * the two cards) is the maths film's, which is the science film's with cues
 * added. The pictures are this lesson's: Grade 1 Computing Lesson 8,
 * "Computers Everywhere". The lesson draws its machines as HTML and emoji
 * inside interactive renderers (computing.js), so there is nothing pure to
 * lift out; every machine here is drawn fresh, in the colours of the kit's own
 * hardware drawings, and it moves as it is named - a call rings, a rainbow is
 * painted, letters travel down a cable, a drum fills and spins, a rover drives.
 *
 * Each scene draws ONE svg in a 1168 x 440 space, so every position below is
 * a position in that box.
 */
(function () {
  "use strict";

  var F = window.FILM;            /* the storyboard, plus the measured timeline */
  var GAP = 0.22;                 /* the tool's GAP_BEAT: the pause between two beats */

  var esc = function (s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  };

  /* ---- easing ------------------------------------------------------- */
  var clamp = function (v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; };
  var ease = function (v) { v = clamp(v, 0, 1); return v * v * (3 - 2 * v); };
  var inAt = function (t, at, span) { return ease((t - at) / (span || 0.45)); };
  var lerp = function (a, b, u) { return a + (b - a) * u; };
  /* 0 -> 1 -> 0 over span: a flash that comes and goes */
  var bump = function (t, at, span) {
    if (at == null) return 0;
    var u = (t - at) / span;
    return u <= 0 || u >= 1 ? 0 : Math.sin(Math.PI * u);
  };
  var breathe = function (t) { return 0.5 + 0.5 * Math.sin(t * 3.6); };
  /* inAt that stays at 0 for a cue the beat does not name */
  var on = function (t, at, span) { return at == null ? 0 : inAt(t, at, span); };
  /* 0, then an overshoot to 1.1, settling on 1: a thing that pops in */
  var popIn = function (t, at, span) {
    if (at == null || t < at) return 0;
    var u = (t - at) / (span || 0.4);
    if (u < 1) return ease(u) * 1.1;
    return 1 + 0.1 * Math.exp(-(u - 1) * 5);
  };
  var n2 = function (v) { return String(Math.round(v * 100) / 100); };
  var n3 = function (v) { return String(Math.round(v * 1000) / 1000); };
  var pad2 = function (v) { return (v < 10 ? "0" : "") + v; };

  /* ---- the timeline --------------------------------------------------- */
  var BEATS = F.beats;
  var TOTAL = F.total;

  function beatAt(t) {
    for (var i = 0; i < BEATS.length; i++) if (t < BEATS[i].end) return i;
    return BEATS.length - 1;
  }

  function field(i, name, dflt) {
    for (var k = i; k >= 0; k--) {
      var b = BEATS[k];
      if (b.art && b.art[name] != null) return b.art[name];
      if (k < i && b.scene !== BEATS[i].scene) break;
    }
    return dflt;
  }

  /* ---- speech cues ------------------------------------------------------
     The maths film's, unchanged: a beat may name phrases in art.at, and cue()
     places each one in time by where it sits in the sentence (a comma adds a
     short pause, a full stop a longer one). Every phrase is checked against
     its narration when this file loads, so a reworded line stops the render
     with the beat named instead of quietly mistiming the picture. */
  var LEAD_IN = 0.12, TAIL_OUT = 0.3;

  function spokenWeights(say) {
    var w = [], total = 0;
    for (var k = 0; k < say.length; k++) {
      var ch = say.charAt(k), nx = say.charAt(k + 1), x = 1;
      if (ch === "," || ch === ";") x += 3;
      else if ((ch === "." || ch === ":" || ch === "?" || ch === "!") && (nx === " " || nx === "")) x += 7;
      else if ((ch === "-" || ch === "–" || ch === "—") && say.charAt(k - 1) === " ") x += 3;
      w.push(total);
      total += x;
    }
    w.push(total);
    return w;
  }
  var WEIGHTS = BEATS.map(function (b) { return spokenWeights(b.say || ""); });

  BEATS.forEach(function (b, n) {
    var at = b.art && b.art.at;
    if (!at) return;
    Object.keys(at).forEach(function (name) {
      if ((b.say || "").indexOf(at[name]) < 0)
        throw new Error("storyboard beat " + (n + 1) + ': cue "' + name + '" is "' + at[name] +
          '", which that beat does not say');
    });
  });

  function speakTime(i, k) {
    var b = BEATS[i], w = WEIGHTS[i];
    var s0 = b.start + LEAD_IN, s1 = Math.max(b.start + b.dur - TAIL_OUT, s0 + 0.5);
    return s0 + (w[k] / w[w.length - 1]) * (s1 - s0);
  }
  /* when the phrase named `name` begins in beat i; null if the beat names none */
  function cue(i, name) {
    if (i < 0 || i >= BEATS.length) return null;
    var at = BEATS[i].art && BEATS[i].art.at;
    if (!at || at[name] == null) return null;
    return speakTime(i, BEATS[i].say.indexOf(at[name]));
  }
  function spokenEnd(i) { return speakTime(i, BEATS[i].say.length); }

  /* the k-th beat of a scene, and a cue in it */
  function sb(scene, k) { return scene.first + k; }
  function sc(scene, k, name) { return k < scene.beats.length ? cue(scene.first + k, name) : null; }

  /* how many of n have been reached by t, counting across span from at */
  function tally(t, at, n, span) {
    if (at == null || t < at) return 0;
    if (n < 2) return n;
    return Math.min(n, 1 + Math.floor((t - at) / (span / (n - 1)) + 1e-9));
  }

  /* ---- colour ----------------------------------------------------------
     The lesson's dark tokens (see the film's CSS header), and the colours of
     the kit's own hardware drawings. */
  var P = {
    ground: "#0B1D2C", card: "#112A3D", cell: "#17384F", line: "#214560",
    ink: "#FFFFFF", muted: "#93AABE", accent: "#E9744F", teal: "#35BFB2",
    tealSoft: "#143A4A", plum: "#B78BD1", gold: "#F4C95D", goldDeep: "#D0A326",
    good: "#4FD1A0", bad: "#F0806F", blue: "#6E9DE8",
    body: "#2B5673", edge: "#93AABE", glass: "#0B1D2C", plastic: "#B9C8D6",
    dark: "#142B3E", paper: "#F7F4EC", night: "#0E2434", grass: "#3E8E4A", sky: "#DDEFF7"
  };
  var TILE = [P.teal, P.gold, P.plum, P.accent, P.good, P.blue];

  /* Each scene owns a colour, as in the science and maths films, so the film
     reads as chapters. */
  var HUE = {
    title: P.teal, kinds: P.blue, jobs: P.gold, apps: P.plum, inputs: P.teal,
    outputs: P.accent, hidden: P.good, robots: P.gold, recap: P.teal
  };

  /* ---- svg ---------------------------------------------------------------- */
  function att(o) {
    var s = "";
    for (var k in o) {
      var v = o[k];
      if (v == null || v === false) continue;
      s += " " + k + '="' + (typeof v === "number" ? n2(v) : v) + '"';
    }
    return s;
  }
  function el(tag, o, inner) { return "<" + tag + att(o) + (inner == null ? "/>" : ">" + inner + "</" + tag + ">"); }
  function G(inner, o) { return el("g", o || {}, inner); }
  function tr(x, y, s) { return "translate(" + n2(x) + "," + n2(y) + ")" + (s != null && s !== 1 ? " scale(" + n3(s) + ")" : ""); }
  /* scale s about the point (cx, cy) */
  function around(cx, cy, s) {
    return "translate(" + n2(cx) + "," + n2(cy) + ") scale(" + n3(s) + ") translate(" + n2(-cx) + "," + n2(-cy) + ")";
  }
  function R(x, y, w, h, rx, fill, stroke, sw, extra) {
    return el("rect", Object.assign({ x: x, y: y, width: Math.max(0, w), height: Math.max(0, h), rx: rx, fill: fill || "none", stroke: stroke, "stroke-width": sw }, extra || {}));
  }
  function C(cx, cy, r, fill, stroke, sw, extra) {
    return el("circle", Object.assign({ cx: cx, cy: cy, r: Math.max(0, r), fill: fill || "none", stroke: stroke, "stroke-width": sw }, extra || {}));
  }
  function E(cx, cy, rx, ry, fill, stroke, sw, extra) {
    return el("ellipse", Object.assign({ cx: cx, cy: cy, rx: Math.max(0, rx), ry: Math.max(0, ry), fill: fill || "none", stroke: stroke, "stroke-width": sw }, extra || {}));
  }
  function L(x1, y1, x2, y2, stroke, sw, extra) {
    return el("line", Object.assign({ x1: x1, y1: y1, x2: x2, y2: y2, stroke: stroke, "stroke-width": sw, "stroke-linecap": "round" }, extra || {}));
  }
  function Pth(d, fill, stroke, sw, extra) {
    return el("path", Object.assign({ d: d, fill: fill || "none", stroke: stroke, "stroke-width": sw, "stroke-linecap": "round", "stroke-linejoin": "round" }, extra || {}));
  }
  /* A fill or a font-size given here goes into style, not an attribute: the
     .lab classes set both in CSS, and a stylesheet rule beats a presentation
     attribute, so an attribute would be silently ignored (the first cut drew
     every coloured word white for exactly that reason). */
  function Tx(x, y, s, cls, anchor, extra) {
    var o = Object.assign({ x: x, y: y, "class": cls, "text-anchor": anchor || "start" }, extra || {}), st = "";
    if (o.fill != null) { st += "fill:" + o.fill + ";"; delete o.fill; }
    if (o["font-size"] != null) { st += "font-size:" + n2(o["font-size"]) + "px;"; delete o["font-size"]; }
    if (st) o.style = st;
    return el("text", o, esc(s));
  }
  /* an emoji, centred on (x, y) */
  function Em(x, y, size, ch, extra) {
    return el("text", Object.assign({ x: x, y: y, "font-size": size, "text-anchor": "middle", "dominant-baseline": "central" }, extra || {}), ch);
  }
  /* points along a polyline, by distance */
  function polyLen(pts) {
    var d = 0;
    for (var k = 1; k < pts.length; k++) d += Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]);
    return d;
  }
  function polyAt(pts, s) {
    for (var k = 1; k < pts.length; k++) {
      var seg = Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]);
      if (s <= seg || k === pts.length - 1) {
        var u = seg ? clamp(s / seg, 0, 1) : 0;
        return [lerp(pts[k - 1][0], pts[k][0], u), lerp(pts[k - 1][1], pts[k][1], u), k - 1];
      }
      s -= seg;
    }
    return [pts[pts.length - 1][0], pts[pts.length - 1][1], pts.length - 2];
  }
  /* a cubic cable from (a) to (b), and a point on it */
  function cable(ax, ay, bx, by) {
    var mx = (ax + bx) / 2;
    return { d: "M" + n2(ax) + "," + n2(ay) + " C" + n2(mx) + "," + n2(ay) + " " + n2(mx) + "," + n2(by) + " " + n2(bx) + "," + n2(by),
      at: function (u) {
        var v = 1 - u;
        return [v * v * v * ax + 3 * v * v * u * mx + 3 * v * u * u * mx + u * u * u * bx,
                v * v * v * ay + 3 * v * v * u * ay + 3 * v * u * u * by + u * u * u * by];
      } };
  }

  /* ---- chrome -------------------------------------------------------- */
  function chrome(scene, t) {
    var pct = clamp(t / TOTAL, 0, 1) * 100;
    return '<header class="bar">' +
      '<span class="mark">E</span>' +
      '<span class="brand">Ehel Academy<b>' + esc(F.subtitle) + "</b></span>" +
      '<span class="unit">' + esc(F.title) + "</span>" +
      "</header>" +
      '<div class="rail"><i style="width:' + pct.toFixed(3) + '%"></i></div>';
  }

  function heading(scene, t, i) {
    if (!scene.heading) return "";
    var at = BEATS[scene.first].start;
    var a = inAt(t, at, 0.55), b = inAt(t, at + 0.12, 0.55);
    var cs = (scene.codes || []).map(function (c) { return "<span>" + esc(c) + "</span>"; }).join("");
    return '<div class="kicker" style="opacity:' + b.toFixed(3) + '">' +
        '<i class="dot"></i>' +
        '<span class="eyebrow">Chapter ' + (BEATS[i].scene + 1) + " of " + F.scenes.length + "</span>" +
        (cs ? '<div class="codes">' + cs + "</div>" : "") +
      "</div>" +
      '<h2 class="sceneh" style="opacity:' + a.toFixed(3) +
      ";transform:translateY(" + ((1 - a) * 16).toFixed(2) + 'px)">' + esc(scene.heading) + "</h2>";
  }

  function band(beat, t) {
    var o = inAt(t, beat.start, 0.34);
    return '<footer class="band">' +
      '<p style="opacity:' + o.toFixed(3) + ";transform:translateY(" + ((1 - o) * 9).toFixed(2) + 'px)">' +
      esc(beat.say) + "</p></footer>";
  }

  /* one drawing per scene */
  function svg(inner) {
    return '<div class="scene"><svg class="sf" viewBox="0 0 1168 440" xmlns="http://www.w3.org/2000/svg">' + inner + "</svg></div>";
  }

  /* How far the change INTO beat i has gone: it starts in the pause before the
     beat, so the picture is already moving when the voice arrives. */
  function into(t, i) { return inAt(t, BEATS[i].start - GAP, 0.5); }
  /* the previous beat's picture, fading out, and this one's, fading in */
  function crossfade(t, i, scene, draw) {
    var u = into(t, i), out = "";
    if (u < 1 && i > scene.first) out += G(draw(i - 1), { opacity: 1 - u });
    return out + G(draw(i), { opacity: u });
  }

  /* ==== marks: a chip, a tick, a cross, a tap ============================== */

  /* The computer itself, wherever one hides: a chip with its pins. glow 0..1. */
  function chip(cx, cy, s, glow) {
    var h = s / 2, pin = s * 0.2, sw = s * 0.07, out = "";
    if (glow > 0) out += C(cx, cy, s * 1.3, P.gold, null, null, { opacity: 0.22 * glow });
    for (var k = -1; k <= 1; k++) {
      var o = k * s * 0.26;
      out += L(cx - h - pin, cy + o, cx - h, cy + o, P.gold, sw) + L(cx + h, cy + o, cx + h + pin, cy + o, P.gold, sw) +
             L(cx + o, cy - h - pin, cx + o, cy - h, P.gold, sw) + L(cx + o, cy + h, cx + o, cy + h + pin, P.gold, sw);
    }
    return out + R(cx - h, cy - h, s, s, s * 0.16, P.cell, P.gold, sw) +
      R(cx - s * 0.22, cy - s * 0.22, s * 0.44, s * 0.44, s * 0.06, P.gold, null, null, { opacity: 0.55 + 0.45 * (glow || 0) });
  }

  function tick(cx, cy, r, p) {
    if (!(p > 0)) return "";
    return G(C(cx, cy, r, "rgba(79,209,160,0.22)", P.good, r * 0.12) +
      Pth("M" + n2(cx - r * 0.42) + "," + n2(cy + r * 0.02) + " L" + n2(cx - r * 0.1) + "," + n2(cy + r * 0.34) +
        " L" + n2(cx + r * 0.46) + "," + n2(cy - r * 0.32), null, P.good, r * 0.2),
      { transform: around(cx, cy, p), opacity: Math.min(1, p) });
  }

  function cross(cx, cy, r, p, col) {
    if (!(p > 0)) return "";
    col = col || P.bad;
    var d = r * 0.36;
    return G(C(cx, cy, r, "rgba(240,128,111,0.18)", col, r * 0.12) +
      L(cx - d, cy - d, cx + d, cy + d, col, r * 0.2) + L(cx + d, cy - d, cx - d, cy + d, col, r * 0.2),
      { transform: around(cx, cy, p), opacity: Math.min(1, p) });
  }

  function qmark(cx, cy, r, o) {
    if (!(o > 0)) return "";
    return G(C(cx, cy, r, P.cell, P.line, 2) + Tx(cx, cy + r * 0.42, "?", "lab muted", "middle", { "font-size": r * 1.2 }), { opacity: o });
  }

  /* a tap: a ring that spreads and fades */
  function ripple(x, y, t, at, col) {
    if (at == null || t < at || t > at + 0.8) return "";
    var u = (t - at) / 0.8;
    return C(x, y, 8 + 36 * u, "none", col || P.ink, 1 + 4 * (1 - u), { opacity: 1 - u }) +
      (u < 0.3 ? C(x, y, 11, col || P.ink, null, null, { opacity: 0.55 * (1 - u / 0.3) }) : "");
  }

  /* a pointing finger whose tip is at (x, y) */
  function finger(x, y, op) {
    if (!(op > 0)) return "";
    return G(Em(x + 5, y + 27, 50, "👆"), { opacity: op });
  }

  /* a small sun-and-hills picture: what a camera takes, a screen shows, a printer prints */
  function picture(x, y, w, h) {
    return R(x, y, w, h, 3, P.sky) + C(x + w * 0.72, y + h * 0.3, h * 0.15, P.gold) +
      Pth("M" + n2(x) + "," + n2(y + h) + " L" + n2(x) + "," + n2(y + h * 0.72) +
        " Q" + n2(x + w * 0.3) + "," + n2(y + h * 0.42) + " " + n2(x + w * 0.56) + "," + n2(y + h * 0.72) +
        " Q" + n2(x + w * 0.8) + "," + n2(y + h * 0.56) + " " + n2(x + w) + "," + n2(y + h * 0.68) +
        " L" + n2(x + w) + "," + n2(y + h) + " Z", P.grass);
  }

  /* the six coloured program tiles of the kit's tablet drawing, fitted to a w x h screen */
  function tiles(w, h, t, at) {
    var s = Math.min(w / 3.7, h / 2.6), gx = s * 1.18, out = "";
    for (var k = 0; k < 6; k++) {
      var cx = w / 2 + ((k % 3) - 1) * gx, cy = h / 2 + (Math.floor(k / 3) - 0.5) * s * 1.18;
      var p = at == null ? 1 : popIn(t, at + k * 0.12, 0.3);
      if (p <= 0) continue;
      out += G(R(cx - s * 0.42, cy - s * 0.42, s * 0.84, s * 0.84, s * 0.2, TILE[k]), { transform: around(cx, cy, p) });
    }
    return out;
  }

  function keysGrid(x, y, cols, rows, kw, kh, fill) {
    var s = "";
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) s += R(x + c * (kw + 2), y + r * (kh + 2), kw, kh, 1.5, fill);
    return s;
  }

  /* ==== computers ============================================================= */

  /* A laptop, front view, 440 x 306; its screen is 408 x 248 at (16, 16) and
     `inner` is drawn in the screen's own coordinates. */
  function laptop(x, y, s, inner, id, op) {
    return G(
      el("clipPath", { id: id }, R(16, 16, 408, 248, 6)) +
      R(0, 0, 440, 280, 16, P.body, P.edge, 5) +
      R(16, 16, 408, 248, 6, P.glass) +
      G(G(inner || "", { transform: "translate(16,16)" }), { "clip-path": "url(#" + id + ")" }) +
      C(220, 8, 3.5, P.glass, P.edge, 1.5) +
      Pth("M-30,280 L470,280 L452,306 L-12,306 Z", P.edge) +
      R(180, 283, 80, 6, 3, P.body),
      { transform: tr(x, y, s), opacity: op });
  }

  /* A tablet, portrait, w x h; its screen is (w-24) x (h-74) at (12, 34). */
  function tabletP(x, y, w, h, inner, id, op) {
    var sw = w - 24, sh = h - 74;
    return G(
      el("clipPath", { id: id }, R(12, 34, sw, sh, 6)) +
      R(0, 0, w, h, 24, P.body, P.edge, 4) +
      R(12, 34, sw, sh, 6, P.glass) +
      G(G(inner || "", { transform: "translate(12,34)" }), { "clip-path": "url(#" + id + ")" }) +
      C(w / 2, 18, 4, P.glass, P.edge, 1.5) +
      C(w / 2, h - 20, 9, P.glass, P.edge, 2),
      { transform: tr(x, y), opacity: op });
  }

  /* A smartphone, w x h; its screen is (w-12) x (h-34) at (6, 17). */
  function phone(x, y, w, h, inner, id, op) {
    return G(
      el("clipPath", { id: id }, R(6, 17, w - 12, h - 34, 4)) +
      R(0, 0, w, h, 13, P.body, P.edge, 3) +
      R(6, 17, w - 12, h - 34, 4, P.glass) +
      G(G(inner || "", { transform: "translate(6,17)" }), { "clip-path": "url(#" + id + ")" }) +
      R(w / 2 - 9, 7, 18, 4, 2, P.glass),
      { transform: tr(x, y), opacity: op });
  }

  /* A desktop computer: the tower, the monitor, the keyboard and the mouse.
     330 x 212, standing on y = 210; its screen is 210 x 130 at (96, 20). */
  function desktop(x, y, s, inner, id, op) {
    return G(
      R(0, 40, 72, 170, 8, P.body, P.edge, 4) + L(12, 62, 60, 62, P.edge, 3) + L(12, 74, 60, 74, P.edge, 3) +
      C(36, 186, 5, P.teal) +
      el("clipPath", { id: id }, R(96, 20, 210, 130, 4)) +
      R(86, 10, 230, 150, 10, P.body, P.edge, 4) + R(96, 20, 210, 130, 4, P.glass) +
      G(G(inner || "", { transform: "translate(96,20)" }), { "clip-path": "url(#" + id + ")" }) +
      R(188, 160, 26, 20, 3, P.edge) + R(160, 178, 82, 7, 3, P.edge) +
      R(100, 190, 190, 20, 5, P.edge) + keysGrid(105, 193, 11, 2, 14.5, 5.5, P.body) +
      E(312, 199, 11, 14, P.plastic, P.edge, 2),
      { transform: tr(x, y, s), opacity: op });
  }

  /* ==== the eight inputs and outputs, each centred on (cx, cy) ============== */

  var HELLO_KEYS = [21, 11, 26, 26, 17];   /* the keys that spell h, e, l, l, o */
  function kbd(cx, cy, o) {
    var x = cx - 56, y = cy - 22, out = R(x, y, 112, 44, 7, P.plastic, P.edge, 2);
    var hot = o.act == null || o.act < 0 ? -1 : Math.floor(o.act / 0.16);
    for (var r = 0; r < 3; r++) for (var c = 0; c < 9; c++) {
      var k = r * 9 + c, press = hot >= 0 && hot < 5 && HELLO_KEYS[hot] === k;
      out += R(x + 6 + c * 11.4, y + 6 + r * 10.8, 9, 8, 1.5, press ? P.gold : P.body);
    }
    return out;
  }

  function mouseDev(cx, cy, o) {
    var dx = o.act != null && o.act > 0 ? 7 * Math.sin(o.act * 5) * Math.exp(-o.act * 0.8) : 0;
    var x = cx + dx, click = o.click || 0;
    return Pth("M" + n2(x) + "," + n2(cy - 30) + " C" + n2(x) + "," + n2(cy - 48) + " " + n2(x + 24) + "," + n2(cy - 44) + " " + n2(x + 30) + "," + n2(cy - 58), null, P.edge, 3) +
      E(x, cy, 22, 30, P.plastic, P.edge, 2) +
      Pth("M" + n2(x - 22) + "," + n2(cy - 4) + " A22,26 0 0 1 " + n2(x) + "," + n2(cy - 30) + " L" + n2(x) + "," + n2(cy - 4) + " Z", P.gold, null, null, { opacity: 0.85 * click }) +
      L(x, cy - 30, x, cy - 4, P.edge, 2) + L(x - 22, cy - 4, x + 22, cy - 4, P.edge, 1.5) +
      R(x - 3, cy - 22, 6, 11, 3, P.body);
  }

  function mic(cx, cy, o) {
    var out = "";
    if (o.act != null && o.act > 0 && o.act < 2.2) {
      for (var k = 0; k < 3; k++) {
        var r = 20 + k * 12, a = Math.max(0, Math.sin(o.act * 6 - k * 0.8)) * (1 - o.act / 2.2);
        out += Pth("M" + n2(cx - 26 - k * 3) + "," + n2(cy - 17 - r * 0.62) + " A" + r + "," + r + " 0 0 0 " + n2(cx - 26 - k * 3) + "," + n2(cy - 17 + r * 0.62), null, P.teal, 3, { opacity: a });
      }
    }
    return out + R(cx - 17, cy - 40, 34, 46, 17, P.plastic, P.edge, 2) +
      L(cx - 11, cy - 28, cx + 11, cy - 28, P.edge, 1.5) + L(cx - 13, cy - 19, cx + 13, cy - 19, P.edge, 1.5) + L(cx - 11, cy - 10, cx + 11, cy - 10, P.edge, 1.5) +
      L(cx, cy + 6, cx, cy + 26, P.edge, 5) + E(cx, cy + 30, 24, 6, P.body, P.edge, 2);
  }

  function camera(cx, cy, o) {
    var out = R(cx - 18, cy - 32, 26, 10, 3, P.body, P.edge, 2) +
      R(cx - 42, cy - 24, 84, 50, 9, P.body, P.edge, 2) +
      C(cx, cy + 1, 17, P.glass, P.edge, 3) + C(cx, cy + 1, 8, P.cell) + C(cx - 4, cy - 3, 3, "#FFFFFF", null, null, { opacity: 0.7 }) +
      R(cx + 20, cy - 18, 14, 8, 2, P.plastic) + C(cx - 28, cy - 30, 4, P.bad);
    var f = o.flash;
    if (f != null && f > 0 && f < 0.6) {
      var u = f / 0.6;
      out += C(cx + 27, cy - 14, 10 + 44 * u, "#FFFFFF", null, null, { opacity: 0.85 * (1 - u) });
    }
    return out;
  }

  function monitor(cx, cy, o) {
    var out = R(cx - 58, cy - 40, 116, 72, 7, P.body, P.edge, 3) + R(cx - 51, cy - 33, 102, 58, 3, P.glass) +
      R(cx - 8, cy + 32, 16, 8, 0, P.edge) + R(cx - 26, cy + 39, 52, 5, 2, P.edge);
    if (o.show > 0) out += G(picture(cx - 47, cy - 29, 44, 50) + Tx(cx + 23, cy + 3, "hello", "lab small", "middle", { fill: P.teal }), { opacity: o.show });
    return out;
  }

  function speakerDev(cx, cy, o) {
    var p = o.play, beat = p != null && p > 0 && p < 2.6 ? Math.max(0, Math.sin(p * 9)) * (1 - p / 2.6) : 0;
    var out = R(cx - 24, cy - 38, 48, 76, 9, P.body, P.edge, 2) +
      C(cx, cy - 16, 8 + 1.5 * beat, P.glass, P.edge, 2) + C(cx, cy + 14, 14 + 3 * beat, P.glass, P.edge, 3) + C(cx, cy + 14, 4, P.edge);
    if (p != null && p > 0 && p < 2.6) {
      for (var k = 0; k < 3; k++) {
        var q = (p - k * 0.45) % 1.3;
        if (p - k * 0.45 <= 0) continue;
        out += Tx(cx + 40 + q * 14, cy + 4 - q * 30, k % 2 ? "♫" : "♪", "lab", "middle", { fill: P.gold, opacity: clamp(1.6 - q * 1.2, 0, 1), "font-size": 20 });
      }
      for (var a = 0; a < 2; a++) {
        var r = 14 + a * 10;
        out += Pth("M" + n2(cx + 30) + "," + n2(cy + 14 - r) + " A" + r + "," + r + " 0 0 1 " + n2(cx + 30) + "," + n2(cy + 14 + r), null, P.gold, 3, { opacity: beat * (1 - a * 0.4) });
      }
    }
    return out;
  }

  function printer(cx, cy, o) {
    var u = clamp(o.print || 0, 0, 1), out = "";
    if (u > 0) {
      out += R(cx - 30, cy + 8, 60, 46 * u, 2, "#FFFFFF", P.edge, 1);
      if (u > 0.55) out += G(picture(cx - 22, cy + 14, 44, 30), { opacity: (u - 0.55) / 0.45 });
    }
    return out + R(cx - 40, cy - 30, 80, 16, 4, P.edge) + R(cx - 52, cy - 16, 104, 30, 8, P.plastic, P.edge, 2) +
      R(cx - 38, cy + 6, 76, 5, 2, P.body) + C(cx + 40, cy - 4, 3, P.good);
  }

  function lamp(cx, cy, o) {
    var g = clamp(o.glow || 0, 0, 1);
    return C(cx, cy - 8, 36, P.gold, null, null, { opacity: 0.3 * g }) +
      C(cx, cy - 8, 21, P.cell, P.edge, 2) + C(cx, cy - 8, 21, P.gold, null, null, { opacity: g }) +
      Pth("M" + n2(cx - 7) + "," + n2(cy + 2) + " L" + n2(cx - 4) + "," + n2(cy - 12) + " L" + n2(cx) + "," + n2(cy - 4) +
        " L" + n2(cx + 4) + "," + n2(cy - 12) + " L" + n2(cx + 7) + "," + n2(cy + 2), null, g > 0.5 ? "#7A5A00" : P.edge, 2) +
      R(cx - 10, cy + 12, 20, 16, 3, P.edge) + L(cx - 10, cy + 18, cx + 10, cy + 18, P.body, 1.5) + L(cx - 10, cy + 23, cx + 10, cy + 23, P.body, 1.5);
  }

  /* The computer in the middle of the in-and-out scenes: a tower with a small
     display on its front and its chip showing. 100 x 190. */
  function tower(x, y, o) {
    return R(x, y, 100, 190, 12, P.body, P.edge, 4) +
      L(x + 18, y + 14, x + 82, y + 14, P.edge, 2) + L(x + 18, y + 20, x + 82, y + 20, P.edge, 2) +
      R(x + 14, y + 30, 72, 46, 6, P.glass, P.line, 1.5) + G(o.display || "", {}) +
      chip(x + 50, y + 124, 40, o.glow || 0) +
      C(x + 50, y + 174, 5, P.teal, null, null, { opacity: 0.5 + 0.5 * breathe(o.t || 0) });
  }

  /* ==== what the screens show =================================================
     Each draws in its own w x h box from (0, 0). They are the lesson's own six
     programs (computing.js APPS: paint, game, write, video, call, search), with
     the lesson's own content: Grandma's "Hello! How was school today?", the
     elephant, lion, monkey and zebra of the video, "lions" in the search box. */

  function callScreen(t, at, w, h, bubbleAt) {
    var since = at == null ? 0 : Math.max(0, t - at), fs = Math.min(w, h) * 0.46;
    var gx = w * 0.4, gy = h * 0.44;
    var out = R(0, 0, w, h, 0, P.cell) + Em(gx, gy, fs, "👵🏾");
    if (at != null && t >= at) {
      for (var k = 0; k < 3; k++) {
        var r = fs * (0.2 + k * 0.12), o = 0.2 + 0.8 * Math.max(0, Math.sin(since * 5 - k * 0.9));
        var ax = gx + fs * 0.46;
        out += Pth("M" + n2(ax) + "," + n2(gy - r) + " A" + n2(r) + "," + n2(r) + " 0 0 1 " + n2(ax) + "," + n2(gy + r), null, P.teal, 4, { opacity: o });
      }
    }
    out += R(12, h - 40, 104, 28, 14, "rgba(11,29,44,0.8)") + Tx(64, h - 20, "Grandma", "lab small", "middle");
    var pw = w * 0.24, ph = h * 0.3;
    out += R(w - pw - 10, h - ph - 10, pw, ph, 8, P.glass, P.edge, 2) + Em(w - pw / 2 - 10, h - ph / 2 - 10, ph * 0.62, "👧🏾");
    out += C(20, 22, 5, P.bad) + Tx(32, 28, "00:" + pad2(Math.floor(since) % 60), "lab small", "start");
    var b = on(t, bubbleAt, 0.35);
    if (b > 0) {
      out += G(R(w * 0.08, h * 0.05 + 22, w * 0.84, 54, 16, "#FFFFFF") +
        Tx(w / 2, h * 0.05 + 46, "Hello! How was", "lab small dark readable", "middle") +
        Tx(w / 2, h * 0.05 + 66, "school today?", "lab small dark readable", "middle"),
        { opacity: b, transform: "translate(0," + n2((1 - b) * 10) + ")" });
    }
    return out;
  }

  var FRAMES = ["🐘", "🦁", "🐒", "🦓"];
  function filmScreen(t, at, w, h) {
    var since = at == null ? 0 : Math.max(0, t - at);
    var k = Math.floor(since / 0.8) % 4, u = (since % 0.8) / 0.8;
    return R(0, 0, w, h, 0, "#000000") +
      Em(w / 2, h * 0.45, Math.min(w, h) * 0.5, FRAMES[k], { opacity: clamp(u * 5, 0, 1) }) +
      Pth("M16," + n2(h - 36) + " L16," + n2(h - 22) + " L28," + n2(h - 29) + " Z", P.ink) +
      R(38, h - 32, w - 56, 7, 3.5, "rgba(255,255,255,0.2)") + R(38, h - 32, (w - 56) * clamp(since / 5, 0, 1), 7, 3.5, P.bad);
  }

  function gameScreen(t, at, w, h) {
    var since = at == null ? 0 : Math.max(0, t - at), per = 0.9, span = w - 90;
    var bx = 45 + ((since * 110) % (span * 2)), fs = Math.min(w, h) * 0.17;
    if (bx > 45 + span) bx = 45 + 2 * span - (bx - 45);
    var by = h - 44 - fs * 0.5 - (h * 0.5) * Math.abs(Math.sin(Math.PI * since / per));
    return R(0, 0, w, h, 0, P.sky) + R(0, h - 24, w, 24, 0, P.grass) +
      R(bx - 32, h - 36, 64, 10, 5, P.body) + Em(bx, by, fs, "⚽") +
      Tx(w - 14, 28, "Score " + Math.floor(since / per), "lab small dark", "end");
  }

  /* The rainbow, painted arc by arc, then music: the two halves of "creativity". */
  var RAIN = [P.accent, P.gold, P.good, P.blue];
  var TUNE = [0, 2, 4, 5, 7, 5, 4, 2];   /* the key each note of the little tune presses */
  function paintScreen(t, at, musicAt, w, h) {
    var out = R(0, 0, w, h, 0, P.paper), cx = w / 2, cy = h * 0.95, r0 = w * 0.42, step = w * 0.064, tip = null;
    for (var k = 0; k < 4; k++) {
      var r = r0 - k * step, p = at == null ? 0 : clamp((t - at - k * 0.42) / 0.95, 0, 1);
      if (p <= 0) continue;
      out += Pth("M" + n2(cx - r) + "," + n2(cy) + " A" + n2(r) + "," + n2(r) + " 0 0 1 " + n2(cx + r) + "," + n2(cy), null, RAIN[k], step * 0.84,
        { pathLength: 1, "stroke-dasharray": "1 1", "stroke-dashoffset": n3(1 - p), "stroke-linecap": "butt" });
      if (p < 1) tip = [cx - r * Math.cos(Math.PI * p), cy - r * Math.sin(Math.PI * p), RAIN[k]];
    }
    out += C(w * 0.14, h * 0.2, h * 0.08, P.gold, null, null, { opacity: on(t, at == null ? null : at + 2.0, 0.4) });
    if (tip) out += L(tip[0] + 6, tip[1] - 6, tip[0] + 44, tip[1] - 44, P.plum, 7) + C(tip[0] + 3, tip[1] - 3, 9, tip[2], P.ink, 2);
    var m = on(t, musicAt, 0.4);
    if (m > 0) {
      var since = t - musicAt, kw = w * 0.07, x0 = w / 2 - kw * 4, y0 = h - 64;
      var keys = R(x0 - 6, y0 - 6, kw * 8 + 12, 64, 8, P.dark);
      var cur = TUNE[Math.floor(since / 0.28) % TUNE.length];
      for (var j = 0; j < 8; j++) keys += R(x0 + j * kw, y0, kw - 3, 52, 3, j === cur ? P.gold : "#FFFFFF");
      for (var n = 0; n < 4; n++) {
        var q = since - n * 0.4;
        if (q <= 0) continue;
        keys += Tx(x0 + kw * (1 + n * 2), y0 - 10 - (q % 1.6) * 50, n % 2 ? "♫" : "♪", "lab", "middle",
          { fill: P.plum, "font-size": 30, opacity: clamp(1.6 - (q % 1.6), 0, 1) });
      }
      out += G(keys, { opacity: m });
    }
    return out;
  }

  /* The lesson's Paint program: tap the white space to paint dots. */
  var DOTS = [[0.25, 0.3], [0.62, 0.22], [0.45, 0.5], [0.78, 0.45], [0.3, 0.68], [0.66, 0.72], [0.5, 0.3], [0.2, 0.48], [0.82, 0.68]];
  function dotsScreen(t, at, w, h) {
    var out = R(0, 0, w, h, 0, "#FFFFFF");
    for (var k = 0; k < 4; k++) out += C(28 + k * 34, h - 24, 11, TILE[k], k === 0 ? P.dark : null, 2);
    for (var j = 0; j < DOTS.length; j++) {
      var p = at == null ? 0 : popIn(t, at + j * 0.24, 0.25);
      if (p <= 0) continue;
      var x = DOTS[j][0] * w, y = DOTS[j][1] * (h - 50);
      out += C(x, y, 16 * p, TILE[j % 6]) + ripple(x, y, t, at + j * 0.24, P.dark);
    }
    return out;
  }

  function searchScreen(t, at, w, h) {
    var since = at == null ? -1 : t - at;
    var n = since < 0 ? 0 : Math.min(5, Math.floor(since / 0.12) + 1);
    var bw = w - 32, fs = w > 320 ? 24 : 20;
    var out = R(0, 0, w, h, 0, P.paper) +
      R(16, 16, bw, 46, 23, "#FFFFFF", P.plastic, 2) + Em(40, 39, 20, "🔎") +
      Tx(62, 47, "lions".slice(0, n), "lab dark", "start", { "font-size": fs });
    if (since < 1.2 && Math.floor(Math.max(0, since) * 3) % 2 === 0) out += L(64 + n * fs * 0.56, 27, 64 + n * fs * 0.56, 51, P.dark, 2);
    var r = on(t, at == null ? null : at + 0.75, 0.4);
    if (r > 0) {
      out += G(R(16, 78, bw, h - 94, 16, "#FFFFFF", "#D6E3DE", 2) +
        Em(16 + bw * 0.2, 78 + (h - 94) / 2, Math.min(70, (h - 94) * 0.55), "🦁") +
        Tx(16 + bw * 0.38, 78 + (h - 94) / 2 - 16, "Lions", "lab dark", "start", { "font-size": fs + 2 }) +
        Tx(16 + bw * 0.38, 78 + (h - 94) / 2 + 12, "live in Africa", "lab dark readable", "start", { "font-size": fs - 5 }) +
        Tx(16 + bw * 0.38, 78 + (h - 94) / 2 + 34, "and India.", "lab dark readable", "start", { "font-size": fs - 5 }),
        { opacity: r, transform: "translate(0," + n2((1 - r) * 12) + ")" });
    }
    return out;
  }

  /* The lesson's Writing program, typing a story. */
  var STORY = ["Once upon a", "time, a little", "robot found a", "red kite."];
  function writeScreen(t, at, w, h) {
    var out = R(0, 0, w, h, 0, "#FFFFFF") + L(24, 18, 24, h - 18, "#F0806F", 1.5, { opacity: 0.5 });
    var typed = at == null ? 0 : Math.max(0, Math.floor((t - at) * 14)), left = typed, lastX = 34, lastY = 44;
    for (var k = 0; k < STORY.length; k++) {
      var s = STORY[k].slice(0, Math.max(0, left));
      left -= STORY[k].length;
      if (!s) break;
      out += Tx(34, 44 + k * 38, s, "lab dark readable", "start", { "font-size": 23 });
      lastX = 34 + s.length * 11.2; lastY = 44 + k * 38;
    }
    if (Math.floor(t * 2.5) % 2 === 0) out += L(lastX + 3, lastY - 20, lastX + 3, lastY + 5, P.dark, 2);
    return out;
  }

  /* ==== everyday things, with and without a computer inside ==================
     The lesson's own sort (Lesson 8, "Is there a computer inside?"): six with
     one - washing machine, traffic lights, microwave, car, watch, TV - and the
     wooden spoon, the book and the candle with none. Each draws in its own box
     (THINGS[..].box) and takes o.xray, 0..1: the see-through look at what is
     inside, where the chip glows. o.label shows the word "computer" beside it. */

  function xrayLabel(x, y, lx, ly, o) {
    var a = (o.xray || 0) * (o.label == null ? 1 : o.label);
    if (!(a > 0)) return "";
    return G(L(x, y, lx, ly, P.gold, 2.5) + C(x, y, 3.5, P.gold) + Tx(lx + 6, ly + 6, "computer", "lab small gold", "start"), { opacity: a });
  }

  function washer(o) {
    var id = o.id || "wd", lvl = clamp(o.level || 0, 0, 1), turn = o.turn || 0, t = o.t || 0;
    var out = R(10, 8, 180, 198, 16, P.plastic, P.edge, 3) +
      R(10, 8, 180, 46, 16, P.edge) + R(10, 38, 180, 16, 0, P.edge) +
      C(36, 31, 11, P.body, P.ink, 2) + L(36, 31, 36 + 8 * Math.cos(o.dial || -1.2), 31 + 8 * Math.sin(o.dial || -1.2), P.ink, 2.5) +
      R(58, 21, 66, 22, 5, P.glass) + Tx(91, 37, o.display || "", "lab tiny", "middle", { fill: P.good }) +
      C(148, 31, 5, P.body) + C(166, 31, 5, P.body) +
      C(100, 130, 62, "#A9BACA", P.edge, 3) + C(100, 130, 50, P.cell);
    var inner = "";
    if (lvl > 0) {
      var y = 182 - 104 * lvl, ph = Math.sin(t * 4) * 5;
      inner += Pth("M40," + n2(y) + " C60," + n2(y - 6 + ph) + " 80," + n2(y + 6 - ph) + " 100," + n2(y) +
        " C120," + n2(y - 6 + ph) + " 140," + n2(y + 6 - ph) + " 160," + n2(y) + " L160,184 L40,184 Z", P.blue, null, null, { opacity: 0.6 });
    }
    var cols = [P.plum, P.gold, P.accent];
    for (var k = 0; k < 3; k++) {
      var a = turn + k * 2.094, px = 100 + 27 * Math.cos(a), py = 130 + 27 * Math.sin(a);
      inner += E(px, py, 15, 9, cols[k], null, null, { transform: "rotate(" + n2(a * 57.3) + " " + n2(px) + " " + n2(py) + ")" });
    }
    if (o.fast > 0) inner += C(100, 130, 36, null, "#FFFFFF", 6, { "stroke-dasharray": "18 26", transform: "rotate(" + n2(turn * 57.3) + " 100 130)", opacity: 0.35 * o.fast });
    out += el("clipPath", { id: id }, C(100, 130, 50)) + G(inner, { "clip-path": "url(#" + id + ")" }) +
      Pth("M68,104 A42,42 0 0 1 106,86", null, "#FFFFFF", 4, { opacity: 0.3 }) +
      R(22, 204, 26, 8, 3, P.edge) + R(152, 204, 26, 8, 3, P.edge);
    var x = o.xray || 0;
    if (x > 0) out += R(10, 8, 180, 46, 16, P.ground, null, null, { opacity: 0.6 * x }) + G(chip(157, 31, 24, o.glow == null ? x : o.glow), { opacity: x });
    return out + xrayLabel(172, 31, 212, 2, o);
  }

  /* phase: 0 red, 1 red and amber, 2 green, 3 amber */
  var LAMPS = [[1, 0, 0], [1, 1, 0], [0, 0, 1], [0, 1, 0]];
  function traffic(o) {
    var st = LAMPS[((o.phase || 0) % 4 + 4) % 4], cols = [P.bad, P.gold, P.good], out = R(62, 0, 76, 152, 18, P.cell, P.edge, 3);
    for (var k = 0; k < 3; k++) {
      var y = 30 + k * 46;
      out += Pth("M76," + (y - 17) + " Q100," + (y - 31) + " 124," + (y - 17), null, P.edge, 4) +
        C(100, y, 17, cols[k], null, null, { opacity: 0.16 });
      if (st[k]) out += C(100, y, 28, cols[k], null, null, { opacity: 0.28 }) + C(100, y, 17, cols[k]);
    }
    out += R(92, 152, 16, 72, 0, P.edge) + R(76, 222, 48, 10, 3, P.edge) + R(110, 170, 36, 36, 6, P.body, P.edge, 2);
    var x = o.xray || 0;
    if (x > 0) out += G(chip(128, 188, 20, o.glow == null ? x : o.glow), { opacity: x });
    return out + xrayLabel(148, 188, 178, 168, o);
  }

  function microwave(o) {
    var run = o.run || 0, turn = o.turn || 0, bx = 76 + 18 * Math.sin(turn);
    var out = R(0, 0, 210, 134, 12, P.plastic, P.edge, 3) + R(12, 12, 128, 110, 8, P.cell, P.edge, 2) +
      R(12, 12, 128, 110, 8, P.gold, null, null, { opacity: 0.16 * run }) +
      E(76, 104, 50, 9, P.edge) + E(bx, 96, 22, 8, P.accent) + R(bx - 22, 84, 44, 12, 4, P.accent) +
      R(148, 12, 50, 110, 6, P.edge) + R(152, 18, 42, 20, 3, P.glass) +
      Tx(173, 33, o.display || "", "lab tiny", "middle", { fill: P.good });
    for (var r = 0; r < 3; r++) for (var c = 0; c < 2; c++) out += C(163 + c * 20, 56 + r * 18, 6, P.body);
    out += R(20, 132, 22, 6, 2, P.edge) + R(168, 132, 22, 6, 2, P.edge);
    var x = o.xray || 0;
    if (x > 0) out += R(148, 46, 50, 76, 6, P.ground, null, null, { opacity: 0.6 * x }) + G(chip(173, 84, 22, o.glow == null ? x : o.glow), { opacity: x });
    return out + xrayLabel(190, 84, 222, 60, o);
  }

  function wheel(cx, cy, r, turn) {
    var out = C(cx, cy, r, "#22313D", P.edge, 2) + C(cx, cy, r * 0.45, P.edge);
    for (var k = 0; k < 3; k++) {
      var a = turn + k * 2.094;
      out += L(cx + r * 0.2 * Math.cos(a), cy + r * 0.2 * Math.sin(a), cx + r * 0.8 * Math.cos(a), cy + r * 0.8 * Math.sin(a), P.edge, 2.5);
    }
    return out;
  }

  function car(o) {
    var turn = o.turn || 0;
    var out = Pth("M8,82 L8,62 Q10,50 32,47 L64,22 Q72,14 86,14 L142,14 Q156,14 166,24 L190,47 Q214,50 218,62 L218,82 Z", P.accent, "rgba(11,29,44,0.35)", 2) +
      Pth("M72,27 L140,27 Q150,27 156,34 L169,47 L60,47 Z", P.glass) + L(114, 27, 114, 47, P.accent, 5) +
      L(114, 52, 114, 78, "rgba(11,29,44,0.35)", 2) + R(8, 58, 7, 11, 2, P.bad) +
      C(214, 64, 11, P.gold, null, null, { opacity: 0.35 * (o.lights || 0) }) + C(212, 64, 5, P.gold) +
      wheel(58, 84, 22, turn) + wheel(170, 84, 22, turn);
    var x = o.xray || 0;
    if (x > 0) out += Pth("M8,82 L8,62 Q10,50 32,47 L190,47 Q214,50 218,62 L218,82 Z", P.ground, null, null, { opacity: 0.45 * x }) + G(chip(114, 66, 22, o.glow == null ? x : o.glow), { opacity: x });
    return out + xrayLabel(128, 66, 160, 100, o);
  }

  function watch(o) {
    var sec = Math.floor(o.sec || 0) % 60;
    var out = R(38, 0, 44, 42, 8, P.body) + R(38, 134, 44, 42, 8, P.body) +
      R(18, 36, 84, 104, 22, P.plastic, P.edge, 3) + R(28, 48, 64, 80, 14, P.glass) + R(102, 78, 7, 18, 2, P.edge) +
      Tx(60, 92, "10:15", "lab", "middle", { fill: P.teal, "font-size": 20 }) +
      Tx(60, 114, ":" + pad2(sec), "lab", "middle", { fill: P.muted, "font-size": 14 });
    var x = o.xray || 0;
    if (x > 0) out += R(28, 48, 64, 80, 14, P.ground, null, null, { opacity: 0.6 * x }) + G(chip(60, 88, 26, o.glow == null ? x : o.glow), { opacity: x });
    return out + xrayLabel(76, 88, 124, 60, o);
  }

  function tv(o) {
    var id = o.id || "tvc", ch = ((o.channel || 0) % 3 + 3) % 3, scr = "";
    if (ch === 0) for (var k = 0; k < 7; k++) scr += R(10 + k * 204 / 7, 10, 204 / 7 + 0.5, 120, 0, [P.ink, P.gold, P.teal, P.good, P.plum, P.bad, P.blue][k]);
    else if (ch === 1) scr += picture(10, 10, 204, 120);
    else scr += R(10, 10, 204, 120, 0, P.plum) + Em(112, 70, 70, "🐱");
    var out = R(0, 0, 224, 140, 12, P.body, P.edge, 3) + R(10, 10, 204, 120, 4, P.glass) +
      el("clipPath", { id: id }, R(10, 10, 204, 120, 4)) + G(scr, { "clip-path": "url(#" + id + ")" }) +
      R(98, 140, 28, 14, 0, P.edge) + R(70, 152, 84, 8, 4, P.edge);
    var x = o.xray || 0;
    if (x > 0) out += R(10, 10, 204, 120, 4, P.ground, null, null, { opacity: 0.6 * x }) + G(chip(112, 70, 30, o.glow == null ? x : o.glow), { opacity: x });
    return out + xrayLabel(132, 70, 190, 34, o);
  }

  function spoon(o) {
    return E(46, 40, 38, 26, P.goldDeep, "rgba(11,29,44,0.4)", 2) + E(42, 36, 24, 14, "#FFFFFF", null, null, { opacity: 0.16 }) +
      R(80, 33, 144, 14, 7, P.goldDeep, "rgba(11,29,44,0.4)", 2);
  }

  function book(o) {
    var out = Pth("M6,22 L6,134 Q66,124 110,146 Q154,124 214,134 L214,22", null, P.plum, 6) +
      Pth("M110,24 Q66,6 12,16 L12,128 Q66,118 110,138 Z", P.paper, P.edge, 2) +
      Pth("M110,24 Q154,6 208,16 L208,128 Q154,118 110,138 Z", P.paper, P.edge, 2);
    for (var k = 0; k < 5; k++) {
      out += L(26, 38 + k * 18, 94, 38 + k * 18 + 6, P.edge, 2, { opacity: 0.6 }) + L(126, 38 + k * 18 + 6, 194, 38 + k * 18, P.edge, 2, { opacity: 0.6 });
    }
    return out;
  }

  function candle(o) {
    var t = o.t || 0, f = 1 + 0.08 * Math.sin(t * 13) + 0.05 * Math.sin(t * 7.3);
    return C(45, 52, 36, P.gold, null, null, { opacity: 0.16 }) +
      E(45, 206, 40, 10, P.edge) + R(27, 84, 36, 120, 5, "#F3EFE6", P.edge, 2) +
      Pth("M27,96 Q33,104 36,96 Q38,112 42,96", null, "#E4DCCB", 4) + L(45, 84, 45, 70, P.dark, 3) +
      G(Pth("M45,20 Q66,52 45,72 Q24,52 45,20 Z", P.gold) + Pth("M45,42 Q55,60 45,70 Q35,60 45,42 Z", P.accent), { transform: around(45, 70, f) });
  }

  var THINGS = {
    washer: { box: [0, 0, 200, 214], draw: washer, name: "washing machine", has: true },
    lights: { box: [58, 0, 84, 234], draw: traffic, name: "traffic lights", has: true },
    microwave: { box: [0, 0, 210, 140], draw: microwave, name: "microwave", has: true },
    car: { box: [6, 12, 214, 96], draw: car, name: "car", has: true },
    watch: { box: [16, 0, 94, 176], draw: watch, name: "watch", has: true },
    tv: { box: [0, 0, 224, 162], draw: tv, name: "TV", has: true },
    spoon: { box: [6, 12, 220, 56], draw: spoon, name: "wooden spoon", has: false },
    book: { box: [4, 4, 212, 144], draw: book, name: "book", has: false },
    candle: { box: [5, 16, 80, 202], draw: candle, name: "candle", has: false }
  };
  var THING_ORDER = ["washer", "lights", "microwave", "car", "watch", "tv", "spoon", "book", "candle"];

  /* draw a thing centred on (cx, cy), as large as fits in maxW x maxH */
  function fit(id, o, cx, cy, maxW, maxH) {
    var th = THINGS[id], b = th.box, s = Math.min(maxW / b[2], maxH / b[3]);
    return G(th.draw(o), { transform: "translate(" + n2(cx - s * (b[0] + b[2] / 2)) + "," + n2(cy - s * (b[1] + b[3] / 2)) + ") scale(" + n3(s) + ")" });
  }

  /* ==== robots =================================================================
     The lesson's robots (Lesson 8, "What is a robot?"): a factory arm, a robot
     vacuum, a Mars rover, a hospital delivery robot, a warehouse robot and an
     underwater robot - and the bicycle, which moves and is not one. */

  /* A box robot on two wheels, 160 x 190, standing on y = 190. o.xray shows
     its computer; o.lift raises its gripper (0..1); o.turn spins its wheels. */
  function boxBot(o) {
    var lift = o.lift || 0, blink = Math.sin((o.t || 0) * 1.3) > 0.97 ? 0.15 : 1;
    var out = L(80, 0, 80, -16, P.edge, 3) + C(80, -20, 6, P.gold) +
      R(40, 0, 80, 52, 14, P.plastic, P.edge, 3) + R(50, 10, 60, 32, 8, P.glass) +
      E(68, 26, 6, 6 * blink, P.teal) + E(92, 26, 6, 6 * blink, P.teal) +
      R(20, 56, 120, 96, 18, P.plastic, P.edge, 3) +
      L(140, 96, 168, 96 - 30 * lift, P.edge, 7) + Pth("M162," + n2(88 - 30 * lift) + " L176," + n2(92 - 30 * lift) + " L176," + n2(104 - 30 * lift) + " L162," + n2(108 - 30 * lift), null, P.edge, 5) +
      wheel(48, 166, 22, o.turn || 0) + wheel(112, 166, 22, o.turn || 0);
    var x = o.xray || 0;
    if (x > 0) out += R(20, 56, 120, 96, 18, P.ground, null, null, { opacity: 0.55 * x }) + G(chip(80, 102, 36, o.glow == null ? x : o.glow), { opacity: x });
    return out + xrayLabel(100, 102, 186, 132, o);
  }

  /* 2-link arm: the elbow that sits higher, for a shoulder at (sx, sy) */
  function ik(sx, sy, l1, l2, tx, ty) {
    var dx = tx - sx, dy = ty - sy, d = clamp(Math.hypot(dx, dy), Math.abs(l1 - l2) + 1, l1 + l2 - 1);
    var a = Math.atan2(dy, dx), b = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
    var e1 = [sx + l1 * Math.cos(a - b), sy + l1 * Math.sin(a - b)], e2 = [sx + l1 * Math.cos(a + b), sy + l1 * Math.sin(a + b)];
    var e = e1[1] < e2[1] ? e1 : e2, tip = [e[0] + l2 * (tx - e[0]) / Math.hypot(tx - e[0], ty - e[1]), e[1] + l2 * (ty - e[1]) / Math.hypot(tx - e[0], ty - e[1])];
    return { e: e, tip: tip };
  }

  /* The factory: a car body rides in on the belt and the arm welds it.
     arrive 0..1 brings the car; weld (seconds since welding began, or null). */
  function factory(t, arrive, weld) {
    var out = R(0, 0, 640, 440, 18, P.cell) + R(0, 360, 640, 80, 0, "#132F43");
    var belt = R(30, 330, 580, 28, 14, P.body, P.edge, 2), off = (t * 60) % 24;
    for (var k = 0; k < 26; k++) belt += L(40 + k * 24 - off, 336, 34 + k * 24 - off, 352, P.edge, 2, { opacity: 0.6 });
    out += el("clipPath", { id: "beltc" }, R(30, 330, 580, 28, 14)) + G(belt, { "clip-path": "url(#beltc)" });
    for (var r = 0; r < 6; r++) out += C(60 + r * 104, 362, 8, P.edge);
    var cx = lerp(-240, 150, ease(arrive));
    out += G(Pth("M8,82 L8,62 Q10,50 32,47 L64,22 Q72,14 86,14 L142,14 Q156,14 166,24 L190,47 Q214,50 218,62 L218,82 Z", P.accent, "rgba(11,29,44,0.35)", 2) +
      Pth("M72,27 L140,27 Q150,27 156,34 L169,47 L60,47 Z", P.glass) + L(114, 27, 114, 47, P.accent, 5),
      { transform: tr(cx, 246, 1) });
    /* the tip walks along the car's roof seam while it welds, and rests above the belt before */
    var sx = 470, sy = 250, tipX, tipY;
    if (weld == null || weld < 0) { tipX = 420 + 12 * Math.sin(t * 1.3); tipY = 190 + 8 * Math.cos(t * 1.1); }
    else {
      var u = 0.5 + 0.5 * Math.sin(weld * 1.6 - Math.PI / 2);
      tipX = cx + lerp(92, 150, u); tipY = 258 - 4 * Math.sin(u * Math.PI);
      var ramp = clamp(weld / 0.6, 0, 1);
      tipX = lerp(420, tipX, ramp); tipY = lerp(190, tipY, ramp);
    }
    var a = ik(sx, sy, 150, 130, tipX, tipY);
    out += R(430, 300, 80, 30, 8, P.body, P.edge, 3) + R(452, 256, 36, 48, 6, P.body, P.edge, 3) +
      L(sx, sy, a.e[0], a.e[1], P.gold, 22) + L(sx, sy, a.e[0], a.e[1], P.goldDeep, 8) +
      L(a.e[0], a.e[1], a.tip[0], a.tip[1], P.gold, 16) +
      C(sx, sy, 16, P.body, P.edge, 3) + C(a.e[0], a.e[1], 13, P.body, P.edge, 3) + C(a.tip[0], a.tip[1], 9, P.edge);
    if (weld != null && weld > 0.6) {
      var fl = Math.floor(t * 20);
      for (var s = 0; s < 7; s++) {
        var ang = ((fl * 37 + s * 53) % 360) * Math.PI / 180, len = 10 + ((fl * 13 + s * 29) % 18);
        out += L(a.tip[0], a.tip[1] + 8, a.tip[0] + len * Math.cos(ang), a.tip[1] + 8 + len * Math.sin(ang), s % 2 ? P.gold : "#FFFFFF", 2.5);
      }
      out += C(a.tip[0], a.tip[1] + 8, 12, "#FFFFFF", null, null, { opacity: 0.5 + 0.4 * Math.sin(t * 40) });
    }
    /* clipped to the room: the car arriving on the belt starts outside it */
    return el("clipPath", { id: "factc" }, R(0, 0, 640, 440, 18)) + G(out, { "clip-path": "url(#factc)" });
  }

  /* The robot vacuum, from above. clean 0..1 is how much of its route is done;
     home 0..1 takes it back to its charger. */
  var ROUTE = [[96, 130], [520, 130], [520, 196], [96, 196], [96, 262], [520, 262], [520, 328], [96, 328]];
  var ROUTE_LEN = polyLen(ROUTE);
  var DOCK = [580, 250];
  function vacuumRoom(t, clean, home) {
    var out = R(20, 10, 600, 420, 18, P.cell, P.line, 3);
    for (var pl = 1; pl < 7; pl++) out += L(24, 10 + pl * 60, 616, 10 + pl * 60, P.line, 2, { opacity: 0.7 });
    out += R(40, 24, 230, 64, 16, P.body, P.edge, 2) + Tx(155, 64, "sofa", "lab small muted", "middle") +
      R(DOCK[0] - 14, DOCK[1] - 36, 34, 72, 8, P.body, P.edge, 2) + Tx(DOCK[0] + 3, DOCK[1] + 9, "⚡", "lab", "middle", { fill: P.gold }) +
      Tx(DOCK[0] + 3, DOCK[1] + 58, "charger", "lab tiny muted", "middle");
    var done = clamp(clean, 0, 1) * ROUTE_LEN, pos = polyAt(ROUTE, done);
    var trail = [ROUTE[0]];
    for (var k = 1; k <= pos[2]; k++) trail.push(ROUTE[k]);
    trail.push([pos[0], pos[1]]);
    /* where it has been is clean, and the clean path is drawn */
    if (clean > 0) out += Pth("M" + trail.map(function (p) { return n2(p[0]) + "," + n2(p[1]); }).join(" L"), null, P.teal, 58, { opacity: 0.16 });
    var s = 0;
    for (var d = 14; d < ROUTE_LEN; d += 22) {
      var q = polyAt(ROUTE, d), jx = (s * 37) % 23 - 11, jy = (s * 53) % 31 - 15;
      s++;
      if (d > done - 10) out += C(q[0] + jx, q[1] + jy, s % 4 ? 3.6 : 5.5, s % 3 ? P.muted : P.plastic);
    }
    var x = pos[0], y = pos[1], dir = 0;
    if (clean > 0 && clean < 1) { var ahead = polyAt(ROUTE, Math.min(ROUTE_LEN, done + 4)); dir = Math.atan2(ahead[1] - y, ahead[0] - x); }
    if (home > 0) { var hu = ease(home); x = lerp(ROUTE[7][0], DOCK[0] - 48, hu); y = lerp(ROUTE[7][1], DOCK[1], hu); dir = Math.atan2(DOCK[1] - ROUTE[7][1], DOCK[0] - ROUTE[7][0]); }
    var bot = C(0, 0, 32, P.plastic, P.edge, 3) + C(0, 0, 22, "none", P.teal, 3) + C(18, 0, 5, P.good) +
      Pth("M22,-20 A30,30 0 0 1 22,20", null, P.body, 5);
    var sweep = (t * 12) % 6.283;
    bot += L(24 + 8 * Math.cos(sweep), 16 + 8 * Math.sin(sweep), 24 - 8 * Math.cos(sweep), 16 - 8 * Math.sin(sweep), P.muted, 2);
    out += G(bot, { transform: "translate(" + n2(x) + "," + n2(y) + ") rotate(" + n2(dir * 57.3) + ")" });
    out += R(x - 62, y - 66, 124, 26, 13, "rgba(11,29,44,0.8)") +
      (home >= 1 ? Tx(x, y - 47, "charging", "lab tiny gold", "middle", { opacity: breathe(t) * 0.5 + 0.5 }) : Tx(x, y - 47, "robot vacuum", "lab tiny", "middle"));
    return out;
  }

  /* Mars. drive 0..1 moves the rover along; flash is seconds since it took a picture. */
  function mars(t, drive, flash) {
    var out = R(0, 0, 640, 440, 18, P.night);
    for (var k = 0; k < 26; k++) out += C((k * 97) % 620 + 10, (k * 53) % 200 + 12, (k % 3) * 0.6 + 1, "#FFFFFF", null, null, { opacity: 0.35 + 0.4 * Math.abs(Math.sin(t * 1.4 + k)) });
    out += C(560, 70, 26, P.accent, null, null, { opacity: 0.5 }) +
      Pth("M0,300 Q120,270 240,296 Q380,322 500,288 Q580,270 640,286 L640,428 Q640,440 628,440 L12,440 Q0,440 0,428 Z", P.accent) +
      Pth("M0,352 Q160,330 320,356 Q480,380 640,346 L640,428 Q640,440 628,440 L12,440 Q0,440 0,428 Z", "#B85A3C", null, null, { opacity: 0.55 }) +
      E(96, 356, 26, 11, "#8E3B26") + E(520, 372, 34, 13, "#8E3B26") + E(330, 404, 20, 8, "#8E3B26");
    var x = lerp(150, 400, ease(drive)), turn = drive * 18;
    var rv = R(-80, -44, 160, 10, 3, P.blue, P.edge, 2) + R(-70, -34, 140, 34, 6, P.plastic, P.edge, 3) +
      L(40, -44, 40, -92, P.edge, 5) + R(26, -108, 34, 18, 4, P.body, P.edge, 2) + C(56, -99, 5, P.glass, P.teal, 2) +
      L(-50, 0, -50, 16, P.edge, 4) + L(0, 0, 0, 16, P.edge, 4) + L(50, 0, 50, 16, P.edge, 4) +
      wheel(-50, 22, 16, turn) + wheel(0, 22, 16, turn) + wheel(50, 22, 16, turn);
    out += G(rv, { transform: tr(x, 298, 1.25) });
    if (flash != null && flash >= 0) {
      if (flash < 0.5) out += C(x + 70, 174, 10 + 60 * flash / 0.5, "#FFFFFF", null, null, { opacity: 0.9 * (1 - flash / 0.5) });
      var p = on(flash, 0.3, 0.5);
      if (p > 0) out += G(R(420, 24, 190, 132, 10, "#FFFFFF") + R(430, 34, 170, 100, 4, P.night) +
        Pth("M430,108 Q480,90 520,106 Q560,120 600,100 L600,134 L430,134 Z", P.accent) + E(470, 120, 16, 7, "#8E3B26") +
        Tx(515, 150, "a picture from Mars", "lab tiny dark", "middle"),
        { opacity: p, transform: around(515, 90, 0.8 + 0.2 * p) });
    }
    return out;
  }

  /* three more places robots work, one small panel each: 196 x 300 */
  function hospitalPanel(t, a) {
    var x = lerp(20, 140, (Math.sin(t * 0.9) + 1) / 2);
    return R(0, 0, 196, 300, 16, P.cell) + R(0, 230, 196, 70, 0, "#132F43") +
      R(24, 70, 50, 150, 6, P.body, P.edge, 2) + R(122, 70, 50, 150, 6, P.body, P.edge, 2) +
      R(84, 22, 28, 28, 4, "#FFFFFF") + R(94, 26, 8, 20, 1, P.bad) + R(88, 32, 20, 8, 1, P.bad) +
      G(R(-24, -48, 48, 44, 10, P.plastic, P.edge, 2) + Em(0, -60, 26, "💊") + wheel(-14, 0, 8, t * 6) + wheel(14, 0, 8, t * 6), { transform: tr(x, 250) });
  }
  function warehousePanel(t, a) {
    var out = R(0, 0, 196, 300, 16, P.cell);
    for (var r = 0; r < 3; r++) {
      out += R(12, 60 + r * 70, 172, 6, 2, P.edge);
      for (var c = 0; c < 4; c++) if (!(r === 0 && c === 2)) out += R(20 + c * 42, 30 + r * 70, 32, 30, 4, c % 2 ? P.goldDeep : P.accent);
    }
    var up = (Math.sin(t * 1.1) + 1) / 2, y = lerp(250, 70, up);
    out += R(100, 40, 8, 240, 3, P.edge) + R(92, y - 6, 28, 12, 4, P.gold) +
      (up > 0.85 ? R(96, y - 36, 32, 30, 4, P.accent) : "") +
      G(R(-30, -30, 60, 34, 10, P.plastic, P.edge, 2) + wheel(-16, 6, 9, 0) + wheel(16, 6, 9, 0), { transform: tr(104, 280) });
    return out;
  }
  function seaPanel(t, a) {
    var x = 98 + 36 * Math.sin(t * 0.8), y = 150 + 16 * Math.sin(t * 1.3);
    return R(0, 0, 196, 300, 16, "#123C5C") + R(0, 0, 196, 300, 16, P.blue, null, null, { opacity: 0.18 }) +
      Pth("M" + n2(x + 30) + "," + n2(y) + " L196," + n2(y - 60) + " L196," + n2(y + 60) + " Z", P.gold, null, null, { opacity: 0.18 }) +
      E(x, y, 38, 20, P.gold, P.edge, 2) + C(x + 14, y - 2, 7, P.glass, P.edge, 2) + L(x - 38, y, x - 50, y, P.edge, 4) +
      L(x - 50, y - 10, x - 50, y + 10, P.edge, 3) +
      Em(40 + ((t * 30) % 140), 240, 30, "🐟") + Em(170 - ((t * 22) % 150), 60, 24, "🐠") +
      Pth("M0,282 Q50,268 98,282 Q150,296 196,280 L196,288 Q196,300 184,300 L12,300 Q0,300 0,288 Z", "#8E7A4F");
  }

  /* a bicycle; turn spins the wheels and the pedals */
  function bikeWheel(cx, cy, r, turn) {
    var out = C(cx, cy, r, "none", "#22313D", 10) + C(cx, cy, r - 5, "none", P.edge, 2);
    for (var k = 0; k < 8; k++) {
      var a = turn + k * Math.PI / 4;
      out += L(cx, cy, cx + (r - 6) * Math.cos(a), cy + (r - 6) * Math.sin(a), P.edge, 1.5, { opacity: 0.8 });
    }
    return out + C(cx, cy, 6, P.edge);
  }
  function bike(turn) {
    var out = bikeWheel(110, 290, 70, turn) + bikeWheel(410, 290, 70, turn);
    out += Pth("M110,290 L220,190 L360,190 L410,290 M220,190 L270,290 L360,190 M270,290 L110,290", null, P.teal, 9) +
      L(360, 190, 372, 150, P.teal, 8) + L(350, 150, 396, 146, P.edge, 7) + L(220, 190, 208, 164, P.teal, 8) + R(184, 154, 52, 12, 6, P.body);
    var px = 270 + 30 * Math.cos(turn), py = 290 + 30 * Math.sin(turn);
    out += L(270, 290, px, py, P.edge, 6) + L(270, 290, 540 - px, 580 - py, P.edge, 6) +
      R(px - 12, py - 4, 24, 8, 3, P.gold) + R(540 - px - 12, 580 - py - 4, 24, 8, 3, P.edge) + C(270, 290, 10, P.body, P.edge, 2);
    return out;
  }

  /* someone who looks like a person - drawn faint, because most robots do not */
  function humanoid(x, y, s, op) {
    return G(R(-22, -120, 44, 40, 10, "none", P.muted, 3) + R(-30, -74, 60, 70, 12, "none", P.muted, 3) +
      L(-30, -64, -54, -20, P.muted, 3) + L(30, -64, 54, -20, P.muted, 3) + L(-14, -4, -18, 50, P.muted, 3) + L(14, -4, 18, 50, P.muted, 3),
      { transform: tr(x, y, s), opacity: op, "stroke-dasharray": "7 6" });
  }

  /* ==== scene: the title =======================================================
     Three things this lesson is about in one picture: a tablet running its
     programs, a washing machine with a computer hiding inside it, and a robot. */
  function titleMotif(o) {
    var t = o.t || 0;
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A tablet, a washing machine and a robot">' +
      R(11, 31, 168, 248, 30, "none", P.teal, 4, { opacity: 0.9 * (o.see || 0) }) +
      tabletP(20, 40, 150, 230, tiles(126, 156, t, o.tilesAt), "tmt", 1) +
      G(washer({ t: t, id: "tmw", level: 0.5, turn: t * 1.6, xray: o.xray || 0, label: 0, display: "0:45" }), { transform: tr(188, 150, 0.8) }) +
      G(boxBot({ t: t, lift: 0.5 + 0.5 * Math.sin(t * 3), turn: 0 }), { transform: tr(226, 60, 0.42) }) +
      "</svg>";
  }

  function sceneTitle(scene, beat, t) {
    var one = scene.first, two = scene.first + 1;
    var a = inAt(t, BEATS[one].start, 1.0), b = inAt(t, BEATS[two].start, 0.7);
    var motif = titleMotif({ t: t, tilesAt: cue(one, "every"), see: bump(t, cue(two, "see"), 1.6), xray: on(t, cue(two, "hide"), 0.8) });
    return '<div class="title">' +
      '<div class="tfig glow" style="opacity:' + (0.18 + a * 0.82).toFixed(3) +
        ";transform:translateY(" + ((1 - a) * 26).toFixed(2) + "px) scale(" + (0.94 + a * 0.06).toFixed(3) + ')">' + motif + "</div>" +
      '<div class="tw">' +
        '<p class="eyebrow" style="opacity:' + a.toFixed(3) + '">' + esc(F.subtitle) + " · Unit lecture</p>" +
        '<h1 style="opacity:' + a.toFixed(3) + ";transform:translateY(" + ((1 - a) * 16).toFixed(2) + 'px)">' + esc(F.title) + "</h1>" +
        '<p class="tsub" style="opacity:' + b.toFixed(3) + ";transform:translateY(" + ((1 - b) * 12).toFixed(2) + 'px)">' +
          "What computers do, and the programs they run.<br>What goes in and what comes out.<br>The computers hiding in things, and robots.</p>" +
      "</div></div>";
  }

  /* ==== scene: what is a computer? =============================================
     One laptop running its programs; then the line-up, biggest to smallest,
     each named as it is said, and all four ticked. */
  function sceneKinds(scene, beat, t, i) {
    var b0 = scene.first, b1 = b0 + 1, DX = 60;
    var u = on(t, sc(scene, 0, "sizes"), 0.9);
    var lapS = lerp(0.8, 0.55, u) * (1 + 0.05 * bump(t, sc(scene, 0, "machine"), 0.6));
    var lx = lerp(584 - 176, DX + 400, u), ly = lerp(58, 186, u);
    var names = [["desktop", "desktop", DX + 175], ["laptop", "laptop", DX + 521], ["tablet", "tablet", DX + 805], ["phone", "smartphone", DX + 995]];
    var out = L(DX - 10, 356, DX + 1030, 356, P.line, 2, { opacity: u });
    /* a pool of light under each computer as it is named */
    var spots = [[DX + 165, 170], [DX + 521, 140], [DX + 805, 76], [DX + 995, 46]];
    for (var s0 = 0; s0 < 4; s0++) {
      var so = on(t, cue(b1, names[s0][0]), 0.4);
      if (so > 0) out += E(spots[s0][0], 357, spots[s0][1], 13, P.blue, null, null, { opacity: 0.35 * so });
    }
    var pop = function (k) { return 1 + 0.08 * bump(t, cue(b1, names[k][0]), 0.7); };
    out += G(desktop(DX, 144, 1, tiles(210, 130, t, null), "kd", 1), { opacity: u, transform: "translate(0," + n2((1 - u) * 30) + ") " + around(DX + 165, 250, pop(0)) });
    out += G(laptop(lx, ly, lapS, tiles(408, 248, t, sc(scene, 0, "programs")), "kl", 1), { transform: around(DX + 521, 270, pop(1)) });
    out += G(tabletP(DX + 740, 168, 130, 186, tiles(106, 112, t, null), "kt", 1), { opacity: u, transform: "translate(0," + n2((1 - u) * 30) + ") " + around(DX + 805, 261, pop(2)) });
    out += G(phone(DX + 962, 230, 66, 124, tiles(54, 90, t, null), "kp", 1), { opacity: u, transform: "translate(0," + n2((1 - u) * 30) + ") " + around(DX + 995, 292, pop(3)) });
    var all = cue(b1, "all");
    for (var k = 0; k < 4; k++) {
      var at = cue(b1, names[k][0]), o = on(t, at, 0.35);
      if (o <= 0) continue;
      out += Tx(names[k][2], 396, names[k][1], "lab mid", "middle", { opacity: o });
      out += tick(names[k][2] + names[k][1].length * 5.6 + 22, 389, 13, popIn(t, all == null ? null : all + k * 0.15, 0.35));
    }
    var ab = on(t, all, 0.45);
    if (ab > 0) out += Tx(DX + 520, 44, "All four are computers", "lab big gold", "middle", { opacity: ab, transform: "translate(0," + n2((1 - ab) * 10) + ")" });
    return svg(out);
  }

  /* ==== scene: what are computers for? =========================================
     Five cards, and the laptop's screen doing each job as it is named; for the
     fifth, the laptop gives way to a washing machine, whose computer is inside. */
  var JOBS = [
    { pic: "📞", what: "talking to Grandma", word: "communication" },
    { pic: "🎬", what: "a film, or a game", word: "entertainment" },
    { pic: "🎨", what: "a picture, or music", word: "creativity" },
    { pic: "🔎", what: "finding out about lions", word: "research" },
    { pic: null, what: "a washing machine", word: "control" }
  ];
  function sceneJobs(scene, beat, t, i) {
    var b0 = scene.first, k = i - b0, five = sc(scene, 0, "five");
    function screenFor(kk) {
      var bi = b0 + kk, job = BEATS[bi].art.job;
      if (job === 0) return callScreen(t, BEATS[bi].start + 0.2, 408, 248, null);
      if (job === 1) {
        var g = on(t, cue(bi, "game"), 0.45);
        return G(filmScreen(t, cue(bi, "act"), 408, 248), { opacity: 1 - g }) + (g > 0 ? G(gameScreen(t, cue(bi, "game"), 408, 248), { opacity: g }) : "");
      }
      if (job === 2) return paintScreen(t, cue(bi, "act"), cue(bi, "music"), 408, 248);
      if (job === 3) return searchScreen(t, cue(bi, "act"), 408, 248);
      return tiles(408, 248, t, null);
    }
    var u = k === 0 ? 1 : into(t, i);
    var inner = (u < 1 && k > 0 ? G(screenFor(k - 1), { opacity: 1 - u }) : "") + G(screenFor(k), { opacity: u });
    var wm = k === 5 ? into(t, i) : 0;
    var out = laptop(30, 60, 1, inner, "jl", 1 - wm);
    if (wm > 0) {
      var act = cue(i, "act");
      out += G(washer({ t: t, id: "jw", level: 0.55, turn: t * 2.4, fast: 0.3, display: "0:45", xray: on(t, act, 0.6), glow: 0.6 + 0.4 * breathe(t) }),
        { transform: tr(96, 44, 1.55), opacity: wm });
      out += Tx(251, 420, "the computer inside controls it", "lab mid gold", "middle", { opacity: on(t, cue(i, "word"), 0.4) });
    }
    for (var j = 0; j < 5; j++) {
      var p = popIn(t, (five == null ? BEATS[b0].start + 1 : five) + j * 0.18, 0.35);
      if (p <= 0) continue;
      var y = 8 + j * 84, x = 590, bi = b0 + 1 + j, now = i === bi, done = i > bi;
      var w = on(t, cue(bi, "word"), 0.35) * (i >= bi ? 1 : 0);
      var card = R(x, y, 570, 74, 16, now ? "#1B3A52" : P.card, now ? P.gold : P.line, now ? 3 : 2) + C(x + 40, y + 37, 27, P.cell);
      card += JOBS[j].pic ? Em(x + 40, y + 38, 30, JOBS[j].pic) : G(washer({ t: t, id: "jmw" + j, level: 0.5, turn: t * 2 }), { transform: tr(x + 21, y + 17, 0.19) });
      card += Tx(x + 82, y + (w > 0 ? 29 : 44), JOBS[j].what, "lab mid" + (now || done ? "" : " muted"), "start");
      if (w > 0) card += Tx(x + 82, y + 62, JOBS[j].word, "lab big", "start", { fill: P.gold, opacity: w });
      card += tick(x + 536, y + 37, 16, done || w >= 1 ? popIn(t, cue(bi, "word"), 0.35) : 0);
      out += G(card, { transform: around(x + 285, y + 37, 0.94 + 0.06 * Math.min(p, 1.05)), opacity: Math.min(1, p) });
    }
    return svg(out);
  }

  /* ==== scene: one computer, many programs =====================================
     The lesson's own tablet and its six programs (Lesson 8, "One computer, many
     programs"). A finger taps each one as it is named, the program opens and
     does its thing, and the list on the right ticks it off. */
  var APPS = [
    { id: "paint", label: "Paint", pic: "🎨" },
    { id: "game", label: "Ball game", pic: "⚽" },
    { id: "write", label: "Writing", pic: "✏️" },
    { id: "video", label: "Videos", pic: "🎬" },
    { id: "call", label: "Call Grandma", pic: "📞" },
    { id: "search", label: "Search", pic: "🔎" }
  ];
  var TAB = { x: 150, y: 2, w: 300, h: 436 }, SCR = { x: 162, y: 36, w: 276, h: 362 };
  function iconAt(k) { return [54 + (k % 3) * 84, 92 + Math.floor(k / 3) * 146]; }
  function appIndex(id) { for (var k = 0; k < APPS.length; k++) if (APPS[k].id === id) return k; return 0; }

  /* When each program opens and closes. Measured on the real narration, the
     three "Open ..." lines run 1.8 to 2.7 seconds, so a program that waited
     for "you can draw" and closed half a second before the next tap was on
     screen for well under a second of drawing. Now a tapped program starts
     working as it opens and stays open until just before the next tap - the
     home screen shows only while the finger moves. The three named in one
     line ("Videos plays films. Call rings Grandma. Search finds things out.")
     switch straight from one to the next, each opening over the last. The
     last stays open into the closing line, long enough to show its result. */
  function appPlan(scene) {
    var plan = [];
    for (var k = 0; k < scene.beats.length; k++) {
      var bi = scene.first + k, a = BEATS[bi].art || {};
      if (a.app) plan.push({ id: a.app, at: cue(bi, "open"), tap: true });
      if (a.apps) a.apps.forEach(function (id) { plan.push({ id: id, at: cue(bi, id), tap: false }); });
    }
    plan = plan.filter(function (p) { return p.at != null; });
    var lastB = scene.first + scene.beats.length - 1, six = cue(lastB, "six");
    for (var j = 0; j < plan.length; j++) {
      var it = plan[j], next = plan[j + 1];
      it.act = it.at + 0.3;
      if (!next) { it.close = six != null ? six + 0.5 : BEATS[lastB].start + 1.5; it.hard = false; }
      else if (next.tap) { it.close = next.at - 0.3; it.hard = false; }
      else { it.close = next.at + 0.45; it.hard = true; }   /* held under the next until it has opened */
    }
    return plan;
  }

  function appBody(id, t, act, w, h) {
    if (id === "paint") return dotsScreen(t, act, w, h);
    if (id === "game") return gameScreen(t, act, w, h);
    if (id === "write") return writeScreen(t, act, w, h);
    if (id === "video") return filmScreen(t, act, w, h);
    if (id === "call") return callScreen(t, act, w, h, act == null ? null : act + 0.15);
    return searchScreen(t, act, w, h);
  }

  function sceneApps(scene, beat, t, i) {
    var plan = appPlan(scene), b0 = scene.first, lastB = b0 + scene.beats.length - 1;
    var run = sc(scene, 0, "run"), appCue = sc(scene, 0, "app");
    var opened = function (id) { for (var j = 0; j < plan.length; j++) if (plan[j].id === id && plan[j].at != null && t >= plan[j].at) return plan[j].at; return null; };
    /* which programs are open (two, for a moment, when one opens over another),
       how far, and where the finger is */
    var opens = [], fx = null, fy = null, fo = 0, prevPos = [SCR.w * 0.8, SCR.h + 40];
    for (var j = 0; j < plan.length; j++) {
      var it = plan[j], pos = iconAt(appIndex(it.id));
      if (it.tap && t >= it.at - 0.6 && t < it.at + 0.25) {
        var m = ease((t - (it.at - 0.6)) / 0.5);
        fx = lerp(prevPos[0], pos[0], m); fy = lerp(prevPos[1], pos[1], m);
        fo = Math.min(inAt(t, it.at - 0.6, 0.15), 1 - inAt(t, it.at + 0.05, 0.2));
      }
      if (t >= it.at && t < it.close) opens.push({ it: it, z: Math.min(inAt(t, it.at + 0.05, 0.35), it.hard ? 1 : 1 - inAt(t, it.close - 0.3, 0.3)) });
      prevPos = pos;
    }
    var top = opens.length ? opens[opens.length - 1] : null, cur = top ? top.it : null, z = top ? top.z : 0;
    var six = cue(lastB, "six"), one = cue(lastB, "one");
    var home = "";
    for (var k = 0; k < 6; k++) {
      var p = iconAt(k), a = APPS[k], show = run == null ? 1 : popIn(t, run + k * 0.14, 0.35);
      if (show <= 0) continue;
      var puls = 1 + 0.12 * bump(t, six == null ? null : six + 0.6 + k * 0.16, 0.5);
      home += G(R(p[0] - 34, p[1] - 34, 68, 68, 18, TILE[k]) + Em(p[0], p[1] + 1, 36, a.pic) +
        Tx(p[0], p[1] + 58, a.label, "lab tiny", "middle") +
        (opened(a.id) != null ? C(p[0] + 30, p[1] - 30, 9, P.good, P.glass, 2) : ""),
        { transform: around(p[0], p[1], Math.min(show, 1.1) * puls), opacity: Math.min(1, show) });
    }
    var inner = home;
    opens.forEach(function (o) {
      if (!(o.z > 0)) return;
      var ip = iconAt(appIndex(o.it.id)), A = APPS[appIndex(o.it.id)];
      var frame = R(0, 0, SCR.w, SCR.h, 0, P.glass) + G(appBody(o.it.id, t, o.it.act, SCR.w, SCR.h - 40), { transform: "translate(0,40)" }) +
        R(0, 0, SCR.w, 40, 0, P.cell) + Tx(12, 26, "🏠 Home", "lab tiny", "start") + Tx(SCR.w - 12, 27, A.label, "lab small", "end");
      inner += G(frame, { transform: "translate(" + n2(ip[0] * (1 - o.z)) + "," + n2(ip[1] * (1 - o.z)) + ") scale(" + n3(Math.max(o.z, 0.001)) + ")", opacity: o.z });
    });
    var glowOne = on(t, one, 0.5);
    var out = (glowOne > 0 ? R(TAB.x - 10, TAB.y - 6, TAB.w + 20, TAB.h + 8, 30, "none", P.gold, 4, { opacity: glowOne * (0.6 + 0.4 * breathe(t)) }) : "") +
      tabletP(TAB.x, TAB.y, TAB.w, TAB.h, inner, "at", 1);
    if (fx != null) out += finger(SCR.x + fx, SCR.y + fy, fo);
    for (var q = 0; q < plan.length; q++) if (plan[q].tap) {
      var ipq = iconAt(appIndex(plan[q].id));
      out += ripple(SCR.x + ipq[0], SCR.y + ipq[1], t, plan[q].at);
    }
    var ca = on(t, appCue, 0.4);
    if (ca > 0) {
      var i0 = iconAt(0);
      out += G(L(SCR.x + i0[0] - 20, SCR.y + i0[1] - 36, SCR.x + i0[0] - 44, 22, P.gold, 3) +
        R(SCR.x + i0[0] - 84, 2, 80, 34, 17, P.gold) + Tx(SCR.x + i0[0] - 44, 26, "app", "lab mid dark", "middle"),
        { opacity: ca * (1 - on(t, BEATS[b0 + 1].start, 0.4)) });
    }
    /* the list on the right */
    var title = ca > 0 ? "Programs, or apps" : "Programs on this tablet";
    out += Tx(530, 34, title, "lab mid muted", "start", { opacity: run == null ? 1 : on(t, run, 0.4) });
    var count = 0;
    for (var r2 = 0; r2 < 6; r2++) {
      var app = APPS[r2], ro = run == null ? 1 : on(t, run + r2 * 0.14, 0.35);
      if (ro <= 0) continue;
      var y = 58 + r2 * 50, at = opened(app.id), live = cur && cur.id === app.id && z > 0.2;
      if (at != null) count++;
      out += G(R(526, y, 620, 44, 12, live ? "#1B3A52" : "none", live ? P.plum : "none", 2) +
        R(532, y + 4, 36, 36, 9, TILE[r2]) + Em(550, y + 23, 22, app.pic) +
        Tx(584, y + 30, app.label, "lab" + (at != null ? "" : " muted"), "start") +
        tick(1118, y + 22, 15, popIn(t, at, 0.35)), { opacity: ro });
    }
    var big = on(t, six, 0.45);
    if (big <= 0) out += Tx(530, 404, count + " of 6 programs opened", "lab mid muted", "start", { opacity: run == null ? 1 : on(t, run + 0.9, 0.4) });
    else {
      out += Tx(530, 406, "6 programs", "lab big gold", "start", { opacity: big }) +
        Tx(730, 406, "·  1 computer", "lab big", "start", { opacity: on(t, one, 0.45) });
    }
    return svg(out);
  }

  /* ==== scenes: information goes in, and comes out =============================
     One picture for both: the inputs on the left, the computer in the middle,
     the outputs on the right, and the touchscreen underneath, which is both.
     Something travels along the cable each time a device is named. */
  var ROWS = [70, 160, 250, 340];
  var INS = [["keyboard", "keyboard", kbd], ["mouse", "mouse", mouseDev], ["mic", "microphone", mic], ["camera", "camera", camera]];
  var OUTS = [["screen", "screen", monitor], ["speaker", "speaker", speakerDev], ["printer", "printer", printer], ["lights", "lights", lamp]];
  function inCable(k) { return cable(278, ROWS[k], 534, 92 + k * 32); }
  function outCable(k) { return cable(634, 92 + k * 32, 890, ROWS[k]); }

  function token(kind, x, y, t) {
    if (kind === "cursor") return G(Pth("M0,0 L0,20 L5,15 L9,23 L13,21 L9,13 L15,13 Z", P.ink, P.dark, 1.5), { transform: tr(x - 6, y - 10) });
    if (kind === "voice") return Pth("M" + n2(x - 16) + "," + n2(y) + " q4,-12 8,0 t8,0 t8,0 t8,0", null, P.teal, 3.5);
    if (kind === "photo") return R(x - 17, y - 13, 34, 26, 3, "#FFFFFF") + picture(x - 14, y - 10, 28, 20);
    if (kind === "tap") return C(x, y, 8, P.ink) + C(x, y, 14, "none", P.ink, 2, { opacity: 0.6 });
    if (kind === "hello") return R(x - 27, y - 12, 54, 24, 12, P.teal) + Tx(x, y + 5, "hello", "lab tiny dark", "middle");
    if (kind === "note") return Tx(x, y + 9, "♪", "lab big", "middle", { fill: P.gold });
    if (kind === "page") return R(x - 11, y - 14, 22, 28, 2, "#FFFFFF") + L(x - 6, y - 6, x + 6, y - 6, P.edge, 2) + L(x - 6, y, x + 6, y, P.edge, 2) + L(x - 6, y + 6, x + 3, y + 6, P.edge, 2);
    if (kind === "spark") return C(x, y, 13, P.gold, null, null, { opacity: 0.35 }) + C(x, y, 6, P.gold);
    return R(x - 11, y - 11, 22, 22, 5, P.gold) + Tx(x, y + 6, kind, "lab small dark", "middle");
  }
  /* a token travelling along a path over `span` seconds from `at`; "" outside that */
  function travel(kind, path, t, at, span) {
    if (at == null || t < at || t > at + span) return "";
    var p = path.at(ease((t - at) / span));
    return token(kind, p[0], p[1], t);
  }

  function sceneIO(scene, beat, t, i) {
    var side = field(scene.first, "side", "in"), inSide = side === "in";
    var c = function (k, name) { return sc(scene, k, name); };
    var said = inSide ? [c(1, "keyboard"), c(1, "mouse"), c(2, "mic"), c(2, "camera")] : [c(1, "screen"), c(1, "speaker"), c(2, "printer"), c(2, "lights")];
    var flowAt = inSide ? c(0, "info") : c(0, "out"), headAt = inSide ? c(0, "input") : c(0, "output");
    var out = "", glow = 0, display = "", flow = on(t, flowAt, 0.5) * (1 - on(t, headAt == null ? null : headAt + 1.6, 0.8));
    /* cables */
    for (var k = 0; k < 4; k++) {
      var ci = inCable(k), co = outCable(k);
      var liveIn = inSide && said[k] != null && t >= said[k], liveOut = !inSide && said[k] != null && t >= said[k];
      out += Pth(ci.d, null, liveIn ? P.teal : P.line, liveIn ? 4 : 3, { opacity: inSide ? 1 : 0.35 });
      out += Pth(co.d, null, liveOut ? P.accent : P.line, liveOut ? 4 : 3, { opacity: inSide ? 0.3 : 1 });
      if (flow > 0) out += Pth(inSide ? ci.d : co.d, null, inSide ? P.teal : P.accent, 4, { "stroke-dasharray": "5 14", "stroke-dashoffset": n2(-t * 50), opacity: flow });
    }
    /* the inputs */
    var ins = "";
    for (var a = 0; a < 4; a++) {
      var at = inSide ? said[a] : null, lit = at != null && t >= at, yk = ROWS[a];
      var o = { t: t, act: at == null ? null : t - at, flash: at == null ? null : t - at - 0.15, click: bump(t, c(1, "click"), 0.5) };
      ins += G(INS[a][2](214, yk, o), { transform: around(214, yk, 1 + 0.1 * bump(t, at, 0.6)) }) +
        Tx(142, yk + 7, INS[a][1], "lab mid" + (lit ? "" : " muted"), "end");
    }
    out += G(ins, { opacity: inSide ? 1 : 0.3 });
    /* the outputs */
    var outs = "", arrive = said.map(function (s) { return s == null ? null : s + 1.1; });
    for (var b = 0; b < 4; b++) {
      var ar = inSide ? null : arrive[b], litO = ar != null && t >= said[b], yo = ROWS[b], oo = { t: t };
      if (b === 0) oo.show = on(t, ar, 0.4);
      if (b === 1) oo.play = ar == null ? null : t - ar;
      if (b === 2) oo.print = ar == null ? 0 : clamp((t - ar) / 1.2, 0, 1);
      if (b === 3) oo.glow = ar == null || t < ar ? 0 : t < ar + 1.5 ? (Math.floor((t - ar) / 0.25) % 2 === 0 ? 1 : 0.12) : 0.3;
      outs += G(OUTS[b][2](954, yo, oo), { transform: around(954, yo, 1 + 0.1 * bump(t, ar, 0.6)) }) +
        Tx(1026, yo + 7, OUTS[b][1], "lab mid" + (litO ? "" : " muted"), "start");
    }
    out += G(outs, { opacity: inSide ? 0.22 : 1 });
    /* what travels */
    var KIN = ["letters", "cursor", "voice", "photo"], KOUT = ["hello", "note", "page", "spark"];
    for (var q = 0; q < 4; q++) {
      if (said[q] == null) continue;
      if (inSide) {
        if (q === 0) { for (var l = 0; l < 5; l++) out += travel("hello".charAt(l), inCable(0), t, said[0] + 0.35 + l * 0.14, 1.1); }
        else out += travel(KIN[q], inCable(q), t, said[q] + 0.35, 1.1);
        var land = said[q] + (q === 0 ? 0.35 + 4 * 0.14 : 0.35) + 1.1;
        glow = Math.max(glow, bump(t, land - 0.1, 0.9));
        if (t >= land) display = q;
      } else {
        out += travel(KOUT[q], outCable(q), t, said[q] + 0.1, 1.0);
        glow = Math.max(glow, bump(t, said[q] - 0.2, 0.8));
      }
    }
    /* the touchscreen, underneath: an input, and in the second scene both */
    var touch = inSide ? c(3, "touch") : c(3, "tapin"), up = inSide ? c(3, "goes") : c(3, "tapin"), down = inSide ? null : c(3, "picout"), both = inSide ? null : c(3, "both");
    var tabInner = picture(0, 0, 48, 46);
    tabInner = G(tabInner, { opacity: inSide ? 0.25 : 0.25 + 0.75 * on(t, down == null ? null : down + 0.9, 0.4) });
    var hl = both != null ? on(t, both, 0.4) : on(t, touch, 0.4);
    out += (hl > 0 ? R(540, 292, 88, 136, 24, "none", inSide ? P.teal : P.gold, 3, { opacity: hl * (0.55 + 0.45 * breathe(t)) }) : "") +
      tabletP(548, 300, 72, 120, tabInner, "iot", 1) + ripple(584, 357, t, touch);
    var upOn = up != null && t >= up, downOn = down != null && t >= down;
    out += L(574, 296, 574, 234, upOn ? P.teal : P.line, 3) + Pth("M568,262 L574,252 L580,262", null, upOn ? P.teal : P.line, 3) +
      L(594, 234, 594, 296, downOn ? P.accent : P.line, 3, { opacity: inSide ? 0.4 : 1 }) + Pth("M588,268 L594,278 L600,268", null, downOn ? P.accent : P.line, 3, { opacity: inSide ? 0.4 : 1 });
    out += travel("tap", { at: function (u) { return [574, lerp(296, 236, u)]; } }, t, up == null ? null : up + 0.2, 0.7);
    if (down != null) out += travel("photo", { at: function (u) { return [594, lerp(236, 300, u)]; } }, t, down + 0.1, 0.7);
    if (up != null && t >= up + 0.9 && inSide) display = 4;
    out += Tx(636, 368, "touchscreen", "lab small" + (hl > 0 ? "" : " muted"), "start");
    if (both != null) out += Tx(636, 394, "in and out", "lab small gold", "start", { opacity: on(t, both, 0.4) });
    /* the computer */
    var DISP = [
      Tx(584, 101, "hello", "lab mid", "middle", { fill: P.teal }),
      token("cursor", 580, 92, t),
      Pth("M562,93 q5,-14 10,0 t10,0 t10,0 t10,0", null, P.teal, 3.5),
      picture(562, 78, 44, 30),
      C(584, 93, 7, P.ink) + C(584, 93, 13, "none", P.ink, 2, { opacity: 0.6 })
    ];
    var disp = display === "" ? Tx(584, 99, "· · ·", "lab mid muted", "middle") : DISP[display];
    out += tower(534, 40, { t: t, glow: glow, display: disp }) + Tx(584, 30, "computer", "lab small muted", "middle");
    var hd = on(t, headAt, 0.45);
    if (hd > 0) out += inSide
      ? Tx(214, 22, "INPUT  →", "lab mid caps", "middle", { fill: P.teal, opacity: hd })
      : Tx(954, 22, "→  OUTPUT", "lab mid caps", "middle", { fill: P.accent, opacity: hd });
    return svg(out);
  }

  /* ==== scene: computers hiding inside =========================================
     The lesson's own sort, in a grid on the right that fills as each thing is
     named, and on the left the thing being talked about, looked inside. */
  function chipBadge(cx, cy, r, p) {
    if (!(p > 0)) return "";
    return G(C(cx, cy, r, P.cell, P.good, 2.5) + chip(cx, cy, r * 0.78, 0.3), { transform: around(cx, cy, p), opacity: Math.min(1, p) });
  }

  function sceneHidden(scene, beat, t, i) {
    var b0 = scene.first;
    var reveal = {
      washer: sc(scene, 1, "has"), lights: sc(scene, 2, "has"),
      microwave: sc(scene, 3, "microwave"), car: sc(scene, 3, "car"), watch: sc(scene, 3, "watch"), tv: sc(scene, 3, "tv"),
      spoon: sc(scene, 4, "spoon"), book: sc(scene, 4, "book"), candle: sc(scene, 4, "candle")
    };
    var out = "";
    for (var n = 0; n < 9; n++) {
      var id = THING_ORDER[n], th = THINGS[id], x = 600 + (n % 3) * 190, y = 4 + Math.floor(n / 3) * 146;
      var ap = popIn(t, BEATS[b0].start + 0.3 + n * 0.1, 0.35);
      if (ap <= 0) continue;
      var rv = on(t, reveal[id], 0.4);
      var card = R(x, y, 178, 136, 18, P.card, rv > 0 ? (th.has ? P.good : P.bad) : P.line, rv > 0 ? 2.5 : 2) +
        G(fit(id, { t: t, id: "g" + id, xray: th.has ? rv : 0, label: 0, level: 0.4, phase: 0, display: "", sec: t }, x + 89, y + 58, 118, 74), { opacity: th.has || rv <= 0 ? 1 : 0.55 }) +
        Tx(x + 89, y + 124, th.name, "lab small" + (rv > 0 ? "" : " muted"), "middle");
      card += rv <= 0 ? qmark(x + 156, y + 22, 14, 1) : th.has ? chipBadge(x + 156, y + 22, 15, popIn(t, reveal[id], 0.35)) : cross(x + 156, y + 22, 15, popIn(t, reveal[id], 0.35));
      out += G(card, { opacity: Math.min(1, ap), transform: around(x + 89, y + 68, 0.9 + 0.1 * Math.min(ap, 1.05)) });
    }

    function focus(bi) {
      var k = bi - b0, f = "";
      if (k === 0) {
        var look = cue(bi, "look"), hid = cue(bi, "hiding");
        f += laptop(24, 150, 0.42, tiles(408, 248, t, null), "hl", 1) +
          Tx(116, 322, "looks like a computer", "lab small", "middle", { opacity: on(t, look, 0.4) }) +
          G(washer({ t: t, id: "hw0", level: 0.3, turn: t * 0.8, xray: on(t, hid, 0.7), glow: 0.6 + 0.4 * breathe(t), display: "0:45" }), { transform: tr(232, 70, 1.12) }) +
          Tx(344, 344, "does not look like one", "lab small", "middle", { opacity: on(t, look == null ? null : look + 0.8, 0.4) });
        return f;
      }
      if (k === 1) {
        var fill = cue(bi, "fill"), wash = cue(bi, "wash"), spin = cue(bi, "spin");
        var turn = 1.8 * clamp(t - (wash == null ? 1e9 : wash), 0, spin == null ? 0 : Math.max(0, spin - wash)) + 14 * Math.max(0, t - (spin == null ? 1e9 : spin));
        var step = spin != null && t >= spin ? "spin" : wash != null && t >= wash ? "wash" : fill != null && t >= fill ? "fill" : "";
        f += G(washer({ t: t, id: "hw1", level: on(t, fill, 1.2) * 0.6, turn: turn, fast: on(t, spin, 0.5), xray: 1, glow: 0.6 + 0.4 * breathe(t), display: step }), { transform: tr(128, 8, 1.48) });
        var steps = [["fill", fill], ["wash", wash], ["spin", spin]];
        for (var s = 0; s < 3; s++) {
          var sx = 110 + s * 150, lit = steps[s][1] != null && t >= steps[s][1], o = on(t, steps[s][1], 0.3);
          f += R(sx - 55, 372, 110, 44, 12, lit ? P.teal : P.cell, lit ? null : P.line, 2, { opacity: 0.4 + 0.6 * o }) +
            Tx(sx, 401, steps[s][0], "lab mid" + (lit ? " dark" : " muted"), "middle");
          if (s < 2) f += Pth("M" + (sx + 62) + ",394 L" + (sx + 86) + ",394 M" + (sx + 78) + ",386 L" + (sx + 86) + ",394 L" + (sx + 78) + ",402", null, P.muted, 3);
        }
        return f;
      }
      if (k === 2) {
        var dec = cue(bi, "decides"), ch = cue(bi, "change");
        var phase = dec == null || t < dec ? 0 : Math.floor((t - dec) / 0.8);
        return fit("lights", { t: t, phase: phase, xray: on(t, cue(bi, "has"), 0.6), glow: 0.6 + 0.4 * breathe(t) + 0.4 * bump(t, ch, 0.8) }, 250, 212, 320, 400);
      }
      if (k === 3) {
        var four = ["microwave", "car", "watch", "tv"];
        for (var q = 0; q < 4; q++) {
          var cx = 140 + (q % 2) * 280, cy = 110 + Math.floor(q / 2) * 212, at = cue(bi, four[q]), xr = on(t, at, 0.5);
          f += R(cx - 130, cy - 100, 260, 196, 16, P.card, xr > 0 ? P.good : P.line, 2) +
            fit(four[q], { t: t, id: "f" + q, xray: xr, label: 0, glow: 0.5 + 0.5 * breathe(t), run: 1, turn: t * 2.2, lights: breathe(t * 0.8),
              display: "0:" + pad2(Math.max(0, 30 - Math.floor(Math.max(0, t - BEATS[bi].start)))), sec: 42 + t, channel: Math.floor(t / 1.1) }, cx, cy - 14, 190, 124) +
            Tx(cx, cy + 82, THINGS[four[q]].name, "lab mid", "middle");
        }
        return f;
      }
      var none = ["spoon", "book", "candle"];
      for (var m = 0; m < 3; m++) {
        var px = 95 + m * 185, at2 = cue(bi, none[m]), sweep = at2 == null ? -1 : (t - at2) / 0.8;
        f += R(px - 86, 20, 172, 330, 16, P.card, sweep >= 1 ? P.bad : P.line, 2) +
          fit(none[m], { t: t }, px, 170, 140, 200) + Tx(px, 332, THINGS[none[m]].name, "lab mid", "middle");
        if (sweep > 0 && sweep < 1) f += L(px - 76 + 152 * sweep, 30, px - 76 + 152 * sweep, 310, P.gold, 4) +
          R(px - 76, 30, 152 * sweep, 280, 0, P.gold, null, null, { opacity: 0.08 });
        f += cross(px + 58, 50, 20, popIn(t, at2 == null ? null : at2 + 0.8, 0.35));
      }
      return f + Tx(280, 404, "nothing inside decides what they do", "lab mid gold", "middle", { opacity: on(t, cue(bi, "nothing"), 0.4) });
    }
    return svg(crossfade(t, i, scene, focus) + out);
  }

  /* ==== scene: robots ============================================================ */
  var PLACES = [
    ["🏭", "a factory", "a robot arm", 1, "factory"],
    ["🏠", "at home", "a robot vacuum", 2, "home"],
    ["🚀", "Mars", "a rover", 3, "mars"],
    ["🏥", "a hospital", "a delivery robot", 4, "hospital"],
    ["📦", "a warehouse", "a parcel robot", 4, "warehouse"],
    ["🌊", "under the sea", "an explorer robot", 4, "sea"]
  ];
  var BLOCKS = ["▶  forward", "▶  forward", "✋  pick up"];

  function miniArm(x, y, s) {
    return G(R(-30, -10, 60, 20, 6, P.body, P.edge, 2) + L(0, -10, -40, -90, P.gold, 16) + L(-40, -90, 40, -120, P.gold, 12) +
      C(0, -10, 10, P.body, P.edge, 2) + C(-40, -90, 9, P.body, P.edge, 2) + C(40, -120, 6, P.edge), { transform: tr(x, y, s) });
  }
  function miniRover(x, y, s) {
    return G(R(-80, -44, 160, 10, 3, P.blue, P.edge, 2) + R(-70, -34, 140, 34, 6, P.plastic, P.edge, 3) + L(40, -44, 40, -92, P.edge, 5) +
      R(26, -108, 34, 18, 4, P.body, P.edge, 2) + wheel(-50, 22, 16, 0) + wheel(0, 22, 16, 0) + wheel(50, 22, 16, 0), { transform: tr(x, y, s) });
  }

  function sceneRobots(scene, beat, t, i) {
    var b0 = scene.first, out = "";
    var lt = on(t, BEATS[b0 + 1].start - GAP, 0.5);
    if (lt > 0) out += Tx(690, 30, "Where robots work", "lab mid muted", "start", { opacity: lt });
    for (var r = 0; r < 6; r++) {
      var at = sc(scene, PLACES[r][3], PLACES[r][4]), o = popIn(t, at, 0.4);
      if (o <= 0) continue;
      var y = 48 + r * 64, now = i === b0 + PLACES[r][3];
      out += G(R(684, y, 476, 56, 14, now ? "#1B3A52" : P.card, now ? P.gold : P.line, now ? 3 : 2) +
        Em(716, y + 29, 28, PLACES[r][0]) + Tx(748, y + 25, PLACES[r][1], "lab", "start") +
        Tx(748, y + 47, PLACES[r][2], "lab small muted", "start"),
        { opacity: Math.min(1, o), transform: around(922, y + 28, 0.92 + 0.08 * Math.min(o, 1.05)) });
    }

    function focus(bi) {
      var k = bi - b0, f = "";
      if (k === 0) {
        /* the program runs from "Its program", a block every 0.6 s, so it has
           finished - moved twice and picked the parcel up - before the line ends */
        var prog = cue(bi, "program"), step = prog == null ? -1 : (t - prog - 0.5) / 0.6;
        var bx = 40 + 110 * clamp(step, 0, 2), lift = clamp(step - 2, 0, 1);
        f += R(468, 262 - 39 * lift, 60, 50, 6, P.goldDeep, P.edge, 2) + L(468, 287 - 39 * lift, 528, 287 - 39 * lift, P.edge, 2);
        f += G(boxBot({ t: t, xray: on(t, cue(bi, "computer"), 0.6), glow: 0.6 + 0.4 * breathe(t), lift: lift, turn: clamp(step, 0, 2) * 4 }),
          { transform: tr(bx, 150, 1.3) + " " + around(80, 100, 1 + 0.06 * bump(t, cue(bi, "machine"), 0.6)) });
        var po = on(t, prog, 0.4);
        for (var j = 0; j < 3; j++) {
          var lit = step >= j && step < j + 1, bo = on(t, prog == null ? null : prog + j * 0.15, 0.35);
          if (bo <= 0) continue;
          f += G(R(20 + j * 200, 14, 180, 50, 12, lit ? P.gold : P.teal, lit ? P.ink : null, 3) +
            Tx(110 + j * 200, 46, BLOCKS[j], "lab mid dark", "middle"), { opacity: bo * po });
        }
        return f;
      }
      if (k === 1) {
        var bld = cue(bi, "builds");
        return factory(t, on(t, cue(bi, "factory") == null ? null : cue(bi, "factory") - 0.3, 1.6), bld == null ? null : t - bld);
      }
      if (k === 2) {
        var cl = cue(bi, "cleans"), chg = cue(bi, "charge");
        var clean = cl == null ? 0 : clamp((t - cl) / Math.max(0.5, (chg == null ? cl + 4 : chg) - cl - 0.1), 0, 1);
        return vacuumRoom(t, clean, chg == null ? 0 : clamp((t - chg) / 0.9, 0, 1));
      }
      if (k === 3) {
        var dr = cue(bi, "drives"), pic = cue(bi, "pictures");
        return mars(t, dr == null ? 0 : clamp((t - dr) / 2.6, 0, 1), pic == null ? null : t - pic);
      }
      if (k === 4) {
        var panels = [["hospital", hospitalPanel], ["warehouse", warehousePanel], ["sea", seaPanel]];
        var names = ["hospital", "warehouse", "under the sea"];
        for (var q = 0; q < 3; q++) {
          var o = on(t, cue(bi, panels[q][0]), 0.45), px = 10 + q * 212;
          f += G(panels[q][1](t, o), { transform: tr(px, 40), opacity: 0.25 + 0.75 * o }) +
            Tx(px + 98, 376, names[q], "lab mid" + (o > 0.5 ? "" : " muted"), "middle");
        }
        return f;
      }
      if (k === 5) {
        var most = cue(bi, "most"), ppl = cue(bi, "people");
        f += miniArm(96, 300, 1.2) + G(boxBot({ t: t }), { transform: tr(200, 150, 0.8) }) + miniRover(430, 290, 0.9);
        var lo = on(t, most, 0.4);
        f += Tx(96, 360, "an arm", "lab mid", "middle", { opacity: lo }) + Tx(264, 360, "a box", "lab mid", "middle", { opacity: on(t, most == null ? null : most + 0.25, 0.4) }) +
          Tx(430, 360, "a car", "lab mid", "middle", { opacity: on(t, most == null ? null : most + 0.5, 0.4) });
        var po2 = on(t, ppl, 0.5);
        if (po2 > 0) f += humanoid(588, 300, 0.9, 0.7 * po2) + Tx(588, 360, "only a few", "lab small muted", "middle", { opacity: po2 });
        return f;
      }
      var no = cue(bi, "not"), ped = cue(bi, "pedal");
      f += G(bike(t * 3), { transform: tr(40, 0) });
      f += cross(560, 80, 30, popIn(t, no, 0.4)) + Tx(560, 140, "not a robot", "lab mid", "middle", { opacity: on(t, no, 0.4) }) +
        Tx(560, 166, "no computer inside", "lab small muted", "middle", { opacity: on(t, no == null ? null : no + 0.4, 0.4) });
      var pe = on(t, ped, 0.4);
      if (pe > 0) f += G(C(310, 290, 46, "none", P.gold, 4, { "stroke-dasharray": "18 10", transform: "rotate(" + n2(t * 172) + " 310 290)" }) +
        Tx(310, 400, "you pedal it", "lab mid gold", "middle"), { opacity: pe });
      return f;
    }
    return svg(G(crossfade(t, i, scene, focus), {}) + out);
  }

  /* ==== scene: what you now know ================================================ */
  var RECAP = [
    ["Lots of jobs", "talk, play, make, find out, control", 0, "jobs"],
    ["Many programs", "one computer, many apps", 0, "programs"],
    ["Input", "keyboard, mouse, microphone, camera", 1, "in"],
    ["Output", "screen, speaker, printer, lights", 1, "out"],
    ["Hidden computers", "washing machine, traffic lights, car", 1, "hide"],
    ["Robots", "a computer inside makes it move", 2, "robot"]
  ];
  function recapArt(k, x, y, t) {
    if (k === 0) return Em(x + 88, y + 70, 40, "📞") + Em(x + 148, y + 70, 40, "🎬") + Em(x + 208, y + 70, 40, "🎨") + Em(x + 268, y + 70, 40, "🔎");
    if (k === 1) return tabletP(x + 148, y + 12, 80, 118, tiles(56, 44, t, null), "rt", 1);
    if (k === 2) return Em(x + 60, y + 70, 34, "⌨️") + Em(x + 110, y + 70, 34, "🖱️") + Em(x + 160, y + 70, 34, "🎤") + Em(x + 210, y + 70, 34, "📷") +
      Tx(x + 262, y + 80, "→", "lab big", "middle", { fill: P.teal }) + chip(x + 318, y + 70, 34, 0.4);
    if (k === 3) return chip(x + 60, y + 70, 34, 0.4) + Tx(x + 116, y + 80, "→", "lab big", "middle", { fill: P.accent }) +
      Em(x + 168, y + 70, 34, "🖥️") + Em(x + 216, y + 70, 34, "🔊") + Em(x + 264, y + 70, 34, "🖨️") + Em(x + 312, y + 70, 34, "💡");
    if (k === 4) return G(washer({ t: t, id: "rw", level: 0.45, turn: t * 1.5, xray: 1, label: 0, glow: 0.7, display: "0:45" }), { transform: tr(x + 132, y + 6, 0.58) });
    return G(boxBot({ t: t, lift: 0.5 + 0.5 * Math.sin(t * 2.4) }), { transform: tr(x + 150, y + 22, 0.55) });
  }
  function sceneRecap(scene, beat, t, i) {
    var out = "", go = sc(scene, 3, "go");
    for (var k = 0; k < 6; k++) {
      var x = 4 + (k % 3) * 390, y = 8 + Math.floor(k / 3) * 216, at = sc(scene, RECAP[k][2], RECAP[k][3]);
      var p = popIn(t, at, 0.4), lit = p > 0, pulse = go != null && t >= go ? 0.6 + 0.4 * breathe(t + k * 0.4) : 1;
      out += G(R(x, y, 376, 204, 22, lit ? "#1B3A52" : P.card, lit ? P.teal : P.line, lit ? 3 : 2, { "stroke-opacity": lit ? pulse : 1 }) +
        recapArt(k, x, y, t) +
        Tx(x + 22, y + 164, RECAP[k][0], "lab big", "start") + Tx(x + 22, y + 190, RECAP[k][1], "lab small muted readable", "start"),
        { opacity: 0.32 + 0.68 * Math.min(1, p), transform: around(x + 188, y + 102, lit ? 0.96 + 0.04 * Math.min(p, 1.08) : 0.96) });
    }
    return svg(out);
  }

  var KINDS = {
    title: sceneTitle, kinds: sceneKinds, jobs: sceneJobs, apps: sceneApps,
    io: sceneIO, hidden: sceneHidden, robots: sceneRobots, recap: sceneRecap
  };

  /* ---- the title card and the end card ---------------------------------
     The maths film's cards: silent timeline segments, not beats. */
  function openCard(t) {
    var c = F.cards.open;
    var u = clamp((t - c.start) / Math.max(c.end - c.start, 0.001), 0, 1);
    var a = inAt(t, c.start + 0.15, 0.85);
    var b = inAt(t, c.start + 0.55, 0.9);
    var d = inAt(t, c.start + 1.15, 0.9);
    var out = 1 - ease((u - 0.86) / 0.14);
    return '<div class="card-slide open" style="opacity:' + (a * out).toFixed(3) + '">' +
      '<div class="cs-fig" style="opacity:' + (a * 0.13).toFixed(3) +
        ";transform:scale(" + (1.04 + u * 0.05).toFixed(4) + ')">' + titleMotif({ t: t }) + "</div>" +
      '<div class="cs-in">' +
        '<div class="cs-mark" style="opacity:' + a.toFixed(3) +
          ";transform:scale(" + (0.86 + a * 0.14).toFixed(3) + ')">E</div>' +
        '<p class="eyebrow" style="opacity:' + a.toFixed(3) + '">Ehel Academy · ' + esc(F.subtitle) + "</p>" +
        '<h1 style="opacity:' + b.toFixed(3) + ";transform:translateY(" + ((1 - b) * 18).toFixed(2) + 'px)">' +
          esc(F.title) + "</h1>" +
        '<div class="cs-rule" style="transform:scaleX(' + d.toFixed(3) + ')"></div>' +
        '<p class="cs-by" style="opacity:' + d.toFixed(3) +
          ";transform:translateY(" + ((1 - d) * 8).toFixed(2) + 'px)">' +
          "A short unit lecture by the Ehel Academy Virtual Teacher</p>" +
        '<p class="cs-sub" style="opacity:' + inAt(t, c.start + 1.55, 0.8).toFixed(3) +
          '">' + esc(F.framework || "Cambridge Primary Computing 0059") + " · Stage " + esc(F.stage) + "</p>" +
      "</div></div>";
  }

  function endCard(t) {
    var c = F.cards.end;
    var u = clamp((t - c.start) / Math.max(c.end - c.start, 0.001), 0, 1);
    var a = inAt(t, c.start + 0.35, 0.8);
    var b = inAt(t, c.start + 0.85, 0.8);
    var codes = (F.objectives || []).map(function (o, n) {
      var k = inAt(t, c.start + 1.15 + n * 0.09, 0.5);
      return '<span style="opacity:' + k.toFixed(3) +
        ";transform:translateY(" + ((1 - k) * 8).toFixed(2) + 'px)">' + esc(o[0]) + "</span>";
    }).join("");
    return '<div class="card-slide end" style="opacity:' + a.toFixed(3) + '">' +
      '<div class="cs-fig" style="opacity:' + (a * 0.11).toFixed(3) +
        ";transform:scale(" + (1.0 + u * 0.05).toFixed(4) + ')">' + titleMotif({ t: t }) + "</div>" +
      '<div class="cs-in">' +
        '<p class="eyebrow" style="opacity:' + a.toFixed(3) + '">That is the whole lesson</p>' +
        '<h1 style="opacity:' + a.toFixed(3) + ";transform:translateY(" + ((1 - a) * 14).toFixed(2) + 'px)">' +
          esc(F.title) + "</h1>" +
        '<div class="cs-rule" style="transform:scaleX(' + b.toFixed(3) + ')"></div>' +
        '<p class="cs-cap" style="opacity:' + b.toFixed(3) + '">What this lesson covered</p>' +
        '<div class="cs-codes">' + codes + "</div>" +
        '<p class="cs-sign" style="opacity:' + inAt(t, c.start + 2.2, 0.8).toFixed(3) + '">' +
          '<span class="cs-mark sm">E</span>Ehel Academy · ' + esc(F.subtitle) + "</p>" +
      "</div></div>";
  }

  /* ---- the frame --------------------------------------------------------- */
  function frame(t) {
    var film = document.getElementById("film");
    if (F.cards && t < F.cards.open.end) {
      film.style.setProperty("--hue", HUE.title);
      film.innerHTML = openCard(t);
      return;
    }
    if (F.cards && t >= F.cards.end.start) {
      film.style.setProperty("--hue", HUE.recap);
      film.innerHTML = endCard(t);
      return;
    }

    var i = beatAt(t);
    var beat = BEATS[i];
    var scene = F.scenes[beat.scene];
    var draw = KINDS[scene.kind];
    if (!draw) throw new Error("storyboard scene " + scene.id + ": no drawing for kind " + scene.kind);

    var fade = inAt(t, scene.start, 0.4);
    film.style.setProperty("--hue", HUE[scene.id] || P.teal);

    var span = Math.max(scene.end - scene.start, 0.001);
    var d = clamp((t - scene.start) / span, 0, 1);

    film.innerHTML =
      chrome(scene, t) +
      '<main class="stage" style="opacity:' + fade.toFixed(3) +
        ";transform:translateY(" + ((1 - fade) * 14 - d * 4).toFixed(2) +
        "px) scale(" + (1 + d * 0.008).toFixed(4) + ')">' +
        heading(scene, t, i) +
        draw(scene, beat, t, i) +
      "</main>" +
      band(beat, t);
  }

  /* cues(i) is for checking, not rendering: when each named phrase of beat i
     is estimated to be said, so a frame can be taken exactly there */
  window.EHEL_FILM = {
    frame: frame,
    total: TOTAL,
    cues: function (i) {
      var at = (BEATS[i].art && BEATS[i].art.at) || {}, out = {};
      Object.keys(at).forEach(function (k) { out[k] = cue(i, k); });
      return { start: BEATS[i].start, spokenEnd: spokenEnd(i), cues: out };
    }
  };
})();
