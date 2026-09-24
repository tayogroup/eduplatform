  /* ==== When Networks Fail, part 2: encryption, where and why =================
     tools/lib/film-scenes/computing-g4/when-networks-fail-2.js. See the header
     of when-networks-fail.js.

     Two chapters: what encryption actually does to data crossing a network
     (scrambles it; hides what it says, not that it was sent), and where the
     lesson says it is used - six things that need it, and the one thing
     (a bus timetable) that does not. The bus timetable is marked with an OPEN
     padlock, never a cross: it is not wrong, it simply needs no protecting,
     and a cross is kept for the broken link alone. */

  /* ==== chapter: encryption ================================================== */
  function wnfScrambleChapter(scene, beat, t, i) {
    var cEnc = sc(scene, 0, "enc"), cKey = sc(scene, 0, "key");
    var cPasses = sc(scene, 1, "passes");
    var cGrabs = sc(scene, 2, "grabs"), cNonsense = sc(scene, 2, "nonsense");
    var cThink = sc(scene, 3, "think"), cSent = sc(scene, 3, "sent");
    var cSays = sc(scene, 4, "says"), cWent = sc(scene, 4, "went"), cRead = sc(scene, 4, "read");
    var out = "";

    var dax = 110, dbx = 1058, dy = 250, dr = 50;
    out += wnfDevice(dax, dy, dr, "\u{1F4BB}", "a device", 1, null);
    out += wnfDevice(dbx, dy, dr, "\u{1F5A5}️", "another device", 1, null);

    /* many devices on the way */
    var passShown = on(t, cPasses, 0.5);
    var dots = [300, 460, 630, 800, 960];
    var shown = tally(t, cPasses, dots.length, 1.5);
    dots.forEach(function (x, k) {
      if (k >= shown) return;
      out += C(x, dy, 12, P.card, P.line, 2, { opacity: passShown });
    });
    if (passShown > 0) out += Tx(584, dy - 78, "passes through many devices on its way", "lab mid muted readable", "middle",
      { opacity: passShown });

    /* the padlock: encryption scrambles the data before it goes */
    var pLock = popIn(t, cEnc, 0.4), pKey = popIn(t, cKey, 0.35);
    if (pLock > 0) out += G(Em(dax, dy - 96, 44, "\u{1F512}"), { transform: around(dax, dy - 96, Math.min(1.08, pLock)), opacity: Math.min(1, pLock) });
    if (pKey > 0) out += G(Em(dax + 42, dy - 122, 26, "\u{1F511}"), { transform: "rotate(-20 " + (dax + 42) + " " + (dy - 122) + ") " + around(dax + 42, dy - 122, Math.min(1.08, pKey)), opacity: Math.min(1, pKey) });
    if (pLock > 0) out += Tx(dax, dy - 148, "encryption", "lab small", "middle", { fill: P.plum, opacity: Math.min(1, pLock) });

    /* the grabber in the middle, and the nonsense it sees */
    var gx = 630, gy = dy;
    var pGrab = popIn(t, cGrabs, 0.4);
    if (pGrab > 0) out += G(Em(gx, gy + 78, 46, "\u{1F590}️"), { transform: around(gx, gy + 78, Math.min(1.08, pGrab)), opacity: Math.min(1, pGrab) });
    var showBubble = on(t, cNonsense, 0.4);
    if (showBubble > 0) out += MK.bubble(gx - 110, gy - 130, 220, 76, "%@#! &%?", showBubble, gx, gy + 40);

    /* the misconception, and the fix: it hides what it SAYS, not THAT it went.
       Off gx (630) on purpose: the "hides what the message says" heading is
       centred at 584 and is about as wide as the canvas' middle third, so an
       envelope column at gx sat the tick directly on the word "message". */
    var envX = 860, envY = gy - 168;
    var thinking = wnfPast(t, cThink) && !wnfPast(t, cWent);
    var resolved = wnfPast(t, cWent);
    var envO = Math.max(popIn(t, cThink, 0.4), resolved ? 1 : 0);
    if (envO > 0) out += G(Em(envX, envY, 40, "✉️"), { opacity: Math.min(1, envO) * (resolved ? 1 : 0.55) });
    if (thinking) out += MK.qmark(envX, envY - 36, 20, popIn(t, cThink, 0.4));
    if (resolved) out += MK.tick(envX, envY - 36, 20, popIn(t, cWent, 0.4));
    var readO = on(t, cRead, 0.45);
    if (readO > 0) {
      out += Em(gx + 76, gy - 96, 30, "\u{1F441}️", { opacity: readO });
      out += MK.cross(gx + 76, gy - 96, 18, popIn(t, cRead, 0.4));
    }
    if (wnfPast(t, cSays)) out += Tx(584, 40, "hides what the message says", "lab mid", "middle",
      { fill: P.plum, opacity: on(t, cSays, 0.5) });
    return svg(out);
  }

  /* ==== chapter: where and why ================================================ */
  var WNF_ENC_COL = [60, 608];
  var WNF_ENC = { w: 500, h: 76, gap: 14 };
  function wnfEncY(k) { return 24 + k * (WNF_ENC.h + WNF_ENC.gap); }
  function wnfEncRow(x, y, w, h, pic, label, o, open) {
    if (!(o > 0)) return "";
    var lock = open ? "\u{1F513}" : "\u{1F512}", col = open ? P.blue : P.plum;
    var body = R(x, y, w, h, 14, open ? "#173049" : "#2E2340", col, open ? 2.4 : 3) +
      Em(x + h * 0.5, y + h / 2, h * 0.5, pic) +
      Tx(x + h * 1.02, y + h / 2 + 7, label, "lab mid", "start") +
      Em(x + w - h * 0.55, y + h / 2, h * 0.52, lock);
    return G(body, { opacity: Math.min(1, o), transform: around(x + w / 2, y + h / 2, Math.min(1.06, o)) });
  }

  function wnfWhereChapter(scene, beat, t, i) {
    var cPassword = sc(scene, 0, "password"), cLeaves = sc(scene, 0, "leaves");
    var cCard = sc(scene, 1, "card"), cMessage = sc(scene, 1, "message");
    var cRecord = sc(scene, 2, "record"), cPadlock = sc(scene, 2, "padlock"), cConn = sc(scene, 2, "conn");
    var cWifi = sc(scene, 3, "wifi"), cAir = sc(scene, 3, "air");
    var cHarm = sc(scene, 4, "harm");
    var cBus = sc(scene, 5, "bus"), cAnyone = sc(scene, 5, "anyone");
    var out = "";

    out += wnfEncRow(WNF_ENC_COL[0], wnfEncY(0), WNF_ENC.w, WNF_ENC.h, "\u{1F511}", "your password", on(t, cPassword, 0.4), false);
    out += wnfEncRow(WNF_ENC_COL[0], wnfEncY(1), WNF_ENC.w, WNF_ENC.h, "\u{1F4B3}", "a card number", on(t, cCard, 0.4), false);
    out += wnfEncRow(WNF_ENC_COL[0], wnfEncY(2), WNF_ENC.w, WNF_ENC.h, "\u{1F4AC}", "a private message", on(t, cMessage, 0.4), false);
    out += wnfEncRow(WNF_ENC_COL[1], wnfEncY(0), WNF_ENC.w, WNF_ENC.h, "\u{1F3E5}", "a medical record", on(t, cRecord, 0.4), false);
    out += wnfEncRow(WNF_ENC_COL[1], wnfEncY(1), WNF_ENC.w, WNF_ENC.h, "\u{1F510}", "the browser padlock", on(t, cPadlock, 0.4), false);
    out += wnfEncRow(WNF_ENC_COL[1], wnfEncY(2), WNF_ENC.w, WNF_ENC.h, "\u{1F4F6}", "the wi-fi password", on(t, cWifi, 0.4), false);

    if (wnfPast(t, cLeaves)) out += Tx(WNF_ENC_COL[0] + WNF_ENC.w / 2, wnfEncY(0) - 4, "before it leaves your device",
      "lab small muted readable", "middle", { opacity: on(t, cLeaves, 0.4) });
    if (wnfPast(t, cConn)) out += Tx(WNF_ENC_COL[1] + WNF_ENC.w / 2, wnfEncY(1) - 4, "that connection is encrypted",
      "lab small muted readable", "middle", { opacity: on(t, cConn, 0.4) });
    if (wnfPast(t, cAir)) out += Tx(WNF_ENC_COL[1] + WNF_ENC.w / 2, wnfEncY(2) - 4, "encrypts what travels through the air",
      "lab small muted readable", "middle", { opacity: on(t, cAir, 0.4) });

    var harmB = bump(t, cHarm, 1.8);
    if (harmB > 0.02) out += R(40, 10, 1088, 268, 22, "none", P.ink, 3, { opacity: harmB });
    if (wnfPast(t, cHarm)) out += Tx(584, 302, "anything that would do harm if a stranger read it", "lab mid", "middle",
      { fill: P.plum, opacity: on(t, cHarm, 0.5) });

    var busO = on(t, cBus, 0.5);
    out += wnfEncRow(234, 326, 700, 78, "\u{1F68C}", "a bus timetable", busO, true);
    if (busO > 0) out += Tx(584, 326 + 78 + 20, "no need - anyone may read it", "lab mid", "middle",
      { fill: P.blue, opacity: on(t, cAnyone, 0.4) });
    return svg(out);
  }
