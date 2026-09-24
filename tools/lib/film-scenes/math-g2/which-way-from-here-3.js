  /* ==== Which Way From Here, part 3 ==========================================
     tools/lib/film-scenes/math-g2/which-way-from-here-3.js: the chapters "Say
     the route" and "Over the mirror line", the recap, and KINDS. */

  /* ==== chapter: Say the route =========================================
     The lesson's own trail step: a purple trail from the star to the flag,
     read back in the lesson's own words - "two squares towards the top, then
     two squares towards the right". round6() in which-way-from-here.html
     generates each leg as rnd(1, 2) - one or two squares, never three - so
     both legs here are drawn from that same range. The walker steps ONE cell
     per count, so the number said and the number of squares crossed are the
     same thing. */
  var WW_PATH = [[0, 4], [0, 3], [0, 2], [1, 2], [2, 2]];
  var WW_LEG1 = 2;                                  /* squares towards the top */
  var WW_LEG2 = WW_PATH.length - 1 - WW_LEG1;       /* squares towards the right */
  var WW_END = WW_PATH[WW_PATH.length - 1];         /* the flag's cell */
  function wwRouteMap() { return wwMap({ cols: 5, rows: 5, cell: 54, x: 56, y: 20, w: 400, h: 400 }); }
  /* where along the path, as a number of squares walked */
  function wwWalk(m, s) {
    var a = WW_PATH[clamp(Math.floor(s), 0, WW_PATH.length - 1)];
    var b = WW_PATH[clamp(Math.ceil(s), 0, WW_PATH.length - 1)];
    var u = s - Math.floor(s);
    return [lerp(m.cx(a[0]), m.cx(b[0]), u), lerp(m.cy(a[1]), m.cy(b[1]), u)];
  }

  function wwRouteChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cRead = c(0, "read");
    var cStar = c(1, "star"), cTrail = c(1, "trail"), cFlag = c(1, "flag");
    var cUpTwo = c(2, "two");
    var cTurns = c(3, "turns"), cTwo = c(3, "two");
    var cMany = c(4, "many"), cWay = c(4, "way");
    var k = i - scene.first, m = wwRouteMap(), out = "", n;

    /* how many squares of the trail are shown, and how far the walker is */
    var show = k >= 1 ? tally(t, cTrail, WW_PATH.length - 1, 0.7) : 0;
    var walked = 0;
    if (k === 2) for (n = 0; n < WW_LEG1; n++) walked += wwStep(t, cUpTwo == null ? null : cUpTwo + n * 0.45, 0.4);
    else if (k === 3) { walked = WW_LEG1; for (n = 0; n < WW_LEG2; n++) walked += wwStep(t, cTwo == null ? null : cTwo + n * 0.5, 0.42); }
    else if (k > 3) walked = WW_PATH.length - 1;

    var trail = [];
    for (n = 1; n <= show; n++) trail.push(WW_PATH[n]);
    out += m.card(trail, "plum");
    /* "read a route somebody else walked": the whole trail, faint, at once.
       Drawn BEFORE the star and the flag, or it would cover them. */
    var rd = on(t, cRead, 0.6);
    if (rd > 0) for (n = show + 1; n < WW_PATH.length; n++)
      out += wwFill(m, WW_PATH[n][0], WW_PATH[n][1], WC.plumSoft, rd);

    /* one number in the corner of each whole square crossed - in the corner,
       so it covers neither the walker standing on it nor the flag */
    if (k >= 2) {
      var whole = Math.floor(walked + 1e-6);
      for (n = 1; n <= whole; n++) {
        var cell = WW_PATH[n], num = n <= WW_LEG1 ? n : n - WW_LEG1;
        var nx = m.x(cell[0]) + m.size * 0.23, ny = m.y(cell[1]) + m.size * 0.23;
        var nc = n <= WW_LEG1 ? WC.gold : WC.teal;
        out += C(nx, ny, m.size * 0.185, WC.card, nc, 3) +
          Tx(nx, ny + m.size * 0.08, String(num), "lab", "middle", { "font-size": m.size * 0.26, fill: nc });
      }
    }

    out += Em(m.cx(WW_PATH[0][0]), m.cy(WW_PATH[0][1]), m.size * 0.66, "⭐");
    out += Em(m.cx(WW_END[0]) + m.size * 0.15, m.cy(WW_END[1]) - m.size * 0.15, m.size * 0.62, "\u{1F6A9}");
    if (walked >= WW_PATH.length - 1) out += MK.glow(m.cx(WW_END[0]), m.cy(WW_END[1]), m.size * 1.1, P.good, 0.55 + 0.45 * breathe(t));
    out += wwRing(m, WW_PATH[0][0], WW_PATH[0][1], WC.gold, popIn(t, cStar, 0.4) * wwOnly(t, scene, 1));
    out += wwRing(m, WW_END[0], WW_END[1], WC.good, popIn(t, cFlag, 0.4) * wwOnly(t, scene, 1));

    /* the walker, on top of everything it stands on */
    if (k >= 2) {
      var at = wwWalk(m, walked);
      var facing = walked < WW_LEG1 ? 0 : 90;
      if (k === 3 && cTurns != null) facing = 90 * wwStep(t, cTurns, 0.5);
      out += wwBot(at[0], at[1], m.size * 0.3, facing, WC.accent, 1);
    }

    out += MK.pill(556, 62, "the route, in words", on(t, cRead, 0.5), { size: 26, anchor: "start", col: P.teal, ink: P.teal });
    out += MK.list(560, 158, [
      { text: "2 squares towards the top", at: cUpTwo, mark: "tick", markAt: cMany },
      { text: "2 squares towards the right", at: cTwo, mark: "tick", markAt: cWay }
    ], t, { lh: 88, cls: "lab big", markR: 18 });
    return svg(out);
  }

  /* ==== chapter: Over the mirror line ===================================
     The lesson's own reflection step: an L of three squares, a vertical
     mirror line down the middle column, and the image at the same distance on
     the other side. The image cells are computed from the shape with the
     lesson's own map, column c -> 4 - c, so the picture cannot disagree with
     "the same distance from the line, on the other side". */
  var WW_SHAPE = [[0, 1], [1, 1], [0, 2]];
  var WW_MIRROR_COL = 2;
  var WW_IMAGE = WW_SHAPE.map(function (s) { return [2 * WW_MIRROR_COL - s[0], s[1]]; });
  function wwMirrorMap() { return wwMap({ cols: 5, rows: 5, cell: 54, x: 56, y: 48, w: 396, h: 356 }); }
  /* a double-headed measure across a row, with its count above it */
  /* `nudge` slides the count away from the middle, so the two measures' labels
     - both "2 squares", both on row 1 - do not sit on top of each other. */
  function wwSpan(m, i0, i1, row, text, col, u, nudge) {
    if (!(u > 0)) return "";
    var y = m.cy(row), x0 = m.cx(i0), x1 = m.cx(i1), mid = (x0 + x1) / 2 + (nudge || 0);
    var e = lerp(x0, x1, Math.min(1, u));
    return L(x0, y, e, y, col, 5) +
      wwHead(e, y, x1 - x0, 0, col, 9) + wwHead(x0, y, x0 - x1, 0, col, 9) +
      MK.pill(mid, y - m.size * 0.62, text, Math.min(1, u), { size: 24, col: col, ink: col });
  }

  function wwMirrorChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cFlips = c(0, "flips"), cOther0 = c(0, "other");
    var cThis = c(1, "this"), cTwo = c(1, "two");
    var cLands = c(2, "lands"), cOther2 = c(2, "other");
    var cEvery = c(3, "every"), cSlide = c(3, "slide");
    var cSize = c(4, "size"), cFacing = c(4, "facing");
    var k = i - scene.first, m = wwMirrorMap(), out = "", n;

    out += m.card(WW_SHAPE, "teal");
    /* the mirror line: the middle column, and the line down its centre */
    var ml = on(t, BEATS[scene.first].start - GAP, 0.6);
    var mx = m.cx(WW_MIRROR_COL);
    out += R(m.x(WW_MIRROR_COL) + 1, m.y(0) + 1, m.size - 2, m.size * 5 - 2, 0, WC.accentSoft, null, null, { opacity: ml * 0.9 });
    out += L(mx, m.y(0) + 2, mx, m.y(0) + (m.size * 5 - 4) * ml, WC.accent, 5, { "stroke-dasharray": "13 9" });
    out += MK.pill(mx, m.oy - 24, "mirror line", ml, { size: 24, col: P.accent, ink: P.accent });

    /* the image, one cell at a time: the first on "it lands two squares away",
       the other two on "Every part flips over" */
    var first = popIn(t, cLands, 0.45), rest = popIn(t, cEvery, 0.45);
    for (n = 0; n < WW_IMAGE.length; n++)
      out += wwFill(m, WW_IMAGE[n][0], WW_IMAGE[n][1], WC.goodSoft, n === 0 ? first : rest) +
        (((n === 0 ? first : rest) > 0) ? wwRing(m, WW_IMAGE[n][0], WW_IMAGE[n][1], WC.good, n === 0 ? first : rest) : "");

    /* "A mirror line flips a shape over to the other side" */
    var fl = on(t, cFlips, 0.6) * wwOnly(t, scene, 0);
    if (fl > 0) out += wwArc(mx, m.cy(1), m.size * 1.7, 270, 270 + 180 * fl, P.gold, 6);
    var ot = on(t, cOther0, 0.5) * wwOnly(t, scene, 0);
    if (ot > 0) out += R(m.x(3), m.y(0) + 1, m.size * 2 - 2, m.size * 5 - 2, 0, "#FFFFFF", null, null, { opacity: ot * 0.14 });

    /* the two measures: from the square to the line, then from the line on */
    out += wwRing(m, WW_SHAPE[0][0], WW_SHAPE[0][1], WC.ink, popIn(t, cThis, 0.4) * wwOnly(t, scene, 1));
    out += wwSpan(m, WW_SHAPE[0][0], WW_MIRROR_COL, 1, "2 squares", P.teal, on(t, cTwo, 0.6) * wwFrom(t, scene, 1) * (1 - wwFrom(t, scene, 3)), -28);
    out += wwSpan(m, WW_MIRROR_COL, WW_IMAGE[0][0], 1, "2 squares", P.good, on(t, cLands, 0.6) * wwFrom(t, scene, 2) * (1 - wwFrom(t, scene, 3)), 28);
    var o2 = on(t, cOther2, 0.5) * wwOnly(t, scene, 2);
    if (o2 > 0) out += MK.glow(m.cx(4), m.cy(1), m.size * 1.2, P.good, o2 * (0.5 + 0.5 * breathe(t)));

    /* "The shape does not slide across" */
    var sl = on(t, cSlide, 0.6) * wwOnly(t, scene, 3);
    if (sl > 0) {
      out += MK.arrow(m.cx(0), m.cy(3), lerp(m.cx(0), m.cx(4), sl), m.cy(3), sl, P.bad, 6);
      out += MK.cross(m.cx(2), m.cy(3), 24, popIn(t, cSlide == null ? null : cSlide + 0.45, 0.35));
    }
    var ev = on(t, cEvery, 0.5) * wwOnly(t, scene, 3);
    if (ev > 0) out += MK.pill(m.cx(2), m.cy(4) + m.size * 0.1, "flipped over", ev, { size: 25, col: P.good, ink: P.good });

    /* "the same size, just facing the other way" */
    var sz = popIn(t, cSize, 0.45) * wwOnly(t, scene, 4);
    if (sz > 0) {
      out += MK.pill(m.cx(0.5), m.cy(4) - m.size * 0.1, "3 squares", Math.min(1, sz), { size: 24, col: P.teal, ink: P.teal });
      out += MK.pill(m.cx(3.5), m.cy(4) - m.size * 0.1, "3 squares", Math.min(1, sz), { size: 24, col: P.good, ink: P.good });
    }
    var fa = on(t, cFacing, 0.6) * wwOnly(t, scene, 4);
    if (fa > 0) {
      out += MK.arrow(m.cx(1) + m.size * 0.1, m.cy(2), m.cx(0) - m.size * 0.1, m.cy(2), fa, P.teal, 6);
      out += MK.arrow(m.cx(3) - m.size * 0.1, m.cy(2), m.cx(4) + m.size * 0.1, m.cy(2), fa, P.good, 6);
    }

    out += MK.list(540, 128, [
      { text: "flipped over", at: cFlips },
      { text: "the same distance", at: cTwo },
      { text: "on the other side", at: cOther2 },
      { text: "the same size", at: cSize }
    ], t, { lh: 78, cls: "lab big", markR: 16 });
    return svg(out);
  }

  /* ---- what you now know ------------------------------------------------ */
  var WW_RECAP = MK.recapKind([
    { beat: 0, at: "position", title: "Position words", sub: "above, below, between", pic: "\u{1F4CD}" },
    { beat: 1, at: "forward", title: "Forward", sub: "the way you are facing",
      pic: function (cx, cy, size) { return wwBot(cx, cy, size * 0.44, 0, WC.accent, 1); } },
    { beat: 2, at: "quarter", title: "Turns", sub: "quarter, half, whole",
      pic: function (cx, cy, size, t) { return wwArc(cx, cy, size * 0.46, 0, 90, P.plum, 6) + wwBot(cx, cy, size * 0.3, 90, WC.accent, 1); } },
    { beat: 3, at: "mirror", title: "Mirror line", sub: "same distance, other side", pic: "\u{1F98B}" }
  ], { goBeat: 3, goAt: "distance" });

  var KINDS = {
    title: MK.titleKind({ sub: ["Above, below, between", "Forward, left and right", "Turns, and the mirror line"] }),
    where: wwWhereChapter, whose: wwWhoseChapter, turns: wwTurnsChapter,
    drive: wwDriveChapter, route: wwRouteChapter, mirror: wwMirrorChapter,
    recap: WW_RECAP
  };
