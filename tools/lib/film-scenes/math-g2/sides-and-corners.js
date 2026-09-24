  /* ==== Grade 2 Mathematics, Lesson 5: Sides and Corners ======================
     tools/lib/film-scenes/math-g2/sides-and-corners.js, with -2.js and -3.js:
     the film's pictures, after the shared marks (MK) and before the engine's
     tail, all in one scope. The storyboard is
     mathematics/grade-2-app/lecture-video/sides-and-corners.json.

     Mathematics has no lesson kit, so the drawings come from ART
     (tools/lib/ehel-film-art-math.page.js): ART.shape2d for the named flat
     shapes, ART.solid for the cube, the cylinder and the sphere, ART.symmetry
     for the fold lines and ART.clock for "the way the hands of a clock go".
     Two things ART does not do are drawn here and listed in the report: a flat
     shape whose sides and corners are counted ONE AT A TIME (ART.shape2d marks
     them all at once, which is the wrong picture for a counting lesson), and a
     turning dial.

     EVERY COUNT IS STRUCTURAL. sacPoly(n, ...) builds a polygon from n, and
     the number said is read back from pts.length, so the picture cannot show
     four sides while the voice says five.

     This file: the palette, the shared shape drawing, the title motif and the
     chapter "Sides and corners". Every top-level name here starts with sac, so
     nothing can replace a name of the engine, ART or MK. */

  var HUE = {
    title: P.teal, count: P.gold, name: P.blue, solid: P.plum,
    fold: P.good, turn: P.accent, spin: P.gold, recap: P.teal
  };

  /* the lessons' light palette, for the shapes drawn here, so they match the
     ones ART draws in the other chapters */
  var SC = ART.C;

  /* ---- timing ---------------------------------------------------------- */

  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function sacFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }

  /* the last of the named cues in this beat that has been reached, counted
     from 1; 0 before any of them. The counting beats say "one, two, three",
     so the number on screen is exactly the number last spoken. */
  function sacSpoken(t, scene, k, names) {
    var n = 0;
    for (var j = 0; j < names.length; j++) {
      var at = sc(scene, k, names[j]);
      if (at != null && t >= at) n = j + 1;
    }
    return n;
  }
  var SAC_123 = ["one", "two", "three"];

  /* ---- the shapes, drawn here so they can be counted one at a time ------ */

  /* n vertices on a circle of radius r, the first at rot degrees. The count of
     sides and the count of corners are both pts.length, which is n. */
  function sacPoly(n, r, rot) {
    var pts = [], i, a;
    for (i = 0; i < n; i++) {
      a = (rot + (360 / n) * i) * Math.PI / 180;
      pts.push([r * Math.cos(a), r * Math.sin(a)]);
    }
    return pts;
  }
  function sacD(cx, cy, pts) {
    var d = "", i;
    for (i = 0; i < pts.length; i++) d += (i ? " L" : "M") + n2(cx + pts[i][0]) + "," + n2(cy + pts[i][1]);
    return d + " Z";
  }
  /* the filled shape */
  function sacFace(cx, cy, pts, o) {
    if (!(o > 0)) return "";
    return Pth(sacD(cx, cy, pts), SC.tealSoft, SC.teal, 4, { opacity: clamp(o, 0, 1) });
  }
  /* side i, drawn thick in the accent: the one being counted */
  function sacSideLit(cx, cy, pts, i, o) {
    if (!(o > 0)) return "";
    var j = (i + 1) % pts.length;
    return L(cx + pts[i][0], cy + pts[i][1], cx + pts[j][0], cy + pts[j][1], SC.accent, 9, { opacity: clamp(o, 0, 1) });
  }
  /* where side i's number sits: its middle, pushed out of the shape */
  function sacSideAt(cx, cy, pts, i, out) {
    var j = (i + 1) % pts.length;
    var mx = cx + (pts[i][0] + pts[j][0]) / 2, my = cy + (pts[i][1] + pts[j][1]) / 2;
    var ln = Math.hypot(mx - cx, my - cy) || 1;
    return [mx + ((mx - cx) / ln) * out, my + ((my - cy) / ln) * out];
  }
  /* side i's number, popped in */
  function sacSideNum(cx, cy, pts, i, p, r, out) {
    if (!(p > 0)) return "";
    var q = sacSideAt(cx, cy, pts, i, out == null ? 34 : out);
    r = r || 23;
    return MK.pop(C(q[0], q[1], r, SC.card, SC.accent, 3) +
      Tx(q[0], q[1] + r * 0.36, String(i + 1), "lab big", "middle", { fill: SC.accent, "font-size": r * 1.15 }),
      q[0], q[1], p);
  }
  /* corner i's dot */
  function sacCornerDot(cx, cy, pts, i, p, r) {
    if (!(p > 0)) return "";
    r = r || 15;
    return MK.pop(C(cx + pts[i][0], cy + pts[i][1], r, SC.plum, SC.card, 3.5), cx + pts[i][0], cy + pts[i][1], p);
  }

  /* a light card for a shape drawn here, so it sits on the dark stage the way
     ART's own drawings do */
  function sacCard(x, y, w, h, o) {
    if (!(o > 0)) return "";
    return R(x, y, w, h, 22, SC.card, SC.line, 2, { opacity: clamp(o, 0, 1) });
  }

  /* a dark tile with a word and a number: the running count beside the shape */
  function sacTile(x, y, w, h, word, value, col, o, lit) {
    if (!(o > 0)) return "";
    return G(R(x, y, w, h, 20, P.card, lit ? col : P.line, lit ? 3 : 2) +
      Tx(x + 26, y + h / 2 + 9, word, "lab big muted", "start") +
      Tx(x + w - 30, y + h / 2 + 16, String(value), "lab huge", "end", { fill: col, "font-size": h * 0.52 }),
      { opacity: clamp(o, 0, 1) });
  }

  /* ==== the title motif ==========================================================
     A pentagon, the shape the counting chapter ends on: its five sides number
     themselves on "sides", its five corners dot themselves on "corners", and
     on the second line three badges say what else the lesson holds - a cube
     for faces and edges, a fold line, and a quarter turn. On the two cards it
     simply stands, fully marked. */
  var SAC_MOTIF = sacPoly(5, 84, -90);
  function titleMotif(o) {
    var t = o.t || 0, sn = o.scene, out = "";
    var cx = 180, cy = 148;
    var full = !sn;
    var sidesAt = sn ? sc(sn, 0, "sides") : null, cornAt = sn ? sc(sn, 0, "corners") : null;
    var nameAt = sn ? sc(sn, 0, "name") : null;
    var faceAt = sn ? sc(sn, 1, "faces") : null, foldAt = sn ? sc(sn, 1, "fold") : null,
      turnAt = sn ? sc(sn, 1, "turn") : null;

    out += C(180, 180, 172, "#123247");
    out += MK.glow(cx, cy, 142, P.gold, full ? 0.7 : on(t, nameAt, 0.6) * (0.65 + 0.35 * breathe(t)));

    var sides = full ? 5 : tally(t, sidesAt, 5, 1.1);
    var corners = full ? 5 : tally(t, cornAt, 5, 1.0);
    out += sacFace(cx, cy, SAC_MOTIF, 1);
    for (var i = 0; i < 5; i++) {
      if (i < sides) out += sacSideLit(cx, cy, SAC_MOTIF, i, 0.9) +
        sacSideNum(cx, cy, SAC_MOTIF, i, 1, 16, 24);
      if (i < corners) out += sacCornerDot(cx, cy, SAC_MOTIF, i, 1, 11);
    }

    /* the three badges: a cube, a fold line and a quarter turn */
    var by = 296, bg = function (x, p, inner) {
      return p > 0 ? MK.pop(C(x, by, 28, "#16384E", P.line, 2) + inner, x, by, p) : "";
    };
    out += bg(104, full ? 1 : popIn(t, faceAt, 0.4), Em(104, by + 1, 32, "\u{1F3B2}"));
    out += bg(180, full ? 1 : popIn(t, foldAt, 0.4),
      R(165, by - 14, 30, 28, 3, "rgba(53,191,178,0.35)", P.teal, 2) +
      L(180, by - 20, 180, by + 20, P.accent, 3, { "stroke-dasharray": "6 5" }));
    out += bg(256, full ? 1 : popIn(t, turnAt, 0.4),
      Pth("M256," + n2(by - 16) + " A16,16 0 0,1 " + n2(256 + 16) + "," + n2(by), null, P.gold, 3) +
      C(256, by, 4, P.gold) + MK.arrow(256 + 16, by - 4, 256 + 16, by + 6, 1, P.gold, 3));

    out += C(180, 180, 172, "none", P.line, 3);
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A pentagon with its five sides numbered and its five corners marked">' + out + "</svg>";
  }

  /* ==== chapter: sides and corners ================================================
     A triangle for the first four beats, then a pentagon. The sides light and
     number themselves on the words "one, two, three" - the numbers the voice
     actually says - and the corners the same way on the next beat. Two tiles
     on the right hold the running count, and both read back from the shape:
     3 for a triangle built from 3 vertices, 5 for a pentagon built from 5. */
  var SAC_TRI = sacPoly(3, 138, -90);
  var SAC_PENT = sacPoly(5, 132, -90);
  var SAC_CX = 330, SAC_CY = 222;

  /* a curved arrow going once round the shape: "go round in order" */
  function sacGoRound(t, at, cx, cy, r) {
    var u = on(t, at, 1.0);
    if (!(u > 0)) return "";
    var a0 = -Math.PI / 2, a1 = a0 + 2 * Math.PI * 0.94 * clamp(u, 0, 1);
    var big = a1 - a0 > Math.PI ? 1 : 0;
    return Pth("M" + n2(cx + r * Math.cos(a0)) + "," + n2(cy + r * Math.sin(a0)) +
      " A" + n2(r) + "," + n2(r) + " 0 " + big + ",1 " + n2(cx + r * Math.cos(a1)) + "," + n2(cy + r * Math.sin(a1)),
      null, P.gold, 4, { opacity: 0.85, "stroke-dasharray": "10 8" }) +
      C(cx + r * Math.cos(a1), cy + r * Math.sin(a1), 8, P.gold);
  }

  function sacTriGroup(t, scene) {
    var out = "", i;
    var sides = sacSpoken(t, scene, 1, SAC_123);
    var corners = sacSpoken(t, scene, 3, SAC_123);
    var oneSide = on(t, sc(scene, 0, "side"), 0.4);
    var edgePulse = bump(t, sc(scene, 0, "edge"), 0.9);
    var cornAt = sc(scene, 2, "corner"), meetAt = sc(scene, 2, "meet");

    out += sacFace(SAC_CX, SAC_CY, SAC_TRI, popIn(t, sc(scene, 0, "tri"), 0.5));
    /* "A side is one straight edge": side 0 alone, before any counting */
    if (sides === 0) {
      out += sacSideLit(SAC_CX, SAC_CY, SAC_TRI, 0, oneSide * (0.75 + 0.25 * edgePulse));
      if (edgePulse > 0) {
        var q = sacSideAt(SAC_CX, SAC_CY, SAC_TRI, 0, 30);
        out += MK.glow(q[0], q[1], 60, P.gold, edgePulse);
      }
    }
    out += sacGoRound(t, sc(scene, 1, "round"), SAC_CX, SAC_CY, 176);
    for (i = 0; i < sides; i++) {
      out += sacSideLit(SAC_CX, SAC_CY, SAC_TRI, i, 0.9);
      out += sacSideNum(SAC_CX, SAC_CY, SAC_TRI, i, popIn(t, sc(scene, 1, SAC_123[i]), 0.35), 24, 36);
    }
    /* "A corner is the point where two sides meet": corner 0 alone */
    if (corners === 0 && cornAt != null) {
      out += sacCornerDot(SAC_CX, SAC_CY, SAC_TRI, 0, popIn(t, cornAt, 0.4), 17);
      var mp = bump(t, meetAt, 1.0);
      if (mp > 0) out += MK.glow(SAC_CX + SAC_TRI[0][0], SAC_CY + SAC_TRI[0][1], 74, P.plum, mp);
    }
    for (i = 0; i < corners; i++)
      out += sacCornerDot(SAC_CX, SAC_CY, SAC_TRI, i, popIn(t, sc(scene, 3, SAC_123[i]), 0.35), 17);
    return out;
  }

  function sacPentSides(t, scene) {
    var a = sc(scene, 4, "pent"), b = sc(scene, 4, "five");
    if (a == null) return 0;
    return tally(t, a, 5, b == null ? 1.6 : Math.max(b - a, 0.7));
  }
  function sacPentGroup(t, scene) {
    var out = "", i;
    var sides = sacPentSides(t, scene);
    var cAt = sc(scene, 5, "corners");
    var corners = tally(t, cAt, 5, 1.4);
    var ends = bump(t, sc(scene, 5, "ends"), 1.3);
    out += sacFace(SAC_CX, SAC_CY, SAC_PENT, 1);
    out += sacGoRound(t, sc(scene, 4, "pent"), SAC_CX, SAC_CY, 170);
    for (i = 0; i < sides; i++) {
      out += sacSideLit(SAC_CX, SAC_CY, SAC_PENT, i, 0.9);
      out += sacSideNum(SAC_CX, SAC_CY, SAC_PENT, i, 1, 22, 34);
    }
    for (i = 0; i < corners; i++) out += sacCornerDot(SAC_CX, SAC_CY, SAC_PENT, i, 1, 16);
    /* "every side ends at a corner": every corner rings at once */
    if (ends > 0) for (i = 0; i < SAC_PENT.length; i++)
      out += C(SAC_CX + SAC_PENT[i][0], SAC_CY + SAC_PENT[i][1], 16 + 12 * ends, "none", P.gold, 4, { opacity: 1 - ends * 0.5 });
    return out;
  }

  /* The triangle stays until the words say a bigger shape: crossfading on the
     beat boundary instead left an empty card for a second while "Now try" was
     said, which --sample caught and --sweep could not. */
  function sacCountChapter(scene, beat, t, i) {
    var u = on(t, sc(scene, 4, "bigger"), 0.5);
    var out = sacCard(36, 14, 592, 412, 1);
    if (u < 1) out += G(sacTriGroup(t, scene), { opacity: 1 - u });
    if (u > 0) out += G(sacPentGroup(t, scene), { opacity: u });

    var pent = u > 0.5;
    var sides = pent ? sacPentSides(t, scene) : sacSpoken(t, scene, 1, SAC_123);
    var corners = pent ? tally(t, sc(scene, 5, "corners"), 5, 1.4) : sacSpoken(t, scene, 3, SAC_123);
    out += sacTile(668, 66, 464, 138, "sides", sides, P.accent, 1, sides > 0);
    out += sacTile(668, 240, 464, 138, "corners", corners, P.plum, 1, corners > 0);
    return svg(out);
  }
