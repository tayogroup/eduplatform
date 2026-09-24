  /* ==== Computer Scientists and Service Robots, part 2: every industry, and
     robots that deliver ========================================================
     tools/lib/film-scenes/computing-g4/computer-scientists-and-service-robots-2.js.
     See the header of part 1. The row of five industries begun there
     continues here with two already lit (hospital, farm); this chapter lights
     the other three without needing to know part 1's beats, only the cues of
     its own. */

  /* ==== chapter: in every industry ============================================
     Three more of the lesson's own five industries - the bank, the games
     studio, the weather station - then the lesson's own corrected
     misconception ("Children think computer scientists only work at computer
     companies... They work wherever there is a problem a program can solve"). */
  function csIndustriesChapter(scene, beat, t, i) {
    var cBank = sc(scene, 0, "bank"), cEncryption = sc(scene, 0, "encryption"), cMoney = sc(scene, 0, "money");
    var cGames = sc(scene, 1, "games"), cGame = sc(scene, 1, "game");
    var cWeather = sc(scene, 2, "weather"), cReadings = sc(scene, 2, "readings"), cForecast = sc(scene, 2, "forecast");
    var cThink = sc(scene, 3, "think"), cCompanies = sc(scene, 3, "companies"), cNot = sc(scene, 3, "not");
    var cWherever = sc(scene, 4, "wherever"), cEverywhere = sc(scene, 4, "everywhere");
    var out = "";

    var lit = 2 + (csPast(t, cMoney) ? 1 : 0) + (csPast(t, cGame) ? 1 : 0) + (csPast(t, cForecast) ? 1 : 0);
    var live = csPast(t, cBank) && !csPast(t, cMoney) ? 2 :
      csPast(t, cGames) && !csPast(t, cGame) ? 3 :
      csPast(t, cWeather) && !csPast(t, cForecast) ? 4 : -1;
    var rowOn = Math.max(on(t, cBank, 0.5), 0.001);
    out += G(csIndustryRow(lit, live, breathe(t)), { opacity: rowOn });

    if (!csPast(t, cGames)) {
      /* the bank: encryption keeps money safe */
      out += csPanel(300, 42, 560, 300, "\u{1F3E6}", "In a bank", on(t, cBank, 0.5), P.plum);
      out += MK.pop(Em(430, 190, 58, "\u{1F510}"), 430, 190, popIn(t, cEncryption, 0.4));
      out += MK.pop(Em(660, 190, 52, "\u{1F4B0}"), 660, 190, popIn(t, cMoney, 0.4));
      out += MK.leader(488, 190, 610, 190, on(t, cMoney, 0.4), P.plum);
      out += MK.pill(575, 290, "keeps money safe", on(t, cMoney, 0.5), { size: 19, col: P.good, ink: P.good });
    } else if (!csPast(t, cWeather)) {
      /* the games studio: computer scientists write the game itself */
      out += csPanel(300, 42, 560, 300, "\u{1F3AE}", "In a games studio", on(t, cGames, 0.5), P.plum);
      out += MK.pop(Em(580, 190, 74, "\u{1F3C3}"), 580, 190, popIn(t, cGame, 0.4));
      out += MK.pill(580, 280, "they write the game itself", on(t, cGame, 0.5), { size: 19, col: P.good, ink: P.good });
    } else if (!csPast(t, cThink)) {
      /* the weather station: millions of readings into tomorrow's forecast */
      out += csPanel(300, 42, 560, 300, "\u{1F326}️", "At a weather station", on(t, cWeather, 0.5), P.plum);
      var dotsOn = on(t, cReadings, 0.5) * (1 - on(t, cForecast, 0.6));
      [420, 465, 510, 555, 600, 645, 690, 735].forEach(function (dx, k) {
        out += C(dx, 150 + (k % 3) * 38, 6, P.plum, null, null, { opacity: dotsOn });
      });
      out += MK.pop(Em(590, 210, 68, "\u{1F326}️"), 590, 210, popIn(t, cForecast, 0.5));
      out += MK.pill(590, 290, "tomorrow's forecast", on(t, cForecast, 0.5), { size: 19, col: P.good, ink: P.good });
    } else if (!csPast(t, cWherever)) {
      /* the corrected misconception, in the lesson's own two lines */
      out += csPanel(300, 42, 560, 300, "❓", "Only at computer companies?", on(t, cThink, 0.5), P.bad);
      out += MK.pop(Em(580, 190, 90, "\u{1F3E2}"), 580, 190, popIn(t, cCompanies, 0.4));
      out += MK.cross(580, 190, 58, popIn(t, cNot, 0.4));
      out += MK.pill(580, 290, "They do not", on(t, cNot, 0.5), { size: 21, col: P.bad, ink: P.bad });
    } else {
      /* wherever a problem can be solved - that is everywhere, the whole row */
      out += MK.pill(584, 200, "wherever a problem can be solved", on(t, cWherever, 0.5),
        { size: 22, col: P.gold, ink: P.gold });
      out += MK.pill(584, 250, "that is everywhere", on(t, cEverywhere, 0.5), { size: 24, col: P.good, ink: P.good });
      if (bump(t, cEverywhere, 1.8) > 0.02) out += MK.glow(584, CS_ROW_Y, 36, P.gold, bump(t, cEverywhere, 1.8) * 0.6);
    }
    return svg(out);
  }

  /* ==== chapter: robots that deliver ==========================================
     The lesson's own "most do not look like people" and the three shapes it
     names - boxes on wheels, arms, trains - then its own delivery robot
     (pavement, lights, door), and the drone and warehouse robot it closes on. */
  function csDeliverChapter(scene, beat, t, i) {
    var cService = sc(scene, 0, "service"), cJob = sc(scene, 0, "job"), cNotlike = sc(scene, 0, "notlike");
    var cBoxes = sc(scene, 1, "boxes"), cArms = sc(scene, 1, "arms"), cTrains = sc(scene, 1, "trains"),
      cProgram = sc(scene, 1, "program");
    var cDelivery = sc(scene, 2, "delivery"), cPavement = sc(scene, 2, "pavement"), cShopping = sc(scene, 2, "shopping");
    var cLights = sc(scene, 3, "lights"), cDoor = sc(scene, 3, "door");
    var cDrone = sc(scene, 4, "drone"), cIsland = sc(scene, 4, "island"), cWarehouse = sc(scene, 4, "warehouse");
    var out = "";

    if (!csPast(t, cBoxes)) {
      /* a service robot does a job for people, and does not look like one */
      out += G(csBot(584, 220, 150, {}), { opacity: on(t, cService, 0.6) });
      out += MK.pop(Em(584, 108, 48, "\u{1F527}"), 584, 108, popIn(t, cJob, 0.4));
      out += MK.pill(584, 58, "does a job for people", on(t, cJob, 0.5), { size: 20, col: P.gold, ink: P.gold });
      var notOn = on(t, cNotlike, 0.5);
      if (notOn > 0) {
        out += MK.pop(Em(920, 220, 88, "\u{1F9CD}"), 920, 220, popIn(t, cNotlike, 0.4));
        out += MK.cross(920, 220, 54, popIn(t, cNotlike, 0.4));
        out += MK.pill(920, 316, "not like people", notOn, { size: 19, col: P.bad, ink: P.bad });
      }
    } else if (!csPast(t, cDelivery)) {
      /* boxes on wheels, or arms, or trains - a program controls each one */
      var pBoxes = popIn(t, cBoxes, 0.4), pArms = popIn(t, cArms, 0.4), pTrains = popIn(t, cTrains, 0.4);
      if (pBoxes > 0) out += G(csBot(260, 230, 130, {}), { opacity: Math.min(1, pBoxes) });
      if (pArms > 0) out += G(csArm(584, 240, 150), { opacity: Math.min(1, pArms) });
      if (pTrains > 0) out += MK.pop(Em(908, 230, 108, "\u{1F686}"), 908, 230, pTrains);
      out += Tx(260, 330, "boxes on wheels", "lab mid", "middle", { opacity: Math.min(1, pBoxes).toFixed(3) });
      out += Tx(584, 330, "or arms", "lab mid", "middle", { opacity: Math.min(1, pArms).toFixed(3) });
      out += Tx(908, 330, "or trains", "lab mid", "middle", { opacity: Math.min(1, pTrains).toFixed(3) });
      var progOn = on(t, cProgram, 0.5);
      if (progOn > 0) {
        out += MK.pop(Em(584, 90, 50, "⚙️"), 584, 90, popIn(t, cProgram, 0.4));
        out += MK.pill(584, 44, "a program controls each one", progOn, { size: 19, col: P.blue, ink: P.blue });
        out += MK.leader(560, 108, 280, 185, progOn, P.blue);
        out += MK.leader(584, 116, 584, 168, progOn, P.blue);
        out += MK.leader(608, 108, 888, 185, progOn, P.blue);
      }
    } else if (!csPast(t, cDrone)) {
      /* the delivery robot: along the pavement, at the lights, at the door */
      out += R(0, 330, 1168, 20, 0, "#20303C");
      var startX = 160, endX = 1000;
      var jStart = cDelivery, jEnd = cDoor != null ? cDoor : (cLights != null ? cLights + 2 : jStart + 4);
      var u = jStart == null ? 0 : clamp((t - jStart) / Math.max(jEnd - jStart, 0.5), 0, 1);
      var bx = lerp(startX, endX, u);
      out += MK.pill(startX, 250, "along the pavement", on(t, cPavement, 0.5), { size: 18, col: P.blue, ink: P.blue });
      var bagOn = popIn(t, cShopping, 0.4);
      if (bagOn > 0) out += MK.pop(Em(bx, 252, 38, "\u{1F6CD}️"), bx, 252, bagOn);
      out += csBot(bx, 300, 108, { parcel: true });
      if (on(t, cLights, 0.5) > 0) out += MK.pop(Em(700, 216, 58, "\u{1F6A6}"), 700, 216, popIn(t, cLights, 0.4));
      if (on(t, cDoor, 0.5) > 0) out += MK.pop(Em(1040, 258, 62, "\u{1F6AA}"), 1040, 258, popIn(t, cDoor, 0.4));
    } else {
      /* a drone to an island, a warehouse robot fetching the order */
      var islandOn = on(t, cIsland, 0.5);
      var dx = lerp(120, 400, islandOn);
      out += MK.pop(Em(dx, 140, 58, "\u{1F681}"), dx, 140, popIn(t, cDrone, 0.4));
      if (islandOn > 0) {
        out += E(410, 260, 160, 66, "#123049", null, null, { opacity: islandOn });
        out += E(410, 250, 86, 36, "#3E8E4A", null, null, { opacity: islandOn });
        out += Tx(410, 340, "to an island", "lab mid", "middle", { opacity: islandOn.toFixed(3) });
      }
      var whOn = on(t, cWarehouse, 0.5);
      if (whOn > 0) {
        out += csPanel(700, 60, 400, 300, "\u{1F3EC}", "A warehouse robot", whOn, P.blue);
        out += G(csBot(900, 240, 108, { parcel: true }), { opacity: whOn });
        out += Tx(900, 330, "fetches your order", "lab mid", "middle", { opacity: whOn.toFixed(3) });
      }
    }
    return svg(out);
  }
