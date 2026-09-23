/* The shared engine of the unit lecture films, first half. Assembled by
 * tools/create-ehel-unit-lecture.js as ONE script:
 *
 *     ehel-film-engine-head.js   (this file: opens the IIFE)
 *     <the film's scenes file>   (named by the storyboard: renderer.scenes)
 *     ehel-film-engine-tail.js   (the cards, the frame, the export; closes it)
 *
 * so the three share one scope and none of them is a complete script alone.
 * A scenes file must define, for the tail to use:
 *     HUE          { sceneId: colour }, plus "title" and "recap" for the cards
 *     KINDS        { kind: function (scene, beat, t, i) -> the scene's markup }
 *     titleMotif   function (o) -> an <svg> for the title and end cards
 *
 * One function matters: window.EHEL_FILM.frame(t) paints the whole 1280x720
 * composition for the absolute time t, and returns nothing. Nothing here
 * animates itself - no CSS transition, no requestAnimationFrame - because the
 * renderer screenshots frames one at a time and a self-animating page would
 * hand it whatever the clock happened to say. Every moving thing is a pure
 * function of t, so frame(12.5) draws the same pixels on the tenth run as on
 * the first, and frames can be drawn by several pages at once.
 *
 * This is the maths film's engine (the timeline, the speech cues, the chrome,
 * the caption band, the two cards), which is the science film's with cues
 * added. It was lifted out of the Computing film on 2026-09-18 so that a film
 * in any subject writes its pictures and nothing else; the Computing film's
 * frames were compared before and after, pixel for pixel.
 *
 * Each scene draws ONE svg in a 1168 x 440 space (svg() below).
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

  /* ---- the school whose film this is ----------------------------------
     Hard-coded to Ehel Academy until 2026-09-23, when a Professor Adow TVET
     film put another school's name and crest on every one of its frames.
     A storyboard now says who it belongs to:

       "brand": { "name": "…", "mark": "…", "by": "…" }

     EVERY DEFAULT IS THE STRING THAT WAS THERE, so a film that names no
     brand renders exactly as it did — the nine Ehel films included. */
  var BRAND = F.brand || {};
  var BRAND_NAME = BRAND.name || "Ehel Academy";
  var BRAND_MARK = BRAND.mark || "E";
  var BRAND_BY = BRAND.by || "A short unit lecture by the Ehel Academy Virtual Teacher";

  /* ---- chrome -------------------------------------------------------- */
  function chrome(scene, t) {
    var pct = clamp(t / TOTAL, 0, 1) * 100;
    return '<header class="bar">' +
      '<span class="mark">' + esc(BRAND_MARK) + "</span>" +
      '<span class="brand">' + esc(BRAND_NAME) + "<b>" + esc(F.subtitle) + "</b></span>" +
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

