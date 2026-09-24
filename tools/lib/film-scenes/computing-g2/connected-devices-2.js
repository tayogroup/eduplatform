  /* ==== Connected Devices, part 2: working together, and wired or wireless =====
     tools/lib/film-scenes/computing-g2/connected-devices-2.js. See the header of
     connected-devices.js.

     Both chapters are drawn here rather than lifted: the lesson's home network
     and its wired/wireless sort live inside closures the film cannot reach, so
     the devices, the examples and the words are the lesson's and the picture is
     the engine's. */

  /* a cable or a wire that draws itself along a path */
  function cdWire(pts, u, col, w, extra) {
    if (!(u > 0)) return "";
    var d = "M" + pts.map(function (p) { return n2(p[0]) + "," + n2(p[1]); }).join(" L");
    var len = polyLen(pts);
    return Pth(d, null, col || P.gold, w || 6, Object.assign({
      "stroke-dasharray": n2(len), "stroke-dashoffset": n2(len * (1 - clamp(u, 0, 1)))
    }, extra || {}));
  }

  /* ==== chapter: working together =================================================
     The lesson's own pair: a phone that cannot print beside a printer that
     cannot take a photo, joined through the router so the photo can cross. The
     last beat is the lesson's second pair, the song and the smart speaker. */
  var CD_L = { x: 66, y: 118, w: 286, h: 244, cx: 209, cy: 240 };
  var CD_R = { x: 816, y: 118, w: 286, h: 244, cx: 959, cy: 240 };
  var CD_HUB = [584, 240];

  /* one side of the pair: a big device on a card */
  function cdPairCard(box, id, o, col) {
    if (!(o > 0)) return "";
    return G(R(box.x, box.y, box.w, box.h, 26, P.card, col || P.line, col ? 4 : 2) +
      Em(box.cx, box.cy - 14, 126, CD_DEV[id].pic) +
      Tx(box.cx, box.y + box.h - 26, CD_DEV[id].label, "lab big", "middle"),
      { transform: around(box.cx, box.cy, Math.min(1.05, o)), opacity: clamp(Math.min(1, o), 0, 1) });
  }
  /* the two cables to the router, and the router itself */
  function cdPairLink(u, o) {
    var out = "";
    out += cdWire([[CD_L.x + CD_L.w, CD_HUB[1]], [CD_HUB[0] - 66, CD_HUB[1]]], u, P.gold, 6);
    out += cdWire([[CD_R.x, CD_HUB[1]], [CD_HUB[0] + 66, CD_HUB[1]]], u, P.gold, 6);
    out += cdRouter(CD_HUB[0], CD_HUB[1], 1, o);
    out += Tx(CD_HUB[0], CD_HUB[1] + 78, "router", "lab mid gold", "middle", { opacity: clamp(Math.min(1, o), 0, 1) });
    return out;
  }

  var CD_FLY = [[CD_L.cx, 74], [CD_HUB[0], 104], [CD_R.cx, 74]];
  function cdTogetherPhoto(scene, t) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cPhoto = c(0, "photo"), cNoPrint = c(0, "cannot");
    var cPrints = c(1, "prints"), cNoPhoto = c(1, "cannot");
    var cJoin = c(2, "join"), cTravel = c(2, "travel");
    var cSends = c(3, "sends"), cOut = c(3, "prints"), cNeither = c(3, "neither");
    var out = "", won = on(t, cNeither, 0.5), gone = on(t, cJoin, 0.5);

    out += cdPairLink(on(t, cJoin, 0.8), on(t, cJoin, 0.5));
    /* the two cables brighten as the photo is told it can travel */
    var pulse = bump(t, cTravel, 1.3);
    if (pulse > 0.02) {
      out += cdWire([[CD_L.x + CD_L.w, CD_HUB[1]], [CD_HUB[0] - 66, CD_HUB[1]]], 1, P.gold, 16, { opacity: pulse * 0.8 });
      out += cdWire([[CD_R.x, CD_HUB[1]], [CD_HUB[0] + 66, CD_HUB[1]]], 1, P.gold, 16, { opacity: pulse * 0.8 });
    }
    /* the phone is on screen from the chapter's first frame, so nothing is blank
       while the first line begins; the photo is what arrives on its cue */
    out += cdPairCard(CD_L, "phone", 1, won > 0.4 ? P.good : cdHot(t, cPhoto) ? P.gold : null);
    out += cdPairCard(CD_R, "printer", popIn(t, cPrints, 0.45), won > 0.4 ? P.good : cdHot(t, cPrints) ? P.gold : null);

    /* what neither can do on its own, said and then set aside once they join */
    var n1 = popIn(t, cNoPrint, 0.4) * (1 - gone), n2p = popIn(t, cNoPhoto, 0.4) * (1 - gone);
    if (n1 > 0) { out += MK.pop(Em(300, 166, 48, CD_DEV.printer.pic), 300, 166, n1); out += MK.cross(322, 144, 19, n1); }
    if (n2p > 0) { out += MK.pop(Em(868, 166, 48, "\u{1F4F7}"), 868, 166, n2p); out += MK.cross(846, 144, 19, n2p); }

    /* the photo: on the phone, then lifted, then across the network */
    var fly = on(t, cSends, 1.1), lift = on(t, cTravel, 0.55);
    var held = popIn(t, cPhoto, 0.45) * (1 - clamp(fly * 4, 0, 1));
    if (held > 0) out += MK.pop(Em(CD_L.cx, lerp(108, 74, lift), 56, "\u{1F5BC}️"), CD_L.cx, 92, held);
    if (fly > 0 && fly < 1) {
      var p = polyAt(CD_FLY, fly * polyLen(CD_FLY));
      out += Em(p[0], p[1], 56, "\u{1F5BC}️");
    }
    /* the printed photo, out of the printer */
    var done = popIn(t, cOut, 0.45);
    if (done > 0) {
      out += MK.pop(R(CD_R.cx - 46, 42, 92, 66, 8, P.paper, P.muted, 2) + Em(CD_R.cx, 75, 44, "\u{1F5BC}️"), CD_R.cx, 75, done);
      out += MK.tick(CD_R.cx + 74, 54, 22, done);
    }
    out += MK.glow(CD_HUB[0], CD_HUB[1], 190, P.good, won * 0.9);
    out += MK.tick(CD_L.x + 26, CD_L.y + 26, 22, popIn(t, cNeither, 0.4));
    out += MK.tick(CD_R.x + CD_R.w - 26, CD_R.y + 26, 22, popIn(t, cNeither == null ? null : cNeither + 0.25, 0.4));
    return out;
  }

  /* the lesson's second pair: the phone holds the song, the speaker fills the room */
  function cdTogetherSong(scene, t) {
    var cSong = sc(scene, 4, "song"), cLoud = sc(scene, 4, "loud"), cJob = sc(scene, 4, "job");
    var out = "";
    out += cdPairLink(1, 1);
    out += cdPairCard(CD_L, "phone", 1, cdHot(t, cSong) ? P.gold : null);
    out += cdPairCard(CD_R, "speaker", 1, cdHot(t, cLoud) ? P.gold : null);
    out += MK.pop(Em(CD_L.cx, 78, 56, "\u{1F3B5}"), CD_L.cx, 78, popIn(t, cSong, 0.45));
    var fly = on(t, cSong == null ? null : cSong + 0.7, 1.0);
    if (fly > 0 && fly < 1) {
      var p = polyAt(CD_FLY, fly * polyLen(CD_FLY));
      out += Em(p[0], p[1], 50, "\u{1F3B5}");
    }
    out += MK.pop(Em(CD_R.cx, 78, 50, "\u{1F3B5}"), CD_R.cx, 78, popIn(t, cLoud, 0.4));
    out += MK.waves(CD_R.x, CD_R.cy, t, cLoud, { dir: Math.PI, spread: 1.2, reach: 200, col: P.gold, n: 3 });
    out += MK.pill(CD_HUB[0], 404, "Two devices, one job", on(t, cJob, 0.45), { size: 26, col: P.good, ink: P.good });
    return out;
  }

  function cdTogetherChapter(scene, beat, t, i) {
    var u = into(t, scene.first + 4), out = "";
    if (u < 1) out += G(cdTogetherPhoto(scene, t), { opacity: 1 - u });
    if (u > 0) out += G(cdTogetherSong(scene, t), { opacity: u });
    return svg(out);
  }

  /* ==== chapter: wired and wireless ===============================================
     Two panels side by side. On the left the lesson's wired example drawn once
     and used for both of its places: computers on a desk, their cables running
     UNDER the desk and along to a socket on the wall. On the right the same
     devices joined through the air. The panel not being talked about is faded,
     so only one thing is ever being pointed at. */
  var CD_WP = { y: 42, h: 356, w: 530 };
  var CD_WIRED = { x: 40 }, CD_AIR = { x: 598 };
  function cdPanel(x, title, icon, o, col) {
    return G(R(x, CD_WP.y, CD_WP.w, CD_WP.h, 26, P.card, col || P.line, col ? 4 : 2) +
      Em(x + 145, 80, 36, icon) + Tx(x + 185, 92, title, "lab big", "start"),
      { opacity: clamp(Math.min(1, o), 0, 1) });
  }
  function cdChip(cx, cy, icon, text, o, lit) {
    if (!(o > 0)) return "";
    var w = String(text).length * 11.4 + 74, h = 40;
    return G(R(cx - w / 2, cy - h / 2, w, h, 20, lit > 0.5 ? "#1B3A52" : P.cell, lit > 0.5 ? P.gold : P.line, lit > 0.5 ? 3 : 2) +
      Em(cx - w / 2 + 26, cy + 1, 26, icon) +
      Tx(cx - w / 2 + 46, cy + 7, text, "lab mid", "start", { fill: lit > 0.5 ? P.gold : P.ink }),
      { opacity: clamp(Math.min(1, o), 0, 1) });
  }

  var CD_PCS = [200, 320, 440];
  function cdWiredRoom(t, cCab, cWall, cDesk) {
    var out = "", wall = bump(t, cWall, 1.1), desk = bump(t, cDesk, 1.1);
    /* the wall, with the socket plate on it */
    out += R(52, 196, 22, 176, 4, "#1B3A52", wall > 0.05 ? P.gold : P.line, wall > 0.05 ? 4 : 2);
    out += R(72, 306, 42, 62, 6, P.body, wall > 0.05 ? P.gold : P.plastic, wall > 0.05 ? 3 : 2);
    for (var s = 0; s < 3; s++) out += R(80, 314 + s * 14, 26, 8, 2, "#0B1D2C", P.plastic, 1.5);
    /* the cables, drawn before the desk so the desk covers them: under it */
    CD_PCS.forEach(function (cx, k) {
      out += cdWire([[cx, 262], [cx, 320 + k * 14], [114, 320 + k * 14]], on(t, cCab == null ? null : cCab + k * 0.16, 0.6), P.gold, 5);
    });
    out += R(150, 282, 350, 16, 8, "#7A5E3A", desk > 0.05 ? P.gold : "#5A4328", desk > 0.05 ? 4 : 2);
    out += R(164, 298, 12, 74, 3, "#7A5E3A", "#5A4328", 2) + R(474, 298, 12, 74, 3, "#7A5E3A", "#5A4328", 2);
    CD_PCS.forEach(function (cx) { out += Em(cx, 252, 56, CD_DEV.laptop.pic); });
    out += L(52, 374, 540, 374, P.line, 3);
    return out;
  }

  function cdAirRoom(t, cAir, cWifi) {
    var out = "";
    out += cdRouter(863, 232, 0.9, 1);
    out += MK.waves(863, 232, t, cAir, { dir: 2.58, spread: 0.9, reach: 130, col: P.teal, n: 3 });
    out += MK.waves(863, 232, t, cAir, { dir: 0.55, spread: 0.9, reach: 130, col: P.teal, n: 3 });
    out += Em(720, 330, 58, CD_DEV.tablet.pic);
    out += Em(1010, 330, 58, CD_DEV.phone.pic);
    /* the wi-fi badge sits UNDER the router, between the two fans of waves: at
       the top of the panel it landed on the "phones on a train" chip */
    out += MK.pop(Em(863, 302, 44, "\u{1F4F6}"), 863, 302, popIn(t, cWifi, 0.42));
    out += L(640, 374, 1090, 374, P.line, 3);
    return out;
  }

  function cdWiresChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cWired = c(0, "wired"), cCab = c(0, "cables");
    var cOffice = c(1, "office"), cWall = c(1, "wall");
    var cSchool = c(2, "school"), cDesk = c(2, "desks");
    var cAir = c(3, "wireless"), cThrough = c(3, "air"), cWifi = c(3, "wifi");
    var cHome = c(4, "home"), cTrain = c(4, "train"), cBoth = c(4, "both");
    var toAir = on(t, cAir, 0.7), both = on(t, cBoth, 0.5);
    var lw = Math.max(1 - 0.62 * toAir, both), rw = Math.max(0.3 + 0.7 * toAir, both);
    var out = "";

    out += G(cdPanel(CD_WIRED.x, "Wired network", "\u{1F50C}", 1, both > 0.5 ? P.good : toAir < 0.5 ? P.blue : null) +
      cdChip(305, 128, "\u{1F3E2}", "an office", on(t, cWired, 0.5), on(t, cOffice, 0.45) * (1 - on(t, cSchool, 0.45))) +
      cdChip(305, 176, "\u{1F3EB}", "a school computer room", on(t, cWired, 0.5), on(t, cSchool, 0.45) * (1 - toAir)) +
      cdWiredRoom(t, cCab, cWall, cDesk), { opacity: lw });
    out += MK.tick(536, 76, 20, popIn(t, cBoth, 0.4));

    out += G(cdPanel(CD_AIR.x, "Wireless network", "\u{1F4F6}", 1, both > 0.5 ? P.good : toAir >= 0.5 ? P.blue : null) +
      cdChip(863, 128, "\u{1F3E0}", "tablets at home", 1, on(t, cHome, 0.45) * (1 - on(t, cTrain, 0.45))) +
      cdChip(863, 176, "\u{1F686}", "phones on a train", 1, on(t, cTrain, 0.45) * (1 - both)) +
      cdAirRoom(t, cThrough, cWifi), { opacity: rw });
    out += MK.tick(1094, 76, 20, popIn(t, cBoth == null ? null : cBoth + 0.25, 0.4));
    return svg(out);
  }
