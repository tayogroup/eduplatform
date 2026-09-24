
  /* ==== Grade 2 Mathematics, Lesson 5: Fair Shares ============================
     tools/lib/film-scenes/math-g2/fair-shares.js, with -2.js: the film's
     pictures, after the shared marks (MK) and before the engine's tail, all in
     one scope. The storyboard is
     mathematics/grade-2-app/lecture-video/fair-shares.json.

     Mathematics has no lesson kit, so the drawings come from ART
     (tools/lib/ehel-film-art-math.js): ART.fraction for every bar and circle
     of parts, ART.coins for Amina's twenty shillings, ART.barModel for twenty
     shared between four. What ART does not draw - a bar cut into UNEQUAL
     parts, and counters dealt one at a time into groups - is drawn here, on a
     light card in ART's own palette so the film has one look.

     THE ONE RULE OF THIS FILM: a fair share is an EQUAL share. Every group
     drawn here is filled by fshDeal, which sends counter i to group i % g.
     With 12 counters and 4 groups that is 3 in every group and cannot be
     anything else; with 8 and 2 it is 4. No frame can show unequal groups
     under the word "fair" unless that one line is changed.

     This file: the palette, the drawings the chapters share, the title motif,
     and the chapters "Equal parts first" and "Top number, bottom number".
     Every top-level name starts with fsh, so nothing here can replace a name
     of the engine, ART or MK. */

  var HUE = {
    title: P.teal, equal: P.gold, naming: P.blue, share: P.good,
    amount: P.plum, same: P.accent, whole: P.gold, recap: P.teal
  };

  /* the lessons' light palette, so a drawing of this film's own sits beside an
     ART drawing without looking like a different subject */
  var FSH_C = ART.C;

  /* ---- timing ---------------------------------------------------------------- */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 comes
     in: for a thing that belongs to that beat alone */
  function fshOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function fshFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }

  /* ---- the drawings this film owns -------------------------------------------- */

  /* A light card to stand a drawing of our own on, so it matches ART's. */
  function fshCard(x, y, w, h, o) {
    if (!(o > 0)) return "";
    return R(x, y, w, h, 20, FSH_C.card, FSH_C.line, 2, { opacity: clamp(o, 0, 1) });
  }

  /* A bar cut into parts. `widths` are fractions of w and must add to 1, which
     is how an UNEQUAL cut is drawn: ART.fraction only ever cuts equally, and
     this lesson's first idea is the cut that is not equal.
     opt: {fills (a colour or null per part), lines (how many division lines
     have been drawn, 0 -> n, so they can arrive one at a time), o} */
  function fshBar(x, y, w, h, widths, opt) {
    opt = opt || {};
    var o = opt.o == null ? 1 : opt.o;
    if (!(o > 0)) return "";
    var out = "", px = x, i, cw, u;
    for (i = 0; i < widths.length; i++) {
      cw = widths[i] * w;
      out += R(px, y, cw, h, 0, (opt.fills && opt.fills[i]) || FSH_C.cell, null, null, null);
      px += cw;
    }
    var n = widths.length - 1, shown = opt.lines == null ? n : opt.lines;
    px = x;
    for (i = 0; i < n; i++) {
      px += widths[i] * w;
      u = clamp(shown - i, 0, 1);
      if (u > 0) out += L(px, y, px, y + h * u, FSH_C.ink, 4);
    }
    out += R(x, y, w, h, 0, "none", FSH_C.ink, 4);
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* the width of one part, measured under it: a line with a tick at each end.
     Four of these the same length is what "all the same size" looks like. */
  function fshWidth(x, w, y, o, col) {
    if (!(o > 0)) return "";
    var c = col || FSH_C.accent;
    return G(L(x + 7, y, x + w - 7, y, c, 4) +
      L(x + 7, y - 9, x + 7, y + 9, c, 4) + L(x + w - 7, y - 9, x + w - 7, y + 9, c, 4),
      { opacity: clamp(o, 0, 1) });
  }

  /* a fraction written the way a child writes it, on the film's dark stage */
  function fshGlyph(cx, cy, top, bottom, size, o, topCol, botCol) {
    if (!(o > 0)) return "";
    return G(Tx(cx, cy - size * 0.34, String(top), "lab", "middle", { "font-size": size, fill: topCol || P.ink }) +
      L(cx - size * 0.44, cy, cx + size * 0.44, cy, P.ink, Math.max(3, size * 0.07)) +
      Tx(cx, cy + size * 0.92, String(bottom), "lab", "middle", { "font-size": size, fill: botCol || P.ink }),
      { opacity: clamp(o, 0, 1) });
  }

  /* ART.fraction, nested in the film's space. A bar's card is 440 x 148 and a
     circle's 300 x 260 when the written fraction is left off (label: false),
     so the height follows from the width and the two never stretch. */
  function fshFracBar(x, y, w, parts, shaded, colour) {
    var s = ART.fraction({ shape: "bar", parts: parts, shaded: shaded, colour: colour || "teal", label: false });
    return ART.place(s, x, y, w, w * 148 / 440);
  }
  function fshFracCircle(x, y, w, parts, shaded, colour) {
    var s = ART.fraction({ shape: "circle", parts: parts, shaded: shaded, colour: colour || "teal", label: false });
    return ART.place(s, x, y, w, w * 260 / 300);
  }
  /* where a bar drawn by fshFracBar actually starts, ends and sits: its card
     is 440 wide and the bar inside it runs from 22 to 418, 22 to 126 down. */
  function fshBarBox(x, y, w) {
    var k = w / 440;
    return { x0: x + 22 * k, x1: x + 418 * k, y0: y + 22 * k, y1: y + 126 * k, cw: (418 - 22) * k };
  }

  /* ==== the title ===============================================================
     The lesson's own opening (its warm-up question, verbatim in
     fair-shares.html): a sandwich cut into two parts the same size. Two
     bread halves part on "two parts", a width under each shows they match on
     "are equal", one is picked out on "a fraction needs" (its bread turns
     teal), and the written half arrives with it. On the two cards it simply
     stands, cut and one half taken. */
  function fshSandwichMotif(t, o) {
    var cx = 180, cy = 166, w = 224, h = 118, out = "";
    var scene = o.scene;
    var cSandwich = scene ? sc(scene, 0, "sandwich") : null;
    var cTwo = scene ? sc(scene, 0, "two") : null;
    var cFair = scene ? sc(scene, 1, "fair") : null;
    var cEqual = scene ? sc(scene, 1, "equal") : null;
    var cFrac = scene ? sc(scene, 1, "fraction") : null;

    /* the card version: cut, one half taken, the written half under it */
    var appear = scene ? popIn(t, cSandwich, 0.5) : 1;
    var split = scene ? on(t, cTwo, 0.6) : 1;
    var take = scene ? on(t, cFrac, 0.5) : 1;
    var gap = 9 * split;

    if (!(appear > 0)) return '<svg viewBox="0 0 360 360" role="img" aria-label="A sandwich cut into two equal parts"></svg>';

    var halfW = w / 2;
    /* each half: a slice of bread with a filling stripe, so it reads as a
       sandwich rather than a plain block */
    function half(side, fill) {
      var s = side < 0 ? -1 : 1;
      var hx = cx + s * gap + (s < 0 ? -halfW : 0), hy = cy - h / 2;
      return R(hx, hy, halfW, h, 16, fill, FSH_C.ink, 4) +
        R(hx + 8, hy + h * 0.36, halfW - 16, h * 0.24, 6, FSH_C.good, null, null, null);
    }
    out += G(half(-1, take > 0.5 ? FSH_C.teal : FSH_C.goldSoft) + half(1, FSH_C.goldSoft),
      { transform: around(cx, cy, appear), opacity: Math.min(1, appear) });

    /* the two widths, the same length, under the two halves */
    if (scene && cEqual != null) {
      var eo = on(t, cEqual, 0.5);
      out += fshWidth(cx - halfW - gap, halfW, cy + h / 2 + 26, eo, FSH_C.accent);
      out += fshWidth(cx + gap, halfW, cy + h / 2 + 26, eo, FSH_C.accent);
      out += MK.tick(cx, cy + h / 2 + 70, 20, popIn(t, cEqual == null ? null : cEqual + 0.5, 0.4));
    }
    /* "Fair means": the whole thing glows for a moment */
    if (scene) out += MK.glow(cx, cy, Math.max(halfW, h) * 1.5, P.gold, 0.9 * bump(t, cFair, 1.1));
    /* the written half */
    out += fshGlyph(328, 104, 1, 2, 44, scene ? popIn(t, cFrac, 0.45) : 1, FSH_C.teal, P.ink);
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A sandwich cut into two equal parts, one part taken">' + out + "</svg>";
  }
  function titleMotif(o) { return fshSandwichMotif(o.t || 0, o || {}); }

  /* ==== chapter: equal parts first ==============================================
     Two bars, one above the other, the same length. The top one is cut into
     four parts the same size and the widths under it are the same; the bottom
     one is cut into four parts that are not, and the widths under it are not.
     One is quarters and gets a tick, the other is not and gets a cross. */
  var FSH_EQ = { x: 150, w: 560, yA: 60, yB: 252, h: 100 };
  var FSH_UNEVEN = [0.45, 0.2, 0.2, 0.15];

  function fshEqualChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cBar = c(0, "bar"), cCut = c(0, "cut"), cFour = c(0, "four");
    var cSame = c(1, "same"), cQuarters = c(1, "quarters");
    var cLook = c(2, "look"), cWider = c(2, "wider");
    var cFourB = c(3, "four"), cNotEqual = c(3, "notequal"), cNone = c(3, "none");
    var E = FSH_EQ, out = "";

    /* --- the equal bar ----------------------------------------------------- */
    var barO = popIn(t, cBar, 0.5);
    var lines = cCut == null || t < cCut ? 0 : tally(t, cCut, 3, 0.9);
    var even = [0.25, 0.25, 0.25, 0.25];
    /* each quarter lights in turn as "all the same size" is said */
    var litA = cSame == null || t < cSame ? 0 : tally(t, cSame, 4, 1.0);
    var fillsA = [null, null, null, null], k;
    for (k = 0; k < 4; k++) fillsA[k] = k < litA ? FSH_C.tealSoft : null;

    out += fshCard(E.x - 26, E.yA - 26, E.w + 52, E.h + 82, barO);
    out += fshBar(E.x, E.yA, E.w, E.h, even, { fills: fillsA, lines: lines, o: barO });
    /* the width of every part, the same four times */
    for (k = 0; k < 4; k++) {
      out += fshWidth(E.x + k * E.w / 4, E.w / 4, E.yA + E.h + 30,
        on(t, cSame == null ? null : cSame + k * 0.24, 0.35), FSH_C.teal);
    }
    /* "four parts": each of the four lights for a moment as the word is said */
    for (k = 0; k < 4; k++) {
      var fo4 = bump(t, cFour == null ? null : cFour + k * 0.14, 0.5);
      if (fo4 > 0) out += R(E.x + k * E.w / 4, E.yA, E.w / 4, E.h, 0, P.gold, null, null, { opacity: 0.3 * fo4 });
    }
    /* quarters: a tick and the word */
    var qo = popIn(t, cQuarters, 0.4);
    out += MK.tick(790, E.yA + E.h / 2, 26, qo);
    out += MK.pill(836, E.yA + E.h / 2, "quarters", Math.min(1, qo), { size: 30, anchor: "start", col: P.good });

    /* --- the bar that is not equal ------------------------------------------ */
    var bO = on(t, cLook, 0.5);
    var litB = cNotEqual == null || t < cNotEqual ? 0 : 1;
    var fillsB = [litB ? FSH_C.badSoft : null, null, null, null];
    out += fshCard(E.x - 26, E.yB - 26, E.w + 52, E.h + 82, bO);
    out += fshBar(E.x, E.yB, E.w, E.h, FSH_UNEVEN, { fills: fillsB, o: bO });
    /* the widest piece, ringed as it is named */
    var wo = on(t, cWider, 0.45);
    if (wo > 0) out += R(E.x - 4, E.yB - 4, FSH_UNEVEN[0] * E.w + 8, E.h + 8, 4, "none", P.gold, 5,
      { opacity: wo * (0.7 + 0.3 * breathe(t)) });
    /* the four widths under it, which are plainly not the same */
    var px = E.x;
    for (k = 0; k < 4; k++) {
      out += fshWidth(px, FSH_UNEVEN[k] * E.w, E.yB + E.h + 30,
        on(t, cWider == null ? null : cWider + 0.15 + k * 0.2, 0.35), FSH_C.bad);
      px += FSH_UNEVEN[k] * E.w;
    }
    /* counted: four pieces, and still not quarters */
    var cnt = cFourB == null || t < cFourB ? 0 : tally(t, cFourB, 4, 0.7);
    px = E.x;
    for (k = 0; k < 4; k++) {
      if (k < cnt) out += MK.pop(Tx(px + FSH_UNEVEN[k] * E.w / 2, E.yB + E.h / 2 + 13, String(k + 1), "lab", "middle",
        { "font-size": 38, fill: FSH_C.ink }), px + FSH_UNEVEN[k] * E.w / 2, E.yB + E.h / 2, popIn(t, cFourB == null ? null : cFourB + k * 0.17, 0.3));
      px += FSH_UNEVEN[k] * E.w;
    }
    var no = popIn(t, cNone, 0.4);
    out += MK.cross(790, E.yB + E.h / 2, 26, no);
    out += MK.pill(836, E.yB + E.h / 2, "not quarters", Math.min(1, no), { size: 30, anchor: "start", col: P.bad });
    return svg(out);
  }

  /* ==== chapter: top number, bottom number ======================================
     The lesson's own bar of four parts on the left and the written fraction on
     the right. The bottom number is named and the four parts count themselves
     off under the bar; the top number is named and the parts shade, one, two,
     three. */
  var FSH_NM = { x: 60, y: 118, w: 600 };

  function fshNamingChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cTwo = c(0, "two"), cThree = c(0, "three");
    var cBottom = c(1, "bottom"), cParts = c(1, "parts");
    var cTop = c(2, "top"), cTake = c(2, "take");
    var cShade = c(3, "shade"), cDone = c(3, "done");
    var N = FSH_NM, box = fshBarBox(N.x, N.y, N.w), out = "", k;

    var shaded = cShade == null || t < cShade ? 0 : tally(t, cShade, 3, 1.1);
    out += fshFracBar(N.x, N.y, N.w, 4, shaded, "teal");

    /* the four parts count themselves off, under the bar */
    var cnt = cParts == null || t < cParts ? 0 : tally(t, cParts, 4, 1.0);
    for (k = 0; k < 4; k++) {
      if (k >= cnt) continue;
      var cx = box.x0 + (k + 0.5) * box.cw / 4;
      out += MK.pop(Tx(cx, box.y1 + 46, String(k + 1), "lab", "middle", { "font-size": 34, fill: P.gold }),
        cx, box.y1 + 36, popIn(t, cParts == null ? null : cParts + k * 0.22, 0.3));
    }

    /* the written fraction, and the two numbers named one at a time */
    var glyphO = popIn(t, cThree, 0.5);
    /* gold marks the number being NAMED, and only while it is: on the beat
       after, the bottom number goes back to white so the top is the one thing
       being pointed at. */
    var botNow = on(t, cBottom, 0.4) * fshOnly(t, scene, 1);
    var topNow = on(t, cTop, 0.4) * fshOnly(t, scene, 2);
    var gx = 790, gy = 186;
    out += fshGlyph(gx, gy, 3, 4, 84, Math.max(glyphO, on(t, cTwo, 0.5)),
      topNow > 0.5 ? P.gold : P.ink, botNow > 0.5 ? P.gold : P.ink);
    /* the bottom number, and a line from it to the bar it counts */
    if (cBottom != null && t >= cBottom) {
      out += MK.leader(gx - 46, gy + 78, box.x1 + 16, box.y1 - 10, on(t, cBottom, 0.7), P.gold);
      out += MK.pill(858, gy + 92, "how many equal parts", on(t, cParts, 0.4), { size: 23, anchor: "start", col: P.gold });
    }
    if (cTop != null && t >= cTop) {
      out += MK.pill(858, gy - 60, "how many you take", on(t, cTake, 0.4), { size: 23, anchor: "start", col: P.gold });
    }
    /* "Three quarters." - the three shaded parts and the written three agree */
    var done = popIn(t, cDone, 0.4);
    out += MK.tick(gx, 372, 24, done);
    return svg(out);
  }
