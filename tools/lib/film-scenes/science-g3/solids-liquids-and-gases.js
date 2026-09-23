  /* ==== Grade 3 Science, Lesson 7: Solids, Liquids and Gases =================
     tools/lib/film-scenes/science-g3/solids-liquids-and-gases.js, with -2.js
     to -5.js: the film's pictures, after the shared marks (MK) and before the
     engine's tail, all in one scope. The storyboard is
     science/grade-3-app/lecture-video/solids-liquids-and-gases.json.

     The lesson's own drawings come from ART, so the child sees here what they
     use two steps later: the state tester (ART.sim("states"), the glass of
     water, the wooden block and the balloon of air its Pour / Tip / Untie
     buttons step through) and the kit's own log and stone for "wood and a
     stone". The tumbler the film pours into and counts eight centimetres up is
     slGlass below, drawn here rather than lifted: the lesson's own glass
     (ART.ICONS.glass, on its Centimetres step) is one fixed picture and the
     film needs the water at a level it can set.

     This file: the palette, the drawings every chapter shares, the title motif
     and the chapter "Three states". Every top-level name here starts with sl,
     so nothing can replace a name of the engine, ART or MK. */

  var HUE = {
    title: P.teal, states: P.gold, shapes: P.blue, gases: P.plum,
    sand: P.accent, units: P.good, tools: P.gold, recap: P.teal
  };

  /* the lesson's own colours, from SIMS.states and the kit's icons */
  var SL_WATER = "#3B7FD1", SL_WOOD = "#C9A26B", SL_WOODL = "#8A6A3C", SL_GAS = "#F2A7C4",
    SL_SAND = "#D9C08A", SL_SANDL = "#A8874A", SL_HONEY = "#E0A32B", SL_GLASS = "#B9C8D6";
  /* fixed numbers for anything scattered: never Math.random */
  var SL_SCATTER = [0.17, 0.63, 0.41, 0.88, 0.29, 0.74, 0.08, 0.95, 0.52, 0.36, 0.81, 0.24,
    0.69, 0.12, 0.58, 0.91, 0.33, 0.77, 0.46, 0.05];

  /* ---- timing ---------------------------------------------------------------- */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 comes
     in: for a thing that belongs to that beat alone (rule 7) */
  function slOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function slFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }

  /* ---- drawings the chapters share --------------------------------------------- */

  /* a card to stand one of the lesson's light drawings on */
  function slCard(x, y, w, h, o) {
    return R(x, y, w, h, 18, P.card, P.line, 2, o != null ? { opacity: clamp(o, 0, 1) } : null);
  }

  /* a tapered tumbler, its rim at (cx, topY), filled to `level` of its depth.
     `col` is the liquid: water unless the honey chapter says otherwise. */
  function slGlass(cx, topY, h, wTop, wBot, level, o, col, top) {
    if (!(o > 0)) return "";
    var f = clamp(level, 0, 1), botY = topY + h, out = "";
    if (f > 0) {
      var ws = wTop + (wBot - wTop) * (1 - f), ys = topY + h * (1 - f);
      out += Pth("M" + n2(cx - ws / 2) + "," + n2(ys) + " L" + n2(cx - wBot / 2) + "," + n2(botY) +
        " L" + n2(cx + wBot / 2) + "," + n2(botY) + " L" + n2(cx + ws / 2) + "," + n2(ys) + " Z", col || SL_WATER, null, null, { opacity: 0.8 });
      out += L(cx - ws / 2, ys, cx + ws / 2, ys, top || "#8FC4F0", 3);
    }
    out += Pth("M" + n2(cx - wTop / 2) + "," + n2(topY) + " L" + n2(cx - wBot / 2) + "," + n2(botY) +
      " L" + n2(cx + wBot / 2) + "," + n2(botY) + " L" + n2(cx + wTop / 2) + "," + n2(topY), null, SL_GLASS, 5);
    out += L(cx - wTop * 0.3, topY + h * 0.14, cx - wBot * 0.28, topY + h * 0.6, "#FFFFFF", 4, { opacity: 0.35 });
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* a shallow bowl, its rim at (cx, rimY), w across and h deep, filled to `level` */
  function slBowl(cx, rimY, w, h, level, o, id) {
    if (!(o > 0)) return "";
    var f = clamp(level, 0, 1), out = "";
    var shape = "M" + n2(cx - w / 2) + "," + n2(rimY) + " Q" + n2(cx) + "," + n2(rimY + h * 2) + " " + n2(cx + w / 2) + "," + n2(rimY);
    if (f > 0) {
      var ys = rimY + h * (1 - f);
      out += el("clipPath", { id: id }, R(cx - w / 2 - 6, ys, w + 12, h + 12));
      out += G(Pth(shape + " Z", SL_WATER, null, null, { opacity: 0.8 }), { "clip-path": "url(#" + id + ")" });
      var hw = (w / 2) * Math.sqrt(Math.max(0, 1 - Math.pow(1 - f, 1.35)));
      out += L(cx - hw, ys, cx + hw, ys, "#8FC4F0", 3);
    }
    out += Pth(shape, null, SL_GLASS, 5);
    out += L(cx - w / 2 - 10, rimY, cx + w / 2 + 10, rimY, SL_GLASS, 5);
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* the lesson's wooden block (SIMS.states draws #C9A26B), turned `rot` degrees */
  function slBlock(cx, cy, s, rot, o) {
    if (!(o > 0)) return "";
    var h = s / 2;
    return G(R(-h, -h, s, s, s * 0.08, SL_WOOD, SL_WOODL, s * 0.05) +
      L(-h * 0.6, -h * 0.4, h * 0.6, -h * 0.4, SL_WOODL, s * 0.03, { opacity: 0.7 }) +
      L(-h * 0.6, 0, h * 0.7, 0, SL_WOODL, s * 0.03, { opacity: 0.7 }) +
      L(-h * 0.7, h * 0.45, h * 0.5, h * 0.45, SL_WOODL, s * 0.03, { opacity: 0.7 }),
      { transform: "translate(" + n2(cx) + "," + n2(cy) + ") rotate(" + n2(rot) + ")", opacity: clamp(o, 0, 1) });
  }

  /* the lesson's balloon of air: a pink body, a knot and a string. `open` unties
     it, `size` shrinks it as the air leaves. */
  function slBalloon(cx, cy, rx, ry, open, o) {
    if (!(o > 0)) return "";
    var ky = cy + ry, out = "";
    out += E(cx, cy, rx, ry, SL_GAS, "#D07FA0", 4, { opacity: 0.55 });
    out += E(cx - rx * 0.32, cy - ry * 0.34, rx * 0.2, ry * 0.16, "#FFFFFF", null, null, { opacity: 0.55 });
    if (open < 0.5) out += Pth("M" + n2(cx - rx * 0.16) + "," + n2(ky - 2) + " L" + n2(cx) + "," + n2(ky + rx * 0.22) +
      " L" + n2(cx + rx * 0.16) + "," + n2(ky - 2) + " Z", "#D07FA0");
    else out += L(cx - rx * 0.18, ky + rx * 0.2, cx + rx * 0.18, ky + rx * 0.2, "#D07FA0", 5);
    out += Pth("M" + n2(cx) + "," + n2(ky + rx * 0.22) + " q" + n2(rx * 0.3) + "," + n2(ry * 0.3) + " " + n2(-rx * 0.1) + "," + n2(ry * 0.6),
      null, "#D07FA0", 3);
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* gas: `n` specks inside a box, spread out by u (0 all at the source, 1 filling it) */
  function slGasFill(x, y, w, h, sx, sy, n, u, o, t) {
    if (!(o > 0)) return "";
    var out = "", e = ease(clamp(u, 0, 1));
    for (var k = 0; k < n; k++) {
      var a = SL_SCATTER[(k * 3) % SL_SCATTER.length], b = SL_SCATTER[(k * 7 + 5) % SL_SCATTER.length];
      var tx = x + 12 + a * (w - 24), ty = y + 12 + b * (h - 24);
      var drift = Math.sin(t * 1.3 + k * 1.7) * 5 * e, dr2 = Math.cos(t * 1.1 + k * 2.3) * 5 * e;
      out += C(lerp(sx, tx, e) + drift, lerp(sy, ty, e) + dr2, 6 + 2 * a, SL_GAS, null, null, { opacity: 0.85 });
    }
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* a word in a pill with a leader line to the thing it names (the newest gold) */
  function slLabel(t, x, y, text, at, to, now, size) {
    var o = on(t, at, 0.4);
    if (o <= 0) return "";
    var col = now ? P.gold : P.muted;
    return MK.leader(x - 8, y, to[0], to[1], on(t, at, 0.6), col) +
      MK.pill(x, y, text, o, { size: size || 26, anchor: "start", col: now ? P.gold : P.line });
  }

  /* steam: a pale puff with three wisps rising out of it. The lesson writes
     steam as ♨️, and this machine draws that glyph as a red hot-spring sign -
     beside the word "steam" an eight-year-old reads fire. So the film draws
     the steam instead of borrowing the glyph (brief, rule 5). It is s across
     and s tall, centred on (cx, cy), like an emoji of that size. */
  function slSteam(cx, cy, s, o) {
    if (!(o > 0)) return "";
    var pale = "#CFE6F5", out = "";
    out += E(cx, cy + s * 0.3, s * 0.4, s * 0.19, pale, null, null, { opacity: 0.85 });
    out += E(cx - s * 0.22, cy + s * 0.25, s * 0.19, s * 0.15, pale, null, null, { opacity: 0.85 });
    out += E(cx + s * 0.23, cy + s * 0.25, s * 0.2, s * 0.16, pale, null, null, { opacity: 0.85 });
    var at = [-0.25, 0.02, 0.27];
    for (var k = 0; k < 3; k++) {
      var x = cx + at[k] * s;
      out += Pth("M" + n2(x) + "," + n2(cy + s * 0.14) +
        " q" + n2(s * 0.15) + "," + n2(-s * 0.19) + " 0," + n2(-s * 0.32) +
        " q" + n2(-s * 0.15) + "," + n2(-s * 0.19) + " 0," + n2(-s * 0.28),
        null, pale, Math.max(2, s * 0.075), { opacity: 0.9 });
    }
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* a stream of liquid from (x0, y0) to (x1, y1) while it is pouring */
  function slStream(t, from, until, x0, y0, x1, y1, w, col) {
    if (from == null || t < from) return "";
    var u = clamp((t - from) / 0.28, 0, 1), v = t > until ? clamp(1 - (t - until) / 0.3, 0, 1) : 1;
    if (v <= 0) return "";
    var ex = lerp(x0, x1, u), ey = lerp(y0, y1, u * u);
    /* the control point sits at the LIP's height, so the stream leaves level
       and falls. Held at the midpoint it came out almost straight, and a
       near-level pour then read as a blue bar between two containers. */
    return Pth("M" + n2(x0) + "," + n2(y0) + " Q" + n2(lerp(x0, ex, 0.62)) + "," + n2(y0 + (ey - y0) * 0.12) + " " + n2(ex) + "," + n2(ey),
      null, col || SL_WATER, w || 13, { opacity: 0.85 * v, "stroke-linecap": "round" });
  }

  /* ==== the title ==============================================================
     The lesson's own state tester (SIMS.states, the picture behind its Pour,
     Tip and Untie buttons) on a card: a glass of water, a wooden block and a
     balloon of air, with the lesson's own three words already on it. In the
     spoken title chapter each one is ringed as it is named, and ice, water and
     steam line up underneath for the second line. On the two cards it stands. */
  function slMX(v) { return 14 + v * 1.0375; }
  function slMY(v) { return 92 + v * 1.0375; }
  function titleMotif(o) {
    var t = o.t || 0, s = o.scene, out = "";
    var cSol = s ? sc(s, 0, "solid") : null, cLiq = s ? sc(s, 0, "liquid") : null, cGas = s ? sc(s, 0, "gas") : null,
      cThree = s ? sc(s, 1, "three") : null, cStates = s ? sc(s, 1, "states") : null;
    out += slCard(6, 84, 348, 223.5);
    /* poured, so the glass HOLDS the liquid the second cue rings: unpoured, the
       lesson's drawing parks the water in a jug beside an empty tumbler */
    out += ART.place(ART.sim("states", "draw", { poured: true }), 14, 92, 332, 207.5);
    /* each thing ringed as it is named, and all three pulsing on "three different states" */
    var all = on(t, cStates, 0.5) * (0.55 + 0.45 * breathe(t));
    var ring = function (cx, cy, rx, ry, at) {
      var p = Math.max(popIn(t, at, 0.4), all);
      if (!(p > 0)) return "";
      return E(cx, cy, rx, ry, "none", P.gold, 4, { opacity: Math.min(1, p) });
    };
    out += ring(slMX(220), slMY(170), 32, 28, cSol);
    out += ring(slMX(80), slMY(146), 48, 54, cLiq);
    out += ring(slMX(270), slMY(60), 34, 40, cGas);
    /* "Ice, water and steam": the same material, three ways */
    if (cThree != null) {
      var ice = popIn(t, cThree, 0.35), wat = popIn(t, cThree + 0.3, 0.35), ste = popIn(t, cThree + 0.6, 0.35);
      out += MK.pop(Em(120, 336, 40, "\u{1F9CA}"), 120, 336, ice);
      out += MK.pop(Em(180, 336, 40, "\u{1F4A7}"), 180, 336, wat);
      out += MK.pop(slSteam(240, 336, 40, 1), 240, 336, ste);
    }
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A glass of water, a wooden block and a balloon of air">' + out + "</svg>";
  }

  /* ==== chapter: three states ====================================================
     Three panels, one per state, each lit as it is named: the lesson's own word,
     the lesson's own things (ice, the kit's log and stone; water and milk; the
     air in a balloon) and the lesson's own description underneath. The last
     line turns one drop of water into ice, water and steam. */
  var SL_PANEL = [40, 416, 792], SL_PW = 336, SL_PY = 48, SL_PH = 330;
  function slPanelMid(k) { return SL_PANEL[k] + SL_PW / 2; }

  function slPanel(t, k, lit, title, subs, inner) {
    var x = SL_PANEL[k], cx = slPanelMid(k), p = Math.min(1, lit), out = "";
    out += R(x, SL_PY, SL_PW, SL_PH, 22, p > 0 ? "#1B3A52" : P.card, p > 0 ? P.gold : P.line, p > 0 ? 3 : 2,
      { opacity: 0.4 + 0.6 * p });
    out += Tx(cx, SL_PY + 66, title, "lab huge", "middle", { opacity: p, fill: p > 0 ? P.gold : P.muted });
    subs.forEach(function (line, n) {
      out += Tx(cx, SL_PY + 268 + n * 28, line, "lab mid muted readable", "middle", { opacity: p });
    });
    return out + inner;
  }

  function slStatesPanels(t, scene) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cEvery = c(0, "every"), cThree = c(0, "three");
    var cSol = c(1, "solid"), cShape = c(1, "shape"), cThings1 = c(1, "things");
    var cLiq = c(2, "liquid"), cFlows = c(2, "flows"), cShape2 = c(2, "shape"), cThings2 = c(2, "things");
    var cGas = c(3, "gas"), cSpread = c(3, "spread"), cAir = c(3, "air");
    var out = "", start = on(t, cThree, 0.5);

    /* solid */
    var s1 = on(t, cSol, 0.45), p1 = "";
    if (cThings1 != null) {
      var xs = [slPanelMid(0) - 92, slPanelMid(0), slPanelMid(0) + 92];
      var pics = ["\u{1F9CA}", ART.ICONS.wood, ART.ICONS.rock];
      for (var a = 0; a < 3; a++) {
        var pa = popIn(t, cThings1 + a * 0.3, 0.38);
        if (pa > 0) p1 += G(MK.pic(xs[a], 210, 78, pics[a]), { transform: around(xs[a], 210, Math.min(pa, 1.1)), opacity: Math.min(1, pa) });
      }
    }
    out += slPanel(t, 0, Math.max(start * 0.35, s1), "solid", ["keeps its own shape"], p1);

    /* liquid: a glass fills as the word "flows" is said, then the milk beside it */
    var s2 = on(t, cLiq, 0.45), p2 = "", gx = slPanelMid(1) - 96;
    if (s2 > 0) {
      var fill = on(t, cFlows, 1.0);
      p2 += slGlass(gx, 166, 104, 78, 58, fill * 0.78, s2);
      p2 += E(gx, 214, 58, 66, "none", P.gold, 4, { opacity: bump(t, cShape2, 1.5) });
      if (cThings2 != null) {
        var pb = popIn(t, cThings2, 0.38), pc = popIn(t, cThings2 + 0.32, 0.38);
        p2 += G(MK.pic(slPanelMid(1) + 34, 210, 76, "\u{1F4A7}"), { transform: around(slPanelMid(1) + 34, 210, Math.min(pb, 1.1)), opacity: Math.min(1, pb) });
        p2 += G(MK.pic(slPanelMid(1) + 122, 210, 76, "\u{1F95B}"), { transform: around(slPanelMid(1) + 122, 210, Math.min(pc, 1.1)), opacity: Math.min(1, pc) });
      }
    }
    out += slPanel(t, 1, Math.max(start * 0.35, s2), "liquid", ["flows and takes", "the shape of its container"], p2);

    /* gas: the air leaves the balloon and fills the whole panel */
    var s3 = on(t, cGas, 0.45), p3 = "";
    if (s3 > 0) {
      var u = on(t, cSpread, 1.3);
      p3 += slBalloon(slPanelMid(2) - 96, 196, 42, 50, u > 0.2 ? 1 : 0, s3 * (1 - 0.55 * u));
      p3 += slGasFill(SL_PANEL[2] + 16, 130, SL_PW - 32, 150, slPanelMid(2) - 96, 246, 16, u, s3, t);
      p3 += R(SL_PANEL[2] + 12, 126, SL_PW - 24, 158, 14, "none", P.gold, 3,
        { opacity: on(t, cAir, 0.5) * 0.85, "stroke-dasharray": "13 9" });
    }
    out += slPanel(t, 2, Math.max(start * 0.35, s3), "gas", ["spreads out to fill", "the space it is in"], p3);

    /* the first line: the three empty panels, named */
    out += MK.pill(584, 416, "every material", on(t, cEvery, 0.45) * slOnly(t, scene, 0), { size: 26, col: P.line });
    return out;
  }

  /* the last line: one material, three states */
  function slOneMaterial(t, scene) {
    var cSame = sc(scene, 4, "same"), cDiff = sc(scene, 4, "diff"), cThree = sc(scene, 4, "three");
    var u = on(t, cDiff, 0.9), mid = 584, out = "";
    var xs = [lerp(mid, 284, u), mid, lerp(mid, 884, u)];
    var appear = on(t, cSame, 0.5);
    out += MK.pop(MK.pic(xs[1], 196, 132, "\u{1F4A7}"), xs[1], 196, popIn(t, cSame, 0.45));
    out += G(MK.pic(xs[0], 196, 132, "\u{1F9CA}"), { opacity: u * appear });
    out += G(slSteam(xs[2], 196, 132, 1), { opacity: u * appear });
    out += MK.arrow(xs[0] + 78, 196, xs[1] - 78, 196, u, P.muted, 5);
    out += MK.arrow(xs[2] - 78, 196, xs[1] + 78, 196, u, P.muted, 5);
    if (cThree != null) {
      var names = ["ice", "water", "steam"];
      for (var k = 0; k < 3; k++) {
        var p = popIn(t, cThree + k * 0.28, 0.35);
        if (p > 0) out += MK.pop(Tx(xs[k], 306, names[k], "lab big", "middle", { fill: P.gold }), xs[k], 300, p);
      }
      out += MK.pill(584, 378, "all of it is water", on(t, cThree + 0.85, 0.45), { size: 30, col: P.gold });
    }
    return out;
  }

  function slStatesChapter(scene, beat, t, i) {
    var k = i - scene.first;
    if (k < 4) return svg(slStatesPanels(t, scene));
    var u = into(t, i);
    return svg(slOneMaterial(t, scene) + (u < 1 ? G(slStatesPanels(t, scene), { opacity: 1 - u }) : ""));
  }
