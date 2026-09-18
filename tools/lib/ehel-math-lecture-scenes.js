/* The browser half of tools/create-ehel-math-unit-lecture.js.
 *
 * One function matters: window.EHEL_FILM.frame(t) paints the whole 1280x720
 * composition for the absolute time t, and returns nothing. Nothing here
 * animates itself - no CSS transition, no requestAnimationFrame - because the
 * renderer screenshots frames one at a time and a self-animating page would
 * hand it whatever the clock happened to say. Every moving thing is a pure
 * function of t, so frame(12.5) draws the same pixels on the tenth run as on
 * the first.
 *
 * UNLIKE THE SCIENCE FILM, EVERY SHAPE HERE IS DRAWN FRESH. Science can lift
 * its skeleton and arm verbatim out of science.js because those are pure,
 * DOM-free functions. Grade 4 Maths' solids, angle wedge, symmetry lines and
 * grids are small closures inside c-shape-slides.js that read and write
 * module-level state and $("id").innerHTML directly - there is nothing to
 * import. So this file redraws the same IDEAS (a cube, a right angle, a
 * five-by-three grid) as its own SVG, matching the lesson's numbers and its
 * dark theme, but not sliced from its code. Owner decision, 2026-09-18 - see
 * the lecture-video README.
 *
 * EVERYTHING THAT IS SAID IS SHOWN MOVING, the way Bones and Muscles lights
 * each bone as it is named. The owner asked for this on 2026-09-18, after the
 * first render: it read as a slideshow. Each scene changed state at a beat
 * boundary, then held still for up to fourteen seconds while the voice went
 * on. So now:
 *   - a solid turns, and its faces, edges and corners light as they are counted;
 *   - a net folds up;
 *   - a shape folds along its line of symmetry, or fails to;
 *   - an angle's arm turns;
 *   - squares are counted one at a time;
 *   - a walker goes round a perimeter.
 * Every movement is keyed to the WORDS that describe it (cue(), below), not
 * to the start of its beat.
 */
