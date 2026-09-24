  /* ==== Clients, Servers and the Web, part 2: the five servers, and the
     internet against the web ==================================================
     tools/lib/film-scenes/computing-g4/clients-servers-and-the-web-2.js.
     See the header of clients-servers-and-the-web.js.

     THE INTERNET CHAPTER DRAWS ITS OWN GLOBE, and that is a judgement rather
     than a preference. The kit has one picture for this idea,
     ART.scene("internet", 2), and its caption - "Many computers, joined around
     the world: the internet" - is far wider than its 320-unit viewBox, so the
     nested drawing clips it at BOTH ends: the frame showed the half-sentence
     "computers, joined around the world: the int" under the picture, for the
     twelve seconds the chapter opens on. That is the known fault in the
     lesson's own art (it clips the same way on the lesson page); it is not
     mine to fix and not mine to paper over, so the drawing is not used here.
     Nothing in the kit is altered or post-processed.

     What replaces it says only what the lesson says: "Millions of networks
     joined together by cables ... with routers passing data between them".
     Each cluster is one small network - a router with its own devices - and
     the gold lines between the clusters are the joins, which is the lesson's
     "network of networks" drawn rather than asserted. */

  /* ==== chapter: five kinds of server =============================================
     One server, then the five the lesson's lecture names, each with its own
     job, and the one idea they share: wait to be asked, then answer. */
  var CSW_FIVE = [
    { pic: CSW_PIC.folder, name: "file", job: "keeps the files" },
    { pic: CSW_PIC.app, name: "application", job: "runs programs" },
    { pic: CSW_PIC.web, name: "web", job: "holds web pages" },
    { pic: CSW_PIC.printer, name: "print", job: "queues printing" },
    { pic: CSW_PIC.mail, name: "mail", job: "passes messages" }
  ];
  var CSW_FCARD = { x0: 44, w: 200, gap: 20, y: 74, h: 290 };
  function cswFiveX(k) { return CSW_FCARD.x0 + k * (CSW_FCARD.w + CSW_FCARD.gap); }

  /* the one server, before it becomes five */
  function cswServersOne(scene, t) {
    var cJob = sc(scene, 0, "job");
    var out = cswServer(434, 62, 300, 310, { o: 1, stored: 1, col: P.teal });
    out += MK.pill(584, 412, "its job is to serve other computers", on(t, cJob, 0.5),
      { size: 24, col: P.teal, ink: P.teal });
    return out;
  }

  function cswServersFive(scene, t) {
    var cSev = sc(scene, 1, "several"), cOwn = sc(scene, 1, "own");
    var at = [sc(scene, 2, "file"), sc(scene, 2, "app"), sc(scene, 3, "web"), sc(scene, 3, "print"), sc(scene, 4, "mail")];
    var cFive = sc(scene, 4, "five"), cAns = sc(scene, 4, "answer");
    var out = "", slots = tally(t, cSev, 5, 0.9);

    CSW_FIVE.forEach(function (s, k) {
      var x = cswFiveX(k), cx = x + CSW_FCARD.w / 2, y = CSW_FCARD.y, h = CSW_FCARD.h;
      var slotO = k < slots ? 1 : 0, p = popIn(t, at[k], 0.42), lit = p > 0;
      if (!slotO && !lit) return;
      var col = lit ? P.accent : P.line;
      out += G(R(x, y, CSW_FCARD.w, h, 22, lit ? "#3A2A28" : P.card, col, lit ? 3.5 : 2) +
        MK.pic(cx, y + 74, 62, s.pic) +
        Tx(cx, y + 152, s.name, "lab big", "middle") +
        Tx(cx, y + 190, "server", "lab big", "middle", { fill: P.muted }) +
        Tx(cx, y + 232, s.job, "lab mid muted readable", "middle", { "font-size": 19 }),
        { opacity: 0.34 + 0.66 * Math.min(1, p) + (lit ? 0 : 0), transform: around(cx, y + h / 2, lit ? 0.97 + 0.03 * Math.min(p, 1.06) : 0.97) });
      /* every one of them waits to be asked, then answers */
      out += MK.tick(cx, y + h - 24, 20, popIn(t, cFive == null ? null : cFive + k * 0.13, 0.34));
    });
    out += MK.pill(584, 34, "each one has its own job", on(t, cOwn, 0.45), { size: 24, col: P.accent, ink: P.accent });
    out += MK.pill(584, 406, "all five wait to be asked, then answer", on(t, cAns, 0.45),
      { size: 24, col: P.good, ink: P.good });
    return out;
  }

  function cswServersChapter(scene, beat, t, i) {
    var u = into(t, scene.first + 1), out = "";
    if (u < 1) out += G(cswServersOne(scene, t), { opacity: 1 - u });
    if (u > 0) out += G(cswServersFive(scene, t), { opacity: u });
    return svg(out);
  }

  /* ==== chapter: the internet and the web =========================================
     Three views: the internet itself (the kit's own drawing, and the three
     things the lesson says it is made of), the web in a browser, and the
     lesson's roads-and-traffic picture of the two together. */
  var CSW_GLOBE = { cx: 296, cy: 220, r: 134 };
  /* six little networks, at fixed angles on the globe: no Math.random anywhere */
  var CSW_CLUSTER = [-90, -30, 30, 90, 150, 210].map(function (deg) {
    var a = deg * Math.PI / 180;
    return [CSW_GLOBE.cx + 104 * Math.cos(a), CSW_GLOBE.cy + 104 * Math.sin(a)];
  });
  /* which network is joined to which, once they are all there */
  var CSW_JOIN = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [0, 3], [1, 4], [2, 5]];
  var CSW_LEAF = [20, 140, 260];

  /* one small network: a router, and the devices that join it */
  function cswCluster(cx, cy, o) {
    if (!(o > 0)) return "";
    var out = "";
    CSW_LEAF.forEach(function (deg) {
      var a = deg * Math.PI / 180, lx = cx + 23 * Math.cos(a), ly = cy + 23 * Math.sin(a);
      out += L(cx, cy, lx, ly, P.gold, 2, { opacity: 0.8 }) + C(lx, ly, 5.5, "#BFD9EE");
    });
    return G(out + C(cx, cy, 10, P.gold, "#7A5E13", 2), { opacity: clamp(o, 0, 1),
      transform: around(cx, cy, Math.min(1.08, clamp(o, 0, 1.08))) });
  }

  /* the world the networks sit on: the lesson's "joined around the world" */
  function cswGlobe(o) {
    if (!(o > 0)) return "";
    var g = CSW_GLOBE;
    var body = C(g.cx, g.cy, g.r, "#2C5F92", "#5E8FBC", 3) +
      E(g.cx, g.cy, g.r * 0.42, g.r, "none", "#7FB0D6", 1.6, { opacity: 0.45 }) +
      L(g.cx - g.r, g.cy, g.cx + g.r, g.cy, "#7FB0D6", 1.6, { opacity: 0.45 }) +
      Pth("M232 164 q42 -28 70 2 q-18 38 -56 36z", "#4CB65C", null, null, { opacity: 0.78 }) +
      Pth("M330 240 q38 -12 48 26 q-36 24 -48 -24z", "#4CB65C", null, null, { opacity: 0.78 }) +
      Pth("M240 256 q32 4 26 42 q-34 8 -28 -42z", "#4CB65C", null, null, { opacity: 0.78 });
    return G(body, { opacity: clamp(o, 0, 1) });
  }

  /* where a line from the globe to (tx, ty) leaves the globe's edge */
  function cswRim(tx, ty) {
    var g = CSW_GLOBE, dx = tx - g.cx, dy = ty - g.cy, len = Math.hypot(dx, dy) || 1;
    return [g.cx + dx / len * (g.r + 8), g.cy + dy / len * (g.r + 8)];
  }

  var CSW_NITEM = { x: 560, w: 566, h: 92, ys: [64, 178, 292] };
  var CSW_NITEMS = [
    { pic: CSW_PIC.sea, word: "cables under the sea" },
    { pic: CSW_PIC.router, word: "routers passing data" },
    { pic: CSW_PIC.server, word: "servers" }
  ];

  function cswNetView(scene, t) {
    var cInt = sc(scene, 0, "internet"), cNets = sc(scene, 0, "networks"), cMil = sc(scene, 0, "millions");
    var at = [sc(scene, 1, "cables"), sc(scene, 1, "routers"), sc(scene, 1, "servers")];
    var out = "", o = on(t, cInt, 0.6);

    out += cswGlobe(o);
    /* the networks arrive as they are named, then the joins between them draw */
    var shown = tally(t, cNets, CSW_CLUSTER.length, 1.0);
    var jw = on(t, cMil, 1.3);
    CSW_JOIN.forEach(function (j, k) {
      if (j[0] >= shown || j[1] >= shown) return;
      var a = CSW_CLUSTER[j[0]], b = CSW_CLUSTER[j[1]];
      var u = clamp(jw * CSW_JOIN.length - k, 0, 1);
      if (!(u > 0)) return;
      out += L(a[0], a[1], lerp(a[0], b[0], u), lerp(a[1], b[1], u), P.gold, 2.5, { opacity: 0.85 });
    });
    CSW_CLUSTER.forEach(function (c, k) {
      out += cswCluster(c[0], c[1], clamp(shown - k, 0, 1) * popIn(t, cNets == null ? null : cNets + k * 0.16, 0.4));
    });
    out += MK.pill(296, 28, "the internet: the network of networks", on(t, cNets, 0.5),
      { size: 23, col: P.blue, ink: P.blue });
    out += MK.pill(296, 414, "millions of networks, joined", on(t, cMil, 0.5),
      { size: 22, col: P.blue, ink: P.blue });

    CSW_NITEMS.forEach(function (it, k) {
      var p = popIn(t, at[k], 0.42), y = CSW_NITEM.ys[k];
      if (!(p > 0)) return;
      var rim = cswRim(CSW_NITEM.x - 10, y + CSW_NITEM.h / 2);
      out += MK.leader(rim[0], rim[1], CSW_NITEM.x - 10, y + CSW_NITEM.h / 2,
        on(t, at[k], 0.45), P.blue);
      out += G(R(CSW_NITEM.x, y, CSW_NITEM.w, CSW_NITEM.h, 22, "#16324A", P.blue, 3) +
        MK.pic(CSW_NITEM.x + 54, y + CSW_NITEM.h / 2, 50, it.pic) +
        Tx(CSW_NITEM.x + 104, y + CSW_NITEM.h / 2 + 10, it.word, "lab big", "start"),
        { transform: around(CSW_NITEM.x + CSW_NITEM.w / 2, y + CSW_NITEM.h / 2, Math.min(1.05, p)), opacity: Math.min(1, p) });
    });
    return out;
  }

  /* the web: pages, linked to each other, read in a browser */
  var CSW_WPAGE = { y: 126, w: 204, h: 196, xs: [244, 484, 724] };
  var CSW_WLINK = ["lions", "big cats", "grasslands"];
  function cswWebView(scene, t) {
    var cWeb = sc(scene, 2, "web"), cPages = sc(scene, 2, "pages"),
      cLinked = sc(scene, 2, "linked"), cBrow = sc(scene, 2, "browser");
    var out = "", shown = tally(t, cPages, 3, 0.8), inner = "";

    CSW_WPAGE.xs.forEach(function (x, k) {
      var o = clamp(shown - k, 0, 1) * popIn(t, cPages == null ? null : cPages + k * 0.26, 0.4);
      inner += cswPage(x, CSW_WPAGE.y, CSW_WPAGE.w, CSW_WPAGE.h,
        { o: o, lit: true, pic: k === 0 ? CSW_PIC.lion : CSW_PIC.web, link: CSW_WLINK[k] });
    });
    /* the links that make it a web */
    [0, 1].forEach(function (k) {
      var x1 = CSW_WPAGE.xs[k] + CSW_WPAGE.w, x2 = CSW_WPAGE.xs[k + 1];
      var u = on(t, cLinked == null ? null : cLinked + k * 0.3, 0.45);
      inner += MK.arrow(x1 + 4, CSW_WPAGE.y + CSW_WPAGE.h / 2, x2 - 6, CSW_WPAGE.y + CSW_WPAGE.h / 2, u, P.plum, 6);
      inner += MK.pop(MK.pic((x1 + x2) / 2, CSW_WPAGE.y + CSW_WPAGE.h / 2 - 44, 34, CSW_PIC.link),
        (x1 + x2) / 2, CSW_WPAGE.y + CSW_WPAGE.h / 2 - 44, popIn(t, cLinked == null ? null : cLinked + k * 0.3, 0.4));
    });
    out += cswBrowser(190, 70, 788, 292, inner, { o: on(t, cWeb, 0.5) });
    /* the pool of light on the address bar: r is kept under its own y, or the
       disc's box reaches above the 1168 x 440 box (--sweep, 2 moments) */
    out += MK.glow(400, 92, 88, P.gold, on(t, cBrow, 0.5) * 0.95);
    out += MK.pill(584, 30, "the World Wide Web: pages and links", on(t, cWeb, 0.5),
      { size: 24, col: P.plum, ink: P.plum });
    out += MK.pill(584, 400, "read in a browser", on(t, cBrow, 0.5), { size: 24, col: P.gold, ink: P.gold });
    return out;
  }

  /* the roads and the traffic on them */
  var CSW_ROAD = { top: 152, bottom: 332, mid: 242 };
  var CSW_TRAF = [
    { pic: CSW_PIC.mail, word: "email" },
    { pic: CSW_PIC.call, word: "a video call" },
    { pic: CSW_PIC.game, word: "a game" }
  ];
  function cswVan(x, y, pic, word, o, col) {
    if (!(o > 0)) return "";
    var w = 168, h = 82;
    return G(R(x - w / 2, y - h / 2, w, h, 16, P.cell, col || P.line, 3) +
      MK.pic(x - 40, y, 44, pic) +
      Tx(x - 12, y + 9, word, "lab mid", "start"),
      { transform: around(x, y, Math.min(1.05, clamp(o, 0, 1.08))), opacity: Math.min(1, o) });
  }
  function cswRoadView(scene, t) {
    var cRoads = sc(scene, 3, "roads"), cTraf = sc(scene, 3, "traffic");
    var cEmail = sc(scene, 4, "email"), cNot = sc(scene, 4, "not"), cUses = sc(scene, 4, "uses");
    var out = "", u = on(t, cRoads, 0.8);

    if (u > 0) {
      var w = 1168 * u;
      out += R(0, CSW_ROAD.top, w, CSW_ROAD.bottom - CSW_ROAD.top, 0, "#2F3C48") +
        R(0, CSW_ROAD.top, w, 5, 0, P.muted) + R(0, CSW_ROAD.bottom - 5, w, 5, 0, P.muted) +
        L(0, CSW_ROAD.mid, w, CSW_ROAD.mid, "#EAD79A", 5, { "stroke-dasharray": "46 34", opacity: 0.7 });
    }
    /* they all use the roads: the road itself lights under every kind of traffic */
    var lit = bump(t, cUses, 2.2);
    if (lit > 0) out += R(0, CSW_ROAD.top, 1168, CSW_ROAD.bottom - CSW_ROAD.top, 0, P.blue, null, null,
      { opacity: 0.20 * lit }) +
      R(3, CSW_ROAD.top + 3, 1162, CSW_ROAD.bottom - CSW_ROAD.top - 6, 0, "none", P.blue, 4, { opacity: 0.9 * lit });
    out += MK.pill(214, 382, "the internet: the roads", on(t, cRoads, 0.5), { size: 24, col: P.blue, ink: P.blue });

    /* the web is one kind of traffic on them */
    var tu = on(t, cTraf, 1.5);
    if (tu > 0) out += cswVan(lerp(110, 838, tu), 196, CSW_PIC.web, "web pages", 1, P.plum);
    out += MK.pill(944, 102, "the web: traffic", on(t, cTraf, 0.5), { size: 23, col: P.plum, ink: P.plum });

    /* email, calls and games use the roads too, and are not the web */
    CSW_TRAF.forEach(function (v, k) {
      var start = cEmail == null ? null : cEmail + k * 0.28;
      var vu = on(t, start, 0.8);
      if (!(vu > 0)) return;
      /* each one slides the last stretch into its own place: driving all three
         in from the left put them on top of one another for a second */
      var x = 190 + k * 270 - 74 * (1 - vu);
      out += cswVan(x, 290, v.pic, v.word, 1, P.muted);
      out += MK.cross(x + 68, 258, 19, popIn(t, cNot == null ? null : cNot + k * 0.2, 0.35));
    });
    out += MK.pill(944, 382, "not the web", on(t, cNot, 0.5), { size: 23, col: P.bad, ink: P.bad });
    return out;
  }

  function cswInternetChapter(scene, beat, t, i) {
    var a = into(t, scene.first + 2), b = into(t, scene.first + 3), out = "";
    if (a < 1) out += G(cswNetView(scene, t), { opacity: 1 - a });
    if (a > 0 && b < 1) out += G(cswWebView(scene, t), { opacity: a * (1 - b) });
    if (b > 0) out += G(cswRoadView(scene, t), { opacity: b });
    return svg(out);
  }
