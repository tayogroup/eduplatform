  /* ==== Data Problems, part 3 ==================================================
     The three views side by side, choosing one, and the recap.

     THE THREE VIEWS ARE ALL DRAWN FROM THE SAME ARRAY. dpViewTable, dpViewBars
     and dpViewPicto each take one of DP_PETS / DP_FAV and read r.v, so the
     number in the table, the height of the bar, the tick the bar reaches on the
     axis and the count of pictures in the pictogram are one figure drawn three
     ways. The axis runs 0 to dpMax(set) - 3 for the pets, 4 for the favourite -
     so the tallest bar always lands exactly on the top tick. The film's line
     "the three views never disagree" is therefore true of the drawing and not
     only of the words. */

  var DP_PX = [16, 400, 784], DP_PW = 368, DP_PY = 30, DP_PH = 396;

  function dpPanel(x, title, col, o) {
    if (!(o > 0)) return "";
    return G(dpCard(x, DP_PY, DP_PW, DP_PH, 1, col) +
      Tx(x + DP_PW / 2, DP_PY + 40, title, "lab big", "middle"), { opacity: clamp(o, 0, 1) });
  }

  /* ---- view one: the table, exact numbers ------------------------------------- */
  function dpViewTable(x, set, shown, hl, t) {
    var out = "";
    out += Tx(x + 28, DP_PY + 80, set.col, "lab mid muted", "start");
    out += Tx(x + DP_PW - 28, DP_PY + 80, set.val, "lab mid muted", "end");
    out += L(x + 24, DP_PY + 94, x + DP_PW - 24, DP_PY + 94, P.line, 2);
    set.rows.forEach(function (r, k) {
      if (k >= shown) return;
      var ry = DP_PY + 132 + k * 52, flash = hl(k);
      if (flash > 0) out += R(x + 18, ry - 32, DP_PW - 36, 44, 10, P.gold, null, null, { opacity: 0.20 * flash });
      out += Tx(x + 28, ry, r.label, "lab", "start");
      out += Tx(x + DP_PW - 28, ry, String(r.v), "lab big", "end", { fill: flash > 0.2 ? P.gold : P.ink });
    });
    if (shown >= set.rows.length) {
      out += L(x + 24, DP_PY + 336, x + DP_PW - 24, DP_PY + 336, P.line, 2);
      out += Tx(x + 28, DP_PY + 366, "total", "lab mid muted", "start");
      out += Tx(x + DP_PW - 28, DP_PY + 366, String(dpTotal(set)), "lab big", "end");
    }
    return out;
  }

  /* ---- view two: the bar chart, the biggest at a glance ------------------------
     The axis runs 0 to the biggest count in the set, one tick per whole child,
     so a bar of v children reaches the tick marked v. */
  function dpViewBars(x, set, grow, hl, t) {
    var base = DP_PY + 300, top = DP_PY + 96, max = dpMax(set), unit = (base - top) / max;
    var left = x + 70, right = x + DP_PW - 24, slot = (right - left) / set.rows.length;
    var out = L(left, top, left, base, P.line, 3) + L(left, base, right, base, P.line, 3);
    out += Tx(left, DP_PY + 80, set.val, "lab small muted", "start");
    for (var v = 0; v <= max; v++) {
      var ty = base - v * unit;
      out += L(left - 9, ty, left, ty, P.line, 2);
      out += Tx(left - 14, ty + 7, String(v), "lab mid muted", "end");
    }
    set.rows.forEach(function (r, k) {
      var cx = left + (k + 0.5) * slot, h = r.v * unit * grow, flash = hl(k);
      out += R(cx - 23, base - h, 46, h, 7, flash > 0.2 ? P.gold : P.teal);
      /* the count INSIDE the top of its own bar: above it, the tallest bar's
         label lands on the axis caption (measured at the cat bar, 4 of 4) */
      if (grow > 0.9) out += Tx(cx, base - h + 27, String(r.v), "lab big", "middle", { fill: P.ground });
      out += Em(cx, DP_PY + 328, 28, r.pic);
      out += Tx(cx, DP_PY + 358, r.short, "lab mid", "middle");
    });
    out += Tx(x + DP_PW / 2, DP_PY + 388, set.col, "lab small muted", "middle");
    return out;
  }

  /* ---- view three: the pictogram, one picture for each answer ------------------ */
  function dpViewPicto(x, set, shown, counts, hl, t) {
    var out = "";
    set.rows.forEach(function (r, k) {
      var ry = DP_PY + 96 + k * 70, flash = hl(k);
      if (flash > 0) out += R(x + 18, ry - 28, DP_PW - 36, 56, 10, P.gold, null, null, { opacity: 0.20 * flash });
      out += Tx(x + 24, ry + 8, r.label, "lab mid", "start");
      var n = Math.min(r.v, shown);
      for (var j = 0; j < n; j++) out += Em(x + 150 + j * 34, ry, 30, r.pic);
      if (counts > 0) out += Tx(x + DP_PW - 28, ry + 8, String(r.v), "lab big gold", "end",
        { opacity: Math.min(1, counts) });
    });
    out += Tx(x + DP_PW / 2, DP_PY + 382, "one picture = one answer", "lab small muted", "middle");
    return out;
  }

  /* ==== chapter: the same data, three ways ======================================== */
  function dpViewsChapter(scene, beat, t, i) {
    var cPet = sc(scene, 0, "petdata"), cThree = sc(scene, 0, "three");
    var cTable = sc(scene, 1, "table"), cTwo = sc(scene, 1, "two"), cThird = sc(scene, 1, "three");
    var cBar = sc(scene, 2, "bar"), cTallest = sc(scene, 2, "tallest");
    var cPicto = sc(scene, 3, "picto"), cCount = sc(scene, 3, "count");
    var cCats = sc(scene, 4, "categories"), cFour = sc(scene, 4, "four"), cTwoDog = sc(scene, 4, "two");
    var cDis = sc(scene, 5, "disagree"), cSame = sc(scene, 5, "same");

    /* The two sets swap CLEANLY (dpOut/dpIn, part 1) rather than crossfading:
       a crossfade drew both tables, both axes and both pictograms on top of
       each other for half a second, and the pictogram's first row read "0 pets"
       and "cat" at once. Each set also keeps its own row-flash function, so the
       one on its way out cannot borrow the other's cues. */
    var so = dpOut(t, cCats), si = dpIn(t, cCats);
    var fav = dpPast(t, cCats);
    var titles = ["Table", "Bar chart", "Pictogram"];
    var stage = dpPast(t, cPicto) ? 3 : dpPast(t, cBar) ? 2 : dpPast(t, cTable) ? 1 : 0;

    function col(k) {
      if (dpPast(t, cDis)) return P.good;
      if (fav || stage === k + 1) return P.accent;
      return null;
    }
    /* which row is flashing, in each set */
    function hlPets(k) {
      return Math.max(k === 0 ? bump(t, cTwo, 1.8) : 0, k === 1 ? bump(t, cThird, 1.8) : 0,
        k === dpTopRow(DP_PETS) ? bump(t, cTallest, 1.8) : 0);
    }
    function hlFav(k) {
      return Math.max(k === 0 ? bump(t, cFour, 1.8) : 0, k === 1 ? bump(t, cTwoDog, 1.8) : 0,
        k === dpTopRow(DP_FAV) ? bump(t, cCats, 1.2) : 0);
    }

    var out = "", appear = on(t, cPet, 0.5);
    /* the three empty panels, then each view as it is named */
    for (var k = 0; k < 3; k++) {
      out += dpPanel(DP_PX[k], "", col(k), appear);
      out += Tx(DP_PX[k] + DP_PW / 2, DP_PY + 40, titles[k], "lab big", "middle",
        { opacity: Math.min(1, on(t, cThree == null ? null : cThree + k * 0.14, 0.4)) });
    }

    function trio(s, r, g, p, c, hl) {
      return dpViewTable(DP_PX[0], s, r, hl, t) + dpViewBars(DP_PX[1], s, g, hl, t) +
        dpViewPicto(DP_PX[2], s, p, c, hl, t);
    }
    /* the pets, filling view by view as each is named */
    if (so > 0 && appear > 0.2)
      out += G(trio(DP_PETS, tally(t, cTable, DP_PETS.rows.length, 0.9), on(t, cBar, 0.9),
        tally(t, cPicto, dpMax(DP_PETS), 0.9), on(t, cCount, 0.5), hlPets), { opacity: so });
    /* the favourites, which arrive whole: the three views are built by then */
    if (si > 0)
      out += G(trio(DP_FAV, DP_FAV.rows.length, 1, dpMax(DP_FAV), 1, hlFav), { opacity: si });

    /* the three views never disagree: the same eight answers, three ways */
    for (var m = 0; m < 3; m++)
      out += MK.tick(DP_PX[m] + DP_PW - 36, DP_PY + 34, 20,
        popIn(t, cSame == null ? null : cSame + m * 0.18, 0.4));
    return svg(out);
  }

  /* ==== chapter: which view for which question? ===================================
     Three questions from the lesson's own view steps, each joined to the view
     that answers it fastest. The answers are read from the data, not typed:
     two children have 2 pets, and the favourite is whichever row is biggest. */

  var DP_ASK = [
    { q: "Exactly how many have 2 pets?", pic: "\u{1F4CB}", view: "Table" },
    { q: "Which pet is the favourite?", pic: "\u{1F4CA}", view: "Bar chart" },
    { q: "Count them by eye?", pic: "\u{1F431}", view: "Pictogram" }
  ];
  var DP_ROWY = [30, 165, 300], DP_ROWH = 112;

  function dpChooseChapter(scene, beat, t, i) {
    var cEach = sc(scene, 0, "each"), cDiff = sc(scene, 0, "different");
    var at = [
      { q: sc(scene, 1, "exactly"), v: sc(scene, 1, "table") },
      { q: sc(scene, 2, "which"), v: sc(scene, 2, "bar") },
      { q: sc(scene, 3, "eye"), v: sc(scene, 3, "picto") }
    ];
    var cInterp = sc(scene, 3, "interpret");
    var out = "";
    DP_ASK.forEach(function (a, k) {
      var y = DP_ROWY[k], cy = y + DP_ROWH / 2;
      var qo = popIn(t, cDiff == null ? null : cDiff + k * 0.16, 0.4);
      var vo = popIn(t, cEach == null ? null : cEach + k * 0.16, 0.4);
      var qLit = dpPast(t, at[k].q), vLit = dpPast(t, at[k].v);
      if (qo > 0) out += MK.pop(dpCard(40, y, 520, DP_ROWH, 1, qLit ? P.gold : null) +
        MK.qmark(84, cy, 22, 1) + Tx(124, cy + 8, a.q, "lab", "start"), 300, cy, qo);
      if (vo > 0) out += MK.pop(dpCard(700, y, 300, DP_ROWH, 1, vLit ? P.good : null) +
        Em(756, cy, 40, a.pic) + Tx(796, cy + 9, a.view, "lab big", "start"), 850, cy, vo);
      out += MK.leader(566, cy, 694, cy, on(t, at[k].v, 0.5), P.good);
    });
    /* the answers, read off the lesson's own counts */
    out += MK.pill(1008, DP_ROWY[0] + DP_ROWH / 2, String(DP_PETS.rows[2].v),
      popIn(t, at[0].v, 0.45), { size: 26, anchor: "start", col: P.good, ink: P.good });
    out += MK.pill(1008, DP_ROWY[1] + DP_ROWH / 2, DP_FAV.rows[dpTopRow(DP_FAV)].label,
      popIn(t, at[1].v, 0.45), { size: 26, anchor: "start", col: P.good, ink: P.good });
    var picto = tally(t, at[2].v, DP_FAV.rows[0].v, 0.7);
    for (var j = 0; j < picto; j++)
      out += Em(1002 + j * 28, DP_ROWY[2] + DP_ROWH / 2, 25, DP_FAV.rows[0].pic);
    for (var k2 = 0; k2 < 3; k2++)
      out += MK.tick(1136, DP_ROWY[k2] + DP_ROWH / 2, 16,
        popIn(t, cInterp == null ? null : cInterp + k2 * 0.16, 0.4));
    return svg(out);
  }

  /* ---- what you now know ---------------------------------------------------------
     The lesson's own six words, plus the two halves of solving a problem with
     data, in the order the recap says them. */
  /* Seven cards make each one 135 tall, and MK's own picture size (h x 0.44,
     centred at h x 0.36) then lands on the card's title. A picture may be a
     function, so each is drawn a little smaller and a little higher. */
  function dpRecapPic(ch) {
    return function (cx, cy, size) { return MK.pic(cx, cy - size * 0.15, size * 0.74, ch); };
  }
  var DP_RECAP = MK.recapKind([
    { beat: 0, at: "collect", title: "Collect", sub: "ask, or count", pic: dpRecapPic("\u{1F4DD}") },
    { beat: 0, at: "read", title: "Interpret", sub: "read what it says", pic: dpRecapPic("\u{1F50D}") },
    { beat: 1, at: "discrete", title: "Discrete", sub: "whole numbers you count", pic: dpRecapPic("\u{1F522}") },
    { beat: 1, at: "categorical", title: "Categorical", sub: "a category, not a count", pic: dpRecapPic("\u{1F3A8}") },
    { beat: 2, at: "table", title: "Table", sub: "the exact numbers", pic: dpRecapPic("\u{1F4CB}") },
    { beat: 2, at: "bar", title: "Bar chart", sub: "the biggest at a glance", pic: dpRecapPic("\u{1F4CA}") },
    { beat: 3, at: "picto", title: "Pictogram", sub: "one picture for each one", pic: dpRecapPic("\u{1F431}") }
  ], { goBeat: 3, goAt: "picto" });

  var KINDS = {
    title: MK.titleKind({ sub: ["Which problems counting can solve", "How a form records two kinds of data", "Three ways to show one set of data"] }),
    problems: dpProblemsChapter, twokinds: dpTwoKindsChapter, named: dpNamedChapter,
    views: dpViewsChapter, choose: dpChooseChapter, recap: DP_RECAP
  };
