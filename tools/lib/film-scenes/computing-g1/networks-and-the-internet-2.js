  /* ==== Networks and the Internet, part 2 =====================================
     The chapters "The router at home" and "Wired and wireless". The Network
     builder and the Wire spotter are closures inside their own activities and
     cannot be lifted, so both are drawn here - with the lesson's own layout,
     its own emoji and its own words. */

  /* ---- chapter: the router at home -------------------------------------------- */
  var NW_HUB = [584, 246];
  var NW_KIT = [
    { id: "laptop", at: [300, 118], glyph: "\u{1F4BB}", name: "laptop", wired: true },
    { id: "printer", at: [868, 118], glyph: "\u{1F5A8}️", name: "printer", wired: true },
    { id: "tablet", at: [300, 358], glyph: "\u{1F4F1}", name: "tablet", wired: false },
    { id: "phone", at: [868, 358], glyph: "\u{1F4F2}", name: "phone", wired: false }
  ];
  /* the two ends of a leg from a device to the router, clear of both */
  function nwLeg(from, padA, padB) {
    var dx = NW_HUB[0] - from[0], dy = NW_HUB[1] - from[1], d = Math.hypot(dx, dy) || 1;
    return [from[0] + dx / d * padA, from[1] + dy / d * padA, NW_HUB[0] - dx / d * padB, NW_HUB[1] - dy / d * padB];
  }
  function nwRouter(t, o, lightsAt) {
    if (!(o > 0)) return "";
    var x = NW_HUB[0], y = NW_HUB[1], out = "";
    out += R(x - 72, y - 58, 144, 116, 20, P.cell, P.line, 3);
    out += Em(x, y - 14, 62, "\u{1F4E1}");
    for (var k = 0; k < 3; k++) {
      var lit = lightsAt == null || t < lightsAt ? 0.22 : 0.25 + 0.75 * breathe(t * 1.6 + k * 1.3);
      out += C(x - 32 + k * 32, y + 36, 8, P.good, null, null, { opacity: 0.2 + 0.8 * lit });
    }
    return G(out, { transform: around(x, y, Math.min(1, o)), opacity: clamp(o, 0, 1) });
  }

  function nwRouterChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cHome = c(0, "home"), cEvery = c(0, "every"), cBox = c(0, "box");
    var cRouter = c(1, "router"), cLights = c(1, "lights");
    var cLaptop = c(2, "laptop"), cPrinter = c(2, "printer"), cWire = c(2, "wire");
    var cTablet = c(3, "tablet"), cPhone = c(3, "phone"), cNoWire = c(3, "nowire");
    var cPic = c(4, "picture"), cThru = c(4, "through");
    var out = "";

    /* "At home" */
    var ho = popIn(t, cHome, 0.45);
    if (ho > 0) out += G(Em(104, 84, 74, "\u{1F3E0}") + Tx(104, 142, "home", "lab mid muted", "middle"),
      { transform: around(104, 92, Math.min(1, ho)), opacity: Math.min(1, ho) });

    /* the cables and the wireless links, each made when its own words are said */
    NW_KIT.forEach(function (d) {
      var lg = nwLeg(d.at, 54, 84);
      if (d.wired) out += nwCable(lg[0], lg[1], lg[2], lg[3], on(t, cWire, 0.8), P.gold, 7);
      else out += nwAir(t, cNoWire, lg[0], lg[1], lg[2], lg[3], P.teal);
    });

    /* the router: the box on "one box", named and blinking on its own line */
    out += nwRouter(t, popIn(t, cBox, 0.45), cLights);
    out += MK.ripple(NW_HUB[0], NW_HUB[1], t, cBox, P.blue);
    var ro = on(t, cRouter, 0.4) * (1 - on(t, BEATS[scene.first + 2].start - GAP, 0.5));
    if (ro > 0) out += R(NW_HUB[0] - 80, NW_HUB[1] - 66, 160, 132, 24, "none", P.gold, 5, { opacity: ro });
    out += nwTag(t, 584, 388, "router", cRouter, [NW_HUB[0], NW_HUB[1] + 62], P.gold, 30);

    /* the four devices, one named at a time: only the newest is rung */
    var cueOf = { laptop: cLaptop, printer: cPrinter, tablet: cTablet, phone: cPhone };
    var order = ["laptop", "printer", "tablet", "phone"];
    var newest = null;
    order.forEach(function (id) { var a = cueOf[id]; if (a != null && t >= a && t < a + 1.6) newest = id; });
    NW_KIT.forEach(function (d, k) {
      var own = cueOf[d.id];
      var pop = Math.max(popIn(t, cEvery == null ? null : cEvery + k * 0.1, 0.45), popIn(t, own, 0.45));
      out += nwDevice(d.at[0], d.at[1], 76, d.glyph, d.name, pop,
        newest === d.id ? P.gold : null, 0.42 + 0.58 * on(t, own, 0.4));
    });

    /* "send a picture ... through the router": the lesson's own send, tablet to
       printer, arriving and printing well before the line ends */
    var only4 = nwOnly(t, scene, 4);
    if (only4 > 0 && cPic != null) {
      var tabl = NW_KIT[2].at, prn = NW_KIT[1].at;
      var p = nwAlong(t, cPic + 0.2, 1.0, tabl[0] + 44, tabl[1] - 30, NW_HUB[0] - 6, NW_HUB[1] + 6, 46, "\u{1F5BC}️", 20);
      if (cThru != null && t >= cThru) p = nwAlong(t, cThru, 0.7, NW_HUB[0] - 6, NW_HUB[1] + 6, prn[0] - 40, prn[1] + 26, 46, "\u{1F5BC}️", 20);
      out += nwFly(p, only4);
      var done = cThru == null ? 0 : ease(clamp((t - cThru - 0.7) / 0.3, 0, 1));
      if (done > 0) {
        out += G(R(prn[0] - 24, prn[1] + 30, 48, 34 * done, 4, P.paper, "#CFC9B6", 2), { opacity: only4 });
        out += MK.tick(prn[0] + 56, prn[1] - 34, 22, popIn(t, cThru + 0.85, 0.35) * only4);
      }
    }
    return svg(out);
  }

  /* ---- chapter: wired and wireless ---------------------------------------------
     The lesson's Wire spotter: two bins, Wired and Wireless, and its own items
     sorted into them - a desktop with a cable into the wall and headphones on
     one side; a tablet, a phone and a smart watch on the other. */
  var NW_BIN = { y: 36, h: 344, w: 448, left: 108, right: 612 };
  var NW_WIRED = [
    { x: 258, glyph: "\u{1F5A5}️", name: "desktop" },
    { x: 406, glyph: "\u{1F3A7}", name: "headphones" }
  ];
  var NW_FREE = [
    { x: 724, glyph: "\u{1F4F1}", name: "tablet" },
    { x: 836, glyph: "\u{1F4F2}", name: "phone" },
    { x: 948, glyph: "⌚", name: "smart watch" }
  ];

  function nwBin(x, title, glyph, o, lit) {
    if (!(o > 0)) return "";
    var out = R(x, NW_BIN.y, NW_BIN.w, NW_BIN.h, 26, P.card, lit > 0 ? P.good : P.line, lit > 0 ? 4 : 3);
    out += Em(x + 62, NW_BIN.y + 44, 52, glyph);
    out += Tx(x + 104, NW_BIN.y + 58, title, "lab big", "start");
    out += L(x + 24, NW_BIN.y + 90, x + NW_BIN.w - 24, NW_BIN.y + 90, P.line, 2);
    return G(out, { opacity: clamp(o, 0, 1) });
  }
  /* an item dropping into its bin, with a tick once it lands */
  function nwItem(t, it, at, o) {
    if (!(o > 0) || at == null || t < at - 0.35) return "";
    var u = ease(clamp((t - (at - 0.25)) / 0.5, 0, 1)), y = 216;
    return G(Em(it.x, lerp(y - 90, y, u), 82, it.glyph) +
      Tx(it.x, y + 58, it.name, "lab mid muted", "middle", { opacity: u }) +
      MK.tick(it.x + 48, lerp(y - 90, y, u) - 40, 18, popIn(t, at + 0.35, 0.35)),
      { opacity: clamp(o, 0, 1) * Math.min(1, u * 2) });
  }

  function nwWiresChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cWired = c(0, "wired"), cCable = c(0, "cable");
    var cDesk = c(1, "desktop"), cHead = c(1, "head");
    var cLess = c(2, "wireless"), cAir = c(2, "air");
    var cTab = c(3, "tablet"), cPh = c(3, "phone"), cWatch = c(3, "watch");
    var cBoth = c(4, "both"), cSee = c(4, "see");
    var out = "", lit = on(t, cBoth, 0.5);

    out += nwBin(NW_BIN.left, "Wired", "\u{1F50C}", popIn(t, cWired, 0.45), lit);
    out += nwBin(NW_BIN.right, "Wireless", "\u{1F4F6}", popIn(t, cLess, 0.45), lit);

    /* "a cable carrying its connection": a plugged cable across the empty bin */
    var only0 = nwOnly(t, scene, 0);
    if (only0 > 0) {
      var cu = on(t, cCable, 0.9);
      out += G(nwCable(176, 236, 492, 236, cu, P.gold, 9) +
        Em(158, 236, 46, "\u{1F50C}") +
        (cu >= 1 ? R(496, 202, 40, 68, 8, P.cell, P.line, 3) + C(508, 226, 5, P.line) + C(524, 226, 5, P.line) : ""),
        { opacity: only0 });
    }
    /* "through the air, with no cable at all": arcs across the empty bin */
    var only2 = nwOnly(t, scene, 2);
    if (only2 > 0 && cAir != null) {
      out += G(Em(672, 236, 46, "\u{1F4F1}") +
        MK.waves(700, 236, t, cAir, { dir: 0, spread: 1.0, n: 3, period: 1.0, reach: 220, col: P.teal }) +
        Em(1000, 236, 46, "\u{1F4E1}"), { opacity: only2 });
    }

    /* the items, each dropping in as it is named */
    var wiredO = nwFrom(t, scene, 1), freeO = nwFrom(t, scene, 3);
    out += nwItem(t, NW_WIRED[0], cDesk, wiredO) + nwItem(t, NW_WIRED[1], cHead, wiredO);
    out += nwItem(t, NW_FREE[0], cTab, freeO) + nwItem(t, NW_FREE[1], cPh, freeO) + nwItem(t, NW_FREE[2], cWatch, freeO);

    /* "Both are connected" - and the invisible half flickers on "cannot see" */
    if (lit > 0) {
      out += MK.pill(NW_BIN.left + NW_BIN.w / 2, 330, "connected", lit, { size: 26, col: P.good, ink: P.ink });
      out += MK.pill(NW_BIN.right + NW_BIN.w / 2, 330, "connected", lit, { size: 26, col: P.good, ink: P.ink });
      var flick = cSee == null ? 1 : 1 - 0.85 * bump(t, cSee, 1.1);
      out += G(L(726, 144, 940, 144, P.teal, 4, { "stroke-dasharray": "9 11" }) +
        MK.waves(732, 144, t, cBoth, { dir: 0, spread: 0.8, n: 3, period: 1.0, reach: 150, col: P.teal }),
        { opacity: lit * flick });
      out += G(nwCable(230, 144, 442, 144, 1, P.gold, 5), { opacity: lit });
    }
    return svg(out);
  }
