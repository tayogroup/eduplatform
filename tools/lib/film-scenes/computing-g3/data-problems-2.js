  /* ==== Data Problems, part 2 ==================================================
     The two chapters about what is being collected: "Discrete and categorical"
     (the lesson's two forms, recorded on the kit's own tablet) and "Named or
     numerical" (the part the Cambridge arm added to LESSON["lecture"]).

     The tablet is ART.figure("tablet") - the lesson's own drawing of a
     computing device, which is what 3MD.03 is about - with its screen painted
     over and the lesson's form drawn on it. Every count in the running table
     comes from DP_PETS and DP_FAV in part 1, and so do the sum and the ordered
     list in the second chapter, so no figure in this film is typed twice. */

  /* ---- the kit's tablet, running the lesson's form ---------------------------- */

  var DP_TAB = { x: 40, y: 14, w: 283.4, h: 412 };
  /* the screen, in the film's space: the figure's own 36,44 188x270 box, scaled */
  var DP_SCR = {
    x: DP_TAB.x + 36 * DP_TAB.w / 260, y: DP_TAB.y + 44 * DP_TAB.h / 378,
    w: 188 * DP_TAB.w / 260, h: 270 * DP_TAB.h / 378
  };

  var DP_FORM = {
    pets: { ask: ["How many pets", "do you have?"], opts: ["pets", "pet", "pets", "or more"], pics: null, tapped: 1 },
    fav: { ask: ["Which pet would", "you most like?"], opts: ["cat", "dog", "fish", "rabbit"], pics: ["\u{1F431}", "\u{1F436}", "\u{1F41F}", "\u{1F430}"], tapped: 0 }
  };
  function dpOptY(j) { return DP_SCR.y + 80 + j * 52; }

  /* the form on the screen: the question, four options, and the one tapped */
  function dpFormFace(which, askO, optsO, tapP, t, tapAt) {
    var f = DP_FORM[which], out = "";
    var cx = DP_SCR.x + DP_SCR.w / 2;
    if (askO > 0) {
      out += Tx(cx, DP_SCR.y + 30, f.ask[0], "lab small", "middle", { opacity: askO });
      out += Tx(cx, DP_SCR.y + 52, f.ask[1], "lab small", "middle", { opacity: askO });
    }
    var got = tally(t, optsO.at, 4, 0.7);
    for (var j = 0; j < got; j++) {
      var y = dpOptY(j), lit = j === f.tapped && tapP > 0;
      out += R(DP_SCR.x + 12, y, DP_SCR.w - 24, 44, 11, lit ? "#1B3A52" : P.cell, lit ? P.gold : P.line, lit ? 3 : 2);
      if (f.pics) out += Em(DP_SCR.x + 38, y + 23, 26, f.pics[j]);
      else out += Tx(DP_SCR.x + 38, y + 31, String(j), "lab big", "middle", { fill: P.teal });
      out += Tx(DP_SCR.x + 62, y + 30, f.opts[j], "lab mid", "start");
    }
    if (tapP > 0) {
      var ty = dpOptY(f.tapped) + 22;
      out += MK.ripple(DP_SCR.x + DP_SCR.w / 2, ty, t, tapAt, P.gold);
      out += MK.finger(DP_SCR.x + DP_SCR.w - 34, ty + 2, Math.min(1, tapP));
    }
    return out;
  }

  /* the device itself: the kit's drawing with its screen blanked. The form is
     drawn separately, so the two forms can be swapped on the screen with their
     own opacities and neither is ever half-drawn over the other. */
  function dpTablet(o, ringO) {
    if (!(o > 0)) return "";
    var fig = ART.figure("tablet");
    if (ringO > 0) fig = ART.ring(fig, "screen", P.gold, 6);
    return G(ART.place(fig, DP_TAB.x, DP_TAB.y, DP_TAB.w, DP_TAB.h) +
      R(DP_SCR.x, DP_SCR.y, DP_SCR.w, DP_SCR.h, 7, P.ground),
      { opacity: clamp(o, 0, 1) });
  }

  /* ---- the running table ------------------------------------------------------ */

  var DP_TBL = { x: 720, y: 90, w: 420, h: 336 };
  function dpRunningTable(set, o, labelsAt, valuesAt, t) {
    if (!(o > 0)) return "";
    var x = DP_TBL.x, y = DP_TBL.y, w = DP_TBL.w;
    var out = dpCard(x, y, w, DP_TBL.h, 1, P.plum);
    out += Tx(x + w / 2, y + 44, set.title, "lab big", "middle");
    out += Tx(x + 30, y + 80, set.col, "lab mid muted", "start");
    out += Tx(x + w - 30, y + 80, set.val, "lab mid muted", "end");
    out += L(x + 24, y + 94, x + w - 24, y + 94, P.line, 2);
    var rows = tally(t, labelsAt, set.rows.length, 0.8);
    var vals = tally(t, valuesAt, set.rows.length, 1.0);
    set.rows.forEach(function (r, k) {
      if (k >= rows) return;
      var ry = y + 120 + k * 48;
      out += Tx(x + 30, ry, r.label, "lab", "start");
      if (k < vals) out += Tx(x + w - 30, ry, String(r.v), "lab big gold", "end");
    });
    if (vals >= set.rows.length) {
      var ty = y + 120 + set.rows.length * 48 + 6;
      out += L(x + 24, ty - 26, x + w - 24, ty - 26, P.line, 2);
      out += Tx(x + 30, ty, "total", "lab mid muted", "start");
      out += Tx(x + w - 30, ty, String(dpTotal(set)), "lab big", "end");
    }
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* ---- the middle column: what kind of data this is ---------------------------- */

  var DP_MID = { x: 360, y: 90, w: 340 };
  /* discrete: the whole numbers, and the answer that does not exist */
  function dpDiscretePanel(t, cWhole, cNever, cHalf) {
    var out = "", got = tally(t, cWhole, 4, 0.7);
    for (var j = 0; j < got; j++) {
      out += R(368 + j * 84, 190, 72, 64, 14, P.cell, P.teal, 2.5);
      out += Tx(404 + j * 84, 234, DP_PETS.rows[j].short, "lab big", "middle");
    }
    var n = popIn(t, cNever, 0.45);
    if (n > 0) {
      out += MK.pop(R(400, 292, 200, 60, 14, P.cell, P.bad, 3) +
        Tx(500, 332, "1 and a half", "lab", "middle"), 500, 322, n);
      /* the cross lands with the box, not on "half a cat" at the end of the
         line: the wrong case must be MARKED wrong for the whole time it is up */
      out += MK.cross(632, 322, 28, popIn(t, cNever == null ? null : cNever + 0.5, 0.4));
      out += Tx(530, 396, "no such answer", "lab mid bad", "middle",
        { opacity: Math.min(1, popIn(t, cHalf, 0.4)) });
    }
    return out;
  }
  /* categorical: the four categories the second form offers */
  function dpCategoryPanel(t, cCats) {
    var out = "", got = tally(t, cCats, 4, 0.8);
    for (var j = 0; j < got; j++) {
      var r = DP_FAV.rows[j];
      out += R(368 + j * 84, 190, 72, 104, 14, P.cell, P.plum, 2.5);
      out += Em(404 + j * 84, 228, 34, r.pic);
      out += Tx(404 + j * 84, 278, r.label, "lab small", "middle");
    }
    if (got > 0) out += Tx(530, 348, "a category,", "lab mid muted", "middle");
    if (got > 0) out += Tx(530, 378, "not a count", "lab mid muted", "middle");
    return out;
  }

  /* ==== chapter: discrete and categorical ========================================= */
  function dpTwoKindsChapter(scene, beat, t, i) {
    var cEight = sc(scene, 0, "eight"), cTablet = sc(scene, 0, "tablet"), cHow = sc(scene, 0, "howmany");
    var cDiscrete = sc(scene, 1, "discrete"), cWhole = sc(scene, 1, "whole");
    var cNever = sc(scene, 2, "never"), cHalf = sc(scene, 2, "half");
    var cSecond = sc(scene, 3, "second"), cLike = sc(scene, 3, "like"), cFour = sc(scene, 3, "four");
    var cCats = sc(scene, 4, "categories"), cCatWord = sc(scene, 4, "categorical");
    var cForm = sc(scene, 5, "form"), cCounted = sc(scene, 5, "counted");
    var out = "";

    /* the eight children who answered */
    var kids = tally(t, cEight, 8, 0.9);
    for (var k = 0; k < kids; k++) out += Em(540 + k * 76, 44, 36, "\u{1F9D2}");
    out += MK.pill(366, 44, "8 children", on(t, cEight, 0.5),
      { size: 22, anchor: "start", col: P.teal, ink: P.teal });

    /* The device, and the form on it. THE SWAP WAITS FOR cLike, NOT cSecond:
       the second question is announced ("The second question:") a second and a
       half before it is asked, and switching the screen on the announcement
       left the tablet blank for the whole of that phrase. The tablet's own
       outline flashes on cSecond instead, so the words still move something,
       and the form, the panel and the table all change together on "which pet
       would you most like". dpOut/dpIn (part 1) take the old one away before
       the new one arrives, so no two of them are ever drawn on top of each
       other. */
    var so = dpOut(t, cLike), si = dpIn(t, cLike);
    var ring = Math.max(bump(t, cTablet, 1.4), bump(t, cSecond, 1.2), bump(t, cForm, 1.6));
    out += dpTablet(on(t, cTablet, 0.5), ring);
    if (so > 0) out += G(dpFormFace("pets", on(t, cHow, 0.45), { at: cHow },
      popIn(t, cWhole, 0.4), t, cWhole), { opacity: so });
    if (si > 0) out += G(dpFormFace("fav", 1, { at: cFour }, popIn(t, cForm, 0.4), t, cForm),
      { opacity: si });

    /* the kind of data, named */
    out += MK.pill(530, 130, "discrete", popIn(t, cDiscrete, 0.45) * so,
      { size: 26, col: P.teal, ink: P.teal });
    out += MK.pill(530, 130, "categorical", popIn(t, cCatWord, 0.45), { size: 26, col: P.plum, ink: P.plum });
    if (so > 0) out += G(dpDiscretePanel(t, cWhole, cNever, cHalf), { opacity: so });
    if (si > 0) out += G(dpCategoryPanel(t, cCats), { opacity: si });

    /* the table the form is filling in */
    if (so > 0) out += G(dpRunningTable(DP_PETS, 1, cWhole, cWhole, t), { opacity: so });
    if (si > 0) out += G(dpRunningTable(DP_FAV, 1, cLike == null ? null : cLike + 0.3, cCounted, t),
      { opacity: si });
    return svg(out);
  }

  /* ==== chapter: named or numerical ===============================================
     The lecture part the Cambridge arm added: some data is a name you can only
     count, some is a number you can add up and put in order. Both sides use the
     lesson's own figures - four cats and two dogs on the left, the four pet
     counts added and sorted on the right. */

  var DP_NAMED = [
    { swatch: "#E9744F", label: "red" },
    { swatch: "#6E9DE8", label: "blue" },
    { pic: "\u{1F436}", label: "dog" },
    { pic: "\u{1F431}", label: "cat" },
    { pic: "\u{1F68C}", label: "came by bus" }
  ];
  var DP_NUM = [
    { pic: "\u{1F522}", label: "how many pets" },
    { pic: "\u{1F4CF}", label: "how tall" },
    { pic: "⏱️", label: "how many minutes" }
  ];
  /* the two sentences on the right, computed from the lesson's own pet counts */
  /* The counts in the pets table, added up and put in order. They are CHILDREN,
     and the sum says so: 2 + 3 + 2 + 1 is the eight children of that table, the
     same total its own bottom row shows - not a number of pets, which this
     lesson never totals. */
  var DP_SUM = DP_PETS.rows.map(function (r) { return r.v; }).join(" + ") + " = " +
    dpTotal(DP_PETS) + " " + DP_PETS.val;
  var DP_ORDER = "in order: " + DP_PETS.rows.map(function (r) { return r.v; })
    .sort(function (a, b) { return a - b; }).join(", ");
  var DP_COUNTS = DP_FAV.rows[0].v + " cats, " + DP_FAV.rows[1].v + " dogs";

  function dpNameCard(x, y, item, o) {
    if (!(o > 0)) return "";
    var out = R(x, y, 160, 74, 14, P.cell, P.line, 2);
    if (item.swatch) out += R(x + 16, y + 22, 30, 30, 8, item.swatch, P.line, 2);
    else out += Em(x + 31, y + 37, 30, item.pic);
    out += Tx(x + 54, y + 44, item.label, "lab small", "start");
    return MK.pop(out, x + 80, y + 37, o);
  }

  function dpNamedChapter(scene, beat, t, i) {
    var cName = sc(scene, 0, "name"), cEx = sc(scene, 0, "examples");
    var cCannot = sc(scene, 1, "cannot"), cCount = sc(scene, 1, "count");
    var cNum = sc(scene, 2, "numerical"), cNumber = sc(scene, 2, "number");
    var cHow = sc(scene, 3, "howmany"), cAdded = sc(scene, 3, "added");
    var out = "", right = on(t, cNum, 0.6);

    /* a name: a thing you can only count how many of */
    var lo = on(t, cName, 0.5);
    out += G(dpCard(40, 30, 520, 384, lo, right > 0 ? null : P.gold) +
      Tx(300, 70, "A NAME", "lab big gold", "middle", { opacity: lo }), { opacity: 1 });
    var got = tally(t, cEx, 5, 1.0);
    DP_NAMED.forEach(function (item, k) {
      if (k >= got) return;
      out += dpNameCard(k < 3 ? 50 + k * 170 : 135 + (k - 3) * 170, k < 3 ? 90 : 172, item, 1);
    });
    var cn = popIn(t, cCannot, 0.45);
    if (cn > 0) {
      out += MK.pop(Em(190, 292, 42, "\u{1F431}") + Tx(232, 304, "+", "lab big muted", "middle") +
        Em(274, 292, 42, "\u{1F436}") + Tx(318, 304, "=", "lab big muted", "middle") +
        Tx(352, 304, "?", "lab big bad", "middle"), 270, 292, cn);
      out += MK.cross(420, 292, 26, popIn(t, cCannot == null ? null : cCannot + 0.4, 0.4));
      out += Tx(300, 348, "you cannot add them up", "lab mid bad", "middle", { opacity: Math.min(1, cn) });
    }
    out += Tx(300, 392, DP_COUNTS, "lab big good", "middle", { opacity: Math.min(1, popIn(t, cCount, 0.45)) });

    /* numerical: a number you counted or measured */
    out += dpCard(608, 30, 520, 384, right, right > 0 ? P.blue : null);
    out += Tx(868, 70, "NUMERICAL", "lab big", "middle", { fill: P.blue, opacity: right });
    out += MK.pill(868, 112, "a number you counted or measured", popIn(t, cNumber, 0.5),
      { size: 19, col: P.blue, ink: P.blue });
    var gotN = tally(t, cHow, 3, 0.8);
    DP_NUM.forEach(function (item, k) {
      if (k >= gotN) return;
      var x = 618 + k * 170;
      out += MK.pop(R(x, 150, 160, 80, 14, P.cell, P.blue, 2.5) + Em(x + 80, 180, 30, item.pic) +
        Tx(x + 80, 216, item.label, "lab small", "middle"), x + 80, 190, 1);
    });
    var ad = popIn(t, cAdded, 0.45);
    out += Tx(868, 300, DP_SUM, "lab big", "middle", { opacity: Math.min(1, ad) });
    out += Tx(868, 336, "you can add counts up", "lab mid muted", "middle", { opacity: Math.min(1, ad) });
    out += Tx(868, 388, DP_ORDER, "lab big", "middle",
      { opacity: Math.min(1, popIn(t, cAdded == null ? null : cAdded + 0.5, 0.45)) });
    return svg(out);
  }
