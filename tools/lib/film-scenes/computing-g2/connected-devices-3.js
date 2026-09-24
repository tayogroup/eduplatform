  /* ==== Connected Devices, part 3: is the network there, and sharing ===========
     tools/lib/film-scenes/computing-g2/connected-devices-3.js. See the header of
     connected-devices.js.

     The signs are the lesson's own Signal reader step - four bars, a green
     router light, no bars, aeroplane mode, a dark router, a page that never
     loads - and the offline half is its Offline tester, on the lesson kit's own
     tablet (ART.figure), because that is the device the child switches off. */

  /* signal bars: n of four lit */
  function cdBars(cx, cy, s, n, col) {
    var out = "";
    for (var k = 0; k < 4; k++) {
      var h = (10 + k * 8) * s, w = 7 * s;
      out += R(cx + (k - 2) * 10 * s, cy + 16 * s - h, w, h, 2, k < n ? (col || P.good) : "#22455E",
        k < n ? null : P.line, k < n ? null : 1.5);
    }
    return out;
  }

  /* A phone. ask is how far the question mark has arrived (0 to 1); with no
     question it shows bars, and with neither its screen is simply empty. */
  function cdPhone(cx, cy, h, o, bars, ask) {
    if (!(o > 0)) return "";
    var w = h * 0.52, x = cx - w / 2, y = cy - h / 2;
    var out = R(x, y, w, h, w * 0.17, P.body, P.plastic, 4) +
      R(x + w * 0.09, y + h * 0.09, w * 0.82, h * 0.78, w * 0.08, "#0B1D2C");
    if (ask > 0) out += G(Tx(cx, y + h * 0.34, "?", "lab huge gold", "middle", { "font-size": h * 0.26 }),
      { transform: around(cx, y + h * 0.26, Math.min(1.08, ask)), opacity: Math.min(1, ask) });
    else if (bars != null) out += cdBars(cx, y + h * 0.17, h / 120, bars, bars ? P.good : P.bad);
    return G(out, { transform: around(cx, cy, Math.min(1.05, o)), opacity: clamp(Math.min(1, o), 0, 1) });
  }

  /* ==== chapter: is the network there? ============================================
     Two columns, the lesson's own bins: what says the network is available, and
     what says it is not. The last beat switches to the lesson's tablet with the
     network off, and the six apps it asks the child to predict. */
  function cdHeader(cx, cy, icon, text, col, o) {
    if (!(o > 0)) return "";
    var w = String(text).length * 15 + 96, h = 50;
    return G(R(cx - w / 2, cy - h / 2, w, h, 25, P.cell, col, 3) +
      Em(cx - w / 2 + 32, cy + 2, 30, icon) +
      Tx(cx - w / 2 + 56, cy + 10, text, "lab big", "start", { fill: col }),
      { transform: around(cx, cy, Math.min(1.05, o)), opacity: clamp(Math.min(1, o), 0, 1) });
  }

  /* one sign: its picture, what it is, and the tick or cross it earns.
     icon is an emoji, or a function (cx, cy) -> markup for a thing drawn here. */
  function cdSignRow(x, y, w, h, icon, text, mark, p, o) {
    if (!(o > 0)) return "";
    var body = R(x, y - h / 2, w, h, h * 0.32, P.card, P.line, 2) +
      (typeof icon === "function" ? icon(x + h * 0.56, y) : Em(x + h * 0.56, y, h * 0.46, icon)) +
      Tx(x + h * 1.05, y + 8, text, "lab mid", "start");
    if (mark === "tick") body += MK.tick(x + w - h * 0.42, y, h * 0.26, p);
    else if (mark === "cross") body += MK.cross(x + w - h * 0.42, y, h * 0.26, p);
    return G(body, { opacity: clamp(Math.min(1, o), 0, 1) });
  }

  function cdSignalBoard(scene, t) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cTells = c(0, "tells"), cThere = c(0, "there");
    var cBars = c(1, "bars"), cGreen = c(1, "green");
    var cNo = c(2, "nobars"), cAir = c(2, "aeroplane"), cDark = c(2, "dark");
    var cSpin = c(3, "spins"), cNone = c(3, "nonetwork");
    var out = "", gone = 1 - on(t, cBars, 0.5);

    out += cdPhone(584, 236, 210, gone, null, popIn(t, cTells, 0.45) * gone);
    out += cdHeader(300, 76, "✅", "Available", P.good, on(t, cThere, 0.5));
    out += cdHeader(868, 76, "\u{1F4F4}", "Not available", P.bad, on(t, cThere == null ? null : cThere + 0.3, 0.5));

    out += cdSignRow(60, 180, 480, 76, function (cx, cy) { return cdBars(cx, cy - 12, 1.5, 4, P.good); },
      "four bars on the phone", "tick", popIn(t, cBars == null ? null : cBars + 0.3, 0.4), on(t, cBars, 0.45));
    out += cdSignRow(60, 300, 480, 76, function (cx, cy) { return cdRouter(cx, cy, 0.42, 1, P.good); },
      "the router's light is green", "tick", popIn(t, cGreen == null ? null : cGreen + 0.3, 0.4), on(t, cGreen, 0.45));

    /* empty bars with a slash through them, rather than a ringed cross: the
       ring covered the bars, so the icon said nothing about BARS */
    out += cdSignRow(608, 140, 480, 62, function (cx, cy) {
      return cdBars(cx, cy - 10, 1.5, 0) + L(cx - 22, cy + 8, cx + 22, cy - 22, P.bad, 5);
    },
      "no bars at all", "cross", popIn(t, cNo == null ? null : cNo + 0.3, 0.4), on(t, cNo, 0.45));
    out += cdSignRow(608, 212, 480, 62, "✈️", "aeroplane mode is on", "cross",
      popIn(t, cAir == null ? null : cAir + 0.3, 0.4), on(t, cAir, 0.45));
    out += cdSignRow(608, 284, 480, 62, function (cx, cy) { return cdRouter(cx, cy, 0.34, 1, null); },
      "the router is dark", "cross", popIn(t, cDark == null ? null : cDark + 0.3, 0.4), on(t, cDark, 0.45));
    out += cdSignRow(608, 356, 480, 62, "⏳", "a page that never loads", "cross",
      popIn(t, cSpin == null ? null : cSpin + 0.3, 0.4), on(t, cSpin, 0.45));
    out += MK.pill(868, 26, "no network", on(t, cNone, 0.45), { size: 22, col: P.bad, ink: P.bad });
    return out;
  }

  /* the lesson's offline test: its own tablet, the network off, and the six apps */
  var CD_STOPS = [["\u{1F992}", "look up giraffe facts"], ["\u{1F4E4}", "send your drawing"], ["\u{1F4F2}", "get a new app"]];
  var CD_GOES = [["\u{1F9EE}", "the calculator"], ["⏰", "an alarm"], ["\u{1F4D6}", "a book on the tablet"]];
  function cdOffline(scene, t) {
    var cStop = sc(scene, 4, "stop"), cCarry = sc(scene, 4, "carry");
    /* the kit's own tablet, drawn plain: nothing here NAMES a part of it, and a
       gold ring is the lesson's mark for the part a child has just found */
    var out = ART.place(ART.figure("tablet"), 60, 52, 225, 327);
    out += Tx(172, 406, "the tablet", "lab mid muted", "middle");
    /* the network switched off, said in words as well as in bars: the crossed
       bars alone were smaller than anything else on the frame */
    out += cdBars(86, 34, 1.4, 0) + L(64, 42, 108, 14, P.bad, 5);
    out += MK.pill(242, 30, "network off", 1, { size: 23, col: P.bad, ink: P.bad });

    out += cdHeader(540, 74, "\u{1F4F4}", "Stops", P.bad, 1);
    out += cdHeader(940, 74, "✅", "Carries on", P.good, 1);
    var ns = tally(t, cStop, 3, 0.8), ng = tally(t, cCarry, 3, 0.8);
    CD_STOPS.forEach(function (r, k) {
      out += cdSignRow(350, 168 + k * 88, 380, 74, r[0], r[1], "cross",
        popIn(t, cStop == null ? null : cStop + 0.2 + k * 0.28, 0.4), k < ns ? 1 : 0);
    });
    CD_GOES.forEach(function (r, k) {
      out += cdSignRow(750, 168 + k * 88, 380, 74, r[0], r[1], "tick",
        popIn(t, cCarry == null ? null : cCarry + 0.2 + k * 0.28, 0.4), k < ng ? 1 : 0);
    });
    return out;
  }

  function cdSignalChapter(scene, beat, t, i) {
    var u = into(t, scene.first + 4), out = "";
    if (u < 1) out += G(cdSignalBoard(scene, t), { opacity: 1 - u });
    if (u > 0) out += G(cdOffline(scene, t), { opacity: u });
    return svg(out);
  }

  /* ==== chapter: sharing on a network =============================================
     One message leaving one device, and the three places the lesson says it can
     reach: a friend, the whole class group, and anyone at all. Each place lights
     as it is named, and the message arrives in it. */
  var CD_SEND = [195, 238];
  var CD_ZONE = [
    { y: 36, h: 112, label: "your friend" },
    { y: 158, h: 128, label: "the class group" },
    { y: 296, h: 116, label: "anyone, anywhere" }
  ];
  function cdZone(k, o, lit) {
    var z = CD_ZONE[k];
    if (!(o > 0)) return "";
    return G(R(390, z.y, 738, z.h, 22, lit > 0.4 ? "#1B3A52" : P.card, lit > 0.4 ? P.plum : P.line,
      lit > 0.4 ? 3 : 2, lit > 0.4 ? null : { "stroke-dasharray": "11 9" }) +
      Tx(414, z.y + 30, z.label, "lab mid", "start", { fill: lit > 0.4 ? P.plum : P.muted }),
      { opacity: clamp(Math.min(1, o), 0, 1) });
  }

  function cdSharingChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cDev = c(0, "devices"), cShare = c(0, "share");
    var cSend = c(1, "send"), cSeen = c(1, "seen");
    var cGroup = c(2, "classgroup"), cWhole = c(2, "whole"), cThink = c(2, "think");
    var cPosted = c(3, "posted"), cStrange = c(3, "strangers");
    var out = "", base = on(t, cDev, 0.5);

    /* the device the message leaves */
    out += cdRouter(CD_SEND[0], 96, 0.8, base);
    out += cdWire([[CD_SEND[0], 140], [CD_SEND[0], 172]], base, P.gold, 5);
    out += cdPhone(CD_SEND[0], CD_SEND[1], 190, base, 4, false);
    out += Tx(CD_SEND[0], 356, "your device", "lab mid muted", "middle", { opacity: clamp(base, 0, 1) });
    out += MK.pop(R(CD_SEND[0] - 48, 212, 96, 66, 12, P.paper, P.muted, 2) + Em(CD_SEND[0], 246, 44, "✉️"),
      CD_SEND[0], 245, popIn(t, cShare, 0.45));

    var lit = [on(t, cSeen, 0.45) * (1 - on(t, cGroup, 0.45)), on(t, cGroup, 0.45) * (1 - on(t, cPosted, 0.45)), on(t, cPosted, 0.45)];
    for (var k = 0; k < 3; k++) out += cdZone(k, base, lit[k]);

    /* one friend */
    var f = popIn(t, cSend, 0.45);
    out += MK.arrow(300, 210, 380, 104, on(t, cSend, 0.5), P.plum, 7);
    if (f > 0) {
      out += MK.pop(Em(620, 96, 54, "\u{1F9D2}"), 620, 96, f);
      out += MK.pop(Em(690, 88, 34, "✉️"), 690, 88, popIn(t, cSeen, 0.4));
      out += MK.pop(Em(744, 92, 34, "\u{1F440}"), 744, 92, popIn(t, cSeen == null ? null : cSeen + 0.3, 0.4));
    }
    /* the whole class group */
    out += MK.arrow(300, 238, 380, 226, on(t, cGroup, 0.5), P.plum, 7);
    var n = tally(t, cGroup, 8, 0.9);
    for (var j = 0; j < 8; j++) {
      if (j >= n) break;
      var cx = 470 + j * 78;
      out += MK.pop(Em(cx, 226, 44, "\u{1F9D2}"), cx, 226, popIn(t, cGroup == null ? null : cGroup + j * 0.11, 0.35));
      out += MK.pop(Em(cx + 20, 258, 26, "✉️"), cx + 20, 258, popIn(t, cWhole == null ? null : cWhole + j * 0.07, 0.35));
    }
    out += MK.pill(CD_SEND[0], 400, "Who will see it?", on(t, cThink, 0.45), { size: 24, col: P.gold, ink: P.gold });
    /* anyone at all */
    out += MK.arrow(300, 268, 380, 354, on(t, cPosted, 0.5), P.plum, 7);
    var g = popIn(t, cPosted, 0.45);
    if (g > 0) {
      out += cdGlobe(614, 366, 40, g);
      for (var s = 0; s < 3; s++) {
        var sx = 748 + s * 92;
        out += MK.pop(Em(sx, 366, 48, "\u{1F9D1}"), sx, 366, popIn(t, cStrange == null ? null : cStrange + s * 0.14, 0.35));
        out += MK.pop(Tx(sx + 25, 340, "?", "lab big bad", "middle"), sx + 25, 340, popIn(t, cStrange == null ? null : cStrange + s * 0.14 + 0.2, 0.35));
      }
      out += MK.pop(Em(1050, 366, 48, "⚠️"), 1050, 366, popIn(t, cStrange == null ? null : cStrange + 0.5, 0.4));
    }
    return svg(out);
  }
