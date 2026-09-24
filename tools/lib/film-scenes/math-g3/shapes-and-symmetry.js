  /* ==== Grade 3 Mathematics, Lesson 5: Shapes and Symmetry ====================
     tools/lib/film-scenes/math-g3/shapes-and-symmetry.js, with -2.js and -3.js:
     the film's pictures, after the shared marks (MK) and before the engine's
     tail, all in one scope. The storyboard is
     mathematics/grade-3-app/lecture-video/shapes-and-symmetry.json.

     Mathematics has no lesson kit, so the drawings come from ART
     (tools/lib/ehel-film-art-math.js): ART.shape2d for the named flat shapes,
     ART.symmetry for the mirror lines and the fold, ART.grid for the
     reflection and for the area, ART.solid for the cube. Four pictures the
     library does not carry are drawn here in ART's own light palette
     (ART.C) so they sit beside it: an IRREGULAR pentagon, a square standing
     on its corner, a parallelogram with a fold that does not work, and a
     rectangle with its sides labelled in centimetres.

     EVERY MIRROR LINE IN THIS FILM REFLECTS. The square's four, the
     rectangle's two and the fold of beat two are ART.symmetry's, whose SYM
     table is the shape's real lines; the grid reflection is c -> 7 - c about
     the line between columns 3 and 4, which is the exact mirror; and the
     parallelogram is the one case drawn to FAIL, its mirror image drawn
     dashed so a child can see it land off the shape. Measured, not eyed:
     the squashed pentagon's five sides are 96.5, 68.0, 110.5, 68.0 and 96.5,
     so it is genuinely irregular, and the cube's three hidden edges are
     indices 5, 6 and 10 under the library's own fixed projection.

     This file: the palette, the shared small drawings, the title motif and
     the chapter "Naming flat shapes". Every top-level name here starts with
     ss, so nothing can replace a name of the engine, ART or MK. */

  var HUE = {
    title: P.teal, naming: P.blue, regular: P.plum, symmetry: P.gold,
    mirror: P.accent, solids: P.good, roundabout: P.teal, recap: P.teal
  };

  /* ---- timing ---------------------------------------------------------------- */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 comes
     in: for a thing that belongs to that beat alone */
  function ssOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function ssFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }

  /* ---- placing one of ART's drawings, so its own coordinates can be found ------
     A drawing is a card of cardW x cardH with its own viewBox, and ART.place
     nests it. The nested svg keeps its aspect ratio, so the box MUST have the
     card's aspect or the drawing is letterboxed and every coordinate worked
     out here is wrong. ssBox builds a box of exactly that aspect, h tall and
     centred on (cx, cy), and hands back fx/fy: a point in the card's own
     coordinates, in the film's 1168 x 440 space. */
  function ssBox(cardW, cardH, cx, cy, h) {
    var k = h / cardH, w = cardW * k, x = cx - w / 2, y = cy - h / 2;
    return {
      x: x, y: y, w: w, h: h, k: k,
      fx: function (u) { return x + u * k; },
      fy: function (v) { return y + v * k; }
    };
  }
  function ssPut(markup, b, extra) { return ART.place(markup, b.x, b.y, b.w, b.h, extra); }

  /* ---- drawings of the film's own, in ART's light palette ---------------------- */

  /* the white card ART draws round every one of its pictures, in film space */
  function ssCard(x, y, w, h) { return R(x, y, w, h, 20, ART.C.card, ART.C.line, 2); }
  /* dark text, for a word sitting on one of those white cards */
  function ssInk(x, y, s, cls, anchor, col) {
    return Tx(x, y, s, cls || "lab big", anchor || "middle", { fill: col || ART.C.ink });
  }

  /* A polygon given as offsets from (cx, cy), drawn the way ART.shape2d draws
     one. opt: {scale, fill, stroke, sw, sides (number the sides), corners (dot
     them), equal (a hatch at each side's middle), opacity}. */
  function ssPoly(cx, cy, pts, opt) {
    opt = opt || {};
    var s = opt.scale == null ? 1 : opt.scale, i, j, d = "", out = "";
    var pt = pts.map(function (p) { return [cx + p[0] * s, cy + p[1] * s]; });
    for (i = 0; i < pt.length; i++) d += (i ? " L" : "M") + n2(pt[i][0]) + "," + n2(pt[i][1]);
    out += Pth(d + " Z", opt.fill || ART.C.tealSoft, opt.stroke || ART.C.teal, opt.sw || 3.5);
    for (i = 0; i < pt.length; i++) {
      j = (i + 1) % pt.length;
      var mx = (pt[i][0] + pt[j][0]) / 2, my = (pt[i][1] + pt[j][1]) / 2;
      var ux = pt[j][0] - pt[i][0], uy = pt[j][1] - pt[i][1], ul = Math.hypot(ux, uy) || 1;
      /* the hatch that says "this side is the same length as that one" */
      if (opt.equal > 0) out += L(mx - (uy / ul) * 9, my + (ux / ul) * 9, mx + (uy / ul) * 9, my - (ux / ul) * 9,
        ART.C.accent, 3.5, { opacity: clamp(opt.equal, 0, 1) });
      if (opt.sides > 0) {
        var ox = mx - cx, oy = my - cy, ol = Math.hypot(ox, oy) || 1;
        var bx = mx + (ox / ol) * 24, by = my + (oy / ol) * 24;
        out += G(C(bx, by, 15, ART.C.card, ART.C.accent, 2.5) +
          ssInk(bx, by + 6, String(i + 1), "lab", "middle", ART.C.accent), { opacity: clamp(opt.sides, 0, 1) });
      }
    }
    if (opt.corners > 0) for (i = 0; i < pt.length; i++)
      out += C(pt[i][0], pt[i][1], 8, ART.C.plum, ART.C.card, 2.5, { opacity: clamp(opt.corners, 0, 1) });
    return opt.opacity == null ? out : G(out, { opacity: clamp(opt.opacity, 0, 1) });
  }

  /* the fraction of the way round a closed list of points, as a path: the
     "walk right round the outside" of a perimeter */
  function ssTrace(pt, u, col, w) {
    if (!(u > 0)) return "";
    var loop = pt.concat([pt[0]]), total = polyLen(loop), want = total * clamp(u, 0, 1);
    var d = "M" + n2(loop[0][0]) + "," + n2(loop[0][1]), gone = 0, i;
    for (i = 1; i < loop.length; i++) {
      var seg = Math.hypot(loop[i][0] - loop[i - 1][0], loop[i][1] - loop[i - 1][1]);
      if (gone + seg <= want) { d += " L" + n2(loop[i][0]) + "," + n2(loop[i][1]); gone += seg; continue; }
      var q = polyAt(loop, want);
      d += " L" + n2(q[0]) + "," + n2(q[1]);
      break;
    }
    return Pth(d, null, col || ART.C.accent, w || 7, { opacity: 0.95 });
  }

  /* a square standing on its corner: the lesson's own point, that turning a
     shape does not rename it. deg is how far it has turned. */
  function ssTiltedSquare(cx, cy, half, deg, o) {
    if (!(o > 0)) return "";
    var pts = [[-half, -half], [half, -half], [half, half], [-half, half]];
    return G(ssPoly(cx, cy, pts, { corners: 1 }), {
      transform: "rotate(" + n2(deg) + " " + n2(cx) + " " + n2(cy) + ")", opacity: clamp(o, 0, 1)
    });
  }

  /* fixed shapes, never generated: three irregular polygons for "most shapes
     around you are irregular" */
  var SS_WILD = [
    [[-40, -26], [46, -34], [36, 30], [-30, 22]],
    [[-8, -36], [44, 26], [-42, 18]],
    [[-38, -12], [-14, -36], [30, -30], [42, 4], [16, 34], [-26, 26]]
  ];

  /* ==== the title ==============================================================
     A square in a round window with its four lines of symmetry. In the spoken
     title chapter the square arrives on "a name", its four sides are numbered
     on "the sides", the first mirror line draws on "fold in half", the other
     three on "flip over a mirror", and a gold stroke walks right round the
     edge on "round the edge". On the two cards it simply stands, with all
     four lines drawn. */
  var SS_M = { cx: 180, cy: 180, r: 172, half: 96 };
  var SS_LINES = [[0, -1], [1, 0], [0.7071, -0.7071], [0.7071, 0.7071]];
  function titleMotif(o) {
    var t = o.t || 0, sn = o.scene, out = "", i;
    var cx = SS_M.cx, cy = SS_M.cy, a = SS_M.half;
    var cName = sn ? sc(sn, 0, "name") : null, cSides = sn ? sc(sn, 0, "sides") : null;
    var cFold = sn ? sc(sn, 1, "fold") : null, cFlip = sn ? sc(sn, 1, "flip") : null,
      cRound = sn ? sc(sn, 1, "round") : null;
    var sq = [[-a, -a], [a, -a], [a, a], [-a, a]];
    var pt = sq.map(function (p) { return [cx + p[0], cy + p[1]]; });

    out += C(cx, cy, SS_M.r, "#123247");
    var born = sn ? popIn(t, cName, 0.5) : 1;
    if (born <= 0) return '<svg viewBox="0 0 360 360" role="img" aria-label="A square with its four lines of symmetry">' + out + C(cx, cy, SS_M.r, "none", P.line, 3) + "</svg>";

    out += G(Pth("M" + pt.map(function (p) { return n2(p[0]) + "," + n2(p[1]); }).join(" L") + " Z",
      "rgba(53,191,178,0.20)", P.teal, 5), { transform: around(cx, cy, Math.min(born, 1.1)) });

    /* the four sides, numbered, for "the sides tell you which" */
    var sd = sn ? on(t, cSides, 0.45) * (1 - (cFold == null ? 0 : on(t, cFold - 0.2, 0.4))) : 0;
    if (sd > 0) for (i = 0; i < 4; i++) {
      var j = (i + 1) % 4, mx = (pt[i][0] + pt[j][0]) / 2, my = (pt[i][1] + pt[j][1]) / 2;
      var ox = mx - cx, oy = my - cy, ol = Math.hypot(ox, oy) || 1;
      var bx = mx + (ox / ol) * 26, by = my + (oy / ol) * 26;
      out += G(C(bx, by, 18, P.card, P.gold, 3) + Tx(bx, by + 8, String(i + 1), "lab", "middle", { fill: P.gold }),
        { opacity: sd });
    }

    /* the mirror lines: the first on "fold in half", the rest on "flip" */
    var shown = !sn ? 4 : (cFold != null && t >= cFold ? (cFlip != null && t >= cFlip ? tally(t, cFlip, 4, 0.9) : 1) : 0);
    if (shown < 1 && !sn) shown = 4;
    for (i = 0; i < shown; i++) {
      var u = SS_LINES[i], ext = i < 2 ? 124 : 140;
      var gw = !sn ? 1 : on(t, i === 0 ? cFold : cFlip == null ? null : cFlip + (i - 1) * 0.3, 0.4);
      out += L(cx - u[0] * ext, cy - u[1] * ext, cx + u[0] * ext, cy + u[1] * ext, P.gold, 4,
        { "stroke-dasharray": "12 8", opacity: Math.min(1, gw) });
    }
    for (i = 0; i < 4; i++) out += C(pt[i][0], pt[i][1], 8, P.plum, "#123247", 2.5, { opacity: born });

    /* the walk right round the edge */
    if (sn && cRound != null) out += ssTrace(pt, ease((t - cRound) / 1.1), P.accent, 8);
    out += C(cx, cy, SS_M.r, "none", P.line, 3);
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A square with its four lines of symmetry">' + out + "</svg>";
  }

  /* ==== chapter: naming flat shapes ==========================================
     Four of ART's own flat shapes in a row - triangle, square, pentagon,
     hexagon - each lighting as it is named, with its sides numbered and its
     corners dotted so the count said is the count on screen. The last beat
     is the lesson's own point: a square standing on its corner is still a
     square. */
  var SS_NAME = [
    { kind: "triangle", n: 3 }, { kind: "square", n: 4 },
    { kind: "pentagon", n: 5 }, { kind: "hexagon", n: 6 }
  ];
  var SS_NAME_W = 251.1, SS_NAME_H = 262, SS_NAME_Y = 230;
  function ssNameBox(i) {
    return ssBox(276, 288, 51.8 + SS_NAME_W / 2 + i * (SS_NAME_W + 20), SS_NAME_Y, SS_NAME_H);
  }

  function ssNamingChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cSides = c(0, "sides");
    var cThree = c(1, "three"), cCorners = c(1, "corners"), cTri = c(1, "tri");
    var cFour = c(2, "four"), cQuad = c(2, "quad"), cSquare = c(2, "square");
    var cPent = c(3, "pent"), cHex = c(3, "hex");
    var cStand = c(4, "stand"), cStill = c(4, "still");
    var lit = [Math.max(on(t, cThree, 0.4), on(t, cTri, 0.4)), Math.max(on(t, cFour, 0.4), on(t, cSquare, 0.4)),
      on(t, cPent, 0.4), on(t, cHex, 0.4)];
    var marks = [on(t, cThree, 0.4), on(t, cFour, 0.4), on(t, cPent, 0.4), on(t, cHex, 0.4)];
    var dots = [on(t, cCorners, 0.4), on(t, cFour, 0.4), on(t, cPent, 0.4), on(t, cHex, 0.4)];
    var row = 1 - into(t, scene.first + 4), out = "";

    if (row > 0) {
      /* The four shapes come in with the chapter itself. Waiting for the cue
         "how many straight sides" left the stage empty for the first second
         and a half of the film's first teaching chapter; the cue rings all
         four instead, which is what those words are about. */
      var inner = "", base = BEATS[scene.first].start;
      for (var k = 0; k < 4; k++) {
        var b = ssNameBox(k), born = popIn(t, base + 0.1 + k * 0.16, 0.4);
        if (born <= 0) continue;
        var card = ART.shape2d(SS_NAME[k].kind, {
          label: true, sides: marks[k] > 0.5, corners: dots[k] > 0.5,
          fill: lit[k] > 0.5 ? ART.C.tealSoft : "#EEF3F1", colour: lit[k] > 0.5 ? ART.C.teal : ART.C.muted
        });
        inner += G(ssPut(card, b), { opacity: (0.34 + 0.66 * Math.min(1, lit[k])) * Math.min(1, born),
          transform: around(b.x + b.w / 2, b.y + b.h / 2, 0.96 + 0.04 * Math.min(1, born)) });
        inner += R(b.x, b.y, b.w, b.h, 20, "none", P.gold, 4, { opacity: bump(t, cSides, 1.2) });
        /* the count said, beside the shape it belongs to */
        if (marks[k] > 0) inner += MK.pill(b.x + b.w / 2, b.y - 26, SS_NAME[k].n + " sides", marks[k],
          { size: 22, col: P.gold });
      }
      /* "a quadrilateral": the family name above the square */
      var qb = ssNameBox(1);
      inner += MK.pill(qb.x + qb.w / 2, qb.y - 74, "quadrilateral", on(t, cQuad, 0.45), { size: 26, col: P.teal });
      out += G(inner, { opacity: row });
    }

    /* the square, stood on its corner, still a square */
    var turn = into(t, scene.first + 4);
    if (turn > 0) {
      var tx = 584, ty = 224, deg = 45 * ease(cStand == null ? 0 : (t - cStand) / 0.9);
      var inner2 = ssCard(tx - 165, ty - 165, 330, 330);
      inner2 += ssTiltedSquare(tx, ty, 88, deg, 1);
      inner2 += ssInk(tx, ty + 148, "square", "lab big", "middle", ART.C.muted);
      out += G(inner2, { opacity: turn });
      out += MK.pill(tx, 60, "still a square", on(t, cStill, 0.45), { size: 30, col: P.gold });
      out += MK.tick(tx + 210, 224, 30, popIn(t, cStill == null ? null : cStill + 0.3, 0.4));
      out += MK.cross(tx - 210, 224, 30, popIn(t, cStill == null ? null : cStill + 0.6, 0.4));
      out += MK.pill(tx - 210, 300, "diamond", on(t, cStill == null ? null : cStill + 0.6, 0.4),
        { size: 22, col: P.bad, ink: P.bad });
    }
    return svg(out);
  }
