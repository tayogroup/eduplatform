  /* ==== Debugging Together, part 3: saying it out loud, real programmers, and
     what you now know ==========================================================
     tools/lib/film-scenes/computing-g2/debugging-together-3.js. See the header
     of debugging-together.js.

     "Say it out loud" is the lesson's own demo frame: Sami reads move right,
     jump, spin, and hears that the last block is a spin where the goal wanted a
     jump. The cross lands on that BLOCK. Sami himself is never marked.

     "Programmers do it too" is the lesson's Computing world step, its four
     places reduced to the three the narration names. */

  /* ==== chapter: say it out loud ================================================= */
  var DT_A_PROG = ["right", "jump", "spin"];
  var DT_A_ROW = { x: 290, w: 400, h: 88, top: 80, gap: 18 };
  function dtARowY(k) { return DT_A_ROW.top + k * (DT_A_ROW.h + DT_A_ROW.gap); }   /* 80, 186, 292 */
  var DT_A_SAID = ["Move right", "Jump", "Spin"];

  function dtAloudChapter(scene, beat, t, i) {
    var cExplain = sc(scene, 0, "explain"), cDebug = sc(scene, 0, "debug");
    var cRead = sc(scene, 1, "read"), cRight = sc(scene, 1, "right"),
      cJump = sc(scene, 1, "jump"), cSpin = sc(scene, 1, "spin");
    var cSpinq = sc(scene, 2, "spinq"), cWanted = sc(scene, 2, "wanted"), cHears = sc(scene, 2, "hears");
    var cEars = sc(scene, 3, "ears"), cEyes = sc(scene, 3, "eyes");
    var cSlowly = sc(scene, 4, "slowly"), cMatch = sc(scene, 4, "match");
    var out = "", said = [cRight, cJump, cSpin];

    /* Sami, reading his blocks out loud */
    var ps = popIn(t, cExplain, 0.45);
    out += MK.pop(Em(110, 216, 112, DT_SAMI), 110, 216, ps);
    out += Tx(110, 300, "Sami", "lab big", "middle", { opacity: Math.min(1, ps) });
    out += MK.waves(168, 228, t, cRead, { dir: 0, spread: 1.0, reach: 96, col: P.plum,
      until: cSpinq == null ? null : cSpinq + 0.2 });

    /* the three blocks, and what he says as he reads each one */
    DT_A_PROG.forEach(function (id, k) {
      var wrong = k === 2 && dtPast(t, cWanted);
      var sweep = cSlowly == null ? null : cSlowly + k * 0.34;
      var lit = dtPast(t, said[k]) && !dtPast(t, cSpinq) ? P.gold
        : bump(t, sweep, 0.8) > 0.15 ? P.gold : null;
      out += dtRow(DT_A_ROW.x, dtARowY(k), DT_A_ROW.w, DT_A_ROW.h, k + 1, id,
        { o: on(t, cExplain == null ? null : cExplain + k * 0.22, 0.4),
          col: wrong ? P.bad : k === 2 && dtPast(t, cSpinq) ? P.gold : lit,
          mark: wrong ? "cross" : null, markP: popIn(t, cWanted, 0.4) });
      out += MK.ripple(DT_A_ROW.x + 46, dtARowY(k) + DT_A_ROW.h / 2, t, said[k], P.plum);
      out += MK.pill(880, dtARowY(k) + 44, DT_A_SAID[k], on(t, said[k], 0.4),
        { size: 26, col: k === 2 && dtPast(t, cSpinq) ? P.bad : P.plum,
          ink: k === 2 && dtPast(t, cSpinq) ? P.bad : P.ink });
    });

    out += MK.pill(880, 60, "this is debugging", on(t, cDebug, 0.5) * (1 - on(t, cRight, 0.5)),
      { size: 24, col: P.plum, ink: P.plum });
    out += MK.pill(880, 402, "we wanted: jump", on(t, cWanted, 0.45),
      { size: 24, col: P.good, ink: P.good });

    /* he hears it himself: the ear catches what the eyes walked past */
    var pe = popIn(t, cHears, 0.45);
    out += MK.glow(226, 150, 74, P.good, Math.min(1, pe) * 0.9);
    out += MK.pop(Em(226, 150, 64, "\u{1F442}"), 226, 150, Math.max(pe, popIn(t, cEars, 0.4)));
    out += Tx(226, 202, "ears", "lab mid good", "middle", { opacity: on(t, cEars, 0.45) });
    var pey = on(t, cEyes, 0.5);
    out += G(Em(226, 308, 58, "\u{1F440}") + Tx(226, 358, "eyes", "lab mid muted", "middle"),
      { opacity: pey * 0.42 });

    /* say it slowly, and check it against the goal */
    out += G(R(290, 6, 850, 58, 16, P.card, P.gold, 3) +
      Tx(310, 42, "we wanted: move right, then jump, then jump", "lab", "start", { "font-size": 24 }),
      { opacity: on(t, cMatch, 0.5) });
    out += MK.qmark(1078, 232, 30, on(t, cMatch, 0.5));
    return svg(out);
  }

  /* ==== chapter: programmers do it too =========================================== */
  var DT_P_CARD = { y: 84, h: 252, w: 350 };
  var DT_P_X = [36, 409, 782];

  function dtProCard(k, title, sub, art, lit) {
    var x = DT_P_X[k], y = DT_P_CARD.y, w = DT_P_CARD.w, h = DT_P_CARD.h, cx = x + w / 2;
    var on2 = Math.min(1, lit);
    return G(R(x, y, w, h, 22, on2 > 0 ? "#1B3A52" : P.card, on2 > 0 ? P.good : P.line, on2 > 0 ? 3 : 2) +
      art(cx, y) +
      Tx(cx, y + 196, title, "lab big", "middle") +
      Tx(cx, y + 228, sub, "lab mid muted readable", "middle"),
      { opacity: 0.32 + 0.68 * on2, transform: around(cx, y + h / 2, 0.96 + 0.04 * Math.min(lit, 1.08)) });
  }

  function dtProsChapter(scene, beat, t, i) {
    var cPairs = sc(scene, 0, "pairs"), cTeams = sc(scene, 0, "teams");
    var cShare = sc(scene, 1, "share"), cTypes = sc(scene, 1, "types"), cWatches = sc(scene, 1, "watches");
    var cRead = sc(scene, 2, "read"), cMissed = sc(scene, 2, "missed");
    var cTeam = sc(scene, 3, "team"), cJob = sc(scene, 3, "job");
    var cTog = sc(scene, 4, "together"), cBig = sc(scene, 4, "big"), cYou = sc(scene, 4, "you");

    /* ---- the shared screen (the first two beats) */
    function oneScreen() {
      var o = "";
      o += R(404, 92, 360, 216, 20, P.card, P.line, 2);
      /* the program on the shared screen is this film's own buggy one, so the
         block the watcher spots is a block the child has already met */
      ["grow", "spin", "jump"].forEach(function (id, k) {
        o += dtTile(424, 112 + k * 58, 320, 48, id, on(t, cPairs, 0.5),
          k === 1 && dtPast(t, cWatches) ? P.gold : null,
          k === 1 && dtPast(t, cWatches) ? "bug" : null, popIn(t, cWatches, 0.4));
      });
      var pp = popIn(t, cPairs, 0.45), pt = popIn(t, cTeams, 0.45);
      o += MK.pop(Em(230, 220, 110, "\u{1F469}‍\u{1F4BB}"), 230, 220, pp);
      o += MK.pop(Em(938, 220, 110, "\u{1F468}‍\u{1F4BB}"), 938, 220, pp);
      o += MK.pop(Em(108, 320, 78, "\u{1F9D1}"), 108, 320, pt);
      o += MK.pop(Em(1062, 320, 78, "\u{1F9D1}"), 1062, 320, pt);
      o += MK.leader(292, 218, 396, 196, on(t, cShare, 0.6), P.good);
      o += MK.leader(876, 218, 772, 196, on(t, cShare, 0.6), P.good);
      o += MK.pop(Em(230, 312, 54, "⌨️"), 230, 312, popIn(t, cTypes, 0.4));
      o += Tx(230, 362, "types", "lab mid muted", "middle", { opacity: on(t, cTypes, 0.45) });
      o += MK.pop(Em(938, 140, 42, "\u{1F440}"), 938, 140, popIn(t, cWatches, 0.4));
      o += Tx(938, 314, "watches for bugs", "lab mid muted", "middle", { opacity: on(t, cWatches, 0.45) });
      o += Tx(584, 336, "one screen, two people", "lab mid muted", "middle", { opacity: on(t, cShare, 0.5) });
      return o;
    }

    /* ---- the three places the lesson names (the last three beats) */
    function threeCards() {
      var o = "";
      o += dtProCard(0, "Read it", "find bugs the writer missed", function (cx, y) {
        return Em(cx - 38, y + 86, 78, "\u{1F4D6}") + Em(cx + 44, y + 70, 54, "\u{1F50D}") +
          MK.pop(Em(cx + 44, y + 118, 36, "\u{1F41B}"), cx + 44, y + 118, popIn(t, cMissed, 0.4));
      }, popIn(t, cRead, 0.45));
      o += dtProCard(1, "Test it", "one job: find every bug", function (cx, y) {
        var n = tally(t, cJob, 3, 0.7), s = "";
        for (var k = 0; k < n; k++) s += Em(cx - 52 + k * 52, y + 148, 34, "\u{1F41B}");
        return Em(cx - 38, y + 80, 76, "\u{1F3AE}") + Em(cx + 44, y + 72, 56, "\u{1F9D1}") + s;
      }, popIn(t, cTeam, 0.45));
      o += dtProCard(2, "Together", "how big programs get made", function (cx, y) {
        var n = tally(t, cBig, 3, 0.6), s = "";
        /* the rows of a big program, clear of the card's own title below them */
        for (var k = 0; k < n; k++) s += R(cx - 72, y + 120 + k * 16, 144, 11, 5, P.good, null, null, { opacity: 0.8 });
        return Em(cx - 40, y + 74, 74, DT_SAMI) + Em(cx + 38, y + 74, 74, DT_AMAL) + s;
      }, popIn(t, cTog, 0.45));
      o += MK.tick(1082, 116, 26, popIn(t, cYou, 0.4));
      return o;
    }

    var u = into(t, scene.first + 2), out = "";
    if (u < 1) out += G(oneScreen(), { opacity: 1 - u });
    if (u > 0) out += G(threeCards(), { opacity: u });
    return svg(out);
  }

  /* ---- what you now know -------------------------------------------------------
     The lesson's own habits, in the order the film taught them. */
  var DT_RECAP = MK.recapKind([
    { beat: 0, at: "run", title: "Run it", sub: "watch what really happens", pic: "▶️" },
    { beat: 0, at: "find", title: "Find the block", sub: "the one that is wrong", pic: "\u{1F50D}" },
    { beat: 1, at: "test", title: "Test every fix", sub: "there may be a second bug", pic: "\u{1F501}" },
    { beat: 2, at: "ask", title: "Ask a partner", sub: "fresh eyes see more", pic: "\u{1F465}" },
    { beat: 2, at: "explain", title: "Say it out loud", sub: "you hear the wrong block", pic: "\u{1F5E3}️" }
  ], { goBeat: 3, goAt: "faster" });

  var KINDS = {
    title: MK.titleKind({ sub: [
      "How to run, find and fix a bug",
      "Why one program can have two bugs",
      "Why two heads are better than one"
    ] }),
    run: dtRunChapter, two: dtTwoChapter, heads: dtHeadsChapter,
    aloud: dtAloudChapter, pros: dtProsChapter, recap: DT_RECAP
  };
