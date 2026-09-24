  /* ==== Follow, Edit, Correct, part 2: following it, and understanding it =====
     tools/lib/film-scenes/computing-g3/follow-edit-correct-2.js. See the header
     of follow-edit-correct.js.

     Both chapters are the same shape as the lesson's own steps: the smoothie
     algorithm as a numbered list on the left, and the kit's smoothie drawn from
     exactly that list on the right. Where the algorithm goes wrong, the list
     goes wrong and the kit draws its own consequence and writes its own caption
     - "lumps of fruit in the glass!" when pour and blend are swapped, "no lid
     on: smoothie everywhere!" when the lid step is taken out. */

  /* where the kit draws the two things these chapters point at */
  var FEC_LID_AT = [130, 52], FEC_GLASS_AT = [236, 144];

  /* ==== chapter: following =======================================================
     Three steps are already done. The algorithm names the lid, so the lid is
     what happens - not blend, however much you would like to blend. Then the
     computer does the steps in the wrong order and the kit puts lumps of fruit
     in the glass. */
  function fecFollowMain(scene, t) {
    var cFollowing = sc(scene, 0, "following"), cNext = sc(scene, 0, "next");
    var cOnly = sc(scene, 1, "only"), cSays = sc(scene, 1, "says"), cLid = sc(scene, 1, "lid");
    var cNotblend = sc(scene, 2, "notblend"), cAfter = sc(scene, 2, "after");
    var out = "", lidOn = fecPast(t, cLid);

    out += fecScene(FEC_SMOOTH.slice(0, lidOn ? 4 : 3), on(t, cFollowing, 0.5));

    var shown = tally(t, cFollowing, 6, 0.8), quiet = on(t, cOnly, 0.6);
    FEC_SMOOTH.forEach(function (id, k) {
      if (k >= shown) return;
      var isLid = k === 3, isBlend = k === 4;
      var done = k < 3 || (isLid && lidOn);
      var lit = isLid ? fecPast(t, cNext) && !fecPast(t, cNotblend) : isBlend && fecPast(t, cAfter);
      var focus = fecPast(t, cNotblend) ? 4 : 3;
      var faded = quiet * (k === focus ? 0 : 0.58);
      out += G(fecRow(FEC_PANEL.x, fec6Y(k), FEC_PANEL.w, FEC_R6.h, k + 1, id,
        { o: 1, col: lit ? P.gold : null, mark: done ? "tick" : null,
          markP: isLid ? popIn(t, cLid, 0.35) : 1 }), { opacity: 1 - faded });
    });

    /* the step the algorithm names next */
    out += MK.ripple(FEC_PANEL.x + 38, fec6Y(3) + FEC_R6.h / 2, t, cNext, P.gold);
    out += MK.ripple(FEC_PANEL.x + 38, fec6Y(3) + FEC_R6.h / 2, t, cSays, P.gold);
    out += MK.finger(FEC_PANEL.x + 108, fec6Y(3) + FEC_R6.h * 0.72,
      on(t, cSays, 0.4) * (1 - on(t, cNotblend, 0.4)));
    /* and the lid, going on in the kit's own drawing */
    out += MK.leader(FEC_PANEL.x + FEC_PANEL.w + 8, fec6Y(3) + FEC_R6.h / 2,
      fecSX(FEC_LID_AT[0]), fecSY(FEC_LID_AT[1]), on(t, cLid, 0.6) * (1 - on(t, cNotblend, 0.45)), P.gold);

    /* not blend: not yet, anyway - blend comes after the lid */
    var nb = popIn(t, cNotblend, 0.4) * (1 - on(t, cAfter, 0.45));
    out += MK.cross(FEC_PANEL.x + FEC_PANEL.w - FEC_R6.h * 0.44, fec6Y(4) + FEC_R6.h / 2, FEC_R6.h * 0.27, nb);
    out += MK.arrow(FEC_GUT, fec6Y(3) + FEC_R6.h / 2, FEC_GUT, fec6Y(4) + FEC_R6.h / 2, on(t, cAfter, 0.5), P.gold, 7);
    return out;
  }

  /* the last beat: the computer does step five and step six the wrong way round,
     and the kit fills the glass with lumps of fruit and says so */
  var FEC_B3_BOX = { x: 690, y: 96, w: 400, h: 300 };
  var FEC_WRONG = ["banana", "berries", "milk", "lid", "pour", "blend"];

  function fecFollowWrong(scene, t) {
    var cComputer = sc(scene, 3, "computer"), cStep = sc(scene, 3, "wrongstep"),
      cThing = sc(scene, 3, "wrongthing");
    var out = "", sw = on(t, cStep, 0.7), ran = fecPast(t, cThing);

    out += fecBoxed("smoothie", FEC_WRONG.slice(0, ran ? 6 : 4), FEC_B3_BOX, 1);
    /* a computer, which does exactly what it is told */
    var cp = popIn(t, cComputer, 0.42);
    out += MK.glow(760, 74, 66, P.blue, Math.min(1, cp) * 0.9);
    out += MK.pop(Em(760, 74, 70, "\u{1F916}"), 760, 74, cp);
    out += MK.pill(950, 74, "does exactly this", on(t, cComputer, 0.5), { size: 24, col: P.blue, ink: P.blue });

    FEC_SMOOTH.forEach(function (id, k) {
      /* step five and step six trade places as the wrong step is named */
      var slot = k === 4 ? lerp(4, 5, sw) : k === 5 ? lerp(5, 4, sw) : k;
      var bad = k === 5 && sw > 0.4;          /* pour, standing where blend should be */
      out += fecRow(FEC_PANEL.x, fec6Y(slot), FEC_PANEL.w, FEC_R6.h, Math.round(slot) + 1, id,
        { o: 1, col: bad ? P.bad : null, mark: k < 4 ? "tick" : bad ? "cross" : null,
          markP: k < 4 ? 1 : popIn(t, cStep == null ? null : cStep + 0.45, 0.35) });
    });
    out += MK.cross(FEC_B3_BOX.x + FEC_B3_BOX.w - 44, FEC_B3_BOX.y + 44, 28, popIn(t, cThing, 0.42));
    return out;
  }

  function fecFollowChapter(scene, beat, t, i) {
    var u = into(t, scene.first + 3), out = "";
    if (u < 1) out += G(fecFollowMain(scene, t), { opacity: 1 - u });
    if (u > 0) out += G(fecFollowWrong(scene, t), { opacity: u });
    return svg(out);
  }

  /* ==== chapter: why each step is there ===========================================
     The same six steps, with a question mark against every one of them. The lid
     is asked about first: take its step out, blend anyway, and the kit sprays
     the kitchen. Put it back, pour last, and every question mark becomes a
     tick - which is the logical thinking the algorithm was built from. */
  var FEC_NO_LID = ["banana", "berries", "milk", "blend"];

  function fecUnderstandChapter(scene, beat, t, i) {
    var cUnd = sc(scene, 0, "understanding"), cWhy = sc(scene, 0, "why");
    var cLid = sc(scene, 1, "lid");
    var cOut = sc(scene, 2, "out"), cBlend = sc(scene, 2, "blend"), cKitchen = sc(scene, 2, "kitchen");
    var cPourlast = sc(scene, 3, "pourlast"), cSmooth = sc(scene, 3, "smooth");
    var cReason = sc(scene, 4, "reason"), cLogical = sc(scene, 4, "logical");
    var out = "";

    /* the lid step is out from "Take the lid step out" until "Pour last" */
    var lift = on(t, cOut, 0.5), back = on(t, cPourlast, 0.5);
    var gone = lift * (1 - back);
    var noLid = fecPast(t, cOut) && !fecPast(t, cPourlast);
    var ids = noLid ? FEC_NO_LID.slice(0, fecPast(t, cBlend) ? 4 : 3) : FEC_SMOOTH;
    out += fecScene(ids, on(t, cUnd, 0.5));

    /* every step asked about, then every step answered */
    var asked = tally(t, cWhy, 6, 1.3), ticked = tally(t, cReason, 6, 1.5);
    FEC_SMOOTH.forEach(function (id, k) {
      var isLid = k === 3, isPour = k === 5;
      var mark = k < ticked ? "tick" : k < asked ? "qmark" : null;
      var lit = (isLid && fecPast(t, cLid) && !fecPast(t, cPourlast)) ||
        (isPour && fecPast(t, cPourlast) && !fecPast(t, cReason));
      var row = fecRow(FEC_PANEL.x, fec6Y(k), FEC_PANEL.w, FEC_R6.h, k + 1, id,
        { o: 1, col: lit ? P.gold : null, mark: mark,
          markP: k < ticked ? popIn(t, cReason == null ? null : cReason + k * 0.24, 0.35) : 1 });
      if (!isLid) { out += row; return; }
      /* the lid step, lifted out and put back */
      if (gone < 1) out += G(row, { opacity: 1 - gone, transform: around(FEC_PANEL.x + FEC_PANEL.w / 2, fec6Y(3) + FEC_R6.h / 2, 1 - 0.3 * gone) });
      out += fecSlot(FEC_PANEL.x, fec6Y(3), FEC_PANEL.w, FEC_R6.h, 4, gone);
    });

    /* why does the lid go on before you blend? */
    out += MK.leader(FEC_PANEL.x + FEC_PANEL.w + 8, fec6Y(3) + FEC_R6.h / 2,
      fecSX(FEC_LID_AT[0]), fecSY(FEC_LID_AT[1]), on(t, cLid, 0.6) * (1 - lift), P.gold);
    out += MK.qmark(fecSX(200), fecSY(38), 26, on(t, cLid, 0.45) * (1 - lift));
    /* blended with no lid on: the kit has already sprayed the kitchen */
    out += MK.cross(fecSX(276), fecSY(40), 28,
      popIn(t, cKitchen, 0.42) * (1 - into(t, scene.first + 3)));
    /* pour last, because you pour what the blender made smooth */
    out += MK.leader(FEC_PANEL.x + FEC_PANEL.w + 8, fec6Y(5) + FEC_R6.h / 2,
      fecSX(FEC_GLASS_AT[0]), fecSY(FEC_GLASS_AT[1]), on(t, cSmooth, 0.6) * (1 - on(t, cReason, 0.45)), P.gold);
    /* every reason together is logical thinking */
    var lg = popIn(t, cLogical, 0.42);
    out += MK.pop(Em(750, 398, 58, "\u{1F9E0}"), 750, 398, lg);
    out += MK.pill(934, 404, "logical thinking", on(t, cLogical, 0.5), { size: 26, col: P.plum, ink: P.plum });
    return svg(out);
  }
