  /* ==== Grade 2 Mathematics, Lesson 9: Count It, Chart It =====================
     tools/lib/film-scenes/math-g2/count-it-chart-it.js, with -2.js and -3.js:
     the film's pictures, after the shared marks (MK) and before the engine's
     tail, all in one scope. The storyboard is
     mathematics/grade-2-app/lecture-video/count-it-chart-it.json.

     Mathematics has no lesson kit, so every manipulative here comes from the
     shared maths library (ART): ART.tally, ART.barChart, ART.pictogram and
     ART.sortDiagram. The two hoops, the coin, the result strips and the
     counting rings are drawn here, because the library has no picture for
     them (reported in the brief's terms: two hoops with a rule, and a strip
     of coin results).

     ONE SET OF NUMBERS RUNS THROUGH THE WHOLE FILM, and every picture is
     checked against it rather than against the eye:
       mango 8, banana 5, orange 4 - seventeen children in all
       8 - 5 = 3 (the block graph's "three more"), 8 + 5 + 4 = 17
       the key pictogram: walk 8, bus 6, bike 4, one picture = 2 children,
         so walk draws 4 pictures and is read 2, 4, 6, 8
       the coin run: six heads and four tails, ten tosses, and the strip
         H H T H T T H H H T holds exactly six H and four T
     The lesson's own numbers: mango 8 and banana 5 with a difference of 3 are
     its story problem; the key of 2 is its Spot the mistake; six heads and
     four tails is what its Toss a coin step says you might get.

     This file: the palette, the small drawings the film shares, the title
     motif and the chapter "Sorting into groups". Every top-level name here
     starts with cc, so nothing can replace a name of the engine, ART or MK. */

  var HUE = {
    title: P.teal, sort: P.good, tally: P.gold, graph: P.blue,
    picto: P.plum, carroll: P.accent, chance: P.teal, recap: P.teal
  };

  /* ---- timing ---------------------------------------------------------------- */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 comes
     in: for a thing that belongs to that beat alone (rule 7) */
  function ccOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function ccFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }
  /* the start of the chapter's beat k, for an action that must stop there */
  function ccBeatStart(scene, k) { return k < scene.beats.length ? BEATS[scene.first + k].start : null; }

  /* ---- small drawings the film shares ----------------------------------------- */

  /* one tally gate: four standing marks and a fifth across them, drawn in the
     film's own gold on the dark stage (ART.tally draws the real charts; this
     is only the badge on the recap card and the title motif). `n` of five. */
  function ccGate(x, y, h, n, col, w) {
    var out = "", pitch = h * 0.24, k;
    col = col || P.gold; w = w || Math.max(2, h * 0.11);
    for (k = 0; k < Math.min(n, 4); k++) out += L(x + k * pitch, y, x + k * pitch, y + h, col, w);
    if (n >= 5) out += L(x - pitch * 0.5, y + h - h * 0.1, x + 3 * pitch + pitch * 0.5, y + h * 0.1, col, w);
    return out;
  }

  /* Where a point of one of ART's drawings lands in the film's 1168 x 440
     space. `place` is the box the drawing is nested in, W and H its own
     viewBox: so a position measured inside the library's layout is turned
     into a film position by one call, and moving the box moves every mark
     with it. */
  function ccMap(place, W, H) {
    var sx = place.w / W, sy = place.h / H;
    return {
      sx: sx, sy: sy,
      x: function (v) { return place.x + v * sx; },
      y: function (v) { return place.y + v * sy; },
      w: function (v) { return v * sx; },
      h: function (v) { return v * sy; }
    };
  }

  /* a ring that names one thing without covering it */
  function ccRing(cx, cy, r, o, col) {
    if (!(o > 0)) return "";
    return C(cx, cy, r, "none", col || P.gold, 4, { opacity: clamp(o, 0, 1) });
  }
  /* the same, round a box */
  function ccBox(x, y, w, h, o, col) {
    if (!(o > 0)) return "";
    return R(x, y, w, h, 10, "none", col || P.gold, 4, { opacity: clamp(o, 0, 1) });
  }

  /* ==== the title motif ============================================================
     What the lesson is, in one picture: a question, a tally gate, a row of
     pictogram dots and a block graph of 8, 5 and 4 - the film's own numbers.
     In the spoken title chapter each part arrives on its own words; on the
     opening and closing cards (no scene) the whole thing simply stands. */
  var CC_MOTIF_BARS = [8, 5, 4];
  function titleMotif(o) {
    var t = o.t || 0, sn = o.scene, out = "", k;
    var full = !sn;
    var oAsk = full ? 1 : on(t, sc(sn, 0, "ask"), 0.45);
    var oCount = full ? 1 : on(t, sc(sn, 0, "count"), 0.45);
    var oShow = full ? 1 : on(t, sc(sn, 0, "show"), 0.45);
    var oTally = full ? 1 : on(t, sc(sn, 1, "tally"), 0.45);
    var oGraph = full ? 1 : on(t, sc(sn, 1, "graph"), 0.45);
    var oPicto = full ? 1 : on(t, sc(sn, 1, "picto"), 0.45);

    out += C(180, 180, 172, "#123247");
    /* the question */
    out += MK.qmark(152, 78, 30, full ? 1 : popIn(t, sc(sn, 0, "ask"), 0.4));
    out += MK.glow(152, 78, 56, P.teal, oAsk * 0.7);
    /* the tally gate: four marks as the answers are counted, the fifth across */
    out += G(ccGate(80, 124, 50, 4, P.gold, 6), { opacity: oCount });
    out += G(ccGate(80, 124, 50, 5, P.gold, 6), { opacity: oTally });
    out += MK.glow(104, 150, 54, P.gold, oTally * (0.5 + 0.5 * breathe(t)));
    /* the pictogram row: four dots */
    for (k = 0; k < 4; k++) out += C(84 + k * 30, 246, 11, P.plum, null, null, { opacity: oPicto });
    /* the block graph: 8, 5 and 4 on a baseline */
    out += L(176, 298, 322, 298, P.muted, 4, { opacity: oShow });
    for (k = 0; k < 3; k++) {
      var hgt = CC_MOTIF_BARS[k] * 12 * oGraph;
      out += R(190 + k * 44, 296 - hgt, 34, hgt, 5, k === 0 ? P.teal : P.blue, null, null, { opacity: oGraph });
    }
    out += C(180, 180, 172, "none", P.line, 3);
    return '<svg viewBox="0 0 360 360" role="img" ' +
      'aria-label="A question mark, a tally gate, a row of pictogram dots and a block graph of eight, five and four">' +
      out + "</svg>";
  }

  /* ==== chapter: sorting into groups ===============================================
     The lesson's own sorting step (SORTS: Fruit or Vegetable, the same eight
     things). Two hoops, a pool of eight above them, and one clear rule. The
     apple and the carrot go first, as they are named; the other six follow on
     "Each thing goes in one hoop only".

     The library has no picture of two labelled hoops, so this is drawn here. */
  var CC_ITEMS = [
    { ch: "\u{1F34E}", g: 0 },   /* apple    - fruit     */
    { ch: "\u{1F955}", g: 1 },   /* carrot   - vegetable */
    { ch: "\u{1F34C}", g: 0 },   /* banana   - fruit     */
    { ch: "\u{1F966}", g: 1 },   /* broccoli - vegetable */
    { ch: "\u{1F347}", g: 0 },   /* grapes   - fruit     */
    { ch: "\u{1F954}", g: 1 },   /* potato   - vegetable */
    { ch: "\u{1F34A}", g: 0 },   /* orange   - fruit     */
    { ch: "\u{1F33D}", g: 1 }    /* corn     - vegetable */
  ];
  /* which slot each item takes inside its hoop, in the order they arrive */
  var CC_SLOT_OF = [0, 0, 1, 1, 2, 2, 3, 3];
  var CC_HOOP = [{ cx: 330, cy: 290, name: "Fruit", col: P.teal }, { cx: 840, cy: 290, name: "Vegetable", col: P.good }];
  var CC_HOOP_RX = 200, CC_HOOP_RY = 118;
  var CC_SLOT = [[-65, -35], [65, -35], [-65, 40], [65, 40]];

  function ccPoolPos(k) { return [292 + k * 80, 96]; }
  function ccSlotPos(k) {
    var h = CC_HOOP[CC_ITEMS[k].g], s = CC_SLOT[CC_SLOT_OF[k]];
    return [h.cx + s[0], h.cy + s[1]];
  }

  function ccSortChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cAlike = c(0, "alike"), cRule = c(0, "rule");
    var cFruit = c(1, "fruit"), cVeg = c(1, "veg"), cNothing = c(1, "nothing");
    var cApple = c(2, "apple"), cHere = c(2, "here"), cCarrot = c(2, "carrot");
    var cOne = c(3, "one"), cColour = c(3, "colour");
    var out = "", k;

    /* the rule, said first and kept above everything */
    out += MK.pill(584, 34, "one clear rule", popIn(t, cRule, 0.4), { size: 28, col: P.gold });

    /* the two hoops: empty when the rule is named, labelled when it is said */
    var hoopO = Math.max(on(t, cRule, 0.5), ccFrom(t, scene, 1));
    var bothRing = on(t, cNothing, 0.5) * (1 - on(t, ccBeatStart(scene, 3), 0.6));
    for (k = 0; k < 2; k++) {
      var h = CC_HOOP[k], nameAt = k === 0 ? cFruit : cVeg;
      out += E(h.cx, h.cy, CC_HOOP_RX, CC_HOOP_RY, "rgba(255,255,255,0.04)", h.col, 5, { opacity: hoopO });
      out += E(h.cx, h.cy, CC_HOOP_RX + 10, CC_HOOP_RY + 10, "none", P.gold, 4, { opacity: bothRing });
      out += MK.pill(h.cx, 152, h.name, popIn(t, nameAt, 0.4), { size: 30, col: h.col });
    }

    /* when each thing leaves the pool */
    var land = [];
    for (k = 0; k < 8; k++) land.push(null);
    land[0] = cHere;
    land[1] = cCarrot == null ? null : cCarrot + 0.3;
    var rest = [2, 3, 4, 5, 6, 7];
    for (k = 0; k < rest.length; k++) land[rest[k]] = cOne == null ? null : cOne + 0.4 + k * 0.22;

    /* the pool dims while "Nothing else matters" rings the hoops */
    var poolDim = 1 - 0.45 * bothRing;

    for (k = 0; k < 8; k++) {
      var from = ccPoolPos(k), to = ccSlotPos(k);
      var u = land[k] == null ? 0 : ease((t - land[k]) / 0.55);
      var x = lerp(from[0], to[0], u), y = lerp(from[1], to[1], u) - 46 * Math.sin(Math.PI * u);
      var op = clamp(on(t, cAlike, 0.5), 0, 1) * (u > 0 ? 1 : poolDim);
      out += Em(x, y, 54, CC_ITEMS[k].ch, { opacity: op });
      /* named in the pool, just before it moves */
      if (k === 0) out += ccRing(x, y - 4, 34, on(t, cApple, 0.4) * (1 - u));
      if (k === 1) out += ccRing(x, y - 4, 34, on(t, cCarrot, 0.4) * (1 - u));
      /* it landed: a tick, once */
      if (k < 2 && u >= 1 && land[k] != null)
        out += MK.tick(to[0] + 34, to[1] - 24, 15, popIn(t, land[k] + 0.55, 0.35) * ccOnly(t, scene, 2));
    }

    /* "one hoop only": it cannot also go in the other hoop */
    var onlyO = on(t, cOne, 0.5) * (1 - on(t, cColour, 0.5));
    if (onlyO > 0) {
      var a = ccSlotPos(0), b = [CC_HOOP[1].cx - 65, CC_HOOP[1].cy - 35];
      out += L(a[0] + 40, a[1], b[0] - 40, b[1], P.muted, 4, { opacity: onlyO * 0.8, "stroke-dasharray": "12 9" });
      out += MK.cross(585, 255, 26, popIn(t, cOne == null ? null : cOne + 0.25, 0.4) * onlyO);
    }

    /* "not by colour": three colours, crossed out */
    var colO = popIn(t, cColour, 0.4);
    if (colO > 0) {
      var swatch = C(556, 408, 13, "#E0483C") + C(584, 408, 13, "#F2B01E") + C(612, 408, 13, "#57B84C");
      out += MK.pop(swatch, 584, 408, Math.min(1, colO));
      out += MK.cross(584, 408, 28, popIn(t, cColour == null ? null : cColour + 0.3, 0.4));
    }
    return svg(out);
  }
