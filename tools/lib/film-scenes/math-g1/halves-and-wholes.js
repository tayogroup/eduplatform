  /* ==== Grade 1 Mathematics, Halves and Wholes ================================
     tools/lib/film-scenes/math-g1/halves-and-wholes.js, with -2.js and -3.js:
     the film's pictures, after the shared marks (MK) and before the engine's
     tail, all in one scope. The storyboard is
     mathematics/grade-1-app/g1v2/lecture-video/halves-and-wholes.json.

     Mathematics has no lesson kit, so the drawings come from ART
     (tools/lib/ehel-film-art-math.js) and from the engine's own helpers. The
     lesson's numbers are the lesson page's own: the square cut down the middle
     and the strip cut near one end (halves-and-wholes.html step 4, EQ1), six
     apples on two plates (SETS4), eight counters in two rows (NUM5), half of
     ten, and three wholes made of six halves (WHOLE8).

     THE RULE THIS FILM IS ABOUT: a half is one of TWO EQUAL PARTS, so every
     division drawn here is cut at the exact middle, by construction and not by
     eye - hwSemiPath splits a circle on its own centre line, the square is two
     rects of the same width constant, ART.fraction({parts: 2}) makes two 180
     degree sectors, and the only unequal picture in the film is the strip in
     "Two equal parts", which the voice names as NOT equal and which the last
     beat of that chapter repairs by sliding its cut to the middle.

     This file: the palette, the shared small drawings, the title motif and the
     chapter "Two equal parts". Every top-level name starts with hw, so nothing
     here can replace a name of the engine, ART or MK. */

  var HUE = {
    title: P.teal, equal: P.gold, onehalf: P.teal, group: P.accent,
    number: P.blue, whole: P.good, recap: P.teal
  };

  /* ---- timing ---------------------------------------------------------------- */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 comes
     in: for a thing that belongs to that beat alone (rule 7) */
  function hwOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function hwFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }
  /* 1 until the chapter's beat k comes in, then 0: the half of a crossfade that goes */
  function hwUntil(t, scene, k) { return 1 - hwFrom(t, scene, k); }
  /* a cue plus a delay, safe when the beat does not name it */
  function hwAfter(at, d) { return at == null ? null : at + d; }

  /* ---- small drawings every chapter shares ------------------------------------ */

  /* Half of a circle, as a path: side -1 is the left half, +1 the right. The cut
     is the circle's own vertical centre line, so the two halves are equal
     because of how they are made, not because they were drawn to look it. */
  function hwSemiPath(cx, cy, r, side) {
    return "M" + n2(cx) + "," + n2(cy - r) +
      " A" + n2(r) + "," + n2(r) + " 0 0," + (side > 0 ? 1 : 0) + " " +
      n2(cx) + "," + n2(cy + r) + " Z";
  }

  /* A circle cut into two halves. left and right are 0 to 1: how coloured each
     half is. dx pushes the halves apart (positive) along the cut. */
  function hwHalvedCircle(cx, cy, r, left, right, dx, o, col) {
    if (!(o > 0)) return "";
    col = col || P.teal;
    var back = "#1C4A5E", out = "";
    var lg = Pth(hwSemiPath(cx, cy, r, -1), back, P.ink, 3.5) +
      G(Pth(hwSemiPath(cx, cy, r, -1), col), { opacity: clamp(left, 0, 1) }) +
      Pth(hwSemiPath(cx, cy, r, -1), "none", P.ink, 3.5);
    var rg = Pth(hwSemiPath(cx, cy, r, 1), back, P.ink, 3.5) +
      G(Pth(hwSemiPath(cx, cy, r, 1), col), { opacity: clamp(right, 0, 1) }) +
      Pth(hwSemiPath(cx, cy, r, 1), "none", P.ink, 3.5);
    out += G(lg, { transform: tr(-(dx || 0), 0) }) + G(rg, { transform: tr(dx || 0, 0) });
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* A measuring bar under a part, from x1 to x2, grown to u: two end caps and a
     line, so that two parts of the same width carry two bars of the same
     length and a child can see the comparison rather than be told it. */
  function hwBar(x1, x2, y, u, col) {
    if (!(u > 0)) return "";
    col = col || P.gold;
    var ex = lerp(x1, x2, clamp(u, 0, 1));
    return L(x1, y - 11, x1, y + 11, col, 3.5) +
      L(x1, y, ex, y, col, 4) +
      (u >= 1 ? L(x2, y - 11, x2, y + 11, col, 3.5) : "");
  }

  /* one counter, the lessons' fat round counter */
  function hwDot(x, y, r, col, o) {
    if (!(o > 0)) return "";
    return C(x, y, r, col || P.accent, null, null, { opacity: clamp(o, 0, 1) });
  }

  /* a small numbered badge, for counting things on screen */
  function hwBadge(x, y, text, p, col) {
    if (!(p > 0)) return "";
    col = col || P.gold;
    return MK.pop(C(x, y, 21, P.ground, col, 3) + Tx(x, y + 9, text, "lab big", "middle", { fill: col }), x, y, p);
  }

  /* ==== the title ==============================================================
     One circle, cut down its own middle. The cut draws itself on "two parts",
     both halves are measured equal on "exactly the same size", the cut flashes
     on "Cut a shape fairly", and one half - one only - fills on "one half". On
     the two silent cards it simply stands, cut and half coloured. */
  function titleMotif(o) {
    var t = o.t || 0, s0 = o.scene || null;
    var cTwo = s0 ? sc(s0, 0, "two") : null;
    var cSame = s0 ? sc(s0, 0, "same") : null;
    var cFair = s0 ? sc(s0, 1, "fair") : null;
    var cHalf = s0 ? sc(s0, 1, "half") : null;
    var cx = 180, cy = 172, r = 122;
    var lineU = s0 ? on(t, cTwo, 0.5) : 1;
    var sameU = s0 ? on(t, cSame, 0.5) : 0;
    var halfU = s0 ? on(t, cHalf, 0.5) : 1;
    var flash = s0 ? bump(t, cFair, 0.8) : 0;
    var out = "";
    out += C(cx, cy, r + 26, "#123247");
    out += hwHalvedCircle(cx, cy, r, halfU, 0, 0, 1, P.teal);
    /* the two halves lit as one pair, while they are being called the same size */
    if (sameU > 0 && halfU < 1) out += G(Pth(hwSemiPath(cx, cy, r, -1), P.gold) + Pth(hwSemiPath(cx, cy, r, 1), P.gold),
      { opacity: 0.26 * sameU * (1 - halfU) });
    /* the cut, drawing itself down the circle's own centre line */
    if (lineU > 0) out += L(cx, cy - r, cx, cy - r + 2 * r * lineU, flash > 0.02 ? P.gold : P.ink, 5 + 3 * flash);
    out += C(cx, cy, r, "none", P.ink, 4);
    /* two bars of the same length, one under each half */
    if (sameU > 0) {
      out += hwBar(cx - r + 4, cx - 8, cy + r + 30, sameU, P.gold);
      out += hwBar(cx + 8, cx + r - 4, cy + r + 30, sameU, P.gold);
    }
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A circle cut down the middle into two equal halves, one of them coloured">' +
      out + "</svg>";
  }

  /* ==== chapter: two equal parts (1Nf.01) ======================================
     The lesson's own two shapes, in its own order. Beats 0 to 2 are the square
     with the line straight down the middle (EQ1's first item): its two halves
     are two rects of one width constant, so they are equal by construction, and
     "swap them over" really does swap them and leave the square looking the
     same. Beats 3 to 5 are the strip cut near one end (EQ1's rect at 0.28), the
     one unequal picture in this film: the bars under it are the parts' real
     widths, it is crossed and named not equal, and on the last beat its cut
     slides to the exact middle and the bars become the same length. */
  var HW_SQ = { x: 315, y: 92, s: 230 };       /* the square: two halves of 115 each */
  var HW_ST = { x: 300, y: 168, w: 430, h: 120, at: 0.28 };  /* the strip, cut near one end */

  function hwSquare(t, cSquare, cLine, cMatch, cSwap, o) {
    if (!(o > 0)) return "";
    var p = popIn(t, cSquare, 0.45);
    if (!(p > 0)) return "";
    var x = HW_SQ.x, y = HW_SQ.y, s = HW_SQ.s, half = s / 2;
    var tint = on(t, cMatch, 0.5);
    var u = on(t, cSwap, 1.1);
    var lift = Math.sin(Math.PI * clamp(u, 0, 1)) * 70;
    var back = "#1C4A5E", out = "";
    function part(px) {
      return R(px, 0, half, s, 0, back, P.ink, 3.5) +
        R(px, 0, half, s, 0, P.teal, null, null, { opacity: 0.55 * tint }) +
        R(px, 0, half, s, 0, "none", P.ink, 3.5);
    }
    out += G(part(x), { transform: tr(half * u, y - lift) });
    out += G(part(x + half), { transform: tr(-half * u, y + lift) });
    /* the cut, down the square's own middle; it steps aside while the halves move */
    var lineU = on(t, cLine, 0.5);
    if (lineU > 0) out += L(x + half, y, x + half, y + s * lineU, P.ink, 4,
      { opacity: 1 - 0.9 * Math.sin(Math.PI * clamp(u, 0, 1)) });
    return G(out, { transform: around(x + half, y + s / 2, Math.min(p, 1.08)), opacity: Math.min(1, p) * clamp(o, 0, 1) });
  }

  function hwEqualChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cSquare = c(0, "square"), cLine = c(0, "line");
    var cMatch = c(1, "match"), cSwap = c(1, "swap");
    var cEqual = c(2, "equal"), cExactly = c(2, "exactly");
    var cStrip = c(3, "strip"), cNear = c(3, "near");
    var cFat = c(4, "fat"), cThin = c(4, "thin"), cNotEq = c(4, "notequal");
    var cEnough = c(5, "enough"), cBoth = c(5, "both");
    var A = hwUntil(t, scene, 3), B = hwFrom(t, scene, 3), out = "";

    /* ---- the square, cut down the middle ---- */
    if (A > 0.01) {
      var a = "";
      a += hwSquare(t, cSquare, cLine, cMatch, cSwap, 1);
      /* "exactly the same size": one bar under each half, both 107 long */
      var ex = on(t, cExactly, 0.6), x = HW_SQ.x, y = HW_SQ.y, s = HW_SQ.s, half = s / 2;
      a += hwBar(x + 4, x + half - 4, y + s + 30, ex, P.gold);
      a += hwBar(x + half + 4, x + s - 4, y + s + 30, ex, P.gold);
      /* "That is equal" */
      a += MK.tick(640, 150, 27, popIn(t, cEqual, 0.4));
      a += MK.pill(730, 244, "equal", on(t, cEqual, 0.45), { size: 32, col: P.good, ink: P.good });
      out += G(a, { opacity: A });
    }

    /* ---- the strip, cut near one end, and then cut fairly ---- */
    if (B > 0.01) {
      var b = "", fix = on(t, cBoth, 0.95);
      var sx = HW_ST.x, sy = HW_ST.y, sw = HW_ST.w, sh = HW_ST.h;
      var f = HW_ST.at + (0.5 - HW_ST.at) * fix;      /* 0.28 near one end -> 0.5 exactly */
      var cut = sx + sw * f, pp = popIn(t, cStrip, 0.45);
      var thinU = on(t, cThin, 0.5), fatU = on(t, cFat, 0.5);
      b += G(R(sx, sy, sw * f, sh, 0, "#1C4A5E", P.ink, 3.5) +
        R(sx, sy, sw * f, sh, 0, P.plum, null, null, { opacity: 0.5 * thinU }) +
        R(sx, sy, sw * f, sh, 0, "none", P.ink, 3.5) +
        R(cut, sy, sw * (1 - f), sh, 0, "#1C4A5E", P.ink, 3.5) +
        R(cut, sy, sw * (1 - f), sh, 0, P.accent, null, null, { opacity: 0.5 * fatU }) +
        R(cut, sy, sw * (1 - f), sh, 0, "none", P.ink, 3.5),
        { transform: around(sx + sw / 2, sy + sh / 2, Math.min(pp, 1.08)), opacity: Math.min(1, pp) });
      /* the cut itself, which slides to the middle on the last beat */
      var nearU = on(t, cNear, 0.45);
      if (nearU > 0) b += L(cut, sy, cut, sy + sh * nearU, fix > 0 && fix < 1 ? P.gold : P.ink, 4 + 2 * fix * (1 - fix) * 4);
      /* the parts' real widths, measured */
      var mu = Math.max(on(t, cFat, 0.6), on(t, cThin, 0.6));
      b += hwBar(sx + 4, cut - 5, sy + sh + 32, mu, P.gold);
      b += hwBar(cut + 5, sx + sw - 4, sy + sh + 32, mu, P.gold);
      /* "Two parts is not enough": the two parts counted, 1 and 2 */
      b += hwBadge(sx + sw * f / 2, sy - 34, "1", popIn(t, cEnough, 0.4), P.plum);
      b += hwBadge(cut + sw * (1 - f) / 2, sy - 34, "2", popIn(t, hwAfter(cEnough, 0.3), 0.4), P.accent);
      /* not equal, and then equal once the cut has moved */
      b += MK.cross(806, 182, 27, popIn(t, cNotEq, 0.4) * (1 - fix));
      b += MK.pill(896, 262, "not equal", on(t, cNotEq, 0.45) * (1 - fix), { size: 28, col: P.bad, ink: P.bad });
      b += MK.tick(806, 182, 27, popIn(t, hwAfter(cBoth, 0.75), 0.4));
      b += MK.pill(896, 262, "equal", on(t, hwAfter(cBoth, 0.85), 0.45), { size: 28, col: P.good, ink: P.good });
      out += G(b, { opacity: B });
    }
    return svg(out);
  }
