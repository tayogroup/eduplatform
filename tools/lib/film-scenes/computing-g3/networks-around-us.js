  /* ==== Grade 3 Computing, Lesson 11: Networks Around Us ======================
     tools/lib/film-scenes/computing-g3/networks-around-us.js, with -2.js and
     -3.js: the film's pictures, after the shared marks (MK) and before the
     engine's tail, all in one scope. The storyboard is
     computing/grade-3-app/lecture-video/networks-around-us.json.

     WHAT COMES FROM THE LESSON AND WHAT IS DRAWN HERE. The Computing kit keeps
     its school network inside a closure (buildNetwork), so there is no
     ART.scene for it: the diagram is drawn here, with the lesson's own seven
     pieces, its own wiring (server, printer, laptop and whiteboard on cables;
     the tablet wireless through the access point) and its own words. The
     laptop and the tablet in the services chapter ARE the kit's figures
     (ART.figure), placed with ART.place.

     ART.scene("internet", s) is deliberately not used. Its captions are about
     the internet ("Many computers, joined around the world: the internet"),
     and this lesson's Computing world block is explicit that the World Wide
     Web and the internet are not the same thing - so its caption would
     contradict the beat it would sit under. States 2 and 3 also clip their
     caption, which is a known fault in the lesson's own art.

     The switch, the server, the access point and the smartboard are drawn
     rather than set as emoji: the lesson describes each one exactly ("a box in
     a cupboard with a row of sockets", "a computer with no screen of its
     own"), and Windows draws U+1F5A7 and U+1F5C4 as legacy glyphs that say
     none of that.

     This file: the palette, the hardware drawings every chapter shares, the
     title motif and the chapter "Hardware you can point at". Every top-level
     name here starts with nw. */

  var HUE = {
    title: P.teal, hardware: P.gold, classroom: P.blue, services: P.plum,
    good: P.good, cost: P.accent, recap: P.teal
  };

  /* ---- timing ---------------------------------------------------------------- */

  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function nwFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }
  /* has this cue been reached? (a cue the beat never names is never reached) */
  function nwPast(t, at) { return at != null && t >= at; }
  /* the last of a list of {id, at} whose cue has been said: the one being named */
  function nwNow(t, seq) {
    var id = null;
    for (var k = 0; k < seq.length; k++) if (nwPast(t, seq[k].at)) id = seq[k].id;
    return id;
  }

  /* ---- the seven pieces of hardware, drawn -------------------------------------
     Each is centred on (cx, cy) and sized from w, so the same drawing serves the
     big diagram, the small recap card and the title motif. */

  /* the switch: a box with a row of sockets, and two lights */
  function nwSwitchBox(cx, cy, w, col) {
    var h = w * 0.44, x = cx - w / 2, y = cy - h / 2;
    var out = R(x, y, w, h, h * 0.22, P.cell, col || P.line, 3);
    for (var k = 0; k < 8; k++)
      out += R(x + w * (0.075 + k * 0.106), y + h * 0.54, w * 0.072, h * 0.3, 2, P.ground, P.line, 1.5);
    out += C(x + w * 0.14, y + h * 0.26, h * 0.08, P.good) + C(x + w * 0.26, y + h * 0.26, h * 0.08, P.gold);
    return out;
  }

  /* the server: a tall box of slots with no screen at all */
  function nwServerBox(cx, cy, w, col) {
    var h = w * 1.3, x = cx - w / 2, y = cy - h / 2;
    var out = R(x, y, w, h, w * 0.1, P.cell, col || P.line, 3);
    for (var k = 0; k < 4; k++) {
      var sy = y + h * (0.1 + k * 0.215);
      out += R(x + w * 0.12, sy, w * 0.76, h * 0.135, 3, P.ground, P.line, 1.5) +
        C(x + w * 0.78, sy + h * 0.068, w * 0.045, k === 0 ? P.good : P.line);
    }
    return out;
  }

  /* the access point: a disc under a strip of ceiling */
  function nwApDisc(cx, cy, w, col) {
    return R(cx - w * 0.62, cy - w * 0.4, w * 1.24, w * 0.12, 3, P.line) +
      R(cx - w * 0.06, cy - w * 0.3, w * 0.12, w * 0.14, 2, P.plastic) +
      E(cx, cy + w * 0.02, w * 0.44, w * 0.19, P.plastic, col || P.line, 3) +
      C(cx, cy + w * 0.02, w * 0.07, P.good);
  }

  /* the interactive smartboard: a wide screen on a stand. `ink` 0 -> 1 draws
     the teacher's own writing across it. */
  function nwBoardScreen(cx, cy, w, col, ink) {
    var h = w * 0.66, x = cx - w / 2, y = cy - h / 2;
    var out = R(x, y, w, h, w * 0.04, P.body, col || P.line, 3) + R(x + w * 0.06, y + h * 0.1, w * 0.88, h * 0.7, 4, "#0B1D2C");
    if (ink > 0) {
      var d = "M" + n2(x + w * 0.18) + "," + n2(y + h * 0.5) + " q" + n2(w * 0.1) + "," + n2(-h * 0.26) + " " + n2(w * 0.2) + ",0" +
        " q" + n2(w * 0.1) + "," + n2(h * 0.26) + " " + n2(w * 0.2) + ",0 q" + n2(w * 0.1) + "," + n2(-h * 0.26) + " " + n2(w * 0.2) + ",0";
      var len = w * 0.95;
      out += Pth(d, null, P.teal, Math.max(3, w * 0.035),
        { "stroke-dasharray": n2(len), "stroke-dashoffset": n2(len * (1 - clamp(ink, 0, 1))) });
    }
    out += R(cx - w * 0.035, y + h, w * 0.07, h * 0.2, 2, P.line) + R(cx - w * 0.16, y + h * 1.2, w * 0.32, h * 0.05, 2, P.line);
    return out;
  }

  /* the home router: a small box with two aerials */
  function nwRouterBox(cx, cy, w, col) {
    var h = w * 0.36, x = cx - w / 2, y = cy - h / 2;
    return L(x + w * 0.2, y + h * 0.3, x + w * 0.02, y - h * 1.5, P.plastic, 6) +
      L(x + w * 0.8, y + h * 0.3, x + w * 0.98, y - h * 1.5, P.plastic, 6) +
      R(x, y, w, h, h * 0.3, P.cell, col || P.line, 3) +
      C(x + w * 0.18, y + h * 0.5, h * 0.13, P.good) + C(x + w * 0.34, y + h * 0.5, h * 0.13, P.gold);
  }

  /* a page of work */
  function nwPage(cx, cy, w, o, col) {
    if (!(o > 0)) return "";
    var h = w * 1.28, x = cx - w / 2, y = cy - h / 2;
    var out = R(x, y, w, h, w * 0.1, P.paper, col || P.line, 2);
    for (var k = 0; k < 3; k++) out += L(x + w * 0.18, y + h * (0.3 + k * 0.2), x + w * 0.82, y + h * (0.3 + k * 0.2), "#B9C8D6", w * 0.07);
    return G(out, { opacity: clamp(o, 0, 1) });
  }

  /* what each piece of hardware looks like, by the lesson's own name for it */
  var NW_ART = {
    "switch": function (cx, cy, s, col) { return nwSwitchBox(cx, cy, s * 1.5, col); },
    server: function (cx, cy, s, col) { return nwServerBox(cx, cy, s * 0.95, col); },
    ap: function (cx, cy, s, col) { return nwApDisc(cx, cy, s * 1.5, col); },
    board: function (cx, cy, s, col) { return nwBoardScreen(cx, cy - s * 0.12, s * 1.6, col, 0); },
    laptop: function (cx, cy, s) { return Em(cx, cy, s, "\u{1F4BB}"); },
    tablet: function (cx, cy, s) { return Em(cx, cy, s, "\u{1F4F1}"); },
    printer: function (cx, cy, s) { return Em(cx, cy, s, "\u{1F5A8}️"); }
  };

  /* One piece of hardware in a card, with the lesson's own label under it.
     state: "now" (being named, gold), "named" (said already), "" (waiting). */
  function nwCard(x, y, w, h, id, label, o, state) {
    if (!(o > 0)) return "";
    var col = state === "now" ? P.gold : P.line, sw = state === "now" ? 3.5 : 2;
    var fill = state === "now" ? "#1B3A52" : P.card;
    var body = R(x, y, w, h, 18, fill, col, sw) +
      NW_ART[id](x + w / 2, y + h * 0.38, h * 0.44, state === "now" ? P.gold : null) +
      Tx(x + w / 2, y + h - 14, label, "lab" + (state ? "" : " muted"), "middle", { "font-size": 22 });
    return G(body, { opacity: clamp(o, 0, 1) * (state ? 1 : 0.62), transform: around(x + w / 2, y + h / 2, Math.min(1.06, o)) });
  }

  /* a cable that draws itself from a to b as u goes 0 -> 1 */
  function nwCable(a, b, u, col, wide) {
    if (!(u > 0)) return "";
    var c = cable(a[0], a[1], b[0], b[1]);
    var len = (Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1])) * 1.3 + 30;
    return Pth(c.d, null, col || P.line, wide || 5,
      { "stroke-dasharray": n2(len), "stroke-dashoffset": n2(len * (1 - clamp(u, 0, 1))) });
  }
  /* a wireless join: the same curve, drawn as dots */
  function nwWireless(a, b, u) {
    if (!(u > 0)) return "";
    return Pth(cable(a[0], a[1], b[0], b[1]).d, null, P.blue, 5,
      { "stroke-dasharray": "1 18", opacity: clamp(u, 0, 1) });
  }

  /* ==== the title ===============================================================
     The whole film in one picture: six pieces of hardware, every cable running
     in to one box in the middle, and a ring round the lot. In the spoken title
     chapter the cables draw on "Every cable", the box lands where they meet on
     "one box in a cupboard", its name arrives on "a switch" and the ring closes
     on "one network". On the two cards it simply stands. */
  var NW_MOTIF = [
    { id: "server", x: 66, y: 96 }, { id: "printer", x: 294, y: 96 },
    { id: "board", x: 40, y: 190 }, { id: "ap", x: 320, y: 190 },
    { id: "laptop", x: 78, y: 286 }, { id: "tablet", x: 286, y: 286 }
  ];
  function titleMotif(o) {
    var t = o.t || 0, sn = o.scene, out = "";
    var cCable = sn ? sc(sn, 0, "cable") : null, cBox = sn ? sc(sn, 0, "box") : null;
    var cSwitch = sn ? sc(sn, 1, "switch") : null, cNet = sn ? sc(sn, 1, "network") : null;
    var pieces = sn ? on(t, cCable, 0.5) : 1;
    var wires = sn ? on(t, cCable == null ? null : cCable + 0.25, 0.9) : 1;
    var box = sn ? popIn(t, cBox, 0.45) : 1;
    var namd = sn ? on(t, cSwitch, 0.45) : 1;
    var ring = sn ? on(t, cNet, 0.8) : 1;

    out += C(180, 190, 168, P.card, null, null, { opacity: 0.55 });
    NW_MOTIF.forEach(function (m, k) {
      out += nwCable([m.x, m.y], [180, 190], clamp(wires * 1.25 - k * 0.04, 0, 1), k === 3 ? P.blue : P.line, 4);
    });
    NW_MOTIF.forEach(function (m) {
      out += G(NW_ART[m.id](m.x, m.y, 46), { opacity: clamp(pieces, 0, 1) });
    });
    if (box > 0) out += G(nwSwitchBox(180, 190, 138, namd > 0.5 ? P.gold : P.line), { transform: around(180, 190, Math.min(1.08, box)) });
    if (ring > 0) out += C(180, 190, 176, "none", P.teal, 5, { opacity: ring, "stroke-dasharray": n2(2 * Math.PI * 176), "stroke-dashoffset": n2(2 * Math.PI * 176 * (1 - ring)) });
    return '<svg viewBox="0 0 360 360" role="img" aria-label="Six pieces of hardware, every cable running in to one switch">' + out + "</svg>";
  }

  /* ==== chapter: hardware you can point at =======================================
     The school network, the lesson's own seven pieces. They arrive as the first
     line is said, the cables run in to the switch as the second is, and then one
     piece at a time is named and lit while the rest stay quiet. The last beat
     leaves school: the same box, at home, called a router. */
  var NW_CARD = { w: 196, h: 104 };
  var NW_SW_CARD = { x: 459, y: 166, w: 250, h: 112 };
  var NW_NODES = [
    { id: "ap", cx: 584, cy: 66, label: "access point", edge: [584, 118], wired: true },
    { id: "server", cx: 180, cy: 140, label: "server", edge: [278, 140], hub: [459, 202], wired: true },
    { id: "printer", cx: 988, cy: 140, label: "printer", edge: [890, 140], hub: [709, 202], wired: true },
    { id: "laptop", cx: 180, cy: 374, label: "laptop", edge: [278, 374], hub: [459, 250], wired: true },
    { id: "board", cx: 584, cy: 380, label: "whiteboard", edge: [584, 328], wired: true },
    { id: "tablet", cx: 988, cy: 374, label: "tablet", edge: [900, 330], wired: false }
  ];

  function nwHardwareDiagram(scene, t) {
    var cHW = sc(scene, 0, "hardware");
    var cSwitch = sc(scene, 1, "switch"), cCables = sc(scene, 1, "cables");
    var cServer = sc(scene, 2, "server"), cFiles = sc(scene, 2, "files");
    var cAp = sc(scene, 3, "ap"), cWifi = sc(scene, 3, "wifi");
    var cLaptop = sc(scene, 4, "laptop"), cTablet = sc(scene, 4, "tablet"),
      cPrinter = sc(scene, 4, "printer"), cBoard = sc(scene, 4, "board");
    var seq = [
      { id: "switch", at: cSwitch }, { id: "server", at: cServer }, { id: "ap", at: cAp },
      { id: "laptop", at: cLaptop }, { id: "tablet", at: cTablet },
      { id: "printer", at: cPrinter }, { id: "board", at: cBoard }
    ];
    var now = nwNow(t, seq), said = {};
    seq.forEach(function (s) { if (nwPast(t, s.at)) said[s.id] = 1; });
    var state = function (id) { return now === id ? "now" : said[id] ? "named" : ""; };
    var out = "";

    /* the cables, drawn in to the switch as "every cable in the building" is said */
    var wire = on(t, cCables, 1.1);
    NW_NODES.forEach(function (nd, k) {
      var hub = nd.hub || [nd.edge[0], nd.edge[1] < NW_SW_CARD.y ? NW_SW_CARD.y : NW_SW_CARD.y + NW_SW_CARD.h];
      var u = clamp(wire * 1.3 - k * 0.05, 0, 1);
      if (nd.wired) out += nwCable(nd.edge, hub, u, state(nd.id) === "now" ? P.gold : P.line, 5);
    });
    /* the tablet has no cable: it joins the access point, and only once the
       access point has been named */
    out += nwWireless([890, 350], [682, 92], on(t, cTablet, 0.6));

    /* the switch, and the six pieces around it */
    out += G(R(NW_SW_CARD.x, NW_SW_CARD.y, NW_SW_CARD.w, NW_SW_CARD.h, 18,
      state("switch") === "now" ? "#1B3A52" : P.card, state("switch") === "now" ? P.gold : P.line, state("switch") === "now" ? 3.5 : 2) +
      nwSwitchBox(584, 206, 168, state("switch") === "now" ? P.gold : P.line) +
      Tx(584, 264, "switch", "lab" + (state("switch") ? "" : " muted"), "middle", { "font-size": 24 }),
      { opacity: popIn(t, cHW, 0.4) * (state("switch") ? 1 : 0.62) });
    NW_NODES.forEach(function (nd, k) {
      out += nwCard(nd.cx - NW_CARD.w / 2, nd.cy - NW_CARD.h / 2, NW_CARD.w, NW_CARD.h, nd.id, nd.label,
        popIn(t, cHW == null ? null : cHW + 0.18 + k * 0.16, 0.4), state(nd.id));
    });

    /* everyone's files, on the server */
    var fl = tally(t, cFiles, 3, 0.7);
    for (var f = 0; f < fl; f++) out += nwPage(128 + f * 52, 52, 36, popIn(t, cFiles == null ? null : cFiles + f * 0.24, 0.35), P.gold);

    /* the wi-fi, coming down from the access point, and staying while the
       tablet joins through it */
    out += MK.waves(584, 118, t, cWifi, { dir: Math.PI / 2, spread: 1.5, n: 3, reach: 110, col: P.blue,
      until: scene.beats.length > 4 ? spokenEnd(scene.first + 4) : null });
    return out;
  }

  /* the last beat: the same box, at home, doing the same job */
  function nwHome(scene, t) {
    var cHome = sc(scene, 5, "home"), cRouter = sc(scene, 5, "router"), cJob = sc(scene, 5, "job");
    var house = on(t, cHome, 0.6), rt = popIn(t, cRouter, 0.45), jb = on(t, cJob, 0.5);
    var out = "";

    /* at school: the switch, still there */
    out += G(nwSwitchBox(230, 208, 230, P.line) + MK.pill(230, 322, "at school", 1, { size: 25, col: P.line }), { opacity: 1 });

    /* at home: the house, the router, and what joins to it */
    if (house > 0) {
      var h = "";
      h += Pth("M556,180 L856,64 L1156,180 Z", P.cell, P.line, 3);
      h += R(596, 174, 520, 246, 12, P.card, P.line, 3);
      h += MK.pill(856, 126, "at home", house, { size: 25, col: P.line });
      h += nwCable([856, 276], [742, 340], rt, P.line, 5);
      h += nwWireless([884, 276], [990, 340], rt);
      h += Em(742, 368, 58, "\u{1F4BB}");
      h += Em(990, 368, 58, "\u{1F4F1}");
      h += G(nwRouterBox(856, 250, 150, jb > 0.3 ? P.gold : P.line), { transform: around(856, 250, Math.min(1.08, rt)), opacity: Math.min(1, rt) });
      out += G(h, { opacity: house });
    }
    /* the same job: an equals between the two, and a tick */
    out += G(R(408, 192, 64, 14, 7, P.gold) + R(408, 222, 64, 14, 7, P.gold), { opacity: jb });
    out += MK.tick(440, 300, 28, popIn(t, cJob == null ? null : cJob + 0.4, 0.4));
    return out;
  }

  function nwHardwareChapter(scene, beat, t, i) {
    var u = into(t, scene.first + 5), out = "";
    if (u < 1) out += G(nwHardwareDiagram(scene, t), { opacity: 1 - u });
    if (u > 0) out += G(nwHome(scene, t), { opacity: u });
    return svg(out);
  }
