  /* ==== Think It Through, part 2: the two predictions ==========================
     The chapters "Predict the change" (the smoothie) and "Predict again: the
     kite". Both are the same picture: the algorithm as a numbered sequence of
     steps on the left, and the lesson's own scene of the task on the right,
     drawn from exactly the list standing in that sequence.

     So the outcome the voice predicts is never drawn here. The changed list
     goes to the kit - ART.scene("smoothie", ["banana", "berries", "milk",
     "blend"]) with no lid in it, and ART.scene("kite", ["sticks", "tie",
     "paper", "tail", "fly"]) with no string - and the kit sprays the kitchen
     and loses the kite and writes its own caption. */

  /* ---- the smoothie ----------------------------------------------------------- */

  var TI_SMOOTHIE = ["banana", "berries", "milk", "lid", "blend", "pour"];

  function tiPredictChapter(scene, beat, t, i) {
    var cAlgo = sc(scene, 0, "smoothie"), cSix = sc(scene, 0, "six");
    var cChange = sc(scene, 1, "change"), cSwap = sc(scene, 1, "swap"), cBlend = sc(scene, 1, "blend");
    var cPredict = sc(scene, 2, "predict"), cStarts = sc(scene, 2, "starts");
    var cNolid = sc(scene, 3, "nolid"), cSprays = sc(scene, 3, "sprays");
    var out = "";

    var sw = on(t, cSwap, 0.65), swapped = tiPast(t, cSwap);
    var built = tally(t, cSix, 6, 1.5);
    /* the order the six steps are standing in, and how far the kitchen has got */
    var walked = tiPast(t, cStarts) ? tally(t, cStarts, 3, 0.9) : 0;
    var ids, sceneOn = on(t, cAlgo, 0.5);
    if (tiPast(t, cNolid)) ids = ["banana", "berries", "milk", "blend"];
    else if (tiPast(t, cStarts)) ids = ["banana", "berries", "milk"].slice(0, walked);
    else if (tiPast(t, cPredict)) ids = [];
    else ids = TI_SMOOTHIE.slice(0, built);
    /* while the change is only being planned, the kitchen waits */
    var planning = on(t, cChange, 0.5) * (1 - on(t, cPredict, 0.5));
    out += tiScene("smoothie", ids, sceneOn * (1 - 0.6 * planning));

    /* the sequence of steps, with the lid and the blending changing places */
    TI_SMOOTHIE.forEach(function (id, k) {
      if (k >= built) { out += tiSlot(TI_LIST.x, tiListY(k, 6), TI_LIST.w, TI_LIST.h, k + 1, on(t, cSix, 0.4)); return; }
      var slot = id === "lid" ? lerp(3, 4, sw) : id === "blend" ? lerp(4, 3, sw) : k;
      var y = tiListY(slot, 6), n = Math.round(slot) + 1;
      var col = null, mark = null, markP = 1, dim = false;
      if (tiPast(t, cNolid)) {
        if (id === "lid") { col = P.bad; mark = "cross"; markP = popIn(t, cSprays, 0.4); dim = true; }
        else if (["banana", "berries", "milk", "blend"].indexOf(id) >= 0) col = P.gold;
      } else if (tiPast(t, cStarts)) {
        /* only the steps the blender has actually reached light up; the swap
           itself has not happened yet, so the lid/blend badge stays showing */
        var wi = ["banana", "berries", "milk"].indexOf(id);
        if (wi >= 0 && wi < walked) col = P.gold;
        else if (id === "lid" || id === "blend") { col = P.gold; mark = "swap"; markP = 1; }
      } else if (swapped) {
        if (id === "lid" || id === "blend") { col = P.gold; mark = "swap"; markP = popIn(t, cBlend, 0.4); }
      }
      out += tiRow(TI_LIST.x, y, TI_LIST.w, TI_LIST.h, n, id, { col: col, mark: mark, markP: markP, dim: dim });
    });

    /* predict before you watch: the kitchen is blank and the question stands */
    var q = popIn(t, cPredict, 0.45) * (1 - on(t, cNolid, 0.4));
    out += MK.qmark(TI_SC.x + TI_SC.w / 2, TI_SC.y + TI_SC.h / 2, 84, Math.min(1, q));
    /* and the kit has already sprayed the kitchen and captioned it */
    out += MK.cross(tiSX(36), tiSY(40), 28, popIn(t, cSprays, 0.4));
    return svg(out);
  }

  /* ---- the kite --------------------------------------------------------------- */

  var TI_KITE = ["sticks", "tie", "paper", "tail", "string", "fly"];

  function tiKiteChapter(scene, beat, t, i) {
    var cSame = sc(scene, 0, "same"), cKite = sc(scene, 0, "kite");
    var cSwap = sc(scene, 1, "swap"), cRun = sc(scene, 1, "run"), cPredict = sc(scene, 1, "predict");
    var cWind = sc(scene, 2, "wind"), cNothing = sc(scene, 2, "nothing"), cTakes = sc(scene, 2, "takes");
    var cTail = sc(scene, 3, "tail"), cNotail = sc(scene, 3, "notail"), cElse = sc(scene, 3, "else");
    var out = "";

    var back = on(t, cTail, 0.55), restored = tiPast(t, cTail);
    var sw = on(t, cSwap, 0.65) * (1 - back), swapped = tiPast(t, cSwap) && !restored;
    var built = tally(t, cKite, 6, 1.5);

    var ids, sceneOn = on(t, cSame, 0.5);
    if (tiPast(t, cTail)) ids = ["sticks", "tie", "paper", "string", "fly"];
    else if (tiPast(t, cWind)) ids = ["sticks", "tie", "paper", "tail", "fly"];
    else if (tiPast(t, cPredict)) ids = [];
    else ids = TI_KITE.slice(0, built);
    var planning = on(t, cSwap, 0.5) * (1 - on(t, cWind, 0.5));
    out += tiScene("kite", ids, sceneOn * (1 - 0.6 * planning));

    TI_KITE.forEach(function (id, k) {
      if (k >= built) { out += tiSlot(TI_LIST.x, tiListY(k, 6), TI_LIST.w, TI_LIST.h, k + 1, on(t, cKite, 0.4)); return; }
      var slot = id === "string" ? lerp(4, 5, sw) : id === "fly" ? lerp(5, 4, sw) : k;
      var y = tiListY(slot, 6), n = Math.round(slot) + 1;
      var col = null, mark = null, markP = 1, dim = false;
      if (restored) {
        if (id === "tail") { col = P.bad; mark = "cross"; markP = popIn(t, cTail, 0.4); dim = true; }
        else col = P.good;
      } else if (tiPast(t, cWind)) {
        if (id === "string") { col = P.bad; mark = "cross"; markP = popIn(t, cNothing, 0.4); dim = true; }
        else if (id !== "pour") col = P.gold;
      } else if (swapped) {
        if (id === "string" || id === "fly") { col = P.gold; mark = "swap"; markP = popIn(t, cRun, 0.4); }
      }
      out += tiRow(TI_LIST.x, y, TI_LIST.w, TI_LIST.h, n, id, { col: col, mark: mark, markP: markP, dim: dim });
    });

    var q = popIn(t, cPredict, 0.45) * (1 - on(t, cWind, 0.4));
    out += MK.qmark(TI_SC.x + TI_SC.w / 2, TI_SC.y + TI_SC.h / 2, 84, Math.min(1, q));
    /* the kit has taken the kite; the arrow says where it went */
    out += MK.arrow(tiSX(232), tiSY(78), tiSX(296), tiSY(26), on(t, cTakes, 0.6) * (1 - back), P.bad, 7);
    /* a kite with no tail: the ring marks the place the tail is not */
    var noTail = on(t, cNotail, 0.5);
    if (noTail > 0) out += E(tiSX(214), tiSY(134), 40, 46, "none", P.gold, 4,
      { opacity: noTail, "stroke-dasharray": "10 8" });
    out += MK.tick(tiSX(40), tiSY(36), 28, popIn(t, cElse, 0.4));
    return svg(out);
  }
