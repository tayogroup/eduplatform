  /* ==== Computer Scientists and Service Robots, part 3: moving people,
     the control system, and the recap =========================================
     tools/lib/film-scenes/computing-g4/computer-scientists-and-service-robots-3.js.
     See the header of part 1. */

  /* ==== chapter: moving people, helping patients ==============================
     The lesson's own four: the driverless airport shuttle that has no
     driver, the self-driving shuttle bus round a park, the hospital robot
     carrying medicines from the store to the ward, and the surgical robot
     steadier than any hand. */
  function csPeopleChapter(scene, beat, t, i) {
    var cMove = sc(scene, 0, "move"), cTransport = sc(scene, 0, "transport");
    var cTrain = sc(scene, 1, "train"), cShuttle = sc(scene, 1, "shuttle"), cNodriver = sc(scene, 1, "nodriver");
    var cBus = sc(scene, 2, "bus"), cPark = sc(scene, 2, "park");
    var cHospital = sc(scene, 3, "hospital"), cMedicines = sc(scene, 3, "medicines"), cWard = sc(scene, 3, "ward");
    var cSurgical = sc(scene, 4, "surgical"), cSteadier = sc(scene, 4, "steadier"), cHealth = sc(scene, 4, "health");
    var out = "";

    if (!csPast(t, cBus)) {
      /* a driverless train runs the airport shuttle: it has no driver */
      out += MK.pop(Em(560, 190, 116, "\u{1F686}"), 560, 190, popIn(t, cMove, 0.4));
      out += MK.pill(560, 300, "public transport", on(t, cTransport, 0.5), { size: 22, col: P.accent, ink: P.accent });
      var shOn = on(t, cShuttle, 0.5);
      if (shOn > 0) out += MK.pill(560, 92, "the airport shuttle", shOn, { size: 19, col: P.gold, ink: P.gold });
      var noDrv = on(t, cNodriver, 0.5);
      if (noDrv > 0) {
        out += R(430, 150, 60, 40, 8, P.cell, P.bad, 3, { opacity: noDrv });
        out += MK.cross(460, 170, 22, popIn(t, cNodriver, 0.4));
        out += MK.pill(460, 220, "no driver", noDrv, { size: 18, col: P.bad, ink: P.bad });
      }
    } else if (!csPast(t, cHospital)) {
      /* the self-driving shuttle bus, steering slowly round a park */
      var parkOn = on(t, cPark, 0.6);
      out += E(700, 220, 190, 128, "#2E5C3A", null, null, { opacity: parkOn });
      out += G(Em(700, 220, 60, "\u{1F333}"), { opacity: parkOn });
      var ang = ((t - (cBus == null ? t : cBus)) / 6) * Math.PI * 2;
      var bx = 700 + Math.cos(ang) * 195, by = 220 + Math.sin(ang) * 118;
      out += MK.pop(Em(bx, by, 62, "\u{1F68C}"), bx, by, popIn(t, cBus, 0.4));
      out += MK.pill(700, 386, "steers slowly round a park", parkOn, { size: 19, col: P.accent, ink: P.accent });
    } else if (!csPast(t, cSurgical)) {
      /* the hospital robot: medicines, from the store to the ward */
      out += csPanel(200, 42, 760, 320, "\u{1F3E5}", "In a hospital", on(t, cHospital, 0.5), P.accent);
      out += MK.pill(320, 150, "store", on(t, cHospital, 0.5), { size: 19, col: P.muted, ink: P.muted });
      out += MK.pill(840, 150, "ward", on(t, cWard, 0.5), { size: 19, col: P.good, ink: P.good });
      var wardOn = on(t, cWard, 0.6);
      var mx = lerp(320, 840, wardOn);
      out += MK.pop(Em(mx, 230, 62, "\u{1F48A}"), mx, 230, popIn(t, cMedicines, 0.4));
      out += MK.leader(370, 150, 800, 150, on(t, cMedicines, 0.5), P.accent);
    } else {
      /* the surgical robot: steadier than any hand, in health care */
      out += csPanel(200, 42, 760, 320, "⚕️", "Health care", on(t, cHealth, 0.5), P.accent);
      out += MK.pop(Em(420, 210, 80, "\u{1F52C}"), 420, 210, popIn(t, cSurgical, 0.4));
      out += Tx(420, 300, "the surgical robot", "lab mid", "middle", { opacity: on(t, cSurgical, 0.5).toFixed(3) });
      var handOn = on(t, cSteadier, 0.5);
      if (handOn > 0) {
        var shake = Math.sin(t * 30) * 4;
        out += G(Em(720, 210, 74, "✋"), { transform: "translate(" + n2(shake) + ",0)", opacity: handOn });
        out += Tx(720, 300, "a shaking hand", "lab mid", "middle", { opacity: handOn.toFixed(3) });
      }
      out += MK.pill(570, 336, "steadier than any hand", handOn, { size: 19, col: P.good, ink: P.good });
    }
    return svg(out);
  }

  /* ==== chapter: sense, decide, act ============================================
     The lesson's own control-system loop, drawn as three connected stations
     round which the film's own things (the cameras, the two rules, the
     motors) arrive as they are named, and a dashed loop back to the start for
     the forever loop that runs it. */
  function csControlChapter(scene, beat, t, i) {
    var cControl = sc(scene, 0, "control"), cSenses = sc(scene, 0, "senses"),
      cDecides = sc(scene, 0, "decides"), cActs = sc(scene, 0, "acts");
    var cCameras = sc(scene, 1, "cameras"), cSensor = sc(scene, 1, "sensor"), cPeople = sc(scene, 1, "people");
    var cProgram = sc(scene, 2, "program"), cClose = sc(scene, 2, "close"), cGreen = sc(scene, 2, "green");
    var cScientist = sc(scene, 3, "scientist"), cRules = sc(scene, 3, "rules");
    var cMotors = sc(scene, 4, "motors"), cLoop = sc(scene, 4, "loop"), cDone = sc(scene, 4, "done");
    var out = "";

    var N = { sense: { x: 260, y: 250, label: "Sense" }, decide: { x: 584, y: 120, label: "Decide" },
      act: { x: 908, y: 250, label: "Act" } };
    var senseOn = on(t, cSenses, 0.5), decideOn = on(t, cDecides, 0.5), actOn = on(t, cActs, 0.5);

    out += MK.arrow(N.sense.x + 50, N.sense.y - 40, N.decide.x - 70, N.decide.y + 30, decideOn, P.good, 6);
    out += MK.arrow(N.decide.x + 70, N.decide.y + 30, N.act.x - 50, N.act.y - 40, actOn, P.good, 6);
    var backOn = on(t, cLoop, 0.6);
    if (backOn > 0) {
      /* a deeper control point than before so the loop clears below the
         rules list (the label stays higher, inside the 440 box) */
      out += Pth("M" + n2(N.act.x - 10) + "," + n2(N.act.y + 58) + " Q584,555 " + n2(N.sense.x + 10) + "," + n2(N.sense.y + 58),
        null, P.gold, 5, { opacity: backOn, "stroke-dasharray": "12 8" });
      out += MK.pill(584, 400, "a forever loop", on(t, cLoop, 0.5), { size: 20, col: P.gold, ink: P.gold });
    }

    ["sense", "decide", "act"].forEach(function (key) {
      var n = N[key], appear = key === "sense" ? senseOn : key === "decide" ? decideOn : actOn;
      if (!(appear > 0)) return;
      var lit = (key === "sense" && csPast(t, cCameras)) || (key === "decide" && csPast(t, cProgram)) ||
        (key === "act" && csPast(t, cMotors));
      out += G(C(n.x, n.y, 62, lit ? "#1B3A52" : P.cell, lit ? P.good : P.line, lit ? 4 : 2.6) +
        Tx(n.x, n.y + 8, n.label, "lab big", "middle", { fill: lit ? P.good : P.ink }), { opacity: Math.min(1, appear) });
    });
    out += MK.pill(584, 40, "a control system", on(t, cControl, 0.5), { size: 22, col: P.good, ink: P.good });

    /* sense: cameras, a distance sensor, and the people it sees */
    out += MK.pop(Em(150, 340, 48, "\u{1F4F7}"), 150, 340, popIn(t, cCameras, 0.4));
    out += MK.pop(Em(260, 362, 44, "\u{1F4E1}"), 260, 362, popIn(t, cSensor, 0.4));
    out += MK.pop(Em(370, 340, 44, "\u{1F9CD}"), 370, 340, popIn(t, cPeople, 0.4));

    /* decide: the program's own two rules - held left of the Act circle and
       the loop's endpoint there, so neither rule sits under the gear or the
       loop arc that runs close beside the circle */
    if (on(t, cProgram, 0.5) > 0) out += MK.list(400, 320, [
      { text: "a person is close: stop", at: cClose, mark: "tick" },
      { text: "the light is green: cross", at: cGreen, mark: "tick" }
    ], t, { lh: 38, cls: "lab mid", markR: 14 });

    /* a computer scientist wrote every one of those rules - held clear of the
       "a control system" pill above and the rules list below, with a leader
       straight down onto the rules */
    var sciOn = popIn(t, cScientist, 0.4);
    if (sciOn > 0) {
      out += MK.pop(Em(700, 220, 46, CS_ICON), 700, 220, sciOn);
      out += MK.leader(686, 244, 560, 302, on(t, cRules, 0.5), P.gold);
    }

    /* act: the motors, turning */
    var motOn = popIn(t, cMotors, 0.4);
    if (motOn > 0) {
      var spin = (t - (cMotors == null ? t : cMotors)) * 220;
      out += G(Em(908, 340, 50, "⚙️"), { transform: "rotate(" + n2(spin) + " 908 340)", opacity: Math.min(1, motOn) });
    }
    var doneOn = on(t, cDone, 0.6);
    if (doneOn > 0) out += MK.pill(908, 420, "until the job is done", doneOn, { size: 16, col: P.good, ink: P.good });
    return svg(out);
  }

  /* ---- what you now know: the lesson's own four sentences -------------------
     The recap beat "Service robots deliver parcels, move people and help in
     hospitals" names three cues; a card's own "at" can drive only one of
     them, so its pic is a small function that finds its own beat's other two
     cues by the recap scene's own id and pops a small icon in on each. */
  function csRecapCue(beatK, name) {
    for (var k = 0; k < F.scenes.length; k++) if (F.scenes[k].id === "recap") return cue(F.scenes[k].first + beatK, name);
    return null;
  }
  var CS_RECAP = MK.recapKind([
    { beat: 0, at: "scientist", title: "Computer scientist", sub: "builds the programs an industry needs", pic: CS_ICON },
    { beat: 1, at: "deliver", title: "Service robots", sub: "deliver parcels, move people, help in hospitals",
      pic: function (cx, cy, size, t) {
        var out = Em(cx, cy, size, "\u{1F916}");
        var mv = csRecapCue(1, "move"), hp = csRecapCue(1, "help");
        var pv = popIn(t, mv, 0.35), ph = popIn(t, hp, 0.35);
        if (pv > 0) out += MK.pop(Em(cx - size * 0.6, cy + size * 0.32, size * 0.42, "\u{1F686}"),
          cx - size * 0.6, cy + size * 0.32, pv);
        if (ph > 0) out += MK.pop(Em(cx + size * 0.6, cy + size * 0.32, size * 0.42, "⚕️"),
          cx + size * 0.6, cy + size * 0.32, ph);
        return out;
      } },
    { beat: 2, at: "control", title: "Control system", sub: "senses, decides and acts", pic: "\u{1F501}" },
    { beat: 3, at: "ask", title: "Someone wrote it", sub: "ask what program is working there", pic: "❓" }
  ], { goBeat: 2, goAt: "control" });

  var KINDS = {
    title: MK.titleKind({ sub: [
      "What a computer scientist builds, in five industries",
      "The service robots that deliver, move people and help patients",
      "Why every one of them is a control system: sense, decide, act"
    ] }),
    scientists: csScientistsChapter, industries: csIndustriesChapter,
    deliver: csDeliverChapter, people: csPeopleChapter, control: csControlChapter,
    recap: CS_RECAP
  };
