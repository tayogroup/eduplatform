  /* ==== Grade 1 Computing, Lesson 7: Networks and the Internet ================
     tools/lib/film-scenes/computing-g1/networks-and-the-internet.js, with
     -2.js and -3.js: the film's pictures, after the shared marks (MK) and
     before the engine's tail, all in one scope. The storyboard is
     computing/grade-1-app/lecture-video/networks-and-the-internet.json.

     What comes from the lesson and what is drawn here:
       ART.scene("internet", 0) and (1)   the lesson's own demo drawing, one
                                          computer and then two joined. The
                                          scene takes a NUMBER, not a list.
                                          States 2 and 3 are NOT used: their
                                          caption is wider than the scene's own
                                          320-unit viewBox and clips (a known
                                          fault in the lesson's art, not this
                                          film's to fix or to work around), so
                                          the world is drawn here instead.
       the router and its five devices    the Network builder's layout and its
                                          emoji, drawn here: the builder is a
                                          closure inside its activity and
                                          cannot be lifted.
       the two bins, the apps             the Wire spotter's and the Offline
                                          tester's own items and wording.

     This file: the colours, the small marks every chapter shares, the title
     motif, and the chapters "A network" and "The router at home". Every
     top-level name starts with nw, so nothing here can replace a name of the
     engine, ART or MK. */

  var HUE = {
    title: P.teal, network: P.gold, router: P.blue, wires: P.good,
    world: P.plum, off: P.accent, recap: P.teal
  };

  /* ---- timing ---------------------------------------------------------------- */

  /* 0 -> 1 as the chapter's beat k comes in, and back to 0 as beat k + 1 comes
     in: for a thing that belongs to that beat alone */
  function nwOnly(t, scene, k) {
    if (k >= scene.beats.length) return 0;
    var b = scene.first + k;
    var a = k === 0 ? 1 : into(t, b);
    var z = k + 1 < scene.beats.length ? into(t, b + 1) : 0;
    return a * (1 - z);
  }
  /* 0 -> 1 from the chapter's beat k on, for a thing that stays */
  function nwFrom(t, scene, k) { return k >= scene.beats.length ? 0 : k === 0 ? 1 : into(t, scene.first + k); }
  /* 0 -> 1 across beats k to m of the chapter, 0 outside them */
  function nwBetween(t, scene, k, m) { return nwFrom(t, scene, k) * (1 - nwFrom(t, scene, m + 1)); }
  /* fixed numbers for anything scattered: never Math.random */
  var NW_SCATTER = [0.21, 0.77, 0.44, 0.09, 0.63, 0.35, 0.92, 0.51, 0.17, 0.83, 0.29, 0.68];

  /* ---- small drawings of the film's own --------------------------------------- */

  /* a cable: a line that draws itself, with a plug dot at each end */
  function nwCable(x1, y1, x2, y2, u, col, w) {
    if (!(u > 0)) return "";
    col = col || P.gold; w = w || 7;
    var ex = lerp(x1, x2, clamp(u, 0, 1)), ey = lerp(y1, y2, clamp(u, 0, 1));
    return L(x1, y1, ex, ey, col, w) + C(x1, y1, w * 0.86, col) + (u >= 1 ? C(x2, y2, w * 0.86, col) : "");
  }

  /* a connection through the air: a dashed line, and sound-style arcs leaving
     the device towards the other end while it is being made */
  function nwAir(t, at, x1, y1, x2, y2, col) {
    var u = on(t, at, 0.6);
    if (!(u > 0)) return "";
    var c = col || P.teal, a = Math.atan2(y2 - y1, x2 - x1);
    return L(x1, y1, lerp(x1, x2, u), lerp(y1, y2, u), c, 4, { "stroke-dasharray": "9 11", opacity: 0.85 }) +
      MK.waves(x1 + Math.cos(a) * 26, y1 + Math.sin(a) * 26, t, at, { dir: a, spread: 1.0, n: 3, period: 1.1, reach: 82, col: c });
  }

  /* a thing travelling along a straight leg, from `at` over `span`; it stays at
     the far end afterwards so the next leg can pick it up */
  function nwAlong(t, at, span, x1, y1, x2, y2, size, glyph, lift) {
    if (at == null || t < at) return null;
    var u = ease(clamp((t - at) / span, 0, 1));
    return { x: lerp(x1, x2, u), y: lerp(y1, y2, u) - (lift || 0) * Math.sin(Math.PI * u), u: u, size: size, glyph: glyph };
  }
  function nwFly(p, o, land) {
    if (!p || !(o > 0)) return "";
    var fade = land ? 1 - ease(clamp((p.u - 0.86) / 0.14, 0, 1)) : 1;
    return G(Em(p.x, p.y, p.size, p.glyph), { opacity: clamp(o, 0, 1) * fade });
  }

  /* a word in a pill with a leader line to the thing it names */
  function nwTag(t, x, y, text, at, to, col, size) {
    var o = on(t, at, 0.4);
    if (o <= 0) return "";
    var c = col || P.gold, sz = size || 26;
    var half = String(text).length * sz * 0.28 + sz * 0.65;
    var edge = to[0] < x ? x - half : to[0] > x ? x + half : x;
    var ey = to[1] < y - half ? y - sz * 0.9 : to[1] > y + half ? y + sz * 0.9 : y;
    return MK.leader(edge, ey, to[0], to[1], on(t, at, 0.7), c) +
      MK.pill(x, y, text, o, { size: sz, col: c });
  }

  /* one of the lesson's devices: its emoji, with its name under it */
  function nwDevice(cx, cy, size, glyph, name, o, ringCol, alpha) {
    if (!(o > 0)) return "";
    var out = "";
    if (ringCol) out += C(cx, cy, size * 0.72, "none", ringCol, 5);
    out += Em(cx, cy, size, glyph);
    if (name) out += Tx(cx, cy + size * 0.78, name, "lab mid muted", "middle");
    return G(out, { transform: around(cx, cy, Math.min(1, o)),
      opacity: clamp(Math.min(1, o) * (alpha == null ? 1 : alpha), 0, 1) });
  }

  /* ==== the title ==============================================================
     A globe with computers on it, joined by gold links: the lesson's own idea
     of the internet, drawn here because the kit's drawing of it clips its own
     caption. In the spoken title chapter one computer sits alone, then the
     rest and their links arrive on "Join it to another", and a message crosses
     on "can share". On the two cards the whole thing simply stands. */
  var NW_NODES = [[80, 170], [250, 110], [110, 270], [265, 250], [180, 70], [180, 296], [300, 185]];
  var NW_LINKS = [[0, 1], [0, 2], [1, 3], [2, 3], [4, 1], [5, 3], [0, 4], [6, 1], [2, 5], [6, 3]];
  var NW_GLYPH = ["\u{1F4BB}", "\u{1F5A5}️", "\u{1F4F1}"];

  function nwGlobe(cx, cy, r, o) {
    if (!(o > 0)) return "";
    var s = r / 150;
    return G(C(cx, cy, r, "#2C5F8F") + C(cx, cy, r, "#3B7FD1", null, null, { opacity: 0.55 }) +
      G(Pth("M-96 -52 q40 -34 82 -6 q-14 44 -66 46 q-26 -12 -16 -40z", "#4CB65C") +
        Pth("M18 22 q46 -20 64 26 q-42 36 -66 -2 q-10 -14 2 -24z", "#4CB65C") +
        Pth("M-78 44 q34 -8 34 44 q-30 22 -42 -18 q-4 -18 8 -26z", "#4CB65C"), { opacity: 0.75, transform: tr(cx, cy, s) }) +
      C(cx, cy, r, "none", "#7FB6E8", 3, { opacity: 0.5 }),
      { opacity: clamp(o, 0, 1) });
  }

  function titleMotif(o) {
    var t = o.t || 0, sn = o.scene || null, out = "";
    var joinAt = sn ? sc(sn, 1, "join") : null, shareAt = sn ? sc(sn, 1, "share") : null;
    var aloneAt = sn ? sc(sn, 0, "alone") : null, nowhereAt = sn ? sc(sn, 0, "nowhere") : null;
    var oneAt = sn ? sc(sn, 0, "one") : null;
    var grown = sn ? Math.max(1, tally(t, joinAt, NW_NODES.length, 1.0)) : NW_NODES.length;
    var linkU = sn ? on(t, joinAt == null ? null : joinAt + 0.25, 1.1) : 1;

    out += nwGlobe(180, 180, 150, 1);
    NW_LINKS.forEach(function (lk, k) {
      if (lk[0] >= grown || lk[1] >= grown) return;
      var a = NW_NODES[lk[0]], b = NW_NODES[lk[1]];
      out += L(a[0], a[1], b[0], b[1], P.gold, 3, { opacity: 0.8 * clamp(linkU * 1.4 - k * 0.04, 0, 1) });
    });
    NW_NODES.forEach(function (p, k) {
      if (k >= grown) return;
      var pop = !sn ? 1 : k > 0 ? popIn(t, joinAt == null ? null : joinAt + k * 0.12, 0.35)
        : Math.max(popIn(t, oneAt, 0.45), on(t, joinAt, 0.3));
      out += G(Em(p[0], p[1], 40, NW_GLYPH[k % 3]), { transform: around(p[0], p[1], Math.min(1, pop)), opacity: Math.min(1, pop) });
    });
    /* on its own: a dashed ring, and a cross for "anything anywhere" */
    if (sn) {
      out += C(NW_NODES[0][0], NW_NODES[0][1], 32 + 6 * bump(t, oneAt, 0.9), "none", P.gold, 4,
        { opacity: on(t, oneAt, 0.4) * (1 - on(t, aloneAt, 0.5)) });
      var al = on(t, aloneAt, 0.5) * (1 - on(t, joinAt, 0.4));
      if (al > 0) out += C(NW_NODES[0][0], NW_NODES[0][1], 40, "none", P.muted, 3, { "stroke-dasharray": "8 8", opacity: al });
      out += MK.cross(NW_NODES[0][0] + 46, NW_NODES[0][1] - 40, 18, popIn(t, nowhereAt, 0.35) * (1 - on(t, joinAt, 0.4)));
      /* a message crossing, on "can share" */
      var p = nwAlong(t, shareAt, 1.1, NW_NODES[0][0], NW_NODES[0][1] - 26, NW_NODES[1][0], NW_NODES[1][1] - 26, 34, "✉️", 22);
      out += nwFly(p, p ? 1 : 0);
    }
    return '<svg viewBox="0 0 360 360" role="img" aria-label="Computers around the world, joined together">' + out + "</svg>";
  }

  /* ==== chapter: a network =====================================================
     The lesson's own demo drawing (ART.scene "internet"), centred. State 0 is
     one computer; state 1 is two and the cable between them, uncovered as the
     second computer and then the cable are named, so what appears is the
     lesson's own drawing rather than a copy of it. */
  var NW_S = { x: 304, y: 20, w: 560, h: 385 };
  function nwX(v) { return NW_S.x + v * NW_S.w / 320; }
  function nwY(v) { return NW_S.y + v * NW_S.h / 220; }
  var NW_A = [nwX(60), nwY(71)], NW_B = [nwX(250), nwY(61)];

  function nwCard(state) { return ART.place(ART.scene("internet", state), NW_S.x, NW_S.y, NW_S.w, NW_S.h); }
  function nwReveal(state, id, clip, o) {
    if (!(o > 0)) return "";
    return el("clipPath", { id: id }, clip) + G(nwCard(state), { "clip-path": "url(#" + id + ")", opacity: clamp(o, 0, 1) });
  }

  function nwNetworkChapter(scene, beat, t, i) {
    var c = function (k, n) { return sc(scene, k, n); };
    var cComp = c(0, "comp"), cOwn = c(0, "own");
    var cCannot = c(1, "cannot"), cNowhere = c(1, "nowhere");
    var cJoin = c(2, "join"), cCable = c(2, "cable");
    var cSend = c(3, "send"), cPics = c(3, "pictures");
    var cJoined = c(4, "joined"), cNet = c(4, "network");

    /* the cable comes out first, and the joining is one movement: the lesson's
       own drawing (and its caption) changes from one computer to two together */
    var joinU = on(t, cJoin, 0.7), cabU = on(t, cJoin == null ? null : cJoin + 0.25, 0.7);
    var base = joinU >= 1 && cabU >= 1 ? 1 : 0;
    var out = "";

    out += R(NW_S.x - 12, NW_S.y - 12, NW_S.w + 24, NW_S.h + 24, 22, P.card, P.line, 2);
    out += nwCard(base);
    if (base === 0) {
      out += nwReveal(1, "nwClipB", C(NW_B[0], NW_B[1], 4 + 38 * joinU), joinU);
      out += nwReveal(1, "nwClipCable", R(nwX(52), nwY(44), (nwX(262) - nwX(52)) * cabU, nwY(88) - nwY(44)), cabU);
    }

    /* "one computer", "on its own" */
    var b1in = on(t, BEATS[scene.first + 1].start - GAP, 0.5);
    var ringO = on(t, cComp, 0.4) * (1 - b1in);
    if (ringO > 0) out += C(NW_A[0], NW_A[1], 46 + 5 * bump(t, cComp, 0.8), "none", P.gold, 5, { opacity: ringO });
    var ownO = on(t, cOwn, 0.5) * (1 - b1in);
    if (ownO > 0) out += C(NW_A[0], NW_A[1], 70, "none", P.muted, 3, { "stroke-dasharray": "9 9", opacity: ownO * 0.9 });

    /* "It cannot send anything anywhere": the envelope appears by the lone
       computer, on its own, and a cross lands on it - nothing leaves */
    var only1 = nwOnly(t, scene, 1);
    if (only1 > 0) {
      var mo = popIn(t, cCannot, 0.4);
      out += G(Em(NW_A[0] + 20, NW_A[1] - 86, 46, "✉️"),
        { transform: around(NW_A[0] + 20, NW_A[1] - 86, Math.min(1, mo)), opacity: Math.min(1, mo) * only1 });
      out += MK.cross(NW_A[0] + 20, NW_A[1] - 86, 30, popIn(t, cNowhere, 0.35) * only1);
    }

    /* "take a cable": a loose cable and its plug, beside the lone computer */
    var only2 = nwOnly(t, scene, 2);
    var loose = on(t, cCable, 0.45) * (1 - on(t, cJoin, 0.35)) * only2;
    if (loose > 0) {
      out += G(nwCable(NW_A[0] + 40, NW_A[1] + 12, NW_A[0] + 112, NW_A[1] - 12, 1, P.gold, 6) +
        Em(NW_A[0] + 132, NW_A[1] - 20, 40, "\u{1F50C}"), { opacity: loose });
      out += nwTag(t, 1010, 300, "a cable", cCable, [NW_A[0] + 132, NW_A[1] + 4], P.gold, 26);
    }
    /* "join it to another computer": the second computer and the cable, together */
    out += MK.ripple(NW_B[0], NW_B[1], t, cJoin, P.gold);

    /* "send each other messages and pictures": one each way, along the cable */
    var only3 = nwOnly(t, scene, 3);
    if (only3 > 0) {
      var p1 = nwAlong(t, cSend, 1.0, NW_A[0], NW_A[1] - 34, NW_B[0], NW_B[1] - 34, 42, "✉️", 26);
      var p2 = nwAlong(t, cPics, 1.0, NW_B[0], NW_B[1] + 40, NW_A[0], NW_A[1] + 40, 42, "\u{1F5BC}️", 26);
      out += nwFly(p1, only3, true) + nwFly(p2, only3, true);
      out += G(MK.ripple(NW_B[0], NW_B[1], t, cSend == null ? null : cSend + 0.95, P.gold) +
        MK.ripple(NW_A[0], NW_A[1], t, cPics == null ? null : cPics + 0.95, P.gold), { opacity: only3 });
    }

    /* "joined together": a bracket round the two; "a network": the word */
    var jo = on(t, cJoined, 0.5) * nwFrom(t, scene, 4);
    if (jo > 0) {
      out += MK.glow(NW_A[0], NW_A[1], 78, P.good, jo * (0.7 + 0.3 * breathe(t)));
      out += MK.glow(NW_B[0], NW_B[1], 78, P.good, jo * (0.7 + 0.3 * breathe(t + 0.5)));
      out += R(nwX(28), nwY(26), nwX(292) - nwX(28), nwY(104) - nwY(26), 26, "none", P.good, 4,
        { "stroke-dasharray": "14 10", opacity: jo });
    }
    out += nwTag(t, 1010, 176, "network", cNet, [nwX(292), nwY(65)], P.good, 34);
    return svg(out);
  }