(function () {
  "use strict";

  var W = 1280, H = 720;
  var F = window.FILM;            /* the storyboard, plus the measured timeline */

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
  /* the science film's breathing marker, at the same rate */
  var breathe = function (t) { return 0.5 + 0.5 * Math.sin(t * 3.6); };
  /* inAt that stays at 0 for a cue the beat does not name */
  var on = function (t, at, span) { return at == null ? 0 : inAt(t, at, span); };
  var f1 = function (v) { return v.toFixed(1); };
  var f3 = function (v) { return v.toFixed(3); };

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

  function fieldAt(t, i, name, dflt) {
    var now = field(i, name, dflt);
    var prev = i > 0 ? field(i - 1, name, dflt) : dflt;
    if (prev === now || typeof now !== "number" || typeof prev !== "number") return now;
    return prev + (now - prev) * inAt(t, BEATS[i].start, 0.5);
  }

  /* ---- speech cues ------------------------------------------------------
     A beat is one narration clip, and the film knows only when each clip
     starts and how long it runs - never when a word is said. Bones and
     Muscles lights a bone when its BEAT starts, and that was enough there.
     It is not enough here: "Six faces ... Twelve edges ... eight vertices"
     is one clip, and counting all three at once is no count at all.

     So a beat may name phrases in art.at, and cue() places each one in time
     by where it sits in the sentence. A voice speaks characters at a near-
     steady rate; a comma adds a short pause and a full stop a longer one.
     The estimate is good to a few tenths of a second, which is what a
     picture needs to land on its word. A cue is per beat and never
     inherited, unlike the rest of art.

     Every phrase is checked against its narration when this file loads. A
     reworded line therefore stops the render with the beat named, instead
     of quietly mistiming the picture. */
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
    var at = BEATS[i].art && BEATS[i].art.at;
    if (!at || at[name] == null) return null;
    return speakTime(i, BEATS[i].say.indexOf(at[name]));
  }
  /* ... and when that phrase has been said */
  function cueEnd(i, name) {
    var at = BEATS[i].art && BEATS[i].art.at;
    if (!at || at[name] == null) return null;
    return speakTime(i, BEATS[i].say.indexOf(at[name]) + at[name].length);
  }
  /* when the voice stops in beat i */
  function spokenEnd(i) { return speakTime(i, BEATS[i].say.length); }

  /* item k of n, spread across span seconds from at: its own 0..1 */
  function nth(t, at, k, n, span, each) {
    if (at == null) return 0;
    return inAt(t, at + (n > 1 ? (k * span) / (n - 1) : 0), each || 0.28);
  }
  /* how many of n have been reached by t, counting across span from at */
  function tally(t, at, n, span) {
    if (at == null || t < at) return 0;
    if (n < 2) return n;
    return Math.min(n, 1 + Math.floor((t - at) / (span / (n - 1)) + 1e-9));
  }
  /* a counted item pops, then settles to a steady glow */
  function pop(t, at) {
    if (at == null || t < at) return 0;
    return 0.45 + 0.55 * Math.exp(-(t - at) * 2.6);
  }

  /* Each scene owns a colour, exactly as the science film does, so the film
     reads as chapters. Every value is a g4-lesson.css dark-theme token - the
     film invents no colours of its own (see the film's CSS header). */
  var HUE = {
    title: "#35BFB2", solids: "#F4C95D", nets: "#E9744F", symmetry: "#B78BD1",
    angles: "#6E9DE8", tessellate: "#4FD1A0", area: "#F4C95D", perimeter: "#E9744F",
    compound: "#F4C95D", irregular: "#4FD1A0", scale: "#B78BD1", recap: "#35BFB2",
    reflect: "#35BFB2"
  };

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

  /* A small label/value strip, echoing the lesson's own "working" panel
     (lines($("work6"), [...]) in c-shape-slides.js) without being it - the
     lesson's version is DOM-coupled and this redraws the same idea. */
  function workRows(rows) {
    return '<div class="work">' + rows.map(function (r) {
      /* r.o fades a row in as it is said. It is opacity, never display, so a
         row arriving does not shove the rows above it about. And it starts at
         nothing, not faint: a faint "12 ÷ 2 = 6" is the answer, read out
         before the voice gets there. */
      return '<div class="wrow' + (r.total ? " total" : "") + (r.cls ? " " + r.cls : "") + '"' +
        (r.o != null ? ' style="opacity:' + f3(r.o) + ";transform:translateY(" + f1((1 - r.o) * 8) + 'px)"' : "") +
        "><b>" + esc(r.k) + "</b><span>" + r.v + "</span></div>";
    }).join("") + "</div>";
  }

  /* ---- scene: the title card -------------------------------------------
     A motif of the three families this lesson touches - a solid, an angle,
     a grid - rather than any one figure, because no single shape stands for
     "shape and measures" the way the skeleton stands for Bones and Muscles. */
  /* o.t turns the cube; o.corner sweeps the angle open (1 = a right angle);
     o.wall traces the grid's edge; o.fill is how many grid squares are lit;
     o.apart pulls the cube's faces away from each other */
  function titleMotif(o) {
    var th = (Math.PI / 2) * (o.corner == null ? 1 : o.corner);
    var ex = 80 * Math.cos(th), ey = 80 - 80 * Math.sin(th), g = "";
    for (var k = 0; k < 12; k++) {
      if (k < (o.fill || 0)) g += '<rect class="lit" x="' + (k % 4) * 14 + '" y="' + Math.floor(k / 4) * 14 + '" width="14" height="14"/>';
    }
    return '<svg viewBox="0 0 300 300" role="img" aria-label="A cube, a right angle, and a measuring grid">' +
      '<g class="tmotif"><g class="solidfig">' +
      solidSvg(CUBE, 0.42, 0.62 + (o.t || 0) * 0.35, null, { cx: 112, cy: 168, s: 42 }, 0.55 * (o.apart || 0)) + "</g>" +
      '<g transform="translate(170,40)">' +
        (th > 0.01 ? '<path class="wedge" d="M0,80 L80,80 A80,80 0 0,0 ' + f1(ex) + "," + f1(ey) + ' Z"/>' : "") +
        '<path class="sq" d="M0,60 L20,60 L20,80" style="opacity:' + f3(clamp((o.corner == null ? 1 : o.corner) * 4 - 3, 0, 1)) + '"/>' +
        line2([0, 80], [80, 80], "marm") + line2([0, 80], [ex, ey], "marm") + "</g>" +
      '<g transform="translate(30,220)">' + gridCells(4, 3, 14) + g +
        '<rect class="wall" pathLength="1" x="0" y="0" width="56" height="42" style="stroke-dasharray:1;stroke-dashoffset:' +
          f3(1 - (o.wall || 0)) + '"/></g>' +
      "</g></svg>";
  }

  function sceneTitle(scene, beat, t) {
    var a = inAt(t, BEATS[scene.first].start, 1.0);
    var b = inAt(t, BEATS[scene.first + 1].start, 0.7);
    var one = scene.first, two = scene.first + 1, tm = cue(two, "measure");
    var motif = {
      t: t,
      wall: on(t, cue(one, "wall"), 1.0) * (1 - on(t, tm, 0.6)),
      corner: cue(one, "corner") == null ? 1 : on(t, cue(one, "corner"), 0.9),
      apart: on(t, cue(two, "apart"), 0.7) - on(t, cue(two, "fold"), 0.8),
      fill: tally(t, tm == null ? null : tm + 0.1, 12, 1.3)
    };
    return '<div class="title">' +
      '<div class="tfig figure glow" style="opacity:' + (0.18 + a * 0.82).toFixed(3) +
        ";transform:translateY(" + ((1 - a) * 26).toFixed(2) + "px) scale(" + (0.94 + a * 0.06).toFixed(3) + ')">' +
        titleMotif(motif) + "</div>" +
      '<div class="tw">' +
        '<p class="eyebrow" style="opacity:' + a.toFixed(3) + '">' + esc(F.subtitle) + " · Unit lecture</p>" +
        '<h1 style="opacity:' + a.toFixed(3) + ";transform:translateY(" + ((1 - a) * 16).toFixed(2) + 'px)">' + esc(F.title) + "</h1>" +
        '<p class="tsub" style="opacity:' + b.toFixed(3) + ";transform:translateY(" + ((1 - b) * 12).toFixed(2) + 'px)">' +
          "Solids, nets, symmetry and angles.<br>Then area, perimeter, and reading a scale.</p>" +
      "</div></div>";
  }

  /* ---- shapes drawn fresh, matching the lesson's own dark-theme classes -- */
  function gridCells(cols, rows, cell) {
    var g = "";
    for (var x = 0; x < cols; x++) for (var y = 0; y < rows; y++)
      g += '<rect class="cell" x="' + (x * cell) + '" y="' + (y * cell) + '" width="' + cell + '" height="' + cell + '"/>';
    return g;
  }

  /* ---- a small 3D kit ----------------------------------------------------
     Solids and nets are drawn from real 3D coordinates, turned and projected
     every frame, so a cube can spin and a net can fold. Orthographic, like
     the lesson's own flat-shaded drawings: a cube in perspective would look
     like a different object from the one the child meets two steps later.
     After turn(), x points right, y up, and z at the viewer. */
  var sub = function (a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; };
  var dot = function (a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; };
  var cross = function (a, b) {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  };
  var unit = function (a) { var m = Math.sqrt(dot(a, a)) || 1; return [a[0] / m, a[1] / m, a[2] / m]; };
  var mean = function (ps) {
    var m = [0, 0, 0];
    ps.forEach(function (p) { m[0] += p[0]; m[1] += p[1]; m[2] += p[2]; });
    return [m[0] / ps.length, m[1] / ps.length, m[2] / ps.length];
  };
  var LIGHT = unit([-0.45, 0.8, 0.55]);

  /* turn about the vertical axis by ry, then tip toward the viewer by rx
     (rx > 0 looks down on the top) */
  function turn(p, rx, ry) {
    var c = Math.cos(ry), s = Math.sin(ry);
    var x = p[0] * c + p[2] * s, z = -p[0] * s + p[2] * c, y = p[1];
    c = Math.cos(rx); s = Math.sin(rx);
    return [x, y * c - z * s, y * s + z * c];
  }
  /* rotate p by th about the line through a with unit direction d */
  function spin(p, a, d, th) {
    var v = sub(p, a), c = Math.cos(th), s = Math.sin(th), k = dot(d, v) * (1 - c), x = cross(d, v);
    return [a[0] + v[0] * c + x[0] * s + d[0] * k,
            a[1] + v[1] * c + x[1] * s + d[1] * k,
            a[2] + v[2] * c + x[2] * s + d[2] * k];
  }
  var path2 = function (pts) {
    return "M" + pts.map(function (p) { return f1(p[0]) + "," + f1(p[1]); }).join(" L") + " Z";
  };
  var line2 = function (a, b, cls, op) {
    return '<line class="' + cls + '" x1="' + f1(a[0]) + '" y1="' + f1(a[1]) + '" x2="' + f1(b[0]) +
      '" y2="' + f1(b[1]) + '"' + (op != null ? ' style="opacity:' + f3(op) + '"' : "") + "/>";
  };

  /* ---- scene: solids ----------------------------------------------------
     One solid shown large, the others waiting in a strip on the right - the
     same "figure + list" grammar the science film uses for its bones, redone
     with maths' own vocabulary of faces, edges and vertices. */
  var CUBE = {
    v: [[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1], [-1, 1, -1], [1, 1, -1], [1, 1, 1], [-1, 1, 1]],
    /* counted in this order: front, right, top, back, left, bottom */
    f: [[3, 2, 6, 7], [2, 1, 5, 6], [7, 6, 5, 4], [1, 0, 4, 5], [0, 3, 7, 4], [0, 1, 2, 3]],
    /* the top square, the bottom square, then the four uprights */
    e: [[7, 6], [6, 5], [5, 4], [4, 7], [3, 2], [2, 1], [1, 0], [0, 3], [3, 7], [2, 6], [1, 5], [0, 4]],
    /* the top four corners, then the bottom four */
    p: [7, 6, 5, 4, 3, 2, 1, 0]
  };
  var PYRAMID = {
    v: [[-1, -0.78, -1], [1, -0.78, -1], [1, -0.78, 1], [-1, -0.78, 1], [0, 1.12, 0]],
    /* the square base first, then the four triangles */
    f: [[0, 1, 2, 3], [3, 2, 4], [2, 1, 4], [1, 0, 4], [0, 3, 4]],
    e: [[0, 1], [1, 2], [2, 3], [3, 0], [3, 4], [2, 4], [1, 4], [0, 4]],
    /* the point first */
    p: [4, 3, 2, 1, 0]
  };
  var SOLIDS = {
    cube: { label: "Cube", geo: CUBE },
    pyramid: { label: "Square-based pyramid", geo: PYRAMID },
    cylinder: { label: "Cylinder" }
  };
  var SOLID_ORDER = ["cube", "pyramid", "cylinder"];

  /* when item k of n is reached, counting across span from at */
  function stepAt(at, k, n, span) { return at == null ? null : at + (n > 1 ? (k * span) / (n - 1) : 0); }

  /* A solid, turned and drawn see-through: the faces, edges and corners at
     the back show dashed, because a count of a cube's twelve edges has to be
     able to point at the three a child cannot see. hl lights faces, edges
     and corners by index, each 0..1. explode pushes every face out along
     its own normal - the title's "take solids apart". */
  function solidSvg(geo, rx, ry, hl, box, explode) {
    hl = hl || {};
    var P = geo.v.map(function (p) { return turn(p, rx, ry); });
    var C = mean(P);
    var S = function (p) { return [box.cx + p[0] * box.s, box.cy - p[1] * box.s]; };
    var faces = geo.f.map(function (f, k) {
      var pts = f.map(function (j) { return P[j]; });
      var m = mean(pts), n = unit(cross(sub(pts[1], pts[0]), sub(pts[2], pts[0])));
      if (dot(n, sub(m, C)) < 0) n = [-n[0], -n[1], -n[2]];
      if (explode) pts = pts.map(function (p) { return [p[0] + n[0] * explode, p[1] + n[1] * explode, p[2] + n[2] * explode]; });
      return { k: k, idx: f, n: n, front: n[2] > 1e-6, z: m[2], d: path2(pts.map(S)) };
    });
    var seen = function (a, b) {
      return faces.some(function (fc) { return fc.front && fc.idx.indexOf(a) >= 0 && (b == null || fc.idx.indexOf(b) >= 0); });
    };
    var g = "";
    faces.forEach(function (fc) { if (!fc.front) g += '<path class="sf back" d="' + fc.d + '"/>'; });
    if (!explode) geo.e.forEach(function (e) { if (!seen(e[0], e[1])) g += line2(S(P[e[0]]), S(P[e[1]]), "se hid"); });
    faces.filter(function (fc) { return fc.front; }).sort(function (a, b) { return a.z - b.z; }).forEach(function (fc) {
      g += '<path class="sf" d="' + fc.d + '" style="fill-opacity:' + f3(0.14 + 0.5 * Math.max(0, dot(fc.n, LIGHT))) + '"/>';
      if (explode) g += '<path class="se" d="' + fc.d + '"/>';
    });
    if (!explode) geo.e.forEach(function (e) { if (seen(e[0], e[1])) g += line2(S(P[e[0]]), S(P[e[1]]), "se"); });
    faces.forEach(function (fc) {
      var a = (hl.face && hl.face[fc.k]) || 0;
      if (a > 0.01) g += '<path class="hl-face' + (fc.front ? "" : " hid") + '" d="' + fc.d +
        '" style="opacity:' + f3(a * (fc.front ? 0.9 : 0.5)) + '"/>';
    });
    geo.e.forEach(function (e, k) {
      var a = (hl.edge && hl.edge[k]) || 0;
      if (a > 0.01) g += line2(S(P[e[0]]), S(P[e[1]]), "hl-edge" + (seen(e[0], e[1]) ? "" : " hid"), a);
    });
    geo.p.forEach(function (j, k) {
      var a = (hl.vert && hl.vert[k]) || 0;
      if (a <= 0.01) return;
      var q = S(P[j]);
      g += '<circle class="hl-vert' + (seen(j) ? "" : " hid") + '" cx="' + f1(q[0]) + '" cy="' + f1(q[1]) +
        '" r="' + f1(3.5 + 4.5 * a) + '" style="opacity:' + f3(Math.min(1, a * 1.5)) + '"/>';
    });
    return g;
  }

  /* A cylinder does not change as it turns about its own axis, so three
     stripes ride round its curved surface to show that it is turning. rx < 0
     tips it up to show the bottom circle. */
  function cylinderSvg(rx, ry, hl, box) {
    hl = hl || {};
    var s = box.s, r = 1, sx = Math.sin(rx), yT = 1.02 * Math.cos(rx), yB = -yT;
    var X = function (x) { return f1(box.cx + x * s); }, Y = function (y) { return f1(box.cy - y * s); };
    var R = f1(r * s), E = f1(Math.max(r * Math.abs(sx) * s, 0.6));
    var down = sx >= 0;                           /* looking down: the top is the circle we see */
    var body = "M" + X(-r) + "," + Y(yT) + " L" + X(-r) + "," + Y(yB) +
      " A" + R + "," + E + " 0 0," + (down ? 0 : 1) + " " + X(r) + "," + Y(yB) +
      " L" + X(r) + "," + Y(yT) +
      " A" + R + "," + E + " 0 0," + (down ? 1 : 0) + " " + X(-r) + "," + Y(yT) + " Z";
    var near = down ? yT : yB, far = down ? yB : yT;
    var ell = function (y, cls, style) {
      return '<ellipse class="' + cls + '" cx="' + X(0) + '" cy="' + Y(y) + '" rx="' + R + '" ry="' + E + '"' +
        (style ? ' style="' + style + '"' : "") + "/>";
    };
    var stripes = function (n, cls, k0) {
      var out = "";
      for (var k = 0; k < n; k++) {
        var ph = ry + (k * 2 * Math.PI) / n, depth = Math.cos(ph);
        if (depth <= 0.02) continue;
        var x = box.cx + r * Math.sin(ph) * s, off = -r * depth * sx;
        out += line2([x, box.cy - (yT + off) * s], [x, box.cy - (yB + off) * s], cls, depth * k0);
      }
      return out;
    };
    var cur = hl.curved || 0, top = hl.top || 0, bot = hl.bottom || 0;
    var g = ell(far, "sf back") + ell(far, "se hid") +
      '<path class="sf" d="' + body + '" style="fill-opacity:0.3"/>' + stripes(3, "stripe", 0.8);
    if (cur > 0.01) g += '<path class="hl-curved" d="' + body + '" style="opacity:' + f3(cur * 0.5) + '"/>' +
      stripes(10, "stripe gold", cur);
    g += ell(near, "sf", "fill-opacity:0.6") + '<path class="se" d="' + body + '"/>' + ell(near, "se");
    if (top > 0.01) g += ell(yT, "hl-face" + (down ? "" : " hid"), "opacity:" + f3(top * (down ? 0.9 : 0.5)));
    if (bot > 0.01) g += ell(yB, "hl-face" + (down ? " hid" : ""), "opacity:" + f3(bot * (down ? 0.5 : 0.9)));
    return g;
  }

  function sceneSolids(scene, beat, t, i) {
    var key = field(i, "solid", null);
    var seen = {};
    for (var k = scene.first; k <= i; k++) { var s = BEATS[k].art && BEATS[k].art.solid; if (s) seen[s] = true; }
    var S = key ? SOLIDS[key] : null;

    var list = SOLID_ORDER.map(function (id, n) {
      var had = !!seen[id], now = id === key;
      var o = had ? 1 : 0.3;
      return '<li class="' + (now ? "now" : had ? "had" : "") + '" style="opacity:' + o + '">' +
        '<span class="tick">' + (had ? "✓" : n + 1) + "</span>" + esc(SOLIDS[id].label) + "</li>";
    }).join("");

    /* the solid SWAYS through a three-quarter view rather than spinning: a
       full turntable came round face-on during "Twelve edges", where a cube
       reads as two stacked rectangles and its hidden edges lie on its seen
       ones. One motion across the whole scene, so a solid never jumps. */
    var since = t - BEATS[scene.first].start;
    var ry = 0.62 + 0.36 * Math.sin(since * 0.42), rx = 0.44;
    var box = { cx: 130, cy: 136, s: 60 };
    var b = 0.72 + 0.28 * breathe(t);
    var hold = function (from, until) { return on(t, from, 0.35) * (1 - on(t, until, 0.4)); };
    var n = function (got) { return got ? "<b>" + got + "</b>" : "–"; };
    var fig, rows, hl = { face: [], edge: [], vert: [] };

    if (!S) {
      /* what a face, an edge and a vertex ARE, pointed at on one cube */
      var tF = cue(i, "faces"), tE = cue(i, "edges"), tV = cue(i, "vertices");
      hl.face[0] = Math.max(hold(tF, tE) * b, hold(tE, tV) * 0.3);
      hl.face[2] = hold(tE, tV) * 0.3;               /* the two faces the lit edge joins */
      hl.edge[0] = Math.max(hold(tE, tV) * b, on(t, tV, 0.4) * 0.5);
      hl.edge[1] = hl.edge[9] = on(t, tV, 0.4) * 0.5;    /* the three edges at the lit corner */
      hl.vert[1] = on(t, tV, 0.3) * b;
      fig = solidSvg(CUBE, rx, ry, hl, box);
      rows = [
        { k: "Flat face", v: "a flat surface", o: on(t, tF, 0.4), cls: "k-face" },
        { k: "Edge", v: "where two faces meet", o: on(t, tE, 0.4), cls: "k-edge" },
        { k: "Vertex", v: "where edges meet", o: on(t, tV, 0.4), cls: "k-vert", total: true }
      ];
    } else if (key === "cube") {
      /* counted, one at a time, in the time it takes to say the number */
      var cF = cue(i, "faces"), cS = cue(i, "same"), cE = cue(i, "edges"), cV = cue(i, "vertices");
      var sF = cF == null ? null : cF + 0.1, sE = cE == null ? null : cE + 0.1, sV = cV == null ? null : cV + 0.1;
      CUBE.f.forEach(function (f, k) {
        hl.face[k] = Math.max(pop(t, stepAt(sF, k, 6, 1.1)) * (1 - on(t, cE, 0.4)), 0.85 * bump(t, cS, 1.1));
      });
      CUBE.e.forEach(function (e, k) { hl.edge[k] = pop(t, stepAt(sE, k, 12, 1.5)) * (1 - on(t, cV, 0.4)); });
      CUBE.p.forEach(function (p, k) { hl.vert[k] = pop(t, stepAt(sV, k, 8, 1.0)); });
      fig = solidSvg(CUBE, rx, ry, hl, box);
      rows = [
        { k: "Flat faces", v: n(tally(t, sF, 6, 1.1)) + " identical squares", o: on(t, cF, 0.3), cls: "k-face" },
        { k: "Edges", v: n(tally(t, sE, 12, 1.5)) + " — where two faces meet", o: on(t, cE, 0.3), cls: "k-edge" },
        { k: "Vertices", v: n(tally(t, sV, 8, 1.0)) + " — where the edges meet", o: on(t, cV, 0.3), cls: "k-vert", total: true }
      ];
    } else if (key === "pyramid") {
      /* it tips up to show the square it stands on, then settles back */
      var pB = cue(i, "base"), pS = cue(i, "sides"), pA = cue(i, "apex"), pF = cue(i, "faces");
      rx = 0.36 - 0.72 * (on(t, pB, 0.8) - on(t, pS == null ? null : pS - 0.2, 0.8));
      var sS = pS == null ? null : pS + 0.1, all = 0.8 * bump(t, pF, 1.2);
      hl.face[0] = Math.max(pop(t, pB), all);
      for (var k2 = 1; k2 <= 4; k2++) hl.face[k2] = Math.max(pop(t, stepAt(sS, k2 - 1, 4, 1.0)), all);
      hl.vert[0] = on(t, pA, 0.3) * b;
      fig = solidSvg(PYRAMID, rx, ry, hl, box);
      var got = (pB != null && t >= pB ? 1 : 0) + tally(t, sS, 4, 1.0);
      rows = [
        { k: "Flat faces", v: n(got) + (got >= 5 ? " — 1 square and 4 triangles" : ""), o: on(t, pB, 0.3), cls: "k-face", total: true },
        { k: "Edges", v: "<b>8</b>", o: on(t, pF, 0.4), cls: "k-edge" },
        { k: "Vertices", v: "<b>5</b> — one of them the point", o: Math.max(on(t, pA, 0.4) * 0.6, on(t, pF, 0.4)), cls: "k-vert" }
      ];
    } else {
      /* two flat circles: it tips over to show the bottom one, and back */
      var yC = cue(i, "circles"), yB = cue(i, "bottom"), yU = cue(i, "curved");
      rx = 0.42 - 0.84 * (on(t, yB, 0.9) - on(t, yU == null ? null : yU - 0.1, 0.9));
      var flat = 1 - 0.6 * on(t, yU, 0.5);
      /* a cylinder looks the same at every turn, so it can spin freely: only
         its stripes show that it is turning */
      fig = cylinderSvg(rx, since * 0.55, { top: pop(t, yC) * flat, bottom: pop(t, yB) * flat, curved: on(t, yU, 0.5) * b }, box);
      rows = [
        { k: "Flat faces", v: "<b>2</b> circles, top and bottom", o: on(t, yC, 0.3), cls: "k-face" },
        { k: "Curved surface", v: "<b>1</b> — not flat at all", o: on(t, yU, 0.3), cls: "k-curve", total: true },
        { k: "Edges", v: "no straight edges", o: on(t, spokenEnd(i) - 0.5, 0.4) },
        { k: "Vertices", v: "no corners", o: on(t, spokenEnd(i) - 0.3, 0.4) }
      ];
    }

    return '<div class="solids">' +
      '<div class="figure glow' + (S ? " lit" : "") + '"><svg viewBox="0 0 260 260" role="img" aria-label="' +
        esc(S ? S.label : "A cube") + '"><g class="solidfig">' + fig + "</g></svg></div>" +
      '<div class="sside"><ol class="blist">' + list + "</ol>" + workRows(rows) + "</div>" +
      "</div>";
  }

  /* ---- scene: nets ------------------------------------------------------
     The net FOLDS. The first cut showed a flat net, an arrow and a cube side
     by side, which says that one becomes the other and never shows how - and
     how is the whole of 4Gg.06. Each square hangs off its parent by the edge
     they share and turns about that edge; a point on a square is turned by
     its own hinge first and then by every hinge between it and the base, so
     a flap folded onto a flap lands where it would on card.

     The cross is the lesson's own: a row of four, with one square above and
     one below the second. */
  var CROSS = [
    { at: [1, 1] },                 /* the base: it stays on the table */
    { at: [0, 1], up: 0 },
    { at: [2, 1], up: 0 },
    { at: [1, 0], up: 0 },
    { at: [1, 2], up: 0 },
    { at: [3, 1], up: 2 }           /* the lid, hinged on the right-hand square */
  ];
  var STRIP = [0, 1, 2, 3, 4, 5].map(function (k) { return k ? { at: [k, 0], up: k - 1 } : { at: [0, 0] }; });
  /* two more nets that fold into a cube: "more than one net that works" */
  var ALT_NETS = [
    [[0, 0], [0, 1], [1, 1], [2, 1], [3, 1], [3, 2]],
    [[0, 0], [1, 0], [1, 1], [2, 1], [2, 2], [3, 2]]
  ];

  /* the edge a square shares with its parent: the line it turns about, and
     which two of its corners [c,r] [c,r+1] [c+1,r+1] [c+1,r] lie on it */
  function hingeOf(net, k) {
    var sq = net[k], pa = net[sq.up], c = sq.at[0], r = sq.at[1], h;
    if (pa.at[0] < c) h = { a: [c, 0, r], d: [0, 0, 1], ends: [0, 1] };
    else if (pa.at[0] > c) h = { a: [c + 1, 0, r], d: [0, 0, 1], ends: [2, 3] };
    else if (pa.at[1] < r) h = { a: [c, 0, r], d: [1, 0, 0], ends: [0, 3] };
    else h = { a: [c, 0, r + 1], d: [1, 0, 0], ends: [1, 2] };
    /* fold UP, off the table, whichever way the edge happens to run */
    if (cross(h.d, sub([c + 0.5, 0, r + 0.5], h.a))[1] < 0) h.d = [-h.d[0], -h.d[1], -h.d[2]];
    return h;
  }

  /* amount[k]: 0 lies flat, 1 is a right angle to its parent */
  function foldNet(net, amount) {
    return net.map(function (sq, k) {
      var c = sq.at[0], r = sq.at[1];
      return [[c, 0, r], [c, 0, r + 1], [c + 1, 0, r + 1], [c + 1, 0, r]].map(function (p) {
        for (var j = k; net[j].up != null; j = net[j].up) {
          var h = hingeOf(net, j);
          p = spin(p, h.a, h.d, (Math.PI / 2) * (amount[j] || 0));
        }
        return p;
      });
    });
  }

  /* Paint the squares back to front. Card is opaque, so a square is laid
     down in the card colour first and tinted over it; the side that faced up
     on the table ends up INSIDE the cube, and is drawn the paler of the two. */
  function drawNet(net, quads, cam, box, opts) {
    opts = opts || {};
    var all = [];
    quads.forEach(function (q) { all = all.concat(q); });
    var c = mean(all);
    var T = quads.map(function (q) {
      return q.map(function (p) {
        var v = sub(p, c);
        return turn(opts.pre ? opts.pre(v) : v, cam.rx, cam.ry);
      });
    });
    var S = function (p) { return [box.cx + p[0] * cam.s, box.cy - p[1] * cam.s]; };
    var g = "";
    T.map(function (q, k) { return { k: k, q: q, z: mean(q)[2] }; })
      .sort(function (a, b) { return a.z - b.z; })
      .forEach(function (o) {
        var n = unit(cross(sub(o.q[1], o.q[0]), sub(o.q[2], o.q[0])));
        var inside = n[2] > 0, d = path2(o.q.map(S));
        g += '<path class="nf-card" d="' + d + '"/>' +
          '<path class="nf ' + (inside ? "in" : "out") + '" d="' + d + '" style="fill-opacity:' +
          f3((inside ? 0.16 : 0.3) + 0.45 * Math.abs(dot(n, LIGHT))) + '"/>';
        var a = opts.nums ? opts.nums[o.k] : 0, face = Math.abs(n[2]);
        if (a > 0.01 && face > 0.3) {
          var m = S(mean(o.q));
          g += '<text class="nnum" x="' + f1(m[0]) + '" y="' + f1(m[1]) + '" style="opacity:' +
            f3(a * Math.min(1, (face - 0.3) * 3)) + ";font-size:" + f1(cam.s * 0.42) + 'px">' + (o.k + 1) + "</text>";
        }
      });
    if (opts.hinges > 0.01) net.forEach(function (sq, k) {
      if (sq.up == null) return;
      var e = hingeOf(net, k).ends;
      g += line2(S(T[k][e[0]]), S(T[k][e[1]]), "nhinge", opts.hinges);
    });
    /* a tube's two open ends: the corners at each end of the four squares
       that went round */
    if (opts.ends > 0.01) {
      var loops = [0, 1].map(function (cn) { return [0, 1, 2, 3].map(function (k) { return S(T[k][cn]); }); });
      loops.sort(function (p, q) { return mean(p.map(function (x) { return [x[0], x[1], 0]; }))[1] - mean(q.map(function (x) { return [x[0], x[1], 0]; }))[1]; });
      loops.forEach(function (lp, n) {
        var m = mean(lp.map(function (x) { return [x[0], x[1], 0]; }));
        var ys = lp.map(function (x) { return x[1]; });
        var y = n === 0 ? Math.min.apply(null, ys) - 16 : Math.max.apply(null, ys) + 30;
        g += '<path class="nopen" d="' + path2(lp) + '" style="opacity:' + f3(opts.ends) + '"/>' +
          '<text class="nlabel" x="' + f1(m[0]) + '" y="' + f1(y) + '" style="opacity:' + f3(opts.ends) + '">' +
          (n === 0 ? "no top" : "no bottom") + "</text>";
      });
    }
    return g;
  }

  function miniNet(cells, a) {
    var s = 24, g = "";
    cells.forEach(function (c) {
      g += '<rect x="' + (c[0] * s + 2) + '" y="' + (c[1] * s + 2) + '" width="' + s + '" height="' + s + '"/>';
    });
    return '<div class="alt" style="opacity:' + f3(a) + ";transform:translateY(" + f1((1 - a) * 10) + 'px)">' +
      '<svg viewBox="0 0 ' + (4 * s + 4) + " " + (3 * s + 4) + '" role="img" aria-label="Another net of a cube">' + g + "</svg>" +
      '<span class="okmark">✓</span></div>';
  }

  /* The opacity that fades the net out and the cube in lives on the .figure
     wrapper itself, exactly as every other figure in this file does - an
     extra div between .figure and its svg breaks .figure svg's height:100%,
     because that percentage resolves against the wrapper's own (auto, and so
     effectively zero) height rather than the .figure box's explicit one. */
  /* Six squares in a straight line. The one arrangement a child is most likely
     to believe is a net of a cube, because it has the right number of squares,
     and the one that plainly cannot close: it rolls into a tube with nothing
     left over to become the top or the bottom. 4Gg.06 is MATCHING nets to
     solids, and matching needs something that does not match - one working net
     and no counter-example only shows what a net is. */
  function sceneNets(scene, beat, t, i) {
    var box = { cx: 260, cy: 205 }, svg, side, fig = "A net of a cube, folding";
    var sway = 0.12 * Math.sin((t - BEATS[scene.first].start) * 0.5);
    if (field(i, "net", "cross") === "strip") {
      /* it rolls up one hinge after another, then stands on end so the
         missing top and bottom can be seen for what they are: holes */
      var tR = cue(i, "roll"), tE = cue(i, "ends"), tN = cue(i, "not");
      var amt = STRIP.map(function (sq, k) { return k ? on(t, tR == null ? null : tR + (k - 1) * 0.3, 0.75) : 0; });
      var rolled = amt[5], th = (Math.PI / 2) * on(t, tE == null ? null : tE - 0.2, 1.1);
      var cam = { rx: lerp(lerp(1.25, 0.55, rolled), 0.62, th / (Math.PI / 2)), ry: -0.6 + sway, s: lerp(66, 104, rolled) };
      svg = drawNet(STRIP, foldNet(STRIP, amt), cam, box, {
        pre: function (v) { return [v[0], v[1] * Math.cos(th) - v[2] * Math.sin(th), v[1] * Math.sin(th) + v[2] * Math.cos(th)]; },
        ends: on(t, tE == null ? null : tE + 0.9, 0.5)
      });
      fig = "Six squares in a line, rolling up into a tube";
      side = '<div class="badge no" style="opacity:' + f3(on(t, tN, 0.5)) + '">won’t fold into a cube</div>' +
        workRows([
          { k: "Six squares", v: "the right number" },
          { k: "Rolled up", v: "a tube, with <b>no top and no bottom</b>", o: on(t, tE, 0.4), total: true }
        ]);
    } else {
      var sides, lid, nums = null, hinges = 0, rows;
      if (i === scene.first) {
        /* the solid opens out flat, its fold lines light, and it closes again */
        var tO = cue(i, "open"), tH = cue(i, "edges"), tC = cue(i, "close");
        sides = 1 - on(t, tO == null ? null : tO + 0.35, 1.0) + on(t, tC, 1.0);
        lid = 1 - on(t, tO, 0.7) + on(t, tC == null ? null : tC + 0.85, 0.8);
        hinges = on(t, tH, 0.4) * (1 - on(t, tC, 0.5)) * (0.65 + 0.35 * breathe(t));
        rows = [
          { k: "A net", v: "a solid opened out flat", o: on(t, tO, 0.4) },
          { k: "Fold every edge", v: "and it closes up again", o: on(t, tH, 0.4), total: true }
        ];
      } else {
        /* the six squares are numbered, then fold up with their numbers on,
           so the child can see which square becomes which face */
        var s0 = BEATS[i].start, tN6 = cue(i, "count"), tF = cue(i, "fold"), tM = cue(i, "more");
        sides = 1 - inAt(t, s0 + 0.05, 0.55) + on(t, tF, 1.0);
        lid = 1 - inAt(t, s0 - 0.2, 0.4) + on(t, tF == null ? null : tF + 0.85, 0.8);
        nums = CROSS.map(function (sq, k) { return nth(t, tN6 == null ? null : tN6 + 0.25, k, 6, 0.9); });
        rows = [
          { k: "Six squares", v: "in a cross", o: on(t, tN6, 0.3) },
          { k: "Folded up", v: "a cube", o: on(t, tF, 0.4), total: true }
        ];
        rows.more = on(t, tM, 0.5);
      }
      sides = clamp(sides, 0, 1); lid = clamp(lid, 0, 1);
      var amtC = [0, sides, sides, sides, sides, lid];
      /* the flat cross is four squares wide and the cube one: the camera closes
         in as it folds, or the finished cube is a small thing in a big box */
      var camC = { rx: lerp(1.25, 0.5, (sides + lid) / 2), ry: -0.5 + sway, s: lerp(96, 130, (sides + lid) / 2) };
      svg = drawNet(CROSS, foldNet(CROSS, amtC), camC, box, { nums: nums, hinges: hinges });
      side = workRows(rows) + (rows.more != null
        ? '<p class="altcap" style="opacity:' + f3(rows.more) + '">More nets that fold into a cube</p>' +
          '<div class="altnets">' + ALT_NETS.map(function (c, k) { return miniNet(c, nth(t, stepAt(tM, 0, 1, 0), k, 2, 0.5)); }).join("") + "</div>"
        : "");
    }
    return '<div class="nets">' +
      '<div class="figure glow lit"><svg viewBox="0 0 520 420" role="img" aria-label="' + fig + '">' + svg + "</svg></div>" +
      '<div class="sside">' + side + "</div></div>";
  }

  /* ---- scene: symmetry ----------------------------------------------- */
  /* A line of symmetry is DEMONSTRATED here, not asserted: the shape folds
     along it, and the half that moves lands exactly on the half that stays.
     The parallelogram gets the same treatment and fails twice, in red. It
     is the one shape here that looks as though it ought to pass. */
  var SYM_SHAPES = {
    square: { pts: [[60, 60], [200, 60], [200, 200], [60, 200]], all: ["H", "V", "D1", "D2"] },
    triangle: { pts: [[130, 50], [200, 200], [60, 200]], all: ["V"] },
    parallelogram: { pts: [[50, 180], [110, 80], [210, 80], [150, 180]], all: [] }
  };
  /* D1 runs corner to corner: y = 260 - x. The first cut drew it five pixels
     off the diagonal, which nothing showed until the square had to fold
     along it and land on itself. */
  var SYM_LINES = {
    V: [[130, 30], [130, 230]], H: [[30, 130], [230, 130]],
    D1: [[40, 220], [220, 40]], D2: [[40, 40], [220, 220]]
  };
  var SYM_NAME = { H: "horizontal", V: "vertical", D1: "diagonal ⟋", D2: "diagonal ⟍" };
  /* the parallelogram's two failed folds: down its middle, and corner to corner */
  var SYM_TRIALS = { V: [[130, 30], [130, 230]], D: [[36, 188.75], [224, 71.25]] };

  function lineFrame(L) {
    var dx = L[1][0] - L[0][0], dy = L[1][1] - L[0][1], m = Math.sqrt(dx * dx + dy * dy);
    return { a: L[0], n: [-dy / m, dx / m] };
  }
  var sideOf = function (p, fr) { return (p[0] - fr.a[0]) * fr.n[0] + (p[1] - fr.a[1]) * fr.n[1]; };
  /* the part of a polygon on one side of a line */
  function clipHalf(pts, fr, sign) {
    var out = [];
    for (var k = 0; k < pts.length; k++) {
      var p = pts[k], q = pts[(k + 1) % pts.length], dp = sign * sideOf(p, fr), dq = sign * sideOf(q, fr);
      if (dp >= 0) out.push(p);
      if ((dp >= 0) !== (dq >= 0)) {
        var u = dp / (dp - dq);
        out.push([p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u]);
      }
    }
    return out;
  }
  /* seen straight on, a half turning over its line by th closes in toward
     the line as cos(th), stands on edge at a right angle, and lands mirrored */
  function foldPts(pts, fr, th) {
    var k = 1 - Math.cos(th);
    return pts.map(function (p) { var d = sideOf(p, fr); return [p[0] - k * d * fr.n[0], p[1] - k * d * fr.n[1]]; });
  }
  /* over in 0.8s, held to be looked at, back in 0.7s - held for less in a
     short beat, so the fold is back open before the next shape arrives */
  var foldAngle = function (t, at, hold) {
    return at == null ? 0 : Math.PI * (inAt(t, at, 0.8) - inAt(t, at + 0.8 + (hold == null ? 0.9 : hold), 0.7));
  };
  var grow = function (L, u, cls) {
    if (u <= 0.001) return "";
    return line2(L[0], [lerp(L[0][0], L[1][0], u), lerp(L[0][1], L[1][1], u)], cls);
  };

  function foldedShape(S, fold) {
    if (!fold || fold.th < 0.002) return '<path class="shape" d="' + path2(S.pts) + '"/>';
    var fr = lineFrame(fold.L);
    var move = foldPts(clipHalf(S.pts, fr, 1), fr, fold.th);
    var land = clamp((fold.th - 2.3) / 0.84, 0, 1);      /* how nearly it lies flat again */
    return '<path class="shape" d="' + path2(clipHalf(S.pts, fr, -1)) + '"/>' +
      '<path class="shape fold' + (Math.cos(fold.th) < 0 ? " over" : "") + '" d="' + path2(move) + '"/>' +
      (land > 0 ? '<path class="' + (fold.ok ? "foldok" : "foldmiss") + '" d="' + path2(move) +
        '" style="opacity:' + f3(land * 0.62) + '"/>' : "");
  }

  function sceneSymmetry(scene, beat, t, i) {
    var shape = field(i, "shape", "square"), S = SYM_SHAPES[shape];
    var lines = field(i, "lines", []);
    var shown = {}, fold = null, extra = "", verdict = 1;
    if (shape === "square" && !lines.length) {
      /* what a line of symmetry IS: one fold, both halves match */
      var tFo = cue(i, "fold"), tMa = cue(i, "match"), tAl = cue(i, "all");
      shown.V = on(t, tFo, 0.5);
      fold = { L: SYM_LINES.V, th: foldAngle(t, tMa), ok: true };
      ["H", "D1", "D2"].forEach(function (k) { extra += grow(SYM_LINES[k], on(t, tAl, 0.7), "mirror ghost"); });
    } else if (shape === "square") {
      /* the four, each drawn as it is named */
      var cD = cue(i, "D");
      shown.V = on(t, cue(i, "V"), 0.45); shown.H = on(t, cue(i, "H"), 0.45);
      shown.D1 = on(t, cD, 0.45); shown.D2 = on(t, cD == null ? null : cD + 0.55, 0.45);
    } else if (shape === "triangle") {
      var cT = cue(i, "V");
      shown.V = on(t, cT, 0.45);
      fold = { L: SYM_LINES.V, th: foldAngle(t, cT == null ? null : cT + 0.1, 0.45), ok: true };
    } else {
      /* two honest tries, and neither fold makes the halves match */
      var c1 = cue(i, "try1"), c2 = cue(i, "try2");
      var second = c2 != null && t >= c2 - 0.5, at = second ? c2 : c1;
      var L = SYM_TRIALS[second ? "D" : "V"];
      fold = { L: L, th: foldAngle(t, at), ok: false };
      extra += grow(L, on(t, at == null ? null : at - 0.45, 0.35) * (1 - on(t, at == null ? null : at + 2.5, 0.4)), "mirror trial");
      var nope = clamp((fold.th - 2.3) / 0.84, 0, 1);
      var e = L[0][1] < L[1][1] ? L[0] : L[1];
      if (nope > 0) extra += '<text class="nope" x="' + f1(e[0] + (second ? 10 : 0)) + '" y="' + f1(e[1] - 4) +
        '" style="opacity:' + f3(nope) + '">✗</text>';
      verdict = on(t, cue(i, "none"), 0.4);
    }
    var svg = foldedShape(S, fold) + extra;
    ["V", "H", "D1", "D2"].forEach(function (k) { if (shown[k]) svg += grow(SYM_LINES[k], shown[k], "mirror"); });
    var found = 0;
    var rows = ["H", "V", "D1", "D2"].map(function (k) {
      var got = lines.indexOf(k) >= 0 && (shown[k] || 0) > 0.5;
      if (got) found++;
      return '<li class="' + (got ? "had" : "") + '"><span class="tick">' + (got ? "✓" : "–") + "</span>" + SYM_NAME[k] + "</li>";
    }).join("");
    return '<div class="symmetry">' +
      '<div class="figure glow"><svg viewBox="0 0 260 260" role="img" aria-label="' + esc(shape) + ' with its lines of symmetry">' + svg + "</svg></div>" +
      '<div class="sside"><ol class="blist tight">' + rows + "</ol>" +
        '<p class="scount" style="opacity:' + f3(verdict) + '">' +
          (S.all.length === 0 ? "no lines of symmetry" : found + " of " + S.all.length + " found") + "</p>" +
      "</div></div>";
  }

  /* ---- scene: angles ---------------------------------------------------- */
  function angleName(d) { return d < 90 ? "acute" : d === 90 ? "right" : "obtuse"; }

  /* One angle, anywhere from 0 to 180 degrees, with nothing leaving its box:
     the vertex sits low and in the middle, so an obtuse arm has room on the
     left. The first cut put the vertex at the far left, and the 130-degree
     arm ran off the edge of its own picture - only a stub of the one angle
     that beat is about was ever on screen.

     o.deg is the turn so far. An angle is drawn as a TURN: the wedge and an
     arc grow as the arm swings. o.ghost90 and o.ghost180 are the dashed
     yardsticks it is compared with. o.label shows the size once the arm
     settles, and o.stretch lengthens both arms without touching the turn. */
  function angleSvg(o) {
    var cx = o.cx == null ? 230 : o.cx, cy = o.cy == null ? 238 : o.cy, r = o.r || 62;
    var L = (o.L || 190) * (1 + (o.stretch || 0));
    var ray = function (d, len) { var q = (-d * Math.PI) / 180; return [cx + len * Math.cos(q), cy + len * Math.sin(q)]; };
    var arc = function (d, rad) {
      var e = ray(d, rad);
      return "M" + f1(cx + rad) + "," + f1(cy) + " A" + rad + "," + rad + " 0 0,0 " + f1(e[0]) + "," + f1(e[1]);
    };
    var deg = o.deg, svg = "";
    if (o.ghost90 > 0.01) svg += '<path class="ghostwedge" d="M' + cx + "," + cy + " " + arc(90, r + 26).slice(1) +
      ' Z" style="opacity:' + f3(o.ghost90) + '"/>' + line2([cx, cy], ray(90, L * 0.9), "ghost", o.ghost90);
    if (o.ghost180 > 0.01) svg += line2([cx, cy], ray(180, L * 0.9), "ghost", o.ghost180);
    if (deg > 0.3) svg += '<path class="wedge" d="M' + cx + "," + cy + " L" + arc(deg, r).slice(1) + ' Z"/>';
    if (o.sq > 0.01) svg += '<path class="sq" d="M' + (cx + 24) + "," + cy + " L" + (cx + 24) + "," + (cy - 24) +
      " L" + cx + "," + (cy - 24) + '" style="opacity:' + f3(o.sq) + '"/>';
    if (o.turn > 0.01 && deg > 2) {
      var tip = ray(deg, r + 18);
      svg += '<path class="turnarc" d="' + arc(deg, r + 18) + '" style="opacity:' + f3(o.turn) + '"/>' +
        '<circle class="turndot" cx="' + f1(tip[0]) + '" cy="' + f1(tip[1]) + '" r="5" style="opacity:' + f3(o.turn) + '"/>';
    }
    if (o.half > 0.01) {
      var hp = ray(deg / 2, r * 0.62);
      svg += '<text class="halflab" x="' + f1(hp[0]) + '" y="' + f1(hp[1] + 8) + '" style="opacity:' + f3(o.half) + '">½</text>';
    }
    var hot = o.armHl || 0;
    svg += line2([cx, cy], [cx + L, cy], "arm") + line2([cx, cy], ray(deg, L), "arm now");
    if (hot > 0.01) svg += line2([cx, cy], [cx + L, cy], "armhl", hot) + line2([cx, cy], ray(deg, L), "armhl", hot);
    if (o.label > 0.01) {
      var lp = ray(deg / 2, r + 44);
      svg += '<text class="deg" x="' + f1(lp[0]) + '" y="' + f1(lp[1] + 10) + '" style="opacity:' + f3(o.label) + '">' +
        Math.round(deg) + "°</text>";
    }
    return '<svg viewBox="0 0 ' + (o.w || 460) + " " + (o.h || 280) + '" role="img" aria-label="An angle of ' +
      Math.round(deg) + ' degrees">' + svg + "</svg>";
  }

  /* Two angles side by side for 4Gg.08's COMPARE, built on the misconception a
     Stage 4 child brings to it: that the angle with the longer lines is the
     bigger one. A has long arms and little turn; B has short arms and a lot.
     B is bigger, and the scene says why on the same frame. */
  function compareAngles(cmp, t, i) {
    /* both open from nothing together, so B is SEEN to turn further; then A's
       arms stretch and come back while its wedge does not change at all */
    var s0 = BEATS[i].start, tA = cue(i, "A"), tB = cue(i, "B"), tT = cue(i, "turn"), tL = cue(i, "len");
    var open = inAt(t, s0 + 0.15, 1.3), b = on(t, tB, 0.5);
    var one = function (tag, spec, isB) {
      var fig = angleSvg({
        deg: spec.deg * open, L: spec.L, r: 44, cx: 62, cy: 216, w: 330, h: 262,
        stretch: isB ? 0 : 0.2 * bump(t, tL, 2.2),
        armHl: isB ? 0 : on(t, tA, 0.3) * (1 - on(t, tB, 0.5)),
        turn: isB ? on(t, tT, 0.4) : 0,
        label: on(t, s0 + 1.6, 0.4)
      });
      return '<div class="cmpfig' + (isB ? " big" : "") + '">' +
        '<div class="figure glow' + (isB && b > 0.5 ? " lit" : "") + '">' + fig + "</div>" +
        '<span class="cmptag">' + tag + "</span></div>";
    };
    return '<div class="angles compare">' +
      one("A", cmp.a, false) + one("B", cmp.b, true) +
      '<div class="sside"><div class="badge yes" style="opacity:' + f3(b) + '">B is bigger</div>' +
        workRows([
          { k: "Longer lines?", v: "they make an angle <b>no</b> bigger", o: Math.max(on(t, tA, 0.4), on(t, tL, 0.4)) },
          { k: "More turn?", v: "that is what makes it bigger", o: on(t, tT, 0.4), total: true }
        ]) +
      "</div></div>";
  }

  function sceneAngles(scene, beat, t, i) {
    var cmp = field(i, "compare", null);
    if (cmp) return compareAngles(cmp, t, i);
    /* the arm TURNS to each new angle as it is named, from wherever the last
       beat left it - from nothing, on the first */
    var target = field(i, "deg", 90), from = i === scene.first ? 0 : field(i - 1, "deg", 0);
    var tt = cue(i, "turn");
    if (tt == null) tt = BEATS[i].start + 0.1;
    var deg = lerp(from, target, inAt(t, tt, 1.1));
    var settled = tt + 1.1;
    var name = angleName(target);
    var est = field(i, "estimate", null);
    var o = { deg: deg, turn: i === scene.first ? on(t, tt, 0.3) * (1 - on(t, settled + 1.2, 0.6)) : 0 };
    if (i === scene.first) {
      o.sq = on(t, cue(i, "corner"), 0.4);
      o.label = on(t, cue(i, "label"), 0.4);
    } else {
      /* no number on the estimate: it is judged against a right angle, and a
         printed 45 beside "about half" would make estimating look like reading */
      o.label = est ? 0 : on(t, settled, 0.4);
      /* the yardsticks: every angle here is judged against a right angle,
         and "obtuse" against a straight line as well */
      o.ghost90 = 0.85 * Math.max(on(t, BEATS[i].start, 0.4) * (est ? 0 : 1), on(t, cue(i, "ghost"), 0.5));
      o.ghost180 = 0.85 * on(t, cue(i, "straight"), 0.5);
      o.half = on(t, cue(i, "half"), 0.4);
    }
    var tn = cue(i, "name"), named = tn == null ? on(t, settled, 0.4) : on(t, tn, 0.4);
    return '<div class="angles">' +
      '<div class="figure glow lit">' + angleSvg(o) + "</div>" +
      '<div class="sside"><div class="badge ' + name + '" style="opacity:' + f3(named) + ";transform:scale(" +
        f3(0.9 + 0.1 * named) + ')">' + name + "</div>" +
        workRows((est ? [{ k: "Estimate", v: est, total: true }] : []).concat([
          { k: "Right angle", v: "exactly 90° — a square corner", total: !est && name === "right" },
          { k: "Acute", v: "less than 90°", total: !est && name === "acute" },
          { k: "Obtuse", v: "more than 90°, less than 180°", total: !est && name === "obtuse" }
        ])) +
      "</div></div>";
  }

  /* ---- scene: tessellate -------------------------------------------- */
  /* Shapes are PUT together on screen, as the narration says they are: the
     second triangle slides in along the long side, six triangles swing in
     round a point, the hexagon spreads into a floor, and circles are packed
     and re-packed until the gaps between them light up. */
  var polyPts = function (pts) { return pts.map(function (p) { return f1(p[0]) + "," + f1(p[1]); }).join(" "); };
  /* turn about c by deg, then slide by dx, dy */
  var place = function (pts, dx, dy, deg, c) {
    var a = (deg * Math.PI) / 180, cs = Math.cos(a), sn = Math.sin(a);
    return pts.map(function (p) {
      var x = p[0] - c[0], y = p[1] - c[1];
      return [c[0] + x * cs - y * sn + dx, c[1] + x * sn + y * cs + dy];
    });
  };
  /* the mark geometry uses for "these sides are the same length" */
  var tickMark = function (p, q, op) {
    var mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2, dx = q[0] - p[0], dy = q[1] - p[1];
    var m = Math.sqrt(dx * dx + dy * dy), nx = (-dy / m) * 10, ny = (dx / m) * 10;
    return line2([mx - nx, my - ny], [mx + nx, my + ny], "eqtick", op);
  };
  var hexPts = function (x, y, R) {
    var p = [];
    for (var k = 0; k < 6; k++) p.push([x + R * Math.cos((k * Math.PI) / 3), y + R * Math.sin((k * Math.PI) / 3)]);
    return p;
  };

  function tessTriangles(t, i) {
    var tJ = cue(i, "join"), tLo = cue(i, "long"), tR = cue(i, "rect"), tLg = cue(i, "legs"), tS = cue(i, "square");
    var A = [[70, 60], [70, 190], [200, 190]], B = [[70, 60], [200, 60], [200, 190]];
    var u = on(t, tJ, 1.1);
    var g = '<polygon class="t1" points="' + polyPts(A) + '"/>' +
      '<polygon class="t2" points="' + polyPts(place(B, 52 * (1 - u), -52 * (1 - u), 38 * (1 - u), [157, 103])) + '"/>';
    g += line2([70, 60], [200, 190], "hyp", on(t, tLo, 0.4) * (1 - on(t, tR, 0.5)) * (0.7 + 0.3 * breathe(t)));
    var r = on(t, tR, 0.6), lg = on(t, tLg, 0.4);
    if (r > 0.01) g += '<rect class="outline" x="70" y="60" width="130" height="130" style="opacity:' + f3(r) + '"/>';
    if (lg > 0.01) g += line2([70, 60], [70, 190], "legs", lg) + line2([70, 190], [200, 190], "legs", lg) +
      tickMark([70, 60], [70, 190], lg) + tickMark([70, 190], [200, 190], lg);
    return {
      svg: g, label: "Two right-angled triangles making a square",
      badge: ["yes", "a square", on(t, tS, 0.4)],
      rows: [
        { k: "Joined along", v: "the longest side", o: on(t, tLo, 0.4) },
        { k: "They make", v: "a rectangle", o: on(t, tR, 0.4) },
        { k: "Shorter sides equal", v: "so it is a <b>square</b>", o: on(t, tS, 0.4), total: true }
      ]
    };
  }

  function tessHexagon(t, i) {
    var tT = cue(i, "tris"), tSd = cue(i, "sides"), tP = cue(i, "point"), tH = cue(i, "hex");
    var tTi = cue(i, "tile"), tNg = cue(i, "nogaps"), tN = cue(i, "name");
    var z = on(t, tTi, 1.2), R = lerp(78, 30, z), C = [130, 130], g = "", tiles = [];
    if (z > 0.01) {
      /* the floor, ring by ring, in axial coordinates for flat-topped hexagons */
      var k = 0;
      for (var q = -2; q <= 2; q++) for (var r = -2; r <= 2; r++) {
        var s = -q - r, ring = Math.max(Math.abs(q), Math.abs(r), Math.abs(s));
        if (ring > 2 || !ring) continue;
        var a = on(t, tTi + 0.45 + (ring - 1) * 0.6 + (k++ % 6) * 0.06, 0.35);
        if (a <= 0.01) continue;
        var hp = hexPts(C[0] + R * 1.5 * q, C[1] + R * Math.sqrt(3) * (r + q / 2), R);
        tiles.push(hp);
        g += '<polygon class="' + ((q + r) % 2 ? "t1" : "t2") + '" points="' + polyPts(hp) + '" style="opacity:' + f3(a) + '"/>';
      }
    }
    for (var n = 0; n < 6; n++) {
      var a2 = nth(t, tT, n, 6, 1.5, 0.4);
      if (a2 <= 0.01) continue;
      var sw = -30 * (1 - a2), rr = R * (0.55 + 0.45 * a2);
      var p0 = ((n * 60 + sw) * Math.PI) / 180, p1 = (((n + 1) * 60 + sw) * Math.PI) / 180;
      g += '<polygon class="' + (n % 2 ? "t1" : "t2") + '" points="' + polyPts([C,
        [C[0] + rr * Math.cos(p0), C[1] + rr * Math.sin(p0)], [C[0] + rr * Math.cos(p1), C[1] + rr * Math.sin(p1)]]) +
        '" style="opacity:' + f3(a2) + '"/>';
    }
    var sd = on(t, tSd, 0.4) * (1 - z), first = [C, [C[0] + R, C[1]], [C[0] + R / 2, C[1] + (R * Math.sqrt(3)) / 2]];
    if (sd > 0.01) g += tickMark(first[0], first[1], sd) + tickMark(first[1], first[2], sd) + tickMark(first[2], first[0], sd);
    var pt = on(t, tP, 0.3) * (1 - z);
    if (pt > 0.01) g += '<circle class="pt" cx="130" cy="130" r="' + f1(5 + 2.5 * breathe(t)) + '" style="opacity:' + f3(pt) + '"/>';
    var hx = on(t, tH, 0.5);
    if (hx > 0.01) g += '<polygon class="outline" points="' + polyPts(hexPts(C[0], C[1], R)) + '" style="opacity:' + f3(hx) + '"/>';
    /* "no gaps and no overlaps": every tile's edge lights at once, so the
       floor is seen to be edge against edge. (A glow behind the tiling lit
       its empty corners too, which read as gaps.) */
    var ng = bump(t, tNg, 1.4);
    if (ng > 0.01) tiles.concat([hexPts(C[0], C[1], R)]).forEach(function (hp) {
      g += '<polygon class="tileedge" points="' + polyPts(hp) + '" style="opacity:' + f3(ng) + '"/>';
    });
    return {
      svg: g, label: "Six triangles making a hexagon, and hexagons covering a floor",
      badge: ["yes", "tessellates", on(t, tN, 0.4)],
      rows: [
        { k: "Six equilateral triangles", v: "every side the same", o: on(t, tSd, 0.4) },
        { k: "Round one point", v: "a regular hexagon", o: on(t, tH, 0.4) },
        { k: "Hexagons", v: "no gaps, no overlaps", o: on(t, tNg, 0.4), total: true }
      ]
    };
  }

  function tessCircles(t, i) {
    var tP = cue(i, "pack"), tG = cue(i, "gaps"), s0 = BEATS[i].start;
    /* re-packed: alternate rows slide half a step, the tightest circles go */
    var sh = on(t, tP, 1.0), gaps = on(t, tG, 0.6), g = "";
    if (gaps > 0.01) g += '<polygon class="gap" points="' + polyPts([[54 - 19 * sh, 54], [206 - 19 * sh, 54],
      [206 + 19 * sh, 130], [206 - 19 * sh, 206], [54 - 19 * sh, 206], [54 + 19 * sh, 130]]) +
      '" style="opacity:' + f3(gaps * 0.85) + '"/>';
    for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) {
      var a = nth(t, s0 + 0.1, r * 3 + c, 9, 1.4, 0.35);
      g += '<circle class="t1" cx="' + f1(54 + c * 76 + (r === 1 ? 19 : -19) * sh) + '" cy="' + f1(54 + r * 76 - 26 * (1 - a)) +
        '" r="34" style="opacity:' + f3(a) + '"/>';
    }
    return {
      svg: g, label: "Circles packed together, leaving gaps",
      badge: ["no", "gaps left over", gaps],
      rows: [
        { k: "Packed", v: "any way you like", o: on(t, tP, 0.4) },
        { k: "Always", v: "<b>gaps</b> left over", o: on(t, tG, 0.4), total: true }
      ]
    };
  }

  function sceneTessellate(scene, beat, t, i) {
    var pattern = field(i, "pattern", "triangles");
    var r = pattern === "hexagon" ? tessHexagon(t, i) : pattern === "circles" ? tessCircles(t, i) : tessTriangles(t, i);
    return '<div class="tessellate">' +
      '<div class="figure glow lit"><svg viewBox="0 0 260 260" role="img" aria-label="' + r.label + '">' + r.svg + "</svg></div>" +
      '<div class="sside"><div class="badge ' + r.badge[0] + '" style="opacity:' + f3(r.badge[2]) + '">' + r.badge[1] + "</div>" +
        workRows(r.rows) + "</div>" +
      "</div>";
  }

  /* ---- scenes: area, perimeter, compound, irregular ---------------------
     One renderer, four different pieces of data - the same reuse the science
     film gets from listScene(), here for four grids instead of three lists. */
  /* The grid, with a margin round it for the brackets that name its sides. */
  var PAD = 38;
  function gridFrame(mode, cols, rows, inner, label, rowsHtml) {
    var cell = Math.min(46, Math.floor(400 / cols), Math.floor(290 / rows));
    var svg = typeof inner === "function" ? inner(cell) : inner;
    return '<div class="' + mode + '">' +
      '<div class="figure glow lit"><svg viewBox="0 0 ' + (cols * cell + 2 * PAD) + " " + (rows * cell + 2 * PAD) +
        '" role="img" aria-label="' + label + '"><g transform="translate(' + PAD + "," + PAD + ')">' +
        gridCells(cols, rows, cell) + svg + "</g></svg></div>" +
      '<div class="sside">' + rowsHtml + "</div></div>";
  }
  var sq = function (x, y, c, cls, style) {
    return '<rect class="' + cls + '" x="' + f1(x * c) + '" y="' + f1(y * c) + '" width="' + c + '" height="' + c + '"' +
      (style ? ' style="' + style + '"' : "") + "/>";
  };
  var label = function (x, y, text, cls, op, size, rot) {
    if (op <= 0.01) return "";
    return '<text class="' + cls + '" x="' + f1(x) + '" y="' + f1(y) + '"' +
      (rot ? ' transform="rotate(' + rot + " " + f1(x) + " " + f1(y) + ')"' : "") +
      ' style="opacity:' + f3(op) + (size ? ";font-size:" + f1(size) + "px" : "") + '">' + text + "</text>";
  };
  /* a dimension line with end stops, drawn in from p toward q as it is
     said. A side label runs along its line, turned on end, because the
     margin beside a grid is too narrow to hold "width 3" lying down. */
  function bracket(p, q, text, u, lx, ly) {
    if (u <= 0.01) return "";
    var e = [lerp(p[0], q[0], u), lerp(p[1], q[1], u)], v = p[0] === q[0];
    var stop = function (s) { return v ? line2([s[0] - 6, s[1]], [s[0] + 6, s[1]], "dim") : line2([s[0], s[1] - 6], [s[0], s[1] + 6], "dim"); };
    return line2(p, e, "dim") + stop(p) + (u > 0.97 ? stop(q) : "") +
      label(lx, ly, text, "dimlab", clamp((u - 0.5) * 2, 0, 1), null, v ? -90 : 0);
  }
  var cloneRows = function (rs) { return rs.map(function (r) { return Object.assign({}, r); }); };

  /* ---- area: counted one square at a time, then counted a quicker way ----
     4Gg.03 asks for the formula to be DERIVED. Asserting length x width
     after a count is using it; the rows are the step between the two, so
     each row lights in turn as the voice says "five in each row, and three
     rows", and the brackets that name the length and width are drawn as
     those words are said. */
  function sceneArea(scene, beat, t, i) {
    var cols = field(i, "cols", 9), rows = field(i, "rows", 5), R = field(i, "fillA", null);
    var first = i === scene.first, n = R.w * R.h;
    var tCv = cue(i, "cover"), tCn = cue(i, "count"), tRo = cue(i, "rows"), tFi = cue(i, "five");
    var tTh = cue(i, "three"), tTi = cue(i, "times"), tLw = cue(i, "lw");
    var start = tCn == null ? null : tCn + 0.15;
    var got = first ? tally(t, start, n, 2.4) : n;
    var rs = cloneRows(field(i, "rowsData", []));
    if (first && rs[0] && got < n) rs[0].v = "<b>" + got + "</b> squares so far";
    if (!first && rs[1]) rs[1].o = on(t, tTi, 0.4);
    return gridFrame("area", cols, rows, function (c) {
      var g = "";
      for (var k = 0; k < n; k++) {
        var x = R.x + (k % R.w), y = R.y + Math.floor(k / R.w);
        var a = first ? on(t, stepAt(start, k, n, 2.4), 0.18) : 1;
        if (a > 0.01) g += sq(x, y, c, "fillA", "opacity:" + f3(0.82 * a));
        var num = first ? a : 1 - on(t, tRo, 0.5);
        g += label((x + 0.5) * c, (y + 0.5) * c + c * 0.15, String(k + 1), "cellnum", num, c * 0.42);
      }
      if (!first) for (var r = 0; r < R.h; r++) {
        var lit = pop(t, stepAt(tRo == null ? null : tRo + 0.25, r, R.h, 1.0)) * (1 - 0.6 * on(t, tTi, 0.5));
        if (lit > 0.01) g += '<rect class="rowband" x="' + R.x * c + '" y="' + (R.y + r) * c + '" width="' + R.w * c +
          '" height="' + c + '" style="opacity:' + f3(lit * 0.55) + '"/>';
      }
      g += '<rect class="outline" x="' + R.x * c + '" y="' + R.y * c + '" width="' + R.w * c + '" height="' + R.h * c +
        '" style="opacity:' + f3(first ? on(t, tCv, 0.5) : 1) + '"/>';
      var lw = on(t, tLw, 0.4), x0 = R.x * c, y0 = R.y * c, x1 = (R.x + R.w) * c, y1 = (R.y + R.h) * c;
      g += bracket([x0, y0 - 14], [x1, y0 - 14], lw > 0.5 ? "length " + R.w : String(R.w), on(t, tFi, 0.6), (x0 + x1) / 2, y0 - 22);
      g += bracket([x0 - 14, y0], [x0 - 14, y1], lw > 0.5 ? "width " + R.h : String(R.h), on(t, tTh, 0.6), x0 - 22, (y0 + y1) / 2);
      return g;
    }, "A rectangle on a grid, counted", workRows(rs));
  }

  /* ---- perimeter: WALKED, never filled -----------------------------------
     The scene exists to keep "the distance round the edge" apart from "the
     space inside" (see the README: its first cut was a filled rectangle,
     indistinguishable from the area scene). So nothing here is ever filled,
     except for one flash where the voice says "not the space inside". A
     walker goes round and the edge is drawn behind it. On Hodan's fence each
     side is walked as its number is said, a post goes in every metre, and the
     sum runs in the panel. The short way lifts a length and a width together,
     then turns that pair over onto the other two sides: "then double it". */
  function scenePerimeter(scene, beat, t, i) {
    var cols = field(i, "cols", 9), rows = field(i, "rows", 6), Bd = field(i, "border", null);
    var k = i - scene.first, per = 2 * (Bd.w + Bd.h), lens = [Bd.w, Bd.h, Bd.w, Bd.h];
    var rs = cloneRows(field(i, "rowsData", []));
    var walked = 0, sidesAt = [null, null, null, null];
    if (k === 0) walked = per * on(t, cue(i, "round"), 2.6);
    else if (k === 1) {
      sidesAt = ["s1", "s2", "s3", "s4"].map(function (n) { return cue(i, n); });
      sidesAt.forEach(function (at, j) {
        if (at == null) return;
        var next = j < 3 ? sidesAt[j + 1] : null;
        var d = next == null ? 0.9 : Math.min(0.9, Math.max(0.3, next - at - 0.05));
        walked += lens[j] * clamp((t - at) / d, 0, 1);
      });
      var done = lens.filter(function (L, j) { return sidesAt[j] != null && t >= sidesAt[j]; });
      if (rs[0] && done.length && done.length < 4) rs[0].v = done.join(" + ") + (done.length > 1 ? " = <b>" +
        done.reduce(function (a, b) { return a + b; }, 0) + "</b>" : "");
      if (rs[0]) rs[0].o = Math.max(on(t, sidesAt[0], 0.3), on(t, cue(i, "total"), 0.3));
    } else walked = per;
    if (k === 2 && rs[1]) rs[1].o = on(t, cue(i, "double"), 0.4);
    return gridFrame("perimeter", cols, rows, function (c) {
      var x0 = Bd.x * c, y0 = Bd.y * c, x1 = x0 + Bd.w * c, y1 = y0 + Bd.h * c;
      var C = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
      var along = function (s) {
        for (var j = 0; j < 4; j++) {
          if (s <= lens[j] || j === 3) {
            var u = clamp(s / lens[j], 0, 1);
            return [lerp(C[j][0], C[(j + 1) % 4][0], u), lerp(C[j][1], C[(j + 1) % 4][1], u)];
          }
          s -= lens[j];
        }
      };
      var trace = function (s) {
        var pts = [C[0]], left = s;
        for (var j = 0; j < 4 && left > 1e-6; j++) {
          pts.push(along(Math.min(per, lens.slice(0, j).reduce(function (a, b) { return a + b; }, 0) + Math.min(left, lens[j]))));
          left -= lens[j];
        }
        return "M" + pts.map(function (p) { return f1(p[0]) + "," + f1(p[1]); }).join(" L");
      };
      var g = '<rect class="gridborder faint" x="' + x0 + '" y="' + y0 + '" width="' + (x1 - x0) + '" height="' + (y1 - y0) + '"/>';
      var inside = bump(t, cue(i, "inside"), 1.6);
      if (inside > 0.01) g += '<rect class="insideflash" x="' + x0 + '" y="' + y0 + '" width="' + (x1 - x0) +
        '" height="' + (y1 - y0) + '" style="opacity:' + f3(inside * 0.45) + '"/>' +
        label((x0 + x1) / 2, (y0 + y1) / 2 + 10, "✗ not this", "nogo", inside);
      if (walked > 0.001) g += '<path class="trace" d="' + trace(walked) + '"/>';
      if (k === 1) for (var m = 0; m < per; m++) {
        var pp = along(m);
        if (walked >= m - 1e-6) g += '<rect class="post" x="' + f1(pp[0] - 3.5) + '" y="' + f1(pp[1] - 3.5) + '" width="7" height="7"/>';
      }
      if (k === 2) {
        /* a length and a width lit together, then turned over onto the
           other two sides about the middle */
        var tA = cue(i, "add"), tD = cue(i, "double"), mid = [(x0 + x1) / 2, (y0 + y1) / 2];
        var sideLine = function (j, cls, op) { return line2(C[j], C[(j + 1) % 4], cls, op); };
        var lens2 = on(t, cue(i, "lengths"), 0.3) * (1 - on(t, cue(i, "widths"), 0.3));
        var wids = on(t, cue(i, "widths"), 0.3) * (1 - on(t, tA, 0.3));
        g += sideLine(0, "side-on", lens2) + sideLine(2, "side-on", lens2) + sideLine(1, "side-on", wids) + sideLine(3, "side-on", wids);
        var Lop = on(t, tA, 0.3), turnU = on(t, tD, 1.2);
        if (Lop > 0.01) {
          var Lpath = "M" + x0 + "," + y0 + " L" + x1 + "," + y0 + " L" + x1 + "," + y1;
          g += '<path class="lpath" d="' + Lpath + '" style="opacity:' + f3(Lop) + '"/>';
          /* "then double it": the same length-and-width is drawn again along
             the other two sides. (Turning the first one over about the middle
             swept it through the garden and out past its edge.) */
          if (turnU > 0.01) g += '<path class="lpath two" pathLength="1" d="M' + x1 + "," + y1 + " L" + x0 + "," + y1 +
            " L" + x0 + "," + y0 + '" style="stroke-dasharray:1;stroke-dashoffset:' + f3(1 - turnU) + '"/>';
          g += label(x1 + 4, y0 - 12, "6 + 4", "sumlab", Lop * (1 - on(t, cue(i, "ten"), 0.3)));
          g += label(x1 + 4, y0 - 12, "10", "sumlab", on(t, cue(i, "ten"), 0.3));
          g += label(mid[0], mid[1] + 10, "2 × 10 = 20", "sumlab big", on(t, cue(i, "twenty"), 0.4));
        }
      }
      if (walked > 0.001 && walked < per - 1e-6) {
        var w = along(walked);
        g += '<circle class="walker" cx="' + f1(w[0]) + '" cy="' + f1(w[1]) + '" r="' + f1(8 + 2 * breathe(t)) + '"/>';
      }
      /* the side lengths, each as it is said or walked */
      if (k >= 1) {
        var said = function (n, j) { var a = cue(i, n); return Math.max(k === 2 ? 1 : 0, on(t, a, 0.4), on(t, sidesAt[j], 0.4)); };
        g += label((x0 + x1) / 2, y0 - 14, Bd.w + " m", "dimlab", said("long", 0)) +
          label(x1 + 24, (y0 + y1) / 2, Bd.h + " m", "dimlab", said("wide", 1), null, -90) +
          label((x0 + x1) / 2, y1 + 30, Bd.w + " m", "dimlab", Math.max(k === 2 ? 1 : 0, on(t, sidesAt[2], 0.4))) +
          label(x0 - 16, (y0 + y1) / 2, Bd.h + " m", "dimlab", Math.max(k === 2 ? 1 : 0, on(t, sidesAt[3], 0.4)), null, -90);
      }
      return g;
    }, "A rectangle's perimeter, walked", workRows(rs));
  }

  /* ---- compound: split, measured, put back ------------------------------- */
  function sceneCompound(scene, beat, t, i) {
    var cols = field(i, "cols", 9), rows = field(i, "rows", 7), A = field(i, "fillA", null), B = field(i, "fillB", null);
    var k = i - scene.first, rs = cloneRows(field(i, "rowsData", []));
    var split = k === 0 ? on(t, cue(i, "split"), 0.9) : 1;
    var back = k === 1 ? on(t, cue(i, "add"), 0.9) : 0;
    if (k === 1) {
      if (rs[0]) rs[0].o = on(t, cue(i, "big"), 0.4);
      if (rs[1]) rs[1].o = on(t, cue(i, "small"), 0.4);
      if (rs[2]) rs[2].o = on(t, cue(i, "add"), 0.4);
    }
    return gridFrame("compound", cols, rows, function (c) {
      var dy = 0.45 * c * split * (1 - back), g = "";
      var part = function (R, cls, off) {
        var out = "";
        for (var x = R.x; x < R.x + R.w; x++) for (var y = R.y; y < R.y + R.h; y++)
          out += '<rect class="' + cls + '" x="' + x * c + '" y="' + f1(y * c + off) + '" width="' + c + '" height="' + c + '"/>';
        return out;
      };
      /* before the split both halves are ONE shape, the teal of the big one */
      g += part(A, "fillA", 0) + part(B, "fillA", dy);
      if (split > 0.01) g += '<g style="opacity:' + f3(split) + '">' + part(B, "fillB", dy) + "</g>";
      var outline = function (R, off, op) {
        return '<rect class="outline" x="' + R.x * c + '" y="' + f1(R.y * c + off) + '" width="' + R.w * c + '" height="' + R.h * c +
          '" style="opacity:' + f3(op) + '"/>';
      };
      g += outline(A, 0, split * (k === 1 ? 0.5 + 0.5 * on(t, cue(i, "big"), 0.3) : 1)) + outline(B, dy, split);
      if (k === 0) g += grow([[B.x * c, B.y * c], [(B.x + B.w) * c, B.y * c]], on(t, cue(i, "split"), 0.5), "cut");
      if (k === 1) {
        var ax = A.x * c, ay = A.y * c, bx = B.x * c, by = B.y * c + dy;
        g += bracket([ax, ay - 14], [ax + A.w * c, ay - 14], String(A.w), on(t, cue(i, "big"), 0.5), ax + (A.w * c) / 2, ay - 22) +
          bracket([ax - 14, ay], [ax - 14, ay + A.h * c], String(A.h), on(t, cue(i, "big"), 0.5), ax - 20, ay + (A.h * c) / 2) +
          label(ax + (A.w * c) / 2, ay + (A.h * c) / 2 + 12, String(A.w * A.h), "areanum", on(t, cue(i, "fifteen"), 0.4)) +
          bracket([bx, by + B.h * c + 14], [bx + B.w * c, by + B.h * c + 14], String(B.w), on(t, cue(i, "small"), 0.5) * (1 - back), bx + (B.w * c) / 2, by + B.h * c + 34) +
          label(bx + (B.w * c) / 2, by + (B.h * c) / 2 + 12, String(B.w * B.h), "areanum", on(t, cue(i, "four"), 0.4) * (1 - back)) +
          label(ax + (A.w + 0.6) * c, ay + (A.h + 1.2) * c, String(A.w * A.h + B.w * B.h) + " squares", "areanum big", on(t, cue(i, "total"), 0.4));
      }
      return g;
    }, "An L shape split into two rectangles", workRows(rs));
  }

  /* ---- scene: irregular (counting whole and part squares) ---------------
     The outline and the whole/part colouring are DERIVED from the same
     polygon, the way the lesson's own newBlob() classifies cells (point-in-
     polygon, five probes per cell) - fixed points rather than newBlob's
     Math.random(), so a re-render draws the identical leaf every time. */
  var BLOB_CELL = 34, BLOB_COLS = 8, BLOB_ROWS = 8;
  /* a fixed leaf shape (16 points on a wobbled ellipse) - classifies to 9
     whole squares and 12 part squares at the probes below; not hand-tuned
     cell by cell, so the outline and the colouring cannot disagree */
  var BLOB_PTS = [
    [5.86, 3.5], [5.86, 4.57], [5.05, 5.19], [4.16, 5.23], [3.5, 5.38], [2.66, 5.72],
    [1.69, 5.48], [1.33, 4.49], [1.66, 3.5], [1.98, 2.81], [2.08, 1.94], [2.55, 0.98],
    [3.5, 0.78], [4.27, 1.47], [4.66, 2.23], [5.21, 2.73]
  ];
  var BLOB_CELLS = null;   /* computed once, on first use */

  function blobPointInside(px, py) {
    var inside = false;
    for (var i = 0, j = BLOB_PTS.length - 1; i < BLOB_PTS.length; j = i++) {
      var xi = BLOB_PTS[i][0], yi = BLOB_PTS[i][1], xj = BLOB_PTS[j][0], yj = BLOB_PTS[j][1];
      if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }

  function blobCells() {
    if (BLOB_CELLS) return BLOB_CELLS;
    var probe = [[0.15, 0.15], [0.85, 0.15], [0.15, 0.85], [0.85, 0.85], [0.5, 0.5]];
    var cells = [];
    for (var x = 0; x < BLOB_COLS; x++) for (var y = 0; y < BLOB_ROWS; y++) {
      var n = 0;
      for (var p = 0; p < probe.length; p++) if (blobPointInside(x + probe[p][0], y + probe[p][1])) n++;
      if (n === probe.length) cells.push([x, y, "whole"]);
      else if (n > 0) cells.push([x, y, "part"]);
    }
    BLOB_CELLS = cells;
    return cells;
  }

  /* The leaf draws itself, is laid on the grid, and its squares are counted
     one at a time - the whole ones, then the part ones, each part marked as
     the half it is counted as. */
  function sceneIrregular(scene, beat, t, i) {
    var first = i === scene.first, cell = BLOB_CELL, cols = BLOB_COLS, rows = BLOB_ROWS;
    var byRow = function (a, b) { return a[1] - b[1] || a[0] - b[0]; };
    var cells = blobCells();
    var W = cells.filter(function (c) { return c[2] === "whole"; }).sort(byRow);
    var P = cells.filter(function (c) { return c[2] === "part"; }).sort(byRow);
    var tC = first ? cue(i, "count") : null, sC = tC == null ? null : tC + 0.2;
    var tP = cue(i, "part"), sP = tP == null ? null : tP + 0.2, tH = cue(i, "half"), tT = cue(i, "total");
    var draw = first ? inAt(t, BEATS[i].start + 0.1, 1.6) : 1, grid = first ? on(t, cue(i, "grid"), 0.7) : 1;
    var nine = bump(t, cue(i, "nine"), 1.1), six = bump(t, cue(i, "six"), 1.1);
    var g = '<g style="opacity:' + f3(grid) + '">' + gridCells(cols, rows, cell) + "</g>";
    W.forEach(function (c, k) {
      var a = first ? on(t, stepAt(sC, k, W.length, 1.8), 0.2) : 1;
      if (a > 0.01) g += sq(c[0], c[1], cell, "fillA", "opacity:" + f3(0.82 * a + 0.18 * nine));
      g += label((c[0] + 0.5) * cell, (c[1] + 0.5) * cell + 5, String(k + 1), "cellnum", first ? a : 1 - on(t, tP, 0.4), 14);
    });
    P.forEach(function (c, k) {
      var a = on(t, stepAt(sP, k, P.length, 1.8), 0.2);
      if (a > 0.01) g += sq(c[0], c[1], cell, "fillB", "opacity:" + f3(0.55 * a + 0.3 * six));
      g += label((c[0] + 0.5) * cell, (c[1] + 0.5) * cell + 5, "½", "halfnum", nth(t, tH, k, P.length, 1.0, 0.25), 15);
    });
    g += '<path class="blobline" pathLength="1" d="M' + BLOB_PTS.map(function (p) { return f1(p[0] * cell) + "," + f1(p[1] * cell); }).join(" L") +
      ' Z" style="stroke-dasharray:1;stroke-dashoffset:' + f3(1 - draw) + ";stroke-width:" + f1(3 + 2.5 * bump(t, tT, 1.6)) + '"/>';
    var gotW = first ? tally(t, sC, W.length, 1.8) : W.length, gotP = tally(t, sP, P.length, 1.8);
    return '<div class="irregular">' +
      '<div class="figure glow lit"><svg viewBox="0 0 ' + (cols * cell + 20) + " " + (rows * cell + 20) +
        '" role="img" aria-label="A leaf on a grid, its squares counted"><g transform="translate(10,10)">' + g + "</g></svg></div>" +
      '<div class="sside">' + workRows([
        { k: "Whole squares", v: "<b>" + gotW + "</b> completely inside", o: first ? on(t, tC, 0.4) : 1 },
        { k: "Part squares", v: "<b>" + gotP + "</b> only partly covered", o: on(t, tP, 0.4) },
        { k: "Count parts as halves", v: P.length + " ÷ 2 = <b>" + P.length / 2 + "</b>", o: on(t, tH, 0.4) },
        { k: "About", v: W.length + " + " + P.length / 2 + " = <b>" + (W.length + P.length / 2) + "</b> squares", o: on(t, tT, 0.4), total: true }
      ]) + "</div></div>";
  }

  /* ---- scene: scale (reading between the marks) ------------------------- */
  /* The scale is BUILT as it is described - the line, the big marks, the
     small marks between them, one gap split into quarters - then the water
     rises to its reading, which is counted out a quarter at a time. It stays
     the lesson's own horizontal scale (paint8 in c-shape-slides.js draws its
     measuring jug this way), with the water as a band along it. */
  function sceneScale(scene, beat, t, i) {
    var step = field(i, "step", 100), sub = field(i, "sub", 4), marks = field(i, "marks", 5), unit = field(i, "unit", "ml");
    var target = field(i, "pos", 0), first = i === scene.first;
    var top = (marks - 1) * sub, x0 = 40, x1 = 1000;
    var X = function (p) { return x0 + (p / top) * (x1 - x0); };
    var gi = Math.min(Math.floor(target / sub), marks - 2);           /* the gap the reading is in */
    var tB = cue(i, "big"), tS = cue(i, "small"), tQ = cue(i, "quarters");
    var tW = cue(i, "water"), tP = cue(i, "past"), tV = cue(i, "q"), tR = cue(i, "reads");
    var level = first ? 0 : target * on(t, tW, 1.6);
    var g = "";
    if (level > 0.01) g += '<rect class="water" x="' + x0 + '" y="100" width="' + f1(X(level) - x0) + '" height="40"/>';
    var band = first ? on(t, tQ, 0.5) : 1;
    if (band > 0.01) g += '<rect class="gapband" x="' + f1(X(gi * sub)) + '" y="86" width="' + f1(X(sub) - x0) +
      '" height="68" style="opacity:' + f3(band) + '"/>';
    g += line2([x0, 120], [lerp(x0, x1, first ? inAt(t, BEATS[i].start + 0.05, 0.6) : 1), 120], "axis");
    for (var m = 0; m < marks; m++) {
      var a = first ? nth(t, tB, m, marks, 1.2) : 1;
      if (a <= 0.01) continue;
      g += line2([X(m * sub), 96], [X(m * sub), 144], "big", a) + label(X(m * sub), 172, String(m * step), "lab", a);
      if (m === marks - 1) continue;
      var sa = first ? nth(t, tS == null ? null : tS + 0.1, m, marks - 1, 1.0) : 1;
      for (var s = 1; s < sub; s++) {
        var sx = X(m * sub + s), here = m === gi;
        g += line2([sx, 104], [sx, 136], "small" + (here && band > 0.5 ? " here" : ""), sa);
        /* beat 2: 25, 50, 75 above the three small marks past 200 */
        if (!first && here) g += label(sx, 80, String((s * step) / sub), "qlab", nth(t, tV, s - 1, sub - 1, 0.9));
      }
    }
    /* beat 1: the gap is four quarters. beat 2: three of them light, in turn */
    for (var q = 0; q < sub; q++) {
      var qx = (X(gi * sub + q) + X(gi * sub + q + 1)) / 2;
      if (first) g += label(qx, 70, "¼", "qlab", nth(t, tQ == null ? null : tQ + 0.3, q, sub, 0.9));
      else if (q < target - gi * sub) {
        var fl = pop(t, stepAt(tP == null ? null : tP + 0.2, q, target - gi * sub, 0.9));
        if (fl > 0.01) g += '<rect class="quarter" x="' + f1(X(gi * sub + q) + 2) + '" y="100" width="' + f1(X(1) - x0 - 4) +
          '" height="40" style="opacity:' + f3(fl * 0.8) + '"/>';
      }
    }
    if (level > 0.01) {
      var px = X(level);
      g += '<polygon class="ptr" points="' + f1(px) + ",72 " + f1(px - 12) + ",40 " + f1(px + 12) + ',40"/>' +
        label(px, 24, (target / sub) * step + " " + unit, "val", on(t, tR, 0.4));
    }
    return '<div class="scale">' +
      '<div class="figure glow lit"><svg viewBox="0 0 1040 190" role="img" aria-label="A measuring scale">' + g + "</svg></div>" +
      '<div class="sside">' + workRows([
        { k: "Big marks", v: "every <b>" + step + " " + unit + "</b>", o: first ? on(t, tB, 0.4) : 1 },
        { k: "Small marks", v: "split each gap into <b>" + sub + "</b>", o: first ? on(t, tS, 0.4) : 1 },
        { k: "It reads", v: "<b>" + (target / sub) * step + " " + unit + "</b>", o: first ? 0 : on(t, tR, 0.4), total: true }
      ]) + "</div></div>";
  }

  /* ---- scene: recap ----------------------------------------------------- */
  function sceneRecap(scene, beat, t, i) {
    var lit = fieldAt(t, i, "lit", 0);
    var sign = field(i, "sign", false);
    /* each card lights as its topic is NAMED - cue c<n>, in whichever of the
       scene's beats says it - and hops once as it does. The first cut lit all
       eight in the first half-second and then held them for eighteen. A card
       no beat names falls back to the old count. */
    var when = (F.recap || []).map(function (r, n) {
      for (var k = scene.first; k < scene.first + scene.beats.length; k++) {
        var c = cue(k, "c" + (n + 1));
        if (c != null) return c;
      }
      return null;
    });
    var cards = (F.recap || []).map(function (r, n) {
      var u = when[n] != null ? on(t, when[n], 0.45) : clamp(lit - n + 1, 0, 1);
      var hop = bump(t, when[n], 0.7);
      return '<div class="card' + (u > 0.5 ? " on" : "") + '" style="opacity:' + f3(0.28 + u * 0.72) +
        ";transform:translateY(" + f1((1 - u) * 18 - hop * 8) + "px) scale(" + f3(0.96 + u * 0.04) + ')">' +
        '<span class="ic" style="transform:scale(' + f3(1 + 0.25 * hop) + ')">' + r[0] + "</span><b>" + esc(r[1]) +
        "</b><i>" + esc(r[2]) + "</i></div>";
    }).join("");
    /* the sign-off waits for the voice to finish, rather than talking over it */
    var s = sign ? on(t, spokenEnd(i) - 0.2, 0.6) : 0;
    return '<div class="rows recap">' + cards +
      (sign ? '<div class="signoff" style="opacity:' + s.toFixed(3) + ";transform:scale(" + (0.9 + s * 0.1).toFixed(3) + ')">Now go and measure something yourself.</div>' : "") +
      "</div>";
  }

  /* ---- scene: reflect (4Gp.03) ------------------------------------------
     "Reflect 2D shapes in a horizontal or vertical mirror line, including
     where the mirror line is the edge of the shape, on square grids." The
     storyboard used to have no scene for this at all: it gathered the
     lesson's objectives by the 4Gg prefix, and 4Gp.03 sits in a different
     sub-strand, so it was never in the list to cover.

     The SHAPE MUST BE ASYMMETRIC. On a symmetric shape a reflection and a
     slide draw the same picture, and the scene would teach nothing about the
     one thing a child gets wrong - sliding instead of flipping. An L shows it.

     The motion carries the idea. A connector leaves each square and travels
     STRAIGHT across the line to where that square's image lands, and the
     image squares appear as the connectors arrive. Squares near the line travel
     a little, squares far from it travel a lot, which is what turns the shape
     over; a slide would move every square the same distance. */
  function reflectCells(cells, axis, m) {
    return cells.map(function (c) {
      return axis === "v" ? [2 * m - c[0] - 1, c[1]] : [c[0], 2 * m - c[1] - 1];
    });
  }

  /* an arrow from the middle of one square through the middle of the next:
     which way the foot of the shape points */
  function arrow(p, q, op) {
    var dx = q[0] - p[0], dy = q[1] - p[1], m = Math.sqrt(dx * dx + dy * dy) || 1, ux = dx / m, uy = dy / m;
    var tip = [q[0] + ux * 8, q[1] + uy * 8], bk = [tip[0] - ux * 13, tip[1] - uy * 13];
    return line2(p, tip, "flipar", op) + '<path class="fliphead" d="M' + f1(tip[0]) + "," + f1(tip[1]) +
      " L" + f1(bk[0] - uy * 8) + "," + f1(bk[1] + ux * 8) + " L" + f1(bk[0] + uy * 8) + "," + f1(bk[1] - ux * 8) +
      ' Z" style="opacity:' + f3(op) + '"/>';
  }

  function sceneReflect(scene, beat, t, i) {
    var cols = field(i, "cols", 11), rows = field(i, "rows", 8);
    var axis = field(i, "axis", "v"), m = field(i, "m", 5);
    var cells = field(i, "cells", []);
    var rowsData = field(i, "rowsData", []);
    var cell = Math.min(40, Math.floor(430 / cols), Math.floor(330 / rows));
    var img = reflectCells(cells, axis, m), V = axis === "v", L = m * cell;
    var ctr = function (c) { return [(c[0] + 0.5) * cell, (c[1] + 0.5) * cell]; };
    var mix = function (a, b, u) { return [lerp(a[0], b[0], u), lerp(a[1], b[1], u)]; };
    /* the butterfly: both halves fold up toward the line and back, so every
       distance from the line shrinks as cos of the fold */
    var wing = Math.cos(1.05 * bump(t, cue(i, "wings"), 1.8));
    var box = function (p, cls, op) {
      var d = (V ? p[0] : p[1]) - L, q = d * wing, hw = (cell / 2) * wing;
      var x = V ? L + q - hw : p[0] - cell / 2, y = V ? p[1] - cell / 2 : L + q - hw;
      return '<rect class="' + cls + '" x="' + f1(x) + '" y="' + f1(y) + '" width="' + f1(V ? 2 * hw : cell) +
        '" height="' + f1(V ? cell : 2 * hw) + '" style="opacity:' + f3(op) + '"/>';
    };
    var dist = function (k) { return Math.abs(V ? img[k][0] - cells[k][0] : img[k][1] - cells[k][1]); };
    /* every square travels at the SAME SPEED, so one near the line lands
       first and one far from it lands last, having gone further: the shape
       turns over rather than sliding, which is the whole of 4Gp.03 */
    var go = cue(i, "go");
    if (go == null && field(i, "show", false) && BEATS[i].art.show) go = BEATS[i].start + 0.5;
    var travel = function (k) { return go == null ? 0 : ease(clamp((t - go) / (0.35 + dist(k) * 0.16), 0, 1)); };
    var svg = gridCells(cols, rows, cell);
    cells.forEach(function (c, k) { var u = travel(k); if (u > 0.001) svg += line2(ctr(c), mix(ctr(c), ctr(img[k]), u), "link"); });
    /* the first beat sends ONE square over, as a dashed ghost, to show what
       "straight across" means before the whole shape does it */
    var tX = cue(i, "cross"), demo = go == null && tX != null && cells.length;
    if (demo) {
      var du = ease(clamp((t - tX) / (0.35 + dist(0) * 0.16), 0, 1)) * (1 - on(t, BEATS[i].start + BEATS[i].dur - 0.5, 0.5));
      if (du > 0.001) svg += line2(ctr(cells[0]), mix(ctr(cells[0]), ctr(img[0]), du), "link") +
        box(mix(ctr(cells[0]), ctr(img[0]), du), "ghost", Math.min(1, du * 3));
    }
    svg += cells.map(function (c) { return box(ctr(c), "obj", 1); }).join("");
    cells.forEach(function (c, k) { var u = travel(k); if (u > 0.001) svg += box(mix(ctr(c), ctr(img[k]), u), "img", 0.55 + 0.45 * u); });

    /* "the same distance on the other side": a bracket either side of the
       line, from the nearest square to the line and from the line out */
    var near = 0;
    cells.forEach(function (c, k) {
      if (Math.abs((V ? c[0] : c[1]) + 0.5 - m) < Math.abs((V ? cells[near][0] : cells[near][1]) + 0.5 - m)) near = k;
    });
    var nc = demo ? cells[0] : cells[near], gap = Math.abs((V ? nc[0] : nc[1]) + 0.5 - m) - 0.5;
    var edgeAt = ((V ? nc[0] : nc[1]) < m ? (V ? nc[0] : nc[1]) + 1 : (V ? nc[0] : nc[1])) * cell;
    var across = (V ? nc[1] : nc[0]) * cell - 10;
    var brk = function (from, to, u) {
      return V ? bracket([from, across], [to, across], String(gap), u, (from + to) / 2, across - 8)
        : bracket([across, from], [across, to], String(gap), u, across - 8, (from + to) / 2);
    };
    if (gap > 0) {
      var b1 = demo ? on(t, cue(i, "same"), 0.5) : on(t, cue(i, "gap"), 0.5);
      var b2 = demo ? on(t, cue(i, "same") == null ? null : cue(i, "same") + 0.4, 0.5) : on(t, cue(i, "gap2"), 0.5);
      if (b1 > 0.01) svg += brk(edgeAt, L, b1);
      if (b2 > 0.01) svg += brk(L, 2 * L - edgeAt, b2);
    }
    /* "it is flipped": the foot of the L points one way here and the other
       way there. The storyboard lists the foot last. */
    var fl = on(t, cue(i, "flip"), 0.4);
    if (fl > 0.01 && cells.length > 1) {
      var n = cells.length - 1;
      svg += arrow(ctr(cells[n - 1]), ctr(cells[n]), fl) + arrow(ctr(img[n - 1]), ctr(img[n]), fl);
    }
    if (cue(i, "edge") != null) svg += line2(V ? [L, -8] : [-8, L], V ? [L, rows * cell + 8] : [cols * cell + 8, L], "mline glowline",
      0.9 * bump(t, cue(i, "edge"), 1.4));
    var mline = axis === "v"
      ? '<line class="mline" x1="' + (m * cell) + '" y1="-8" x2="' + (m * cell) + '" y2="' + (rows * cell + 8) + '"/>'
      : '<line class="mline" x1="-8" y1="' + (m * cell) + '" x2="' + (cols * cell + 8) + '" y2="' + (m * cell) + '"/>';
    var vw = cols * cell + 20, vh = rows * cell + 20;
    return '<div class="reflect">' +
      '<div class="figure glow lit"><svg viewBox="0 0 ' + vw + " " + vh + '" role="img" aria-label="A shape and its reflection in a ' +
        (axis === "v" ? "vertical" : "horizontal") + ' mirror line"><g transform="translate(10,10)">' + svg + mline + "</g></svg></div>" +
      '<div class="sside">' + workRows(rowsData) + "</div>" +
      "</div>";
  }

  var KINDS = {
    title: sceneTitle,
    solids: sceneSolids,
    nets: sceneNets,
    symmetry: sceneSymmetry,
    reflect: sceneReflect,
    angles: sceneAngles,
    tessellate: sceneTessellate,
    area: sceneArea,
    perimeter: scenePerimeter,
    compound: sceneCompound,
    irregular: sceneIrregular,
    scale: sceneScale,
    recap: sceneRecap
  };

  /* ---- the title card and the end card ---------------------------------
     Same shape as the science film's cards - see that file's comments for
     why these are timeline segments rather than beats. */
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
          '">Cambridge Primary Mathematics 0096 · Stage ' + esc(F.stage) + "</p>" +
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

    var fade = inAt(t, scene.start, 0.4);
    film.style.setProperty("--hue", HUE[scene.id] || "#35BFB2");

    var span = Math.max(scene.end - scene.start, 0.001);
    var d = clamp((t - scene.start) / span, 0, 1);

    film.innerHTML =
      chrome(scene, t) +
      '<main class="stage" style="opacity:' + fade.toFixed(3) +
        ";transform:translateY(" + ((1 - fade) * 14 - d * 6).toFixed(2) +
        "px) scale(" + (1 + d * 0.012).toFixed(4) + ')">' +
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
