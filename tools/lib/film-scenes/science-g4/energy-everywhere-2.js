  /* ==== chapters: nothing moves without it, and the big rule ====================
     tools/lib/film-scenes/science-g4/energy-everywhere-2.js. */

  /* ---- nothing moves without it ------------------------------------------------
     The lecture's own three: your muscles take energy from your food, a lamp
     takes it from electricity, a plant takes it from light. One row each,
     source on the left, the thing that acts on the right, an arrow between.
     Take the energy away and all three stop. */
  var EE_ROWS = [
    { src: "\u{1F34E}", srcLabel: "food", thing: "\u{1F3C3}\u{1F3FE}", say: "you run and kick" },
    { src: "⚡", srcLabel: "electricity", thing: "\u{1F4A1}", say: "a lamp shines" },
    { src: "☀️", srcLabel: "light", thing: null, say: "a plant grows" }
  ];
  var EE_ROW_Y = [112, 236, 360];

  function eeNothingChapter(scene, beat, t, i) {
    var beatK = i - scene.first;
    var c = function (k, name) { return sc(scene, k, name); };
    var cMove = c(0, "movement"), cAct = c(0, "action");
    var cMus = c(1, "muscles"), cFood = c(1, "food"), cRun = c(1, "run");
    var cLamp = c(2, "lamp"), cElec = c(2, "electricity"), cPlant = c(2, "plant"), cLight = c(2, "light");
    var cAway = c(3, "away"), cNone = c(3, "nothing");

    /* when each row's thing appears, its source appears, and its arrow grows */
    var thingAt = [cMove, cAct, cAct == null ? null : cAct + 0.4];
    /* each row is drawn when its THING is named, so nothing starts in the last
       second of a line; the source's WORD appears when the word is said */
    var srcAt = [cFood, cElec, cPlant == null ? null : cPlant + 0.2];
    var labelAt = [cFood, cElec, cLight];
    var arrowAt = [cFood == null ? null : cFood + 0.3, cElec == null ? null : cElec + 0.3, cPlant == null ? null : cPlant + 0.45];
    var pillAt = [cRun, cElec == null ? null : cElec + 0.5, cLight];
    var ringAt = [cMus, cLamp, cPlant];

    /* rule 3: only the row being talked about is bright */
    var focus = [1, 1, 1];
    if (beatK === 1) focus = [1, 0, 0];
    else if (beatK === 2) { var pl = on(t, cPlant, 0.45); focus = [0, 1 - 0.7 * pl, pl]; }

    var gone = on(t, cAway, 0.6), stop = on(t, cNone, 0.5), out = "";

    for (var k = 0; k < 3; k++) {
      var y = EE_ROW_Y[k], row = EE_ROWS[k], g = "";
      var thingP = popIn(t, thingAt[k], 0.45);
      if (thingP <= 0) continue;

      /* the source, and its word */
      var srcO = on(t, srcAt[k], 0.4) * (1 - gone);
      if (srcO > 0) {
        g += G(MK.pop(MK.pic(300, y, 92, row.src), 300, y, popIn(t, srcAt[k], 0.45) * (1 - gone)),
          { transform: around(300, y, 1 + 0.09 * bump(t, labelAt[k], 0.8)) });
        g += Tx(300, y + 64, row.srcLabel, "lab mid muted readable", "middle", { opacity: on(t, labelAt[k], 0.4) * (1 - gone) });
      }
      /* the arrow: the transfer itself */
      var arr = on(t, arrowAt[k], 0.55) * (1 - gone);
      g += MK.arrow(364, y, 588, y, arr, P.gold, 9);
      /* a cross on the arrow when the energy is taken away */
      g += MK.cross(476, y, 32, popIn(t, cAway == null ? null : cAway + 0.15 + k * 0.12, 0.4) * gone, P.bad);

      /* the thing that acts, and what it does */
      var beat1 = k === 0 ? bump(t, cRun, 0.8) : 0;
      var thing = G(MK.pic(640, y, 96, row.thing || ART.ICONS.plant),
        { transform: around(640, y, 1 + 0.08 * beat1), style: stop > 0.5 ? "filter:brightness(0.34)" : null });
      g += MK.pop(thing, 640, y, thingP);
      g += C(640, y, 62, "none", P.gold, 4, { opacity: bump(t, ringAt[k], 1.2) });
      if (k === 0) g += MK.pop(Em(722, y - 30, 56, "\u{1F4AA}"), 722, y - 30, popIn(t, cMus, 0.45) * (1 - stop));
      g += MK.pill(k === 0 ? 800 : 740, y, row.say, on(t, pillAt[k], 0.4) * (1 - 0.6 * stop),
        { size: 26, anchor: "start", col: stop > 0.5 ? P.line : P.good });

      out += G(g, { opacity: 0.42 + 0.58 * focus[k] });
    }

    out += MK.pill(584, 32, "no energy, no action", on(t, cNone, 0.4), { size: 28, col: P.bad });
    return svg(out);
  }

  /* ---- the big rule -------------------------------------------------------------
     Left: the rule in three lines, two crossed and one ticked. Right: energy
     made out of nothing, then destroyed into nothing, both refused; then the
     transfer that is allowed. Along the foot, the lecture's own chain: food to
     muscle, muscle to ball. */
  /* It is REFUSED as it is said: the two things and the arrow between them are
     drawn on the cue, and the cross lands on the arrow just after. */
  function eeMadeDestroyed(t, made, o, at) {
    if (!(o > 0) || at == null) return "";
    var p = popIn(t, at, 0.45), lab = on(t, at, 0.4);
    if (p <= 0) return "";
    var nx = made ? 700 : 990, ex = made ? 990 : 700;
    var out = MK.pop(C(nx, 150, 54, "none", P.muted, 3, { "stroke-dasharray": "10 9" }), nx, 150, p) +
      Tx(nx, 236, "nothing", "lab mid muted readable", "middle", { opacity: lab }) +
      MK.pop(Em(ex, 150, 84, "⚡"), ex, 150, p) +
      Tx(ex, 236, "energy", "lab mid muted readable", "middle", { opacity: lab });
    out += MK.arrow(made ? 762 : 928, 150, made ? 928 : 762, 150, on(t, at + 0.25, 0.5), P.muted, 8);
    out += MK.cross(845, 150, 40, popIn(t, at + 0.7, 0.4), P.bad);
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  function eeTransferBox(t, scene, o) {
    if (!(o > 0)) return "";
    var cTrans = sc(scene, 2, "transferred"), cMoved = sc(scene, 2, "moved"), cForm = sc(scene, 3, "form");
    var pa = popIn(t, cTrans, 0.45), pb = popIn(t, cTrans == null ? null : cTrans + 0.22, 0.45);
    var out = MK.pop(R(640, 96, 180, 110, 18, P.cell, P.line, 2), 730, 151, pa) +
      MK.pop(R(920, 96, 180, 110, 18, P.cell, P.line, 2), 1010, 151, pb) +
      Tx(730, 232, "one thing", "lab mid muted readable", "middle", { opacity: Math.min(1, pa) }) +
      Tx(1010, 232, "another", "lab mid muted readable", "middle", { opacity: Math.min(1, pb) });
    var u = on(t, cMoved, 0.9);
    out += MK.arrow(828, 151, 912, 151, on(t, cMoved, 0.5), P.gold, 8);
    out += Em(lerp(730, 1010, u), 151, 72, "⚡");
    out += MK.tick(1122, 151, 26, popIn(t, cMoved == null ? null : cMoved + 0.6, 0.4));
    /* one FORM to another: the lesson's two names for it */
    var f = on(t, cForm, 0.45);
    out += MK.pill(730, 262, "stored", f, { size: 22, col: P.gold });
    out += MK.pill(1010, 262, "movement", f, { size: 22, col: P.gold });
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  var EE_CHAIN = [
    { x: 250, pic: "\u{1F34E}", label: "food" },
    { x: 584, pic: "\u{1F4AA}", label: "muscle" },
    { x: 918, pic: "⚽", label: "ball" }
  ];

  function eeRuleChapter(scene, beat, t, i) {
    var c = function (k, name) { return sc(scene, k, name); };
    var cRule = c(0, "rule"), cMade = c(0, "made");
    var cDest = c(1, "destroyed"), cUsed = c(1, "used");
    var cTrans = c(2, "transferred");
    var cFood = c(3, "food");
    var cBall = c(4, "ball"), cKick = c(4, "kick"), cFlies = c(4, "flies");
    var out = "";

    /* the rule board */
    var board = popIn(t, cRule, 0.5);
    out += MK.pop(R(40, 56, 520, 246, 20, P.card, P.line, 2), 300, 179, board);
    out += MK.list(66, 96, [
      { text: "never made", at: cMade, mark: "cross" },
      { text: "never destroyed", at: cDest, mark: "cross" },
      { text: "only transferred", at: cTrans, mark: "tick" }
    ], t, { lh: 78, cls: "lab big", markR: 22 });
    /* "never used up": the everyday words, struck through */
    var used = on(t, cUsed, 0.45);
    if (used > 0) {
      out += MK.pill(400, 214, "used up", used, { size: 22, col: P.line, ink: P.muted });
      out += L(336, 214, 464, 214, P.bad, 4, { opacity: used });
    }

    /* the right-hand diagram: made, destroyed, transferred */
    out += eeMadeDestroyed(t, true, eeOnly(t, scene, 0), cMade);
    out += eeMadeDestroyed(t, false, eeOnly(t, scene, 1), cDest);
    out += eeTransferBox(t, scene, eeFrom(t, scene, 2));

    /* the chain: food to muscle, muscle to ball */
    var chainAt = [cFood, cFood == null ? null : cFood + 0.3, cBall];
    var flies = on(t, cFlies, 0.8);
    for (var k = 0; k < 3; k++) {
      var it = EE_CHAIN[k], p = popIn(t, chainAt[k], 0.45);
      if (p <= 0) continue;
      var dx = k === 2 ? 130 * flies : 0, dy = k === 2 ? -8 * flies : 0;
      if (k === 2 && flies > 0) out += eeStreaks(it.x + dx - 54, 356 + dy, 76, flies);
      out += MK.pop(MK.pic(it.x + dx, 356 + dy, 96, it.pic), it.x, 356, p);
      out += Tx(it.x, 424, it.label, "lab mid muted readable", "middle", { opacity: Math.min(1, p) * (k === 2 ? 1 - flies * 0.7 : 1) });
    }
    out += MK.arrow(310, 356, 526, 356, on(t, cFood == null ? null : cFood + 0.25, 0.55), P.gold, 9);
    out += MK.arrow(644, 356, 860, 356, on(t, cKick, 0.55), P.gold, 9);
    return svg(out);
  }
