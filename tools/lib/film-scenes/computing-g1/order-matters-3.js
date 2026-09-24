  /* ==== Order Matters, part 3: fixing it, changing it, and the safe order ======
     tools/lib/film-scenes/computing-g1/order-matters-3.js. See the header of
     order-matters.js.

     The road is the one picture in this film the lesson kit does not draw:
     Computing has no ART.sim and no scene for crossing a road, so it is drawn
     here in the engine's own idiom, with the lesson's four steps and its four
     pictures. Everything else is still the kit's. */

  /* ==== chapter: fixing it ========================================================
     The milk step is taken out and the butter step put in its place; then the
     early top slice is moved to where it belongs. Each repair is the LIST
     changing, and the lesson's scene follows it. */
  var OM_GOOD = ["bread", "butter", "jam", "top"];

  function omFixSwap(scene, t) {
    var cFound = sc(scene, 0, "found"), cFix = sc(scene, 0, "fix");
    var cOut = sc(scene, 1, "out"), cIn = sc(scene, 1, "in");
    var cMilk = sc(scene, 2, "milk"), cButter = sc(scene, 2, "butter");
    var out = "", mended = omPast(t, cButter);
    out += omSandwich(mended ? OM_GOOD : OM_MILK, 1);

    /* The wrong step shrinks away and the right one grows into the slot it
       left, both about the slot's own centre. Nothing slides off the side:
       the svg does not clip, so a row leaving to the left would go on being
       drawn in the margin beside the film (--sweep, 58 moments out of the
       box). The gutter arrow says one is coming in. */
    var lift = on(t, cOut, 0.5) * 14, gone = on(t, cMilk, 0.6), drop = on(t, cButter, 0.55);
    var slotC = [OM_PANEL.x + OM_PANEL.w / 2, omR4Y(1) + OM_R4.h / 2];
    OM_MILK.forEach(function (id, k) {
      if (id === "milk") return;
      out += omRow(OM_PANEL.x, omR4Y(k), OM_PANEL.w, OM_R4.h, k + 1, id, { o: 1 });
    });
    if (gone < 1) out += G(omRow(OM_PANEL.x, omR4Y(1) - lift, OM_PANEL.w, OM_R4.h, 2, "milk",
      { o: 1, col: P.bad, mark: omPast(t, cOut) ? "cross" : "bug", markP: popIn(t, omPast(t, cOut) ? cOut : cFound, 0.4) }),
      { opacity: 1 - gone, transform: around(slotC[0], slotC[1] - lift, 1 - 0.34 * gone) });
    /* the slot the wrong step left, waiting */
    out += omSlot(OM_PANEL.x, omR4Y(1), OM_PANEL.w, OM_R4.h, 2, gone * (1 - drop));
    /* the right step, growing into the empty slot */
    if (drop > 0) out += G(omRow(OM_PANEL.x, omR4Y(1), OM_PANEL.w, OM_R4.h, 2, "butter",
      { o: drop, col: P.good, mark: mended ? "tick" : null, markP: popIn(t, cButter == null ? null : cButter + 0.4, 0.35) }),
      { transform: around(slotC[0], slotC[1], 0.72 + 0.28 * drop) });
    out += MK.arrow(616, slotC[1], 570, slotC[1], on(t, cIn, 0.5) * (1 - drop), P.good, 7);
    out += MK.pop(Em(462, omR4Y(0) - 6, 56, "\u{1F527}"), 462, omR4Y(0) - 6, popIn(t, cFix, 0.4));
    return out;
  }

  function omFixMove(scene, t) {
    var cTop = sc(scene, 3, "top"), cMove = sc(scene, 3, "move"), cBelongs = sc(scene, 3, "belongs");
    var cRun = sc(scene, 4, "run"), cCheck = sc(scene, 4, "check"), cDone = sc(scene, 4, "done");
    var out = "", mv = on(t, cBelongs, 0.7), moved = omPast(t, cBelongs);
    out += omSandwich(moved ? OM_GOOD : OM_EARLY, 1);
    var lift = on(t, cMove, 0.5) * 18;
    OM_EARLY.forEach(function (id, k) {
      var slot = id === "top" ? lerp(2, 3, mv) : id === "jam" ? lerp(3, 2, mv) : k;
      var y = omR4Y(slot) - (id === "top" ? lift * (1 - mv) : 0);
      var ticked = omPast(t, cRun) && tally(t, cRun, 4, 1.1) > Math.round(slot);
      out += omRow(OM_PANEL.x, y, OM_PANEL.w, OM_R4.h, Math.round(slot) + 1, id,
        { o: 1, col: id === "top" && !moved ? P.gold : null,
          mark: ticked ? "tick" : null, markP: popIn(t, cRun == null ? null : cRun + 0.2 + Math.round(slot) * 0.28, 0.35) });
    });
    /* in the gutter beside the list, where no row can hide it */
    out += MK.arrow(590, omR4Y(2) + OM_R4.h * 0.7, 590, omR4Y(3) + OM_R4.h * 0.55,
      on(t, cMove, 0.5) * (1 - mv), P.gold, 7);
    out += MK.pop(Em(452, omR4Y(2) + OM_R4.h / 2, 40, "\u{1F50D}"), 452, omR4Y(2) + OM_R4.h / 2, popIn(t, cTop, 0.4) * (1 - mv));
    out += MK.tick(omSX(286), omSY(38), 28, popIn(t, cCheck, 0.4));
    out += MK.pill(850, 410, "A jam sandwich!", on(t, cDone, 0.4), { size: 25, col: P.good });
    return out;
  }

  function omFixChapter(scene, beat, t, i) {
    var u = into(t, scene.first + 3), out = "";
    if (u < 1) out += G(omFixSwap(scene, t), { opacity: 1 - u });
    if (u > 0) out += G(omFixMove(scene, t), { opacity: u });
    return svg(out);
  }

  /* ==== chapter: changing the outcome =============================================
     One step changed on purpose, then one step added. The list slides up to
     make room for the fifth step, and the kit draws every outcome: cheese, the
     dashed cut, banana. The result lines are the lesson's own. */
  var OM_CH = { h: 66, gap: 12 };
  function omChangeChapter(scene, beat, t, i) {
    var cChange = sc(scene, 0, "change"), cPurpose = sc(scene, 0, "purpose"), cNew = sc(scene, 0, "new");
    var cSwap = sc(scene, 1, "swap"), cCheese = sc(scene, 1, "cheese");
    var cAdd = sc(scene, 2, "add"), cCut = sc(scene, 2, "cut"), cHalves = sc(scene, 2, "halves");
    var cDecide = sc(scene, 3, "decide"), cOut1 = sc(scene, 3, "outcome");
    var cChange2 = sc(scene, 4, "change"), cOut2 = sc(scene, 4, "outcome");
    var out = "";

    var filling = omPast(t, cChange2) ? "banana" : omPast(t, cSwap) ? "cheese" : "jam";
    var rows = ["bread", "butter", filling, "top"];
    var ids = rows.slice();
    if (omPast(t, cCut)) ids = ids.concat(["cut"]);
    var grow = on(t, cAdd, 0.6), top = lerp(70, 31, grow);
    var rowY = function (k) { return top + k * (OM_CH.h + OM_CH.gap); };
    out += omSandwich(ids, 1);

    rows.forEach(function (id, k) {
      var hot = k === 2 && (bump(t, cSwap, 0.9) > 0.05 || bump(t, cChange2, 0.9) > 0.05 || omPast(t, cPurpose) && !omPast(t, cSwap));
      out += omRow(OM_PANEL.x, rowY(k), OM_PANEL.w, OM_CH.h, k + 1, id, { o: 1, col: hot ? P.gold : null });
    });
    /* The fifth step, added at the end. The empty slot waits for the list to
       have finished sliding up, and the row grows into it rather than dropping
       from below: at the old timing both hung out of the bottom of the box. */
    var add = on(t, cAdd == null ? null : cAdd + 0.4, 0.4), land = on(t, cCut, 0.5);
    var fifth = [OM_PANEL.x + OM_PANEL.w / 2, rowY(4) + OM_CH.h / 2];
    if (add > 0) out += omSlot(OM_PANEL.x, rowY(4), OM_PANEL.w, OM_CH.h, 5, add * (1 - land));
    if (land > 0) out += G(omRow(OM_PANEL.x, rowY(4), OM_PANEL.w, OM_CH.h, 5, "cut", { o: land, col: P.good }),
      { transform: around(fifth[0], fifth[1], 0.74 + 0.26 * land) });
    /* the changed step, and what it makes */
    out += MK.pop(Em(590, 60, 52, "\u{1F504}"), 590, 60, popIn(t, cChange, 0.4));
    out += MK.qmark(omSX(280), omSY(40), 30, on(t, cNew, 0.45) * (1 - on(t, cSwap, 0.4)));
    out += MK.arrow(572, 220, 614, 220, on(t, cDecide, 0.5), P.gold, 8);
    out += MK.pop(Em(omSX(282), omSY(44), 58, "\u{1F381}"), omSX(282), omSY(44), popIn(t, cOut1, 0.4));
    var say = omPast(t, cOut2) ? "A banana sandwich, in two halves!"
      : omPast(t, cHalves) ? "Two halves!" : omPast(t, cCheese) ? "A cheese sandwich!" : null;
    var said = omPast(t, cOut2) ? cOut2 : omPast(t, cHalves) ? cHalves : cCheese;
    if (say) out += MK.pill(850, 410, say, on(t, said, 0.4), { size: 25, col: P.good });
    return svg(out);
  }

  /* ==== chapter: the safe order ===================================================
     The lesson's crossing-the-road step, drawn here because the kit has no
     scene for it: its four pictures, its four labels, and its own warning that
     walking first is the dangerous order. */
  var OM_ROAD = { top: 248, bottom: 392, cardY: 28, cardH: 144, cardW: 254, pitch: 284, x0: 30, cx: 155 };
  var OM_CROSS = [
    { pic: "\u{1F6D1}", label: "stop at the kerb" },
    { pic: "\u{1F440}", label: "look both ways" },
    { pic: "\u{1F442}", label: "listen for cars" },
    { pic: "\u{1F6B6}", label: "walk straight across" }
  ];
  function omCrossCard(x, n, item, o, col) {
    if (!(o > 0)) return "";
    var w = OM_ROAD.cardW, h = OM_ROAD.cardH, y = OM_ROAD.cardY;
    var body = R(x, y, w, h, 24, P.cell, col || P.line, col ? 3.5 : 2) +
      C(x + 32, y + 32, 21, P.card, col || P.line, 2) +
      Tx(x + 32, y + 40, String(n), "lab", "middle", { fill: col || P.muted, "font-size": 24 });
    if (item) body += Em(x + w / 2, y + 74, 62, item.pic) +
      Tx(x + w / 2, y + 126, item.label, "lab mid", "middle");
    return G(body, { opacity: clamp(o, 0, 1) });
  }
  /* the near pavement, then the far one: a crossing takes the child up the page */
  function omChildY(u) { return lerp(404, 222, clamp(u, 0, 1)); }

  function omSafeChapter(scene, beat, t, i) {
    var cSafe = sc(scene, 0, "safe"), cReally = sc(scene, 0, "really");
    var cCross = sc(scene, 1, "cross"), cFour = sc(scene, 1, "four"), cOrderIn = sc(scene, 1, "order");
    var cStop = sc(scene, 2, "stop"), cLook = sc(scene, 2, "look"), cListen = sc(scene, 2, "listen"), cWalk = sc(scene, 2, "walk");
    var cFirst = sc(scene, 3, "wfirst"), cRoad = sc(scene, 3, "road"), cSafeOrder = sc(scene, 3, "order");
    var out = "", o = on(t, cSafe, 0.6);

    /* the road, with a pavement on each side */
    out += G(R(0, 196, 1168, 52, 0, "#4A6376") + R(0, OM_ROAD.bottom, 1168, 48, 0, "#4A6376") +
      R(0, OM_ROAD.top, 1168, OM_ROAD.bottom - OM_ROAD.top, 0, "#2F3C48") +
      R(0, OM_ROAD.top, 1168, 5, 0, P.muted) + R(0, OM_ROAD.bottom - 5, 1168, 5, 0, P.muted) +
      L(0, 320, 1168, 320, "#EAD79A", 5, { "stroke-dasharray": "46 34", opacity: 0.7 }), { opacity: o });
    /* "then the order really matters": the road itself warns, rather than a
       glow round the child, which reached 60 px below the box */
    var warn = bump(t, cReally, 1.8) * o;   /* a flash, not a colour the road keeps */
    if (warn > 0) out += G(R(0, OM_ROAD.top, 1168, OM_ROAD.bottom - OM_ROAD.top, 0, P.gold, null, null,
      { opacity: 0.16 }) +
      R(2, OM_ROAD.top + 2, 1164, OM_ROAD.bottom - OM_ROAD.top - 4, 0, "none", P.gold, 4,
        { opacity: 0.9 }), { opacity: warn });
    /* the crossing the child uses */
    var zebra = "";
    for (var z = 0; z < 5; z++) zebra += R(OM_ROAD.cx - 35, OM_ROAD.top + 4 + z * 28, 70, 16, 3, "#EAF4FA", null, null, { opacity: 0.85 });
    out += G(zebra, { opacity: o * on(t, cCross, 0.6) });
    /* One car in the far lane, sweeping past, the same at every playing. It
       fades in and out at the ends rather than driving off the side: the svg
       does not clip, so a car at -110 goes on being drawn beside the film. */
    var carU = ((t - scene.start) / 6.5) % 1, carX = lerp(52, 1116, carU);
    var carO = clamp(Math.min(carU, 1 - carU) / 0.12, 0, 1);
    if (carO > 0.01) out += G(Em(carX, 284, 70, "\u{1F697}"), { opacity: o * carO });

    /* the four steps, in whatever order they are standing in */
    var wrong = on(t, cFirst, 0.5), back = on(t, cSafeOrder, 0.5);
    var slots = tally(t, cFour, 4, 0.8);
    var at = [cStop, cLook, cListen, cWalk];
    OM_CROSS.forEach(function (item, k) {
      var wrongPos = k === 3 ? 0 : k + 1;
      var pos = lerp(lerp(k, wrongPos, wrong), k, back);
      var here = omPast(t, at[k]);
      var lit = on(t, cOrderIn == null ? null : cOrderIn + k * 0.2, 0.4);
      if (k >= slots && !here) return;
      out += omCrossCard(OM_ROAD.x0 + pos * OM_ROAD.pitch, Math.round(pos) + 1, here ? item : null,
        Math.max(lit, here ? 1 : 0.9) * o,
        omPast(t, cSafeOrder) ? P.good : omPast(t, cFirst) ? P.bad : (lit > 0.5 ? P.gold : null));
      out += MK.ripple(OM_ROAD.x0 + pos * OM_ROAD.pitch + 32, OM_ROAD.cardY + 32, t, at[k], P.gold);
    });

    /* the child: on the kerb, then across; and in the road when walk goes first */
    var walked = on(t, cWalk, 0.9), inRoad = popIn(t, cFirst, 0.45) * (1 - on(t, cSafeOrder, 0.45));
    var safeO = o * (1 - Math.min(1, inRoad));
    out += G(Em(OM_ROAD.cx, omChildY(walked), 56, "\u{1F9D2}"), { opacity: safeO });
    if (inRoad > 0) {
      out += MK.pop(Em(760, 322, 56, "\u{1F9D2}"), 760, 322, inRoad);
      out += MK.waves(clamp(carX + 34, 40, 956), 284, t, cRoad, { dir: 0, spread: 1.1, reach: 80, col: P.bad, until: cRoad == null ? null : cRoad + 1.6 });
      out += MK.cross(760, 234, 28, popIn(t, cRoad, 0.4) * (1 - on(t, cSafeOrder, 0.45)));
    }
    out += MK.tick(584, 206, 28, popIn(t, cSafeOrder == null ? null : cSafeOrder + 0.45, 0.4));
    return svg(out);
  }

  /* ---- what you now know ---------------------------------------------------------
     The lesson's own six words, and its own pictures for them. */
  var OM_RECAP = MK.recapKind([
    { beat: 0, at: "order", title: "Order", sub: "which step comes first", pic: "\u{1F522}" },
    { beat: 1, at: "bug", title: "Bug", sub: "a mistake in the steps", pic: "\u{1F41B}" },
    { beat: 1, at: "fix", title: "Fix", sub: "put the mistake right", pic: "\u{1F527}" },
    { beat: 2, at: "change", title: "Change", sub: "make a step different", pic: "\u{1F504}" },
    { beat: 2, at: "outcome", title: "Outcome", sub: "what you get at the end", pic: "\u{1F381}" }
  ], { goBeat: 2, goAt: "outcome" });

  var KINDS = {
    title: MK.titleKind({ sub: ["Why the order of the steps matters", "How to find the one step that is wrong", "How to change a step and change what you get"] }),
    socks: omSocksChapter, sandwich: omSandwichChapter, bug: omBugChapter,
    fix: omFixChapter, change: omChangeChapter, safe: omSafeChapter, recap: OM_RECAP
  };
