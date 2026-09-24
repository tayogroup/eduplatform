  /* ==== Mistakes Make Programs Better, part 2: two bugs, and the rules =======
     tools/lib/film-scenes/computing-g3/mistakes-make-programs-better-2.js.
     See the header of mistakes-make-programs-better.js.

     The two-bug chapter is round 1 of the lesson's own two-bug debugger: the
     goal is shrink, jump, hide and the program is grow, jump, spin, with the
     bugs at blocks 1 and 3. The cat's sizes are the LESSON'S arithmetic, read
     out of ART.run once here rather than copied: grow is x1.4 capped at 2.2 and
     shrink divides by 1.4. Every mark lands on a block; the cat is never
     crossed, because the cat did exactly what it was told. */

  /* ---- what the lesson's own blocks do to the cat -----------------------------
     worked out once, beside the film's other constants, and never inside a draw
     function (ART.run mounts the kit's stage and runs the script) */
  var MB_GROW = ART.run("\u{1F431}", ["grow"])[0].scale;
  var MB_SHRINK = ART.run("\u{1F431}", ["shrink"])[0].scale;
  var MB_HIDDEN_O = 0.18;

  var MB_GOAL = ["shrink", "jump", "hide"];
  var MB_PROG = ["grow", "jump", "spin"];

  var MB_COL = { x: 40, w: 300 }, MB_PCOL = { x: 386, w: 320 },
    MB_STAGE = { x: 752, y: 82, w: 376, h: 268 };

  /* the cat on the lesson's stage: its size is the kit's, its turn and its hop
     are the film's, and both finish inside the beat that names them */
  function mbSpin(t, at) {
    if (at == null || t < at) return 0;
    return 360 * ease((t - at) / 0.9);
  }
  function mbHop(t, at) {
    if (at == null || t < at || t > at + 0.6) return 0;
    return -74 * Math.sin(Math.PI * (t - at) / 0.6);
  }
  function mbCat(cx, groundY, base, scale, ang, dy, o) {
    if (!(o > 0)) return "";
    var size = base * scale, cy = groundY - size / 2 - 8 + dy;
    return G(Em(cx, cy, size, "\u{1F431}"),
      { opacity: clamp(o, 0, 1), transform: "rotate(" + n2(ang) + " " + n2(cx) + " " + n2(cy) + ")" });
  }

  /* ==== chapter: two bugs, not one ==============================================
     Three columns: what you wanted, your program, and what happens. A bug lands
     on the block that is wrong, one at a time; the fixed block FADES INTO ITS
     OWN SLOT, so the blocks above it never move. */
  function mbTwoBugsChapter(scene, beat, t, i) {
    var cGoal = sc(scene, 0, "goal"), cWanted = sc(scene, 0, "wanted");
    var cRun = sc(scene, 1, "run"), cGrows = sc(scene, 1, "grows"), cJumps = sc(scene, 1, "jumps"),
      cSpins = sc(scene, 1, "spins"), cTwo = sc(scene, 1, "two");
    var cFirst = sc(scene, 2, "first"), cBug = sc(scene, 2, "bug");
    var cFix = sc(scene, 3, "fix"), cRun2 = sc(scene, 3, "run"), cStill = sc(scene, 3, "still");
    var cSecond = sc(scene, 4, "second"), cBehind = sc(scene, 4, "behind");
    var cChange = sc(scene, 5, "change"), cAgain = sc(scene, 5, "again"), cRight = sc(scene, 5, "right");
    var out = "";

    var fix1 = on(t, cFix, 0.55), fix2 = on(t, cChange, 0.55);
    var look1 = mbPast(t, cFirst) && !mbPast(t, cSecond);
    var look2 = mbPast(t, cSecond);

    /* ---- what you wanted */
    var goalShown = tally(t, cGoal, 3, 0.9);
    out += Tx(MB_COL.x + MB_COL.w / 2, 40, "What you wanted", "lab mid muted", "middle",
      { "font-size": 22, opacity: on(t, cGoal, 0.45) });
    MB_GOAL.forEach(function (id, k) {
      if (k >= goalShown) return;
      out += mbBlock(MB_COL.x, 66 + k * 94, MB_COL.w, 76, id,
        { o: on(t, cGoal, 0.4), col: P.good, fill: P.card, fs: 24 });
    });
    out += MK.tick(MB_COL.x + MB_COL.w - 22, 56, 20, popIn(t, cWanted, 0.4) * (1 - on(t, cRun, 0.4)));

    /* ---- your program: the same three slots throughout */
    out += Tx(MB_PCOL.x + MB_PCOL.w / 2, 40, "Your program", "lab mid muted", "middle",
      { "font-size": 22, opacity: on(t, cRun, 0.45) });
    var py = [60, 166, 272], ph = 86, po = on(t, cRun, 0.5);
    var bad1 = mbPast(t, cTwo) && fix1 < 0.5, bad2 = mbPast(t, cTwo) && fix2 < 0.5;
    /* only while the film is looking at the OTHER block: once both are fixed the
       whole program stands equally bright again */
    var dim1 = look2 && !mbPast(t, cChange) ? 0.45 : 1, dim2 = look1 ? 0.45 : 1;
    out += G(mbBlockSwap(MB_PCOL.x, py[0], MB_PCOL.w, ph, "grow", "shrink", fix1,
      { o: po, n: 1, fs: 26, col: bad1 ? P.bad : null, mark: mbPast(t, cBug) ? "bug" : null, markP: popIn(t, cBug, 0.4) },
      { o: po, n: 1, fs: 26, col: P.good, mark: "tick", markP: popIn(t, mbAfter(cFix, 0.3), 0.4) }),
      { opacity: dim1 });
    out += mbBlock(MB_PCOL.x, py[1], MB_PCOL.w, ph, "jump", { o: po, n: 2, fs: 26 });
    out += G(mbBlockSwap(MB_PCOL.x, py[2], MB_PCOL.w, ph, "spin", "hide", fix2,
      { o: po, n: 3, fs: 26, col: bad2 ? P.bad : null, mark: mbPast(t, cSecond) ? "bug" : null, markP: popIn(t, cSecond, 0.4) },
      { o: po, n: 3, fs: 26, col: P.good, mark: "tick", markP: popIn(t, mbAfter(cChange, 0.3), 0.4) }),
      { opacity: dim2 });
    /* the block being looked at, ringed one at a time */
    if (look1) out += R(MB_PCOL.x - 8, py[0] - 8, MB_PCOL.w + 16, ph + 16, 28, "none", P.gold, 4,
      { opacity: on(t, cFirst, 0.4) * (1 - on(t, cSecond, 0.4)) });
    if (look2) out += R(MB_PCOL.x - 8, py[2] - 8, MB_PCOL.w + 16, ph + 16, 28, "none", P.gold, 4,
      { opacity: on(t, cSecond, 0.4) });
    out += MK.ripple(MB_PCOL.x + 40, py[0] + ph / 2, t, cFix, P.good);
    out += MK.ripple(MB_PCOL.x + 40, py[2] + ph / 2, t, cChange, P.good);
    /* the second bug was behind the first: a line down the OUTSIDE of the column,
       so it never draws across the block in between */
    out += MK.leader(MB_PCOL.x - 20, py[0] + ph / 2, MB_PCOL.x - 20, py[2] + ph / 2,
      on(t, cBehind, 0.6) * (1 - on(t, cChange, 0.5)), P.gold);

    /* ---- what happens: the lesson's own stage */
    out += Tx(MB_STAGE.x + MB_STAGE.w / 2, 40, "What happens", "lab mid muted", "middle",
      { "font-size": 22, opacity: on(t, cRun, 0.45) });
    var so = on(t, cRun, 0.5);
    out += G(R(MB_STAGE.x, MB_STAGE.y, MB_STAGE.w, MB_STAGE.h, 22, P.cell, P.line, 2) +
      L(MB_STAGE.x + 24, MB_STAGE.y + MB_STAGE.h - 34, MB_STAGE.x + MB_STAGE.w - 24, MB_STAGE.y + MB_STAGE.h - 34, P.line, 4),
      { opacity: so });
    var ground = MB_STAGE.y + MB_STAGE.h - 34, cx = MB_STAGE.x + MB_STAGE.w / 2;
    var scale = 1;
    if (mbPast(t, cGrows)) scale = lerp(1, MB_GROW, on(t, cGrows, 0.5));
    if (mbPast(t, cRun2)) scale = lerp(MB_GROW, MB_SHRINK, on(t, cRun2, 0.6));
    var ang = mbSpin(t, cSpins) + mbSpin(t, cStill);
    var hidden = on(t, mbAfter(cAgain, 0.35), 0.6);
    out += mbCat(cx, ground, 96, scale, ang, mbHop(t, cJumps), so * lerp(1, MB_HIDDEN_O, hidden));
    if (hidden > 0.4) out += Tx(cx, MB_STAGE.y + MB_STAGE.h + 26, "hidden", "lab mid muted", "middle",
      { "font-size": 22, opacity: clamp((hidden - 0.4) / 0.4, 0, 1) });
    /* the run button, pressed on each run */
    var bx = MB_STAGE.x + 44, by = MB_STAGE.y + MB_STAGE.h + 24;
    if (so > 0) out += G(MK.pill(bx, by, "Run", 1, { size: 22, anchor: "start", col: P.good, ink: P.good }), { opacity: so });
    out += MK.ripple(bx + 44, by, t, cRun, P.good);
    out += MK.ripple(bx + 44, by, t, cRun2, P.good);
    out += MK.ripple(bx + 44, by, t, cAgain, P.good);
    out += MK.tick(MB_STAGE.x + MB_STAGE.w - 34, MB_STAGE.y + 32, 26, popIn(t, cRight, 0.45));
    return svg(out);
  }

  /* ==== chapter: a mistake becomes a rule ======================================
     The lesson's own sorter, three rows of it: on the left the mistake somebody
     made, on the right the rule they wrote for next time. The mistakes are the
     lesson's own words, shortened to fit; the rules are its own bin labels. */
  var MB_RULES = [
    { mistake: "began in the wrong place", pic: "\u{1F3E0}", rule: "Reset first" },
    { mistake: "the repeat repeated a spin", pic: "\u{1F501}", rule: "Check after the repeat" },
    { mistake: "fixed it, but never ran it", pic: "▶️", rule: "Run again after a fix" }
  ];
  var MB_RROW = { h: 96, gap: 22, top: 72 };
  function mbRuleY(k) { return MB_RROW.top + k * (MB_RROW.h + MB_RROW.gap); }

  function mbRulesChapter(scene, beat, t, i) {
    var cMistakes = sc(scene, 0, "mistakes"), cRules = sc(scene, 0, "rules");
    var at = [
      { a: sc(scene, 1, "place"), b: sc(scene, 1, "reset") },
      { a: sc(scene, 2, "repeat"), b: sc(scene, 2, "check") },
      { a: sc(scene, 3, "never"), b: sc(scene, 3, "again") }
    ];
    var cNext = sc(scene, 4, "next"), cLast = sc(scene, 4, "last");
    var out = "", h = MB_RROW.h;
    var done = tally(t, cNext, 3, 0.8), fade = on(t, cLast, 0.6);

    out += Tx(300, 44, "The mistake", "lab mid muted", "middle",
      { "font-size": 22, opacity: on(t, cMistakes, 0.45) });
    out += Tx(900, 44, "The rule for next time", "lab mid muted", "middle",
      { "font-size": 22, opacity: on(t, cRules, 0.45) });

    var shown = tally(t, cMistakes, 3, 0.8);
    MB_RULES.forEach(function (r, k) {
      var y = mbRuleY(k), lit = mbPast(t, at[k].a) && !mbPast(t, at[k].b);
      /* the mistake */
      if (k < shown) {
        var mo = on(t, cMistakes, 0.45) * (1 - 0.55 * fade);
        out += G(R(40, y, 520, h, 24, P.cell, lit ? P.gold : P.line, lit ? 4 : 2) +
          Em(92, y + h / 2, 42, "⚠️") +
          Tx(136, y + h / 2 + 9, r.mistake, "lab", "start", { "font-size": 24 }), { opacity: mo });
        out += MK.ripple(92, y + h / 2, t, at[k].a, P.gold);
      }
      /* the rule: an empty page until it is said, then the rule itself */
      var ru = on(t, at[k].b, 0.5), ticked = k < done;
      if (ru < 1) out += mbSlot(672, y, 456, h, null, on(t, cRules, 0.45) * (1 - ru));
      if (ru > 0) {
        out += G(R(672, y, 456, h, 24, "#1B3A52", ticked ? P.good : P.plum, ticked ? 4 : 3) +
          Em(718, y + h / 2, 38, r.pic) +
          Tx(754, y + h / 2 + 9, r.rule, "lab", "start", { "font-size": 25 }) +
          MK.tick(1096, y + h / 2, 21, popIn(t, mbAfter(cNext, k * 0.3), 0.4)),
          { opacity: ru, transform: around(900, y + h / 2, Math.min(1.03, 0.97 + ru * 0.06)) });
        out += MK.arrow(576, y + h / 2, 648, y + h / 2, ru, ticked ? P.good : P.plum, 7);
      }
    });
    return svg(out);
  }
