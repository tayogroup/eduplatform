  /* ==== Sides and Corners, part 3 ==============================================
     tools/lib/film-scenes/math-g2/sides-and-corners-3.js: the chapters "Lines
     of symmetry", "Turning" and "The same again", the recap, and KINDS.
     Joined to parts 1 and 2 in one scope; see the header of
     sides-and-corners.js. */

  /* ==== chapter: lines of symmetry ===============================================
     ART.symmetry draws the fold lines a shape really has, and reflects one
     half over the other, so the film cannot claim a fold that does not work.
     The one thing it will not draw is a fold that FAILS, which is the lesson's
     own last case (a rectangle on the slanted line), so that line is drawn
     here, over the library's rectangle, in the card's own coordinates. */
  var SAC_FOLD = { x: 258, y: 32, w: 380, h: 380 * 288 / 292 };
  function sacFX(v) { return SAC_FOLD.x + v * SAC_FOLD.w / 292; }
  function sacFY(v) { return SAC_FOLD.y + v * SAC_FOLD.h / 288; }

  function sacFoldCard(t, scene, k) {
    var o = { kind: "square", label: false }, out = "";
    if (k <= 1) {
      var foldAt = k === 0 ? sc(scene, 0, "fold") : sc(scene, 1, "middle");
      var refAt = k === 0 ? sc(scene, 0, "match") : sc(scene, 1, "land");
      if (foldAt != null && t >= foldAt) o.lines = [0];
      else if (k === 1) o.lines = [0];
      else o.lines = [];
      if (o.lines.length && refAt != null && t >= refAt) o.reflect = true;
    } else {
      o.kind = "rectangle";
      if (k === 2) {
        var acr = sc(scene, 2, "across"), wk = sc(scene, 2, "works");
        o.lines = acr != null && t >= acr ? [1] : [];
        if (o.lines.length && wk != null && t >= wk) o.reflect = true;
      } else {
        o.lines = [];
      }
    }
    out += ART.place(ART.symmetry(o), SAC_FOLD.x, SAC_FOLD.y, SAC_FOLD.w, SAC_FOLD.h);
    /* "Both halves land on each other": an arrow across the fold line */
    if (k === 1) {
      var lu = on(t, sc(scene, 1, "land"), 0.6);
      out += MK.arrow(sacFX(226), sacFY(112), sacFX(118), sacFY(112), lu, P.gold, 8);
    }
    /* "A slanted fold does not work": the line the lesson tries and rejects */
    if (k === 3) {
      var su = on(t, sc(scene, 3, "slant"), 0.55);
      if (su > 0) {
        var ax = 24, ay = 227, bx = 268, bz = 65;
        out += L(sacFX(ax), sacFY(ay), sacFX(lerp(ax, bx, su)), sacFY(lerp(ay, bz, su)),
          P.accent, 4, { "stroke-dasharray": "11 8" });
      }
    }
    return out;
  }

  function sacFoldChapter(scene, beat, t, i) {
    var k = i - scene.first;
    var out = crossfade(t, i, scene, function (j) { return sacFoldCard(t, scene, j - scene.first); });
    var vx = 886, vy = 216;
    var said = k === 1 ? sc(scene, 1, "land") : k === 2 ? sc(scene, 2, "works") : k === 3 ? sc(scene, 3, "no") : null;
    out += MK.qmark(vx, vy, 76, 1 - (said == null ? 0 : on(t, said, 0.4)));
    if (k === 1) out += MK.tick(vx, vy, 76, popIn(t, sc(scene, 1, "land"), 0.5));
    else if (k === 2) out += MK.tick(vx, vy, 76, popIn(t, sc(scene, 2, "works"), 0.5));
    else if (k === 3) out += MK.cross(vx, vy, 76, popIn(t, sc(scene, 3, "no"), 0.5));
    /* "the halves are not the same shape": the two unequal halves flash */
    var same = bump(t, sc(scene, 3, "same"), 1.2);
    if (k === 3 && same > 0) out += MK.glow(vx, vy, 132, P.bad, same);
    /* "A line of symmetry is a fold line": the words are new, so the line
       itself draws rather than appearing */
    if (k === 0) out += MK.glow(sacFX(146), sacFY(146), 150, P.good,
      on(t, sc(scene, 0, "line"), 0.6) * 0.5 * (1 - on(t, sc(scene, 0, "match"), 0.6)));
    return svg(out);
  }

  /* ==== chapter: turning =========================================================
     A dial: four quarter marks, an arrow from the middle, and the arc it has
     swept. The first line shows a quarter, a half and a whole side by side;
     after that one dial turns, and the lesson's own clock says which way
     clockwise is, its hands really going round. */
  function sacArc(cx, cy, r, fromDeg, sweepDeg, col, w, o) {
    if (!(o > 0) || !(sweepDeg > 0.4)) return "";
    var s = Math.min(sweepDeg, 359.4);
    var a0 = (fromDeg - 90) * Math.PI / 180, a1 = (fromDeg + s - 90) * Math.PI / 180;
    return Pth("M" + n2(cx + r * Math.cos(a0)) + "," + n2(cy + r * Math.sin(a0)) +
      " A" + n2(r) + "," + n2(r) + " 0 " + (s > 180 ? 1 : 0) + ",1 " +
      n2(cx + r * Math.cos(a1)) + "," + n2(cy + r * Math.sin(a1)),
      null, col || P.gold, w || 6, { opacity: clamp(o, 0, 1) });
  }
  /* the dial itself: a face, four quarter marks, and an arrow at angleDeg
     (0 = up, and clockwise is positive, which is the way a clock goes) */
  function sacDial(cx, cy, r, angleDeg, o) {
    if (!(o > 0)) return "";
    var out = C(cx, cy, r, "#16384E", P.muted, 3), q, a;
    for (q = 0; q < 4; q++) {
      a = (q * 90 - 90) * Math.PI / 180;
      out += L(cx + (r - 22) * Math.cos(a), cy + (r - 22) * Math.sin(a),
        cx + r * Math.cos(a), cy + r * Math.sin(a), P.muted, 7);
    }
    a = (angleDeg - 90) * Math.PI / 180;
    out += L(cx, cy, cx + (r - 30) * Math.cos(a), cy + (r - 30) * Math.sin(a), P.accent, 9);
    out += MK.arrow(cx, cy, cx + (r - 14) * Math.cos(a), cy + (r - 14) * Math.sin(a), 1, P.accent, 9);
    out += C(cx, cy, 10, P.accent);
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  var SAC_THREE = [
    { x: 226, at: "quarter", sweep: 90, word: "a quarter turn" },
    { x: 584, at: "half", sweep: 180, word: "a half turn" },
    { x: 942, at: "whole", sweep: 360, word: "a whole turn" }
  ];
  function sacTurnThree(t, scene) {
    var out = "", k;
    for (k = 0; k < SAC_THREE.length; k++) {
      var d = SAC_THREE[k], at = sc(scene, 0, d.at), p = Math.min(1, popIn(t, at, 0.45));
      var u = on(t, at == null ? null : at + 0.25, 0.7);
      /* the three dials stand there from the chapter's first frame, so the
         stage is never empty while the opening words are said */
      out += sacDial(d.x, 208, 112, d.sweep * u, 0.34 + 0.66 * p);
      out += sacArc(d.x, 208, 78, 0, d.sweep * u, P.gold, 7, p);
      out += MK.pill(d.x, 368, d.word, p, { size: 26, col: P.gold });
    }
    return out;
  }

  /* where the arrow points, in degrees clockwise from up */
  function sacTurnAngle(t, scene) {
    var spin = sc(scene, 2, "spin"), another = sc(scene, 3, "another");
    var two = sc(scene, 4, "two"), half = sc(scene, 4, "half"),
      whole = sc(scene, 4, "whole"), back = sc(scene, 4, "back");
    /* beat 5: anticlockwise, from up (0, same point as the 360 the whole
       turn just landed on) to left (-90). Checked first because it is the
       LAST beat in time, and a negative angle is fine: sacDial only ever
       reads its cos/sin. */
    var anti = sc(scene, 5, "anti"), aleft = sc(scene, 5, "left");
    if (anti != null && t >= anti) {
      var aspan = Math.max((aleft == null ? anti + 1.0 : aleft) - anti, 0.6);
      return lerp(0, -90, ease(clamp((t - anti) / aspan, 0, 1)));
    }
    if (whole != null && t >= whole) {
      var e = back != null && back > whole ? back : whole + 1.4;
      return lerp(180, 360, ease(clamp((t - whole) / Math.max(e - whole, 0.5), 0, 1)));
    }
    if (two != null && t >= two) {
      var span = Math.max((half == null ? two + 1.6 : half) - two, 0.6);
      var u = clamp((t - two) / span, 0, 1);
      return u < 0.5 ? lerp(0, 90, ease(u / 0.5)) : lerp(90, 180, ease((u - 0.5) / 0.5));
    }
    /* the gap before "Two quarter turns": it carries on round to the top
       rather than jumping back to it */
    if (two != null && scene.beats.length > 4) {
      var r = into(t, scene.first + 4);
      if (r > 0) return lerp(180, 360, r);
    }
    if (another != null && t >= another) return lerp(90, 180, ease(clamp((t - another) / 0.85, 0, 1)));
    if (spin != null && t >= spin) return lerp(0, 90, ease(clamp((t - spin) / 0.85, 0, 1)));
    return 0;
  }

  /* the same swept-arc drawing as sacArc, but for a NEGATIVE sweep (the
     anticlockwise beat): the sweep-flag flips, so the arc still draws the
     right wedge instead of vanishing (sacArc's own guard rejects a sweep
     that is not positive). */
  function sacArcCCW(cx, cy, r, fromDeg, toDeg, col, w, o) {
    var span = fromDeg - toDeg;
    if (!(o > 0) || !(span > 0.4)) return "";
    var s = Math.min(span, 359.4);
    var a0 = (fromDeg - 90) * Math.PI / 180, a1 = (fromDeg - s - 90) * Math.PI / 180;
    return Pth("M" + n2(cx + r * Math.cos(a0)) + "," + n2(cy + r * Math.sin(a0)) +
      " A" + n2(r) + "," + n2(r) + " 0 " + (s > 180 ? 1 : 0) + ",0 " +
      n2(cx + r * Math.cos(a1)) + "," + n2(cy + r * Math.sin(a1)),
      null, col || P.gold, w || 6, { opacity: clamp(o, 0, 1) });
  }

  var SAC_DIALX = 336, SAC_DIALY = 216, SAC_DIALR = 162;
  function sacTurnOne(t, scene) {
    var out = "", a = sacTurnAngle(t, scene);
    out += sacDial(SAC_DIALX, SAC_DIALY, SAC_DIALR, a, 1);
    if (a < 0) out += sacArcCCW(SAC_DIALX, SAC_DIALY, SAC_DIALR - 44, 0, a, P.teal, 8, 1);
    else out += sacArc(SAC_DIALX, SAC_DIALY, SAC_DIALR - 44, 0, a, P.gold, 8, 1);
    /* "points up", "points right", "points down", "points left": a tap at
       the rim it reaches. -90 is the same point on the dial as 270 (left) -
       sacDial and the ripple both just read cos/sin of the angle. */
    [[sc(scene, 2, "up"), 0], [sc(scene, 3, "right"), 90], [sc(scene, 3, "down"), 180],
      [sc(scene, 5, "left"), -90]]
      .forEach(function (p) {
        var rad = (p[1] - 90) * Math.PI / 180;
        out += MK.ripple(SAC_DIALX + SAC_DIALR * Math.cos(rad), SAC_DIALY + SAC_DIALR * Math.sin(rad), t, p[0], P.gold);
      });
    /* the clock, its hands really going round on "go round" */
    var clockAt = sc(scene, 1, "clock"), roundAt = sc(scene, 1, "round");
    var cp = popIn(t, clockAt, 0.5);
    if (cp > 0) {
      var u = roundAt == null ? 0 : clamp((t - roundAt) / 1.8, 0, 1);
      var m = u <= 0 || u >= 1 ? 0 : Math.min(59, Math.floor(u * 60));
      out += MK.pop(ART.place(ART.clock(3, m, {}), 752, 66, 300, 300), 902, 216, cp);
    }
    /* the "whole turn" tick belongs to beat 4; it fades as beat 5 begins so
       it is not left sitting over the anticlockwise demonstration (rule 7) */
    out += MK.tick(1086, 388, 42, popIn(t, sc(scene, 4, "back"), 0.5) * (1 - Math.min(1, sacFrom(t, scene, 5))));
    /* "Anticlockwise": a pill under the dial names the new direction, the
       same way sacTurnThree names each of the three turns */
    out += MK.pill(SAC_DIALX, 412, "anticlockwise", Math.min(1, popIn(t, sc(scene, 5, "anti"), 0.45)),
      { size: 22, col: P.teal });
    return out;
  }

  function sacTurnChapter(scene, beat, t, i) {
    var u = scene.beats.length > 1 ? into(t, scene.first + 1) : 0;
    var out = "";
    if (u < 1) out += G(sacTurnThree(t, scene), { opacity: 1 - u });
    if (u > 0) out += G(sacTurnOne(t, scene), { opacity: u });
    return svg(out);
  }

  /* ==== chapter: the same again ==================================================
     A square turning once all the way round. It is upright at the start and
     upright again at the end, so it really does look identical four times -
     at a quarter, a half, three quarters and the whole turn - and the four
     slots fill one at a time as it passes them. */
  var SAC_SPINSQ = sacPoly(4, 184, -45);
  var SAC_PIPX = [712, 828, 944, 1060];
  function sacSpinTimes(scene) {
    var a = sc(scene, 0, "round"), b = sc(scene, 1, "start");
    if (a == null || b == null || b <= a) return null;
    return { from: a, span: b - a };
  }
  function sacSpinChapter(scene, beat, t, i) {
    var w = sacSpinTimes(scene), out = "", k;
    var u = w ? clamp((t - w.from) / w.span, 0, 1) : 0;
    var ang = 360 * u;
    var cx = 356, cy = 216;
    out += sacCard(76, 20, 560, 400, 1);
    var flash = 0;
    for (k = 1; k <= 4; k++) if (w) flash = Math.max(flash, bump(t, w.from + w.span * k / 4 - 0.25, 0.6));
    flash *= w ? on(t, sc(scene, 0, "same"), 0.3) : 0;
    if (flash > 0) out += MK.glow(cx, cy, 216, P.gold, flash);
    out += G(sacFace(cx, cy, SAC_SPINSQ, 1), { transform: "rotate(" + n2(ang) + " " + n2(cx) + " " + n2(cy) + ")" });
    /* "one for each equal corner": the square's four corners */
    var cAt = sc(scene, 1, "corner");
    if (cAt != null) {
      var cp = popIn(t, cAt, 0.5);
      var dots = "";
      for (k = 0; k < SAC_SPINSQ.length; k++) dots += sacCornerDot(cx, cy, SAC_SPINSQ, k, cp, 17);
      out += G(dots, { transform: "rotate(" + n2(ang) + " " + n2(cx) + " " + n2(cy) + ")" });
    }
    /* the prediction: four slots, filled as the square passes each one */
    var slots = Math.min(1, popIn(t, sc(scene, 0, "four"), 0.5));
    for (k = 0; k < 4; k++) {
      var lastP = k === 3 ? bump(t, sc(scene, 1, "last"), 1.2) : 0;
      out += C(SAC_PIPX[k], 216, 46, P.card, lastP > 0 ? P.gold : P.line, lastP > 0 ? 5 : 3,
        { opacity: 0.3 + 0.7 * slots });
      if (w) out += MK.tick(SAC_PIPX[k], 216, 38, popIn(t, w.from + w.span * (k + 1) / 4, 0.4));
    }
    return svg(out);
  }

  /* ---- what you now know ------------------------------------------------ */
  var SAC_RPENT = sacPoly(5, 44, -90);
  var SAC_RTRI = sacPoly(3, 38, -90), SAC_RHEX = sacPoly(6, 36, -90);
  var SAC_RSQ = sacPoly(4, 44, -45);
  var SAC_RECAP = MK.recapKind([
    { beat: 0, at: "sides", title: "Sides and corners", sub: "the two numbers match",
      pic: function (cx, cy) {
        var s = sacFace(cx, cy, SAC_RPENT, 1), k;
        for (k = 0; k < SAC_RPENT.length; k++) s += sacCornerDot(cx, cy, SAC_RPENT, k, 1, 8);
        return s;
      } },
    { beat: 1, at: "name", title: "Naming a shape", sub: "3, 4, 5 or 6 sides",
      pic: function (cx, cy) {
        return sacFace(cx - 46, cy, SAC_RTRI, 1) + sacFace(cx + 46, cy, SAC_RHEX, 1);
      } },
    { beat: 2, at: "faces", title: "Faces and edges", sub: "a cube: 6 faces, 12 edges, 8 corners",
      pic: "\u{1F3B2}" },
    { beat: 3, at: "fold", title: "Folding and turning", sub: "matching halves, and quarter turns",
      pic: function (cx, cy) {
        return sacFace(cx - 44, cy, SAC_RSQ, 1) +
          L(cx - 44, cy - 40, cx - 44, cy + 40, P.accent, 3, { "stroke-dasharray": "7 5" }) +
          sacArc(cx + 46, cy, 30, 0, 270, P.gold, 5, 1) +
          C(cx + 46, cy, 6, P.gold) +
          MK.arrow(cx + 16, cy - 6, cx + 16, cy + 8, 1, P.gold, 5);
      } }
  ], { goBeat: 3, goAt: "start" });

  var KINDS = {
    title: MK.titleKind({ sub: [
      "Counting the sides and corners of a flat shape",
      "Naming it, and the faces and edges of a solid",
      "Fold lines, and turning a quarter at a time"
    ] }),
    count: sacCountChapter, name: sacNameChapter, solid: sacSolidChapter,
    fold: sacFoldChapter, turn: sacTurnChapter, spin: sacSpinChapter, recap: SAC_RECAP
  };
