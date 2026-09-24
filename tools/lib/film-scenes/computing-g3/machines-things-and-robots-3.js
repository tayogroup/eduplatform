  /* ==== Machines, Things and Robots, part 3: the factory line, and why robots
     tools/lib/film-scenes/computing-g3/machines-things-and-robots-3.js. See the
     header of machines-things-and-robots.js.

     "Robots build a car": the lesson's own six steps, in the lesson's own
     order (weld, paint, engine, doors, wheels, test), ticked off on the left
     as a car is built from nothing on the right - the film's one ordered
     build, drawn here because the kit keeps no scene for it. "Why robots?":
     the lesson's own five reasons, lit as five cards, then the line the
     lesson itself draws against the misconception it names - robots did not
     take every job; people still run the factory. */

  var MT_LINE = [
    { id: "weld", pic: "\u{1F525}", text: "Weld the body" },
    { id: "paint", pic: "\u{1F3A8}", text: "Paint it" },
    { id: "engine", pic: "⚙️", text: "Fit the engine" },
    { id: "doors", pic: "\u{1F6AA}", text: "Fit the doors" },
    { id: "wheels", pic: "\u{1F697}", text: "Fit the wheels" },
    { id: "test", pic: "✅", text: "Test it" }
  ];

  function mtLineChapter(scene, beat, t, i) {
    var cWeld = sc(scene, 0, "weld1"), cPaint = sc(scene, 0, "paint1");
    var cEngine = sc(scene, 1, "engine1"), cDoors = sc(scene, 1, "doors1"), cWheels = sc(scene, 1, "wheels1");
    var cTest = sc(scene, 2, "test1");
    var cSix = sc(scene, 3, "six1"), cRobot = sc(scene, 3, "robot1");
    var at = { weld: cWeld, paint: cPaint, engine: cEngine, doors: cDoors, wheels: cWheels, test: cTest };
    var out = "";

    /* the six steps, ticked as they are named - the icon and its tick are
       drawn apart from the label, the same way every card in this film does */
    var rowH = 58;
    MT_LINE.forEach(function (row, k) {
      var o = on(t, at[row.id], 0.42);
      if (o <= 0) return;
      var ry = 40 + k * rowH, cx = 40 + 30;
      out += G(R(40, ry, 540, 50, 12, P.cell, P.line, 2) +
        Em(cx, ry + 25, 30, row.pic) + Tx(cx + 40, ry + 32, row.text, "lab big", "start"),
        { opacity: o, transform: "translate(" + n2((1 - o) * 14) + ",0)" });
      out += MK.tick(40 + 540 - 30, ry + 25, 18, popIn(t, at[row.id], 0.35));
    });

    /* the car, built up in exactly that order - nothing here is a picture of
       a wrong order, because the lesson never gives this one a wrong list */
    var weld = mtPast(t, cWeld), paint = mtPast(t, cPaint), engine = mtPast(t, cEngine),
      doors = mtPast(t, cDoors), wheels = mtPast(t, cWheels), test = mtPast(t, cTest);
    if (weld) {
      var bodyCol = paint ? P.accent : "none", bodyStroke = paint ? P.line : P.muted;
      out += R(760, 220, 240, 90, 20, bodyCol, bodyStroke, 3) +
        Pth("M800 220 L822 162 H958 L980 220 Z", bodyCol, bodyStroke, 3);
      out += R(772, 358, 216, 10, 4, P.line);
    }
    if (engine) out += MK.pop(Em(796, 250, 44, "⚙️"), 796, 250, popIn(t, cEngine, 0.4));
    if (doors) {
      out += MK.pop(L(880, 224, 880, 306, P.dark, 3) + C(852, 265, 6, P.dark) + C(908, 265, 6, P.dark),
        880, 265, popIn(t, cDoors, 0.4));
    }
    if (wheels) {
      out += MK.pop(C(800, 320, 34, P.dark, P.line, 3) + C(800, 320, 12, P.plastic), 800, 320, popIn(t, cWheels, 0.4));
      out += MK.pop(C(960, 320, 34, P.dark, P.line, 3) + C(960, 320, 12, P.plastic), 960, 320, popIn(t, cWheels, 0.4));
    }
    if (test) {
      out += R(748, 200, 264, 174, 26, "none", P.good, 5, { opacity: Math.min(1, popIn(t, cTest, 0.4)) });
      out += MK.pop(Em(1046, 210, 54, "✅"), 1046, 210, popIn(t, cTest, 0.4));
    }

    /* six steps, most of them a robot's - two small tallies above the car */
    var sp = popIn(t, cSix, 0.4);
    if (sp > 0) out += MK.pill(880, 412, "6 steps", sp, { size: 20, col: P.plum, ink: P.plum });
    var rp = popIn(t, cRobot, 0.4);
    if (rp > 0) {
      out += MK.pop(Em(970, 50, 32, "\u{1F916}"), 970, 50, rp) +
        MK.pill(1010, 50, "×5 robots", rp, { size: 15, col: P.gold, ink: P.gold, anchor: "start" });
      out += MK.pop(Em(970, 92, 30, "\u{1F9D1}‍\u{1F527}"), 970, 92, rp) +
        MK.pill(1010, 92, "×1 person", rp, { size: 15, col: P.blue, ink: P.blue, anchor: "start" });
    }
    return svg(out);
  }

  /* ==== chapter: why robots? =====================================================
     The lesson's own five reasons, as five cards that light as they are said,
     then the sentence the lesson corrects a real misconception with: robots
     did not take every job; people still run the factory. */
  var MT_WHY = [
    { pic: "\u{1F3AF}", title: "Exact", beat: 0, at: "exact1",
      extra: [{ at: "millimetre1", cap: "to the millimetre" }, { at: "everytime1", cap: "every single time" }] },
    { pic: "\u{1F3CB}️", title: "Heavy", beat: 1, at: "heavy1",
      extra: [{ at: "tooheavy1", cap: "too heavy to lift" }, { at: "liftsin1", cap: "a robot arm lifts it" }] },
    { pic: "⚠️", title: "Dangerous", beat: 2, at: "dangerous1",
      extra: [{ at: "fumesmetal", cap: "fumes, hot metal" }, { at: "safer1", cap: "safer for a robot" }] },
    { pic: "\u{1F501}", title: "Repeated", beat: 3, at: "repeated1",
      extra: [{ at: "tenthousand1", cap: "10,000 times a day" }, { at: "nottired1", cap: "never gets tired" }] },
    { pic: "\u{1F469}‍\u{1F527}", title: "And the people", beat: 4, at: "people1",
      extra: [{ at: "program4", cap: "they program it" }, { at: "check4", cap: "they check it" }, { at: "fix4", cap: "they fix it" }] }
  ];
  var MT_WHY_CARD = { w: 216, h: 176, gap: 18, top: 30 };

  function mtWhyX(row, k) {
    if (row === 0) return 1168 / 2 - (3 * MT_WHY_CARD.w + 2 * MT_WHY_CARD.gap) / 2 + k * (MT_WHY_CARD.w + MT_WHY_CARD.gap);
    return 1168 / 2 - (2 * MT_WHY_CARD.w + MT_WHY_CARD.gap) / 2 + (k - 3) * (MT_WHY_CARD.w + MT_WHY_CARD.gap);
  }

  function mtWhyChapter(scene, beat, t, i) {
    var cJobs = sc(scene, 5, "nottakejobs1"), cRun = sc(scene, 5, "peoplerun1");
    var u = into(t, scene.first + 5), out = "", cards = "";

    MT_WHY.forEach(function (c, k) {
      var cueAt = sc(scene, c.beat, c.at), p = popIn(t, cueAt, 0.4);
      if (!(p > 0)) return;
      var row = k < 3 ? 0 : 1, x = mtWhyX(row, k), y = MT_WHY_CARD.top + row * (MT_WHY_CARD.h + MT_WHY_CARD.gap);
      var cx = x + MT_WHY_CARD.w / 2, lit = Math.min(1, p);
      /* the card's own detail, the last of its own phrases to be said */
      var cap = "", capO = 0;
      (c.extra || []).forEach(function (ex) {
        var exAt = sc(scene, c.beat, ex.at), exO = on(t, exAt, 0.4);
        if (exO > 0) { cap = ex.cap; capO = exO; }
      });
      cards += G(R(x, y, MT_WHY_CARD.w, MT_WHY_CARD.h, 22, "#1B3A52", P.accent, 3) +
        Em(cx, y + 62, 58, c.pic) + Tx(cx, y + 122, c.title, "lab big", "middle") +
        (cap ? Tx(cx, y + 154, cap, "lab small muted", "middle", { opacity: capO }) : ""),
        { opacity: 0.4 + 0.6 * lit, transform: around(cx, y + MT_WHY_CARD.h / 2, 0.96 + 0.04 * Math.min(p, 1.08)) });
      /* "repetitive": the Repeated card's own vocabulary word, said inside
         the same beat - a small tag under the card, not the cap slot above
         (which the beat's other two phrases already share) */
      if (c.title === "Repeated") {
        var repP = popIn(t, sc(scene, c.beat, "repetitive1"), 0.4);
        if (repP > 0) cards += MK.pill(cx, y + MT_WHY_CARD.h + 20, "repetitive", repP, { size: 19, col: P.accent, ink: P.accent });
      }
    });
    out += G(cards, { opacity: 1 - u });

    /* robots did not take every job; people run the factory */
    var jp = popIn(t, cJobs, 0.42);
    if (jp > 0) {
      var rot = "";
      rot += MK.pop(Em(380, 210, 90, "\u{1F916}"), 380, 210, jp);
      rot += MK.cross(380, 132, 30, popIn(t, cJobs == null ? null : cJobs + 0.4, 0.4));
      rot += MK.pill(380, 300, "did not take every job", jp, { size: 22, col: P.muted, ink: P.muted });
      var rp2 = popIn(t, cRun, 0.42);
      if (rp2 > 0) {
        rot += MK.pop(Em(800, 210, 90, "\u{1F469}‍\u{1F527}"), 800, 210, rp2);
        rot += MK.tick(800, 132, 30, popIn(t, cRun == null ? null : cRun + 0.35, 0.4));
        rot += MK.pill(800, 300, "runs the factory", rp2, { size: 22, col: P.good, ink: P.good });
      }
      out += G(rot, { opacity: u });
    }
    return svg(out);
  }
