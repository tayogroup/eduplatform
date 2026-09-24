  /* ==== Grade 4 Computing, Lesson 10: Clients, Servers and the Web ============
     tools/lib/film-scenes/computing-g4/clients-servers-and-the-web.js, with
     -2.js and -3.js: the film's pictures, after the shared marks (MK) and
     before the engine's tail, all in one scope. The storyboard is
     computing/grade-4-app/lecture-video/clients-servers-and-the-web.json.

     Computing keeps no ART.sim, and this lesson's network activity is a
     closure inside the lesson page, so every diagram here is drawn in the
     engine's own idiom out of the lesson's own pictures: the word cards'
     emoji (client, server, internet, World Wide Web, ethernet, wi-fi) and the
     lesson's own examples - a tablet wanting a page, a laptop wanting a file,
     a page about lions, a tablet in the garden.

     NOTHING TECHNICAL IS ADDED. The lesson says a client asks and a server
     answers, and says nothing about how a request travels, so no message here
     hops, routes or is addressed to anything. Every label is a phrase from
     lesson-10.py.

     This file: the palette, the small drawings the chapters share, the title
     motif and the chapter "Clients ask, servers serve". Every top-level name
     here starts with csw, so nothing can replace a name of the engine, ART or
     MK. */

  var HUE = {
    title: P.teal, clients: P.gold, servers: P.accent, internet: P.blue,
    links: P.plum, wires: P.good, trade: P.gold, recap: P.teal
  };

  /* ---- timing ---------------------------------------------------------------- */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 comes
     in: for a thing that belongs to that beat alone (rule 7) */
  function cswOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function cswFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }
  /* has this cue been reached? (a cue the beat never names is never reached) */
  function cswPast(t, at) { return at != null && t >= at; }
  /* fixed numbers for anything scattered: never Math.random */
  var CSW_SCATTER = [0.21, 0.74, 0.08, 0.57, 0.93, 0.36, 0.65, 0.12, 0.81, 0.44, 0.29, 0.69];

  /* ---- the lesson's own pictures ---------------------------------------------
     Straight from LESSON["words"] and the step items of lesson-10.py, so the
     film and the page show a child the same thing. */
  var CSW_PIC = {
    client: "\u{1F4F1}", server: "\u{1F5C4}️", internet: "\u{1F5FA}️",
    web: "\u{1F310}", ethernet: "\u{1F50C}", wifi: "\u{1F4F6}",
    laptop: "\u{1F4BB}", phone: "\u{1F4F2}", request: "\u{1F4E8}", page: "\u{1F4C4}",
    link: "\u{1F517}", router: "\u{1F4E1}", printer: "\u{1F5A8}️", mail: "\u{1F4E7}",
    folder: "\u{1F4C1}", app: "⚙️", radio: "\u{1F4FB}", wall: "\u{1F9F1}",
    key: "\u{1F511}", stranger: "\u{1F9CD}", sea: "\u{1F30A}", world: "\u{1F30D}",
    call: "\u{1F4DE}", game: "\u{1F3AE}", crown: "\u{1F451}", lion: "\u{1F981}"
  };

  /* ---- small drawings the chapters share -------------------------------------- */

  /* A plain card. opt: {fill, col, sw, o, rx} */
  function cswCard(x, y, w, h, opt) {
    opt = opt || {};
    var o = opt.o == null ? 1 : opt.o;
    if (!(o > 0)) return "";
    return R(x, y, w, h, opt.rx == null ? 20 : opt.rx, opt.fill || P.card,
      opt.col || P.line, opt.sw || 2, { opacity: clamp(o, 0, 1) });
  }

  /* One device: a card with the lesson's picture and one word.
     opt: {o, col, size (the card's height), lit} */
  function cswDevice(x, y, w, h, pic, word, opt) {
    opt = opt || {};
    var o = opt.o == null ? 1 : opt.o;
    if (!(o > 0)) return "";
    var col = opt.col || P.line, p = clamp(o, 0, 1.08);
    var body = R(x, y, w, h, h * 0.24, opt.lit ? "#1B3A52" : P.cell, col, opt.col ? 3.5 : 2) +
      MK.pic(x + h * 0.56, y + h / 2, h * 0.56, pic);
    if (word) body += Tx(x + h * 1.02, y + h / 2 + 9, word, "lab big", "start");
    return G(body, { transform: around(x + w / 2, y + h / 2, Math.min(1.06, p)), opacity: Math.min(1, o) });
  }

  /* The server, as the lesson draws it: its filing-cabinet picture over the
     word, in a tall card. The files appear inside it when it is said to store
     things. opt: {o, col, stored (0-1), grow} */
  function cswServer(x, y, w, h, opt) {
    opt = opt || {};
    var o = opt.o == null ? 1 : opt.o;
    if (!(o > 0)) return "";
    var col = opt.col || P.teal, cx = x + w / 2;
    var body = R(x, y, w, h, 24, "#16324A", col, 3) +
      MK.pic(cx, y + h * 0.26, h * 0.34, CSW_PIC.server) +
      Tx(cx, y + h * 0.50, "server", "lab big", "middle");
    var st = opt.stored == null ? 0 : opt.stored;
    if (st > 0) {
      var k, row, colm;                              /* six files, shown by `stored` */
      for (k = 0; k < 6; k++) {
        row = Math.floor(k / 3); colm = k % 3;
        var fo = clamp(st * 6 - k, 0, 1);
        if (fo <= 0) continue;
        body += G(MK.pic(cx + (colm - 1) * w * 0.26, y + h * 0.68 + row * h * 0.17, h * 0.15, CSW_PIC.page),
          { opacity: fo });
      }
    }
    return G(body, { transform: around(cx, y + h / 2, opt.grow || 1), opacity: clamp(o, 0, 1) });
  }

  /* A page of the web: a small card with a folded corner, a picture and a blue
     underlined link word. opt: {o, col, pic, link, lit} */
  function cswPage(x, y, w, h, opt) {
    opt = opt || {};
    var o = opt.o == null ? 1 : opt.o;
    if (!(o > 0)) return "";
    var col = opt.col || (opt.lit ? P.blue : P.line);
    var body = R(x, y, w, h, 12, opt.lit ? "#1B3A52" : P.cell, col, opt.lit ? 3.5 : 2) +
      R(x + 12, y + 12, w - 24, 8, 4, P.line) +
      MK.pic(x + w / 2, y + h * 0.46, h * 0.40, opt.pic || CSW_PIC.page);
    if (opt.link) {
      var ly = y + h - 18;
      body += Tx(x + w / 2, ly, opt.link, "lab mid", "middle", { fill: "#7FC4EA" }) +
        L(x + w / 2 - String(opt.link).length * 6, ly + 6, x + w / 2 + String(opt.link).length * 6, ly + 6, "#7FC4EA", 2);
    }
    return G(body, { transform: around(x + w / 2, y + h / 2, Math.min(1.06, clamp(o, 0, 1.08))), opacity: Math.min(1, o) });
  }

  /* A browser window: a bar with three dots and a www address, and room inside
     for pages. opt: {o, address} */
  function cswBrowser(x, y, w, h, inner, opt) {
    opt = opt || {};
    var o = opt.o == null ? 1 : opt.o;
    if (!(o > 0)) return "";
    var bar = 44;
    var body = R(x, y, w, h, 18, P.card, P.line, 2.5) +
      R(x, y, w, bar, 18, "#17384F") + R(x, y + bar - 18, w, 18, 0, "#17384F") +
      C(x + 26, y + bar / 2, 7, P.bad) + C(x + 50, y + bar / 2, 7, P.gold) + C(x + 74, y + bar / 2, 7, P.good) +
      R(x + 96, y + 11, w - 120, bar - 22, 11, P.ground, P.line, 1.5) +
      Tx(x + 112, y + bar / 2 + 7, opt.address || "www.lions.example", "lab mid muted", "start");
    return G(body + (inner || ""), { opacity: clamp(o, 0, 1) });
  }

  /* A growing cable from (ax, ay) to (bx, by), drawn to u (0-1): the engine's
     own cubic, sampled, so the wire draws itself rather than appearing. */
  function cswWire(ax, ay, bx, by, u, col, w) {
    if (!(u > 0)) return "";
    var c = cable(ax, ay, bx, by), n = 24, d = "", k, pt;
    for (k = 0; k <= n; k++) {
      if (k / n > u) break;
      pt = c.at(k / n);
      d += (k ? " L" : "M") + n2(pt[0]) + "," + n2(pt[1]);
    }
    pt = c.at(clamp(u, 0, 1));
    d += " L" + n2(pt[0]) + "," + n2(pt[1]);
    return Pth(d, null, col || P.good, w || 7);
  }

  /* ==== the title ===============================================================
     The whole lesson in one picture: a client on the left, a server on the
     right, an arrow asking and an arrow serving. In the spoken title chapter
     the client arrives as the tablet is named, the asking arrow on "asks for a
     web page", the server on "A computer far away answers", and the two words
     as they are said. On the two cards it stands still. */
  function cswMotifTile(x, y, s, pic, o, col) {
    if (!(o > 0)) return "";
    return G(R(x, y, s, s, s * 0.22, P.cell, col || P.line, 3) + MK.pic(x + s / 2, y + s / 2, s * 0.58, pic),
      { transform: around(x + s / 2, y + s / 2, Math.min(1.08, o)), opacity: Math.min(1, o) });
  }

  function titleMotif(o) {
    var t = o.t || 0, sn = o.scene, out = "";
    var cTab = sn ? sc(sn, 0, "tablet") : null, cAsk = sn ? sc(sn, 0, "ask") : null,
      cFar = sn ? sc(sn, 0, "far") : null, cCli = sn ? sc(sn, 1, "client") : null,
      cSrv = sn ? sc(sn, 1, "server") : null;
    var pA = sn ? popIn(t, cTab, 0.4) : 1, pB = sn ? popIn(t, cFar, 0.4) : 1;
    var a1 = sn ? on(t, cAsk, 0.6) : 1, a2 = sn ? on(t, cSrv, 0.6) : 1;
    var wA = sn ? on(t, cCli, 0.45) : 1, wB = sn ? on(t, cSrv, 0.45) : 1;

    out += R(8, 26, 344, 308, 30, P.card, P.line, 3);
    out += cswMotifTile(34, 86, 110, CSW_PIC.client, pA, P.gold);
    out += cswMotifTile(216, 86, 110, CSW_PIC.server, pB, P.teal);
    /* asks, and is served */
    out += MK.arrow(152, 116, 208, 116, a1, P.gold, 6);
    out += MK.arrow(208, 168, 152, 168, a2, P.good, 6);
    out += Tx(180, 66, "asks", "lab mid", "middle", { fill: P.gold, opacity: a1 });
    out += Tx(180, 202, "serves", "lab mid", "middle", { fill: P.good, opacity: a2 });
    out += Tx(89, 240, "client", "lab big", "middle", { opacity: wA });
    out += Tx(271, 240, "server", "lab big", "middle", { opacity: wB });
    /* the page that came back */
    out += MK.pop(MK.pic(89, 296, 46, CSW_PIC.web), 89, 296, sn ? popIn(t, cSrv == null ? null : cSrv + 0.5, 0.4) : 1);
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A client tablet asks, and a server answers">' + out + "</svg>";
  }

  /* ==== chapter: clients ask, servers serve =======================================
     Two views. First the three clients of the lesson's own lecture - a tablet
     wanting a page, a laptop wanting a file, a phone wanting a video - asking
     one server, which stores things and serves them back. Then the same server
     with many clients at once, and the lesson's own misconception: the server
     is not the biggest and not the boss. */
  var CSW_CL = { x: 52, w: 264, h: 92, ys: [76, 190, 304] };
  var CSW_CL_ITEMS = [
    { pic: CSW_PIC.client, word: "tablet" },
    { pic: CSW_PIC.laptop, word: "laptop" },
    { pic: CSW_PIC.phone, word: "phone" }
  ];
  var CSW_SRV = { x: 800, y: 60, w: 316, h: 330 };

  function cswClientsMain(scene, t) {
    var cAsk = sc(scene, 0, "ask"), cAns = sc(scene, 0, "answer");
    var cCli = sc(scene, 1, "client"), cTab = sc(scene, 1, "tablet"), cLap = sc(scene, 1, "laptop");
    var cSrv = sc(scene, 2, "server"), cSto = sc(scene, 2, "stores"), cSer = sc(scene, 2, "serves");
    var out = "";

    /* the three clients, each lit as the lesson names it */
    var appear = [cAsk, cAsk, cAsk], lit = [cTab, cLap, null];
    CSW_CL_ITEMS.forEach(function (it, k) {
      var o = on(t, cAsk == null ? null : cAsk + k * 0.25, 0.45);
      var isLit = lit[k] != null && cswPast(t, lit[k]);
      out += cswDevice(CSW_CL.x, CSW_CL.ys[k], CSW_CL.w, CSW_CL.h, it.pic, it.word,
        { o: o, lit: isLit, col: isLit ? P.gold : null });
      if (lit[k] != null) out += MK.ripple(CSW_CL.x + 52, CSW_CL.ys[k] + CSW_CL.h / 2, t, lit[k], P.gold);
    });
    out += MK.pill(184, 32, "client: it asks", on(t, cCli, 0.45), { size: 23, col: P.gold, ink: P.gold });

    /* the server */
    out += cswServer(CSW_SRV.x, CSW_SRV.y, CSW_SRV.w, CSW_SRV.h,
      { o: on(t, cAns, 0.5), stored: on(t, cSto, 1.1), col: cswPast(t, cSrv) ? P.teal : P.line });
    out += MK.pill(958, 32, "server: it answers", on(t, cSrv, 0.45), { size: 23, col: P.teal, ink: P.teal });

    /* the request going up, and the page coming back */
    var q = on(t, cAsk, 1.0), s = on(t, cSer, 1.0);
    out += MK.arrow(356, 150, 760, 150, q, P.gold, 8);
    out += MK.pop(MK.pic(lerp(380, 736, q), 106, 58, CSW_PIC.request), lerp(380, 736, q), 106, popIn(t, cAsk, 0.4));
    out += Tx(558, 84, "a request", "lab mid", "middle", { fill: P.gold, opacity: q });
    out += MK.arrow(760, 318, 356, 318, s, P.good, 8);
    if (s > 0) out += MK.pic(lerp(736, 380, s), 356, 58, CSW_PIC.web, { opacity: s });
    out += Tx(558, 400, "the page it asked for", "lab mid", "middle", { fill: P.good, opacity: s });
    return out;
  }

  /* many clients at once, and what a server is not */
  /* five columns, not six: the sixth sat under the server once it grew */
  var CSW_MANY = { x: 44, y: 94, w: 96, h: 62, gapx: 10, gapy: 10, cols: 5, rows: 4 };
  function cswManyAt(k) {
    var c = k % CSW_MANY.cols, r = Math.floor(k / CSW_MANY.cols);
    return [CSW_MANY.x + c * (CSW_MANY.w + CSW_MANY.gapx), CSW_MANY.y + r * (CSW_MANY.h + CSW_MANY.gapy)];
  }
  function cswClientsMany(scene, t) {
    var cHun = sc(scene, 3, "hundreds"), cAll = sc(scene, 3, "allday");
    var cBig = sc(scene, 4, "biggest"), cBoss = sc(scene, 4, "boss"),
      cNo = sc(scene, 4, "no"), cAns = sc(scene, 4, "answers");
    var out = "", n = CSW_MANY.cols * CSW_MANY.rows;
    var shown = tally(t, cHun, n, 1.3);
    var grow = 1 + 0.18 * on(t, cBig, 0.5) * (1 - on(t, cNo, 0.45));
    var sx = 806, sy = 246;                     /* the server's own centre */

    /* every client, and a thin line from each to the server */
    for (var k = 0; k < n; k++) {
      if (k >= shown) break;
      var at = cswManyAt(k), o = clamp((shown - k), 0, 1);
      var pic = k % 3 === 0 ? CSW_PIC.client : k % 3 === 1 ? CSW_PIC.laptop : CSW_PIC.phone;
      out += L(at[0] + CSW_MANY.w, at[1] + CSW_MANY.h / 2, sx - 130, sy, P.gold, 1.6,
        { opacity: 0.30 * o * (0.7 + 0.3 * breathe(t + k * 0.5)) });
      out += G(R(at[0], at[1], CSW_MANY.w, CSW_MANY.h, 14, P.cell, P.line, 2) +
        MK.pic(at[0] + CSW_MANY.w / 2, at[1] + CSW_MANY.h / 2, 34, pic), { opacity: o });
    }
    out += MK.pill(238, 46, "hundreds of clients", on(t, cHun, 0.45), { size: 24, col: P.gold, ink: P.gold });
    out += MK.pill(238, 404, "one server answers each one", on(t, cAll, 0.45), { size: 22, col: P.good, ink: P.good });

    /* the one server, all day */
    out += cswServer(sx - 130, sy - 150, 260, 300, { o: 1, stored: 1, col: P.teal, grow: grow });
    /* not the biggest, and not the boss */
    out += MK.qmark(1092, 76, 26, on(t, cBig, 0.4) * (1 - on(t, cNo, 0.4)));
    /* the crown stays, crossed out: fading it left the cross over nothing */
    out += MK.pop(MK.pic(sx, sy - 186, 58, CSW_PIC.crown), sx, sy - 186, popIn(t, cBoss, 0.4));
    out += MK.cross(sx, sy - 186, 30, popIn(t, cNo, 0.4));
    out += MK.tick(sx + 120, sy + 128, 28, popIn(t, cAns, 0.4));
    out += MK.pill(sx, 414, "it is the one that answers", on(t, cAns, 0.45), { size: 23, col: P.teal, ink: P.teal });
    return out;
  }

  function cswClientsChapter(scene, beat, t, i) {
    var u = into(t, scene.first + 3), out = "";
    if (u < 1) out += G(cswClientsMain(scene, t), { opacity: 1 - u });
    if (u > 0) out += G(cswClientsMany(scene, t), { opacity: u });
    return svg(out);
  }
