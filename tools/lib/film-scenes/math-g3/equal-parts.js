  /* ==== Grade 3 Mathematics, Lesson 4: Equal Parts ===========================
     tools/lib/film-scenes/math-g3/equal-parts.js, with -2.js and -3.js: the
     film's pictures, after the shared marks (MK) and before the engine's tail,
     all in one scope. The storyboard is
     mathematics/grade-3-app/lecture-video/equal-parts.json.

     THE WHOLE OF THIS FILM IS THAT THE PARTS ARE EQUAL, so every division
     drawn here is equal by ARITHMETIC and never by eye:

       a circle   every boundary is i * 360 / parts, so four sectors are 90
                  degrees each and five are 72 - epPie() computes them
       a bar      ART.fraction's own cells, width (440 - 44) / parts, identical
       a group    n beads laid in `piles` piles of exactly n / piles, and the
                  code refuses to draw a pile that does not divide

     The ONE unequal picture in the film - the wrong shape in "Equal, or not" -
     is the LESSON's own wrong shape: its shapeSvg(equal = false) shifts one
     boundary by half a sector, giving 135, 45, 90 and 90 degrees. It is drawn
     that way here on purpose, named as not equal, and crossed out.

     Mathematics has no lesson kit, so the drawings are ART
     (tools/lib/ehel-film-art-math.js) plus a few of this film's own, on ART's
     own light cards in ART's own palette so that a hand-drawn circle and an
     ART.fraction bar look like one set. Every top-level name here starts with
     ep, so nothing can replace a name of the engine, ART or MK.

     This file: the palette, the shared drawings, the title motif and the
     chapter "Equal, or not". */

  var HUE = {
    title: P.teal, equal: P.accent, whole: P.good, group: P.blue,
    divide: P.plum, same: P.teal, bigger: P.gold, recap: P.teal
  };

  /* the lessons' light palette, so this film's own drawings match ART's */
  var MC = ART.C;

  /* ---- timing ---------------------------------------------------------- */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 comes
     in: for a thing that belongs to that beat alone (rule 7) */
  function epOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function epFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }
  /* 1 until the chapter's beat k arrives, then 0 */
  function epUntil(t, scene, k) { return k >= scene.beats.length ? 1 : 1 - into(t, scene.first + k); }

  /* ---- the drawings this film adds to ART -------------------------------- */

  /* one of ART's light cards, to stand a hand-drawn thing on */
  function epCard(x, y, w, h, o) {
    return R(x, y, w, h, 20, MC.card, MC.line, 2, o || null);
  }

  /* a sector of a circle, from a0 to a1 degrees clockwise from twelve
     o'clock, pushed `push` px out along its own middle */
  function epSector(cx, cy, r, a0, a1, fill, stroke, sw, push) {
    var r0 = (a0 - 90) * Math.PI / 180, r1 = (a1 - 90) * Math.PI / 180;
    var mid = (a0 + a1) / 2 - 90, mr = mid * Math.PI / 180;
    var dx = (push || 0) * Math.cos(mr), dy = (push || 0) * Math.sin(mr);
    var big = a1 - a0 > 180 ? 1 : 0;
    return Pth("M" + n2(cx + dx) + "," + n2(cy + dy) +
      " L" + n2(cx + dx + r * Math.cos(r0)) + "," + n2(cy + dy + r * Math.sin(r0)) +
      " A" + n2(r) + "," + n2(r) + " 0 " + big + ",1 " +
      n2(cx + dx + r * Math.cos(r1)) + "," + n2(cy + dy + r * Math.sin(r1)) + " Z",
      fill, stroke || MC.ink, sw == null ? 2.5 : sw);
  }
  /* where a sector's middle sits, for a tick or a leader line */
  function epSectorAt(cx, cy, r, a0, a1, push, frac) {
    var mr = ((a0 + a1) / 2 - 90) * Math.PI / 180, d = (push || 0) + r * (frac == null ? 0.6 : frac);
    return [cx + d * Math.cos(mr), cy + d * Math.sin(mr)];
  }

  /* A circle cut at the given boundary angles. Equal parts are asked for by
     COUNT, and the boundaries are then computed, so equality is arithmetic:
       epPie(cx, cy, r, 4, o)            four sectors of exactly 90 degrees
       epPie(cx, cy, r, [0,135,180,270,360], o)   the lesson's wrong shape
     o: {fills (per sector), push (per sector, or one number), strokes, sw} */
  function epBounds(parts) {
    var b = [];
    for (var k = 0; k <= parts; k++) b.push(k * 360 / parts);
    return b;
  }
  function epPie(cx, cy, r, parts, o) {
    o = o || {};
    var bounds = typeof parts === "number" ? epBounds(parts) : parts, out = "";
    for (var k = 0; k < bounds.length - 1; k++) {
      var push = typeof o.push === "number" ? o.push : (o.push && o.push[k]) || 0;
      out += epSector(cx, cy, r, bounds[k], bounds[k + 1],
        (o.fills && o.fills[k]) || MC.cell, (o.strokes && o.strokes[k]) || MC.ink, o.sw, push);
    }
    if (!o.push) out += C(cx, cy, r, "none", MC.ink, 3.5);
    return out;
  }

  /* a fraction written the way a child writes it, centred on (cx, cy) */
  function epFrac(cx, cy, a, b, size, fill) {
    return Tx(cx, cy - size * 0.30, String(a), "lab", "middle", { "font-size": size, fill: fill || MC.ink }) +
      L(cx - size * 0.44, cy, cx + size * 0.44, cy, fill || MC.ink, Math.max(2.5, size * 0.1)) +
      Tx(cx, cy + size * 0.92, String(b), "lab", "middle", { "font-size": size, fill: fill || MC.ink });
  }

  /* where a fraction's own numbers sit, so a ring lands on one of them: a
     numeral of font-size `size` stands about 0.62 of it above or below the
     fraction's middle. Measured off a rendered still, not guessed. */
  function epFracTop(cy, size) { return cy - size * 0.62; }
  function epFracBot(cy, size) { return cy + size * 0.60; }

  /* a word under a drawing, on the card itself, so it reads dark on white */
  function epCaption(cx, y, text, o, col, size) {
    if (!(o > 0)) return "";
    return Tx(cx, y, text, "lab big", "middle", { "font-size": size || 30, fill: col || MC.ink, opacity: clamp(o, 0, 1) });
  }

  /* an ART drawing, nested so that its own viewBox scales it to fit the box */
  function epPlace(markup, x, y, w, h, o) {
    if (!(o == null || o > 0)) return "";
    var m = ART.place(markup, x, y, w, h);
    return o == null || o >= 1 ? m : G(m, { opacity: clamp(o, 0, 1) });
  }

  /* ==== the title ==========================================================
     The lesson's own warm-up: a pizza cut into four pieces. In the spoken
     title chapter the four quarters light one at a time on "four pieces", a
     question mark asks whether they are quarters on "all quarters", and the
     tick answers it on "the pieces are equal" - the four sectors being
     exactly 90 degrees each, by epPie. On the two cards it simply stands. */
  var EP_MOTIF = { cx: 180, cy: 182, r: 134 };
  function titleMotif(o) {
    var t = o.t || 0, out = "", M = EP_MOTIF;
    var cFour = o.scene ? sc(o.scene, 0, "four") : null;
    var cQ = o.scene ? sc(o.scene, 0, "quarters") : null;
    var cEq = o.scene ? sc(o.scene, 1, "equal") : null;
    var cWork = o.scene ? sc(o.scene, 1, "work") : null;
    var lit = cFour == null ? 4 : tally(t, cFour, 4, 1.1);
    var pulse = cWork != null && t >= cWork ? 0.72 + 0.28 * breathe(t) : 1;
    var fills = [], k;
    for (k = 0; k < 4; k++) fills.push(k < lit ? MC.gold : MC.goldSoft);
    out += C(M.cx, M.cy, M.r + 16, MC.card, MC.line, 3);
    out += G(epPie(M.cx, M.cy, M.r, 4, { fills: fills, sw: 3 }), { opacity: pulse });
    /* each lit quarter says it is a quarter */
    for (k = 0; k < lit && k < 4; k++) {
      var p = epSectorAt(M.cx, M.cy, M.r, k * 90, (k + 1) * 90, 0, 0.56);
      out += G(epFrac(p[0], p[1], 1, 4, 26, MC.ink), { opacity: 0.9 });
    }
    if (cQ != null) out += MK.qmark(320, 56, 28, popIn(t, cQ, 0.4) * (cEq == null ? 1 : 1 - on(t, cEq, 0.35)));
    if (cEq != null) out += MK.tick(320, 56, 28, popIn(t, cEq, 0.4));
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A circle cut into four equal quarters">' + out + "</svg>";
  }

  /* ==== chapter: Equal, or not =============================================
     Two circles, each cut into four pieces. The left is epPie(..., 4): four
     sectors of exactly 90 degrees. The right is the lesson's own wrong shape,
     135, 45, 90 and 90. On "exactly the same size" the left circle's pieces
     push apart and tick one at a time; on "bigger than the rest" the right
     circle's pieces push apart too and its 135-degree piece is named. */
  var EP_L = { x: 118, y: 26, w: 446, h: 388, cx: 341, cy: 192, r: 128 };
  var EP_R = { x: 604, y: 26, w: 446, h: 388, cx: 827, cy: 192, r: 128 };
  var EP_WRONG = [0, 135, 180, 270, 360];

  function epEqualChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cTwo = c(0, "two"), cFour = c(0, "four");
    var cLook = c(1, "look"), cSame = c(1, "same");
    var cPieces = c(2, "pieces"), cQuarters = c(2, "quarters");
    var cOther = c(3, "other"), cBigger = c(3, "bigger");
    var cNot = c(4, "notenough"), cEqual = c(4, "equal");
    var out = "", k, p;

    var inL = popIn(t, cTwo, 0.5), inR = popIn(t, cTwo == null ? null : cTwo + 0.3, 0.5);
    if (!(inL > 0)) return svg("");

    /* the two cards */
    out += MK.pop(epCard(EP_L.x, EP_L.y, EP_L.w, EP_L.h), EP_L.cx, EP_L.cy, inL);
    out += MK.pop(epCard(EP_R.x, EP_R.y, EP_R.w, EP_R.h), EP_R.cx, EP_R.cy, inR);

    /* the left circle: four sectors of exactly 90 degrees, pushed apart as
       they are said to be the same size, and back together for "quarters" */
    var openL = on(t, cSame, 0.7) * epUntil(t, scene, 3);
    var tickL = tally(t, cSame, 4, 1.2) * (cSame == null || t < cSame ? 0 : 1);
    var lookL = on(t, cLook, 0.5) * epOnly(t, scene, 1);
    var fillsL = [], pushL = [];
    for (k = 0; k < 4; k++) { fillsL.push(k < tickL ? MC.tealSoft : MC.cell); pushL.push(14 * openL); }
    out += G(MK.glow(EP_L.cx, EP_L.cy, 190, P.gold, lookL * 0.9) +
      epPie(EP_L.cx, EP_L.cy, EP_L.r, 4, { fills: fillsL, push: openL > 0 ? pushL : 0, sw: 3 }), { opacity: inL });
    /* the ticks hand over to the quarter names, which stand in the same
       place: both at once put a tick behind every 1/4 */
    var tickFade = 1 - on(t, cQuarters, 0.35);
    for (k = 0; k < 4 && tickFade > 0; k++) {
      if (k >= tickL) continue;
      p = epSectorAt(EP_L.cx, EP_L.cy, EP_L.r, k * 90, (k + 1) * 90, 14 * openL, 0.58);
      out += G(MK.tick(p[0], p[1], 20, popIn(t, cSame == null ? null : cSame + k * 0.4, 0.35)), { opacity: tickFade });
    }
    /* "really are quarters": each piece named a quarter, once they are back */
    var qo = on(t, cQuarters, 0.45);
    if (qo > 0) {
      for (k = 0; k < 4; k++) {
        p = epSectorAt(EP_L.cx, EP_L.cy, EP_L.r, k * 90, (k + 1) * 90, 14 * openL, 0.56);
        out += G(epFrac(p[0], p[1], 1, 4, 27, MC.teal), { opacity: qo });
      }
    }
    out += MK.ripple(EP_L.cx, EP_L.cy, t, cPieces, P.gold);

    /* the right circle: the lesson's wrong shape. Its first piece is 135
       degrees, the other three 45, 90 and 90 - so it is named as the big one. */
    var openR = on(t, cBigger, 0.7);
    var lookR = on(t, cOther, 0.5) * epOnly(t, scene, 3);
    var badO = on(t, cBigger, 0.45);
    var fillsR = [MC.cell, MC.cell, MC.cell, MC.cell], strokesR = [MC.ink, MC.ink, MC.ink, MC.ink];
    if (badO > 0.4) { fillsR[0] = MC.badSoft; strokesR[0] = MC.bad; }
    var pushR = [18 * openR, 18 * openR, 18 * openR, 18 * openR];
    out += G(MK.glow(EP_R.cx, EP_R.cy, 190, P.gold, lookR * 0.9) +
      epPie(EP_R.cx, EP_R.cy, EP_R.r, EP_WRONG, { fills: fillsR, strokes: strokesR, push: openR > 0 ? pushR : 0, sw: 3 }), { opacity: inR });
    /* the line that points at the big piece, and says how big it is */
    if (badO > 0) {
      p = epSectorAt(EP_R.cx, EP_R.cy, EP_R.r, 0, 135, 18 * openR, 0.62);
      out += MK.leader(1008, 96, p[0], p[1], on(t, cBigger, 0.6), P.bad);
      out += MK.pill(1008, 84, "bigger", badO, { size: 24, col: P.bad, ink: P.bad });
    }

    /* the boundaries counted on both circles: four pieces, four pieces */
    var fourO = on(t, cFour, 0.4) * epOnly(t, scene, 0);
    if (fourO > 0) {
      out += MK.pill(EP_L.cx, 372, "4 pieces", fourO, { size: 26, col: P.line });
      out += MK.pill(EP_R.cx, 372, "4 pieces", fourO, { size: 26, col: P.line });
    }

    /* the verdicts, each on its own card */
    var vL = Math.max(on(t, cQuarters, 0.45), on(t, cEqual, 0.45));
    var vR = Math.max(badO, on(t, cNot, 0.45));
    if (vL > 0) out += epCaption(EP_L.cx, 382, "equal parts", vL, MC.teal) +
      MK.tick(EP_L.x + 44, EP_L.y + 44, 24, popIn(t, cQuarters, 0.4));
    if (vR > 0) out += epCaption(EP_R.cx, 382, "not equal parts", vR, MC.bad) +
      MK.cross(EP_R.x + EP_R.w - 44, EP_R.y + 44, 24, popIn(t, cNot, 0.4));
    return svg(out);
  }
