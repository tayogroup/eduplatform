  /* ==== Grade 1 Computing, Lesson 1: What Is an Algorithm? ====================
     tools/lib/film-scenes/computing-g1/what-is-an-algorithm.js, with -2.js and
     -3.js: the film's pictures, after the shared marks (MK) and before the
     engine's tail, all in one scope. The storyboard is
     computing/grade-1-app/lecture-video/what-is-an-algorithm.json.

     The lesson's own drawings come from ART, so the child watches here the
     picture they tap two steps later: ART.scene "dress" and "teeth" for the
     everyday algorithms, "handwash" built one step at a time, "tower" and
     "plant" for the two ordering activities - and each of those two AGAIN in
     the wrong order, which is drawn by passing the wrong list and nothing
     else (the kit paints later ids over earlier ones), and ART.figure
     "laptop" for the program.

     Computing has no ART.sim, so the toaster, the code card and the step
     lists are drawn here in the engine's idiom. Nothing in them restates a
     rule the kit owns.

     This file: the palette, the timing helpers, the small drawings the film
     shares, the title motif and the chapter "Robo needs steps". Every
     top-level name starts with wa, so nothing here can replace a name of the
     engine, ART or MK. */

  var HUE = {
    title: P.teal, robo: P.gold, everyday: P.plum, follow: P.blue,
    order: P.accent, computers: P.good, same: P.gold, recap: P.teal
  };

  /* ---- timing ---------------------------------------------------------------- */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 comes
     in: for a thing that belongs to that beat alone */
  function waOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function waFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }

  /* ---- colour ----------------------------------------------------------------- */
  function waMix(a, b, u) {
    u = clamp(u, 0, 1);
    var pa = parseInt(String(a).slice(1), 16), pb = parseInt(String(b).slice(1), 16);
    var r = Math.round(lerp((pa >> 16) & 255, (pb >> 16) & 255, u));
    var g = Math.round(lerp((pa >> 8) & 255, (pb >> 8) & 255, u));
    var bl = Math.round(lerp(pa & 255, pb & 255, u));
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1);
  }

  /* ---- the lesson's scenes, fitted ---------------------------------------------
     Each kit scene has its own viewBox, and ART.place keeps its aspect, so a
     box of the wrong shape would letterbox inside its card. The width is
     worked out from the height instead. */
  var WA_ASPECT = { dress: 320 / 300, teeth: 320 / 240, handwash: 320 / 240, tower: 320 / 260, plant: 320 / 240 };
  function waSceneW(name, h) { return h * WA_ASPECT[name]; }
  function waScene(name, ids, cx, top, h) {
    var w = waSceneW(name, h);
    return ART.place(ART.scene(name, ids), cx - w / 2, top, w, h);
  }
  /* a card to stand a picture in: lit while its half of the chapter is being
     talked about, quiet when it is not */
  function waCard(x, y, w, h, lit) {
    return R(x, y, w, h, 22, lit > 0.5 ? "#16354B" : P.card, lit > 0.5 ? P.teal : P.line, lit > 0.5 ? 3 : 2);
  }

  /* ---- small drawings the film shares -------------------------------------------- */

  /* a slice of bread with a domed top, centred on (cx, cy); brown 0 -> 1 is
     raw bread -> toast (the kit's own bread is #D9A15A on #A9552B) */
  function waBread(cx, cy, w, brown, o) {
    if (!(o > 0)) return "";
    var h = w * 1.06, x = cx - w / 2, yb = cy + h / 2, ya = cy - h / 2 + h * 0.42;
    var fill = waMix("#E8C48C", "#B3702F", brown), stroke = waMix("#C9924E", "#7C4A1E", brown);
    var d = "M" + n2(x) + "," + n2(yb) + " L" + n2(x) + "," + n2(ya) +
      " A" + n2(w / 2) + "," + n2(h * 0.42) + " 0 0 1 " + n2(x + w) + "," + n2(ya) +
      " L" + n2(x + w) + "," + n2(yb) + " Z";
    return G(Pth(d, fill, stroke, 3), { opacity: clamp(o, 0, 1) });
  }
  /* butter spread across the top of a slice, p of the way */
  function waButter(cx, cy, w, p) {
    if (!(p > 0)) return "";
    var h = w * 1.06;
    return R(cx - w * 0.38, cy - h * 0.05, w * 0.76 * clamp(p, 0, 1), 14, 7, "#F4C95D", "#D0A326", 2);
  }
  /* a seed, the colour the kit's plant scene draws */
  function waSeedMark(cx, cy, r, o) {
    if (!(o > 0)) return "";
    return E(cx, cy, r, r * 0.66, "#C7A76B", "#8B6A3A", Math.max(2, r * 0.2), { opacity: clamp(o, 0, 1) });
  }
  /* a numbered step bead: the film's one shape for "step n" */
  function waBead(cx, cy, r, n, p, col) {
    if (!(p > 0)) return "";
    col = col || P.teal;
    return G(C(cx, cy, r, P.cell, col, Math.max(2, r * 0.14)) +
      Tx(cx, cy + r * 0.38, String(n), "lab", "middle", { "font-size": r * 1.05, fill: col }),
      { transform: around(cx, cy, Math.min(p, 1.1)), opacity: Math.min(1, p) });
  }

  /* ==== the title motif ==========================================================
     What an algorithm is, as one picture: four numbered steps in a list, an
     arrow down the side for the order, and a tick at the end for the job
     done. In the spoken title chapter the rows arrive on "in steps", the
     arrow draws on "one after another", the tick pops on "an algorithm", and
     a child and a computer appear on the second line. Behind the two cards
     it simply stands, finished. */
  function titleMotif(o) {
    var t = o.t || 0, lit = !!o.scene;
    var at = function (k, name) { return lit ? sc(o.scene, k, name) : null; };
    var out = "";
    out += R(52, 16, 256, 260, 24, "#123247", P.line, 3);
    var cSteps = at(0, "steps");
    for (var k = 0; k < 4; k++) {
      var y = 50 + k * 54;
      var p = lit ? popIn(t, cSteps == null ? null : cSteps + k * 0.22, 0.34) : 1;
      if (!(p > 0)) continue;
      out += G(C(88, y, 19, P.cell, P.line, 2) + Tx(88, y + 8, String(k + 1), "lab", "middle", { fill: P.teal }) +
        R(118, y - 16, 170, 32, 16, P.cell, P.line, 2),
        { transform: around(88, y, Math.min(p, 1.1)), opacity: Math.min(1, p) });
    }
    out += MK.arrow(34, 52, 34, 210, lit ? on(t, at(0, "order"), 0.7) : 1, P.gold, 8);
    out += MK.tick(276, 248, 21, lit ? popIn(t, at(0, "algo"), 0.4) : 1);
    out += MK.pop(Em(112, 312, 42, "\u{1F9D2}"), 112, 312, lit ? popIn(t, at(1, "you"), 0.38) : 1);
    out += MK.pop(Em(248, 312, 42, "\u{1F4BB}"), 248, 312, lit ? popIn(t, at(1, "computer"), 0.38) : 1);
    return '<svg viewBox="0 0 360 360" role="img" aria-label="Four numbered steps in order, with a tick at the end">' + out + "</svg>";
  }

  /* ==== chapter: Robo needs steps ================================================
     The lesson's toast demo. Robo on the left with what it wants in a thought
     card; the toaster in the middle, drawn here because the lesson keeps its
     demo in frames rather than in a drawing a film can lift; the five steps
     listed on the right, each ticking as it is said. The bread is taken, goes
     in, the lever goes down, it browns, it pops up and is buttered - one
     action per cue, each finishing inside its own line. */
  var WA_T = { x: 400, y: 198, w: 190, h: 146, cx: 495, counter: 344 };

  function waToaster(t, pLever, warm) {
    var out = "";
    out += R(330, WA_T.counter, 312, 14, 7, "#C9B79C");
    out += MK.glow(WA_T.cx, 280, 110, P.accent, warm * 0.75);
    out += R(WA_T.x, WA_T.y, WA_T.w, WA_T.h, 26, "#B9C8D6", "#93AABE", 4);
    out += R(414, 184, 162, 26, 13, "#93AABE", "#7E93A6", 3);
    out += R(426, 190, 138, 14, 7, "#0B1D2C");
    out += R(WA_T.x, 262, WA_T.w, 9, 4, "#A7B9C8");
    out += R(594, 220, 12, 86, 6, "#7E93A6");
    out += R(584, lerp(218, 284, clamp(pLever, 0, 1)), 30, 20, 10, P.accent, "#B4562F", 2);
    out += C(556, 314, 16, "#93AABE", "#0B1D2C", 3) + L(556, 314, 556, 303, "#0B1D2C", 3);
    out += C(436, 314, 8, warm > 0.2 ? P.accent : "#7E93A6");
    return out;
  }

  function waRoboChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cRobo = c(0, "robo"), cGuess = c(0, "guess");
    var cTold = c(1, "told"), cEvery = c(1, "every");
    var cBread = c(2, "bread"), cIn = c(2, "toaster"), cLever = c(2, "lever");
    var cWait = c(3, "wait"), cButter = c(3, "butter");
    var cDone = c(4, "toast"), cFive = c(4, "five"), cAlgo = c(4, "algo");
    var out = "";

    /* when it pops: part way between "Wait for it" and "spread the butter",
       so the pop is over before the butter is named however fast the real
       voice turns out to be */
    var cPop = cWait == null ? null : (cButter == null ? cWait + 1.0 : cWait + (cButter - cWait) * 0.5);

    var pIn = on(t, cIn, 0.8), pLever = on(t, cLever, 0.5), pPop = on(t, cPop, 0.42);
    var brown = cWait == null ? 0 : clamp((t - cWait) / 1.1, 0, 1);
    var warm = on(t, cLever, 0.6) * (1 - on(t, cDone, 0.6));

    /* Robo, and what it wants */
    out += Em(130, 250, 190, "\u{1F916}");
    var think = on(t, cRobo, 0.45) * (1 - into(t, scene.first + 2));
    if (think > 0) {
      out += G(C(196, 158, 11, P.card, P.gold, 2) + C(176, 180, 7, P.card, P.gold, 2) +
        R(196, 44, 116, 96, 18, P.card, P.gold, 2) + waBread(254, 92, 58, 1, 1), { opacity: think });
    }
    out += MK.qmark(300, 200, 28, popIn(t, cGuess, 0.4) * waOnly(t, scene, 0));

    /* the toaster, with the slice on its way through it */
    var sx = 358, sy = 304;
    if (pPop > 0) { sx = WA_T.cx; sy = lerp(272, 132, pPop); }
    else if (pIn > 0) {
      if (pIn < 0.55) { var u = pIn / 0.55; sx = lerp(358, WA_T.cx, u); sy = lerp(304, 132, u); }
      else { var v = (pIn - 0.55) / 0.45; sx = WA_T.cx; sy = lerp(132, 272, v); }
    }
    var slice = popIn(t, cBread, 0.4);
    out += G(waBread(sx, sy, 76, brown, 1) + waButter(sx, sy, 76, on(t, cButter, 0.9)),
      { transform: around(sx, sy, Math.min(slice, 1.1)), opacity: Math.min(1, slice) });
    out += waToaster(t, pLever, warm);

    /* the wait, and the pop */
    var waiting = on(t, cWait, 0.4) * (1 - on(t, cPop, 0.3));
    out += MK.pop(Em(WA_T.cx, 132, 60, "\u{23F3}"), WA_T.cx, 132, waiting);
    out += MK.ripple(WA_T.cx, 190, t, cPop, P.gold);
    out += MK.pop(Em(584, 122, 46, "\u{2728}"), 584, 122, popIn(t, cDone, 0.4));
    out += MK.glow(sx, sy, 78, P.gold, on(t, cDone, 0.5) * (0.6 + 0.4 * breathe(t)));

    /* the five steps, listed as they are said */
    var panel = on(t, cTold, 0.5);
    out += R(652, 62, 476, 324, 22, P.card, P.line, 2, { opacity: panel });
    var ys = [122, 176, 230, 284, 338];
    for (var k = 0; k < 5; k++) {
      out += R(668, ys[k] - 24, 444, 48, 24, P.cell, null, null, { opacity: 0.6 * on(t, cEvery == null ? null : cEvery + k * 0.07, 0.35) });
    }
    var cues = [cBread, cIn, cLever, cWait, cButter];
    var words = ["take the bread", "put it in", "push the lever", "wait", "spread the butter"];
    var rows = [];
    for (var r = 0; r < 5; r++) {
      rows.push({ text: words[r], at: cues[r], mark: "tick", markAt: cues[r] == null ? null : cues[r] + 0.6 });
    }
    out += MK.list(686, 122, rows, t, { lh: 54, cls: "lab big", markR: 16 });
    out += R(652, 62, 476, 324, 22, "none", P.gold, 4, { opacity: on(t, cFive, 0.45) });
    out += MK.pill(890, 414, "5 steps = an algorithm", on(t, cAlgo, 0.45), { size: 26, col: P.gold, ink: P.gold });
    return svg(out);
  }
