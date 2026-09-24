
  /* ==== Grade 4 Mathematics, Lesson 7: Where Things Are ========================
     tools/lib/film-scenes/math-g4/where-things-are.js, with -2.js and -3.js: the
     film's pictures, after the shared marks (MK) and before the engine's tail,
     all in one scope. The storyboard is
     mathematics/grade-4-app/lecture-video/where-things-are.json.

     Mathematics has no lesson kit, so every drawing here is one of the shared
     maths pictures (tools/lib/ehel-film-art-math.js): ART.compass for the four
     and eight points and the quarter turn, ART.grid for the 8 by 8 map the
     lesson walks a route on, ART.grid with coords for the coordinate grid, and
     ART.grid with fill for the shape being reflected. Everything drawn on top -
     the swinging arrow, the walking dot, the growing guides, the partner
     squares - is placed by mapping the drawing's own viewBox into the film's
     1168 x 440 space, so a point named in the script lands on the point the
     library drew.

     THE ONE THING THIS FILM CAN GET BACKWARDS is along-and-up, so every mapping
     below is written once and used everywhere: wtaXY(a, b) is a ALONG and b UP,
     wtaCell(i, j) is column i from the left and row j from the TOP (north is a
     smaller j), and wtaRose(k) walks N, NE, E, SE, S, SW, W, NW clockwise from
     up. Each is checked against the library's own arithmetic in the comment
     beside it.

     This file: the palette, the mappings, the small drawings the chapters
     share, the title motif and the chapter "Four main points". Every top-level
     name starts with wta. */

  var HUE = {
    title: P.teal, cardinal: P.gold, ordinal: P.blue, route: P.accent,
    coords: P.teal, corners: P.plum, mirror: P.good, recap: P.teal
  };

  /* ---- timing ---------------------------------------------------------------- */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 does */
  function wtaOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on */
  function wtaFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }
  /* 0 -> 1 over span from a cue, staying at 1: a move that finishes and stays */
  function wtaStep(t, at, span) { return at == null ? 0 : ease(clamp((t - at) / (span || 0.5), 0, 1)); }

  /* ---- the compass card ------------------------------------------------------
     ART.compass draws a 292 x 294 card (no label): centre (146, 150), radius
     104, and each point's letter at radius 104 + 19 on the angle k * 45 - 90
     degrees, with k = 0 north and k counting CLOCKWISE. Placed here at
     (350, 8) scaled 1.45, which keeps the same aspect, so a viewBox point maps
     by one multiply. */
  var WTA_CP = { x: 350, y: 8, s: 1.45, w: 292, h: 294 };
  function wtaCP(svgMarkup) { return ART.place(svgMarkup, WTA_CP.x, WTA_CP.y, WTA_CP.w * WTA_CP.s, WTA_CP.h * WTA_CP.s); }
  function wtaCPu(u) { return WTA_CP.x + u * WTA_CP.s; }
  function wtaCPv(v) { return WTA_CP.y + v * WTA_CP.s; }
  var WTA_HUB = [wtaCPu(146), wtaCPv(150)];     /* (561.7, 225.5) */
  var WTA_R = 104 * WTA_CP.s;                   /* 150.8 */
  /* the angle of compass point k, in degrees, 0 = to the right: k = 0 is north
     (-90, straight up) and k grows clockwise, so k = 2 is east (0, right) */
  function wtaRoseAng(k) { return k * 45 - 90; }
  /* where ART wrote the letter of point k, in film space */
  function wtaRose(k) {
    var a = wtaRoseAng(k) * Math.PI / 180;
    return [wtaCPu(146 + 123 * Math.cos(a)), wtaCPv(150 + 123 * Math.sin(a))];
  }

  /* ---- the squared map -------------------------------------------------------
     ART.grid with 8 columns, 8 rows and a 40 cell and no coords draws a
     364 x 364 card: the squares start at (22, 22) and each is 40 across.
     Placed at (350, 14) scaled 1.10. Row 0 is the TOP row, so north is a
     smaller row number, exactly as the lesson's own 8 by 8 map has it. */
  var WTA_GR = { x: 350, y: 14, s: 1.10, side: 364, cell: 40, pad: 22 };
  var WTA_CELL = WTA_GR.cell * WTA_GR.s;        /* 44 */
  function wtaGrid(o) { return ART.place(ART.grid(o), WTA_GR.x, WTA_GR.y, WTA_GR.side * WTA_GR.s, WTA_GR.side * WTA_GR.s); }
  /* the top left corner of column i, row j */
  function wtaCellXY(i, j) {
    return [WTA_GR.x + (WTA_GR.pad + WTA_GR.cell * i) * WTA_GR.s,
            WTA_GR.y + (WTA_GR.pad + WTA_GR.cell * j) * WTA_GR.s];
  }
  /* the middle of column i, row j; i and j may be fractions, for a walking dot */
  function wtaCell(i, j) {
    var c = wtaCellXY(i, j);
    return [c[0] + WTA_CELL / 2, c[1] + WTA_CELL / 2];
  }
  /* the grid line at column i, and the top and bottom of the squares */
  function wtaLineX(i) { return wtaCellXY(i, 0)[0]; }
  var WTA_GTOP = wtaCellXY(0, 0)[1], WTA_GBOT = wtaCellXY(0, 8)[1];

  /* ---- the coordinate grid ---------------------------------------------------
     ART.grid with coords leaves a 36 gutter for the numbers up the side, so the
     squares start at (58, 22) and the 0 line is at the BOTTOM, 22 + 320 down.
     A coordinate (a, b) is therefore a ALONG from the left and b UP from the
     bottom, which is the one thing this lesson must not transpose. */
  var WTA_XY = { x: 360, y: 8, s: 1.07, side: 400, cell: 40, gx: 58, gy: 22, gh: 320 };
  var WTA_STEP = WTA_XY.cell * WTA_XY.s;        /* 42.8 */
  function wtaCoordGrid(o) { return ART.place(ART.grid(o), WTA_XY.x, WTA_XY.y, WTA_XY.side * WTA_XY.s, WTA_XY.side * WTA_XY.s); }
  function wtaXY(a, b) {
    return [WTA_XY.x + (WTA_XY.gx + WTA_XY.cell * a) * WTA_XY.s,
            WTA_XY.y + (WTA_XY.gy + WTA_XY.gh - WTA_XY.cell * b) * WTA_XY.s];
  }
  var WTA_O = wtaXY(0, 0);                      /* (422.1, 373.9), the origin */

  /* ---- small drawings the chapters share --------------------------------------- */

  /* an arrowhead at (x, y) pointing along the angle a (degrees) */
  function wtaHead(x, y, a, col, size) {
    var r = a * Math.PI / 180, w = size == null ? 10 : size;
    function p(d, s) { var q = r + d * Math.PI / 180; return n2(x + s * Math.cos(q)) + "," + n2(y + s * Math.sin(q)); }
    return el("polygon", { points: n2(x) + "," + n2(y) + " " + p(152, w * 1.7) + " " + p(-152, w * 1.7), fill: col });
  }
  /* a ray from (cx, cy) of length r along the angle a (degrees), with a head */
  function wtaRay(cx, cy, r, a, col, w, o) {
    if (!(o > 0)) return "";
    var q = a * Math.PI / 180;
    return G(L(cx, cy, cx + r * Math.cos(q), cy + r * Math.sin(q), col, w || 8) +
      wtaHead(cx + (r + 11) * Math.cos(q), cy + (r + 11) * Math.sin(q), a, col, (w || 8) * 1.3) +
      C(cx, cy, (w || 8), col), { opacity: clamp(o, 0, 1) });
  }
  /* an arc of radius r from a0 to a1 degrees, drawn as far as u */
  function wtaArc(cx, cy, r, a0, a1, u, col, w) {
    if (!(u > 0)) return "";
    var a = a0 + (a1 - a0) * clamp(u, 0, 1);
    if (Math.abs(a - a0) < 0.6) return "";
    var r0 = a0 * Math.PI / 180, r1 = a * Math.PI / 180;
    var big = Math.abs(a - a0) > 180 ? 1 : 0, sweep = a > a0 ? 1 : 0;
    return Pth("M" + n2(cx + r * Math.cos(r0)) + "," + n2(cy + r * Math.sin(r0)) +
      " A" + n2(r) + "," + n2(r) + " 0 " + big + "," + sweep + " " +
      n2(cx + r * Math.cos(r1)) + "," + n2(cy + r * Math.sin(r1)), null, col, w || 5) +
      wtaHead(cx + r * Math.cos(r1), cy + r * Math.sin(r1), a + (a > a0 ? 90 : -90), col, (w || 5) * 1.5);
  }
  /* a ring round something being named */
  function wtaRing(x, y, r, p, col) {
    if (!(p > 0)) return "";
    return G(C(x, y, r, "none", col || P.gold, 4), { transform: around(x, y, Math.min(p, 1.12)), opacity: Math.min(1, p) });
  }
  /* a right angle: a corner at (x, y) with arms up and to the right */
  function wtaRightAngle(x, y, len, o, col) {
    if (!(o > 0)) return "";
    var c = col || P.gold, u = clamp(o, 0, 1), m = Math.min(30, len * 0.3);
    return G(L(x, y, x + len * u, y, c, 6) + L(x, y, x, y - len * u, c, 6) +
      Pth("M" + n2(x + m) + "," + n2(y) + " L" + n2(x + m) + "," + n2(y - m) + " L" + n2(x) + "," + n2(y - m), null, c, 4, { opacity: u }),
      { opacity: u });
  }
  /* a double headed arrow between two points, for "the same distance" */
  function wtaSpan(x1, y1, x2, y2, u, col, w) {
    if (!(u > 0)) return "";
    var mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    return MK.arrow(mx, my, x1, y1, u, col || P.gold, w || 5) + MK.arrow(mx, my, x2, y2, u, col || P.gold, w || 5);
  }

  /* ==== the title motif =========================================================
     A rose of eight points over a faint squared grid, with one crossing marked:
     the two answers this lesson gives to "where is it". On the two cards it
     simply stands; in the spoken title chapter the grid rules itself in, the
     four long arms grow, the four short ones follow, and the marker lands. */
  function titleMotif(o) {
    var t = o.t || 0, s = o.scene || null;
    var gridO = s ? on(t, sc(s, 0, "grid"), 0.7) : 1;
    var compO = s ? on(t, sc(s, 0, "compass"), 0.7) : 1;
    var eightO = s ? on(t, sc(s, 1, "eight"), 0.6) : 1;
    var pairO = s ? popIn(t, sc(s, 1, "pair"), 0.45) : 1;
    var out = "", k;
    out += C(180, 180, 172, "#123247");
    out += el("clipPath", { id: "wtaMotifClip" }, C(180, 180, 172));
    var rule = "";
    for (k = 0; k <= 8; k++) {
      var v = 44 + k * 34, gu = clamp(gridO * 1.3 - k * 0.04, 0, 1);
      rule += L(44, v, 44 + 272 * gu, v, P.line, 2, { opacity: 0.55 * gridO });
      rule += L(v, 44, v, 44 + 272 * gu, P.line, 2, { opacity: 0.55 * gridO });
    }
    out += G(rule, { "clip-path": "url(#wtaMotifClip)" });
    /* the four in between first, so the long arms sit over them */
    for (k = 1; k < 8; k += 2) {
      var ao = wtaRoseAng(k) * Math.PI / 180;
      out += L(180, 180, 180 + 84 * eightO * Math.cos(ao), 180 + 84 * eightO * Math.sin(ao), P.blue, 7, { opacity: eightO });
    }
    for (k = 0; k < 8; k += 2) {
      var ac = wtaRoseAng(k) * Math.PI / 180;
      out += L(180, 180, 180 + 118 * compO * Math.cos(ac), 180 + 118 * compO * Math.sin(ac), P.gold, 10, { opacity: compO });
    }
    out += C(180, 180, 15, P.gold, null, null, { opacity: compO });
    var letters = ["N", "E", "S", "W"];
    for (k = 0; k < 4; k++) {
      var al = wtaRoseAng(k * 2) * Math.PI / 180;
      out += Tx(180 + 146 * Math.cos(al), 180 + 146 * Math.sin(al) + 11, letters[k], "lab big", "middle", { opacity: compO });
    }
    /* one crossing of the grid, marked: a place is a pair of numbers */
    if (pairO > 0) {
      out += G(C(248, 112, 15, P.teal, "#123247", 4) + C(248, 112, 27, "none", P.teal, 3, { opacity: 0.5 }),
        { transform: around(248, 112, Math.min(pairO, 1.12)), opacity: Math.min(1, pairO) });
    }
    out += C(180, 180, 172, "none", P.line, 3);
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A compass rose of eight points over a squared grid, with one crossing marked">' + out + "</svg>";
  }

  /* ==== chapter: four main points ===============================================
     ART.compass with four points, facing north. The orange arrow ART draws
     stays at north - it is where the turn STARTED - and a teal arrow of this
     film's own swings a quarter turn clockwise onto east as the words are
     said, with the arc it sweeps. A quarter turn clockwise from north is east:
     the same step ART itself takes (facing index 0 plus two eighths is index 2,
     E), and the same one the lesson's slide 1 counts round. */
  function wtaCardinalChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cFour = c(0, "four"), cMap = c(0, "map");
    var cN = c(1, "north"), cE = c(1, "east"), cS = c(1, "south"), cW = c(1, "west");
    var cFacing = c(2, "facing"), cQuarter = c(2, "quarter");
    var cEast = c(3, "east"), cOne = c(3, "one");
    var cRight = c(4, "right"), cFull = c(4, "full");
    var out = wtaCP(ART.compass({ points: 4, facing: "N", label: false }));

    /* the four names, one at a time, and what beat one says about them */
    out += MK.pill(60, 74, "4 points", popIn(t, cFour, 0.4), { size: 30, anchor: "start", col: P.gold });
    out += MK.pop(Em(300, 72, 58, "\u{1F5FA}\u{FE0F}"), 300, 72, popIn(t, cMap, 0.4));
    out += MK.list(60, 150, [
      { text: "north", at: cN }, { text: "east", at: cE },
      { text: "south", at: cS }, { text: "west", at: cW }
    ], t, { lh: 58, cls: "lab big" });

    /* each letter rings as it is named, going round clockwise */
    var named = [cN, cE, cS, cW];
    for (var k = 0; k < 4; k++) {
      var pt = wtaRose(k * 2);
      out += wtaRing(pt[0], pt[1], 27, popIn(t, named[k], 0.35) * (1 - on(t, BEATS[scene.first + 2].start, 0.5) * 0.65), P.gold);
    }

    /* "facing north": the teal arrow starts on north and swings a quarter turn
       clockwise, from -90 degrees (up) to 0 (right), landing on east */
    var swing = wtaStep(t, cQuarter, 1.0);
    var live = on(t, cFacing, 0.5);
    if (live > 0) {
      out += wtaArc(WTA_HUB[0], WTA_HUB[1], WTA_R * 0.62, -90, 0, swing, P.teal, 5);
      out += wtaRay(WTA_HUB[0], WTA_HUB[1], WTA_R * 0.78, -90 + 90 * swing, P.teal, 8, live);
    }
    var here = wtaRose(2);
    out += wtaRing(here[0], here[1], 30, popIn(t, cEast, 0.4), P.teal);
    out += MK.pill(960, 110, "now east", on(t, cEast, 0.4), { size: 30, col: P.teal });
    out += MK.pill(960, 172, "one point on", on(t, cOne, 0.4), { size: 26, col: P.line });

    /* "a right angle": a quarter turn drawn as the corner it is */
    var ra = on(t, cRight, 0.6);
    if (ra > 0) {
      out += wtaRightAngle(900, 360, 150, ra, P.gold);
      out += MK.pill(1010, 300, "90°", popIn(t, cRight == null ? null : cRight + 0.4, 0.4), { size: 32, col: P.gold });
    }
    /* "a full turn": the arrow's sweep carries all the way round, past the four */
    var fullU = wtaStep(t, cFull, 1.6);
    if (fullU > 0) {
      out += wtaArc(WTA_HUB[0], WTA_HUB[1], WTA_R * 0.42, -90, 270, fullU, P.gold, 5);
      var reached = tally(t, cFull, 4, 1.6);
      for (var q = 0; q < reached; q++) {
        var aq = wtaRoseAng(q * 2) * Math.PI / 180, rq = WTA_R * 0.42;
        out += C(WTA_HUB[0] + rq * Math.cos(aq), WTA_HUB[1] + rq * Math.sin(aq), 8, P.gold);
      }
    }
    return svg(out);
  }
