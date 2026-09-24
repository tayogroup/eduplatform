  /* ==== Grade 2 Computing, Lesson 9: Connected Devices ========================
     tools/lib/film-scenes/computing-g2/connected-devices.js, with -2.js, -3.js
     and -4.js: the film's pictures, after the shared marks (MK) and before the
     engine's tail, all in one scope. The storyboard is
     computing/grade-2-app/lecture-video/connected-devices.json.

     WHAT COMES FROM THE LESSON KIT AND WHAT IS DRAWN HERE. Computing keeps its
     home-network diagram inside a closure (see the art adapter's header), so
     the network, the router, the signal bars and the cables are drawn here, in
     the engine's idiom, from the lesson's own devices and examples. The one
     drawing lifted whole is ART.figure("tablet"), used large in the offline
     test, because the lesson's own offline step runs on a tablet. It is drawn
     plain: no beat here names a part of it, and a ring is the lesson's mark for
     the part a child has just found.

     ART.scene("internet") is NOT used. At states 2 and 3 its caption is wider
     than its own 320-unit viewBox and clips when placed (the known fault, which
     is not this film's to fix), and states 0 and 1 are two computers on a wire,
     which is a Grade 1 idea and not what this lesson teaches. The globe here is
     drawn instead, and carries the lesson's own word for it.

     Every top-level name starts with cd, so nothing can replace a name of the
     engine, ART or MK. */

  var HUE = {
    title: P.teal, join: P.gold, together: P.accent, wires: P.blue,
    signal: P.good, sharing: P.plum, private: P.gold, recap: P.teal
  };

  /* ---- timing ---------------------------------------------------------------- */

  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function cdFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }
  /* 0 -> 1 as beat k comes in and back to 0 as beat k + 1 does: a thing that
     belongs to that beat alone (rule 7 - nothing left over from the beat before) */
  function cdOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  function cdPast(t, at) { return at != null && t >= at; }
  /* is this cue the one being said right now? (for the gold border, rule 3) */
  function cdHot(t, at, span) { return at != null && t >= at && t < at + (span || 1.1); }

  /* ---- the lesson's eight devices --------------------------------------------
     The labels and the pictures are the ones the lesson's own Device spotter
     step carries, in its order. */
  var CD_DEV = {
    laptop:  { label: "laptop",        pic: "\u{1F4BB}" },
    tablet:  { label: "tablet",        pic: "\u{1F4F1}" },
    phone:   { label: "phone",         pic: "\u{1F4F2}" },
    printer: { label: "printer",       pic: "\u{1F5A8}️" },
    speaker: { label: "smart speaker", pic: "\u{1F50A}" },
    console: { label: "games console", pic: "\u{1F3AE}" },
    tv:      { label: "smart TV",      pic: "\u{1F4FA}" },
    watch:   { label: "smart watch",   pic: "⌚" }
  };

  /* ---- the things every chapter draws ----------------------------------------- */

  /* a device on a card: its picture, its name, and a border that goes gold while
     it is the one being spoken about. opt: {o, col, fade, mark, markP} */
  function cdTile(x, y, w, h, id, opt) {
    opt = opt || {};
    var o = opt.o == null ? 1 : opt.o;
    if (!(o > 0)) return "";
    var d = CD_DEV[id] || { label: String(id), pic: "" };
    var col = opt.col || P.line;
    var body = R(x, y, w, h, 20, opt.fill || P.cell, col, opt.col ? 4 : 2) +
      Em(x + w / 2, y + h * 0.40, h * 0.38, d.pic) +
      Tx(x + w / 2, y + h - 20, d.label, "lab mid", "middle");
    if (opt.mark === "cross") body += MK.cross(x + w - 20, y + 20, 18, opt.markP == null ? 1 : opt.markP);
    if (opt.mark === "tick") body += MK.tick(x + w - 20, y + 20, 18, opt.markP == null ? 1 : opt.markP);
    return G(body, { transform: around(x + w / 2, y + h / 2, Math.min(1.06, o)),
      opacity: clamp(Math.min(1, o) * (opt.fade == null ? 1 : opt.fade), 0, 1) });
  }

  /* an empty place, waiting for a device */
  function cdSlot(x, y, w, h, o) {
    if (!(o > 0)) return "";
    return G(R(x, y, w, h, 20, P.card, P.line, 2, { "stroke-dasharray": "10 9" }) +
      Tx(x + w / 2, y + h / 2 + 12, "?", "lab big muted", "middle"),
      { opacity: clamp(Math.min(1, o), 0, 1) });
  }

  /* The router: a box with two aerials and three lights. Drawn rather than taken
     from an emoji, because this machine's satellite-dish emoji is not what a
     child has at home (rule 5). lights: a colour, or null for a dark router. */
  function cdRouter(cx, cy, s, o, lights) {
    if (!(o > 0)) return "";
    var w = 128 * s, h = 54 * s, x = cx - w / 2, y = cy - h / 2, out = "";
    out += L(x + w * 0.22, y + 4, x + w * 0.04, y - 44 * s, P.plastic, 6 * s);
    out += L(x + w * 0.78, y + 4, x + w * 0.96, y - 44 * s, P.plastic, 6 * s);
    out += R(x, y, w, h, 12 * s, P.body, P.plastic, 3);
    for (var k = 0; k < 3; k++)
      out += C(x + w * (0.28 + k * 0.22), y + h * 0.6, 6 * s, lights === null ? "#1B2E3E" : (lights || P.good),
        lights === null ? P.line : null, lights === null ? 1.5 : null);
    return G(out, { transform: around(cx, cy, Math.min(1.06, o)), opacity: clamp(Math.min(1, o), 0, 1) });
  }

  /* the world, for "and reach the internet" */
  function cdGlobe(cx, cy, r, o) {
    if (!(o > 0)) return "";
    var s = r / 120;
    return G(C(cx, cy, r, "#2C5F8F", "#7FB6E8", 3) +
      G(Pth("M-72 -42 q36 -26 72 -6 q8 30 -24 44 q-42 10 -52 -14 q-6 -14 4 -24z", "#4CB65C") +
        Pth("M8 16 q40 -12 54 24 q-26 34 -54 10 q-12 -16 0 -34z", "#4CB65C") +
        Pth("M-70 32 q26 -6 28 30 q-22 22 -36 -8 q-4 -16 8 -22z", "#4CB65C"),
        { opacity: 0.85, transform: tr(cx, cy, s) }) +
      E(cx, cy, r * 0.44, r, "none", "#7FB6E8", 2, { opacity: 0.4 }) +
      L(cx - r, cy, cx + r, cy, "#7FB6E8", 2, { opacity: 0.4 }),
      { opacity: clamp(Math.min(1, o), 0, 1) });
  }

  /* a wooden chair: the one thing in the lesson that cannot join anything */
  function cdChair(cx, cy, s, o) {
    if (!(o > 0)) return "";
    var w = 128 * s, h = 156 * s, x = cx - w / 2, y = cy - h / 2;
    var wood = "#C9A06A", edge = "#A67C44";
    var out = R(x + 16, y, w - 32, h * 0.42, 8, wood, edge, 3) +
      L(x + w * 0.38, y + h * 0.08, x + w * 0.38, y + h * 0.34, edge, 3) +
      L(x + w * 0.62, y + h * 0.08, x + w * 0.62, y + h * 0.34, edge, 3) +
      R(x, y + h * 0.42, w, h * 0.14, 6, wood, edge, 3) +
      R(x + 8, y + h * 0.56, 14 * s, h * 0.44, 4, wood, edge, 3) +
      R(x + w - 8 - 14 * s, y + h * 0.56, 14 * s, h * 0.44, 4, wood, edge, 3);
    return G(out, { transform: around(cx, cy, Math.min(1.06, o)), opacity: clamp(Math.min(1, o), 0, 1) });
  }

  /* ==== the title =================================================================
     Six of the lesson's devices in a ring round a router: the home network the
     whole lesson is about. In the spoken title chapter the devices arrive in
     pairs as they are named, the links draw on "join the network", and a photo
     crosses from the phone to the printer on "neither can alone". On the two
     cards the ring simply stands. */
  var CD_T_DEV = ["phone", "printer", "speaker", "console", "tv", "watch"];
  var CD_T_AT = [-90, -30, 30, 90, 150, 210];
  function cdTitleNode(k) {
    var a = CD_T_AT[k] * Math.PI / 180;
    return [180 + 118 * Math.cos(a), 185 + 118 * Math.sin(a)];
  }

  function titleMotif(o) {
    var t = o.t || 0, sn = o.scene || null, out = "";
    var cPhones = sn ? sc(sn, 0, "phones") : null, cSpk = sn ? sc(sn, 0, "speakers") : null,
      cScr = sn ? sc(sn, 0, "screens") : null, cJoin = sn ? sc(sn, 0, "join") : null,
      cJoined = sn ? sc(sn, 1, "joined") : null, cNeither = sn ? sc(sn, 1, "neither") : null;
    var pairAt = [cPhones, cPhones, cSpk, cSpk, cScr, cScr];
    var link = sn ? on(t, cJoin, 0.9) : 1;

    out += R(8, 26, 344, 308, 30, P.card, P.line, 3);
    /* the links first, so every device sits on top of its own wire */
    CD_T_DEV.forEach(function (id, k) {
      var p = cdTitleNode(k), u = sn ? clamp(link * 1.5 - k * 0.07, 0, 1) : 1;
      if (u <= 0) return;
      out += L(180, 185, lerp(180, p[0], u), lerp(185, p[1], u), P.gold, 3, { opacity: 0.85 });
    });
    out += cdRouter(180, 185, 0.72, sn ? Math.max(0.001, on(t, cPhones, 0.5)) : 1);
    CD_T_DEV.forEach(function (id, k) {
      var p = cdTitleNode(k);
      var pop = sn ? popIn(t, pairAt[k] == null ? null : pairAt[k] + (k % 2) * 0.28, 0.4) : 1;
      if (!(pop > 0)) return;
      out += G(Em(p[0], p[1], 46, CD_DEV[id].pic), { transform: around(p[0], p[1], Math.min(1.08, pop)), opacity: Math.min(1, pop) });
    });
    /* the phone and the printer, working together */
    if (sn) {
      var lit = on(t, cJoined, 0.5), a = cdTitleNode(0), b = cdTitleNode(1);
      if (lit > 0) {
        out += C(a[0], a[1], 34, "none", P.good, 4, { opacity: lit });
        out += C(b[0], b[1], 34, "none", P.good, 4, { opacity: lit });
      }
      var fly = on(t, cNeither, 1.1);
      if (fly > 0 && fly < 1) {
        var pt = polyAt([[a[0], a[1]], [180, 185], [b[0], b[1]]], fly * polyLen([[a[0], a[1]], [180, 185], [b[0], b[1]]]));
        out += Em(pt[0], pt[1], 30, "\u{1F5BC}️");
      }
      out += MK.tick(b[0] + 34, b[1] - 34, 20, popIn(t, cNeither == null ? null : cNeither + 1.1, 0.35));
    }
    return '<svg viewBox="0 0 360 360" role="img" aria-label="A phone, a printer, a speaker, a console, a TV and a watch joined to a router">' + out + "</svg>";
  }

  /* ==== chapter: who joins the network ============================================
     Eight places, one for each device the lesson's Device spotter step carries.
     A laptop is there from "not only computers"; the other seven arrive as empty
     places on "Lots of devices" and fill in as each device is named. Then the
     wooden chair, which cannot join - and last, the whole set joined through the
     router and on to the internet. */
  var CD_GRID = { x: 40, y: 43, w: 162, h: 168, gx: 16, gy: 18 };
  function cdGX(k) { return CD_GRID.x + (k % 4) * (CD_GRID.w + CD_GRID.gx); }
  function cdGY(k) { return CD_GRID.y + Math.floor(k / 4) * (CD_GRID.h + CD_GRID.gy); }
  var CD_ORDER = ["laptop", "tablet", "phone", "printer", "speaker", "console", "tv", "watch"];

  function cdJoinGrid(scene, t) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cNot = c(0, "notonly"), cLots = c(0, "lots");
    var at = {
      laptop: cNot, tablet: c(1, "tablet"),
      phone: c(2, "phone"), printer: c(2, "printer"),
      speaker: c(3, "speaker"), console: c(3, "console"),
      tv: c(4, "tv"), watch: c(4, "watch")
    };
    var cRing = c(1, "laptop"), cChair = c(5, "chair"), cNoComp = c(5, "nocomputer");
    /* the eight places are there from the chapter's first frame, faint; "Lots of
       devices" brightens them one after another, left to right */
    var woke = cdPast(t, cLots) ? tally(t, cLots, 7, 0.9) : 0;
    var fade = 1 - 0.5 * on(t, cChair, 0.6);
    var out = "";

    CD_ORDER.forEach(function (id, k) {
      var pop = popIn(t, at[id], 0.42);
      if (pop > 0) {
        var hot = cdHot(t, id === "laptop" ? cRing : at[id]);
        out += cdTile(cdGX(k), cdGY(k), CD_GRID.w, CD_GRID.h, id,
          { o: pop, col: hot ? P.gold : null, fade: fade });
        if (hot) out += MK.ripple(cdGX(k) + CD_GRID.w / 2, cdGY(k) + CD_GRID.h * 0.40, t,
          id === "laptop" ? cRing : at[id], P.gold);
      } else {
        out += cdSlot(cdGX(k), cdGY(k), CD_GRID.w, CD_GRID.h, fade * (k <= woke ? 1 : 0.4));
      }
    });

    /* the chair, on the right, with its own cross */
    var ch = popIn(t, cChair, 0.45);
    if (ch > 0) {
      out += G(R(790, 96, 332, 266, 24, P.card, P.line, 2), { opacity: Math.min(1, ch) });
      out += cdChair(946, 214, 1, ch);
      out += Tx(956, 336, "a wooden chair", "lab mid muted", "middle", { opacity: Math.min(1, ch) });
      out += MK.cross(956, 214, 46, popIn(t, cNoComp, 0.42));
    }
    return out;
  }

  /* the last beat: all eight joined through the router, and on to the internet */
  var CD_RING = { cx: 430, cy: 220, r: 150 };
  function cdRingNode(k) {
    var a = (-67.5 + k * 45) * Math.PI / 180;
    return [CD_RING.cx + CD_RING.r * Math.cos(a), CD_RING.cy + CD_RING.r * Math.sin(a)];
  }
  function cdJoinRouter(scene, t) {
    var cR = sc(scene, 6, "router"), cI = sc(scene, 6, "internet");
    var out = "", lit = on(t, cR, 0.7);
    CD_ORDER.forEach(function (id, k) {
      var p = cdRingNode(k), u = clamp(lit * 1.6 - k * 0.08, 0, 1);
      if (u > 0) out += L(CD_RING.cx, CD_RING.cy, lerp(CD_RING.cx, p[0], u), lerp(CD_RING.cy, p[1], u), P.gold, 3, { opacity: 0.85 });
    });
    out += cdRouter(CD_RING.cx, CD_RING.cy, 0.92, 1);
    out += Tx(CD_RING.cx, CD_RING.cy + 54, "router", "lab mid gold", "middle");
    CD_ORDER.forEach(function (id, k) {
      var p = cdRingNode(k);
      out += Em(p[0], p[1], 50, CD_DEV[id].pic);
      out += Tx(p[0], p[1] + 44, CD_DEV[id].label, "lab small muted", "middle");
    });
    out += cdGlobe(930, 208, 112, on(t, cI, 0.6));
    out += MK.arrow(512, 220, 800, 216, on(t, cI, 0.6), P.gold, 8);
    out += MK.pill(930, 376, "the internet", on(t, cI == null ? null : cI + 0.3, 0.45), { size: 27, col: P.gold, ink: P.gold });
    return out;
  }

  function cdJoinChapter(scene, beat, t, i) {
    var u = into(t, scene.first + 6), out = "";
    if (u < 1) out += G(cdJoinGrid(scene, t), { opacity: 1 - u });
    if (u > 0) out += G(cdJoinRouter(scene, t), { opacity: u });
    return svg(out);
  }
