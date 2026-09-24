  /* ==== Networks Around Us, part 3: the two sides, and the recap ==============
     tools/lib/film-scenes/computing-g3/networks-around-us-3.js. See the header
     of networks-around-us.js.

     The lesson weighs a network with two bins, Advantage and Disadvantage, and
     the child drags a card into one of them. Both chapters here are that
     picture: one small school network on the left, a bin on the right, and
     every advantage and every cost coming OUT of the network it belongs to -
     the printer's out of the printer, the files out of the server, the virus
     off the laptop it landed on. */

  /* ---- the small network both chapters stand on ------------------------------- */
  var NW_NET = { cx: 290, cy: 186, w: 150 };
  var NW_MINI = [
    { id: "laptop", x: 140, y: 118, pic: "\u{1F4BB}", hub: [240, 160] },
    { id: "printer", x: 440, y: 118, pic: "\u{1F5A8}️", hub: [340, 160] },
    { id: "web", x: 140, y: 258, pic: "\u{1F310}", hub: [240, 212] },
    { id: "server", x: 440, y: 258, pic: null, hub: [340, 212] }
  ];
  function nwMiniNet(bright) {
    var out = nwSwitchBox(NW_NET.cx, NW_NET.cy, NW_NET.w, P.line);
    NW_MINI.forEach(function (d) {
      out += nwCable([d.x, d.y], d.hub, 1, P.line, 4) +
        (d.pic ? Em(d.x, d.y, 58, d.pic) : nwServerBox(d.x, d.y, 46, P.line));
    });
    return bright >= 1 ? out : G(out, { style: "filter:brightness(" + n2(bright) + ")" });
  }
  function nwNode(id) {
    for (var k = 0; k < NW_MINI.length; k++) if (NW_MINI[k].id === id) return [NW_MINI[k].x, NW_MINI[k].y];
    return [NW_NET.cx, NW_NET.cy];
  }

  /* ---- the bin ----------------------------------------------------------------- */
  var NW_BIN = { x: 620, y: 30, w: 520, h: 392, rowX: 640, rowW: 480, rowH: 54, row0: 112, pitch: 62 };
  function nwBinRowY(k) { return NW_BIN.row0 + k * NW_BIN.pitch; }

  /* cfg: {open, slotsAt, col, title, pic, mark ("tick"|"cross"), items:
     [{at, text, pic, from: [x, y]}]} */
  function nwWeigh(t, cfg) {
    var out = "", col = cfg.col, open = clamp(cfg.open, 0, 1);
    if (!(open > 0)) return "";
    out += G(R(NW_BIN.x, NW_BIN.y, NW_BIN.w, NW_BIN.h, 22, P.card, col, 3) +
      Em(NW_BIN.x + 62, NW_BIN.y + 44, 52, cfg.pic) +
      Tx(NW_BIN.x + 108, NW_BIN.y + 54, cfg.title, "lab big", "start", { fill: col }) +
      L(NW_BIN.x + 20, NW_BIN.y + 74, NW_BIN.x + NW_BIN.w - 20, NW_BIN.y + 74, P.line, 2),
      { opacity: open, transform: around(NW_BIN.x + NW_BIN.w / 2, NW_BIN.y + NW_BIN.h / 2, 0.97 + 0.03 * open) });

    cfg.items.forEach(function (it, k) {
      var y = nwBinRowY(k), cy = y + NW_BIN.rowH / 2;
      var slot = on(t, cfg.slotsAt == null ? null : cfg.slotsAt + 0.15 + k * 0.1, 0.4);
      var p = popIn(t, it.at, 0.35), m = on(t, it.at == null ? null : it.at + 0.4, 0.7);
      if (slot > 0 && m < 1)
        out += R(NW_BIN.rowX, y, NW_BIN.rowW, NW_BIN.rowH, 14, P.card, P.line, 2,
          { "stroke-dasharray": "10 8", opacity: slot * (1 - m) });
      if (m > 0)
        out += G(R(NW_BIN.rowX, y, NW_BIN.rowW, NW_BIN.rowH, 14, P.cell, col, 2.5) +
          Em(NW_BIN.rowX + 36, cy, 36, it.pic) +
          Tx(NW_BIN.rowX + 70, cy + 8, it.text, "lab", "start"), { opacity: m });
      var mp = popIn(t, it.at == null ? null : it.at + 1.15, 0.35);
      if (cfg.mark === "cross") out += MK.cross(NW_BIN.rowX + NW_BIN.rowW - 32, cy, 18, mp);
      else out += MK.tick(NW_BIN.rowX + NW_BIN.rowW - 32, cy, 18, mp);
      /* the thing itself, lifted off the network and carried into its row */
      if (p > 0 && m < 1)
        out += Em(lerp(it.from[0], NW_BIN.rowX + 36, m), lerp(it.from[1], cy, m) - 26 * Math.sin(Math.PI * m),
          lerp(74, 36, m) * Math.min(1.08, p), it.pic);
    });
    return out;
  }

  /* ==== chapter: what a network gives you ========================================
     The lesson's Advantage bin, filled with the lesson's own advantages, each
     one lifted off the piece of the network that gives it. */
  function nwGoodChapter(scene, beat, t, i) {
    var cGood = sc(scene, 0, "good"), cGives = sc(scene, 0, "gives");
    var cFiles = sc(scene, 1, "files"), cPrinter = sc(scene, 1, "printer");
    var cWeb = sc(scene, 2, "web");
    var cClasses = sc(scene, 3, "classes"), cDoc = sc(scene, 3, "document");
    var cBackup = sc(scene, 4, "backup"), cCopy = sc(scene, 4, "copy");
    var out = nwMiniNet(1);

    /* two classes, both working on the one document */
    var cl = on(t, cClasses, 0.5) * (1 - on(t, cBackup, 0.5));
    if (cl > 0) {
      var g = "";
      [130, 450].forEach(function (x) {
        g += R(x - 90, 322, 180, 92, 18, P.card, P.teal, 2.5) +
          Em(x - 44, 370, 46, "\u{1F9D1}") + Em(x, 370, 46, "\u{1F9D1}") + Em(x + 44, 370, 46, "\u{1F9D1}");
      });
      var d = on(t, cDoc, 0.5);
      g += MK.arrow(226, 368, 258, 368, d, P.teal, 6) + MK.arrow(354, 368, 322, 368, d, P.teal, 6);
      g += nwPage(290, 368, 54, popIn(t, cDoc, 0.4), P.gold);
      out += G(g, { opacity: cl });
    }
    /* the second copy a backup keeps */
    var cp = on(t, cCopy, 0.5);
    if (cp > 0)
      out += G(nwPage(236, 368, 66, 1, P.line) + nwPage(344, 368, 66, 1, P.good) +
        MK.tick(400, 332, 22, popIn(t, cCopy == null ? null : cCopy + 0.5, 0.35)), { opacity: cp });

    out += nwWeigh(t, {
      open: on(t, cGood, 0.6), slotsAt: cGives, col: P.good, title: "Advantage",
      pic: "\u{1F44D}", mark: "tick",
      items: [
        { at: cFiles, text: "share files", pic: "\u{1F4C4}", from: nwNode("server") },
        { at: cPrinter, text: "share one printer", pic: "\u{1F5A8}️", from: nwNode("printer") },
        { at: cWeb, text: "reach the web", pic: "\u{1F310}", from: nwNode("web") },
        { at: cDoc, text: "one document, two classes", pic: "\u{1F91D}", from: [NW_NET.cx, NW_NET.cy] },
        { at: cBackup, text: "a backup", pic: "\u{1F4BE}", from: nwNode("server") }
      ]
    });
    return svg(out);
  }

  /* ==== chapter: what a network costs you ========================================
     The same network and the other bin. The network dims when it is down, the
     virus copies itself across it, and on the last line every machine on it
     stops at the same moment. */
  var NW_GOOD_PICS = ["\u{1F4C4}", "\u{1F5A8}️", "\u{1F310}", "\u{1F91D}", "\u{1F4BE}"];

  function nwCostChapter(scene, beat, t, i) {
    var cCosts = sc(scene, 0, "costs"), cBoth = sc(scene, 0, "both");
    var cDown = sc(scene, 1, "down"), cNobody = sc(scene, 1, "nobody");
    var cMoney = sc(scene, 2, "money"), cAfter = sc(scene, 2, "after");
    var cSeen = sc(scene, 3, "seen"), cMean = sc(scene, 3, "mean");
    var cVirus = sc(scene, 4, "virus"), cHarm = sc(scene, 4, "harm");
    var cStops = sc(scene, 5, "stops"), cEvery = sc(scene, 5, "everybody");
    var out = "";

    /* the advantages, still true, kept quiet in the corner */
    var bo = on(t, cBoth, 0.5);
    if (bo > 0) {
      var b = R(48, 18, 504, 52, 26, P.card, P.good, 2) + Em(84, 44, 30, "\u{1F44D}");
      NW_GOOD_PICS.forEach(function (pic, k) { b += Em(150 + k * 78, 44, 30, pic); });
      b += MK.tick(520, 44, 15, 1);
      out += G(b, { opacity: bo * 0.75 });
    }

    /* the network, dim while it is down and dark when it stops for good */
    var dark = on(t, cDown, 0.6) * (1 - on(t, cMoney, 0.5)), stop = on(t, cStops, 0.7);
    out += nwMiniNet(Math.min(1 - 0.45 * dark, 1 - 0.48 * stop));
    out += MK.pop(Em(NW_NET.cx, NW_NET.cy, 70, "\u{1F6AB}"), NW_NET.cx, NW_NET.cy,
      popIn(t, cDown, 0.45) * (1 - on(t, cMoney, 0.5)));
    NW_MINI.forEach(function (d) { out += MK.cross(d.x, d.y, 26, popIn(t, cEvery, 0.4)); });

    /* a file shared across it, and who else can see it */
    var sn = on(t, cSeen, 0.5) * (1 - on(t, cVirus, 0.5));
    if (sn > 0)
      out += G(nwPage(290, 368, 58, 1, P.bad) + Em(214, 364, 46, "\u{1F440}") + Em(366, 364, 46, "\u{1F440}"), { opacity: sn });

    /* the virus, copying itself from machine to machine across the same network */
    var hm = tally(t, cHarm, 4, 1.0), hv = on(t, cHarm, 0.4) * (1 - on(t, cStops, 0.5));
    if (hv > 0) {
      var v = "";
      for (var k = 0; k < hm; k++) v += Em(NW_MINI[k].x, NW_MINI[k].y - 6, 48, "☣️");
      out += G(v, { opacity: hv });
    }

    out += nwWeigh(t, {
      open: on(t, cCosts, 0.6), slotsAt: cCosts, col: P.bad, title: "Disadvantage",
      pic: "\u{1F44E}", mark: "cross",
      items: [
        { at: cNobody, text: "nobody can save or print", pic: "\u{1F6AB}", from: [NW_NET.cx, NW_NET.cy] },
        { at: cMoney, text: "it costs money", pic: "\u{1F4B7}", from: [NW_NET.cx, NW_NET.cy] },
        { at: cAfter, text: "somebody looks after it", pic: "\u{1F527}", from: nwNode("server") },
        { at: cMean, text: "shared files can be seen", pic: "\u{1F440}", from: [290, 368] },
        { at: cVirus, text: "a computer virus", pic: "☣️", from: nwNode("laptop") }
      ]
    });
    return svg(out);
  }

  /* ---- what you now know ---------------------------------------------------------
     The three pieces of hardware drawn the way the film drew them, the word
     the lesson gives to what a network lets you do, and both sides of it. */
  var NW_RECAP = MK.recapKind([
    { beat: 0, at: "switch", title: "Switch", sub: "every cable comes to it",
      pic: function (cx, cy, s) { return nwSwitchBox(cx, cy, s * 1.5, P.line); } },
    { beat: 0, at: "server", title: "Server", sub: "it stores everyone's files",
      pic: function (cx, cy, s) { return nwServerBox(cx, cy, s * 0.62, P.line); } },
    { beat: 0, at: "access", title: "Access point", sub: "the wi-fi comes from it",
      pic: function (cx, cy, s) { return nwApDisc(cx, cy, s * 1.1, P.line); } },
    { beat: 1, at: "services", title: "Services", sub: "files, printing, the web", pic: "\u{1F6CE}️" },
    { beat: 2, at: "both", title: "Both sides", sub: "advantages and disadvantages",
      pic: function (cx, cy, s) { return Em(cx - s * 0.32, cy, s * 0.7, "\u{1F44D}") + Em(cx + s * 0.32, cy, s * 0.7, "\u{1F44E}"); } }
  ], { goBeat: 2, goAt: "both" });

  var KINDS = {
    title: MK.titleKind({ sub: ["The hardware a school network is made of",
      "The services being joined lets you use",
      "What a network gives you, and what it costs"] }),
    hardware: nwHardwareChapter,
    classroom: nwClassroomChapter,
    services: nwServicesChapter,
    good: nwGoodChapter,
    cost: nwCostChapter,
    recap: NW_RECAP
  };
