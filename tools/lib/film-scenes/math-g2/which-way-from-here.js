  /* ==== Grade 2 Mathematics, Lesson 6: Which Way From Here ====================
     tools/lib/film-scenes/math-g2/which-way-from-here.js, with -2.js: the
     film's pictures, after the shared marks (MK) and before the engine's tail,
     all in one scope. The storyboard is
     mathematics/grade-2-app/lecture-video/which-way-from-here.json.

     Mathematics has no lesson kit, so the squared maps come from
     ART.grid (tools/lib/ehel-film-art-math.js) and everything that moves on
     top of one is drawn here: the robot, the flag, the star, the trail walker,
     the turn dial and the mirror line.

     ART.compass is NOT used, and the film says no cardinal point. The lesson
     deleted north, east, south and west on purpose - its own comment says
     "cardinal points are Stage 3's Gp.01, a stage above" - and its directions
     are the top, the right, the bottom and the left. A compass rose lettered
     N E S W would teach a stage the child is not in.

     DIRECTION, the one thing this film can get backwards. Everything that
     faces or turns goes through wwFace(a), where a is degrees CLOCKWISE from
     up the page: 0 up, 90 right, 180 down, 270 left, matching the lesson's own
     DIRS/ARROW order. Its forward vector is (sin a, -cos a) and the token's
     own RIGHT is (cos a, sin a), so at a = 0 the robot's right is the page's
     right and its left is the page's left - which is exactly what the "Whose
     left is it?" chapter claims. Turning right is a increasing.

     This file: the palette, the map helper, the robot, the title motif, and
     the chapters "Saying where", "Whose left is it?" and "How big is the
     turn?". Every top-level name here starts with ww. */

  var HUE = {
    title: P.teal, where: P.gold, whose: P.blue, turns: P.plum,
    drive: P.accent, route: P.teal, mirror: P.good, recap: P.teal
  };

  /* the lessons' light palette, for anything drawn on top of an ART card */
  var WC = ART.C;

  /* ---- timing ---------------------------------------------------------- */

  /* 0 -> 1 as the chapter's beat k comes in, back to 0 as beat k + 1 comes in */
  function wwOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function wwFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }
  /* how far a step that starts at `at` and lasts `span` has gone */
  function wwStep(t, at, span) { return at == null ? 0 : ease(clamp((t - at) / (span || 0.6), 0, 1)); }

  /* ---- facing ----------------------------------------------------------
     a is degrees clockwise from up the page. See the header. */
  function wwFace(a) {
    var r = a * Math.PI / 180;
    return { fx: Math.sin(r), fy: -Math.cos(r), rx: Math.cos(r), ry: Math.sin(r) };
  }
  /* the robot: a rounded arrow token, centred on (cx, cy), facing a degrees */
  function wwBot(cx, cy, r, a, col, o) {
    if (o != null && !(o > 0)) return "";
    var f = wwFace(a), c = col || WC.accent;
    function p(fwd, side) {
      return n2(cx + f.fx * fwd + f.rx * side) + "," + n2(cy + f.fy * fwd + f.ry * side);
    }
    var d = "M" + p(r, 0) + " L" + p(-r * 0.78, r * 0.82) + " L" + p(-r * 0.3, 0) + " L" + p(-r * 0.78, -r * 0.82) + " Z";
    return G(C(cx, cy, r * 1.16, WC.accentSoft) + Pth(d, c, c, 2.5), { opacity: o == null ? 1 : clamp(o, 0, 1) });
  }
  /* a point on a circle of radius rr about (cx, cy), at a degrees */
  function wwAt(cx, cy, rr, a) {
    var f = wwFace(a);
    return [cx + f.fx * rr, cy + f.fy * rr];
  }
  /* an arrowhead at (x, y) pointing along (dx, dy) */
  function wwHead(x, y, dx, dy, col, s) {
    var m = Math.hypot(dx, dy) || 1, ux = dx / m, uy = dy / m, px = -uy, py = ux;
    return Pth("M" + n2(x) + "," + n2(y) +
      " L" + n2(x - ux * s * 1.8 + px * s * 0.9) + "," + n2(y - uy * s * 1.8 + py * s * 0.9) +
      " L" + n2(x - ux * s * 1.8 - px * s * 0.9) + "," + n2(y - uy * s * 1.8 - py * s * 0.9) + " Z", col, col, 2);
  }
  /* the arc a turn sweeps, from a0 to a1 degrees, sampled so no SVG arc flag
     can silently send it the other way round */
  function wwArc(cx, cy, rr, a0, a1, col, w, dash) {
    if (Math.abs(a1 - a0) < 0.6) return "";
    var n = Math.max(2, Math.ceil(Math.abs(a1 - a0) / 4)), d = "", k, pt;
    for (k = 0; k <= n; k++) {
      pt = wwAt(cx, cy, rr, a0 + (a1 - a0) * k / n);
      d += (k ? " L" : "M") + n2(pt[0]) + "," + n2(pt[1]);
    }
    var end = wwAt(cx, cy, rr, a1), g = wwFace(a1);
    var out = Pth(d, null, col, w, dash ? { "stroke-dasharray": dash } : null);
    return out + wwHead(end[0], end[1], g.rx * (a1 >= a0 ? 1 : -1), g.ry * (a1 >= a0 ? 1 : -1), col, w * 1.5);
  }

  /* ---- the squared map -------------------------------------------------
     ART.grid's own geometry, read off tools/lib/ehel-film-art-math.page.js:
     with no coords, no numbers and no label the card is cols*cell + 44 wide
     and rows*cell + 44 high, and the cell (i, j) - i across, j DOWN from the
     top - has its top-left corner at (22 + i*cell, 22 + j*cell). The card is
     placed at its own aspect ratio, so the scale is exact and a cell's centre
     on the film can be worked out rather than guessed. */
  function wwMap(o) {
    var cols = o.cols, rows = o.rows, cell = o.cell;
    var W = cols * cell + 44, H = rows * cell + 44;
    var k = Math.min(o.w / W, o.h / H);
    var ox = o.x + (o.w - W * k) / 2, oy = o.y + (o.h - H * k) / 2;
    return {
      cols: cols, rows: rows, k: k, size: cell * k,
      W: W * k, H: H * k, ox: ox, oy: oy,
      x: function (i) { return ox + k * (22 + i * cell); },
      y: function (j) { return oy + k * (22 + j * cell); },
      cx: function (i) { return ox + k * (22 + i * cell + cell / 2); },
      cy: function (j) { return oy + k * (22 + j * cell + cell / 2); },
      card: function (fill, colour) {
        return ART.place(ART.grid({ cols: cols, rows: rows, cell: cell, fill: fill || [], colour: colour || "gold" }), ox, oy, W * k, H * k);
      }
    };
  }
  /* a ring round one cell of a map */
  function wwRing(m, i, j, col, p) {
    if (!(p > 0)) return "";
    var s = m.size, x = m.x(i), y = m.y(j);
    return G(R(x + 2, y + 2, s - 4, s - 4, 8, "none", col, 5), { transform: around(x + s / 2, y + s / 2, 0.9 + 0.1 * Math.min(p, 1)), opacity: Math.min(1, p) });
  }
  /* a filled cell drawn on top of the card (ART.grid fills one colour only) */
  function wwFill(m, i, j, col, p, extra) {
    if (!(p > 0)) return "";
    var s = m.size, x = m.x(i), y = m.y(j);
    return G(R(x + 1, y + 1, s - 2, s - 2, 0, col, null, null, extra || null),
      { transform: around(x + s / 2, y + s / 2, 0.75 + 0.25 * Math.min(p, 1)), opacity: Math.min(1, p) });
  }

  /* ---- the title motif -------------------------------------------------
     A small map with the robot at the bottom, a dashed route up and across to
     the flag: the whole lesson in one picture. On the two cards it stands
     still; in the spoken title chapter the route draws itself. */
  function titleMotif(o) {
    var t = o.t || 0, out = "", g0 = 34, cell = 97, i, j;
    function gx(i2) { return g0 + i2 * cell; }
    function gy(j2) { return g0 + j2 * cell; }
    var cWhere = o.scene ? sc(o.scene, 0, "where") : null;
    var cWhich = o.scene ? sc(o.scene, 0, "which") : null;
    var cSay = o.scene ? sc(o.scene, 1, "say") : null;
    var cGive = o.scene ? sc(o.scene, 1, "give") : null;
    var still = !o.scene;
    var appear = still ? 1 : on(t, cWhere, 0.6);
    var draw = still ? 1 : on(t, cWhich, 0.9);
    /* "say where things are": the flag takes its place on the map */
    var place = still ? 1 : Math.max(on(t, cWhich, 0.9), popIn(t, cSay, 0.45));
    var walk = still ? 1 : on(t, cGive, 0.9);

    out += R(g0 - 12, g0 - 12, cell * 3 + 24, cell * 3 + 24, 18, "#123247", P.line, 3);
    for (i = 0; i < 3; i++) for (j = 0; j < 3; j++)
      out += R(gx(i), gy(j), cell, cell, 0, "#17384F", "#2B5B77", 2, { opacity: appear });
    /* the route: two squares up the left column, then two to the right */
    var sx = gx(0) + cell / 2, sy = gy(2) + cell / 2, mx = gx(0) + cell / 2, my = gy(0) + cell / 2;
    var ex = gx(2) + cell / 2;
    var legA = clamp(draw * 2, 0, 1), legB = clamp(draw * 2 - 1, 0, 1);
    out += L(sx, sy, sx, lerp(sy, my, legA), P.gold, 7, { "stroke-dasharray": "14 11", opacity: appear });
    if (legB > 0) out += L(mx, my, lerp(mx, ex, legB), my, P.gold, 7, { "stroke-dasharray": "14 11" });
    out += MK.pop(Em(ex + 22, my - 20, 62, "\u{1F6A9}"), ex, my, place);
    if (!still && cSay != null) out += C(ex + 22, my - 20, 52, "none", P.gold, 5, { opacity: bump(t, cSay, 1.1) });
    /* the robot walks the route as the directions are given */
    var wu = clamp(walk * 2, 0, 1), wv = clamp(walk * 2 - 1, 0, 1);
    var bx = wv > 0 ? lerp(mx, ex, wv) : sx, by = wv > 0 ? my : lerp(sy, my, wu);
    out += wwBot(bx, by, 34, wv > 0 ? 90 : 0, WC.accent, appear);
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A squared map: a robot, a route of two squares up and two across, and a flag">' + out + "</svg>";
  }

  /* ==== chapter: Saying where ==========================================
     The lesson's own nine things (its SCENE list) in three rows of three, on
     a plain card and NOT on a ruled grid - the line is "before any grid, you
     can say where something is in words". Each thing named is ringed as it is
     said, and the word used joins a list on the right. */
  var WW_SCENE = [
    ["⭐", "\u{1F333}", "\u{1F3E0}"],
    ["\u{1F41F}", "⛵", "\u{1F98B}"],
    ["\u{1F947}", "\u{1F335}", "\u{1F41D}"]
  ];
  var WW_CARD = { x: 34, y: 24, w: 396, h: 396 };
  function wwSceneCX(i) { return WW_CARD.x + WW_CARD.w / 6 + i * WW_CARD.w / 3; }
  function wwSceneCY(j) { return WW_CARD.y + WW_CARD.h / 6 + j * WW_CARD.h / 3; }
  function wwSceneRing(i, j, col, p) {
    if (!(p > 0)) return "";
    var cx = wwSceneCX(i), cy = wwSceneCY(j), r = 62;
    return G(C(cx, cy, r, "none", col, 5), { transform: around(cx, cy, 0.86 + 0.14 * Math.min(p, 1)), opacity: Math.min(1, p) });
  }

  function wwWhereChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cGrid = c(0, "grid"), cWords = c(0, "words");
    var cAbove = c(1, "above"), cBelow = c(1, "below");
    var cBetween = c(2, "between"), cSide = c(2, "side");
    var cStar = c(3, "star"), cCorner = c(3, "corner");
    var out = "", r, q;

    out += R(WW_CARD.x, WW_CARD.y, WW_CARD.w, WW_CARD.h, 24, WC.card, WC.line, 2);
    for (r = 0; r < 3; r++) for (q = 0; q < 3; q++)
      out += Em(wwSceneCX(q), wwSceneCY(r), 78, WW_SCENE[r][q],
        { opacity: clamp(popIn(t, cGrid == null ? null : cGrid + (r * 3 + q) * 0.07, 0.4), 0, 1) });

    /* Each beat's marks belong to that beat and are cleared by the next
       (rule 7): a ring left over from "above the boat" would still be on the
       tree while the film talks about the star. */
    var b1 = wwOnly(t, scene, 1), b2 = wwOnly(t, scene, 2), b3 = wwOnly(t, scene, 3);
    /* the tree above the boat, then the medal below the fish */
    var ab = popIn(t, cAbove, 0.4) * b1, be = popIn(t, cBelow, 0.4) * b1;
    if (ab > 0) {
      out += wwSceneRing(1, 0, WC.accent, ab * (1 - Math.min(1, be)));
      out += MK.arrow(wwSceneCX(1) + 50, wwSceneCY(1) - 28, wwSceneCX(1) + 50, wwSceneCY(0) + 30, on(t, cAbove, 0.5) * b1 * (1 - Math.min(1, be)), P.gold, 8);
    }
    if (be > 0) {
      out += wwSceneRing(0, 2, WC.teal, be);
      out += MK.arrow(wwSceneCX(0) + 50, wwSceneCY(1) + 28, wwSceneCX(0) + 50, wwSceneCY(2) - 30, on(t, cBelow, 0.5) * b1, P.teal, 8);
    }
    /* the boat between the fish and the butterfly */
    var bt = popIn(t, cBetween, 0.4) * b2, sd = on(t, cSide, 0.5) * b2;
    if (bt > 0) {
      out += wwSceneRing(1, 1, WC.plum, bt);
      out += wwSceneRing(0, 1, WC.muted, bt * 0.8) + wwSceneRing(2, 1, WC.muted, bt * 0.8);
    }
    if (sd > 0) {
      out += MK.arrow(wwSceneCX(0) + 30, wwSceneCY(1), wwSceneCX(1) - 34, wwSceneCY(1), sd, P.plum, 7);
      out += MK.arrow(wwSceneCX(2) - 30, wwSceneCY(1), wwSceneCX(1) + 34, wwSceneCY(1), sd, P.plum, 7);
    }
    /* the star, in the top left corner */
    var st = popIn(t, cStar, 0.4) * b3, co = on(t, cCorner, 0.5) * b3;
    if (st > 0) out += wwSceneRing(0, 0, WC.gold, st);
    if (co > 0) {
      var x0 = WW_CARD.x + 12, y0 = WW_CARD.y + 12, len = 78 * co;
      out += L(x0, y0, x0 + len, y0, P.gold, 8) + L(x0, y0, x0, y0 + len, P.gold, 8);
    }

    /* the words, as they are used */
    out += MK.pill(556, 66, "Position words", on(t, cWords, 0.45), { size: 27, anchor: "start", col: P.gold, ink: P.gold });
    out += MK.list(560, 150, [
      { text: "above the boat", at: cAbove },
      { text: "below the fish", at: cBelow },
      { text: "between them", at: cBetween },
      { text: "the top left corner", at: cCorner }
    ], t, { lh: 72, cls: "lab big", markR: 15 });
    return svg(out);
  }

  /* ==== chapter: Whose left is it? =====================================
     One robot on a card. Facing up the page its left is the page's left;
     facing down, its left is the page's right, and the two labels swap sides
     as that is said. wwFace does the arithmetic, so the labels cannot drift
     from the way the token points. */
  var WW_BOT = { cx: 470, cy: 224, r: 74 };
  function wwSideLabel(a, side, text, col, o) {
    if (!(o > 0)) return "";
    var f = wwFace(a), d = side === "left" ? -1 : 1;
    var x = WW_BOT.cx + f.rx * d * 172, y = WW_BOT.cy + f.ry * d * 172;
    return MK.leader(WW_BOT.cx + f.rx * d * 100, WW_BOT.cy + f.ry * d * 100, x - f.rx * d * 44, y - f.ry * d * 44, Math.min(1, o), col) +
      MK.pill(x, y, text, Math.min(1, o), { size: 30, col: col, ink: col });
  }

  function wwWhoseChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cDepend = c(0, "depend");
    var cTop = c(1, "top"), cLeft = c(1, "left");
    var cBottom = c(2, "bottom"), cRight = c(2, "right");
    var cTurn = c(3, "turn"), cPage = c(3, "page");
    var k = i - scene.first, out = "";

    /* the turn from facing up to facing down happens on "faces the bottom" */
    var flip = k >= 2 ? wwStep(t, cBottom, 0.75) : 0;
    var ang = 180 * flip;

    out += R(168, 34, 604, 376, 26, WC.card, WC.line, 2);
    /* the page's own sides, named once and never moving */
    out += Tx(196, 72, "the page", "lab mid muted", "start");
    out += L(186, 92, 186, 392, WC.line, 4, { "stroke-dasharray": "10 8" });
    out += L(754, 92, 754, 392, WC.line, 4, { "stroke-dasharray": "10 8" });
    out += Tx(196, 396, "left of the page", "lab mid muted", "start");
    out += Tx(744, 396, "right of the page", "lab mid muted", "end");

    out += wwBot(WW_BOT.cx, WW_BOT.cy, WW_BOT.r, ang, WC.accent, 1);

    /* "Left and right depend on the way you are facing." */
    var dp = on(t, cDepend, 0.6) * wwOnly(t, scene, 0);
    if (dp > 0) out += MK.glow(WW_BOT.cx, WW_BOT.cy, 150, P.gold, dp * (0.6 + 0.4 * breathe(t)));

    /* the two labels, on the ROBOT's sides, worked out from the way it faces */
    var lab = k >= 1 ? Math.max(on(t, cLeft, 0.5), flip) : 0;
    out += wwSideLabel(ang, "left", "its left", P.gold, lab);
    out += wwSideLabel(ang, "right", "its right", P.muted, lab * 0.85);

    if (k === 1 && on(t, cTop, 0.5) > 0)
      out += MK.pill(470, 68, "facing the top", on(t, cTop, 0.5), { size: 26, col: P.gold, ink: P.gold });
    if (k >= 2 && on(t, cBottom, 0.5) > 0)
      out += MK.pill(470, 68, "facing the bottom", on(t, cBottom, 0.5) * (k === 2 ? 1 : 0.85), { size: 26, col: P.gold, ink: P.gold });
    /* "Its left is over on your right": say so where the label has landed */
    var rt = on(t, cRight, 0.5) * wwOnly(t, scene, 2);
    if (rt > 0) out += MK.pill(880, 224, "your right", rt, { size: 28, col: P.good, ink: P.good });

    /* "turn with the robot, and never with the page" */
    var tn = popIn(t, cTurn, 0.4) * wwOnly(t, scene, 3);
    var pg = popIn(t, cPage, 0.4) * wwOnly(t, scene, 3);
    if (tn > 0) out += MK.tick(940, 150, 34, tn) + MK.pill(940, 216, "the robot", Math.min(1, tn), { size: 26, col: P.good, ink: P.good });
    if (pg > 0) out += MK.cross(940, 290, 34, pg) + MK.pill(940, 356, "the page", Math.min(1, pg), { size: 26, col: P.bad, ink: P.bad });
    return svg(out);
  }
