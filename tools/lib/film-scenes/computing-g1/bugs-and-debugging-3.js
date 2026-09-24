  /* ==== Grade 1 Computing, Lesson 5: Bugs and Debugging, part 3 ===============
     The everyday algorithm, the programmers who debug for a living, and what
     you now know.

     The washing-hands picture is the LESSON'S OWN (ART.scene "handwash"),
     painted from the list of steps done so far. Nothing here draws a mistake:
     when the rinse is put before the rub, the film passes that list and the
     lesson's drawing shows what happens - the soap is gone and there is
     nothing on the hands at all. */

  /* the lesson's own five steps, its emoji and its words (step "bugs",
     round 1), plus the step its fix puts in */
  var BD_STEPS = {
    tap: { pic: "\u{1F6B0}", text: "Turn the tap on" },
    soap: { pic: "\u{1F9FC}", text: "Put soap on your hands" },
    eat: { pic: "\u{1F60B}", text: "Eat the soap" },
    rub: { pic: "\u{1F450}", text: "Rub your hands together" },
    rinse: { pic: "\u{1F4A7}", text: "Rinse under the water" },
    dry: { pic: "\u{1F9FB}", text: "Dry them on the towel" }
  };
  var BD_WASH = { x: 490, w: 600, h: 64, top: 30, lh: 76, mark: 1120 };
  function bdWashY(slot) { return BD_WASH.top + slot * BD_WASH.lh; }

  /* one row of the algorithm. opt: {opacity, outline, dx, mark, bug} */
  function bdStepRow(id, slot, opt) {
    opt = opt || {};
    var o = opt.opacity == null ? 1 : opt.opacity;
    if (!(o > 0)) return "";
    var s = BD_STEPS[id], y = bdWashY(slot);
    var out = R(BD_WASH.x, y, BD_WASH.w, BD_WASH.h, 14, P.cell, opt.outline || P.line, opt.outline ? 5 : 2) +
      Em(BD_WASH.x + 36, y + BD_WASH.h / 2, 34, s.pic) +
      Tx(BD_WASH.x + 66, y + BD_WASH.h / 2 + 10, s.text, "lab", "start", { "font-size": 26 });
    if (opt.bug > 0) out += MK.pop(Em(BD_WASH.x + BD_WASH.w - 44, y + BD_WASH.h / 2, 44, "\u{1F41B}"), BD_WASH.x + BD_WASH.w - 44, y + BD_WASH.h / 2, opt.bug);
    return G(out, { opacity: Math.min(1, o), transform: opt.dx ? "translate(" + n2(opt.dx) + ",0)" : null });
  }

  /* a door, drawn: the emoji for one is a brown bar at this size */
  function bdDoor(cx, cy, s, o) {
    if (!(o > 0)) return "";
    return G(R(cx - s * 0.32, cy - s * 0.5, s * 0.64, s, s * 0.05, "#A9552B", "#7A2E2E", s * 0.06) +
      R(cx - s * 0.2, cy - s * 0.38, s * 0.4, s * 0.3, s * 0.04, "#8B4520") +
      C(cx + s * 0.18, cy + s * 0.08, s * 0.06, "#F4C95D"), { opacity: clamp(o, 0, 1) });
  }

  /* ==== chapter: bugs in everyday steps ============================================ */
  function bdEverydayChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cEveryday = c(0, "everyday"), cHands = c(0, "hands");
    var cTap = c(1, "tap"), cSoap = c(1, "soap"), cEat = c(1, "eat");
    var cBelong = c(2, "belong"), cBug = c(2, "bug");
    var cOut = c(3, "out"), cRub = c(3, "rub"), cDry = c(3, "dry");
    var cGood = c(4, "good"), cPlace = c(4, "place");
    var cRinsing = c(5, "rinsing"), cAway = c(5, "away");
    var out = "";

    var swap = on(t, cPlace, 0.6);            /* rub and rinse change places */
    var gone = on(t, cOut, 0.55);             /* the eating step slides out */
    var put = popIn(t, cRub, 0.5);            /* rubbing drops into its place */

    /* the goal, in the lesson's own words */
    var goal = popIn(t, cEveryday, 0.45);
    out += MK.pop(R(40, 24, 400, 62, 16, P.cell, P.line, 2) + Em(78, 55, 34, "\u{1F9FC}") +
      Tx(106, 66, "Wash your hands", "lab", "start", { "font-size": 28 }), 240, 55, goal);

    /* the lesson's own picture, painted from the steps done so far */
    /* Rinsing before the rubbing is shown by passing that list, and the
       lesson's own drawing does the rest: with rinse in it, has("soap") and
       has("rub") both stop drawing foam, so the soap is simply gone. */
    var rinsed = cAway != null && t >= cAway;
    var ids = [];
    if (cTap != null && t >= cTap) ids.push("tap");
    if (cSoap != null && t >= cSoap) ids.push("soap");
    if (swap > 0.5) ids = rinsed ? ["tap", "soap", "rinse"] : ["tap", "soap", "rub"];
    else {
      if (put > 0) ids.push("rub");
      if (cDry != null && t >= cDry) { ids.push("rinse"); ids.push("dry"); }
    }
    var picO = on(t, cHands, 0.5);
    if (picO > 0) out += G(ART.place(ART.scene("handwash", ids), 40, 104, 400, 300), { opacity: picO }) +
      R(40, 104, 400, 300, 12, "none", P.line, 2, { opacity: picO });

    /* the five steps. They appear together on the first one, and each lights
       as it is named; only the step being talked about is bright. */
    var shown = tally(t, cTap, 5, 0.9);
    var focus = -1;
    if (cTap != null && t >= cTap) focus = 0;
    if (cSoap != null && t >= cSoap) focus = 1;
    if (cEat != null && t >= cEat) focus = 2;
    if (cBelong != null && t >= cBelong) focus = 2;
    if (cRub != null && t >= cRub) focus = 2;
    if (cDry != null && t >= cDry) focus = -1;
    if (cGood != null && t >= cGood) focus = -1;

    var rowOp = function (slot) { return focus < 0 || focus === slot ? 1 : 0.45; };
    ["tap", "soap"].forEach(function (id, k) {
      if (shown > k) out += bdStepRow(id, k, { opacity: rowOp(k), outline: focus === k ? P.gold : null });
    });
    /* the step that does not belong, and the step that replaces it */
    if (shown > 2 && gone < 1) out += bdStepRow("eat", 2, {
      opacity: (1 - gone) * rowOp(2), dx: 30 * gone,
      outline: on(t, cBelong, 0.4) > 0.4 ? P.accent : (focus === 2 ? P.gold : null),
      bug: popIn(t, cBug, 0.45) * (1 - gone)
    });
    else if (gone >= 1 && put <= 0) out += bdSlot(BD_WASH.x, bdWashY(2), BD_WASH.w, BD_WASH.h, 1);
    var rubNew = on(t, cRub, 0.4) * (1 - on(t, cDry, 0.5));
    if (put > 0) out += G(bdStepRow("rub", 0, { outline: swap <= 0.5 && rubNew > 0.4 ? P.good : null }),
      { transform: "translate(0," + n2(lerp(bdWashY(2) - bdWashY(0) - 130 * (1 - Math.min(1, put)), bdWashY(3) - bdWashY(0), swap)) + ")", opacity: Math.min(1, put) });
    /* rinse: in its place, or moved up in front of the rubbing */
    if (shown > 3) out += G(bdStepRow("rinse", 0, { outline: swap > 0.5 ? P.accent : null }),
      { transform: "translate(0," + n2(lerp(bdWashY(3) - bdWashY(0), bdWashY(2) - bdWashY(0), swap)) + ")" });
    if (shown > 4) out += bdStepRow("dry", 4, {});

    /* "That step is the bug" - the mark goes on the step, never on a person */
    out += MK.cross(BD_WASH.mark, bdWashY(2) + BD_WASH.h / 2, 20, popIn(t, cBug, 0.4) * (1 - gone));
    /* the right order, ticked, before the second bug is shown */
    var done = popIn(t, cDry, 0.4) * (1 - swap);
    if (done > 0) for (var k2 = 0; k2 < 5; k2++) out += MK.tick(BD_WASH.mark, bdWashY(k2) + BD_WASH.h / 2, 18, done);

    /* a good step in the wrong place: the two that swap are lit, then marked */
    var gd = on(t, cGood, 0.5) * (1 - on(t, cRinsing, 0.4));
    if (gd > 0) {
      out += MK.glow(BD_WASH.x + BD_WASH.w / 2, bdWashY(2) + BD_WASH.h / 2, 140, P.gold, gd * 0.8);
      out += MK.glow(BD_WASH.x + BD_WASH.w / 2, bdWashY(3) + BD_WASH.h / 2, 140, P.gold, gd * 0.8);
    }
    out += MK.cross(BD_WASH.mark, bdWashY(2) + BD_WASH.h / 2, 20, popIn(t, cRinsing, 0.4) * swap);
    out += MK.arrow(BD_WASH.x - 26, bdWashY(3) + BD_WASH.h / 2, BD_WASH.x - 26, bdWashY(2) + BD_WASH.h / 2 - 6,
      on(t, cPlace, 0.6), P.accent, 6);
    return svg(out);
  }

  /* ==== chapter: everyone debugs ===================================================
     The lesson's own three: the games maker, the app that kept closing, and
     the rocket. */
  var BD_WHO = [
    { x: 49, pic: "\u{1F3AE}", title: "A games maker", sub: "a door will not open" },
    { x: 419, pic: "\u{1F4F1}", title: "An app", sub: "the programmers send a fix" },
    { x: 789, pic: "\u{1F680}", title: "A rocket", sub: "tested again and again" }
  ];
  var BD_WHOW = 330, BD_WHOY = 196, BD_WHOH = 208;

  function bdEveryoneChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cExpert = c(0, "expert"), cEvery = c(0, "every");
    var cues = [[c(1, "games"), c(1, "door")], [c(2, "app"), c(2, "fix")], [c(3, "rocket"), c(3, "tested")]];
    var out = "";

    /* three programmers, and a bug each: everybody writes them. They stand in
       the middle of the screen while that is the whole idea, and move up to
       the top of their card when the three stories start. */
    var up = on(t, cues[0][0], 0.6);
    var py = lerp(252, 116, up), psz = lerp(120, 84, up);
    var who = tally(t, cExpert, 3, 0.7), bugs = tally(t, cEvery, 3, 0.6);
    BD_WHO.forEach(function (w, k) {
      var cx = w.x + BD_WHOW / 2;
      if (who > k) out += MK.pop(Em(cx - psz * 0.34, py, psz, "\u{1F469}‍\u{1F4BB}"), cx - psz * 0.34, py, popIn(t, cExpert == null ? null : cExpert + k * 0.24, 0.4));
      if (bugs > k) out += MK.pop(Em(cx + psz * 0.55, py - psz * 0.16, psz * 0.42, "\u{1F41B}"), cx + psz * 0.55, py - psz * 0.16, popIn(t, cEvery == null ? null : cEvery + k * 0.2, 0.35));
    });

    /* one card each, lit as it is told */
    var here = -1;
    for (var n = 0; n < 3; n++) if (cues[n][0] != null && t >= cues[n][0]) here = n;
    BD_WHO.forEach(function (w, k) {
      var pop = popIn(t, cues[k][0], 0.45);
      if (!(pop > 0)) return;
      var cx = w.x + BD_WHOW / 2, lit = here === k;
      var body = R(w.x, BD_WHOY, BD_WHOW, BD_WHOH, 22, lit ? "#1B3A52" : P.card, lit ? P.teal : P.line, lit ? 3 : 2) +
        Em(cx, 272, 84, w.pic) + Tx(cx, 348, w.title, "lab big", "middle");
      var subO = on(t, cues[k][1], 0.45);
      if (subO > 0) body += Tx(cx, 382, w.sub, "lab mid muted readable", "middle", { opacity: subO });
      out += G(body, { opacity: lit ? 1 : 0.5, transform: around(cx, BD_WHOY + BD_WHOH / 2, 0.96 + 0.04 * Math.min(1, pop)) });
      /* the door that will not open, the fix that is sent, the tests that pass */
      if (k === 0) out += MK.pop(bdDoor(w.x + 42, 230, 48, 1), w.x + 42, 230, popIn(t, cues[0][1], 0.4)) +
        MK.cross(w.x + BD_WHOW - 38, 230, 21, popIn(t, cues[0][1], 0.4));
      if (k === 1) out += MK.pop(Em(w.x + BD_WHOW - 40, 230, 46, "\u{1F527}"), w.x + BD_WHOW - 40, 230, popIn(t, cues[1][1], 0.4));
      if (k === 2) {
        var got = tally(t, cues[2][1], 3, 0.8);
        for (var q = 0; q < got; q++) out += MK.tick(w.x + 36 + q * 48, 230, 18, popIn(t, cues[2][1] == null ? null : cues[2][1] + q * 0.4, 0.35));
      }
    });
    return svg(out);
  }

  /* ---- what you now know ---------------------------------------------------------- */
  function bdRecapBlock(cx, cy, size) {
    var w = size * 2.0, h = size * 0.66;
    return bdBlock(cx - w / 2, cy - h / 2, w, h, "left", { outline: P.accent, outlineW: 4 });
  }
  var BD_RECAP = MK.recapKind([
    { beat: 0, at: "bug", title: "A bug", sub: "a mistake in a program", pic: "\u{1F41B}" },
    { beat: 0, at: "computer", title: "Not the computer", sub: "the machine is usually fine", pic: "\u{1F4BB}" },
    { beat: 1, at: "run", title: "Run it", sub: "that is how you test it", pic: "▶️" },
    { beat: 1, at: "compare", title: "Compare", sub: "what you wanted, what happened", pic: "\u{1F50D}" },
    { beat: 2, at: "find", title: "Find the block", sub: "the one that is wrong", pic: bdRecapBlock },
    { beat: 2, at: "debug", title: "Debugging", sub: "fix it, then run it again", pic: "\u{1F527}" }
  ], { goBeat: 2, goAt: "debug" });

  var KINDS = {
    title: MK.titleKind({ sub: ["Why a mistake is called a bug", "Run it, find it, fix it, run it again", "Every programmer debugs"] }),
    moth: bdMothChapter, run: bdRunChapter, find: bdFindChapter, fix: bdFixChapter,
    everyday: bdEverydayChapter, everyone: bdEveryoneChapter, recap: BD_RECAP
  };
