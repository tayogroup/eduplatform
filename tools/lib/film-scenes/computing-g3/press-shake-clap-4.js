  /* ==== Press, Shake, Clap, part 4: test it, fix it ===========================
     tools/lib/film-scenes/computing-g3/press-shake-clap-4.js. See the header of
     press-shake-clap.js.

     The lesson's first round again, built wrong: the algorithm asks for a
     heart and the program shows a smile. Nothing here decides what a smile
     block does - psRunState walks ART.device.plan, so the board shows the
     pattern ART.leds("smile") gives, which is why the child sees the same
     wrong thing the lesson's own board would show them. Then the block is
     changed, the input is given again, and it is right.

     The last beat is the lesson's own extension question - what do you check
     FIRST when nothing happens at all - and the answer is the hat block. */

  /* the two plans this chapter runs, both ART.device.plan's: the program as it
     was built, and the program after the block is changed */
  var PS_TEST_WRONG = ART.device.plan(["whenA", "smile", "beep"]).plan;
  var PS_TEST_RIGHT = ART.device.plan(["whenA", "heart", "beep"]).plan;
  var PS_TG = psGeom(700, 66, 400);
  var PS_TB = { x: 40, w: 440, hat: 68, h: 60, top: 100 };
  function psTestRow(k) { return k === 0 ? PS_TB.top : PS_TB.top + 80 + (k - 1) * 70; }

  /* the script as it stands at time t: smile until it is changed, and the hat
     block is the wrong one in the last beat */
  function psTestScript(t, cHeartFix, cWrongHat) {
    return [psPast(t, cWrongHat) ? "whenClap" : "whenA", psPast(t, cHeartFix) ? "heart" : "smile", "beep"];
  }

  function psTestChapter(scene, beat, t, i) {
    var cAlgo = sc(scene, 0, "algorithm"), cPressed = sc(scene, 0, "pressed"), cGot = sc(scene, 0, "got");
    var cChange = sc(scene, 1, "change"), cHeart = sc(scene, 1, "heart");
    var cPress = sc(scene, 2, "press"), cTest = sc(scene, 2, "test"), cShows = sc(scene, 2, "shows");
    var cDebug = sc(scene, 3, "debug");
    var cNothing = sc(scene, 4, "nothing"), cWrong = sc(scene, 4, "wrong");
    var g = PS_TG, B = PS_TB, out = "";
    var wrongHat = scene.first + 4 < BEATS.length ? into(t, scene.first + 4) >= 0.5 : false;
    var hatAt = wrongHat ? BEATS[scene.first + 4].start - GAP : null;
    var script = psTestScript(t, cHeart, wrongHat ? -1 : null);

    /* The board shows what it was LAST MADE to show, not what the blocks now
       say: swapping the smile block for a heart changes nothing until the
       input is given again. And the wrong hat block runs nothing at all. */
    var runAt = psPast(t, cShows) ? cShows : cPressed == null ? cGot : cPressed + 0.45;
    var plan = psPast(t, cShows) ? PS_TEST_RIGHT : PS_TEST_WRONG;
    var ran = wrongHat || !psPast(t, runAt) ? 0 : tally(t, runAt, plan.length + 1, 0.5) - 1;
    var press = psHold(t, cPressed, 1.0) || psHold(t, cPress, 1.0) || (wrongHat ? psHold(t, cNothing, 1.0) : 0);
    var st = psRunState(plan, Math.max(0, ran));

    out += psBoard(g, { leds: st.leds, pressA: press > 0 });
    out += MK.ripple(g.A.cx, g.A.cy, t, cPressed, P.gold);
    out += MK.ripple(g.A.cx, g.A.cy, t, cPress, P.gold);
    out += MK.ripple(g.A.cx, g.A.cy, t, wrongHat ? cNothing : null, P.gold);
    out += MK.finger(g.A.cx, g.A.cy + g.A.r * 0.5, press);

    /* what the algorithm asked for */
    out += MK.pill(260, 44, "The algorithm: show a heart, beep", on(t, cAlgo, 0.5),
      { size: 21, col: P.teal, ink: P.teal });

    /* the program, with the block that is changed */
    script.forEach(function (id, k) {
      var h = k === 0 ? B.hat : B.h, y = psTestRow(k);
      var o = k === 0 ? on(t, cAlgo, 0.45) : on(t, cAlgo == null ? null : cAlgo + 0.2 * k, 0.45);
      var bad = (k === 1 && !psPast(t, cHeart) && psPast(t, cGot)) || (k === 0 && wrongHat && psPast(t, cWrong));
      var good = k === 1 && psPast(t, cHeart);
      out += psBlock(B.x, y, B.w, h, id, o, bad ? { col: P.bad, fill: "#3A1E1C" } : good ? { col: P.good, fill: "#173D31" } : null);
      if (k === 1) {
        out += MK.cross(B.x + B.w - 34, y + h / 2, 22, popIn(t, cGot == null ? null : cGot + 0.4, 0.4) * (psPast(t, cHeart) ? 0 : 1));
        out += MK.tick(B.x + B.w - 34, y + h / 2, 22, popIn(t, cHeart, 0.4) * (wrongHat ? 0 : 1));
        out += psBlockRing(B.x, y, B.w, h, bump(t, cChange, 0.8), P.gold);
      }
      if (k === 0) {
        out += psBlockRing(B.x, y, B.w, h, on(t, hatAt, 0.5) * (psPast(t, cWrong) ? 1 : 0.6), wrongHat ? P.bad : P.gold);
        out += MK.cross(B.x + B.w - 34, y + h / 2, 22, popIn(t, cWrong, 0.4));
      }
    });

    /* the board's own answer, each time the input is given */
    out += psGridRing(g, bump(t, cGot, 1.0), P.bad) + psGridRing(g, bump(t, cShows, 1.0), P.good);
    out += MK.cross(g.box.x + g.box.w - 26, g.box.y + 18, 30,
      Math.min(1.1, popIn(t, cGot == null ? null : cGot + 0.4, 0.4) * (psPast(t, cHeart) ? 0 : 1) +
        popIn(t, wrongHat ? cNothing : null, 0.4)));
    out += MK.tick(g.box.x + g.box.w - 26, g.box.y + 18, 30, popIn(t, cShows, 0.4) * (wrongHat ? 0 : 1));

    /* test it again, and the word for doing that */
    out += MK.pill(g.box.x + g.box.w / 2, 410, "press A again to test", on(t, cTest, 0.5) * (1 - on(t, cDebug, 0.5)),
      { size: 23, col: P.gold, ink: P.gold });
    /* it fades again in the last beat, where the bottom of the frame belongs
       to the wrong input */
    var dg = on(t, cDebug, 0.5) * (1 - on(t, cNothing, 0.4));
    if (dg > 0) {
      out += Em(92, 410, 40, "\u{1F41B}", { opacity: dg });
      out += MK.pill(178, 410, "test", dg, { size: 23, col: P.good, ink: P.good });
      out += MK.arrow(218, 410, 268, 410, on(t, cDebug == null ? null : cDebug + 0.25, 0.4), P.good, 6);
      out += MK.pill(310, 410, "fix", dg, { size: 23, col: P.good, ink: P.good });
      out += MK.arrow(352, 410, 402, 410, on(t, cDebug == null ? null : cDebug + 0.45, 0.4), P.good, 6);
      out += MK.pill(492, 410, "test again", dg, { size: 23, col: P.good, ink: P.good });
    }
    out += MK.pill(g.box.x + g.box.w / 2, 410, "the wrong input", on(t, cWrong, 0.5), { size: 23, col: P.bad, ink: P.bad });
    return svg(out);
  }
