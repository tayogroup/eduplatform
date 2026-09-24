  /* ==== Grade 4 Computing, Lesson 11: When Networks Fail ======================
     tools/lib/film-scenes/computing-g4/when-networks-fail.js, with -2.js and
     -3.js: the film's pictures, after the shared marks (MK) and before the
     engine's tail, all in one scope. The storyboard is
     computing/grade-4-app/lecture-video/when-networks-fail.json.

     COMPUTING KEEPS NO ART.sim, and the lesson's own network activity (the
     "Switch the network off" predictor) is a closure with no reachable
     drawing, so the network diagrams in this film are drawn here in the
     engine's idiom, from scratch. Nothing technical is invented: the film
     shows exactly the four causes, the three places and the six encrypted
     things the lesson names, and nothing is crossed out except the broken
     link itself and the app that stopped - never a person. The one rule this
     film borrows nothing from is because there is nothing to borrow: Robo,
     Bitsy, the cipher wheel and the rule machines belong to other lessons.

     Every top-level name starts with wnf, so nothing here can replace a name
     of the engine, ART or MK.

     This file: the palette, small shared tiles, the title motif, and the
     first two teaching chapters - "A network failure" and "What stops". */

  var HUE = {
    title: P.teal, "break": P.gold, stops: P.blue, scramble: P.plum,
    where: P.accent, cyber: P.good, recap: P.teal
  };

  /* ---- small helpers ----------------------------------------------------- */
  function wnfPast(t, at) { return at != null && t >= at; }

  /* a big "this is a cause" chip: an icon, a label, and a cross that pops in
     with it - the chip IS the failure, so it appears already marked. */
  function wnfCauseChip(x, y, w, h, pic, label, o) {
    if (!(o > 0)) return "";
    var p = Math.min(1.08, o);
    var body = R(x, y, w, h, 18, "#3A2530", P.bad, 3) +
      Em(x + h * 0.5, y + h * 0.42, h * 0.5, pic) +
      Tx(x + w / 2, y + h * 0.84, label, "lab mid", "middle") +
      MK.cross(x + w - 22, y + 22, 15, Math.min(1, o));
    return G(body, { transform: around(x + w / 2, y + h / 2, p), opacity: Math.min(1, o) });
  }

  /* a small tile: an icon, a label, and a tick or a cross once it is decided.
     Shared by "What stops" here and the encryption chapters after it. */
  function wnfTile(x, y, w, h, pic, label, o, mark) {
    if (!(o > 0)) return "";
    var col = mark === "cross" ? P.bad : mark === "tick" ? P.good : P.line;
    var fill = mark === "cross" ? "#3A2530" : mark === "tick" ? "#173A2C" : P.cell;
    var body = R(x, y, w, h, 16, fill, col, mark ? 3 : 2) +
      Em(x + w / 2, y + h * 0.36, h * 0.42, pic) +
      Tx(x + w / 2, y + h * 0.82, label, "lab small", "middle");
    if (mark === "cross") body += MK.cross(x + w - 17, y + 17, 14, Math.min(1, o));
    else if (mark === "tick") body += MK.tick(x + w - 17, y + 17, 14, Math.min(1, o));
    return G(body, { transform: around(x + w / 2, y + h / 2, Math.min(1.08, o)), opacity: Math.min(1, o) });
  }

  /* one device on the network: a circle, an icon, a label under it, and
     above it either a "?" (an idea being tried) or a tick (found to be fine).
     Never a cross - a device is never the thing marked wrong here. */
  function wnfDevice(cx, cy, r, pic, label, o, state) {
    if (!(o > 0)) return "";
    var out = C(cx, cy, r, P.cell, P.line, 3, { opacity: Math.min(1, o) }) +
      Em(cx, cy - r * 0.06, r * 1.05, pic, { opacity: Math.min(1, o) }) +
      Tx(cx, cy + r + 26, label, "lab mid muted readable", "middle", { opacity: Math.min(1, o) });
    if (state === "qmark") out += MK.qmark(cx, cy - r - 30, 24, o);
    else if (state === "tick") out += MK.tick(cx, cy - r - 30, 22, o);
    return out;
  }

  /* ==== the title motif ======================================================
     Two panels, one above the other, the way Loops in Algorithms sums itself
     up: on top, two devices and a cable, cut; underneath, a padlock and its
     key. In the spoken title chapter each piece arrives as it is named; on
     the two cards it stands still (no scene is passed, so every cue reads as
     already reached). */
  function wnfMini(cx, cy, r, pic, o) {
    if (!(o > 0)) return "";
    return G(C(cx, cy, r, P.ground, P.line, 2.4) + Em(cx, cy, r * 1.1, pic),
      { transform: around(cx, cy, Math.min(1.08, o)), opacity: Math.min(1, o) });
  }

  function titleMotif(o) {
    var t = o.t || 0, sn = o.scene, out = "";
    var cCable = sn ? sc(sn, 0, "cable") : null, cRouter = sn ? sc(sn, 0, "router") : null,
      cFailed = sn ? sc(sn, 0, "failed") : null;
    var cStops = sn ? sc(sn, 1, "stops") : null, cEnc = sn ? sc(sn, 1, "enc") : null;
    var pRouter = sn ? popIn(t, cRouter, 0.4) : 1, pCut = sn ? popIn(t, cCable, 0.4) : 1,
      failed = sn ? on(t, cFailed, 0.5) : 1, pStops = sn ? popIn(t, cStops, 0.4) : 1,
      pEnc = sn ? popIn(t, cEnc, 0.45) : 1;

    out += R(6, 10, 348, 340, 30, P.card, P.line, 3);
    /* the network, and its cut cable */
    out += G(Tx(180, 46, "the network", "lab mid muted readable", "middle"), { opacity: Math.min(1, pRouter) });
    out += wnfMini(70, 100, 30, "\u{1F4BB}", 1);
    out += wnfMini(290, 100, 30, "\u{1F5A5}️", 1);
    var lineCol = failed > 0.5 ? P.bad : P.line;
    out += L(100, 100, 168, 100, lineCol, 4, { "stroke-dasharray": failed > 0.5 ? "8 7" : null });
    out += L(212, 100, 260, 100, lineCol, 4, { "stroke-dasharray": failed > 0.5 ? "8 7" : null });
    if (pCut > 0) out += G(MK.cross(190, 100, 17, pCut) + Em(190, 74, 24, "\u{1F4F4}", { opacity: pRouter }),
      { opacity: 1 });
    if (failed > 0.05) out += Tx(180, 140, "network failed", "lab small", "middle", { fill: P.bad, opacity: failed });
    /* the padlock and its key */
    out += G(R(30, 196, 300, 130, 20, "rgba(53,191,178,0.10)", P.teal, 3), { opacity: Math.min(1, pStops) });
    out += Em(120, 260, 78, "\u{1F512}", { opacity: Math.min(1, pEnc) });
    out += G(Em(196, 224, 40, "\u{1F511}"), { opacity: Math.min(1, pEnc), transform: "rotate(-18 196 224)" });
    out += Tx(180, 306, "encryption keeps data safe", "lab small", "middle", { fill: P.teal, opacity: Math.min(1, pEnc) });
    return '<svg viewBox="0 0 360 360" role="img" aria-label="Two devices with a cut cable between them, and a padlock with its key">' + out + "</svg>";
  }

  /* ==== chapter: a network failure ==========================================
     Four cause chips - a router with no power, a cut cable, a server switched
     off, the wi-fi password changed - each popping in already marked, because
     naming a cause IS marking it. Underneath, the thing the lesson actually
     defines a failure as: two devices, both fine, with the LINK between them
     crossed out - never the devices themselves. */
  var WNF_CAUSE = { x: 62, y: 28, w: 246, h: 96, gap: 20 };
  function wnfCauseX(k) { return WNF_CAUSE.x + k * (WNF_CAUSE.w + WNF_CAUSE.gap); }

  function wnfBreakChapter(scene, beat, t, i) {
    var cFailure = sc(scene, 0, "failure"), cBreak = sc(scene, 0, "break");
    var cPower = sc(scene, 1, "power"), cCable = sc(scene, 1, "cable"), cServer = sc(scene, 1, "server");
    var cPassword = sc(scene, 2, "password"), cLink = sc(scene, 2, "link");
    var cThink = sc(scene, 3, "think"), cBroken = sc(scene, 3, "broken");
    var cNot = sc(scene, 4, "not"), cFine = sc(scene, 4, "fine"), cReach = sc(scene, 4, "reach");
    var out = "";

    /* the four causes */
    out += wnfCauseChip(wnfCauseX(0), WNF_CAUSE.y, WNF_CAUSE.w, WNF_CAUSE.h, "\u{1F4F4}", "router: no power", on(t, cPower, 0.4));
    /* the cable chip is drawn by hand: a line with a gap, not an emoji */
    (function () {
      var o = on(t, cCable, 0.4);
      if (!(o > 0)) return;
      var x = wnfCauseX(1), y = WNF_CAUSE.y, w = WNF_CAUSE.w, h = WNF_CAUSE.h;
      out += G(R(x, y, w, h, 18, "#3A2530", P.bad, 3) +
        L(x + 30, y + h * 0.42, x + w * 0.42, y + h * 0.42, "#93AABE", 6) +
        L(x + w * 0.58, y + h * 0.42, x + w - 30, y + h * 0.42, "#93AABE", 6) +
        Tx(x + w / 2, y + h * 0.84, "a cut cable", "lab mid", "middle") +
        MK.cross(x + w / 2, y + h * 0.42, 17, Math.min(1, o)),
        { transform: around(x + w / 2, y + h / 2, Math.min(1.08, o)), opacity: Math.min(1, o) });
    })();
    out += wnfCauseChip(wnfCauseX(2), WNF_CAUSE.y, WNF_CAUSE.w, WNF_CAUSE.h, "\u{1F5C4}️", "server: switched off", on(t, cServer, 0.4));
    out += wnfCauseChip(wnfCauseX(3), WNF_CAUSE.y, WNF_CAUSE.w, WNF_CAUSE.h, "\u{1F4F6}", "wi-fi: password changed", on(t, cPassword, 0.4));

    /* "any of these breaks the link" */
    if (bump(t, cLink, 1.6) > 0.02) out += R(WNF_CAUSE.x - 6, WNF_CAUSE.y - 6, 4 * WNF_CAUSE.w + 3 * WNF_CAUSE.gap + 12,
      WNF_CAUSE.h + 12, 24, "none", P.ink, 3, { opacity: bump(t, cLink, 1.6) });

    /* the definition: "A network failure is any break..." names the devices
       first (cFailure), then "...in the connection between devices" draws the
       connection itself (cBreak) - so the line arrives on its own words. */
    var showDevices = on(t, cFailure, 0.6);
    var showLine = on(t, cBreak, 0.55);
    out += G(Tx(584, 178, "any break in the connection between devices", "lab mid muted readable", "middle"),
      { opacity: showLine });

    /* the two devices, and the link between them */
    var dax = 190, dbx = 978, dy = 300, dr = 52;
    var causes = (wnfPast(t, cPower) ? 1 : 0) + (wnfPast(t, cCable) ? 1 : 0) +
      (wnfPast(t, cServer) ? 1 : 0) + (wnfPast(t, cPassword) ? 1 : 0);
    var linked = wnfPast(t, cLink);
    var lx0 = dax + dr + 10, lx1 = dbx - dr - 10;
    var lineCol = linked ? P.bad : causes > 0 ? "#D89A6A" : P.teal;
    out += L(lx0, dy, lx1, dy, lineCol, linked ? 6 : 4,
      { opacity: showLine, "stroke-dasharray": linked ? "12 9" : null });
    /* a small mark on the line for each cause named so far - the damage adding up */
    for (var k = 0; k < causes; k++) {
      var mx = lerp(lx0, lx1, (k + 1) / 5);
      out += C(mx, dy, 7, P.bad, null, null, { opacity: showLine * 0.9 });
    }
    if (bump(t, cLink, 1.8) > 0.02) out += MK.cross(584, dy, 34, popIn(t, cLink, 0.5));

    var thinking = wnfPast(t, cThink) && !wnfPast(t, cNot);
    var resolved = wnfPast(t, cNot) || wnfPast(t, cFine);
    var stateA = resolved ? "tick" : thinking ? "qmark" : null;
    out += wnfDevice(dax, dy, dr, "\u{1F4BB}", "a device", showDevices, stateA);
    out += wnfDevice(dbx, dy, dr, "\u{1F5A5}️", "another device", showDevices, stateA);

    if (bump(t, cBroken, 1.6) > 0.02) out += Tx(584, 150, "are the computers broken?", "lab mid", "middle",
      { fill: P.muted, opacity: bump(t, cBroken, 1.6) });
    var reach = on(t, cReach, 0.5);
    if (reach > 0) out += Tx(584, 372, "fine on their own - they just cannot reach each other", "lab mid", "middle",
      { fill: P.good, opacity: reach });
    return svg(out);
  }

  /* ==== chapter: what stops =================================================
     Three places, the lesson's own order - school, shop, home - each app that
     needs another device crossed out as it is named, and cash, writing and
     the calculator ticked, because they do not. */
  var WNF_COLX = [195, 584, 973];
  var WNF_TILE = { w: 210, h: 64, gap: 8 };
  function wnfTileY(k) { return 118 + k * (WNF_TILE.h + WNF_TILE.gap); }

  function wnfStopsChapter(scene, beat, t, i) {
    var cNeeded = sc(scene, 0, "needed"), cSchool = sc(scene, 0, "school");
    var cPrints = sc(scene, 1, "prints"), cServer = sc(scene, 1, "server");
    var cRegister = sc(scene, 2, "register"), cTill = sc(scene, 2, "till");
    var cCash = sc(scene, 3, "cash"), cVideos = sc(scene, 3, "videos"), cCalls = sc(scene, 3, "calls");
    var cSpeaker = sc(scene, 4, "speaker"), cAll = sc(scene, 4, "all");
    var cWriting = sc(scene, 5, "writing"), cCalc = sc(scene, 5, "calc"), cNobody = sc(scene, 5, "nobody");
    var out = "";

    out += MK.pill(584, 22, "needs another device", on(t, cNeeded, 0.5), { size: 20, col: P.bad, ink: P.bad });

    /* school */
    var oS = on(t, cSchool, 0.5);
    out += G(Em(WNF_COLX[0], 56, 40, "\u{1F3EB}") + Tx(WNF_COLX[0], 92, "At school", "lab mid", "middle"), { opacity: oS });
    var x0 = WNF_COLX[0] - WNF_TILE.w / 2;
    out += wnfTile(x0, wnfTileY(0), WNF_TILE.w, WNF_TILE.h, "\u{1F5A8}️", "printing", on(t, cPrints, 0.4), "cross");
    out += wnfTile(x0, wnfTileY(1), WNF_TILE.w, WNF_TILE.h, "\u{1F4C2}", "saved work", on(t, cServer, 0.4), "cross");
    out += wnfTile(x0, wnfTileY(2), WNF_TILE.w, WNF_TILE.h, "\u{1F4CB}", "the register", on(t, cRegister, 0.4), "cross");

    /* shop */
    var oP = on(t, cTill, 0.5);
    out += G(Em(WNF_COLX[1], 56, 40, "\u{1F3EA}") + Tx(WNF_COLX[1], 92, "At the shop", "lab mid", "middle"), { opacity: oP });
    var x1 = WNF_COLX[1] - WNF_TILE.w / 2;
    out += wnfTile(x1, wnfTileY(0), WNF_TILE.w, WNF_TILE.h, "\u{1F4B3}", "paying by card", on(t, cTill, 0.4), "cross");
    out += wnfTile(x1, wnfTileY(1), WNF_TILE.w, WNF_TILE.h, "\u{1F4B5}", "cash", on(t, cCash, 0.4), "tick");

    /* home */
    var oH = on(t, cVideos, 0.5);
    out += G(Em(WNF_COLX[2], 56, 40, "\u{1F3E0}") + Tx(WNF_COLX[2], 92, "At home", "lab mid", "middle"), { opacity: oH });
    var x2 = WNF_COLX[2] - WNF_TILE.w / 2;
    out += wnfTile(x2, wnfTileY(0), WNF_TILE.w, WNF_TILE.h, "\u{1F3AC}", "videos", on(t, cVideos, 0.4), "cross");
    out += wnfTile(x2, wnfTileY(1), WNF_TILE.w, WNF_TILE.h, "\u{1F4DE}", "calls", on(t, cCalls, 0.4), "cross");
    out += wnfTile(x2, wnfTileY(2), WNF_TILE.w, WNF_TILE.h, "\u{1F50A}", "the smart speaker", on(t, cSpeaker, 0.4), "cross");

    if (bump(t, cAll, 1.5) > 0.02) out += R(40, 34, 1088, 300, 26, "none", P.ink, 3, { opacity: bump(t, cAll, 1.5) });

    /* need nobody else */
    var stillW = 220, stillGap = 40, stillX0 = (1168 - 2 * stillW - stillGap) / 2, stillY = 342;
    out += wnfTile(stillX0, stillY, stillW, 62, "✏️", "writing a story", on(t, cWriting, 0.4), "tick");
    out += wnfTile(stillX0 + stillW + stillGap, stillY, stillW, 62, "\u{1F9EE}", "the calculator", on(t, cCalc, 0.4), "tick");
    out += Tx(584, 428, "need nobody else", "lab mid", "middle", { fill: P.good, opacity: on(t, cNobody, 0.5) });
    return svg(out);
  }
