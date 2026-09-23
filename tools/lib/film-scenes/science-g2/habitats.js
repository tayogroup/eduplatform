  /* ==== Grade 2 Science, Lesson 3: Habitats ===================================
     tools/lib/film-scenes/science-g2/habitats.js, with -2.js, -3.js and -4.js:
     the film's pictures, after the shared marks (MK) and before the engine's
     tail, all in one scope. The storyboard is
     science/grade-2-app/lecture-video/habitats.json.

     The lesson's own drawings come from ART, so the child sees here what they
     tap two steps later: the four habitats of the demo's "Next place" button
     (ART.scene("habitat", 0..3) - a pond, a desert, a forest, the icy Arctic,
     each with the animals the lesson draws in it), and the kit's own polar
     bear, seal, bottle, log, beetle and woodlouse. The frog drawn large, the
     dragonflies over the pond, the rabbit's burrow and field, the garden, the
     car park and the two block graphs are the film's own, because the lesson
     pictures those only as emoji or as numbers in a table.

     This file: the palette, the timing helpers, the habitat cards, the small
     drawings the chapters share and the title motif. Every top-level name here
     starts with hb, so nothing can replace a name of the engine, ART or MK. */

  var HUE = {
    title: P.teal, what: P.gold, pond: P.blue, desert: P.accent,
    count: P.plum, compare: P.good, care: P.gold, recap: P.teal
  };

  /* ---- timing ---------------------------------------------------------------- */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 comes
     in: for a thing that belongs to that beat alone (rule 7) */
  function hbOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function hbFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }
  /* fixed numbers for anything scattered: never Math.random */
  var HB_SCATTER = [0.21, 0.67, 0.44, 0.9, 0.08, 0.55, 0.33, 0.78, 0.15, 0.61, 0.49, 0.86];

  /* ---- the lesson's four habitats, as cards ----------------------------------
     SCENES.habitat draws each one 320 x 200. hbBox keeps that shape, so hbX and
     hbY turn a point of the lesson's drawing into a point of the film's space
     and a ring or a leader lands on the animal the lesson drew there. */
  function hbBox(x, y, w) { return { x: x, y: y, w: w, h: w * 200 / 320, k: w / 320 }; }
  function hbX(b, v) { return b.x + v * b.k; }
  function hbY(b, v) { return b.y + v * b.k; }
  function hbCard(b, s, o, extra) {
    if (!(o > 0)) return "";
    return G(R(b.x - 9, b.y - 9, b.w + 18, b.h + 18, 18, P.card, P.line, 2) +
      ART.place(ART.scene("habitat", s), b.x, b.y, b.w, b.h) +
      (extra || ""), { opacity: clamp(o, 0, 1) });
  }
  /* the name the lesson gives each one, under its card */
  var HB_NAME = ["A pond", "A desert", "A forest", "The icy Arctic"];
  function hbCaption(b, s, o) {
    if (!(o > 0)) return "";
    return Tx(b.x + b.w / 2, b.y + b.h + 40, HB_NAME[s], "lab big", "middle", { opacity: clamp(o, 0, 1) });
  }
  /* where each animal sits inside SCENES.habitat's own 320 x 200 space: an
     emoji drawn at (x, y, size) is centred on (x + size / 2, y - 0.36 * size),
     and the Arctic's two are the kit's drawings, placed by glyphAt. */
  var HB_SPOT = {
    pondFrog: [90, 136], pondDuck: [220, 106], pondFish: [147, 173], pondPlant: [267, 168], pondWater: [196, 188],
    desCamel: [82, 154], desCactus: [220, 146], desLizard: [275, 169], desSun: [270, 40], desSand: [150, 180],
    forTreeA: [64, 103], forTreeB: [244, 103], forDeer: [138, 167], forBird: [183, 91],
    arcBear: [85, 154], arcSeal: [222, 161], arcSnowA: [145, 99], arcSnowB: [275, 89]
  };
  function hbAt(b, spot) { var p = HB_SPOT[spot]; return [hbX(b, p[0]), hbY(b, p[1])]; }
  /* a ring round one animal of a card; r is in the lesson drawing's own units */
  function hbRing(b, spot, r, o, col) {
    if (!(o > 0)) return "";
    var p = hbAt(b, spot);
    return C(p[0], p[1], r * b.k, "none", col || P.gold, 4, { opacity: clamp(o, 0, 1) });
  }
  /* the quieter mark left on an animal already named (rule 3) */
  function hbSeen(b, spot, r, o) {
    if (!(o > 0)) return "";
    var p = hbAt(b, spot);
    return C(p[0], p[1], r * b.k, "none", P.teal, 3, { opacity: 0.5 * clamp(o, 0, 1) });
  }

  /* a word in a pill with a leader line to the thing it names; the newest is
     gold, one named before it keeps its line, quieter */
  function hbLabel(t, x, y, text, at, to, now, size) {
    var o = on(t, at, 0.4);
    if (o <= 0) return "";
    var col = now ? P.gold : P.muted;
    return MK.leader(x - 8, y, to[0], to[1], on(t, at, 0.6), col) +
      MK.pill(x, y, text, o, { size: size || 26, anchor: "start", col: now ? P.gold : P.line });
  }

  /* ---- small drawings the chapters share --------------------------------------- */

  /* a drop of water, its round bottom centred on (x, y) */
  function hbDrop(x, y, r, o, col) {
    if (!(o > 0)) return "";
    return G(Pth("M" + n2(x - r * 0.9) + "," + n2(y - r * 0.42) + " L" + n2(x) + "," + n2(y - r * 2.1) +
        " L" + n2(x + r * 0.9) + "," + n2(y - r * 0.42) + " Z", col || "#7FC4EA") +
      C(x, y, r, col || "#7FC4EA") + C(x - r * 0.34, y - r * 0.28, r * 0.28, "#FFFFFF", null, null, { opacity: 0.7 }),
      { opacity: clamp(o, 0, 1) });
  }
  /* the Sun, the kit's gold, with eight rays turning slowly */
  function hbSun(cx, cy, r, o, t) {
    if (!(o > 0)) return "";
    var rays = "", a0 = (t || 0) * 0.3;
    for (var k = 0; k < 8; k++) {
      var a = a0 + k * Math.PI / 4;
      rays += L(cx + Math.cos(a) * r * 1.3, cy + Math.sin(a) * r * 1.3, cx + Math.cos(a) * r * 1.75, cy + Math.sin(a) * r * 1.75, P.gold, r * 0.2);
    }
    return G(MK.glow(cx, cy, r * 2.2, P.gold, 1) + rays + C(cx, cy, r, P.gold), { opacity: clamp(o, 0, 1) });
  }
  /* a tuft of grass standing on (x, y) */
  function hbTuft(x, y, h, o, col) {
    if (!(o > 0)) return "";
    var c = col || "#2F7D3B", w = Math.max(2, h * 0.14);
    return G(Pth("M" + n2(x) + "," + n2(y) + " q" + n2(-h * 0.34) + "," + n2(-h * 0.5) + " " + n2(-h * 0.22) + "," + n2(-h), null, c, w) +
      Pth("M" + n2(x) + "," + n2(y) + " q" + n2(-h * 0.04) + "," + n2(-h * 0.56) + " " + n2(h * 0.1) + "," + n2(-h * 1.02), null, c, w) +
      Pth("M" + n2(x) + "," + n2(y) + " q" + n2(h * 0.34) + "," + n2(-h * 0.5) + " " + n2(h * 0.26) + "," + n2(-h * 0.9), null, c, w),
      { opacity: clamp(o, 0, 1) });
  }
  /* a flower on a stem standing on (x, y) */
  function hbFlower(x, y, h, o, col) {
    if (!(o > 0)) return "";
    var r = h * 0.24, top = y - h, pet = "";
    for (var k = 0; k < 6; k++) {
      var a = k * Math.PI / 3, px = x + Math.cos(a) * r * 0.95, py = top + Math.sin(a) * r * 0.95;
      pet += E(px, py, r * 0.62, r * 0.44, col || "#F4C95D", null, null,
        { transform: "rotate(" + n2(a * 180 / Math.PI) + " " + n2(px) + " " + n2(py) + ")" });
    }
    return G(L(x, y, x, top, "#2F7D3B", Math.max(2, h * 0.07)) +
      E(x - h * 0.15, y - h * 0.52, h * 0.15, h * 0.075, "#2F7D3B") +
      pet + C(x, top, r * 0.5, "#E9744F"), { opacity: clamp(o, 0, 1) });
  }

  /* a column of blocks for a block graph, one block per animal counted: `up` of
     them are in place (a float, so the newest one is still popping) */
  function hbColumn(cx, base, up, w, h, gap, col, alpha) {
    var out = "", n = Math.ceil(up - 1e-6);
    for (var k = 0; k < n; k++) {
      var p = clamp(up - k, 0, 1), y = base - (k + 1) * (h + gap) + gap;
      out += G(R(cx - w / 2, y, w, h, h * 0.22, col || P.teal, "#0B1D2C", 2) +
        R(cx - w / 2 + w * 0.08, y + h * 0.16, w * 0.84, h * 0.18, h * 0.09, "#FFFFFF", null, null, { opacity: 0.3 }),
        { opacity: (alpha == null ? 1 : alpha) * Math.min(1, p * 2.5), transform: around(cx, y + h / 2, 0.62 + 0.38 * ease(p)) });
    }
    return out;
  }
  /* the top of a column of n blocks */
  function hbTop(base, n, h, gap) { return base - n * (h + gap) + gap; }

  /* ---- the frog, drawn large -------------------------------------------------
     The lesson pictures a frog as the emoji face, which shows no skin, no legs
     and no feet; the pond chapter talks about all three, so the film draws one
     in side view. Its parts light one at a time: the smooth back, the long
     hind leg, the webbed foot (rule 3, rule 8). Local units run about -116 to
     124 across and -62 to 116 down; hbFrog scales that about (cx, cy). */
  function hbFrog(cx, cy, k, lit, o) {
    if (!(o > 0)) return "";
    lit = lit || {};
    var green = "#5BBE5A", deep = "#3E9B44", belly = "#A9DD93", edge = "#2E7D32", web = "#7FD07E", out = "";
    /* the body, its smooth back, and the short front leg */
    out += E(0, 0, 96, 58, green, edge, 3);
    out += E(10, 24, 70, 28, belly, null, null, { opacity: 0.9 });
    out += Pth("M-56,-30 q52,-30 112,-8", null, "#FFFFFF", 9, { opacity: 0.38 });
    if (lit.skin > 0) out += E(0, 0, 99, 61, "none", P.gold, 5, { opacity: clamp(lit.skin, 0, 1) });
    out += Pth("M60,20 Q76,50 68,72", null, deep, 16);
    out += Pth("M66,74 L98,64 M68,78 L100,76 M66,82 L94,92", null, deep, 7);
    /* the long hind leg, folded the way a sitting frog holds it: thigh back,
       knee up behind the body, shin forward and down to the webbed foot */
    out += Pth("M12,6 Q-52,24 -88,-2", null, deep, 36);
    out += Pth("M-88,-2 Q-108,48 -62,80", null, deep, 28);
    out += Pth("M-66,72 L2,60 L18,84 L0,104 L-52,100 Z", web, edge, 3);
    out += Pth("M-34,80 L6,66 M-32,88 L14,84 M-34,94 L8,98", null, edge, 2.5);
    if (lit.leg > 0) {
      out += Pth("M12,6 Q-52,24 -88,-2", null, P.gold, 9, { opacity: clamp(lit.leg, 0, 1) });
      out += Pth("M-88,-2 Q-108,48 -62,80", null, P.gold, 9, { opacity: clamp(lit.leg, 0, 1) });
    }
    if (lit.foot > 0) out += Pth("M-66,72 L2,60 L18,84 L0,104 L-52,100 Z", "none", P.gold, 5, { opacity: clamp(lit.foot, 0, 1) });
    /* the head: a bump on the front of the body, a wide mouth, an eye on top */
    out += E(76, -16, 44, 38, green, edge, 3);
    out += Pth("M44,2 q34,18 72,-4", null, edge, 4);
    out += C(86, -44, 18, green, edge, 3) + C(88, -46, 11, "#FFFFFF") + C(91, -46, 6, "#1B1B1B");
    return G(out, { transform: "translate(" + n2(cx) + "," + n2(cy) + ") scale(" + n3(k) + ")", opacity: clamp(o, 0, 1) });
  }

  /* a dragonfly, the insect the lesson's pond fact card has hunting over the
     water; its wings beat, as a pure function of t */
  function hbFly(cx, cy, k, t, o, ph) {
    if (!(o > 0)) return "";
    var w = 0.55 + 0.45 * Math.abs(Math.sin((t + (ph || 0)) * 8));
    /* seen from above, as a child sees one over a pond: a long thin body with
       four wings out to the sides */
    function wing(sx, sy, rot) {
      return E(sx, sy, 9, 30 * w, "#DCF0FA", "#8FC8DE", 1.6, { transform: "rotate(" + n2(rot) + " " + n2(sx) + " " + n2(sy) + ")" });
    }
    var out = wing(8, -34 * w, -8) + wing(-12, -30 * w, -16) + wing(8, 34 * w, 8) + wing(-12, 30 * w, 16);
    out += Pth("M-46,0 L10,0", null, "#3FA3C9", 7) +
      Pth("M-36,-5 L-36,5 M-24,-6 L-24,6 M-12,-6 L-12,6", null, "#2B7EA0", 2.5) +
      E(16, 0, 13, 9, "#2E7D9B") + C(30, 0, 11, "#2E7D9B") +
      C(32, -6, 5, "#11212B") + C(32, 6, 5, "#11212B");
    return G(out, { transform: "translate(" + n2(cx) + "," + n2(cy) + ") scale(" + n3(k) + ")", opacity: clamp(o, 0, 1) });
  }

  /* ==== the title ===============================================================
     The lesson's own four habitats in a square, the drawing its demo steps
     through. In the spoken title chapter each lights as its animal is named -
     the frog's pond, the camel's desert, the deer's forest, the polar bear's
     Arctic - and on "suits it" all four are ringed together. On the two cards
     they simply stand. */
  var HB_MOTIF = [];
  (function () {
    var w = 160, h = 100, gap = 12, x0 = 14, y0 = 74;
    for (var k = 0; k < 4; k++) HB_MOTIF.push({ x: x0 + (k % 2) * (w + gap), y: y0 + Math.floor(k / 2) * (h + gap), w: w, h: h });
  })();
  var HB_TITLE_CUE = ["frog", "camel", "deer", "bear"];
  function titleMotif(o) {
    var t = o.t || 0, sceneOn = !!o.scene, out = "";
    var allAt = sceneOn ? sc(o.scene, 1, "suits") : null, habAt = sceneOn ? sc(o.scene, 1, "habitat") : null;
    out += R(2, 66, 356, 228, 26, "#123247", P.line, 3);
    var all = on(t, allAt, 0.6);
    out += MK.glow(180, 180, 168, P.teal, all * (0.7 + 0.3 * breathe(t)));
    for (var k = 0; k < 4; k++) {
      var c = HB_MOTIF[k], at = sceneOn ? sc(o.scene, 0, HB_TITLE_CUE[k]) : null;
      var lit = sceneOn ? popIn(t, at, 0.4) : 1;
      var alpha = sceneOn ? 0.34 + 0.66 * Math.min(1, lit) : 1;
      out += G(R(c.x - 4, c.y - 4, c.w + 8, c.h + 8, 12, P.card, lit > 0 ? P.teal : P.line, lit > 0 ? 3 : 2) +
        ART.place(ART.scene("habitat", k), c.x, c.y, c.w, c.h),
        { opacity: alpha, transform: around(c.x + c.w / 2, c.y + c.h / 2, 0.94 + 0.06 * Math.min(1, lit)) });
      if (all > 0) out += R(c.x - 4, c.y - 4, c.w + 8, c.h + 8, 12, "none", P.gold, 3, { opacity: all });
    }
    /* the word the film is about, over the square, as it is said */
    var hp = popIn(t, habAt, 0.4);
    if (hp > 0) out += MK.pill(180, 40, "habitat", Math.min(1, hp), { size: 30, col: P.gold, fill: P.card });
    return '<svg viewBox="0 0 360 360" role="img" aria-label="Four habitats: a pond, a desert, a forest and the icy Arctic">' + out + "</svg>";
  }
