  /* ==== Grade 4 Computing, Lesson 14: Computer Scientists and Service Robots ===
     tools/lib/film-scenes/computing-g4/computer-scientists-and-service-robots.js,
     with -2.js and -3.js: the film's pictures, after the shared marks (MK) and
     before the engine's tail, all in one scope. The storyboard is
     computing/grade-4-app/lecture-video/computer-scientists-and-service-robots.json.

     THERE IS NO ART.sim FOR THIS LESSON, AND NO ART.scene EITHER - a hospital,
     a bank, a delivery robot and a driverless train are not one of the kit's
     everyday-task scenes (dress, sandwich, teeth ...), so nothing here is
     lifted from ART: every picture is drawn in the engine's own idiom, and
     every fact drawn is one the lesson itself says (quoted in the storyboard's
     own _comment) - no new claim about what a job pays, how a sensor works, or
     how fast a robot goes.

     Every top-level name starts with cs, so nothing here can replace a name of
     the engine, ART or MK. */

  var HUE = {
    title: P.teal, scientists: P.gold, industries: P.plum, deliver: P.blue,
    people: P.accent, control: P.good, recap: P.teal
  };

  /* ---- this film's own timing helpers ------------------------------------ */
  function csPast(t, at) { return at != null && t >= at; }

  /* ---- the people and the icons, in the lesson's own words ---------------
     CS_ICON is the lesson's own icon for "a computer scientist" - the
     explore step's own pic, a woman and a laptop side by side (two glyphs,
     not one), reused here so the film's icon is the lesson's own. The five
     industries and every robot icon below are copied the same way, from an
     item's own "pic" in the matching lesson step. */
  var CS_ICON = "\u{1F469}\u{1F4BB}";
  var CS_INDUSTRY = [
    { pic: "\u{1F3E5}", label: "hospital" },
    { pic: "\u{1F33E}", label: "farm" },
    { pic: "\u{1F3E6}", label: "bank" },
    { pic: "\u{1F3AE}", label: "games studio" },
    { pic: "\u{1F326}️", label: "weather station" }
  ];

  /* a row of the five industries across the bottom of the box: lit is how
     many (from the front) are already known, live is the index being named
     right now (or -1), so the row can grow across two chapters without
     either chapter needing to know the other's beats. */
  var CS_ROW_Y = 402, CS_ROW_R = 27, CS_ROW_GAP = 30;
  function csRowX(k) {
    var w = 5 * (CS_ROW_R * 2) + 4 * CS_ROW_GAP;
    return (1168 - w) / 2 + CS_ROW_R + k * (CS_ROW_R * 2 + CS_ROW_GAP);
  }
  function csIndustryRow(lit, live, grow) {
    var out = "";
    CS_INDUSTRY.forEach(function (ind, k) {
      var x = csRowX(k), litUp = k < lit;
      var scale = live === k ? Math.min(1.12, 1 + 0.12 * (grow == null ? 1 : grow)) : 1;
      out += G(C(x, CS_ROW_Y, CS_ROW_R, litUp ? "#1B3A52" : P.cell, litUp ? P.gold : P.line, litUp ? 3 : 2) +
        Em(x, CS_ROW_Y - 1, 30, ind.pic),
        { transform: around(x, CS_ROW_Y, scale), opacity: litUp ? 1 : 0.4 });
    });
    return out;
  }

  /* ---- a service robot, drawn (not the kit's, and not a person) ----------
     "Most do not look like people. Most are boxes on wheels, or arms, or
     trains." A box on wheels, drawn plainly, so the picture cannot be read
     as a person in a costume. opt: {col, lit, parcel} */
  function csBot(cx, cy, size, opt) {
    opt = opt || {};
    var s = size / 100, out = "";
    out += C(-30, 30, 12, "#20303C", "#93AABE", 2.4) + C(30, 30, 12, "#20303C", "#93AABE", 2.4);
    out += R(-42, -20, 84, 52, 14, opt.col || "#3D6E96", "#0B1D2C", 3);
    out += C(0, -28, 6.5, opt.lit ? P.good : "#B9C8D6", "#0B1D2C", 1.6);
    if (opt.parcel) out += R(-15, -46, 30, 22, 5, "#C68642", "#8A5A2E", 2) +
      L(-15, -35, 15, -35, "#8A5A2E", 2);
    return G(out, { transform: tr(cx, cy, s) });
  }
  /* a robotic arm on a base, for "or arms" */
  function csArm(cx, cy, size) {
    var s = size / 100;
    return G(R(-16, 24, 32, 22, 6, "#3D6E96", "#0B1D2C", 2.4) +
      Pth("M0,24 L0,-6", null, "#B9C8D6", 9) + Pth("M0,-6 L28,-30", null, "#B9C8D6", 9) +
      C(28, -30, 9, "#F4C95D", "#0B1D2C", 2), { transform: tr(cx, cy, s) });
  }

  /* a plain card for one piece of a screen or a poster: icon, then a line */
  function csCard(x, y, w, h, pic, label, o, col) {
    if (!(o > 0)) return "";
    return G(R(x, y, w, h, 18, P.cell, col || P.line, col ? 3 : 2) +
      Em(x + w / 2, y + h * 0.42, h * 0.44, pic) +
      (label ? Tx(x + w / 2, y + h - 14, label, "lab mid", "middle") : ""),
      { transform: around(x + w / 2, y + h / 2, Math.min(1.06, o)), opacity: Math.min(1, o) });
  }
  /* a bigger panel: a bordered box with a small icon and heading at the top
     left, leaving the rest of the box free for the caller's own content. */
  function csPanel(x, y, w, h, pic, heading, o, col) {
    if (!(o > 0)) return "";
    return G(R(x, y, w, h, 20, "rgba(255,255,255,0.02)", col || P.line, 2.6) +
      Em(x + 34, y + 36, 40, pic) +
      Tx(x + 66, y + 44, heading, "lab big", "start", { fill: col || P.ink }),
      { opacity: Math.min(1, o) });
  }

  /* ==== the title motif =======================================================
     Top: the computer scientist writing the programs. Bottom: three of the
     lesson's own service robots - delivery, train, hospital - the whole film
     in one picture. */
  function csTileIcon(x, y, w, h, pic, o, col) {
    if (!(o > 0)) return "";
    return G(R(x, y, w, h, h * 0.22, P.cell, col || P.line, 2.4) + Em(x + w / 2, y + h / 2, h * 0.56, pic),
      { transform: around(x + w / 2, y + h / 2, Math.min(1.08, o)), opacity: Math.min(1, o) });
  }
  function titleMotif(o) {
    var t = o.t || 0, sn = o.scene, out = "";
    var cSci = sn ? sc(sn, 0, "scientist") : null, cProg = sn ? sc(sn, 0, "programs") : null,
      cInd = sn ? sc(sn, 0, "industry") : null;
    var cRob = sn ? sc(sn, 1, "robots") : null, cParcel = sn ? sc(sn, 1, "parcel") : null,
      cTrain = sn ? sc(sn, 1, "train") : null, cHosp = sn ? sc(sn, 1, "hospitals") : null;
    var pSci = sn ? popIn(t, cSci, 0.4) : 1;
    var progN = sn ? tally(t, cProg, 3, 0.9) : 3;
    var pInd = sn ? popIn(t, cInd, 0.4) : 1;
    var pRobLabel = sn ? on(t, cRob, 0.5) : 1;
    var pParcel = sn ? popIn(t, cParcel, 0.4) : 1, pTrain = sn ? popIn(t, cTrain, 0.4) : 1,
      pHosp = sn ? popIn(t, cHosp, 0.4) : 1;

    out += R(6, 10, 348, 340, 30, P.card, P.line, 3);

    out += G(R(24, 30, 312, 148, 20, "rgba(244,201,93,0.09)", P.gold, 3) +
      Tx(40, 56, "writes the programs", "lab", "start", { "font-size": 19, fill: P.gold }),
      { opacity: Math.min(1, pSci) });
    out += G(Em(70, 118, 58, CS_ICON), { transform: around(70, 118, Math.min(1.08, pSci)), opacity: Math.min(1, pSci) });
    for (var k = 0; k < 3; k++) {
      var lw = 108 - k * 18, lo = clamp(progN - k, 0, 1);
      if (lo > 0) out += R(128, 82 + k * 22, lw, 11, 5, P.gold, null, null, { opacity: lo });
    }
    out += csTileIcon(266, 76, 58, 88, "\u{1F3E5}", pInd, P.gold);

    out += G(R(24, 194, 312, 142, 20, "rgba(233,116,79,0.09)", P.accent, 3) +
      Tx(40, 220, "a whole industry runs on", "lab", "start", { "font-size": 19, fill: P.accent }),
      { opacity: Math.min(1, pRobLabel) });
    out += csTileIcon(40, 244, 92, 78, "\u{1F4E6}", pParcel, P.accent);
    out += csTileIcon(140, 244, 92, 78, "\u{1F686}", pTrain, P.accent);
    out += csTileIcon(240, 244, 92, 78, "\u{1F3E5}", pHosp, P.accent);

    return '<svg viewBox="0 0 360 360" role="img" aria-label="A computer scientist writing programs, and three service robots">' + out + "</svg>";
  }

  /* ==== chapter: computer scientists ==========================================
     The lesson's own opening: a computer scientist studies a problem, builds
     the program, then two of its five industries - the hospital records
     system, and the farm's watering program. The other three (bank, games
     studio, weather station) are the next chapter; the row of five below
     grows across both without either needing to know the other's beats. */
  function csScientistsChapter(scene, beat, t, i) {
    var cStudies = sc(scene, 0, "studies"), cProblems = sc(scene, 0, "problems");
    var cBuild = sc(scene, 1, "build"), cIndustry = sc(scene, 1, "industry");
    var cHospital = sc(scene, 2, "hospital"), cRecords = sc(scene, 2, "records");
    var cSafe = sc(scene, 3, "safe"), cSecond = sc(scene, 3, "second");
    var cFarm = sc(scene, 4, "farm"), cSensors = sc(scene, 4, "sensors"), cWaters = sc(scene, 4, "waters");
    var out = "";

    var show = on(t, cStudies, 0.6);
    out += G(Em(200, 190, 100, CS_ICON), { opacity: show });
    out += R(110, 280, 180, 14, 6, P.line, null, null, { opacity: show * 0.6 });

    /* what is on their screen: studies -> problems, then builds the program */
    var building = on(t, cBuild, 0.5);
    if (building <= 0) {
      out += MK.pop(Em(300, 110, 52, "\u{1F50D}"), 300, 110, popIn(t, cStudies, 0.4));
      for (var k = 0; k < 3; k++) {
        var px = 300 + (k - 1) * 58, py = 210;
        out += MK.qmark(px, py, 22, clamp(tally(t, cProblems, 3, 1.0) - k, 0, 1));
      }
    } else {
      out += csCard(260, 70, 96, 96, "</>", null, building, P.gold);
    }

    /* "every industry" opens the row; two of its five light in this chapter */
    var rowOn = on(t, cIndustry, 0.6);
    var lit = csPast(t, cWaters) ? 2 : csPast(t, cRecords) ? 1 : 0;
    var live = csPast(t, cHospital) && !csPast(t, cRecords) ? 0 :
      csPast(t, cFarm) && !csPast(t, cWaters) ? 1 : -1;
    if (rowOn > 0) out += G(csIndustryRow(lit, live, breathe(t)), { opacity: rowOn });

    /* the hospital: records, safe, found in a second */
    var hosp = on(t, cHospital, 0.5);
    if (hosp > 0 && !csPast(t, cFarm)) {
      out += csPanel(560, 42, 540, 320, "\u{1F3E5}", "In a hospital", hosp, P.gold);
      var names = ["Amara", "Kofi", "Zainab"];
      names.forEach(function (nm, r) {
        var ry = 96 + r * 56;
        var glow = bump(t, cSecond, 1.4) > 0.05 && r === 1;
        out += lpRowLike(596, ry, 460, 44, nm, clamp(tally(t, cRecords, 3, 1.2) - r, 0, 1), glow);
      });
      out += MK.pop(Em(1040, 118, 38, "\u{1F512}"), 1040, 118, popIn(t, cSafe, 0.4));
      out += MK.pill(1040, 168, "kept safe", on(t, cSafe, 0.5), { size: 18, col: P.good, ink: P.good });
      out += MK.pill(1040, 264, "found in a second", on(t, cSecond, 0.5), { size: 18, col: P.gold, ink: P.gold });
    }

    /* the farm: soil sensors, watering the dry fields */
    var farm = on(t, cFarm, 0.5);
    if (farm > 0) {
      out += csPanel(560, 42, 540, 320, "\u{1F33E}", "On a farm", farm, P.gold);
      var FX = [660, 830, 1000];
      FX.forEach(function (fx, r) {
        var wet = csPast(t, cWaters) && r < tally(t, cWaters, 3, 1.4);
        out += R(fx - 68, 180, 136, 104, 10, wet ? "#2E5C3A" : "#5A4630", "#0B1D2C", 2,
          { opacity: on(t, cFarm, 0.5) });
        if (wet) out += E(fx, 178, 58, 9, "#6E9DE8", null, null, { opacity: 0.5 });
      });
      out += MK.pop(Em(830, 156, 34, "\u{1F4E1}"), 830, 156, popIn(t, cSensors, 0.4));
      out += MK.pill(830, 314, "reads soil sensors", on(t, cSensors, 0.5), { size: 18, col: P.gold, ink: P.gold });
      out += MK.pill(830, 344, "waters the dry fields", on(t, cWaters, 0.5), { size: 18, col: P.blue, ink: P.blue });
    }
    return svg(out);
  }
  /* a plain row: a name, and a tick that flashes once when it is the one found */
  function lpRowLike(x, y, w, h, name, o, flash) {
    if (!(o > 0)) return "";
    return G(R(x, y, w, h, h * 0.3, flash ? "#1B3A52" : P.cell, flash ? P.gold : P.line, flash ? 3 : 2) +
      Tx(x + 20, y + h / 2 + 7, name, "lab", "start") +
      MK.tick(x + w - 30, y + h / 2, 15, flash ? 1 : 0.5),
      { opacity: Math.min(1, o) });
  }
