  /* ==== Clients, Servers and the Web, part 3: hyperlinks, the two ways to
     join, the trade between them, and the recap ================================
     tools/lib/film-scenes/computing-g4/clients-servers-and-the-web-3.js.
     See the header of clients-servers-and-the-web.js.

     The router, the cable and the radio waves are drawn here rather than
     lifted: this lesson's network activity is a closure inside the lesson
     page, so the kit has no picture of it a film can reach. The pictures are
     the lesson's own word-card emoji, and every label is a phrase from
     lesson-10.py. */

  /* a thing with its name under it, centred on (cx, cy) */
  function cswThing(cx, cy, size, pic, word, o, col) {
    if (!(o > 0)) return "";
    var w = Math.max(size * 2.4, String(word || "").length * 15 + 40), h = size * 2.3;
    return G(R(cx - w / 2, cy - h / 2, w, h, 20, P.cell, col || P.line, col ? 3.5 : 2) +
      MK.pic(cx, cy - h * 0.17, size, pic) +
      (word ? Tx(cx, cy + h * 0.33, word, "lab big", "middle") : ""),
      { transform: around(cx, cy, Math.min(1.06, clamp(o, 0, 1.08))), opacity: Math.min(1, o) });
  }

  /* ==== chapter: made of hyperlinks ===============================================
     A pile of pages is not a web. The hyperlink is what joins them: press the
     word, jump to another page, which may be on another server in another
     country - and page by page the pages of the world are joined. */
  var CSW_PILE = [[-26, -14, -7], [14, -6, 5], [-10, 10, -3], [22, 18, 9], [0, 0, 0]];
  var CSW_LP = { w: 200, h: 152 };
  var CSW_LPOS = [[150, 112], [520, 44], [880, 120], [90, 276], [452, 262], [836, 276]];
  var CSW_LLINK = ["lions", "big cats", "grasslands", "rivers", "the plains", "hunting"];
  /* which pages point at which, once the web is joined */
  var CSW_LJOIN = [[0, 1], [1, 2], [0, 3], [3, 4], [4, 2], [2, 5], [1, 4]];
  function cswLCentre(k) { return [CSW_LPOS[k][0] + CSW_LP.w / 2, CSW_LPOS[k][1] + CSW_LP.h / 2]; }

  function cswLinksPile(scene, t) {
    var cWeb = sc(scene, 0, "web"), cPile = sc(scene, 0, "pile");
    var out = "", o = on(t, cWeb, 0.6);
    CSW_PILE.forEach(function (p, k) {
      var x = 584 + p[0] - CSW_LP.w / 2, y = 214 + p[1] - CSW_LP.h / 2;
      out += G(cswPage(x, y, CSW_LP.w, CSW_LP.h, { o: o, pic: CSW_PIC.page }),
        { transform: "rotate(" + n2(p[2]) + " " + n2(584 + p[0]) + " " + n2(214 + p[1]) + ")" });
    });
    out += MK.qmark(836, 172, 44, on(t, cPile, 0.5));
    out += MK.pill(584, 400, "a pile of pages is not a web", on(t, cPile, 0.5),
      { size: 24, col: P.muted, ink: P.muted });
    return out;
  }

  function cswLinksWeb(scene, t) {
    var cHyper = sc(scene, 1, "hyperlink"), cPress = sc(scene, 1, "press"), cJump = sc(scene, 1, "jump");
    var cSrv = sc(scene, 2, "server"), cCtry = sc(scene, 2, "country");
    var cPoints = sc(scene, 3, "points"), cWorld = sc(scene, 3, "world");
    var out = "", more = tally(t, cPoints, 6, 1.1);

    /* the joins, once the pages of the world are joined */
    var jw = on(t, cWorld, 1.2);
    CSW_LJOIN.forEach(function (j, k) {
      if (j[0] === 0 && j[1] === 1) return;                 /* the first jump is drawn on its own cue */
      var a = cswLCentre(j[0]), b = cswLCentre(j[1]);
      var u = clamp(jw * CSW_LJOIN.length - k, 0, 1);
      out += MK.leader(a[0], a[1], b[0], b[1], u, P.plum);
    });

    CSW_LPOS.forEach(function (pos, k) {
      /* the first page arrives with the beat, as the pile fades: waiting for the
         cue left about a second of empty frame */
      var o = k === 0 ? Math.max(into(t, scene.first + 1), on(t, cHyper, 0.5))
        : k === 1 ? popIn(t, cJump, 0.45)
        : clamp(more - k, 0, 1) * popIn(t, cPoints == null ? null : cPoints + (k - 2) * 0.22, 0.4);
      if (!(o > 0)) return;
      out += cswPage(pos[0], pos[1], CSW_LP.w, CSW_LP.h,
        { o: o, lit: k < 2, pic: k === 0 ? CSW_PIC.lion : CSW_PIC.web, link: CSW_LLINK[k] });
    });

    /* press the hyperlink, and jump */
    var lx = CSW_LPOS[0][0] + CSW_LP.w / 2, ly = CSW_LPOS[0][1] + CSW_LP.h - 18;
    out += MK.pill(lx, CSW_LPOS[0][1] - 26, "a hyperlink", on(t, cHyper, 0.45),
      { size: 22, col: P.plum, ink: P.plum });
    out += MK.ripple(lx, ly - 4, t, cPress, P.gold);
    out += MK.finger(lx, ly + 6, on(t, cPress, 0.4) * (1 - on(t, cJump, 0.5)));
    var a0 = cswLCentre(0), a1 = cswLCentre(1);
    out += MK.arrow(a0[0] + 60, a0[1] - 40, a1[0] - 70, a1[1] + 24, on(t, cJump, 0.7), P.plum, 7);

    /* that page may be on another server, in another country: both hang off
       the page that was jumped to, and both are gone before the mesh needs the
       space they stand in */
    var away = 1 - into(t, scene.first + 3);
    var sp = popIn(t, cSrv, 0.42) * away, cp = popIn(t, cCtry, 0.42) * away;
    var ty = 312, py = CSW_LPOS[1][1] + CSW_LP.h;
    out += MK.leader(a1[0] - 40, py, 560, ty - 52, on(t, cSrv, 0.45) * away, P.teal);
    out += MK.leader(a1[0] + 40, py, 880, ty - 52, on(t, cCtry, 0.45) * away, P.teal);
    out += cswThing(560, ty, 44, CSW_PIC.server, "another server", sp, P.teal);
    out += cswThing(880, ty, 44, CSW_PIC.world, "another country", cp, P.teal);
    out += MK.pill(950, 30, "the pages of the world, joined", on(t, cWorld, 0.5),
      { size: 21, col: P.plum, ink: P.plum });
    return out;
  }

  function cswLinksChapter(scene, beat, t, i) {
    var u = into(t, scene.first + 1), out = "";
    if (u < 1) out += G(cswLinksPile(scene, t), { opacity: 1 - u });
    if (u > 0) out += G(cswLinksWeb(scene, t), { opacity: u });
    return svg(out);
  }

  /* ==== chapter: ethernet and wi-fi ===============================================
     One router, two ways to reach it: a cable that draws itself, and radio
     waves - the same waves that bring music to a radio. */
  var CSW_RTR = { cx: 584, cy: 96 };
  var CSW_ETH = { cx: 196, cy: 312 };
  var CSW_WIF = { cx: 976, cy: 312 };

  function cswWiresChapter(scene, beat, t, i) {
    var cTwo = sc(scene, 0, "two"), cEth = sc(scene, 0, "eth"), cWifi = sc(scene, 0, "wifi");
    var cRtr = sc(scene, 1, "router"), cCab = sc(scene, 1, "cable");
    var cWls = sc(scene, 2, "wireless"), cNoW = sc(scene, 2, "nowire"), cRad = sc(scene, 2, "radio");
    var cSame = sc(scene, 3, "same"), cMus = sc(scene, 3, "music");
    var out = "";

    /* the router, and the two ways in */
    var ro = on(t, cTwo, 0.5);
    /* r under cy, for the same reason as the browser's glow in part 2 */
    out += MK.glow(CSW_RTR.cx, CSW_RTR.cy, 92, P.gold, on(t, cRtr, 0.5) * 0.95);
    out += cswThing(CSW_RTR.cx, CSW_RTR.cy, 60, CSW_PIC.router, "router", ro, P.gold);
    out += MK.pill(CSW_ETH.cx, 60, "ethernet: a cable", on(t, cEth, 0.45), { size: 23, col: P.good, ink: P.good });
    out += MK.pill(CSW_WIF.cx, 60, "wi-fi: no wire", on(t, cWifi, 0.45), { size: 23, col: P.blue, ink: P.blue });

    /* the cable, drawing itself from the laptop to the router, and the plug
       landing where it is said to reach */
    var cu = on(t, cCab, 1.5);
    out += cswWire(CSW_ETH.cx + 78, CSW_ETH.cy - 44, CSW_RTR.cx - 96, CSW_RTR.cy + 34, cu, P.good, 8);
    out += cswThing(CSW_ETH.cx, CSW_ETH.cy, 58, CSW_PIC.laptop, "laptop", on(t, cEth, 0.5), P.good);
    out += MK.pop(MK.pic(CSW_RTR.cx - 96, CSW_RTR.cy + 34, 42, CSW_PIC.ethernet), CSW_RTR.cx - 96, CSW_RTR.cy + 34,
      popIn(t, cRtr, 0.4));

    /* the tablet joins on the other side; the wire that is not there is drawn
       and then crossed out, and the waves take over from it */
    out += cswThing(CSW_WIF.cx, CSW_WIF.cy, 58, CSW_PIC.client, "tablet", on(t, cWifi, 0.5), P.blue);
    var gx = lerp(CSW_WIF.cx - 78, CSW_RTR.cx + 96, 0.5), gy = lerp(CSW_WIF.cy - 44, CSW_RTR.cy + 34, 0.5);
    var nw = on(t, cWls, 0.5) * (1 - on(t, cRad, 0.6));
    if (nw > 0) {
      out += G(cswWire(CSW_WIF.cx - 78, CSW_WIF.cy - 44, CSW_RTR.cx + 96, CSW_RTR.cy + 34, 1, P.muted, 6),
        { opacity: 0.45 * nw, "stroke-dasharray": "12 10" });
      out += MK.cross(gx, gy, 28, popIn(t, cNoW, 0.4) * (1 - on(t, cRad, 0.6)));
    }
    out += MK.waves(CSW_WIF.cx - 54, CSW_WIF.cy - 38, t, cRad, { dir: -2.724, spread: 0.85, n: 3, reach: 300, col: P.blue });
    out += MK.pill(846, 168, "radio waves", on(t, cRad, 0.45), { size: 22, col: P.blue, ink: P.blue });

    /* The same waves bring music to a radio. The radio stands at 390, NOT in
       the middle: under the router its own waves spread straight up at the
       router and read as the radio joining the network, which is not what the
       line says. Here they spread into empty sky, clear of the cable above. */
    out += cswThing(390, 330, 50, CSW_PIC.radio, "a radio", popIn(t, cMus, 0.45), P.blue);
    out += MK.waves(390, 290, t, cMus, { dir: -Math.PI / 2, spread: 1.0, n: 3, reach: 60, col: P.blue });
    out += MK.pill(CSW_RTR.cx, 418, "the same radio waves", on(t, cSame, 0.5), { size: 22, col: P.blue, ink: P.blue });
    return svg(out);
  }

  /* ==== chapter: speed, safety and wires ==========================================
     The lesson's own trade, side by side: a wire is faster, steadier and safer;
     wi-fi goes where you go but walls weaken it and anyone in range can try. */
  var CSW_COL = { y: 88, h: 304, w: 520, left: 40, right: 608 };
  function cswTradeCard(x, pic, name, rows, t, col) {
    var out = R(x, CSW_COL.y, CSW_COL.w, CSW_COL.h, 24, P.card, col, 3) +
      MK.pic(x + 62, CSW_COL.y + 54, 54, pic) +
      Tx(x + 106, CSW_COL.y + 66, name, "lab big", "start");
    out += MK.list(x + 36, CSW_COL.y + 124, rows, t, { lh: 50, cls: "lab big", markR: 17 });
    return out;
  }

  function cswTradeChapter(scene, beat, t, i) {
    var cFast = sc(scene, 0, "faster"), cMore = sc(scene, 0, "more"), cNone = sc(scene, 0, "none");
    var cSafe = sc(scene, 1, "safer"), cStr = sc(scene, 1, "stranger"), cPlug = sc(scene, 1, "plug");
    var cGoes = sc(scene, 2, "goes"), cGard = sc(scene, 2, "garden"), cPhone = sc(scene, 2, "phone");
    var cWall = sc(scene, 3, "walls"), cRange = sc(scene, 3, "range");
    var cPass = sc(scene, 4, "password"), cBoth = sc(scene, 4, "both");
    var out = "", lit = on(t, cBoth, 0.5);

    out += cswTradeCard(CSW_COL.left, CSW_PIC.ethernet, "Ethernet", [
      { text: "faster and steadier", at: cFast, mark: "tick" },
      { text: "carries more", at: cMore, mark: "tick" },
      { text: "no interference", at: cNone, mark: "tick" },
      { text: "you must plug in to join", at: cPlug, mark: "tick" }
    ], t, lit > 0.5 ? P.gold : P.good);

    out += cswTradeCard(CSW_COL.right, CSW_PIC.wifi, "Wi-fi", [
      { text: "a tablet in the garden", at: cGard, mark: "tick" },
      { text: "a phone in your hand", at: cPhone, mark: "tick" },
      { text: "thick walls weaken it", at: cWall, mark: "cross" },
      { text: "anyone in range can try", at: cRange, mark: "cross" }
    ], t, lit > 0.5 ? P.gold : P.blue);

    /* the props, in the band above the two cards */
    var st = popIn(t, cStr, 0.42) * (1 - on(t, cPlug == null ? null : cPlug + 1.1, 0.5));
    out += MK.pop(MK.pic(150, 42, 54, CSW_PIC.stranger), 150, 42, st);
    out += MK.cross(186, 26, 19, popIn(t, cPlug, 0.4) * (1 - on(t, cPlug == null ? null : cPlug + 1.1, 0.5)));
    /* the wall and the password sit to the RIGHT of "goes where you go": at
       718 the wall stood beside that label and read as part of it, and a wall
       is what WEAKENS wi-fi, not what it is good at */
    out += MK.pop(MK.pic(1058, 42, 44, CSW_PIC.wall), 1058, 42, popIn(t, cWall, 0.42));
    out += MK.pop(MK.pic(1124, 42, 44, CSW_PIC.key), 1124, 42, popIn(t, cPass, 0.42));

    out += Tx(330, 48, "safer", "lab big", "middle", { fill: P.good, opacity: on(t, cSafe, 0.45) });
    /* centred on the wi-fi card (868), not on 900: at 30 px "goes where you go"
       is about 280 wide, and its last letter ran under the wall */
    out += Tx(856, 48, "goes where you go", "lab big", "middle", { fill: P.blue, opacity: on(t, cGoes, 0.45) });
    out += MK.pill(584, 420, "a school has both", on(t, cBoth, 0.5), { size: 23, col: P.gold, ink: P.gold });
    return svg(out);
  }

  /* ---- what you now know ---------------------------------------------------------
     The lesson's own six words, with the lesson's own pictures for them. */
  var CSW_RECAP = MK.recapKind([
    { beat: 0, at: "client", title: "Client", sub: "the device that asks", pic: CSW_PIC.client },
    { beat: 0, at: "server", title: "Server", sub: "stores it, and answers", pic: CSW_PIC.server },
    { beat: 1, at: "internet", title: "Internet", sub: "the network of networks", pic: CSW_PIC.internet },
    { beat: 1, at: "web", title: "World Wide Web", sub: "linked pages in a browser", pic: CSW_PIC.web },
    { beat: 2, at: "ethernet", title: "Ethernet", sub: "a cable: fast and safe", pic: CSW_PIC.ethernet },
    { beat: 3, at: "wifi", title: "Wi-fi", sub: "radio: no wire at all", pic: CSW_PIC.wifi }
  ], { goBeat: 3, goAt: "wifi" });

  var KINDS = {
    title: MK.titleKind({ sub: ["Who asks, and who answers", "The web, and the internet it travels on", "A cable, or no wire at all"] }),
    clients: cswClientsChapter, servers: cswServersChapter, internet: cswInternetChapter,
    links: cswLinksChapter, wires: cswWiresChapter, trade: cswTradeChapter, recap: CSW_RECAP
  };
