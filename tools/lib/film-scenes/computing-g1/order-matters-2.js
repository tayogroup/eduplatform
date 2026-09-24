  /* ==== Order Matters, part 2: the sandwich, and finding the bug ==============
     tools/lib/film-scenes/computing-g1/order-matters-2.js. See the header of
     order-matters.js.

     Both chapters are the same shape: the algorithm as a numbered list on the
     left, and the lesson's own sandwich scene on the right, drawn from exactly
     that list. When the list goes wrong the scene goes wrong with it and the
     kit writes its own caption - "the filling is on TOP of the sandwich!" -
     so nothing here draws a mistake of its own. */

  var OM_R4 = { h: 76, gap: 14 };
  function omR4Y(k) { return 47 + k * (OM_R4.h + OM_R4.gap); }
  /* the layers of the kit's sandwich, from the plate up: where each one lands
     depends on the ids before it, so a film asks the drawing itself */
  function omLayerY(ids, id) {
    var y = 196;
    for (var k = 0; k < ids.length; k++) {
      if (ids[k] === "bread" || ids[k] === "top") y -= 22; else if (ids[k] === "cut" || ids[k] === "eat") continue; else y -= 12;
      if (ids[k] === id) return y + (ids[k] === "bread" || ids[k] === "top" ? 12 : 7);
    }
    return y;
  }

  /* ==== chapter: a sandwich in order ==============================================
     Four steps, read out one at a time and built one at a time. Then the top
     slice is put on before the jam - the SAME four steps, one moved - and the
     kit paints the jam over the top slice and says so itself. */
  var OM_SAND_ORDER = ["bread", "butter", "jam", "top"];

  function omSandwichChapter(scene, beat, t, i) {
    var cSand = sc(scene, 0, "sandwich"), cFour = sc(scene, 0, "four");
    var cBread = sc(scene, 1, "bread"), cButter = sc(scene, 1, "butter");
    var cJam = sc(scene, 2, "jam"), cTop = sc(scene, 2, "top");
    var cPlace = sc(scene, 3, "place"), cEarly = sc(scene, 3, "early");
    var cOutside = sc(scene, 4, "outside"), cFingers = sc(scene, 4, "fingers");
    var at = { bread: cBread, butter: cButter, jam: cJam, top: cTop };
    var out = "";

    /* the scene turns over WITH the rows, not half a second before them */
    var sw = on(t, cEarly, 0.7), swapped = sw >= 0.5;
    var nDone = 0;
    OM_SAND_ORDER.forEach(function (id) { if (omPast(t, at[id])) nDone++; });
    var ids = swapped ? ["bread", "butter", "top", "jam"] : OM_SAND_ORDER;

    /* the lesson's own scene, from exactly the list on the left */
    out += omSandwich(ids.slice(0, swapped ? 4 : nDone), on(t, cSand, 0.5));

    /* the slots that are still waiting, and then the steps themselves */
    var shown = tally(t, cFour, 4, 0.7);
    for (var k = nDone; k < 4; k++) if (k < shown) out += omSlot(OM_PANEL.x, omR4Y(k), OM_PANEL.w, OM_R4.h, k + 1, 1);
    OM_SAND_ORDER.forEach(function (id, k) {
      var o = on(t, at[id], 0.4);
      if (o <= 0) return;
      var slot = id === "jam" ? lerp(2, 3, sw) : id === "top" ? lerp(3, 2, sw) : k;
      var y = omR4Y(slot), live = ids[nDone - 1] === id && !swapped;
      out += omRow(OM_PANEL.x, y, OM_PANEL.w, OM_R4.h, Math.round(slot) + 1, id,
        { o: o, col: live || (swapped && id === "top") ? P.gold : null });
      out += MK.ripple(OM_PANEL.x + 38, y + OM_R4.h / 2, t, at[id], P.gold);
      /* "Every step has its place": each row lights in turn */
      var fl = bump(t, cPlace == null ? null : cPlace + k * 0.26, 0.55);
      if (fl > 0) out += R(OM_PANEL.x, y, OM_PANEL.w, OM_R4.h, OM_R4.h * 0.26, "none", P.gold, 5, { opacity: fl });
    });

    /* the jam ends up on the outside - the kit has already drawn it there */
    var os = on(t, cOutside, 0.5);
    if (os > 0) out += E(omSX(160), omSY(omLayerY(ids, "jam")), 132, 17, "none", P.bad, 5,
      { opacity: os, transform: around(omSX(160), omSY(omLayerY(ids, "jam")), 1 + 0.04 * breathe(t)) });
    var fg = popIn(t, cFingers, 0.4), fy = omSY(omLayerY(ids, "jam"));
    if (fg > 0) out += G(MK.finger(992, fy + 4, 1) + C(992, fy, 11, "#C4453A"),
      { opacity: Math.min(1, fg), transform: around(992, fy, 1.25) });
    return svg(out);
  }

  /* ==== chapter: finding the bug ===================================================
     Three pictures. A bug is a mistake: the word, big. Then a step that does
     not belong - milk, which the kit draws as a pale layer in the middle of a
     jam sandwich. Then a right step in the wrong place - the same four steps
     with the top slice too early, captioned by the kit itself. */
  var OM_MILK = ["bread", "milk", "jam", "top"];
  var OM_EARLY = ["bread", "butter", "top", "jam"];

  function omBugWord(scene, t) {
    var cMis = sc(scene, 0, "mistake"), cBug = sc(scene, 0, "bug");
    var out = "", o = on(t, cMis, 0.5);
    /* an algorithm, any algorithm, standing quietly while the word is said */
    OM_SAND_ORDER.forEach(function (id, k) {
      out += omRow(OM_PANEL.x, omR4Y(k), OM_PANEL.w, OM_R4.h, k + 1, id, { o: o, dimmed: true });
    });
    var p = popIn(t, cBug, 0.45);
    out += MK.glow(858, 200, 180, P.plum, Math.min(1, p) * (0.6 + 0.4 * breathe(t)));
    out += MK.pop(Em(858, 200, 168, "\u{1F41B}"), 858, 200, p);
    out += MK.pill(858, 348, "bug", p, { size: 40, col: P.plum });
    return out;
  }

  function omBugMilk(scene, t) {
    var cRead = sc(scene, 1, "read"), cBread = sc(scene, 1, "bread"), cMilk = sc(scene, 1, "milk"),
      cJam = sc(scene, 1, "jam"), cTop = sc(scene, 1, "top");
    var cBelong = sc(scene, 2, "belong"), cStep = sc(scene, 2, "step");
    /* each item arrives on its OWN word, not a fixed timer from "Read this
       one": the child hears "Jam." and "Top slice." and sees them land, the
       same as every other beat in this film. */
    var at = { bread: cBread, milk: cMilk, jam: cJam, top: cTop };
    var out = "", shown = 0;
    OM_MILK.forEach(function (id) { if (omPast(t, at[id])) shown++; });
    var boxOn = on(t, cRead, 0.4);
    out += omSandwich(OM_MILK.slice(0, shown), boxOn);
    OM_MILK.forEach(function (id, k) {
      if (k >= shown) { out += omSlot(OM_PANEL.x, omR4Y(k), OM_PANEL.w, OM_R4.h, k + 1, boxOn); return; }
      var bad = id === "milk" && omPast(t, cBelong);
      out += omRow(OM_PANEL.x, omR4Y(k), OM_PANEL.w, OM_R4.h, k + 1, id,
        { o: 1, col: bad ? P.bad : (id === "milk" && omPast(t, cMilk) ? P.gold : null),
          mark: bad ? "cross" : null, markP: popIn(t, cBelong, 0.35) });
      out += MK.ripple(OM_PANEL.x + 38, omR4Y(k) + OM_R4.h / 2, t, at[id], P.gold);
    });
    /* the milk layer in the middle of a jam sandwich */
    var bl = on(t, cBelong, 0.5);
    if (bl > 0) out += E(omSX(160), omSY(omLayerY(OM_MILK, "milk")), 132, 17, "none", P.bad, 5, { opacity: bl });
    out += MK.pop(Em(452, omR4Y(1) + OM_R4.h / 2, 40, "\u{1F41B}"), 452, omR4Y(1) + OM_R4.h / 2, popIn(t, cStep, 0.4));
    return out;
  }

  function omBugEarly(scene, t) {
    var cAlso = sc(scene, 3, "also"), cPlace = sc(scene, 3, "place");
    var cTop = sc(scene, 4, "top"), cFirst = sc(scene, 4, "first");
    var out = "";
    out += omSandwich(OM_EARLY, 1);
    OM_EARLY.forEach(function (id, k) {
      var hot = k === 2 && omPast(t, cPlace);
      out += omRow(OM_PANEL.x, omR4Y(k), OM_PANEL.w, OM_R4.h, k + 1, id,
        { o: 1, col: hot ? P.bad : (k >= 2 && omPast(t, cAlso) ? P.gold : null),
          mark: k === 2 && omPast(t, cFirst) ? "cross" : null, markP: popIn(t, cFirst, 0.35) });
    });
    /* the right step, in the wrong place: where it belongs is one row down.
       The arrow goes in the gutter beside the list, where no row can hide it,
       and it belongs to this beat alone. */
    var mv = on(t, cPlace, 0.6);
    out += MK.arrow(590, omR4Y(2) + OM_R4.h * 0.7, 590, omR4Y(3) + OM_R4.h * 0.55, mv * omOnly(t, scene, 3), P.bad, 7);
    /* and there it is in the picture, under the jam */
    var lu = on(t, cTop, 0.7);
    out += MK.leader(OM_PANEL.x + OM_PANEL.w + 8, omR4Y(2) + OM_R4.h / 2,
      omSX(80), omSY(omLayerY(OM_EARLY, "top")), lu, P.gold);
    out += MK.pop(Em(452, omR4Y(2) + OM_R4.h / 2, 40, "\u{1F50D}"), 452, omR4Y(2) + OM_R4.h / 2, popIn(t, cFirst, 0.4));
    return out;
  }

  function omBugChapter(scene, beat, t, i) {
    var u1 = into(t, scene.first + 1), u2 = into(t, scene.first + 3), out = "";
    if (u1 < 1) out += G(omBugWord(scene, t), { opacity: 1 - u1 });
    if (u1 > 0 && u2 < 1) out += G(omBugMilk(scene, t), { opacity: u1 * (1 - u2) });
    if (u2 > 0) out += G(omBugEarly(scene, t), { opacity: u2 });
    return svg(out);
  }
