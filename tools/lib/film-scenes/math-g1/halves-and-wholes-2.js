  /* ==== Halves and Wholes, part 2 ==============================================
     The chapters "Colour one half" (1Nf.02, a shape) and "Half of a group"
     (1Nf.02, a set of objects). See halves-and-wholes.js for the file's rules.

     Both circles here are ART.fraction({shape: "circle", parts: 2}), so the two
     parts are two 180 degree sectors and cannot be drawn unequal. The film
     overlays its own marks on them in film coordinates: the drawing is nested
     1:1 by ART.place, so a point (x, y) inside the 300 x 260 card is at
     (card x + x, card y + y) on the stage. */

  /* the two circles of "Colour one half", nested 1:1 */
  var HW_CA = { x: 160, y: 45, w: 300, h: 260, cx: 310, cy: 175, r: 104 };
  var HW_CB = { x: 620, y: 45, w: 300, h: 260, cx: 770, cy: 175, r: 104 };

  function hwFracCircle(box, shaded) {
    return ART.place(ART.fraction({ shape: "circle", parts: 2, shaded: shaded, label: false, colour: "teal" }),
      box.x, box.y, box.w, box.h);
  }

  function hwOneHalfChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cCircle = c(0, "circle"), cTwoParts = c(0, "twoparts");
    var cOne = c(1, "one"), cStop = c(1, "stop"), cAHalf = c(1, "ahalf");
    var cOneOf = c(2, "oneof"), cNotBoth = c(2, "notboth");
    var cBothParts = c(3, "bothparts"), cEvery = c(3, "every");
    var cNotHalf = c(4, "nothalf"), cWholeShape = c(4, "wholeshape");
    var out = "";

    /* ---- circle A: one part coloured ---- */
    var pa = popIn(t, cCircle, 0.45);
    if (pa > 0) {
      var shadedA = (cOne != null && t >= cOne) ? 1 : 0;
      out += G(hwFracCircle(HW_CA, shadedA),
        { transform: around(HW_CA.cx, HW_CA.cy, Math.min(pa, 1.08)), opacity: Math.min(1, pa) });
      /* "two equal parts": one bar under each part, both 94 long */
      var tw = on(t, cTwoParts, 0.6);
      out += hwBar(HW_CA.cx - HW_CA.r + 4, HW_CA.cx - 10, HW_CA.cy + HW_CA.r + 34, tw, P.gold);
      out += hwBar(HW_CA.cx + 10, HW_CA.cx + HW_CA.r - 4, HW_CA.cy + HW_CA.r + 34, tw, P.gold);
      /* the tap that colours ONE part: the right half of the circle */
      out += MK.ripple(HW_CA.cx + HW_CA.r * 0.5, HW_CA.cy, t, cOne, P.gold);
      /* "and then stop": the other part is left alone, outlined and empty */
      var st = on(t, cStop, 0.5) * (1 - on(t, hwAfter(cBothParts, -0.2), 0.5));
      if (st > 0) out += Pth(hwSemiPath(HW_CA.cx, HW_CA.cy, HW_CA.r - 5, -1), "none", P.muted, 4,
        { "stroke-dasharray": "11 9", opacity: st * (0.55 + 0.45 * breathe(t)) });
      /* "One of two equal parts is one half" */
      out += MK.tick(HW_CA.cx + 192, 96, 26, popIn(t, cOneOf, 0.4));
      /* "One part, not both": the empty half asks to be left empty */
      var nb = bump(t, cNotBoth, 1.2);
      if (nb > 0) out += Pth(hwSemiPath(HW_CA.cx, HW_CA.cy, HW_CA.r - 5, -1), P.muted, null, null, { opacity: 0.22 * nb });
      out += MK.pill(HW_CA.cx, 358, "one half", on(t, cAHalf, 0.45), { size: 32, col: P.teal, ink: P.teal });
    }

    /* ---- circle B: both parts coloured, which is the whole shape ---- */
    var pb = popIn(t, cBothParts, 0.45);
    if (pb > 0) {
      out += G(hwFracCircle(HW_CB, 2),
        { transform: around(HW_CB.cx, HW_CB.cy, Math.min(pb, 1.08)), opacity: Math.min(1, pb) });
      out += MK.ripple(HW_CB.cx + HW_CB.r * 0.5, HW_CB.cy, t, cBothParts, P.gold);
      out += MK.ripple(HW_CB.cx - HW_CB.r * 0.5, HW_CB.cy, t, hwAfter(cBothParts, 0.35), P.gold);
      /* "every bit of the circle": a ring closes round the whole shape */
      var ev = on(t, cEvery, 0.7);
      if (ev > 0) out += C(HW_CB.cx, HW_CB.cy, HW_CB.r + 13, "none", P.gold, 5,
        { "stroke-dasharray": n2(2 * Math.PI * (HW_CB.r + 13) * ev) + " 9999", transform: "rotate(-90 " + HW_CB.cx + " " + HW_CB.cy + ")" });
      out += MK.cross(HW_CB.cx + 176, 96, 26, popIn(t, cNotHalf, 0.4));
      out += MK.pill(HW_CB.cx, 358, "the whole shape", on(t, cWholeShape, 0.45), { size: 30, col: P.accent, ink: P.accent });
    }
    return svg(out);
  }

  /* ==== chapter: half of a group (1Nf.02, a set) ================================
     The lesson's own first group (SETS4: six apples) dealt onto its two plates
     one at a time, exactly as the lesson's explain describes: "Deal them out one
     at a time, like cards... Three on each plate. So half of six is three."
     Apple i goes to plate i % 2, so the plates take turns and neither can run
     ahead; three land on each because six is shared alternately between two. */
  var HW_APPLES = 6;
  var HW_POOL_Y = 100, HW_PLATE_Y = 288, HW_ON_PLATE_Y = 254;
  var HW_PLATE_X = [370, 798];
  var HW_CLUSTER = [[-52, -34], [36, -46], [88, 18], [-16, 30], [-74, 26], [52, 44]];

  function hwPoolX(k) { return 344 + k * 96; }
  function hwPlateSlot(k) { return HW_PLATE_X[k % 2] + (Math.floor(k / 2) - 1) * 88; }

  function hwPlate(cx, o, full) {
    if (!(o > 0)) return "";
    return G(E(cx, HW_PLATE_Y, 152, 34, "#1C4A5E", full > 0 ? P.good : P.line, 4) +
      E(cx, HW_PLATE_Y - 4, 118, 22, "#24506B"), { opacity: clamp(o, 0, 1) });
  }

  function hwGroupChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cShapes = c(0, "shapes"), cPile = c(0, "pile");
    var cSix = c(1, "six"), cPlates = c(1, "plates"), cGuess = c(1, "guess");
    var cDeal = c(2, "deal"), cOneTime = c(2, "onetime"), cEmpty = c(2, "empty");
    var cThree = c(3, "three"), cSame = c(3, "plsame");
    var cHalfSix = c(4, "halfsix"), cLeftOut = c(4, "leftout");
    var out = "";

    /* "Half is not only for shapes": the halved circle of the chapters before */
    var sh = on(t, cShapes, 0.5) * (1 - on(t, cSix, 0.5));
    if (sh > 0) out += hwHalvedCircle(350, 214, 78, 1, 0, 0, sh, P.teal);

    /* the apples: a heap on "a pile of things", a neat row on "six apples",
       then one at a time onto the plates */
    var start = hwAfter(cOneTime, 0.35);
    var rowU = on(t, cSix, 0.6), pileP = popIn(t, cPile, 0.5);
    for (var k = 0; k < HW_APPLES; k++) {
      if (pileP <= 0) break;
      var hx = 800 + HW_CLUSTER[k][0], hy = 214 + HW_CLUSTER[k][1];
      var px = lerp(hx, hwPoolX(k), rowU), py = lerp(hy, HW_POOL_Y, rowU);
      var land = start == null ? null : start + k * 0.40;
      var fu = land == null ? 0 : clamp((t - land) / 0.42, 0, 1);
      var ax = lerp(px, hwPlateSlot(k), ease(fu));
      var ay = lerp(py, HW_ON_PLATE_Y, ease(fu)) - Math.sin(Math.PI * fu) * 44;
      out += G(Em(ax, ay, 58, "\u{1F34E}"), { opacity: Math.min(1, pileP) });
      /* counted in the row, before they are dealt */
      var cnt = on(t, hwAfter(cSix, 0.25 + k * 0.12), 0.35) * (1 - (fu > 0 ? 1 : 0)) * (start == null ? 1 : clamp((start - t) * 2, 0, 1));
      if (cnt > 0.02) out += hwBadge(px, py + 56, String(k + 1), cnt, P.accent);
    }

    /* the two plates */
    var plateP = popIn(t, cPlates, 0.45);
    var done = start != null && t >= start + (HW_APPLES - 1) * 0.40 + 0.42;
    out += hwPlate(HW_PLATE_X[0], plateP, done ? 1 : 0);
    out += hwPlate(HW_PLATE_X[1], plateP, done ? 1 : 0);

    /* "Do not guess": a question mark over the plates, gone once dealing starts */
    var gu = popIn(t, cGuess, 0.4) * (1 - on(t, cDeal, 0.5));
    out += MK.qmark(584, 196, 30, gu);

    /* "Deal them out": one arrow to each plate, while the dealing lasts */
    var da = on(t, cDeal, 0.5) * (1 - on(t, cThree, 0.5));
    out += MK.arrow(520, 182, HW_PLATE_X[0] - 70, 210, da, P.gold, 6);
    out += MK.arrow(648, 182, HW_PLATE_X[1] + 70, 210, da, P.gold, 6);

    /* "Empty the pile", "nobody is left out": the pile's place, ticked */
    out += MK.tick(584, HW_POOL_Y, 26, popIn(t, cEmpty, 0.4));
    out += MK.tick(584, HW_POOL_Y, 26, popIn(t, cLeftOut, 0.4));

    /* "Three on each plate", and both the same */
    out += hwBadge(HW_PLATE_X[0], 346, "3", popIn(t, cThree, 0.4), P.good);
    out += hwBadge(HW_PLATE_X[1], 346, "3", popIn(t, hwAfter(cThree, 0.3), 0.4), P.good);
    out += MK.pill(584, 196, "the same", on(t, cSame, 0.45) * (1 - on(t, cHalfSix, 0.5)), { size: 28, col: P.good, ink: P.good });
    out += MK.pill(584, 404, "half of 6 is 3", on(t, cHalfSix, 0.45), { size: 34, col: P.gold, ink: P.gold });
    return svg(out);
  }
